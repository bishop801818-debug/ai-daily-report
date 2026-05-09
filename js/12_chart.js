        var _lcChartData = null;
        var _lcChartW = 800, _lcChartH = 260;
        var _lcPad = { top: 15, right: 15, bottom: 35, left: 75 };
        var _lcDragging = false, _lcDragStart = null, _lcDragEnd = null;

        async function initLCChart() {
            var loading = document.getElementById('chartLoading');
            var noData = document.getElementById('chartNoData');
            var svg = document.getElementById('lcFuturesChart');
            if (!svg) return;

            try {
                var resp = await fetch('reports/lc_futures_history.json?v=' + HTML_VERSION);
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var hist = await resp.json();

                if (!hist.history || hist.history.length === 0) {
                    if (loading) loading.style.display = 'none';
                    if (noData) noData.style.display = 'flex';
                    return;
                }

                _lcChartData = hist;

                var latest = hist.latest;
                var priceEl = document.getElementById('chartLatestPrice');
                var changeEl = document.getElementById('chartLatestChange');
                var rangeEl = document.getElementById('chartRange');
                var contractEl = document.getElementById('chartContract');
                var updatedEl = document.getElementById('chartUpdated');

                if (priceEl) priceEl.textContent = (latest.close / 10000).toFixed(3) + ' 万';
                if (contractEl) contractEl.textContent = (latest.contract || hist.contract || 'LC') + ' 主力';
                if (updatedEl) updatedEl.textContent = 'Update: ' + hist.update_time;

                var closes = hist.history.map(function(h) { return h.close; });
                var first = closes[0], last = closes[closes.length - 1];
                var pct = first > 0 ? ((last - first) / first * 100) : 0;
                if (changeEl) {
                    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
                }
                if (rangeEl) {
                    rangeEl.textContent = hist.start_date + ' ~ ' + hist.end_date + '  ' + hist.data_points + ' days';
                }

                drawLCChartV2(svg, hist.history);

                // Fix: set SVG pixel dimensions to match container → viewBox now scales uniformly, no stretch
                function fitSvgToContainer() {
                    var svg2 = document.getElementById('lcFuturesChart');
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
                console.warn('[LC Chart] load failed:', e);
                if (loading) loading.style.display = 'none';
                if (noData) noData.style.display = 'flex';
            }
        }

        function drawLCChartV2(svg, data) {
            var W = _lcChartW, H = _lcChartH;
            var PAD = _lcPad;
            var chartW = W - PAD.left - PAD.right;
            var chartH = H - PAD.top - PAD.bottom;

            var closes = data.map(function(d) { return d.close; });
            var minP = Math.min.apply(null, closes);
            var maxP = Math.max.apply(null, closes);
            var range = maxP - minP || 1;
            var padP = range * 0.12;
            var yMin = minP - padP;
            var yMax = maxP + padP;
            var yRange = yMax - yMin;
            var n = data.length;

            var xScale = function(i) { return PAD.left + (i / (n - 1 || 1)) * chartW; };
            var yScale = function(v) { return PAD.top + chartH - ((v - yMin) / yRange) * chartH; };

            // ── Grid ─────────────────────────────────────────────────
            var gridG = svg.querySelector('#chartGrid');
            if (gridG) gridG.innerHTML = '';

            var yTicks = 6;
            for (var ti = 0; ti <= yTicks; ti++) {
                var y = PAD.top + (ti / yTicks) * chartH;
                var val = yMax - (ti / yTicks) * yRange;
                var ln = mk('line', { x1: PAD.left, x2: W - PAD.right, y1: y, y2: y, stroke: '#e8e8e8', 'stroke-width': 1 });
                gridG.appendChild(ln);
                var txt = mk('text', { x: PAD.left - 6, y: y + 4, 'text-anchor': 'end', 'font-size': 9, fill: '#999', 'font-family': 'Microsoft YaHei, PingFang SC, Arial, sans-serif' });
                txt.textContent = (val / 10000).toFixed(2);
                gridG.appendChild(txt);
            }

            // ── X-axis date labels (more frequent) ────────────────────
            var axisXG = svg.querySelector('#chartAxisX');
            if (axisXG) axisXG.innerHTML = '';
            // Show every ~10 days worth of labels
            var step = Math.max(1, Math.floor(n / 8));
            for (var xi = 0; xi < n; xi += step) {
                var x = xScale(xi);
                var d = data[xi];
                if (!d) continue;
                var lbl = mk('text', { x: x, y: H - 6, 'text-anchor': 'middle', 'font-size': 9, fill: '#999', 'font-family': 'Microsoft YaHei, PingFang SC, Arial, sans-serif' });
                lbl.textContent = d.date.slice(5);
                axisXG.appendChild(lbl);
            }

            if (n < 2) return;

            var lastClose = closes[n - 1];
            var isUp = lastClose >= closes[0];
            var areaColor = isUp ? '#d32f2f' : '#388e3c';
            var gradEl = document.getElementById('chartGrad');
            if (gradEl) gradEl.setAttribute('stop-color', areaColor);

            // ── Area ─────────────────────────────────────────────────
            var areaG = svg.querySelector('#chartArea');
            if (areaG) areaG.innerHTML = '';
            var areaPath = 'M ' + xScale(0) + ',' + yScale(closes[0]);
            for (var ai = 1; ai < n; ai++) areaPath += ' L ' + xScale(ai) + ',' + yScale(closes[ai]);
            areaPath += ' L ' + xScale(n - 1) + ',' + (PAD.top + chartH) + ' L ' + xScale(0) + ',' + (PAD.top + chartH) + ' Z';
            var area = mk('path', { d: areaPath, fill: 'url(#chartGrad)' });
            areaG.appendChild(area);

            // ── Line ─────────────────────────────────────────────────
            var lineG = svg.querySelector('#chartLine');
            if (lineG) lineG.innerHTML = '';
            var linePath = 'M ' + xScale(0) + ',' + yScale(closes[0]);
            for (var pi = 1; pi < n; pi++) linePath += ' L ' + xScale(pi) + ',' + yScale(closes[pi]);
            var lineEl = mk('path', { d: linePath, stroke: areaColor, 'stroke-width': 2, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
            lineG.appendChild(lineEl);

            // ── Local highs & lows annotation ─────────────────────────
            var dotsG = svg.querySelector('#chartDots');
            if (dotsG) dotsG.innerHTML = '';

            // Find local peaks (higher than both neighbors) and troughs
            var peaks = [], troughs = [];
            for (var mi = 1; mi < n - 1; mi++) {
                if (closes[mi] > closes[mi - 1] && closes[mi] > closes[mi + 1]) peaks.push(mi);
                if (closes[mi] < closes[mi - 1] && closes[mi] < closes[mi + 1]) troughs.push(mi);
            }
            // Also include absolute max and min
            var maxIdx = closes.indexOf(maxP);
            var minIdx = closes.indexOf(minP);
            if (peaks.indexOf(maxIdx) < 0) peaks.push(maxIdx);
            if (troughs.indexOf(minIdx) < 0) troughs.push(minIdx);

            // Sort and limit
            peaks.sort(function(a, b) { return closes[b] - closes[a]; });
            troughs.sort(function(a, b) { return closes[a] - closes[b]; });
            var topPeaks = peaks.slice(0, 3);
            var topTroughs = troughs.slice(0, 3);

            function addMarker(idx, type) {
                var cx = xScale(idx), cy = yScale(closes[idx]);
                var isPeak = type === 'peak';
                var color = isPeak ? '#d32f2f' : '#388e3c';
                var r = isPeak ? 4 : 4;

                // Small marker line
                var lineLen = 18;
                var lx1 = cx, ly1 = cy - (isPeak ? 5 : -5), lx2 = cx, ly2 = cy - (isPeak ? (lineLen + 5) : -(lineLen + 5));
                var markerLine = mk('line', { x1: lx1, y1: ly1, x2: lx2, y2: ly2, stroke: color, 'stroke-width': 1.5 });
                dotsG.appendChild(markerLine);

                var txt = mk('text', {
                    x: cx,
                    y: isPeak ? ly2 - 4 : ly2 + 14,
                    'text-anchor': 'middle',
                    'font-size': 9,
                    fill: color,
                    'font-weight': 'bold',
                    'font-family': 'Microsoft YaHei, PingFang SC, Arial, sans-serif'
                });
                var d = data[idx].date; // e.g. "2026-01-05"
                txt.textContent = parseInt(d.slice(5,7)) + '.' + parseInt(d.slice(8,10));
                dotsG.appendChild(txt);

                // Dot on the point
                var dot = mk('circle', { cx: cx, cy: cy, r: 3, fill: color, stroke: 'white', 'stroke-width': 1.5 });
                dotsG.appendChild(dot);
            }

            topPeaks.forEach(function(i) { addMarker(i, 'peak'); });
            topTroughs.forEach(function(i) { addMarker(i, 'trough'); });

            // ── Drag selection overlay ─────────────────────────────────
            var selG = svg.querySelector('#chartSelection');
            if (!selG) {
                selG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                selG.id = 'chartSelection';
                svg.appendChild(selG);
            }
            selG.innerHTML = '';

            // Invisible overlay rect for mouse events
            var hitRect = mk('rect', {
                x: PAD.left, y: PAD.top, width: chartW, height: chartH,
                fill: 'transparent', cursor: 'crosshair'
            });
            hitRect.style.pointerEvents = 'all';
            selG.appendChild(hitRect);

            var dragRect = null;
            var tooltip = null;

            function getIdx(e) {
                var rect = svg.getBoundingClientRect();
                var svgX = ((e.clientX - rect.left) / rect.width) * W;
                return Math.max(0, Math.min(n - 1, Math.round(((svgX - PAD.left) / chartW) * (n - 1))));
            }

            hitRect.addEventListener('mousedown', function(e) {
                _lcDragging = true;
                _lcDragStart = getIdx(e);
                _lcDragEnd = _lcDragStart;
            });

            svg.addEventListener('mousemove', function(e) {
                if (!_lcDragging) return;
                _lcDragEnd = getIdx(e);
                renderSelection();
            });

            svg.addEventListener('mouseup', function(e) {
                if (!_lcDragging) return;
                _lcDragging = false;
                _lcDragEnd = getIdx(e);
                renderSelection();
                showRangePopup();
            });

            function renderSelection() {
                selG.innerHTML = '';
                selG.appendChild(hitRect);
                if (_lcDragStart === null || _lcDragEnd === null) return;
                var s = Math.min(_lcDragStart, _lcDragEnd);
                var e2 = Math.max(_lcDragStart, _lcDragEnd);
                if (s === e2) return;
                var x1 = xScale(s), x2 = xScale(e2);
                var selRect = mk('rect', {
                    x: x1, y: PAD.top, width: x2 - x1, height: chartH,
                    fill: 'rgba(30,60,114,0.12)', stroke: '#1e3c72', 'stroke-width': 1, 'stroke-dasharray': '4,2'
                });
                selG.appendChild(selRect);
                // Left/right handles
                [x1, x2].forEach(function(x) {
                    var vln = mk('line', { x1: x, y1: PAD.top, x2: x, y2: PAD.top + chartH, stroke: '#1e3c72', 'stroke-width': 1 });
                    selG.appendChild(vln);
                });
            }

            function showRangePopup() {
                if (_lcDragStart === null || _lcDragEnd === null) return;
                var s = Math.min(_lcDragStart, _lcDragEnd);
                var e2 = Math.max(_lcDragStart, _lcDragEnd);
                if (e2 - s < 2) return;

                var d0 = data[s], d1 = data[e2];
                var pct = ((d1.close - d0.close) / d0.close * 100);
                var container = document.getElementById('lcChartContainer');
                if (!container) return;

                if (!tooltip) {
                    tooltip = document.createElement('div');
                    tooltip.id = 'chartRangeTip';
                    tooltip.style.cssText = 'position:absolute;background:rgba(30,60,114,0.92);color:white;padding:8px 14px;border-radius:8px;font-size:12px;pointer-events:none;z-index:20;white-space:nowrap;display:none;';
                    container.style.position = 'relative';
                    container.appendChild(tooltip);
                }
                tooltip.innerHTML =
                    '<div style="font-size:11px;opacity:0.7;margin-bottom:4px">' + d0.date + ' ~ ' + d1.date + '</div>' +
                    '<div style="font-size:14px;font-weight:bold">' +
                    (pct >= 0 ? '<span style="color:#ff6b6b">+</span>' : '<span style="color:#69db7c">') +
                    pct.toFixed(2) + '%</span></div>' +
                    '<div style="font-size:10px;opacity:0.6;margin-top:2px">' +
                    (d0.close / 10000).toFixed(3) + ' → ' + (d1.close / 10000).toFixed(3) + ' 万/吨' +
                    '</div>';
                tooltip.style.display = 'block';
                var x1p = (xScale(s) / W * 100);
                var x2p = (xScale(e2) / W * 100);
                var mid = (x1p + x2p) / 2;
                tooltip.style.left = mid + '%';
                tooltip.style.top = '10%';
                tooltip.style.transform = 'translateX(-50%)';

                setTimeout(function() {
                    if (tooltip) tooltip.style.display = 'none';
                }, 3000);
            }

            // ── Hover tooltip (simplified when not dragging) ─────────────
            var hoverTip = null;
            svg.addEventListener('mousemove', function(e) {
                if (_lcDragging) return;
                if (hoverTip === null) {
                    hoverTip = document.getElementById('chartHoverTip');
                }
                var idx = getIdx(e);
                var container = document.getElementById('lcChartContainer');
                if (!container) return;
                if (!hoverTip) {
                    hoverTip = document.createElement('div');
                    hoverTip.id = 'chartHoverTip';
                    hoverTip.className = 'chart-tooltip';
                    container.style.position = 'relative';
                    container.appendChild(hoverTip);
                }
                var d = data[idx];
                hoverTip.innerHTML = d.date + '<br>' + (d.close / 10000).toFixed(3) + ' 万/吨';
                hoverTip.style.display = 'block';
                var xp = (xScale(idx) / W * 100);
                hoverTip.style.left = xp + '%';
                hoverTip.style.top = (yScale(d.close) / H * 100) + '%';
            });
            svg.addEventListener('mouseleave', function() {
                if (_lcDragging) return;
                var ht = document.getElementById('chartHoverTip');
                if (ht) ht.style.display = 'none';
            });

            function mk(tag, attrs) {
                var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
                for (var k in attrs) el.setAttribute(k, attrs[k]);
                return el;
            }
        }

        window.addEventListener('DOMContentLoaded', function() { initLCChart(); });