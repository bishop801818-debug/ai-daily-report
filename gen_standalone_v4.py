# -*- coding: utf-8 -*-
"""
独立版HTML生成器 V4 — 彻底重写方案

核心设计原则：
1. 不依赖原始index_v3.html的复杂JS框架
2. 数据直接内嵌为全局变量，页面打开即渲染
3. 去掉loading遮罩，改为"数据就绪"提示
4. 简化JS逻辑，减少出错概率

用法: python gen_standalone_v4.py
"""

import json, os, re, datetime, sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = r"D:\trae\AI Daily report"
REPORTS_DIR = os.path.join(BASE_DIR, "reports")
TODAY = datetime.date.today().strftime("%Y-%m-%d")

def main():
    print("=== 独立版HTML生成器 V4 ===")
    
    # 1. 读取数据
    json_path = os.path.join(REPORTS_DIR, f"{TODAY}.json")
    if not os.path.exists(json_path):
        # 回退找最新JSON
        files = [f for f in os.listdir(REPORTS_DIR) if re.match(r'2026-\d{2}-\d{2}\.json$', f)]
        files.sort(reverse=True)
        if files:
            json_path = os.path.join(REPORTS_DIR, files[0])
            TODAY_alt = files[0].replace('.json', '')
        else:
            print("[ERROR] 找不到报告JSON文件!")
            return
    else:
        TODAY_alt = TODAY
    
    print(f"[1/4] 读取报告: {os.path.basename(json_path)}")
    with open(json_path, "r", encoding="utf-8") as f:
        report_data = json.load(f)
    
    # 读取市场数据
    market_data = {}
    for mname in ["market_lc.json", "market_feishu.json"]:
        mp = os.path.join(REPORTS_DIR, mname)
        if os.path.exists(mp):
            with open(mp, "r", encoding="utf-8") as f:
                market_data[mname.replace('.json', '')] = json.load(f)
    
    depts = report_data.get("departments", {})
    print(f"       -> {len(depts)} 个事业部已加载")
    
    # 2. 读取原始HTML模板（只取CSS样式部分）
    html_src_path = os.path.join(BASE_DIR, "index_v3.html")
    with open(html_src_path, "r", encoding="utf-8") as f:
        original_html = f.read()
    
    # 提取 <style> 内容
    style_match = re.search(r'<style>(.*?)</style>', original_html, re.DOTALL)
    css_content = style_match.group(1) if style_match else ""
    
    # 3. 构建全新的独立版HTML
    actual_date = report_data.get("date", TODAY_alt)
    html = build_standalone_html(css_content, report_data, market_data, actual_date)
    
    # 4. 写入文件
    output_path = os.path.join(BASE_DIR, f"9BU早报_{actual_date}_独立版.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)
    
    size_kb = len(html.encode('utf-8')) / 1024
    print(f"\n✅ 生成完成!")
    print(f"   文件: {output_path}")
    print(f"   大小: {size_kb:.0f} KB")
    print(f"   日期: {actual_date}")
    print(f"   事业部: {len(depts)}")

def build_standalone_html(css, report_data, market_data, date_str):
    """构建完全独立的HTML，不依赖任何外部资源"""
    
    # 将数据转为JSON字符串（安全转义）
    data_json = json.dumps(report_data, ensure_ascii=False)
    market_json = json.dumps(market_data, ensure_ascii=False)
    
    # 获取所有事业部代码和名称
    depts = report_data.get("departments", {})
    dept_list = list(depts.items())
    
    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>9BU每日早报 - {date_str}（独立版）</title>
    <style>
{css}
        
        /* 独立版特有样式 */
        #standaloneBadge {{
            position: fixed;
            top: 12px;
            right: 12px;
            background: linear-gradient(135deg, #1F3864, #2E75B6);
            color: #fff;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: 99999;
            box-shadow: 0 2px 10px rgba(31,56,100,0.3);
            pointer-events: none;
        }}
        
        /* 去掉loading遮罩的fixed定位，改为内联状态栏 */
        .standalone-status {{
            text-align: center;
            padding: 8px;
            color: #1F3864;
            font-size: 13px;
            font-weight: bold;
            background: rgba(31,56,100,0.06);
            border-radius: 8px;
            margin-bottom: 12px;
        }}
        
        .standalone-status.ready {{
            color: #2E7D32;
            background: rgba(46,125,50,0.08);
        }}
    </style>
</head>
<body>
    <div id="standaloneBadge">💾 本地独立版 · 双击即可打开</div>

<div class="container">
    <!-- 顶部 -->
    <div class="header">
        <div class="header-left">
            <div class="logo" title="9BU每日早报">
                <span class="logo-icon">⚡</span>
                <span class="logo-text">9BU每日早报</span>
            </div>
        </div>
        <div class="header-right">
            <div class="header-date" id="currentDate"></div>
            <div class="header-time">
                <span>📅</span>
                <span id="reportDate">{date_str}</span>
            </div>
        </div>
    </div>
    
    <!-- 状态栏 -->
    <div class="standalone-status" id="statusBar">⏳ 正在初始化...</div>
    
    <!-- 主导航 -->
    <div class="main-nav-menu">
        <div class="main-nav-item active"><span>🏠 首页</span></div>
        <div class="main-nav-item"><span>📊 市场行情</span></div>
        <div class="main-nav-item"><span>📜 政策中心</span></div>
        <div class="main-nav-item"><span>📰 行业新闻</span></div>
        <div class="main-nav-item"><span>💹 历史数据</span></div>
        <div class="main-nav-item"><span>🗄️ 数据库</span></div>
        <div class="main-nav-item"><span>📰 行业新闻</span></div>
    </div>
    
    <!-- 事业部卡片区域 -->
    <div id="deptCards" class="dept-cards-grid">
        <!-- JS动态渲染 -->
    </div>
    
    <!-- 市场监控区域 -->
    <div id="marketSection" class="section">
        <h2 class="section-title">📊 市场行情监控</h2>
        <div id="marketCards" class="monitor-cards-row">
            <!-- JS动态渲染 -->
        </div>
    </div>
</div>

<!-- ========== 内嵌数据 ========== -->
<script>
// ====== 数据定义 ======
window.REPORT_DATA = {data_json};
window.MARKET_DATA = {market_json};
window.REPORT_DATE = "{date_str}";

// ====== 工具函数：安全获取嵌套属性 ======
function safeGet(obj, path, defaultValue) {{
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {{
        if (current === null || current === undefined) return defaultValue;
        current = current[key];
    }}
    return current !== undefined ? current : defaultValue;
}}

function escapeHtml(text) {{
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}}

// ====== 渲染事业部卡片 ======
function renderDeptCard(code, dept) {{
    const name = dept.name || code;
    const subtitle = dept.subtitle || '';
    const headline = dept.headline || {{ title: '', summary: '' }};
    const modules = dept.modules || {{}};
    
    // 计算各模块内容长度
    let totalContent = 0;
    Object.values(modules).forEach(m => {{
        if (m && m.items) totalContent += m.items.length;
        if (m && m.content) totalContent += 1;
    }});
    
    // 构建模块详情HTML
    let modulesHtml = '';
    const moduleNames = {{
        'headline': '📌 头条',
        'company': '🏢 公司动态',
        'industry': '📊 行业数据',
        'policy': '📜 政策风向',
        'tech': '🔬 技术前沿',
        'overseas': '🌍 海外市场',
        'summary': '📝 小结'
    }};
    
    for (const [key, mod] of Object.entries(modules)) {{
        const label = moduleNames[key] || key;
        if (!mod) continue;
        
        if (key === 'headline') {{
            const hTitle = mod.title || '';
            const hSummary = mod.summary || '';
            if (hTitle || hSummary) {{
                modulesHtml += `<div class="module-block">
                    <h4>{{label}}</h4>
                    <div class="module-content">
                        {{hTitle ? '<strong>' + escapeHtml(hTitle) + '</strong><br>' : ''}}
                        <p>{{escapeHtml(hSummary)}}</p>
                    </div>
                </div>`;
            }}
        }} else if (mod.items && mod.items.length > 0) {{
            modulesHtml += `<div class="module-block"><h4>{{label}}</h4>`;
            mod.items.forEach(item => {{
                const title = item.title || '';
                const content = item.summary || item.content || '';
                const source = item.source || '';
                modulesHtml += `<div class="news-item">
                    {{title ? '<strong>' + escapeHtml(title) + '</strong><br>' : ''}}
                    <p>{{escapeHtml(content)}}</p>
                    {{source ? '<span class="source-tag">' + escapeHtml(source) + '</span>' : ''}}
                </div>`;
            }});
            modulesHtml += `</div>`;
        }} else if (mod.content) {{
            modulesHtml += `<div class="module-block">
                <h4>{{label}}</h4>
                <div class="module-content"><p>{{escapeHtml(mod.content)}}</p></div>
            </div>`;
        }}
    }}
    
    const cardId = 'card_' + code;
    return `
    <div class="dept-card" id="${{cardId}}" onclick="toggleDept('${{cardId}}')">
        <div class="dept-header">
            <div class="dept-name">${{escapeHtml(name)}}</div>
            <div class="dept-subtitle">${{escapeHtml(subtitle)}}</div>
        </div>
        <div class="dept-summary">
            ${{headline.title ? '<strong>' + escapeHtml(headline.title) + '</strong>' : '暂无头条'}}
        </div>
        <div class="dept-stats">
            <span class="stat-badge">📊 ${{totalContent}} 条信息</span>
        </div>
        <div class="expand-hint">点击展开详情 ▼</div>
        <div class="dept-detail" id="${{cardId}}_detail">
            ${{modulesHtml || '<p style="padding:20px;text-align:center;color:#999;">暂无详细数据</p>'}}
        </div>
    </div>`;
}}

// ====== 切换展开/收起 ======
function toggleDept(cardId) {{
    const detail = document.getElementById(cardId + '_detail');
    if (detail) {{
        const isVisible = detail.style.display === 'block';
        detail.style.display = isVisible ? 'none' : 'block';
        const hint = document.querySelector('#' + cardId + ' .expand-hint');
        if (hint) {{
            hint.textContent = isVisible ? '点击展开详情 ▼' : '收起详情 ▲';
        }}
    }}
}}

// ====== 渲染市场卡片 ======
function renderMarketCards() {{
    const container = document.getElementById('marketCards');
    if (!container) return;
    
    const market = window.MARKET_DATA;
    if (!market || Object.keys(market).length === 0) {{
        container.innerHTML = '<p style="color:#999;padding:20px;text-align:center;">暂无市场数据</p>';
        return;
    }}
    
    let html = '';
    
    // 碳酸锂期货
    if (market.market_lc && market.market_lc.data) {{
        const lc = market.market_lc.data;
        const price = lc.price || lc.latest_price || '--';
        const change = lc.change || lc.change_pct || '--';
        const changeClass = String(change).includes('-') ? 'price-down' : 'price-up';
        html += `<div class="monitor-card">
            <div class="monitor-title">🔋 碳酸锂期货</div>
            <div class="monitor-price">{{price}} 元/吨</div>
            <div class="monitor-change {{changeClass}}">{{change}}</div>
            <div class="monitor-time">{{lc.update_time || lc.date || ''}}</div>
        </div>`;
    }}
    
    // LFP现货 / 飞书数据
    if (market.market_feishu && market.market_feishu.data) {{
        const feishu = market.market_feishu.data;
        const price = feishu.price || feishu.avg_price || '--';
        const change = feishu.change || '--';
        const changeClass = String(change).includes('-') ? 'price-down' : 'price-up';
        html += `<div class="monitor-card">
            <div class="monitor-title">⚡ 磷酸铁锂现货</div>
            <div class="monitor-price">{{price}} 元/吨</div>
            <div class="monitor-change {{changeClass}}">{{change}}</div>
            <div class="monitor-time">{{feishu.update_time || ''}}</div>
        </div>`;
    }}
    
    container.innerHTML = html || '<p style="color:#999;padding:20px;">暂无市场数据</p>';
}}

// ====== 主初始化函数（同步执行，不依赖fetch）=====
function initPage() {{
    try {{
        console.log('[独立版V4] 开始渲染...');
        const data = window.REPORT_DATA;
        const depts = data.departments || {{}};
        
        // 1. 渲染事业部卡片
        const container = document.getElementById('deptCards');
        if (container) {{
            let cardsHtml = '';
            for (const [code, dept] of Object.entries(deps)) {{
                cardsHtml += renderDeptCard(code, dept);
            }}
            container.innerHTML = cardsHtml;
            console.log('[独立版V4] 已渲染', Object.keys(depts).length, '个事业部卡片');
        }}
        
        // 2. 渲染市场数据
        renderMarketCards();
        
        // 3. 更新状态栏
        const statusBar = document.getElementById('statusBar');
        if (statusBar) {{
            const count = Object.keys(depts).length;
            statusBar.className = 'standalone-status ready';
            statusBar.innerHTML = '✅ 数据加载完成 · ' + count + ' 个事业部 · ' + window.REPORT_DATE;
        }}
        
        // 4. 设置当前日期显示
        const dateEl = document.getElementById('currentDate');
        if (dateEl) {{
            const d = new Date();
            const days = ['日','一','二','三','四','五','六'];
            dateEl.textContent = d.getFullYear() + ' 年 ' + (d.getMonth()+1) + ' 月 ' + d.getDate() + ' 日 星期' + days[d.getDay()];
        }}
        
        console.log('[独立版V4] 全部渲染完成!');
        
    }} catch(e) {{
        console.error('[独立版V4] 渲染错误:', e.message, e.stack);
        const statusBar = document.getElementById('statusBar');
        if (statusBar) {{
            statusBar.className = 'standalone-status';
            statusBar.style.color = '#c00';
            statusBar.style.background = 'rgba(200,0,0,0.08)';
            statusBar.textContent = '❌ 加载失败: ' + e.message;
        }}
    }}
}}

// ====== 页面加载后立即执行 ======
document.addEventListener('DOMContentLoaded', initPage);
</script>
</body>
</html>'''

    return html


if __name__ == "__main__":
    main()
