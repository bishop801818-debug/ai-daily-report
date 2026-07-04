#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
对指定的 HTML 文件做「轻量化处理」：
1. 提取所有内联 <script> 块为外部 inline_XX.js
2. 替换 <script> 标签为 <script src="inline_XX.js"></script>
3. 提取 data:image/...;base64, 为外部图片文件

用法: python optimize_html.py <html_file_path> [output_dir]
"""

import re
import os
import sys
import base64

def optimize_html(html_path, output_dir=None):
    if output_dir is None:
        output_dir = os.path.dirname(html_path)
    
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    original_size = len(content.encode("utf-8"))
    print(f"处理文件: {html_path}")
    print(f"原始大小: {original_size:,} bytes ({original_size/1024:.1f} KB)")
    
    # ── 第1步：提取 data:image base64 为外部文件 ──────────
    img_dir = os.path.join(output_dir, "img")
    os.makedirs(img_dir, exist_ok=True)
    
    def replace_base64_img(m):
        mime = m.group(1)
        b64data = m.group(2)
        ext = mime.split("/")[1]
        if "png" in ext: ext = "png"
        elif "jpeg" in ext or "jpg" in ext: ext = "jpg"
        elif "gif" in ext: ext = "gif"
        elif "webp" in ext: ext = "webp"
        elif "svg" in ext: ext = "svg"
        else: ext = "png"
        
        content_hash = str(abs(hash(b64data)))
        fname = f"inline_img_{content_hash[:8]}.{ext}"
        fpath = os.path.join(img_dir, fname)
        if not os.path.exists(fpath):
            with open(fpath, "wb") as out:
                out.write(base64.b64decode(b64data))
        return f"img/{os.path.basename(fpath)}"
    
    img_pattern = re.compile(r'data:(image/[^;]+);base64,([A-Za-z0-9+/=]+)')
    content, n_img = img_pattern.subn(replace_base64_img, content)
    if n_img:
        print(f"  ✅ 提取 {n_img} 处 base64 图片 → {img_dir}")
    
    # ── 第2步：提取内联 <script> 块 ─────────────────────
    # 暴力查找所有 <script> 和 </script> 对
    script_blocks = []
    pos = 0
    while True:
        start = content.find('<script', pos)
        if start == -1:
            break
        # 找 <script> 的结束 >
        gt_pos = content.find('>', start)
        if gt_pos == -1:
            break
        tag_open = content[start:gt_pos+1]
        
        # 找对应的 </script>
        end = content.find('</script>', gt_pos+1)
        if end == -1:
            break
        
        script_body = content[gt_pos+1:end]
        
        # 检查是否有 src= 属性
        has_src = 'src=' in tag_open
        
        if not has_src and len(script_body.strip()) > 100:
            script_blocks.append((start, end + len('</script>'), script_body))
        
        pos = end + len('</script>')
    
    if not script_blocks:
        print("  ℹ️  无内联脚本需要提取")
        return original_size
    
    print(f"  🔍 发现 {len(script_blocks)} 个内联脚本块，开始提取...")
    
    # 从后往前替换
    new_content = content
    extracted_files = []
    
    # 按位置从后往前排序
    sorted_blocks = sorted(script_blocks, key=lambda x: x[0], reverse=True)
    
    for idx, (start, end, script_body) in enumerate(sorted_blocks):
        js_fname = f"inline_{len(sorted_blocks)-1-idx:02d}.js"
        js_path = os.path.join(output_dir, js_fname)
        
        with open(js_path, "w", encoding="utf-8") as f:
            f.write(script_body)
        
        fsize = os.path.getsize(js_path)
        extracted_files.append((js_fname, fsize))
        print(f"    [{len(sorted_blocks)-1-idx:02d}] {fsize:,} bytes → {js_fname}")
        
        # 替换
        replacement = f'<script src="{js_fname}"></script>'
        new_content = new_content[:start] + replacement + new_content[end:]
    
    # 写回 HTML
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(new_content)

    new_size = os.path.getsize(html_path)

    # ── 第3步：大小校验（警告模式，不阻断）────────────────────
    HTML_SIZE_LIMIT = 300 * 1024  # 300KB 红线
    JS_SIZE_LIMIT = 500 * 1024   # 500KB 红线

    warnings = []

    if new_size > HTML_SIZE_LIMIT:
        oversize_kb = (new_size - HTML_SIZE_LIMIT) / 1024
        warnings.append(
            f'  ⚠️  HTML 大小超限：{new_size/1024:.1f} KB > 300 KB（超出 {oversize_kb:.1f} KB）'
        )
    else:
        print(f'  ✅  HTML 大小：{new_size/1024:.1f} KB ≤ 300 KB')

    for js_fname, js_size in extracted_files:
        if js_size > JS_SIZE_LIMIT:
            oversize_kb = (js_size - JS_SIZE_LIMIT) / 1024
            warnings.append(
                f'  ⚠️  JS 大小超限：{js_fname} = {js_size/1024:.1f} KB > 500 KB（超出 {oversize_kb:.1f} KB）'
            )

    print(f"\n✅ 优化完成:")
    print(f"  HTML: {original_size:,} → {new_size:,} bytes ({new_size/1024:.1f} KB)")
    print(f"  减少: {(original_size-new_size):,} bytes ({(original_size-new_size)/original_size*100:.1f}%)")
    print(f"  提取 JS 文件: {len(extracted_files)} 个")
    total_js = sum(s[1] for s in extracted_files)
    print(f"  JS 文件合计: {total_js:,} bytes ({total_js/1024:.1f} KB)")

    if warnings:
        print(f"\n  {'='*50}")
        print(f"  文件大小警告（仅警告，不阻断）：")
        for w in warnings:
            print(w)
        print(f"  {'='*50}")
    else:
        print(f"  ✅ 所有文件大小均在红线以内")

    return original_size


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python optimize_html.py <html_file_path> [output_dir]")
        sys.exit(1)
    html_file = sys.argv[1]
    out_dir = sys.argv[2] if len(sys.argv) > 2 else None
    optimize_html(html_file, out_dir)
