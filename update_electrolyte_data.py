#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
电解液6个品种价格数据自动更新脚本

功能：
- 自动抓取/更新电解液6个品种的价格数据
- 更新到electrolyte_data.js文件

更新品种（6个）：
1. 电解液价格-磷酸铁锂动力型
2. 电解液价格-磷酸铁锂储能型
3. 电解液价格-三元动力型
4. LiFSI价格-固态
5. 添加剂VC-价格
6. 添加剂FEC-价格

数据源：
- 方案1: 从指定目录读取Excel文件（用户导出）
- 方案2: 从SMM网站抓取（预留）

更新频率：工作日16:00
"""

import os
import sys
import json
import re
import pandas as pd
from datetime import datetime, timedelta

# 配置
PROJECT_DIR = r"D:\trae\AI Daily report"
ELECTROLYTE_DATA_FILE = os.path.join(PROJECT_DIR, "electrolyte_data.js")
DATA_INPUT_DIR = r"C:\Users\1\Downloads"

# Excel文件映射（品种名 -> 文件名）
EXCEL_FILES = {
    '电解液价格-磷酸铁锂动力型': 'down电解液价格数据.xls',
    '电解液价格-磷酸铁锂储能型': 'down电解液价格数据.xls',
    '电解液价格-三元动力型': 'down电解液价格数据.xls',
    'LiFSI价格-固态': 'downLiFSI价格数据.xls',
    '添加剂VC-价格': 'downVC价格数据.xls',
    '添加剂FEC-价格': 'downFEC价格数据.xls',
}

# 规格映射（文件名 -> Excel中的规格名）
SPEC_MAPPING = {
    'down电解液价格数据.xls': {
        '电解液价格-磷酸铁锂动力型': '动力磷酸铁锂',
        '电解液价格-磷酸铁锂储能型': '储能磷酸铁锂',
        '电解液价格-三元动力型': '动力三元',
    },
    'downLiFSI价格数据.xls': {
        'LiFSI价格-固态': '固态',
    },
    'downVC价格数据.xls': {
        '添加剂VC-价格': '电池级',
    },
    'downFEC价格数据.xls': {
        '添加剂FEC-价格': '电池级',
    },
}


def read_electrolyte_data_js():
    """读取现有的electrolyte_data.js文件"""
    if not os.path.exists(ELECTROLYTE_DATA_FILE):
        print(f"[ERROR] 文件不存在: {ELECTROLYTE_DATA_FILE}")
        return None

    with open(ELECTROLYTE_DATA_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # 按行解析JS对象
    lines = content.split('\n')
    ELECTROLYTE_DATA = {}
    current_key = None
    current_array = []
    in_array = False

    for line in lines:
        line_stripped = line.strip()

        # 检测新的key
        if '"' in line_stripped and ':' in line_stripped and line_stripped.endswith('['):
            key_match = re.match(r'"([^"]+)"\s*:', line_stripped)
            if key_match:
                if current_key and current_array:
                    ELECTROLYTE_DATA[current_key] = current_array
                current_key = key_match.group(1)
                current_array = []
                in_array = True
                continue

        # 检测数组结束
        if in_array and (line_stripped == '],' or line_stripped == ']'):
            if current_key and current_array:
                ELECTROLYTE_DATA[current_key] = current_array
                current_key = None
                current_array = []
                in_array = False
            continue

        # 在数组中，解析对象
        if in_array and line_stripped.startswith('{'):
            try:
                clean_line = line_stripped.rstrip(',')
                obj = json.loads(clean_line)
                current_array.append(obj)
            except:
                pass

    if current_key and current_array:
        ELECTROLYTE_DATA[current_key] = current_array

    print(f"[INFO] 已加载 {len(ELECTROLYTE_DATA)} 个品种的现有数据")
    return ELECTROLYTE_DATA


def read_excel_data(file_path, spec_name):
    """从Excel文件读取指定规格的数据"""
    try:
        tables = pd.read_html(file_path, encoding='utf-8')
        df = tables[0]

        # 筛选指定规格
        if '规格' in df.columns:
            df_spec = df[df['规格'] == spec_name].copy()
        else:
            df_spec = df.copy()

        df_spec = df_spec.sort_values('当前日期')

        # 转换单位：万元/吨 -> 元/吨
        data = []
        for _, row in df_spec.iterrows():
            data.append({
                '日期': row['当前日期'],
                '最低价': str(float(row['今日最低价格']) * 10000),
                '最高价': str(float(row['今日最高价格']) * 10000),
                '均价': str(float(row['今日均价']) * 10000)
            })

        return data
    except Exception as e:
        print(f"[ERROR] 读取Excel失败 {file_path}: {e}")
        return None


def update_electrolyte_data():
    """更新电解液数据"""
    print("=" * 50)
    print(f"[INFO] 开始更新电解液数据 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)

    # 1. 读取现有数据
    existing_data = read_electrolyte_data_js()
    if existing_data is None:
        print("[ERROR] 无法读取现有数据，退出")
        return False

    # 2. 处理每个品种
    updated_count = 0
    for js_key, excel_file in EXCEL_FILES.items():
        file_path = os.path.join(DATA_INPUT_DIR, excel_file)
        if not os.path.exists(file_path):
            print(f"[WARN] 文件不存在: {file_path}")
            continue

        # 获取规格名
        spec_name = SPEC_MAPPING.get(excel_file, {}).get(js_key, None)
        if spec_name is None:
            print(f"[WARN] 未找到规格映射: {js_key}")
            continue

        print(f"\n[INFO] 处理: {js_key} ({spec_name})")

        # 读取Excel数据
        new_data = read_excel_data(file_path, spec_name)
        if new_data is None or len(new_data) == 0:
            print(f"[WARN] 无数据: {js_key}")
            continue

        # 合并数据
        old_data = existing_data.get(js_key, [])
        old_before_0413 = [d for d in old_data if d['日期'] < '2026-04-13']
        merged_data = old_before_0413 + new_data
        merged_data.sort(key=lambda x: x['日期'])

        existing_data[js_key] = merged_data

        print(f"  原有: {len(old_data)}条 + 新增: {len(new_data)}条 = 合并: {len(merged_data)}条")
        print(f"  日期范围: {merged_data[0]['日期']} ~ {merged_data[-1]['日期']}")
        updated_count += 1

    # 3. 写回文件
    print("\n[INFO] 写入更新后的数据...")
    output_lines = ['const ELECTROLYTE_DATA = {']
    for i, (key, data) in enumerate(existing_data.items()):
        output_lines.append(f'  "{key}": [')
        for j, item in enumerate(data):
            line = f'    {json.dumps(item, ensure_ascii=False)}'
            if j < len(data) - 1:
                line += ','
            output_lines.append(line)
        output_lines.append('  ]')
        if i < len(existing_data) - 1:
            output_lines[-1] += ','
    output_lines.append('};')

    output = '\n'.join(output_lines)

    with open(ELECTROLYTE_DATA_FILE, 'w', encoding='utf-8') as f:
        f.write(output)

    print("\n" + "=" * 50)
    print(f"[SUCCESS] 更新完成！共更新 {updated_count} 个品种")
    print(f"[INFO] 数据文件: {ELECTROLYTE_DATA_FILE}")
    print("=" * 50)

    return True


if __name__ == '__main__':
    # 切换到项目目录
    os.chdir(PROJECT_DIR)

    success = update_electrolyte_data()
    sys.exit(0 if success else 1)