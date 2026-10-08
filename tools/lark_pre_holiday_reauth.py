#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tools/lark_pre_holiday_reauth.py
================================================================================
长假前主动探测 lark-cli 用户身份 — 把"假期后强制重授权"变成"假期前提醒" (2026-10-08 立)

【核心思路】
- 飞书 refresh_token 通常 14~30 天有效，但调用稀疏时容易"到期即作废"
- 长假（国庆 7 天 / 春节 7 天）期间无 token 续期操作 → 假期后第一次自动化必失败
- 主动方案：长假前 1 天自动探测 token 状态
  - ready → ✅ log "OK"，不需要任何操作
  - missing → ⚠️ 主动生成 QR 码 + 提醒用户必须立即完成授权

【触发时机】
- 国庆长假前 = 9-30（若 9-30 是工作日）
- 春节长假前 = 农历除夕前一天
- 五一长假前 = 4-30（若 4-30 是工作日）
- 任意长假/小长假前 1 天

【使用方式】
方式 1（手动触发）：
    python tools/lark_pre_holiday_reauth.py

方式 2（与节假日名单配合）：
    python tools/lark_pre_holiday_reauth.py --always   # 跳过日期判断，总是执行

方式 3（自动化任务）：
    在飞书日历 / WorkBuddy 自动化中配置：
    - 国庆前 1 天 = 9-30 09:00 触发
    - 春节前 1 天 = 农历除夕前 1 天 09:00 触发

【退出码】
- 0 = token 有效（无需操作）
- 1 = token 过期，需要用户重授权
- 2 = 跳过执行（非长假前 1 天 / 非工作日）
================================================================================
"""

import subprocess
import json
import sys
import shutil
import argparse
from pathlib import Path
from datetime import datetime, timedelta

TOOLS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = TOOLS_DIR.parent

# ---- 中国法定长假日历（2024-2027） ----
# 格式：YYYY-MM-DD 是「长假前 1 天」（触发日）
HOLIDAY_PRE_DAYS = [
    # 2024
    "2024-04-30",  # 五一前 1 天
    "2024-09-14",  # 中秋前 1 天（与国庆接得相对）
    # 2025
    "2025-04-30",  # 五一前 1 天
    "2025-09-30",  # 国庆前 1 天（10-01 ~ 10-08 放假）
    # 2026
    "2026-04-30",  # 五一前 1 天
    "2026-09-30",  # 国庆前 1 天（10-01 ~ 10-08 放假）
    # 2027
    "2027-04-30",  # 五一前 1 天
    "2027-10-07",  # 国庆前 1 天（10-08 之后调休，需校准）
]

# 春节日期特殊处理（农历），手动列出前 1 天
SPRING_FESTIVAL_PRE_DAYS = [
    "2024-02-07",  # 2024 春节前 1 天
    "2025-01-27",  # 2025 春节前 1 天（农历除夕是 1-28）
    "2026-02-15",  # 2026 春节前 1 天（农历除夕是 2-16）
    "2027-02-05",  # 2027 春节前 1 天（农历除夕是 2-06）
]

# 合并
HOLIDAY_PRE_DAYS = sorted(set(HOLIDAY_PRE_DAYS + SPRING_FESTIVAL_PRE_DAYS))


def is_pre_holiday_day(date_str: str = None) -> bool:
    """判断给定日期（或今天）是否是某个长假的前 1 天"""
    if date_str is None:
        date_str = datetime.now().strftime("%Y-%m-%d")
    return date_str in HOLIDAY_PRE_DAYS


def check_auth_status() -> dict:
    """检查 lark-cli auth status（复用 lark_preflight 的逻辑）"""
    LARK_CLI_PATH = "C:/Users/1/.workbuddy/binaries/node/cli-connector-packages/lark-cli"

    # lark-cli 是 bash 脚本，必须用 bash 调用
    bash_candidates = [
        "C:/Program Files/Git/bin/bash.exe",
        "C:/Users/1/.workbuddy/binaries/PortableGit/versions/1.2.0/bin/bash.exe",
        shutil.which("bash"),
    ]
    bash = next((b for b in bash_candidates if b and Path(b).exists()), None)
    if bash is None:
        return {"status": "bash_not_found"}

    proc = subprocess.run(
        [bash, LARK_CLI_PATH, "auth", "status"],
        capture_output=True, text=True, timeout=30, encoding="utf-8"
    )

    if proc.returncode != 0:
        return {"status": "call_failed", "rc": proc.returncode}

    try:
        data = json.loads(proc.stdout.strip())
        user_info = data.get("identities", {}).get("user", {})
        return {
            "status": user_info.get("status", "unknown"),
            "available": user_info.get("available", False),
            "user_name": user_info.get("userName", ""),
            "open_id": user_info.get("openId", ""),
            "note": data.get("note", ""),
        }
    except json.JSONDecodeError:
        return {"status": "parse_failed"}


def should_run_on(date_str: str = None) -> tuple[bool, str]:
    """判断今天是否应该执行"""
    today = datetime.now() if date_str is None else datetime.strptime(date_str, "%Y-%m-%d")

    # 周末不算"长假前最后工作日"
    if today.weekday() >= 5:  # 5=Saturday, 6=Sunday
        return False, f"今天 ({today.strftime('%Y-%m-%d %A')}) 是周末，跳过"

    if is_pre_holiday_day(date_str):
        return True, f"今天是 {today.strftime('%Y-%m-%d %A')}，是某个长假前最后工作日"

    return False, f"今天 ({today.strftime('%Y-%m-%d %A')}) 不是长假前最后工作日，跳过"


def main() -> int:
    parser = argparse.ArgumentParser(description="长假前主动探测 lark-cli 身份")
    parser.add_argument("--always", action="store_true",
                        help="跳过日期判断，总是执行探测")
    parser.add_argument("--date", type=str, default=None,
                        help="指定要判断的日期（默认今天）")
    parser.add_argument("--trigger-reauth", action="store_true",
                        help="如果 token 失效，立即调用 lark_reauth.py（需要用户在场）")
    args = parser.parse_args()

    today_str = args.date or datetime.now().strftime("%Y-%m-%d")

    print("=" * 70)
    print(f"长假前 lark-cli 身份探测 ({today_str})")
    print("=" * 70)

    # Step 1: 判断是否应该运行
    if not args.always:
        should, reason = should_run_on(today_str)
        print(f"[判断] {reason}")
        if not should:
            print("[SKIP] 不触发探测（可用 --always 强制）")
            return 2
    else:
        print(f"[强制] --always 模式，跳过日期判断")

    # Step 2: 探测 auth status
    print()
    print("[探测] 正在查询 lark-cli auth status ...")
    info = check_auth_status()
    status = info.get("status", "unknown")

    if status == "ready":
        print(f"[OK] lark-cli user.status = ready ✅")
        print(f"     用户: {info.get('user_name', '?')} ({info.get('open_id', '?')})")
        print(f"     长假期间无需任何操作，refresh_token 在 14-30 天内有效")
        print(f"     预计覆盖整个长假")
        return 0

    elif status == "missing":
        print(f"[WARN] lark-cli user.status = missing ⚠️")
        print(f"     refresh_token 已过期，必须在长假前完成重授权")
        print(f"     否则长假后第一次自动化任务必失败")
        print()
        print(f"[修复命令]")
        print(f"     python tools/lark_reauth.py")
        print()
        print(f"[紧急修复（如本脚本具备 UI 接管能力）]")
        if args.trigger_reauth:
            print(f"     --trigger-reauth 模式：调用 lark_reauth.py ...")
            reauth_proc = subprocess.run(
                [sys.executable, str(PROJECT_ROOT / "tools" / "lark_reauth.py")],
                cwd=str(PROJECT_ROOT)
            )
            return reauth_proc.returncode
        else:
            print(f"     （可用 --force-reauth 自动调用）")
        return 1

    elif status == "call_failed":
        print(f"[ERR] lark-cli auth status 调用失败 (rc={info.get('rc')})")
        print(f"     请检查 lark-cli 路径 / Windows 兼容性")
        return 3

    else:
        print(f"[WARN] lark-cli user.status = {status}（未知状态）")
        print(f"     建议人工检查 lark-cli 配置")
        return 3


if __name__ == "__main__":
    sys.exit(main())