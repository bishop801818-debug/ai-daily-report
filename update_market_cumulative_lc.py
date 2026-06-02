#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新 reports/market_cumulative.json 中电池级碳酸锂和工业级碳酸锂的 price_series。
从 carbonate_spot_price.json 读取最新数据。
"""

import json
from datetime import datetime

def main():
    # 读取更新后的 carbonate_spot_price.json
    print("正在读取 carbonate_spot_price.json...")
    with open('carbonate_spot_price.json', 'r', encoding='utf-8') as f:
        spot = json.load(f)
    
    battery = spot['data']['battery_grade']
    industrial = spot['data']['industrial_grade']
    
    print(f"电池级最后一条: {battery[-1]}")
    print(f"工业级最后一条: {industrial[-1]}")
    
    # 读取 market_cumulative.json
    print("\n正在读取 reports/market_cumulative.json...")
    with open('reports/market_cumulative.json', 'r', encoding='utf-8') as f:
        cum = json.load(f)
    
    # 更新电池级碳酸锂
    bg = None
    for p in cum['products']:
        if '电池级碳酸锂' in p['name']:
            bg = p
            break
    
    if bg:
        bg['end_date'] = battery[-1]['date']
        bg['end_price'] = battery[-1]['price']
        # 更新 price_series
        bg['price_series'] = [{'date': d['date'], 'price': d['price'], 'low': d.get('low'), 'high': d.get('high')} for d in battery]
        print(f"更新电池级碳酸锂: {bg['end_date']} {bg['end_price']}")
    else:
        print("警告: 未找到电池级碳酸锂产品")
    
    # 更新工业级碳酸锂
    ig = None
    for p in cum['products']:
        if '工业级碳酸锂' in p['name']:
            ig = p
            break
    
    if ig:
        ig['end_date'] = industrial[-1]['date']
        ig['end_price'] = industrial[-1]['price']
        ig['price_series'] = [{'date': d['date'], 'price': d['price'], 'low': d.get('low'), 'high': d.get('high')} for d in industrial]
        print(f"更新工业级碳酸锂: {ig['end_date']} {ig['end_price']}")
    else:
        print("警告: 未找到工业级碳酸锂产品")
    
    # 写回
    print("\n正在写回 reports/market_cumulative.json...")
    with open('reports/market_cumulative.json', 'w', encoding='utf-8') as f:
        json.dump(cum, f, ensure_ascii=False, indent=2)
    
    print("✅ market_cumulative.json 更新完成")

if __name__ == '__main__':
    main()
