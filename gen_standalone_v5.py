# -*- coding: utf-8 -*-
"""
独立版HTML生成器 V5 — 精确替换方案（保留原始完整样式）

核心原则：
1. 100%保留原始index_v3.html的所有CSS、HTML结构、辅助函数
2. 只替换以下关键函数为内嵌数据版本：
   - loadReportJSON() → 直接返回内嵌数据
   - initDynamicData() → 同步初始化
   - updateMarketCards() → 使用内嵌市场数据
   - loadHistoryData() → 使用内嵌索引数据
   - 主IIFE初始化 → 去掉async等待
3. loading遮罩改为200ms后自动消失

用法: python gen_standalone_v5.py [日期]
"""

import json, os, re, sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = r"D:\trae\AI Daily report"
REPORTS_DIR = os.path.join(BASE_DIR, "reports")

def main():
    date_arg = sys.argv[1] if len(sys.argv) > 1 else None
    
    print("=== 独立版HTML生成器 V5（精确替换）===")
    
    # ===== 1. 确定日期并读取数据 =====
    if date_arg:
        target_date = date_arg
        json_path = os.path.join(REPORTS_DIR, f"{target_date}.json")
    else:
        # 自动找最新的报告JSON
        files = sorted([f for f in os.listdir(REPORTS_DIR) if re.match(r'2026-\d{2}-\d{2}\.json$', f)], reverse=True)
        if not files:
            print("[ERROR] reports目录下没有找到 YYYY-MM-DD.json 文件!")
            return
        target_date = files[0].replace('.json', '')
        json_path = os.path.join(REPORTS_DIR, files[0])
    
    print(f"[1/5] 报告数据: {target_date}.json")
    with open(json_path, "r", encoding="utf-8") as f:
        report_data = json.load(f)
    
    depts = report_data.get("departments", {})
    actual_date = report_data.get("date", target_date)
    print(f"       -> {len(depts)} 个事业部, 日期={actual_date}")
    
    # 读取市场数据
    market_lc = {}
    market_feishu = {}
    
    lc_path = os.path.join(REPORTS_DIR, "market_lc.json")
    if os.path.exists(lc_path):
        with open(lc_path, "r", encoding="utf-8") as f:
            market_lc = json.load(f)
        print(f"[2/5] 市场数据: market_lc.json ✓")
    
    fh_path = os.path.join(REPORTS_DIR, "market_feishu.json")
    if os.path.exists(fh_path):
        with open(fh_path, "r", encoding="utf-8") as f:
            market_feishu = json.load(f)
        print(f"       市场数据: market_feishu.json ✓")
    
    # 读取索引数据
    index_data = {}
    idx_path = os.path.join(REPORTS_DIR, "index.json")
    if os.path.exists(idx_path):
        with open(idx_path, "r", encoding="utf-8") as f:
            index_data = json.load(f)
        print(f"[3/5] 索引数据: index.json ({index_data.get('latest_date','?')})")
    
    # ===== 2. 读取原始HTML =====
    html_src = os.path.join(BASE_DIR, "index_v3.html")
    print(f"[4/5] 读取模板: index_v3.html ({os.path.getsize(html_src)//1024}KB)")
    with open(html_src, "r", encoding="utf-8") as f:
        html = f.read()
    
    # ===== 3. 执行精确替换 =====
    print("[5/5] 执行JS替换...")
    html = apply_replacements(html, report_data, market_lc, market_feishu, index_data, actual_date)
    
    # ===== 4. 写入输出 =====
    output_path = os.path.join(BASE_DIR, f"9BU早报_{actual_date}_独立版.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    
    size_kb = len(html.encode('utf-8')) / 1024
    print(f"\n{'='*50}")
    print(f"✅ 生成完成!")
    print(f"   文件: {output_path}")
    print(f"   大小: {size_kb:.0f} KB")
    print(f"   日期: {actual_date}")
    print(f"   事业部: {len(depts)}")


def apply_replacements(html, report_data, market_lc, market_feishu, index_data, actual_date):
    """对原始HTML进行精确的函数级替换"""
    
    # ---- 数据序列化 ----
    report_json = json.dumps(report_data, ensure_ascii=False)
    market_lc_json = json.dumps(market_lc, ensure_ascii=False)
    market_feishu_json = json.dumps(market_feishu, ensure_ascii=False)
    index_json = json.dumps(index_data, ensure_ascii=False)
    
    # === 替换1: loadReportJSON 函数 ===
    # 原始是 async function loadReportJSON(date) { fetch(...) }
    # 替换为直接返回内嵌数据的同步版本
    old_load_report = r'''async function loadReportJSON(date) {
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
        }'''
    
    new_load_report = f'''// [独立版] loadReportJSON - 直接返回内嵌数据
        function loadReportJSON(date) {{
            console.log(`[独立版-loadReport] 返回内嵌数据`);
            return window.__STANDALONE_REPORT_DATA__;
        }}'''
    
    html = html.replace(old_load_report, new_load_report)
    print("       ✓ 替换: loadReportJSON()")
    
    # === 替换2: initDynamicData 函数 ===
    # 原始是 async，会调用 loadReportJSON 和 fallback fetch(index.json)
    # 替换为同步版本：直接用内嵌数据构建 dynamicReportData
    old_init_dynamic = '''async function initDynamicData() {
            // 优先尝试今天
            const today = new Date().toISOString().slice(0, 10);
            const json = await loadReportJSON(today);
            if (json) {
                CURRENT_REPORT_DATE = json.date || today;
                dynamicReportData = buildDynamicReportData(json);
                // 更新 header-right 显示
                const headerRight = document.querySelector('.header-right');
                if (headerRight) {
                    const formatted = CURRENT_REPORT_DATE.replace(/^(\\d{4})-(\\d{2})-(\\d{2})$/, '$1 年 $2 月 $3 日');
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
                                const formatted = CURRENT_REPORT_DATE.replace(/^(\\d{4})-(\\d{2})-(\\d{2})$/, '$1 年 $2 月 $3 日');
                                headerRight.textContent = `📅 ${formatted}`;
                            }
                        }
                    }
                } catch (e) {
                    console.warn('[init] index.json 加载失败:', e.message);
                }
            }
        }'''
    
    new_init_dynamic = f'''// [独立版] initDynamicData - 同步使用内嵌数据
        function initDynamicData() {{
            console.log('[独立版-initDynamicData] 使用内嵌数据');
            const json = window.__STANDALONE_REPORT_DATA__;
            if (json) {{
                CURRENT_REPORT_DATE = json.date || '{actual_date}';
                dynamicReportData = buildDynamicReportData(json);
                // 更新 header-right 显示
                const headerRight = document.querySelector('.header-right');
                if (headerRight) {{
                    const formatted = CURRENT_REPORT_DATE.replace(/^(\\d{{4}})-(\\d{{2}})-(\\d{{2}})$/, '$1 年 $2 月 $3 日');
                    headerRight.textContent = '📅 ' + formatted;
                }}
            }}
        }}'''
    
    html = html.replace(old_init_dynamic, new_init_dynamic)
    print("       ✓ 替换: initDynamicData()")
    
    # === 替换3: updateMarketCards 函数（前半部分：fetch部分）===
    # 只替换fetch调用部分，保留DOM更新逻辑
    old_market_fetch = '''const [lcResp, feishuResp] = await Promise.allSettled([
                fetch(`reports/market_lc.json?_t=${Date.now()}`),
                fetch(`reports/market_feishu.json?_t=${Date.now()}`),
            ]);'''

    new_market_fetch = f'''// [独立版] 使用内嵌市场数据
            const lcResp = {{ status: 'fulfilled', value: {{ ok: true, json: async () => window.__STANDALONE_MARKET_LC__ }} }};
            const feishuResp = {{ status: 'fulfilled', value: {{ ok: true, json: async () => window.__STANDALONE_MARKET_FEISHU__ }} }};
            // 模拟 Promise.allSettled 结果格式'''

    html = html.replace(old_market_fetch, new_market_fetch)
    print("       ✓ 替换: updateMarketCards() fetch")
    
    # === 替换4: refreshMarketData 函数 ===
    old_refresh = '''async function refreshMarketData() {'''
    new_refresh = '''// [独立版] refreshMarketData - 已禁用（使用内嵌数据）
        async function refreshMarketData() {
            console.log('[独立版] refreshMarketData 已禁用');
            return;'''
    
    html = html.replace(old_refresh, new_refresh)
    print("       ✓ 替换: refreshMarketData()")
    
    # === 替换5: loadHistoryData 函数 ===
    old_history_fetch = '''const response = await fetch('reports/index.json');'''
    new_history_fetch = '// [独立版] 使用内嵌索引数据\n            const response = { ok: true, json: async () => window.__STANDALONE_INDEX_DATA__ };'
    
    html = html.replace(old_history_fetch, new_history_fetch)
    print("       ✓ 替换: loadHistoryData() fetch")
    
    # === 替换6: 主 IIFE 入口 ===
    # 将异步主入口改为同步
    old_iife = '''(async function() {'''
    new_iife = '''// [独立版] 主入口 - 改为同步执行
        (function() {'''
    
    html = html.replace(old_iife, new_iife)
    print("       ✓ 替换: 主入口 IIFE")
    
    # === 替换7: loading overlay 时间缩短 ===
    old_loading_delay = '''}, 800); // 模拟加载时间'''
    new_loading_delay = '}, 150); // [独立版] 缩短加载时间'
    
    html = html.replace(old_loading_delay, new_loading_delay)
    print("       ✓ 替换: loading延迟 800ms→150ms")
    
    # === 注入内嵌数据变量 ===
    # 在 </body> 前注入全局数据
    inject_script = f'''

    <!-- ========== 独立版内嵌数据 ========== -->
    <script>
    window.__STANDALONE_REPORT_DATA__ = {report_json};
    window.__STANDALONE_MARKET_LC__ = {market_lc_json};
    window.__STANDALONE_MARKET_FEISHU__ = {market_feishu_json};
    window.__STANDALONE_INDEX_DATA__ = {index_json};
    console.log('[独立版V5] 数据已注入:',
        Object.keys(window.__STANDALONE_REPORT_DATA__.departments || {{}}).length, '个事业部',
        '- 日期:', window.__STANDALONE_REPORT_DATA__.date);
    </script>
    <!-- ========== 独立版标识 ========== -->
    <div style="position:fixed;top:10px;right:10px;background:linear-gradient(135deg,#1F3864,#2E75B6);color:#fff;padding:5px 14px;border-radius:16px;font-size:11px;font-weight:bold;z-index:99999;box-shadow:0 2px 8px rgba(31,56,100,0.3);pointer-events:none;">💾 本地独立版</div>'''
    
    html = html.replace('</body>', inject_script + '\n</body>')
    print("       ✓ 注入: 内嵌数据变量")
    
    # 更新页面标题
    html = html.replace(
        '<title>晨会指挥中心 - 每日早报</title>',
        f'<title>9BU每日早报 - {actual_date}（本地独立版）</title>'
    )
    print("       ✓ 更新: 页面标题")
    
    return html


if __name__ == "__main__":
    main()
