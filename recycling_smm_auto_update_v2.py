#!/usr/bin/env python3
"""
锂电池回收数据全自动更新脚本（SMM爬虫版本）
功能：从SMM网站自动抓取锂电池回收价格数据，更新到recycling_data_v2.js
运行方式：python recycling_smm_auto_update_v2.py
定时任务：每个工作日下午17:00运行

特点：
1. 全自动从SMM网站抓取数据，无需手动下载
2. 自动映射SMM数据到recycling_data_v2.js的9个品种（铝箔、铜箔暂缺）
3. 只更新当天最新数据，不重复历史数据
"""

import json
import re
import sys
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

# ============= 配置 =============
PYTHON_BIN = r"C:\Users\1\.workbuddy\binaries\python\versions\3.13.12\python.exe"
DATA_FILE = "recycling_data_v2.js"
SMM_CRAWLER = "recycling_smm_crawler.py"

# SMM数据 -> recycling_data_v2.js的品种映射
# 注意：铝箔-铝粉、铜箔-铜粉在SMM无直接数据，暂不处理
SMM_TO_KEY = {
    ("三元523极片粉",): "三元黑粉-三元523极片粉",
    ("磷酸铁锂极片粉",): "磷酸铁锂黑粉-磷酸铁锂极片粉",
    ("三元铝壳", "523"): "三元废料-三元铝壳523型",
    ("废旧磷酸铁锂铝壳电池",): "磷酸铁锂废料-废旧磷酸铁锂铝壳电池",
    ("废旧磷酸铁锂动力正极片",): "正极片-废旧磷酸铁锂动力正极片",
    ("废旧磷酸铁锂储能正极片",): "正极片-废旧磷酸铁锂储能正极片",
    ("三元铝壳", "5系", "电池包"): "三元电池包-三元铝壳5系电池包",
    ("钴酸锂铝壳",): "钴酸锂电池包-钴酸锂铝壳电池包",
    ("三元软包",): "三元电池包-三元软包电池包",
}


def load_existing_data():
    """加载现有的recycling_data_v2.js数据（使用json.loads解析）"""
    if not Path(DATA_FILE).exists():
        print(f"[加载] 错误：数据文件 {DATA_FILE} 不存在")
        return {}
    
    file_size = Path(DATA_FILE).stat().st_size
    print(f"[加载] 文件: {DATA_FILE} ({file_size} bytes)")
    
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 使用正则提取JSON部分（const RECYCLING_DATA = { ... };）
    match = re.search(r'const RECYCLING_DATA = ({.*});', content, re.DOTALL)
    if not match:
        print(f"[加载] 错误：无法解析JS文件")
        return {}
    
    json_str = match.group(1)
    
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        print(f"[加载] JSON解析错误: {e}")
        return {}
    
    print(f"[加载] 已加载 {len(data)} 个品种的现有数据")
    return data


def match_smm_to_recycling(smm_item):
    """将SMM数据匹配到recycling_data_v2.js的品种"""
    name = smm_item.get("品名", "")
    spec = smm_item.get("规格", "")
    unit = smm_item.get("单位", "")
    
    # 只匹配单位为"元/吨"的数据（排除锂点、系数等）
    if unit != "元/吨":
        return None
    
    # 精确匹配
    for smm_keys, js_key in SMM_TO_KEY.items():
        match_all = True
        for key in smm_keys:
            if key not in name and key not in spec:
                match_all = False
                break
        if match_all:
            return js_key
    
    return None


def crawl_smm_data():
    """运行SMM爬虫抓取数据"""
    print("[爬虫] 正在从SMM网站抓取锂电池回收数据...")
    
    work_dir = Path(__file__).parent.absolute()
    result = subprocess.run(
        [PYTHON_BIN, SMM_CRAWLER],
        capture_output=True,
        text=True,
        cwd=str(work_dir)
    )
    
    if result.returncode != 0:
        print(f"[爬虫] 运行失败: {result.stderr}")
        return False
    
    print("[爬虫] SMM爬虫执行成功")
    return True


def load_latest_smm_data():
    """加载最新的SMM抓取数据"""
    import glob
    
    pattern = "recycling_prices_*.json"
    files = sorted(Path(".").glob(pattern), reverse=True)
    
    if not files:
        print("[数据] 未找到SMM数据文件")
        return None
    
    latest_file = files[0]
    print(f"[数据] 加载文件: {latest_file.name}")
    
    with open(latest_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    print(f"[数据] 加载了 {len(data)} 条SMM数据")
    return data


def update_recycling_data(existing_data, smm_data, today):
    """更新recycling_data_v2.js"""
    updated = {}
    
    for smm_item in smm_data:
        js_key = match_smm_to_recycling(smm_item)
        if not js_key:
            continue
        
        # 获取价格信息
        avg_price = smm_item.get("平均价", 0)
        price_range = smm_item.get("价格范围", "")
        min_price = avg_price
        max_price = avg_price
        if "~" in price_range:
            parts = price_range.split("~")
            try:
                min_price = float(parts[0].strip())
                max_price = float(parts[1].strip())
            except:
                pass
        
        # 只处理当天数据
        date = smm_item.get("日期", "")
        if date != today:
            continue
        
        # 创建新数据记录（SMM数据是元/吨，需要转成万元/吨）
        new_item = {
            "日期": date,
            "今日最低价格": str(round(min_price / 10000, 2)) if min_price else "0",
            "今日最高价格": str(round(max_price / 10000, 2)) if max_price else "0",
            "今日均价": str(round(avg_price / 10000, 2)) if avg_price else "0"
        }
        
        # 获取现有数据
        old_data = existing_data.get(js_key, [])
        
        # 检查是否已存在当天数据
        has_today = any(d.get("日期") == today for d in old_data)
        if has_today:
            print(f"  [跳过] {js_key}: 已存在{today}数据")
            continue
        
        # 添加新数据
        new_data = old_data + [new_item]
        existing_data[js_key] = new_data
        updated[js_key] = new_item
    
    return existing_data, updated


def save_recycling_data(data):
    """保存到recycling_data_v2.js"""
    output_lines = ["const RECYCLING_DATA = {"]
    
    for i, (key, items) in enumerate(data.items()):
        output_lines.append(f'  // {key}')  # 正确注释格式
        output_lines.append(f'  "{key}": [')
        for j, item in enumerate(items):
            line = f'    {json.dumps(item, ensure_ascii=False)}'
            if j < len(items) - 1:
                line += ','
            output_lines.append(line)
        output_lines.append('  ]')
        if i < len(data) - 1:
            output_lines[-1] += ','
    
    output_lines.append('};')
    
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))
    
    print(f"[保存] 数据已保存到: {DATA_FILE}")


def run_update():
    """主更新流程"""
    today = datetime.now().strftime("%Y-%m-%d")
    print(f"=== 锂电池回收数据自动更新 ({today}) ===")
    
    # 1. 加载现有数据
    existing_data = load_existing_data()
    
    # 2. 抓取SMM数据
    if not crawl_smm_data():
        print("[错误] SMM抓取失败")
        return False
    
    # 3. 加载SMM数据
    smm_data = load_latest_smm_data()
    if not smm_data:
        print("[错误] 加载SMM数据失败")
        return False
    
    # 4. 匹配并更新
    existing_data, updated = update_recycling_data(existing_data, smm_data, today)
    
    if not updated:
        print("[完成] 没有新数据需要更新")
        return True
    
    print(f"\n[结果] 更新了 {len(updated)} 个品种:")
    for key, item in updated.items():
        print(f"  {key}: {item['今日均价']} 万元/吨")
    
    # 5. 保存
    save_recycling_data(existing_data)
    
    print(f"\n[完成] 共更新 {len(updated)} 条数据")
    return True


if __name__ == "__main__":
    success = run_update()
    sys.exit(0 if success else 1)
