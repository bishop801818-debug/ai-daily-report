#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成热点新闻数据文件
从9个事业部早报中提取"今日关注"新闻，随机抽取5条，生成hot_news_data.json

容错逻辑：
- 检查事业部JSON的"报告时间"字段
- 如果不是今天，则沿用昨天的hot_news_data.json（不覆盖）
- 如果是今天，则生成新数据
"""

import json
import random
import os
from datetime import datetime, date

# 配置
REPORTS_DIR = "D:/trae/AI Daily report/reports"
OUTPUT_FILE = "D:/trae/AI Daily report/hot_news_data.json"
BU_FILES = [
    "01-润滑油事业部.json",
    "02-可兰素事业部.json",
    "03-常州锂源事业部.json",
    "04-龙蟠时代事业部.json",
    "05-山东美多事业部.json",
    "06-三金锂电事业部.json",
    "07-铂源催化事业部.json",
    "08-法恩莱特事业部.json",
    "09-迪克化学事业部.json"
]

def load_bu_data(file_path):
    """加载事业部JSON文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[警告] 无法加载文件 {file_path}: {e}")
        return None

def check_bu_updated(bu_data):
    """
    检查事业部数据是否已更新（报告时间是否是今天）
    返回：(is_updated, report_date_str)
    """
    if not bu_data or not isinstance(bu_data, dict):
        return False, None
    
    report_time = bu_data.get("header", {}).get("报告时间", "")
    if not report_time:
        return False, None
    
    # report_time格式： "2026-05-28"
    try:
        report_date = datetime.strptime(report_time, "%Y-%m-%d").date()
        today = date.today()
        return report_date == today, report_time
    except:
        return False, report_time

def extract_news_items(bu_data):
    """从事业部数据中提取今日关注新闻"""
    if not bu_data or not isinstance(bu_data, dict):
        return []
    
    bu_name = bu_data.get("header", {}).get("事业部", "未知BU")
    today_focus = bu_data.get("sections", {}).get("今日关注", [])
    
    items = []
    for item in today_focus:
        title = item.get("标题", item.get("内容", ""))
        if title:
            items.append({
                "bu": bu_name,
                "title": title
            })
    
    return items

def select_news_evenly(all_items, target_count=5):
    """
    均匀抽取新闻，尽量避免从同一事业部抽取多条
    算法：
    1. 按事业部分组
    2. 每个事业部最多选1条（如果可能）
    3. 随机选择事业部，然后从该事业部随机选1条
    4. 如果选不出足够的条数，允许某些事业部选2条
    """
    if not all_items:
        return []
    
    # 按事业部分组
    bu_groups = {}
    for item in all_items:
        bu = item["bu"]
        if bu not in bu_groups:
            bu_groups[bu] = []
        bu_groups[bu].append(item)
    
    selected = []
    used_bu_counts = {}  # 记录每个事业部已选的条数
    
    # 第一轮：每个事业部最多选1条
    available_bus = list(bu_groups.keys())
    random.shuffle(available_bus)
    
    for bu in available_bus:
        if len(selected) >= target_count:
            break
        if bu_groups[bu]:  # 该事业部有新闻
            item = random.choice(bu_groups[bu])
            selected.append(item)
            used_bu_counts[bu] = 1
    
    # 如果还不够，第二轮：允许某些事业部选2条
    if len(selected) < target_count:
        retry_count = 0
        while len(selected) < target_count and retry_count < 100:
            retry_count += 1
            random.shuffle(available_bus)
            for bu in available_bus:
                if len(selected) >= target_count:
                    break
                # 如果该事业部已选1条，且还有剩余新闻，可以选第2条
                if used_bu_counts.get(bu, 0) < 2 and len(bu_groups[bu]) > used_bu_counts.get(bu, 0):
                    # 选一个未选过的
                    selected_titles = [s["title"] for s in selected if s["bu"] == bu]
                    available_items = [i for i in bu_groups[bu] if i["title"] not in selected_titles]
                    if available_items:
                        item = random.choice(available_items)
                        selected.append(item)
                        used_bu_counts[bu] = used_bu_counts.get(bu, 0) + 1
    
    return selected

def load_existing_data():
    """加载已有的hot_news_data.json（用于容错）"""
    try:
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return None

def main():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 开始生成热点新闻数据...")
    
    # 检查事业部数据是否已更新
    all_updated = True
    updated_count = 0
    for bu_file in BU_FILES:
        file_path = os.path.join(REPORTS_DIR, bu_file)
        bu_data = load_bu_data(file_path)
        if bu_data:
            is_updated, report_time = check_bu_updated(bu_data)
            if is_updated:
                updated_count += 1
                print(f"  [{bu_file}] 已更新 (报告时间: {report_time})")
            else:
                all_updated = False
                print(f"  [{bu_file}] 未更新 (报告时间: {report_time})")
        else:
            all_updated = False
            print(f"  [{bu_file}] 无法加载")
    
    # 容错逻辑：如果不是所有事业部都更新了，沿用昨天的数据
    if not all_updated:
        print(f"[信息] 部分事业部未更新（{updated_count}/{len(BU_FILES)}），沿用昨天的热点新闻数据")
        existing_data = load_existing_data()
        if existing_data:
            print(f"[信息] 已加载昨天的数据 (生成时间: {existing_data.get('generated_at', '未知')})")
            print(f"[信息] 不会覆盖 hot_news_data.json")
            return True  # 成功（但不生成新数据）
        else:
            print(f"[警告] 找不到昨天的数据，将继续尝试生成新数据")
    
    # 读取所有事业部数据
    all_items = []
    for bu_file in BU_FILES:
        file_path = os.path.join(REPORTS_DIR, bu_file)
        bu_data = load_bu_data(file_path)
        if bu_data:
            items = extract_news_items(bu_data)
            print(f"  [{bu_file}] 提取到 {len(items)} 条今日关注新闻")
            all_items.extend(items)
    
    print(f"总计提取到 {len(all_items)} 条今日关注新闻")
    
    # 均匀抽取5条
    selected_items = select_news_evenly(all_items, target_count=5)
    
    if not selected_items:
        print("[错误] 没有找到任何今日关注新闻，使用默认数据")
        selected_items = [{
            "bu": "系统",
            "title": "暂无今日关注数据，请先生成早报"
        }]
    
    print(f"随机抽取到 {len(selected_items)} 条新闻：")
    for i, item in enumerate(selected_items, 1):
        print(f"  {i}. [{item['bu']}] {item['title']}")
    
    # 生成输出数据
    output_data = {
        "generated_at": datetime.now().isoformat(),
        "news": selected_items
    }
    
    # 写入文件
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"数据已写入: {OUTPUT_FILE}")
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
