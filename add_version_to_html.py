#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
批量添加版本号到HTML文件
为所有子页面添加 <meta name="html-version"> 标签
"""

import os
import re
from datetime import datetime

def add_version_to_html(filepath, version=None):
    """为单个HTML文件添加版本号"""
    if version is None:
        version = datetime.now().strftime('%Y%m%d_%H%M')
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 检查是否已有版本号
    if 'html-version' in content or 'HTML_VERSION' in content:
        print(f"   ⏭️  {filepath}: 已有版本号，跳过")
        return False
    
    # 在 </head> 前添加版本号meta标签
    version_meta = f'    <meta name="html-version" content="{version}">\n'
    
    if '</head>' in content:
        content = content.replace('</head>', version_meta + '  </head>', 1)
    else:
        # 如果没有 </head>，在 <head> 后添加
        if '<head>' in content:
            content = content.replace('<head>', '<head>\n' + version_meta, 1)
        else:
            print(f"   ⚠️  {filepath}: 无法找到 <head> 标签，跳过")
            return False
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"   ✅ {filepath}: 已添加版本号 {version}")
    return True

def batch_add_version():
    """批量添加版本号到所有HTML文件"""
    print("=" * 60)
    print("📝 批量添加版本号到HTML文件")
    print("=" * 60)
    
    # 收集所有HTML文件
    html_files = []
    for root, dirs, files in os.walk('.'):
        # 跳过隐藏目录和特定目录
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
        
        for file in files:
            if file.endswith('.html'):
                html_files.append(os.path.join(root, file))
    
    print(f"\n找到 {len(html_files)} 个HTML文件")
    
    # 生成统一版本号
    version = datetime.now().strftime('%Y%m%d_%H%M')
    print(f"统一版本号: {version}\n")
    
    # 批量添加
    success_count = 0
    skip_count = 0
    
    for filepath in sorted(html_files):
        if add_version_to_html(filepath, version):
            success_count += 1
        else:
            skip_count += 1
    
    print("\n" + "=" * 60)
    print(f"✅ 完成！")
    print(f"   成功添加: {success_count} 个文件")
    print(f"   跳过（已有版本号）: {skip_count} 个文件")
    print("=" * 60)

if __name__ == '__main__':
    batch_add_version()
