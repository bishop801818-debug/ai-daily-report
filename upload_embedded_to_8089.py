# -*- coding: utf-8 -*-
"""
upload_embedded_to_8089.py
============================
通过 HTTP 短文件上传通道，把所有 embedded/*.html 同步到 172.16.12.100:8089。
工作原理：
  - 本机在 8765 端口启动临时 HTTP server（提供文件下载）
  - 通过 GET 参数把文件内容做 base64 编码后作为 URL 参数传递
  - 目标服务器收到后 base64 解码写入本地文件
  - 本脚本逐文件完成，最后关闭临时服务器

使用方式：py -3.12 upload_embedded_to_8089.py
（前提：本机 8888 服务器正在运行）
"""
import os, sys, base64, urllib.request, json, time, threading, http.server
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

LOCAL_EMBEDDED = Path(r"D:\trae\AI Daily report\embedded")
LOCAL_SERVER = "http://localhost:8888"
REMOTE_SERVER = "172.16.12.100"
REMOTE_PORT = 8089

HTML_FILES = [
    "index_v3_embedded.html", "dept-archive_embedded.html",
    "industry_news_embedded.html", "policy_center_embedded.html",
    "lfp_data_embedded.html", "carbonate_data_embedded.html",
    "lib_battery_data_embedded.html", "database_hub.html",
    "analysis_hub.html", "lfp_charts.html", "carbonate_charts.html",
    "lib_battery_charts.html", "lfp_report.html", "carbonate_analysis.html",
    "lib_battery_analysis.html", "archive.html", "archive_v3.html",
    "automotive_data_v2.html", "automotive_analysis.html",
    "electrolyte_data_v2.html", "electrolyte_analysis.html",
    "lib_battery_data_v2.html",
]


def download_from_local(filename):
    """从本机 8888 下载文件"""
    url = f"{LOCAL_SERVER}/{filename}"
    with urllib.request.urlopen(url, timeout=30) as resp:
        return resp.read()


def upload_to_remote(filename, content):
    """通过 GET 参数 base64 编码上传到远程 8089"""
    b64 = base64.b64encode(content).decode('ascii')
    # 构造一个特殊 URL，让远程 Python 服务器解码并写入文件
    url = (f"http://{REMOTE_SERVER}:{REMOTE_PORT}/sync_write?"
           f"filename={urllib.parse.quote(filename)}&data={b64}")
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            return resp.read().decode('utf-8', errors='replace')
    except urllib.error.HTTPError as e:
        return f"HTTP {e.code}"
    except Exception as e:
        return str(e)[:100]


def main():
    print("=" * 60)
    print("  同步 embedded/ 到 172.16.12.100:8089")
    print("=" * 60)

    print("\n检查本机 8888 连通性...")
    try:
        with urllib.request.urlopen(f"{LOCAL_SERVER}/", timeout=5) as r:
            print(f"[✓] 8888 正常 (HTTP {r.status})")
    except Exception as e:
        print(f"[✗] 无法连接 localhost:8888: {e}")
        print("请先启动 8888 服务器再重试。")
        return

    success, failed = [], []
    for fname in HTML_FILES:
        print(f"\n  处理 {fname}...", end=" ", flush=True)
        try:
            content = download_from_local(fname)
            result = upload_to_remote(fname, content)
            if "OK" in result or "Written" in result:
                print(f"✓ ({len(content)//1024}KB)")
                success.append(fname)
            else:
                print(f"✗ {result[:60]}")
                failed.append((fname, result[:80]))
        except Exception as e:
            print(f"✗ {e}")
            failed.append((fname, str(e)[:80]))

    print(f"\n{'=' * 60}")
    print(f"完成: {len(success)} 成功, {len(failed)} 失败")
    if failed:
        for f, err in failed:
            print(f"  - {f}: {err}")
        print("\n可手动复制以下文件到 172.16.12.100 的 embedded/ 目录：")
        for f in [x[0] for x in failed]:
            print(f"  {f}")
    print("=" * 60)


if __name__ == "__main__":
    main()