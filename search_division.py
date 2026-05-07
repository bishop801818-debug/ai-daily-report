"""
事业部每日早报数据搜索脚本
根据配置文件动态生成搜索任务
"""

import urllib.request
import urllib.parse
import json
import concurrent.futures
import time
from datetime import datetime, timedelta
from urllib.parse import urlparse
import sys

# API 配置
API_KEY = "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"
URL = "https://api.tavily.com/search"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

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

def run_search(division_name, modules):
    """执行搜索"""
    print("="*60)
    print(f"  {division_name} 早报数据搜索")
    print(f"  日期：{datetime.now().strftime('%Y-%m-%d')}")
    print("="*60)
    
    date_hint = get_date_hint()
    print(f"日期提示：{date_hint}\n")
    
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
    # 从命令行参数获取事业部名称
    division_name = sys.argv[1] if len(sys.argv) > 1 else "常州锂源"
    
    # 模块配置（根据事业部类型调整）
    if "锂源" in division_name or "锂源" in division_name:
        # 磷酸铁锂相关
        modules = {
            "政策风向": ["磷酸铁锂 政策", "动力电池 政策", "储能 政策", "新能源汽车 补贴"],
            "竞品动态": ["湖南裕能", "万润新能", "德方纳米", "江西升华", "友山科技"],
            "客户动态": ["宁德时代 磷酸铁锂", "吉利 电池供应链", "LG 新能源 LFP", "欣旺达 LFP"],
            "前沿技术": ["高压实磷酸铁锂", "磷酸锰铁锂", "LMFP", "LFP 新品"],
            "市场行情": ["磷酸铁锂 价格", "碳酸锂 价格", "动力型磷酸铁锂 均价", "LFP 开工率"]
        }
    elif "三金" in division_name:
        # 三元材料相关
        modules = {
            "政策风向": ["三元正极材料 政策", "新能源汽车补贴 三元", "动力电池 标准"],
            "竞品动态": ["南通翔瑞 三元前驱体", "天津巴莫 三元正极", "容百科技 高镍三元", "长远锂科"],
            "客户动态": ["宁德时代 三元正极", "比亚迪 三元电池", "LG 新能源 三元", "蜂巢能源 高镍"],
            "前沿技术": ["高镍三元 NCM9", "单晶三元 正极材料", "三元前驱体 工艺升级"],
            "市场行情": ["硫酸钴 价格", "硫酸镍 价格", "碳酸锂 价格", "三元前驱体 均价"]
        }
    elif "美多" in division_name:
        # 电池回收相关
        modules = {
            "政策风向": ["废旧动力电池回收 政策", "电池回收白名单", "梯次利用 标准"],
            "竞品动态": ["邦普科技 电池回收", "南都华铂 电池回收", "龙凯科技 电池回收", "华友钴业 回收"],
            "客户动态": ["宁德时代 电池回收", "比亚迪 电池回收", "亿纬锂能 回收", "格林美 回收"],
            "前沿技术": ["电池直接再生技术", "梯次利用 技术进展", "金属盐回收率", "湿法冶金"],
            "市场行情": ["硫酸钴 价格", "硫酸镍 价格", "碳酸锂 价格 回收", "废旧电池 价格"]
        }
    elif "龙蟠时代" in division_name:
        # 碳酸锂相关
        modules = {
            "政策风向": ["碳酸锂 政策", "锂资源 政策", "盐湖提锂 政策", "新能源汽车 锂需求"],
            "竞品动态": ["天齐锂业 碳酸锂", "赣锋锂业 碳酸锂", "盛新锂能 锂盐", "雅化集团 锂盐"],
            "客户动态": ["宁德时代 碳酸锂采购", "比亚迪 锂盐采购", "亿纬锂能 碳酸锂", "磷酸铁锂 碳酸锂"],
            "前沿技术": ["盐湖提锂 新工艺", "锂云母 提锂技术", "锂电池回收 锂", "固态电池 锂需求"],
            "市场行情": ["碳酸锂 价格 今日", "碳酸锂 期货 广期所", "氢氧化锂 价格", "锂辉石 价格"]
        }
    elif "法恩莱特" in division_name or "电解液" in division_name:
        # 电解液相关
        modules = {
            "政策风向": ["电解液 政策", "六氟磷酸锂 政策", "动力电池 安全标准"],
            "竞品动态": ["天赐材料 电解液", "新宙邦 电解液", "石大胜华 电解液", "香河昆仑"],
            "客户动态": ["宁德时代 电解液", "比亚迪 电解液 采购", "LG 新能源 电解液", "中创新航 电解液"],
            "前沿技术": ["高压电解液", "快充电解液", "固态电池 电解质", "半固态电池 电解液"],
            "市场行情": ["六氟磷酸锂 价格", "电解液 价格", "DMC 溶剂 价格", "VC 添加剂 价格"]
        }
    else:
        # 默认配置
        modules = {
            "政策风向": ["新能源 政策", "电池 政策", "汽车 补贴"],
            "竞品动态": ["行业 产能", "竞品 动态"],
            "客户动态": ["客户 采购", "供应链"],
            "前沿技术": ["新技术", "工艺升级"],
            "市场行情": ["价格", "开工率"]
        }
    
    results = run_search(division_name, modules)
    
    # 保存结果
    output_file = f"briefing_search_results_{division_name}_{datetime.now().strftime('%Y%m%d')}.json"
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
