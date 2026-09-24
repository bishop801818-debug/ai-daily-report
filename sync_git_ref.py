#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
sync_git_ref.py —— 把分支 ref 的**真值**同步进 packed-refs（本机防回退收尾步骤）

为什么需要这个：
    本机有外部文件级代理（360 EPP / E-SafeNet 等）会把 `.git` 下的新文件送进
    Windows 回收站。`refs/heads/<branch>` 这个**松散 ref** 文件每次被 git 写出后
    数秒内即被回收 ⇒ git 取不到松散 ref，就回退读**陈旧**的 `packed-refs`，
    于是 HEAD 看起来"静默回退"到很久以前的提交。

    实测（2026-09-18）：一次正常 `git commit` 之后
        reflog 顶部 = 1e08d3d8f（新提交，已记账）
        git rev-parse HEAD = 8b0cf5fd（旧值！因为松散 ref 已被回收）
    ⇒ 若此时再有自动化 `git add -A && git commit`，新提交会挂到旧基线上，历史线被压平。

    由于 `packed-refs` 本体不会被回收，**把真值写进 packed-refs** 即可让兜底值正确。

真值从哪来：
    **不能用 `git rev-parse HEAD`**（它读的就是被回退的值）。
    真值 = 分支 reflog 的最新一条：`git rev-parse --verify refs/heads/<branch>@{0}`。

用法：
    python sync_git_ref.py            # 检查并按需把真值写进 packed-refs
    python sync_git_ref.py --check    # 只检查，不写（异常时 exit 1）

建议：本仓库每次 `git commit`（尤其是自动化提交）之后跑一遍。
"""

import argparse
import os
import subprocess
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
PACKED = os.path.join(BASE, ".git", "packed-refs")


def git(*args):
    try:
        p = subprocess.run(["git"] + list(args), cwd=BASE, capture_output=True,
                           text=True, encoding="utf-8", errors="replace")
        return p.returncode, (p.stdout or "").strip()
    except Exception as e:  # pragma: no cover
        return 127, "EXEC_ERR: %s" % e


def is_ancestor(a, b):
    return git("merge-base", "--is-ancestor", a, b)[0] == 0


def true_tip(branch):
    """分支 reflog 的最新 SHA —— 不受松散 ref 丢失影响

    ⚠️ 陷阱（2026-09-18 实测踩过）：**不能用 `refs/heads/X@{0}`**。
       `@{0}` 定义为"当前 ref 值"，而当前 ref 值是走 ref 解析（松散 > packed）得来的，
       ref 被回退时它返回的就是**陈旧值**，等于没绕过问题。
       正确做法：读 reflog **日志文件**的最后一条（`git reflog show <ref> -1` 即读该文件）。
    """
    rc, sha = git("reflog", "show", "refs/heads/%s" % branch, "-1", "--format=%H")
    if rc == 0 and sha:
        return sha.splitlines()[0].strip()
    # 退路：直接读 reflog 文件末行
    logf = os.path.join(BASE, ".git", "logs", "refs", "heads", branch.replace("/", os.sep))
    if os.path.exists(logf):
        with open(logf, "rb") as f:
            raw = f.read()
        for line in reversed(raw.split(b"\n")):
            if not line.strip():
                continue
            parts = line.split(b"\t")[0].split()
            if len(parts) >= 2:
                return parts[1].decode("ascii", "replace")
    return None


def patch_packed_refs(mapping):
    """mapping: {refname: sha}；只替换已存在的行，保持字节序与换行风格"""
    with open(PACKED, "rb") as f:
        raw = f.read()
    eol = b"\r\n" if b"\r\n" in raw else b"\n"
    lines = raw.split(eol)
    patched = {}
    for i, ln in enumerate(lines):
        try:
            text = ln.decode("utf-8")
        except UnicodeDecodeError:
            continue
        if text.startswith("#") or text.startswith("^") or not text.strip():
            continue
        parts = text.split(" ")
        if len(parts) < 2:
            continue
        name = parts[1].strip()
        if name in mapping and parts[0] != mapping[name]:
            lines[i] = ("%s %s" % (mapping[name], name)).encode("utf-8")
            patched[name] = mapping[name]
    if patched:
        with open(PACKED, "wb") as f:
            f.write(eol.join(lines))
    return patched


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="只检查不写")
    args = ap.parse_args()

    rc, _ = git("rev-parse", "--git-dir")
    if rc != 0:
        print("[FAIL] 不是 Git 仓库: %s" % BASE)
        return 2

    rc, branch = git("rev-parse", "--abbrev-ref", "HEAD")
    if rc != 0 or not branch or branch == "HEAD":
        print("[SKIP] 不在分支上（detached HEAD），不做处理")
        return 0

    rc, head = git("rev-parse", "HEAD")
    tip = true_tip(branch)

    print("[info] branch      = %s" % branch)
    print("[info] rev-parse HEAD      = %s" % (head[:9] if rc == 0 else "?"))
    print("[info] reflog true tip     = %s" % (tip[:9] if tip else "?"))

    if not tip or tip == head:
        print("[PASS] HEAD 与分支 reflog 真值一致，无需同步")
        return 0

    # HEAD 落后于 reflog 真值 ⇒ 松散 ref 丢失导致的回退
    if not is_ancestor(head, tip):
        print("[WARN] reflog 真值与 HEAD 分叉（非简单回退），需人工确认，不自动处理")
        print("       修复参考: .workbuddy/memory/ops_reference.md 第 D 节")
        return 1

    print("[FIX ] HEAD 落后于 reflog 真值 ⇒ 松散 ref 已被回收，准备把真值写进 packed-refs")
    if args.check:
        print("[check-only] 未做任何写入")
        return 1

    refname = "refs/heads/%s" % branch
    mapping = {refname: tip}
    # 同步推进 guard 锚点（若存在）
    rc, tags = git("for-each-ref", "--format=%(refname)", "refs/tags/guard-*")
    if rc == 0 and tags:
        for t in sorted(x.strip() for x in tags.splitlines() if x.strip())[-1:]:
            mapping[t] = tip

    patched = patch_packed_refs(mapping)
    if not patched:
        print("[FAIL] packed-refs 中未找到可替换的行: %s" % ", ".join(mapping))
        return 1

    for k, v in patched.items():
        print("[ok  ] packed-refs  %s -> %s" % (k, v[:9]))

    rc, head2 = git("rev-parse", "HEAD")
    refs_n = len([x for x in git("show-ref")[1].splitlines() if x.strip()])
    print("[info] 复验 HEAD = %s   refs = %d" % (head2[:9] if rc == 0 else "?", refs_n))
    if head2 == tip:
        print("[PASS] 同步成功：HEAD 已指向 reflog 真值")
        return 0
    print("[FAIL] 同步后 HEAD 仍不正确，请人工介入")
    return 1


if __name__ == "__main__":
    sys.exit(main())
