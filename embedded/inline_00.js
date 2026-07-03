
// 锂辉石精矿价格走势图
        // ============================================================
        var _lithiumOreChartData = null;
        var _lithiumOreChartW = 800, _lithiumOreChartH = 260;
        var _lithiumOrePad = { top: 15, right: 15, bottom: 35, left: 75 };

        async function initLithiumOreChart() {
            var loading = document.getElementById('lithiumOreChartLoading');
            var noData = document.getElementById('lithiumOreChartNoData');
            var svg = document.getElementById('lithiumOreChart');
            if (!svg) return;

            try {
                var resp = await fetch('data/lithium_ore_price_history.json?t=' + Date.now());
                if (!resp.ok) throw new Error('HTTP error');
                var data = await resp.json();

                // 过滤：只保留2026-01-01及之后的数据，并按日期升序排序
                if (data.history) {
                    data.history = data.history.filter(function(d) { return d.date >= '2026-01-01'; });
                    // 只保留5%澳洲的数据用于图表显示
                    data.history = data.history.filter(function(d) { return d.grade === '5%' && d.origin === '澳洲'; });
                    data.history.sort(function(a, b) { return a.date.localeCompare(b.date); });
                }

                if (!data.history || data.history.length === 0) {
                    if (loading) loading.style.display = 'none';
                    if (noData) noData.style.display = 'flex';
                    return;
                }

                _lithiumOreChartData = data;

                // 更新标题栏信息（显示5%澳洲的最新价）
                var latest = data.history[data.history.length - 1];
                var priceEl = document.getElementById('lithiumOreLatestPrice');
                var changeEl = document.getElementById('lithiumOreLatestChange');
                var updatedEl = document.getElementById('lithiumOreChartUpdated');

                if (priceEl && latest) {
                    priceEl.textContent = latest.avg_price.toFixed(0) + ' ' + (latest.unit || '美元/吨');
                }
                var pct = 0;
                if (changeEl && data.history.length >= 2) {
                    var prev = data.history[data.history.length - 2].avg_price;
                    var curr = latest.avg_price;
                    pct = prev > 0 ? ((curr - prev) / prev * 100) : 0;
                    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
                }
                updateTicker('ticker-spod', latest.avg_price.toFixed(0) + ' ' + (latest.unit || '美元/吨'), pct);
                if (updatedEl) updatedEl.textContent = 'Update: ' + data.update_time;

                drawLithiumOreChart(svg, data.history);
                if (noData) noData.style.display = 'none';

                function fitSvgToContainer() {
                    var svg2 = document.getElementById('lithiumOreChart');
                    var parent = svg2 && svg2.parentElement;
                    if (parent) {
                        var pw = parent.clientWidth || 800;
                        svg2.setAttribute('width', pw);
                        svg2.setAttribute('height', Math.round(pw * 260 / 800));
                    }
                }
                fitSvgToContainer();
                window.addEventListener('resize', function() { fitSvgToContainer(); });

                if (loading) loading.style.display = 'none';
            } catch (e) {
                console.warn('[LithiumOre Chart] load failed:', e);
                if (loading) loading.style.display = 'none';
                if (noData) noData.style.display = 'flex';
            }
        }

        function drawLithiumOreChart(svg, historyData) {
            var W = _lithiumOreChartW, H = _lithiumOreChartH;
            var PAD = _lithiumOrePad;
            var chartW = W - PAD.left - PAD.right;
            var chartH = H - PAD.top - PAD.bottom;

            // 过滤出5%澳洲的数据
            var filtered = historyData.filter(function(d) {
                return d.grade === '5%' && d.origin === '澳洲';
            });
            if (filtered.length === 0) filtered = historyData;

            var prices = filtered.map(function(d) { return d.avg_price; });
            var minPrice = Math.min.apply(null, prices);
            var maxPrice = Math.max.apply(null, prices);
            var priceRange = maxPrice - minPrice || 1;
            var padding = priceRange * 0.1;
            minPrice -= padding; maxPrice += padding;

            function xScale(i) { return PAD.left + (i / (filtered.length - 1)) * chartW; }
            function yScale(p) { return PAD.top + (1 - (p - minPrice) / (maxPrice - minPrice)) * chartH; }

            var gridG = svg.querySelector('#lithiumOreChartGrid');
            var areaG = svg.querySelector('#lithiumOreChartArea');
            var lineG = svg.querySelector('#lithiumOreChartLine');
            var axisXG = svg.querySelector('#lithiumOreChartAxisX');
            var axisYG = svg.querySelector('#lithiumOreChartAxisY');

            if (gridG) gridG.innerHTML = '';
            if (areaG) areaG.innerHTML = '';
            if (lineG) lineG.innerHTML = '';
            if (axisXG) axisXG.innerHTML = '';
            if (axisYG) axisYG.innerHTML = '';

            function mk(tag, attrs) {
                var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
                for (var k in attrs) el.setAttribute(k, attrs[k]);
                return el;
            }

            // 网格线
            for (var i = 0; i <= 5; i++) {
                var y = PAD.top + (i / 5) * chartH;
                gridG.appendChild(mk('line', { x1: PAD.left, y1: y, x2: PAD.left + chartW, y2: y, stroke: '#eee', 'stroke-width': 1 }));
            }

            // Y轴标签
            for (var i = 0; i <= 5; i++) {
                var y = PAD.top + (i / 5) * chartH;
                var val = maxPrice - (i / 5) * (maxPrice - minPrice);
                axisYG.appendChild(mk('text', { x: PAD.left - 8, y: y + 4, 'text-anchor': 'end', 'font-size': 11, fill: '#999' }));
                axisYG.lastChild.textContent = val.toFixed(0);
            }

            // X轴标签（显示部分日期）
            var step = Math.max(1, Math.floor(filtered.length / 6));
            for (var i = 0; i < filtered.length; i += step) {
                var x = xScale(i);
                var date = filtered[i].date;
                if (date && date.length >= 10) date = date.substring(5, 10); // MM-DD
                axisXG.appendChild(mk('text', { x: x, y: PAD.top + chartH + 20, 'text-anchor': 'middle', 'font-size': 10, fill: '#999' }));
                axisXG.lastChild.textContent = date;
                axisXG.appendChild(mk('line', { x1: x, y1: PAD.top + chartH, x2: x, y2: PAD.top + chartH + 5, stroke: '#ccc', 'stroke-width': 1 }));
            }

            // 面积图
            var areaPath = 'M ' + xScale(0) + ' ' + yScale(minPrice);
            for (var i = 0; i < filtered.length; i++) {
                areaPath += ' L ' + xScale(i) + ' ' + yScale(filtered[i].avg_price);
            }
            areaPath += ' L ' + xScale(filtered.length - 1) + ' ' + yScale(minPrice) + ' Z';
            areaG.appendChild(mk('path', { d: areaPath, fill: 'url(#lithiumOreChartGrad)', stroke: 'none' }));

            // 折线图
            var linePath = '';
            for (var i = 0; i < filtered.length; i++) {
                if (i === 0) linePath = 'M ' + xScale(i) + ' ' + yScale(filtered[i].avg_price);
                else linePath += ' L ' + xScale(i) + ' ' + yScale(filtered[i].avg_price);
            }
            // 浅色线（底层，静态显示）
            lineG.appendChild(mk('path', { d: linePath, fill: 'none', stroke: '#ef5350', 'stroke-width': 2, 'stroke-opacity': 0.25 }));
            // 深色线（上层，初始不可见，等待动画揭幕）
            lineG.appendChild(mk('path', { d: linePath, fill: 'none', stroke: '#ef5350', 'stroke-width': 2, 'class': 'data-line deep-line-anim', 'stroke-dasharray': '10000', 'stroke-dashoffset': '10000' }));

            // 最新点标记
            var lastIdx = filtered.length - 1;
            lineG.appendChild(mk('circle', { cx: xScale(lastIdx), cy: yScale(filtered[lastIdx].avg_price), r: 4, fill: '#e91e63', stroke: '#fff', 'stroke-width': 2 }));
            // ── Black crosshair lines ──────────────────────────────────
            var chG = svg.querySelector('#lithiumOreChartCrosshair');
            if (!chG) {
                chG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                chG.id = 'lithiumOreChartCrosshair';
                svg.appendChild(chG);
            }
            chG.innerHTML = '';
            var chVert = mk('line', { x1: 0, y1: PAD.top, x2: 0, y2: PAD.top + chartH, stroke: '#555', 'stroke-width': 1, 'stroke-dasharray': '3,2', 'pointer-events': 'none' });
            var chHorz = mk('line', { x1: PAD.left, y1: 0, x2: PAD.left + chartW, y2: 0, stroke: '#555', 'stroke-width': 1, 'stroke-dasharray': '3,2', 'pointer-events': 'none' });
            chG.appendChild(chVert);
            chG.appendChild(chHorz);

            function getIdxOre(e) {
                var rect = svg.getBoundingClientRect();
                var svgX = ((e.clientX - rect.left) / rect.width) * W;
                return Math.max(0, Math.min(filtered.length - 1, Math.round(((svgX - PAD.left) / chartW) * (filtered.length - 1))));
            }

            var hoverTip = null;
            svg.addEventListener('mousemove', function(e) {
                var idx = getIdxOre(e);
                var cx = xScale(idx), cy = yScale(filtered[idx].avg_price);
                // 更新黑色十字线
                var chG2 = svg.querySelector('#lithiumOreChartCrosshair');
                if (chG2) {
                    var lines = chG2.querySelectorAll('line');
                    if (lines.length >= 2) {
                        lines[0].setAttribute('x1', cx); lin<script src="inline_01.js">