"""
将早报汇总 JSON 转换为网页格式
版本：V2 - 确保所有事业部数据完整
"""

import json
from pathlib import Path
from datetime import datetime

# 读取 V4 生成的汇总数据
summary_path = Path(r"D:\buddy\reports\division_morning_report_20260409_v4.json")
with open(summary_path, "r", encoding="utf-8") as f:
    summary_data = json.load(f)

# 事业部 ID 映射
DIVISION_ID_MAP = {
    "常州锂源": "czly",
    "龙蟠时代": "lpsd",
    "法恩莱特": "felt",
    "山东美多": "sdmd",
    "三金锂电": "sjld",
    "可兰素": "kls",
    "润滑油": "lhy",
    "迪克化学": "dhx",
    "铂源催化": "bych",
}

# 事业部 subtitle 映射
DIVISION_SUBTITLE_MAP = {
    "czly": "磷酸铁锂正极材料",
    "lpsd": "碳酸锂",
    "felt": "电解液",
    "sdmd": "废旧动力电池回收",
    "sjld": "三元正极材料及三元前驱体",
    "kls": "车用尿素/汽车养护品",
    "lhy": "润滑油",
    "dhx": "汽车制动液/防冻液/洗窗液",
    "bych": "氢燃料电池催化剂",
}

def generate_html_content(division_name: str, report_data: dict) -> str:
    """生成单个事业部的 HTML 内容"""
    html_parts = []
    
    # 从配置中读取维度信息
    config_path = Path(rf"D:\buddy\skills\lithium-division-morning-report\configs\{division_name}.json")
    if not config_path.exists():
        return "<div>配置文件不存在</div>"
    
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)
    
    modules = config.get("modules", {})
    dimension_order = modules.get("dimension_order", None)
    
    # 确定维度列表
    if dimension_order and isinstance(dimension_order, list):
        # 非锂电系 BU，使用 dimension_order 声明的维度
        dimensions = dimension_order
    else:
        # 锂电系 BU，使用标准五维
        dimensions = ["policy", "competitor", "customer", "frontier", "market"]
    
    # 维度名称映射（英文->中文）
    dimension_name_map = {
        "policy": "政策风向",
        "competitor": "竞品动态",
        "customer": "客户动态",
        "原料行情": "原料行情",
        "竞品动态": "竞品动态",
        "需求侧": "需求侧",
        "渠道动态": "渠道动态",
        "原料": "原料行情",
        "需求": "需求侧",
        "竞品": "竞品动态",
        "渠道": "渠道动态",
        "贵金属行情": "贵金属行情",
        "技术前沿": "技术前沿",
        "frontier": "前沿与产品动态",
        "market": "市场数据",
    }
    
    # 图标映射
    icon_map = {
        "政策风向": "📌",
        "原料行情": "💰",
        "竞品动态": "🏆",
        "客户动态": "🤝",
        "需求侧": "📈",
        "渠道动态": "🛒",
        "贵金属行情": "💎",
        "技术前沿": "💡",
        "前沿与产品动态": "💡",
        "市场数据": "📊",
    }
    
    # 遍历所有模块，提取 web_supplement 数据
    for module_name, module_data in modules.items():
        if not isinstance(module_data, dict):
            continue
        
        web_supplement = module_data.get("web_supplement", [])
        if not isinstance(web_supplement, list) or len(web_supplement) == 0:
            continue
        
        # 获取中文维度名称
        if module_name in dimension_name_map:
            dimension_name = dimension_name_map[module_name]
        else:
            dimension_name = module_name
        
        icon = icon_map.get(dimension_name, "📌")
        
        # 生成该维度的 HTML
        html_parts.append(f'<div class="report-section">')
        html_parts.append(f'  <div class="report-section-title">{icon} {dimension_name}</div>')
        
        for item in web_supplement:
            if isinstance(item, dict):
                title = item.get("title", "无标题")
                content = item.get("content", item.get("summary", "无内容"))
                source = item.get("source", "未知来源")
                time_str = item.get("publishTime", item.get("date", "未知时间"))
            elif isinstance(item, str):
                title = item
                content = ""
                source = "配置数据"
                time_str = "2026-04-09"
            else:
                continue
            
            html_parts.append(f'  <div class="report-item">')
            html_parts.append(f'    <div class="report-item-title">{title}</div>')
            html_parts.append(f'    <div class="report-item-meta">')
            html_parts.append(f'      <span class="source">{source}</span>')
            html_parts.append(f'      <span class="time">{time_str}</span>')
            html_parts.append(f'    </div>')
            html_parts.append(f'    <div class="report-item-content">{content}</div>')
            html_parts.append(f'  </div>')
        
        html_parts.append(f'</div>')
    
    return "\n".join(html_parts)


def main():
    reports = summary_data.get("reports", [])
    
    # 构建网页格式数据
    web_format = {
        "date": "2026-04-09",
        "window_start": "2026-04-07",
        "window_end": "2026-04-09",
        "categories": {
            "market": {
                "name": "市场行情",
                "icon": "📊",
                "items": []
            }
        },
        "departments": {}
    }
    
    for report in reports:
        division_name = report.get("division_name", "")
        division_id = DIVISION_ID_MAP.get(division_name, "")
        
        if not division_id:
            print(f"跳过未知事业部：{division_name}")
            continue
        
        # 生成 HTML 内容
        html_content = generate_html_content(division_name, report)
        
        # 添加到 departments
        web_format["departments"][division_id] = {
            "name": division_name,
            "subtitle": DIVISION_SUBTITLE_MAP.get(division_id, ""),
            "_raw_content": html_content
        }
        
        print(f"[OK] {division_name}: 已生成 HTML 内容")
    
    # 保存到网页目录
    output_path = Path(r"d:\trae\AI Daily report\reports\2026-04-09.json")
    output_path.parent.mkdir(exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(web_format, f, ensure_ascii=False, indent=2)
    
    print(f"\n[OK] 已保存到：{output_path}")
    
    # 统计信息
    total_items = 0
    for div_id, div_data in web_format["departments"].items():
        content = div_data.get("_raw_content", "")
        count = content.count('<div class="report-item">')
        print(f"  {div_data['name']}: {count} 条")
        total_items += count
    
    print(f"\n总计：{total_items} 条")


if __name__ == "__main__":
    main()
