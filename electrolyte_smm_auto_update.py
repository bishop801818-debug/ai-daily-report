#!/usr/bin/env python3
"""
电解液数据全自动更新脚本（SMM爬虫版本）
功能：从SMM网站自动抓取电解液价格数据，更新到electrolyte_data.js
运行方式：python electrolyte_smm_auto_update.py
定时任务：每个工作日下午4点（16:00）运行

特点：
1. 全自动从SMM网站抓取数据，无需手动下载Excel
2. 自动映射SMM数据到electrolyte_data.js的品种
3. 只更新当天最新数据，不重复历史数据

注意：PS（苯基磺酸）在SMM网站无数据，需手动更新
"""

import asyncio
import json
import re
import sys
from datetime import datetime
from pathlib import Path

# ============== 配置 ==============
PYTHON_BIN = r"C:\Users\1\.workbuddy\binaries\python\versions\3.13.12\python.exe"
DATA_FILE = "electrolyte_data.js"
SMM_CRAWLER = "smm_crawler.py"

# SMM数据 -> electrolyte_data.js的品种映射
# key: (SMM品名关键词, SMM规格关键词)
# value: electrolyte_data.js的key
# 注意：溶剂的规格字段不包含EC/EMC/DMC，需要从品名字段匹配
SMM_TO_KEY = {
    ("电解液", "铁锂动力用"): "电解液价格-磷酸铁锂动力型",
    ("电解液", "铁锂储能用"): "电解液价格-磷酸铁锂储能型",
    ("电解液", "三元动力用"): "电解液价格-三元动力型",
    ("双氟磺酰亚胺锂", "LiFSI"): "LiFSI价格-固态",
    ("碳酸亚乙烯酯", "电池级"): "添加剂VC-价格",
    ("氟代碳酸乙烯酯", "电池级"): "添加剂FEC-价格",
    ("碳酸乙烯酯EC", ""): "溶剂EC-价格",  # 规格字段不包含EC，从品名匹配
    ("碳酸甲乙酯EMC", ""): "溶剂EMC-价格",  # 规格字段不包含EMC，从品名匹配
    ("碳酸二甲酯DMC", ""): "溶剂DMC-价格",  # 规格字段不包含DMC，从品名匹配
}

# 备用映射（当上面匹配失败时）
SMM_TO_KEY_FALLBACK = {
    "电解液价格-磷酸铁锂动力型": ("电解液", "铁锂"),
    "电解液价格-磷酸铁锂储能型": ("电解液", "储"),
    "电解液价格-三元动力型": ("电解液", "三元"),
    "LiFSI价格-固态": ("双氟磺酰亚胺锂", "LiFSI"),
    "添加剂VC-价格": ("碳酸亚乙烯酯", "VC"),
    "添加剂FEC-价格": ("氟代碳酸乙烯酯", "FEC"),
    "溶剂EC-价格": ("碳酸乙烯酯", "EC"),
    "溶剂EMC-价格": ("碳酸甲乙酯", "EMC"),
    "溶剂DMC-价格": ("碳酸二甲酯", "DMC"),
}


def load_existing_data():
    """加载现有的electrolyte_data.js数据"""
    if not Path(DATA_FILE).exists():
        print(f"错误：数据文件 {DATA_FILE} 不存在")
        return {}

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # 解析JS对象
    lines = content.split("\n")
    data = {}
    current_key = None
    current_array = []
    in_array = False

    for line in lines:
        line_stripped = line.strip()

        # 检测新的key
        if '"' in line_stripped and ':' in line_stripped and line_stripped.endswith('['):
            match = re.match(r'"([^"]+)"\s*:', line_stripped)
            if match:
                if current_key and current_array:
                    data[current_key] = current_array
                current_key = match.group(1)
                current_array = []
                in_array = True
                continue

        # 检测数组结束
        if in_array and (line_stripped == '],' or line_stripped == ']'):
            if current_key and current_array:
                data[current_key] = current_array
                current_key = None
                current_array = []
                in_array = False
            continue

        # 解析数组中的对象
        if in_array and line_stripped.startswith('{'):
            try:
                clean_line = line_stripped.rstrip(',')
                obj = json.loads(clean_line)
                current_array.append(obj)
            except:
                pass

    print(f"已加载 {len(data)} 个品种的现有数据")
    return data


def match_smm_to_electrolyte(smm_item):
    """将SMM数据匹配到electrolyte_data.js的品种"""
    name = smm_item.get("品名", "")
    spec = smm_item.get("规格", "")

    # 优先精确匹配（规格为空字符串时跳过规格检查）
    for (smm_name, smm_spec), js_key in SMM_TO_KEY.items():
        if smm_name in name:
            if smm_spec == "" or smm_spec in spec:
                return js_key

    # 模糊匹配
    for js_key, (name_kw, spec_kw) in SMM_TO_KEY_FALLBACK.items():
        if name_kw in name:
            if spec_kw == "" or spec_kw in spec:
                return js_key

    return None


def crawl_smm_data():
    """运行SMM爬虫抓取数据"""
    print("正在从SMM网站抓取数据...")

    import subprocess
    result = subprocess.run(
        [PYTHON_BIN, SMM_CRAWLER],
        capture_output=True,
        text=True,
        cwd=Path(__file__).parent.absolute()
    )

    if result.returncode != 0:
        print(f"爬虫运行失败: {result.stderr}")
        return None

    print("SMM爬虫执行成功")
    return True


def load_latest_smm_data():
    """加载最新的SMM抓取数据"""
    # 查找最新的SMM数据文件
    import glob

    pattern = "smm_prices_*.json"
    files = sorted(Path(".").glob(pattern), reverse=True)

    if not files:
        print("未找到SMM数据文件")
        return None

    latest_file = files[0]
    print(f"加载数据文件: {latest_file}")

    with open(latest_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    return data


def update_electrolyte_data(existing_data, smm_data, today):
    """更新electrolyte_data.js"""
    updated = {}
    missing = []

    # 找出SMM数据中的最新日期
    smm_dates = set(d.get("日期", "") for d in smm_data if d.get("日期"))
    latest_smm_date = max(smm_dates) if smm_dates else today

    # 如果当天无数据，使用最新可用日期
    target_date = latest_smm_date

    for smm_item in smm_data:
        js_key = match_smm_to_electrolyte(smm_item)
        if not js_key:
            continue

        # 获取价格信息
        avg_price = smm_item.get("平均价", 0)
        min_price = smm_item.get("最低价", avg_price)
        max_price = smm_item.get("最高价", avg_price)

        # 检查是否需要更新（使用最新可用日期）
        date = smm_item.get("日期", "")
        if date != target_date:
            continue

        # 创建新数据记录
        new_item = {
            "日期": date,
            "最低价": str(int(min_price)),
            "最高价": str(int(max_price)),
            "均价": str(int(avg_price))
        }

        # 获取现有数据
        old_data = existing_data.get(js_key, [])

        # 检查是否已存在当天数据
        has_date = any(d.get("日期") == date for d in old_data)
        if has_date:
            print(f"  {js_key}: 已存在{date}数据，跳过")
            continue

        # 添加新数据
        new_data = old_data + [new_item]
        existing_data[js_key] = new_data
        updated[js_key] = new_item

    return existing_data, updated


def save_electrolyte_data(data):
    """保存到electrolyte_data.js"""
    output_lines = ["const ELECTROLYTE_DATA = {"]

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

    print(f"数据已保存到: {DATA_FILE}")


def run_update():
    """主更新流程"""
    today = datetime.now().strftime("%Y-%m-%d")
    print(f"=== 电解液数据自动更新 ({today}) ===")

    # 1. 加载现有数据
    existing_data = load_existing_data()

    # 2. 抓取SMM数据
    if not crawl_smm_data():
        print("SMM抓取失败")
        return False

    # 3. 加载SMM数据
    smm_data = load_latest_smm_data()
    if not smm_data:
        print("加载SMM数据失败")
        return False

    print(f"加载了 {len(smm_data)} 条SMM数据")

    # 4. 匹配并更新
    existing_data, updated = update_electrolyte_data(existing_data, smm_data, today)

    if not updated:
        print("没有新数据需要更新")
        return True

    print(f"\n更新了 {len(updated)} 个品种:")
    for key, item in updated.items():
        print(f"  {key}: {item['均价']} 元/吨")

    # 5. 保存
    save_electrolyte_data(existing_data)

    print(f"\n更新完成！共更新 {len(updated)} 条数据")
    return True


if __name__ == "__main__":
    success = run_update()
    sys.exit(0 if success else 1)