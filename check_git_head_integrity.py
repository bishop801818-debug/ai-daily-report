#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
check_git_head_integrity.py —— Git HEAD 完整性守卫

背景（2026-09-18 事故）：
    本机存在外部文件级代理，会把 `.git` 下的新文件（含 `refs/heads/sprint/default`
    这个松散 ref）送进 Windows 回收站。后果是 `git update-ref` 虽然 exit=0 也写入成功，
    但文件随即被回收，git 取不到松散 ref 就回退读**陈旧**的 `packed-refs`，
    于是 HEAD 静默回退到两周前的提交（09-18 实测：回退 15 个提交）。
    若此时自动化执行 `git add -A && git commit`，新提交会挂到两周前的基线上，
    历史线被压平（内容不丢，但 `git log` 彻底误导）。

    典型判据：`git log -1` 与 `git reflog` 顶部**不一致**。

本脚本做什么：
    只读检查，不修改任何东西。发现异常时打印修复指引并以 exit 1 退出。

用法：
    python check_git_head_integrity.py                # 默认锚点 refs/tags/guard-*
    python check_git_head_integrity.py --anchor <ref> # 指定锚点（如 refs/tags/guard-20260918）
    python check_git_head_integrity.py --quiet        # 仅在异常时输出

建议接入点：任何会 `git commit` 的自动化，在 commit **之前**跑一遍；
    异常即中止，避免把提交挂到被回退的基线上。
"""

import argparse
import os
import subprocess
import sys

BASE = os.path.dirname(os.path.abspath(__file__))


def git(*args):
    """执行 git 命令，返回 (returncode, stdout.strip())"""
    try:
        p = subprocess.run(
            ["git"] + list(args),
            cwd=BASE,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        return p.returncode, (p.stdout or "").strip()
    except Exception as e:  # pragma: no cover
        return 127, "EXEC_ERR: %s" % e


def is_ancestor(a, b):
    """a 是否为 b 的祖先"""
    rc, _ = git("merge-base", "--is-ancestor", a, b)
    return rc == 0


def newest_anchor(explicit=None):
    """返回 (refname, sha)；优先显式指定，其次取字典序最大的 guard tag"""
    if explicit:
        rc, sha = git("rev-parse", "--verify", explicit + "^{commit}")
        return (explicit, sha if rc == 0 else None)
    rc, out = git("for-each-ref", "--format=%(refname)", "refs/tags/guard-*")
    if rc != 0 or not out:
        return (None, None)
    refs = sorted(l.strip() for l in out.splitlines() if l.strip())
    ref = refs[-1]
    rc, sha = git("rev-parse", "--verify", ref + "^{commit}")
    return (ref, sha if rc == 0 else None)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--anchor", default=None, help="锚点 ref（默认自动取最新的 refs/tags/guard-*）")
    ap.add_argument("--quiet", action="store_true", help="仅在异常时输出")
    args = ap.parse_args()

    def log(msg):
        if not args.quiet:
            print(msg)

    problems = []

    # 0) 是否在 git 仓库里
    rc, _ = git("rev-parse", "--git-dir")
    if rc != 0:
        print("[FAIL] 当前目录不是 Git 仓库: %s" % BASE)
        return 2

    rc, head = git("rev-parse", "HEAD")
    if rc != 0:
        print("[FAIL] 无法解析 HEAD（ref 可能已丢失）: %s" % head)
        print("       修复参考: ops_reference.md D2（直写 packed-refs 恢复分支指向）")
        return 1
    log("[ok] HEAD          = %s" % head[:9])

    # 1) HEAD vs reflog 顶部
    rc, reflog_top = git("reflog", "-1", "--format=%H")
    if rc == 0 and reflog_top:
        log("[ok] reflog top    = %s" % reflog_top[:9])
        if reflog_top != head:
            # 两种情形：HEAD 比 reflog 更新（正常，如 update-ref 未记日志）或更旧（危险回退）
            if is_ancestor(head, reflog_top):
                problems.append(
                    "HEAD(%s) 是 reflog 顶部(%s) 的**祖先** ⇒ HEAD 被静默回退，"
                    "reflog 顶部还有更新的提交未被引用" % (head[:9], reflog_top[:9])
                )
            else:
                problems.append(
                    "HEAD(%s) 与 reflog 顶部(%s) 分叉或顺序异常" % (head[:9], reflog_top[:9])
                )
    else:
        log("[warn] 无 reflog 可比较")

    # 2) 锚点 tag 是否仍是 HEAD 的祖先（HEAD 不该落后于已知良好点）
    ref, anchor = newest_anchor(args.anchor)
    if anchor:
        log("[ok] anchor        = %s -> %s" % (ref, anchor[:9]))
        if anchor != head and not is_ancestor(anchor, head):
            problems.append(
                "锚点 %s(%s) **不是** HEAD 的祖先 ⇒ HEAD 落后于已知良好点或已分叉"
                % (ref, anchor[:9])
            )
    else:
        log("[warn] 未找到 guard 锚点（可先打: git tag guard-YYYYMMDD <sha>）")

    # 3) 松散 ref 是否存在（本机高危项）
    rc, branch = git("rev-parse", "--abbrev-ref", "HEAD")
    if rc == 0 and branch and branch != "HEAD":
        loose = os.path.join(BASE, ".git", "refs", "heads", branch.replace("/", os.sep))
        rc2, packed_val = git("rev-parse", "refs/heads/" + branch)
        if not os.path.exists(loose):
            # 松散 ref 缺失本身不致命（packed-refs 可承载），但要提示风险
            log("[warn] 松散 ref 缺失: .git/refs/heads/%s（packed-refs 值=%s）"
                % (branch, packed_val[:9] if rc2 == 0 else "?"))
            if rc2 == 0 and packed_val != head:
                problems.append("packed-refs 中的分支值与 HEAD 不一致")
        else:
            log("[ok] 松散 ref 存在: %s" % loose)

    # 结论
    if problems:
        print("")
        print("=" * 68)
        print("[FAIL] Git HEAD 完整性异常（%d 项）:" % len(problems))
        for i, p in enumerate(problems, 1):
            print("  %d) %s" % (i, p))
        print("-" * 68)
        print("  典型根因: 松散 ref 被外部代理回收 ⇒ git 回退读陈旧 packed-refs")
        print("  排查/修复: .workbuddy/memory/ops_reference.md 第 D 节")
        print("  快速自检: 读 D:\\$Recycle.Bin\\<SID>\\$I* 元数据（v2、路径偏移 28，UTF-16LE）")
        print("=" * 68)
        return 1

    log("")
    log("[PASS] Git HEAD 完整：HEAD 未回退，锚点链正常")
    return 0


if __name__ == "__main__":
    sys.exit(main())
