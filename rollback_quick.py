# -*- coding: utf-8 -*-
"""
按检查点回滚 — rollback_quick.py
用法：py -3.12 rollback_quick.py
      py -3.12 rollback_quick.py <标签名>   # 直接回滚到指定标签（无需交互）

从 checkpoints_manifest.json 读取所有检查点，
列出清单让用户选择，或通过命令行参数直接指定。
"""
import os, sys, shutil, json
from datetime import datetime
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

PROJECT_DIR = Path(__file__).parent
BACKUP_DIR  = PROJECT_DIR / "backups"
CHECKPOINT_MANIFEST = BACKUP_DIR / "checkpoints_manifest.json"


def load_manifest():
    if CHECKPOINT_MANIFEST.exists():
        with open(CHECKPOINT_MANIFEST, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def confirm(prompt: str) -> bool:
    r = input(f"  {prompt} (y/N): ").strip().lower()
    return r in ("y", "yes")


def restore_checkpoint(cp: dict, dry_run: bool = False):
    cp_dir = BACKUP_DIR / cp["dir"]
    restored, missing = [], []

    # 扫描检查点目录里所有文件
    for item in cp_dir.rglob("*"):
        if item.is_file() and item.name != "_signatures.json":
            rel = item.relative_to(cp_dir)
            dest = PROJECT_DIR / rel
            if dry_run:
                print(f"    {'[dry-run]'} {'恢复':>6} {rel}")
            else:
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(item, dest)
                print(f"    ✅ 恢复 {rel}")
            restored.append(str(rel))

    return restored


def main():
    manifest = load_manifest()

    if not manifest:
        print("\n[ERROR] 暂无检查点记录。")
        print("  请先运行: py -3.12 backup_quick.py")
        sys.exit(1)

    # --- 命令行参数：直接指定标签 ---
    if len(sys.argv) >= 2:
        target_tag = sys.argv[1]
        cp = next((c for c in manifest if c["tag"] == target_tag), None)
        if not cp:
            print(f"\n[ERROR] 未找到标签: {target_tag}")
            print("  可用标签:")
            for c in manifest[:10]:
                print(f"    - {c['tag']} ({c['timestamp']})")
            sys.exit(1)
        print(f"\n  目标: [{cp['tag']}]  {cp['timestamp']}")
        if not confirm("确认回滚？当前未提交的修改会丢失"):
            print("  已取消。")
            return
        restore_checkpoint(cp)
        print(f"\n  ✅ 回滚完成: [{cp['tag']}]")
        return

    # --- 交互模式 ---
    print("\n" + "=" * 55)
    print("  🔄 按检查点回滚")
    print("=" * 55)
    print(f"\n  {'序号':>4}  {'标签':<30} {'时间':>18}")
    print("  " + "-" * 54)

    for i, cp in enumerate(manifest[:20]):
        ts = cp["timestamp"]
        changed = cp.get("changed", [])
        note = f"{len(changed)}个文件变化" if changed else ""
        tag = cp["tag"]
        print(f"  {i+1:>4}  {tag:<30} {ts:>18}  {note}")

    if len(manifest) > 20:
        print(f"\n  （共 {len(manifest)} 个，仅显示前 20 条）")

    print("\n" + "  " + "-" * 54)
    print("  0  退出（不回滚任何内容）")
    print(f"\n{'=' * 55}\n")

    while True:
        try:
            sel = input("选择序号（0-退出）> ").strip()
            if sel == "0":
                print("  已取消。")
                return
            idx = int(sel) - 1
            cp = manifest[idx]
            break
        except (ValueError, IndexError):
            print(f"  无效输入，请输入 0-{min(20, len(manifest))} 之间的数字")

    print(f"\n  选中: [{cp['tag']}]  {cp['timestamp']}")
    if cp.get("changed"):
        print(f"  变化文件: {', '.join(cp['changed'][:5])}"
              + (" ..." if len(cp["changed"]) > 5 else ""))

    if not confirm("\n确认回滚？当前未提交的修改会丢失"):
        print("  已取消。")
        return

    print("\n  正在恢复文件...\n")
    restored = restore_checkpoint(cp)

    print(f"\n{'=' * 55}")
    print(f"  ✅ 回滚完成: [{cp['tag']}]")
    print(f"  已恢复: {len(restored)} 个文件")
    print(f"\n  建议: Ctrl+Shift+R 强制刷新浏览器")
    print(f"{'=' * 55}")


if __name__ == "__main__":
    main()
