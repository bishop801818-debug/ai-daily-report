# -*- coding: utf-8 -*-
"""
同步脚本：将 *._embedded_data.js 转换为 *._all_data.json
以及同步到 embedded/ 目录。

用途：数据库 JS 更新后，自动生成看板所需的 JSON 文件。
支持多数据库并发处理。

使用方法：
  单独运行：python _sync_embed_to_json.py
  被调用：from _sync_embed_to_json import sync_all
"""

import os
import sys
sys.stdout.reconfigure(encoding="utf-8")
import re
import json
import shutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EMBEDDED_DIR = os.path.join(BASE_DIR, "embedded")

# 数据库配置：(embedded_js文件名, all_json文件名)
# 顺序即处理顺序
DATABASES = [
    ("lfp_embedded_data.js",          "lfp_all_data.json"),
    ("carbonate_embedded_data.js",    "carbonate_all_data.json"),
    ("lib_battery_embedded_data.js",   "lib_battery_all_data.json"),
    ("ternary_embedded_data.js",      "ternary_all_data.json"),
    ("automotive_embedded_data.js",    "automotive_all_data.json"),
    ("recycling_embedded_data.js",     "recycling_all_data.json"),
]

# 电解液特殊：只有 embedded_js，没有独立 all_data.json
# 故不在上述列表中


def js_to_json(js_content: str) -> str:
    """
    从 JS 内容中提取纯 JSON 数据，并格式化为 4 空格缩进。
    处理两种常见格式：
      const EMBEDDED_DATA = { ... };
      const EMBEDDED_DATA = { ... }
    """
    # 去掉 const EMBEDDED_DATA = 前缀和尾部 ;
    text = re.sub(r'^const\s+EMBEDDED_DATA\s*=\s*', '', js_content.strip())
    text = text.rstrip().rstrip(';').rstrip()

    # 用 AST 解析再序列化，保证格式正确（支持嵌套）
    data = json.loads(text)
    return json.dumps(data, ensure_ascii=False, indent=4)


def sync_one(js_filename: str, json_filename: str) -> dict:
    """处理单个数据库：JS → JSON，同时同步 embedded/ 目录。"""
    js_path = os.path.join(BASE_DIR, js_filename)
    json_path = os.path.join(BASE_DIR, json_filename)
    embed_js_path = os.path.join(EMBEDDED_DIR, js_filename)
    embed_json_path = os.path.join(EMBEDDED_DIR, json_filename)

    result = {"js": js_filename, "json": json_filename, "status": "ok", "action": None}

    # 1. 生成 JSON（仅当 JS 存在且已更新）
    if not os.path.exists(js_path):
        result["status"] = "skip"
        result["action"] = "JS file not found"
        return result

    with open(js_path, "r", encoding="utf-8") as f:
        js_content = f.read()

    try:
        json_content = js_to_json(js_content)
    except json.JSONDecodeError as e:
        result["status"] = "error"
        result["action"] = f"JSON parse failed: {e}"
        return result

    # 解析 update_time 用于比较
    try:
        data = json.loads(json_content)
        update_time = data.get("update_time", "unknown")
    except Exception:
        update_time = "unknown"

    # 2. 判断是否需要写入 JSON
    write_json = False
    if not os.path.exists(json_path):
        write_json = True
        result["action"] = "JSON created (target did not exist)"
    else:
        with open(json_path, "r", encoding="utf-8") as f:
            old_content = f.read()
        if old_content != json_content:
            write_json = True
            result["action"] = f"JSON updated (update_time: {update_time})"
        else:
            result["action"] = f"unchanged (update_time: {update_time})"

    if write_json:
        with open(json_path, "w", encoding="utf-8") as f:
            f.write(json_content)
        result["status"] = "updated"

    # 3. 同步到 embedded/ 目录
    if os.path.exists(EMBEDDED_DIR):
        # 同步 embedded JS（如有更新）
        if os.path.exists(embed_js_path):
            with open(embed_js_path, "r", encoding="utf-8") as f:
                old_embed_js = f.read()
            if old_embed_js != js_content:
                shutil.copy2(js_path, embed_js_path)
                if result["action"]:
                    result["action"] += " | embedded JS synced"
                else:
                    result["action"] = "embedded JS synced"

        # 同步 embedded JSON（如有更新）
        if os.path.exists(embed_json_path) or write_json:
            with open(embed_json_path, "w", encoding="utf-8") as f:
                f.write(json_content)
            if "embedded" not in str(result.get("action", "")):
                result["action"] = (result["action"] or "") + " | embedded JSON synced"

    return result


def sync_all() -> list:
    """同步所有配置的数据库 JS → JSON。返回结果列表。"""
    results = []
    for js_fn, json_fn in DATABASES:
        result = sync_one(js_fn, json_fn)
        results.append(result)
    return results


def print_report(results: list):
    """打印汇总报告。"""
    print("\n" + "=" * 60)
    print("  embedded JS → all JSON 同步报告")
    print("=" * 60)

    updated = [r for r in results if r["status"] == "updated"]
    unchanged = [r for r in results if r["status"] == "ok"]
    skipped  = [r for r in results if r["status"] == "skip"]
    errors   = [r for r in results if r["status"] == "error"]

    for r in results:
        icon = {"ok": "✓", "updated": "▲", "skip": "○", "error": "✗"}.get(r["status"], "?")
        print(f"  {icon}  {r['js']:<40} {r['action'] or ''}")

    print("-" * 60)
    print(f"  更新: {len(updated)}  |  无变化: {len(unchanged)}  |  跳过: {len(skipped)}  |  错误: {len(errors)}")

    if updated:
        print(f"\n  请刷新看板页面以查看最新数据:")
        for r in updated:
            json_name = r["json"].replace("_all_data.json", "_charts.html")
            print(f"    http://localhost:8888/{json_name}")

    if errors:
        print("\n  错误详情:")
        for r in errors:
            print(f"    ✗ {r['js']}: {r['action']}")


if __name__ == "__main__":
    results = sync_all()
    print_report(results)
