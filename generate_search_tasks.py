"""
搜索任务生成器 - 混合模式
生成搜索任务清单，由 AI 助手在对话中执行搜索

工作流程：
1. 运行此脚本生成 search_tasks.json
2. 在对话框中触发搜索（AI 使用 WebSearch 工具）
3. AI 填充 search_results.json
4. 运行 process_search_results.py 生成早报
"""

import json
from datetime import datetime, timedelta
from pathlib import Path

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

def generate_search_tasks():
    """生成搜索任务清单"""
    today = datetime.now()
    date_range = f"{(today - timedelta(days=2)).strftime('%Y-%m-%d')} 至 {today.strftime('%Y-%m-%d')}"
    
    tasks = []
    
    for div_id, config in DIVISIONS.items():
        # 为每个事业部生成 5 个搜索任务（对应 5 个维度）
        division_tasks = [
            {
                "division_id": div_id,
                "division_name": config["name"],
                "task_type": "政策",
                "query": f"{config['name']} {' '.join(config['keywords'][:2])} 政策 标准 补贴 监管",
                "priority": "high",
                "time_window": date_range,
                "search_id": f"{div_id}_policy"
            },
            {
                "division_id": div_id,
                "division_name": config["name"],
                "task_type": "竞品",
                "query": f"{' '.join(config['competitors'][:3])} 扩产 订单 价格 技术 合作",
                "priority": "high",
                "time_window": date_range,
                "search_id": f"{div_id}_competitor"
            },
            {
                "division_id": div_id,
                "division_name": config["name"],
                "task_type": "客户",
                "query": f"{' '.join(config['customers'][:3])} 采购 供应链 认证 份额",
                "priority": "medium",
                "time_window": date_range,
                "search_id": f"{div_id}_customer"
            },
            {
                "division_id": div_id,
                "division_name": config["name"],
                "task_type": "前沿",
                "query": f"{config['name']} {' '.join(config['keywords'][:2])} 新技术 产品 工艺突破 商业化",
                "priority": "medium",
                "time_window": date_range,
                "search_id": f"{div_id}_frontier"
            },
            {
                "division_id": div_id,
                "division_name": config["name"],
                "task_type": "市场",
                "query": f"{' '.join(config['upstream'][:2])} {' '.join(config['keywords'][:2])} 价格 产能 开工率 库存",
                "priority": "high",
                "time_window": date_range,
                "search_id": f"{div_id}_market"
            }
        ]
        tasks.extend(division_tasks)
    
    return {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "total_tasks": len(tasks),
        "time_window": date_range,
        "divisions_count": len(DIVISIONS),
        "tasks": tasks
    }

def main():
    print("=" * 60)
    print("  搜索任务生成器 - 混合模式")
    print("=" * 60)
    
    tasks = generate_search_tasks()
    
    # 保存任务清单
    output_file = "search_tasks.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(tasks, f, ensure_ascii=False, indent=2)
    
    print(f"\n[OK] 搜索任务已生成：{output_file}")
    print(f"[INFO] 共 {tasks['total_tasks']} 个搜索任务")
    print(f"[INFO] 覆盖 {tasks['divisions_count']} 个事业部")
    print(f"[INFO] 时间窗口：{tasks['time_window']}")
    
    # 显示任务分布
    print("\n[INFO] 任务分布：")
    task_count_by_type = {}
    for task in tasks["tasks"]:
        task_type = task["task_type"]
        task_count_by_type[task_type] = task_count_by_type.get(task_type, 0) + 1
    
    for task_type, count in sorted(task_count_by_type.items()):
        print(f"  - {task_type}: {count} 个任务")
    
    print("\n" + "=" * 60)
    print("[HINT] 下一步操作：")
    print("=" * 60)
    print("1. 在对话框中输入：'请执行搜索任务'")
    print("2. AI 将使用 WebSearch 工具搜索所有 45 个关键词")
    print("3. AI 会填充 search_results.json 文件")
    print("4. 运行 process_search_results.py 生成最终早报")
    print("=" * 60)

if __name__ == "__main__":
    main()
