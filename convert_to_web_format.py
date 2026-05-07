"""
将早报数据转换为网页格式
生成 reports/2026-04-09.json 文件
"""

import json
from pathlib import Path
from datetime import datetime

# ============================================================
# 事业部 ID 映射
# ============================================================
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

# ============================================================
# 加载早报数据
# ============================================================
def load_division_reports():
    """加载所有事业部的早报数据"""
    reports_dir = Path(r"D:\buddy\reports")
    today = datetime.now().strftime("%Y%m%d")
    
    reports = {}
    for div_id in DIVISION_ID_MAP.values():
        report_file = reports_dir / f"常州锂源_早报_{today}_v3.json"  # 先加载一个作为测试
        
    # 加载汇总文件
    summary_file = reports_dir / f"division_morning_report_{today}_v3.json"
    if summary_file.exists():
        data = json.loads(summary_file.read_text(encoding="utf-8"))
        return data["reports"]
    return []


# ============================================================
# 生成 HTML 内容
# ============================================================
def generate_section_html(division_name: str, sections: dict) -> str:
    """生成事业部的 HTML 内容"""
    
    html_parts = []
    
    # 维度名称映射（非锂电系→锂电系）
    dimension_map = {
        "政策": "政策风向",
        "原料": "原料行情",
        "需求": "需求侧",
        "竞品": "竞品动态",
        "渠道": "渠道动态",
        "业务提示": "业务提示",
        "竞品": "竞品与客户动态",
        "客户": "竞品与客户动态",
        "前沿": "前沿与产品动态",
        "市场": "市场数据",
    }
    
    # 遍历所有维度
    for dimension, items in sections.items():
        if not items:
            continue
            
        dimension_title = dimension_map.get(dimension, dimension)
        
        html_parts.append(f'<div class="report-section">')
        html_parts.append(f'  <div class="report-section-title">📌 {dimension_title}</div>')
        
        for item in items:
            # 处理不同的数据结构
            if isinstance(item, dict):
                # 检查是否有嵌套结构
                if len(item) == 1 and isinstance(list(item.values())[0], dict):
                    # 嵌套结构（如润滑油、可兰素等）
                    inner_item = list(item.values())[0]
                    title = inner_item.get("title", "")
                    account = inner_item.get("account", "")
                    time = inner_item.get("time", "")
                    digest = inner_item.get("digest", "")
                else:
                    # 扁平结构（如常州锂源的政策）
                    title = item.get("title", "")
                    account = item.get("issued_by", item.get("account", ""))
                    time = item.get("last_confirmed", item.get("time", ""))
                    digest = item.get("digest", "")
                
                html_parts.append(f'  <div class="report-item">')
                html_parts.append(f'    <div class="report-item-title">{title}</div>')
                html_parts.append(f'    <div class="report-item-meta">')
                html_parts.append(f'      <span class="source">{account}</span>')
                html_parts.append(f'      <span class="time">{time}</span>')
                html_parts.append(f'    </div>')
                html_parts.append(f'    <div class="report-item-content">{digest}</div>')
                html_parts.append(f'  </div>')
        
        html_parts.append(f'</div>')
    
    return '\n'.join(html_parts)


# ============================================================
# 构建网页格式的 JSON
# ============================================================
def build_web_format_json(reports: list) -> dict:
    """将早报数据转换为网页格式"""
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    web_data = {
        "date": today,
        "window_start": reports[0]["window_start"] if reports else today,
        "window_end": reports[0]["window_end"] if reports else today,
        "categories": {
            "market": {
                "name": "市场行情",
                "icon": "📊",
                "items": []
            }
        },
        "departments": {}
    }
    
    # 处理每个事业部的报告
    for report in reports:
        div_name = report["division_name"]
        div_id = DIVISION_ID_MAP.get(div_name, div_name.lower())
        industry = report.get("industry", "")
        sections = report.get("sections", {})
        
        # 生成 HTML 内容
        content_html = generate_section_html(div_name, sections)
        
        # 添加到 departments
        web_data["departments"][div_id] = {
            "name": div_name,
            "subtitle": industry,
            "_raw_content": content_html
        }
    
    return web_data


# ============================================================
# 保存文件
# ============================================================
def save_web_format_json():
    """保存为网页格式的 JSON 文件"""
    
    reports = load_division_reports()
    web_data = build_web_format_json(reports)
    
    # 保存目录
    output_dir = Path(r"d:\trae\AI Daily report\reports")
    output_dir.mkdir(exist_ok=True)
    
    # 保存当天报告
    today = datetime.now().strftime("%Y-%m-%d")
    output_file = output_dir / f"{today}.json"
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(web_data, f, ensure_ascii=False, indent=2)
    
    print(f"已生成网页格式 JSON: {output_file}")
    print(f"包含 {len(web_data['departments'])} 个事业部")
    
    # 同时保存一份带版本号的备份
    backup_file = output_dir / f"{today}_v3.json"
    with open(backup_file, "w", encoding="utf-8") as f:
        json.dump(web_data, f, ensure_ascii=False, indent=2)
    
    print(f"备份文件：{backup_file}")
    
    return output_file


if __name__ == "__main__":
    print("=" * 50)
    print("早报数据转换为网页格式")
    print("=" * 50)
    
    save_web_format_json()
    
    print("\n生成完成！")
