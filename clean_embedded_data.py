#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
clean_embedded_data.py

清理所有 HTML 文件中的 window.__EMBEDDED__ 嵌入式数据。
确保数据通过 fetch() 动态加载，不再内嵌在 HTML 中。

使用方法：
    python clean_embedded_data.py

处理的文件：
    - index.html
    - index_v3.html
    - embedded/index.html
    - embedded/index_v3.html
"""

import os
import re

# 要处理的 HTML 文件列表
HTML_FILES = [
    'index.html',
    'index_v3.html',
    'embedded/index.html',
    'embedded/index_v3.html',
]

# window.__EMBEDDED__ 的正则模式
# 匹配从 "window.__EMBEDDED__ = {" 到对应的结束 "};"
EMBEDDED_PATTERN = re.compile(
    r'\n?\s*window\.__EMBEDDED__\s*=\s*\{',
    re.MULTILINE
)

def clean_file(filepath):
    """清理单个 HTML 文件中的嵌入式数据"""
    if not os.path.exists(filepath):
        print(f'  ⚠️  文件不存在：{filepath}')
        return False

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 查找 window.__EMBEDDED__ 出现的位置
    match = EMBEDDED_PATTERN.search(content)
    if not match:
        print(f'  ✅  无嵌入式数据：{filepath}')
        return True

    start_pos = match.start()
    # 向前找换行符
    search_start = max(0, start_pos - 10)
    # 从匹配点开始，找到 JSON 块的结束
    brace_count = 0
    in_string = False
    escape_next = False
    json_start = -1
    json_end = -1

    for i in range(start_pos, len(content)):
        char = content[i]
        if escape_next:
            escape_next = False
            continue
        if char == '\\':
            escape_next = True
            continue
        if char == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if char == '{':
            if json_start == -1:
                json_start = i
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0 and json_start != -1:
                json_end = i + 1
                break

    if json_start == -1 or json_end == -1:
        print(f'  ❌  无法解析 JSON 结构：{filepath}')
        return False

    # 显示清理前的大小
    original_size = len(content)
    removed_size = json_end - json_start

    # 移除嵌入式数据块
    new_content = content[:start_pos] + content[json_end:]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    new_size = len(new_content)
    saved = original_size - new_size

    print(f'  ✅  已清理：{filepath}')
    print(f'     清理前：{original_size:,} 字节 | 清理后：{new_size:,} 字节 | 节省：{saved:,} 字节')

    return True

def main():
    print('=' * 60)
    print('清理 HTML 嵌入式数据')
    print('=' * 60)

    # 检查是否在项目根目录
    if not os.path.exists('index.html'):
        print('❌ 错误：请在项目根目录运行此脚本')
        print('   例如：cd "D:/trae/AI Daily report" && python clean_embedded_data.py')
        return

    success_count = 0
    fail_count = 0

    for filepath in HTML_FILES:
        print(f'\n处理：{filepath}')
        if clean_file(filepath):
            success_count += 1
        else:
            fail_count += 1

    print()
    print('=' * 60)
    print(f'完成：成功 {success_count} 个，失败 {fail_count} 个')
    print('=' * 60)
    print()
    print('✅ 数据加载现在完全依赖 fetch() 动态加载')
    print('   数据来源：reports/YYYY-MM-DD.json')

if __name__ == '__main__':
    main()
