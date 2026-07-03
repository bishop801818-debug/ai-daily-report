#!/usr/bin/env python3
"""检查 electrolyte_data_v2.html 和 automotive_data_v2.html 为什么仍然大"""
import os
import re

BASE = 'D:/trae/AI Daily report'

def find_json_size(content, marker):
    """找到 marker 后面的 JSON 数据大小"""
    start = content.find(marker)
    if start == -1:
        return 0
    
    # 跳过 marker
    pos = start + len(marker)
    
    # 找到 JSON 的开始（跳过空白）
    while pos < len(content) and content[pos] in ' \t\r\n=':
        pos += 1
    
    if pos >= len(content) or content[pos] != '{':
        return 0
    
    # 计算 JSON 大小
    brace_count = 1  # 已经有一个 {
    pos += 1
    
    while pos < len(content) and brace_count > 0:
        char = content[pos]
        if char == '\\' and pos + 1 < len(content):
            pos += 2  # 跳过转义字符
            continue
        if char == '"':
            # 跳过字符串
            pos += 1
            while pos < len(content) and content[pos] != '"':
                if content[pos] == '\\' and pos + 1 < len(content):
                    pos += 1
                pos += 1
            pos += 1  # 跳过结束的 "
            continue
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
        pos += 1
    
    return pos - start

# 检查 electrolyte_data_v2.html
print("="*60)
print("检查 electrolyte_data_v2.html")
print("="*60)

fpath = os.path.join(BASE, 'electrolyte_data_v2.html')
with open(fpath, 'r', encoding='utf-8') as f:
    content = f.read()

size = len(content)
print(f"文件大小: {size:,} bytes ({size/1024:.1f} KB)")

# 查找嵌入数据
markers = ['window.__EMBEDDED__ = ', 'var EMBEDDED = ', 'var data = ']
for marker in markers:
    if marker in content:
        json_size = find_json_size(content, marker)
        if json_size > 0:
            print(f"  - 找到 {marker}: {json_size:,} bytes ({json_size/1024:.1f} KB)")
            print(f"  - 占比: {json_size/size*100:.1f}%")

# 查找大行
lines = content.split('\n')
large_lines = [i for i, l in enumerate(lines) if len(l) > 5000]
print(f"  - 超过 5000 字符的行: {len(large_lines)} 行")
if large_lines:
    max_len = max(len(l) for l in lines)
    print(f"  - 最大行长度: {max_len:,} 字符")

# 查找内联脚本
scripts = re.findall(r'<script[^>]*>(.*?)</script>', content, re.DOTALL)
inline_size = sum(len(s) for s in scripts)
print(f"  - 内联脚本总大小: {inline_size:,} bytes ({inline_size/1024:.1f} KB)")

print()

# 检查 automotive_data_v2.html
print("="*60)
print("检查 automotive_data_v2.html")
print("="*60)

fpath = os.path.join(BASE, 'automotive_data_v2.html')
if not os.path.exists(fpath):
    print("文件不存在")
else:
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    size = len(content)
    print(f"文件大小: {size:,} bytes ({size/1024:.1f} KB)")

    # 查找嵌入数据
    for marker in markers:
        if marker in content:
            json_size = find_json_size(content, marker)
            if json_size > 0:
                print(f"  - 找到 {marker}: {json_size:,} bytes ({json_size/1024:.1f} KB)")
                print(f"  - 占比: {json_size/size*100:.1f}%")

    # 查找大行
    lines = content.split('\n')
    large_lines = [i for i, l in enumerate(lines) if len(l) > 5000]
    print(f"  - 超过 5000 字符的行: {len(large_lines)} 行")
    if large_lines:
        max_len = max(len(l) for l in lines)
        print(f"  - 最大行长度: {max_len:,} 字符")

    # 查找内联脚本
    scripts = re.findall(r'<script[^>]*>(.*?)</script>', content, re.DOTALL)
    inline_size = sum(len(s) for s in scripts)
    print(f"  - 内联脚本总大小: {inline_size:,} bytes ({inline_size/1024:.1f} KB)")
