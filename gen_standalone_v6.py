# -*- coding: utf-8 -*-
"""
独立版HTML生成器 V6 — 彻底解决loading问题
"""

import json, os, re, sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = r"D:\trae\AI Daily report"
REPORTS_DIR = os.path.join(BASE_DIR, "reports")

def main():
    date_arg = sys.argv[1] if len(sys.argv) > 1 else None
    
    print("=== 独立版HTML生成器 V6 ===")
    
    # 1. 确定日期和读取数据
    if date_arg:
        target_date = date_arg
        json_path = os.path.join(REPORTS_DIR, f"{target_date}.json")
    else:
        files = sorted([f for f in os.listdir(REPORTS_DIR) if re.match(r'2026-\d{2}-\d{2}\.json$', f)], reverse=True)
        if not files:
            print("[ERROR] 找不到报告JSON!")
            return
        target_date = files[0].replace('.json', '')
        json_path = os.path.join(REPORTS_DIR, files[0])
    
    print(f"[1/5] 报告: {target_date}")
    with open(json_path, "r", encoding="utf-8") as f:
        report_data = json.load(f)
    
    actual_date = report_data.get("date", target_date)
    depts = report_data.get("departments", {})
    print(f"       -> {len(depts)} 个事业部")
    
    # 读取市场数据
    market_data = {}
    for fname in ["market_lc.json", "market_feishu.json"]:
        fpath = os.path.join(REPORTS_DIR, fname)
        if os.path.exists(fpath):
            with open(fpath, "r", encoding="utf-8") as f:
                market_data[fname.replace('.json', '')] = json.load(f)
    print(f"[2/5] 市场数据: {list(market_data.keys())}")
    
    # 读取索引
    index_data = {}
    idx_path = os.path.join(REPORTS_DIR, "index.json")
    if os.path.exists(idx_path):
        with open(idx_path, "r", encoding="utf-8") as f:
            index_data = json.load(f)
    
    # 2. 读取原始HTML
    html_src = os.path.join(BASE_DIR, "index_v3.html")
    print(f"[3/5] 模板: {os.path.getsize(html_src)//1024}KB")
    with open(html_src, "r", encoding="utf-8") as f:
        html = f.read()
    
    # 3. 关键修复：先移除async，然后替换fetch函数
    html = html.replace('async function loadReportJSON', 'function loadReportJSON')
    html = html.replace('async function initDynamicData', 'function initDynamicData')
    html = html.replace('async function updateMarketCards', 'function updateMarketCards')
    html = html.replace('(async function() {', '(function() {')
    
    # 替换loadReportJSON函数
    old_load = 'async function loadReportJSON(date) {'
    new_load = 'function loadReportJSON(date) {'
    html = html.replace(old_load, new_load)
    
    # 替换fetch调用 - 市场数据
    html = html.replace(
        'fetch(`reports/market_lc.json?_t=${Date.now()}`)',
        'Promise.resolve({ ok: true, json: async () => window.__MARKET_LC__ })'
    )
    html = html.replace(
        'fetch(`reports/market_feishu.json?_t=${Date.now()}`)',
        'Promise.resolve({ ok: true, json: async () => window.__MARKET_FEISHU__ })'
    )
    
    # 替换索引fetch
    html = html.replace(
        "fetch('reports/index.json')",
        "Promise.resolve({ ok: true, json: async () => window.__INDEX_DATA__ })"
    )
    
    # 替换loading时间
    html = html.replace('}, 800); // 模拟加载时间', '}, 200);')
    
    # 4. 在<head>末尾（</style>之后）注入数据变量
    report_json = json.dumps(report_data, ensure_ascii=False)
    market_lc_json = json.dumps(market_data.get('market_lc', {}), ensure_ascii=False)
    market_feishu_json = json.dumps(market_data.get('market_feishu', {}), ensure_ascii=False)
    index_json = json.dumps(index_data, ensure_ascii=False)
    
    inject_code = '''</style>
    <script>
    window.__REPORT_DATA__ = ''' + report_json + ''';
    window.__MARKET_LC__ = ''' + market_lc_json + ''';
    window.__MARKET_FEISHU__ = ''' + market_feishu_json + ''';
    window.__INDEX_DATA__ = ''' + index_json + ''';
    </script>'''
    html = html.replace('</style>', inject_code)
    print("[4/5] 数据注入到<head>末尾")
    
    # 5. 在<body>末尾添加独立版标识
    html = html.replace('</body>', '''
    <div style="position:fixed;top:12px;right:12px;background:linear-gradient(135deg,#1F3864,#2E75B6);color:#fff;padding:6px 14px;border-radius:16px;font-size:11px;font-weight:bold;z-index:99999;">💾 本地独立版</div>
</body>''')
    print("[5/5] 添加独立版标识")
    
    # 6. 写入输出
    output_path = os.path.join(BASE_DIR, f"9BU早报_{actual_date}_独立版.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    
    size_kb = len(html.encode('utf-8')) / 1024
    print(f"\n=== V6完成 ===")
    print(f"文件: {output_path}")
    print(f"大小: {size_kb:.0f} KB")


if __name__ == "__main__":
    main()