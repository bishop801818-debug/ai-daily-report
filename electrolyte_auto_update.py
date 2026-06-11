#!/usr/bin/env python3
"""
电解液数据自动更新脚本
功能：从用户提供的Excel文件更新电解液数据到electrolyte_data.js
运行方式：python electrolyte_auto_update.py [Excel文件路径]
定时任务：每个工作日下午4点（16:00）运行

使用方法：
1. 手动：从SMM网站下载电解液价格数据Excel文件
2. 自动：运行本脚本更新到electrolyte_data.js

Excel文件格式要求：
- 包含列：当前日期、规格、今日最低价格、今日最高价格、今日均价、单位
- 每个规格一行（电池级）
"""

import csv
import json
import re
import sys
from datetime import datetime
from pathlib import Path
import pandas as pd


# ============== 配置 ==============
DATA_FILE = "electrolyte_data.js"
DEFAULT_EXCEL_PATTERNS = [
    "C:/Users/1/Downloads/down电解液价格数据.xls",
    "C:/Users/1/Downloads/电解液价格数据.xls",
    "D:/trae/AI Daily report/down电解液价格数据.xls",
    "C:/Users/1/Downloads/*.xls",  # 支持通配符
    "C:/Users/1/Downloads/*.xlsx",
]

# 品种映射表：Excel中的规格 -> electrolyte_data.js的key
SPECIES_MAP = {
    # 电解液成品
    "动力磷酸铁锂": "电解液价格-磷酸铁锂动力型",
    "储能磷酸铁锂": "电解液价格-磷酸铁锂储能型",
    "动力三元": "电解液价格-三元动力型",
    # 添加剂
    "LiFSI": "LiFSI价格-固态",
    "VC": "添加剂VC-价格",
    "FEC": "添加剂FEC-价格",
    # 溶剂（新增）
    "EC": "溶剂EC-价格",
    "DMC": "溶剂DMC-价格",
    "EMC": "溶剂EMC-价格",
}


def find_excel_file(patterns):
    """查找Excel文件"""
    for pattern in patterns:
        # 处理通配符
        if '*' in pattern:
            from pathlib import Path as P
            parent = P(pattern).parent
            suffix = P(pattern).suffix
            if parent.exists():
                files = list(parent.glob(P(pattern).name))
                if files:
                    print(f"找到数据文件: {files[0]}")
                    return str(files[0])
            continue

        path = Path(pattern)
        if path.exists():
            print(f"找到数据文件: {path}")
            return str(path)
    return None


def load_excel_data(excel_file):
    """从Excel文件加载数据"""
    print(f"正在读取: {excel_file}")

    try:
        tables = pd.read_html(excel_file, encoding='utf-8')
        df = tables[0]
        print(f"读取成功: {len(df)} 行")
        print(f"列名: {df.columns.tolist()}")
        return df
    except Exception as e:
        print(f"读取Excel错误: {e}")
        return None


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


def match_excel_to_electrolyte(df_excel, species_map):
    """将Excel数据匹配到electrolyte_data.js的品种"""
    matched = {}

    for _, row in df_excel.iterrows():
        spec = str(row.get('规格', ''))
        date = str(row.get('当前日期', ''))
        min_price = row.get('今日最低价格')
        max_price = row.get('今日最高价格')
        avg_price = row.get('今日均价')
        unit = str(row.get('单位', '万元/吨'))

        if not avg_price or not date:
            continue

        # 转换单位：万元/吨 -> 元/吨
        if '万元' in unit:
            try:
                min_price = float(min_price) * 10000
                max_price = float(max_price) * 10000
                avg_price = float(avg_price) * 10000
            except:
                continue
        else:
            try:
                min_price = float(min_price)
                max_price = float(max_price)
                avg_price = float(avg_price)
            except:
                continue

        # 尝试匹配规格
        target_key = None
        for excel_spec, js_key in species_map.items():
            if excel_spec in spec:
                target_key = js_key
                break

        if not target_key:
            continue

        new_item = {
            "日期": date,
            "最低价": str(int(min_price)),
            "最高价": str(int(max_price)),
            "均价": str(int(avg_price))
        }

        if target_key not in matched:
            matched[target_key] = []

        # 检查是否已存在该日期的数据
        dates = [d.get("日期") for d in matched[target_key]]
        if date not in dates:
            matched[target_key].append(new_item)
            print(f"  匹配: {spec} -> {target_key}: {int(avg_price)}元/吨 [{date}]")

    return matched


def update_electrolyte_data(existing_data, new_data):
    """更新electrolyte_data.js"""
    updated_count = 0

    for key, new_items in new_data.items():
        if key in existing_data:
            old_data = existing_data[key]

            # 获取最新日期
            if old_data:
                latest_date = max(d.get("日期", "") for d in old_data)
            else:
                latest_date = "2025-01-01"

            # 只添加比现有数据更新的日期
            for item in new_items:
                item_date = item.get("日期", "")
                if item_date > latest_date:
                    old_data.append(item)
                    updated_count += 1
                    print(f"  更新 {key}: {item_date} -> {item['均价']}元/吨")
        else:
            # 新品种
            existing_data[key] = new_items
            updated_count += len(new_items)
            print(f"  新增 {key}: {len(new_items)} 条数据")

    return existing_data, updated_count


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
        output_lines.append('  ]')
        if i < len(data) - 1:
            output_lines[-1] += ','

    output_lines.append("};")

    output = "\n".join(output_lines)

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        f.write(output)

    print(f"\n已保存到 {DATA_FILE}")


def run_update(excel_file=None):
    """执行更新流程"""
    print("=" * 50)
    print("电解液数据自动更新")
    print(f"运行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)

    # 1. 查找Excel文件
    print("\n[1/4] 查找数据文件...")
    if excel_file:
        file_path = excel_file
    else:
        file_path = find_excel_file(DEFAULT_EXCEL_PATTERNS)

    if not file_path:
        print("错误：未找到数据文件")
        print("请提供Excel文件路径，或将文件放到以下位置：")
        for p in DEFAULT_EXCEL_PATTERNS:
            print(f"  - {p}")
        return False

    # 2. 读取Excel数据
    print("\n[2/4] 读取Excel数据...")
    df = load_excel_data(file_path)
    if df is None:
        return False

    # 3. 匹配品种
    print("\n[3/4] 匹配品种...")
    matched_data = match_excel_to_electrolyte(df, SPECIES_MAP)

    if not matched_data:
        print("警告：未能匹配到任何品种数据")
        specs = df['规格'].unique() if '规格' in df.columns else []
        print(f"Excel中的规格: {specs}")
        return False

    print(f"匹配到 {len(matched_data)} 个品种")

    # 4. 加载并更新现有数据
    print("\n[4/4] 更新数据...")
    existing_data = load_existing_data()
    updated_data, count = update_electrolyte_data(existing_data, matched_data)

    if count > 0:
        save_electrolyte_data(updated_data)
        print(f"\n更新完成！共更新 {count} 条数据")
    else:
        print("\n没有新数据需要更新")

    return True


def main():
    """主入口"""
    # 获取命令行参数
    excel_file = sys.argv[1] if len(sys.argv) > 1 else None
    run_update(excel_file)


if __name__ == "__main__":
    main()