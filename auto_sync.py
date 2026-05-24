#!/usr/bin/env python3
"""
自动同步脚本 - 简化版
每5分钟由Windows任务计划程序调用
检查未提交的更改，如果有则自动提交并推送
"""

import os
import sys
import subprocess
from datetime import datetime

# 配置
REPO_DIR = r"D:\trae\AI Daily report"
BRANCH = "master"
REMOTE = "origin"

def run_git(args, check=True):
    """运行git命令"""
    result = subprocess.run(
        ['git'] + args,
        cwd=REPO_DIR,
        capture_output=True,
        text=True
    )
    if check and result.returncode != 0:
        raise subprocess.CalledProcessError(
            result.returncode, result.args,
            output=result.stdout, stderr=result.stderr
        )
    return result

def main():
    """主函数"""
    try:
        # 1. 检查是否有未提交的更改
        status_result = run_git(['status', '--porcelain'], check=False)
        
        if not status_result.stdout.strip():
            print(f"[{datetime.now()}] 没有未提交的更改，退出")
            return 0
        
        print(f"[{datetime.now()}] 发现未提交的更改，开始自动同步...")
        
        # 2. Git add -A
        run_git(['add', '-A'])
        print(f"[{datetime.now()}] Git add 完成")
        
        # 3. Git commit
        commit_msg = f"auto-sync: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        run_git(['commit', '-m', commit_msg])
        print(f"[{datetime.now()}] Git commit 完成: {commit_msg}")
        
        # 4. Git push
        push_result = run_git(['push', REMOTE, BRANCH], check=False)
        
        if push_result.returncode == 0:
            print(f"[{datetime.now()}] ✅ 自动同步成功")
            return 0
        else:
            print(f"[{datetime.now()}] ⚠️ 推送失败: {push_result.stderr}")
            return 1
            
    except subprocess.CalledProcessError as e:
        print(f"[{datetime.now()}] ❌ Git操作失败: {e.stderr if e.stderr else e}")
        return 1
    except Exception as e:
        print(f"[{datetime.now()}] ❌ 未知错误: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
