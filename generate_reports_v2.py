"""
多事业部早报生成脚本 V2
基于 lithium-division-morning-report skill
妙想搜索（优先）+ web_supplement 预置数据（兜底）
"""

import json
import time
import requests
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List

# ============================================================
# 妙想搜索配置（优先使用）
# ============================================================
MX_APIKEY = "mkt_Upa5DiXA6oRnIerXZt8TE2dsnSMsBZOTjtJi_aVo3DI"
MX_API_URL = "https://mkapi2.dfcfs.com/finskillshub/api/claw/news-search"


def mx_search(query: str, max_results: int = 10) -> List[Dict]:
    """妙想资讯搜索，返回结构化结果"""
    try:
        headers = {"apikey": MX_APIKEY, "Content-Type": "application/json"}
        data = {"query": query}
        response = requests.post(MX_API_URL, headers=headers, json=data, timeout=30)
        result = response.json()

        if result.get("success"):
            items = (
                result.get("data", {})
                .get("data", {})
                .get("llmSearchResponse", {})
                .get("data", [])
            )
            return [
                {
                    "source": "mx_search",
                    "title": item.get("title", ""),
                    "content": item.get("summary", ""),
                    "url": item.get("url", ""),
                    "publishTime": item.get("publishTime", ""),
                    "source_name": item.get("source", ""),
                }
                for item in items[:max_results]
            ]
    except Exception as e:
        print(f"妙想搜索出错：{e}")
    return []


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
# 事业部列表（与 configs/ 目录下的 JSON 文件名对应）
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
# 加载配置文件
# ============================================================
def load_division_config(division_id: str) -> Dict:
    """加载 configs/ 目录下的事业部 JSON 配置"""
    script_dir = Path(__file__).parent
    config_path = script_dir / "configs" / f"{division_id}.json"
    if config_path.exists():
        return json.loads(config_path.read_text(encoding="utf-8"))
    return {}


# ============================================================
# 提取 web_supplement 数据
# ============================================================
def extract_web_supplement(config: Dict) -> Dict[str, List[Dict]]:
    """从配置文件中提取 web_supplement 预置数据"""
    supplement_data = {}
    
    # 锂电系 5BU 使用五维框架
    modules = config.get("modules", {})
    
    # 检查是否有 dimension_order（非锂电系）
    dimension_order = modules.get("dimension_order", [])
    
    if dimension_order:
        # 非锂电系 BU，使用定制维度
        for dimension in dimension_order:
            module_data = modules.get(dimension, {})
            web_supplement = module_data.get("web_supplement", [])
            if web_supplement:
                supplement_data[dimension] = web_supplement
    else:
        # 锂电系 BU，使用标准五维
        for module_name in ["policy", "competitor", "customer", "frontier", "market"]:
            module_data = modules.get(module_name, {})
            web_supplement = module_data.get("web_supplement", [])
            if web_supplement:
                supplement_data[module_name] = web_supplement
    
    return supplement_data


# ============================================================
# 生成单个事业部早报（增强版）
# ============================================================
def generate_report(division: Dict, time_window: Dict) -> Dict:
    """生成单个事业部早报（结构化 JSON + web_supplement 兜底）"""
    division_id = division["id"]
    division_name = division["name"]

    print(f"  {division_name}...", end=" ")

    # 加载配置
    config = load_division_config(division_id)

    # 提取 web_supplement 数据
    supplement_data = extract_web_supplement(config)
    
    # 构建 sections
    sections = {}
    
    # 确定维度顺序
    modules = config.get("modules", {})
    dimension_order = modules.get("dimension_order", [])
    
    if dimension_order:
        # 非锂电系 BU
        for dimension in dimension_order:
            # 先尝试妙想搜索
            search_results = []
            if dimension in ["政策", "原料", "需求", "竞品", "渠道", "业务提示"]:
                keywords_map = {
                    "政策": ["政策", "补贴", "监管"],
                    "原料": ["价格", "成本"],
                    "需求": ["需求", "销量"],
                    "竞品": ["竞品", "竞争"],
                    "渠道": ["渠道", "经销商"],
                    "业务提示": ["业务", "提示"],
                }
                keywords = keywords_map.get(dimension, [])
                query = f"{division_name} {' '.join(keywords[:2])}"
                search_results = mx_search(query, max_results=5)
            
            # 合并 web_supplement 数据
            supplement_items = supplement_data.get(dimension, [])
            combined_results = search_results + supplement_items
            
            sections[dimension] = combined_results
            print(f"[{dimension}: {len(combined_results)}条] ", end="")
    else:
        # 锂电系 BU（五维框架）
        dimension_map = {
            "policy": "政策",
            "competitor": "竞品",
            "customer": "客户",
            "frontier": "前沿",
            "market": "市场",
        }
        
        for module_key, dimension_name in dimension_map.items():
            # 先尝试妙想搜索
            search_results = []
            keywords = {
                "政策": ["政策", "补贴"],
                "竞品": ["扩产", "订单"],
                "客户": ["采购", "中标"],
                "前沿": ["新技术", "产品"],
                "市场": ["价格", "产能"],
            }
            query = f"{division_name} {' '.join(keywords.get(dimension_name, [])[:2])}"
            search_results = mx_search(query, max_results=5)
            
            # 合并 web_supplement 数据
            supplement_items = supplement_data.get(module_key, [])
            combined_results = search_results + supplement_items
            
            sections[dimension_name] = combined_results
            print(f"[{dimension_name}: {len(combined_results)}条] ", end="")

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
        report = generate_report(division, time_window)
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
    summary_file = output_dir / f"division_morning_report_{today}_v2.json"
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
        div_file = (
            output_dir / f"{report['division_name']}_早报_{today}_v2.json"
        )
        with open(div_file, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\n已保存到：{output_dir}")
    return output_dir


# ============================================================
# 入口
# ============================================================
if __name__ == "__main__":
    print("=" * 50)
    print("多事业部早报生成器 V2")
    print("基于 lithium-division-morning-report skill")
    print(f"妙想搜索：{'可用' if MX_APIKEY else '未配置'}")
    print(f"web_supplement 兜底：启用")
    print("=" * 50)

    reports = generate_all_reports()
    save_reports(reports)

    print(f"\n生成完成，共 {len(reports)} 份早报")
