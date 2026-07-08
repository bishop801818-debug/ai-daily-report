/**
 * inline_auth.js — 统一权限闸门（UI门禁，非真安全，可接受技术绕过）
 * ------------------------------------------------------------------
 * 读取用户身份（tier）的顺序：
 *   1) URL ?tier=   （由妙搭壳/测试透传，最高优先级）
 *   2) localStorage.user_bu_permission / feishu_user_info.matched_bu
 *      （由 feishu-jsapi.js 飞书免登回填）
 *   3) 若均缺失且在飞书环境内 → 触发 feishu-jsapi.js 免登
 *
 * 判定（与 auth_policy.js 的 BU 体系对齐）：
 *   - tier === 'HQ'            → 集团全权限（所有页 + 首页全部矩阵卡）
 *   - 当前页 policy.open===true（公开/聚合页）
 *        → 事业部员工在首页仅见自身矩阵卡；受限子页不在此类
 *   - 当前页 policy.allowed_bus / allowed_dept_ids 命中 tier → 放行
 *   - 否则 → 显示「无访问权限」遮罩
 *
 * 说明：
 *   首页矩阵 openPanel 用的是另一套 code（sjl/dkhx/lubricant/kelan…），
 *   本文件用 MATRIX_ALIAS 将其映射到 auth_policy 规范 BU 码，避免三套命名错配。
 */
(function () {
  'use strict';

  var PAGE = (location.pathname.split('/').pop() || 'index.html').split('?')[0];

  // 首页矩阵 openPanel code -> 规范 BU 码（与 auth_policy.js 对齐）
  var MATRIX_ALIAS = {
    czly: 'czly', sdmd: 'sdmd', sjl: 'sjld', lpsd: 'lpsd', felt: 'felt',
    lubricant: 'lpsd', kelan: 'lpsd', dkhx: 'dhx', bych: 'bych'
  };
  var BU_NAMES = {
    HQ: '集团总部', public: '非本部门', czly: '常州锂源', sdmd: '山东美多', lpsd: '龙蟠时代',
    felt: '法恩莱特', sjld: '三金锂电', dhx: '迪克化学', bych: '铂源催化'
  };

  function getTier() {
    // 多应用模式（妙搭部署）：应用已通过 window.APP_BU 绑定事业部，
    // 飞书 access-scope 已保证“能进入本应用的人都属于该部门”，
    // 故直接以 APP_BU 作为身份判定，无需飞书免登、无需后端（免后端方案）。
    if (typeof window.APP_BU !== 'undefined' && window.APP_BU) {
      return String(window.APP_BU).trim();
    }
    try {
      var p = new URLSearchParams(location.search);
      var t = p.get('tier');
      if (t) return t.trim();
    } catch (e) {}
    try {
      var ls = localStorage.getItem('user_bu_permission');
      if (ls) return ls.trim();
      var fi = JSON.parse(localStorage.getItem('feishu_user_info') || '{}');
      if (fi && fi.matched_bu) return String(fi.matched_bu).trim();
    } catch (e) {}
    return null;
  }

  function tryFeishuLogin() {
    if (typeof window.startFeishuSilentLogin === 'function') {
      try { window.startFeishuSilentLogin(); } catch (e) {}
      return true;
    }
    return false;
  }

  function blockPage(tier) {
    var name = BU_NAMES[tier] || tier || '未知';
    if (document.getElementById('auth-block-overlay')) return;
    var overlay = document.createElement('div');
    overlay.id = 'auth-block-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(245,247,250,.97);' +
      'display:flex;align-items:center;justify-content:center;' +
      'font-family:-apple-system,Segoe UI,Roboto,"Microsoft YaHei",sans-serif;';
    overlay.innerHTML =
      '<div style="max-width:440px;text-align:center;padding:34px 30px;background:#fff;' +
      'border:1px solid #e3e8ef;border-radius:14px;box-shadow:0 8px 30px rgba(20,40,80,.08)">' +
      '<div style="font-size:42px;margin-bottom:12px">🔒</div>' +
      '<div style="font-size:18px;font-weight:700;color:#1f3864;margin-bottom:8px">无访问权限</div>' +
      '<div style="font-size:14px;color:#5b6b82;line-height:1.7">当前身份「' + name +
      '」无权查看本页面。<br>如需访问，请在飞书客户端内打开，或联系集团战略研究部开通对应事业部权限。</div>' +
      '<button onclick="location.href=\'index_v3.html\'" ' +
      'style="margin-top:18px;padding:9px 22px;border:none;background:#1f3864;color:#fff;' +
      'border-radius:8px;font-size:14px;cursor:pointer">返回首页</button>' +
      '</div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  }

  // 首页：过滤矩阵卡片（事业部员工仅见自身卡片；HQ 见全部；集团汇总入口仅 HQ）
  function filterMatrix(tier) {
    // 无身份（tier 为空）时按"公开页"处理：展示全部卡片，不隐藏
    var myBu = (!tier || tier === 'HQ') ? null : (MATRIX_ALIAS[tier] || tier);
    var showAll = !tier || tier === 'HQ';
    var cards = document.querySelectorAll('.matrix-card');
    cards.forEach(function (card) {
      var m = card.getAttribute('onclick') || '';
      var code = (m.match(/openPanel\('([^']+)'\)/) || [])[1];
      if (!code) return;
      var bu = MATRIX_ALIAS[code] || code;
      if (showAll) { card.style.display = ''; return; }
      card.style.display = (bu === myBu) ? '' : 'none';
    });
    document.querySelectorAll('[data-role="hq-only"]').forEach(function (el) {
      el.style.display = (tier === 'HQ') ? '' : 'none';
    });
  }

  function applyGate(tier) {
    var policy = (window.AUTH_POLICY && window.AUTH_POLICY[PAGE]) || { open: true };

    // 公开 / 聚合 / 导航类页
    if (policy.open === true) {
      if (tier) filterMatrix(tier);
      return;
    }

    // 集团全权限
    if (tier === 'HQ') return;

    // 受限页：命中事业部或部门 ID 才放行
    var allowed = policy.allowed_bus || [];
    var allowedDepts = policy.allowed_dept_ids || [];
    var ok = allowed.indexOf(tier) !== -1 ||
      (allowedDepts.length > 0 && allowedDepts.indexOf(tier) !== -1);
    if (!ok) blockPage(tier);
  }

  function run() {
    var tier = getTier();

    // 未识别身份：尝试飞书免登（在飞书环境内会异步回填并重载）
    if (!tier) {
      if (tryFeishuLogin()) return; // 登录完成后页面会重载，再次进入本逻辑
      // 非飞书环境且未带 tier：受限页一律阻塞，公开页不阻塞
      var pol = (window.AUTH_POLICY && window.AUTH_POLICY[PAGE]) || { open: true };
      if (pol.open !== true) blockPage(null);
      return;
    }

    applyGate(tier);

    // 飞书自动登录可能在 1s 后才回填 tier，对公开首页做短轮询以补全矩阵过滤
    if (tier && (window.AUTH_POLICY && window.AUTH_POLICY[PAGE] || {}).open === true) {
      var tries = 0;
      var timer = setInterval(function () {
        var t2 = getTier();
        if (t2 && t2 !== tier) { applyGate(t2); clearInterval(timer); return; }
        if (++tries > 8) clearInterval(timer);
      }, 700);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(run, 300); });
  } else {
    setTimeout(run, 300);
  }
})();
