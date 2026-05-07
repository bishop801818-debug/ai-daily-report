#!/usr/bin/env python3
"""调试：打印完整响应内容和格式分析"""
import json, subprocess, os, re

MCP_SERVER_PATH = r"C:\Users\1\.workbuddy\mcp-servers\eastmoney-mx-mcp-js\server.js"
MX_APIKEY = "mkt_Upa5DiXA6oRnIerXZt8TE2dsnSMsBZOTjtJi_aVo3DI"

def call_mcp(query):
    request = {
        "jsonrpc": "2.0", "id": 1,
        "method": "tools/call",
        "params": {"name": "mx_finance_search", "arguments": {"query": query}}
    }
    env = os.environ.copy()
    env["MX_APIKEY"] = MX_APIKEY
    proc = subprocess.Popen(
        ["node", MCP_SERVER_PATH],
        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        env=env, encoding="utf-8"
    )
    stdout, _ = proc.communicate(input=json.dumps(request) + "\n", timeout=30)
    try:
        resp = json.loads(stdout.strip().split("\n")[0])
        content = resp.get("result", {}).get("content", [])
        if content and isinstance(content, list):
            text = content[0].get("text", "")
        else:
            text = str(content)
        return text
    except:
        return stdout[:500]

# 测试不同 query 格式，看返回内容结构
tests = [
    "亿纬锂能 2026年4月 公告 互动易",
    "天齐锂业 投资者关系 业绩说明会 2026年4月",
    "盟固利 磷酸铁锂 公告 2026年4月",
]
for t in tests:
    print(f"\n{'='*60}")
    print(f"Query: {t}")
    text = call_mcp(t)
    print(f"Raw text ({len(text)} chars):\n{text[:1500]}")
