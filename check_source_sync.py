#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
源同步硬依赖校验（直传版发布前的第零道门禁）。
================================================
12:30 直传版任务在运行 prepublish_review 之前，先确认 10:05 源任务确实成功完成：
  - 读取 sync_marker/last_sync_ok.json
  - 文件不存在 / ok!=true / ts 非今天 / ts 过期 -> 飞书双通道告警 + exit(1) 中止发布
  - 全部通过 -> 打印 ✅ 并 exit(0)，交给后续 && 链继续审查与发布

用法：python check_source_sync.py
环境变量：SYNC_DRYRUN=1 飞书告警走 dry-run（不真实发送，仅本地验证）

设计目标：把「12:30 仅靠时间错开假设 10:05 已跑」的软依赖，升级为带成功标记的硬依赖，
防止在源任务未跑/跑崩时，直传版基于旧或残缺数据审查并发布。
"""
import os
import sys
import json
import datetime

import feishu_notify as fsn

PROJECT = os.path.dirname(os.path.abspath(__file__))
MARKER_FILE = os.path.join(PROJECT, "sync_marker", "last_sync_ok.json")
# 同源任务间隔 2.5h，设 12h 余量，主要防「昨天成功标记今天仍在」（即源任务今天没跑）
MAX_AGE_HOURS = 12


def _fail(title, msg):
    print("❌ 源同步校验未通过：", msg)
    fsn.alert(title, msg, blocked=True)
    return 1


def main():
    now = datetime.datetime.now()
    today = now.strftime("%Y-%m-%d")

    if not os.path.exists(MARKER_FILE):
        return _fail(
            "❌ 直传版发布中止：源同步未确认",
            "未找到源任务成功标记 `sync_marker/last_sync_ok.json`。\n"
            "源任务「AI早报自动同步与发布（GitHub + 妙搭）」可能未运行或尚未完成。\n"
            "为避免发布陈旧/残缺数据，直传版发布已中止。请确认 10:05 源任务已成功运行。",
        )

    try:
        with open(MARKER_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        return _fail(
            "❌ 直传版发布中止：源标记损坏",
            f"源同步标记文件读取/解析失败：{e}\n请手动删除 `sync_marker/last_sync_ok.json` 后重跑源任务。",
        )

    ok = data.get("ok") is True
    ts = data.get("ts", "")
    reason = data.get("reason", "")
    commit = data.get("commit", "")

    if not ok:
        return _fail(
            "❌ 直传版发布中止：源任务上次失败",
            f"源任务上次执行未成功（ok=false）。\n原因：{reason or '未知'}\n标记时间：{ts}\n"
            "直传版若继续发布将基于旧/残缺数据，已中止。请先修复源任务（10:05）并重跑。",
        )

    if not ts.startswith(today):
        return _fail(
            "❌ 直传版发布中止：源标记非今日",
            f"源同步成功标记不是今天的（标记时间 {ts}，今天 {today}）。\n"
            "源任务可能今天未成功运行。直传版若发布将基于旧数据，已中止。",
        )

    # 年龄检查（防源任务卡住/异常延迟导致标记虽为今日但过旧）
    try:
        ts_dt = datetime.datetime.strptime(ts, "%Y-%m-%dT%H:%M:%S")
        age_h = (now - ts_dt).total_seconds() / 3600.0
        if age_h > MAX_AGE_HOURS:
            return _fail(
                "❌ 直传版发布中止：源标记过期",
                f"源同步成功标记已过期（{ts_dt.strftime('%Y-%m-%d %H:%M')}，距今约 {age_h:.1f}h > {MAX_AGE_HOURS}h）。\n"
                "源任务可能卡住或异常延迟，已中止发布。",
            )
    except Exception:
        pass  # 时间解析失败不阻断，日期已校验

    print(f"✅ 源同步校验通过：源任务已于 {ts} 成功完成（commit={commit or 'n/a'}），可继续发布。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
