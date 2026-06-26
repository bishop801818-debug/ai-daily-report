"""
生成所有7个数据库的 *_embedded_data.js 文件
从 *All_Data.json 文件读取数据，生成嵌入数据JS文件
（自动化运行，无需人工放Excel到Downloads）
"""
import pandas as pd
import json
import glob
import os
from datetime import datetime
import re

# ========== 配置：7个数据库 =========
# 从早报流程生成的 *_all_data.json 读取数据
DB_CONFIGS = [
    {
        'name': 'Electrolyte',
        'json_path': 'D:/trae/AI Daily report/electrolyte_all_data.json',
        'output_js': 'D:/trae/AI Daily report/electrolyte_embedded_data.js',
        'js_var': 'EMBEDDED_DATA',
        'source_name': 'electrolyte_all_data.json',
    },
    {
        'name': 'Carbonate',
        'json_path': 'D:/trae/AI Daily report/carbonate_all_data.json',
        'output_js': 'D:/trae/AI Daily report/carbonate_embedded_data.js',
        'js_var': 'EMBEDDED_DATA',
        'source_name': 'carbonate_all_data.json',
    },
    {
        'name': 'Recycling',
        'json_path': 'D:/trae/AI Daily report/recycling_all_data.json',
        'output_js': 'D:/trae/AI Daily report/recycling_embedded_data.js',
        'js_var': 'EMBEDDED_DATA',
        'source_name': 'recycling_all_data.json',
    },
    {
        'name': 'Auto',
        'json_path': 'D:/trae/AI Daily report/automotive_all_data.json',
        'output_js': 'D:/trae/AI Daily report/automotive_embedded_data.js',
        'js_var': 'EMBEDDED_DATA',
        'source_name': 'automotive_all_data.json',
    },
    {
        'name': 'LFP',
        'json_path': 'D:/trae/AI Daily report/lfp_all_data.json',
        'output_js': 'D:/trae/AI Daily report/lfp_embedded_data.js',
        'js_var': 'EMBEDDED_DATA',
        'source_name': 'lfp_all_data.json',
    },
    {
        'name': 'NCM',
        'json_path': 'D:/trae/AI Daily report/ternary_all_data.json',
        'output_js': 'D:/trae/AI Daily report/ternary_embedded_data.js',
        'js_var': 'EMBEDDED_DATA',
        'source_name': 'ternary_all_data.json',
    },
    {
        'name': 'LIB_BATT',
        'json_path': 'D:/trae/AI Daily report/lib_battery_all_data.json',
        'output_js': 'D:/trae/AI Daily report/lib_battery_embedded_data.js',
        'js_var': 'EMBEDDED_DATA',
        'source_name': 'lib_battery_all_data.json',
    },
]


def _extract_latest_month(tables):
    """从表格数据中提取最新月份（用于比较新旧数据的时间范围）"""
    DATE_KEYS = ('日期', '当前日期', '时间', '月份')
    latest = ''
    for t in tables:
        for row in t.get('data', []):
            for dk in DATE_KEYS:
                v = str(row.get(dk, ''))[:7]  # 取 YYYY-MM
                if v and v > latest:
                    latest = v
    return latest


def _extract_per_table_latest(tables):
    """为每个表提取最新月份，返回 {table_name: latest_month}"""
    DATE_KEYS = ('日期', '当前日期', '时间', '月份')
    result = {}
    for t in tables:
        tname = t.get('table_name', '')
        latest = ''
        for row in t.get('data', []):
            for dk in DATE_KEYS:
                v = str(row.get(dk, ''))[:7]
                if v and v > latest:
                    latest = v
        if tname:
            result[tname] = latest
    return result


def sort_tables(tables):
    """按'当前日期'倒序排列所有表格数据（最近日期在前），保证展示顺序一致性"""
    DATE_KEYS = ('当前日期', '日期', 'date', 'update_date')
    for table in tables:
        rows = table.get('data', [])
        if not rows:
            continue
        date_key = next((k for k in DATE_KEYS if k in rows[0]), None)
        if not date_key:
            continue
        table['data'] = sorted(rows, key=lambda r: str(r.get(date_key) or ''), reverse=True)


def generate_db(db_config):
    """为一个数据库生成嵌入数据JS文件（从JSON读取）"""
    name = db_config['name']
    json_path = db_config['json_path']
    output_js = db_config['output_js']
    js_var = db_config['js_var']
    source_name = db_config['source_name']

    # ── 0. 读取现有数据（用于后续保护对比）──
    existing_tables = []
    existing_latest_month = ''
    existing_content = ''
    if os.path.exists(output_js):
        try:
            with open(output_js, 'r', encoding='utf-8') as f:
                existing_content = f.read()
            existing_data = json.loads(re.sub(r'^const\s+\w+\s*=\s*', '',
                                              existing_content.strip()).rstrip().rstrip(';'))
            existing_tables = existing_data.get('tables', [])
            existing_latest_month = _extract_latest_month(existing_tables)
            print(f'  [INFO] 现有数据最新月份: {existing_latest_month}')
        except Exception:
            pass  # 读取失败不影响主流程

    # ── 1. 读取 JSON 文件 ──
    if not os.path.exists(json_path):
        print(f'[WARN] {name}: JSON file not found, path={json_path}')
        return False

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
        tables = json_data.get('tables', [])
        if not tables:
            print(f'[WARN] {name}: JSON has no tables, path={json_path}')
            return False
        print(f'[INFO] {name}: read from {source_name}, tables={len(tables)}')
    except Exception as e:
        print(f'[ERROR] {name}: JSON read error - {e}')
        return False

    # ── 2. 数据时间范围保护：防止旧 JSON 覆盖新数据 ──
    new_per_table = _extract_per_table_latest(tables)
    if existing_tables and new_per_table:
        regressions = []
        for existing_t in existing_tables:
            existing_tname = existing_t.get('table_name', '')
            existing_t_latest = ''
            for row in existing_t.get('data', []):
                for dk in ('日期', '当前日期', '时间', '月份'):
                    v = str(row.get(dk, ''))[:7]
                    if v and v > existing_t_latest:
                        existing_t_latest = v
            new_t_latest = new_per_table.get(existing_tname, '')
            if existing_t_latest and new_t_latest and existing_t_latest > new_t_latest:
                regressions.append((existing_tname, existing_t_latest, new_t_latest))

        if regressions:
            backup_path = output_js + f'.golden_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(existing_content)
            print(f'')
            print(f'  {"="*60}')
            print(f'  [BLOCKED] {name}: 以下 {len(regressions)} 个表会数据回退，拒绝覆盖！')
            for tname, old_m, new_m in regressions:
                print(f'    {tname}: 现有={old_m}  →  新JSON={new_m}  ▼')
            print(f'  JSON 文件: {source_name}')
            print(f'  已备份当前 JS 到: {os.path.basename(backup_path)}')
            print(f'  请更新数据源后再运行此脚本。')
            print(f'  {"="*60}')
            print(f'')
            return False

    # ── 3. 排序：按日期倒序 ──
    sort_tables(tables)

    # ── 4. 生成 JS 文件 ──
    update_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    js_content = f'''const {js_var} = {json.dumps({
        "update_time": update_time,
        "source": source_name,
        "tables": tables
    }, ensure_ascii=False, indent=2)};
'''

    try:
        with open(output_js, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f'[OK] {name}: generated {output_js}')
        print(f'  tables={len(tables)}, update={update_time}')
        return True
    except Exception as e:
        print(f'[ERROR] {name}: JS write failed - {e}')
        return False


def sync_html_table_names():
    """生成后联动：扫描 HTML 页面，将 allData['已失效表名'] 替换为嵌入数据实际的表名。"""
    import re, os
    project = os.path.dirname(os.path.abspath(__file__))

    # 1. 收集每个 JS 文件中实际的表名集合
    js_actual_names = {}  # js_file -> Set[table_name]
    for cfg in DB_CONFIGS:
        js_path = cfg['output_js']
        if not os.path.exists(js_path):
            continue
        try:
            with open(js_path, 'r', encoding='utf-8') as f:
                content = f.read()
            start = content.find('{')
            data = json.loads(content[start:].rstrip().rstrip(';'))
            names = {t['table_name'] for t in data.get('tables', [])}
            js_actual_names[js_path] = names
        except Exception:
            pass

    # 2. 找出每个 JS 对应的 HTML 文件
    html_files = []
    for js_path, actual_names in js_actual_names.items():
        base = os.path.basename(js_path).replace('_embedded_data.js', '')
        for suffix in ('_data_v2.html', '_charts.html'):
            html_path = os.path.join(project, base + suffix)
            if os.path.exists(html_path):
                html_files.append((html_path, actual_names, base))

    # 3. 扫描并修复每个 HTML
    total_fixes = 0
    for html_path, actual_names, base in html_files:
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 找出所有 allData['xxx'] 引用
        refs = re.findall(r"allData\['([^']+)'\]", content)
        refs = list(dict.fromkeys(refs))  # 去重保持顺序

        missing = [r for r in refs if r not in actual_names]
        if not missing:
            continue

        # 找最佳匹配
        fixes = []
        for bad_name in missing:
            candidates = []
            for actual in actual_names:
                if bad_name.startswith(actual) and bad_name[len(actual):]:
                    suffix = bad_name[len(actual):]
                    if suffix in ('数据', '（客户采购量）', '（分压实密度）',
                                  '(客户采购量)', '(分压实密度)',
                                  '（万元吨）', '(万元吨)', '-分压实密度'):
                        candidates.append(actual)
                if actual.startswith(bad_name) and actual[len(bad_name):]:
                    suffix = actual[len(bad_name):]
                    if suffix in ('-分压实密度',):
                        candidates.append(actual)
                if actual in bad_name or bad_name in actual:
                    if len(actual) != len(bad_name):
                        candidates.append(actual)
            if candidates:
                best = min(candidates, key=lambda c: abs(len(c) - len(bad_name)))
                fixes.append((bad_name, best))

        if not fixes:
            print(f'  [WARN] {html_path}: 以下表名无匹配 → {missing}')
            continue

        modified = False
        for bad_name, correct_name in fixes:
            if bad_name in content:
                pattern = r"(allData\[')" + re.escape(bad_name) + r"('\])"
                new_pattern = r"\g<1>" + correct_name + r"\g<2>"
                new_content = re.sub(pattern, new_pattern, content)
                if new_content != content:
                    content = new_content
                    modified = True
                    print(f'  [SYNC] {html_path}:')
                    print(f'         {bad_name} → {correct_name}')

        if modified:
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(content)
            total_fixes += len(fixes)

    if total_fixes > 0:
        print(f'\n  [SYNC] 共修复 {total_fixes} 处 HTML 表名引用')
    else:
        print('\n  [SYNC] 所有 HTML 表名引用均正确，无需修复')
    return total_fixes


def post_generate_validation():
    """生成后一致性检查：防止 JS 变量名与 HTML 引用不匹配"""
    import re, os
    project = os.path.dirname(os.path.abspath(__file__))
    errors = []
    ok_count = 0

    # 1. 数据库看板 *_embedded_data.js 必须导出 EMBEDDED_DATA
    DB_CHART_BASES = {'automotive', 'carbonate', 'electrolyte', 'lfp',
                      'lib_battery', 'recycling', 'ternary'}
    for fname in os.listdir(project):
        base = fname.replace('_embedded_data.js', '')
        if fname.endswith('_embedded_data.js') and base in DB_CHART_BASES:
            fpath = os.path.join(project, fname)
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    first_line = f.readline()
                m = re.match(r'^\s*const\s+(\w+)\s*=', first_line)
                var = m.group(1) if m else '?'
                if var != 'EMBEDDED_DATA':
                    errors.append(f'  [FAIL] {fname}: exports "{var}" but must be "EMBEDDED_DATA"')
                else:
                    ok_count += 1
            except Exception as e:
                errors.append(f'  [FAIL] {fname}: read error - {e}')

    # 2. 所有 *_charts.html 必须引用 EMBEDDED_DATA
    OLD_VARS = {'ELECTROLYTE_DATA', 'TERNARY_DATA', 'AUTOMOTIVE_DATA',
                'LIB_BATTERY_DATA', 'RECYCLING_DATA', 'CARBONATE_DATA', 'LFP_DATA'}
    for fname in os.listdir(project):
        if fname.endswith('_charts.html'):
            fpath = os.path.join(project, fname)
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    content = f.read()
                for ov in OLD_VARS:
                    if re.search(r'\b' + ov + r'\b', content):
                        errors.append(f'  [FAIL] {fname}: uses old var "{ov}" instead of "EMBEDDED_DATA"')
            except Exception as e:
                errors.append(f'  [FAIL] {fname}: read error - {e}')

    print()
    print('=' * 60)
    print('  变量名一致性检查')
    print('=' * 60)
    if errors:
        print('FAIL - 发现以下问题:')
        for e in errors:
            print(e)
        return False
    else:
        print(f'PASS - {ok_count} 个数据文件全部正确 (exports EMBEDDED_DATA)')
        return True


if __name__ == '__main__':
    print('=' * 60)
    print('Generate all DB embedded JS files')
    print('  数据源: *_all_data.json (自动读取)')
    print('=' * 60)

    success_count = 0
    for db_config in DB_CONFIGS:
        print()
        ok = generate_db(db_config)
        if ok:
            success_count += 1

    print()
    print('=' * 60)
    print(f'Done: {success_count}/{len(DB_CONFIGS)} DB generated')
    print('=' * 60)

    # 强制一致性检查
    if not post_generate_validation():
        print()
        print('[ERROR] 数据一致性检查失败！请修复后再重新生成。')
        import sys
        sys.exit(1)

    # HTML 表名联动
    print()
    print('=' * 60)
    print('  HTML 表名联动检查')
    print('=' * 60)
    sync_html_table_names()

    # 同步 JSON（由于数据源已经是 JSON，这里可以跳过或保留空操作）
    print()
    print('[INFO] 数据源已是 JSON，无需重复同步')