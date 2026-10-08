#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/lark_reauth.py
================================================================================
lark-cli 用户身份重授权（手动触发）— 用于修复 token 过期场景 (2026-10-08 立)

【触发场景】
- 自动化前 lark_preflight.py 探测 user.status = missing
- 用户收到提示后运行此脚本

【使用方式】
    python tools/lark_reauth.py

【流程（硬规则：每步执行后不再生成新 QR）】
1. lark-cli auth login --no-wait --json        申请 device_code（生成一次后即阻塞轮询，禁止再次申请）
2. lark-cli auth qrcode <URL> --output qr.png  生成 QR 码 PNG
3. 用户扫描 QR → 飞书 APP 确认授权
4. lark-cli auth login --device-code <code>    轮询等待用户授权（最长 10 分钟）

【关键约束 — 来自 2026-10-08 实踩坑】
- 每次 --no-wait 都会作废旧 device_code（飞书强制旧码失效）
- 一旦生成 QR，绝不能再调用 --no-wait 生成新 QR —— 否则用户扫的旧码作废，浪费一次授权
- 整个流程只生成 1 张 QR，扫码 → 确认 → 轮询，三步串行

【产出】
- QR PNG: ./feishu_login_qr.png（与根目录同级别）
- 授权完成后 token 自动写入 lark-cli 本地 keychain
- 退出码 0 = 授权成功, 2 = 用户取消, 3 = 网络/lark-cli 异常
"""

import subprocess
import json
import sys
import shutil
from pathlib import Path

# ---- 路径常量 ----
TOOLS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = TOOLS_DIR.parent
LARK_CLI_PATH = "C:/Users/1/.workbuddy/binaries/node/cli-connector-packages/lark-cli"
QR_OUTPUT = PROJECT_ROOT / "feishu_login_qr.png"

# ---- 必需 scope（覆盖早报所需的全部能力） ----
REQUIRED_SCOPES = "space:document:retrieve,drive:file:download"


def _find_bash() -> str:
    """查找 bash 可执行文件（lark-cli 是 bash 脚本）"""
    candidates = [
        "C:/Program Files/Git/bin/bash.exe",
        "C:/Users/1/.workbuddy/binaries/PortableGit/versions/1.2.0/bin/bash.exe",
        shutil.which("bash"),
    ]
    for cand in candidates:
        if cand and Path(cand).exists():
            return cand
    raise RuntimeError("未找到 bash — 无法调用 lark-cli（它是 bash 脚本）")


def _run_lark(args: list, timeout: int = 30, capture: bool = True):
    """统一封装：bash 调用 lark-cli"""
    bash = _find_bash()
    proc = subprocess.run(
        [bash, LARK_CLI_PATH] + args,
        capture_output=capture, timeout=timeout, encoding="utf-8"
    )
    return proc.returncode, (proc.stdout or "").strip(), (proc.stderr or "").strip()


def step1_get_device_code() -> dict:
    """Step 1: 申请 device_code（只调用一次！）"""
    print("[Step 1/4] 申请 device_code ...")
    rc, stdout, stderr = _run_lark(
        ["auth", "login", "--no-wait", "--json", "--scope", REQUIRED_SCOPES],
        timeout=30
    )

    if rc != 0:
        print(f"[ERR] 申请 device_code 失败 (rc={rc})")
        print(f"  stderr: {stderr[:300]}")
        sys.exit(3)

    try:
        data = json.loads(stdout)
    except json.JSONDecodeError as e:
        print(f"[ERR] 解析 lark-cli 输出失败: {e}")
        print(f"  stdout: {stdout[:300]}")
        sys.exit(3)

    if "device_code" not in data:
        print(f"[ERR] lark-cli 输出无 device_code 字段")
        print(f"  完整输出: {data}")
        sys.exit(3)

    print(f"  ✅ device_code 已获取")
    print(f"     verification_url: {data['verification_url']}")
    print(f"     user_code: {data.get('user_code', '?')}")
    print(f"     expires_in: {data.get('expires_in', 600)}s")
    return data


def step2_generate_qrcode(verification_url: str) -> bool:
    """Step 2: 生成 QR 码 PNG"""
    print("[Step 2/4] 生成 QR 码 PNG ...")
    rc, stdout, stderr = _run_lark(
        ["auth", "qrcode", verification_url, "--output", str(QR_OUTPUT), "--size", "360"],
        timeout=30
    )

    if rc != 0:
        print(f"[ERR] QR 码生成失败 (rc={rc})")
        print(f"  stderr: {stderr[:300]}")
        return False

    if not QR_OUTPUT.exists():
        print(f"[ERR] QR 码文件未生成: {QR_OUTPUT}")
        return False

    print(f"  ✅ QR 码已生成: {QR_OUTPUT}")
    print(f"     请用手机飞书 APP 扫码")
    return True


def step3_display_qr_and_wait() -> None:
    """Step 3: 提示用户扫码（不做实际等待）"""
    print()
    print("=" * 70)
    print("📱 请用手机飞书 APP 扫一扫上方二维码")
    print("=" * 70)
    print("操作步骤：")
    print("  1. 打开手机飞书 APP")
    print("  2. 右上角\"+\" → \"扫一扫\"")
    print(f"  3. 扫描二维码文件：{QR_OUTPUT}")
    print("    （或打开后用手机相册识别图片）")
    print("  4. 飞书弹窗中点\"确认授权\"")
    print("  5. 等待本脚本自动检测授权完成（最长 10 分钟）")
    print()
    print("⚠️ 硬规则：扫码后请勿关闭本脚本进程，也不要再次运行本脚本")
    print("=" * 70)
    print()


def step4_poll_device_code(device_code: str) -> int:
    """Step 4: 轮询 device_code 等待用户完成授权"""
    print("[Step 4/4] 轮询等待用户授权 ...")
    print("  （最多等待 10 分钟）")
    rc, stdout, stderr = _run_lark(
        ["auth", "login", "--device-code", device_code],
        timeout=600
    )

    output = stdout + stderr
    print()
    print("=" * 70)
    if "登录成功" in output or "已收到授权" in output:
        print("[OK] 授权成功！新 token 已写入 lark-cli 本地 keychain")
        print("=" * 50)
        print("后续步骤：")
        print("  - 现在可以重新触发早报自动化任务")
        print("  - 下次长假前建议运行：python tools/lark_pre_holiday_reauth.py")
        return 0
    else:
        print(f"[ERR] 授权未完成 (rc={rc})")
        print(f"  输出: {output[:500]}")
        return 2


def main() -> int:
    print()
    print("=" * 70)
    print("lark-cli 用户身份重授权工具")
    print("=" * 70)
    print(f"lark-cli 路径: {LARK_CLI_PATH}")
    print(f"必需 scope: {REQUIRED_SCOPES}")
    print()

    # Step 1: 拿 device_code
    code_data = step1_get_device_code()
    device_code = code_data["device_code"]
    verification_url = code_data["verification_url"]

    # Step 2: 生成 QR 码
    if not step2_generate_qrcode(verification_url):
        sys.exit(3)

    # Step 3: 提示用户扫码
    step3_display_qr_and_wait()

    # Step 4: 轮询
    return step4_poll_device_code(device_code)


if __name__ == "__main__":
    sys.exit(main())