#!/usr/bin/env python3
"""
龙蟠科技集团 · 多事业部早报生成器（完整skill版）
================================================
混合模式：脚本定义搜索需求 → 对话触发执行搜索 → 脚本处理结果生成JSON

继承自：lithium-division-morning-report skill
       - 旧闻复验三步法（标题层/正文层/来源层）
       - 多级回落 L1→L2→L3→L4
       - 事业部配置动态读取（configs/*.json）
       - 八栏目结构（头条/今日主线/政策/竞品/前沿/市场/风险/小结）

用法：
    python generate_html_report.py --gen-tasks       # 生成搜索任务（复制到对话中执行）
    python generate_html_report.py                  # 读取 search_results.json，处理并生成JSON
    python generate_html_report.py --input data.json --open  # 指定输入+打开浏览器
"""
import json
import os
import re
import sys
import webbrowser
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple

# Windows 终端 UTF-8 修复
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# ============================================================
# 全局时间参数（skill硬规则：默认T到T-2固定窗口，支持--window参数调整）
# ============================================================
# ============================================================
# 多终端路径配置
# 使用说明：
#   默认（--terminal workbuddy）：Windows PowerShell 环境，Claude Code/Workbuddy 使用
#   --terminal trae           ：切换为 Trae 终端路径
#   --terminal custom         ：配合 --input-dir / --report-dir / --configs-dir 自定义路径
# ============================================================
_TERMINAL_PRESETS = {
    # Workbuddy / Claude Code（Windows PowerShell，默认）
    "workbuddy": {
        "name": "Workbuddy / Claude Code（Windows）",
        "search_input": "D:/trae/AI Daily report/search_results.json",
        "report_dir":    "D:/trae/AI Daily report/reports",
        "configs_dir":   "D:/buddy/skills/lithium-division-morning-report/configs",
        "market_cache":  "D:/trae/AI Daily report/reports/market_lc.json",
        "script_path":   "C:/Users/1/.claude/projects/C--Users-1/prompts/generate_html_report.py",
    },
    # Trae（Linux/macOS 或 Trae IDE）
    "trae": {
        "name": "Trae（跨平台）",
        "search_input": "./search_results.json",
        "report_dir":    "./reports",
        "configs_dir":   "./configs",
        "market_cache":  "./reports/market_lc.json",
        "script_path":   "./generate_html_report.py",
    },
}

# 解析命令行参数（必须在使用 PATHS 之前）
import argparse
parser = argparse.ArgumentParser(description="龙蟠科技早报生成器（完整skill版）")
parser.add_argument("--terminal", "-t", default="workbuddy",
                    choices=list(_TERMINAL_PRESETS.keys()) + ["custom"],
                    help="选择终端预设：workbuddy=Windows默认，trae=跨平台，custom=自定义路径")
parser.add_argument("--input", "-i",
                    help="搜索结果JSON文件路径（覆盖默认）")
parser.add_argument("--input-dir",
                    help="搜索结果目录（search_results.json 所在目录）")
parser.add_argument("--report-dir",
                    help="早报输出目录（JSON 报告存放目录）")
parser.add_argument("--configs-dir",
                    help="BU配置文件目录（configs/*.json 所在目录）")
parser.add_argument("--open", "-o", action="store_true",
                    help="生成后自动打开浏览器预览")
parser.add_argument("--inspect", action="store_true",
                    help="仅打印输入文件摘要，不生成早报")
parser.add_argument("--gen-tasks", action="store_true",
                    help="从configs/生成搜索任务Markdown并退出")
parser.add_argument("--gen-mx-tasks", action="store_true",
                    help="生成 mx_search 批量查询任务（供对话执行）并退出")
parser.add_argument("--window", "-w", type=int, default=2,
                    help="时间窗口天数，默认T-2，最大T-7")
_args = parser.parse_args()

# 合并路径：CLI参数优先于预设
if _args.terminal == "custom":
    _preset = {}
else:
    _preset = _TERMINAL_PRESETS.get(_args.terminal, _TERMINAL_PRESETS["workbuddy"])

PATHS = {
    "terminal": _args.terminal if _args.terminal != "custom" else "custom",
    "terminal_name": _preset.get("name", "自定义"),
    "search_input": _args.input or _args.input_dir and os.path.join(_args.input_dir, "search_results.json") or _preset.get("search_input", "search_results.json"),
    "report_dir":    _args.report_dir or _preset.get("report_dir", "./reports"),
    "configs_dir":   _args.configs_dir or _preset.get("configs_dir", "./configs"),
    "market_cache":  _preset.get("market_cache", ""),
    "script_path":   _preset.get("script_path", "generate_html_report.py"),
}

REPORTS_DIR = PATHS["report_dir"]
CONFIGS_DIR = PATHS["configs_dir"]

# 日期常量（在 PATHS 之后定义，供其他函数引用）
TODAY = datetime.now()
DATE_STR = TODAY.strftime("%Y-%m-%d")
D2 = (TODAY - timedelta(days=1)).strftime("%Y年%m月%d日")
D3 = (TODAY - timedelta(days=2)).strftime("%Y年%m月%d日")
D5 = (TODAY - timedelta(days=5)).strftime("%Y年%m月%d日")
D7 = (TODAY - timedelta(days=7)).strftime("%Y年%m月%d日")
WINDOW_START = (TODAY - timedelta(days=max(2, min(7, _args.window)))).strftime("%Y-%m-%d")
WINDOW_END   = (TODAY - timedelta(days=1)).strftime("%Y-%m-%d")
window_days  = max(2, min(7, _args.window))

# 八栏目顺序（skill规范）
EIGHT_SECTIONS = [
    "headline",        # 头条聚焦
    "lead_judgment",   # 今日主线判断
    "policy",          # 政策风向
    "competitor",      # 竞品与客户动态
    "frontier",        # 前沿与产品动态
    "market",         # 市场数据
    "risk_tip",       # 风险提示
    "conclusion",     # 小结
]

# 事业部ID → 配置文件名 映射
BU_CONFIG_FILES = {
    "czly": "常州锂源.json",
    "sdmd": "山东美多.json",
    "sjld": "三金锂电.json",   # 注：configs里是 sjlc，但deptList用 sjld
    "lpsd": "龙蟠时代.json",
    "felt": "法恩莱特.json",   # 注：configs里是 fellt，但deptList用 felt
    "kls":  "可兰素.json",
    "lhy":  "润滑油.json",
    "dhx":  "迪克化学.json",
    "bych": "铂源催化.json",
}

# deptList 中实际使用的ID（与 HTML 一致）
DEPT_IDS = ["czly", "sdmd", "sjld", "lpsd", "felt", "kls", "lhy", "dhx", "bych"]

# ============================================================
# 配置文件加载（动态读取 configs/*.json）
# ============================================================

def load_bu_configs() -> Dict[str, Dict]:
    """从 configs/ 目录动态读取所有 BU 配置"""
    configs = {}
    if not os.path.isdir(CONFIGS_DIR):
        print(f"[WARN] configs目录不存在: {CONFIGS_DIR}")
        return configs

    for bu_id, config_file in BU_CONFIG_FILES.items():
        path = os.path.join(CONFIGS_DIR, config_file)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                configs[bu_id] = json.load(f)
        else:
            print(f"[WARN] 配置文件缺失: {path}")

    return configs


def get_bu_keywords(bu_id: str, configs: Dict[str, Dict]) -> List[str]:
    """获取BU的核心关键词（来自配置文件的 core_keywords + keywords_alias + modules各维度keywords）

    注意：policy.keywords 等 modules 维度关键词也纳入匹配，
    因为 match_items 是初筛阶段，需要尽可能覆盖所有维度相关的内容。
    分类阶段由 classify_module 负责精确归类。
    """
    if bu_id in configs:
        cfg = configs[bu_id]
        kws = set(cfg.get("search", {}).get("core_keywords", []))
        kws.update(cfg.get("division_profile", {}).get("keywords_alias", []))
        # 补充 modules 各维度的 keywords（匹配阶段不能遗漏任何维度）
        modules = cfg.get("modules", {})
        for mod_cfg in modules.values():
            if isinstance(mod_cfg, dict):
                kws.update(mod_cfg.get("keywords", []))
                kws.update(mod_cfg.get("core_competitors", []))
                kws.update(mod_cfg.get("core_customers", []))
        return list(kws)
    return []


def get_bu_exclude_keywords(bu_id: str, configs: Dict[str, Dict]) -> List[str]:
    """获取BU的排除关键词"""
    if bu_id in configs:
        return configs[bu_id].get("search", {}).get("exclude_keywords", [])
    return []


def get_bu_old_news_flags(bu_id: str, configs: Dict[str, Dict]) -> List[str]:
    """获取旧闻标志词列表"""
    if bu_id in configs:
        return configs[bu_id].get("old_news_recheck", {}).get("title_flags", OLD_NEWS_TITLE_FLAGS)
    return OLD_NEWS_TITLE_FLAGS


def get_bu_focus_directions(bu_id: str, module: str, configs: Dict[str, Dict]) -> List[str]:
    """获取指定维度的 focus 关注方向（用于多级回落兜底）"""
    if bu_id in configs:
        modules = configs[bu_id].get("modules", {})
        # 兼容中英文模块名
        mod_cfg = modules.get(module, {})
        if not mod_cfg:
            # 尝试映射
            alt = MODULE_ALIAS.get(module, module)
            mod_cfg = modules.get(alt, {})
        return mod_cfg.get("focus", [])
    return []


# 旧闻复验标题层标志词（默认兜底）
# 注意：仅保留真正代表"历史回顾"的词汇。
# "解读""点评""前瞻""展望"在当前新闻中大量出现，非旧闻特征，已移除。
OLD_NEWS_TITLE_FLAGS = [
    "回顾", "总结", "再看", "此前", "去年",
    "近日以来", "复盘",
]

# 模块名中英文映射
MODULE_ALIAS = {
    "政策": "policy",
    "竞品": "competitor",
    "客户": "customer",
    "竞品动态": "competitor",
    "需求侧": "customer",
    "前沿": "frontier",
    "技术前沿": "frontier",
    "市场": "market",
    "原料": "原料",
    "原料行情": "原料行情",
    "渠道": "渠道",
    "渠道动态": "渠道动态",
    "业务提示": "业务提示",
    "贵金属行情": "贵金属行情",
}

# 各维度多级回落时间窗
MODULE_FALLBACK_WINDOWS = {
    "policy":   {"L1": 2, "L2": 7},    # 政策：T-2/T-7
    "competitor": {"L1": 2, "L2": 5}, # 竞品：T-2/T-5
    "customer":   {"L1": 2, "L2": 5}, # 客户：T-2/T-5
    "frontier": {"L1": 2, "L2": 5},   # 前沿：T-2/T-5
    "市场":     {"L1": 2, "L2": 5},
    "原料":     {"L1": 2, "L2": 5},
    "原料行情": {"L1": 2, "L2": 5},
    "竞品动态": {"L1": 2, "L2": 5},
    "需求侧":   {"L1": 2, "L2": 5},
    "渠道":     {"L1": 2, "L2": 5},
    "渠道动态": {"L1": 2, "L2": 5},
    "业务提示": {"L1": 2, "L2": 5},
    "贵金属行情": {"L1": 2, "L2": 5},
    "技术前沿": {"L1": 2, "L2": 5},
}


# ============================================================
# 旧闻复验三步法
# ============================================================

def is_old_news_title(title: str, flags: List[str]) -> bool:
    """旧闻复验第一步：标题层"""
    if not title:
        return True
    t = title.strip()
    for flag in flags:
        if flag in t:
            return True
    return False


def extract_body_event_date(content: str) -> Optional[str]:
    """
    旧闻复验第二步：正文层
    抽取正文中的"事件实际发生时间"
    返回格式：YYYY-MM-DD 或 None
    """
    if not content:
        return None

    # 优先匹配"XX月XX日"中文日期
    m = re.search(r"(\d{1,2})月(\d{1,2})日", content)
    if m:
        month, day = int(m.group(1)), int(m.group(2))
        year = TODAY.year
        # 尝试推断年份（若日期大于今天，说明是去年）
        try:
            event_date = datetime(year, month, day)
            if event_date > TODAY:
                event_date = datetime(year - 1, month, day)
            return event_date.strftime("%Y-%m-%d")
        except Exception:
            pass

    # 匹配 YYYY-MM-DD 格式
    m = re.search(r"(\d{4})-(\d{2})-(\d{2})", content)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"

    # 匹配 YYYY/MM/DD
    m = re.search(r"(\d{4})/(\d{2})/(\d{2})", content)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"

    return None


def source_tier(source: str, url: str, bu_id: str, configs: Dict) -> int:
    """
    旧闻复验第三步：来源层
    返回来源优先级 tier（1=最高，3=最低）
    """
    if not source and not url:
        return 3

    text = (source + " " + url).lower()

    if bu_id in configs:
        priority = configs[bu_id].get("search", {}).get("source_priority", {})
        tier1 = [s.lower() for s in priority.get("tier_1", [])]
        tier2 = [s.lower() for s in priority.get("tier_2", [])]
        tier3 = [s.lower() for s in priority.get("tier_3", [])]

        for t in tier1:
            if t in text:
                return 1
        for t in tier2:
            if t in text:
                return 2
        for t in tier3:
            if t in text:
                return 3

    # 默认规则（无配置时）
    high_quality = ["公告", "官网", "官方", "互动易", "lbma", "shfe", "smm",
                    "高工", "我的钢铁", "上海有色", "隆众", "卓创"]
    low_quality = ["转载", "二次", "编译", "综合", "门户", "汇总"]
    for h in high_quality:
        if h.lower() in text:
            return 1
    for l in low_quality:
        if l.lower() in text:
            return 3

    return 2  # 默认中等


# ============================================================
# URL日期提取 & 公告类URL识别
# ============================================================

def extract_url_date(url: str) -> Optional[datetime]:
    """
    从URL路径中提取日期。
    匹配格式：/2026/04/10/、20260410、2026-04-10 等
    返回 datetime 对象或 None。
    """
    if not url:
        return None

    # 格式1：/2026/04/10/（最常见）
    m = re.search(r"/(\d{4})/(\d{1,2})/(\d{1,2})/", url)
    if m:
        try:
            return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        except Exception:
            pass

    # 格式2：_20260410_ 或 /20260410/（连写）
    m = re.search(r"[/_-](\d{4})(\d{2})(\d{2})[/_-]", url)
    if m:
        try:
            return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        except Exception:
            pass

    # 格式3：/2026-04-10/（横杠分隔，连写如 2026-04-08）
    m = re.search(r"[/_-](\d{4})-(\d{2})-(\d{2})(?:[/_-]|$)", url)
    if m:
        try:
            return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        except Exception:
            pass

    return None


# 公告类URL特征（命中则认为是公告类页面）
ANNOUNCEMENT_URL_PATTERNS = [
    "announcement", "notice", "report", "hxtz", "schedule",
    "disclosure", "hkex", "sse", "szse", "cnpowder", "iteche",
    "cninfo", "eastmoney", "stcn", "cls", "sanepowder",
]

# 非公告类URL特征（命中则直接降权L4，不fetch）
NON_ANNOUNCEMENT_PATTERNS = [
    "weixin", "mp.weixin", "wechat",            # 微信公众号
    "mp.tt", "toutiao", "jinritoutiao",          # 头条号
    "baijiahao", "baidu",                        # 百家号/百度
    "sohu", "qq.", "netease",                    # 门户/企鹅号
    "zhihu", "bilibili", "douyin",               # 社区/视频
    "csdn", "juejin", "infoq",                   # 技术社区
    "stockstar", "yicai", "first", "sixth",      # 财经/媒体
    "sigmaintel", "glworks", "gongfz",           # 第三方研究
    "36kr", "leiphone", "caiyun", "qichacha",    # 科技媒体/数据平台
    "gov.cn",                                    # 政府网站（政策原文除外）
]


def is_announcement_url(url: str) -> Optional[bool]:
    """
    判断URL是否为公告类路径。
    True  = 公告类（需fetch获取日期）
    False = 非公告类（直接降权L4，排除）
    None  = 不确定（走正文+来源层逻辑）
    """
    if not url:
        return None
    url_lower = url.lower()

    for pat in ANNOUNCEMENT_URL_PATTERNS:
        if pat in url_lower:
            return True

    for pat in NON_ANNOUNCEMENT_PATTERNS:
        if pat in url_lower:
            return False

    return None


# ============================================================
# 旧闻复验三步法（URL日期优先版本）
# ============================================================

def recheck_item(item: Dict, bu_id: str, configs: Dict, strict: bool = False) -> Dict:
    """
    执行旧闻复验三步法，URL日期为第一优先级，严格执行过滤规则。

    规则：
      URL含日期 + ≤20天  → passed=True, high,    L1（正常使用）
      URL含日期 + 21-30天 → passed=True, medium,  L2（降权）
      URL含日期 + >30天   → passed=False, 直接排除（不进入早报）
      URL无日期 + 公告类  → 正文层+来源层判断（可fetch补充）
      URL无日期 + 非公告类 → passed=False, L4（不进入早报）
      无法提取日期        → passed=True, medium, L2（降权但保留）
    """
    title = item.get("title", "")
    content = item.get("content", "")
    source = item.get("source", "")
    url = item.get("url", "")
    article_date_str = item.get("date", "")
    flags = get_bu_old_news_flags(bu_id, configs)

    result = {
        "passed": False,
        "confidence": "low",
        "fallback_level": "L4",
        "old_news_reason": "",
    }

    # ── 第一步：URL日期（最高优先级）────────────────────────
    url_date = extract_url_date(url)

    if url_date:
        days_ago = (TODAY - url_date).days
        if days_ago <= 20:
            result["passed"] = True
            result["confidence"] = "high"
            result["fallback_level"] = "L1"
        elif days_ago <= 30:
            result["passed"] = True
            result["confidence"] = "medium"
            result["fallback_level"] = "L2"
            result["old_news_reason"] = f"URL日期距今{days_ago}天（21-30天），降权保留"
        else:
            result["passed"] = False
            result["confidence"] = "low"
            result["fallback_level"] = "L4"
            result["old_news_reason"] = f"URL日期距今{days_ago}天（>30天），已排除"
        return result

    # ── 第二步：URL无日期 → 公告类判断 ─────────────────────
    ann_type = is_announcement_url(url)

    if ann_type is False:
        # 非公告类URL无日期 → 直接排除
        result["passed"] = False
        result["confidence"] = "low"
        result["fallback_level"] = "L4"
        result["old_news_reason"] = "非公告类URL且无日期，降权为背景参考，不进入早报"
        return result

    # ── 第三步：正文层日期提取 ──────────────────────────────
    body_date = extract_body_event_date(content)
    item_date_str = body_date or article_date_str

    event_date = None
    if item_date_str:
        try:
            if "年" in item_date_str and "月" in item_date_str:
                event_date = datetime.strptime(item_date_str[:10], "%Y-%m-%d")
            elif re.match(r"\d{4}-\d{2}-\d{2}", item_date_str):
                event_date = datetime.strptime(item_date_str[:10], "%Y-%m-%d")
        except Exception:
            pass

    days_ago = (TODAY - event_date).days if event_date else None

    # ── 第四步：来源层 ─────────────────────────────────────
    tier = source_tier(source, url, bu_id, configs)

    # 时间层最终判定
    if days_ago is not None:
        if days_ago <= 20:
            result["passed"] = True
            result["confidence"] = "high"
            result["fallback_level"] = "L1"
        elif days_ago <= 30:
            result["passed"] = True
            result["confidence"] = "medium"
            result["fallback_level"] = "L2"
            result["old_news_reason"] = f"正文/来源日期距今{days_ago}天（21-30天），降权保留"
        else:
            result["passed"] = False
            result["confidence"] = "low"
            result["fallback_level"] = "L4"
            result["old_news_reason"] = f"正文/来源日期距今{days_ago}天（>30天），已排除"
    else:
        # 无法提取日期 → 降权保留（公告类可后续fetch补充）
        result["passed"] = True
        result["confidence"] = "medium"
        result["fallback_level"] = "L2"
        result["old_news_reason"] = "无法提取有效日期，降权保留"

    # ── 第五步：标题层旧闻降权 ─────────────────────────────
    if result["passed"] and is_old_news_title(title, flags):
        result["confidence"] = "medium"
        result["fallback_level"] = "L2"
        result["old_news_reason"] = (
            f"{result['old_news_reason']}；标题含旧闻特征词，再降一级"
            if result["old_news_reason"] else "标题含旧闻特征词，降权"
        )

    # ── 第六步：低质来源降权 ────────────────────────────────
    if result["passed"] and tier == 3 and result["confidence"] != "low":
        result["confidence"] = "medium"
        result["fallback_level"] = "L2"
        result["old_news_reason"] = (
            f"{result['old_news_reason']}；仅转载无原始来源，降权"
            if result["old_news_reason"] else "仅转载无原始来源，降权"
        )

    return result


# ============================================================
# 多级回落 L1→L4
# ============================================================

def get_fallback_window(module: str) -> tuple[int, int]:
    """获取指定维度的L1和L2时间窗口（天数）"""
    return MODULE_FALLBACK_WINDOWS.get(module, {"L1": 2, "L2": 5})


def apply_fallback(items: List[Dict], module: str, bu_id: str,
                    configs: Dict) -> List[Dict]:
    """
    对指定维度的候选条目执行多级回落。

    L1: 匹配 items 中 fallback_level == "L1" 的条目（高置信，日期在T-2内）
    L2: 放宽至 T-5 或 T-7，confidence=medium，标注"背景参考"
    L3: 以上均无结果 → AI生成1句判断文案
    L4: 所有回落均无结果 → 生成结构性判断文案模板

    返回的条目已按 L1→L2 排序，并附加 L3/L4 生成文案。
    """
    # 排序：is_priority=True 优先（同优先级内 L1 > L2/L3）
    def _sort_key(x):
        # (是否非优先, fallback_level序号)  →  False/0 排前面
        is_prio = 0 if x.get("is_priority") else 1
        fb = x.get("fallback_level", "L1")
        fb_rank = 0 if fb == "L1" else 1  # L1排前，L2/L3排后
        return (is_prio, fb_rank)

    sorted_items = sorted(items, key=_sort_key)

    # 标注背景参考（L2/L3级条目）
    for item in sorted_items:
        if item.get("fallback_level") in ("L2", "L3"):
            item["background_ref"] = True

    return sorted_items


def build_fallback_l3(module: str, bu_id: str, configs: Dict) -> Optional[Dict]:
    """
    L3：生成判断文案（focus方向→1句经营判断）
    """
    focus = get_bu_focus_directions(bu_id, module, configs)
    if not focus:
        return None

    focus_text = "；".join(focus[:2])

    return {
        "module": module,
        "title": f"【{module}关注方向】",
        "content": f"本时间窗无直接更新。重点关注：{focus_text}",
        "impact": "以上为背景参考，建议持续跟踪",
        "level": "C",
        "source": "L3回落",
        "date": DATE_STR,
        "confidence": "low",
        "fallback_level": "L3",
        "url": "",
        "is_fallback": True,
    }


def build_fallback_l4(module: str, bu_id: str, configs: Dict) -> Optional[Dict]:
    """
    L4：结构性判断文案（终极兜底，skill规范模板）
    优先从 configs/*/daily_commentary/entries 读取该模块的预置模板，
    若无配置则使用内置 L4 模板。
    """
    # ── 优先：读取 daily_commentary 配置 ──────────────────────
    bu_cfg = configs.get(bu_id, {})
    commentary = bu_cfg.get("daily_commentary", {})
    entries = commentary.get("entries", []) if isinstance(commentary, dict) else []

    for entry in entries:
        mod_key = entry.get("module", "")
        # 兼容中文/英文模块名
        if mod_key == module or mod_key == map_module_name(module, bu_id, configs):
            template = entry.get("template", "").strip()
            if template:
                return {
                    "module": module,
                    "title": f"【{map_module_name(module, bu_id, configs)}风向】（背景参考）",
                    "content": template,
                    "impact": "建议持续跟踪关注方向的后续进展",
                    "level": "C",
                    "source": "L4结构性判断·配置模板",
                    "date": DATE_STR,
                    "confidence": "low",
                    "fallback_level": "L4",
                    "url": "",
                    "is_fallback": True,
                    "is_config_commentary": True,
                }

    # ── 兜底：内置 L4 模板 ──────────────────────────────────
    focus = get_bu_focus_directions(bu_id, module, configs)
    focus_text = "；".join(focus[:2]) if focus else "当前无明确更新方向"
    mod_name = map_module_name(module, bu_id, configs)

    return {
        "module": module,
        "title": f"【{mod_name}风向】（背景参考）",
        "content": (
            f"当前窗口：{D3}至{D2}窗口内无直接{mod_name}更新。"
            f"重点关注方向：{focus_text}。"
        ),
        "impact": "建议持续跟踪关注方向的后续进展",
        "level": "C",
        "source": "L4结构性判断",
        "date": DATE_STR,
        "confidence": "low",
        "fallback_level": "L4",
        "url": "",
        "is_fallback": True,
    }


# ============================================================
# 关键词匹配（含排除词过滤）
# ============================================================

def match_items(raw_items: List[Dict], bu_id: str,
               configs: Dict) -> List[Dict]:
    """
    从原始搜索结果中匹配当前事业部相关内容。
    输入格式：
        {
            "title": "...",
            "content": "...",
            "url": "...",
            "date": "YYYY-MM-DD",
            "source": "...",  // 可选
        }
    """
    keywords = get_bu_keywords(bu_id, configs)
    exclude_kws = get_bu_exclude_keywords(bu_id, configs)
    if not keywords:
        return []

    matched = []
    for item in raw_items:
        title = item.get("title", "")
        content = item.get("content", "")
        combined = title + " " + content

        # 排除词过滤
        if exclude_kws:
            excluded = any(kw in combined for kw in exclude_kws)
            if excluded:
                continue

        # 关键词命中 OR 政策信号兜底
        hit = any(kw in combined for kw in keywords)
        # 【修复 2026-04-13】若文章含有强政策信号，即使不含BU专属关键词也进入候选池，
        # 确保"四部门部署"/"工信部座谈会"等泛产业政策文章不被过滤。
        # 只用最高质量的政府机构词和政策文件类型词，避免噪音。
        _POLICY_SIGNAL_FALLBACK = [
            "工信部", "工业和信息化部",
            "发改委", "国家发展改革委",
            "能源局", "国家能源局",
            "市场监管总局", "市场监督管理总局",
            "六部门", "七部门", "四部门", "三部门",
            "座谈会", "联席会议",
            "管理暂行办法", "管理办法", "实施细则",
        ]
        policy_hit = any(s in combined for s in _POLICY_SIGNAL_FALLBACK)
        if not hit and not policy_hit:
            continue

        # ── PDF URL 提前过滤 ─────────────────────────────────────
        # PDF 二进制内容在 fetch_content 阶段会变成乱码，
        # 在匹配层直接排除，避免后续 confidence 被误判为 LOW。
        # （中国上市公司公告同时有 HTML 版，PDF 版不损失信息）
        url = item.get("url", "") or ""
        if url.lower().endswith(".pdf"):
            continue

        # 避免重复（以URL+标题为唯一标识）
        uid = (item.get("url", "") or "") + title
        if any(x.get("_uid") == uid for x in matched):
            continue

        # 内容质量过滤：PDF乱码/纯URL截断条目不进入匹配池
        candidate = {
            "_uid": uid,
            "title": title,
            "content": (content or "")[:500],
            "url": item.get("url", ""),
            "date": item.get("date", ""),
            "source": item.get("source", item.get("url", "")[:60]),
            "confidence": _calc_confidence(item.get("date", "")),
            "fallback_level": "L1",
            "old_news_reason": "",
        }
        if not is_meaningful_content(candidate):
            continue
        matched.append(candidate)

    # 按置信度排序
    matched.sort(key=lambda x: {"high": 0, "medium": 1, "low": 2}.get(x.get("confidence", "medium"), 3))
    return matched


def _calc_confidence(date_str: str) -> str:
    if not date_str:
        return "low"
    try:
        ds = date_str.strip()
        if "年" in ds and "月" in ds:
            item_date = datetime.strptime(ds[:10], "%Y-%m-%d")
        elif re.match(r"\d{4}-\d{2}-\d{2}", ds):
            item_date = datetime.strptime(ds[:10], "%Y-%m-%d")
        else:
            return "low"
        days_ago = (TODAY - item_date).days
        if days_ago <= 2:
            return "high"
        elif days_ago <= 5:
            return "medium"
        else:
            return "low"
    except Exception:
        return "medium"


def _level(conf: str) -> str:
    return {"high": "A", "medium": "B", "low": "C"}.get(conf, "C")


# ============================================================
# 模块分类（兼容中英文维度名）
# ============================================================

def _build_policy_kw_tables() -> Dict[str, Any]:
    """
    构建锂电池产业链政策监控的两层词库：
    - 信号词（4梯队）：用于快速粗筛"可能涉及政策"的新闻
    - 核心词（7板块）：对粗筛结果做二次分类，确定政策产业链位置
    - 文件名高优先级词：命中即最高优先级
    """
    # ========== 信号词（4梯队）==========
    # 第1梯队：高频精准词
    signal_tier1 = [
        "锂电池", "锂离子电池", "动力电池", "储能电池", "新能源电池",
        "锂电", "电化学储能", "新型储能"
    ]
    # 第2梯队：政策动作词
    signal_tier2 = [
        "行业规范", "管理办法", "实施意见", "行动方案", "行动计划",
        "标准体系", "技术路线图", "指导意见", "政策解读", "征求意见稿",
        "通知", "公告", "办法"
    ]
    # 第3梯队：会议与部门联动词
    signal_tier3 = [
        "座谈会", "联席会议", "部署", "规范", "整治", "治理",
        "产能预警", "行业自律", "协调机制", "部委联合", "四部门",
        "工信部", "发改委", "能源局", "市场监管总局", "财政部",
        "税务总局", "商务部", "生态环境部", "交通运输部"
    ]
    # 第4梯队：细分场景触发词
    signal_tier4 = [
        "出口退税", "准入条件", "安全要求", "回收利用", "溯源平台",
        "编码", "数字身份证", "白名单", "强制性国家标准", "反内卷",
        "反垄断", "反不正当竞争", "知识产权", "低价竞争", "产能过剩"
    ]
    signal_all = signal_tier1 + signal_tier2 + signal_tier3 + signal_tier4

    # ========== 核心词（7大产业链板块）==========
    # 3.1 上游——锂资源与关键矿产
    core_upstream = [
        "锂矿", "锂资源", "盐湖", "锂辉石", "锂云母", "卤水提锂",
        "云母提锂", "战略性矿产", "找矿突破", "矿产资源法",
        "镍", "钴", "锰", "石墨", "铜箔", "铝箔",
        "六氟磷酸锂", "碳酸锂", "氢氧化锂",
        "出口管制", "出口配额", "资源民族主义",
        "津巴布韦", "智利", "澳大利亚", "阿根廷", "刚果金", "印尼",
        "锂精矿", "澳洲锂矿", "南美锂矿", "非洲锂矿"
    ]
    # 3.2 中游——材料与电池制造
    core_midstream = [
        "正极材料", "磷酸铁锂", "三元材料", "钴酸锂",
        "负极材料", "人造石墨", "天然石墨", "硅碳负极",
        "电解液", "隔膜",
        "锂离子电池行业规范条件", "规范公告管理办法",
        "产能利用率", "研发费用率", "产能预警", "产能调控", "产能出清",
        "低端产能", "同质化竞争", "内卷式竞争", "反内卷",
        "低于成本价", "地方招商引资",
        "GB38031", "动力电池新国标", "零起火", "零爆炸", "热失控",
        "电池安全标准", "安全要求"
    ]
    # 3.3 下游——电池制造与储能系统
    core_downstream = [
        "动力电池", "储能电芯", "储能电池", "储能系统",
        "钠离子电池", "固态电池", "全固态", "半固态", "固液混合", "大电芯",
        "锂电池运输", "电能存储系统安全要求",
        "消防标准", "并网标准", "电力调度", "调峰", "调频", "虚拟电厂"
    ]
    # 3.4 终端——新能源汽车
    core_nev = [
        "新能源汽车", "新能源车", "购置税减免", "购置税减半",
        "车辆购置税", "以旧换新", "报废更新", "置换更新",
        "补贴", "双积分", "乘用车企业平均燃料消耗量", "新能源汽车积分",
        "充电基础设施", "充电桩", "换电", "车网互动", "V2G",
        "自动驾驶", "智能网联", "工信部车型目录",
        "十五五", "政府工作报告", "战略性新兴产业"
    ]
    # 3.5 终端——储能政策专项
    core_storage = [
        "新型储能", "独立储能", "电网侧储能", "用户侧储能", "工商业储能",
        "容量电价", "114号文", "136号文",
        "电力市场", "现货市场", "峰谷价差", "分时电价",
        "抽水蓄能", "压缩空气储能", "液流电池", "长时储能",
        "顶峰能力", "容量补偿", "容量市场", "电力辅助服务",
        "绿电", "绿色电力证书", "新能源消纳", "源网荷储", "零碳园区"
    ]
    # 3.6 回收利用与循环经济
    core_recycling = [
        "动力电池回收", "废旧电池", "退役电池", "电池回收",
        "综合利用", "再生利用", "梯次利用",
        "回收利用体系", "溯源平台", "数字身份证", "一池一码",
        "车电一体", "白名单", "循环经济", "城市矿山", "再生金属",
        "生产者责任延伸", "EPR", "综合利用管理办法"
    ]
    # 3.7 贸易与出口政策
    core_trade = [
        "出口退税", "增值税退税", "出口退税率", "关税",
        "反补贴", "反倾销", "贸易壁垒",
        "海外建厂", "出海", "产能出海", "电池出口",
        "欧盟电池法", "碳足迹", "欧盟新电池法规",
        "IRA", "通货膨胀削减法案",
        "美国", "欧盟", "东南亚", "供应链安全", "关键矿产", "地缘政治"
    ]
    core_all = (core_upstream + core_midstream + core_downstream +
                core_nev + core_storage + core_recycling + core_trade)

    # ========== 文件名高优先级词（直接命中即最高优先级）==========
    file_priority_kws = [
        # 工信部文件
        "锂离子电池行业规范条件",
        "锂离子电池行业规范公告管理办法",
        # 发改委/能源局文件
        "关于完善发电侧容量电价机制的通知",
        "114号文",
        "136号文",
        # 回收专项文件
        "新能源汽车废旧动力电池回收和综合利用管理暂行办法",
        "健全新能源汽车动力电池回收利用体系行动方案",
        # 安全标准
        "电动汽车用动力蓄电池安全要求",
        "GB38031",
        "电能存储系统用锂蓄电池和电池组安全要求",
        # 以旧换新
        "2026年汽车以旧换新补贴实施细则",
        # 反内卷
        "电池行业反恶意竞争倡议书",
        "综合整治内卷式竞争",
        # 路线图
        "新型储能技术发展路线图",
        "国家锂电池产业标准体系建设指南",
        # 氢能专项
        "三部门氢能综合应用试点",
        "燃料电池汽车示范政策",
        # 排放标准
        "国六b", "国四", "非道路移动机械排放"
    ]

    return {
        "signal_tier1": signal_tier1,
        "signal_tier2": signal_tier2,
        "signal_tier3": signal_tier3,
        "signal_tier4": signal_tier4,
        "signal_all": signal_all,
        "core_upstream": core_upstream,
        "core_midstream": core_midstream,
        "core_downstream": core_downstream,
        "core_nev": core_nev,
        "core_storage": core_storage,
        "core_recycling": core_recycling,
        "core_trade": core_trade,
        "core_all": core_all,
        "file_priority_kws": file_priority_kws,
    }


# 全局政策词库（脚本启动时构建一次）
_POLICY_KW_TABLES = None


def _get_policy_kw_tables() -> Dict[str, Any]:
    global _POLICY_KW_TABLES
    if _POLICY_KW_TABLES is None:
        _POLICY_KW_TABLES = _build_policy_kw_tables()
    return _POLICY_KW_TABLES


def classify_module(text: str, bu_id: str, configs: Dict) -> Tuple[str, bool]:
    """
    根据文本内容判断属于哪个维度，返回 (module, is_priority)。

    优先级顺序（从高到低）：
    1. 文件名高优先级词 → policy
    2. 政策信号词+核心词（两层过滤）→ policy（优先于公司名）
    3. BU配置 frontier/market keywords
    4. BU core_competitors / core_customers（公司名级别）
    5.  BU配置 policy.keywords（次优先，用于有公司名但本质是政策讨论的文章）
    6. 通用 competitor/customer 词（宽泛，不应抢policy）
    7. 通用 market/frontier 词兜底
    8. 默认 competitor
    """
    kw = _get_policy_kw_tables()
    market_generic = ["价格", "行情", "产能", "开工率", "库存", "出货量", "供需", "扩产", "供应", "需求", "均价"]
    frontier_generic = ["技术", "突破", "研发", "新品", "专利", "工艺", "量产", "中试", "产品发布", "认证"]

    if bu_id in configs:
        bu = configs[bu_id]
        mod_cfg = bu.get("modules", {})
        competitors = mod_cfg.get("competitor", {}).get("core_competitors", [])
        customers = mod_cfg.get("customer", {}).get("core_customers", [])
        policy_kws = mod_cfg.get("policy", {}).get("keywords", [])
        frontier_kws = mod_cfg.get("frontier", {}).get("keywords", [])
        market_kws = mod_cfg.get("market", {}).get("keywords", [])

    # ── 第1优先级：文件名高优先级词 ─────────────────────────
    for kw_name in kw["file_priority_kws"]:
        if kw_name in text:
            return ("policy", True)

    # ── 第2优先级：政策两层过滤（信号词+核心词）─────────────
    # 政策是最强的分类信号，即便文章含有公司名（如天赐材料在价格数据文中提到）
    # 也应以政策信号为准，因为这是文章的核心主题。
    #
    # 【修复 2026-04-13】tier1（动力电池/储能电池/锂电等）是纯行业词，
    # 单独出现不代表政策，仅凭 tier1 不应触发政策判定。
    # 真实政策 = tier2政策动作词（办法/通知/意见等）+ tier3政府机构名，
    # 或命中文件名高优先级词。
    tier1_hit = any(s in text for s in kw["signal_tier1"])
    tier2_hit = any(s in text for s in kw["signal_tier2"])
    tier3_gov = any(s in text for s in ["工信部", "发改委", "能源局", "市场监管总局", "财政部", "商务部"])
    # 扩展政府机构词（应对"六部门联合""四部门""市人民政府""自治区市场监管局"等变体）
    gov_body_hit = any(s in text for s in [
        "六部门", "七部门", "八部门", "四部门", "三部门", "部门联合",
        "人民政府", "市场监管局", "生态环境部",
        "工业和信息化部", "国家发展改革委", "国家能源局"
    ])
    text_core_kws = [k for k in kw["core_all"] if k in text]

    if text_core_kws:
        # 命中核心产业链词 → 进一步判断是否有政策信号
        # 需同时有 tier2（政策动作）或 tier3（政府机构）才判为政策
        if tier2_hit or tier3_gov or gov_body_hit:
            return ("policy", True)
    elif tier2_hit or tier3_gov or gov_body_hit:
        # 无核心词但有明确的政策信号词（政府机构/政策文件类型）
        return ("policy", False)
    # tier1 行业词单独存在不触发政策判定，流向竞品/客户/市场分类

    # ── 第3优先级：BU frontier/market keywords ───────────────
    if bu_id in configs:
        if any(k in text for k in frontier_kws):
            return ("frontier", True)
        if any(k in text for k in market_kws):
            return ("market", True)

    # ── 第4优先级：core_competitors / core_customers ──────────
    # 公司名是强业务信号，但仅当没有政策信号时才能拦截
    if bu_id in configs:
        if any(c in text for c in competitors):
            # 命中公司名时，检查是否同时有政策信号（有则走第2优先级已返回）
            # 到这里说明无政策信号 → competitor
            return ("competitor", True)
        if any(c in text for c in customers):
            return ("customer", True)

    # ── 第5优先级：BU policy.keywords ───────────────────────
    # 专门处理这样的情况：文章含有公司名，但实质讨论的是行业政策/标准
    # （如天赐材料出现在一篇分析行业政策对电解液影响的文章中）
    #
    # 【修复 2026-04-13】支持空格分隔的组合词。
    # 配置中关键词如"磷酸铁锂 政策"（有空格），需要拆词后检查是否同时出现。
    # 策略：空格分隔的部分全部出现在文本中即算匹配。
    if bu_id in configs:
        policy_hit = False
        for k in policy_kws:
            parts = k.split()  # 按空格拆开
            if not parts:
                continue
            # 组合词：所有词都在文本中出现才算命中
            if all(p in text for p in parts):
                policy_hit = True
                break
        if policy_hit:
            return ("policy", True)

    # ── 第6优先级：通用 competitor 词 ─────────────────────────
    competitor_generic = [
        "扩产", "投产", "签约", "订单", "合作", "出货量", "份额",
        "采购", "配套", "装机", "销量"
    ]
    if bu_id in configs:
        if any(k in text for k in competitor_generic):
            return ("competitor", False)

    # ── 第7优先级：通用 market/frontier 词兜底 ──────────────
    for kw_name in market_generic:
        if kw_name in text:
            return ("market", False)
    for kw_name in frontier_generic:
        if kw_name in text:
            return ("frontier", False)

    # 默认归入竞品
    return ("competitor", False)


def map_module_name(module_key: str, bu_id: str, configs: Dict) -> str:
    """
    将配置中的模块key映射为HTML页面使用的栏目名。
    skill的 configs/ 中维度名可能是中英文混用，
    需要统一映射到 HTML sections 可识别的名称。
    """
    mapping = {
        "policy": "政策",
        "competitor": "竞品",
        "customer": "客户",
        "frontier": "前沿",
        "market": "市场",
        "竞品动态": "竞品",
        "需求侧": "客户",
        "前沿": "前沿",
        "技术前沿": "前沿",
        "原料": "原料",
        "原料行情": "原料",
        "渠道": "渠道",
        "渠道动态": "渠道",
        "业务提示": "业务提示",
        "贵金属行情": "贵金属行情",
    }

    # 锂电5BU：统一到 policy/competitor/customer/frontier/market
    lithium_ids = {"czly", "sdmd", "sjld", "lpsd", "felt"}
    if bu_id in lithium_ids:
        return mapping.get(module_key, "竞品")

    # 非锂电4BU：保持原名
    return mapping.get(module_key, module_key)


# ============================================================
# AI 生成层（八栏目内容）
# ============================================================

def gen_headline(items: List[Dict], bu_id: str, configs: Dict) -> str:
    """头条聚焦：选最高置信度、最具新闻价值的一条"""
    l1 = [x for x in items if x.get("confidence") == "high"]
    if not l1:
        l1 = [x for x in items if x.get("confidence") == "medium"]

    if not l1:
        name = configs.get(bu_id, {}).get("division_name", bu_id)
        return f"{name}近期暂无重大新增动态，详见各维度跟踪"

    # 优先级：竞品/客户/前沿 > 市场 > 政策
    order = {"competitor": 0, "customer": 1, "frontier": 2, "market": 3, "policy": 4}
    l1_sorted = sorted(l1, key=lambda x: order.get(x.get("module", ""), 9))
    title = l1_sorted[0].get("title", "")
    return (title or "暂无有效标题")[:80]


# ============================================================
# 内容质量过滤（处理 PDF 乱码 / 纯 URL 条目）
# ============================================================

def is_meaningful_content(item: Dict) -> bool:
    """
    判断条目内容是否有实质信息（而非 PDF 乱码 / 纯 URL / 截断片段）。
    返回 True = 有价值内容，应参与 lead_judgment 等生成逻辑。
    """
    title = item.get("title", "")
    content = item.get("content", "")
    url = item.get("url", "")

    # 跳过 PDF URL（抓取 PDF 通常得到乱码）
    if url and url.lower().endswith(".pdf"):
        return False

    # 纯标题无正文，且标题过短（<10字）→ 信息量不足
    if title and not content and len(title) < 10:
        return False

    # 有正文但包含大量乱码特征（二进制异常字符占比过高）
    if content:
        try:
            # 检测是否为有效UTF-8文本（PDF抓取失败时常包含大量不可打印字符）
            valid_chars = sum(1 for c in content if ord(c) in (9, 10, 13) or (32 <= ord(c) < 127))
            if len(content) > 0:
                valid_ratio = valid_chars / len(content)
                if valid_ratio < 0.60:  # 有效字符低于60% → 认为是乱码
                    return False
        except Exception:
            pass

        # 正文极短（<20字）且无标题 → 截断片段
        if len(content) < 20 and not title:
            return False

    # 标题和正文都为空 → 无效条目
    if not title and not content:
        return False

    return True


def extract_policy_content_from_title(title: str) -> str:
    """
    当 Tavily fetch_content 失败导致 content 为空时，
    从 title 中提取政策内容摘要，生成有实质意义的 content 字段。
    专门处理政府公告/部门文件类标题。
    """
    if not title:
        return ""

    # 提取政策名称《...》
    policy_names = re.findall(r'《([^》]+)》', title)
    policy_name = policy_names[0] if policy_names else ""

    # 提取发文机构
    dept_patterns = [
        r'([^\s]+?(?:部|委|局|会|办|厅|署))',
    ]
    depts = []
    for pat in dept_patterns:
        found = re.findall(pat, title)
        for f in found:
            if len(f) >= 2 and f not in depts and any(
                kw in f for kw in ["部", "委", "局", "会", "办", "厅", "署", "总管"]):
                depts.append(f)

    dept_str = "".join(depts[:2])

    # 判断政策类型关键词
    policy_type = ""
    if any(k in title for k in ["征求意见稿", "意见征求"]):
        policy_type = "征求意见稿"
    elif any(k in title for k in ["管理暂行办法", "管理办法", "实施细"]):
        policy_type = "管理办法/实施细则"
    elif any(k in title for k in ["行业规范条件", "规范条件"]):
        policy_type = "行业规范条件"
    elif any(k in title for k in ["通知", "公告"]):
        policy_type = "通知/公告"
    elif any(k in title for k in ["行动计划", "行动方案", "实施方案"]):
        policy_type = "行动计划/方案"
    elif any(k in title for k in ["补贴", "扶持", "奖励"]):
        policy_type = "补贴/扶持政策"
    elif any(k in title for k in ["指导意见", "指导目录"]):
        policy_type = "指导意见"
    elif any(k in title for k in ["标准", "国标", "行标"]):
        policy_type = "标准体系"
    elif any(k in title for k in ["路线图", "发展规划", "十四五", "十五五"]):
        policy_type = "发展规划/路线图"
    elif any(k in title for k in ["安全要求", "安全规范", "监管"]):
        policy_type = "安全监管政策"
    else:
        policy_type = "综合性政策文件"

    # 生成内容摘要
    if policy_name and dept_str:
        content = (
            f"该文件为{dept_str}发布的「{policy_name}」（{policy_type}）。"
            f"文件主要涉及{policy_type}方向，具体内容需查阅原文确认。"
        )
    elif policy_name:
        content = (
            f"该文件标题为「{policy_name}」（{policy_type}）。"
            f"为{policy_type}类政策文件，具体内容需查阅原文。"
        )
    else:
        content = f"政策类新闻（{policy_type}），具体内容需查阅原文确认。"

    return content


# ============================================================
# lead_judgment / 风险 / 小结 生成函数
# ============================================================

def gen_lead_judgment(items: List[Dict], bu_id: str, configs: Dict) -> str:
    """今日主线判断：2-4句话总结核心变化"""
    # 宽松过滤：优先使用有实质内容的条目；但若所有条目都被过滤，
    # 则回退到使用原始 items（只要有标题就可用作 lead judgment，
    # content 为空可能是搜索摘要截断，不代表事件无价值）
    quality_items = [x for x in items if is_meaningful_content(x)]
    l1 = [x for x in quality_items if x.get("confidence") == "high"]
    l2 = [x for x in quality_items if x.get("confidence") == "medium"]

    name = configs.get(bu_id, {}).get("division_name", bu_id)

    # 宽松回退：quality_items 为空时，用有标题的原始 items 替代
    # （避免搜索摘要过短导致所有条目被过滤，lead_judgment 变成通用废话）
    if not quality_items:
        fallback = [x for x in items if x.get("title")]
        if fallback:
            quality_items = fallback
            l1 = [x for x in quality_items if x.get("confidence") == "high"]
            l2 = [x for x in quality_items if x.get("confidence") == "medium"]

    if not quality_items:
        return (f"时间窗{D3}至{D2}内，{name}主赛道暂无高相关性新增动态。"
                "行业整体平稳，建议关注竞品产能释放节奏及核心客户订单变化。")

    dim_count = {}
    for x in quality_items:
        m = x.get("module", "其他")
        dim_count[m] = dim_count.get(m, 0) + 1
    top_dims = sorted(dim_count.items(), key=lambda x: -x[1])[:3]
    dim_str = "、".join([f"{d[0]}（{d[1]}条）" for d in top_dims])

    total = len(l1) + len(l2)
    if l1:
        first = l1[0].get("title", "")[:30]
        # 尝试从 content 中提取一句实质描述
        first_content = l1[0].get("content", "")
        extra = ""
        if first_content and len(first_content) > 10:
            extra = f"，据报道{first_content[:40]}…"
        return (f"本时间窗共捕获{total}条相关动态（{dim_str}），"
                f"核心事件为「{first}」。{extra}")
    elif l2:
        # 有中置信条目时，尝试从标题和摘要中提炼主线
        sample = l2[0]
        sample_title = sample.get("title", "")[:25]
        sample_content = sample.get("content", "")
        if sample_content and len(sample_content) > 15:
            extra = f"，主要信息为{sample_content[:40]}…"
        else:
            extra = f"，代表动态为「{sample_title}」"
        return (f"本时间窗共捕获{total}条相关动态（{dim_str}），"
                f"整体以中置信背景跟踪为主。{extra}")
    else:
        # 无高/中置信条目时，用标题信息生成有内容的 lead
        sample = quality_items[0]
        sample_title = sample.get("title", "")[:25]
        return (f"本时间窗共捕获{len(quality_items)}条相关动态，"
                f"代表性事件为「{sample_title}」，"
                "整体以背景参考为主，建议持续跟踪后续进展。")


def gen_risk_tip(items: List[Dict]) -> str:
    """风险提示：从低置信/旧闻条目中提炼"""
    quality_items = [x for x in items if is_meaningful_content(x)]
    low = [x for x in quality_items if x.get("confidence") == "low"]
    med = [x for x in quality_items if x.get("confidence") == "medium"]

    risks = []
    for x in (low + med)[:3]:
        c = x.get("content", "")
        r = x.get("old_news_reason", "")
        text = c if c and len(c) > 15 else r
        if text:
            risks.append(text[:60])

    if risks:
        return "；".join(risks) + "。以上为背景参考，需进一步核实。"
    return "当前时间窗内暂无明确风险信号，建议关注后续市场情绪变化。"


def gen_conclusion(items: List[Dict], bu_id: str, configs: Dict) -> str:
    """小结：行动导向"""
    quality_items = [x for x in items if is_meaningful_content(x)]
    n = len([x for x in quality_items if x.get("confidence") in ("high", "medium")])
    name = configs.get(bu_id, {}).get("division_name", bu_id)

    if n >= 3:
        return (f"本时间窗{name}核心事件明确，建议重点跟踪高置信项目的后续进展，"
                "动态调整关注重点。")
    elif n >= 1:
        return (f"本时间窗{name}以背景跟踪为主，暂无重大新增确认，"
                "建议持续关注核心竞品和客户动态。")
    else:
        return (f"{name}主赛道近期动态平淡，建议扩大监控范围或等待下一时间窗重要信息更新。")


def infer_impact(item: Dict, bu_id: str, configs: Dict) -> str:
    """推断对本事业部的影响"""
    text = (item.get("title", "") + " " + item.get("content", ""))
    mod = item.get("module", "")

    if bu_id in configs:
        comps = configs[bu_id].get("modules", {}).get("competitor", {}).get("core_competitors", [])
        custs = configs[bu_id].get("modules", {}).get("customer", {}).get("core_customers", [])
        for c in comps[:3]:
            if c in text:
                return f"关注{c}动态对{name(configs, bu_id)}市场份额的潜在影响"
        for c in custs[:3]:
            if c in text:
                return f"关注{c}需求变化对{name(configs, bu_id)}出货量的影响"

    if mod == "market" and ("价格" in text or "产能" in text):
        return f"关注价格/产能变化对{name(configs, bu_id)}盈利空间的传导"
    if mod == "policy":
        return f"政策调整可能对{name(configs, bu_id)}经营环境产生影响"
    if mod == "frontier":
        return f"关注技术路线变化对{name(configs, bu_id)}产品竞争力的影响"
    return "对事业部经营有一定参考价值，建议持续跟踪"


def name(configs: Dict, bu_id: str) -> str:
    return configs.get(bu_id, {}).get("division_name", bu_id)


# ============================================================
# 构建单个事业部 JSON（八栏目 + 多级回落）
# ============================================================

def build_department(bu_id: str, raw_items: List[Dict],
                     configs: Dict) -> Dict:
    """
    构建单个事业部完整JSON（继承skill规范）。

    步骤：
    1. 关键词匹配
    2. 旧闻复验三步法（标题层/正文层/来源层）
    3. 多级回落 L1→L2→L3→L4（每维度独立）
    4. 生成八栏目文案
    """

    bu_cfg = configs.get(bu_id, {})
    bu_name = bu_cfg.get("division_name", bu_id)
    industry = bu_cfg.get("industry", "")
    bu_modules = bu_cfg.get("modules", {})

    # ---------- Step 1: 关键词匹配 ----------
    matched = match_items(raw_items, bu_id, configs)

    # ---------- Step 2: 旧闻复验 ----------
    # 排除 >30 天的旧闻、无法提取日期的非公告类URL文章
    for item in matched:
        rechk = recheck_item(item, bu_id, configs)
        item["confidence"] = rechk["confidence"]
        item["fallback_level"] = rechk["fallback_level"]
        item["old_news_reason"] = rechk["old_news_reason"]
        # 根据 passed 标记是否应被排除（>30天/非公告类无日期）
        item["_exclude"] = not rechk["passed"]
        # 重新映射
        if rechk["confidence"] == "high":
            item["fallback_level"] = "L1"
        elif rechk["confidence"] == "medium":
            item["fallback_level"] = "L2"

    # ---------- Step 3: 按模块分组 + 多级回落 ----------
    # 获取该BU的所有有效维度
    # 优先用 dimension_order 字段；若缺失则从实际模块keys推导
    module_keys_raw = bu_modules.get("dimension_order")
    if isinstance(module_keys_raw, list) and module_keys_raw:
        module_keys = module_keys_raw
    else:
        # 从 configs/*/modules/ 下实际存在的 key 推导（兼容部分 BU 缺失 dimension_order 的情况）
        # 锂电5BU兜底：默认五维
        lithium_ids = {"czly", "sdmd", "sjld", "lpsd", "felt"}
        if bu_id in lithium_ids:
            module_keys = ["policy", "competitor", "customer", "frontier", "market"]
        else:
            # 非锂电BU：从 modules 的 key 集合推导（排除通用五维，保留自定义维度）
            std_keys = {"policy", "competitor", "customer", "frontier", "market"}
            extra_keys = [k for k in bu_modules.keys()
                         if k not in std_keys and k != "dimension_order"]
            # 合并 + 排序（政策优先，其余按字典序）
            module_keys = (["policy"] + sorted(extra_keys)) if "policy" in bu_modules else sorted(extra_keys)

    sections: Dict[str, List[Dict]] = {}

    # ── 维度分类 + 优先级标记 ───────────────────────────────────
    # classify_module() 返回 (module, is_priority) 元组：
    # - module: 该条目所属维度
    # - is_priority: True 表示命中该维度的核心关键词（core_competitors / core_customers /
    #                各维度 keywords），所有匹配条目都会被纳入，core命中的优先排序
    # 【修复 2026-04-13】：无论 item 是否有旧 module（global_reclassification 可能设置了
    # 错误分类），都在 section-building 前强制重新分类，确保政策信号词文章被正确归入 policy 栏目。
    for item in matched:
        text = (item.get("title") or "") + " " + (item.get("content") or "")
        mod, is_prio = classify_module(text, bu_id, configs)
        item["module"] = mod
        item["is_priority"] = is_prio

    for mod_key in module_keys:
        # 映射到 HTML 栏目名
        section_name = map_module_name(mod_key, bu_id, configs)

        # 取该模块所有条目（排除已判定为旧闻的条目）
        mod_items = [x for x in matched if x.get("module") == mod_key and not x.get("_exclude")]
        if not mod_items:
            # 也尝试中文模块名
            mod_items = [x for x in matched if x.get("module") == section_name and not x.get("_exclude")]

        # 多级回落
        fb_items = apply_fallback(mod_items, mod_key, bu_id, configs)

        if not fb_items:
            # L3: 生成1句判断文案
            l3_item = build_fallback_l3(section_name, bu_id, configs)
            if l3_item:
                fb_items = [l3_item]

        if not fb_items:
            # L4: 生成结构性判断文案
            l4_item = build_fallback_l4(section_name, bu_id, configs)
            if l4_item:
                fb_items = [l4_item]

        if fb_items:
            sections[section_name] = []
            for x in fb_items[:5]:
                item_content = x.get("content", "")
                # 当 content 为空但条目属于政策模块时，
                # 从 title 自动提取政策内容（处理 Tavily fetch_content 失败的情况）
                # 注意：x["module"] 存的是原始 key（如 "policy"），section_name 是中文映射（如 "政策"）
                if not item_content and x.get("module") in ("policy", "政策"):
                    item_content = extract_policy_content_from_title(x.get("title", ""))
                sections[section_name].append({
                    "module": section_name,
                    "title": x.get("title", ""),
                    "content": item_content,
                    "impact": x.get("impact") or infer_impact(x, bu_id, configs),
                    "level": _level(x.get("confidence", "medium")),
                    "source": x.get("source", ""),
                    "date": x.get("date", "")[:10] if x.get("date") else "",
                    "confidence": x.get("confidence", "medium"),
                    "fallback_level": x.get("fallback_level", "L1"),
                    "url": x.get("url", ""),
                    "background_ref": x.get("background_ref", False),
                })
        else:
            sections[section_name] = []

    # ---------- Step 4: 八栏目生成 ----------
    all_items_for_bu = matched  # 用于头条/lead/风险/小结

    headline = gen_headline(all_items_for_bu, bu_id, configs)
    lead_judgment = gen_lead_judgment(all_items_for_bu, bu_id, configs)
    risk_tip = gen_risk_tip(all_items_for_bu)
    conclusion = gen_conclusion(all_items_for_bu, bu_id, configs)

    return {
        "name": bu_name,
        "subtitle": industry,
        "headline": headline,
        "lead": lead_judgment,
        "sections": sections,
        "risk": risk_tip,
        "conclusion": conclusion,
        "_meta": {
            "bu_id": bu_id,
            "total_items": len(matched),
            "high_confidence": len([x for x in matched if x.get("confidence") == "high"]),
            "medium_confidence": len([x for x in matched if x.get("confidence") == "medium"]),
            "low_confidence": len([x for x in matched if x.get("confidence") == "low"]),
            "generated_by": "skill: lithium-division-morning-report v1",
            "old_news_recheck": bu_cfg.get("time_window", {}).get("require_old_news_recheck", True),
        }
    }


# ============================================================
# index.json 更新
# ============================================================

def update_index(date_str: str):
    path = os.path.join(REPORTS_DIR, "index.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            idx = json.load(f)
    else:
        idx = {
            "latest_date": date_str,
            "available_dates": [],
            "generated_at": "",
            "total_reports": 9,
            "total_items": 0,
            "divisions": DEPT_IDS,
            "version": "skill完整版"
        }

    dates = idx.get("available_dates", [])
    if date_str not in dates:
        dates.append(date_str)
    dates.sort(reverse=True)
    idx["available_dates"] = dates[:30]
    idx["latest_date"] = dates[0]
    idx["generated_at"] = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

    with open(path, "w", encoding="utf-8") as f:
        json.dump(idx, f, ensure_ascii=False, indent=2)

    print(f"  [index] latest={idx['latest_date']}, dates={dates[:3]}")


# ============================================================
# 搜索任务生成（供对话触发 WebSearch 执行）
# ============================================================

def build_search_tasks() -> List[Dict]:
    """
    根据 configs/*.json 构建所有搜索任务。
    策略：合并为5个宽覆盖任务，每个任务覆盖一组业务相近的BU，
    扩大单次搜索的召回量，再由脚本内部路由到各BU。
    返回格式：
        {
            "id": "lithium_materials",
            "label": "锂电材料",
            "query": "磷酸铁锂正极 碳酸锂 氢氧化锂 六氟磷酸锂 ... 2026年04月09日",
            "max_results": 15,
            "covers": ["czly", "lpsd", "felt"],
            "time_window": "T至T-2",
            "description": "覆盖磷酸铁锂/碳酸锂/电解液三个BU的主赛道"
        }
    """
    configs = load_bu_configs()
    tasks = []

    # ── 任务1: 锂电材料（覆盖LFP正极+碳酸锂+电解液）──────────
    lithium_kws = set()
    for bid in ["czly", "lpsd", "felt"]:
        cfg = configs.get(bid, {})
        lithium_kws.update(cfg.get("search", {}).get("core_keywords", []))
        for mkws in cfg.get("modules", {}).values():
            if isinstance(mkws, dict):
                lithium_kws.update(mkws.get("keywords", []))
                # 竞品/客户维度还需加入具体公司名称，确保搜索能命中
                lithium_kws.update(mkws.get("core_competitors", []))
                lithium_kws.update(mkws.get("core_customers", []))
    tasks.append({
        "id": "lithium_materials",
        "label": "锂电材料",
        "query": f"{' '.join(sorted(lithium_kws, key=lambda x: -len(x))[:50])} {D2} {D3}",
        "max_results": 25,
        "covers": ["czly", "lpsd", "felt"],
        "time_window": f"{D3}至{D2}",
        "time_window_days": 2,
        "description": "覆盖常州锂源/龙蟠时代/法恩莱特三个BU主赛道",
    })

    # ── 任务2: 电池产业链（覆盖回收+三元+催化剂）──────────────
    battery_kws = set()
    for bid in ["sdmd", "sjld", "bych"]:
        cfg = configs.get(bid, {})
        battery_kws.update(cfg.get("search", {}).get("core_keywords", []))
        for mkws in cfg.get("modules", {}).values():
            if isinstance(mkws, dict):
                battery_kws.update(mkws.get("keywords", []))
                battery_kws.update(mkws.get("core_competitors", []))
                battery_kws.update(mkws.get("core_customers", []))
    tasks.append({
        "id": "battery_chain",
        "label": "电池产业链",
        "query": f"{' '.join(sorted(battery_kws, key=lambda x: -len(x))[:50])} {D2} {D3}",
        "max_results": 25,
        "covers": ["sdmd", "sjld", "bych"],
        "time_window": f"{D3}至{D2}",
        "time_window_days": 2,
        "description": "覆盖山东美多/三金锂电/铂源催化三个BU主赛道",
    })

    # ── 任务3: 车用化学品（覆盖可兰素+润滑油+迪克化学）────────
    chem_kws = set()
    for bid in ["kls", "lhy", "dhx"]:
        cfg = configs.get(bid, {})
        chem_kws.update(cfg.get("search", {}).get("core_keywords", []))
        for mkws in cfg.get("modules", {}).values():
            if isinstance(mkws, dict):
                chem_kws.update(mkws.get("keywords", []))
                chem_kws.update(mkws.get("core_competitors", []))
                chem_kws.update(mkws.get("core_customers", []))
    tasks.append({
        "id": "auto_chemicals",
        "label": "车用化学品",
        "query": f"{' '.join(sorted(chem_kws, key=lambda x: -len(x))[:50])} {D2} {D3}",
        "max_results": 25,
        "covers": ["kls", "lhy", "dhx"],
        "time_window": f"{D3}至{D2}",
        "time_window_days": 2,
        "description": "覆盖可兰素/润滑油/迪克化学三个BU主赛道",
    })

    # ── 任务4: 市场数据（价格/产能/开工率，所有BU联动）────────
    # 市场数据扩大至T-7，确保即使无新消息也有历史价格可参考
    tasks.append({
        "id": "market",
        "label": "市场数据",
        "query": (
            f"碳酸锂价格 LFP价格 六氟磷酸锂价格 电解液价格 硫酸镍 硫酸钴 "
            f"基础油价格 润滑油价格 尿素价格 乙二醇MEG价格 铂金价格 "
            f"期货行情 开工率 扩产动态 库存变化 {D2} {D7}"
        ),
        "max_results": 25,
        "covers": DEPT_IDS,
        "time_window": f"{D7}至{D2}",
        "time_window_days": 7,
        "description": "价格/产能/开工率等市场数据，所有BU联动参考（T-7扩大窗口）",
    })

    # ── 任务5: 政策监控（所有BU联动）──────────────────────────
    # 政策关键词动态收集：从所有BU的 policy.keywords 提取
    policy_kws = set()
    for bid in DEPT_IDS:
        cfg = configs.get(bid, {})
        mod_cfg = cfg.get("modules", {})
        pol_cfg = mod_cfg.get("policy", {})
        if isinstance(pol_cfg, dict):
            policy_kws.update(pol_cfg.get("keywords", []))
        # 同时收集各BU的核心竞品/客户关键词（政策有时会联动这些公司）
        for mk, mv in mod_cfg.items():
            if isinstance(mv, dict):
                policy_kws.update(mv.get("core_competitors", []))
                policy_kws.update(mv.get("core_customers", []))

    # 加入信号词（4梯队）—— 确保政策粗筛覆盖
    policy_signal_kws = [
        # 第1梯队：高频精准词
        "锂电池", "锂离子电池", "动力电池", "储能电池", "新能源电池",
        "锂电", "电化学储能", "新型储能",
        # 第2梯队：政策动作词（扩大）
        "行业规范", "行业规范条件", "管理办法", "管理暂行办法", "实施意见",
        "行动方案", "行动计划", "实施方案", "实施细则",
        "标准体系", "技术路线图", "指导意见", "政策解读", "征求意见稿",
        "通知", "公告", "规划", "路线图",
        # 第3梯队：部门联动词（扩大为全称+简称）
        "工信部", "工业和信息化部",
        "发改委", "国家发展改革委", "国家发改委",
        "能源局", "国家能源局",
        "市场监管总局", "国家市场监管总局", "市场监督管理总局",
        "财政部", "国务院财政部",
        "商务部", "生态环境部", "交通运输部",
        "座谈会", "联席会议", "部署", "规范", "整治", "治理",
        # 第4梯队：细分场景词（扩大）
        "出口退税", "准入条件", "安全要求", "回收利用", "溯源平台",
        "白名单", "强制性国家标准", "反内卷", "产能预警",
        "以旧换新", "购置税减免", "购置税减半",
        # 重点政策文件名（高优先级命中词）
        "锂离子电池行业规范条件", "锂离子电池行业规范公告管理办法",
        "114号文", "136号文",
        "废旧动力电池回收", "GB38031", "电能存储系统安全要求",
        "以旧换新补贴", "国六b排放", "国七", "燃料电池", "新型储能技术发展路线图",
        "综合整治内卷式竞争", "电池行业反恶意竞争"
    ]

    # 合并所有政策关键词（取前80个最长的，避免query过长）
    all_policy_kws = policy_kws | set(policy_signal_kws)
    policy_query_kws = sorted(all_policy_kws, key=lambda x: -len(x))[:80]

    # 官方信息源自检列表（用于搜索时附加信息源提示）
    policy_sources = (
        "工信部 发改委 能源局 市场监管总局 财政部 商务部 "
        "中国电池工业协会 中国化学与物理电源行业协会 "
        "中关村储能产业技术联盟 中国储能网"
    )

    tasks.append({
        "id": "policy",
        "label": "政策监控",
        "query": f"{' '.join(policy_query_kws)} {D2} {D7}",
        "policy_sources_hint": policy_sources,
        "max_results": 25,
        "covers": DEPT_IDS,
        "time_window": f"{D7}至{D2}",
        "time_window_days": 7,
        "description": (
            "政策+龙头企业动态，所有BU联动参考（T-7扩大窗口）。"
            "覆盖7大产业链环节：上游锂资源、中游材料制造、下游电池储能、"
            "终端新能源汽车、储能专项、回收循环、贸易出口。"
        ),
    })

    return tasks


def gen_tasks_markdown(tasks: List[Dict]) -> str:
    """
    生成完整的可执行工作流指令。
    这份内容会被显示在 Workbuddy 对话中，直接告诉它"执行以下步骤"。
    """
    task_blocks = []
    for i, task in enumerate(tasks, 1):
        tw_days = task.get("time_window_days", 2)
        tw_note = "（扩大窗口）" if tw_days > 2 else ""
        task_blocks.append(f"""### 搜索任务 {i}/{len(tasks)}：{task['label']} {tw_note}
**覆盖事业部**：{', '.join(task['covers'])}
**时间窗口**：{task['time_window']}（T至T-{tw_days}）
**说明**：{task['description']}

请用 WebSearch 工具执行以下搜索，返回 {task['max_results']} 条结果：

> **搜索词**：`{task['query']}`

返回结果时请确保每条包含：title（标题）、content（正文摘要，100字以上）、url（链接）、date（YYYY-MM-DD格式）、source（来源名称）。
""")

    task_blocks_str = "\n\n".join(task_blocks)

    md = f"""# 龙蟠科技早报 · 搜索工作流

> **当前终端**：{PATHS["terminal_name"]}
> 如需切换终端，执行脚本时加参数 `--terminal trae` 或 `--terminal custom --input-dir ./data`
>
> | 终端 | 命令 |
> |------|------|
> | Workbuddy / Claude Code | `python generate_html_report.py --gen-tasks` |
> | Trae | `python generate_html_report.py --gen-tasks --terminal trae` |
> | 自定义路径 | `python generate_html_report.py --gen-tasks --terminal custom --input-dir /你的路径 --report-dir /你的路径/reports` |

## 执行步骤（请按顺序完成）

请依次执行以下 **{len(tasks)} 个搜索任务**，将所有结果汇总保存后，运行报告生成脚本。

---

{task_blocks_str}

---

## 汇总保存

请将上述 **{len(tasks)} 个任务**的全部搜索结果汇总为 **JSON 数组**（每条包含 title、content、url、date、source 五个字段），保存到以下路径：

```
{PATHS["search_input"]}
```

**重要**：content 字段必须包含正文摘要（不少于100字），不能只是标题。

---

## 运行报告生成脚本

搜索结果保存完毕后，运行以下命令（根据你的终端选择对应命令）：

**Workbuddy / Claude Code（Windows）：**
```powershell
python "{PATHS['script_path']}"
```

**Trae（跨平台）：**
```bash
python3 ./generate_html_report.py
```

脚本将自动读取 search_results.json，生成今日早报 JSON 文件。

---

## mx_search 查询任务生成（Track A · eastmoney 妙想资讯）

以下查询专为 eastmoney mx_search 优化，每个 query 覆盖一个 BU 的全维度信息，
每条 query = 精准公司/行业词 + 公告/互动易/机构调研 + 时间窗口。
全9个BU共9条查询，每日调用9次（远低于50次/天上限）。

---
"""


def build_mx_queries() -> List[Dict]:
    """
    为每个BU构建一条精准的 mx_search query。
    策略：每个BU 1条 batch query = 核心公司词 + 关键维度词 + 信息类型 + 时间窗。
    """
    configs = load_bu_configs()
    queries = []

    # 定义每条query的后缀模板（信息类型 + 时间）
    suffix = f"公告 互动易 机构调研 {D3} {D2}"

    for bu_id in DEPT_IDS:
        cfg = configs.get(bu_id, {})
        if not cfg:
            continue

        # 收集该BU所有关键词
        kws = set(cfg.get("search", {}).get("core_keywords", []))
        for mkws in cfg.get("modules", {}).values():
            if isinstance(mkws, dict):
                kws.update(mkws.get("keywords", []))
                kws.update(mkws.get("core_competitors", []))
                kws.update(mkws.get("core_customers", []))

        # 取最长最具体的20个词（避免 query 过长）
        sorted_kws = sorted(kws, key=lambda x: -len(x))[:20]
        kw_str = " ".join(sorted_kws)
        query = f"{kw_str} {suffix}"

        queries.append({
            "bu_id": bu_id,
            "bu_name": cfg.get("division_name", bu_id),
            "query": query,
            "max_results": 10,
        })

    return queries


def gen_mx_tasks_markdown(queries: List[Dict]) -> str:
    """
    生成可直接执行的 mx_search 查询任务。
    每条 query 附带的 JSON 保存指令。
    """
    task_blocks = []
    for i, q in enumerate(queries, 1):
        task_blocks.append(f"""### mx_search 任务 {i}/9：{q['bu_name']}（{q['bu_id']}）

**覆盖事业部**：{q['bu_name']}
**搜索 query**：

```
{q['query']}
```

请用 mcp_call_tool 执行以下调用（工具：eastmoney-mx-search / mx_finance_search）：

```json
{{
  "query": "{q['query']}",
  "max_results": {q['max_results']}
}}
```

""")

    task_blocks_str = "\n".join(task_blocks)

    # JSON 汇总格式说明
    json_format = """
## 汇总保存

将上述全部 **9个BU** 的搜索结果合并为一个 JSON 文件，保存到：

```
D:/trae/AI Daily report/search_results.json
```

**JSON 格式要求**：
```json
[
  {
    "title": "文章标题",
    "content": "正文摘要（100字以上，越长越好）",
    "url": "https://...",
    "date": "2026-04-10",
    "source": "东方财富/互动易/机构调研等"
  },
  ...
]
```

**重要**：
- content 字段必须包含正文摘要，不可以只是标题
- date 格式必须为 YYYY-MM-DD
- source 填写来源平台名称
- 允许不同BU的 query 命中相同条目（脚本内部会去重）
- 如果某个BU的 query 返回为空，也要保留该BU的空结果占位

---
"""

    return f"""
# 龙蟠科技早报 · mx_search 查询任务（Track A）

> **当前终端**：{PATHS["terminal_name"]}
> **执行模式**：eastmoney mx_search（主力） + Tavily 补充（兜底）

## 执行步骤

请依次执行以下 **{len(queries)} 个 mx_search 查询**，将结果保存为 `search_results.json` 后，运行报告生成脚本。

---
{json_format}

## 查询任务详情

{task_blocks_str}

## 运行报告生成

搜索结果保存完毕后，执行：

```powershell
python "D:/trae/AI Daily report/generate_html_report.py"
```
"""

if __name__ == "__main__":
    # args已在文件头部解析
    # 生成搜索任务模式（无需输入文件）
    if _args.gen_tasks:
        tasks = build_search_tasks()
        print(gen_tasks_markdown(tasks))
        sys.exit(0)

    # 生成 mx_search 查询任务（无需输入文件）
    if _args.gen_mx_tasks:
        queries = build_mx_queries()
        print(gen_mx_tasks_markdown(queries))
        sys.exit(0)

    # 定位输入文件（优先用 CLI --input，否则用当前终端预设路径）



def gen_tasks_json(tasks: List[Dict]) -> str:
    """生成结构化的 JSON 格式搜索任务（供程序调用）"""
    return json.dumps({
        "date": DATE_STR,
        "time_window": {"start": WINDOW_START, "end": WINDOW_END},
        "window_str": f"{D3}至{D2}",
        "tasks": tasks,
    }, ensure_ascii=False, indent=2)


# ============================================================
# 市场数据拉取层（Layer 2）
# ============================================================

def fetch_market_data() -> List[Dict]:
    """
    拉取市场数据作为早报市场栏目的兜底内容。
    数据来源优先级：
    1. 本地预置文件 market_lc.json（碳酸锂期货，东方财富已更新）
    2. East Money 公开行情 API（其他商品）
    若均失败，返回空列表，run() 继续正常执行，不阻塞主流程。
    """
    market_items = []
    configs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                "..", "..", "buddy", "skills",
                                "lithium-division-morning-report", "configs")

    # ── 1. 优先读取本地预置的碳酸锂期货数据 ───────────────────
    #    由独立采集脚本每天更新到 reports/market_lc.json
    market_lc_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..", "..", "trae", "AI Daily report", "reports", "market_lc.json"
    )
    if os.path.exists(market_lc_path):
        try:
            with open(market_lc_path, "r", encoding="utf-8") as f:
                lc_data = json.load(f)
            update_time = lc_data.get("update_time", "")
            for contract in lc_data.get("contracts", []):
                if contract.get("code") in ("lcm", "lcs", "lc2704"):
                    price = contract.get("price", 0)
                    change_pct = contract.get("change_pct", 0)
                    trend = "上涨" if change_pct > 0 else ("下跌" if change_pct < 0 else "持平")
                    market_items.append({
                        "title": f"广期所{contract.get('name','碳酸锂')}行情",
                        "content": (
                            f"最新价 {price:,.0f} 元/吨，较前日{change_pct:+.2f}%，"
                            f"今日{trend}。数据更新于 {update_time}。"
                        ),
                        "url": "",
                        "date": DATE_STR,
                        "source": f"东方财富·{contract.get('name','')}",
                        "category": "market",
                        "is_market_data": True,
                    })
            print(f"  [市场数据] 从 market_lc.json 加载 {len(market_items)} 条碳酸锂行情")
        except Exception as e:
            print(f"  [WARN] market_lc.json 读取失败: {e}")

    # ── 2. 尝试从 East Money API 拉取其他商品行情 ─────────────
    #    广期所碳酸锂期货主力合约 secid=225.lcm
    #    铂金期货 SHFE: 231.au（东方财富格式）
    try:
        import urllib.request
        import urllib.error

        def fetch_quote(secid: str) -> Optional[Dict]:
            url = (
                f"https://push2.eastmoney.com/api/qt/stock/get?"
                f"secid={secid}&fields=f43,f57,f58,f107,f169,f170,f47,f48,f60&ut=fa5fd1943c7b386f172d6893dbfba10b"
            )
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            return data.get("data")

        # 尝试获取碳酸锂主连行情
        lc_quote = fetch_quote("225.lcm")
        if lc_quote:
            price = lc_quote.get("f43", 0) / 100.0  # f43=最新价，单位百元
            prev_close = lc_quote.get("f60", 0) / 100.0
            change_pct = ((price - prev_close) / prev_close * 100) if prev_close else 0
            existing = [x for x in market_items if "碳酸锂" in x.get("title", "")]
            if not existing:
                market_items.append({
                    "title": f"广期所碳酸锂主连实时行情",
                    "content": f"最新价 {price:,.0f} 元/吨，较前日{change_pct:+.2f}%。",
                    "url": "https://quote.eastmoney.com/225.lcm.html",
                    "date": DATE_STR,
                    "source": "东方财富",
                    "category": "market",
                    "is_market_data": True,
                })
            print(f"  [市场数据] 从东方财富API拉取碳酸锂主连成功")
    except Exception as e:
        print(f"  [WARN] 东方财富API拉取失败（不影响主流程）: {e}")

    return market_items


def run(input_items: List[Dict], open_browser: bool = False):
    # 动态计算时间窗口显示
    DW_START = (TODAY - timedelta(days=window_days)).strftime("%Y年%m月%d日")
    DW_END = D2  # 结束日期总是T-1
    print(f"\n{'='*60}")
    print(f"  时间窗：{DW_START}至{DW_END}（T至T-{window_days}）")
    print(f"  输入条目：{len(input_items)} 条")
    print(f"  输出目录：{REPORTS_DIR}")
    print(f"  特性：旧闻复验三步法 | 多级回落L1→L4 | 动态读取configs/*.json")
    print('='*60)

    os.makedirs(REPORTS_DIR, exist_ok=True)

    # 动态加载所有BU配置
    configs = load_bu_configs()
    if configs:
        print(f"\n[配置] 成功加载 {len(configs)} 个BU配置:")
        for bid, cfg in configs.items():
            modules = cfg.get("modules", {})
            dim_order = modules.get("dimension_order", ["policy/competitor/customer/frontier/market"])
            print(f"  [{bid}] {cfg.get('division_name','?')} — 维度: {dim_order}")
    else:
        print(f"\n[WARN] 未加载到configs，使用内置默认值")

    print(f"\n--- Step 1 · 关键词匹配 + 旧闻复验 ---")
    matched_all = {}
    for bu_id in DEPT_IDS:
        items = match_items(input_items, bu_id, configs)
        # 旧闻复验
        for item in items:
            rechk = recheck_item(item, bu_id, configs)
            item.update(rechk)
        matched_all[bu_id] = items
        high = len([x for x in items if x.get("confidence") == "high"])
        med = len([x for x in items if x.get("confidence") == "medium"])
        low = len([x for x in items if x.get("confidence") == "low"])
        print(f"  [{bu_id}] 匹配 {len(items)} 条 (高{high}/中{med}/低{low})")

    # ── Layer 1.5: 行业级新闻兜底 ─────────────────────────────────────────
    # 行业重大新闻（整治办法、宏观政策、大客户动态）不包含具体BU名称，
    # 但与所有事业部相关。用全局行业关键词兜底，确保不被漏掉。
    global_ind_kws = [
        # 锂电行业通用词（精确匹配，防止泛化词误捕制动器衬片等无关公告）
        "动力电池", "储能电池", "锂电池", "锂离子电池", "固态电池",
        "钠电池", "钠离子电池", "正极材料", "磷酸铁锂", "三元材料",
        "电解液", "六氟磷酸锂", "隔膜", "电池回收", "电池回收利用",
        "碳酸锂", "氢氧化锂", "锂盐", "锂辉石", "盐湖提锂",
        "电池厂", "正极厂", "材料厂",
        # 政策/监管类（仅保留精准的政府发文信号词）
        "工信部", "工业和信息化部", "发改委", "国家发展改革委", "国家发改委",
        "能源局", "国家能源局", "生态环境部", "市场监管总局",
        "财政部", "商务部", "交通运输部",
        "行业规范条件", "管理暂行办法", "实施办法", "行动方案", "指导意见",
        "补贴政策", "征求意见稿", "标准体系",
        # 【重要】明确政策文件名关键词：精确捕获六部门/四部门废旧电池政策
        "废旧动力电池", "废旧动力电池回收", "回收和综合利用",
        "行业竞争秩序", "反内卷",
        # 大客户/大供应商
        "宁德时代", "比亚迪", "亿纬锂能", "中创新航", "国轩高科",
        "欣旺达", "LG新能源", "松下", "三星SDI",
    ]
    # 收集所有已匹配条目的唯一标识（防止重复注入）
    matched_urls = set()
    for bu_items in matched_all.values():
        for item in bu_items:
            uid = item.get("_uid") or (item.get("url", "") + item.get("title", ""))
            matched_urls.add(uid)

    injected_items = []  # 已注入的行业级条目（按uid去重）
    injected_count = 0
    for item in input_items:
        title = item.get("title", "")
        content = item.get("content", "")
        combined = title + " " + content
        uid = (item.get("url", "") or "") + title
        if uid in matched_urls:
            continue
        if any(kw in combined for kw in global_ind_kws):
            injected_items.append(uid)
            for bu_id in DEPT_IDS:
                item_copy = {
                    "_uid": uid + f"_global_{bu_id}",
                    "title": title,
                    "content": (content or "")[:500],
                    "url": item.get("url", ""),
                    "date": item.get("date", ""),
                    "source": item.get("source", item.get("url", "")[:60]),
                    "confidence": _calc_confidence(item.get("date", "")),
                    "fallback_level": "L2_global_kw",
                    "old_news_reason": "",
                    "is_global_fallback": True,
                }
                rechk = recheck_item(item_copy, bu_id, configs)
                item_copy.update(rechk)
                if item_copy.get("fallback_level") in ("L1", "L2", "L3"):
                    # 【修复 2026-04-12】：注入后立即对含政策信号词的文章重新分类
                    # 全局行业层不调用 classify_module，导致"六部门"等政策文章被归入错误栏目
                    text_for_classify = (item_copy.get("title") or "") + " " + (item_copy.get("content") or "")
                    mod, is_prio = classify_module(text_for_classify, bu_id, configs)
                    item_copy["module"] = mod
                    item_copy["is_priority"] = is_prio
                    matched_all.setdefault(bu_id, []).append(item_copy)
                    injected_count += 1
            matched_urls.add(uid)

    if injected_items:
        print(f"  [行业兜底] 全局关键词命中 {len(injected_items)} 条行业新闻，散入各BU (+{injected_count}条次)")

    # ── Layer 1.7: 政策类文章全BU强制注入 ──────────────────────────────
    # 问题：已被某BU关键词匹配的文章（如"六部门联合印发..."被sdmd匹配），
    # 不会通过 global_ind_kws 层注入其他BU。
    # 本层专门找出含政策信号词的文章（政府机构+政策类型词），强制注入所有BU。
    # 2026-04-12 修复：确保重大政策公告（如六部门/四部门文件）全BU覆盖。
    policy_signal_kws = [
        "六部门", "七部门", "部门联合", "人民政府", "市场监管局",
        "工业和信息化部", "国家发展改革委", "国家能源局", "生态环境部",
        "工信部", "发改委", "能源局", "市场监管总局",
        "四部门", "五部门", "三部门", "二部门",
        # 政策文件类型
        "废旧动力电池回收", "回收和综合利用", "竞争秩序", "行业竞争秩序",
        "锂离子电池行业规范", "新型储能技术",
    ]
    policy_type_kws = [
        "管理暂行办法", "实施办法", "行动方案", "指导意见", "补贴政策",
        "征求意见稿", "标准体系", "行业规范条件", "废旧动力电池",
    ]

    policy_injected = 0
    for item in input_items:
        title = item.get("title", "")
        content = item.get("content", "")
        combined = title + " " + content
        # 判断是否为政策类文章：含政府机构词 OR 含政策类型词
        has_gov = any(kw in combined for kw in policy_signal_kws)
        has_type = any(kw in combined for kw in policy_type_kws)
        if not (has_gov or has_type):
            continue

        uid = (item.get("url", "") or "") + title
        for bu_id in DEPT_IDS:
            # 跳过已有该文章的BU（避免重复）
            bu_uids = set(x.get("_uid", "") for x in matched_all.get(bu_id, []))
            if uid in bu_uids or uid + f"_global_{bu_id}" in bu_uids:
                continue
            # 跳过已有政策条目的BU（保留最早/最高置信的政策文章）
            bu_policy = [x for x in matched_all.get(bu_id, []) if x.get("module") == "policy" and x.get("fallback_level") in ("L1", "L2")]
            if bu_policy:
                continue
            item_copy = {
                "_uid": uid + f"_pol_{bu_id}",
                "title": title,
                "content": (content or "")[:500],
                "url": item.get("url", ""),
                "date": item.get("date", ""),
                "source": item.get("source", item.get("url", "")[:60]),
                "confidence": _calc_confidence(item.get("date", "")),
                "fallback_level": "L2_policy_forced",
                "old_news_reason": "",
                "is_global_fallback": True,
            }
            rechk = recheck_item(item_copy, bu_id, configs)
            item_copy.update(rechk)
            if item_copy.get("fallback_level") in ("L1", "L2", "L3"):
                matched_all.setdefault(bu_id, []).append(item_copy)
                policy_injected += 1

    if policy_injected:
        print(f"  [政策强制注入] {policy_injected} 条政策文章补充到各BU")

    # ── Layer 2: 市场数据兜底 ──────────────────────────────────
    # 若某BU匹配结果中无market类条目，自动注入 fetch_market_data() 结果
    market_items = fetch_market_data()
    if market_items:
        for bu_id in DEPT_IDS:
            bu_items = matched_all.get(bu_id, [])
            market_section = [x for x in bu_items if classify_module(
                x.get("title", "") + x.get("content", ""), bu_id, configs)[0] == "market"]
            if not market_section:
                for mkt in market_items:
                    mkt_copy = dict(mkt)
                    mkt_copy["confidence"] = "medium"
                    mkt_copy["fallback_level"] = "L2_market_fetch"
                    mkt_copy["old_news_reason"] = ""
                    mkt_copy["_uid"] = f"mkt_{bu_id}_{mkt_copy.get('source','')}_{DATE_STR}"
                    matched_all.setdefault(bu_id, []).append(mkt_copy)
                print(f"  [市场兜底] [{bu_id}] 无market条目 → 注入 {len(market_items)} 条行情数据")

    print(f"\n--- Step 2 · 多级回落 + 八栏目生成 ---")
    all_depts = {}
    for bu_id in DEPT_IDS:
        dept_report = build_department(bu_id, matched_all.get(bu_id, []), configs)
        all_depts[bu_id] = dept_report

        # 打印各维度条目数
        for sec, items in dept_report.get("sections", {}).items():
            if items:
                fb_tags = " [背景]" if any(x.get("background_ref") for x in items) else ""
                print(f"  [{bu_id}] {sec}: {len(items)}条{fb_tags}")

    print(f"\n--- Step 3 · 写入JSON ---")
    output_data = {
        "date": DATE_STR,
        "window_start": WINDOW_START,
        "window_end": WINDOW_END,
        "departments": all_depts,
    }

    output_path = os.path.join(REPORTS_DIR, f"{DATE_STR}.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    size_kb = os.path.getsize(output_path) // 1024
    print(f"  [OK] {DATE_STR}.json ({size_kb}KB)")

    update_index(DATE_STR)

    print(f"\n{'='*60}")
    print(f"  生成完毕！")
    print(f"  文件：{output_path}")
    print(f"  事业部：{len(all_depts)} 个")
    print('='*60)

    if open_browser:
        html_path = os.path.join(os.path.dirname(REPORTS_DIR), "index_logo_v2.html")
        if os.path.exists(html_path):
            print(f"\n  正在打开浏览器...")
            webbrowser.open(f"file:///{html_path}")

    return output_data


# ============================================================
# 入口
# ============================================================

if __name__ == "__main__":
    # args已在文件头部解析
    # 生成搜索任务模式（无需输入文件）
    if _args.gen_tasks:
        tasks = build_search_tasks()
        print(gen_tasks_markdown(tasks))
        sys.exit(0)

    # 定位输入文件（优先用 CLI --input，否则用当前终端预设路径）
    input_path = _args.input or PATHS["search_input"]
    if not os.path.isabs(input_path):
        script_dir = os.path.dirname(os.path.abspath(__file__))
        input_path = os.path.join(script_dir, input_path)

    if not os.path.exists(input_path):
        print(f"[ERROR] 输入文件不存在: {input_path}")
        print(f"请先在对话中生成搜索结果，保存为 search_results.json 后再运行本脚本。")
        print(f"\n  search_results.json 格式：")
        print(f"  [")
        print(f"    {{'title': '...', 'content': '...', 'url': '...', 'date': 'YYYY-MM-DD', 'source': '...'}}, ...")
        print(f"  ]")
        sys.exit(1)

    with open(input_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    # 兼容两种格式
    if isinstance(raw_data, list):
        input_items = raw_data
    elif isinstance(raw_data, dict):
        input_items = raw_data.get("results", raw_data.get("items", []))
    else:
        print(f"[ERROR] 无法解析输入文件格式")
        sys.exit(1)

    print(f"读取输入文件: {input_path}")
    print(f"条目数: {len(input_items)}")

    if _args.inspect:
        print(f"\n=== 输入数据摘要 ===")
        for i, item in enumerate(input_items[:30]):
            t = item.get("title", "?")[:40]
            d = item.get("date", "?")
            c = item.get("content", "")[:30].replace("\n", " ")
            print(f"  [{i+1}] [{d}] {t}")
            if c and c != "?":
                print(f"       {c}...")
        if len(input_items) > 30:
            print(f"  ... 共 {len(input_items)} 条")
        sys.exit(0)

    run(input_items, open_browser=_args.open)
