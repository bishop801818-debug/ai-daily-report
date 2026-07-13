// ─────────────────────────────────────────────
// 雷达看板导航公共函数（被 radar_hub.html 引用）
// ⚠️ 此文件为外部脚本，navigateToDetail 必须在此定义
//    不要将以下内容移回 radar_hub.html 的内联 script 中
// ─────────────────────────────────────────────

var BU_FILES = {
    'sdmd': 'radar_detail_sdmd.html',
    'kls':  'radar_detail_kelan.html',
    'lhy':  'radar_detail_lhy.html',
    'dhx':  'radar_detail_dkhx.html',
    'czly': 'radar_detail_czly.html',
    'lpsd': 'radar_detail_lpsd.html',
    'felt': 'radar_detail_felt.html',
    'sjld': 'radar_detail_sjl.html'
};

function navigateToDetail(buId) {
    var isLocal = /localhost|127\.0\.0\.1/i.test(location.hostname);
    var base = isLocal ? '' : 'https://lopal603906.aiforce.cloud/app/app_179wsjrn4fj/api/secure-content/radar/' + buId;
    var file = isLocal ? (BU_FILES[buId] || 'radar_detail.html?id=' + buId) : '';
    var url = isLocal ? file : base;

    // 优先从 URL 读取 __dept，其次从 sessionStorage
    var m = location.search.match(/[?&]__dept=([^&]+)/);
    var deptId = m ? decodeURIComponent(m[1]) : (sessionStorage.getItem('_dept') || '');

    // 将 __dept 存入 sessionStorage（供子页面 bu_gate.js 读取权限）
    if (deptId) {
        try { sessionStorage.setItem('_dept', deptId); } catch(e) {}
    }

    // 拼接 URL 参数：departmentId（子页面用）+ __dept（妙搭平台保留参数）
    var separator = url.includes('?') ? '&' : '?';
    var params = '';
    if (deptId) {
        params = 'departmentId=' + encodeURIComponent(deptId) + '&__dept=' + encodeURIComponent(deptId);
    }
    var finalUrl = params ? (url + separator + params) : url;
    location.assign(finalUrl);
}
