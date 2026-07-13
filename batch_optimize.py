#!/usr/bin/env python3
"""
批量优化所有HTML文件（提取内联大脚本为外部JS）
"""
import os
import sys
import subprocess
import glob

BASE = 'D:/trae/AI Daily report'
OPTIMIZE_PY = os.path.join(BASE, 'optimize_html.py')

# 需要优化的文件列表（从 auto_miaoda_daily.py FILES 列表）
FILES = [
    'index_v3.html', 'archive_v3.html', 'dept-archive.html',
    'industry_news_embedded.html', 'help.html', 'analysis_hub.html',
    'strategy_hub.html', 'radar_hub.html', 'database_hub.html',
    'toolbox.html', 'bu_hub.html', 'automotive_data_v2.html',
    'carbonate_data_v2.html', 'electrolyte_data_v2.html', 'lfp_data_v2.html',
    'lib_battery_data_v2.html', 'recycling_data_v2.html', 'ternary_data_v2.html',
    'lfp_report_2026_05_v2.html', 'electrolyte_report.html',
    'carbonate_report_202605.html', 'felt_report_202604.html', 'felt_report_202605.html',
    'lib_battery_analysis.html', 'automotive_charts.html', 'carbonate_charts.html',
    'electrolyte_charts.html', 'lfp_charts.html', 'lib_battery_charts.html',
    'recycling_charts.html', 'ternary_charts.html', 'radar_detail.html',
    'radar_detail_czly.html', 'radar_detail_dkhx.html', 'radar_detail_felt.html',
    'radar_detail_kelan.html', 'radar_detail_lhy.html', 'radar_detail_lpsd.html',
    'radar_detail_lubricant.html', 'radar_detail_sdmd.html',
]

# 也优化 embedded/ 目录下的对应文件
EMBEDDED_FILES = [
    'embedded/index_v3.html', 'embedded/archive_v3.html', 'embedded/dept-archive.html',
    'embedded/industry_news_embedded.html', 'embedded/help.html', 'embedded/analysis_hub.html',
    'embedded/strategy_hub.html', 'embedded/radar_hub.html', 'embedded/database_hub.html',
    'embedded/toolbox.html', 'embedded/bu_hub.html', 'embedded/automotive_data_v2.html',
    'embedded/carbonate_data_v2.html', 'embedded/electrolyte_data_v2.html', 'embedded/lfp_data_v2.html',
    'embedded/lib_battery_data_v2.html', 'embedded/recycling_data_v2.html', 'embedded/ternary_data_v2.html',
]

# 业务配置类文件：包含 REPORT_LIST / EMBEDDED_NEWS 等业务数据，禁止优化
PROTECTED_FILES = {
    'analysis_hub.html', 'embedded/analysis_hub.html',
    'strategy_hub.html', 'embedded/strategy_hub.html',
    'database_hub.html', 'embedded/database_hub.html',
    'industry_news_embedded.html', 'embedded/industry_news_embedded.html',
    'bu_hub.html', 'embedded/bu_hub.html',
    'toolbox.html', 'embedded/toolbox.html',
}

def optimize_file(html_file):
    """运行 optimize_html.py 优化一个文件"""
    # 跳过受保护的业务配置类文件
    if html_file in PROTECTED_FILES:
        print(f"[PASS] {html_file} (业务配置，已保护)")
        return False
    fpath = os.path.join(BASE, html_file)
    if not os.path.exists(fpath):
        print(f"[SKIP] {html_file} (not found)")
        return False
    
    # 检查文件大小
    size_before = os.path.getsize(fpath)
    
    # 运行优化
    cmd = f'python "{OPTIMIZE_PY}" "{fpath}"'
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"[ERROR] {html_file}: {result.stderr[:200]}")
        return False
    
    # 检查优化后大小
    size_after = os.path.getsize(fpath)
    reduction = (1 - size_after / size_before) * 100 if size_before > 0 else 0
    
    print(f"[{'OK' if reduction > 5 else '~'}] {html_file}: {size_before/1024:.1f} KB -> {size_after/1024:.1f} KB ({reduction:.1f}% ↓)")
    return True

print(f"[注意] 以下 {len(PROTECTED_FILES)} 个业务配置类文件已被排除：")
for f in sorted(PROTECTED_FILES):
    print(f"  - {f}")
print()

# 1. 优化主目录文件
print("\n[1/2] 优化主目录 HTML 文件...")
optimized = 0
for f in FILES:
    if optimize_file(f):
        optimized += 1

# 2. 优化 embedded/ 目录文件
print("\n[2/2] 优化 embedded/ 目录 HTML 文件...")
for f in EMBEDDED_FILES:
    if optimize_file(f):
        optimized += 1

print("\n" + "="*60)
print(f"优化完成！共处理 {optimized} 个文件")
print("="*60)

# 3. 列出所有生成的 inline_*.js 文件
print("\n生成的 inline_*.js 文件：")
js_files = glob.glob(os.path.join(BASE, 'inline_*.js'))
js_files.extend(glob.glob(os.path.join(BASE, 'embedded/inline_*.js')))
for js in sorted(js_files):
    size = os.path.getsize(js)
    print(f"  {os.path.relpath(js, BASE)}: {size/1024:.1f} KB")
