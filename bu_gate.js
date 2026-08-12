/**
 * bu_gate.js — BU 权限门禁（纯前端方案）
 * ======================================================
 * 与 secure-content.service.ts 的 isAllowed() 逻辑一致。
 * 各 hub 页面加载此脚本后调用 applyBUFilter() 过滤卡片。
 *
 * 安全说明：这是前端 JS 门禁，可阻挡普通用户误操作，
 * 但无法阻止技术用户通过 DevTools 或直接改 URL 绕过。
 *
 * 使用方式：
 *   <script src="bu_gate.js"></script>
 *   <script>applyBUFilter();</script>
 */

// ============================================================
//  本地开发自动放行（不影响妙搭线上）：
//  仅当运行在本地环境（localhost / 127.0.0.1 / file:// 直接双击）
//  时，自动置 __BU_GATE_ALLOW_ANON=true，跳过所有权限门禁，方便
//  本地预览/编辑。线上域名（如 *.aiforce.cloud）不触发，门禁保持
//  fail-closed 生效。妙搭发布时此文件原样上传，线上不受影响。
// ============================================================
(function () {
  try {
    var _h = location.hostname;
    if (_h === 'localhost' || _h === '127.0.0.1' || location.protocol === 'file:') {
      window.__BU_GATE_ALLOW_ANON = true;
      if (window.console) {
        console.warn('[bu_gate] 本地环境自动放行（hostname=' + _h + '），权限门禁已跳过');
      }
    }
  } catch (e) {}
})();

(function() {
'use strict';

// ============================================================
//  BU 部门 ID 映射（与后端 BU_DEPT 完全一致）
// ============================================================
var BU_DEPT = {
  // 总部 (hq)
  hq: [
    'od-1768efca88fb4611b75efca7140fe16b',
    'od-42e4ca3deb8b8ee5dfb4688df273ab91',
    'od-f509da72f04db456af9bc9351ed649ce',
    'od-839a5caffe1fa682e014982a1d28fcb8',
  ],
  // 常州锂源 (czly)
  czly: ['od-c8c5bc8612d60825208196a97cd0686d'],
  // 龙蟠时代 (lpsd)
  lpsd: ['od-349632b3f04edaa205990f6c96e66c26'],
  // 山东美多 (sdmd)
  sdmd: ['od-05e668aea865f92b574f366b3d976094'],
  // 法恩莱特 (felt)
  felt: ['od-2e6cc0918fbe3086ebf636680997a2f2'],
  // 三金锂电 (sjl)
  sjl:  ['od-310bdafba6cb5bdbd3300cf326878caa'],
  // 迪克化学 (dhx)
  dhx:  ['od-7a313bc06887dc30349237cb0d64ce83'],
  // 润滑油 (lhy)
  lhy:  ['od-8ad5942df92ef45ac8905b543fc38d2b'],
  // 可兰素 (kls)
  kls:  ['od-c36a380b50b52171d47b7a8f5c1f3a70'],
  // 铂源催化 (bych)
  bych: ['od-33054981612c6dc0fbbdfbb743774d1b'],
};

// ============================================================
//  页面 BU class 名 → 内部 BU ID 映射
//    （各页面使用的 BU 命名不一致）
// ============================================================
var BU_ALIAS = {
  // index_v3.html inline_03.js 使用的命名
  lubricant: 'lhy',
  kelan:      'kls',
  dkhx:       'dhx',
  // radar_hub.html 使用的命名
  sjld:       'sjl',
};

// ============================================================
//  isAllowed() — 与后端完全一致
// ============================================================
function parseDeptIds(deptStr) {
  if (!deptStr) return [];
  return deptStr.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
}

// 策略（2026-07-30 调整为 fail-closed）：已识别身份按 BU 收窄；
// 未映射部门在 applyBUFilter 入口即被 __buGateDenyAll 拒绝（隐藏全部+提示）。
// 本函数内"无部门身份/未知卡片BU→显示"仅服务于本地预览与发布校验（无 __dept 场景）。
function isAllowed(bu, userDeptIds) {
  // 无部门身份 → 显示全部（故障安全，杜绝白屏）
  if (!userDeptIds || !userDeptIds.length) return true;
  // hq/all 速记令牌 → 显示全部（兼容全局拦截设置的 __dept=hq）
  if (userDeptIds.indexOf('hq') >= 0 || userDeptIds.indexOf('all') >= 0) return true;
  // HQ 可见全部（真实OD ID）
  if (userDeptIds.some(function(d) { return BU_DEPT.hq.indexOf(d) >= 0; })) return true;
  var allowed = BU_DEPT[bu];
  // 未知 BU（映射表里没有）→ 显示（故障安全，避免误隐藏）
  if (!allowed) return true;
  return userDeptIds.some(function(d) { return allowed.indexOf(d) >= 0; });
}

// ============================================================
//  内部 ID 解析
// ============================================================
function toInternalId(className) {
  return BU_ALIAS[className] || className;
}

function isSkippedClass(name) {
  // 跳过公共/非BU类名
  var skip = ['allbu-card-loading', 'allbu-card', 'dept-card', 'no-auth-card'];
  return skip.indexOf(name) >= 0;
}

// ============================================================
//  从 URL、hash 或 sessionStorage 获取当前部门 ID
// ============================================================
function getCurrentDeptId() {
  // ====== 调试日志 ======
  if (window.console) {
    console.log('[bu_gate] getCurrentDeptId, location.search=', location.search, 'location.hash=', location.hash);
  }
  // 1. 优先从 hash 读取（#dept=xxx，Miaoda 网关重写 URL 时会吞 query，但 hash 保留）
  var m = location.hash.match(/[#&]dept=([^&]+)/);
  if (m) {
    var deptId = decodeURIComponent(m[1]);
    // 自动保存到 sessionStorage（解决页面刷新后丢失问题）
    try { sessionStorage.setItem('__dept', deptId); } catch(e){}
    if (window.console) {
      console.log('[bu_gate] 从hash读取dept=', deptId);
    }
    return deptId;
  }
  m = location.search.match(/[?&]__dept=([^&]+)/);
  if (m) {
    var deptId = decodeURIComponent(m[1]);
    // 自动保存到 sessionStorage（解决页面刷新后丢失问题）
    try { sessionStorage.setItem('__dept', deptId); } catch(e){}
    // ====== 调试日志 ======
    if (window.console) {
      console.log('[bu_gate] 从URL读取__dept=', deptId);
    }
    return deptId;
  }
  m = location.search.match(/[?&]departmentId=([^&]+)/);
  if (m) {
    var deptId2 = decodeURIComponent(m[1]);
    try { sessionStorage.setItem('__dept', deptId2); } catch(e){}
    if (window.console) { console.log('[bu_gate] 从URL读取departmentId=', deptId2); }
    return deptId2;
  }
  // 兼容门户下发的 ?tier=<BU代码>（如 tier=felt / tier=HQ），映射为部门 ID
  m = location.search.match(/[?&]tier=([^&]+)/);
  if (m) {
    var tier = decodeURIComponent(m[1]).trim();
    var tierKey = tier.toLowerCase();
    var mappedId = (tierKey === 'hq' || tierKey === 'all')
      ? 'hq'
      : (BU_DEPT[toInternalId(tierKey)] && BU_DEPT[toInternalId(tierKey)][0]);
    if (mappedId) {
      try { sessionStorage.setItem('__dept', mappedId); } catch(e){}
      if (window.console) { console.log('[bu_gate] 从URL读取tier=', tier, '→ deptId=', mappedId); }
      return mappedId;
    }
  }
  // 从 sessionStorage 中读取（兼容 '_dept' 与 '__dept' 两种键名）
  var _dept, __dept;
  try {
    _dept = sessionStorage.getItem('_dept');
    __dept = sessionStorage.getItem('__dept');
  } catch(e) { _dept = ''; __dept = ''; }
  // ====== 调试日志 ======
  if (window.console) {
    console.log('[bu_gate] sessionStorage读取: _dept=', _dept, ', __dept=', __dept);
  }
  try { return _dept || __dept || ''; } catch(e) { return ''; }
}

// ============================================================
//  fail-closed 拒绝：未映射部门 → 隐藏全部卡片并显示无权限提示
//  （2026-07-30 应用户要求，取消"未识别降级放行"）
// ============================================================
function __buGateDenyAll(containerSelector, userDeptIds) {
  var container = containerSelector ? document.querySelector(containerSelector) : document;
  if (container) {
    var cards = container.querySelectorAll('[class*="allbu-card"], [class*="dept-card"], [id^="card-"], .guide-card[data-bu]');
    if (!cards.length && container !== document) cards = container.children;
    Array.prototype.forEach.call(cards, function(card) {
      card.style.display = 'none';
      card.classList.add('bu-gate-hidden');
    });
  }
  // 显示无权限提示（只插一次），避免被误认为页面故障
  if (!document.getElementById('bu-gate-deny-tip')) {
    var tip = document.createElement('div');
    tip.id = 'bu-gate-deny-tip';
    tip.style.cssText = 'margin:60px auto;max-width:520px;padding:28px 32px;text-align:center;'
      + 'background:#fff;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.06);'
      + 'font-size:15px;color:#374151;line-height:1.8;';
    tip.innerHTML = '<div style="font-size:34px;margin-bottom:8px;">&#128274;</div>'
      + '<div style="font-weight:600;font-size:17px;margin-bottom:6px;">无权限查看</div>'
      + '<div>您所在的部门尚未开通本页面的访问权限。<br>如需开通，请联系管理员。</div>';
    var host = (containerSelector && document.querySelector(containerSelector)) || document.body;
    if (host) host.appendChild(tip);
  }
  if (window.console) {
    console.warn('[bu_gate] fail-closed 拒绝：部门未映射，已隐藏全部内容。deptIds=', userDeptIds);
  }
}

// ============================================================
//  核心函数：applyBUFilter()
//   扫描页面上所有带 BU class 名的卡片元素，
//   根据当前用户部门 ID，隐藏无权访问的卡片。
//
//   selector: 卡片容器选择器（如 '#allbuGrid' 或 '#grid-main'）
//   如果不传，扫描整个 document
// ============================================================
window.applyBUFilter = function(containerSelector) {
  var deptId = getCurrentDeptId();
  // ====== 调试日志 ======
  if (window.console) {
    console.log('[bu_gate] applyBUFilter 被调用, deptId=', deptId, 'container=', containerSelector);
  }
  // ====== 调试结束 ======
  if (!deptId) {
    // 2026-07-31 改为 fail-closed：无部门 ID（直接输入子页 URL、参数丢失等）
    // 一律拒绝，避免"未带参数即可看到全部内容"的越权泄露。
    // 本地预览可在页面加载前设置 window.__BU_GATE_ALLOW_ANON = true 临时放行。
    if (window.__BU_GATE_ALLOW_ANON === true) {
      if (window.console) { console.warn('[bu_gate] 本地预览模式放行（__BU_GATE_ALLOW_ANON）'); }
      return;
    }
    if (window.console) {
      console.warn('[bu_gate] fail-closed：未取得部门ID，已隐藏全部内容');
    }
    __buGateDenyAll(containerSelector, []);
    return;
  }

  var userDeptIds = parseDeptIds(deptId);
  // 2026-07-30 用户要求改为 fail-closed：部门ID无法识别为任何已知BU/HQ → 隐藏全部内容并提示无权限
  var _recognized = userDeptIds.some(function(d){
    if (d === 'hq' || d === 'all') return true;
    if (BU_DEPT.hq.indexOf(d) >= 0) return true;
    for (var _b in BU_DEPT) { if (_b === 'hq') continue; if (BU_DEPT[_b].indexOf(d) >= 0) return true; }
    return false;
  });
  if (!_recognized) { __buGateDenyAll(containerSelector, userDeptIds); return; }
  var container = containerSelector
    ? document.querySelector(containerSelector)
    : document;

  if (!container) return;

  // 找出所有可能带 BU class 的卡片
  var cards = container.querySelectorAll('[class*="allbu-card"], [class*="dept-card"], [id^="card-"], .guide-card[data-bu]');
  if (!cards.length) {
    // 后备：直接将所有子元素视为卡片
    cards = container.children;
  }

  // ====== 调试日志 ======
  if (window.console) {
    console.log('[bu_gate] 找到卡片数量=', cards.length, 'userDeptIds=', userDeptIds);
    for (var _i = 0; _i < cards.length; _i++) {
      var _c = cards[_i];
      console.log('[bu_gate] 卡片' + _i + ': id=' + _c.id + ', className=' + _c.className + ', data-bu=' + _c.getAttribute('data-bu'));
    }
  }
  // ====== 调试结束 ======

  var total = cards.length;
  var hiddenCount = 0;
  Array.prototype.forEach.call(cards, function(card) {
    var buId = null;
    // 方法1: 从 class 中识别 BU
    var classes = (card.className || '').split(/\s+/);
    for (var i = 0; i < classes.length; i++) {
      var c = classes[i];
      if (isSkippedClass(c)) continue;
      var internalId = toInternalId(c);
      if (BU_DEPT[internalId]) {
        buId = internalId;
        break;
      }
    }
    // 方法2: 从 id 中识别 (id="card-czly")
    if (!buId) {
      var id = (card.id || '');
      for (var bu in BU_DEPT) {
        if (bu === 'hq') continue;
        if (id.indexOf(bu) >= 0 || id.indexOf('card-' + bu) >= 0) {
          buId = bu;
          break;
        }
      }
    }
    // 方法3: 从 data-bu 属性识别（经别名映射 toInternalId 转换，如 sjld→sjl）
    if (!buId) {
      buId = toInternalId(card.getAttribute('data-bu') || '');
    }
    if (!buId || buId === 'hq') return;

    if (!isAllowed(buId, userDeptIds)) {
      card.style.display = 'none';
      // 添加标记以便调试
      card.classList.add('bu-gate-hidden');
      hiddenCount++;
    }
  });

  // ============================================================
  //  根因自愈（从源头杜绝“闪正常再空白”）：
  //  若过滤后【整页所有卡片都被隐藏】，几乎可判定为门禁误判
  //  （正常用户至少应看到自己 BU 的卡片，绝不至于整页为空）。
  //  此时自动回退为“显示全部”——无论 isAllowed 将来怎么写错，
  //  页面都不可能再因门禁逻辑而变空白。
  // ============================================================
  // 2026-07-31 修正：原"自愈"逻辑在整页被隐藏时回退为显示全部，
  // 等价于对无权部门开放全量内容（越权泄露）。现改为显示无权限提示。
  if (total > 0 && hiddenCount === total) {
    __buGateDenyAll(containerSelector, userDeptIds);
    if (window.console) {
      console.warn('[bu_gate] 过滤后 0 可见 → 显示无权限提示（不再回退显示全部）。deptIds=', userDeptIds);
    }
  }

  // 过滤完成后，为同源链接续传部门参数，保证子页刷新/新开标签仍受门禁
  try { __buGatePropagate(deptId); } catch (e) {}
};

// ============================================================
//  参数续传：把 __dept 附加到本页所有同源链接上
//  （解决 index_v3 → radar_hub → radar_detail 跳转后参数丢失，
//    以及新标签页打开时 sessionStorage 不共享的问题）
// ============================================================
function __buGatePropagate(deptId) {
  if (!deptId) return;
  var links = document.querySelectorAll('a[href]');
  Array.prototype.forEach.call(links, function(a) {
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#') return;
    if (/^(javascript:|mailto:|tel:|data:)/i.test(href)) return;
    // 仅处理同源链接
    if (/^https?:\/\//i.test(href) && href.indexOf(location.origin) !== 0) return;
    if (href.indexOf('__dept=') >= 0) return;
    var hashIdx = href.indexOf('#');
    var hash = hashIdx >= 0 ? href.slice(hashIdx) : '';
    var base = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
    var sep = base.indexOf('?') >= 0 ? '&' : '?';
    a.setAttribute('href', base + sep + '__dept=' + encodeURIComponent(deptId) + hash);
  });
}

// ============================================================
//  工具函数：暴露给页面使用的 API
// ============================================================
  window.BU_GATE = {
    isAllowed: isAllowed,
    getCurrentDeptId: getCurrentDeptId,
    parseDeptIds: parseDeptIds,
    propagate: __buGatePropagate,
    denyAll: __buGateDenyAll,
    BU_DEPT: BU_DEPT,
  };

  // 页面就绪后自动续传一次参数（即使该页未调用 applyBUFilter）
  (function autoPropagate() {
    var run = function() { try { __buGatePropagate(getCurrentDeptId()); } catch (e) {} };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  })();

  // 兼容旧 report 页对裸 isAllowed / getCurrentDeptId 的引用
  // （这些页面用 `return isAllowed && isAllowed(bu, ids)` 调用；若不暴露裸函数，
  //  浏览器会因 isAllowed 为 undefined 而始终判定"无权限"，导致已授权用户也被拒。
  //  暴露后，所有 report 页门禁恢复正常工作，无需逐文件修改。）
  window.isAllowed = isAllowed;
  window.getCurrentDeptId = getCurrentDeptId;
  window.parseDeptIds = parseDeptIds;

})();
