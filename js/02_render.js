        function sectionsToHTML(sections, windowEnd) {
            if (!sections) return '';
            const stripMd = s => String(s).replace(/\*\*/g, '');
            const safe = s => stripMd(String(s)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));

            // MD原始顺序
            const ORDERED_DIMS = [
                { key: 'topnews', icon: '📌', label: '今日要报' },
                { key: '市场',    icon: '📊', label: '市场/价格' },
                { key: '政策',    icon: '📜', label: '政策/行业' },
                { key: '竞品',   icon: '🔥', label: '企业动态' },
                { key: '前沿',   icon: '💻', label: '技术/产品' },
                { key: '客户',   icon: '🏗', label: '项目/招标' },
            ];

            const splitMultiItems = text => {
                let parts = text.split(/\n\*\*/);
                if (parts.length > 1) return parts.map(p => p.replace(/\*\*/g, '').trim()).filter(p => !!p);
                const stripped = text.replace(/\*\*/g, '');
                const p2 = stripped.split(/\n\n+/);
                if (p2.length > 1) return p2.map(p => p.trim()).filter(p => !!p);
                const p3 = stripped.split(/(?=\n\s*\d+[．、.]\s*)/);
                const result = [];
                for (const p of p3) {
                    const t = p.trim();
                    if (!t) continue;
                    const m = t.match(/^\d+[．、.]\s*(.*)$/s);
                    result.push(m ? m[1].trim() : t);
                }
                return result;
            };

            const renderItem = (item, windowEnd) => {
                if (typeof item === 'string') {
                    const matchA = item.match(/^(\d+)[．、.]\s+([^*\n][^\n]*?)(?:\n|$)([\s\S]*)$/);
                    const matchB = item.match(/^(\d+)[．、.]\s+([^*\n][^\n]*)$/);
                    const m = matchA || matchB;
                    let num = '', titleText = '', bodyText = '';
                    if (m) {
                        num = m[1]; titleText = m[2].trim(); bodyText = (m[3] || '').trim();
                    } else {
                        const lines = item.split('\n');
                        titleText = (lines[0] || '').trim();
                        bodyText = lines.slice(1).join('\n').trim();
                    }
                    return `  <div class="hy-item" onclick="this.classList.toggle('expanded')">
    <div class="hy-item-title">
      <span class="item-num">${safe(num || '•')}</span>
      <span class="hy-item-title-text">${safe(titleText)}</span>
      <span class="hy-item-expand-icon">▼</span>
    </div>
    ${bodyText ? `    <div class="hy-item-body">${safe(bodyText)}</div>\n` : ''}  </div>`;
                } else {
                    const lvl = item.level || (item.priority === 'P0' ? 'A' : item.priority === 'P1' ? 'B' : 'C');
                    const lvlClass = lvl === 'A' ? 'level-a' : lvl === 'P1' ? 'level-b' : 'level-c';
                    const titleText = item.title || '';
                    const bodyText = item.content || '';
                    return `<div class="report-item">
    <div class="report-item-title ${lvlClass}">${safe(titleText)}</div>
    ${bodyText ? `<div class="report-item-content">${safe(bodyText)}</div>\n` : ''}
    ${item.impact ? `<div class="report-item-impact">📎 ${safe(item.impact)}</div>\n` : ''}  </div>`;
                }
            };

            // --- 新格式：sections 是有序数组 [{dim, title, items}, ...] ---
            if (Array.isArray(sections)) {
                let html = '';
                for (const sec of sections) {
                    const isTopnews = sec.dim === 'topnews';
                    const items = sec.items || [];
                    if (!items.length) continue;

                    // 今日要报：编号 + 标题 + 正文内容
                    if (isTopnews) {
                        html += `<div class="report-section">
  <div class="report-section-title">📌 ${safe(sec.title || '今日要报')}</div>
`;
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            const titleText = item.title || '';
                            const contentText = item.content || '';
                            const lvl = item.priority === 'P0' ? 'level-a' : item.priority === 'P1' ? 'level-b' : 'level-c';
                            html += `  <div class="report-item ${lvl}">
    <div class="report-item-title" style="display:flex;gap:8px;align-items:baseline">
      <span style="color:#e74c3c;font-weight:bold">${i+1}.</span>
      <span>${safe(titleText)}</span>
    </div>
    ${contentText ? `    <div class="report-item-content" style="margin-top:4px">${safe(contentText)}</div>\n` : ''}  </div>\n`;
                        }
                        html += `</div>\n`;
                        continue;
                    }

                    // 普通章节：保留MD原始标题
                    const dimDef = ORDERED_DIMS.find(d => d.key === sec.dim) || {};
                    html += `<div class="report-section">
  <div class="report-section-title">${dimDef.icon || '📋'} ${safe(sec.title || sec.dim)}</div>
`;
                    for (const item of items) {
                        if (typeof item === 'string') {
                            const parts = splitMultiItems(item);
                            for (const p of parts) html += renderItem(p, windowEnd) + '\n';
                        } else {
                            html += renderItem(item, windowEnd) + '\n';
                        }
                    }
                    html += `</div>\n`;
                }
                return html;
            }

            // --- 旧dict格式：按MD顺序映射 ---
            const dimLabelMap = {
                topnews: ['今日要报', '📌'],
                '市场': ['市场/价格', '📊'],
                '政策': ['政策/行业', '📜'],
                '竞品': ['企业动态', '🔥'],
                '前沿': ['技术/产品', '💻'],
                '客户': ['项目/招标', '🏗'],
            };
            let html = '';
            for (const dimDef of ORDERED_DIMS) {
                const items = sections[dimDef.key];
                if (!items || !Array.isArray(items) || items.length === 0) continue;
                const [label, icon] = dimLabelMap[dimDef.key] || [dimDef.label, dimDef.icon];
                html += `<div class="report-section">
  <div class="report-section-title">${icon} ${label}</div>
`;
                for (const item of items) {
                    if (typeof item === 'string') {
                        const parts = splitMultiItems(item);
                        for (const p of parts) html += renderItem(p, windowEnd) + '\n';
                    } else {
                        html += renderItem(item, windowEnd) + '\n';
                    }
                }
                html += `</div>\n`;
            }
            return html;
        }
