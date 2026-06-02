#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 carbonate_all_data.json 中提取电池级/工业级碳酸锂价格数据，
更新 carbonate_spot_price.json 文件。

数据源：carbonate_all_data.json -> tables -> '碳酸锂-价格' 表
筛选条件：
  - 电池级：规格包含 '99.5%' 且 '矿石'
  - 工业级：规格包含 '99.2%' 且 '盐湖'
"""

import json
import sys
from datetime import datetime

def main():
    # 读取 carbonate_all_data.json
    print("正在读取 carbonate_all_data.json...")
    with open('carbonate_all_data.json', 'r', encoding='utf-8') as f:
        all_data = json.load(f)
    
    # 找到 '碳酸锂-价格' 表
    tables = all_data.get('tables', [])
    lc_price_table = None
    for t in tables:
        if t.get('table_name') == '碳酸锂-价格':
            lc_price_table = t
            break
    
    if not lc_price_table:
        print("错误：未找到 '碳酸锂-价格' 表")
        sys.exit(1)
    
    raw_data = lc_price_table['data']
    print(f"找到 '碳酸锂-价格' 表，共 {len(raw_data)} 条数据")
    
    # 筛选电池级（99.5% 矿石）和工业级（99.2% 盐湖）
    battery_grade = []
    industrial_grade = []
    
    for d in raw_data:
        spec = d.get('规格', '')
        if '99.5' in spec and '矿石' in spec:
            battery_grade.append(d)
        elif '99.2' in spec and '盐湖' in spec:
            industrial_grade.append(d)
    
    print(f"电池级（99.5%矿石）：{len(battery_grade)} 条")
    print(f"工业级（99.2%盐湖）：{len(industrial_grade)} 条")
    
    if not battery_grade:
        print("警告：未找到电池级（99.5%矿石）数据")
    if not industrial_grade:
        print("警告：未找到工业级（99.2%盐湖）数据")
    
    # 转换格式：carbonate_all_data 格式 -> carbonate_spot_price 格式
    def convert_format(data_list):
        result = []
        for d in data_list:
            # 日期格式：'2026-05-27 00:00:00' -> '2026-05-27'
            date_str = d.get('日期', '')
            if isinstance(date_str, str) and ' ' in date_str:
                date_str = date_str.split(' ')[0]
            
            # 价格：万元/吨 -> 元/吨（乘以10000）
            avg_price_w = d.get('均价（万元/吨）', 0) or 0
            low_price_w = d.get('最低价（万元/吨）', 0) or 0
            high_price_w = d.get('最高价（万元/吨）', 0) or 0
            
            avg_price = int(avg_price_w * 10000) if avg_price_w else 0
            low_price = int(low_price_w * 10000) if low_price_w else 0
            high_price = int(high_price_w * 10000) if high_price_w else 0
            
            result.append({
                'date': date_str,
                'price': avg_price,
                'low': low_price,
                'high': high_price,
                'unit': '元/吨',
                'grade': '电池级' if '电池级' in d.get('规格', '') else '工业级',
                'spec': d.get('规格', ''),
                'source': '龙蟠时代碳酸锂产业链数据库'
            })
        return result
    
    battery_grade_converted = convert_format(battery_grade)
    industrial_grade_converted = convert_format(industrial_grade)
    
    # 按日期排序（正序）
    battery_grade_converted.sort(key=lambda x: x['date'])
    industrial_grade_converted.sort(key=lambda x: x['date'])
    
    print(f"转换后：")
    print(f"  电池级：{len(battery_grade_converted)} 条，日期范围 {battery_grade_converted[0]['date']} ~ {battery_grade_converted[-1]['date']}")
    print(f"  工业级：{len(industrial_grade_converted)} 条，日期范围 {industrial_grade_converted[0]['date']} ~ {industrial_grade_converted[-1]['date']}")
    
    # 读取现有的 carbonate_spot_price.json（备份）
    print("\n正在读取 carbonate_spot_price.json...")
    with open('carbonate_spot_price.json', 'r', encoding='utf-8') as f:
        spot_data = json.load(f)
    
    # 更新数据
    spot_data['data']['battery_grade'] = battery_grade_converted
    spot_data['data']['industrial_grade'] = industrial_grade_converted
    spot_data['update_time'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # 写回文件
    print("正在写回 carbonate_spot_price.json...")
    with open('carbonate_spot_price.json', 'w', encoding='utf-8') as f:
        json.dump(spot_data, f, ensure_ascii=False, indent=2)
    
    print("✅ 更新完成！")
    print(f"  电池级最新日期：{battery_grade_converted[-1]['date']}，价格：{battery_grade_converted[-1]['price']} 元/吨")
    print(f"  工业级最新日期：{industrial_grade_converted[-1]['date']}，价格：{industrial_grade_converted[-1]['price']} 元/吨")

if __name__ == '__main__':
    main()
