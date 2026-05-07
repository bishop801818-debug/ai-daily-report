#!/usr/bin/env python3
"""
生成自包含的独立9BU早报HTML文件
"""

import json

def build_standalone_html(html_path, json_path, output_path):
    print(f"[*] 读取模板: {html_path}")
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    print(f"[*] 读取数据: {json_path}")
    with open(json_path, 'r', encoding='utf-8') as f:
        report_data = json.load(f)
    
    date_str = report_data.get('date', '2026-04-14')
    departments = report_data.get('departments', {})
    
    # 内嵌JSON数据
    embedded_json = json.dumps(report_data, ensure_ascii=False)
    
    # ===== 1. 注入内嵌数据 =====
    inject_script = '<script>\n    window.__EMBEDDED_REPORT_DATA__ = ' + embedded_json + ';\n    </script>'
    html = html.replace('<script>', inject_script + '\n<script>', 1)
    
    # ===== 2. 替换 loadReportJSON - 返回内嵌数据 =====
    old = 'async function loadReportJSON(date) {\n            console.log(`[loadReport] 开始加载 ${date}.json...`);\n            try {\n                const resp = await fetch(`reports/${date}.json?_t=${Date.now()}`);'
    new = 'async function loadReportJSON(date) {\n            console.log("[loadReport] 自包含模式");\n            try {\n                const data = window.__EMBEDDED_REPORT_DATA__;\n                if (data) return data;\n                throw new Error("No embedded data");'
    html = html.replace(old, new, 1)
    
    old2 = 'const data = await resp.json();\n                    console.log(`[loadReport] 成功加载 ${date}，${Object.keys(data.departments || {}).length} 个事业部`);'
    new2 = '// const data = await resp.json(); // 已替换为内嵌数据\n                    console.log(`[loadReport] 内嵌 ${Object.keys(data.departments || {}).length} 个事业部`);'
    html = html.replace(old2, new2, 1)
    
    # ===== 3. 替换 initDynamicData =====
    old3 = 'async function initDynamicData() {\n            // 优先尝试今天\n            const today = new Date().toISOString().slice(0, 10);\n            const json = await loadReportJSON(today);'
    new3 = 'async function initDynamicData() {\n            // [自包含模式]\n            const today = "' + date_str + '";\n            const json = await loadReportJSON(today);'
    html = html.replace(old3, new3, 1)
    
    # ===== 4. 禁用市场监控远程获取 =====
    old4 = '''async function updateMarketCards() {
            const cards = document.querySelectorAll('.monitor-card');
            if (!cards.length) return;

            // 并行加载两路数据
            const [lcResp, feishuResp] = await Promise.allSettled([
                fetch(`reports/market_lc.json?_t=${Date.now()}`),
                fetch(`reports/market_feishu.json?_t=${Date.now()}`),'''
    new4 = 'async function updateMarketCards() {\n            // [自包含模式跳过]\n            console.log("[market] 跳过");\n            return;'
    html = html.replace(old4, new4, 1)
    
    # ===== 5. 替换 viewReport =====
    old5 = "function viewReport(date) {\n            fetch(`reports/${date}.json`)"
    new5 = "function viewReport(date) {\n            // [自包含模式]\n            (async () => {"
    html = html.replace(old5, new5, 1)
    
    old6 = '''.then(response => response.json())
                .then(data => {
                    const deptData = data.departments[currentDept];'''
    new6 = 'const data = window.__EMBEDDED_REPORT_DATA__;\n                    if(!data) return;\n                    const deptData = data.departments[currentDept];'
    html = html.replace(old6, new6, 1)
    
    old7 = '''}).catch(error => {
                console.error('加载早报失败:', error);
                alert('加载早报失败，请稍后重试');
            });'''
    new7 = '\n                })();'
    html = html.replace(old7, new7, 1)
    
    # ===== 6. 替换 renderCategoryView =====
    # 用行号定位更可靠
    lines = html.split('\n')
    for i, line in enumerate(lines):
        if 'function renderCategoryView()' in line:
            # 找到下一行的 fetch
            for j in range(i+1, min(i+5, len(lines))):
                if 'fetch' in lines[j] and 'currentDate' in lines[j]:
                    lines[j] = "            // [自包含模式] 已禁用"
                    # 找 .then 和 .catch 也替换掉
                    for k in range(j+1, min(j+20, len(lines))):
                        if '.then' in lines[k] or '.catch' in lines[k]:
                            lines[k] = ''
                        if lines[k].strip() == '});':
                            lines[k] = '});'
                            break
                    break
            break
    html = '\n'.join(lines)
    
    # ===== 7. 替换页面标题 =====
    html = html.replace(
        '<title>晨会指挥中心 - 每日早报</title>',
        '<title>9BU每日早报 - ' + date_str + '</title>'
    )
    
    # ===== 8. 添加底部说明 =====
    footer = '<div style="text-align:center;padding:20px;color:#999;font-size:12px;border-top:1px solid #eee;margin-top:20px;">\n    9BU每日早报 | 数据来源：公开信息搜索整理 | 双击即可打开\n</div>'
    html = html.replace('</body>', footer + '\n</body>')
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    size_kb = len(html.encode('utf-8')) / 1024
    print(f"[+] 输出: {output_path} ({size_kb:.0f} KB)")
    print(f"[+] 包含 {len(departments)} 个事业部")


if __name__ == '__main__':
    build_standalone_html(
        r'D:\trae\AI Daily report\index_v3.html',
        r'D:\trae\AI Daily report\reports\2026-04-14.json',
        r'D:\trae\AI Daily report\9BU早报_2026-04-14_独立版.html'
    )
