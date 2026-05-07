"""
常州锂源每日早报生成脚本 - 简化版
用于生成实际数据
"""

import urllib.request
import urllib.parse
import json
import re
import concurrent.futures
import time
from datetime import datetime, timedelta
from urllib.parse import urlparse

# API 配置
API_KEY = "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"
URL = "https://api.tavily.com/search"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

def get_date_range():
    """计算 T 到 T-2 的日期范围"""
    today = datetime.now()
    t_date = today.strftime("%Y-%m-%d")
    t_minus_2 = (today - timedelta(days=2)).strftime("%Y-%m-%d")
    return t_date, t_minus_2

def get_date_hint():
    """生成日期提示词"""
    today = datetime.now()
    month = today.month
    day = today.day
    yesterday = (today - timedelta(days=1)).day
    day_before = (today - timedelta(days=2)).day
    return f"{month}月{day_before}日 OR {month}月{yesterday}日 OR {month}月{day}日"

def tavily_search(query, max_results=8):
    """调用 Tavily API 搜索"""
    data = json.dumps({
        "api_key": API_KEY,
        "query": query,
        "max_results": max_results,
        "language": "zh",
    }).encode("utf-8")
    req = urllib.request.Request(URL, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"搜索错误：{e}")
        return {"results": []}

def get_domain(url):
    try:
        return urlparse(url).netloc.replace("www.", "").split("/")[0]
    except:
        return url

def search_module(module_name, keywords, date_hint, max_results=8):
    """搜索单个模块"""
    query = f"{' '.join(keywords)} {date_hint}"
    print(f"\n搜索 {module_name}: {query[:60]}...")
    
    raw = tavily_search(query, max_results=max_results)
    results = raw.get("results", [])
    
    items = []
    for r in results:
        item = {
            "title": r.get("title", ""),
            "content": r.get("content", ""),
            "url": r.get("url", ""),
            "domain": get_domain(r.get("url", "")),
            "score": r.get("score", 0)
        }
        items.append(item)
    
    return {
        "module": module_name,
        "query": query,
        "results": items,
        "count": len(items)
    }

def run_search():
    """执行搜索"""
    print("="*60)
    print("  常州锂源早报数据搜索")
    print(f"  日期：{datetime.now().strftime('%Y-%m-%d')}")
    print("="*60)
    
    date_hint = get_date_hint()
    print(f"日期提示：{date_hint}\n")
    
    # 模块配置
    modules = {
        "政策风向": ["磷酸铁锂 政策", "动力电池 政策", "储能 政策", "新能源汽车 补贴"],
        "竞品动态": ["湖南裕能", "万润新能", "德方纳米", "江西升华", "友山科技"],
        "客户动态": ["宁德时代 磷酸铁锂", "吉利 电池供应链", "LG 新能源 LFP", "欣旺达 LFP"],
        "前沿技术": ["高压实磷酸铁锂", "磷酸锰铁锂", "LMFP", "LFP 新品"],
        "市场行情": ["磷酸铁锂 价格", "碳酸锂 价格", "动力型磷酸铁锂 均价", "LFP 开工率"]
    }
    
    start = time.time()
    results = {}
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = {
            executor.submit(search_module, name, keywords, date_hint): name
            for name, keywords in modules.items()
        }
        
        for future in concurrent.futures.as_completed(futures):
            name = futures[future]
            try:
                result = future.result()
                results[name] = result
                print(f"[OK] {name}: {result['count']} 条结果")
            except Exception as e:
                print(f"[ERROR] {name}: {e}")
    
    elapsed = time.time() - start
    print(f"\n搜索完成，总耗时：{elapsed:.1f}秒")
    
    return results

if __name__ == "__main__":
    results = run_search()
    
    # 保存结果
    output_file = "briefing_search_results.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n数据已保存：{output_file}")
    
    # 显示部分结果示例
    print("\n" + "="*60)
    print("结果示例：")
    for module_name, data in results.items():
        print(f"\n【{module_name}】")
        for i, item in enumerate(data['results'][:3], 1):
            print(f"  {i}. [{item['domain']}] {item['title'][:50]}")
