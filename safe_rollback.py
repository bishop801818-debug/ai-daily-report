#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
安全回滚脚本 - 尊重 PROTECTED_FILES.md 中的受保护文件列表
功能：
1. 读取受保护文件列表（硬编码，与 PROTECTED_FILES.md 同步）
2. 列出可用的回滚点
3. 执行回滚，但跳过受保护文件
4. 回滚后自动运行 generate_market_cumulative.py 恢复受保护文件
"""

import json, os, sys, glob, shutil
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKUP_DIR = os.path.join(BASE_DIR, "backups")

# 受保护文件列表（与 PROTECTED_FILES.md 同步，修改时需同时更新两个文件）
PROTECTED_FILES = {
    "index_v3.html": "前端主页面，甘特图逻辑已调试正确",
    "reports/market_cumulative.json": "市场行情数据，纯派生文件，运行脚本即可恢复",
}

def list_checkpoints():
    """列出所有可用的回滚点"""
    manifest_file = os.path.join(BACKUP_DIR, "checkpoints_manifest.json")
    if not os.path.exists(manifest_file):
        print("❌ 未找到检查点清单：", manifest_file)
        print("   请先运行 [0-快速备份.bat] 创建检查点")
        return []
    
    with open(manifest_file, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    
    checkpoints = manifest.get('checkpoints', [])
    if not checkpoints:
        print("❌ 没有可用的检查点")
        return []
    
    print("=" * 60)
    print("可用检查点：")
    print("=" * 60)
    for i, cp in enumerate(checkpoints):
        protected = []
        for f in cp.get('files', []):
            if f in PROTECTED_FILES:
                protected.append(f"⚠️ {f} (受保护)")
        
        protected_msg = f"  [受保护: {', '.join(protected)}]" if protected else ""
        print(f"  [{i+1}] {cp['id']} - {cp['time']}{protected_msg}")
        print(f"      文件: {len(cp.get('files', []))}个")
    
    return checkpoints

def rollback_checkpoint(checkpoint_id):
    """回滚到指定检查点，跳过受保护文件"""
    manifest_file = os.path.join(BACKUP_DIR, "checkpoints_manifest.json")
    with open(manifest_file, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    
    # 找到检查点
    checkpoint = None
    for cp in manifest.get('checkpoints', []):
        if cp['id'] == checkpoint_id:
            checkpoint = cp
            break
    
    if not checkpoint:
        print(f"❌ 未找到检查点: {checkpoint_id}")
        return False
    
    print("=" * 60)
    print(f"回滚到检查点: {checkpoint_id}")
    print(f"时间: {checkpoint['time']}")
    print("=" * 60)
    
    # 执行回滚
    rollback_files = []
    skipped_protected = []
    
    for file_rel in checkpoint.get('files', []):
        # 检查是否受保护
        if file_rel in PROTECTED_FILES:
            skipped_protected.append(file_rel)
            print(f"⚠️  跳过受保护文件: {file_rel}")
            print(f"   ({PROTECTED_FILES[file_rel]})")
            continue
        
        # 执行回滚
        backup_file = os.path.join(BACKUP_DIR, checkpoint_id, file_rel.replace('/', '_'))
        target_file = os.path.join(BASE_DIR, file_rel)
        
        if not os.path.exists(backup_file):
            print(f"❌ 备份文件不存在: {backup_file}")
            continue
        
        # 创建目标文件目录
        os.makedirs(os.path.dirname(target_file), exist_ok=True)
        
        # 复制文件
        shutil.copy2(backup_file, target_file)
        rollback_files.append(file_rel)
        print(f"✅ 已回滚: {file_rel}")
    
    print()
    print("=" * 60)
    print(f"回滚完成：{len(rollback_files)} 个文件已恢复")
    if skipped_protected:
        print(f"跳过受保护文件：{len(skipped_protected)} 个")
        print("   (这些文件未被回滚，保持当前版本)")
    print("=" * 60)
    
    # 自动恢复受保护文件
    if any(f == "reports/market_cumulative.json" for f in PROTECTED_FILES.keys()):
        print()
        print("🔄 自动恢复受保护文件...")
        print("   运行 generate_market_cumulative.py 重新生成 market_cumulative.json")
        import subprocess
        result = subprocess.run(
            [sys.executable, "generate_market_cumulative.py"],
            cwd=BASE_DIR,
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("✅ market_cumulative.json 已重新生成")
        else:
            print("❌ 重新生成失败：")
            print(result.stderr)
    
    return True

def main():
    print("=" * 60)
    print("安全回滚脚本 - 尊重受保护文件列表")
    print("=" * 60)
    print()
    
    # 列出检查点
    checkpoints = list_checkpoints()
    if not checkpoints:
        return
    
    print()
    print("输入检查点 ID 或序号 (输入 0 取消):")
    
    try:
        user_input = input("> ").strip()
        if user_input == "0":
            print("已取消")
            return
        
        # 判断是 ID 还是序号
        if user_input.isdigit():
            idx = int(user_input) - 1
            if idx < 0 or idx >= len(checkpoints):
                print(f"❌ 无效的序号: {user_input}")
                return
            checkpoint_id = checkpoints[idx]['id']
        else:
            checkpoint_id = user_input
        
        print()
        confirm = input(f"确认回滚到 {checkpoint_id}? (y/N) > ").strip().lower()
        if confirm != 'y':
            print("已取消")
            return
        
        rollback_checkpoint(checkpoint_id)
        
    except KeyboardInterrupt:
        print("\n已取消")
    except Exception as e:
        print(f"❌ 错误: {e}")

if __name__ == "__main__":
    main()
