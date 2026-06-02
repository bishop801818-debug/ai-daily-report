#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新/生成 market_cumulative.json - 磷酸铁锂产业链2026年累计涨跌幅
策略：读取现有文件，只更新能处理的产品，保留其他产品不变
数据源：carbonate_spot_price_merged.json（电池级/工业级碳酸锂）、lc_futures_history.json（碳酸锂期货）
计算方式：2026年第一期数据 → 最新期数据的涨跌幅
"""

import json, datetime, sys, os, math

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 价格合理性验证规则（防止写入异常数据）
PRICE_VALIDATION = {
    "电池级碳酸锂": {"min": 80000, "max": 300000, "unit": "元/吨"},
    "工业级碳酸锂": {"min": 70000, "max": 250000, "unit": "元/吨"},
    "碳酸锂期货": {"min": 80000, "max": 300000, "unit": "元/吨"},
    "磷酸铁锂动力型": {"min": 30000, "max": 150000, "unit": "元/吨"},
    "磷酸铁锂储能型": {"min": 30000, "max": 150000, "unit": "元/吨"},
    "磷酸铁": {"min": 8000, "max": 40000, "unit": "元/吨"},
    "锂辉石": {"min": 300, "max": 3000, "unit": "元/吨度"},
    "锂云母": {"min": 2000, "max": 20000, "unit": "元/吨"},
}

def validate_price(name, price):
    """验证价格是否在合理范围内，返回 (is_valid, message)"""
    for key, rule in PRICE_VALIDATION.items():
        if key in name:
            if price < rule["min"] or price > rule["max"]:
                return False, f"价格 {price} 超出合理范围 [{rule['min']}, {rule['max']}] ({rule['unit']})"
            return True, "OK"
    # 未找到匹配规则，不验证
    return True, "NO_RULE"

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

def update_product(products, name_key, new_cum):
    """更新products列表中匹配name_key的产品，返回是否成功"""
    # 验证价格合理性
    start_valid, start_msg = validate_price(name_key, new_cum['start_price'])
    end_valid, end_msg = validate_price(name_key, new_cum['end_price'])
    
    if not start_valid:
        print(f"  ❌ 拒绝更新 {name_key}：起始价格异常 - {start_msg}")
        return False
    if not end_valid:
        print(f"  ❌ 拒绝更新 {name_key}：结束价格异常 - {end_msg}")
        return False
    
    for p in products:
        if name_key in p['name']:
            # 更新所有字段
            p['start_date'] = new_cum['start_date']
            p['start_price'] = new_cum['start_price']
            p['end_date'] = new_cum['end_date']
            p['end_price'] = new_cum['end_price']
            p['change'] = new_cum['change']
            p['change_pct'] = new_cum['change_pct']
            p['direction'] = new_cum['direction']
            p['data_points'] = new_cum['data_points']
            p['price_series'] = new_cum['price_series']
            return True
    return False

def main():
    print("=" * 60)
    print("更新 market_cumulative.json - 磷酸铁锂产业链2026年累计涨跌幅")
    print("=" * 60)
    
    # 1. 读取现有文件（如果存在）
    cum_file = os.path.join(BASE_DIR, "reports", "market_cumulative.json")
    if os.path.exists(cum_file):
        with open(cum_file, 'r', encoding='utf-8') as f:
            cum_data = json.load(f)
        products = cum_data['products']
        print(f"已读取现有文件，共 {len(products)} 个产品")
    else:
        products = []
        cum_data = {
            "meta": {
                "description": "2026年至今累计涨跌幅",
                "data_source": "",
                "update_time": "",
                "year": 2026,
            },
            "products": products,
        }
        print("现有文件不存在，将创建新文件")
    
    updated_count = 0
    
    # 2. 更新碳酸锂期货（从 lc_futures_history.json）
    print("\n[1/3] 处理碳酸锂期货...")
    lc_file = os.path.join(BASE_DIR, "lc_futures_history.json")
    if os.path.exists(lc_file):
        with open(lc_file, 'r', encoding='utf-8') as f:
            lc_data = json.load(f)
        if 'data' in lc_data:
            price_series = [{"date": d["date"], "price": d["close"]} for d in lc_data["data"]]
            new_cum = calculate_cumulative(price_series, 2026)
            if new_cum:
                if update_product(products, "碳酸锂期货", new_cum):
                    print(f"  ✅ 更新碳酸锂期货: {new_cum['start_date']} {new_cum['start_price']} → {new_cum['end_date']} {new_cum['end_price']} ({new_cum['change_pct']:+.2f}%)")
                else:
                    products.append({
                        "name": "碳酸锂期货",
                        "unit": "元/吨",
                        **new_cum,
                    })
                    print(f"  ✅ 新增碳酸锂期货: {new_cum['start_date']} {new_cum['start_price']} → {new_cum['end_date']} {new_cum['end_price']} ({new_cum['change_pct']:+.2f}%)")
                updated_count += 1
            else:
                print("  ⚠️ 碳酸锂期货计算失败")
        else:
            print("  ⚠️ lc_futures_history.json 格式错误")
    else:
        print(f"  ⚠️ 未找到 {lc_file}")
    
    # 3. 更新电池级碳酸锂（从 carbonate_spot_price_merged.json）
    print("\n[2/3] 处理电池级碳酸锂...")
    spot_file = os.path.join(BASE_DIR, "carbonate_spot_price_merged.json")
    if os.path.exists(spot_file):
        with open(spot_file, 'r', encoding='utf-8') as f:
            spot_data = json.load(f)
        if 'data' in spot_data and 'battery_grade' in spot_data['data']:
            battery_data = spot_data['data']['battery_grade']
            price_series = [{"date": d["date"], "price": d["price"]} for d in battery_data]
            new_cum = calculate_cumulative(price_series, 2026)
            if new_cum:
                if update_product(products, "电池级碳酸锂", new_cum):
                    print(f"  ✅ 更新电池级碳酸锂: {new_cum['start_date']} {new_cum['start_price']} → {new_cum['end_date']} {new_cum['end_price']} ({new_cum['change_pct']:+.2f}%)")
                else:
                    products.append({
                        "name": "电池级碳酸锂",
                        "unit": "元/吨",
                        **new_cum,
                    })
                    print(f"  ✅ 新增电池级碳酸锂: {new_cum['start_date']} {new_cum['start_price']} → {new_cum['end_date']} {new_cum['end_price']} ({new_cum['change_pct']:+.2f}%)")
                updated_count += 1
            else:
                print("  ⚠️ 电池级碳酸锂计算失败")
        else:
            print("  ⚠️ carbonate_spot_price_merged.json 格式错误（无battery_grade）")
    else:
        print(f"  ⚠️ 未找到 {spot_file}")
    
    # 4. 更新工业级碳酸锂（从 carbonate_spot_price_merged.json）
    print("\n[3/3] 处理工业级碳酸锂...")
    if os.path.exists(spot_file):
        # 重新读取（可能已经被修改）
        with open(spot_file, 'r', encoding='utf-8') as f:
            spot_data = json.load(f)
        if 'data' in spot_data and 'industrial_grade' in spot_data['data']:
            industrial_data = spot_data['data']['industrial_grade']
            price_series = [{"date": d["date"], "price": d["price"]} for d in industrial_data]
            new_cum = calculate_cumulative(price_series, 2026)
            if new_cum:
                if update_product(products, "工业级碳酸锂", new_cum):
                    print(f"  ✅ 更新工业级碳酸锂: {new_cum['start_date']} {new_cum['start_price']} → {new_cum['end_date']} {new_cum['end_price']} ({new_cum['change_pct']:+.2f}%)")
                else:
                    products.append({
                        "name": "工业级碳酸锂",
                        "unit": "元/吨",
                        **new_cum,
                    })
                    print(f"  ✅ 新增工业级碳酸锂: {new_cum['start_date']} {new_cum['start_price']} → {new_cum['end_date']} {new_cum['end_price']} ({new_cum['change_pct']:+.2f}%)")
                updated_count += 1
            else:
                print("  ⚠️ 工业级碳酸锂计算失败")
        else:
            print("  ⚠️ carbonate_spot_price_merged.json 格式错误（无industrial_grade）")
    
    # 5. 更新元数据和保存
    now = datetime.datetime.now()
    cum_data['meta']['update_time'] = now.strftime("%Y-%m-%d %H:%M:%S")
    cum_data['meta']['data_source'] = "carbonate_spot_price_merged.json / lc_futures_history.json"
    cum_data['meta']['generated_at'] = now.isoformat()  # ISO时间戳，用于检测回滚
    cum_data['meta']['generator_version'] = "20260602_v2"  # 脚本版本，升级时修改
    cum_data['products'] = products
    
    # 写入文件
    os.makedirs(os.path.dirname(cum_file), exist_ok=True)
    with open(cum_file, "w", encoding="utf-8") as f:
        json.dump(cum_data, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 60)
    print(f"✅ 已更新 {cum_file}")
    print(f"   共 {len(products)} 个产品，本次更新 {updated_count} 个")
    print(f"   更新时间: {cum_data['meta']['update_time']}")
    print("=" * 60)

if __name__ == "__main__":
    main()
