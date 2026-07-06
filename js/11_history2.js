        function initDatePickers() {
            const today = new Date();
            const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            document.getElementById('endDate').valueAsDate = today;
            document.getElementById('startDate').valueAsDate = lastWeek;
        }
        
        // 按日期范围筛选
        function filterByDateRange() {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            if (!startDate || !endDate) {
                renderHistoryList();
                return;
            }
            
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // 包含结束日期整天
            
            if (start > end) {
                alert('开始日期不能晚于结束日期！');
                return;
            }
            
            // 筛选日期范围内的数据
            if (historyData && historyData.reports) {
                filteredHistoryData = historyData.reports.filter(report => {
                    const reportDate = new Date(report.date);
                    return reportDate >= start && reportDate <= end;
                });
                renderHistoryList();
            }
        }
        
        // 重置日期筛选
        function resetDateFilter() {
            document.getElementById('startDate').value = '';
            document.getElementById('endDate').value = '';
            filteredHistoryData = [];
            document.getElementById('historySearch').value = '';
            renderHistoryList();
        }
        
        // 搜索历史记录
        function searchHistory() {
            const keyword = document.getElementById('historySearch').value.toLowerCase().trim();
            
            if (!keyword) {
                renderHistoryList();
                return;
            }
            
            // 在标题和内容中搜索关键词
            const searchResults = filteredHistoryData.length > 0 ? filteredHistoryData : historyData.reports;
            const results = searchResults.filter(report => {
                if (report.title && report.title.toLowerCase().includes(keyword)) {
                    return true;
                }
                if (report.sections) {
                    for (const section of report.sections) {
                        if (section.title && section.title.toLowerCase().includes(keyword)) {
                            return true;
                        }
                        if (section.items) {
                            for (const item of section.items) {
                                if ((item.title && item.title.toLowerCase().includes(keyword)) ||
                                    (item.content && item.content.toLowerCase().includes(keyword))) {
                                    return true;
                                }
                            }
                        }
                    }
                }
                return false;
            });
            
            renderSearchResults(results, keyword);
        }
        
        // 渲染搜索结果
        function renderSearchResults(results, keyword) {
            let html = '<div class="search-results">';
            
            if (results.length === 0) {
                html += `
                    <div class="no-results">
                        <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
                        <div style="color: #999;">未找到匹配"${keyword}"的结果</div>
                    </div>
                `;
            } else {
                html += `<div class="search-info">找到 ${results.length} 条相关记录</div>`;
                results.forEach(report => {
                    html += `
                        <div class="history-date-group" onclick="viewHistoryReport('${report.date}')">
                            <div class="history-date-header">
                                <span class="date-display">${formatDateDisplay(report.date)}</span>
                                <span class="view-report-btn">查看早报 →</span>
                            </div>
                        </div>
                    `;
                });
            }
            
            html += '</div>';
            document.getElementById('historyModalBody').innerHTML = html;
        }
        
        // 切换对比模式
        function toggleCompareMode() {
            compareMode = !compareMode;
            const compareBtn = document.querySelector('.compare-btn');
            const comparePanel = document.getElementById('comparePanel');
            
            if (compareMode) {
                compareBtn.classList.add('active');
                comparePanel.style.display = 'block';
                selectedDates = [];
                updateComparePanel();
            } else {
                compareBtn.classList.remove('active');
                comparePanel.style.display = 'none';
                selectedDates = [];
            }
        }
        
        // 关闭对比模式
        function closeCompare() {
            compareMode = false;
            document.querySelector('.compare-btn').classList.remove('active');
            document.getElementById('comparePanel').style.display = 'none';
            selectedDates = [];
            renderCalendar();
            renderRecentDays();
            renderHistoryList();
        }
        
        // 更新对比面板
        function updateComparePanel() {
            const countSpan = document.getElementById('selectedCount');
            const datesDiv = document.getElementById('compareDates');
            const startBtn = document.getElementById('startCompareBtn');
            
            countSpan.textContent = selectedDates.length;
            
            if (selectedDates.length === 0) {
                datesDiv.innerHTML = '<div style="color: rgba(255,255,255,0.8); font-size: 13px;">请在日历或日期列表中选择要对比的日期</div>';
                startBtn.style.display = 'none';
            } else {
                datesDiv.innerHTML = selectedDates.map(date => `
                    <div class="compare-date-item">
                        <span>📅 ${formatDateDisplay(date)}</span>
                        <span class="remove-date" onclick="removeCompareDate('${date}')">×</span>
                    </div>
                `).join('');
                
                if (selectedDates.length === 2) {
                    startBtn.style.display = 'block';
                } else {
                    startBtn.style.display = 'none';
                }
            }
        }
        
        // 移除对比日期
        function removeCompareDate(date) {
            selectedDates = selectedDates.filter(d => d !== date);
            updateComparePanel();
            renderCalendar();
            renderRecentDays();
            renderHistoryList();
        }
        
        // 选择对比日期
        function selectCompareDate(date) {
            if (!compareMode) return;
            
            if (selectedDates.includes(date)) {
                removeCompareDate(date);
            } else if (selectedDates.length < 2) {
                selectedDates.push(date);
                updateComparePanel();
            } else {
                alert('最多只能选择 2 个日期进行对比');
            }
        }
        
        // 开始对比
        function startCompare() {
            if (selectedDates.length !== 2) {
                alert('请选择 2 个日期进行对比');
                return;
            }
            
            // 打开对比视图
            openCompareView(selectedDates[0], selectedDates[1]);
        }
        
        // 打开对比视图
        function openCompareView(date1, date2) {
            const deptName = reportData[currentDept].title;
            const html = `
                <div class="compare-view">
                    <div class="compare-view-header">
                        <h2>📊 ${deptName} 早报对比</h2>
                        <button class="close-compare-view" onclick="closeCompareView()">×</button>
                    </div>
                    <div class="compare-dates-header">
                        <div class="compare-date-column">
                            <div class="compare-date-label">${formatDateDisplay(date1)}</div>
                        </div>
                        <div class="compare-date-column">
                            <div class="compare-date-label">${formatDateDisplay(date2)}</div>
                        </div>
                    </div>
                    <div class="compare-content">
                        <p style="text-align: center; color: #999; padding: 40px;">
                            对比功能详细实现中...<br>
                            将展示两个日期的关键数据差异分析
                        </p>
                    </div>
                </div>
            `;
            document.getElementById('historyModalBody').innerHTML = html;
        }
        
        // 关闭对比视图
        function closeCompareView() {
            renderCalendar();
            renderRecentDays();
            renderHistoryList();
        }
        
        // 格式化日期显示
        function formatDateDisplay(dateStr) {
            const date = new Date(dateStr);
            const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const weekday = weekdays[date.getDay()];
            return `${month}月${day}日 ${weekday}`;
        }
        
        // 导出历史记录
        function exportHistory() {
            const deptName = reportData[currentDept].title;
            const exportData = filteredHistoryData.length > 0 ? filteredHistoryData : historyData.reports;
            
            let text = `${deptName} 历史早报\n`;
            text += `导出时间：${new Date().toLocaleString('zh-CN')}\n`;
            text += `共 ${exportData.length} 条记录\n\n`;
            text += '='.repeat(50) + '\n\n';
            
            exportData.forEach(report => {
                text += `【${report.date}】\n`;
                if (report.sections) {
                    report.sections.forEach(section => {
                        text += `\n${section.title}\n`;
                        if (section.items) {
                            section.items.forEach(item => {
                                text += `• ${item.title || item}\n`;
                            });
                        }
                    });
                }
                text += '\n' + '-'.repeat(50) + '\n\n';
            });
            
            // 创建下载
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${deptName}_历史早报_${new Date().toISOString().slice(0,10)}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        }
        
        // 点击历史弹窗外部关闭
        document.getElementById('historyModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeHistory();
            }
        });
        
        // ESC 键关闭历史弹窗
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeHistory();
            }
        });
        
        // 点击弹窗外部关闭
        document.getElementById('reportModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeReport();
            }
        });
        
        // ESC 键关闭弹窗（优先关闭报告弹窗）
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const reportModal = document.getElementById('reportModal');
                const historyModal = document.getElementById('historyModal');
                
                if (reportModal.classList.contains('active')) {
                    closeReport();
                } else if (historyModal.classList.contains('active')) {
                    closeHistory();
                }
            }
        });

        // ============================================================
        // 页面初始化：自动加载当天报告 JSON（同步等待）
        // ============================================================
        (async function() {
            console.log('[DEBUG] 开始加载数据...');
            try {
                await initDynamicData();
                console.log('[DEBUG] 数据加载完成，dynamicReportData=', dynamicReportData);
                if (!dynamicReportData) {
                    console.error('[ERROR] dynamicReportData 为空');
                }
            } catch(e) {
                console.error('[ERROR] initDynamicData 异常:', e);
            }

            // 确保 loading overlay 消失（embedded 模式下 window.load 不触发）
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
                setTimeout(() => { loadingOverlay.style.display = 'none'; }, 500);
            }
        })();
        // 页面加载时自动读取碳酸锂期货实时数据
        updateMarketCards();


    
        // ============================================================
        // 碳酸锂期货折线图  v2 - 区间选择 + 高低标注 + 更多日期
        // ============================================================