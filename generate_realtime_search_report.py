"""
实时搜索早报生成器
直接调用 WebSearch 工具进行联网搜索，生成早报 JSON 文件
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
import sys

# 事业部配置（9 个事业部）
DIVISIONS = {
    # 锂电 5BU
    "czly": {
        "name": "常州锂源",
        "keywords": ["磷酸铁锂", "正极材料", "碳酸锂"],
        "competitors": ["湖南裕能", "万润新能", "德方纳米", "安达科技"],
        "customers": ["宁德时代", "比亚迪", "亿纬锂能", "瑞浦兰钧"],
        "upstream": ["碳酸锂现货价", "电池级磷酸铁"]
    },
    "sdmd": {
        "name": "山东美多",
        "keywords": ["电池回收", "废旧锂电池", "镍钴锂回收"],
        "competitors": ["格林美", "邦普", "赣锋锂业回收", "华友钴业"],
        "customers": ["宁德时代", "比亚迪", "容百科技", "当升科技"],
        "upstream": ["废旧锂电池回收价", "金属镍钴价格"]
    },
    "sjld": {
        "name": "三金锂电",
        "keywords": ["三元材料", "三元前驱体", "高镍三元"],
        "competitors": ["中伟股份", "格林美", "芳源股份", "帕瓦股份"],
        "customers": ["宁德时代", "LG 新能源", "三星 SDI", "亿纬锂能"],
        "upstream": ["硫酸镍", "硫酸钴", "伦镍价"]
    },
    "lpsd": {
        "name": "龙蟠时代",
        "keywords": ["碳酸锂", "锂盐", "氢氧化锂"],
        "competitors": ["赣锋锂业", "天齐锂业", "永兴材料", "江特电机"],
        "customers": ["磷酸铁锂正极厂", "三元正极厂", "电解液厂"],
        "upstream": ["碳酸锂期货", "锂辉石到岸价"]
    },
    "felt": {
        "name": "法恩莱特",
        "keywords": ["电解液", "六氟磷酸锂", "VC 添加剂"],
        "competitors": ["天赐材料", "新宙邦", "比亚迪液态", "杉杉电解液"],
        "customers": ["宁德时代", "亿纬锂能", "蜂巢能源", "珠海冠宇"],
        "upstream": ["六氟磷酸锂价格", "碳酸酯溶剂价格"]
    },
    
    # 非锂电 4BU
    "kls": {
        "name": "可兰素",
        "keywords": ["车用尿素", "AdBlue", "SCR 系统"],
        "competitors": ["悦泰海龙", "美丰佳蓝", "昆仑之星", "溢通"],
        "customers": ["商用车 SCR 系统", "尿素加注站", "4S 店"],
        "upstream": ["尿素出厂价", "山东尿素", "江苏尿素"]
    },
    "lhy": {
        "name": "润滑油",
        "keywords": ["润滑油", "车用润滑油", "工业润滑油"],
        "competitors": ["美孚", "壳牌", "嘉实多", "统一润滑油"],
        "customers": ["4S 店", "汽修连锁", "整车厂 OEM"],
        "upstream": ["APSI 基础油指数", "新加坡基础油期货"]
    },
    "dhx": {
        "name": "迪克化学",
        "keywords": ["制动液", "防冻液", "冷却液"],
        "competitors": ["博世", "蓝星", "长城", "WD-40"],
        "customers": ["长安", "吉利", "比亚迪", "4S 店"],
        "upstream": ["乙二醇华东价", "丙二醇出厂价"]
    },
    "bych": {
        "name": "铂源催化",
        "keywords": ["燃料电池催化剂", "铂碳催化剂", "Pt/C"],
        "competitors": ["田中贵金属", "庄信万丰", "优美科", "贵研铂业"],
        "customers": ["亿华通", "国鸿氢能", "捷氢科技", "潍柴巴拉德"],
        "upstream": ["铂金 LBMA 价", "铱价", "钌价"]
    }
}

# 搜索任务类型
SEARCH_TYPES = [
    {"type": "政策", "query_template": "{name} {keywords} 政策 标准 补贴 监管", "priority": "high"},
    {"type": "竞品", "query_template": "{competitors} 扩产 订单 价格 技术 合作", "priority": "high"},
    {"type": "客户", "query_template": "{customers} 采购 供应链 认证 份额", "priority": "medium"},
    {"type": "前沿", "query_template": "{name} {keywords} 新技术 产品 工艺突破 商业化", "priority": "medium"},
    {"type": "市场", "query_template": "{upstream} {keywords} 价格 产能 开工率 库存", "priority": "high"}
]

def generate_search_queries():
    """生成所有搜索查询"""
    today = datetime.now()
    date_range = f"{(today - timedelta(days=2)).strftime('%Y-%m-%d')} 至 {today.strftime('%Y-%m-%d')}"
    
    queries = []
    
    for div_id, config in DIVISIONS.items():
        for search_type in SEARCH_TYPES:
            # 构建查询
            if search_type["type"] == "政策":
                query = search_type["query_template"].format(
                    name=config["name"],
                    keywords=" ".join(config["keywords"][:2])
                )
            elif search_type["type"] == "竞品":
                query = search_type["query_template"].format(
                    competitors=" ".join(config["competitors"][:3])
                )
            elif search_type["type"] == "客户":
                query = search_type["query_template"].format(
                    customers=" ".join(config["customers"][:3])
                )
            elif search_type["type"] == "前沿":
                query = search_type["query_template"].format(
                    name=config["name"],
                    keywords=" ".join(config["keywords"][:2])
                )
            elif search_type["type"] == "市场":
                query = search_type["query_template"].format(
                    upstream=" ".join(config["upstream"][:2]),
                    keywords=" ".join(config["keywords"][:2])
                )
            
            queries.append({
                "division_id": div_id,
                "division_name": config["name"],
                "task_type": search_type["type"],
                "query": query,
                "priority": search_type["priority"],
                "time_window": date_range
            })
    
    return queries

def perform_search(query_text):
    """执行搜索（使用 WebSearch 工具）"""
    try:
        # 这里需要通过外部调用 WebSearch 工具
        # 返回搜索结果列表
        print(f"  [搜索] {query_text[:50]}...")
        return []
    except Exception as e:
        print(f"  [错误] 搜索失败：{e}")
        return []

def process_search_results(queries, search_results_map):
    """处理搜索结果并生成早报"""
    divisions = {}
    
    for query_info in queries:
        div_id = query_info["division_id"]
        task_type = query_info["task_type"]
        
        # 初始化事业部
        if div_id not in divisions:
            divisions[div_id] = {
                "division_id": div_id,
                "division_name": query_info["division_name"],
                "report_date": datetime.now().strftime("%Y-%m-%d"),
                "window_start": query_info["time_window"].split(" 至 ")[0],
                "window_end": query_info["time_window"].split(" 至 ")[1],
                "headline": f"{query_info['division_name']} {datetime.now().strftime('%Y-%m-%d')} 早报",
                "lead_judgment": "待生成",
                "sections": {
                    "政策": [],
                    "竞品": [],
                    "客户": [],
                    "前沿": [],
                    "市场": []
                },
                "risk_tip": "待生成",
                "conclusion": "待生成"
            }
        
        # 获取该查询的搜索结果
        query_key = query_info["query"]
        results = search_results_map.get(query_key, [])
        
        # 处理每条结果
        for result in results[:3]:  # 每个维度最多 3 条
            news_item = {
                "title": result.get("title", ""),
                "content": result.get("content", "") or result.get("summary", ""),
                "source": result.get("source", "") or result.get("domain", ""),
                "date": result.get("date", "") or result.get("publishTime", ""),
                "url": result.get("url", ""),
                "module": task_type,
                "impact": result.get("impact", "待分析"),
                "level": "A" if query_info["priority"] == "high" else "B",
                "confidence": "high",
                "fallback_level": "L1"
            }
            
            divisions[div_id]["sections"][task_type].append(news_item)
    
    # 生成头条和主线判断
    for div_id, division in divisions.items():
        total_news = sum(len(items) for items in division["sections"].values())
        
        if total_news > 0:
            market_news = division["sections"]["市场"]
            if market_news:
                top_news = market_news[0]
                division["headline"] = top_news["title"]
                division["lead_judgment"] = f"今日共收录 {total_news} 条重要信息，市场动态 {len(market_news)} 条"
        
        division["risk_tip"] = "建议关注原材料价格波动及下游需求变化"
        division["conclusion"] = f"整体来看，{division['division_name']} 近期市场保持稳定，建议持续关注行业动态"
    
    return divisions

def save_reports(divisions, version_tag="AI 实时搜索"):
    """保存早报 JSON 文件"""
    
    if not divisions:
        print("[错误] 没有可保存的早报数据")
        return None
    
    # 生成报告文件名（使用时间戳避免覆盖）
    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M")
    report_date = datetime.now().strftime("%Y-%m-%d")
    output_file = f"reports/{report_date}_{timestamp}_realtime.json"
    
    # 构建最终 JSON 结构
    report_data = {
        "report_date": report_date,
        "window": divisions[list(divisions.keys())[0]]["window_start"] + " 至 " + divisions[list(divisions.keys())[0]]["window_end"],
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "source": f"{version_tag} - WebSearch 实时搜索",
        "version": version_tag,
        "total_divisions": len(divisions),
        "departments": {}
    }
    
    for div_id, division in divisions.items():
        report_data["departments"][div_id] = {
            "division_id": division["division_id"],
            "division_name": division["division_name"],
            "headline": division["headline"],
            "lead_judgment": division["lead_judgment"],
            "sections": division["sections"],
            "risk_tip": division["risk_tip"],
            "conclusion": division["conclusion"],
            "news_count": sum(len(items) for items in division["sections"].values()),
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M")
        }
    
    # 保存文件
    Path("reports").mkdir(exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n[OK] 早报已保存：{output_file}")
    
    # 统计信息
    total_news = sum(
        sum(len(items) for items in div["sections"].values())
        for div in divisions.values()
    )
    
    print(f"[INFO] 共处理 {len(divisions)} 个事业部")
    print(f"[INFO] 总计 {total_news} 条新闻")
    
    return output_file

def main():
    print("=" * 60)
    print("  实时搜索早报生成器")
    print("=" * 60)
    
    # 生成搜索查询
    print("\n[步骤 1] 生成搜索查询...")
    queries = generate_search_queries()
    print(f"[OK] 已生成 {len(queries)} 个搜索查询")
    
    # 显示搜索任务分布
    print("\n[信息] 搜索任务分布：")
    task_count_by_type = {}
    for query in queries:
        task_type = query["task_type"]
        task_count_by_type[task_type] = task_count_by_type.get(task_type, 0) + 1
    
    for task_type, count in sorted(task_count_by_type.items()):
        print(f"  - {task_type}: {count} 个任务")
    
    # 注意：由于无法直接在脚本中调用 WebSearch 工具
    # 这里需要用户手动触发搜索或使用其他方式
    print("\n" + "=" * 60)
    print("[重要提示]")
    print("=" * 60)
    print("由于 WebSearch 工具需要通过对话调用，请按照以下步骤操作：")
    print("\n1. 在对话框中输入：'请执行搜索任务，查询如下：'")
    print("2. 将 search_queries.json 文件中的查询提供给 AI")
    print("3. AI 会使用 WebSearch 工具进行搜索")
    print("4. AI 会填充 search_results.json 文件")
    print("5. 运行 process_search_results.py 生成最终早报")
    print("=" * 60)
    
    # 保存查询到文件
    queries_file = "search_queries.json"
    with open(queries_file, 'w', encoding='utf-8') as f:
        json.dump({
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "total_queries": len(queries),
            "queries": queries
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\n[OK] 查询已保存到：{queries_file}")

if __name__ == "__main__":
    main()
