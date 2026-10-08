#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/lark_preflight.py
================================================================================
lark-cli 用户身份探活 — 早报自动化前的「第一道闸门」(2026-10-08 立)

【硬规则背景】
- lark-cli 的 user_access_token 在长时间无调用后会过期（refresh_token 通常 14~30 天）
- 国庆/春节长假后第一个工作日，自动化任务常因 token 过期而失败
- 旧方案：让 download 脚本自己尝试，发现失败后报错 → 已推送陈旧数据风险
- 新方案：自动化第一步先探活，token 无效 → 立即退出 + 明确指引，不进入后续步骤

【使用方式】
方式 1（独立调用）：
    python tools/lark_preflight.py
    返回 0 = ready, 1 = missing, 2 = error

方式 2（在 Python 中 import）：
    from tools.lark_preflight import preflight_check, Preflight
    ok, info = preflight_check()
    if not ok:
        sys.exit(1)

方式 3（在 .sh / .bat 中）：
    python tools/lark_preflight.py || exit 1

【输出格式】
JSON-friendly 文本，便于 log 解析：
    [OK] lark-cli user status: ready
    [WARN] lark-cli user status: missing — 需要重新扫码授权
        hint: python tools/lark_reauth.py
    [ERR] lark-cli 调用失败 — 详见上方 stderr
================================================================================
"""

import subprocess
import json
import sys
import shutil
from pathlib import Path
from typing import Tuple, Optional

# ---- 路径常量 ----
TOOLS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = TOOLS_DIR.parent
LARK_CLI_PATH = "C:/Users/1/.workbuddy/binaries/node/cli-connector-packages/lark-cli"

# ---- 退出码 ----
EXIT_READY = 0      # user.status = ready
EXIT_MISSING = 1    # user.status = missing（需要重新授权）
EXIT_ERROR = 2      # lark-cli 调用失败（网络/CWD/路径问题）
EXIT_BOT_ONLY = 3   # 只有 bot 身份（业务上不能读取 user folder）


def _find_bash() -> Optional[str]:
    """查找可用的 bash 可执行文件（Windows 下 lark-cli 是 bash 脚本）"""
    candidates = [
        "C:/Program Files/Git/bin/bash.exe",
        "C:/Program Files/Git/usr/bin/bash.exe",
        "C:/Users/1/.workbuddy/binaries/PortableGit/versions/1.2.0/bin/bash.exe",
        "C:/Users/1/.workbuddy/binaries/PortableGit/versions/1.2.0/usr/bin/bash.exe",
        shutil.which("bash"),
    ]
    for cand in candidates:
        if cand and Path(cand).exists():
            return cand
    return None


def _run_auth_status() -> Tuple[int, str, str]:
    """调用 lark-cli auth status，返回 (returncode, stdout, stderr)
    关键：lark-cli 是 bash 脚本（#!/bin/sh），必须用 bash 调用，不能直接 subprocess.run
    """
    bash = _find_bash()
    if bash is None:
        return 127, "", "未找到 bash 可执行文件（lark-cli 是 bash 脚本，需要 bash 调用）"

    proc = subprocess.run(
        [bash, LARK_CLI_PATH, "auth", "status"],
        capture_output=True, text=True, timeout=30, encoding="utf-8"
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def preflight_check() -> Tuple[bool, dict]:
    """
    探活 lark-cli 用户身份。
    返回: (is_ready, info_dict)
      - is_ready = True 表示 user.status = "ready"
      - info = {"status": "...", "user_open_id": "...", "user_name": "...", "scope_count": N}
    """
    rc, stdout, stderr = _run_auth_status()

    if rc != 0:
        return False, {
            "status": "call_failed",
            "returncode": rc,
            "stdout": stdout[:500],
            "stderr": stderr[:500],
            "hint": "lark-cli 调用失败，可能是路径错或 Windows 兼容问题"
        }

    try:
        data = json.loads(stdout)
    except json.JSONDecodeError as e:
        return False, {
            "status": "parse_failed",
            "error": str(e),
            "stdout": stdout[:500],
            "hint": "lark-cli 输出非 JSON 格式，可能版本不兼容"
        }

    identities = data.get("identities", {})
    user_info = identities.get("user", {})

    user_status = user_info.get("status", "unknown")
    is_ready = user_status == "ready"
    info = {
        "status": user_status,
        "available": user_info.get("available", False),
        "open_id": user_info.get("openId", ""),
        "user_name": user_info.get("userName", ""),
        "hint": user_info.get("hint", ""),
        "app_id": data.get("appId", ""),
        "brand": data.get("brand", ""),
        "note": data.get("note", ""),
    }

    return is_ready, info


def print_result(is_ready: bool, info: dict) -> None:
    """格式化打印探活结果"""
    if info.get("status") == "call_failed":
        print(f"[ERR] lark-cli auth status 调用失败 (rc={info.get('returncode')})")
        if info.get("stderr"):
            print(f"  stderr: {info['stderr']}")
        return

    if info.get("status") == "parse_failed":
        print(f"[ERR] lark-cli 输出解析失败: {info.get('error')}")
        print(f"  stdout: {info.get('stdout')}")
        return

    user_status = info.get("status", "?")
    user_name = info.get("user_name", "?")
    open_id = info.get("open_id", "?")

    if user_status == "ready":
        print(f"[OK] lark-cli user status: ready")
        print(f"     用户: {user_name} ({open_id})")
        print(f"     app_id: {info.get('app_id', '?')}")
    elif user_status == "missing":
        print(f"[WARN] lark-cli user status: missing")
        print(f"     需要重新扫码授权")
        print(f"     缺失用户 open_id: {open_id}")
        print(f"     修复命令: python tools/lark_reauth.py")
        if info.get("hint"):
            print(f"     hint: {info['hint']}")
    else:
        print(f"[WARN] lark-cli user status: {user_status}")
        print(f"     未知状态，请人工确认")
        if info.get("hint"):
            print(f"     hint: {info['hint']}")

    if info.get("note"):
        print(f"     note: {info['note']}")


def main() -> int:
    """主入口 — 探活后返回退出码"""
    print("=" * 70)
    print("lark-cli 用户身份探活 (preflight check)")
    print("=" * 70)

    is_ready, info = preflight_check()
    print_result(is_ready, info)

    print()
    if is_ready:
        print("[OK] 探活通过 — 可以继续执行早报自动化")
        return EXIT_READY

    user_status = info.get("status", "")
    if user_status == "missing":
        print("[STOP] 探活失败 — 中止后续步骤（避免推送陈旧/错误数据）")
        return EXIT_MISSING

    if info.get("status") in ("call_failed", "parse_failed"):
        print("[STOP] lark-cli 调用异常 — 请检查路径 / 网络 / 兼容性")
        return EXIT_ERROR

    print(f"[STOP] 未知 user 状态 '{user_status}' — 出于谨慎中止后续步骤")
    return EXIT_ERROR


if __name__ == "__main__":
    sys.exit(main())