
//------------------------------------------------------
// 龙蟠时代 (LPSD) 雷达看板数据
// -----------------------------------------------------------

const BU_META_LPSD = {
    name: '龙蟠时代',
    subtitle: '碳酸锂 · 新能源材料',
    color: '#2e75b6',
    accent: '#2e75b6',
}

// 迪克化学权重配置：D1战略20% D2经营22% D3运营18% D4创新15% D5合规15% D6活力10%
// 冷却液业务以销售收入和品类达成为核心
const BU_WEIGHTS_LPSD = [20, 20, 18, 17, 13, 12];


const DIMS_DEF_LPSD = [
    { id: 'd1', name: '战略执行力',   kpis: ['收入达成率','利润达成率','毛利率','费用控制率'], color: '#2e75b6' },
    { id: 'd2', name: '经营效益',     kpis: ['碳酸锂销售','前驱体销售','库存周转','客户结构'], color: '#2e75b6' },
    { id: 'd3', name: '运营效率',     kpis: ['准时交付率','存货周转率','应收账款天数','采购降本'], color: '#2e75b6' },
    { id: 'd4', name: '技术创新力',   kpis: ['新产品开发','OEM认证','技术降本','研发费用率'], color: '#2e75b6' },
    { id: 'd5', name: '风险合规',     kpis: ['质量体系','环保合规','客户投诉率','供应商审核'], color: '#2e75b6' },
    { id: 'd6', name: '组织活力',     kpis: ['AI项目立项','新客户开发','人才引进','数字化项目'], color: '#2e75b6' },
];

const RADAR_HISTORY_LPSD = {
    // Q1数据来源: 龙蟠时代3月.pdf (Q1季度报告，第4页关键指标+第9页助燃剂+第13页收率)
    // 注: 此PDF为Q1(1-3月)季度汇总，单月数据通过4月+5月PDF交叉验证推算
    '2026-Q1': {
        // Q1(1-3月)核心经营指标:
        //   营收: 33,353万 vs 预算34,771万 (96%) — 来源: 龙蟠时代4月.pdf第5页
        //   净利润: 786万 vs 电网目标400万 (196.5%)，含信用减值600万
        //   毛利率: 13.0% vs 预算12.61% (103.1%)
        //   产量: 2,660T vs 预算2,705T (98.3%) — 来源: 龙蟠时代4月.pdf第5页
        dims: { d1: 100, d2: 98, d3: 80, d4: 80, d5: 80, d6: 70 },
        kpis: {
            d1: [96, 196, 103, 100],
            d2: [98, 90, 98, 98],
            d3: [78, 80, 82, 80],
            d4: [80, 80, 80, 80],
            d5: [100, 80, 80, 80],
            d6: [70, 75, 70, 70],
        },
        _kpiComparison: {
            title: 'Q1核心KPI达成率',
            period: '2026年Q1(1-3月)',
            items: [
                { name: '营业收入(万)', budget: 34771, target: 34771, actual: 33353, unit: '万' },
                { name: '净利润(万)', budget: 400, target: 400, actual: 786, unit: '万' },
                { name: '毛利率(%)', budget: 12.61, target: 12.61, actual: 13.0, unit: '%' },
                { name: '产量(T)', budget: 2705, target: 2705, actual: 2660, unit: 'T' },
            ],
        },
        _dimComparison_d2: {
            title: 'Q1经营效益',
            items: [
                { name: '碳酸锂产量(T)', budget: 2705, target: 2705, actual: 2660, unit: 'T' },
                { name: '云母采购量(T)', budget: 0, target: 70000, actual: 55000, unit: 'T' },
                { name: '云母收率(%)', budget: 80.34, target: 80.34, actual: 79.57, unit: '%' },
                { name: '焙烧转化率(%)', budget: 89.0, target: 89.0, actual: 88.46, unit: '%' },
            ],
        },
        _dimComparison_d3: {
            title: 'Q1运营效率',
            items: [
                { name: '电单耗(kWh/T)', budget: 8200, target: 8200, actual: 8678, unit: 'kWh/T' },
                { name: '水单耗(m³/T)', budget: 25, target: 25, actual: 29.8, unit: 'm³/T' },
                { name: '天然气(m³/T)', budget: 2500, target: 2500, actual: 2628, unit: 'm³/T' },
                { name: '存货周转率(次)', budget: 0, target: 6.0, actual: 4.8, unit: '次' },
            ],
        },
        _dimComparison_d4: {
            title: 'Q1技术创新力',
            items: [
                { name: '发明专利新增(件)', budget: 0, target: 3, actual: 3, unit: '件' },
                { name: '实用新型专利(件)', budget: 0, target: 5, actual: 4, unit: '件' },
                { name: '研发项目立项(项)', budget: 0, target: 2, actual: 1, unit: '项' },
            ],
        },
        _dimComparison_d5: {
            title: 'Q1风险合规',
            items: [
                { name: '安全事故(起)', budget: 0, target: 0, actual: 0, unit: '起' },
                { name: '环保合规', budget: 1, target: 1, actual: 1, unit: '项' },
                { name: '质量体系审核', budget: 1, target: 1, actual: 0, unit: '项' },
            ],
        },
        _dimComparison_d6: {
            title: 'Q1组织活力',
            items: [
                { name: '能源项目立项(项)', budget: 0, target: 1, actual: 1, unit: '项' },
                { name: '新客户开发(家)', budget: 0, target: 3, actual: 1, unit: '家' },
                { name: '人才引进(人)', budget: 0, target: 2, actual: 1, unit: '人' },
            ],
        },
    },
    // 4月数据来源: 龙蟠时代4月.pdf (第5页关键指标+第7页采购+第13页收率+第15页能耗)
            // 2026年04 data (src: )
    // ============================================================
    '2026-04': {
        dims: { d1: 97, d2: 79, d3: 90, d4: 85, d5: 80, d6: 75 },
        kpis: {
            d1: [96, 107, 140, 100],
            d2: [58, 64, 98, 99],
            d3: [97, 69, 101, 72],
            d4: [85, 85, 80, 90],
            d5: [100, 85, 80, 85],
            d6: [75, 80, 70, 75],
        },
        _isCurrent: false,
        _kpiComparison: {
            title: '4月核心KPI达成率',
            period: '2026年4月',
            items: [
                {name: '营业收入(万)', budget: 34771, target: 34771, actual: 33353, unit: '万'},
                {name: '净利润(万)', budget: 2996, target: 2996, actual: 3200, unit: '万'},
                {name: '毛利率(%)', budget: 12.61, target: 12.61, actual: 17.64, unit: '%'},
                {name: '产量(T)', budget: 3482, target: 3482, actual: 2036, unit: 'T'}
            ],
        },
        _dimComparison_d2: {
            title: '4月经营效益',
            items: [
                {name: '碳酸锂产量(T)', budget: 3482, target: 3482, actual: 2036, unit: 'T'},
                {name: '云母采购量(T)', budget: 90000, target: 90000, actual: 58000, unit: 'T'},
                {name: '云母收率(%)', budget: 80.34, target: 80.34, actual: 78.85, unit: '%'},
                {name: '焙烧转化率(%)', budget: 89.0, target: 89.0, actual: 88.5, unit: '%'}
            ],
        },
        _dimComparison_d3: {
            title: '4月运营效率',
            items: [
                {name: '电单耗(kWh/T)', budget: 8200, target: 8200, actual: 8421, unit: 'kWh/T'},
                {name: '水单耗(m³/T)', budget: 25, target: 25, actual: 36.1, unit: 'm³/T'},
                {name: '天然气(m³/T)', budget: 2500, target: 2500, actual: 2466, unit: 'm³/T'},
                {name: '存货周转率(次)', budget: 0, target: 6.0, actual: 5.0, unit: '次'}
            ],
        },
        _dimComparison_d4: {
            title: '4月技术创新力',
            items: [
                {name: '发明专利新增(件)', budget: 0, target: 3, actual: 4, unit: '件'},
                {name: '实用新型专利(件)', budget: 0, target: 5, actual: 5, unit: '件'},
                {name: '研发项目立项(项)', budget: 0, target: 2, actual: 2, unit: '项'}
            ],
        },
        _dimComparison_d5: {
            title: '4月风险合规',
            items: [
                {name: '安全事故(起)', budget: 0, target: 0, actual: 0, unit: '起'},
                {name: '环保合规', budget: 1, target: 1, actual: 1, unit: '项'},
                {name: '质量体系审核', budget: 1, target: 1, actual: 1, unit: '项'}
            ],
        },
        _dimComparison_d6: {
            title: '4月组织活力',
            items: [
                {name: '能源项目立项(项)', budget: 0, target: 1, actual: 1, unit: '项'},
                {name: '新客户开发(家)', budget: 0, target: 3, actual: 2, unit: '家'},
                {name: '人才引进(人)', budget: 0, target: 2, actual: 1, unit: '人'}
            ],
        },},
    // 5月数据来源: 龙蟠时代5月.pdf (第3页关键指标+第4页经营数据+第12页收率+第15-17页能耗)
            // 2026年05 data (src: )
    // ============================================================
    '2026-05': {
        dims: { d1: 58, d2: 88, d3: 75, d4: 85, d5: 85, d6: 75 },
        kpis: {
            d1: [51, 117, 154, 100],
            d2: [106, 95, 99, 90],
            d3: [82, 78, 88, 72],
            d4: [85, 85, 80, 90],
            d5: [100, 85, 80, 85],
            d6: [75, 80, 70, 75],
        },
        _isCurrent: true,
        _kpiComparison: {
            title: '5月核心KPI达成率',
            period: '2026年5月',
            items: [
                {name: '营业收入(万)', budget: 45101, target: 45101, actual: 22885, unit: '万'},
                {name: '净利润(万)', budget: 3030, target: 3030, actual: 3550, unit: '万'},
                {name: '毛利率(%)', budget: 13.1, target: 13.1, actual: 20.2, unit: '%'},
                {name: '产量(T)', budget: 2164, target: 2164, actual: 2302, unit: 'T'},
                {name: '云母收率(%)', budget: 80.34, target: 80.34, actual: 79.22, unit: '%'}
            ],
        },
        _dimComparison_d2: {
            title: '5月经营效益',
            items: [
                {name: '碳酸锂产量(T)', budget: 2164, target: 2164, actual: 2302, unit: 'T'},
                {name: '云母采购量(T)', budget: 50000, target: 50000, actual: 10000, unit: 'T'},
                {name: '云母收率(%)', budget: 80.34, target: 80.34, actual: 79.22, unit: '%'},
                {name: '焙烧转化率(%)', budget: 89.0, target: 89.0, actual: 88.26, unit: '%'}
            ],
        },
        _dimComparison_d3: {
            title: '5月运营效率',
            items: [
                {name: '电单耗(kWh/T)', budget: 0, target: 50, actual: 46, unit: 'kWh/T'},
                {name: '气单耗(m³/T)', budget: 0, target: 200, actual: 185, unit: 'm³/T'},
                {name: '综合能耗(kgce/T)', budget: 0, target: 68, actual: 62, unit: 'kgce/T'},
                {name: '存货周转率(次)', budget: 0, target: 6.0, actual: 5.2, unit: '次'}
            ],
        },
        _dimComparison_d4: {
            title: '5月技术创新力',
            items: [
                {name: '发明专利新增(件)', budget: 0, target: 3, actual: 5, unit: '件'},
                {name: '实用新型专利(件)', budget: 0, target: 5, actual: 6, unit: '件'},
                {name: '研发项目立项(项)', budget: 0, target: 2, actual: 2, unit: '项'}
            ],
        },
        _dimComparison_d5: {
            title: '5月风险合规',
            items: [
                {name: '安全事故(起)', budget: 0, target: 0, actual: 0, unit: '起'},
                {name: '环保合规', budget: 1, target: 1, actual: 1, unit: '项'},
                {name: '质量体系审核', budget: 1, target: 1, actual: 1, unit: '项'}
            ],
        },
        _dimComparison_d6: {
            title: '5月组织活力',
            items: [
                {name: '能源项目立项(项)', budget: 0, target: 1, actual: 1, unit: '项'},
                {name: '新客户开发(家)', budget: 0, target: 3, actual: 2, unit: '家'},
                {name: '人才引进(人)', budget: 0, target: 2, actual: 1, unit: '人'}
            ],
        },},
};



// 对比表数据已内嵌到 RADAR_HISTORY_LPSD 各月数据中
const RADAR_HISTORY_LPSD_EXTRA = {};

// 当前选中月份
var currentMonth = '2026-05';

// 月份列表
var MONTHS = ['2026-04', '2026-05'];

function getMonthData(month) {
    var hist = RADAR_HISTORY_LPSD[month];
    if (!hist) return null;
    // 补充对比表数据（仅D1/D2有明细数据，D3-D6为定性评估）
    if (RADAR_HISTORY_LPSD_EXTRA[month]) {
        hist._dimComparison_d2 = hist._dimComparison_d2 || RADAR_HISTORY_LPSD_EXTRA[month]._dimComparison_d2;
    }
    // D1核心考核指标使用KPI数据
    if (hist._kpiComparison && !hist._dimComparison_d1) {
        hist._dimComparison_d1 = hist._kpiComparison;
    }
    return hist;
}

// 工具函数
function calcAchv(actual, target, isCost) {
    if (!actual || actual <= 0) return 0;
    if (!target || target <= 0) return 0;
    var rate = isCost ? target / actual : actual / target;
    return Math.min(120, rate * 100);
}

function fmtNum(v, decimals) {
    if (v === null || v === undefined) return '--';
    return Number(v).toFixed(decimals !== undefined ? decimals : 1);
}

// 判断是否为"零事故/零投诉"类型指标（actual=0 & target=0 表示达标，而非落后）
function isZeroGoodMetric(item) {
    var name = item.name || '';
    return (item.actual === 0 && item.target === 0 &&
        (name.indexOf('事故') >= 0 || name.indexOf('投诉') >= 0 ||
         name.indexOf('举报') >= 0 || name.indexOf('纠纷') >= 0 ||
         name.indexOf('客诉') >= 0 || name.indexOf('安全事故') >= 0));
}

function fmtRate(v) {
    if (v === null || v === undefined) return '--';
    return (v >= 100 ? '+' : '') + (v >= 0 ? '' : '') + v.toFixed(1) + '%';
}

function rateClass(v) {
    if (v === null || v === undefined) return 'rate-ok';
    if (v >= 100) return 'rate-good';
    if (v >= 85) return 'rate-ok';
    return 'rate-bad';
}

function rateColor(v) {
    if (v === null || v === undefined) return '#d4a017';
    if (v >= 100) return '#27ae60';
    if (v >= 85) return '#d4a017';
    return '#e74c3c';
}

function calcMom(actual, prev) {
    if (!prev || prev <= 0) return actual > 0 ? 100 : 0;
    return Math.min(120, (actual / prev) * 100);
}

// 渲染月份切换器
function renderMonthSwitcher() {
    var el = document.getElementById('monthSwitcher');
    el.innerHTML = '';
    MONTHS.forEach(function(m) {
        var label = m === '2026-Q1' ? '2026年Q1' : m.replace('-', '年') + '月';
        var isCurrent = RADAR_HISTORY_LPSD[m] && RADAR_HISTORY_LPSD[m]._isCurrent;
        if (isCurrent) label += ' ★';
        var btn = document.createElement('button');
        btn.className = 'month-btn' + (m === currentMonth ? ' active' : '');
        btn.textContent = label;
        btn.onclick = function() {
            currentMonth = m;
            document.querySelectorAll('.month-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            updateTimelineProgress();
            renderAll();
        };
        el.appendChild(btn);
    });
}

// 渲染综合评分
function renderScoreOverview() {
    var data = getMonthData(currentMonth);
    if (!data) return;
    var dims = data.dims;
    var vals = [dims.d1, dims.d2, dims.d3, dims.d4, dims.d5, dims.d6];
    var wts = BU_WEIGHTS_LPSD;
    var score = Math.round(vals.reduce(function(a, b, i) { return a + b * wts[i] / 100; }, 0));

    document.getElementById('bigScore').textContent = score;

    var dimNames = ['战略执行力', '经营效益', '运营效率', '技术创新力', '风险合规', '组织活力'];
    var scoreDimsEl = document.getElementById('scoreDims');
    scoreDimsEl.innerHTML = '';
    ['d1','d2','d3','d4','d5','d6'].forEach(function(d, i) {
        var v = dims[d] || 0;
        scoreDimsEl.innerHTML +=
            '<div class="dim-item">' +
            '<div class="dim-name">' + dimNames[i] + '<span style="font-size:10px;color:#94a3b8"> · ' + wts[i] + '%</span></div>' +
            '<div class="dim-score" style="color:' + DIMS_DEF_LPSD[i].color + '">' + v + '</div>' +
            '<div class="dim-max">/100</div>' +
            '</div>';
    });
}

// ─────────────────────────────────────────────
// 增强雷达图渲染
// ─────────────────────────────────────────────
var radarChart = null;
var radarMode = 'single';   // 'single' | 'compare'
var isPlaying = false;
var playTimer = null;
var playIndex = 0;
var playHistory = null;

// 初始化时间轴
function initTimeline() {
    var track = document.getElementById('timelineTrack');
    if (!track) return;
    track.innerHTML = '';

    var months = MONTHS; // ['2026-03','2026-04','2026-05']
    var count = months.length;
    var pct = 100 / (count - 1);

    months.forEach(function(m, i) {
        var pos = i * pct;
        var label = m === '2026-Q1' ? '2026年Q1' : m.replace('-', '年') + '月';
        var isActive = m === currentMonth;
        track.innerHTML +=
            '<div class="timeline-dot' + (isActive ? ' active' : '') + '" ' +
            'style="left:' + pos + '%" ' +
            'data-idx="' + i + '" ' +
            'title="' + label + '" ' +
            'onclick="seekTimeline(' + i + ')"></div>';
    });

    updateTimelineProgress();
}

function updateTimelineProgress() {
    var track = document.getElementById('timelineTrack');
    var label = document.getElementById('timelineLabel');
    if (!track) return;

    var months = MONTHS;
    var count = months.length;
    var pct = 100 / (count - 1);
    var idx = months.indexOf(currentMonth);
    if (idx < 0) idx = count - 1;

    // 更新 progress bar
    var progress = track.querySelector('.timeline-progress');
    if (!progress) {
        progress = document.createElement('div');
        progress.className = 'timeline-progress';
        track.insertBefore(progress, track.firstChild);
    }
    progress.style.width = (idx * pct) + '%';

    // 更新 dots
    track.querySelectorAll('.timeline-dot').forEach(function(dot, i) {
        dot.classList.toggle('active', i === idx);
    });

    // 更新 label
    if (label) {
        var text = months[idx] === '2026-Q1' ? '2026年Q1' : months[idx].replace('-', '年') + '月';
        if (RADAR_HISTORY_LPSD[months[idx]] && RADAR_HISTORY_LPSD[months[idx]]._isCurrent) {
            text += ' ★';
        }
        label.textContent = text;
    }
}

function seekTimeline(idx) {
    var months = MONTHS;
    if (idx < 0 || idx >= months.length) return;
    currentMonth = months[idx];
    document.querySelectorAll('.month-btn').forEach(function(b, i) {
        b.classList.toggle('active', i === idx);
    });
    updateTimelineProgress();
    renderAll();
}

function togglePlay() {
    var btn = document.getElementById('playBtn');
    var icon = document.getElementById('playIcon');
    if (!btn) return;

    if (isPlaying) {
        clearInterval(playTimer);
        isPlaying = false;
        btn.classList.remove('playing');
        icon.textContent = '▶';
    } else {
        isPlaying = true;
        btn.classList.add('playing');
        icon.textContent ='⏸';
        playHistory = Object.keys(RADAR_HISTORY_LPSD);
        playIndex = playHistory.indexOf(currentMonth);
        if (playIndex < 0) playIndex = 0;

        playTimer = setInterval(function() {
            playIndex = (playIndex + 1) % playHistory.length;
            currentMonth = playHistory[playIndex];
            updateTimelineProgress();
            renderAll();
        }, 1800);
    }
}

function renderCompareLegend() {
    var el = document.getElementById('compareLegend');
    if (!el) return;
    var allMonths = Object.keys(RADAR_HISTORY_LPSD);
    var COMP_COLORS = [
        { main: '#1a4c35', label: '龙蟠时代' },
        { main: '#3d8b5a', label: '龙蟠时代' },
        { main: '#2e75b6', label: '法恩莱特' },
    ];
    el.innerHTML = '';
    allMonths.forEach(function(m, mi) {
        var c = COMP_COLORS[mi % COMP_COLORS.length];
        var isLast = mi === allMonths.length - 1;
        el.innerHTML +=
            '<div class="compare-legend-item">' +
            '<div class="legend-line" style="background:' + c.main + ';opacity:' + (isLast ? 1 : 0.6) + '"></div>' +
            '<div class="legend-dot" style="background:' + c.main + '"></div>' +
            '<span>' + c.label + '</span>' +
            '</div>';
    });
    // 基准线
    el.innerHTML +=
        '<div class="compare-legend-item" style="opacity:0.5">' +
        '<div class="legend-line" style="background:#ccc;border-style:dotted;height:1px;width:20px"></div>' +
        '<span>基准线(80分)</span>' +
        '</div>';
}

function setRadarMode(mode) {
    radarMode = mode;
    document.getElementById('mode-single').classList.toggle('active', mode === 'single');
    document.getElementById('mode-compare').classList.toggle('active', mode === 'compare');
    document.getElementById('compareLegend').style.display = mode === 'compare' ? 'flex' : 'none';
    if (mode === 'compare') renderCompareLegend();
    renderRadar();
}

function renderRadar() {
    var data = getMonthData(currentMonth);
    if (!data) return;
    var dom = document.getElementById('radarChart');
    if (!dom) return;

    if (radarChart) { radarChart.dispose(); }
    radarChart = echarts.init(dom);
    radarChart.clear();

    var dims = data.dims;
    var vals = [dims.d1, dims.d2, dims.d3, dims.d4, dims.d5, dims.d6];
    var dimNames = ['战略执行力', '经营效益', '运营效率', '技术创新力', '风险合规', '组织活力'];

    // 更新维度标签值
    ['d1','d2','d3','d4','d5','d6'].forEach(function(d, i) {
        var el = document.getElementById('dv-' + d);
        if (el) el.textContent = dims[d] || '--';
    });

    // 构建 series
    var seriesData = [];
    var BRAND = '#2e75b6';
    var BRAND_DARK = '#1a4c35';
    var BRAND_LIGHT = '#3d8b5a';

    if (radarMode === 'single') {
        // 单对象：品牌蓝渐变雷达，2.5px线条 + 径向填充 + 发光数据点
        seriesData.push({
            value: vals,
            name: '龙蟠时代',
            lineStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,  //从上到下渐变
                    colorStops: [
                        { offset: 0, color: BRAND },
                        { offset: 1, color: BRAND_DARK }
                    ]
                },
                width: 2.5,  //加粗
                type: 'solid',
            },
            itemStyle: {
                color: BRAND,
                shadowBlur: 16,
                shadowColor: 'rgba(46,117,182,0.6)',
                borderWidth: 2,
                borderColor: 'white',  //白色描边
            },
            areaStyle: {
                color: {
                    type: 'radial',
                    x: 0.5, y: 0.5, r: 0.5,
                    colorStops: [
                        { offset: 0, color: 'rgba(46,117,182,0.30)' },  //中心30%
                        { offset: 1, color: 'rgba(46,117,182,0.10)' } //边缘10%
                    ]
                }
            },
            label: {
                show: true,
                formatter: '{c}',
                fontSize: 13,
                fontWeight: 'bold',
                color: BRAND,
                position: 'outside',
                distance: 14,
            },
            symbol: 'circle',
            symbolSize: 8,  //8px数据点
        });
    } else {
        // 多对象对比：3个月数据叠加（品牌蓝系）
        var COMP_COLORS = [
            { main: '#2e75b6', light: 'rgba(156,39,176,0.15)', label: '法恩莱特' },
            { main: '#3d8b5a', light: 'rgba(61,139,90,0.15)', label: '法恩莱特' },
            { main: '#66bb6a', light: 'rgba(102,187,106,0.1)', label: '法恩莱特' },
        ];
        var allMonths = Object.keys(RADAR_HISTORY_LPSD);
        allMonths.forEach(function(m, mi) {
            var mData = RADAR_HISTORY_LPSD[m];
            if (!mData) return;
            var mDims = mData.dims;
            var mVals = ['d1','d2','d3','d4','d5','d6'].map(function(d) { return mDims[d] || 0; });
            var c = COMP_COLORS[mi % COMP_COLORS.length];
            seriesData.push({
                value: mVals,
                name: m === '2026-Q1' ? '2026年Q1' : m.replace('-', '年') + '月',
                lineStyle: { color: c.main, width: mi === allMonths.length - 1 ? 2.5 : 1.5, type: mi === allMonths.length - 1 ? 'solid' : 'dashed' },
                itemStyle: { color: c.main, shadowBlur: mi === allMonths.length - 1 ? 12 : 0, shadowColor: c.main + '66', borderWidth: 2, borderColor: 'white' },
                areaStyle: mi === allMonths.length - 1 ? { color: c.light } : null,
                label: mi === allMonths.length - 1 ? { show: true, formatter: '{c}', fontSize: 12, color: c.main, fontWeight: 'bold' } : { show: false },
                symbol: 'circle',
                symbolSize: mi === allMonths.length - 1 ? 8 : 4,
            });
        });

        // 80分基准线（浅灰虚线）
        seriesData.push({
            value: [80, 80, 80, 80, 80, 80],
            name: '基准线',
            lineStyle: { color: 'rgba(100,120,140,0.3)', width: 1, type: 'dotted' },
            itemStyle: { opacity: 0 },
            areaStyle: null,
            symbol: 'none',
            silent: true,
        });
    }

    var option = {
        backgroundColor: 'transparent',
        animation: true,
        animationDuration: 1500,  //1.5秒入场动画
        animationEasing: 'cubicOut',
        tooltip: {
            trigger: 'item',
            confine: true,
            backgroundColor: 'rgba(255,255,255,0.97)',
            borderColor: BRAND,
            borderWidth: 2,
            borderRadius: 12,
            padding: [12, 16],
            textStyle: { color: '#333', fontSize: 13 },
            formatter: function(params) {
                if (params.seriesName === '基准线') return '';
                var idx = params.dimensionIndex;
                var dn = (idx != null && idx >= 0) ? (dimNames[idx] || ('维度' + (idx + 1))) : '综合评分';
                return '<b style="color:' + BRAND + ';font-size:14px">' + params.seriesName + '</b><br/>' +
                    '<span style="color:#64748B">' + dn + ':</span> ' +
                    '<b style="color:' + BRAND + ';font-size:16px">' + params.value + '</b>' +
                    '<span style="color:#9ab0cc;font-size:12px"> / 100</span>';
            }
        },
        legend: { show: false },
        radar: {
            indicator: dimNames.map(function(n, i) {
                return {
                    name: n,
                    max: 100,
                    axisName: {
                        color: '#64748B',  //灰色维度标签
                        fontSize: 13,
                        fontWeight: 'normal',
                    }
                };
            }),
            radius: '65%',
            center: ['50%', '50%'],
            splitNumber: 4,  //4层浅灰网格
            // 4层浅灰网格线（从内到外逐渐加深）
            splitLine: {
                show: true,
                lineStyle: {
                    width: 1,
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(100,120,140,0.25)' },
                            { offset: 0.33, color: 'rgba(100,120,140,0.15)' },
                            { offset: 0.66, color: 'rgba(100,120,140,0.08)' },
                            { offset: 1, color: 'rgba(100,120,140,0.04)' }
                        ]
                    },
                    type: 'solid'
                }
            },
            // 4层渐变区域填充（极淡蓝灰）
            splitArea: {
                show: true,
                areaStyle: {
                    color: [
                        'rgba(46,117,182,0.02)',
                        'rgba(46,117,182,0.04)',
                        'rgba(46,117,182,0.07)',
                        'rgba(46,117,182,0.10)'
                    ]
                }
            },
            axisLine: {
                show: true,
                lineStyle: {
                    color: 'rgba(100,120,140,0.4)',
                    width: 1.5,
                }
            },
            shape: 'polygon',
        },
        series: [{
            type: 'radar',
            animationDuration: 1500,
            animationEasing: 'cubicOut',
            emphasis: {
                lineStyle: { width: 4 },
                areaStyle: { opacity: 0.4 }
            },
            data: seriesData,
        }],
    };

    radarChart.setOption(option);

    // ──双向联动：雷达图悬停 ↔ 得分标签 ──
    radarChart.on('mouseover', function(params) {
        if (params.seriesName === '基准线') return;
        var idx = params.dimensionIndex;
        if (idx == null || idx < 0) return;
        radarChart.dispatchAction({ type: 'highlight', seriesIndex: 0 });
        var tags = document.querySelectorAll('.dim-tag');
        if (tags[idx]) {
            tags[idx].classList.add('active');
        }
    });
    radarChart.on('mouseout', function() {
        radarChart.dispatchAction({ type: 'downplay', seriesIndex: 0 });
        document.querySelectorAll('.dim-tag').forEach(function(t) { t.classList.remove('active'); });
    });

    // ── 得分标签悬停 → 高亮雷达图维度 ──
    var dimTagEls = document.querySelectorAll('.dim-tag');
    dimTagEls.forEach(function(tag, idx) {
        tag.addEventListener('mouseenter', function() {
            radarChart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: idx });
        });
        tag.addEventListener('mouseleave', function() {
            radarChart.dispatchAction({ type: 'downplay', seriesIndex: 0 });
        });
    });

    window.addEventListener('resize', function() {
        if (radarChart) radarChart.resize();
    });
}

// 全局 resize
window.addEventListener('resize', function() {
    if (radarChart) radarChart.resize();
});

// 渲染KPI表格
function renderKPITable() {
    var data = getMonthData(currentMonth);
    if (!data || !data._kpiComparison) return;
    var tbody = document.querySelector('#kpiTable tbody');
    tbody.innerHTML = '';

    data._kpiComparison.items.forEach(function(item) {
        var isCost = item.name.indexOf('成本') >= 0;
        var achvBudget = calcAchv(item.actual, item.budget, isCost);
        var achvTarget = calcAchv(item.actual, item.target, isCost);

        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + item.name + '</td>' +
            '<td>' + fmtNum(item.budget) + (item.unit ? ' <span style="color:#aaa;font-size:11px">' + item.unit + '</span>' : '') + '</td>' +
            '<td>' + fmtNum(item.target) + '</td>' +
            '<td class="val-actual">' + fmtNum(item.actual) + '</td>' +
            '<td><span class="rate-badge ' + rateClass(achvTarget) + '">' + fmtRate(achvTarget) + '</span></td>' +
            '<td style="color:' + rateColor(achvBudget) + '">' + fmtRate(achvBudget) + '</td>' +
            '<td style="color:' + rateColor(achvTarget) + '">' + fmtRate(achvTarget) + '</td>';
        tbody.appendChild(tr);
    });
}

// 渲染KPI概览卡片
function renderKPIGrid() {
    var data = getMonthData(currentMonth);
    if (!data || !data._kpiComparison) return;
    var items = data._kpiComparison.items;
    var grid = document.getElementById('kpiGrid');
    grid.innerHTML = '';

    // 选取关键7项
    items.forEach(function(item) {
        var isCost = item.name.indexOf('成本') >= 0;
        var achv = calcAchv(item.actual, item.target, isCost);
        var vsBudget = calcAchv(item.actual, item.budget, isCost);
        grid.innerHTML +=
            '<div class="kpi-card">' +
            '<div class="kpi-name">' + item.name + '</div>' +
            '<div><span class="kpi-val">' + fmtNum(item.actual) + '</span><span class="kpi-unit">' + item.unit + '</span></div>' +
            '<div class="kpi-sub">目标:' + fmtNum(item.target) + ' · 达成<span style="color:' + rateColor(achv) + ';font-weight:bold">' + fmtRate(achv) + '</span></div>' +
            '</div>';
    });
}

// 渲染维度对比表
function renderDimTable(dimId, data, tableId) {
    var el = document.getElementById(tableId);
    if (!el) return;
    var tbody = el.querySelector('tbody') || el;
    tbody.innerHTML = '';

    var key = '_dimComparison_' + dimId;
    var dimData = data[key];
    if (!dimData || !dimData.items) return;

    dimData.items.forEach(function(item) {
        var isCost = item.name.indexOf('成本') >= 0;
        var isMom = dimData.format === 'mom';

        if (isMom) {
            var mom = calcMom(item.curr, item.prev);
            var status = mom >= 100 ? '↑达标' : '↓ 待改进';
            tbody.innerHTML +=
                '<tr>' +
                '<td>' + item.name + '</td>' +
                '<td>' + fmtNum(item.prev) + '</td>' +
                '<td class="val-actual">' + fmtNum(item.curr) + '</td>' +
                '<td style="color:' + rateColor(mom) + ';font-weight:bold">' + fmtRate(mom) + '</td>' +
                '<td><span class="rate-badge ' + rateClass(mom) + '">' + status + '</span></td>' +
                '</tr>';
        } else {
            var achv = calcAchv(item.actual, item.target, isCost);
            var achvBudget = calcAchv(item.actual, item.budget, isCost);
            tbody.innerHTML +=
                '<tr>' +
                '<td>' + item.name + '</td>' +
                '<td>' + fmtNum(item.budget) + '</td>' +
                '<td>' + fmtNum(item.target) + '</td>' +
                '<td class="val-actual">' + fmtNum(item.actual) + '</td>' +
                '<td style="color:' + rateColor(achv) + ';font-weight:bold">' + fmtRate(achv) + '</td>' +
                '<td><span class="rate-badge ' + rateClass(achv) + '">' + (achv >= 100 ? '达标' : achv >= 85 ? '接近' : '待改进') + '</span></td>' +
                '</tr>';
        }
    });
}

// 渲染所有
function renderAll() {
    var data = getMonthData(currentMonth);
    if (!data) return;

    renderScoreOverview();
    renderRadar();
    renderKPIGrid();
    renderKPITable();
    renderDimTable('d1', data, 'dim1Table');
    renderDimTable('d2', data, 'dim2Table');
    renderDimTable('d3', data, 'dim3Table');
    renderDimTable('d4', data, 'dim4Table');
    renderDimTable('d5', data, 'dim5Table');
    renderDimTable('d6', data, 'dim6Table');
    renderInsights();
}

function switchTab(btn, tabId) {
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    document.querySelectorAll('.tab-content').forEach(function(t) { t.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
    setTimeout(function() {
        document.querySelectorAll('.chart-wrap').forEach(function(c) {
            var chart = echarts.getInstanceByDom(c);
            if (chart) chart.resize();
        });
    }, 50);
}

// TAB3 维度详情 - 左侧导航功能
function switchDimPanel(dimId) {
    // 更新左侧导航状态
    document.querySelectorAll('.dims-nav-item').forEach(function(item) {
        item.classList.remove('active');
    });
    document.querySelector('.dims-nav-item[data-dim="' + dimId + '"]').classList.add('active');
    
    // 更新右侧内容显示
    document.querySelectorAll('.dims-content-panel').forEach(function(panel) {
        panel.classList.remove('active');
    });
    document.getElementById('dims-panel-' + dimId).classList.add('active');
}

// AI 洞察功能
// 辅助函数
function getPreviousMonth(month) {
    var parts = month.split('-');
    var year = parseInt(parts[0]);
    var mon = parseInt(parts[1]);
    mon = mon - 1;
    if (mon < 1) {
        mon = 12;
        year = year - 1;
    }
    return year + '-' + (mon < 10 ? '0' + mon : '' + mon);
}

function getRadarDataForInsights() {
    var month = currentMonth;
    var data = RADAR_HISTORY_LPSD[month];
    if (!data) return null;
    
    var prevMonth = getPreviousMonth(month);
    var prevData = prevMonth ? RADAR_HISTORY_LPSD[prevMonth] : null;
    
    return {
        current: data,
        previous: prevData,
        month: month,
        prevMonth: prevMonth
    };
}

function generateLocalInsights(data) {
    if (!data || !data.current) return { summary: [], dims: [], issues: [], progress: [], suggestions: [] };
    
    var result = { summary: [], dims: [], issues: [], progress: [], suggestions: [] };
    var current = data.current;
    var previous = data.previous;
    var month = data.month;
    var dimKeys = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'];
    
    // ========== 核心分析逻辑 ==========
    var avgScore = 0;
    dimKeys.forEach(function(k) { avgScore += current.dims[k]; });
    avgScore = Math.round(avgScore / 6);
    
    // === 综合表现：经营诊断（专业深度版）===
    var trendAnalysis = '';
    var benchmarkAnalysis = '';
    var kpiDeepAnalysis = '';
    
    // 1. 趋势深度分析（环比+同比+3个月滚动）
    if (previous) {
        var prevAvg = 0;
        dimKeys.forEach(function(k) { prevAvg += previous.dims[k]; });
        prevAvg = Math.round(prevAvg / 6);
        var momDiff = avgScore - prevAvg;
        var momRate = prevAvg > 0 ? Math.round(momDiff / prevAvg * 100) : 0;
        
        // 趋势判断与业务解读
        var trendLevel = '';
        var trendInsight = '';
        if (momDiff > 5 && momRate > 5) {
            trendLevel = '显著改善';
            trendInsight = '经营状况显著改善，综合得分环比提升' + momDiff + '分（+' + momRate + '%），超越正常波动范围，表明经营策略调整或市场机会把握取得实效。';
        } else if (momDiff > 0) {
            trendLevel = '稳中有升';
            trendInsight = '经营稳中有升，综合得分环比提升' + momDiff + '分（+)' + momRate + '%），处于正常经营波动区间，需关注增长可持续性。';
        } else if (momDiff < -5 && momRate < -5) {
            trendLevel = '明显下滑';
            trendInsight = '经营状况明显下滑，综合得分环比下降' + Math.abs(momDiff) + '分（-' + Math.abs(momRate) + '%），已超出正常波动范围，需立即启动根因分析并制定应对措施。';
        } else if (momDiff < 0) {
            trendLevel = '小幅下滑';
            trendInsight = '经营小幅下滑，综合得分环比下降' + Math.abs(momDiff) + '分（-' + Math.abs(momRate) + '%），处于正常波动区间，但需警惕进一步恶化风险。';
        } else {
            trendLevel = '持平';
            trendInsight = '经营状况与上月基本持平（±0分），增长动能不足，需思考突破性举措。';
        }
        
        // 维度贡献度分析（哪些维度驱动了变化）
        var dimContributions = [];
        dimKeys.forEach(function(k) {
            var d = current.dims[k] - previous.dims[k];
            var dimName = DIMS_DEF_LPSD.find(function(def){return def.id===k;}).name;
            dimContributions.push({ name: dimName, diff: d, absDiff: Math.abs(d) });
        });
        dimContributions.sort(function(a, b) { return b.absDiff - a.absDiff; });
        
        var topDriver = dimContributions[0];
        var trendDetail = '<p><strong>变化驱动因素：</strong>' + topDriver.name + '（' + (topDriver.diff >= 0 ? '+' : '') + topDriver.diff + '分）是主要' + (topDriver.diff >= 0 ? '增长' : '下滑') + '驱动维度。</p>';
        
        trendAnalysis = '<div class="insight-trend-analysis">' +
                       '<div class="insight-trend-header">' +
                       '<span class="insight-trend-icon">📊</span>' +
                       '<span class="insight-trend-title">趋势诊断：' + trendLevel + '</span>' +
                       '<span class="insight-trend-badge ' + (momDiff >= 0 ? 'positive' : 'negative') + '">' + (momDiff >= 0 ? '+' : '') + momDiff + '分</span>' +
                       '</div>' +
                       '<p class="insight-trend-insight">' + trendInsight + '</p>' +
                       trendDetail +
                       '</div>';
    } else {
        trendAnalysis = '<div class="insight-trend-analysis">' +
                       '<p>📊 首次评估，无环比数据。综合得分' + avgScore + '分，处于' + (avgScore >= 80 ? '优秀' : (avgScore >= 60 ? '良好' : '待改进')) + '水平。</p>' +
                       '</div>';
    }
    
    // 2. 对标分析（与行业平均、历史最佳对比）
    var benchmarkText = '';
    var industryAvg = 75; // 假设行业平均75分
    var bestScore = 0;
    try {
        var allMonths = Object.keys(RADAR_HISTORY_LPSD || {});
        allMonths.forEach(function(m) {
            var d = RADAR_HISTORY_LPSD[m];
            if (d && d.dims) {
                var s = 0;
                dimKeys.forEach(function(k) { s += d.dims[k]; });
                s = Math.round(s / 6);
                if (s > bestScore) bestScore = s;
            }
        });
    } catch(e) {}
    
    var vsIndustry = avgScore - industryAvg;
    var vsBest = bestScore > 0 ? avgScore - bestScore : 0;
    
    benchmarkText = '<div class="insight-benchmark-analysis">' +
                   '<p><strong>对标分析：</strong></p>' +
                   '<ul class="insight-benchmark-list">' +
                   '<li>vs 行业平均（' + industryAvg + '分）：<strong class="' + (vsIndustry >= 0 ? 'positive' : 'negative') + '">' + (vsIndustry >= 0 ? '+' : '') + vsIndustry + '分</strong> ' + (vsIndustry >= 0 ? '✅ 领先行业' : '⚠️ 落后行业') + '</li>' +
                   '<li>vs 历史最佳（' + bestScore + '分）：<strong class="' + (vsBest >= 0 ? 'positive' : 'negative') + '">' + (vsBest >= 0 ? '+' : '') + vsBest + '分</strong> ' + (vsBest >= 0 ? '✅ 创历史新高' : '⚠️ 未达历史最佳') + '</li>' +
                   '</ul>' +
                   '</div>';
    
    // 3. KPI深度分析（不仅说达标率，还要说业务含义）
    var kpiAnalysisDetail = '';
    var kpiSummaryCards = '';
    if (current._kpiComparison && current._kpiComparison.items) {
        var kpiItems = current._kpiComparison.items;
        var kpiAchieved = 0;
        var goodKpis = [], warnKpis = [], badKpis = [];
        
        kpiItems.forEach(function(item) {
            var isCost = item.name.indexOf('成本') >= 0;
            var achv = calcAchv(item.actual, item.target, isCost);
            var zeroGood = isZeroGoodMetric(item);
            var status = zeroGood ? 'good' : (achv >= 100 ? 'good' : (achv >= 85 ? 'warn' : 'bad'));
            var kpiDetail = {
                name: item.name,
                actual: item.actual,
                target: item.target,
                unit: item.unit,
                achv: achv,
                status: status,
                insight: ''
            };

            // 生成业务洞察
            if (zeroGood) {
                kpiDetail.insight = '零事故/零投诉，安全合规表现优秀，继续保持';
            } else if (achv >= 110) {
                kpiDetail.insight = '大幅超标，可能存在目标设定偏低或市场环境异常有利';
            } else if (achv >= 100) {
                kpiDetail.insight = '精准达标，经营节奏控制良好';
            } else if (achv >= 85) {
                kpiDetail.insight = '接近达标，需关注差距收窄速度';
            } else if (achv >= 60) {
                kpiDetail.insight = '明显未达标，需分析根因（市场/产品/团队？）';
            } else {
                kpiDetail.insight = '严重未达标，经营风险极高，需立即干预';
            }
            
            if (status === 'good') goodKpis.push(kpiDetail);
            else if (status === 'warn') warnKpis.push(kpiDetail);
            else badKpis.push(kpiDetail);
        });
        
        var kpiRate = Math.round((goodKpis.length + warnKpis.length) / kpiItems.length * 100);
        
        // KPI总结卡片
        kpiSummaryCards = '<div class="insight-kpi-summary">' +
                         '<div class="insight-kpi-card ' + (goodKpis.length > 0 ? 'good' : '') + '">' +
                         '<div class="insight-kpi-card-value">' + goodKpis.length + '</div>' +
                         '<div class="insight-kpi-card-label">✅ 达标</div>' +
                         '</div>' +
                         '<div class="insight-kpi-card ' + (warnKpis.length > 0 ? 'warn' : '') + '">' +
                         '<div class="insight-kpi-card-value">' + warnKpis.length + '</div>' +
                         '<div class="insight-kpi-card-label">⚠️ 预警</div>' +
                         '</div>' +
                         '<div class="insight-kpi-card ' + (badKpis.length > 0 ? 'bad' : '') + '">' +
                         '<div class="insight-kpi-card-value">' + badKpis.length + '</div>' +
                         '<div class="insight-kpi-card-label">❌ 未达标</div>' +
                         '</div>' +
                         '</div>';
        
        // KPI详细列表（可折叠）
        var kpiDetailHtml = '';
        if (badKpis.length > 0) {
            kpiDetailHtml += '<div class="insight-kpi-detail-group">' +
                            '<p class="insight-kpi-detail-header">❌ 未达标（' + badKpis.length + '项）- 优先处理</p>' +
                            '<ul>' + badKpis.map(function(k, i) {
                                return '<li><strong>' + k.name + '</strong>：实际<strong>' + fmtNum(k.actual) + k.unit + '</strong> / 目标' + fmtNum(k.target) + k.unit + '（达成率<strong class="negative">' + fmtRate(k.achv) + '</strong>）<br><span class="insight-kpi-insight">💡 ' + k.insight + '</span></li>';
                            }).join('') + '</ul></div>';
        }
        if (warnKpis.length > 0) {
            kpiDetailHtml += '<div class="insight-kpi-detail-group">' +
                            '<p class="insight-kpi-detail-header">⚠️ 预警（' + warnKpis.length + '项）- 密切关注</p>' +
                            '<ul>' + warnKpis.map(function(k, i) {
                                return '<li><strong>' + k.name + '</strong>：实际<strong>' + fmtNum(k.actual) + k.unit + '</strong> / 目标' + fmtNum(k.target) + k.unit + '（达成率<strong class="warn">' + fmtRate(k.achv) + '</strong>）<br><span class="insight-kpi-insight">💡 ' + k.insight + '</span></li>';
                            }).join('') + '</ul></div>';
        }
        if (goodKpis.length > 0) {
            kpiDetailHtml += '<div class="insight-kpi-detail-group">' +
                            '<p class="insight-kpi-detail-header">✅ 达标（' + goodKpis.length + '项）- 保持优势</p>' +
                            '<ul>' + goodKpis.map(function(k, i) {
                                return '<li><strong>' + k.name + '</strong>：实际<strong>' + fmtNum(k.actual) + k.unit + '</strong> / 目标' + fmtNum(k.target) + k.unit + '（达成率<strong class="positive">' + fmtRate(k.achv) + '</strong>）<br><span class="insight-kpi-insight">💡 ' + k.insight + '</span></li>';
                            }).join('') + '</ul></div>';
        }
        
        kpiAnalysisDetail = '<div class="insight-kpi-analysis">' +
                           kpiSummaryCards +
                           kpiDetailHtml +
                           '</div>';
    }
    
    // 4. 预算执行分析
    var budgetAnalysis = '';
    var budgetAchieved = 0, budgetTotal = 0;
    if (current._kpiComparison && current._kpiComparison.items) {
        current._kpiComparison.items.forEach(function(item) {
            if (item.budget && item.budget > 0) {
                budgetTotal++;
                var isCost = item.name.indexOf('成本') >= 0;
                var achv = calcAchv(item.actual, item.budget, isCost);
                if (achv >= 100) budgetAchieved++;
            }
        });
    }
    if (budgetTotal > 0) {
        var budgetRate = Math.round(budgetAchieved / budgetTotal * 100);
        var budgetLevel = budgetRate >= 90 ? 'good' : (budgetRate >= 70 ? 'warn' : 'bad');
        budgetAnalysis = '<div class="insight-budget-analysis">' +
                       '<p><strong>预算执行分析：</strong>执行率<strong class="' + budgetLevel + '">' + budgetRate + '%</strong>。</p>' +
                       (budgetRate >= 90 ? '<p>✅ 预算执行良好，资源使用效率高，投入产出比合理。</p>' :
                        budgetRate >= 70 ? '<p>⚡ 预算执行进度适中，需加快投入到产出的转化效率。</p>' :
                        '<p>⚠️ 预算执行滞后，可能存在项目推进缓慢或资金使用效率低的问题。</p>') +
                       '</div>';
    }
    
    result.summary.push({
        icon: '📊',
        title: '综合表现诊断',
        content: trendAnalysis + benchmarkText + kpiAnalysisDetail + budgetAnalysis
    });
    
    // === 维度分析：专业深度解读（增加对业务含义的解读）===
    dimKeys.forEach(function(dimKey) {
        var dimDef = DIMS_DEF_LPSD.find(function(d) { return d.id === dimKey; });
        var score = current.dims[dimKey];
        var dimName = dimDef.name;
        
        // 深度分析：趋势+对标+归因+建议
        var trendPart = '';
        var benchmarkPart = '';
        var attributionPart = '';
        var suggestionPart = '';
        
        // 1. 趋势分析（环比）
        if (previous) {
            var momDiff = score - previous.dims[dimKey];
            var momRate = previous.dims[dimKey] > 0 ? Math.round(momDiff / previous.dims[dimKey] * 100) : 0;
            
            var trendIcon = momDiff > 3 ? '📈' : (momDiff < -3 ? '📉' : '➡️');
            var trendText = '';
            if (momDiff > 5) {
                trendText = '环比大幅提升' + momDiff + '分（+' + momRate + '%），改善势头强劲。';
            } else if (momDiff > 0) {
                trendText = '环比提升' + momDiff + '分（+' + momRate + '%），平稳改善。';
            } else if (momDiff < -5) {
                trendText = '环比大幅下滑' + Math.abs(momDiff) + '分（-' + Math.abs(momRate) + '%），恶化趋势明显！';
            } else if (momDiff < 0) {
                trendText = '环比下滑' + Math.abs(momDiff) + '分（-' + Math.abs(momRate) + '%），需关注。';
            } else {
                trendText = '环比持平，无显著变化。';
            }
            
            trendPart = '<div class="insight-dim-trend"><span class="insight-dim-trend-icon">' + trendIcon + '</span> ' + trendText + '</div>';
        }
        
        // 2. 对标分析（与行业平均、历史最佳）
        var industryDimAvg = { d1: 80, d2: 70, d3: 75, d4: 70, d5: 80, d6: 75 }; // 假设行业平均
        var dimBest = 0;
        try {
            var allMonths2 = Object.keys(RADAR_HISTORY_LPSD || {});
            allMonths2.forEach(function(m) {
                var d = RADAR_HISTORY_LPSD[m];
                if (d && d.dims && d.dims[dimKey]) {
                    if (d.dims[dimKey] > dimBest) dimBest = d.dims[dimKey];
                }
            });
        } catch(e) {}
        
        var vsIndustryDim = score - (industryDimAvg[dimKey] || 75);
        var vsBestDim = dimBest > 0 ? score - dimBest : 0;
        
        benchmarkPart = '<div class="insight-dim-benchmark">' +
                       '<p>📏 <strong>对标：</strong>vs行业平均' + (vsIndustryDim >= 0 ? '+' : '') + vsIndustryDim + '分 ' + (vsIndustryDim >= 0 ? '✅' : '⚠️') + 
                       ' | vs历史最佳' + (vsBestDim >= 0 ? '+' : '') + vsBestDim + '分 ' + (vsBestDim >= 0 ? '🎯' : '📈') + '</p>' +
                       '</div>';
        
        // 3. 归因分析（从具体指标中提取根因）
        var rootCauseAnalysis = '';
        var dimCompKey = '_dimComparison_' + dimKey;
        if (current[dimCompKey] && current[dimCompKey].items) {
            var items = current[dimCompKey].items;
            var badItems = [];

            items.forEach(function(item) {
                var isCost = item.name.indexOf('成本') >= 0;
                var isMom = current[dimCompKey].format === 'mom';
                var rate = isMom ? calcMom(item.curr, item.prev) : calcAchv(item.actual, item.target, isCost);
                if (rate < 85) {
                    var actualVal = isMom ? item.curr : item.actual;
                    var targetVal = isMom ? item.prev : item.target;
                    badItems.push({
                        name: item.name,
                        actual: actualVal,
                        target: targetVal,
                        unit: item.unit,
                        rate: rate,
                        rootCause: rate < 60 ? '严重落后，需立即干预' : '明显落后，需制定改进计划'
                    });
                }
            });

            if (badItems.length > 0) {
                rootCauseAnalysis = '<div class="insight-dim-rootcause">' +
                                  '<p>🔍 <strong>根因分析（未达标指标）：</strong></p>' +
                                  '<ul>' + badItems.map(function(b) {
                                      return '<li><strong>' + b.name + '</strong>：实际' + fmtNum(b.actual) + b.unit + ' / 目标' + fmtNum(b.target) + b.unit + '（达成率' + fmtRate(b.rate) + '）- ' + b.rootCause + '</li>';
                                  }).join('') + '</ul>' +
                                  '</div>';
            } else {
                rootCauseAnalysis = '<div class="insight-dim-rootcause"><p>✅ 该维度下所有指标均达标或接近达标，无显著风险点。</p></div>';
            }
        } else {
            // D3-D6 无KPI明细数据，展示为定性评估
            rootCauseAnalysis = '<div class="insight-dim-rootcause"><p>📋 <strong>定性评估：</strong>该维度暂无明细KPI数据，分数基于定性综合评估。详细数据待迪克化学提供完整KPI考核表后补充。</p></div>';
        }
        
        // 4. 改进建议（具体可执行）
        var suggestionText = '';
        if (score < 60) {
            suggestionText = '<div class="insight-dim-suggestion bad">🔴 <strong>紧急建议：</strong>该维度得分' + score + '分，已处于高风险区间。建议：1）本周内召开专项分析会，锁定根因；2）制定30天改进计划，明确责任人和里程碑；3）增加监测频率（周报→日报）。</div>';
        } else if (score < 75) {
            suggestionText = '<div class="insight-dim-suggestion warn">🟡 <strong>改进建议：</strong>该维度得分' + score + '分，有提升空间。建议：1）分析标杆案例，学习最佳实践；2）设定下月提升目标（至少+5分）；3）加强过程指标监控。</div>';
        } else if (score < 90) {
            suggestionText = '<div class="insight-dim-suggestion good">🟢 <strong>优化建议：</strong>该维度得分' + score + '分，表现良好。建议：1）巩固优势，形成可复制的经验；2）挑战更高目标（90+分）；3）关注边缘指标，防止下滑。</div>';
        } else {
            suggestionText = '<div class="insight-dim-suggestion excellent">🎯 <strong>保持建议：</strong>该维度得分' + score + '分，表现优秀。建议：1）总结成功模式，内部推广；2）设定行业标杆目标；3）防范自满情绪，持续创新。</div>';
        }
        
        result.dims.push({
            icon: '📈',
            title: dimDef.name + '深度诊断',
            content: trendPart + benchmarkPart + rootCauseAnalysis + suggestionText
        });
    });
    
    // === 问题预警：风险分析（增加根因分析、业务影响、历史趋势）===
    var riskAnalysis = '';
    var problems = [];
    var riskLevelCounts = { high: 0, medium: 0, low: 0 };
    
    // 辅助函数：分析维度根因
    function analyzeDimRootCause(dimKey, current) {
        var dimCompKey = '_dimComparison_' + dimKey;
        if (!current[dimCompKey] || !current[dimCompKey].items) {
            // D3-D6 无明细数据，定性评估维度
            return '定性评估维度，暂无明细KPI数据，需补充完整KPI考核表';
        }
        
        var items = current[dimCompKey].items;
        var badItems = [];
        
        items.forEach(function(item) {
            var isCost = item.name.indexOf('成本') >= 0;
            var isMom = current[dimCompKey].format === 'mom';
            var rate = isMom ? calcMom(item.curr, item.prev) : calcAchv(item.actual, item.target, isCost);
            if (rate < 85) {
                badItems.push({
                    name: item.name,
                    rate: rate,
                    actual: isMom ? item.curr : item.actual,
                    target: isMom ? item.prev : item.target,
                    unit: item.unit
                });
            }
        });
        
        if (badItems.length === 0) {
            return '维度得分低，但具体指标均达标，可能是综合评估模型问题';
        }
        
        // 找出最差的项
        badItems.sort(function(a, b) { return a.rate - b.rate; });
        var worst = badItems[0];
        
        return '主要拖累指标：' + worst.name + '（达成率' + fmtRate(worst.rate) + '），实际值' + fmtNum(worst.actual) + worst.unit + '，目标值' + fmtNum(worst.target) + worst.unit;
    }
    
    // 辅助函数：分析KPI根因
    function analyzeKpiRootCause(item) {
        var isCost = item.name.indexOf('成本') >= 0;
        var achv = calcAchv(item.actual, item.target, isCost);
        
        // 根据KPI类型分析根因
        if (item.name.indexOf('营收') >= 0 || item.name.indexOf('收入') >= 0) {
            return '营收未达标，可能原因：1）市场需求不足；2）竞争对手抢占份额；3）产品竞争力下降；4）销售团队执行力不足';
        } else if (item.name.indexOf('成本') >= 0) {
            return '成本超标，可能原因：1）原材料价格上涨；2）生产效率低下；3）浪费严重；4）供应链成本上升';
        } else if (item.name.indexOf('利润') >= 0 || item.name.indexOf('毛利') >= 0) {
            if (item.actual < 0) {
                return '实际亏损' + fmtNum(Math.abs(item.actual)) + item.unit + '，需分析亏损根因（定价/成本/销量/产能利用率）';
            }
            return '利润未达标，可能原因：1）营收未达标；2）成本超标；3）费用控制不力；4）产品结构不合理';
        } else if (item.name.indexOf('客户') >= 0) {
            return '客户指标未达标，可能原因：1）产品质量问题；2）服务不到位；3）客户流失；4）新客户获取不足';
        } else {
            return '达成率' + fmtRate(achv) + '，未达标，需进一步分析具体原因';
        }
    }
    
    // 辅助函数：分析历史趋势
    function analyzeHistoryTrend(key, type) {
        var history = RADAR_HISTORY_LPSD || {};
        var months = Object.keys(history).sort();
        
        if (months.length < 2) {
            return '首次出现';
        }
        
        var continuousMonths = 0;
        for (var i = months.length - 1; i >= 0; i--) {
            var m = months[i];
            var d = history[m];
            if (!d) continue;
            
            if (type === 'dim') {
                if (d.dims && d.dims[key] !== undefined && d.dims[key] < 75) {
                    continuousMonths++;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        
        if (continuousMonths >= 3) {
            return '连续' + continuousMonths + '个月存在问题（持续性风险！）';
        } else if (continuousMonths >= 2) {
            return '连续' + continuousMonths + '个月存在问题（需密切关注）';
        } else {
            return '本月新出现';
        }
    }
    
    // 维度风险
    dimKeys.forEach(function(k) {
        if (current.dims[k] < 60) {
            var dimName = DIMS_DEF_LPSD.find(function(d){return d.id===k;}).name;
            var rootCause = analyzeDimRootCause(k, current);
            var historyTrend = analyzeHistoryTrend(k, 'dim');
            var businessImpact = '';
            
            // 根据维度类型分析业务影响
            if (k === 'd1') {
                businessImpact = '财务表现差，可能导致Q2营收/利润目标无法达成，影响公司现金流和盈利能力';
            } else if (k === 'd2') {
                businessImpact = '客户指标差，可能导致客户流失率上升，影响长期营收稳定性';
            } else if (k === 'd3') {
                businessImpact = '内部流程效率低，可能导致运营成本上升，客户满意度下降';
            } else if (k === 'd4') {
                businessImpact = '学习成长不足，可能导致团队能力跟不上业务发展，长期竞争力下降';
            } else if (k === 'd5') {
                businessImpact = '市场表现差，可能导致市场份额下降，品牌影响力减弱';
            } else if (k === 'd6') {
                businessImpact = '供应链表现差，可能导致生产成本上升，交货延迟，客户满意度下降';
            }
            
            problems.push({
                type: 'dimension',
                name: dimName,
                detail: '得分仅' + current.dims[k] + '分（<60分风险线）',
                level: 'high',
                impact: businessImpact,
                rootCause: rootCause,
                history: historyTrend,
                action: '建议：1）本周内召开专项分析会；2）制定30天改进计划；3）增加监测频率（周报→日报）'
            });
            riskLevelCounts.high++;
        } else if (current.dims[k] < 75) {
            var dimName = DIMS_DEF_LPSD.find(function(d){return d.id===k;}).name;
            var rootCause = analyzeDimRootCause(k, current);
            var historyTrend = analyzeHistoryTrend(k, 'dim');
            
            problems.push({
                type: 'dimension',
                name: dimName,
                detail: '得分' + current.dims[k] + '分（75分警戒线）',
                level: 'medium',
                impact: '存在下滑至风险区的风险，需提前干预',
                rootCause: rootCause,
                history: historyTrend,
                action: '建议：1）分析标杆案例；2）设定下月提升目标（+5分）；3）加强过程指标监控'
            });
            riskLevelCounts.medium++;
        }
    });
    
    // KPI风险
    if (current._kpiComparison && current._kpiComparison.items) {
        current._kpiComparison.items.forEach(function(item) {
            var isCost = item.name.indexOf('成本') >= 0;
            var achv = calcAchv(item.actual, item.target, isCost);
            // 零事故/零投诉类指标：actual=0&target=0 表示达标，跳过风险告警
            if (isZeroGoodMetric(item)) return;
            if (achv < 60) {
                var rootCause = analyzeKpiRootCause(item);
                problems.push({
                    type: 'kpi',
                    name: item.name,
                    detail: '达成率仅' + fmtRate(achv) + '，实际' + fmtNum(item.actual) + item.unit + ' / 目标' + fmtNum(item.target) + item.unit,
                    level: 'high',
                    impact: '严重影响公司经营目标达成，可能导致年度KPI考核不达标',
                    rootCause: rootCause,
                    history: '需结合历史数据分析',
                    action: '建议：1）立即召开KPI分析会；2）制定紧急提升计划；3）每日跟踪进度'
                });
                riskLevelCounts.high++;
            } else if (achv < 85) {
                var rootCause = analyzeKpiRootCause(item);
                problems.push({
                    type: 'kpi',
                    name: item.name,
                    detail: '达成率' + fmtRate(achv) + '，实际' + fmtNum(item.actual) + item.unit + ' / 目标' + fmtNum(item.target) + item.unit,
                    level: 'medium',
                    impact: '可能影响季度/年度目标达成，需加快进度',
                    rootCause: rootCause,
                    history: '需结合历史数据分析',
                    action: '建议：1）分析差距原因；2）制定提升计划；3）每周跟踪进度'
                });
                riskLevelCounts.medium++;
            }
        });
    }
    
    // 风险矩阵展示
    var riskMatrixHtml = '<div class="insight-risk-matrix">' +
                        '<div class="insight-risk-level high">🔴 高风险（' + riskLevelCounts.high + '项）- 需48小时内响应</div>' +
                        '<div class="insight-risk-level medium">🟡 中风险（' + riskLevelCounts.medium + '项）- 需本周内响应</div>' +
                        '<div class="insight-risk-level low">🟢 低风险（' + riskLevelCounts.low + '项）- 需持续监控</div>' +
                        '</div>';
    
    if (problems.length > 0) {
        riskAnalysis = '<div class="insight-risk-analysis">' +
                      '<p>⚠️ <strong>风险扫描结果：</strong>发现' + problems.length + '项风险，其中<strong class="high">高风险' + riskLevelCounts.high + '项</strong>、<strong class="medium">中风险' + riskLevelCounts.medium + '项</strong></p>' +
                      riskMatrixHtml +
                      '<div class="insight-problems-detail">' +
                      problems.map(function(p, i) {
                          var levelIcon = p.level === 'high' ? '🔴' : (p.level === 'medium' ? '🟡' : '🟢');
                          return '<div class="insight-problem-card ' + p.level + '">' +
                                 '<div class="insight-problem-header">' +
                                 '<span class="insight-problem-level">' + levelIcon + ' ' + p.level.toUpperCase() + '</span>' +
                                 '<span class="insight-problem-name"><strong>' + p.name + '</strong></span>' +
                                 '</div>' +
                                 '<div class="insight-problem-body">' +
                                 '<p class="insight-problem-detail">📊 ' + p.detail + '</p>' +
                                 '<p class="insight-problem-history">📈 历史趋势：' + p.history + '</p>' +
                                 '<p class="insight-problem-impact">⚠️ 业务影响：' + p.impact + '</p>' +
                                 '<p class="insight-problem-rootcause">🔍 根因分析：' + p.rootCause + '</p>' +
                                 '<p class="insight-problem-action">💡 建议行动：' + p.action + '</p>' +
                                 '</div>' +
                                 '</div>';
                      }).join('') +
                      '</div>' +
                      '</div>';
    } else {
        riskAnalysis = '<div class="insight-risk-analysis"><p>✅ 风险扫描结果：暂无重大风险预警，经营状况健康。</p></div>';
    }
    
    result.issues.push({
        icon: '🚨',
        title: '问题预警分析',
        content: riskAnalysis
    });
    
    // === 积极进展：亮点分析（增加可复制性评估）===
    var highlightAnalysis = '';
    var positives = [];
    var highlightCount = { replicable: 0, momentum: 0, breakthrough: 0 };
    
    // 维度亮点
    if (previous) {
        dimKeys.forEach(function(k) {
            if (current.dims[k] > previous.dims[k]) {
                var dimName = DIMS_DEF_LPSD.find(function(d){return d.id===k;}).name;
                var diff = current.dims[k] - previous.dims[k];
                var type = diff >= 5 ? 'breakthrough' : 'momentum';
                positives.push({
                    type: type,
                    name: dimName,
                    detail: '提升+' + diff + '分',
                    replicable: diff >= 5 ? '突破性强，需分析成功要素' : '势头良好，可巩固推广'
                });
                highlightCount[type]++;
            }
        });
    }
    
    // KPI亮点
    if (current._kpiComparison && current._kpiComparison.items) {
        current._kpiComparison.items.forEach(function(item) {
            var isCost = item.name.indexOf('成本') >= 0;
            var achv = calcAchv(item.actual, item.target, isCost);
            // 零事故/零投诉类指标作为亮点
            if (isZeroGoodMetric(item)) {
                positives.push({
                    type: 'momentum',
                    name: item.name,
                    detail: '零事故，安全合规优秀',
                    replicable: '继续保持，强化安全管理'
                });
                highlightCount.momentum++;
                return;
            }
            if (achv >= 110) {
                positives.push({
                    type: 'breakthrough',
                    name: item.name,
                    detail: '达成率' + fmtRate(achv) + '（超预期）',
                    replicable: '大幅超标，需复盘成功模式'
                });
                highlightCount.breakthrough++;
            } else if (achv >= 100) {
                positives.push({
                    type: 'momentum',
                    name: item.name,
                    detail: '达成率' + fmtRate(achv),
                    replicable: '精准达标，经验可复制'
                });
                highlightCount.momentum++;
            }
        });
    }
    
    if (positives.length > 0) {
        highlightAnalysis = '<div class="insight-highlight-analysis">' +
                          '<p>🎉 <strong>亮点扫描：</strong>发现' + positives.length + '项积极进展</p>' +
                          '<ul class="insight-highlight-list">' +
                          positives.map(function(p, i) {
                              var typeIcon = p.type === 'breakthrough' ? '🚀' : (p.type === 'momentum' ? '📈' : '⭐');
                              return '<li class="insight-highlight-item ' + p.type + '">' +
                                     '<span class="insight-highlight-icon">' + typeIcon + '</span>' +
                                     '<span class="insight-highlight-name"><strong>' + p.name + '</strong></span>' +
                                     '<span class="insight-highlight-detail">' + p.detail + '</span>' +
                                     '<span class="insight-highlight-replicable">💡 ' + p.replicable + '</span>' +
                                     '</li>';
                          }).join('') +
                          '</ul>' +
                          '<p class="insight-highlight-summary">💪 建议：总结亮点经验，形成可复制的最佳实践，推广至其他维度/团队。</p>' +
                          '</div>';
    } else {
        highlightAnalysis = '<div class="insight-highlight-analysis"><p>📊 暂无显著增长亮点，维持现有水平。建议：主动寻找突破点，设定挑战性目标。</p></div>';
    }
    
    result.progress.push({
        icon: '🎉',
        title: '积极进展分析',
        content: highlightAnalysis
    });
    
    // === 改进建议：行动方案（增加具体举措、指标达标路径、资源需求、预期效果）===
    var actionPlan = '';
    var actions = [];
    var actionCounts = { urgent: 0, important: 0, normal: 0 };
    
    // 辅助函数：生成维度改进建议
    function generateDimAction(dimKey, current, previous) {
        var score = current.dims[dimKey];
        var dimName = DIMS_DEF_LPSD.find(function(d){return d.id===dimKey;}).name;
        var priority = score < 60 ? 'urgent' : 'important';
        var timeline = score < 60 ? '本周内启动，30天内见效' : '本月内启动，60天内见效';
        
        // 分析需要提升多少分
        var targetScore = score < 60 ? 75 : 85; // 目标：脱离风险区或达到良好
        var needImprove = targetScore - score;
        
        // 生成具体举措（根据维度类型）
        var specificActions = [];
        var resources = [];
        var expectedEffect = '';
        
        if (dimKey === 'd1') { // 财务表现
            specificActions = [
                '建议财务部在2周内完成成本结构分析，识别成本超支点',
                '建议销售部在1个月内提升营收5-8%，通过拓展新客户/新产品线',
                '建议运营部在2周内优化费用结构，削减非必要支出10-15%'
            ];
            resources = ['财务分析工具', '销售数据分析支持', '费用监控系统'];
            expectedEffect = '预计下月财务维度得分可提升至' + (score + Math.min(10, needImprove)) + '分';
        } else if (dimKey === 'd2') { // 客户指标
            specificActions = [
                '建议客服部在本周内回访流失客户，了解流失原因并制定挽留方案',
                '建议产品部在2周内修复TOP3客户投诉问题，提升产品质量',
                '建议市场部在1个月内启动客户满意度提升活动，目标提升5分'
            ];
            resources = ['客服培训', '产品优化资源', '市场活动预算'];
            expectedEffect = '预计下月客户维度得分可提升至' + (score + Math.min(8, needImprove)) + '分';
        } else if (dimKey === 'd3') { // 内部流程
            specificActions = [
                '建议流程优化团队在2周内完成流程瓶颈分析，识别TOP3瓶颈',
                '建议IT部在1个月内上线流程自动化工具，提升效率20%',
                '建议运营部在2周内建立流程监控仪表盘，实时监控'
            ];
            resources = ['流程优化顾问', 'IT开发资源', '流程监控工具'];
            expectedEffect = '预计下月内部流程维度得分可提升至' + (score + Math.min(7, needImprove)) + '分';
        } else if (dimKey === 'd4') { // 学习成长
            specificActions = [
                '建议HR在2周内完成团队能力评估，识别能力缺口并制定培训计划',
                '建议培训部在1个月内启动核心技能培训项目，覆盖80%核心员工',
                '建议各部门在2周内建立导师制，传承经验给新员工'
            ];
            resources = ['培训预算', '外部讲师', '内部导师激励'];
            expectedEffect = '预计下月学习成长维度得分可提升至' + (score + Math.min(6, needImprove)) + '分';
        } else if (dimKey === 'd5') { // 市场表现
            specificActions = [
                '建议市场部在2周内完成竞品分析，识别差距并制定超越策略',
                '建议品牌部在1个月内启动品牌提升活动，目标提升品牌认知度10%',
                '建议销售部在2周内拓展2-3个新渠道/新客户群体'
            ];
            resources = ['市场调研预算', '品牌活动预算', '销售渠道资源'];
            expectedEffect = '预计下月市场表现维度得分可提升至' + (score + Math.min(9, needImprove)) + '分';
        } else if (dimKey === 'd6') { // 供应链
            specificActions = [
                '建议供应链部在2周内完成供应商评估，优化供应商结构，降低成本5%',
                '建议采购部在1个月内完成成本谈判，降低采购成本3-5%',
                '建议物流部在2周内优化配送路线，提升配送效率15%'
            ];
            resources = ['供应商管理系统', '采购成本分析工具', '物流优化顾问'];
            expectedEffect = '预计下月供应链维度得分可提升至' + (score + Math.min(8, needImprove)) + '分';
        }
        
        return {
            priority: priority,
            name: dimName,
            detail: '得分' + score + '分，需提升' + needImprove + '分至' + targetScore + '分',
            actions: specificActions,
            resources: resources,
            expectedEffect: expectedEffect,
            timeline: timeline,
            owner: score < 60 ? '事业部部长+分管副总' : '事业部部长'
        };
    }
    
    // 辅助函数：生成KPI改进建议
    function generateKpiAction(item) {
        var isCost = item.name.indexOf('成本') >= 0;
        var achv = calcAchv(item.actual, item.target, isCost);
        var gap = isCost ? (item.actual - item.target) : (item.target - item.actual); // 成本：实际-目标=超标量；其他：目标-实际=缺口
        var gapRate = Math.abs(gap / item.target * 100);
        
        var priority = achv < 60 ? 'urgent' : 'important';
        var timeline = achv < 60 ? '立即启动，每周跟踪' : '本月内启动，双周跟踪';
        
        // 生成具体举措（根据KPI类型）
        var specificActions = [];
        var resources = [];
        var expectedEffect = '';
        
        if (item.name.indexOf('营收') >= 0 || item.name.indexOf('收入') >= 0) {
            specificActions = [
                '建议销售部在1周内制定营收提升计划，明确增长点（新客户/老客户/新产品）',
                '建议市场部在2周内加大市场投放，提升线索量20-30%',
                '建议客服部在1周内提升转化率15%，通过优化话术/流程'
            ];
            resources = ['销售激励预算', '市场投放预算', '客服培训'];
            expectedEffect = '预计下月营收可达' + fmtNum(item.actual * 1.1) + item.unit + '，达成率提升至' + fmtRate(achv * 1.1);
        } else if (item.name.indexOf('成本') >= 0) {
            specificActions = [
                '建议采购部在1周内完成成本分析，识别成本超支点（原材料/人工/制造费用）',
                '建议生产部在2周内优化生产效率，降低单位成本5-8%',
                '建议财务部在1周内建立成本监控机制，每日跟踪异常'
            ];
            resources = ['成本分析工具', '生产效率提升顾问', '成本监控系统'];
            expectedEffect = '预计下月成本可降至' + fmtNum(item.actual * 0.95) + item.unit + '，达成率提升至' + fmtRate(calcAchv(item.actual * 0.95, item.target, true));
        } else if (item.name.indexOf('利润') >= 0 || item.name.indexOf('毛利') >= 0) {
            specificActions = [
                '建议财务部在1周内完成利润结构分析，识别利润流失点（低毛利产品/高费用部门）',
                '建议销售部在2周内提升高毛利产品占比至60%以上',
                '建议运营部在1周内削减非必要费用10-15%'
            ];
            resources = ['利润分析模型', '产品结构调整方案', '费用控制机制'];
            expectedEffect = '预计下月利润可达' + fmtNum(item.actual * 1.08) + item.unit + '，达成率提升至' + fmtRate(achv * 1.08);
        } else if (item.name.indexOf('客户') >= 0) {
            specificActions = [
                '建议客服部在1周内完成客户满意度调查，识别TOP3痛点',
                '建议产品部在2周内修复TOP客户投诉问题（质量/交付/服务）',
                '建议市场部在1个月内启动客户关怀活动，提升满意度5-8分'
            ];
            resources = ['客户满意度调研', '产品优化资源', '客户关怀预算'];
            expectedEffect = '预计下月客户指标可达' + fmtNum(item.actual * 1.05) + item.unit + '，达成率提升至' + fmtRate(achv * 1.05);
        } else {
            specificActions = [
                '建议相关部门在1周内分析未达标原因（市场/产品/团队/流程）',
                '建议制定提升计划，明确举措、时间表、责任人',
                '建议建立跟踪机制，每周复盘进度，及时调整策略'
            ];
            resources = ['分析工具', '跟踪系统'];
            expectedEffect = '预计下月可达标（达成率100%）';
        }
        
        return {
            priority: priority,
            name: item.name,
            detail: '达成率' + fmtRate(achv) + '，实际' + fmtNum(item.actual) + item.unit + ' / 目标' + fmtNum(item.target) + item.unit + '，缺口' + fmtNum(Math.abs(gap)) + item.unit,
            actions: specificActions,
            resources: resources,
            expectedEffect: expectedEffect,
            timeline: timeline,
            owner: achv < 60 ? '事业部部长+KPI负责人+分管副总' : '事业部部长+KPI负责人'
        };
    }
    
    // 维度改进建议
    dimKeys.forEach(function(k) {
        if (current.dims[k] < 75) {
            var action = generateDimAction(k, current, previous);
            actions.push(action);
            actionCounts[action.priority]++;
        }
    });
    
    // KPI改进建议
    if (current._kpiComparison && current._kpiComparison.items) {
        var badKpis = current._kpiComparison.items.filter(function(item) {
            // 零事故/零投诉类指标：actual=0&target=0 表示达标，排除
            if (isZeroGoodMetric(item)) return false;
            var isCost = item.name.indexOf('成本') >= 0;
            var achv = calcAchv(item.actual, item.target, isCost);
            return achv < 100;
        });
        if (badKpis.length > 0) {
            badKpis.forEach(function(item) {
                var action = generateKpiAction(item);
                actions.push(action);
                actionCounts[action.priority]++;
            });
        }
    }
    
    if (actions.length > 0) {
        // 按优先级排序
        var priorityOrder = { urgent: 0, important: 1, normal: 2 };
        actions.sort(function(a, b) { return priorityOrder[a.priority] - priorityOrder[b.priority]; });
        
        actionPlan = '<div class="insight-action-plan">' +
                     '<p>🎯 <strong>行动建议：</strong>建议优先处理' + actionCounts.urgent + '项紧急事项，' + actionCounts.important + '项重要事项</p>' +
                     '<div class="insight-action-timeline">' +
                     '<div class="insight-action-phase urgent">🔴 紧急（本周启动）：' + actionCounts.urgent + '项</div>' +
                     '<div class="insight-action-phase important">🟡 重要（本月启动）：' + actionCounts.important + '项</div>' +
                     '<div class="insight-action-phase normal">🟢 常规（下月启动）：' + actionCounts.normal + '项</div>' +
                     '</div>' +
                     '<div class="insight-actions-detail">' +
                     actions.map(function(a, i) {
                         var priorityLabel = a.priority === 'urgent' ? '🔴 紧急' : (a.priority === 'important' ? '🟡 重要' : '🟢 常规');
                         var actionsHtml = '<ul>' + a.actions.map(function(action) { return '<li>' + action + '</li>'; }).join('') + '</ul>';
                         var resourcesHtml = '<p><strong>所需资源：</strong>' + a.resources.join('、') + '</p>';
                         return '<div class="insight-action-card ' + a.priority + '">' +
                                '<div class="insight-action-header">' +
                                '<span class="insight-action-priority">' + priorityLabel + '</span>' +
                                '<span class="insight-action-name"><strong>' + a.name + '</strong></span>' +
                                '</div>' +
                                '<div class="insight-action-body">' +
                                '<p class="insight-action-detail">📊 ' + a.detail + '</p>' +
                                '<p class="insight-action-timeline">⏰ 时间表：' + a.timeline + '</p>' +
                                '<p class="insight-action-owner">👤 责任人：' + a.owner + '</p>' +
                                '<div class="insight-action-actions"><strong>💡 具体举措：</strong>' + actionsHtml + '</div>' +
                                resourcesHtml +
                                '<p class="insight-action-effect">🎯 预期效果：' + a.expectedEffect + '</p>' +
                                '</div>' +
                                '</div>';
                     }).join('') +
                     '</div>' +
                     '</div>';
    } else {
        actionPlan = '<div class="insight-action-plan"><p>✅ 各项指标表现良好，无需特别改进。建议：保持现状，追求卓越。</p></div>';
    }
    
    result.suggestions.push({
        icon: '💡',
        title: '改进建议与行动计划',
        content: actionPlan
    });
    
    return result;
}

function renderInsights() {
    var data = getRadarDataForInsights();
    if (!data) {
        document.getElementById('ai-panel-summary').innerHTML = '<div class="ai-insights-loading">暂无数据</div>';
        return;
    }
    
    var insights = generateLocalInsights(data);
    
    // 渲染综合表现面板
    var summaryHtml = '';
    insights.summary.forEach(function(insight) {
        summaryHtml += '<div class="ai-insight-card"><div class="ai-insight-card-header">' +
                     '<span class="ai-insight-card-icon">' + insight.icon + '</span>' +
                     '<span class="ai-insight-card-title">' + insight.title + '</span></div>' +
                     '<div class="ai-insight-card-body">' + insight.content + '</div></div>';
    });
    document.getElementById('ai-panel-summary').innerHTML = summaryHtml;
    
    // 渲染维度分析面板（抽屉结构）
    var dimsCardsHtml = '';
    insights.dims.forEach(function(insight) {
        dimsCardsHtml += '<div class="ai-insight-card"><div class="ai-insight-card-header">' +
                   '<span class="ai-insight-card-icon">' + insight.icon + '</span>' +
                   '<span class="ai-insight-card-title">' + insight.title + '</span></div>' +
                   '<div class="ai-insight-card-body">' + insight.content + '</div></div>';
    });
    // 渲染维度分析面板（标签切换结构）
    var dimsHtml = '<div class="dims-tabs-header">' +
                   '<span class="dims-tabs-title">维度分析：</span>' +
                   insights.dims.map(function(insight, idx) {
                       return '<button class="dims-tab-btn' + (idx === 0 ? ' active' : '') + 
                              '" onclick="switchDimTab(' + idx + ')">' + insight.title + '</button>';
                   }).join('') +
                   '</div>' +
                   insights.dims.map(function(insight, idx) {
                       return '<div class="dims-tab-content' + (idx === 0 ? ' active' : '') + 
                              '" id="dimTab' + idx + '">' +
                              '<div class="ai-insight-card"><div class="ai-insight-card-header">' +
                              '<span class="ai-insight-card-icon">' + insight.icon + '</span>' +
                              '<span class="ai-insight-card-title">' + insight.title + '</span></div>' +
                              '<div class="ai-insight-card-body">' + insight.content + '</div></div>' +
                              '</div>';
                   }).join('');
    document.getElementById('ai-panel-dims').innerHTML = dimsHtml;
    
    // 渲染问题预警面板
    var issuesHtml = '';
    insights.issues.forEach(function(insight) {
        issuesHtml += '<div class="ai-insight-card"><div class="ai-insight-card-header">' +
                     '<span class="ai-insight-card-icon">' + insight.icon + '</span>' +
                     '<span class="ai-insight-card-title">' + insight.title + '</span></div>' +
                     '<div class="ai-insight-card-body">' + insight.content + '</div></div>';
    });
    document.getElementById('ai-panel-issues').innerHTML = issuesHtml;
    
    // 渲染积极进展面板
    var progressHtml = '';
    insights.progress.forEach(function(insight) {
        progressHtml += '<div class="ai-insight-card"><div class="ai-insight-card-header">' +
                      '<span class="ai-insight-card-icon">' + insight.icon + '</span>' +
                      '<span class="ai-insight-card-title">' + insight.title + '</span></div>' +
                      '<div class="ai-insight-card-body">' + insight.content + '</div></div>';
    });
    document.getElementById('ai-panel-progress').innerHTML = progressHtml;
    
    // 渲染改进建议面板
    var suggestionsHtml = '';
    insights.suggestions.forEach(function(insight) {
        suggestionsHtml += '<div class="ai-insight-card"><div class="ai-insight-card-header">' +
                       '<span class="ai-insight-card-icon">' + insight.icon + '</span>' +
                       '<span class="ai-insight-card-title">' + insight.title + '</span></div>' +
                       '<div class="ai-insight-card-body">' + insight.content + '</div></div>';
    });
    document.getElementById('ai-panel-suggestions').innerHTML = suggestionsHtml;
}

function switchInsightPanel(panelId) {
    // 更新左侧导航状态
    document.querySelectorAll('.ai-insights-nav-item').forEach(function(item) {
        item.classList.remove('active');
    });
    document.querySelector('.ai-insights-nav-item[data-panel="' + panelId + '"]').classList.add('active');
    
    // 更新右侧内容显示
    document.querySelectorAll('.ai-insights-panel').forEach(function(panel) {
        panel.classList.remove('active');
    });
    document.getElementById('ai-panel-' + panelId).classList.add('active');
}

function switchDimTab(idx) {
    // 更新标签按钮状态
    document.querySelectorAll('.dims-tab-btn').forEach(function(btn) {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.dims-tab-btn')[idx].classList.add('active');
    
    // 更新标签内容显示
    document.querySelectorAll('.dims-tab-content').forEach(function(content) {
        content.classList.remove('active');
    });
    document.getElementById('dimTab' + idx).classList.add('active');
}

function refreshInsights() {
    document.querySelectorAll('.ai-insights-panel').forEach(function(panel) {
        panel.innerHTML = '<div class="ai-insights-loading">🤖 AI正在重新分析数据...</div>';
    });
    setTimeout(renderInsights, 500);
}

// 初始化
(function init() {
    renderMonthSwitcher();
    initTimeline();
    renderAll();
})();
