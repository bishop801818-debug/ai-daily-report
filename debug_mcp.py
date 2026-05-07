#!/usr/bin/env python3
"""调试：直接打印 MCP 原始响应"""
import json, subprocess, os

MCP_SERVER_PATH = r"C:\Users\1\.workbuddy\mcp-servers\eastmoney-mx-mcp-js\server.js"
MX_APIKEY = "mkt_Upa5DiXA6oRnIerXZt8TE2dsnSMsBZOTjtJi_aVo3DI"

request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "mx_finance_search",
        "arguments": {"query": "亿纬锂能 2026年4月 公告 互动易"}
    }
}

env = os.environ.copy()
env["MX_APIKEY"] = MX_APIKEY

proc = subprocess.Popen(
    ["node", MCP_SERVER_PATH],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    env=env,
    encoding="utf-8"
)

stdout, stderr = proc.communicate(input=json.dumps(request) + "\n", timeout=30)
print(f"return code: {proc.returncode}")
print(f"stdout length: {len(stdout)}")
print(f"stdout:\n{stdout[:2000]}")
print(f"\nstderr:\n{stderr[:500] if stderr else '(empty)'}")
