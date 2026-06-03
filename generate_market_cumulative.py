#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成/更新 market_cumulative.json - 磷酸铁锂产业链2026年累计涨跌幅
策略：从各产品源数据文件重新生成所有8个产品的 price_series 和汇总字段
防回滚：检查 meta.generated_at，如果过期则强制重新生成
"""

import json, datetime, sys, os, math

# 产品配置：源数据文件和读取方式
# reader 函数从源数据中提取 [{date, price}] 列表
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
DATA_DIR = os.path.join(BASE_DIR, "data")

PRODUCT_CONFIG = {
    "碳酸锂期货": {
        "source_file": os.path.join(REPORTS_DIR, "lc_futures_history.json"),
        "unit": "元/吨",
        "reader": lambda data: [{"date": d["date"], "price": d["close"]} for d in data.get("history", [])],
    },
    "电池级碳酸锂": {
        "source_file": os.path.join(BASE_DIR, "carbonate_spot_price_merged.json"),
        "unit": "元/吨",
        "reader": lambda data: [{"date": d["date"], "price": d["price"]} for d in data.get("data", {}).get("battery_grade", [])],
    },
    "工业级碳酸锂": {
        "source_file": os.path.join(BASE_DIR, "carbonate_spot_price_merged.json"),
        "unit": "元/吨",
        "reader": lambda data: [{"date": d["date"], "price": d["price"]} for d in data.get("data", {}).get("industrial_grade", [])],
    },
    "磷酸铁锂(动力型)": {
        "source_file": os.path.join(REPORTS_DIR, "lfp_power_history.json"),
        "unit": "元/吨",
        "reader": lambda data: [{"date": e["date"], "price": e["close"]} for e in data.get("history", [])],
    },
    "磷酸铁锂(储能型)": {
        "source_file": os.path.join(REPORTS_DIR, "lfp_storage_history.json"),
        "unit": "元/吨",
        "reader": lambda data: [{"date": e["date"], "price": e["close"]} for e in data.get("history", [])],
    },
    "磷酸铁": {
        "source_file": os.path.join(REPORTS_DIR, "iron_phosphate_history.json"),
        "unit": "元/吨",
        "reader": lambda data: [{"date": e["date"], "price": e["close"]} for e in data.get("history", [])],
    },
    "锂辉石(5%)": {
        "source_file": os.path.join(DATA_DIR, "lithium_ore_price_history.json"),
        "unit": "美元/吨",
        "reader": lambda data: [{"date": e["date"], "price": e["avg_price"]} for e in data.get("history", []) if str(e.get("grade", "")).startswith("5")],
    },
    "锂云母(2.0-2.5%)": {
        "source_file": os.path.join(DATA_DIR, "lepidolite_price_history.json"),
        "unit": "元/吨",
        "reader": lambda data: [{"date": e["date"], "price": e["avg_price"]} for e in data.get("history", []) if "2.0-2.5%" in str(e.get("grade", "")) or "2.5%" in str(e.get("grade", ""))],
    },
}

# 价格合理性验证规则（防止写入异常数据）
PRICE_VALIDATION = {
    "碳酸锂": {"min": 80000, "max": 300000},
    "磷酸铁锂": {"min": 30000, "max": 150000},
    "磷酸铁": {"min": 8000, "max": 40000},
    "锂辉石": {"min": 500, "max": 5000},
    "锂云母": {"min": 2000, "max": 20000},
}

def validate_price(name, price):
    """验证价格是否在合理范围内，返回 (is_valid, message)"""
    for key, rule in PRICE_VALIDATION.items():
        if key in name:
            if price < rule["min"] or price > rule["max"]:
                return False, f"价格 {price} 超出合理范围 [{rule['min']}, {rule['max']}]"
            return True, "OK"
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
    print("=" * 60)
    print("生成 market_cumulative.json - 磷酸铁锂产业链2026年累计涨跌幅")
    print("=" * 60)
    
    cum_file = os.path.join(REPORTS_DIR, "market_cumulative.json")
    
    # 0. 防回滚检查：如果文件存在，检查 generated_at 是否过期
    rollback_warning = False
    if os.path.exists(cum_file):
        with open(cum_file, 'r', encoding='utf-8') as f:
            old_data = json.load(f)
        old_meta = old_data.get('meta', {})
        old_generated_at = old_meta.get('generated_at', '')
        if old_generated_at:
            try:
                old_time = datetime.datetime.fromisoformat(old_generated_at)
                age_hours = (datetime.datetime.now() - old_time).total_seconds() / 3600
                if age_hours > 48:  # 超过48小时，可能是回滚版本
                    print(f"⚠️  警告：文件 generated_at={old_generated_at}，已过期 {age_hours:.1f} 小时")
                    print(f"   这可能是回滚版本，将强制重新生成所有产品数据")
                    rollback_warning = True
            except:
                pass
    
    # 1. 读取现有文件（如果存在且未过期）
    if os.path.exists(cum_file) and not rollback_warning:
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
        print("将创建新文件（或强制重新生成）")
    
    updated_count = 0
    error_count = 0
    
    # 2. 处理所有8个产品
    for i, (name, config) in enumerate(PRODUCT_CONFIG.items(), 1):
        print(f"\n[{i}/8] 处理 {name}...")
        
        source_file = config["source_file"]
        if not os.path.exists(source_file):
            print(f"  ⚠️  源文件不存在: {source_file}")
            error_count += 1
            continue
        
        try:
            with open(source_file, 'r', encoding='utf-8') as f:
                source_data = json.load(f)
        except Exception as e:
            print(f"  ❌ 读取源文件失败: {e}")
            error_count += 1
            continue
        
        # 读取价格序列
        try:
            price_series = config["reader"](source_data)
        except Exception as e:
            print(f"  ❌ 读取价格序列失败: {e}")
            error_count += 1
            continue
        
        if not price_series:
            print(f"  ⚠️  价格序列为空")
            error_count += 1
            continue
        
        # 计算累计涨跌幅
        new_cum = calculate_cumulative(price_series, 2026)
        if not new_cum:
            print(f"  ⚠️  计算失败（数据不足）")
            error_count += 1
            continue
        
        # 验证价格合理性
        start_valid, start_msg = validate_price(name, new_cum['start_price'])
        end_valid, end_msg = validate_price(name, new_cum['end_price'])
        
        if not start_valid:
            print(f"  ❌ 拒绝更新 {name}：起始价格异常 - {start_msg}")
            error_count += 1
            continue
        if not end_valid:
            print(f"  ❌ 拒绝更新 {name}：结束价格异常 - {end_msg}")
            error_count += 1
            continue
        
        # 更新或新增产品
        existing = next((p for p in products if p['name'] == name), None)
        if existing:
            # 更新所有字段
            existing['start_date'] = new_cum['start_date']
            existing['start_price'] = new_cum['start_price']
            existing['end_date'] = new_cum['end_date']
            existing['end_price'] = new_cum['end_price']
            existing['change'] = new_cum['change']
            existing['change_pct'] = new_cum['change_pct']
            existing['direction'] = new_cum['direction']
            existing['data_points'] = new_cum['data_points']
            existing['price_series'] = new_cum['price_series']
            existing['unit'] = config['unit']
            print(f"  ✅ 更新: {new_cum['start_date']} {new_cum['start_price']} → {new_cum['end_date']} {new_cum['end_price']} ({new_cum['change_pct']:+.2f}%)")
        else:
            # 新增
            products.append({
                "name": name,
                "unit": config['unit'],
                **new_cum,
            })
            print(f"  ✅ 新增: {new_cum['start_date']} {new_cum['start_price']} → {new_cum['end_date']} {new_cum['end_price']} ({new_cum['change_pct']:+.2f}%)")
        
        updated_count += 1
    
    # 清理：删除不在 PRODUCT_CONFIG 中的旧产品（如旧的"锂云母(1.8%)"）
    valid_names = set(PRODUCT_CONFIG.keys())
    old_products = [p for p in products if p['name'] not in valid_names]
    if old_products:
        print(f"\n🗑️  清理 {len(old_products)} 个旧产品: {[p['name'] for p in old_products]}")
        products = [p for p in products if p['name'] in valid_names]
    
    # 3. 更新元数据和保存
    now = datetime.datetime.now()
    cum_data['meta']['update_time'] = now.strftime("%Y-%m-%d %H:%M:%S")
    cum_data['meta']['data_source'] = "各产品源数据文件"
    cum_data['meta']['generated_at'] = now.isoformat()
    cum_data['meta']['generator_version'] = "20260603_v4"
    cum_data['products'] = products
    
    # 写入文件
    os.makedirs(os.path.dirname(cum_file), exist_ok=True)
    with open(cum_file, "w", encoding="utf-8") as f:
        json.dump(cum_data, f, ensure_ascii=False, indent=2)
    
    print("\n" + "=" * 60)
    print(f"✅ 已更新 {cum_file}")
    print(f"   共 {len(products)} 个产品，本次更新 {updated_count} 个，错误 {error_count} 个")
    print(f"   更新时间: {cum_data['meta']['update_time']}")
    print("=" * 60)

if __name__ == "__main__":
    main()
