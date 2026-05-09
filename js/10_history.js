        function goToDeptArchive(deptId) {
            window.location.href = 'dept-archive.html?id=' + deptId;
        }

        // 打开历史记录
        function openHistory(deptId) {
            currentDept = deptId;
            currentDate = new Date().toISOString().slice(0, 10);
            
            const deptName = reportData[deptId].title;
            document.getElementById('historyModalTitle').textContent = deptName + ' - 历史早报';
            
            loadHistoryData();
            initDatePickers(); // 初始化日期选择器
            
            document.getElementById('historyModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        // 关闭历史记录
        function closeHistory() {
            document.getElementById('historyModal').classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        
        // 加载历史数据
        async function loadHistoryData() {
            try {
                const response = await fetch('reports/index.json?v=' + HTML_VERSION);
                const indexData = await response.json();
                historyData = indexData;

                renderCalendar();
                renderRecentDays();
                renderHistoryList();
            } catch (error) {
                console.error('加载历史数据失败:', error);
                const container = document.getElementById('historyModalBody');
                if (container) {
                    container.innerHTML = `
                        <div style="text-align:center;padding:60px 20px;color:#999">
                            <div style="font-size:40px;margin-bottom:12px">⚠️</div>
                            <div style="font-size:15px;margin-bottom:6px">加载历史数据失败</div>
                            <div style="font-size:12px">请确认服务器已启动，或检查网络连接</div>
                            <div style="margin-top:16px;font-size:12px;color:#aaa">${error.message}</div>
                        </div>`;
                }
            }
        }

        // 渲染日历
        function renderCalendar(cy, cm) {
            const year = (cy !== undefined) ? cy : calendarYear;
            const month = (cm !== undefined) ? cm : calendarMonth;
            
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startDay = firstDay.getDay();
            const totalDays = lastDay.getDate();
            
            const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                               '七月', '八月', '九月', '十月', '十一月', '十二月'];
            
            let calendarHtml = `
                <div class="calendar-picker">
                    <div class="calendar-header">
                        <button class="calendar-nav" onclick="previousMonth()">◀ 上月</button>
                        <div class="calendar-title">${year}年 ${monthNames[month]}</div>
                        <button class="calendar-nav" onclick="nextMonth()">下月 ▶</button>
                    </div>
                    <div class="calendar-grid">
                        <div class="calendar-day-header">日</div>
                        <div class="calendar-day-header">一</div>
                        <div class="calendar-day-header">二</div>
                        <div class="calendar-day-header">三</div>
                        <div class="calendar-day-header">四</div>
                        <div class="calendar-day-header">五</div>
                        <div class="calendar-day-header">六</div>
            `;
            
            for (let i = 0; i < startDay; i++) {
                calendarHtml += '<div class="calendar-day empty"></div>';
            }
            
            for (let day = 1; day <= totalDays; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasReport = historyData.available_dates.includes(dateStr);
                const now = new Date();
                const isToday = dateStr === now.toISOString().slice(0, 10);
                
                let classes = 'calendar-day';
                if (hasReport) classes += ' has-report';
                if (isToday) classes += ' today';
                
                calendarHtml += `
                    <div class="${classes}" onclick="selectDate('${dateStr}')">
                        ${day}
                    </div>
                `;
            }
            
            calendarHtml += '</div></div>';
            
            let container = document.getElementById('historyModalBody');
            let existingCalendar = container.querySelector('.calendar-picker');
            if (existingCalendar) {
                existingCalendar.remove();
            }
            container.insertAdjacentHTML('afterbegin', calendarHtml);
        }
        
        // 渲染最近 7 天
        function renderRecentDays() {
            const recentDates = historyData.available_dates.slice(0, 7);
            const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            
            let html = '<div class="recent-days">';
            recentDates.forEach((date, index) => {
                const dateObj = new Date(date);
                const weekday = weekdays[dateObj.getDay()];
                const isActive = date === currentDate;
                
                html += `
                    <div class="recent-day-card ${isActive ? 'active' : ''}" onclick="selectDate('${date}')">
                        <div class="recent-day-date">${date.slice(5)}</div>
                        <div class="recent-day-weekday">${weekday}</div>
                    </div>
                `;
            });
            html += '</div>';
            
            let container = document.getElementById('historyModalBody');
            let existing = container.querySelector('.recent-days');
            if (existing) {
                existing.remove();
            }
            container.insertAdjacentHTML('afterbegin', html);
        }
        
        // 渲染历史列表
        function renderHistoryList() {
            const html = `
                <div class="history-list">
                    <div class="history-list-title">📋 历史早报列表</div>
                    ${historyData.available_dates.map(date => {
                        const today = new Date().toISOString().slice(0, 10);
                        const isToday = date === today;
                        const isActive = date === currentDate;
                        return `
                            <div class="history-item ${isActive ? 'active' : ''}" onclick="selectDate('${date}')">
                                <div>
                                    <div class="history-item-date">${date} ${isToday ? '(今日)' : ''}</div>
                                    <div class="history-item-info">点击查看详情</div>
                                </div>
                                <div class="history-item-actions">
                                    <button class="history-action-btn detail" onclick="event.stopPropagation(); viewReport('${date}')">详情页</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            
            let container = document.getElementById('historyModalBody');
            let existing = container.querySelector('.history-list');
            if (existing) {
                existing.remove();
            }
            container.insertAdjacentHTML('beforeend', html);
        }
        
        // 选择日期
        function selectDate(date) {
            // 如果在对比模式下，添加到对比列表
            if (compareMode) {
                selectCompareDate(date);
                return;
            }
            
            currentDate = date;
            renderRecentDays();
            renderHistoryList();
            viewReport(date);
        }
        
                const HISTORY_DIMS = [
            { key: 'topnews', icon: '📌', label: '今日要报' },
            { key: '市场',    icon: '📊', label: '市场/价格' },
            { key: '政策',    icon: '📜', label: '政策/行业' },
            { key: '竞品',   icon: '🔥', label: '企业动态' },
            { key: '前沿',   icon: '💻', label: '技术/产品' },
            { key: '客户',   icon: '🏗', label: '项目/招标' },
        ];

        function safeStr(s) {
            return String(s || '').replace(/\*\*/g, '')
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        // 查看早报
        function viewReport(date) {
            fetch(`reports/${date}.json?v=${HTML_VERSION}`)
                .then(response => response.json())
                .then(data => {
                    const deptData = data.departments[currentDept];
                    if (!deptData) {
                        alert('该日期暂无此事业部的早报');
                        return;
                    }

                    const sections = deptData.sections || {};
                    let contentHtml = `<div style="margin-bottom:16px;padding:12px;background:#e8f0ff;border-radius:8px;font-size:13px;color:#555;">
                        <strong>📅 报告日期：</strong>${date}　<strong>事业部：</strong>${deptData.name || currentDept}
                    </div>`;

                    // 新格式：sections 是有序数组 [{dim, title, items}, ...]
                    if (Array.isArray(sections)) {
                        for (const sec of sections) {
                            const isTopnews = sec.dim === 'topnews';
                            const items = sec.items || [];
                            if (!items.length) continue;
                            if (isTopnews) {
                                contentHtml += `<div class="report-section">
    <div class="report-section-title">📌 ${safeStr(sec.title || '今日要报')}</div>`;
                                for (let i = 0; i < items.length; i++) {
                                    const item = items[i];
                                    const title = safeStr(item.title || '');
                                    const body = safeStr(item.content || '');
                                    const source = safeStr(item.source || '');
                                    const itemDate = safeStr(item.date || '');
                                    contentHtml += `<div class="report-item">
    <div class="report-item-title" style="display:flex;gap:8px;align-items:baseline">
      <span style="color:#e74c3c;font-weight:bold">${i+1}.</span>
      <span>${title}</span>
    </div>
    ${body ? `<div class="report-item-content" style="margin-top:4px">${body}</div>\n` : ''}
    ${source || itemDate ? `<div style="font-size:12px;color:#888;margin-top:4px">来源：${source}${source && itemDate ? '，' : ''}${itemDate}</div>` : ''}
</div>`;
                                }
                                contentHtml += `</div>`;
                            } else {
                                const dimDef = HISTORY_DIMS.find(d => d.key === sec.dim) || {};
                                contentHtml += `<div class="report-section">
    <div class="report-section-title">${dimDef.icon || '📋'} ${safeStr(sec.title || sec.dim)}</div>`;
                                for (const item of items) {
                                    const rawTitle = item.title || '';
                                    const rawContent = item.content || '';
                                    const itemSource = item.source || '';
                                    const itemDate = item.date || deptData.window_end || date;
                                    let displaySource = itemSource;
                                    let displayDate = itemDate;
                                    let displayTitle = rawTitle;
                                    let displayContent = rawContent;
                                    if (!displaySource || !displayDate) {
                                        const metaMatch = rawTitle.match(/[（(]来源：([^，,]+)[，,]\s*(\d{4}-\d{2}-\d{2})[）)]/);
                                        if (metaMatch) {
                                            if (!displaySource) displaySource = metaMatch[1].trim();
                                            if (!displayDate) displayDate = metaMatch[2].trim();
                                            displayTitle = rawTitle.replace(/[（(]来源：[^）)]*[）)]/, '').trim();
                                        }
                                    }
                                    if (!displaySource || !displayDate) {
                                        const metaInContent = rawContent.match(/[（(]来源：([^，,)]+)[，,]\s*(\d{4}-\d{2}-\d{2})[）)]/);
                                        if (metaInContent) {
                                            if (!displaySource) displaySource = metaInContent[1].trim();
                                            if (!displayDate) displayDate = metaInContent[2].trim();
                                            displayContent = rawContent.replace(/[（(]来源：[^）)]*[）)]/, '').trim();
                                        }
                                    }
                                    const title = safeStr(displayTitle);
                                    const body = safeStr(displayContent);
                                    const source = safeStr(displaySource);
                                    const d = safeStr(displayDate);
                                    const priority = item.priority || 'P2';
                                    const priorityLabel = priority === 'P0' ? '🔥' : priority === 'P1' ? '📌' : '';
                                    contentHtml += `<div class="report-item">
    <div class="report-item-title" style="display:flex;gap:6px;align-items:center">
        ${priorityLabel ? `<span style="font-size:12px;color:#e74c3c">${priorityLabel}</span>` : ''}
        <span>${title}</span>
    </div>
    ${body ? `<div class="report-item-content">${body}</div>` : ''}
    ${(source || d) ? `<div style="font-size:12px;color:#888;margin-top:4px">${source ? '来源：'+source : ''}${source && d ? '，' : ''}${d}</div>` : ''}
</div>`;
                                }
                                contentHtml += `</div>`;
                            }
                        }
                    } else if (typeof sections === 'object' && sections !== null) {
                        for (const dim of HISTORY_DIMS) {
                            const items = sections[dim.key];
                            if (!items || !Array.isArray(items) || items.length === 0) continue;
                            contentHtml += `<div class="report-section">
    <div class="report-section-title">${dim.icon} ${dim.label}</div>`;
                            for (const item of items) {
                                const rawTitle = item.title || '';
                                const rawContent = item.content || '';
                                const itemSource = item.source || '';
                                const itemDate = item.date || deptData.window_end || date;
                                let displaySource = itemSource;
                                let displayDate = itemDate;
                                let displayTitle = rawTitle;
                                let displayContent = rawContent;
                                if (!displaySource || !displayDate) {
                                    const metaMatch = rawTitle.match(/[（(]来源：([^，,]+)[，,]\s*(\d{4}-\d{2}-\d{2})[）)]/);
                                    if (metaMatch) {
                                        if (!displaySource) displaySource = metaMatch[1].trim();
                                        if (!displayDate) displayDate = metaMatch[2].trim();
                                        displayTitle = rawTitle.replace(/[（(]来源：[^）)]*[）)]/, '').trim();
                                    }
                                }
                                if (!displaySource || !displayDate) {
                                    const metaInContent = rawContent.match(/[（(]来源：([^，,)]+)[，,]\s*(\d{4}-\d{2}-\d{2})[）)]/);
                                    if (metaInContent) {
                                        if (!displaySource) displaySource = metaInContent[1].trim();
                                        if (!displayDate) displayDate = metaInContent[2].trim();
                                        displayContent = rawContent.replace(/[（(]来源：[^）)]*[）)]/, '').trim();
                                    }
                                }
                                const title = safeStr(displayTitle);
                                const body = safeStr(displayContent);
                                const source = safeStr(displaySource);
                                const date = safeStr(displayDate);
                                const priority = item.priority || 'P2';
                                const priorityLabel = priority === 'P0' ? '🔥' : priority === 'P1' ? '📌' : '';
                                contentHtml += `<div class="report-item">
    <div class="report-item-title" style="display:flex;gap:6px;align-items:center">
        ${priorityLabel ? `<span style="font-size:12px;color:#e74c3c">${priorityLabel}</span>` : ''}
        <span>${title}</span>
    </div>
    ${body ? `<div class="report-item-content">${body}</div>` : ''}
    ${(source || date) ? `<div style="font-size:12px;color:#888;margin-top:4px">${source ? '来源：'+source : ''}${source && date ? '，' : ''}${date}</div>` : ''}
</div>`;
                            }
                            contentHtml += `</div>`;
                        }
                        const hasAnyData = Array.isArray(sections)
                            ? sections.some(sec => Array.isArray(sec.items) && sec.items.length > 0)
                            : HISTORY_DIMS.some(d => Array.isArray(sections[d.key]) && sections[d.key].length > 0);
                        if (!hasAnyData) {
                            contentHtml += `<div style="color:#999;text-align:center;padding:30px">暂无早报内容</div>`;
                        }

                        // 小结（summary 字段）
                        const summaryText = deptData.summary || '';
                        if (summaryText) {
                            const rawParts = summaryText.replace(/^[\s\n]+/, '').split(/\n/).filter(s => s.trim());
                            let bulletLines = rawParts.length <= 2 && summaryText.includes(' - ')
                                ? summaryText.split(/ *- */).filter(s => s.trim())
                                : rawParts;
                            const formattedSummary = bulletLines
                                .map(line => {
                                    const trimmed = line.trim();
                                    if (!trimmed || trimmed.startsWith('数据来源') || trimmed.startsWith('🦞')) return '';
                                    const cleaned = trimmed.replace(/^[💡📌🔔\s]+/, '').trim();
                                    return `<div class="summary-bullet">${cleaned}</div>`;
                                })
                                .filter(h => h.trim())
                                .join('');
                            if (formattedSummary) {
                                contentHtml += `<div class="report-summary" style="margin-top:16px">
    <div class="report-summary-title">💡 今日小结</div>
    ${formattedSummary}
</div>`;
                            }
                        }
                    } else if (Array.isArray(sections)) {
                        sections.forEach(section => {
                            contentHtml += `<div class="report-section">
    <div class="report-section-title">${safeStr(section.title || '')}</div>`;
                            (section.items || []).forEach(item => {
                                contentHtml += `<div class="report-item">
    <div class="report-item-title">${safeStr(item.title || '')}</div>
    ${item.content ? `<div class="report-item-content">${safeStr(item.content)}</div>` : ''}
</div>`;
                            });
                            contentHtml += `</div>`;
                        });
                    }

                    document.getElementById('modalTitle').textContent = deptData.name || currentDept;
                    document.getElementById('modalDate').textContent = (deptData.subtitle || '') + ' | ' + date;
                    document.getElementById('modalBody').innerHTML = contentHtml;
                    closeHistory();
                    document.getElementById('reportModal').classList.add('active');
                })
                .catch(error => {
                    console.error('加载早报失败:', error);
                    alert('加载早报失败，请稍后重试');
                });
        }
        
        // 切换视图