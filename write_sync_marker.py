#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
源同步标记写入器（供 10:05 源任务调用）。
成功出口：--status ok      --commit <hash>
失败出口：--status failed  --reason "<原因>"
标记文件：sync_marker/last_sync_ok.json
供 12:30 直传版任务的 check_source_sync.py 读取校验（硬依赖）。

注意：标记仅代表「本地源文件已准备就绪并通过部署前校验」，
与 git push / 生产版发布成败解耦（那属于生产版一致性问题，见已知风险 #2）。
"""
import os
import sys
import json
import argparse
import datetime

PROJECT = os.path.dirname(os.path.abspath(__file__))
MARKER_DIR = os.path.join(PROJECT, "sync_marker")
MARKER_FILE = os.path.join(MARKER_DIR, "last_sync_ok.json")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--status", choices=["ok", "failed"], required=True)
    p.add_argument("--reason", default="")
    p.add_argument("--commit", default="")
    args = p.parse_args()
    os.makedirs(MARKER_DIR, exist_ok=True)
    data = {
        "ok": args.status == "ok",
        "ts": datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
        "reason": args.reason or "",
        "commit": args.commit or "",
    }
    with open(MARKER_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"📝 源同步标记已写入: ok={data['ok']} ts={data['ts']} reason={args.reason or '-'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
