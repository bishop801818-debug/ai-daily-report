# -*- coding: utf-8 -*-
"""
将 index_v3.html + reports/*.json 转换为独立可本地打开的HTML文件
用法: python gen_standalone_v3.py
"""

import json, os, re, datetime, sys

# 修复Windows控制台编码问题
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = r"D:\trae\AI Daily report"
HTML_SRC = os.path.join(BASE_DIR, "index_v3.html")
REPORTS_DIR = os.path.join(BASE_DIR, "reports")

# 输出文件名（带今天日期）
TODAY = datetime.date.today().strftime("%Y-%m-%d")
OUTPUT_FILE = os.path.join(BASE_DIR, f"9BU早报_{TODAY}_独立版.html")

def main():
    print(f"=== 生成独立版HTML ===")
    
    # 1. 读取HTML模板
    print(f"[1/5] 读取 index_v3.html ...")
    with open(HTML_SRC, "r", encoding="utf-8") as f:
        html = f.read()
    
    # 2. 读取最新报告JSON
    target_date = TODAY
    latest_json_path = os.path.join(REPORTS_DIR, f"{target_date}.json")
    if not os.path.exists(latest_json_path):
        # 回退到最新的可用JSON
        idx_path = os.path.join(REPORTS_DIR, "index.json")
        if os.path.exists(idx_path):
            with open(idx_path, "r", encoding="utf-8") as f:
                idx = json.load(f)
            latest_date = idx.get("latest_date", TODAY)
            latest_json_path = os.path.join(REPORTS_DIR, f"{latest_date}.json")
            target_date = latest_date
        else:
            # 列出所有JSON找最新的
            json_files = [f for f in os.listdir(REPORTS_DIR) 
                         if re.match(r"2026-\d{2}-\d{2}\.json$", f)]
            if json_files:
                json_files.sort(reverse=True)
                latest_json_path = os.path.join(REPORTS_DIR, json_files[0])
                target_date = json_files[0].replace(".json", "")
    
    print(f"[2/5] 读取报告数据: {os.path.basename(latest_json_path)}")
    with open(latest_json_path, "r", encoding="utf-8") as f:
        report_data = json.load(f)
    
    dept_count = len(report_data.get("departments", {}))
    print(f"       -> {dept_count} 个事业部数据已加载")
    
    # 3. 读取市场数据（可选）
    market_data = {}
    for mname in ["market_lc.json", "market_feishu.json"]:
        mp = os.path.join(REPORTS_DIR, mname)
        if os.path.exists(mp):
            with open(mp, "r", encoding="utf-8") as f:
                market_data[mname.replace(".json", "")] = json.load(f)
            print(f"[3/5] 市场数据: {mname} 已加载")
    if not market_data:
        print(f"[3/5] 市场数据文件不存在，跳过")
    
    # 4. 读取index.json（用于历史列表）
    index_data = None
    idx_p = os.path.join(REPORTS_DIR, "index.json")
    if os.path.exists(idx_p):
        with open(idx_p, "r", encoding="utf-8") as f:
            index_data = json.load(f)
        print(f"[4/5] index.json 已加载 ({len(index_data.get('available_dates', []))} 个历史日期)")
    
    # ====== 核心替换 ======
    print(f"[5/5] 执行HTML转换 ...")
    
    # --- 替换1: 在 </head> 前注入内嵌数据 ---
    embedded_js = """
<!-- 独立版内嵌数据（自动生成，请勿手动编辑） -->
<script>
window.__STANDALONE_MODE__ = true;
window.__EMBEDDED_DATA__ = """ + json.dumps(report_data, ensure_ascii=False) + """;
window.__EMBEDDED_MARKET__ = """ + json.dumps(market_data, ensure_ascii=False) + """;
window.__EMBEDDED_INDEX__ = """ + json.dumps(index_data or {}, ensure_ascii=False) + """;
console.log('[独立版] 内嵌数据加载完成:', Object.keys(window.__EMBEDDED_DATA__.departments || {}).length, '个事业部');
</script>
"""
    
    html = html.replace("</head>", embedded_js + "\n</head>")
    
    # --- 替换2: 替换 loadReportJSON 函数 ---
    old_load_report = """async function loadReportJSON(date) {
            console.log(`[loadReport] 开始加载 ${date}.json...`);
            try {
                const resp = await fetch(`reports/${date}.json?_t=${Date.now()}`);
                console.log(`[loadReport] HTTP状态: ${resp.status}`);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const data = await resp.json();
                console.log(`[loadReport] 成功加载 ${date}，${Object.keys(data.departments || {}).length} 个事业部`);
                return data;
            } catch (e) {
                console.error(`[loadReport] 加载 ${date} 失败:`, e.message);
                return null;
            }
        }"""
    
    new_load_report = """async function loadReportJSON(date) {
            // 独立版：直接返回内嵌数据
            if (window.__STANDALONE_MODE__) {
                console.log(`[独立版] 返回内嵌数据`);
                return window.__EMBEDDED_DATA__;
            }
            console.log(`[loadReport] 开始加载 ${date}.json...`);
            try {
                const resp = await fetch(`reports/${date}.json?_t=${Date.now()}`);
                console.log(`[loadReport] HTTP状态: ${resp.status}`);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const data = await resp.json();
                console.log(`[loadReport] 成功加载 ${date}，${Object.keys(data.departments || {}).length} 个事业部`);
                return data;
            } catch (e) {
                console.error(`[loadReport] 加载 ${date} 失败:`, e.message);
                return null;
            }
        }"""
    
    html = html.replace(old_load_report, new_load_report)
    
    # --- 替换3: 替换 initDynamicData ---
    old_init = """async function initDynamicData() {
            // 优先尝试今天
            const today = new Date().toISOString().slice(0, 10);
            const json = await loadReportJSON(today);
            if (json) {
                CURRENT_REPORT_DATE = json.date || today;
                dynamicReportData = buildDynamicReportData(json);
                // 更新 header-right 显示
                const headerRight = document.querySelector('.header-right');
                if (headerRight) {
                    const formatted = CURRENT_REPORT_DATE.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1 年 $2 月 $3 日');
                    headerRight.textContent = `📅 ${formatted}`;
                }
            } else {
                // fallback：尝试 reports/latest
                try {
                    const resp = await fetch('reports/index.json?_t=' + Date.now());
                    const idx = await resp.json();
                    if (idx.latest_date) {
                        const latestJson = await loadReportJSON(idx.latest_date);
                        if (latestJson) {
                            CURRENT_REPORT_DATE = latestJson.date || idx.latest_date;
                            dynamicReportData = buildDynamicReportData(latestJson);
                            const headerRight = document.querySelector('.header-right');
                            if (headerRight) {
                                const formatted = CURRENT_REPORT_DATE.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1 年 $2 月 $3 日');
                                headerRight.textContent = `📅 ${formatted}`;
                            }
                        }
                    }
                } catch (e) {
                    console.warn('[init] index.json 加载失败:', e.message);
                }
            }
        }"""
    
    new_init = """async function initDynamicData() {
            // 独立版：直接使用内嵌数据
            if (window.__STANDALONE_MODE__) {
                const data = window.__EMBEDDED_DATA__;
                CURRENT_REPORT_DATE = data.date || '""" + TODAY + """';
                dynamicReportData = buildDynamicReportData(data);
                const headerRight = document.querySelector('.header-right');
                if (headerRight) {
                    const formatted = CURRENT_REPORT_DATE.replace(/^(\d{4})-(\\d{2})-(\\d{2})$/, '$1 年 $2 月 $3 日');
                    headerRight.textContent = `📅 ${formatted}`;
                }
                console.log('[独立版] 数据初始化完成:', CURRENT_REPORT_DATE);
                return;
            }
            // 原始HTTP模式
            const today = new Date().toISOString().slice(0, 10);
            const json = await loadReportJSON(today);
            if (json) {
                CURRENT_REPORT_DATE = json.date || today;
                dynamicReportData = buildDynamicReportData(json);
                const headerRight = document.querySelector('.header-right');
                if (headerRight) {
                    const formatted = CURRENT_REPORT_DATE.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1 年 $2 月 $3 日');
                    headerRight.textContent = `📅 ${formatted}`;
                }
            } else {
                try {
                    const resp = await fetch('reports/index.json?_t=' + Date.now());
                    const idx = await resp.json();
                    if (idx.latest_date) {
                        const latestJson = await loadReportJSON(idx.latest_date);
                        if (latestJson) {
                            CURRENT_REPORT_DATE = latestJson.date || idx.latest_date;
                            dynamicReportData = buildDynamicReportData(latestJson);
                            const headerRight = document.querySelector('.header-right');
                            if (headerRight) {
                                const formatted = CURRENT_REPORT_DATE.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1 年 $2 月 $3 日');
                                headerRight.textContent = `📅 ${formatted}`;
                            }
                        }
                    }
                } catch (e) {
                    console.warn('[init] index.json 加载失败:', e.message);
                }
            }
        }"""
    
    html = html.replace(old_init, new_init)
    
    # --- 替换4: 替换市场数据 updateMarketCards ---
    old_market = """async function updateMarketCards() {
            const cards = document.querySelectorAll('.monitor-card');
            if (!cards.length) return;

            // 并行加载两路数据
            const [lcResp, feishuResp] = await Promise.allSettled([
                fetch(`reports/market_lc.json?_t=${Date.now()}`),
                fetch(`reports/market_feishu.json?_t=${Date.now()}`),
            ]);"""

    new_market = """async function updateMarketCards() {
            const cards = document.querySelectorAll('.monitor-card');
            if (!cards.length) return;

            // 独立版：使用内嵌市场数据
            let lcData, feishuData;
            if (window.__STANDALONE_MODE__ && window.__EMBEDDED_MARKET__) {
                lcData = window.__EMBEDDED_MARKET__.market_lc || null;
                feishuData = window.__EMBEDDED_MARKET__.market_feishu || null;
                console.log('[独立版] 使用内嵌市场数据');
            }

            // 并行加载两路数据（非独立版或内嵌数据不足时）
            const [lcResp, feishuResp] = await Promise.allSettled([
                lcData ? { status: 'fulfilled', value: { ok: () => true, json: async () => lcData } } : fetch('reports/market_lc.json?_t=' + Date.now()),
                feishuData ? { status: 'fulfilled', value: { ok: () => true, json: async () => feishuData } } : fetch('reports/market_feishu.json?_t=' + Date.now()),
            ]);"""

    if old_market in html:
        html = html.replace(old_market, new_market)
    else:
        print("       [警告] updateMarketCards 未找到精确匹配，尝试模糊替换...")
        html = html.replace(
            "fetch(`reports/market_lc.json",
            "/*[独立版已替换]*/(window.__STANDALONE_MODE__&&window.__EMBEDDED_MARKET__.market_lc)?{status:'fulfilled',value:{ok:()=>true,json:async()=>window.__EMBEDDED_MARKET__.market_lc}}:fetch(`reports/market_lc.json"
        )
        html = html.replace(
            "fetch(`reports/market_feishu.json",
            "(window.__STANDALONE_MODE__&&window.__EMBEDDED_MARKET__.market_feishu)?{status:'fulfilled',value:{ok:()=>true,json:async()=>window.__EMBEDDED_MARKET__.market_feishu}}:fetch(`reports/market_feishu.json"
        )
    
    # --- 替换5: 替换历史记录加载 ---
    old_history = """async function loadHistoryData() {
            try {
                const response = await fetch('reports/index.json');
                const indexData = await response.json();
                historyData = indexData;"""
    
    new_history = """async function loadHistoryData() {
            try {
                let indexData;
                if (window.__STANDALONE_MODE__ && window.__EMBEDDED_INDEX__) {
                    indexData = window.__EMBEDDED_INDEX__;
                    console.log('[独立版] 使用内嵌索引数据');
                } else {
                    const response = await fetch('reports/index.json');
                    indexData = await response.json();
                }
                historyData = indexData;"""

    if old_history in html:
        html = html.replace(old_history, new_history)
    
    # --- 替换6: 替换日期切换中的fetch ---
    # handleDateSelect / switchToReport 函数中的 fetch
    html = html.replace(
        "fetch(`reports/${date}`",
        "(window.__STANDALONE_MODE__)?Promise.resolve({ok:()=>true,json:async()=>window.__EMBEDDED_DATA__}):fetch(`reports/${date}"
    )
    
    # --- 替换7: 更新页面标题显示独立版标识 ---
    html = html.replace(
        "<title>晨会指挥中心 - 每日早报</title>",
        f"<title>9BU每日早报 - {TODAY}（独立版）</title>"
    )
    
    # --- 添加独立版水印提示 ---
    standalone_badge = """
<div id="standaloneBadge" style="
    position:fixed;top:12px;right:12px;
    background:linear-gradient(135deg,#1F3864,#2E75B6);
    color:#fff;padding:6px 16px;border-radius:20px;
    font-size:12px;font-weight:bold;z-index:99999;
    box-shadow:0 2px 10px rgba(31,56,100,0.3);
    pointer-events:none;
">💾 本地独立版 · 双击即可打开</div>
"""
    html = html.replace('<div class="container">', standalone_badge + '\n<div class="container">')
    
    # 5. 写入输出文件（使用实际数据日期命名）
    actual_date = report_data.get("date", target_date)
    output_path = os.path.join(BASE_DIR, f"9BU早报_{actual_date}_独立版.html")
    
    # 更新JS中的日期占位符为实际数据日期
    html = html.replace('""" + TODAY + """', f'"{actual_date}"')
    
    output_size = len(html.encode("utf-8"))
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    
    print(f"\n✅ 生成完成!")
    print(f"   文件: {output_path}")
    print(f"   大小: {output_size / 1024:.0f} KB")
    print(f"   事业部: {dept_count}")
    print(f"   数据日期: {report_data.get('date', TODAY)}")
    print(f"\n   使用方式: 直接双击文件即可打开")

if __name__ == "__main__":
    main()
