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

(function() {
'use strict';

// ============================================================
//  BU 部门 ID 映射（与后端 BU_DEPT 完全一致）
// ============================================================
var BU_DEPT = {
  hq: [
    'od-1768efca88fb4611b75efca7140fe16b',
    'od-42e4ca3deb8b8ee5dfb4688df273ab91',
    'od-f509da72f04db456af9bc9351ed649ce',
    'od-839a5caffe1fa682e014982a1d28fcb8',
  ],
  czly: ['od-c8c5bc8612d60825208196a97cd0686d'],
  lpsd: ['od-349632b3f04edaa205990f6c96e66c26'],
  sdmd: ['od-05e668aea865f92b574f366b3d976094'],
  felt: ['od-2e6cc0918fbe3086ebf636680997a2f2'],
  sjl:  ['od-310bdafba6cb5bdbd3300cf326878caa'],
  dhx:  ['od-7a313bc06887dc30349237cb0d64ce83'],
  lhy:  ['od-8ad5942df92ef45ac8905b543fc38d2b'],
  kls:  ['od-c36a380b50b52171d47b7a8f5c1f3a70'],
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

function isAllowed(bu, userDeptIds) {
  if (!userDeptIds || !userDeptIds.length) return false;
  // HQ 可见全部
  if (userDeptIds.some(function(d) { return BU_DEPT.hq.indexOf(d) >= 0; })) return true;
  var allowed = BU_DEPT[bu];
  if (!allowed) return false;
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
//  从 URL 获取当前部门 ID
// ============================================================
function getCurrentDeptId() {
  var m = location.search.match(/[?&]__dept=([^&]+)/);
  if (m) return decodeURIComponent(m[1]);
  m = location.search.match(/[?&]departmentId=([^&]+)/);
  if (m) return decodeURIComponent(m[1]);
  // 从 sessionStorage 中读取（兼容 '_dept' 与 '__dept' 两种键名）
  try { return sessionStorage.getItem('_dept') || sessionStorage.getItem('__dept') || ''; } catch(e) { return ''; }
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
  if (!deptId) {
    // 无部门 ID → 不拦截（降级：显示所有卡片）
    return;
  }

  var userDeptIds = parseDeptIds(deptId);
  var container = containerSelector
    ? document.querySelector(containerSelector)
    : document;

  if (!container) return;

  // 找出所有可能带 BU class 的卡片
  var cards = container.querySelectorAll('[class*="allbu-card"], [class*="dept-card"], [id^="card-"]');
  if (!cards.length) {
    // 后备：直接将所有子元素视为卡片
    cards = container.children;
  }

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
    }
  });
};

// ============================================================
//  工具函数：暴露给页面使用的 API
// ============================================================
window.BU_GATE = {
  isAllowed: isAllowed,
  getCurrentDeptId: getCurrentDeptId,
  parseDeptIds: parseDeptIds,
  BU_DEPT: BU_DEPT,
};

})();
