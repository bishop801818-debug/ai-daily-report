#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
根目录文件完整性检查脚本
读取 _docs/root-files-manifest.json，对照清单检查根目录文件是否齐全。
缺失的文件自动从存档目录恢复。
用法：python verify_root_files.py [--fix]
"""
import sys, json, os, shutil
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = Path(__file__).parent.parent.resolve()
MANIFEST = Path(__file__).parent / "root-files-manifest.json"
ARCHIVE_HTML = BASE / "_archive" / "html"
ARCHIVE_VERSIONS = BASE / "_archive" / "versions"
ARCHIVE_SERVER = BASE / "_archive" / "server"

# 可能的存档路径
ARCHIVE_DIRS = [
    ARCHIVE_HTML,
    ARCHIVE_VERSIONS,
    BASE / "_archive",
    BASE,
]


def extract_html_version(filepath):
    """从HTML文件中提取HTML_VERSION版本号，返回字符串供比较"""
    try:
        content = filepath.read_text(encoding="utf-8", errors="replace")
        import re
        m = re.search(r"window\.HTML_VERSION\s*=\s*['\"]([^'\"]+)['\"]", content)
        if m:
            return m.group(1)
    except Exception:
        pass
    return None


def find_in_archives(filename):
    """从存档目录中搜索同名文件，返回最新版本"""
    candidates = []
    for ad in ARCHIVE_DIRS:
        if not ad.exists():
            continue
        # 精确匹配
        p = ad / filename
        if p.exists():
            candidates.append(p)
        # 通配搜索（同名文件可能在子目录）
        for match in ad.rglob(filename):
            if match.is_file() and match not in candidates:
                candidates.append(match)

    if not candidates:
        return None

    if len(candidates) == 1:
        return candidates[0]

    # 多个匹配时，优先选 HTML_VERSION 最新的
    best = candidates[0]
    best_ver = extract_html_version(best) or "00000000_0000"
    best_time = best.stat().st_mtime

    for c in candidates[1:]:
        ver = extract_html_version(c)
        if ver:
            # 有版本号 → 比较版本号（越大越新）
            if ver > best_ver:
                best = c
                best_ver = ver
        else:
            # 无版本号 → 用文件修改时间
            if c.stat().st_mtime > best_time:
                best = c
                best_ver = "fallback_mtime"

    return best


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--fix", action="store_true", help="自动修复：缺失文件从存档恢复")
    args = parser.parse_args()

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    files = manifest["files"]

    print("=" * 60)
    print("根目录文件完整性检查")
    print(f"清单文件: {MANIFEST.name}")
    print(f"检查文件数: {len(files)}")
    print("=" * 60)

    missing = []
    ok = []

    for item in files:
        path = item["path"]
        reason = item["reason"]
        fp = BASE / path
        if fp.exists():
            ok.append(path)
            print(f"  ✅ {path}")
        else:
            missing.append(item)
            src = find_in_archives(path)
            if src:
                print(f"  ❌ {path}  ← 存档中有 (来源: {src.relative_to(BASE)})")
            else:
                print(f"  ❌ {path}  ← 存档中未找到!")

    print()
    print(f"齐全: {len(ok)} / {len(files)}")
    print(f"缺失: {len(missing)}")

    if not missing:
        print("\n  所有文件完好，无须操作。")
        return

    if not args.fix:
        print(f"\n  运行 python verify_root_files.py --fix 自动从存档恢复缺失文件。")
        return

    print("\n  开始修复...")
    restored = []
    notfound = []

    for item in missing:
        path = item["path"]
        reason = item["reason"]
        fp = BASE / path
        src = find_in_archives(path)
        if src:
            shutil.copy2(src, fp)
            restored.append(path)
            print(f"  ✅ 已恢复: {path}")
        else:
            notfound.append(path)
            print(f"  ⚠️  未找到存档源: {path}")

    print()
    if restored:
        print(f"  已恢复 {len(restored)} 个文件:")
        for p in restored:
            print(f"    - {p}")
    if notfound:
        print(f"  ⚠️  存档中未找到 {len(notfound)} 个文件:")
        for p in notfound:
            print(f"    - {p}")
        print(f"  请手动补充这些文件。")


if __name__ == "__main__":
    main()
