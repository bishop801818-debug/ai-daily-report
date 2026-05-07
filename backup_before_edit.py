# -*- coding: utf-8 -*-
"""
自动前置备份触发器 — backup_before_edit.py
在你开始重大修改之前，检测是否已有今日备份，
没有则自动创建一个带时间戳的检查点。

用法：
  py -3.12 backup_before_edit.py              # 自动（自动判断）
  py -3.12 backup_before_edit.py --force       # 强制新建检查点
  py -3.12 backup_before_edit.py --check        # 仅检查，不备份

由我（AI助手）在开始重大修改前自动调用，
你也可以在每次动手前手动运行。
"""
import os, sys, json, hashlib
from datetime import datetime, date
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_DIR  = Path(__file__).parent
BACKUP_DIR   = PROJECT_DIR / "backups"
MANIFEST     = BACKUP_DIR / "checkpoints_manifest.json"
SENTINEL     = BACKUP_DIR / "_today_backup_done.json"
CHECKPOINT_FILE = BACKUP_DIR / "checkpoints_manifest.json"

# 高风险文件列表（修改这些前应确保有备份）
HIGH_RISK_FILES = [
    "index_v3.html",
    "dept-archive.html",
    "industry_news.html",
    "policy_center_v4.html",
    "generate_html_report.py",
    "md_to_json.py",
]


def file_sig(p: Path):
    st = os.stat(p)
    return f"{int(st.st_mtime)}|{st.st_size}"


def current_file_sigs():
    sigs = {}
    for f in HIGH_RISK_FILES:
        fp = PROJECT_DIR / f
        if fp.exists():
            sigs[f] = file_sig(fp)
    return sigs


def get_last_checkpoint():
    if not MANIFEST.exists():
        return None
    with open(MANIFEST, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data[0] if data else None


def has_today_backup():
    """检查今日是否已有有效备份"""
    last = get_last_checkpoint()
    if not last:
        return False
    ts = last.get("timestamp", "")
    today = date.today().strftime("%Y%m%d")
    return ts.startswith(today)


def auto_tag():
    """根据当前文件状态生成自动标签"""
    sigs = current_file_sigs()
    h = hashlib.md5()
    for k in sorted(sigs):
        h.update(f"{k}:{sigs[k]}".encode())
    short = h.hexdigest()[:8]
    return f"auto_{short}"


def ensure_backup(force=False):
    if has_today_backup() and not force:
        last = get_last_checkpoint()
        print(f"\n✅ 今日已有检查点: [{last['tag']}] ({last['timestamp']})")
        print("   无需重复备份。继续修改。")
        return False

    # 触发 backup_quick.py
    import subprocess
    tag = auto_tag()
    print(f"\n📦 开始备份: {tag}")
    r = subprocess.run(
        [sys.executable, str(PROJECT_DIR / "backup_quick.py"), tag],
        cwd=str(PROJECT_DIR)
    )
    return r.returncode == 0


def main():
    force = "--force" in sys.argv
    check_only = "--check" in sys.argv

    print("=" * 50)
    print("  🛡️  前置备份检查")
    print("=" * 50)

    last = get_last_checkpoint()
    if last:
        print(f"\n  上次检查点: [{last['tag']}] ({last['timestamp']})")
        print(f"  变化文件: {', '.join(last.get('changed', [])[:5]) or '无'}")
    else:
        print("\n  尚无任何检查点。")

    if check_only:
        print(f"\n  {'✅ 今日已备份' if has_today_backup() else '⚠️  今日未备份'}")
        return

    print()
    ensure_backup(force=force)


if __name__ == "__main__":
    main()
