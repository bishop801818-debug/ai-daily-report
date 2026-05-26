#!/usr/bin/env python3
"""
自动同步脚本
每天由Windows任务计划程序调用（默认每天9:00）
检查未提交的更改，如果有则自动提交并推送
日志写入：D:\trae\AI Daily report\auto_sync.log
"""

import os
import sys
import subprocess
from datetime import datetime

# 配置
REPO_DIR = r"D:\trae\AI Daily report"
BRANCH = "master"
REMOTE = "origin"
LOG_FILE = r"D:\trae\AI Daily report\auto_sync.log"

def log(msg):
    """打印并写入日志文件"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    line = f"[{timestamp}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(line + '\n')
    except:
        pass  # 日志写入失败不影响主流程

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
            log(f"没有未提交的更改，退出")
            return 0
        
        log(f"发现未提交的更改，开始自动同步...")
        
        # 2. Git add -A
        run_git(['add', '-A'])
        log(f"Git add 完成")
        
        # 3. Git commit
        commit_msg = f"auto-sync: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        run_git(['commit', '-m', commit_msg])
        log(f"Git commit 完成: {commit_msg}")
        
        # 4. Git push
        push_result = run_git(['push', REMOTE, BRANCH], check=False)
        
        if push_result.returncode == 0:
            log(f"✅ 自动同步成功")
            return 0
        else:
            log(f"⚠️ 推送失败: {push_result.stderr}")
            return 1
            
    except subprocess.CalledProcessError as e:
        log(f"❌ Git操作失败: {e.stderr if e.stderr else e}")
        return 1
    except Exception as e:
        log(f"❌ 未知错误: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
