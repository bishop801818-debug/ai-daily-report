#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新 reports/market_cumulative.json 中电池级碳酸锂和工业级碳酸锂的数据。
从 carbonate_spot_price_merged.json 读取最新数据，重新计算 change_pct。
"""

import json
from datetime import datetime
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def calculate_cumulative(price_series, year=2026):
    """
    计算年初至今涨跌幅
    正确逻辑：2026年第一期数据 → 最新期数据的涨跌幅
    """
    if not price_series or len(price_series) < 2:
        return None
    
    # 找到2026年的数据
    y2026_data = [x for x in price_series if x["date"].startswith(f"{year}-")]
    if not y2026_data:
        print(f"[WARN] 未找到{year}年数据")
        return None
    
    # 按日期排序
    y2026_data.sort(key=lambda x: x["date"])
    
    # 年初价格（第一个数据点的价格）
    start_item = y2026_data[0]
    start_date = start_item["date"]
    start_price = start_item["price"]
    
    # 最新价格（最后一个数据点的价格）
    end_item = y2026_data[-1]
    end_date = end_item["date"]
    end_price = end_item["price"]
    
    # 计算涨跌幅
    change = end_price - start_price
    change_pct = (change / start_price * 100) if start_price != 0 else 0
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "start_price": start_price,
        "end_price": end_price,
        "change": round(change, 2),
        "change_pct": round(change_pct, 2),
        "direction": "up" if change_pct > 0 else ("down" if change_pct < 0 else "stable"),
        "data_points": len(y2026_data),
        "price_series": y2026_data,  # 只保留2026年数据
    }

def main():
    # 1. 读取 carbonate_spot_price_merged.json
    print("正在读取 carbonate_spot_price_merged.json...")
    spot_file = os.path.join(BASE_DIR, "carbonate_spot_price_merged.json")
    with open(spot_file, 'r', encoding='utf-8') as f:
        spot = json.load(f)
    
    battery = spot['data']['battery_grade']
    industrial = spot['data']['industrial_grade']
    
    print(f"电池级最后一条: {battery[-1]}")
    print(f"工业级最后一条: {industrial[-1]}")
    
    # 2. 读取 market_cumulative.json
    print("\n正在读取 reports/market_cumulative.json...")
    cum_file = os.path.join(BASE_DIR, "reports", "market_cumulative.json")
    with open(cum_file, 'r', encoding='utf-8') as f:
        cum = json.load(f)
    
    # 3. 更新电池级碳酸锂（重新计算所有字段）
    bg = None
    for p in cum['products']:
        if '电池级碳酸锂' in p['name']:
            bg = p
            break
    
    if bg:
        # 从 spot 数据生成新的 price_series
        new_price_series = [{'date': d['date'], 'price': d['price']} for d in battery]
        # 重新计算 cumulative
        new_cum = calculate_cumulative(new_price_series, 2026)
        if new_cum:
            # 更新所有字段
            bg['start_date'] = new_cum['start_date']
            bg['start_price'] = new_cum['start_price']
            bg['end_date'] = new_cum['end_date']
            bg['end_price'] = new_cum['end_price']
            bg['change'] = new_cum['change']
            bg['change_pct'] = new_cum['change_pct']
            bg['direction'] = new_cum['direction']
            bg['data_points'] = new_cum['data_points']
            bg['price_series'] = new_cum['price_series']
            print(f"更新电池级碳酸锂: {bg['start_date']} {bg['start_price']} → {bg['end_date']} {bg['end_price']} ({bg['change_pct']:+.2f}%)")
        else:
            print("警告: 电池级碳酸锂重新计算失败")
    else:
        print("警告: 未找到电池级碳酸锂产品")
    
    # 4. 更新工业级碳酸锂（重新计算所有字段）
    ig = None
    for p in cum['products']:
        if '工业级碳酸锂' in p['name']:
            ig = p
            break
    
    if ig:
        # 从 spot 数据生成新的 price_series
        new_price_series = [{'date': d['date'], 'price': d['price']} for d in industrial]
        # 重新计算 cumulative
        new_cum = calculate_cumulative(new_price_series, 2026)
        if new_cum:
            # 更新所有字段
            ig['start_date'] = new_cum['start_date']
            ig['start_price'] = new_cum['start_price']
            ig['end_date'] = new_cum['end_date']
            ig['end_price'] = new_cum['end_price']
            ig['change'] = new_cum['change']
            ig['change_pct'] = new_cum['change_pct']
            ig['direction'] = new_cum['direction']
            ig['data_points'] = new_cum['data_points']
            ig['price_series'] = new_cum['price_series']
            print(f"更新工业级碳酸锂: {ig['start_date']} {ig['start_price']} → {ig['end_date']} {ig['end_price']} ({ig['change_pct']:+.2f}%)")
        else:
            print("警告: 工业级碳酸锂重新计算失败")
    else:
        print("警告: 未找到工业级碳酸锂产品")
    
    # 5. 更新元数据
    now = datetime.now()
    cum['meta']['update_time'] = now.strftime("%Y-%m-%d %H:%M:%S")
    cum['meta']['data_source'] = "carbonate_spot_price_merged.json"
    
    # 6. 写回文件
    print("\n正在写回 reports/market_cumulative.json...")
    with open(cum_file, 'w', encoding='utf-8') as f:
        json.dump(cum, f, ensure_ascii=False, indent=2)
    
    print("✅ market_cumulative.json 更新完成")

if __name__ == '__main__':
    main()
