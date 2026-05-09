# -*- coding: utf-8 -*-
"""
download_from_local.py
=======================
在 172.16.12.100:8089 服务器上运行此脚本，
自动从本机 http://localhost:8888/ 下载所有更新后的文件。

运行方式：
  cd "D:\trae\AI Daily report\embedded"
  py -3.12 download_from_local.py

此脚本从 8888 服务器下载最新版本，完全覆盖 embedded/ 目录。
"""
import os, sys, urllib.request, json
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

LOCAL_SERVER = "http://localhost:8888"
EMBEDDED_DIR = Path(__file__).parent.resolve()

# 需要下载的文件列表（index_v3_embedded + 其余所有）
HTML_FILES = [
    "index_v3_embedded.html",
    "dept-archive_embedded.html",
    "industry_news_embedded.html",
    "policy_center_embedded.html",
    "lfp_data_embedded.html",
    "carbonate_data_embedded.html",
    "lib_battery_data_embedded.html",
    "database_hub.html",
    "analysis_hub.html",
    "lfp_charts.html",
    "carbonate_charts.html",
    "lib_battery_charts.html",
    "lfp_report.html",
    "carbonate_analysis.html",
    "lib_battery_analysis.html",
    "archive.html",
    "archive_v3.html",
    "automotive_data_v2.html",
    "automotive_analysis.html",
    "electrolyte_data_v2.html",
    "electrolyte_analysis.html",
    "lib_battery_data_v2.html",
]

def download_file(name):
    url = f"{LOCAL_SERVER}/{name}"
    dest = EMBEDDED_DIR / name
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            data = resp.read()
        dest.write_bytes(data)
        return True, len(data)
    except Exception as e:
        return False, str(e)

def main():
    print("=" * 60)
    print("  从 localhost:8888 下载最新文件")
    print(f"  目标目录: {EMBEDDED_DIR}")
    print("=" * 60)

    print("\n检查 localhost:8888 连通性...")
    try:
        with urllib.request.urlopen(f"{LOCAL_SERVER}/", timeout=5) as r:
            print(f"[✓] 8888 服务器正常 (HTTP {r.status})")
    except Exception as e:
        print(f"[✗] 无法连接 localhost:8888: {e}")
        print("\n请确保本机 8888 服务器正在运行后再重试。")
        return

    success, failed = [], []
    for fname in HTML_FILES:
        ok, result = download_file(fname)
        if ok:
            print(f"  ✓ {fname} ({result//1024}KB)")
            success.append(fname)
        else:
            print(f"  ✗ {fname}: {result}")
            failed.append(fname)

    print(f"\n{'=' * 60}")
    print(f"完成: {len(success)} 成功, {len(failed)} 失败")
    if failed:
        print("失败列表:")
        for f in failed:
            print(f"  - {f}")
    print("=" * 60)

if __name__ == "__main__":
    main()