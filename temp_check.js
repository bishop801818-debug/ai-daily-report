
//══════════════════════════════════════════════════════
// SDMD 真实数据（从 index_v3.html RADAR_HISTORY 迁移）
// ══════════════════════════════════════════════════════

const BU_META_SDMD = {
    name: '山东美多',
    subtitle: '动力电池回收 · 梯次利用 · 再生利用',
    color: '#3A6A9E',
    accent: '#3A6A9E',
};

// 维度定义
const DIMS_DEF = [
    { id: 'd1', name: '核心考核指标', color: '#3A6A9E' },
    { id: 'd2', name: '经营效益',     color: '#3A6A9E' },
    { id: 'd3', name: '运营效率',     color: '#3A6A9E' },
    { id: 'd4', name: '技术创新力',  color: '#3A6A9E' },
    { id: 'd5', name: '风险合规',     color: '#3A6A9E' },
    { id: 'd6', name: '组织活力',     color: '#3A6A9E' },
];

// RADAR_HISTORY - 三个月完整数据
const RADAR_HISTORY_SDMD = {
    '2026-03': {
        dims: { d1: 100, d2: 100, d3: 92, d4: 87, d5: 85, d6: 78 },
        kpis: {
            d1: [100.0, 100.0, 100.0, 100.0],
            d2: [100.0, 100.0, 100.0, 100.0],
            d3: [95.2, 107.5, 57.4, 107.2],
            d4: [100.0, 80.0, 80.0, null],
            d5: [82.3, 108.0, 100.0, 50.0],
            d6: [60.0, 60.0, 90.0, 100.0],
        },
    },
    '2026-04': {
        dims: { d1: 100, d2: 88, d3: 90, d4: 100, d5: 78, d6: 75 },
        kpis: {
            d1: [99.9, 100.0, 99.0, 100.0],
            d2: [100.0, 75.0, 77.1, 101.4],
            d3: [98.4, 100.0, 74.6, 86.9],
            d4: [120.0, 120.0, 100.0, null],
            d5: [110.4, 120.0, 78.9, 100.0],
            d6: [70.0, 60.0, 90.0, 90.0],
        },
    },
    '2026-05': {
        dims: { d1: 90, d2: 90, d3: 82, d4: 80, d5: 90, d6: 78 },
        kpis: {
            d1: [94.9, 93.5, 81.6, 100.0],
            d2: [102.9, 85.6, 77.0, 105.3],
            d3: [84.1, 95.2, 71.0, 81.6],
            d4: [72.7, 71.4, 100.0, null],
            d5: [108.2, 120.0, 118.0, 50.0],
            d6: [80.0, 80.0, 120.0, 100.0],
        },
        _isCurrent: true,
        _kpiComparison: {
            title: '5月核心KPI达标率（预算 → 挑战目标 → 实际）',
            period: '2026年5月',
            items: [
                { name: '收入(万元)',         budget: 3778,  target: 7382,  actual: 8721,  unit: '万元' },
                { name: '毛利(万元)',         budget: 321,   target: 865,   actual: 813,   unit: '万元' },
                { name: '扣非净利润(万元)',   budget: 132,   target: 518,   actual: 480,   unit: '万元' },
                { name: '经营净利润(万元)',   budget: 148,   target: 540,   actual: 505,   unit: '万元' },
                { name: '回款(万元)',         budget: 4269,  target: 8342,  actual: 10630, unit: '万元' },
                { name: '加工成本(万/t)', budget: 1.85,  target: 1.60,  actual: 1.96,  unit: '万/t' },
                { name: '产品一次合格率',     budget: 100,   target: 100,   actual: 100,   unit: '%' },
            ],
        },
        _dimComparison_d2: {
            title: '5月产品销量达成（预算 → 目标 → 实际）',
            items: [
                { name: '碳酸锂销量(吨)', budget: 400,   target: 420,   actual: 432,   unit: '吨' },
                { name: '修复LFP交付(吨)',  budget: 300,   target: 360,   actual: 308,   unit: '吨' },
                { name: '磷铁液交付(m³)', budget: 1000,  target: 1500,  actual: 1155,  unit: 'm³' },
                { name: '元明粉销售(吨)',   budget: 1400,  target: 1500,  actual: 1580,  unit: '吨' },
            ],
        },
        _dimComparison_d3: {
            title: '5月生产效率达成（预算 → 目标 → 实际）',
            items: [
                { name: '碳酸锂投料(吨)', budget: 2100,  target: 2170,  actual: 2075.5, unit: '吨' },
                { name: '碳酸锂产出(吨)', budget: 330,   target: 420,   actual: 400,    unit: '吨' },
                { name: '磷铁液产出(m³)', budget: 1500,  target: 1550,  actual: 1100,   unit: 'm³' },
                { name: '加工成本(万/t)', budget: 1.85,  target: 1.60,  actual: 1.96,   unit: '万/t' },
            ],
        },
        _dimComparison_d4: {
            title: '技术创新力 4月→5月环比',
            format: 'mom',
            items: [
                { name: '在研课题(个)',   prev: 11,    curr: 8,     unit: '个' },
                { name: 'MCU项目(项)',    prev: 7,     curr: 5,     unit: '项' },
                { name: 'MCU降本(万元)',  prev: 18.31, curr: 5.31,  unit: '万元' },
                { name: '技改项目(项)',   prev: 9,     curr: 12,    unit: '项' },
            ],
        },
        _dimComparison_d5: {
            title: '安全环保 4月→5月环比',
            format: 'mom',
            items: [
                { name: '隐患整改率(%)',  prev: 90.83, curr: 98.3,  unit: '%' },
                { name: '安全教育(人次)', prev: 703,   curr: 2009,  unit: '人次' },
                { name: '排查隐患(项)',   prev: 2387,  curr: 2816,  unit: '项' },
                { name: '应急演练(场)',   prev: 2,     curr: 1,     unit: '场' },
            ],
        },
        _dimComparison_d6: {
            title: '组织活力 4月→5月环比',
            format: 'mom',
            items: [
                { name: 'AI项目立项(个)',    prev: 0,     curr: 16,    unit: '个' },
                { name: '获得企业荣誉(项)',  prev: 0,     curr: 2,     unit: '项' },
                { name: 'IATF审核问题(项)', prev: 46,    curr: 35,    unit: '项' },
                { name: '5S覆盖率(%)',      prev: 100,   curr: 100,   unit: '%' },
            ],
        },
        // 文字内容
        _summary: '5月整体经营表现良好，核心KPI中收入、回款超预期完成，但毛利和加工成本需重点关注。',
        _issues: [
            { title: 'D3产线制程异常', desc: '4月份月初所投入的原料中部分含有小包装且异物含量较高，导致产线效率下降', owner: '生产部' },
            { title: '加工成本超标', desc: '实际加工成本1.96万/t，超出目标1.60万/t，需优化工艺', owner: '生产部' },
            { title: '磷铁液产出不足', desc: '实际产出1100m³，目标1550m³，达成率仅71%', owner: '生产部' },
        ],
        _positives: [
            { title: '收入大幅超目标', desc: '实际8721万元，超出挑战目标7382万元达18%', owner: '销售部' },
            { title: '回款创新高', desc: '实际回款10630万元，远超目标8342万元', owner: '销售部' },
            { title: '碳酸锂产销两旺', desc: '销量432吨，产效率103%，连续3个月超100%', owner: '销售部' },
            { title: '安全环保提升', desc: '隐患整改率达98.3%，同比提升7.47个百分点', owner: 'EHS部' },
            { title: 'AI项目突破', desc: '5月新增AI项目立项16个，展现数字化转型活力', owner: '技术部' },
        ],
    },
};

// 3月/4月对比表数据（从 RADAR_HISTORY）
const RADAR_HISTORY_SDMD_EXTRA = {
    '2026-03': {
        _dimComparison_d2: {
            items: [
                { name: '碳酸锂销量(吨)',   budget: 400, target: 400, actual: 400, unit: '吨' },
                { name: '修复LFP交付(吨)', budget: 400, target: 400, actual: 400, unit: '吨' },
                { name: '磷铁液交付(m³)',  budget: 3100, target: 2000, actual: 1297, unit: 'm³' },
                { name: '元明粉销售(吨)',  budget: 1700, target: 1400, actual: 1380, unit: '吨' },
            ],
        },
        _dimComparison_d3: {
            items: [
                { name: '碳酸锂投料(吨)', budget: 2121, target: 2121, actual: 2019.5, unit: '吨' },
                { name: '碳酸锂产出(吨)', budget: 372,  target: 372,  actual: 400,   unit: '吨' },
                { name: '磷铁液产出(m³)', budget: 3100, target: 3100, actual: 1777.75, unit: 'm³' },
                { name: '加工成本(万/t)', budget: 1.78, target: 1.78, actual: 1.66,  unit: '万/t' },
            ],
        },
        _dimComparison_d4: {
            format: 'mom', items: [
                { name: '在研课题(个)', prev: 8, curr: 8, unit: '个' },
                { name: 'MCU项目(项)', prev: 4, curr: 4, unit: '项' },
                { name: 'MCU降本(万元)', prev: 43.9, curr: 43.9, unit: '万元' },
                { name: '技改项目(项)', prev: 4, curr: 4, unit: '项' },
            ],
        },
        _dimComparison_d5: {
            format: 'mom', items: [
                { name: '隐患整改率(%)', prev: 82.3, curr: 82.3, unit: '%' },
                { name: '安全教育(人次)', prev: 600, curr: 600, unit: '人次' },
                { name: '排查隐患(项)', prev: 3024, curr: 3024, unit: '项' },
                { name: '应急演练(场)', prev: 2, curr: 2, unit: '场' },
            ],
        },
        _dimComparison_d6: {
            format: 'mom', items: [
                { name: 'AI项目立项(个)', prev: 0, curr: 0, unit: '个' },
                { name: '获得企业荣誉(项)', prev: 0, curr: 0, unit: '项' },
                { name: 'IATF审核问题(项)', prev: 0, curr: 0, unit: '项' },
                { name: '5S覆盖率(%)', prev: 100, curr: 100, unit: '%' },
            ],
        },
    },
    '2026-04': {
        _dimComparison_d2: {
            items: [
                { name: '碳酸锂销量(吨)',   budget: 400, target: 400, actual: 400, unit: '吨' },
                { name: '修复LFP交付(吨)',  budget: 400, target: 400, actual: 300, unit: '吨' },
                { name: '磷铁液交付(m³)',  budget: 3100, target: 1500, actual: 1000, unit: 'm³' },
                { name: '元明粉销售(吨)',  budget: 1700, target: 1400, actual: 1400, unit: '吨' },
            ],
        },
        _dimComparison_d3: {
            items: [
                { name: '碳酸锂投料(吨)', budget: 2100, target: 2100, actual: 1988,  unit: '吨' },
                { name: '碳酸锂产出(吨)', budget: 400,  target: 400,  actual: 400,   unit: '吨' },
                { name: '磷铁液产出(m³)', budget: 3100, target: 2000, actual: 1325.86, unit: 'm³' },
                { name: '加工成本(万/t)', budget: 1.78, target: 1.66, actual: 1.91,  unit: '万/t' },
            ],
        },
        _dimComparison_d4: {
            format: 'mom', items: [
                { name: '在研课题(个)', prev: 8,  curr: 11, unit: '个' },
                { name: 'MCU项目(项)', prev: 4,  curr: 7,  unit: '项' },
                { name: 'MCU降本(万元)', prev: 43.9, curr: 18.31, unit: '万元' },
                { name: '技改项目(项)', prev: 4, curr: 9, unit: '项' },
            ],
        },
        _dimComparison_d5: {
            format: 'mom', items: [
                { name: '隐患整改率(%)', prev: 82.3, curr: 90.83, unit: '%' },
                { name: '安全教育(人次)', prev: 600, curr: 703, unit: '人次' },
                { name: '排查隐患(项)', prev: 3024, curr: 2387, unit: '项' },
                { name: '应急演练(场)', prev: 2, curr: 2, unit: '场' },
            ],
        },
        _dimComparison_d6: {
            format: 'mom', items: [
                { name: 'AI项目立项(个)', prev: 0, curr: 0, unit: '个' },
                { name: '获得企业荣誉(项)', prev: 0, curr: 0, unit: '项' },
                { name: 'IATF审核问题(项)', prev: 0, curr: 46, unit: '项' },
                { name: '5S覆盖率(%)', prev: 100, curr: 100, unit: '%' },
            ],
        },
    },
};

// 当前选中月份
var currentMonth = '2026-05';

// 月份列表
var MONTHS = ['2026-03', '2026-04', '2026-05'];

function getMonthData(month) {
    var hist = RADAR_HISTORY_SDMD[month];
    if (!hist) return null;
    // 补充对比表数据
    if (RADAR_HISTORY_SDMD_EXTRA[month]) {
        hist._dimComparison_d2 = hist._dimComparison_d2 || RADAR_HISTORY_SDMD_EXTRA[month]._dimComparison_d2;
        hist._dimComparison_d3 = hist._dimComparison_d3 || RADAR_HISTORY_SDMD_EXTRA[month]._dimComparison_d3;
        hist._dimComparison_d4 = hist._dimComparison_d4 || RADAR_HISTORY_SDMD_EXTRA[month]._dimComparison_d4;
        hist._dimComparison_d5 = hist._dimComparison_d5 || RADAR_HISTORY_SDMD_EXTRA[month]._dimComparison_d5;
        hist._dimComparison_d6 = hist._dimComparison_d6 || RADAR_HISTORY_SDMD_EXTRA[month]._dimComparison_d6;
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
        var label = m.replace('-', '年') + '月';
        var isCurrent = RADAR_HISTORY_SDMD[m] && RADAR_HISTORY_SDMD[m]._isCurrent;
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
    var score = Math.round(vals.reduce(function(a, b) { return a + b; }, 0) / vals.length);

    document.getElementById('bigScore').textContent = score;

    var dimNames = ['核心考核', '经营效益', '运营效率', '技术创新', '风险合规', '组织活力'];
    var scoreDimsEl = document.getElementById('scoreDims');
    scoreDimsEl.innerHTML = '';
    ['d1','d2','d3','d4','d5','d6'].forEach(function(d, i) {
        var v = dims[d] || 0;
        scoreDimsEl.innerHTML +=
            '<div class="dim-item">' +
            '<div class="dim-name">' + dimNames[i] + '</div>' +
            '<div class="dim-score" style="color:' + DIMS_DEF[i].color + '">' + v + '</div>' +
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
        var label = m.replace('-', '年') + '月';
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
        var text = months[idx].replace('-', '年') + '月';
        if (RADAR_HISTORY_SDMD[months[idx]] && RADAR_HISTORY_SDMD[months[idx]]._isCurrent) {
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
        playHistory = Object.keys(RADAR_HISTORY_SDMD);
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
    var allMonths = Object.keys(RADAR_HISTORY_SDMD);
    var COMP_COLORS = [
        { main: '#3A6A9E', label: '3月' },
        { main: '#5a9fd4', label: '4月' },
        { main: '#9ab0cc', label: '5月' },
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
    var dimNames = ['核心考核指标', '经营效益', '运营效率', '技术创新力', '风险合规', '组织活力'];

    // 更新维度标签值
    ['d1','d2','d3','d4','d5','d6'].forEach(function(d, i) {
        var el = document.getElementById('dv-' + d);
        if (el) el.textContent = dims[d] || '--';
    });

    // 构建 series
    var seriesData = [];
    var BRAND = '#3A6A9E';
    var BRAND_DARK = '#1a4c8f';
    var BRAND_LIGHT = '#5a9fd4';

    if (radarMode === 'single') {
        // 单对象：品牌蓝渐变雷达，2.5px线条 + 径向填充 + 发光数据点
        seriesData.push({
            value: vals,
            name: '山东美多',
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
                shadowColor: 'rgba(58,106,158,0.6)',
                borderWidth: 2,
                borderColor: 'white',  //白色描边
            },
            areaStyle: {
                color: {
                    type: 'radial',
                    x: 0.5, y: 0.5, r: 0.5,
                    colorStops: [
                        { offset: 0, color: 'rgba(58,106,158,0.30)' },  //中心30%
                        { offset: 1, color: 'rgba(58,106,158,0.10)' } //边缘10%
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
            { main: '#3A6A9E', light: 'rgba(58,106,158,0.15)', label: '山东美多' },
            { main: '#5a9fd4', light: 'rgba(90,159,212,0.15)', label: '行业均值' },
            { main: '#9ab0cc', light: 'rgba(154,176,204,0.1)', label: '标杆值' },
        ];
        var allMonths = Object.keys(RADAR_HISTORY_SDMD);
        allMonths.forEach(function(m, mi) {
            var mData = RADAR_HISTORY_SDMD[m];
            if (!mData) return;
            var mDims = mData.dims;
            var mVals = ['d1','d2','d3','d4','d5','d6'].map(function(d) { return mDims[d] || 0; });
            var c = COMP_COLORS[mi % COMP_COLORS.length];
            seriesData.push({
                value: mVals,
                name: m.replace('-', '年') + '月',
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
                        'rgba(58,106,158,0.02)',
                        'rgba(58,106,158,0.04)',
                        'rgba(58,106,158,0.07)',
                        'rgba(58,106,158,0.10)'
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
    var data = RADAR_HISTORY_SDMD[month];
    if (!data) return null;
    
    var prevMonth = getPreviousMonth(month);
    var prevData = prevMonth ? RADAR_HISTORY_SDMD[prevMonth] : null;
    
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
    
    // === 综合表现：经营诊断 ===
    var trendText = '';
    var trendDetail = '';
    if (previous) {
        var prevAvg = 0;
        dimKeys.forEach(function(k) { prevAvg += previous.dims[k]; });
        prevAvg = Math.round(prevAvg / 6);
        var diff = avgScore - prevAvg;
        
        // 经营诊断分析
        if (diff > 5) {
            trendText = '📈 经营状况明显改善，综合得分提升' + diff + '分。主要受益于：';
        } else if (diff > 0) {
            trendText = '📊 经营稳中有升，综合得分提升' + diff + '分。';
        } else if (diff < -5) {
            trendText = '📉 经营状况有所下滑，综合得分下降' + Math.abs(diff) + '分，需重点关注。';
        } else if (diff < 0) {
            trendText = '➡️ 经营基本持平，略有下降' + Math.abs(diff) + '分。';
        } else {
            trendText = '➡️ 经营状况稳定，与上月持平。';
        }
        
        // 分析各维度变化对整体的影响
        var upDims = [], downDims = [];
        dimKeys.forEach(function(k) {
            var d = current.dims[k] - previous.dims[k];
            var dimName = DIMS_DEF.find(function(def){return def.id===k;}).name;
            if (d > 0) upDims.push(dimName);
            else if (d < 0) downDims.push(dimName);
        });
        trendDetail = upDims.length > 0 ? '<p>✅ 增长亮点：' + upDims.join('、') + '表现提升</p>' : '';
        trendDetail += downDims.length > 0 ? '<p>⚠️ 下滑风险：' + downDims.join('、') + '需要关注</p>' : '';
    }
    
    // KPI达成分析 - 显示具体数据
    var kpiInfo = '';
    var kpiDetailList = '';
    if (current._kpiComparison && current._kpiComparison.items) {
        var kpiItems = current._kpiComparison.items;
        var kpiAchieved = 0;
        var goodKpis = [], badKpis = [];
        
        kpiItems.forEach(function(item) {
            var isCost = item.name.indexOf('成本') >= 0;
            var achv = calcAchv(item.actual, item.target, isCost);
            var statusIcon = achv >= 100 ? '✅' : (achv >= 85 ? '⚠️' : '❌');
            var kpiDetail = item.name + '：实际' + fmtNum(item.actual) + item.unit + ' vs 目标' + fmtNum(item.target) + item.unit + ' (' + fmtRate(achv) + ' ' + statusIcon + ')';
            
            if (achv >= 100) {
                kpiAchieved++;
                goodKpis.push(kpiDetail);
            } else {
                badKpis.push(kpiDetail);
            }
        });
        
        var kpiRate = Math.round(kpiAchieved/kpiItems.length*100);
        
        if (kpiRate >= 80) {
            kpiInfo = '<p>💼 核心KPI整体达成良好(' + kpiAchieved + '/' + kpiItems.length + '项，达成率' + kpiRate + '%)，经营质量稳健。</p>';
        } else if (kpiRate >= 50) {
            kpiInfo = '<p>⚠️ 核心KPI部分未达标(' + kpiAchieved + '/' + kpiItems.length + '项，达成率' + kpiRate + '%)，需加强攻关。</p>';
        } else {
            kpiInfo = '<p>🚨 核心KPI大面积未达标(' + kpiAchieved + '/' + kpiItems.length + '项)，经营面临较大压力，需立即行动！</p>';
        }
        
        // 添加具体KPI数据列表
        if (goodKpis.length > 0) {
            kpiDetailList += '<p>✅ <strong>达标 (' + goodKpis.length + '项)</strong></p><ul><li>' + goodKpis.join('</li><li>') + '</li></ul>';
        }
        if (badKpis.length > 0) {
            kpiDetailList += '<p>❌ <strong>未达标 (' + badKpis.length + '项)</strong></p><ul><li>' + badKpis.join('</li><li>') + '</li></ul>';
        }
    }
    
    // 预算完成分析
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
    var budgetInfo = '';
    if (budgetTotal > 0) {
        var budgetRate = Math.round(budgetAchieved/budgetTotal*100);
        if (budgetRate >= 90) {
            budgetInfo = '<p>💰 预算执行良好(' + budgetRate + '%)，资源使用效率高。</p>';
        } else if (budgetRate >= 70) {
            budgetInfo = '<p>⚡ 预算执行进度(' + budgetRate + '%)，需加快投入产出。</p>';
        } else {
            budgetInfo = '<p>⚠️ 预算执行滞后(' + budgetRate + '%)，需关注资金使用效率。</p>';
        }
    }
    
    result.summary.push({
        icon: '📊',
        title: '综合表现诊断',
        content: '<p style="font-size:14px;font-weight:600">' + trendText + '</p>' + trendDetail + kpiInfo + kpiDetailList + budgetInfo
    });
    
    // === 维度分析：深度解读 ===
    dimKeys.forEach(function(dimKey) {
        var dimDef = DIMS_DEF.find(function(d) { return d.id === dimKey; });
        var score = current.dims[dimKey];
        
        // 生成经营分析文本
        var analysis = '';
        var recommendation = '';
        
        if (previous) {
            var momDiff = score - previous.dims[dimKey];
            var prevScore = previous.dims[dimKey];
            
            // 基于得分区间的分析
            if (score >= 90) {
                analysis = '<p>🎯 该维度表现优秀，是公司经营的亮点。</p>';
                if (momDiff > 0) {
                    analysis += '<p>📈 环比提升' + momDiff + '分，保持良好增长势头。</p>';
                }
            } else if (score >= 75) {
                analysis = '<p>✅ 该维度经营状况良好。</p>';
                if (momDiff > 3) {
                    analysis += '<p>📈 环比提升' + momDiff + '分，发展趋势向好。</p>';
                } else if (momDiff < -3) {
                    analysis += '<p>⚠️ 环比下降' + Math.abs(momDiff) + '分，需关注下滑原因。</p>';
                }
            } else if (score >= 60) {
                analysis = '<p>⚡ 该维度处于及格水平，有提升空间。</p>';
                if (momDiff > 0) {
                    analysis += '<p>📈 环比改善' + momDiff + '分，需继续巩固。</p>';
                } else if (momDiff < 0) {
                    analysis += '<p>⚠️ 环比下滑' + Math.abs(momDiff) + '分，需警惕进一步恶化。</p>';
                } else {
                    analysis += '<p>➡️ 持平，需突破瓶颈。</p>';
                }
            } else {
                analysis = '<p>🚨 该维度得分较低，经营存在风险！</p>';
                if (momDiff < 0) {
                    analysis += '<p>📉 环比进一步下滑，需立即制定改进计划！</p>';
                }
                recommendation = '<p style="color:red;font-weight:600">🔴 建议：立即分析原因，优先投入资源改进。</p>';
            }
        } else {
            // 无环比数据时的分析
            if (score >= 90) {
                analysis = '<p>🎯 该维度表现优秀，是公司经营的亮点。</p>';
            } else if (score >= 75) {
                analysis = '<p>✅ 该维度经营状况良好。</p>';
            } else if (score >= 60) {
                analysis = '<p>⚡ 该维度处于及格水平，需关注。</p>';
            } else {
                analysis = '<p>🚨 该维度得分较低，存在经营风险。</p>';
                recommendation = '<p style="color:red;font-weight:600">🔴 建议：需重点改进。</p>';
            }
        }
        
        // 分析具体指标 - 显示具体数值
        var detailText = '';
        var dimCompKey = '_dimComparison_' + dimKey;
        if (current[dimCompKey] && current[dimCompKey].items) {
            var items = current[dimCompKey].items;
            var goodItems = [], badItems = [];
            
            items.forEach(function(item) {
                var isCost = item.name.indexOf('成本') >= 0;
                var isMom = current[dimCompKey].format === 'mom';
                var rate = isMom ? calcMom(item.curr, item.prev) : calcAchv(item.actual, item.target, isCost);
                var actualVal = isMom ? item.curr : item.actual;
                var targetVal = isMom ? item.prev : item.target;
                var statusIcon = rate >= 100 ? '✅' : (rate >= 85 ? '⚠️' : '❌');
                
                var itemDetail = item.name + '：实际' + fmtNum(actualVal) + item.unit + ' vs 目标' + fmtNum(targetVal) + item.unit + ' (' + fmtRate(rate) + ' ' + statusIcon + ')';
                
                if (rate >= 100) goodItems.push(itemDetail);
                else badItems.push(itemDetail);
            });
            
            if (goodItems.length > 0) {
                detailText += '<p>✅ <strong>达标 (' + goodItems.length + '项)</strong></p><ul><li>' + goodItems.join('</li><li>') + '</li></ul>';
            }
            if (badItems.length > 0) {
                detailText += '<p>❌ <strong>未达标 (' + badItems.length + '项)</strong></p><ul><li>' + badItems.join('</li><li>') + '</li></ul>';
            }
        }
        
        result.dims.push({
            icon: '📈',
            title: dimDef.name + '诊断',
            content: analysis + detailText + recommendation
        });
    });
    
    // === 问题预警：风险分析 ===
    var problems = [];
    dimKeys.forEach(function(k) {
        if (current.dims[k] < 60) {
            var dimName = DIMS_DEF.find(function(d){return d.id===k;}).name;
            problems.push('<strong>' + dimName + '</strong>得分仅' + current.dims[k] + '分，是当前最紧迫的风险点');
        }
    });
    if (current._kpiComparison && current._kpiComparison.items) {
        current._kpiComparison.items.forEach(function(item) {
            var isCost = item.name.indexOf('成本') >= 0;
            var achv = calcAchv(item.actual, item.target, isCost);
            if (achv < 85) {
                var severity = achv < 60 ? '严重' : '较重';
                problems.push(item.name + '达成率<strong>' + fmtRate(achv) + '</strong>，影响' + severity);
            }
        });
    }
    result.issues.push({
        icon: '🚨',
        title: '问题预警分析',
        content: problems.length > 0 ? 
            '<p>经诊断，发现以下<strong>' + problems.length + '项</strong>主要风险：</p><ul style="font-size:13px">' + problems.map(function(p, i){return '<li style="margin-bottom:10px">' + (i+1) + '. ' + p + '</li>';}).join('') + '</ul><p style="color:red;font-weight:600">⚠️ 建议优先处理以上风险点</p>' : 
            '<p>✅ 经营风险整体可控，暂无重大预警</p>'
    });
    
    // === 积极进展：亮点分析 ===
    var positives = [];
    dimKeys.forEach(function(k) {
        if (previous && current.dims[k] > previous.dims[k]) {
            var dimName = DIMS_DEF.find(function(d){return d.id===k;}).name;
            var diff = current.dims[k] - previous.dims[k];
            positives.push('<strong>' + dimName + '</strong>提升+' + diff + '分，成为增长引擎');
        }
    });
    if (current._kpiComparison && current._kpiComparison.items) {
        current._kpiComparison.items.forEach(function(item) {
            var isCost = item.name.indexOf('成本') >= 0;
            var achv = calcAchv(item.actual, item.target, isCost);
            if (achv >= 110) {
                positives.push(item.name + '超预期完成(<strong>+' + fmtRate(achv - 100) + '</strong>)，表现突出');
            }
        });
    }
    result.progress.push({
        icon: '🎉',
        title: '积极进展分析',
        content: positives.length > 0 ?
            '<p>本月经营中的<strong>' + positives.length + '项</strong>亮点：</p><ul style="font-size:13px">' + positives.map(function(p, i){return '<li style="margin-bottom:10px">' + (i+1) + '. ' + p + '</li>';}).join('') + '</ul><p>💪 建议继续保持良好势头</p>' :
            '<p>✅ 暂无显著增长亮点，维持现有水平</p>'
    });
    
    // === 改进建议：行动方案 ===
    var suggestions = [];
    dimKeys.forEach(function(k) {
        var score = current.dims[k];
        if (score < 75) {
            var dimName = DIMS_DEF.find(function(d){return d.id===k;}).name;
            if (score < 60) {
                suggestions.push('<strong>' + dimName + '</strong>：得分' + score + '分，建议本周内制定专项改进计划');
            } else {
                suggestions.push('<strong>' + dimName + '</strong>：得分' + score + '分，建议加强日常监控');
            }
        }
    });
    if (current._kpiComparison && current._kpiComparison.items) {
        var badKpis = current._kpiComparison.items.filter(function(item) {
            var isCost = item.name.indexOf('成本') >= 0;
            var achv = calcAchv(item.actual, item.target, isCost);
            return achv < 100;
        });
        if (badKpis.length > 0) {
            suggestions.push('<strong>核心KPI</strong>：' + badKpis.length + '项未达标，建议优先攻关：' + badKpis.map(function(i){return i.name;}).join('、'));
        }
    }
    result.suggestions.push({
        icon: '💡',
        title: '改进建议',
        content: suggestions.length > 0 ?
            '<p>基于诊断结果，建议以下<strong>' + suggestions.length + '项</strong>行动：</p><ul style="font-size:13px">' + suggestions.map(function(s, i){return '<li style="margin-bottom:10px">' + (i+1) + '. ' + s + '</li>';}).join('') + '</ul>' :
            '<p>✅ 各项指标表现良好，建议继续保持</p>'
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
