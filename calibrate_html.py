#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HTML轻量化校准任务
每天自动检查所有关键HTML文件，发现内联大脚本则自动修复
"""
import os
import sys
import subprocess
import json
from datetime import datetime

PROJECT_DIR = r"D:\trae\AI Daily report"
os.chdir(PROJECT_DIR)

# 需要检查的关键HTML文件
TARGET_FILES = [
    "index_v3.html",
    "embedded/index_v3.html",
    "index.html",
    "embedded/index.html",
]

def run_cmd(cmd, capture=True):
    result = subprocess.run(cmd, shell=True, capture_output=capture, text=True, cwd=PROJECT_DIR)
    return result.stdout.strip() if capture else None

def check_html_size(html_file):
    """检查HTML文件大小，返回 (is_optimized, file_size_kb, inline_script_kb)"""
    path = os.path.join(PROJECT_DIR, html_file)
    if not os.path.exists(path):
        return True, 0, 0  # 文件不存在，视为已优化
    
    file_size = os.path.getsize(path)
    file_size_kb = file_size / 1024
    
    # 检查内联脚本
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 简单判断：如果文件 > 300KB，很可能有内联大脚本
    if file_size_kb > 300:
        return False, file_size_kb, file_size_kb
    
    # 精确检查：找内联脚本块
    import re
    pattern = r'<script(?![^>]*src)[^>]*>(.*?)</script>'
    matches = re.findall(pattern, content, re.DOTALL)
    inline_kb = sum(len(m) for m in matches) / 1024
    
    is_optimized = inline_kb < 10  # 内联脚本小于10KB视为已优化
    return is_optimized, file_size_kb, inline_kb

def optimize_file(html_file):
    """对指定HTML文件运行 optimize_html.py"""
    html_path = os.path.join(PROJECT_DIR, html_file)
    out_dir = os.path.dirname(html_path) if '/' in html_file or '\\' in html_file else None
    
    cmd = f'"{sys.executable}" "{os.path.join(PROJECT_DIR, "optimize_html.py")}" "{html_path}"'
    if out_dir:
        cmd += f' "{out_dir}"'
    
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.returncode == 0, result.stdout + result.stderr

def git_commit_changes(fixed_files):
    """将修复后的文件提交到git"""
    # 查找所有相关的JS文件
    js_files = []
    for html_file in fixed_files:
        dir_name = os.path.dirname(html_file) or '.'
        base_name = os.path.splitext(os.path.basename(html_file))[0]
        # 查找对应的inline文件
        for f in os.listdir(os.path.join(PROJECT_DIR, dir_name) if dir_name != '.' else PROJECT_DIR):
            if f.startswith('inline_') and f.endswith('.js'):
                js_files.append(os.path.join(dir_name, f) if dir_name != '.' else f)
    
    # Git add
    add_files = fixed_files + list(set(js_files))
    for f in add_files:
        run_cmd(f'git add -f "{f}"')
    
    # Git commit
    msg = f"auto: 校准任务自动修复HTML轻量化 ({datetime.now().strftime('%Y-%m-%d %H:%M')})\n\n修复文件: {', '.join(fixed_files)}"
    result = run_cmd(f'git commit -m "{msg}"', capture=False)
    return True

def send_feishu_notification(fixed_files, report_lines):
    """发送飞书通知"""
    try:
        # 使用lark-cli发送通知
        lines = "\n".join(report_lines)
        notify_msg = f"⚠️ HTML轻量化校准任务发现并修复了问题\n\n修复文件：\n" + "\n".join(f"- {f}" for f in fixed_files) + f"\n\n时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        
        # 尝试通过lark-cli发送
        result = run_cmd(f'lark-cli im send --msg "{notify_msg}" 2>&1', capture=True)
        if "error" not in result.lower():
            print(f"[通知] 飞书通知已发送")
        else:
            print(f"[通知] 飞书通知发送失败: {result}")
    except Exception as e:
        print(f"[通知] 发送通知时出错: {e}")

def main():
    print(f"{'='*60}")
    print(f"HTML轻量化校准任务 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")
    
    report_lines = []
    fixed_files = []
    all_ok = True
    
    for html_file in TARGET_FILES:
        print(f"检查: {html_file}")
        is_ok, size_kb, inline_kb = check_html_size(html_file)
        
        if is_ok:
            status = f"✅ 正常 ({size_kb:.1f} KB, 内联脚本 {inline_kb:.1f} KB)"
            print(f"  {status}")
            report_lines.append(f"✅ {html_file}: 正常 ({size_kb:.1f} KB)")
        else:
            status = f"❌ 需要修复 (文件 {size_kb:.1f} KB, 内联脚本约 {inline_kb:.1f} KB)"
            print(f"  {status}")
            report_lines.append(f"❌ {html_file}: 需要修复")
            
            # 自动修复
            print(f"  → 正在自动修复...")
            success, output = optimize_file(html_file)
            if success:
                print(f"  ✅ 修复成功")
                report_lines.append(f"  → ✅ 已自动修复")
                fixed_files.append(html_file)
                all_ok = False
            else:
                print(f"  ❌ 修复失败: {output[-200:]}")
                report_lines.append(f"  → ❌ 修复失败")
    
    # 汇总
    print(f"\n{'='*60}")
    print(f"校准结果汇总")
    print(f"{'='*60}")
    for line in report_lines:
        print(f"  {line}")
    
    if fixed_files:
        print(f"\n📦 正在提交修复结果到git...")
        git_commit_changes(fixed_files)
        print(f"✅ 已提交到git")
        
        # 发送通知
        send_feishu_notification(fixed_files, report_lines)
        
        print(f"\n{'='*60}")
        print(f"⚠️  发现 {len(fixed_files)} 个文件被修复，已自动提交")
        print(f"   请检查是否有自动化任务在覆盖优化成果")
        print(f"{'='*60}")
    else:
        print(f"\n✅ 所有文件检查通过，无需修复")
    
    print(f"\n任务完成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    return 0 if all_ok else 1

if __name__ == "__main__":
    sys.exit(main())
