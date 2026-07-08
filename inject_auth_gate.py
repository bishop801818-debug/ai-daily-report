#!/usr/bin/env python3
"""
inject_auth_gate.py — 权限闸门注入脚本
------------------------------------------------------------------
对"两个妙搭发布脚本 FILES 清单"里的全部 HTML，在 feishu-jsapi.js 引用
之前插入 <script src="auth_policy.js">、之后插入 <script src="inline_auth.js">。

- 幂等：已注入则跳过（不会重复插入）。
- 只改源码 HTML（index_v3.html 及子页面）；发布脚本会把它们复制到 dist，
  从而自动进入两个妙搭应用。
- auth_policy.js 必须在 inline_auth.js 之前（后者依赖前者的全局配置）。

用法：python inject_auth_gate.py
"""
import os, re, sys

BASE = os.path.dirname(os.path.abspath(__file__))

PUBLISH_SCRIPTS = [
    "auto_miaoda_daily_test.py",  # 直传版（app_179kjgvrq6g）
    "auto_miaoda_daily.py",       # 生产版（app_4k7069448fj88）
]

# 锚点：所有 HTML 都有的 </head>。auth_policy.js 必须在 inline_auth.js 之前。
HEAD_ANCHOR = '</head>'
INJECT_BLOCK = '    <script src="auth_policy.js"></script>\n' \
               '    <script src="inline_auth.js"></script>\n'


def collect_html_files():
    html_set = set()
    for script in PUBLISH_SCRIPTS:
        path = os.path.join(BASE, script)
        if not os.path.exists(path):
            print(f"  ⚠ 发布脚本不存在，跳过: {script}")
            continue
        with open(path, encoding="utf-8") as f:
            src = f.read()
        m = re.search(r'FILES\s*=\s*\[(.*?)\]', src, re.S)
        if not m:
            print(f"  ⚠ {script} 中未找到 FILES 清单")
            continue
        for fn in re.findall(r'["\']([^"\']+\.html)["\']', m.group(1)):
            html_set.add(fn)
    # 同时处理根 index.html（GitHub Pages 入口，由 18:00 任务从 index_v3.html 复制）
    html_set.add("index.html")
    return sorted(html_set)


def inject_one(html_path):
    if not os.path.exists(html_path):
        return "missing"
    with open(html_path, encoding="utf-8") as f:
        content = f.read()

    # 已注入则跳过
    if 'src="auth_policy.js"' in content and 'src="inline_auth.js"' in content:
        return "skip"

    if HEAD_ANCHOR not in content:
        return "no_head"  # 该文件非标准 HTML，无法锚定

    # 在 </head> 前插入两个脚本（auth_policy.js 在前）
    new_content = content.replace(HEAD_ANCHOR, INJECT_BLOCK + HEAD_ANCHOR, 1)

    if new_content == content:
        return "no_change"

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    return "injected"


def main():
    print("=" * 60)
    print("权限闸门注入")
    print("=" * 60)
    html_files = collect_html_files()
    print(f"待处理 HTML 文件数: {len(html_files)}")

    stats = {"injected": 0, "skip": 0, "missing": 0, "no_feishu_jsapi": 0, "no_change": 0}
    for fn in html_files:
        res = inject_one(os.path.join(BASE, fn))
        stats[res] = stats.get(res, 0) + 1
        flag = {"injected": "✅ 已注入", "skip": "↪️ 已存在跳过",
                "missing": "❌ 文件缺失", "no_feishu_jsapi": "⚠️ 无锚点跳过",
                "no_change": "⚠️ 无变化"}.get(res, res)
        print(f"  {flag:<14} {fn}")

    print("-" * 60)
    print(f"新增注入: {stats['injected']} | 已存在跳过: {stats['skip']} | "
          f"缺失: {stats['missing']} | 无锚点: {stats['no_feishu_jsapi']}")


if __name__ == "__main__":
    main()
