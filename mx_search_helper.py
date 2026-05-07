#!/usr/bin/env python3
"""
mx_search_helper.py
===================
封装 eastmoney-mx-search MCP 工具的 Python 调用。

MCP Server 信息：
  - Server: eastmoney-mx-search
  - Tool: mx_finance_search
  - 通信方式: stdio (通过 node server.js)
  - API Key: mkt_Upa5DiXA6oRnIerXZt8TE2dsnSMsBZOTjtJi_aVo3DI

用法：
    python mx_search_helper.py query1 "query2" ...
    python mx_search_helper.py --batch queries.json
    python mx_search_helper.py --test
"""
import json
import sys
import os
import subprocess
from typing import List, Dict, Any, Optional

# ============================================================
# 常量
# ============================================================
MCP_SERVER_PATH = r"C:\Users\1\.workbuddy\mcp-servers\eastmoney-mx-mcp-js\server.js"
MX_APIKEY = "mkt_Upa5DiXA6oRnIerXZt8TE2dsnSMsBZOTjtJi_aVo3DI"
TOOL_NAME = "mx_finance_search"
SERVER_NAME = "eastmoney-mx-search"

# ============================================================
# MCP stdio 通信
# ============================================================

def call_mcp_tool(tool_name: str, arguments: Dict[str, Any]) -> Optional[Dict]:
    """
    通过 MCP stdio 协议调用工具。
    返回 API 响应的 data 字段内容。
    """
    # 构建 JSON-RPC 请求
    request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }

    request_json = json.dumps(request, ensure_ascii=False)

    # 启动 node 进程
    env = os.environ.copy()
    env["MX_APIKEY"] = MX_APIKEY

    try:
        proc = subprocess.Popen(
            ["node", MCP_SERVER_PATH],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
            encoding="utf-8"
        )

        stdout, stderr = proc.communicate(input=request_json + "\n", timeout=30)

        if proc.returncode != 0:
            print(f"[ERROR] MCP server return code: {proc.returncode}", file=sys.stderr)
            print(f"stderr: {stderr}", file=sys.stderr)
            return None

        # 解析响应（可能有多行，第一行是 JSON-RPC 响应）
        for line in stdout.strip().split("\n"):
            line = line.strip()
            if not line:
                continue
            try:
                response = json.loads(line)
                if response.get("jsonrpc") == "2.0" and response.get("id") == 1:
                    # 成功响应
                    if "result" in response:
                        return response["result"]
                    elif "error" in response:
                        print(f"[ERROR] MCP error: {response['error']}", file=sys.stderr)
                        return None
            except json.JSONDecodeError:
                continue

        print(f"[WARN] 未找到有效响应，stdout: {stdout[:300]}", file=sys.stderr)
        return None

    except subprocess.TimeoutExpired:
        proc.kill()
        print("[ERROR] MCP 调用超时（30秒）", file=sys.stderr)
        return None
    except Exception as e:
        print(f"[ERROR] MCP 调用异常: {e}", file=sys.stderr)
        return None


def mx_search(query: str, max_results: int = 15) -> List[Dict[str, str]]:
    """
    执行一次 mx_finance_search，返回标准化结果列表。

    返回格式：
        [{
            "title": "...",
            "content": "...",
            "url": "...",
            "date": "YYYY-MM-DD",
            "source": "..."
        }, ...]
    """
    print(f"  [mx_search] query={query[:50]}... max_results={max_results}")

    result = call_mcp_tool(TOOL_NAME, {"query": query})

    if result is None:
        print(f"  [WARN] mx_search 返回 None")
        return []

    # 解析 mx_search 的返回格式
    # 根据之前测试，返回格式是:
    # {"success": true, "data": [{"title":..., "content":..., "url":..., "date":..., "source":...}]}
    # 或者可能是 {"content": "...", "results": [...]} 等多种格式

    items = []

    # 尝试多种可能的数据路径
    candidates = []
    if isinstance(result, dict):
        # 可能在 data 字段
        if "data" in result:
            candidates.append(result["data"])
        # 可能在 results 字段
        if "results" in result:
            candidates.append(result["results"])
        # 可能在 content 字段（文本格式）
        if "content" in result and isinstance(result["content"], str):
            candidates.append(result["content"])
        # 直接是列表
        if isinstance(result, list):
            candidates.append(result)
    elif isinstance(result, list):
        candidates.append(result)
    elif isinstance(result, str):
        # 纯文本，尝试解析
        candidates.append(result)

    for candidate in candidates:
        if isinstance(candidate, list) and len(candidate) > 0:
            first = candidate[0]
            # 标准化字段映射
            if isinstance(first, dict):
                for item in candidate:
                    # 提取字段（兼容多种命名）
                    title = (
                        item.get("title") or
                        item.get("Title") or
                        item.get("name") or
                        item.get("titleStr") or
                        ""
                    )
                    content = (
                        item.get("content") or
                        item.get("Content") or
                        item.get("snippet") or
                        item.get("description") or
                        item.get("summary") or
                        item.get("text") or
                        ""
                    )
                    url = (
                        item.get("url") or
                        item.get("Url") or
                        item.get("link") or
                        item.get("src") or
                        ""
                    )
                    # 日期可能在多个位置
                    date = (
                        item.get("date") or
                        item.get("Date") or
                        item.get("publishTime") or
                        item.get("publish_time") or
                        item.get("time") or
                        ""
                    )
                    source = (
                        item.get("source") or
                        item.get("Source") or
                        item.get("media") or
                        item.get("author") or
                        ""
                    )

                    if title or content:
                        items.append({
                            "title": str(title) if title else "",
                            "content": str(content) if content else "",
                            "url": str(url) if url else "",
                            "date": str(date) if date else "",
                            "source": str(source) if source else ""
                        })
            break

    # 截取 max_results 条
    items = items[:max_results]
    print(f"  [mx_search] → {len(items)} 条结果")
    return items


def search_multiple(queries: List[Dict[str, str]], dry_run: bool = False) -> List[Dict[str, Any]]:
    """
    批量执行多个搜索。

    queries 格式：
        [{
            "id": "法恩莱特",        # 搜索任务ID
            "query": "法恩莱特 电解液...", # 搜索query
            "max_results": 15
        }, ...]

    返回格式：
        [{
            "search_id": "法恩莱特",
            "query": "...",
            "results": [...]  # mx_search 返回的标准化列表
        }, ...]
    """
    all_results = []

    for q in queries:
        search_id = q.get("id", "unknown")
        query = q.get("query", "")
        max_r = q.get("max_results", 15)

        if not query:
            print(f"[SKIP] {search_id}: 空query")
            all_results.append({"search_id": search_id, "query": query, "results": []})
            continue

        if dry_run:
            print(f"[DRY] {search_id}: {query[:60]}...")
            all_results.append({"search_id": search_id, "query": query, "results": []})
            continue

        results = mx_search(query, max_r)
        all_results.append({
            "search_id": search_id,
            "query": query,
            "results": results
        })

    return all_results


# ============================================================
# 构建每个 BU 的 batch query
# ============================================================

def load_bu_configs(configs_dir: str) -> Dict[str, Dict]:
    """从 configs 目录读取所有 BU 配置"""
    import glob

    BU_FILES = {
        "czly": "常州锂源.json",
        "sdmd": "山东美多.json",
        "sjld": "三金锂电.json",
        "lpsd": "龙蟠时代.json",
        "felt": "法恩莱特.json",
        "kls":  "可兰素.json",
        "lhy":  "润滑油.json",
        "dhx":  "迪克化学.json",
        "bych": "铂源催化.json",
    }

    configs = {}
    for bu_id, fname in BU_FILES.items():
        path = os.path.join(configs_dir, fname)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                configs[bu_id] = json.load(f)
    return configs


def build_bu_queries(configs_dir: str, date_window: str = "2026年4月上旬") -> List[Dict[str, str]]:
    """
    为每个 BU 构建一条 batch query。

    策略：
    - 收集 BU 名称 + 所有核心竞争对手 + 核心客户 + 核心产品关键词
    - 拼接为一个自然语言 query
    - 附加日期窗口提示
    """
    configs = load_bu_configs(configs_dir)
    queries = []

    for bu_id, cfg in configs.items():
        bu_name = cfg.get("division_name", bu_id)
        industry = cfg.get("industry", "")
        core_keywords = cfg.get("search", {}).get("core_keywords", [])

        # 收集核心公司（竞品+客户）
        companies = set()
        for mod in cfg.get("modules", {}).values():
            if isinstance(mod, dict):
                companies.update(mod.get("core_competitors", []))
                companies.update(mod.get("core_customers", []))

        # 核心关键词过滤（保留产品/技术/政策类）
        topic_kws = []
        for kw in core_keywords:
            # 排除过于宽泛的词
            if kw in ("锂", "电池", "新能源", "汽车"):
                continue
            topic_kws.append(kw)

        # 构建 batch query
        parts = [bu_name]
        if companies:
            # 限制公司数量不超过8个，避免query过长
            companies_list = sorted(companies, key=lambda x: -len(x))[:8]
            parts.append(" ".join(companies_list))
        if topic_kws:
            topic_part = " ".join(topic_kws[:5])
            parts.append(topic_part)
        parts.append(industry)

        base_query = " ".join(parts)
        # 附加日期窗口
        query = f"{base_query} {date_window} 公告 互动易 机构调研"

        queries.append({
            "id": bu_id,
            "bu_name": bu_name,
            "query": query,
            "max_results": 20
        })

        print(f"[QUERY] {bu_id}({bu_name}): {query[:80]}...")

    return queries


def save_results_to_json(all_results: List[Dict], output_path: str):
    """
    将 mx_search 结果保存为 search_results.json 兼容格式。
    展平成单层列表，每个元素包含 search_id 来源标记。
    """
    flattened = []
    for res in all_results:
        search_id = res.get("search_id", "unknown")
        for item in res.get("results", []):
            flat_item = dict(item)
            flat_item["_search_id"] = search_id  # 标记来源
            flattened.append(flat_item)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(flattened, f, ensure_ascii=False, indent=2)

    print(f"\n[OK] 保存 {len(flattened)} 条结果 → {output_path}")
    return flattened


# ============================================================
# CLI 入口
# ============================================================

if __name__ == "__main__":
    if "--test" in sys.argv:
        print("=== mx_search 测试 ===")
        result = mx_search("亿纬锂能 2026年4月 公告 互动易 机构调研", max_results=5)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        sys.exit(0)

    if "--build-queries" in sys.argv:
        configs_dir = sys.argv[sys.argv.index("--build-queries") + 1] if "--build-queries" in sys.argv else r"d:/buddy/skills/lithium-division-morning-report/configs"
        date_window = "2026年4月上旬"
        for arg in sys.argv:
            if arg.startswith("--date="):
                date_window = arg[7:]
        queries = build_bu_queries(configs_dir, date_window)
        print(json.dumps(queries, ensure_ascii=False, indent=2))
        sys.exit(0)

    if "--batch" in sys.argv:
        idx = sys.argv.index("--batch") + 1
        batch_file = sys.argv[idx]
        with open(batch_file, "r", encoding="utf-8") as f:
            queries = json.load(f)
        print(f"执行 {len(queries)} 个搜索任务...")
        results = search_multiple(queries)
        save_results_to_json(results, "mx_search_results.json")
        sys.exit(0)

    # 直接接受命令行query
    queries = [{"id": f"query{i+1}", "query": q, "max_results": 15} for i, q in enumerate(sys.argv[1:]) if q]
    if not queries:
        print("用法:")
        print("  python mx_search_helper.py --test")
        print("  python mx_search_helper.py --build-queries [configs_dir] [--date=2026年4月上旬]")
        print("  python mx_search_helper.py --batch queries.json")
        print("  python mx_search_helper.py \"法恩莱特 电解液 2026年4月\" \"亿纬锂能 公告\"")
        sys.exit(1)

    print(f"执行 {len(queries)} 个搜索...")
    results = search_multiple(queries)
    save_results_to_json(results, "mx_search_results.json")
