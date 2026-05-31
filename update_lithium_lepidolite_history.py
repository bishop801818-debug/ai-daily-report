#!/usr/bin/env python3
"""
将 fetch_lithium_ore_price.py 抓取的最新数据合并到历史数据文件中
输入: data/lithium_ore_price.json
输出: data/lithium_ore_price_history.json, data/lepidolite_price_history.json
"""

import json
import os
import re
import sys
from datetime import datetime


def load_json(path):
    """加载 JSON 文件"""
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(data, path):
    """保存 JSON 文件，跳过备份（避免权限问题）"""
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def update_spodumene_history(latest_data, history_path):
    """将锂辉石抓取数据合并到历史文件"""
    if not os.path.exists(history_path):
        print(f"[ERROR] 锂辉石历史文件不存在: {history_path}")
        return 0
    
    history = load_json(history_path)
    existing_entries = history.get('history', [])
    
    # 提取抓取数据中的日期
    scrape_date = None
    if latest_data.get('data'):
        first_record = latest_data['data'][0]
        raw_date = first_record.get('update_time', '')
        # 提取 YYYY-MM-DD 部分
        match = re.match(r'(\d{4}-\d{2}-\d{2})', str(raw_date))
        if match:
            scrape_date = match.group(1)
    
    if not scrape_date:
        scrape_date = datetime.now().strftime('%Y-%m-%d')
        # 检查是否是工作日（周一=0，周日=6；周六=5，周日=6）
        weekday = datetime.now().weekday()
        if weekday >= 5:  # 5=周六，6=周日
            print(f"[WARN] 未从数据中提取到日期，且今天是非工作日(周{weekday})，跳过更新")
            return 0
        print(f"[WARN] 未从数据中提取到日期，使用当前日期: {scrape_date}")
    
    # 检查该日期是否已存在
    existing_dates = set()
    for e in existing_entries:
        existing_dates.add(e.get('date', ''))
    
    added_count = 0
    for record in latest_data.get('data', []):
        grade = record.get('grade', '')
        origin = record.get('origin', '')
        min_price = record.get('min_price', 0)
        max_price = record.get('max_price', 0)
        avg_price = record.get('avg_price', 0)
        
        # 检查是否重复（同日期+同品位+同产地）
        is_duplicate = False
        for e in existing_entries:
            if (e.get('date') == scrape_date and
                e.get('grade') == grade and
                e.get('origin') == origin):
                is_duplicate = True
                break
        
        if is_duplicate:
            continue
        
        new_entry = {
            "date": scrape_date,
            "grade": grade,
            "origin": origin,
            "min_price": min_price,
            "max_price": max_price,
            "avg_price": avg_price
        }
        existing_entries.append(new_entry)
        added_count += 1
    
    if added_count > 0:
        history['history'] = existing_entries
        history['update_time'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        save_json(history, history_path)
        print(f"[INFO] 锂辉石历史: 添加 {added_count} 条 ({scrape_date}), 总数 {len(existing_entries)}")
    else:
        print(f"[INFO] 锂辉石历史: 日期 {scrape_date} 的数据已存在，跳过")
    
    return added_count


def normalize_price(price):
    """统一价格单位为元/吨。
    如果价格 < 10，认为是万元/吨，转换为元/吨（乘以10000）；
    否则保持为元/吨不变。"""
    if price is None:
        return 0
    p = float(price)
    if p < 10:
        return round(p * 10000, 2)
    return round(p, 2)


def update_lepidolite_history(latest_data, history_path):
    """将锂云母抓取数据合并到历史文件"""
    if not os.path.exists(history_path):
        print(f"[ERROR] 锂云母历史文件不存在: {history_path}")
        return 0
    
    history = load_json(history_path)
    existing_entries = history.get('history', [])
    
    # 提取日期
    scrape_date = None
    if latest_data.get('data'):
        first_record = latest_data['data'][0]
        raw_date = first_record.get('update_time', '')
        match = re.match(r'(\d{4}-\d{2}-\d{2})', str(raw_date))
        if match:
            scrape_date = match.group(1)
    
    if not scrape_date:
        scrape_date = datetime.now().strftime('%Y-%m-%d')
        # 检查是否是工作日（周一=0，周日=6；周六=5，周日=6）
        weekday = datetime.now().weekday()
        if weekday >= 5:  # 5=周六，6=周日
            print(f"[WARN] 未从数据中提取到日期，且今天是非工作日(周{weekday})，跳过更新")
            return 0
        print(f"[WARN] 未从数据中提取到日期，使用当前日期: {scrape_date}")
    
    # 检查日期是否已存在
    existing_dates = set()
    for e in existing_entries:
        existing_dates.add(e.get('date', ''))
    
    added_count = 0
    for record in latest_data.get('data', []):
        # 只保留2.5%品种
        grade = record.get('grade', '')
        if '2.5%' not in grade:
            continue
        # 判断数据格式：表格格式 vs 指数格式
        if 'min_price' in record and 'max_price' in record and 'avg_price' in record:
            # 表格格式：统一转换为元/吨
            origin = record.get('origin', '')
            min_price = normalize_price(record['min_price'])
            max_price = normalize_price(record['max_price'])
            avg_price = normalize_price(record['avg_price'])
            
            # 构建 grade 标识
            grade_label = f"锂云母精矿{grade}" if not grade.startswith('锂云母') else grade
            
            is_duplicate = any(
                e.get('date') == scrape_date and e.get('grade') == grade_label
                for e in existing_entries
            )
            if is_duplicate:
                continue
            
            new_entry = {
                "date": scrape_date,
                "grade": grade_label,
                "origin": origin,
                "min_price": min_price,
                "max_price": max_price,
                "avg_price": avg_price,
                "unit": "元/吨"
            }
            existing_entries.append(new_entry)
            added_count += 1
            
        elif 'price' in record:
            # 指数格式：需要从 product_name 提取品位，转换价格
            product_name = record.get('product_name', '')
            price = record.get('price', 0)
            
            # 从 product_name 提取品位百分比
            # 格式: "锂云母精矿：2-2.5%Li：市场价格：中华人民共和国（日度）"
            grade_match = re.search(r'([\d.]+)[-~]?([\d.]*)\s*%', product_name)
            if grade_match:
                # 取品位的上限值（如 "2-2.5%" → 2.5）
                if grade_match.group(2):
                    grade_pct = float(grade_match.group(2))
                else:
                    grade_pct = float(grade_match.group(1))
                grade_label = f"锂云母精矿{grade_pct}%"
                
                # 只保留2.5%品种
                if grade_pct != 2.5:
                    continue
                
                # 转换公式: 元/吨 = 元/吨度 × 品位%
                converted_price = round(price * grade_pct, 2)
                
                is_duplicate = any(
                    e.get('date') == scrape_date and e.get('grade') == grade_label
                    for e in existing_entries
                )
                if is_duplicate:
                    continue
                
                new_entry = {
                    "date": scrape_date,
                    "grade": grade_label,
                    "origin": "",
                    "min_price": converted_price,
                    "max_price": converted_price,
                    "avg_price": converted_price
                }
                existing_entries.append(new_entry)
                added_count += 1
            else:
                print(f"[WARN] 无法从产品名提取品位: {product_name}")
                # fallback: 尝试提取任何数字
                grade_match2 = re.search(r'(\d+\.?\d*)\s*%', record.get('grade', product_name))
                if not grade_match2:
                    continue
                grade_pct = float(grade_match2.group(1))
                # ... same logic as above but simplified
    
    if added_count > 0:
        history['history'] = existing_entries
        history['update_time'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        save_json(history, history_path)
        print(f"[INFO] 锂云母历史: 添加 {added_count} 条 ({scrape_date}), 总数 {len(existing_entries)}")
    else:
        print(f"[INFO] 锂云母历史: 日期 {scrape_date} 的数据已存在，跳过")
    
    return added_count


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, "data")
    
    # 读取最新抓取数据
    latest_path = os.path.join(data_dir, "lithium_ore_price.json")
    if not os.path.exists(latest_path):
        print(f"[ERROR] 最新数据文件不存在: {latest_path}")
        return 1
    
    latest_all = load_json(latest_path)
    
    # 按 commodity 分类
    spodumene_data = None
    lepidolite_data = None
    for item in latest_all:
        if item.get('commodity') == '锂辉石':
            spodumene_data = item
        elif item.get('commodity') == '锂云母':
            lepidolite_data = item
    
    total_added = 0
    
    # 更新锂辉石历史
    if spodumene_data:
        spodumene_history_path = os.path.join(data_dir, "lithium_ore_price_history.json")
        count = update_spodumene_history(spodumene_data, spodumene_history_path)
        total_added += count
    else:
        print("[WARN] 未找到锂辉石数据")
    
    # 更新锂云母历史
    if lepidolite_data:
        lepidolite_history_path = os.path.join(data_dir, "lepidolite_price_history.json")
        count = update_lepidolite_history(lepidolite_data, lepidolite_history_path)
        total_added += count
    else:
        print("[WARN] 未找到锂云母数据")
    
    print(f"\n[INFO] 完成：共添加 {total_added} 条记录")
    return 0


if __name__ == '__main__':
    exit(main())
