#!/usr/bin/env python3
"""
化工品数据全自动更新脚本
功能：从生意社/SMM网站自动抓取硫酸、双氧水价格数据，更新到chemical_data.js
运行方式：python chemical_smm_auto_update.py
定时任务：每个工作日下午17:00运行
"""

import json
import re
import sys
import subprocess
from datetime import datetime
from pathlib import Path

# ============ 配置 ============
PYTHON_BIN = r"C:\Users\1\.workbuddy\binaries\python\versions\3.13.12\python.exe"
DATA_FILE = "chemical_data.js"
CRAWLER = "chemical_smm_crawler.py"

# 品种映射：SMM数据 -> chemical_data.js的key
SMM_TO_KEY = {
    "硫酸": "硫酸-98%浓硫酸",
    "双氧水": "双氧水-27.5%",
}


def load_existing_data():
    """加载现有的chemical_data.js数据"""
    if not Path(DATA_FILE).exists():
        print(f"[加载] 数据文件 {DATA_FILE} 不存在，将创建新文件")
        return {}

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # 解析JS对象
    match = re.search(r'const CHEMICAL_DATA = ({.*});', content, re.DOTALL)
    if not match:
        print(f"[加载] 无法解析JS文件")
        return {}

    try:
        data = json.loads(match.group(1))
    except json.JSONDecodeError as e:
        print(f"[加载] JSON解析错误: {e}")
        return {}

    print(f"[加载] 已加载 {len(data)} 个品种")
    return data


def crawl_smm_data():
    """运行SMM爬虫"""
    print("[爬虫] 正在从SMM网站抓取数据...")

    work_dir = Path(__file__).parent.absolute()
    result = subprocess.run(
        [PYTHON_BIN, CRAWLER],
        capture_output=True,
        text=True,
        cwd=str(work_dir)
    )

    if result.returncode != 0:
        print(f"[爬虫] 运行失败: {result.stderr}")
        return False

    print("[爬虫] 抓取成功")
    return True


def load_latest_smm_data():
    """加载最新的SMM数据"""
    import glob

    pattern = "chemical_prices_*.json"
    files = sorted(Path(".").glob(pattern), reverse=True)

    if not files:
        print("[数据] 未找到SMM数据文件")
        return None

    latest_file = files[0]
    print(f"[数据] 加载: {latest_file.name}")

    with open(latest_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"[数据] 加载了 {len(data)} 条数据")
    return data


def update_chemical_data(existing_data, smm_data, today):
    """更新chemical_data.js"""
    updated = {}

    for smm_item in smm_data:
        chem_name = smm_item.get("品名", "")
        js_key = SMM_TO_KEY.get(chem_name)

        if not js_key:
            continue

        # 获取价格信息
        price = smm_item.get("价格", 0)
        date = smm_item.get("日期", "")
        change = smm_item.get("涨跌", "0%")

        # 创建新记录
        new_item = {
            "日期": date,
            "最低价": str(int(price * 0.95)),
            "最高价": str(int(price * 1.05)),
            "均价": str(int(price)),
            "涨跌": change
        }

        # 获取现有数据
        old_data = existing_data.get(js_key, [])

        # 检查是否已存在当天数据
        has_today = any(d.get("日期") == date for d in old_data)
        if has_today:
            print(f"  [跳过] {js_key}: {date} 数���已存在")
            continue

        # 添加新数据并排序
        new_data = old_data + [new_item]
        new_data.sort(key=lambda x: x.get("日期", ""))
        existing_data[js_key] = new_data
        updated[js_key] = new_item

    return existing_data, updated


def save_chemical_data(data):
    """保存到chemical_data.js"""
    output_lines = ["const CHEMICAL_DATA = {"]

    for i, (key, items) in enumerate(data.items()):
        output_lines.append(f'  "{key}": [')
        for j, item in enumerate(items):
            line = f'    {json.dumps(item, ensure_ascii=False)}'
            if j < len(items) - 1:
                line += ','
            output_lines.append(line)
        output_lines.append("  ]")
        if i < len(data) - 1:
            output_lines[-1] += ","

    output_lines.append("};")

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))

    print(f"[保存] 数据已保存到: {DATA_FILE}")


def run_update():
    """主更新流程"""
    today = datetime.now().strftime("%Y-%m-%d")
    print(f"=== 化工品数据自动更新 ({today}) ===")

    # 1. 加载现有数据
    existing_data = load_existing_data()

    # 2. 抓取SMM数据
    if not crawl_smm_data():
        print("[错误] SMM抓取失败")
        return False

    # 3. 加载SMM数据
    smm_data = load_latest_smm_data()
    if not smm_data:
        print("[错误] 加载SMM数据失败")
        return False

    # 4. 匹配并更新
    existing_data, updated = update_chemical_data(existing_data, smm_data, today)

    if not updated:
        print("[完成] 没有新数据需要更新")
        return True

    print(f"\n[结果] 更新了 {len(updated)} 个品种:")
    for key, item in updated.items():
        print(f"  {key}: {item['均价']} {item['涨跌']}")

    # 5. 保存
    save_chemical_data(existing_data)

    print(f"\n[完成] 共更新 {len(updated)} 条数据")
    return True


if __name__ == "__main__":
    success = run_update()
    sys.exit(0 if success else 1)