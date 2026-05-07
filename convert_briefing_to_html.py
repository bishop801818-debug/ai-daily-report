"""
convert_briefing_to_html.py
将 skill 输出的原始事件 JSON 转换为 index_logo_v2.html 可消费的 reportData 格式，
并写入 reports/YYYY-MM-DD.json。

使用方式：
    python convert_briefing_to_html.py --date 2026-04-08

输出：
    D:\\trae\\AI Daily report\\reports\\YYYY-MM-DD.json
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# ============================================================
# 事业部映射：skill 输出文件名中的名称 → HTML page dept ID
# ============================================================
DIVISION_MAP = {
    "常州锂源": {
        "dept_id": "czy",
        "name": "常州锂源",
        "subtitle": "Changzhou Liyuan | 磷酸铁锂正极材料",
    },
    "法恩莱特": {
        "dept_id": "felt",
        "name": "法恩莱特",
        "subtitle": "Fine Lithium | 电解液",
    },
    "龙蟠时代": {
        "dept_id": "lpsd",
        "name": "龙蟠时代",
        "subtitle": "Lopan Times | 碳酸锂",
    },
    "三金锂电": {
        "dept_id": "sjld",
        "name": "三金锂电",
        "subtitle": "Sanjin Lithium | 三元材料及三元前驱体",
    },
    "山东美多": {
        "dept_id": "sdmd",
        "name": "山东美多",
        "subtitle": "Shandong Meiduo | 电池回收",
    },
}

# 已有高质量硬编码内容的 4 个事业部（维持原样）
HARDCODED_DIVISIONS = ["lhy", "kls", "bych", "dhx"]

# skill 输出 JSON 根目录
SKILL_OUTPUT_DIR = Path(r"C:\Users\1\buddy_data")
# reports 目录
REPORTS_DIR = Path(r"D:\trae\AI Daily report\reports")


# ============================================================
# 模块 → HTML 板块映射
# ============================================================
MODULE_TO_SECTION = {
    "policy": {"title": "📜 政策风向", "icon": "📜"},
    "competitor": {"title": "⚔️ 竞品动态", "icon": "⚔️"},
    "customer": {"title": "📌 客户动态", "icon": "📌"},
    "frontier": {"title": "💡 前沿技术", "icon": "💡"},
    "market": {"title": "📊 市场行情", "icon": "📊"},
}

# ============================================================
# 辅助：将 skill 原始事件列表转换为 HTML 内容片段
# ============================================================

def events_to_html(module_key: str, events: list) -> str:
    """将事件列表渲染为一个 .report-section 的 HTML 字符串"""
    if not events:
        return ""

    module_cfg = MODULE_TO_SECTION.get(module_key, {})
    section_title = module_cfg.get("title", f"📋 {module_key}")
    icon = module_cfg.get("icon", "📋")

    items_html = ""
    for ev in events[:5]:  # 最多 5 条
        title = ev.get("page_title") or ev.get("title", "（无标题）")
        content = ev.get("content", "")[:300]
        domain = ev.get("domain", "")
        page_date = ev.get("page_date", "")
        level = ev.get("level", "C")
        score = ev.get("score", 0)

        # 标签
        if level == "A":
            tag = '<span class="tag tag-A">A级</span>'
        elif level == "B":
            tag = '<span class="tag tag-B">B级</span>'
        elif level == "C":
            tag = '<span class="tag tag-new">C级</span>'
        else:
            tag = ""

        # 来源行
        source_line = f"来源：{domain}" if domain else ""
        if page_date:
            source_line += f" | {page_date}" if source_line else page_date

        items_html += f"""
                        <div class="report-item">
                            <div class="report-item-title">{tag}{title}</div>
                            <div class="report-item-content">{content}
                                {f'<br><span style="color:#999;font-size:12px">{source_line}</span>' if source_line else ''}
                            </div>
                        </div>"""

    if not items_html:
        return ""

    return f"""
                    <div class="report-section">
                        <div class="report-section-title">{section_title}</div>
                        {items_html}
                    </div>"""


def build_report_content(division_name: str, module_results: dict, all_events: list) -> str:
    """构建完整的 reportData content HTML"""
    content_parts = []

    # 按模块分组输出
    for module_key in ["market", "policy", "competitor", "customer", "frontier"]:
        if module_key not in module_results:
            continue
        result = module_results[module_key]
        events = result.get("events", [])
        if events:
            section_html = events_to_html(module_key, events)
            if section_html:
                content_parts.append(section_html)

    # 如果没有任何事件，显示空状态
    if not content_parts:
        content_parts.append("""
                    <div class="report-section">
                        <div class="report-section-title">📋 今日动态</div>
                        <div class="report-item">
                            <div class="report-item-content" style="color:#999;text-align:center;padding:20px">
                                今日暂无符合条件的重大动态，搜索区间内信息较少，建议次日合并关注。
                            </div>
                        </div>
                    </div>""")

    return "\n".join(content_parts)


# ============================================================
# 加载 skill 输出 JSON
# ============================================================

def load_skill_output(division_name: str, date_str: str) -> dict:
    """读取 skill 生成的原始 JSON 文件"""
    # date_str 格式：2026-04-08 → 20260408
    date_code = date_str.replace("-", "")
    possible_names = [
        f"briefing_data_{division_name}_{date_code}.json",
        f"briefing_data_{division_name}_{date_str}.json",
    ]
    for fname in possible_names:
        fpath = SKILL_OUTPUT_DIR / fname
        if fpath.exists():
            with open(fpath, "r", encoding="utf-8") as f:
                return json.load(f)
    return {}


# ============================================================
# 生成单日 reports JSON
# ============================================================

def generate_report_json(target_date: str) -> dict:
    """
    生成 spec 格式的 reports/{date}.json
    """
    report = {
        "date": target_date,
        "departments": {},
        "categories": {
            "policy": {"name": "政策", "icon": "📜", "items": []},
            "competitor": {"name": "竞品", "icon": "⚔️", "items": []},
            "customer": {"name": "客户", "icon": "📌", "items": []},
            "technology": {"name": "技术", "icon": "💡", "items": []},
        },
        "summary": {
            "total_news": 0,
            "hot_topics": [],
            "market_trend": "平稳",
            "key_insight": "",
        },
    }

    total_items = 0
    hot_topics = []

    for division_name, div_info in DIVISION_MAP.items():
        dept_id = div_info["dept_id"]
        skill_data = load_skill_output(division_name, target_date)

        # 提取事件
        module_results = skill_data.get("module_results", {})
        all_events = skill_data.get("all_events", [])

        # 构建 content
        content_html = build_report_content(division_name, module_results, all_events)

        report["departments"][dept_id] = {
            "name": div_info["name"],
            "subtitle": div_info["subtitle"],
            "sections": [],  # HTML 模式用 content 字段
            "charts": [],
            "_raw_content": content_html,  # 供 HTML 页面直接使用
        }

        # 更新 summary
        item_count = len(all_events)
        total_items += item_count

        # 从 A/B 级事件中提取热点
        for ev in all_events:
            if ev.get("level") in ("A", "B"):
                title = ev.get("page_title", "")[:50]
                if title:
                    hot_topics.append(title)
            if len(hot_topics) >= 5:
                break

    # 补充 4 个硬编码事业部（无数据，保持结构）
    for dept_id in HARDCODED_DIVISIONS:
        report["departments"][dept_id] = {
            "name": dept_id.upper(),  # fallback 名称
            "subtitle": "",
            "sections": [],
            "charts": [],
            "_raw_content": "",
        }

    report["summary"]["total_news"] = total_items
    report["summary"]["hot_topics"] = hot_topics[:5]

    return report


# ============================================================
# 主程序
# ============================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="将 skill 输出转换为 HTML 报告 JSON")
    parser.add_argument("--date", default=None, help="目标日期 YYYY-MM-DD，默认今天")
    args = parser.parse_args()

    target_date = args.date or datetime.now().strftime("%Y-%m-%d")
    print(f"[convert] 生成日期：{target_date}")

    report = generate_report_json(target_date)

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = REPORTS_DIR / f"{target_date}.json"

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"[convert] 已写入：{out_path}")
    total = report["summary"]["total_news"]
    depts = len(report["departments"])
    print(f"[convert] 汇总：{depts} 个事业部，{total} 条事件")
