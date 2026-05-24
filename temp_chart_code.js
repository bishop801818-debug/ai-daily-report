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

                if (!data.history || data.history.length === 0) {
                    if (loading) loading.style.display = 'none';
                    if (noData) noData.style.display = 'flex';
                    return;
                }

                _lithiumOreChartData = data;

                // 更新标题栏信息（显示6%澳洲的最新价）
                var latest = data.history[data.history.length - 1];
                var priceEl = document.getElementById('lithiumOreLatestPrice');
                var changeEl = document.getElementById('lithiumOreLatestChange');
                var updatedEl = document.getElementById('lithiumOreChartUpdated');

                if (priceEl && latest) {
                    priceEl.textContent = latest.avg_price.toFixed(0) + ' ' + (latest.unit || '美元/吨');
                }
                if (changeEl && data.history.length >= 2) {
                    var prev = data.history[data.history.length - 2].avg_price;
                    var curr = latest.avg_price;
                    var pct = prev > 0 ? ((curr - prev) / prev * 100) : 0;
                    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
                }
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

            // 过滤出6%澳洲的数据（如果有），否则用所有数据
            var filtered = historyData.filter(function(d) {
                return d.grade === '6%' && d.origin === '澳洲';
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
            lineG.appendChild(mk('path', { d: linePath, fill: 'none', stroke: '#e91e63', 'stroke-width': 2 }));

            // 最新点标记
            var lastIdx = filtered.length - 1;
            lineG.appendChild(mk('circle', { cx: xScale(lastIdx), cy: yScale(filtered[lastIdx].avg_price), r: 4, fill: '#e91e63', stroke: '#fff', 'stroke-width': 2 }));
        }

        // 锂云母价格走势图
        // ============================================================
        var _lepidoliteChartData = null;
        var _lepidoliteChartW = 800, _lepidoliteChartH = 260;
        var _lepidolitePad = { top: 15, right: 15, bottom: 35, left: 75 };

        async function initLepidoliteChart() {
            var loading = document.getElementById('lepidoliteChartLoading');
            var noData = document.getElementById('lepidoliteChartNoData');
            var svg = document.getElementById('lepidoliteChart');
            if (!svg) return;

            try {
                var resp = await fetch('data/lepidolite_price_history.json?t=' + Date.now());
                if (!resp.ok) throw new Error('HTTP error');
                var data = await resp.json();

                if (!data.history || data.history.length === 0) {
                    if (loading) loading.style.display = 'none';
                    if (noData) noData.style.display = 'flex';
                    return;
                }

                _lepidoliteChartData = data;

                // 更新标题栏信息
                var latest = data.history[data.history.length - 1];
                var priceEl = document.getElementById('lepidoliteLatestPrice');
                var changeEl = document.getElementById('lepidoliteLatestChange');
                var updatedEl = document.getElementById('lepidoliteChartUpdated');

                if (priceEl && latest) {
                    priceEl.textContent = latest.avg_price.toFixed(0) + ' ' + (latest.unit || '元/吨');
                }
                if (changeEl && data.history.length >= 2) {
                    var prev = data.history[data.history.length - 2].avg_price;
                    var curr = latest.avg_price;
                    var pct = prev > 0 ? ((curr - prev) / prev * 100) : 0;
                    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
                }
                if (updatedEl) updatedEl.textContent = 'Update: ' + data.update_time;

                drawLepidoliteChart(svg, data.history);
                if (noData) noData.style.display = 'none';

                function fitSvgToContainer2() {
                    var svg2 = document.getElementById('lepidoliteChart');
                    var parent = svg2 && svg2.parentElement;
                    if (parent) {
                        var pw = parent.clientWidth || 800;
                        svg2.setAttribute('width', pw);
                        svg2.setAttribute('height', Math.round(pw * 260 / 800));
                    }
                }
                fitSvgToContainer2();
                window.addEventListener('resize', function() { fitSvgToContainer2(); });

                if (loading) loading.style.display = 'none';
            } catch (e) {
                console.warn('[Lepidolite Chart] load failed:', e);
                if (loading) loading.style.display = 'none';
                if (noData) noData.style.display = 'flex';
            }
        }

        function drawLepidoliteChart(svg, historyData) {
            var W = _lepidoliteChartW, H = _lepidoliteChartH;
            var PAD = _lepidolitePad;
            var chartW = W - PAD.left - PAD.right;
            var chartH = H - PAD.top - PAD.bottom;

            var prices = historyData.map(function(d) { return d.avg_price; });
            var minPrice = Math.min.apply(null, prices);
            var maxPrice = Math.max.apply(null, prices);
            var priceRange = maxPrice - minPrice || 1;
            var padding = priceRange * 0.1;
            minPrice -= padding; maxPrice += padding;

            function xScale(i) { return PAD.left + (i / (historyData.length - 1)) * chartW; }
            function yScale(p) { return PAD.top + (1 - (p - minPrice) / (maxPrice - minPrice)) * chartH; }

            var gridG = svg.querySelector('#lepidoliteChartGrid');
            var areaG = svg.querySelector('#lepidoliteChartArea');
            var lineG = svg.querySelector('#lepidoliteChartLine');
            var axisXG = svg.querySelector('#lepidoliteChartAxisX');
            var axisYG = svg.querySelector('#lepidoliteChartAxisY');

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

            // X轴标签
            var step = Math.max(1, Math.floor(historyData.length / 6));
            for (var i = 0; i < historyData.length; i += step) {
                var x = xScale(i);
                var date = historyData[i].date;
                if (date && date.length >= 10) date = date.substring(5, 10);
                axisXG.appendChild(mk('text', { x: x, y: PAD.top + chartH + 20, 'text-anchor': 'middle', 'font-size': 10, fill: '#999' }));
                axisXG.lastChild.textContent = date;
                axisXG.appendChild(mk('line', { x1: x, y1: PAD.top + chartH, x2: x, y2: PAD.top + chartH + 5, stroke: '#ccc', 'stroke-width': 1 }));
            }

            // 面积图
            var areaPath = 'M ' + xScale(0) + ' ' + yScale(minPrice);
            for (var i = 0; i < historyData.length; i++) {
                areaPath += ' L ' + xScale(i) + ' ' + yScale(historyData[i].avg_price);
            }
            areaPath += ' L ' + xScale(historyData.length - 1) + ' ' + yScale(minPrice) + ' Z';
            areaG.appendChild(mk('path', { d: areaPath, fill: 'url(#lepidoliteChartGrad)', stroke: 'none' }));

            // 折线图
            var linePath = '';
            for (var i = 0; i < historyData.length; i++) {
                if (i === 0) linePath = 'M ' + xScale(i) + ' ' + yScale(historyData[i].avg_price);
                else linePath += ' L ' + xScale(i) + ' ' + yScale(historyData[i].avg_price);
            }
            lineG.appendChild(mk('path', { d: linePath, fill: 'none', stroke: '#9c27b0', 'stroke-width': 2 }));

            // 最新点标记
            var lastIdx = historyData.length - 1;
            lineG.appendChild(mk('circle', { cx: xScale(lastIdx), cy: yScale(historyData[lastIdx].avg_price), r: 4, fill: '#9c27b0', stroke: '#fff', 'stroke-width': 2 }));
        }