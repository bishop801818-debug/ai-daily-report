        function getReportData(deptId) {
            // 优先用动态数据
            if (dynamicReportData && dynamicReportData[deptId]) {
                console.log('[getReportData] ✓ 命中 dynamicReportData[' + deptId + '], content长度=' + dynamicReportData[deptId].content.length);
                return dynamicReportData[deptId];
            }
            // fallback 到硬编码数据
            console.warn('[getReportData] ✗ dynamicReportData无数据，fallback: reportData[' + deptId + ']=' + (!!reportData[deptId]));
            return reportData[deptId] || null;
        }
        function openReport(deptId, autoPlay = false) {
            
            const data = getReportData(deptId);
            
            if (!data) {
                // 无数据时显示友好提示
                document.getElementById('modalBody').innerHTML =
                    '<div style="text-align:center;padding:40px;color:#999">' +
                    '<div style="font-size:48px;margin-bottom:16px">📭</div>' +
                    '<div>该事业部今日暂无早报数据</div>' +
                    '<div style="font-size:13px;margin-top:8px">请运行 python daily_briefing_search.py 生成当日数据</div>' +
                    '</div>';
                document.getElementById('modalTitle').textContent = (deptId.toUpperCase()) + ' 事业部早报';
                document.getElementById('modalDate').textContent =
                    CURRENT_REPORT_DATE.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1 年 $2 月 $3 日');
                document.getElementById('reportModal').classList.add('active');
                document.body.style.overflow = 'hidden';
                return;
            }

            const dateDisplay = (data.date || CURRENT_REPORT_DATE)
                .replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1 年 $2 月 $3 日');
            document.getElementById('modalTitle').textContent = data.title + '事业部早报';
            document.getElementById('modalDate').textContent = data.subtitle + ' | ' + dateDisplay;

            let contentHtml = data.content;
            
            if (autoPlay) {
                contentHtml += '<div class="auto-play-controls" id="autoPlayControls" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #f0f0f0;">';
                contentHtml += '<button class="control-btn" onclick="previousDept()">◀ 上一个</button>';
                contentHtml += '<button class="control-btn" id="pauseBtn" onclick="togglePause()">暂停</button>';
                contentHtml += '<button class="control-btn" onclick="nextDept()">下一个 ▶</button>';
                contentHtml += '<button class="control-btn" onclick="stopAutoPlay()">停止播放</button>';
                contentHtml += '</div>';
            }

            // 强制覆盖：确保 modalBody 有白底，hy-item 样式由 CSS class 控制（不能用 inline display:none，否则展开失效）
            const modalBody = document.getElementById('modalBody');
            modalBody.style.cssText = 'background:#fff;padding:30px;min-height:200px;';
            modalBody.innerHTML = contentHtml;

            // 只覆盖字体、颜色、间距等非 display 属性，不碰 display（由 CSS .expanded 控制展开）
            setTimeout(() => {
                document.querySelectorAll('#modalBody .hy-item').forEach(el => {
                    el.style.cssText = 'background:#f8f9fa;border-radius:10px;padding:14px 18px;margin-bottom:10px;border:1px solid #e8ecf0;border-left:4px solid #1e3c72;cursor:pointer;';
                });
                document.querySelectorAll('#modalBody .hy-item-title').forEach(el => {
                    el.style.cssText = 'font-size:15px;font-weight:bold;color:#1a2a3a;line-height:1.4;display:flex;align-items:flex-start;gap:8px;';
                });
                document.querySelectorAll('#modalBody .hy-item-body').forEach(el => {
                    // 注意：不设置 display，CSS .hy-item-body{display:none} + .expanded{display:block} 控制展开
                    el.style.cssText = 'font-size:14px;color:#555;line-height:1.85;margin-top:10px;padding-top:10px;border-top:1px solid #e8ecf0;';
                });
                document.querySelectorAll('#modalBody .item-num').forEach(el => {
                    el.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;background:#1e3c72;color:#fff;border-radius:50%;font-size:11px;font-weight:bold;flex-shrink:0;';
                });
                document.querySelectorAll('#modalBody .hy-item-expand-icon').forEach(el => {
                    el.style.cssText = 'margin-left:auto;font-size:12px;color:#999;';
                });
                document.querySelectorAll('#modalBody .report-section-title').forEach(el => {
                    el.style.cssText = 'font-size:16px;font-weight:bold;color:#1e3c72;padding:12px 0 8px 0;border-bottom:2px solid #1e3c72;margin-bottom:12px;';
                });
            }, 50);

            document.getElementById('reportModal').classList.add('active');
            document.body.style.overflow = 'hidden';

            if (autoPlay) {
                startAutoPlay();
            }
        }
        
        // 关闭报告弹窗