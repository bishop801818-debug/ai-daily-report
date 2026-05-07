"""
多事业部早报生成脚本 V3
直接利用配置文件中的 web_supplement 数据生成早报
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List

# ============================================================
# 事业部列表
# ============================================================
DIVISIONS = [
    # 锂电系 5BU
    {"id": "常州锂源", "name": "常州锂源", "industry": "磷酸铁锂正极材料"},
    {"id": "龙蟠时代", "name": "龙蟠时代", "industry": "碳酸锂/锂盐"},
    {"id": "法恩莱特", "name": "法恩莱特", "industry": "电解液"},
    {"id": "山东美多", "name": "山东美多", "industry": "废旧动力电池回收"},
    {"id": "三金锂电", "name": "三金锂电", "industry": "三元正极材料及前驱体"},
    # 非锂电系 4BU
    {"id": "可兰素", "name": "可兰素", "industry": "车用尿素/养护品"},
    {"id": "润滑油", "name": "润滑油", "industry": "润滑油"},
    {"id": "迪克化学", "name": "迪克化学", "industry": "制动液/防冻液/洗窗液"},
    {"id": "铂源催化", "name": "铂源催化", "industry": "氢燃料电池催化剂"},
]


# ============================================================
# 时间窗口
# ============================================================
def get_time_window() -> Dict[str, str]:
    """获取当前时间窗口 T 到 T-2"""
    today = datetime.now()
    return {
        "start": (today - timedelta(days=2)).strftime("%Y-%m-%d"),
        "end": today.strftime("%Y-%m-%d"),
    }


# ============================================================
# 加载配置文件
# ============================================================
def load_division_config(division_id: str) -> Dict:
    """加载 configs/ 目录下的事业部 JSON 配置"""
    config_path = Path(rf"D:\buddy\skills\lithium-division-morning-report\configs\{division_id}.json")
    if config_path.exists():
        return json.loads(config_path.read_text(encoding="utf-8"))
    return {}


# ============================================================
# 生成单个事业部早报
# ============================================================
def generate_report(division: Dict) -> Dict:
    """生成单个事业部早报"""
    division_id = division["id"]
    division_name = division["name"]

    print(f"  {division_name}...", end=" ")

    # 加载配置
    config = load_division_config(division_id)
    
    # 获取时间窗口
    time_window = get_time_window()
    
    # 提取 web_supplement 数据 - 修复数据读取问题
    sections = {}
    modules = config.get("modules", {})
    
    # 检查是否有 dimension_order 字段，判断是否为非锂电系 BU
    dimension_order = modules.get("dimension_order", None)
    
    if dimension_order and isinstance(dimension_order, list) and len(dimension_order) > 0:
        # 非锂电系 BU，使用定制维度
        for dimension in dimension_order:
            module_data = modules.get(dimension, {})
            # 修复：确保正确读取 web_supplement 数据
            if isinstance(module_data, dict):
                web_supplement = module_data.get("web_supplement", [])
                # 确保 web_supplement 是列表类型
                if not isinstance(web_supplement, list):
                    web_supplement = []
                sections[dimension] = web_supplement
            else:
                sections[dimension] = []
            print(f"[{dimension}: {len(sections[dimension])}条] ", end="")
    else:
        # 锂电系 BU，使用标准五维
        dimension_map = {
            "policy": "政策",
            "competitor": "竞品",
            "customer": "客户",
            "frontier": "前沿",
            "market": "市场",
        }
        
        for module_key, dimension_name in dimension_map.items():
            module_data = modules.get(module_key, {})
            # 修复：确保正确读取 web_supplement 数据
            if isinstance(module_data, dict):
                web_supplement = module_data.get("web_supplement", [])
                # 确保 web_supplement 是列表类型
                if not isinstance(web_supplement, list):
                    web_supplement = []
                sections[dimension_name] = web_supplement
            else:
                sections[dimension_name] = []
            print(f"[{dimension_name}: {len(sections[dimension_name])}条] ", end="")

    report = {
        "division_id": config.get("division_id", division_id),
        "division_name": division_name,
        "industry": config.get("industry", division.get("industry", "")),
        "report_date": time_window["end"],
        "window_start": time_window["start"],
        "window_end": time_window["end"],
        "sections": sections,
        "generated_at": datetime.now().isoformat(),
    }

    total = sum(len(v) for v in sections.values())
    print(f"OK ({total} events)")

    return report


# ============================================================
# 生成所有事业部早报
# ============================================================
def generate_all_reports() -> List[Dict]:
    """生成全部 9 个事业部早报"""
    time_window = get_time_window()
    print(f"\n时间窗口：{time_window['start']} 至 {time_window['end']}")
    print("=" * 50)

    reports = []
    for i, division in enumerate(DIVISIONS, 1):
        print(f"[{i}/{len(DIVISIONS)}] ", end="")
        report = generate_report(division)
        reports.append(report)

    return reports


# ============================================================
# 保存早报
# ============================================================
def save_reports(reports: List[Dict]):
    """保存早报到 D:/buddy/reports/"""
    output_dir = Path(r"D:\buddy\reports")
    output_dir.mkdir(exist_ok=True)

    today = datetime.now().strftime("%Y%m%d")

    # 汇总文件
    summary_file = output_dir / f"division_morning_report_{today}_v3.json"
    with open(summary_file, "w", encoding="utf-8") as f:
        json.dump(
            {
                "generated_at": datetime.now().isoformat(),
                "time_window": get_time_window(),
                "reports": reports,
            },
            f, ensure_ascii=False, indent=2,
        )

    # 单独文件
    for report in reports:
        div_file = output_dir / f"{report['division_name']}_早报_{today}_v3.json"
        with open(div_file, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\n已保存到：{output_dir}")
    return output_dir


# ============================================================
# 入口
# ============================================================
if __name__ == "__main__":
    print("=" * 50)
    print("多事业部早报生成器 V3")
    print("基于配置文件 web_supplement 数据")
    print("=" * 50)

    reports = generate_all_reports()
    save_reports(reports)

    print(f"\n生成完成，共 {len(reports)} 份早报")
