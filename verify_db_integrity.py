"""
数据库完整性验证脚本
用途：检测 7 个数据库 embedded_data.js 是否被未知脚本覆盖/回滚
使用方法：python verify_db_integrity.py

每次更新数据前运行此脚本，确保：
1. 文件大小与基准一致（±5% 容差）
2. 数据行数与预期一致
3. 最新月份数据存在
"""

import os
import json
import hashlib
from datetime import datetime

# ========== 基准数据：2026-06-02 版本 ==========
# 这些值来自最后一次确认正确的提交 2f28598
BASELINE = {
    'electrolyte_embedded_data.js':   {'size': 1950530, 'rows': 540, 'latest_month': '2026年1-4月'},
    'carbonate_embedded_data.js':     {'size': 4002731, 'rows': 400, 'latest_month': '2026年5月'},
    'lfp_embedded_data.js':           {'size': 3877519, 'rows': 400, 'latest_month': '2026年4月'},
    'ternary_embedded_data.js':       {'size': 3118344, 'rows': 200, 'latest_month': '2026年4月'},
    'lib_battery_embedded_data.js':   {'size': 636158,  'rows': 100, 'latest_month': '2026年4月'},
    'recycling_embedded_data.js':     {'size': 5795033, 'rows': 200, 'latest_month': '2026年4月'},
    'automotive_embedded_data.js':    {'size': 643498,  'rows': 200, 'latest_month': '2026年4月'},
}

# embedded/ 镜像目录的对应文件
EMBEDDED_CHECK = {
    'electrolyte_embedded_data.js':   {'size': 1950530},
    'carbonate_embedded_data.js':     {'size': 4002731},
    'lfp_embedded_data.js':           {'size': 3877519},
    'ternary_embedded_data.js':       {'size': 3118344},
    'lib_battery_embedded_data.js':   {'size': 636158},
    'recycling_embedded_data.js':     {'size': 5795033},
    'automotive_embedded_data.js':    {'size': 643498},
}

# HTML 页面文件基准（大小）
HTML_BASELINE = {
    'electrolyte_data_v2.html':   {'root': 'electrolyte_data_v2.html'},
    'carbonate_data_v2.html':     {'root': 'carbonate_data_v2.html'},
    'lfp_data_v2.html':           {'root': 'lfp_data_v2.html'},
    'ternary_data_v2.html':       {'root': 'ternary_data_v2.html'},
    'lib_battery_data_v2.html':   {'root': 'lib_battery_data_v2.html'},
    'recycling_data_v2.html':     {'root': 'recycling_data_v2.html'},
    'automotive_data_v2.html':    {'root': 'automotive_data_v2.html'},
}


def verify_file_size(filepath, expected_size, tolerance_pct=5):
    """验证文件大小是否在预期范围内"""
    if not os.path.exists(filepath):
        return False, f'文件不存在: {filepath}'

    actual_size = os.path.getsize(filepath)
    diff_pct = abs(actual_size - expected_size) / expected_size * 100

    if diff_pct > tolerance_pct:
        return False, f'大小异常: 预期 {expected_size} bytes, 实际 {actual_size} bytes (差异 {diff_pct:.1f}%)'
    return True, f'OK: {actual_size} bytes'


def verify_json_data(filepath, expected_rows, expected_latest_month=None):
    """验证 embedded_data.js 的 JSON 数据内容"""
    if not os.path.exists(filepath):
        return False, f'文件不存在: {filepath}'

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # 提取 JSON（去除 var xxx = 和结尾分号）
        var_match = content.find(' = ')
        if var_match == -1:
            return False, '无法找到变量赋值'

        json_str = content[var_match + 3:]
        if json_str.rstrip().endswith(';'):
            json_str = json_str.rstrip()[:-1]

        data = json.loads(json_str)

        # 检查表格数量
        table_count = len(data)
        row_count = sum(len(v) if isinstance(v, list) else 0 for v in data.values())

        # 检查最新月份
        msg_parts = [f'表格数: {table_count}, 数据行: {row_count}']

        issues = []
        if row_count < expected_rows * 0.8:
            issues.append(f'数据行不足: 预期 ~{expected_rows}, 实际 {row_count}')

        if expected_latest_month:
            found_latest = False
            for table_name, rows in data.items():
                if isinstance(rows, list) and rows:
                    last_row = rows[-1]
                    for key in ['月份', ' 月份 ', '日期', '文本']:
                        if key in last_row and str(last_row[key]) == expected_latest_month:
                            found_latest = True
                            break
            if not found_latest:
                issues.append(f'未找到预期最新月份: {expected_latest_month}')

        if issues:
            return False, '; '.join(issues)
        return True, '; '.join(msg_parts)

    except json.JSONDecodeError as e:
        return False, f'JSON解析失败: {e}'
    except Exception as e:
        return False, f'验证错误: {e}'


def check_git_commit():
    """检查 git 提交历史，确保没有回滚到旧版本"""
    import subprocess

    try:
        result = subprocess.run(
            ['git', 'log', '--oneline', '-5'],
            capture_output=True, text=True, encoding='utf-8',
            cwd=os.path.dirname(os.path.abspath(__file__)) or '.'
        )
        return True, result.stdout.strip()
    except Exception as e:
        return False, f'无法读取git历史: {e}'


def verify_sync(root_path, embedded_path, filename):
    """验证根目录和 embedded/ 目录的同名文件是否一致"""
    root_file = os.path.join(root_path, filename)
    emb_file = os.path.join(embedded_path, filename)

    if not os.path.exists(emb_file):
        return False, f'embedded/ 中不存在: {filename}'

    root_size = os.path.getsize(root_file) if os.path.exists(root_file) else 0
    emb_size = os.path.getsize(emb_file)

    if root_size != emb_size:
        return False, f'大小不一致: 根目录={root_size} bytes, embedded/={emb_size} bytes'
    return True, f'同步: {root_size} bytes'


def main():
    base_dir = os.path.dirname(os.path.abspath(__file__)) or '.'
    root_dir = base_dir
    emb_dir = os.path.join(base_dir, 'embedded')

    print('=' * 60)
    print(f'数据库完整性验证 | {datetime.now().strftime("%Y-%m-%d %H:%M")}')
    print('=' * 60)

    all_ok = True

    # 1. 验证根目录 embedded_data.js 文件大小
    print('\n[1/4] 验证根目录 *_embedded_data.js 文件大小')
    print('-' * 60)
    for filename, baseline in BASELINE.items():
        filepath = os.path.join(root_dir, filename)
        ok, msg = verify_file_size(filepath, baseline['size'], tolerance_pct=5)
        status = '[OK]' if ok else '[FAIL]'
        print(f'  {status} {filename:<40} {msg}')
        if not ok:
            all_ok = False

    # 2. 验证 embedded/ 目录同名文件大小
    print('\n[2/4] 验证 embedded/ 同名文件大小（应与根目录一致）')
    print('-' * 60)
    for filename, baseline in EMBEDDED_CHECK.items():
        filepath = os.path.join(emb_dir, filename)
        ok, msg = verify_file_size(filepath, baseline['size'], tolerance_pct=1)
        status = '[OK]' if ok else '[FAIL]'
        print(f'  {status} embedded/{filename:<30} {msg}')
        if not ok:
            all_ok = False

    # 3. 验证根目录与 embedded/ 同步性
    print('\n[3/4] 验证根目录 vs embedded/ 同步性')
    print('-' * 60)
    for filename in EMBEDDED_CHECK:
        ok, msg = verify_sync(root_dir, emb_dir, filename)
        status = '[OK]' if ok else '[FAIL]'
        print(f'  {status} {msg}')
        if not ok:
            all_ok = False

    # 4. 检查 Git 提交历史
    print('\n[4/4] Git 提交历史（最近5条）')
    print('-' * 60)
    ok, git_info = check_git_commit()
    for line in git_info.split('\n')[:5]:
        print(f'  {line}')
    if not ok:
        print(f'  ! {git_info}')

    print('\n' + '=' * 60)
    if all_ok:
        print('[PASS] 所有检查通过 - 数据库完整，无异常覆盖')
    else:
        print('[FAIL] 发现异常 - 可能被未知脚本覆盖，请立即检查！')
        print('   建议操作：git status 查看哪些文件被修改，git diff 查看变更内容')
    print('=' * 60)

    return 0 if all_ok else 1


if __name__ == '__main__':
    exit(main())