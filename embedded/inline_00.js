
// === TAB CONFIGURATION ===
// type: 'industry'=指标卡+竖表 | 'model-output'=型号产量横表 | 'company'=企业排名表
//       'trade-total'=贸易总量表 | 'trade-partner'=贸易伙伴表 | 'spot-price'=现货价格表

const TAB_CONFIG = [
    // === 三元正极 (NCM Cathode) ===
    { id:'ncm-industry', group:'三元正极', table:'NCM-行业整体产量',
      icon:'📊', title:'行业整体产量', type:'industry' },
    { id:'ncm-model', group:'三元正极', table:'NCM-分型号产量',
      icon:'📊', title:'分型号产量', type:'model-output' },
    { id:'ncm-company', group:'三元正极', table:'NCM-分企业产量',
      icon:'🏭', title:'分企业产量', type:'company' },
    { id:'ncm-export', group:'三元正极', table:'NCM-出口总量',
      icon:'🚢', title:'出口总量', type:'trade-total' },
    { id:'ncm-export-partner', group:'三元正极', table:'NCM-出口目的地',
      icon:'🌏', title:'出口目的地', type:'trade-partner' },
    { id:'ncm-import', group:'三元正极', table:'NCM-进口总量',
      icon:'🛥️', title:'进口总量', type:'trade-total' },
    { id:'ncm-import-partner', group:'三元正极', table:'NCM-进口目的地',
      icon:'🌏', title:'进口目的地', type:'trade-partner' },
    { id:'ncm-price', group:'三元正极', table:'NCM-现货市场价',
      icon:'💰', title:'现货市场价', type:'spot-price' },

    // === 三元前驱体 (NCM Precursor) ===
    { id:'pre-industry', group:'三元前驱体', table:'NCMpre-行业整体产量',
      icon:'📊', title:'行业整体产量', type:'industry' },
    { id:'pre-model', group:'三元前驱体', table:'NCMpre-分型号产量',
      icon:'📊', title:'分型号产量', type:'model-output' },
    { id:'pre-company', group:'三元前驱体', table:'NCMpre-分企业产量',
      icon:'🏭', title:'分企业产量', type:'company' },
    { id:'pre-export', group:'三元前驱体', table:'NCMpre-出口总量',
      icon:'🚢', title:'出口总量', type:'trade-total' },
    { id:'pre-export-partner', group:'三元前驱体', table:'NCMpre-出口目的地',
      icon:'🌏', title:'出口目的地', type:'trade-partner' },
    { id:'pre-import', group:'三元前驱体', table:'NCMpre-进口总量',
      icon:'🛥️', title:'进口总量', type:'trade-total' },
    { id:'pre-import-partner', group:'三元前驱体', table:'NCMpre-进口目的地',
      icon:'🌏', title:'进口目的地', type:'trade-partner' },
    { id:'pre-price', group:'三元前驱体', table:'NCMpre-现货市场价',
      icon:'💰', title:'现货市场价', type:'spot-price' },

    // === 关键原料 (Key Raw Materials) ===
    { id:'raw-price', group:'关键原料', table:'关键原料-现货市场价',
      icon:'💰', title:'关键原料现货价', type:'spot-price' },
    { id:'cobalt-industry', group:'关键原料', table:'四氧化三钴-行业整体产量',
      icon:'📊', title:'四氧化三钴产量规模', type:'industry' },
    { id:'cobalt-price', group:'关键原料', table:'四氧化三钴-现货市场价',
      icon:'💰', title:'四氧化三钴现货价', type:'spot-price' }
];

const GROUP_ICONS = { '三元正极':'🔋', '三元前驱体':'⚗️', '关键原料':'🧪' };

// === UTILITY FUNCTIONS ===
function num(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
function pct(v) { if (v == null || v === '') return '-'; var s = String(v); return s.includes(' ') && /\d{2}:\d{2}:\d{2}$/.test(s) ? s.split(' ')[0] : s; }
function fmtNum(v) { const n = num(v); return n ? n.toLocaleString() : '-'; }
function fmtDate(v) { return v ? String(v).split(' ')[0] : '-'; }

let allData = {};
let activeTabId = null;

// === BUILD UI ===
function buildSidebar() {
    let html = '';
    const groups = [...new Set(TAB_CONFIG.map(t => t.group))];
    groups.forEach(group => {
        html += `<div class="nav-section"><div class="nav-section-title">${GROUP_ICONS[group]||''} ${group}</div>`;
        TAB_CONFIG.filter(t => t.group === group).forEach((t, i) => {
            html += `<div class="nav-item${i===0 && group===groups[0]?' active':''}"
                         onclick="showTab('${t.id}', this)" data-tab="${t.id}">
                <div class="nav-item-icon">${t.icon}</div>
                <span class="nav-item-text">${t.title}</span>
                <span class="nav-item-badge" id="badge-${t.id}">—</span></div>`;
        });
        html += '</div>';
    });
    document.getElementById('sidebarNav').innerHTML = html;
}

function buildContentAreas() {
    let html = '';
    TAB_CONFIG.forEach((t, i) => {
        html += `<div id="${t.id}" class="content-section${i===0?' active':''}">
            <div class="metrics-grid" id="${t.id}-metrics" style="display:none"></div>
            <div class="data-card">
                <div class="data-card-header">
                    <div class="data-card-title">${t.icon} ${t.title}</div>
                    <div class="data-card-actions">
                        <button class="action-btn" onclick="exportTable('${t.id}-table')">📥 导出CSV</button>
                    </div>
                </div>
                <div class="table-container">
                    <table class="data-table" id="${t.id}-table">
                        <thead><tr id="${t.id}-head"></tr></thead>
                        <tbody id="${t.id}-body"><tr><td class="loading">数据加载中</td></tr></tbody>
                    </table>
                </div>
            </div>
        </div>`;
    });
    document.getElementById('contentArea').innerHTML = html;
}

// === SIDEBAR TOGGLE & TAB SWITCHING ===
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
}

function showTab(tabId, element) {
    document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const section = document.getElementById(tabId);
    if (section) section.classList.add('active');
    if (element) element.classList.add('active');
    activeTabId = tabId;
    const cfg = TAB_CONFIG.find(t => t.id === tabId);
    if (cfg) {
        renderConfigTable(cfg);
        window.location.hash = tabId;
    }
}

function restoreTabFromHash() {
    const hash = window.location.hash.slice(1);
    if (hash) {
        const navItem = document.querySelector(`[data-tab="${hash}"]`);
        if (navItem) showTab(hash, navItem);
        else {
            // First tab by default
            const first = TAB_CONFIG[0];
            const firstNav = document.querySelector(`[data-tab="${first.id}"]`);
            if (firstNav) showTab(first.id, firstNav);
        }
    }
}

// === RENDER ENGINES ===

function getHeaders(data) {
    if (!data || !data.length) return [];
    return Object.keys(data[0]);
}

function renderTableHeader(tableId, headers) {
    document.getElementById(tableId + '-head').innerHTML =
        headers.map(h => `<th>${h}</th>`).join('');
}

function renderIndustryTable(cfg, data) {
    // Metrics cards
    const sorted = [...data].sort((a,b) => String(b['月份']||'').localeCompare(a['月份']||''));
    const latest = sorted[0] || {};
    const metricsEl = document.getElementById(cfg.id + '-metrics');
    metricsEl.style.display = 'grid';
    metricsEl.innerHTML = `
        <div class="metric-card"><div class="metric-label">月度产量（${pct(latest['月份'])}）</div>
            <div class="metric-value">${fmtNum(latest['月度产量'])}<span class="metric-unit">吨</span></div></div>
        <div class="metric-card"><div class="metric-label">产能利用率（${pct(latest['月份'])}）</div>
            <div class="metric-value">${pct(latest['产能利用率'])}</div></div>
        <div class="metric-card"><div class="metric-label">月度产能（${pct(latest['月份'])}）</div>
            <div class="metric-value">${fmtNum(latest['月度产能'])}<span class="metric-unit">吨</span></div></div>
    `;
    // Table
    const headers = getHeaders(data);
    renderTableHeader(cfg.id, headers);
    let html = sorted.slice(0, 24).map(d =>
        `<tr>${headers.map(h => `<td>${pct(d[h])}</td>`).join('')}</tr>`
    ).join('');
    document.getElementById(cfg.id + '-body').innerHTML = html || '<tr><td class="loading">暂无数据</td></tr>';
}

function renderModelOutputTable(cfg, data) {
    document.getElementById(cfg.id + '-metrics').style.display = 'none';
    if (!data.length) {
        document.getElementById(cfg.id + '-body').innerHTML = '<tr><td class="loading">暂无数据</td></tr>';
        return;
    }
    const headers = getHeaders(data);
    // Identify fixed columns (non-numeric/date columns) vs model columns
    const fixedCols = [];
    const modelCols = [];
    headers.forEach(h => {
        const vals = data.slice(0, 5).map(d => d[h]);
        const allNumeric = vals.every(v => v !== null && v !== '' && !isNaN(parseFloat(v)));
        if (allNumeric && !/日期|月份|年|月/.test(h)) {
            modelCols.push(h);
        } else {
            fixedCols.push(h);
        }
    });
    // Build melted table: each row = (fixed columns + 型号 + 产量)
    const meltedHeaders = [...fixedCols, '型号', '产量（吨）'];
    renderTableHeader(cfg.id, meltedHeaders);
    const sorted = [...data].sort((a,b) => String(b['月份']||b['日期']||'').localeCompare(a['月份']||a['日期']||''));
    let html = '';
    sorted.forEach(d => {
        modelCols.forEach((mc, mi) => {
            const val = d[mc];
            if (val == null || val === '') return;
            html += '<tr>';
            fixedCols.forEach(fc => { html += `<td>${pct(d[fc])}</td>`; });
            html += `<td>${mc}</td><td>${fmtNum(val)}</td></tr>`;
        });
    });
    document.getElementById(cfg.id + '-body').innerHTML = html || '<tr><td class="loading">暂无数据</td></tr>';
}

function renderCompanyTable(cfg, data) {
    document.getElementById(cfg.id + '-metrics').style.display = 'none';
    if (!data.length) {
        document.getElementById(cfg.id + '-body').innerHTML = '<tr><td class="loading">暂无数据</td></tr>';
        return;
    }
    const headers = getHeaders(data);
    renderTableHeader(cfg.id, ['排名', ...headers]);
    const sorted = [...data].sort((a,b) => String(b['月份']||'').localeCompare(a['月份']||''));
    const latestMonth = sorted[0] ? sorted[0]['月份'] : '';
    const latest = sorted.filter(d => d['月份'] === latestMonth);
    latest.sort((a,b) => num(b['产量']) - num(a['产量']));
    let html = latest.slice(0, 50).map((d, i) =>
        `<tr><td><span class="rank-badge ${i<3?'top3':''}">${i+1}</span></td>
            ${headers.map(h => `<td>${pct(d[h])}</td>`).join('')}</tr>`
    ).join('');
    document.getElementById(cfg.id + '-body').innerHTML = html || '<tr><td class="loading">暂无数据</td></tr>';
}

function renderTradeTotalTable(cfg, data) {
    document.getElementById(cfg.id + '-metrics').style.display = 'none';
    if (!data.length) {
        document.getElementById(cfg.id + '-body').innerHTML = '<tr><td class="loading">暂无数据</td></tr>';
        return;
    }
    const headers = getHeaders(data);
    renderTableHeader(cfg.id, headers);
    const sorted = [...data].sort((a,b) => {
        const ma = a['月份'] || '', mb = b['月份'] || '';
        return String(mb).localeCompare(String(ma));
    });
    let html = sorted.map(d =>
        `<tr>${headers.map(h => `<td>${pct(d[h])}</td>`).join('')}</tr>`
    ).join('');
    document.getElementById(cfg.id + '-body').innerHTML = html || '<tr><td class="loading">暂无数据</td></tr>';
}

function renderTradePartnerTable(cfg, data) {
    // Same as trade-total but typically has 目的地/贸易伙伴 instead of 月份
    document.getElementById(cfg.id + '-metrics').style.display = 'none';
    if (!data.length) {
        document.getElementById(cfg.id + '-body').innerHTML = '<tr><td class="loading">暂无数据</td></tr>';
        return;
    }
    const headers = getHeaders(data);
    renderTableHeader(cfg.id, headers);
    let html = data.slice(0, 200).map(d =>
        `<tr>${headers.map(h => `<td>${pct(d[h])}</td>`).join('')}</tr>`
    ).join('');
    document.getElementById(cfg.id + '-body').innerHTML = html || '<tr><td class="loading">暂无数据</td></tr>';
}

function renderSpotPriceTable(cfg, data) {
    document.getElementById(cfg.id + '-metrics').style.display = 'none';
    if (!data.length) {
        document.getElementById(cfg.id + '-body').innerHTML = '<tr><td class="loading">暂无数据</td></tr>';
        return;
    }
    const headers = getHeaders(data);
    const dateCol = headers[0]; // '当前日期' or similar

    // Group columns into (model, [low, high, avg]) triplets
    const priceTypes = ['最低价格', '最高价格', '均价'];
    const modelMap = {}; // modelName -> { 最低价格: colName, 最高价格: colName, 均价: colName }
    headers.slice(1).forEach(h => {
        for (const pt of priceTypes) {
            if (h.endsWith(pt)) {
                const model = h.slice(0, -pt.length);
                if (!modelMap[model]) modelMap[model] = {};
                modelMap[model][pt] = h;
                break;
            }
        }
    });

    const models = Object.keys(modelMap);
    if (models.length === 0) {
        // Fallback: render all columns as-is with horizontal scroll
        renderTableHeader(cfg.id, headers);
        const sorted = [...data].sort((a,b) => String(b[dateCol]||'').localeCompare(a[dateCol]||''));
        let html = sorted.slice(0, 30).map(d =>
            `<tr>${headers.map(h => `<td>${pct(d[h])}</td>`).join('')}</tr>`
        ).join('');
        document.getElementById(cfg.id + '-body').innerHTML = html;
        return;
    }

    // Melted headers: 日期 + 型号 + 最低价 + 最高价 + 均价
    const meltedHeaders = [dateCol, '型号', '最低价', '最高价', '均价'];
    renderTableHeader(cfg.id, meltedHeaders);

    const sorted = [...data].sort((a,b) => String(b[dateCol]||'').localeCompare(a[dateCol]||''));
    let html = '';
    sorted.slice(0, 100).forEach(d => {
        models.forEach(model => {
            const cols = modelMap[model];
            const low = cols['最低价格'] ? d[cols['最低价格']] : null;
            const high = cols['最高价格'] ? d[cols['最高价格']] : null;
            const avg = cols['均价'] ? d[cols['均价']] : null;
            if (low == null && high == null && avg == null) return;
            html += `<tr><td>${fmtDate(d[dateCol])}</td><td>${model}</td>
                <td>${low != null ? num(low).toFixed(2) : '-'}</td>
                <td>${high != null ? num(high).toFixed(2) : '-'}</td>
                <td>${avg != null ? num(avg).toFixed(2) : '-'}</td></tr>`;
        });
    });
    document.getElementById(cfg.id + '-body').innerHTML = html || '<tr><td class="loading">暂无数据</td></tr>';
}

function renderConfigTable(cfg) {
    const data = allData[cfg.table] || [];
    switch (cfg.type) {
        case 'industry':       renderIndustryTable(cfg, data); break;
        case 'model-output':   renderModelOutputTable(cfg, data); break;
        case 'company':        renderCompanyTable(cfg, data); break;
        case 'trade-total':    renderTradeTotalTable(cfg, data); break;
        case 'trade-partner':  renderTradePartnerTable(cfg, data); break;
        case 'spot-price':     renderSpotPriceTable(cfg, data); break;
        default:
            document.getElementById(cfg.id + '-metrics').style.display = 'none';
            renderTableHeader(cfg.id, getHeaders(data));
            document.getElementById(cfg.id + '-body').innerHTML =
                data.map(d => `<tr>${getHeaders(data).map(h => `<td>${pct(d[h])}</td>`).join('')}</tr>`).join('');
    }
}

// === SEARCH & EXPORT ===
function filterTable() {
    const text = document.getElementById('searchInput').value.toLowerCase();
    const active = document.querySelector('.content-section.active');
    if (!active) return;
    active.querySelectorAll('tbody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(text) ? '' : 'none';
    });
}

function exportTable(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    let csv = '';
    table.querySelectorAll('tr').forEach(row => {
        const cells = Array.from(row.querySelectorAll('th,td'));
        csv += cells.map(c => '"' + c.textContent.replace(/"/g,'""') + '"').join(',') + '\n';
    });
    const blob = new Blob(['\uFEFF' + csv], { type:'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = tableId + '_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
}

// === DATA LOADING ===
async function loadAllData() {
    // ═ 去重逻辑：防止并发重复请求同一数据
    if (loadAllData._pending) {
        console.log('[embedded/inline_00] 复用进行中的请求');
        try { await loadAllData._pending; } catch(e) {}
        return;
    }
    if (typeof EMBEDDED_DATA !== 'undefined' && EMBEDDED_DATA.tables) {
        EMBEDDED_DATA.tables.forEach(t => {
            allData[t.table_name] = t.data;
            const cfg = TAB_CONFIG.find(c => c.table === t.table_name);
            if (cfg) {
                const badge = document.getElementById('badge-' + cfg.id);
                if (badge) badge.textContent = t.data.length > 999 ? Math.floor(t.data.length/100)*10 + '+' : t.data.length;
            }
        });
        document.getElementById('updateTime').textContent = EMBEDDED_DATA.update_time || '-';
        const total = EMBEDDED_DATA.tables.reduce((s,t) => s + (t.row_count || t.data.length), 0);
        document.getElementById('totalRecords').textContent = (total/10000).toFixed(1) + '万';
        // Render first tab
        const first = TAB_CONFIG[0];
        renderConfigTable(first);
        activeTabId = first.id;
        restoreTabFromHash();
        return;
    }
    // Fallback: try fetch JSON
    try {
        // ═ 去重：缓存进行中的请求，防止重复 fetch
        if (!loadAllData._pendingFetch) {
            loadAllData._pendingFetch = (async () => {
                const res = await fetch('ternary_all_data.json?_t=' + Date.now());
                if (!res.ok) throw new Error(res.status);
                const d = await res.json();
                document.getElementById('updateTime').textContent = d.update_time || '-';
                d.tables.forEach(t => {
                    allData[t.table_name] = t.data;
                    const cfg = TAB_CONFIG.find(c => c.table === t.table_name);
                    if (cfg) {
                        const badge = document.getElementById('badge-' + cfg.id);
                        if (badge) badge.textContent = t.data.length;
                    }
                });
                const total = d.tables.reduce((s,t) => s + (t.row_count || t.data.length), 0);
                document.getElementById('totalRecords').textContent = (total/10000).toFixed(1) + '万';
                const first = TAB_CONFIG[0];
                renderConfigTable(first);
                activeTabId = first.id;
                restoreTabFromHash();
            })();
        }
        await loadAllData._pendingFetch;
    } catch(e) {
        console.error(e);
        document.querySelectorAll('[id$="-body"]').forEach(el => {
            el.innerHTML = '<tr><td class="loading">数据加载失败，请确保使用本地服务器访问</td></tr>';
        });
    } finally {
        delete loadAllData._pendingFetch;
    }
}

// === KEYBOARD SHORTCUTS ===
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') toggleSidebar();
    if (e.ctrlKey && e.key === 'f') { e.preventDefault(); document.getElementById('searchInput').focus(); }
});

// === INIT ===
buildSidebar();
buildContentAreas();
loadAllData();
