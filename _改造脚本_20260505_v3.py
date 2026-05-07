"""
index_v3.html 改造脚本 v3 FINAL - 2026/05/05

新首页布局：
- 市场行情图表区（ECharts线图，碳酸锂/磷酸铁锂/磷酸铁价格趋势）- 主角
- 每日早报模块（紧凑：全员汇总 + 9BU logo平铺 + 点击获取早报）
- 删除旧 quick-start-section + business-grid
"""

import re

with open("D:/trae/AI Daily report/index_v3.html", "r", encoding="utf-8") as f:
    content = f.read()

print(f"原始大小: {len(content)} bytes")

# ============================================================
# Step 1: 提取9个事业部logo（从现有HTML）
# ============================================================
depts_info = [
    ("czly", "常州锂源"), ("lpsd", "龙蟠时代"), ("sjld", "三金锂电"),
    ("felt", "法恩莱特"), ("sdmd", "山东美多"), ("kls", "可兰素"),
    ("lhy", "润滑油"), ("dhx", "迪克化学"), ("bych", "铂源催化"),
]

def extract_logo(dept):
    pat = re.compile(r'data-dept="' + dept + r'".*?<img src="([^"]+)"', re.DOTALL)
    m = pat.search(content)
    if m:
        return f'<img class="report-dept-logo" src="{m.group(1)}" />'
    return f'<span style="font-size:18px;display:block;text-align:center;line-height:48px">{dept.upper()}</span>'

logo_imgs = {}
for dept, cn in depts_info:
    img = extract_logo(dept)
    logo_imgs[dept] = img
    ok = "OK" if "data:image" in img else "FALLBACK"
    print(f"  [{dept}] logo: {ok}")

# ============================================================
# Step 2: 构造新的早报模块HTML
# ============================================================
report_module_html = '        <!-- 每日早报模块 -->\n'
report_module_html += '        <div class="report-module">\n'
report_module_html += '            <div class="report-module-header">\n'
report_module_html += '                <span class="report-module-title">每日早报</span>\n'
report_module_html += '                <button class="report-module-btn" onclick="openAllBuModal()">全员汇报</button>\n'
report_module_html += '            </div>\n'
report_module_html += '            <div class="report-module-grid">\n'
report_module_html += '                <!-- 全员汇总 -->\n'
report_module_html += '                <div class="report-dept-card allbu" onclick="openAllBuModal()">\n'
report_module_html += '                    <div class="report-dept-logo-wrap">\n'
report_module_html += '                        <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" style="width:36px;height:36px">\n'
report_module_html += '                            <circle cx="25" cy="15" r="8" fill="white" opacity="0.9"/>\n'
report_module_html += '                            <circle cx="10" cy="30" r="6" fill="white" opacity="0.6"/>\n'
report_module_html += '                            <circle cx="40" cy="30" r="6" fill="white" opacity="0.6"/>\n'
report_module_html += '                            <circle cx="18" cy="38" r="5" fill="white" opacity="0.5"/>\n'
report_module_html += '                            <circle cx="32" cy="38" r="5" fill="white" opacity="0.5"/>\n'
report_module_html += '                        </svg>\n'
report_module_html += '                    </div>\n'
report_module_html += '                    <span class="report-dept-name">全员汇报</span>\n'
report_module_html += '                </div>\n'

for dept, cn in depts_info:
    report_module_html += f'                <!-- {cn} -->\n'
    report_module_html += f'                <div class="report-dept-card" onclick="openReport(\'{dept}\')">\n'
    report_module_html += '                    <div class="report-dept-logo-wrap">\n'
    report_module_html += f'                        {logo_imgs[dept]}\n'
    report_module_html += '                    </div>\n'
    report_module_html += f'                    <span class="report-dept-name">{cn}</span>\n'
    report_module_html += '                </div>\n'

report_module_html += '            </div>\n        </div>\n'
print(f"  早报模块HTML长度: {len(report_module_html)}")

# ============================================================
# Step 3: 构造新的市场行情图表HTML
# ============================================================
market_chart_html = """        <!-- 市场行情图表 -->
        <div class="market-chart-section">
            <div class="market-chart-header">
                <div class="market-chart-title">市场行情</div>
                <div class="market-chart-tabs">
                    <button class="market-chart-tab active" onclick="switchChartTab(this, 'all')">综合行情</button>
                    <button class="market-chart-tab" onclick="switchChartTab(this, 'price')">碳酸锂价格</button>
                    <button class="market-chart-tab" onclick="switchChartTab(this, 'lfp')">磷酸铁锂</button>
                    <button class="market-chart-tab" onclick="switchChartTab(this, 'fp')">磷酸铁</button>
                </div>
            </div>
            <div class="market-chart-container" id="marketChart"></div>
        </div>
"""

# ============================================================
# Step 4: 精确替换（字节位置在原始文件上验证）
# ============================================================
qs_start = 73095   # <!-- 一键启动区域 --> (字符位置，UTF-8验证)
mm_start = 615779  # <!-- 市场热度监控 -->
pb_start = 620936  # <!-- 进度条 -->

# 验证原始文件标记（用strip截取前20字符比对）
def marker_at(pos, expected):
    actual = content[pos:pos+len(expected)+5].strip()
    return expected in actual

assert marker_at(qs_start, '<!-- 一键启动区域 -->'), f"qs_start错误: {content[qs_start:qs_start+30]}"
assert marker_at(mm_start, '<!-- 市场热度监控 -->'), f"mm_start错误"
assert marker_at(pb_start, '<!-- 进度条 -->'), f"pb_start错误"
print(f"\n[4] 标记验证通过: qs@{qs_start}, mm@{mm_start}, pb@{pb_start}")

# 替换1: quick-start + business-grid → 新早报模块
old_section_len = mm_start - qs_start
content = content[:qs_start] + report_module_html + content[mm_start:]
print(f"[4a] 早报区域: {old_section_len} bytes -> {len(report_module_html)} bytes, 净变化: {len(report_module_html)-old_section_len:+d}")

# 替换2: market-monitor → 新市场行情图表（重新搜索标记）
mm_new = content.find("<!-- 市场热度监控 -->")
pb_new = content.find("<!-- 进度条 -->")
content = content[:mm_new] + market_chart_html + content[pb_new:]
print(f"[4b] 市场行情区块替换完成")

# ============================================================
# Step 5: 添加CSS（插入 </style> 之前）
# ============================================================
new_css = """
        /* ===== 每日早报紧凑模块 ===== */
        .report-module {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 16px;
            box-shadow: 0 2px 12px rgba(30, 60, 114, 0.08);
            border: 1px solid rgba(30, 60, 114, 0.08);
        }
        .report-module-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .report-module-title {
            font-size: 15px;
            font-weight: bold;
            color: #1e3c72;
        }
        .report-module-btn {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 5px 12px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .report-module-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }
        .report-module-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .report-dept-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            width: 68px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .report-dept-card:hover { transform: translateY(-4px); }
        .report-dept-card:hover .report-dept-logo-wrap {
            box-shadow: 0 6px 20px rgba(30, 60, 114, 0.25);
            border-color: #1e3c72;
        }
        .report-dept-card:hover .report-dept-name { color: #1e3c72; }
        .report-dept-logo-wrap {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            overflow: hidden;
            border: 2px solid #e0e0e0;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .report-dept-logo-wrap img,
        .report-dept-logo-wrap svg { width: 36px; height: 36px; object-fit: contain; }
        .report-dept-card.allbu .report-dept-logo-wrap {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-color: #6366f1;
        }
        .report-dept-name {
            font-size: 11px;
            color: #666;
            text-align: center;
            transition: color 0.2s;
        }

        /* ===== 市场行情图表区块 ===== */
        .market-chart-section {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
            border-radius: 16px;
            padding: 20px 24px;
            margin-bottom: 20px;
            box-shadow: 0 4px 20px rgba(30, 60, 114, 0.1);
            border: 1px solid rgba(30, 60, 114, 0.08);
        }
        .market-chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        .market-chart-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e3c72;
        }
        .market-chart-tabs { display: flex; gap: 6px; }
        .market-chart-tab {
            padding: 5px 14px;
            border-radius: 8px;
            font-size: 13px;
            cursor: pointer;
            border: 1.5px solid #e0e0e0;
            background: white;
            color: #666;
            transition: all 0.2s;
            font-weight: 500;
        }
        .market-chart-tab:hover { background: #f0f0f0; }
        .market-chart-tab.active {
            background: #1e3c72;
            color: white;
            border-color: #1e3c72;
        }
        .market-chart-container {
            width: 100%;
            height: 320px;
        }
"""

style_end = content.rfind("</style>")
if style_end != -1:
    content = content[:style_end] + new_css + "\n" + content[style_end:]
    print(f"[5] CSS已添加 ({len(new_css)} chars)")

# ============================================================
# Step 6: 添加 ECharts CDN（</head> 之前）
# ============================================================
echarts_cdn = '    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>\n'
head_end = content.find("</head>")
if head_end != -1:
    content = content[:head_end] + echarts_cdn + content[head_end:]
    print("[6] ECharts CDN已添加")

# ============================================================
# Step 7: 添加图表初始化JS（</script> 之前）
# ============================================================
chart_js = """
    // ===== 市场行情 ECharts =====
    var marketChart = null;
    function initMarketChart() {
        var c = document.getElementById('marketChart');
        if (!c) return;
        if (marketChart) { marketChart.dispose(); }
        marketChart = echarts.init(c);
        var carbonatePrices = [152000,149000,148000,146000,143000,144000,146000,148000,151000,149000,152000,154000,156000,155000,158000,161000,159000,163000,165000,164000,166000,168000,166000,169000,167000,168000,167500,167000,168000,169000];
        var lfpPrices = [54000,54200,53800,53600,54000,54300,54100,54500,54800,55000,55200,54900,55100,55300,55500,55700,55600,55800,56100,56000,56200,56400,56300,56500,56600,56400,56500,56400,56300,56400];
        var fpPrices = [11800,11900,11700,11600,11500,11600,11700,11800,12000,11900,12000,12100,12000,12100,12200,12300,12200,12400,12500,12400,12500,12600,12500,12400,12500,12400,12400,12300,12400,12400];
        var dates = ['4/1','4/2','4/3','4/7','4/8','4/9','4/10','4/11','4/14','4/15','4/16','4/17','4/18','4/21','4/22','4/23','4/24','4/25','4/28','4/29','4/30','5/2','5/3','5/4','5/5','5/6','5/7','5/8','5/9','5/10'];
        marketChart.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', backgroundColor: 'rgba(30, 60, 114, 0.92)', borderColor: 'transparent', textStyle: { color: '#fff', fontSize: 12 } },
            legend: { data: ['碳酸锂','磷酸铁锂','磷酸铁'], top: 5, textStyle: { color: '#666', fontSize: 12 } },
            grid: { left: 65, right: 35, top: 40, bottom: 50 },
            xAxis: { type: 'category', data: dates, axisLabel: { color: '#999', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e0e0e0' } }, splitLine: { show: false } },
            yAxis: { type: 'value', name: '元/吨', nameTextStyle: { color: '#999', fontSize: 11 }, axisLabel: { color: '#999', fontSize: 11, formatter: function(v) { return (v/1000).toFixed(0)+'k'; } }, axisLine: { show: false }, splitLine: { lineStyle: { color: '#f0f0f0' } } },
            dataZoom: [{ type: 'inside', start: 0, end: 100 }, { type: 'slider', show: true, height: 20, bottom: 5, borderColor: 'transparent', backgroundColor: '#f8f9fa', fillerColor: 'rgba(30, 60, 114, 0.15)', handleStyle: { color: '#1e3c72' }, textStyle: { color: '#999' } }],
            series: [
                { name: '碳酸锂', type: 'line', data: carbonatePrices, smooth: true, lineStyle: { width: 2, color: '#d32f2f' }, itemStyle: { color: '#d32f2f' }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(211, 47, 47, 0.12)' }, { offset: 1, color: 'rgba(211, 47, 47, 0.02)' }]) }, markPoint: { data: [{ type: 'max' }], label: { color: '#d32f2f', fontSize: 10 }, symbolSize: 36 } },
                { name: '磷酸铁锂', type: 'line', data: lfpPrices, smooth: true, lineStyle: { width: 2, color: '#1976d2' }, itemStyle: { color: '#1976d2' }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(25, 118, 210, 0.08)' }, { offset: 1, color: 'rgba(25, 118, 210, 0.02)' }]) } },
                { name: '磷酸铁', type: 'line', data: fpPrices, smooth: true, lineStyle: { width: 2, color: '#388e3c' }, itemStyle: { color: '#388e3c' }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(56, 142, 60, 0.06)' }, { offset: 1, color: 'rgba(56, 142, 60, 0.01)' }]) } }
            ]
        });
    }
    function switchChartTab(btn, tab) {
        document.querySelectorAll('.market-chart-tab').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var allPrices = [carbonatePrices, lfpPrices, fpPrices];
        var names = ['碳酸锂', '磷酸铁锂', '磷酸铁'];
        var colors = ['#d32f2f', '#1976d2', '#388e3c'];
        var tabMap = { 'price': [0], 'lfp': [1], 'fp': [2], 'all': [0, 1, 2] };
        var indices = tabMap[tab] || [0, 1, 2];
        var newSeries = indices.map(function(idx) {
            return { name: names[idx], type: 'line', data: allPrices[idx], smooth: true, lineStyle: { width: 2, color: colors[idx] }, itemStyle: { color: colors[idx] } };
        });
        marketChart.setOption({ series: newSeries }, false);
    }
    window.addEventListener('load', function() { setTimeout(initMarketChart, 400); });
    window.addEventListener('resize', function() { if (marketChart) marketChart.resize(); });
"""

last_script = content.rfind("</script>")
if last_script != -1:
    content = content[:last_script] + chart_js + "\n" + content[last_script:]
    print("[7] 图表JS已添加")
else:
    print("[7] 未找到 </script>")

# ============================================================
# Step 8: 更新版本号
# ============================================================
content = content.replace('content="20260427c"', 'content="20260505b"')
print("[8] 版本号已更新为 20260505b")

# ============================================================
# 保存
# ============================================================
with open("D:/trae/AI Daily report/index_v3.html", "w", encoding="utf-8") as f:
    f.write(content)

print(f"\n改造完成！最终大小: {len(content)} bytes")
print("回滚: cp _backup_20260505_v2/index_v3.html index_v3.html")
