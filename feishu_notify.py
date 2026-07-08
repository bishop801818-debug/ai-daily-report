#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
飞书双通道告警公共模块（群 webhook + 私聊本人）。
供 check_source_sync.py / write_sync_marker.py 等自动化脚本复用，
与 prepublish_review.py、validate_before_deploy.py 共用同一群 webhook URL 和私聊 UID。
群：全员可见；私聊：冗余兜底（仅本人）。
"""
import os
import json
import shutil
import datetime
import urllib.request
import urllib.error
import subprocess

# 群机器人 webhook（与 validate_before_deploy.py / prepublish_review.py 共用，发送后群里所有人可见）
FEISHU_WEBHOOK_URL = "https://open.feishu.cn/open-apis/bot/v2/hook/3bfc8415-fb29-4d49-91fd-70212afb8cf8"
# 私聊目标（本人 open_id），双通道冗余
FEISHU_UID = "ou_644b8e9c700e12081e222bef6f743af7"
LARK_CLI = shutil.which("lark-cli") or "lark-cli"
# dry-run：不真实发送（本地验证用）。check_source_sync / write_sync_marker 统一读 SYNC_DRYRUN
DRYRUN = os.environ.get("SYNC_DRYRUN") == "1"


def send_group(title, content, blocked):
    """发到飞书群机器人 webhook。"""
    if not FEISHU_WEBHOOK_URL:
        print("⚠️ 未配置群 webhook URL，跳过群通知")
        return False
    if DRYRUN:
        print("📨 群 webhook 通知(DRYRUN，未真实发送):", title)
        return True
    try:
        payload = {
            "msg_type": "interactive",
            "card": {
                "config": {"wide_screen_mode": True},
                "header": {
                    "title": {"tag": "plain_text", "content": title},
                    "template": "green" if not blocked else "red",
                },
                "elements": [
                    {"tag": "div", "text": {"tag": "lark_md", "content": content}},
                    {"tag": "hr"},
                    {"tag": "note", "elements": [
                        {"tag": "lark_md", "content": f"📅 时间: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"}
                    ]},
                ],
            },
        }
        req = urllib.request.Request(
            FEISHU_WEBHOOK_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        if body.get("code") == 0:
            print("📨 群 webhook 通知已发送")
            return True
        else:
            print("⚠️ 群 webhook 返回异常：", str(body)[:200])
            return False
    except Exception as e:
        print("⚠️ 群 webhook 发送失败(不影响判定)：", e)
        return False


def send_private(title, content, blocked):
    """私聊通知本人（lark-cli P2P）。"""
    cmd = [LARK_CLI, "im", "+messages-send", "--user-id", FEISHU_UID, "--markdown", f"{title}\n\n{content}"]
    if DRYRUN:
        cmd.append("--dry-run")
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=30, encoding="utf-8")
        if r.returncode != 0:
            print("⚠️ 私聊告警返回非0：", r.stderr[:200])
        else:
            print("📨 私聊告警已发送" + ("(dry-run)" if DRYRUN else ""))
    except Exception as e:
        print("⚠️ 私聊告警发送失败(不影响判定)：", e)


def alert(title, content, blocked):
    """双通道告警：群（全员可见）+ 私聊（冗余兜底）。"""
    print(f"\n📣 飞书告警：{title}")
    send_group(title, content, blocked)
    send_private(title, content, blocked)
