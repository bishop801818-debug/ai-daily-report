"""
搜索结果处理器 - 混合模式
将 AI 搜索的结果处理成早报 JSON 格式

工作流程：
1. AI 在对话中搜索并填充 search_results.json
2. 运行此脚本处理结果
3. 生成最终早报 JSON 文件
"""

import json
from datetime import datetime
from pathlib import Path

def load_search_results():
    """加载 AI 搜索的结果"""
    results_file = "search_results.json"
    
    if not Path(results_file).exists():
        print(f"[ERROR] 错误：{results_file} 不存在")
        print("[HINT] 请先在对话框中触发 AI 搜索，生成搜索结果文件")
        return None
    
    with open(results_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_search_tasks():
    """加载搜索任务清单"""
    tasks_file = "search_tasks.json"
    
    if not Path(tasks_file).exists():
        print(f"[ERROR] 错误：{tasks_file} 不存在")
        print("[HINT] 请先运行 generate_search_tasks.py 生成任务清单")
        return None
    
    with open(tasks_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def process_search_results():
    """处理搜索结果并生成早报"""
    
    # 加载数据
    search_results = load_search_results()
    if not search_results:
        return None
    
    tasks = load_search_tasks()
    if not tasks:
        return None
    
    # 按事业部分组
    divisions = {}
    
    for task in tasks["tasks"]:
        div_id = task["division_id"]
        task_type = task["task_type"]
        search_query = task["query"]
        
        # 初始化事业部
        if div_id not in divisions:
            divisions[div_id] = {
                "division_id": div_id,
                "division_name": task["division_name"],
                "report_date": datetime.now().strftime("%Y-%m-%d"),
                "window_start": tasks["time_window"].split(" 至 ")[0],
                "window_end": tasks["time_window"].split(" 至 ")[1],
                "headline": f"{task['division_name']} {datetime.now().strftime('%Y-%m-%d')} 早报",
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
        
        # 获取该任务的搜索结果
        results = search_results.get(search_query, [])
        
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
                "level": "A" if task["priority"] == "high" else "B",
                "confidence": "high",
                "fallback_level": "L1"
            }
            
            divisions[div_id]["sections"][task_type].append(news_item)
    
    # 生成头条和主线判断
    for div_id, division in divisions.items():
        # 统计新闻数量
        total_news = sum(len(items) for items in division["sections"].values())
        
        if total_news > 0:
            # 从市场动态中提取头条
            market_news = division["sections"]["市场"]
            if market_news:
                top_news = market_news[0]
                division["headline"] = top_news["title"]
                division["lead_judgment"] = f"今日共收录 {total_news} 条重要信息，市场动态 {len(market_news)} 条"
        
        # 生成风险提示
        division["risk_tip"] = "建议关注原材料价格波动及下游需求变化"
        
        # 生成小结
        division["conclusion"] = f"整体来看，{division['division_name']} 近期市场保持稳定，建议持续关注行业动态"
    
    return divisions

def save_reports(divisions):
    """保存早报 JSON 文件"""
    
    if not divisions:
        print("[ERROR] 没有可保存的早报数据")
        return
    
    # 生成报告文件名
    report_date = datetime.now().strftime("%Y-%m-%d")
    output_file = f"reports/{report_date}_ai_search.json"
    
    # 构建最终 JSON 结构
    report_data = {
        "report_date": report_date,
        "window": divisions[list(divisions.keys())[0]]["window_start"] + " 至 " + divisions[list(divisions.keys())[0]]["window_end"],
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "source": "AI 助手 WebSearch 工具实时搜索",
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
    print(f"[INFO] 报告日期：{report_date}")
    
    return output_file

def main():
    print("=" * 60)
    print("  搜索结果处理器 - 混合模式")
    print("=" * 60)
    
    divisions = process_search_results()
    
    if divisions:
        output_file = save_reports(divisions)
        
        print("\n" + "=" * 60)
        print("[OK] 处理完成！")
        print("=" * 60)
        print(f"\n生成的文件：{output_file}")
        print("\n下一步操作：")
        print("1. 检查生成的 JSON 文件内容")
        print("2. 更新 reports/index.json 索引")
        print("3. 在网页中查看早报")
        print("=" * 60)
    else:
        print("\n[ERROR] 处理失败，请检查输入文件")

if __name__ == "__main__":
    main()
