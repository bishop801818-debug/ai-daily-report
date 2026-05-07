"""
将早报汇总 JSON 转换为网页格式
版本：V3 - 直接从汇总 JSON 读取数据
"""

import json
from pathlib import Path

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

# 维度名称映射
dimension_name_map = {
    "政策": "政策风向",
    "竞品": "竞品动态",
    "客户": "客户动态",
    "前沿": "前沿与产品动态",
    "市场": "市场数据",
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

def convert_event_to_item(event: dict, dimension_name: str) -> dict:
    """将事件转换为网页格式"""
    # 处理嵌套结构（如竞品/客户/前沿模块）
    if len(event) == 1:
        first_key = list(event.keys())[0]
        if isinstance(event[first_key], dict):
            event = event[first_key]
    
    title = event.get("title", "无标题")
    
    # 根据维度类型提取内容
    if dimension_name in ["政策风向"]:
        content = event.get("digest", "")
        source = event.get("issued_by", "未知来源")
        time_str = event.get("last_confirmed", event.get("effective_status", "未知时间"))
    else:
        content = event.get("digest", event.get("content", ""))
        source = event.get("account", event.get("source", "未知来源"))
        time_str = event.get("time", event.get("publishTime", event.get("date", "未知时间")))
    
    return {
        "title": title,
        "content": content,
        "source": source,
        "time": time_str
    }

def generate_html_content(division_name: str, sections: dict) -> str:
    """生成单个事业部的 HTML 内容"""
    html_parts = []
    
    for dimension_key, events in sections.items():
        if not events or not isinstance(events, list):
            continue
        
        # 获取中文维度名称
        dimension_name = dimension_name_map.get(dimension_key, dimension_key)
        icon = icon_map.get(dimension_name, "📌")
        
        # 生成该维度的 HTML
        html_parts.append(f'<div class="report-section">')
        html_parts.append(f'  <div class="report-section-title">{icon} {dimension_name}</div>')
        
        for event in events:
            item = convert_event_to_item(event, dimension_name)
            
            html_parts.append(f'  <div class="report-item">')
            html_parts.append(f'    <div class="report-item-title">{item["title"]}</div>')
            html_parts.append(f'    <div class="report-item-meta">')
            html_parts.append(f'      <span class="source">{item["source"]}</span>')
            html_parts.append(f'      <span class="time">{item["time"]}</span>')
            html_parts.append(f'    </div>')
            html_parts.append(f'    <div class="report-item-content">{item["content"]}</div>')
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
        
        # 获取 sections 数据
        sections = report.get("sections", {})
        
        # 生成 HTML 内容
        html_content = generate_html_content(division_name, sections)
        
        # 添加到 departments
        web_format["departments"][division_id] = {
            "name": division_name,
            "subtitle": DIVISION_SUBTITLE_MAP.get(division_id, ""),
            "_raw_content": html_content
        }
        
        # 统计条数
        item_count = html_content.count('<div class="report-item">')
        print(f"[OK] {division_name}: {item_count} 条")
    
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
        total_items += count
    
    print(f"\n总计：{total_items} 条")


if __name__ == "__main__":
    main()
