#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自动将 assets/ 目录下的 PNG/JPG 图片转换为 WebP 格式
- 如果 WebP 已存在且比原图新，跳过
- 转换质量：85（平衡大小和画质）
- 支持递归搜索
"""

import os
import sys
from pathlib import Path

def convert_to_webp(input_path, output_path, quality=85):
    """转换单个图片为 WebP"""
    try:
        from PIL import Image
        
        # 检查是否需要转换
        if os.path.exists(output_path):
            input_mtime = os.path.getmtime(input_path)
            output_mtime = os.path.getmtime(output_path)
            if output_mtime >= input_mtime:
                print(f'  ⏭️  跳过（已是最新）：{os.path.basename(output_path)}')
                return True
        
        # 转换
        img = Image.open(input_path)
        # 如果是 RGBA 模式，需要特殊处理
        if img.mode in ('RGBA', 'LA'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[-1])
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        img.save(output_path, 'WEBP', quality=quality, method=6)
        
        # 显示压缩效果
        original_size = os.path.getsize(input_path)
        webp_size = os.path.getsize(output_path)
        ratio = (1 - webp_size / original_size) * 100
        
        print(f'  ✅ {os.path.basename(input_path)} → {os.path.basename(output_path)} ({original_size/1024:.1f}KB → {webp_size/1024:.1f}KB, -{ratio:.1f}%)')
        return True
        
    except Exception as e:
        print(f'  ❌ 转换失败：{input_path}')
        print(f'     错误：{e}')
        return False

def main():
    base_dir = Path(__file__).parent
    assets_dir = base_dir / 'assets'
    
    if not assets_dir.exists():
        print(f'❌ assets/ 目录不存在：{assets_dir}')
        return 1
    
    # 支持的图片格式
    supported_exts = {'.png', '.jpg', '.jpeg', '.bmp', '.tiff'}
    
    # 查找所有图片
    image_files = []
    for ext in supported_exts:
        image_files.extend(assets_dir.rglob(f'*{ext}'))
        image_files.extend(assets_dir.rglob(f'*{ext.upper()}'))
    
    if not image_files:
        print('ℹ️  未找到需要转换的图片')
        return 0
    
    print(f'🔍 找到 {len(image_files)} 个图片文件')
    print(f'📁 目录：{assets_dir}')
    print(f'')
    
    success_count = 0
    skip_count = 0
    fail_count = 0
    
    for img_path in sorted(set(image_files)):  # 去重
        # 生成 WebP 路径
        webp_path = img_path.with_suffix('.webp')
        
        # 如果原图就是 WebP，跳过
        if img_path.suffix.lower() == '.webp':
            continue
        
        print(f'处理：{img_path.name}')
        
        if convert_to_webp(img_path, webp_path):
            if os.path.exists(webp_path) and os.path.getmtime(webp_path) >= os.path.getmtime(img_path):
                success_count += 1
            else:
                skip_count += 1
        else:
            fail_count += 1
    
    print(f'')
    print(f'=== 转换完成 ===')
    print(f'✅ 成功：{success_count}')
    print(f'⏭️  跳过：{skip_count}')
    print(f'❌ 失败：{fail_count}')
    
    return 0 if fail_count == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
