#!/usr/bin/env python3
"""
版本存档脚本：在自动化任务运行前，备份关键文件到 archive/ 目录
保留最近3个版本，防止自动化任务覆盖导致数据丢失。

使用方法：
  python archive_backup.py --files "index_v3.html,carbonate_all_data.json,electrolyte_all_data.json"
  python archive_backup.py --all   # 备份所有关键文件
"""
import os
import sys
import json
import shutil
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 关键文件列表（需要版本保护）
CRITICAL_FILES = [
    'index_v3.html',
    'carbonate_all_data.json',
    'electrolyte_all_data.json',
    'recycling_all_data.json',
    'automotive_all_data.json',
    'lym_all_data.json',
    'spodumene_all_data.json',
    'lepidolite_all_data.json',
]

def backup_file(filename, max_versions=3):
    """备份单个文件到 archive/ 目录，保留最近 max_versions 个版本"""
    src_path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(src_path):
        print(f"  [跳过] {filename} 不存在")
        return False
    
    # 创建 archive 目录
    archive_dir = os.path.join(BASE_DIR, 'archive')
    os.makedirs(archive_dir, exist_ok=True)
    
    # 生成带时间戳的备份文件名
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    name_base, ext = os.path.splitext(filename)
    backup_filename = f"{name_base}_{timestamp}{ext}"
    backup_path = os.path.join(archive_dir, backup_filename)
    
    # 复制文件
    shutil.copy2(src_path, backup_path)
    print(f"  [成功] 已备份 {filename} → archive/{backup_filename}")
    
    # 清理旧版本（保留最近 max_versions 个）
    pattern = f"{name_base}_*{ext}"
    import glob
    old_backups = sorted(glob.glob(os.path.join(archive_dir, pattern)), reverse=True)
    if len(old_backups) > max_versions:
        for old_file in old_backups[max_versions:]:
            os.remove(old_file)
            print(f"  [清理] 删除旧版本 {os.path.basename(old_file)}")
    
    return True

def main():
    import argparse
    parser = argparse.ArgumentParser(description='版本存档脚本')
    parser.add_argument('--files', type=str, help='逗号分隔的文件名列表')
    parser.add_argument('--all', action='store_true', help='备份所有关键文件')
    args = parser.parse_args()
    
    print("=" * 60)
    print("  版本存档脚本")
    print("  " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("=" * 60)
    
    if args.all:
        files_to_backup = CRITICAL_FILES
    elif args.files:
        files_to_backup = [f.strip() for f in args.files.split(',')]
    else:
        print("错误：请指定 --files 或 --all")
        sys.exit(1)
    
    print(f"\n[备份] 共 {len(files_to_backup)} 个文件")
    success_count = 0
    for filename in files_to_backup:
        if backup_file(filename):
            success_count += 1
    
    print(f"\n{'=' * 60}")
    print(f"  完成！成功备份 {success_count}/{len(files_to_backup)} 个文件")
    print(f"  备份目录：{os.path.join(BASE_DIR, 'archive')}")
    print("=" * 60)

if __name__ == '__main__':
    main()
