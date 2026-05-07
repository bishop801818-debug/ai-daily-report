# -*- coding: utf-8 -*-
"""
命名检查点备份 — backup_quick.py
用法：py -3.12 backup_quick.py [检查点名称]

每次修改重要页面之前，运行一次并输入简短标签（如 index_v3改造、悬浮窗功能）。
同一标签多次使用会生成带序号的版本（v2/v3...）。

备份策略：
  • 每个检查点存为一个目录 backups/checkpoint_YYYYMMDD_HHMMSS_标签/
  • 永久保留，手动清理
  • 配合 rollback_quick.py 按检查点名称回滚
"""
import os, sys, shutil, hashlib, json
from datetime import datetime
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_DIR = Path(__file__).parent
BACKUP_DIR  = PROJECT_DIR / "backups"
CHECKPOINT_MANIFEST = BACKUP_DIR / "checkpoints_manifest.json"
BACKUP_DIR.mkdir(exist_ok=True)

# 需要备份的核心文件（相对路径）
CORE_FILES = [
    "index_v3.html",
    "dept-archive.html",
    "industry_news.html",
    "policy_center_v4.html",
    "lfp_data_v2.html",
    "carbonate_data_v2.html",
    "lfp_charts.html",
    "carbonate_charts.html",
    "lfp_report.html",
    "carbonate_analysis.html",
    "database_hub.html",
    "analysis_hub.html",
    "archive.html",
    "archive_v3.html",
    "generate_html_report.py",
    "md_to_json.py",
    "_do_backup.py",
]

SCRIPT_FILES = [
    "0-快速备份.bat",
    "1-先备份再修改.bat",
    "2-一键回滚.bat",
    "3-一键回滚.bat",
    "start_server_lan.bat",
    "backup_quick.py",
    "rollback_quick.py",
]


def file_md5(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def file_signature(path):
    """返回 (mtime, size, md5) 用于变化检测"""
    st = os.stat(path)
    return (int(st.st_mtime), st.st_size)


def load_manifest():
    if CHECKPOINT_MANIFEST.exists():
        with open(CHECKPOINT_MANIFEST, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_manifest(manifest):
    with open(CHECKPOINT_MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)


def get_last_checkpoint():
    manifest = load_manifest()
    return manifest[0] if manifest else None


def scan_current_signatures():
    sigs = {}
    for f in CORE_FILES + SCRIPT_FILES:
        fp = PROJECT_DIR / f
        if fp.exists():
            sigs[f] = file_signature(fp)
    return sigs


def diff_since_last(sigs_before, sigs_after):
    changed, added, removed = [], [], []
    all_keys = set(sigs_before) | set(sigs_after)
    for k in sorted(all_keys):
        b, a = sigs_before.get(k), sigs_after.get(k)
        if b and a:
            if b != a:
                changed.append(k)
        elif a and not b:
            added.append(k)
        else:
            removed.append(k)
    return changed, added, removed


def normalize_tag(raw: str) -> str:
    """标签规范化：只保留安全字符，限制长度"""
    import re
    tag = raw.strip()
    tag = re.sub(r'[\\/:*?"<>|]', '_', tag)
    tag = re.sub(r'_+', '_', tag).strip('_ ')
    return tag[:40]


def suggest_next_version(tag: str, existing: list) -> str:
    """如果同名检查点已存在，返回 v2/v3... 后缀"""
    base = tag
    counter = 2
    while any(c["tag"] == tag for c in existing):
        tag = f"{base}_v{counter}"
        counter += 1
    return tag


def main():
    args = sys.argv[1:]

    if args:
        tag = normalize_tag(args[0])
    else:
        print("\n" + "=" * 50)
        print("  📦 命名检查点备份")
        print("=" * 50)
        print("\n输入本次修改的标签，例如：")
        print("  index_v3改造  /  悬浮窗功能  /  弹窗样式修复")
        print("  （回车确认，或直接关闭窗口跳过）\n")
        tag = input("标签 > ").strip()
        if not tag:
            print("\n[跳过] 未输入标签，取消备份。")
            return
        tag = normalize_tag(tag)

    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    manifest = load_manifest()

    # 版本号处理
    tag = suggest_next_version(tag, manifest)
    checkpoint_dir = BACKUP_DIR / f"checkpoint_{stamp}_{tag}"
    checkpoint_dir.mkdir(exist_ok=True)

    # === 变化检测 ===
    last = get_last_checkpoint()
    sigs_before = {}
    if last:
        sig_file = BACKUP_DIR / last["dir"] / "_signatures.json"
        if sig_file.exists():
            with open(sig_file, "r", encoding="utf-8") as f:
                sigs_before = json.load(f)

    sigs_after = scan_current_signatures()
    changed, added, removed = diff_since_last(sigs_before, sigs_after)

    # === 变化摘要（打印给用户看） ===
    print("\n  变化摘要（与上次检查点对比）:")
    if not last:
        print("    [首次检查点，无历史数据]")
    elif not changed and not added and not removed:
        print("    无变化（所有文件与上次检查点一致）")
    else:
        if changed:
            for f in changed:
                print(f"    ✏️  {f}")
        if added:
            for f in added:
                print(f"    ➕ {f}")
        if removed:
            for f in removed:
                print(f"    ➖ {f}")

    # === 执行备份 ===
    backed_up = []
    skipped = []

    for f in CORE_FILES + SCRIPT_FILES:
        src = PROJECT_DIR / f
        if src.exists():
            dest = checkpoint_dir / f
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)
            backed_up.append(f)
        else:
            skipped.append(f)

    # 保存签名快照
    sig_out = checkpoint_dir / "_signatures.json"
    with open(sig_out, "w", encoding="utf-8") as f:
        json.dump(sigs_after, f, ensure_ascii=False, indent=2)

    # 记录 manifest
    entry = {
        "tag":       tag,
        "dir":       checkpoint_dir.name,
        "timestamp": stamp,
        "files":     backed_up,
        "changed":   changed,
        "added":     added,
        "removed":   removed,
        "note":      " ".join(sys.argv[1:]) if len(sys.argv) > 1 else tag,
    }
    manifest.insert(0, entry)
    save_manifest(manifest)

    # === Git commit（如果已有 git 仓库）===
    git_msg = f"checkpoint: {tag} ({stamp})"
    try:
        import subprocess
        subprocess.run(["git", "add", "-A"], cwd=str(PROJECT_DIR),
                       capture_output=True, text=True)
        r = subprocess.run(["git", "commit", "-m", git_msg],
                           cwd=str(PROJECT_DIR),
                           capture_output=True, text=True)
        if r.returncode == 0:
            git_note = "  ✅ Git commit 已创建"
        else:
            git_note = f"  ⚠️  Git commit 失败: {r.stderr.strip()}"
    except Exception:
        git_note = "  ⚠️  Git 未初始化"

    # === 完成 ===
    print(f"\n{'=' * 50}")
    print(f"  ✅ 检查点已创建  [{tag}]")
    print(f"{'=' * 50}")
    print(f"  时间戳: {stamp}")
    print(f"  备份目录: {checkpoint_dir}")
    print(f"  备份文件: {len(backed_up)} 个")
    if skipped:
        print(f"  跳过（不存在）: {', '.join(skipped)}")
    print(git_note)
    print(f"\n  回滚命令: py -3.12 rollback_quick.py")
    print(f"{'=' * 50}")


if __name__ == "__main__":
    main()
