#!/usr/bin/env python3
"""
化工品价格爬虫（SMM网站）
目标：抓取硫酸、双氧水等化工品的价格数据
输出：CSV + JSON文件

数据源：
- 硫酸：https://pdata.100ppi.com/?f=basket&dir=hghy&id=236 (生意社)
- 双氧水：https://pdata.100ppi.com/m/?f=basket&dir=hghy&ppid=758 (生意社)
"""

import asyncio
import csv
import json
import re
from datetime import datetime
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout


# 化工品配置
CHEMICALS = {
    "硫酸": {
        "url": "https://pdata.100ppi.com/?f=basket&dir=hghy&id=236",
        "name_key": "硫酸",
        "unit": "元/吨"
    },
    "双氧水": {
        "url": "https://pdata.100ppi.com/m/?f=basket&dir=hghy&ppid=758",
        "name_key": "双氧水",
        "unit": "元/吨"
    }
}


async def crawl_smm_chemical_prices():
    """抓取SMM化工品价格"""
    all_data = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        for chem_name, config in CHEMICALS.items():
            print(f"\n正在抓取 {chem_name}...")

            try:
                await page.goto(config["url"], wait_until="networkidle", timeout=30000)
                await page.wait_for_timeout(3000)

                # 获取页面HTML
                html = await page.content()

                # 解析数据
                data = parse_chemical_data(html, chem_name, config)
                all_data.extend(data)

                print(f"  {chem_name}: 解析到 {len(data)} 条数据")

            except Exception as e:
                print(f"  {chem_name} 抓取失败: {e}")
                import traceback
                traceback.print_exc()

        await browser.close()

    return all_data


def parse_chemical_data(html, chem_name, config):
    """解析化工品价格数据"""
    data = []

    # 提取日期和基准价
    # 格式：06/13 2090.00 -0.48% （可能有HTML标签间隔）
    date_price_pattern = r'(\d{2}/\d{2})[^0-9]*?([\d.]+)[^0-9]*?([-+]?[\d.]+)%'
    matches = re.findall(date_price_pattern, html, re.DOTALL)
    print(f"    正则匹配到 {len(matches)} 个结果")
    for m in matches[:3]:
        print(f"    示例: {m}")

    for date_str, price_str, change_str in matches:
        # 转换日期
        year = datetime.now().year
        month = int(date_str.split('/')[0])
        day = int(date_str.split('/')[1])

        # 处理跨年情况
        if month > 12:
            month = month - 12
            year = year - 1

        date = f"{year}-{month:02d}-{day:02d}"

        data.append({
            "品名": chem_name,
            "规格": "98%",
            "价格": float(price_str),
            "单位": config["unit"],
            "日期": date,
            "涨跌": change_str + "%"
        })

    # 也尝试提取最新报价
    latest_pattern = r'(\d{4})-(\d{2})-(\d{2})[^0-9]*([\d.]+)\s*元/吨'
    latest_matches = re.findall(latest_pattern, html)

    # 添加最新报价（如果还没有数据）
    if not data and latest_matches:
        for match in latest_matches[:1]:
            year, month, day, price = match
            date = f"{year}-{month}-{day}"

            # 检查是否是今天的报价
            if int(month) <= 12 and int(day) <= 31:
                data.append({
                    "品名": chem_name,
                    "规格": "98%",
                    "价格": float(price),
                    "单位": config["unit"],
                    "日期": date,
                    "涨跌": "0%"
                })

    return data


def save_to_csv(data, filename):
    """保存到CSV"""
    if not data:
        print("没有数据可保存")
        return

    fieldnames = ["品名", "规格", "价格", "单位", "日期", "涨跌"]

    with open(filename, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for row in data:
            filtered = {k: v for k, v in row.items() if k in fieldnames}
            writer.writerow(filtered)

    print(f"已保存 {len(data)} 条到 {filename}")


def save_to_json(data, filename):
    """保存到JSON"""
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"已保存 {len(data)} 条到 {filename}")


async def main():
    print("=" * 50)
    print("化工品价格爬虫 (SMM/生意社)")
    print("=" * 50)

    # 抓取数据
    data = await crawl_smm_chemical_prices()

    if not data:
        print("未获取到数据")
        return

    # 保存
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_file = f"chemical_prices_{timestamp}.csv"
    json_file = f"chemical_prices_{timestamp}.json"

    save_to_csv(data, csv_file)
    save_to_json(data, json_file)

    # 打印结果
    print("\n抓取结果:")
    for item in data:
        print(f"  {item['品名']} {item['日期']}: {item['价格']} {item['单位']} ({item['涨跌']})")

    print(f"\n完成！数据已保存到 {csv_file} 和 {json_file}")


if __name__ == "__main__":
    asyncio.run(main())