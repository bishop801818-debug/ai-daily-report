#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
智能Git存档脚本（增强版 v2.0）
功能：
1. 只提交有变化的文件，避免重复存档
2. 版本号保护机制 - 检测版本回退并阻止提交
3. 自动备份机制 - 提交前备份被覆盖的文件
4. 滚动备份机制 - 只保留最近N个备份（默认3个）

使用方法：python smart_git_commit.py
"""

import os
import json
import hashlib
import subprocess
import fnmatch
import re
import shutil
from datetime import datetime
from pathlib import Path

class SmartCommit:
    def __init__(self, config_file='smart_commit_config.json'):
        """初始化智能存档器"""
        self.config_file = config_file
        self.load_config()
        self.changed_files = []
        self.unchanged_files = []
        self.backup_dir = None
        self.version_regressions = []  # 记录版本回退的文件
    
    def load_config(self):
        """加载配置文件"""
        with open(self.config_file, 'r', encoding='utf-8') as f:
            self.config = json.load(f)
    
    def file_hash(self, filepath):
        """计算文件SHA256哈希值"""
        with open(filepath, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()
    
    def get_git_file_content(self, filepath):
        """获取Git中文件的最新版本内容"""
        try:
            # 修复：将 Windows 路径的反斜杠转换为正斜杠
            git_filepath = str(filepath).replace('\\', '/')
            
            result = subprocess.run(
                ['git', 'show', f'HEAD:{git_filepath}'],
                capture_output=True,
                text=False
            )
            if result.returncode == 0:
                return result.stdout
            return None
        except:
            return None
    
    def get_git_file_hash(self, filepath):
        """获取Git中文件的最新版本哈希值"""
        content = self.get_git_file_content(filepath)
        if content is not None:
            return hashlib.sha256(content).hexdigest()
        return None
    
    def is_excluded(self, filepath):
        """检查文件是否应该被排除"""
        filepath_str = str(filepath)
        for pattern in self.config.get('exclude_patterns', []):
            if fnmatch.fnmatch(filepath_str, pattern):
                return True
        return False
    
    def collect_files(self):
        """收集需要检查的文件"""
        files_to_check = []
        
        # 根据配置的规则收集文件
        for pattern in self.config.get('compare_rules', {}).keys():
            matches = list(Path('.').glob(pattern))
            files_to_check.extend(matches)
        
        # 去重
        files_to_check = list(set(files_to_check))
        
        # 排除不需要存档的文件
        files_to_check = [f for f in files_to_check if not self.is_excluded(f)]
        
        return files_to_check
    
    def compare_file(self, filepath):
        """比较文件是否有变化（使用 git status 判断）"""
        filepath_str = str(filepath)
        
        # 使用 git status --short 判断文件是否有变化
        try:
            result = subprocess.run(
                ['git', 'status', '--short', '--', filepath_str],
                capture_output=True,
                text=True
            )
            
            if result.stdout.strip():
                # git status 有输出，说明文件有变化
                return True, "Git检测到变化"
            else:
                # git status 无输出，说明文件无变化
                return False, "Git无变化"
        except Exception as e:
            # 如果 git status 失败，回退到哈希值比较
            return self._compare_file_by_hash(filepath_str)
    
    def _compare_file_by_hash(self, filepath_str):
        """备用方法：使用哈希值比较文件（处理换行符问题）"""
        try:
            current_hash = self.file_hash(filepath_str)
        except Exception as e:
            return False, f"读取文件失败: {e}"
        
        # 获取Git中的文件哈希
        git_hash = self.get_git_file_hash(filepath_str)
        if git_hash is None:
            return True, "新增文件"
        
        # 比较哈希值
        if current_hash == git_hash:
            return False, "内容无变化"
        
        return True, "内容有变化"
    
    def compare_json_fields(self, filepath):
        """比较JSON关键字段（调试模式）"""
        fields_to_check = self.config.get('compare_rules', {}).get('data/*.json', {}).get('json_fields', [])
        if not fields_to_check:
            return None
        
        try:
            # 读取当前文件
            with open(filepath, 'r', encoding='utf-8') as f:
                current_data = json.load(f)
            
            # 获取Git版本
            git_content = self.get_git_file_content(filepath)
            if git_content is None:
                return None
            git_data = json.loads(git_content.decode('utf-8'))
            
            # 比较关键字段
            changes = []
            for field in fields_to_check:
                # 简单实现：比较整个字段
                current_value = json.dumps(current_data.get(field), sort_keys=True)
                git_value = json.dumps(git_data.get(field), sort_keys=True)
                if current_value != git_value:
                    changes.append(field)
            
            return changes if changes else None
        except:
            return None
    
    def extract_version_from_html(self, filepath):
        """从HTML文件中提取版本号"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                # 匹配多种版本号格式
                # 格式1: <meta name="html-version" content="YYYYMMDD_HHMM">
                match = re.search(r'<meta\s+name="html-version"\s+content="(\d{8}_\d{4})"', content)
                if match:
                    return match.group(1)
                
                # 格式2: window.HTML_VERSION = 'YYYYMMDD_HHMM'
                match = re.search(r'window\.HTML_VERSION\s*=\s*[\'"](\d{8}_\d{4})[\'"]', content)
                if match:
                    return match.group(1)
                
                # 格式3: var HTML_VERSION = 'YYYYMMDD_HHMM'
                match = re.search(r'var\s+HTML_VERSION\s*=\s*[\'"](\d{8}_\d{4})[\'"]', content)
                if match:
                    return match.group(1)
        except Exception as e:
            print(f"    [警告] 读取版本号失败 {filepath}: {e}")
        return None
    
    def extract_version_from_git(self, filepath):
        """从Git版本中提取版本号"""
        try:
            content = self.get_git_file_content(filepath)
            if content is None:
                return None
            
            content_str = content.decode('utf-8')
            
            # 匹配多种版本号格式
            match = re.search(r'<meta\s+name="html-version"\s+content="(\d{8}_\d{4})"', content_str)
            if match:
                return match.group(1)
            
            match = re.search(r'window\.HTML_VERSION\s*=\s*[\'"](\d{8}_\d{4})[\'"]', content_str)
            if match:
                return match.group(1)
            
            match = re.search(r'var\s+HTML_VERSION\s*=\s*[\'"](\d{8}_\d{4})[\'"]', content_str)
            if match:
                return match.group(1)
        except Exception as e:
            print(f"    [警告] 读取Git版本号失败 {filepath}: {e}")
        return None
    
    def check_version_regression(self, filepath):
        """检查是否存在版本回退"""
        if not filepath.endswith('.html'):
            return False, "非HTML文件，跳过版本检查"
        
        current_version = self.extract_version_from_html(filepath)
        git_version = self.extract_version_from_git(filepath)
        
        if current_version and git_version:
            if current_version < git_version:
                return True, f"⚠️ 版本回退检测：当前{current_version} < Git中{git_version}"
            elif current_version == git_version:
                return False, f"版本号相同: {current_version}"
            else:
                return False, f"版本正常: {current_version} > {git_version}"
        
        return False, "无法提取版本号，跳过版本检查"
    
    def create_backup_before_commit(self):
        """在提交前创建备份（滚动备份机制）"""
        backup_root = 'archive/backups'
        max_backups = self.config.get('max_backups', 3)  # 默认保留3个备份
        
        # 创建备份目录
        os.makedirs(backup_root, exist_ok=True)
        
        # 生成备份文件夹名（带时间戳）
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        self.backup_dir = os.path.join(backup_root, timestamp)
        os.makedirs(self.backup_dir, exist_ok=True)
        
        print(f"\n📦 创建备份（滚动机制：保留最近{max_backups}个）...")
        
        backed_up = 0
        for filepath, reason in self.changed_files:
            # 只备份HTML文件
            if not filepath.endswith('.html'):
                continue
            
            git_content = self.get_git_file_content(str(filepath))
            if git_content:
                backup_path = os.path.join(self.backup_dir, os.path.basename(filepath))
                with open(backup_path, 'wb') as f:
                    f.write(git_content)
                backed_up += 1
        
        if backed_up > 0:
            print(f"   ✅ 已备份 {backed_up} 个文件到 {self.backup_dir}")
            
            # 滚动备份：删除旧备份（只保留最近max_backups个）
            self.cleanup_old_backups(backup_root, max_backups)
        else:
            # 如果没有备份任何文件，删除空目录
            os.rmdir(self.backup_dir)
            self.backup_dir = None
            print(f"   ⏭️  无需备份（没有HTML文件变化）")
    
    def cleanup_old_backups(self, backup_root, max_backups):
        """清理旧备份，只保留最近N个"""
        # 列出所有备份目录
        backup_dirs = sorted([
            d for d in os.listdir(backup_root)
            if os.path.isdir(os.path.join(backup_root, d))
        ], reverse=True)
        
        print(f"   📊 备份目录统计: {len(backup_dirs)} 个（保留最近{max_backups}个）")
        
        # 删除超出数量的旧备份
        if len(backup_dirs) > max_backups:
            for old_dir in backup_dirs[max_backups:]:
                old_path = os.path.join(backup_root, old_dir)
                shutil.rmtree(old_path)
                print(f"   🗑️  删除旧备份: {old_dir}")
    
    def is_git_ignored(self, filepath):
        try:
            result = subprocess.run(
                ['git', 'check-ignore', '-q', str(filepath)],
                capture_output=True,
                text=False
            )
            # returncode 0 = ignored, 1 = not ignored
            return result.returncode == 0
        except:
            return False
    
    def smart_commit(self):
        """智能提交主函数（增强版：版本保护 + 自动备份）"""
        print("=" * 60)
        print("🔍 智能Git存档开始（版本保护 + 自动备份）")
        print("=" * 60)
        
        # 1. 收集需要检查的文件
        print("\n📁 收集文件...")
        files_to_check = self.collect_files()
        print(f"   找到 {len(files_to_check)} 个文件需要检查")

        # 1.5 过滤掉被git ignore的文件
        files_to_check = [f for f in files_to_check if not self.is_git_ignored(f)]
        print(f"   过滤后 {len(files_to_check)} 个文件（已排除gitignore文件）")

        # 2. 比较每个文件 + 版本回退检查
        print("\n🔍 比较文件变化 + 版本回退检查...")
        for filepath in sorted(files_to_check):
            filepath_str = str(filepath)  # 转换为字符串
            has_changed, reason = self.compare_file(filepath)
            
            # 版本回退检查（仅对HTML文件）
            if has_changed and filepath_str.endswith('.html'):
                is_regression, reg_msg = self.check_version_regression(filepath_str)
                if is_regression:
                    self.version_regressions.append((filepath_str, reg_msg))
                    print(f"   ⚠️ {filepath_str}: {reg_msg}")
                    print(f"      ⛔ 已阻止提交（版本回退风险）")
                    continue  # 跳过这个文件
            
            if has_changed:
                self.changed_files.append((filepath_str, reason))  # 存储字符串
                print(f"   📝 {filepath_str}: {reason}")
            else:
                self.unchanged_files.append(filepath)
                print(f"   ⏭️  {filepath_str}: {reason}")
        
        # 3. 显示版本回退警告
        if self.version_regressions:
            print("\n" + "=" * 60)
            print(f"⚠️  检测到 {len(self.version_regressions)} 个文件存在版本回退风险：")
            for filepath, msg in self.version_regressions:
                print(f"   - {filepath}")
            print("=" * 60)
            print("💡 建议：检查这些文件是否被错误回滚，如果确认要提交，请手动修改版本号")
        
        # 4. 提交有变化的文件
        print("\n" + "=" * 60)
        if self.changed_files:
            print(f"✅ 有 {len(self.changed_files)} 个文件需要提交")
            
            # 创建备份（滚动备份机制）
            self.create_backup_before_commit()
            
            # 添加到Git（使用 git add -A 自动处理ignore）
            print("\n   git add -A")
            subprocess.run(['git', 'add', '-A'], check=True)
            
            # 生成提交信息
            date_str = datetime.now().strftime('%Y-%m-%d')
            count = len(self.changed_files)
            commit_msg = self.config.get('commit_message_template', '智能存档: {date} {count}个文件有变化')
            commit_msg = commit_msg.replace('{date}', date_str).replace('{count}', str(count))
            
            # 提交
            print(f"\n💾 提交: {commit_msg}")
            subprocess.run(['git', 'commit', '-m', commit_msg], check=True)
            
            # 推送
            print("\n🚀 推送到远程仓库...")
            subprocess.run(['git', 'push', 'origin', 'main'], check=True)
            
            print("\n" + "=" * 60)
            print(f"✅ 智能存档完成！提交了 {count} 个文件")
            if self.backup_dir:
                print(f"📦 备份位置: {self.backup_dir}")
            print("=" * 60)
        else:
            print("✅ 无文件变化，跳过提交")
            if self.version_regressions:
                print("⚠️  注意：有文件因版本回退风险被阻止提交")
            print("\n" + "=" * 60)
        
        # 5. 输出统计信息
        print(f"\n📊 统计信息:")
        print(f"   检查文件: {len(files_to_check)}")
        print(f"   有变化: {len(self.changed_files)}")
        print(f"   无变化: {len(self.unchanged_files)}")
        print(f"   版本回退（已阻止）: {len(self.version_regressions)}")
        
        if self.unchanged_files:
            print(f"\n⏭️  跳过存档的文件:")
            for f in self.unchanged_files[:10]:  # 只显示前10个
                print(f"   - {f}")
            if len(self.unchanged_files) > 10:
                print(f"   ... 还有 {len(self.unchanged_files) - 10} 个文件")
    
    def run(self):
        """运行智能存档"""
        try:
            # 检查是否在Git仓库中
            result = subprocess.run(['git', 'status'], capture_output=True, text=True)
            if result.returncode != 0:
                print("❌ 错误：当前目录不是Git仓库")
                return
            
            # 执行智能提交
            self.smart_commit()
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Git操作失败: {e}")
        except Exception as e:
            print(f"❌ 发生错误: {e}")

if __name__ == '__main__':
    committer = SmartCommit()
    committer.run()
