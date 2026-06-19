#!/usr/bin/env python3
"""
首页安全修改引导脚本

使用方式：
    python _docs/tools/safe_index_edit.py "修改描述"

这个脚本会：
1. 检查 index_v3.html 语法
2. 创建 Git backup tag
3. 等待你完成修改
4. 验证修改后的语法
5. 推送到远程
"""

import os
import sys
import subprocess
import datetime

INDEX_FILE = "index_v3.html"
DOCS_DIR = "_docs/tools"

def run_cmd(cmd, cwd=None):
    """执行shell命令"""
    result = subprocess.run(
        cmd, shell=True, cwd=cwd or os.getcwd(),
        capture_output=True, text=True
    )
    return result.returncode, result.stdout, result.stderr

def check_html_syntax():
    """验证 index_v3.html 基本语法"""
    print("=" * 50)
    print("1️⃣ 检查 index_v3.html 语法...")
    
    if not os.path.exists(INDEX_FILE):
        print(f"❌ 找不到 {INDEX_FILE}")
        return False
    
    # 基本检查：文件是否完整
    with open(INDEX_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查是否有未闭合的标签
    issues = []
    
    # 检查 </body> 和 </html>
    if '</body>' not in content:
        issues.append("缺少 </body> 标签")
    if '</html>' not in content:
        issues.append("缺少 </html> 标签")
    
    if issues:
        print(f"⚠️ 发现问题: {', '.join(issues)}")
        return False
    
    print("   ✅ HTML 结构完整")
    return True

def create_backup(description):
    """创建 Git backup tag"""
    print("=" * 50)
    print("2️⃣ 创建 Git 备份 tag...")
    
    now = datetime.datetime.now().strftime("%Y-%m-%d-%H%M")
    tag_name = f"backup/{now}"
    tag_msg = f"index_v3.html 修改前备份: {description}"
    
    # 创建 tag
    code, out, err = run_cmd(f'git tag "{tag_name}" -m "{tag_msg}"')
    if code != 0:
        print(f"❌ 创建 tag 失败: {err}")
        return False
    
    # 推送到远程
    print(f"   📤 推送 tag {tag_name} 到远程...")
    code, out, err = run_cmd(f'git push origin "{tag_name}"')
    if code != 0:
        print(f"⚠️ 推送 tag 失败: {err}")
        # 继续，不中断
    
    print(f"   ✅ 已创建 tag: {tag_name}")
    return True

def verify_after(description):
    """修改后验证"""
    print("=" * 50)
    print("3️⃣ 验证修改后的 index_v3.html...")
    
    if not check_html_syntax():
        print("❌ 语法验证失败！")
        return False
    
    print("   ✅ 验证通过")
    return True

def main():
    # 获取修改描述
    description = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "未描述的修改"
    
    print("🛡️ 首页安全修改引导")
    print("=" * 50)
    print(f"📝 修改描述: {description}")
    print()
    
    # 步骤1: 修改前检查
    if not check_html_syntax():
        print()
        print("❌ 当前 index_v3.html 已经有语法问题！")
        print("建议先恢复: git checkout -- index_v3.html")
        response = input("\n继续强制修改? (y/N): ")
        if response.lower() != 'y':
            print("已取消")
            return
    
    # 步骤2: 创建备份
    if not create_backup(description):
        print("❌ 创建备份失败，取消操作")
        return
    
    print()
    print("=" * 50)
    print("✅ 准备完成！现在你可以：")
    print()
    print("1. 用编辑器修改 index_v3.html")
    print("2. 在浏览器中测试 (http://localhost:8888/index_v3.html)")
    print("3. 检查控制台是否有 JS 错误")
    print()
    print("测试完成后，告诉我'完成'或'验证'来验证语法")
    print("=" * 50)
    
    # 等待用户确认
    response = input("\n输入 'done' 完成验证，或 'cancel' 取消: ")
    
    if response.lower() == 'done':
        verify_after(description)
        print()
        print("🎉 修改完成并验证通过！")
    elif response.lower() == 'cancel':
        # 撤销 tag
        now = datetime.datetime.now().strftime("%Y-%m-%d-%H%M")
        tag_name = f"backup/{now}"
        run_cmd(f'git tag -d "{tag_name}"')
        print("已取消，tag 已删除")
    else:
        print(f"收到: {response}，继续验证...")
        verify_after(description)

if __name__ == "__main__":
    main()