#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
_docs/_verify_whitelist.py - Layer 2 白名单校验
由 .git/hooks/pre-commit 调用
"""
import re, json, sys, os
sys.stdout.reconfigure(encoding='utf-8')

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(BASE, '_docs', 'bu_integrity_manifest.json')

def extract_dims_from_block(block, mo):
    """在 RADAR_HISTORY block 中查找指定月份的 dims 数值"""
    # 格式: '2026-05': { dims: { d1: 90, ... } ...
    key = "\'" + mo + "\': "  # mo="2026-05" → "'2026-05': "  ✅ 文件格式: '月份': {
    pos = block.find(key)
    if pos >= 0:
        region = block[pos:pos+400]
    else:
        # Fallback: 文件格式是 "'2026-MM': {"，冒号后有空格
        month_pos = block.find(mo)
        if month_pos < 0:
            return None
        region = block[month_pos:month_pos+400]

    # 提取 dims 块
    dims_start = region.find('dims:')
    if dims_start < 0:
        return None

    # 数括号匹配找 dims 块结束位置
    brace_count = 0
    dims_end = dims_start
    for i, ch in enumerate(region[dims_start:]):
        if ch == '{':
            brace_count += 1
        elif ch == '}':
            brace_count -= 1
            if brace_count == 0:
                dims_end = dims_start + i + 1
                break

    dims_block = region[dims_start:dims_end]
    actual = {}
    for di in range(1, 7):
        dk = 'd' + str(di)
        p = dims_block.find(dk)
        if p >= 0:
            num_s = ''
            # Skip 'dX:' and any spaces to reach the number
            i = p + len(dk)
            while i < len(dims_block) and not dims_block[i].isdigit():
                i += 1
            while i < len(dims_block) and dims_block[i].isdigit():
                num_s += dims_block[i]
                i += 1
            if num_s:
                actual[dk] = int(num_s)
    return actual


def main():
    with open(MANIFEST, 'r', encoding='utf-8') as f:
        data = json.load(f)

    changed = []
    for bu, info in data['bus'].items():
        fname = os.path.join(BASE, info['file'])
        mo = info['month']
        expected_dims = info['dims']

        with open(fname, 'r', encoding='utf-8') as f:
            content = f.read()

        block_start = content.find('RADAR_HISTORY_' + bu + ' = {')
        if block_start < 0:
            changed.append(bu + ': RADAR_HISTORY block not found')
            continue

        block_end = content.find('};', block_start) + 2
        block = content[block_start:block_end]

        actual = extract_dims_from_block(block, mo)
        if actual is None:
            changed.append(bu + ': dims not found for ' + mo)
            continue

        if actual != expected_dims:
            diffs = [k + ': expected=' + str(expected_dims[k]) + ', actual=' + str(actual.get(k))
                     for k in expected_dims if expected_dims[k] != actual.get(k)]
            changed.append(bu + ': dims changed -> ' + ' | '.join(diffs))

    if changed:
        print('[Layer 2] FAIL - BU dims do not match whitelist:')
        for c in changed:
            print('   ' + c)
        sys.exit(1)
    else:
        print('  [Layer 2] OK - all BU dims match whitelist')
        sys.exit(0)


if __name__ == '__main__':
    main()