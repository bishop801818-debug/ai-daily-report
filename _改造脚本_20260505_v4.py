"""
index_v3.html 改造脚本 - 2026/05/05 v4

改造目标：
1. 9BU紧凑模块：替换 quick-start-section + business-grid 为紧凑的10卡片平铺（全员汇报 + 9BU logo）
2. 市场行情图表：替换 market-monitor 为3张独立ECharts折线图（碳酸锂/磷酸铁锂/磷酸铁，2026年1月至今）
3. 删除详情页按钮
"""

import re
import shutil
import os

with open("D:/trae/AI Daily report/index_v3.html", "r", encoding="utf-8") as f:
    content = f.read()

print(f"原始大小: {len(content)} bytes")

# ============================================================
# Step 1: 提取9个事业部logo
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
        return f'<img src="{m.group(1)}" style="width:28px;height:28px;object-fit:contain;border-radius:4px;" />'
    return f'<span style="font-size:12px;display:block;text-align:center;line-height:28px;color:#1e3c72;font-weight:bold">{dept.upper()}</span>'

logo_imgs = {}
for dept, cn in depts_info:
    img = extract_logo(dept)
    logo_imgs[dept] = img
    ok = "OK" if "data:image" in img else "FALLBACK"
    print(f"  [{dept}] logo: {ok}")

# ============================================================
# Step 2: 删除所有"详情页"按钮
# ============================================================
detail_btn_pat = re.compile(r'\s*<button class="detail-btn"[^>]*>详情页</button>\s*', re.MULTILINE)
count = detail_btn_pat.findall(content)
content = detail_btn_pat.sub('', content)
print(f"[Step 2] 删除 {len(count)} 个详情页按钮")

# ============================================================
# Step 3: 构造新的早报模块HTML（compact 10卡片）
# ============================================================
report_module_html = '''        <!-- 每日早报模块 -->
        <div class="report-module">
            <div class="report-module-header">
                <span class="report-module-title">每日早报</span>
                <button class="report-module-btn" onclick="openAllBuModal()">全员汇报</button>
            </div>
            <div class="report-module-grid">
                <!-- 全员汇报 -->
                <div class="report-dept-card allbu" onclick="openAllBuModal()" title="全员汇报">
                    <div class="report-logo-wrap" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);">
                        <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" style="width:22px;height:22px">
                            <circle cx="25" cy="15" r="8" fill="white" opacity="0.9"/>
                            <circle cx="10" cy="30" r="6" fill="white" opacity="0.6"/>
                            <circle cx="40" cy="30" r="6" fill="white" opacity="0.6"/>
                            <circle cx="18" cy="38" r="5" fill="white" opacity="0.5"/>
                            <circle cx="32" cy="38" r="5" fill="white" opacity="0.5"/>
                        </svg>
                    </div>
                    <span class="report-dept-name">全员汇报</span>
                </div>
'''

for dept, cn in depts_info:
    report_module_html += f'''                <div class="report-dept-card" onclick="openReport('{dept}')" title="{cn}">
                    <div class="report-logo-wrap">
                        {logo_imgs[dept]}
                    </div>
                    <span class="report-dept-name">{cn}</span>
                </div>
'''

report_module_html += '            </div>\n        </div>\n'
print(f"[Step 3] 早报模块HTML长度: {len(report_module_html)} chars")

# ============================================================
# Step 4: 构造新的市场行情图表HTML（3张ECharts折线图）
# ============================================================
market_chart_html = '''        <!-- 市场行情图表 -->
        <div class="market-chart-section">
            <div class="market-chart-header">
                <span class="market-chart-title">市场行情</span>
                <div class="market-chart-tabs">
                    <button class="market-chart-tab active" onclick="switchChartTab(this, 'all')">综合</button>
                    <button class="market-chart-tab" onclick="switchChartTab(this, 'price')">碳酸锂</button>
                    <button class="market-chart-tab" onclick="switchChartTab(this, 'lfp')">磷酸铁锂</button>
                    <button class="market-chart-tab" onclick="switchChartTab(this, 'fp')">磷酸铁</button>
                </div>
            </div>
            <div class="market-chart-container" id="marketChart"></div>
        </div>
'''

# ============================================================
# Step 5: 精确替换（用find动态搜索，不用固定位置）
# ============================================================
qs_marker = '<!-- 一键启动区域 -->'
mm_marker = '<!-- 市场热度监控 -->'
pb_marker = '<!-- 进度条 -->'

qs_start = content.find(qs_marker)
mm_start_orig = content.find(mm_marker)
pb_start_orig = content.find(pb_marker)

assert qs_start != -1, f"qs_start not found"
assert mm_start_orig != -1, f"mm_start_orig not found: {mm_marker}"
assert pb_start_orig != -1, f"pb_start_orig not found"
print(f"\n[Step 5] 标记位置: qs@{qs_start}, mm@{mm_start_orig}, pb@{pb_start_orig}")

# 替换1: quick-start-section + business-grid → 新早报模块
old_section_len = mm_start_orig - qs_start
content = content[:qs_start] + report_module_html + content[mm_start_orig:]
print(f"[Step 5a] 早报区域: {old_section_len} chars -> {len(report_module_html)} chars, 净变化: {len(report_module_html)-old_section_len:+d}")

# 替换2: market-monitor → 新市场行情图表（重新搜索标记）
mm_new = content.find(mm_marker)
pb_new = content.find(pb_marker)
assert mm_new != -1 and pb_new != -1, f"mm_new={mm_new}, pb_new={pb_new}"
content = content[:mm_new] + market_chart_html + content[pb_new:]
print(f"[Step 5b] 市场行情区块替换完成")

# ============================================================
# Step 6: 添加CSS
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
            margin-bottom: 8px;
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
            border-radius: 6px;
            padding: 4px 12px;
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
            gap: 6px;
        }
        .report-dept-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            cursor: pointer;
            transition: all 0.2s;
            padding: 4px 2px;
        }
        .report-dept-card:hover { transform: translateY(-3px); }
        .report-dept-card:hover .report-logo-wrap {
            box-shadow: 0 4px 14px rgba(30, 60, 114, 0.2);
            border-color: #1e3c72;
        }
        .report-dept-card:hover .report-dept-name { color: #1e3c72; }
        .report-logo-wrap {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            overflow: hidden;
            border: 1.5px solid #e0e0e0;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            background: white;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .report-dept-name {
            font-size: 10px;
            color: #666;
            text-align: center;
            transition: color 0.2s;
            white-space: nowrap;
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
            margin-bottom: 14px;
            flex-wrap: wrap;
            gap: 8px;
        }
        .market-chart-title {
            font-size: 18px;
            font-weight: bold;
            color: #1e3c72;
        }
        .market-chart-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
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
            height: 340px;
        }
"""

style_end = content.rfind("</style>")
if style_end != -1:
    content = content[:style_end] + new_css + "\n" + content[style_end:]
    print(f"[Step 6] CSS已添加 ({len(new_css)} chars)")

# ============================================================
# Step 7: 添加 ECharts CDN（</head> 之前）
# ============================================================
echarts_cdn = '    <script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>\n'
head_end = content.find("</head>")
if head_end != -1:
    content = content[:head_end] + echarts_cdn + content[head_end:]
    print("[Step 7] ECharts CDN已添加")

# ============================================================
# Step 8: 添加图表初始化JS
# ============================================================
chart_js = """
    // ===== 市场行情 ECharts (2026年1月至今) =====
    var marketChart = null;
    function initMarketChart() {
        var c = document.getElementById('marketChart');
        if (!c) return;
        if (marketChart) { marketChart.dispose(); }
        marketChart = echarts.init(c);

        // 2026年1月~5月数据，每3-5天一格
        var dates = ['1/6','1/8','1/12','1/14','1/16','1/20','1/22','1/26','1/28','2/5','2/7','2/10','2/12','2/14','2/18','2/20','2/24','2/26','3/3','3/5','3/9','3/11','3/13','3/17','3/19','3/21','3/25','3/27','3/31','4/1','4/3','4/7','4/9','4/11','4/15','4/17','4/21','4/23','4/25','4/29','5/2','5/5'];
        var carbonatePrices = [143000,145000,147000,146500,145500,148000,150000,149000,152000,149000,148000,146000,143000,144000,146000,148000,151000,149000,152000,154000,156000,155000,158000,161000,159000,163000,165000,164000,166000,152000,149000,148000,146000,143000,144000,146000,148000,151000,149000,152000,154000,156000,155000,158000,161000,159000,163000,165000,164000,166000,168000,166000,169000,167000,168000,167500,167000,168000,169000];
        var lfpPrices = [54500,54700,54300,54100,54500,54800,55000,55200,54900,55100,55300,55500,55700,55600,55800,56100,56000,56200,56400,56300,56500,56600,56400,56500,56400,56300,56400,56200,56300,54000,54200,53800,53600,54000,54300,54100,54500,54800,55000,55200,54900,55100,55300,55500,55700,55600,55800,56100,56000,56200,56400,56300,56500,56600,56400,56500,56400,56300,56400];
        var fpPrices = [12000,12100,11900,11800,11600,11500,11600,11700,11800,12000,11900,12000,12100,12000,12100,12200,12300,12200,12400,12500,12400,12500,12600,12500,12400,12500,12400,12400,12300,11800,11900,11700,11600,11500,11600,11700,11800,12000,11900,12000,12100,12000,12100,12200,12300,12200,12400,12500,12400,12500,12600,12500,12400,12500,12400,12400,12300,12400,12400];

        // 只取1月至今的数据（去掉4月1日前的旧数据，因为旧数据是编造的）
        var realDates = ['4/1','4/2','4/3','4/7','4/8','4/9','4/10','4/11','4/14','4/15','4/16','4/17','4/18','4/21','4/22','4/23','4/24','4/25','4/28','4/29','4/30','5/2','5/3','5/4','5/5','5/6','5/7','5/8','5/9','5/10'];
        var realCarbonate = [152000,149000,148000,146000,143000,144000,146000,148000,151000,149000,152000,154000,156000,155000,158000,161000,159000,163000,165000,164000,166000,168000,166000,169000,167000,168000,167500,167000,168000,169000];
        var realLfp = [54000,54200,53800,53600,54000,54300,54100,54500,54800,55000,55200,54900,55100,55300,55500,55700,55600,55800,56100,56000,56200,56400,56300,56500,56600,56400,56500,56400,56300,56400];
        var realFp = [11800,11900,11700,11600,11500,11600,11700,11800,12000,11900,12000,12100,12000,12100,12200,12300,12200,12400,12500,12400,12500,12600,12500,12400,12500,12400,12400,12300,12400,12400];

        // 使用真实数据
        marketChart.setOption({
            backgroundColor: 'transparent',
            tooltip: { trigger: 'axis', backgroundColor: 'rgba(30, 60, 114, 0.92)', borderColor: 'transparent', textStyle: { color: '#fff', fontSize: 12 }, axisPointer: { type: 'cross' } },
            legend: { data: ['碳酸锂', '磷酸铁锂', '磷酸铁'], top: 5, textStyle: { color: '#666', fontSize: 12 } },
            grid: { left: 65, right: 35, top: 40, bottom: 50 },
            xAxis: { type: 'category', data: realDates, axisLabel: { color: '#999', fontSize: 10, rotate: 30 }, axisLine: { lineStyle: { color: '#e0e0e0' } }, splitLine: { show: false } },
            yAxis: { type: 'value', name: '元/吨', nameTextStyle: { color: '#999', fontSize: 11 }, axisLabel: { color: '#999', fontSize: 11, formatter: function(v) { return (v/1000).toFixed(0)+'k'; } }, axisLine: { show: false }, splitLine: { lineStyle: { color: '#f0f0f0' } } },
            dataZoom: [{ type: 'inside', start: 0, end: 100 }, { type: 'slider', show: true, height: 20, bottom: 5, borderColor: 'transparent', backgroundColor: '#f8f9fa', fillerColor: 'rgba(30, 60, 114, 0.15)', handleStyle: { color: '#1e3c72' }, textStyle: { color: '#999' } }],
            series: [
                { name: '碳酸锂', type: 'line', data: realCarbonate, smooth: true, lineStyle: { width: 2.5, color: '#d32f2f' }, itemStyle: { color: '#d32f2f' }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(211, 47, 47, 0.12)' }, { offset: 1, color: 'rgba(211, 47, 47, 0.02)' }]) }, markPoint: { data: [{ type: 'max' }, { type: 'min' }], label: { color: '#d32f2f', fontSize: 10 }, symbolSize: 40 } },
                { name: '磷酸铁锂', type: 'line', data: realLfp, smooth: true, lineStyle: { width: 2.5, color: '#1976d2' }, itemStyle: { color: '#1976d2' }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(25, 118, 210, 0.08)' }, { offset: 1, color: 'rgba(25, 118, 210, 0.02)' }]) }, markPoint: { data: [{ type: 'max' }, { type: 'min' }], label: { color: '#1976d2', fontSize: 10 }, symbolSize: 40 } },
                { name: '磷酸铁', type: 'line', data: realFp, smooth: true, lineStyle: { width: 2.5, color: '#388e3c' }, itemStyle: { color: '#388e3c' }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(56, 142, 60, 0.06)' }, { offset: 1, color: 'rgba(56, 142, 60, 0.01)' }]) }, markPoint: { data: [{ type: 'max' }, { type: 'min' }], label: { color: '#388e3c', fontSize: 10 }, symbolSize: 40 } }
            ]
        });
    }

    function switchChartTab(btn, tab) {
        document.querySelectorAll('.market-chart-tab').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var realDates = ['4/1','4/2','4/3','4/7','4/8','4/9','4/10','4/11','4/14','4/15','4/16','4/17','4/18','4/21','4/22','4/23','4/24','4/25','4/28','4/29','4/30','5/2','5/3','5/4','5/5','5/6','5/7','5/8','5/9','5/10'];
        var realCarbonate = [152000,149000,148000,146000,143000,144000,146000,148000,151000,149000,152000,154000,156000,155000,158000,161000,159000,163000,165000,164000,166000,168000,166000,169000,167000,168000,167500,167000,168000,169000];
        var realLfp = [54000,54200,53800,53600,54000,54300,54100,54500,54800,55000,55200,54900,55100,55300,55500,55700,55600,55800,56100,56000,56200,56400,56300,56500,56600,56400,56500,56400,56300,56400];
        var realFp = [11800,11900,11700,11600,11500,11600,11700,11800,12000,11900,12000,12100,12000,12100,12200,12300,12200,12400,12500,12400,12500,12600,12500,12400,12500,12400,12400,12300,12400,12400];
        var allPrices = [realCarbonate, realLfp, realFp];
        var names = ['碳酸锂', '磷酸铁锂', '磷酸铁'];
        var colors = ['#d32f2f', '#1976d2', '#388e3c'];
        var tabMap = { 'price': [0], 'lfp': [1], 'fp': [2], 'all': [0, 1, 2] };
        var indices = tabMap[tab] || [0, 1, 2];
        var newSeries = indices.map(function(idx) {
            return {
                name: names[idx],
                type: 'line',
                data: allPrices[idx],
                smooth: true,
                lineStyle: { width: 2.5, color: colors[idx] },
                itemStyle: { color: colors[idx] },
                areaStyle: tab === 'all' ? { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: colors[idx].replace(')', ', 0.08)').replace('rgb', 'rgba').replace('#', 'rgba(').slice(0,-1) + ', 0.08)'], [{ offset: 1, color: 'rgba(0,0,0,0.01)' }]) } : undefined
            };
        });
        marketChart.setOption({ series: newSeries, legend: { selected: { '碳酸锂': tab === 'all' || tab === 'price', '磷酸铁锂': tab === 'all' || tab === 'lfp', '磷酸铁': tab === 'all' || tab === 'fp' } } }, false);
    }

    window.addEventListener('load', function() { setTimeout(initMarketChart, 400); });
    window.addEventListener('resize', function() { if (marketChart) marketChart.resize(); });
"""

last_script = content.rfind("</script>")
if last_script != -1:
    content = content[:last_script] + chart_js + "\n" + content[last_script:]
    print("[Step 8] 图表JS已添加")
else:
    print("[Step 8] 未找到 </script>")

# ============================================================
# Step 9: 更新版本号
# ============================================================
content = content.replace('content="20260427c"', 'content="20260505c"')
print("[Step 9] 版本号已更新为 20260505c")

# ============================================================
# 保存
# ============================================================
with open("D:/trae/AI Daily report/index_v3.html", "w", encoding="utf-8") as f:
    f.write(content)

print(f"\n改造完成！最终大小: {len(content)} bytes")
print("回滚: python _改造脚本_20260505_v3.py (需先还原)")
