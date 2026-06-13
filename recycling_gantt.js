// ========= 锂电池回收全局配置 =========

// 锂电池回收品种定义（全局）- ID 必须与 recycling_data.js 中的 key 完全一致
const RECYCLING_VARIETIES = [
    { id: '三元黑粉-三元523极片粉', name: '三元黑粉-523极片', unit: '万元/吨', svgId: 'recyclingTernary523Chart' },
    { id: '磷酸铁锂黑粉-磷酸铁锂极片粉', name: '磷酸铁锂黑粉-极片', unit: '万元/吨', svgId: 'recyclingLfpBlackChart' },
    { id: '三元废料-三元铝壳523型', name: '三元废料-铝壳523', unit: '万元/吨', svgId: 'recyclingTernaryWasteChart' },
    { id: '磷酸铁锂废料-废旧磷酸铁锂铝壳电池', name: '磷酸铁锂废料-铝壳', unit: '万元/吨', svgId: 'recyclingLfpWasteChart' },
    { id: '正极片-废旧磷酸铁锂动力正极片', name: '正极片-动力', unit: '万元/吨', svgId: 'recyclingCathodePowerChart' },
    // 已删除：正极片-废旧磷酸铁锂储能正极片（无SMM数据）、铝箔-铝粉（无SMM数据）、铜箔-铜粉（无SMM数据）
    { id: '三元电池包-三元铝壳5系电池包', name: '三元电池包-铝壳5系', unit: '万元/吨', svgId: 'recyclingTernaryPackChart' },
    { id: '钴酸锂电池包-钴酸锂铝壳电池包', name: '钴酸锂电池包-铝壳', unit: '万元/吨', svgId: 'recyclingCobaltPackChart' },
    { id: '三元电池包-三元软包电池包', name: '三元电池包-软包', unit: '万元/吨', svgId: 'recyclingTernaryPouchChart' },
    // 已删除：铝箔-铝粉、铜箔-铜粉（无SMM数据）
    
    // 化工品（数据来源：chemical_data.js）
    { id: '硫酸-98%浓硫酸', name: '硫酸-98%', unit: '元/吨', svgId: 'chemicalSulfuricChart', dataSource: 'chemical' },
    { id: '双氧水-27.5%', name: '双氧水-27.5%', unit: '元/吨', svgId: 'chemicalH2o2Chart', dataSource: 'chemical' },
];

// 锂电池回收累积数据（全局）
let recyclingCumulativeData = null;

// ========= 锂电池回收核心函数 =========

// 计算锂电池回收累积涨跌幅数据
function computeRecyclingProduct(history, name, unit) {
    if (!Array.isArray(history) || history.length < 2) return null;
    const d26 = history.filter(d => d['日期'] >= '2026-01-01');
    if (d26.length < 2) {
        console.warn('[回收]', name, '2026年数据不足:', d26.length);
        return null;
    }
    const sp = parseFloat(d26[0]['今日均价'] || d26[0]['均价']);
    const ep = parseFloat(d26[d26.length - 1]['今日均价'] || d26[d26.length - 1]['均价']);
    if (isNaN(sp) || sp <= 0) {
        console.warn('[回收]', name, '起始价格无效:', sp);
        return null;
    }
    const ch = ep - sp;
    const pct = ch / sp * 100;
    recyclingCumulativeData.products.push({
        name: name,
        unit: unit,
        start_date: d26[0]['日期'],
        end_date: d26[d26.length - 1]['日期'],
        start_price: sp,
        end_price: ep,
        change: ch,
        change_pct: parseFloat(pct.toFixed(2)),
        direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'stable',
        data_points: d26.length
    });
    return true;
}

// 渲染锂电池回收甘特图（主入口）
function renderRecyclingGantt(container) {
    console.log('[回收甘特图] 渲染锂电池回收甘特图...');
    console.log('[回收甘特图] RECYCLING_DATA定义:', typeof RECYCLING_DATA !== 'undefined');

    if (typeof RECYCLING_DATA === 'undefined') {
        container.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">RECYCLING_DATA 未定义，请检查 recycling_data.js 是否正常加载</div>';
        return;
    }

    // 初始化累积数据
    recyclingCumulativeData = {
        meta: { description: '2026年至今累计涨跌幅', data_source: 'recycling_data.js', update_time: '', year: 2026 },
        products: []
    };

    // 遍历所有品种，计算累计涨跌幅
    RECYCLING_VARIETIES.forEach(variety => {
        // 根据 dataSource 判断数据来源
        let data = null;
        if (variety.dataSource === 'chemical') {
            // 化工品数据从 CHEMICAL_DATA 读取
            data = typeof CHEMICAL_DATA !== 'undefined' ? CHEMICAL_DATA[variety.id] : null;
        } else {
            // 回收品数据从 RECYCLING_DATA 读取
            data = typeof RECYCLING_DATA !== 'undefined' ? RECYCLING_DATA[variety.id] : null;
        }
        
        if (data && data.length > 0) {
            computeRecyclingProduct(data, variety.name, variety.unit);
        } else {
            console.warn('[回收] 品种数据不存在或为空:', variety.id, 'dataSource:', variety.dataSource);
        }
    });

    console.log('[回收甘特图] recyclingCumulativeData:', JSON.stringify(recyclingCumulativeData.products.map(p => p.name + ':' + p.change_pct + '%')));

    if (!recyclingCumulativeData.products || recyclingCumulativeData.products.length === 0) {
        container.innerHTML = '<div style="padding:40px;text-align:center;color:#e74c3c;">暂无有效数据，请检查 recycling_data.js 中的数据</div>';
        return;
    }

    // 调用全局渲染函数
    if (typeof window.addRecyclingCumulativeBarsGantt === 'function') {
        window.addRecyclingCumulativeBarsGantt(recyclingCumulativeData);
    } else {
        console.error('[回收甘特图] window.addRecyclingCumulativeBarsGantt 函数不存在！');
        container.innerHTML = '<div style="padding:40px;text-align:center;color:#e74c3c;">系统错误：addRecyclingCumulativeBarsGantt 函数未定义</div>';
    }
}

// ========= 甘特图渲染函数（与电解液保持一致） =========

// 将 addRecyclingCumulativeBarsGantt 暴露到全局，供 renderLithiumGantt 调用
window.addRecyclingCumulativeBarsGantt = function(cumulativeData) {
    console.log('[回收甘特图] addRecyclingCumulativeBarsGantt 被调用');

    var container = document.getElementById('gantt-chart-container');
    if (!container) {
        console.error('[回收甘特图] 找不到 gantt-chart-container');
        return;
    }
    container.innerHTML = '';

    if (!cumulativeData || !cumulativeData.products || cumulativeData.products.length === 0) {
        container.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">暂无数据</div>';
        return;
    }

    // 生成甘特图 HTML（与电解液模式保持一致）
    let ganttHTML = '<div class="cumulative-gantt">';
    ganttHTML += '<div class="gantt-title">锂电池回收 2026年累计涨跌幅 <span style="font-size:12px;color:#999;font-weight:normal;">(2026年至今)</span></div>';
    ganttHTML += '<div class="gantt-btn-group" id="recyclingGanttBtnGroup"></div>';

    // 找出最大涨跌幅
    let maxChangePct = 0;
    cumulativeData.products.forEach(p => {
        if (Math.abs(p.change_pct) > maxChangePct) maxChangePct = Math.abs(p.change_pct);
    });

    // 按涨跌幅降序排序
    cumulativeData.products.sort((a, b) => b.change_pct - a.change_pct);

    // 为每个产品生成一行
    cumulativeData.products.forEach(product => {
        const pct = product.change_pct;
        const absPct = Math.abs(pct);
        const width = maxChangePct > 0 ? (absPct / maxChangePct) * 80 : 0;
        const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'stable';
        const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
        const color = pct > 0 ? '#d32f2f' : pct < 0 ? '#388e3c' : '#999';

        const dateRange = product.start_date + ' ~ ' + product.end_date;

        ganttHTML += '<div class="gantt-row" data-product-name="' + product.name + '">';
        ganttHTML += '<span class="gantt-name">' + product.name + '</span>';
        ganttHTML += '<div class="gantt-bar-track">';
        ganttHTML += '<div class="gantt-bar ' + direction + '" data-target-width="' + width + '%" style="width: 0;">';
        ganttHTML += '<span class="gantt-bar-label"><span class="gantt-arrow">' + arrow + '</span> ' + (pct > 0 ? '+' : '') + pct.toFixed(2) + '%</span>';
        ganttHTML += '</div>';
        ganttHTML += '</div>';
        ganttHTML += '<span class="gantt-price" style="color:' + color + ';font-size:10px;">' + product.start_price.toLocaleString() + ' → ' + product.end_price.toLocaleString() + '<br><span style="color:#999;">(' + dateRange + ')</span></span>';
        ganttHTML += '</div>';
    });

    ganttHTML += '<div id="recycling-gantt-expand-area" style="display:none;margin-top:20px;"></div>';
    ganttHTML += '</div>';

    container.innerHTML = ganttHTML;

    // 触发条形增长动画（与电解液一致）
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            container.querySelectorAll('.gantt-bar').forEach(bar => {
                const targetWidth = bar.getAttribute('data-target-width');
                if (targetWidth) {
                    bar.style.width = targetWidth;
                }
            });
        });
    });

    console.log('[回收甘特图] ✅ 已添加累积涨跌幅甘特图');

    // 生成按钮组
    generateRecyclingGanttButtons();

    // 绑定甘特图行点击事件（点击展开折线图）
    console.log('[回收甘特图] 准备绑定点击事件，共', container.querySelectorAll('.gantt-row').length, '行');
    container.querySelectorAll('.gantt-row').forEach(row => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', function() {
            const productName = this.getAttribute('data-product-name');
            console.log('[回收甘特图] 点击行 productName=', productName);

            // 检查当前行是否已展开
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                const area = document.getElementById('recycling-gantt-expand-area');
                if (area) {
                    const card = area.querySelector('.mk-chart-card');
                    if (card) {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        card.style.transition = 'opacity 0.3s, transform 0.3s';
                    }
                    setTimeout(() => {
                        area.style.display = 'none';
                        if (card && card._origParent) {
                            card._origParent.appendChild(card);
                            card.style.display = '';
                            card.style.opacity = '';
                            card.style.transform = '';
                            card.style.transition = '';
                            card._origParent = null;
                        }
                        area.innerHTML = '';
                    }, 300);
                }
                return;
            }

            // 先关闭已展开的行
            container.querySelectorAll('.gantt-row.active').forEach(r => {
                r.classList.remove('active');
                const area = document.getElementById('recycling-gantt-expand-area');
                if (area) {
                    area.style.display = 'none';
                    const card = area.querySelector('.mk-chart-card');
                    if (card && card._origParent) {
                        card._origParent.appendChild(card);
                        card.style.display = '';
                        card._origParent = null;
                    }
                    area.innerHTML = '';
                }
            });

            this.classList.add('active');
            showRecyclingProductChart(productName);
        });
    });
};

// 生成回收甘特图按钮组
function generateRecyclingGanttButtons() {
    console.log('[generateRecyclingGanttButtons] 开始生成按钮组...');
    const btnGroup = document.getElementById('recyclingGanttBtnGroup');
    if (!btnGroup) {
        console.error('[generateRecyclingGanttButtons] 未找到 recyclingGanttBtnGroup');
        return;
    }
    btnGroup.innerHTML = '';

    const sortedProducts = [...recyclingCumulativeData.products].sort((a, b) => b.change_pct - a.change_pct);

    sortedProducts.forEach(product => {
        const btn = document.createElement('button');
        btn.className = 'gantt-btn ' + (product.change_pct >= 0 ? 'up' : 'down');
        btn.setAttribute('data-product', product.name);
        btn.innerHTML = '<span class="product-name">' + product.name + '</span>';

        btn.addEventListener('mouseenter', function() {
            highlightRecyclingGanttRow(product.name);
        });

        btn.addEventListener('mouseleave', function() {
            unhighlightRecyclingGanttRow(product.name);
        });

        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            selectRecyclingGanttProduct(product.name);
        });

        btnGroup.appendChild(btn);
    });

    console.log('[generateRecyclingGanttButtons] ✅ 按钮组已生成，共', sortedProducts.length, '个按钮');
}

// 高亮甘特图行
function highlightRecyclingGanttRow(productName) {
    const row = document.querySelector('.cumulative-gantt .gantt-row[data-product-name="' + productName + '"]');
    if (row && !row.classList.contains('active')) {
        row.classList.add('hover');
    }
}

// 取消高亮甘特图行
function unhighlightRecyclingGanttRow(productName) {
    const row = document.querySelector('.cumulative-gantt .gantt-row[data-product-name="' + productName + '"]');
    if (row && !row.classList.contains('active')) {
        row.classList.remove('hover');
    }
}

// 选中甘特图品种
function selectRecyclingGanttProduct(productName) {
    console.log('[selectRecyclingGanttProduct] 选中品种：', productName);

    const container = document.getElementById('gantt-chart-container');
    if (!container) return;

    // 先关闭已展开的行
    container.querySelectorAll('.gantt-row.active').forEach(r => {
        r.classList.remove('active');
    });
    const area = document.getElementById('recycling-gantt-expand-area');
    if (area) {
        area.style.display = 'none';
        area.innerHTML = '';
    }

    // 高亮对应行
    const targetRow = container.querySelector('.gantt-row[data-product-name="' + productName + '"]');
    if (targetRow) {
        targetRow.classList.add('active');
        showRecyclingProductChart(productName);
    }
}

// ========= 折线图相关函数 =========

// 显示某个品种的折线图（点击甘特图行时调用）
function showRecyclingProductChart(productName) {
    console.log('[回收折线图] showRecyclingProductChart:', productName);

    const area = document.getElementById('recycling-gantt-expand-area');
    if (!area) {
        console.error('[回收折线图] 找不到 recycling-gantt-expand-area');
        return;
    }

    // 查找产品数据
    const product = recyclingCumulativeData.products.find(p => p.name === productName);
    if (!product) {
        console.error('[回收折线图] 找不到产品:', productName);
        return;
    }

    // 找到对应的品种数据
    const variety = RECYCLING_VARIETIES.find(v => v.name === productName);
    if (!variety) {
        console.error('[回收折线图] 找不到品种定义:', productName);
        return;
    }

    // 根据 dataSource 判断数据来源
    let data = null;
    if (variety.dataSource === 'chemical') {
        // 化工品数据从 CHEMICAL_DATA 读取
        data = typeof CHEMICAL_DATA !== 'undefined' ? CHEMICAL_DATA[variety.id] : null;
    } else {
        // 回收品数据从 RECYCLING_DATA 读取
        data = typeof RECYCLING_DATA !== 'undefined' ? RECYCLING_DATA[variety.id] : null;
    }
    
    if (!data || data.length === 0) {
        area.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">该品种无数据</div>';
        area.style.display = 'block';
        return;
    }

    // 过滤2026年数据
    const d26 = data.filter(d => d['日期'] >= '2026-01-01');
    if (d26.length < 2) {
        area.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">2026年数据不足</div>';
        area.style.display = 'block';
        return;
    }

    // 创建图表卡片（与电解液保持一致的结构）
    area.innerHTML = '';
    area.style.display = 'block';

    const card = document.createElement('div');
    card.className = 'mk-chart-card';
    card.style.cssText = 'margin-top:16px;padding:20px;background:#fafafa;border-radius:8px;border:1px solid #eee;opacity:0;transform:translateY(20px);transition:opacity 0.3s,transform 0.3s;';

    const title = document.createElement('h4');
    title.textContent = productName + ' - 价格走势 (2026年)';
    title.style.cssText = 'margin:0 0 12px 0;font-size:14px;color:#333;';
    card.appendChild(title);

    // 添加信息行（图例 + 最新价/涨跌幅）- 与电解液保持一致
    const infoRow = document.createElement('div');
    infoRow.className = 'chart-info-row';
    infoRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding:8px 12px;background:#fff;border-radius:6px;border:1px solid #eee;';
    
    const legendLeft = document.createElement('div');
    legendLeft.className = 'chart-legend-left';
    legendLeft.innerHTML = '<span class="chart-legend-item"><span class="chart-legend-dot" style="background:#e74c3c;"></span>均价（' + product.unit + '）</span>';
    infoRow.appendChild(legendLeft);
    
    const priceRight = document.createElement('div');
    priceRight.className = 'chart-price-right';
    priceRight.style.cssText = 'display:flex;gap:12px;align-items:center;font-size:13px;';
    priceRight.innerHTML = '<span class="price-label" style="color:#999;">最新价：</span><span class="chart-latest-price" id="recyclingLatestPrice_' + productName.replace(/[^a-zA-Z0-9]/g, '') + '" style="font-weight:600;color:#333;">--</span>' +
                          '<span class="change-label" style="color:#999;">涨跌幅：</span><span class="chart-latest-change" id="recyclingLatestChange_' + productName.replace(/[^a-zA-Z0-9]/g, '') + '" style="font-weight:600;"></span>';
    infoRow.appendChild(priceRight);
    
    card.appendChild(infoRow);

    const chartDiv = document.createElement('div');
    chartDiv.id = 'recycling-chart-' + productName.replace(/[^a-zA-Z0-9]/g, '');
    chartDiv.style.cssText = 'width:100%;height:300px;';
    card.appendChild(chartDiv);

    area.appendChild(card);

    // 触发进入动画
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    });

    // 用 echarts 渲染折线图（与电解液保持一致）
    setTimeout(() => {
        if (typeof echarts === 'undefined') {
            console.error('[回收折线图] echarts 未定义');
            return;
        }

        const chart = echarts.init(chartDiv);

        const dates = d26.map(d => d['日期']); // 完整日期
        const datesShort = d26.map(d => d['日期'].substring(5)); // MM-DD
        const prices = d26.map(d => parseFloat(d['今日均价'] || d['均价'])); // 兼容两种字段格式

        // 计算最新价和涨跌幅
        const latestPrice = prices[prices.length - 1];
        const prevPrice = prices.length >= 2 ? prices[prices.length - 2] : latestPrice;
        const changePct = prevPrice > 0 ? ((latestPrice - prevPrice) / prevPrice * 100) : 0;
        const changeColor = changePct >= 0 ? '#d32f2f' : '#388e3c';

        // 更新标签栏显示
        const priceEl = document.getElementById('recyclingLatestPrice_' + productName.replace(/[^a-zA-Z0-9]/g, ''));
        const changeEl = document.getElementById('recyclingLatestChange_' + productName.replace(/[^a-zA-Z0-9]/g, ''));
        if (priceEl) priceEl.textContent = latestPrice.toLocaleString() + ' ' + product.unit;
        if (changeEl) {
            changeEl.textContent = (changePct >= 0 ? '+' : '') + changePct.toFixed(2) + '%';
            changeEl.style.color = changeColor;
        }

        // 最新日期
        const latestDate = dates[dates.length - 1];

        const option = {
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(247,244,236,0.96)',
                borderColor: 'rgba(196,98,45,0.2)',
                borderWidth: 1,
                textStyle: { color: '#3D2914', fontSize: 12 },
                formatter: function(params) {
                    const date = params[0].axisValue;
                    let html = '<div style="font-weight:600;margin-bottom:4px;">' + date + '</div>';
                    params.forEach(p => {
                        html += '<div>' + p.marker + ' ' + p.value.toLocaleString() + ' ' + product.unit + '</div>';
                    });
                    return html;
                }
            },
            xAxis: {
                type: 'category',
                data: datesShort,
                axisLabel: { fontSize: 10, color: '#999' },
                axisLine: { lineStyle: { color: '#eee' } }
            },
            yAxis: {
                type: 'value',
                axisLabel: { fontSize: 10, color: '#999', formatter: '{value}' },
                splitLine: { lineStyle: { color: '#f0f0f0' } }
            },
            series: [{
                data: prices,
                type: 'line',
                smooth: true,
                lineStyle: { color: '#e74c3c', width: 2 },
                itemStyle: { color: '#e74c3c' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(231,76,60,0.2)' },
                            { offset: 1, color: 'rgba(231,76,60,0.02)' }
                        ]
                    }
                },
                // 在最新点标注日期（position: 'left' 避免最右侧被截断）
                markPoint: {
                    symbol: 'circle',
                    symbolSize: 8,
                    itemStyle: { color: '#e74c3c', borderColor: '#fff', borderWidth: 2 },
                    label: {
                        show: true,
                        formatter: latestDate.substring(5),
                        position: 'left',
                        distance: 8,
                        fontSize: 11,
                        color: '#666',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        borderColor: '#ddd',
                        borderWidth: 1,
                        borderRadius: 4,
                        padding: [3, 6]
                    },
                    data: [
                        {
                            coord: [datesShort.length - 1, prices[prices.length - 1]],
                            value: latestDate.substring(5)
                        }
                    ]
                }
            }],
            grid: { left: 50, right: 20, top: 30, bottom: 40 },
            // 动画效果：深色线条绘制动画
            animation: true,
            animationDuration: 1500,
            animationEasing: 'cubicOut',
            animationDelay: function(idx) {
                return idx * 50;
            }
        };

        chart.setOption(option);

        // 窗口resize时重绘
        const resizeHandler = () => chart.resize();
        window.addEventListener('resize', resizeHandler);
        // 保存handler引用以便移除
        card._resizeHandler = resizeHandler;

        console.log('[回收折线图] ✅ 折线图渲染完成:', productName);
    }, 50);
}
