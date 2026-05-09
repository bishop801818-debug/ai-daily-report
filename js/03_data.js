        function buildDynamicReportData(jsonReport) {
            const result = {};
            if (!jsonReport || !jsonReport.departments) return result;

            for (const [deptId, deptData] of Object.entries(jsonReport.departments)) {
                // 优先使用 _raw_content（旧格式兼容）
                const rawContent = deptData._raw_content || '';
                if (rawContent && rawContent.trim()) {
                    result[deptId] = {
                        title: deptData.name || deptId,
                        subtitle: deptData.subtitle || '',
                        date: jsonReport.date || CURRENT_REPORT_DATE,
                        content: rawContent,
                        headline: deptData.headline || '',
                        lead: deptData.lead_judgment || deptData.lead || '',
                        risk: deptData.risk_tip || deptData.risk || '',
                        summary: deptData.summary || '',
                        conclusion: deptData.conclusion || '',
                        window_start: deptData.window_start || '',
                        window_end: deptData.window_end || '',
                    };
                    continue;
                } else if (Array.isArray(deptData.sections)) {
                    // 新格式（数组）：sections 自包含全部内容
                    let html = sectionsToHTML(deptData.sections, deptData.window_end);
                    if (deptData.risk_tip || deptData.risk) {
                        html += `<div class="report-risk"><b>⚠️ 风险提示：</b>${deptData.risk_tip || deptData.risk}</div>\n`;
                    }
                    if (deptData.summary) {
                        const summaryText = deptData.summary;
                        const rawParts = summaryText.replace(/^[\s\n]+/, '').split(/\n/).filter(s => s.trim());
                        let bulletLines = rawParts.length <= 2 && summaryText.includes(' - ')
                            ? summaryText.split(/ *- */).filter(s => s.trim())
                            : rawParts;
                        const formattedSummary = bulletLines
                            .map(line => {
                                const trimmed = line.trim();
                                if (!trimmed || trimmed.startsWith('数据来源') || trimmed.startsWith('🦞')) return '';
                                const cleaned = trimmed.replace(/^[💡📌🔔\s]+/, '').trim();
                                return `  <div class="summary-bullet">${cleaned}</div>`;
                            })
                            .filter(html => html.trim())
                            .join('\n');
                        if (formattedSummary) {
                            html += `<div class="report-summary">
  <div class="report-summary-title">💡 今日小结</div>
${formattedSummary}
</div>\n`;
                        }
                    }
                    result[deptId] = {
                        title: deptData.name || deptId,
                        subtitle: deptData.subtitle || '',
                        date: jsonReport.date || CURRENT_REPORT_DATE,
                        content: html,
                        headline: deptData.headline || '',
                        lead: deptData.lead_judgment || deptData.lead || '',
                        risk: deptData.risk_tip || deptData.risk || '',
                        summary: deptData.summary || '',
                        conclusion: deptData.conclusion || '',
                        window_start: deptData.window_start || '',
                        window_end: deptData.window_end || '',
                    };
                } else {
                    // 兜底：既无 _raw_content 也无 sections 数组（理论上不会出现）
                    result[deptId] = {
                        title: deptData.name || deptId,
                        subtitle: deptData.subtitle || '',
                        date: jsonReport.date || CURRENT_REPORT_DATE,
                        content: `<div style="padding:20px;color:#999">该事业部数据格式异常，请检查 JSON</div>`,
                        headline: deptData.headline || '',
                        lead: deptData.lead_judgment || deptData.lead || '',
                        risk: '',
                        summary: '',
                        conclusion: '',
                        window_start: deptData.window_start || '',
                        window_end: deptData.window_end || '',
                    };
                }
            }
            return result;
        }

        /**
         * 初始化：从 JSON 文件加载报告数据
         */
        async function initDynamicData() {
            // embedded 模式：直接用内嵌数据，完全不走网络
            if (window.__EMBEDDED__ && window.__EMBEDDED__.report) {
                console.log('[initDynamicData] embedded 模式，使用内嵌数据');
                dynamicReportData = buildDynamicReportData(window.__EMBEDDED__.report);
                CURRENT_REPORT_DATE = window.__EMBEDDED__.today;
            } else {
                // 正常模式：从网络加载
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
                console.log(`[initDynamicData] 网络模式，尝试加载 ${todayStr}.json...`);
                const jsonData = await loadReportJSON(todayStr);
                if (jsonData && jsonData.departments) {
                    dynamicReportData = buildDynamicReportData(jsonData);
                    CURRENT_REPORT_DATE = todayStr;
                } else {
                    let found = false;
                    for (let daysBack = 1; daysBack <= 30; daysBack++) {
                        const d = new Date(today.getTime() - daysBack * 86400000);
                        const candidate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                        const data = await loadReportJSON(candidate);
                        if (data && data.departments) {
                            dynamicReportData = buildDynamicReportData(data);
                            CURRENT_REPORT_DATE = candidate;
                            console.log(`[initDynamicData] 使用最近文件 ${candidate}`);
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        // fallback: 尝试加载 index.json 获取最新可用日期
                        try {
                            const idxResp = await fetch('reports/index.json?v=' + HTML_VERSION);
                            if (idxResp.ok) {
                                const idxData = await idxResp.json();
                                const dates = idxData.available_dates || [];
                                if (dates.length > 0) {
                                    const latestDate = dates[0];
                                    console.log('[initDynamicData] fallback: 从index.json获取最新日期 ' + latestDate);
                                    const fallbackData = await loadReportJSON(latestDate);
                                    if (fallbackData && fallbackData.departments) {
                                        dynamicReportData = buildDynamicReportData(fallbackData);
                                        CURRENT_REPORT_DATE = latestDate;
                                        found = true;
                                    }
                                }
                            }
                        } catch(e2) {
                            console.warn('[initDynamicData] index.json fallback失败:', e2);
                        }
                    

                        console.warn('[initDynamicData] 30天内均无数据，使用硬编码 fallback');
                        dynamicReportData = reportData;
                        CURRENT_REPORT_DATE = '2026-04-28';
                    }
                }
            }
            
            // 更新 header-right 显示
            const headerRight = document.querySelector('.header-right');
            if (headerRight) {
                const displayDate = new Date(CURRENT_REPORT_DATE);
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                headerRight.textContent = '📅 ' + displayDate.toLocaleDateString('zh-CN', options);
            }
            
            console.log('[initDynamicData] 数据加载完成');
        }
        
        /**