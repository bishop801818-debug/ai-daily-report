
// ============================================================
// 配置
// ============================================================
// ============================================================
// 加载行业新闻（清洗后JSON，跳过重复聚合）
// ============================================================
const CLEAN_NEWS_URL = 'industry_news_source/industry_news_clean.json';

async function loadCleanNews() {
  // 使用内嵌清洗数据 + reports/ 目录最新报告合并
  try {
    const items = typeof EMBEDDED_NEWS !== 'undefined' ? EMBEDDED_NEWS : [];
    const mergedDepts = {};
    const CLEAN_DEPT_LIST = [
      { id:'czly', name:'常州锂源',  color:'#1e3c72' },
      { id:'sdmd', name:'山东美多',  color:'#d35400' },
      { id:'sjld', name:'三金锂电',  color:'#34495e' },
      { id:'lpsd', name:'龙蟠时代',  color:'#215732' },
      { id:'felt', name:'法恩莱特',  color:'#7b2d8b' },
      { id:'kls',  name:'可兰素',    color:'#8e44ad' },
      { id:'lhy',  name:'润滑油',    color:'#c0392b' },
      { id:'dhx',  name:'迪克化学',  color:'#2c3e50' },
      { id:'bych', name:'铂源催化',  color:'#27ae60' },
    ];
    for (const dept of CLEAN_DEPT_LIST) {
      mergedDepts[dept.id] = {
        name: dept.name, subtitle: '', report_date: '',
        sections: { market:[], policy:[], competitor:[], frontier:[] }, total_events: 0,
      };
    }

    // 全局去重签名集合（防止内嵌数据与 reports/ 数据重复）
    const seenSigs = new Set();

    // ① 处理内嵌清洗数据（截至约5月20日）
    const allDates = [];
    for (const item of items) {
      const deptId = item.dept || '__other__';
      if (!mergedDepts[deptId]) {
        mergedDepts[deptId] = {
          name: deptId, subtitle: '', report_date: '',
          sections: { market:[], policy:[], competitor:[], frontier:[] }, total_events: 0,
        };
      }
      const dim = item.dim || 'competitor';
      // 市场/价格类条目不纳入（price table 由其他模块展示）
      if (isPriceTableEntry(item)) continue;
      if (!mergedDepts[deptId].sections[dim]) mergedDepts[deptId].sections[dim] = [];
      const sig = (item.title||'').substring(0,60);
      if (seenSigs.has(sig)) continue;
      seenSigs.add(sig);
      mergedDepts[deptId].sections[dim].push({
        title: item.title||'', content: item.content||'',
        source: item.source||'', url: item.url||'#',
        _date: item.date||'', priority: item.priority||'P2',
      });
      if (item.date) allDates.push(item.date);
    }
    console.log('[行业新闻] 内嵌清洗数据:', items.length, '条');

    // ② 从 reports/ 目录加载最新报告（5月21日以后），合并去重
    try {
      const fresh = await loadAllReports();
      if (fresh && fresh.data) {
        for (const [deptId, deptData] of Object.entries(fresh.data)) {
          if (!mergedDepts[deptId]) {
            mergedDepts[deptId] = {
              name: deptData.name || deptId,
              subtitle: '', report_date: '',
              sections: { market:[], policy:[], competitor:[], frontier:[] }, total_events: 0,
            };
          }
          const target = mergedDepts[deptId];
          for (const [dim, items2] of Object.entries(deptData.sections || {})) {
            if (!items2 || !Array.isArray(items2)) continue;
            if (!target.sections[dim]) target.sections[dim] = [];
            for (const item of items2) {
              if (isPriceTableEntry(item)) continue;  // 价格表条目过滤
              const sig = (item.title||'').substring(0,60);
              if (seenSigs.has(sig)) continue;
              seenSigs.add(sig);
              target.sections[dim].push(item);
              if (item._date && !allDates.includes(item._date)) {
                allDates.push(item._date);
              }
            }
          }
        }
        console.log('[行业新闻] 合并 reports/ 目录数据完成');
      }
    } catch(e2) {
      console.warn('[行业新闻] reports/ 目录加载失败，仅使用内嵌数据:', e2);
    }

    const sortedDates = allDates.filter(Boolean).sort();
    const dateRange = sortedDates.length > 1
      ? `${sortedDates[0]} ~ ${sortedDates[sortedDates.length-1]}`
      : (sortedDates[0]||'');
    return { data: mergedDepts, dateRange, loadedDates: sortedDates };
  } catch(e) {
    console.error('[行业新闻] 内嵌数据失败:', e);
    return loadAllReports();
  }
}

// ============================================================
// 加载所有日期的报告并合并（回退方案）
// ============================================================
const REPORT_BASE = 'reports/';

const DEPT_LIST = [
  { id:'czly', name:'常州锂源',  color:'#1e3c72' },
  { id:'sdmd', name:'山东美多',  color:'#d35400' },
  { id:'sjld', name:'三金锂电',  color:'#34495e' },
  { id:'lpsd', name:'龙蟠时代',  color:'#215732' },
  { id:'felt', name:'法恩莱特',  color:'#7b2d8b' },
  { id:'kls',  name:'可兰素',    color:'#8e44ad' },
  { id:'lhy',  name:'润滑油',    color:'#c0392b' },
  { id:'dhx',  name:'迪克化学',  color:'#2c3e50' },
  { id:'bych', name:'铂源催化',  color:'#27ae60' },
];

// ============================================================
// dim 统一映射表（4个标准维度）
// 宏观新闻=policy | 行业新闻=market | 企业动态=competitor | 技术产品=frontier
// ============================================================
const DIM_MAP = {
  // 英文 → 标准key
  'market':     'market',
  'policy':     'policy',
  'competitor': 'competitor',
  'frontier':   'frontier',
  'customer':   'competitor',
  'project':    'competitor',
  'enterprise': 'competitor',  // 早报格式 → 企业动态
  'tech':       'frontier',     // 早报格式 → 技术产品
  'suggestion': null,
  'unknown':    null,
  // 中文 → 标准key
  '政策':       'policy',
  '竞品':       'competitor',
  '客户':       'competitor',
  '前沿':       'frontier',
  '市场':       'market',
};

function normalizeDim(rawDim) {
  if (!rawDim) return null;
  const key = String(rawDim).trim();
  if (DIM_MAP[key] !== undefined) return DIM_MAP[key];
  // 模糊匹配
  if (['政策','条例','补贴','通知','发文','进出口','监管','法规','双碳','碳中和','新能源战略'].some(w => key.includes(w))) return 'policy';
  if (key.includes('市场') || key.includes('价格') || key.includes('行情') || key.includes('供需') || key.includes('库存')) return 'market';
  if (['企业','竞品','竞争','动态','项目','招标','客户'].some(w => key.includes(w))) return 'competitor';
  if (['技术','产品','前沿','研发'].some(w => key.includes(w))) return 'frontier';
  return null;
}

// 维度Tab定义（4个标签）
const DIM_TABS = [
  { key:'policy',     label:'宏观新闻', icon:'📜', color:'#1abc9c', desc:'政策发布、补贴条例、进出口法规等宏观动态' },
  { key:'market',     label:'行业新闻', icon:'📊', color:'#f39c12', desc:'市场价格、供需库存、行情动态' },
  { key:'competitor', label:'企业动态', icon:'🏢', color:'#3498db', desc:'企业动态、竞品情报、项目招标、客户需求' },
  { key:'frontier',   label:'技术产品', icon:'💻', color:'#9b59b6', desc:'技术进展、产品研发、创新动态' },
];

// ============================================================
// 工具函数
// ============================================================
const stripMd = s => String(s).replace(/\*\*/g,'');
const safe = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function norm(s) {
  if (!s) return '';
  return String(s);
}

// ============================================================
// 价格表条目过滤
// "价格：...元/吨，涨跌：+...元/吨。来源：xxx，YYYY-MM-DD" 格式不纳入
// ============================================================
function isPriceTableEntry(item) {
  const content = item.content || item.title || '';
  if (content.includes('价格：') && content.includes('涨跌：')) {
    return true;
  }
  return false;
}

// ============================================================
// 加载所有日期的报告并合并
// ============================================================
async function loadAllReports() {
  // 1. 获取可用日期列表
  let allAvailableDates = [];
  try {
    const idxRes = await fetch(`${REPORT_BASE}index.json?v=${Date.now()}`);
    if (idxRes.ok) {
      const idx = await idxRes.json();
      allAvailableDates = idx.available_dates || [];
    }
  } catch(e) {}

  // 2. 回退：直接探测近期日期
  if (allAvailableDates.length === 0) {
    const today = new Date();
    for (let daysBack = 0; daysBack <= 60; daysBack++) {
      const d = new Date(today.getTime() - daysBack * 86400000);
      const ds = d.toISOString().slice(0,10);
      try {
        const r = await fetch(`${REPORT_BASE}${ds}.json`);
        if (r.ok) allAvailableDates.push(ds);
      } catch(e) {}
    }
  }

  allAvailableDates.sort().reverse();

  // 3. 首批只加载最近3期，其余存为待加载队列
  const batchSize = 3;
  const initialBatch = allAvailableDates.slice(0, batchSize);
  const pendingDates = allAvailableDates.slice(batchSize);

  // 暴露全局，供"加载更早数据"使用
  window.__pendingDates = pendingDates;
  window.__reportBase = REPORT_BASE;
  window.__mergedDepts = {};
  window.__loadedDates = [];
  window.__onMoreLoaded = null; // 回调：加载更多后刷新当前视图

  async function fetchAndMerge(dateStr) {
    try {
      const res = await fetch(`${REPORT_BASE}${dateStr}.json?v=${Date.now()}`);
      if (!res.ok) return;
      const json = await res.json();
      if (!json.departments) return;
      window.__loadedDates.push(dateStr);
      for (const [deptId, deptData] of Object.entries(json.departments)) {
        if (!window.__mergedDepts[deptId]) {
          window.__mergedDepts[deptId] = {
            name: deptData.name || DEPT_LIST.find(d=>d.id===deptId)?.name || deptId,
            subtitle: deptData.subtitle || '',
            report_date: dateStr,
            sections: { market:[], policy:[], competitor:[], frontier:[] },
            total_events: 0,
          };
        }
        const target = window.__mergedDepts[deptId];
        target.report_date = dateStr;

        const rawSections = deptData.sections || {};
        const sectionsByDim = deptData.sectionsByDim || {};

        function pushItemToDim(raw, stdDim) {
          const title = norm(raw.title || raw.event || raw.Title || '');
          const content = norm(raw.content || raw.fact || raw.Content || '');
          if (!title && !content) return;
          const sig = title.substring(0,60);
          if (!target._seen) target._seen = new Set();
          if (target._seen.has(sig)) return;
          target._seen.add(sig);
          if (!target.sections[stdDim]) target.sections[stdDim] = [];
          target.sections[stdDim].push({
            title: title.substring(0,120),
            content,
            priority: raw.priority || raw.Priority || 'P2',
            source: raw.source || raw.source_name || '',
            url: raw.url || raw.Url || '#',
            _date: dateStr,
          });
        }

        for (const [rawDim, items] of Object.entries(sectionsByDim)) {
          const stdDim = normalizeDim(rawDim);
          if (!stdDim) continue;
          if (!Array.isArray(items)) continue;
          for (const raw of items) pushItemToDim(raw, stdDim);
        }
        if (Array.isArray(rawSections)) {
          for (const sec of rawSections) {
            const stdDim = normalizeDim(sec.dim || sec.title || '');
            if (!stdDim) continue;
            const items = sec.items || [];
            for (const raw of items) pushItemToDim(raw, stdDim);
          }
        }
        else if (typeof rawSections === 'object' && rawSections !== null) {
          for (const [rawKey, rawArr] of Object.entries(rawSections)) {
            const stdDim = normalizeDim(rawKey);
            if (!stdDim) continue;
            const items = Array.isArray(rawArr) ? rawArr
              : (typeof rawArr === 'object' && rawArr !== null ? Object.values(rawArr).flat() : []);
            for (const raw of items) pushItemToDim(raw, stdDim);
          }
        }
      }
    } catch(e) {}
  }

  // 加载首批
  for (const ds of initialBatch) {
    await fetchAndMerge(ds);
  }

  window.__loadedDates.sort();
  const dateRange = window.__loadedDates.length > 1
    ? `${window.__loadedDates[0]} ~ ${window.__loadedDates[window.__loadedDates.length-1]}`
    : (window.__loadedDates[0] || '');

  console.log('[行业新闻] 首批加载:', window.__loadedDates, '待加载:', pendingDates.length, '期');
  return { data: window.__mergedDepts, dateRange, loadedDates: window.__loadedDates, pendingCount: pendingDates.length };
}

// ============================================================
// Tab 交互（点击展开/收起下拉菜单）
// ============================================================
let currentBu = null;      // 当前选中的BU
let currentDim = 'policy'; // 当前选中的维度
let globalData = null;
let openBu = null;         // 当前展开下拉的BU

function switchBuDim(buKey, dimKey) {
  currentBu = buKey;
  currentDim = dimKey;
  openBu = null;  // 关闭下拉菜单
  refreshTabUI();
  renderDimContent(dimKey, globalData, buKey);
}

function refreshTabUI() {
  // 只更新样式和下拉可见性，不重新生成innerHTML
  const bar = document.getElementById('buTabBar');
  if (!bar) return;
  bar.querySelectorAll('.bu-tab-wrap').forEach(wrap => {
    const btn = wrap.querySelector('.bu-tab-btn');
    const menu = wrap.querySelector('.bu-dropdown');
    const bu = btn ? btn.dataset.bu : null;
    if (!bu) return;
    if (bu === currentBu) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
    if (menu) {
      if (bu === openBu) {
        menu.classList.add('open');
      } else {
        menu.classList.remove('open');
      }
    }
  });
}

let data_global = null;

const BU_COLOR_MAP = {};
const BU_NAME_MAP = {
  czly: '常州锂源', sdmd: '山东美多', sjld: '三金锂电',
  lpsd: '龙蟠时代', felt: '法恩莱特', kls:  '可兰素',
  lhy:  '润滑油',   dhx:  '迪克化学', bych: '铂源催化',
};

function countItemsForBuDim(data, buKey, dimKey) {
  if (!buKey) return 0;
  const deptData = data[buKey];
  if (!deptData) return 0;
  return ((deptData.sections || {})[dimKey] || []).length;
}

function renderBuTabs(data) {
  if (!data) { console.warn('[Tab] renderBuTabs: no data'); return; }
  data_global = data;
  const bar = document.getElementById('buTabBar');
  if (!bar) { console.warn('[Tab] buTabBar not found'); return; }

  const tabs = Object.keys(BU_NAME_MAP).map(id => ({
    id, name: BU_NAME_MAP[id], color: BU_COLOR_MAP[id] || '#888'
  }));
  if (!currentBu && tabs.length > 0) { currentBu = tabs[0].id; openBu = tabs[0].id; }

  // Build HTML once
  bar.innerHTML = tabs.map(tab => `
    <div class="bu-tab-wrap">
      <div class="bu-tab-btn" data-bu="${tab.id}">
        ${tab.name}<span class="dropdown-arrow">▼</span>
      </div>
      <div class="bu-dropdown" id="dropdown_${tab.id}">
        ${DIM_TABS.map(d => `
          <div class="bu-dropdown-item" data-dim="${d.key}" data-bu="${tab.id}">
            <span class="dro-label">${d.label}</span>
            <span class="dro-count">${countItemsForBuDim(data, tab.id, d.key)}</span>
          </div>`).join('')}
      </div>
    </div>`).join('');

  // Single delegated click handler（选择维度）
  bar.onclick = function(e) {
    const droItem = e.target.closest('.bu-dropdown-item');
    if (droItem) {
      const dimKey = droItem.dataset.dim;
      const bKey = droItem.dataset.bu;
      switchBuDim(bKey, dimKey);
      return;
    }
  };

  refreshTabUI();

  // 下拉菜单延迟关闭（鼠标进入显示，移出后延迟消失）
  let buHideTimer = null;
  const BU_HIDE_DELAY = 200;
  bar.querySelectorAll('.bu-tab-wrap').forEach(wrap => {
    const menu = wrap.querySelector('.bu-dropdown');

    // 鼠标进入 tab 或下拉菜单时显示
    wrap.addEventListener('mouseenter', function() {
      clearTimeout(buHideTimer);
      buHideTimer = null;
      // 先关闭其他所有下拉
      bar.querySelectorAll('.bu-dropdown').forEach(m => m.style.display = 'none');
      if (menu) menu.style.display = 'block';
    });

    // 鼠标离开 tab 时延迟隐藏
    wrap.addEventListener('mouseleave', function() {
      clearTimeout(buHideTimer);
      buHideTimer = setTimeout(() => {
        if (menu) menu.style.display = 'none';
      }, BU_HIDE_DELAY);
    });

    // 鼠标进入下拉菜单时取消隐藏
    if (menu) {
      menu.addEventListener('mouseenter', function() {
        clearTimeout(buHideTimer);
        buHideTimer = null;
      });
      menu.addEventListener('mouseleave', function() {
        clearTimeout(buHideTimer);
        buHideTimer = setTimeout(() => {
          if (menu) menu.style.display = 'none';
        }, BU_HIDE_DELAY);
      });
    }
  });

  console.log('[Tab] rendered', tabs.length, 'tabs, currentBu:', currentBu, 'openBu:', openBu);
}

// ============================================================
// 渲染内容区
// ============================================================
function renderDimContent(dimKey, data, buKey) {
  const area = document.getElementById('dimContentArea');
  const dimTab = DIM_TABS.find(t => t.key === dimKey) || DIM_TABS[0];

  const deptData = data[buKey];
  if (!deptData) { area.innerHTML = '<div class="empty-state">无数据</div>'; return; }

  const allItems = (deptData.sections || {})[dimKey] || [];
  const buColor = BU_COLOR_MAP[buKey] || '#888';
  const buName = BU_NAME_MAP[buKey] || buKey;

  // 统计
  const p0 = allItems.filter(x => x.priority === 'P0').length;
  const p1 = allItems.filter(x => x.priority === 'P1').length;

  // 内容区标题
  const headerHtml = `
    <div class="content-header">
      <span class="bu-pill" style="background:${buColor}">${buName}</span>
      <span class="dim-label">${dimTab.icon} ${dimTab.label}</span>
      <span style="font-size:12px;color:var(--text-dim);margin-left:auto">
        ${allItems.length} 条 · ${p0}头条 ${p1}重点
      </span>
    </div>`;

  if (allItems.length === 0) {
    area.innerHTML = headerHtml + `
      <div class="empty-state">
        <div style="font-size:32px;margin-bottom:10px">📭</div>
        <div>${buName} 暂无"${dimTab.label}"动态</div>
      </div>`;
    return;
  }

  // 按时间倒序 + 优先级排序
  const order = { P0:0, P1:1, P2:2 };
  const sorted = [...allItems].sort((a, b) => {
    const dateA = (a._date || a.date || '').replace(/\//g, '-');
    const dateB = (b._date || b.date || '').replace(/\//g, '-');
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return (order[a.priority]??2) - (order[b.priority]??2);
  });

  // 分页懒加载配置
  const PAGE_SIZE = 20;
  let loadMoreObserver = null;

  function renderCards(items, start, end) {
    let html = '';
    const slice = items.slice(start, end);
    for (const item of slice) {
      const pClass = item.priority || 'P2';
      const pText = pClass === 'P0' ? '头条' : pClass === 'P1' ? '重点' : '补充';
      const displayTitle = item.title || '无标题';
      const displayContent = item.content || '';

      let itemSource = item.source || '';
      let itemDate = item._date || '';
      let workingContent = displayContent;
      if (!itemSource || !itemDate) {
        const m = workingContent.match(/（来源：([^），,]+)[，,]\s*(\d{4}-\d{2}-\d{2})/);
        if (m) {
          if (!itemSource) itemSource = m[1].trim();
          if (!itemDate) itemDate = m[2].trim();
          workingContent = displayContent.replace(/（来源：[^）]*）?/, '').trim();
        }
      }
      const cleanContent = workingContent.replace(/（来源：[^）]*）?\s*$/, '').trim();
      const shortContent = cleanContent.length > 200 ? cleanContent.substring(0,200) + '...' : cleanContent;
      const hasLongContent = cleanContent.length > 200;

      html += `
    <div class="news-card ${pClass}" onclick="toggleCard(this)">
      <div class="card-top">
        <span class="priority-tag ${pClass}">${pText}</span>
      </div>
      <div class="card-title">${safe(displayTitle)}</div>
      <div class="card-content">${safe(shortContent)}</div>
      ${hasLongContent ? '<div class="card-arrow">▼ 点击展开全文</div>' : ''}
      <div class="card-footer">
        ${itemDate ? `<span class="card-source">📅 ${itemDate}</span>` : ''}
        ${itemSource ? `<span class="card-source">来源：${safe(itemSource)}</span>` : ''}
        ${item.url && item.url !== '#' ? `<a class="card-link" href="${safe(item.url)}" target="_blank" onclick="event.stopPropagation()">查看原文 →</a>` : ''}
      </div>
    </div>`;
    }
    return html;
  }

  function appendMore(from, total) {
    const nextTo = Math.min(from + PAGE_SIZE, total);
    const moreHtml = renderCards(sorted, from, nextTo);
    const listEl = document.getElementById('lazyList');
    if (listEl) listEl.insertAdjacentHTML('beforeend', moreHtml);

    if (nextTo >= total) {
      // 全部加载完毕
      const sentinel = document.getElementById('lazySentinel');
      if (sentinel) { sentinel.style.display = 'none'; sentinel.textContent = '— 已加载全部 ' + total + ' 条 —'; }
      if (loadMoreObserver) loadMoreObserver.disconnect();
      // 如果还有待加载的旧数据，显示"加载更早数据"按钮
      if (window.__pendingDates && window.__pendingDates.length > 0) {
        const listEl = document.getElementById('lazyList');
        if (listEl && !document.getElementById('loadMoreReportsBtn')) {
          const pendingCount = window.__pendingDates.length;
          listEl.insertAdjacentHTML('afterend', '<div id="loadMoreReportsBtn" onclick="loadMoreReports()" style="text-align:center;padding:20px;margin:12px 0;color:var(--accent,#0AA66A);font-size:14px;cursor:pointer;border:1px dashed rgba(10,166,106,0.3);border-radius:10px;background:rgba(10,166,106,0.04);transition:all 0.2s" onmouseover="this.style.background=\'rgba(10,166,106,0.1)\'" onmouseout="this.style.background=\'rgba(10,166,106,0.04)\'">▼ 加载更早数据（还有 ' + pendingCount + ' 期）</div>');
        }
      }
    } else {
      // 更新 sentinel，等下次滚动触发
      const sentinel = document.getElementById('lazySentinel');
      if (sentinel) {
        sentinel.dataset.loaded = String(nextTo);
        sentinel.textContent = '▼ 滚动加载更多...';
      }
    }
  }

  // 首次渲染：前 PAGE_SIZE 条 + 滚动哨兵
  const firstCount = Math.min(PAGE_SIZE, sorted.length);
  const firstCards = renderCards(sorted, 0, firstCount);

  area.innerHTML = headerHtml + `
    <div id="lazyList" class="cards-list">${firstCards}</div>
    ${sorted.length > PAGE_SIZE ? '<div id="lazySentinel" data-loaded="' + firstCount + '" style="text-align:center;padding:20px;color:#999;font-size:13px;cursor:pointer" onclick="loadMoreItems()">▼ 点击加载更多</div>' : ''}`;

  // 如果第一页就显示完了，不用懒加载
  if (sorted.length <= PAGE_SIZE) {
    // 但如果有待加载旧数据，显示"加载更早数据"按钮
    if (window.__pendingDates && window.__pendingDates.length > 0) {
      const listEl = document.getElementById('lazyList');
      if (listEl && !document.getElementById('loadMoreReportsBtn')) {
        listEl.insertAdjacentHTML('afterend', '<div id="loadMoreReportsBtn" onclick="loadMoreReports()" style="text-align:center;padding:20px;margin:12px 0;color:var(--accent,#0AA66A);font-size:14px;cursor:pointer;border:1px dashed rgba(10,166,106,0.3);border-radius:10px;background:rgba(10,166,106,0.04);transition:all 0.2s" onmouseover="this.style.background=\'rgba(10,166,106,0.1)\'" onmouseout="this.style.background=\'rgba(10,166,106,0.04)\'">▼ 加载更早数据（还有 ' + window.__pendingDates.length + ' 期）</div>');
      }
    }
    return;
  }

  // IntersectionObserver 自动加载
  if ('IntersectionObserver' in window) {
    loadMoreObserver = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting) {
        const sentinel = document.getElementById('lazySentinel');
        if (sentinel && sentinel.style.display !== 'none') {
          const loaded = parseInt(sentinel.dataset.loaded || String(PAGE_SIZE));
          appendMore(loaded, sorted.length);
        }
      }
    }, { rootMargin: '200px' });
    const sentinel = document.getElementById('lazySentinel');
    if (sentinel) loadMoreObserver.observe(sentinel);
  }

  // 全局点击加载函数
  window.loadMoreItems = function() {
    const sentinel = document.getElementById('lazySentinel');
    if (sentinel && sentinel.style.display !== 'none') {
      const loaded = parseInt(sentinel.dataset.loaded || String(PAGE_SIZE));
      appendMore(loaded, sorted.length);
    }
  };
}

// 加载更早数据（跨日期加载）
window.loadMoreReports = async function() {
  const btn = document.getElementById('loadMoreReportsBtn');
  if (!btn || btn.classList.contains('loading')) return;
  btn.classList.add('loading');
  btn.textContent = '⏳ 加载中...';

  const batchSize = 3;
  const pending = window.__pendingDates || [];
  if (pending.length === 0) {
    btn.textContent = '— 已加载全部数据 —';
    btn.style.cursor = 'default';
    btn.style.color = '#aaa';
    return;
  }

  const batch = pending.splice(0, batchSize);
  for (const ds of batch) {
    try {
      const res = await fetch(`${window.__reportBase}${ds}.json?v=${Date.now()}`);
      if (!res.ok) continue;
      const json = await res.json();
      if (!json.departments) continue;
      window.__loadedDates.push(ds);
      for (const [deptId, deptData] of Object.entries(json.departments)) {
        if (!window.__mergedDepts[deptId]) {
          window.__mergedDepts[deptId] = {
            name: deptData.name || '', subtitle: '', report_date: ds,
            sections: { market:[], policy:[], competitor:[], frontier:[] }, total_events: 0,
          };
        }
        const target = window.__mergedDepts[deptId];
        target.report_date = ds;
        const rawSections = deptData.sections || {};
        const sectionsByDim = deptData.sectionsByDim || {};

        function pushItem(raw, stdDim) {
          const title = (raw.title || raw.event || raw.Title || '').substring(0,120);
          const content = raw.content || raw.fact || raw.Content || '';
          if (!title && !content) return;
          const sig = title.substring(0,60);
          if (!target._seen) target._seen = new Set();
          if (target._seen.has(sig)) return;
          target._seen.add(sig);
          if (!target.sections[stdDim]) target.sections[stdDim] = [];
          target.sections[stdDim].push({ title, content, priority: raw.priority || 'P2', source: raw.source || '', url: raw.url || '#', _date: ds });
        }

        for (const [rd, items] of Object.entries(sectionsByDim)) {
          const sd = (window.__normalizeDim || normalizeDim)(rd);
          if (!sd || !Array.isArray(items)) continue;
          for (const raw of items) pushItem(raw, sd);
        }
        if (Array.isArray(rawSections)) {
          for (const sec of rawSections) {
            const sd = (window.__normalizeDim || normalizeDim)(sec.dim || sec.title || '');
            if (!sd) continue;
            for (const raw of (sec.items || [])) pushItem(raw, sd);
          }
        } else if (typeof rawSections === 'object') {
          for (const [rk, ra] of Object.entries(rawSections)) {
            const sd = (window.__normalizeDim || normalizeDim)(rk);
            if (!sd) continue;
            const items = Array.isArray(ra) ? ra : (typeof ra === 'object' ? Object.values(ra).flat() : []);
            for (const raw of items) pushItem(raw, sd);
          }
        }
      }
    } catch(e) {}
  }

  globalData = window.__mergedDepts;

  if (pending.length > 0) {
    btn.textContent = `▼ 加载更早数据（还有 ${pending.length} 期）`;
  } else {
    btn.textContent = '— 已加载全部数据 —';
    btn.style.cursor = 'default';
    btn.style.color = '#aaa';
  }
  btn.classList.remove('loading');

  // 刷新当前视图
  if (currentBu && currentDim && globalData) {
    renderDimContent(currentDim, globalData, currentBu);
  }
};

// 卡片展开/折叠
function toggleCard(el) {
  el.classList.toggle('expanded');
  const arrow = el.querySelector('.card-arrow');
  if (arrow) arrow.textContent = el.classList.contains('expanded') ? '▲ 收起' : '▼ 点击展开全文';
}

// ============================================================
// 执行入口
// ============================================================
(async function init() {
  const loader = document.getElementById('pageLoader');
  const content = document.getElementById('realPageContent');

  try {
    const result = await loadCleanNews();
    if (!result || !result.data || result.loadedDates.length === 0) {
      loader.innerHTML = `
        <div class="loader-icon">📭</div>
        <div class="loader-msg">未找到早报数据<br><br>
          <span style="font-size:12px;color:#aaa">请先在首页点击"全员晨会汇报"生成今日早报</span>
        </div>`;
      return;
    }

    const { data, dateRange, loadedDates } = result;
    globalData = data;

    // 首次默认选中第一个BU（常州锂源）
    const buIds = Object.keys(BU_NAME_MAP).filter(k => k !== 'all');
    currentBu = buIds[0] || 'czly';
    currentDim = 'policy';

    document.getElementById('topbarDate').textContent = dateRange;
    document.title = `行业新闻 - ${dateRange} 晨会指挥中心`;

    renderBuTabs(data);
    // 默认渲染第一个BU的policy维度
    renderDimContent(currentDim, data, currentBu);

    loader.style.display = 'none';
    content.style.display = 'block';

  } catch(err) {
    console.error('[行业新闻] 加载失败:', err);
    loader.innerHTML = `
      <div class="page-error">
        <div style="font-size:28px;margin-bottom:10px">⚠️</div>
        <div>加载失败：${err.message}</div>
      </div>`;
  }
})();
