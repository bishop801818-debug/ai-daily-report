#!/usr/bin/env python3
"""
tavily_search_helper.py
=======================
直接调用 Tavily Search API（绕过 MCP），作为早报 Layer1 数据的主力搜索。

API Key 从 ~/.workbuddy/mcp.json 读取 tavily-search 配置。
免费配额：1000次/月，10次/天。

返回格式（与 search_results.json 兼容）：
  {
    "title": "...",
    "content": "...",
    "url": "...",
    "date": "YYYY-MM-DD（从URL提取）",
    "source": "tavily"
  }

用法：
    python tavily_search_helper.py --build-queries [configs_dir]
    python tavily_search_helper.py --dry-run
    python tavily_search_helper.py --run [--output path] [--date "2026年4月上旬"]
"""
import json
import os
import re
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

# ============================================================
# API 配置
# ============================================================
TAVILY_API_URL = "https://api.tavily.com/search"


def load_tavily_key() -> str:
    """从 ~/.workbuddy/mcp.json 读取 tavily-search 的 API Key"""
    mcp_path = os.path.join(os.path.expanduser("~"), ".workbuddy", "mcp.json")
    try:
        with open(mcp_path, "r", encoding="utf-8") as f:
            cfg = json.load(f)
        servers = cfg.get("mcpServers", {})
        for name, server in servers.items():
            if "tavily" in name.lower():
                env = server.get("env", {})
                key = env.get("TAVILY_API_KEY", "")
                if key:
                    return key
    except Exception:
        pass

    # 备选：直接硬编码（已从 mcp.json 确认）
    return "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"


# ============================================================
# 日期提取
# ============================================================

def extract_date_from_url(url: str) -> Optional[str]:
    """从 URL 路径提取日期"""
    if not url:
        return None

    # 格式1：/2026/04/08/ 或 /2026-04-08/
    m = re.search(r"/(20\d{2})[/-](\d{2})[/-](\d{2})/", url)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"

    # 格式2：连写 /20260408/ 或 _20260408_ 或 /202604073696706865.html
    m = re.search(r"[/_-](20\d{2})(\d{2})(\d{2})(?=[/_-]|\.|$)", url)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"

    # 格式2b：直接以 .html 结尾但前面是日期 /20260407abc.html
    m = re.search(r"/(20\d{2})(\d{2})(\d{2})\d+\.html", url)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"

    # 格式3：新浪/腾讯等 /20260408A...
    m = re.search(r"/(20\d{2})(\d{2})(\d{2})[A-Z/]", url)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"

    return None


def extract_date_from_snippet(snippet: str, title: str) -> Optional[str]:
    """从 snippet/title 中推断日期（兜底）"""
    text = (snippet or "") + " " + (title or "")

    # 匹配 YYYY年MM月DD日
    m = re.search(r"(20\d{2})年(\d{1,2})月(\d{1,2})日", text)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"

    # 匹配 YYYY-MM-DD
    m = re.search(r"(20\d{2})-(\d{2})-(\d{2})", text)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"

    return None


# ============================================================
# Tavily API 调用
# ============================================================

def tavily_search(query: str, api_key: str, max_results: int = 8,
                 days_back: int = 14) -> List[Dict[str, str]]:
    """
    直接调用 Tavily API，返回标准化结果。
    days_back: 搜索时间窗口，默认14天内的文章优先。
    """
    print(f"  [Tavily] max={max_results} | {query[:55]}...")

    # 在 query 中附加时间约束（时间点优先）
    # Tavily 支持 "time:week" / "time:month" / "time:pd"(自定义日期)
    if days_back <= 3:
        time_hint = "time:day"
    elif days_back <= 7:
        time_hint = "time:week"
    elif days_back <= 30:
        time_hint = "time:month"
    else:
        time_hint = f"time:{days_back}d"

    enriched_query = f"{query} {time_hint}"

    payload = {
        "api_key": api_key,
        "query": enriched_query,
        "max_results": max_results,
        "search_depth": "advanced",   # 用 advanced 优先返回最新文章
        "include_answer": True,
        "include_images": False,
        "include_raw_content": False,
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        TAVILY_API_URL,
        data=data,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        print(f"  [ERROR] HTTP {e.code}: {e.reason}")
        return []
    except Exception as e:
        print(f"  [ERROR] {e}")
        return []

    try:
        obj = json.loads(body)
    except json.JSONDecodeError:
        print(f"  [ERROR] 非JSON响应: {body[:200]}")
        return []

    items = []
    for r in (obj.get("results") or [])[:max_results]:
        title = r.get("title") or ""
        url = r.get("url") or ""
        snippet = r.get("content") or ""
        source = "tavily"

        # 提取日期
        date = extract_date_from_url(url)
        if not date:
            date = extract_date_from_snippet(snippet, title)

        items.append({
            "title": title,
            "content": snippet.strip(),
            "url": url,
            "date": date or "",
            "source": source,
        })

    print(f"  [Tavily] → {len(items)} 条")
    return items


# ============================================================
# 构建 BU Batch Query
# ============================================================

def load_bu_configs(configs_dir: str) -> Dict[str, Dict]:
    BU_FILES = {
        "czly": "常州锂源.json", "sdmd": "山东美多.json",
        "sjld": "三金锂电.json", "lpsd": "龙蟠时代.json",
        "felt": "法恩莱特.json", "kls":  "可兰素.json",
        "lhy":  "润滑油.json",   "dhx":  "迪克化学.json",
        "bych": "铂源催化.json",
    }
    configs = {}
    for bu_id, fname in BU_FILES.items():
        path = os.path.join(configs_dir, fname)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                configs[bu_id] = json.load(f)
    return configs


def build_bu_queries(configs_dir: str, date_window: str = "2026年") -> List[Dict]:
    """
    核心策略：按公司定向搜索（而非按主题搜索）。
    
    每个BU下：
    1. 收集 BU自身 + 所有核心竞争对手 + 所有核心客户
    2. 对每个公司构建1条定向查询："{公司} 公告 互动易 机构调研 投资 业绩"
    3. 这样搜索结果几乎全是该公司近期真实公告，质量极高
    
    事件类型（每个query都包含）：
    公告 | 互动易 | 机构调研 | 投资 | 扩产 | 业绩 | 中标 | 订单
    """
    configs = load_bu_configs(configs_dir)
    queries = []

    EVENT_TYPES = "公告 互动易 机构调研 投资 扩产 业绩"

    for bu_id, cfg in configs.items():
        bu_name = cfg.get("division_name", bu_id)

        # 收集公司集合
        companies = {bu_name}  # BU自身
        for mod in cfg.get("modules", {}).values():
            if isinstance(mod, dict):
                companies.update(mod.get("core_competitors", []))
                companies.update(mod.get("core_customers", []))

        # 对每个公司建1条定向query
        for company in sorted(companies, key=lambda x: -len(x)):
            if len(company) < 2:
                continue
            query = f"{company} {EVENT_TYPES} {date_window}"
            queries.append({
                "id": bu_id,
                "bu_name": bu_name,
                "query": query,
                "max_results": 5,
                "_company": company,
            })

    print(f"[Query Build] 共 {len(queries)} 个定向搜索任务（{len(configs)} 个BU × 平均{len(queries)//len(configs)}个公司）")
    return queries


# ============================================================
# 噪音过滤
# ============================================================

PRECISE_NOISE = [
    '财富号', '新浪财经_金融信息服务商', 'App', '网易订阅',
    '行情走势', '同花顺', '东方财富股吧', '雪球',
    '涨停分析', '主力净流入', '飙涨超7倍',
    '盘后公告精选', '调研速递',
]

SIGNAL_WORDS = [
    '公告', '调研', '投资者关系', '业绩预告', '预增', '预减',
    '协议', '签约', '投资协议', '合作框架',
    '扩产', '新建', '投资', '中标', '订单',
    '互动易', '回购', '分红', '股权激励',
    '磷酸铁锂', '碳酸锂', '电解液', '六氟磷酸锂',
    '储能电池', '固态电池', '钠离子电池',
    '清洁化', '一体化', '回收',
    '一季度', '半年度', '年度', '净利', '净利润', '营收',
    '交流会', '说明会', '活动记录',
]

def score_item(item):
    """
    过滤噪音，保留有价值事件。
    """
    title = item.get('title', '') or ''
    content = item.get('content', '') or ''
    text = title + ' ' + content[:300]

    for kw in PRECISE_NOISE:
        if kw in text:
            return 'NOISE', kw

    signals = []
    for kw in SIGNAL_WORDS:
        if kw in text:
            signals.append(kw)

    if signals:
        return 'SIGNAL', signals[:2]
    return 'UNCERTAIN', []


# ============================================================
# 主流程
# ============================================================

def run_search(queries: List[Dict], output_path: str,
               delay: float = 0.8, days_back: int = 14) -> List[Dict]:
    """
    执行所有搜索，合并去重后写入 search_results.json。
    days_back: 时间窗口天数（影响 time: 搜索参数）
    """
    api_key = load_tavily_key()
    all_flat = []
    seen_urls = set()

    for q in queries:
        search_id = q["id"]
        query = q["query"]
        max_r = q.get("max_results", 8)

        results = tavily_search(query, api_key, max_r, days_back=days_back)

        for item in results:
            url = item.get("url", "")
            if url and url in seen_urls:
                continue
            if url:
                seen_urls.add(url)

            flat = dict(item)
            flat["_search_id"] = search_id

            # 噪音过滤
            verdict, reason = score_item(flat)
            flat["_quality"] = verdict
            if verdict == "NOISE":
                continue  # 跳过噪音

            all_flat.append(flat)

        time.sleep(delay)

    # 写入前：按日期过滤（只保留30天以内的）
    cutoff = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
    before_filter = len(all_flat)
    all_flat = [x for x in all_flat if not x.get("date") or x["date"] >= cutoff]
    print(f"  [Filter] 30天过滤: {before_filter} → {len(all_flat)} 条 (排除了{before_filter - len(all_flat)}条)")

    # 按日期降序+信号分排序
    all_flat.sort(key=lambda x: (
        x.get("date", "") < "2026-04-08",  # 优先4月8日以后
        x.get("_quality") != "SIGNAL",    # SIGNAL优先
        x.get("date", "0")
    ), reverse=True)

    # 写入
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_flat, f, ensure_ascii=False, indent=2)

    print(f"\n[OK] {len(all_flat)} 条 → {output_path}")

    by_bu = {}
    for item in all_flat:
        sid = item.get("_search_id", "?")
        by_bu[sid] = by_bu.get(sid, 0) + 1
    for sid, cnt in sorted(by_bu.items()):
        print(f"     [{sid}]: {cnt} 条")

    return all_flat


# ============================================================
# CLI
# ============================================================

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Tavily 早报搜索助手")
    parser.add_argument("--build-queries", metavar="DIR",
                        help="构建 queries 并打印后退出")
    parser.add_argument("--dry-run", action="store_true",
                        help="仅打印 queries，不执行搜索")
    parser.add_argument("--run", action="store_true",
                        help="执行搜索并保存")
    parser.add_argument("--date", default="2026年4月上旬",
                        help="日期窗口描述")
    parser.add_argument("--output", "-o",
                        default="D:/trae/AI Daily report/search_results.json")
    parser.add_argument("--delay", type=float, default=0.8)
    parser.add_argument("--days", type=int, default=14,
                        help="时间窗口天数（默认14天）")
    args = parser.parse_args()

    configs_dir = args.build_queries or "d:/buddy/skills/lithium-division-morning-report/configs"
    queries = build_bu_queries(configs_dir, args.date)

    if args.dry_run or not args.run:
        print(f"共 {len(queries)} 个搜索任务 (time window: {args.days}天):")
        for q in queries:
            print(f"  [{q['id']}] {q['query'][:80]}...")

    if args.build_queries:
        print(json.dumps(queries, ensure_ascii=False, indent=2))
        sys.exit(0)

    if args.run:
        run_search(queries, args.output, delay=args.delay, days_back=args.days)
