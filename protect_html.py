#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HTML 轻量化保护脚本
在每次 git commit 前自动运行，确保所有 HTML 文件都是轻量化的（无内联大脚本）

用法（在 git 钩子中自动调用，也可手动运行）：
  python protect_html.py
"""

import os
import sys
import subprocess

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OPTIMIZE_PY = os.path.join(BASE_DIR, "optimize_html.py")

# 需要保护的 HTML 文件列表
PROTECTED_HTMLS = [
    "index_v3.html",
    "embedded/index_v3.html",
    "index.html",
    "embedded/index.html",
]

def main():
    print("[protect_html] 检查 HTML 轻量化状态...")
    any_changed = False

    for rel_path in PROTECTED_HTMLS:
        html_path = os.path.join(BASE_DIR, rel_path)
        if not os.path.exists(html_path):
            continue

        # 检查是否有内联大脚本（>10KB 的 script 标签且无 src=）
        with open(html_path, "r", encoding="utf-8") as f:
            content = f.read()

        import re
        inline_scripts = re.findall(r'<script\b([^>]*)>(.*?)</script>', content, re.DOTALL)
        large_inline = []
        for i, (attrs, body) in enumerate(inline_scripts):
            if 'src=' not in attrs and len(body.strip()) > 10240:
                large_inline.append((i, len(body)))

        if large_inline:
            print(f"  ⚠️  {rel_path} 有 {len(large_inline)} 个内联大脚本，正在优化...")
            result = subprocess.run(
                f'python "{OPTIMIZE_PY}" "{html_path}"',
                shell=True, capture_output=True, text=True,
                encoding='utf-8', errors='replace'
            )
            if result.returncode == 0:
                print(f"  ✅ {rel_path} 已优化")
                any_changed = True
            else:
                print(f"  ❌ {rel_path} 优化失败: {result.stderr[:200]}")
        else:
            print(f"  ✅ {rel_path} 已是轻量化")

    if any_changed:
        print("\n[protect_html] 有文件被优化，请重新 git add 后 commit")
        sys.exit(1)  # 退出码 1 让 pre-commit hook 停止，提示用户重新 add
    else:
        print("\n[protect_html] 所有 HTML 文件已是轻量化，可以继续 commit")
        sys.exit(0)

if __name__ == "__main__":
    main()
