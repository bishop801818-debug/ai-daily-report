#!/usr/bin/env python3
"""
从最新 recycling_data_v3.js 重新生成拆分产物（安全版，供每日自动化使用）：
  - recycling_latest.js  (const RECYCLING_DATA, 每品种最新30条, index_v3.html 首屏消费)
  - recycling_history.js (const RECYCLING_HISTORY, 全量)

背景：2026-07-24 性能重构(c1c3ec9)将 index_v3.html 的回收数据引用从
recycling_data_v3.js 改为 recycling_latest.js。recycling_mysteel_auto_update.py
仍写 v3.js（recycling_revival.html / 妙搭 FILES 仍消费 v3.js），因此每次
mysteel 复活更新后必须运行本脚本同步拆分产物，否则首页回收数据停留在旧日期。

与一次性迁移脚本 _split_recycling.py 的区别：本脚本【不删除】v3.js、【不修改】任何 HTML。
用法：python regen_recycling_split.py   （在项目根目录）
"""
import re
import os
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
LATEST_PER_PRODUCT = 30


def main():
    src_path = os.path.join(BASE, "recycling_data_v3.js")
    if not os.path.exists(src_path):
        print("❌ recycling_data_v3.js 不存在，先运行 recycling_mysteel_auto_update.py")
        sys.exit(1)
    with open(src_path, encoding="utf-8", errors="replace") as f:
        src = f.read()

    m = re.search(r"const\s+RECYCLING_DATA\s*=\s*\{", src)
    if not m:
        print("❌ 找不到 RECYCLING_DATA 块")
        sys.exit(1)
    bs = src.find("{", m.start())
    depth, end = 0, None
    for i in range(bs, len(src)):
        if src[i] == "{":
            depth += 1
        elif src[i] == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end is None:
        print("❌ RECYCLING_DATA 块未闭合")
        sys.exit(1)
    inner = src[bs + 1:end - 1]

    products = {}
    pos = 0
    while pos < len(inner):
        mm = re.search(r'"([^"]+)":\s*\[', inner[pos:])
        if not mm:
            break
        name = mm.group(1)
        start = pos + mm.end() - 1
        depth, le = 0, None
        for i in range(start, len(inner)):
            if inner[i] == "[":
                depth += 1
            elif inner[i] == "]":
                depth -= 1
                if depth == 0:
                    le = i
                    break
        if le is None:
            break
        products[name] = inner[start + 1:le]
        pos = le + 1

    if len(products) < 11:
        print(f"⚠️ 品种数异常: {len(products)} (期望>=11)，中止以防写坏拆分产物")
        sys.exit(1)

    latest, hist = {}, {}
    for name, body in products.items():
        recs = []
        pos = 0
        while pos < len(body):
            mm = re.search(r"\{", body[pos:])
            if not mm:
                break
            start = pos + mm.start()
            depth, re_ = 0, None
            for i in range(start, len(body)):
                if body[i] == "{":
                    depth += 1
                elif body[i] == "}":
                    depth -= 1
                    if depth == 0:
                        re_ = i
                        break
            if re_ is None:
                break
            recs.append(body[start:re_ + 1])
            pos = re_ + 1
        if recs:
            latest[name] = ",\n  ".join(recs[-LATEST_PER_PRODUCT:])
            hist[name] = ",\n  ".join(recs)

    lc = "const RECYCLING_DATA = {\n"
    for n, b in latest.items():
        lc += f'  "{n}": [\n  {b}\n  ],\n'
    lc += "};\n"
    with open(os.path.join(BASE, "recycling_latest.js"), "w", encoding="utf-8") as f:
        f.write(lc)

    hc = "const RECYCLING_HISTORY = {\n"
    for n, b in hist.items():
        hc += f'  "{n}": [\n  {b}\n  ],\n'
    hc += "};\n"
    with open(os.path.join(BASE, "recycling_history.js"), "w", encoding="utf-8") as f:
        f.write(hc)

    print(f"✅ 拆分再生成完成: {len(products)} 品种")
    print(f"   recycling_latest.js:  {os.path.getsize(os.path.join(BASE, 'recycling_latest.js'))/1024:.1f} KB")
    print(f"   recycling_history.js: {os.path.getsize(os.path.join(BASE, 'recycling_history.js'))/1024:.1f} KB")


if __name__ == "__main__":
    main()
