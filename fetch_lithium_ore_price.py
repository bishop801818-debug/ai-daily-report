#!/usr/bin/env python3
"""
从我的钢铁网（Mysteel）抓取锂辉石和锂云母价格数据
输出: data/lithium_ore_price.json
"""

import requests
import json
import csv
import re
import os
from datetime import datetime
from bs4 import BeautifulSoup


def fetch_spodumene_data():
    """从 Mysteel 锂辉石页面抓取价格表格数据"""
    url = "https://list1.m.mysteel.com/zhishi/lhsjgxt.html"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    resp = requests.get(url, headers=headers, timeout=30)
    resp.encoding = 'utf-8'
    soup = BeautifulSoup(resp.text, 'lxml')
    
    # 提取数据日期（页面标注的最新行情日期）
    date_text = ""
    h3_spans = soup.select('h3 span')
    for span in h3_spans:
        match = re.search(r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})', span.get_text())
        if match:
            date_text = match.group(1)
            break
    
    # 如果没有从 h3 找到日期，尝试从 span.update 获取
    if not date_text:
        update_span = soup.find('span', class_='update')
        if update_span:
            match = re.search(r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})', update_span.get_text())
            if match:
                date_text = match.group(1)
    
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # 找价格表格（品名/品位/港口/最低价/最高价/中间价/走势）
    table = None
    for t in soup.find_all('table'):
        th_texts = [th.get_text(strip=True) for th in t.find_all('th')]
        if '品名' in th_texts and ('港口' in th_texts or '产地' in th_texts):
            table = t
            break
    
    if not table:
        print("[WARN] 未找到锂辉石价格表格")
        return None
    
    data = []
    tbody = table.find('tbody')
    if not tbody:
        print("[WARN] 锂辉石表格无 tbody")
        return None
    
    for row in tbody.find_all('tr'):
        cols = row.find_all('td')
        if len(cols) < 6:
            continue
        
        def get_text(td):
            """提取 td 内纯文本，滤掉嵌套标签"""
            spans = td.find_all('span')
            if spans:
                return ''.join(s.get_text(strip=True) for s in spans)
            links = td.find_all('a')
            if links:
                return ''.join(a.get_text(strip=True) for a in links)
            return td.get_text(strip=True)
        
        product_name = get_text(cols[0])
        grade = get_text(cols[1])
        origin = get_text(cols[2])
        min_price = get_text(cols[3])
        max_price = get_text(cols[4])
        avg_price = get_text(cols[5])
        
        if not product_name or not min_price:
            continue
        
        try:
            min_price = int(min_price)
            max_price = int(max_price)
            avg_price = int(avg_price)
        except (ValueError, TypeError):
            continue
        
        data.append({
            "product_name": product_name,
            "grade": grade,
            "origin": origin,
            "min_price": min_price,
            "max_price": max_price,
            "avg_price": avg_price,
            "unit": "美元/吨",
            "update_time": date_text if date_text else now_str
        })
    
    if not data:
        print("[WARN] 锂辉石表格未提取到有效数据行")
        return None
    
    return {
        "commodity": "锂辉石",
        "source": "Mysteel",
        "url": url,
        "scrape_time": now_str,
        "data": data
    }


def fetch_lepidolite_data():
    """从 Mysteel 锂云母页面抓取价格表格数据（优先），如无表格则抓取指数区"""
    url = "https://list1.m.mysteel.com/zhishi/liyunmujiage.html"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    resp = requests.get(url, headers=headers, timeout=30)
    resp.encoding = 'utf-8'
    soup = BeautifulSoup(resp.text, 'lxml')
    
    # 提取页面日期
    date_text = ""
    h3_spans = soup.select('h3 span')
    for span in h3_spans:
        match = re.search(r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})', span.get_text())
        if match:
            date_text = match.group(1)
            break
    if not date_text:
        update_span = soup.find('span', class_='update')
        if update_span:
            match = re.search(r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})', update_span.get_text())
            if match:
                date_text = match.group(1)
    
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    data = []
    
    # 优先尝试抓取价格表格（和锂辉石一致，有min/max/avg）
    table = None
    for t in soup.find_all('table'):
        th_texts = [th.get_text(strip=True) for th in t.find_all('th')]
        if '品名' in th_texts and ('最低价' in th_texts or '中间价' in th_texts):
            table = t
            break
    
    if table:
        tbody = table.find('tbody')
        if tbody:
            for row in tbody.find_all('tr'):
                cols = row.find_all('td')
                if len(cols) < 6:
                    continue
                
                def get_text(td):
                    spans = td.find_all('span')
                    if spans:
                        return ''.join(s.get_text(strip=True) for s in spans)
                    return td.get_text(strip=True)
                
                product_name = get_text(cols[0])
                grade = get_text(cols[1])
                origin = get_text(cols[2])
                min_price = get_text(cols[3])
                max_price = get_text(cols[4])
                avg_price = get_text(cols[5])
                
                if not product_name or not min_price:
                    continue
                
                try:
                    min_price = int(min_price)
                    max_price = int(max_price)
                    avg_price = int(avg_price)
                except (ValueError, TypeError):
                    continue
                
                data.append({
                    "product_name": product_name,
                    "grade": grade,
                    "origin": origin,
                    "min_price": min_price,
                    "max_price": max_price,
                    "avg_price": avg_price,
                    "unit": "元/吨",
                    "update_time": date_text if date_text else now_str
                })
    
    # 如果表格没找到，回退到指数区（scroll-price-list）
    if not data:
        scroll_list = soup.find('ul', class_='scroll-price-list')
        if scroll_list:
            for li in scroll_list.find_all('li'):
                strong = li.find('strong', class_='scroll-price-name')
                if not strong:
                    continue
                name = strong.get_text(strip=True)
                if '锂云母精矿' not in name:
                    continue
                
                price_span = li.find('span', class_='today-price')
                if not price_span:
                    continue
                price_str = price_span.get_text(strip=True).replace(',', '')
                try:
                    price_val = float(price_str)
                except ValueError:
                    continue
                
                trend_val = "0.00"
                trend_em = li.find('em', class_='trend-value')
                if trend_em:
                    trend_text = trend_em.get_text(strip=True)
                    trend_match = re.match(r'\(([+\-]?[\d.]+)\)', trend_text)
                    if trend_match:
                        trend_val = trend_match.group(1)
                
                data.append({
                    "product_name": name,
                    "price": price_val,
                    "trend": f"({trend_val})",
                    "unit": "元/吨度",
                    "update_time": date_text if date_text else now_str
                })
                break
    
    if not data:
        print("[WARN] 锂云母数据未提取到有效数据")
        return None
    
    return {
        "commodity": "锂云母",
        "source": "Mysteel",
        "url": url,
        "scrape_time": now_str,
        "data": data
    }


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "data")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "lithium_ore_price.json")
    
    results = []
    
    # 抓取锂辉石数据
    print("[INFO] 正在抓取锂辉石价格数据...")
    spodumene = fetch_spodumene_data()
    if spodumene:
        print(f"[INFO] 锂辉石: 抓到 {len(spodumene['data'])} 条数据")
        print(f"[INFO] 数据日期: {spodumene['data'][0]['update_time'] if spodumene['data'] else 'N/A'}")
        results.append(spodumene)
    else:
        print("[ERROR] 锂辉石数据抓取失败")
    
    # 抓取锂云母数据
    print("[INFO] 正在抓取锂云母价格数据...")
    lepidolite = fetch_lepidolite_data()
    if lepidolite:
        print(f"[INFO] 锂云母: 抓到 {len(lepidolite['data'])} 条数据")
        print(f"[INFO] 数据日期: {lepidolite['data'][0].get('update_time', 'N/A') if lepidolite['data'] else 'N/A'}")
        results.append(lepidolite)
    else:
        print("[ERROR] 锂云母数据抓取失败")
    
    if not results:
        print("[ERROR] 两种数据均抓取失败，退出")
        return 1
    
    # 写入 JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"[INFO] 数据已保存到 {output_path}")
    
    # 写入 CSV
    csv_path = os.path.join(output_dir, "lithium_ore_price.csv")
    with open(csv_path, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            "commodity", "scrape_time", "product_name", "grade", "origin",
            "min_price", "max_price", "avg_price", "price", "trend", "unit"
        ])
        for category in results:
            commodity = category["commodity"]
            scrape_time = category["scrape_time"]
            for item in category["data"]:
                writer.writerow([
                    commodity, scrape_time,
                    item.get("product_name", ""),
                    item.get("grade", ""),
                    item.get("origin", ""),
                    item.get("min_price", ""),
                    item.get("max_price", ""),
                    item.get("avg_price", ""),
                    item.get("price", ""),
                    item.get("trend", ""),
                    item.get("unit", ""),
                ])
    print(f"[INFO] CSV 已保存到 {csv_path}")
    
    # 写入历史归档（按日期）
    history_dir = os.path.join(output_dir, "history")
    os.makedirs(history_dir, exist_ok=True)
    date_str = datetime.now().strftime("%Y%m%d")
    hist_json = os.path.join(history_dir, f"lithium_ore_price_{date_str}.json")
    with open(hist_json, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    hist_csv = os.path.join(history_dir, f"lithium_ore_price_{date_str}.csv")
    with open(hist_csv, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            "commodity", "scrape_time", "product_name", "grade", "origin",
            "min_price", "max_price", "avg_price", "price", "trend", "unit"
        ])
        for category in results:
            commodity = category["commodity"]
            scrape_time = category["scrape_time"]
            for item in category["data"]:
                writer.writerow([
                    commodity, scrape_time,
                    item.get("product_name", ""),
                    item.get("grade", ""),
                    item.get("origin", ""),
                    item.get("min_price", ""),
                    item.get("max_price", ""),
                    item.get("avg_price", ""),
                    item.get("price", ""),
                    item.get("trend", ""),
                    item.get("unit", ""),
                ])
    print(f"[INFO] 历史归档已保存到 {hist_json}")
    
    print(f"[INFO] 共 {len(results)} 类商品，{sum(len(r['data']) for r in results)} 条记录")
    return 0


if __name__ == '__main__':
    exit(main())
