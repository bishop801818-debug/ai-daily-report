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

function showToast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, {position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'#1a1a2e',color:'#fff',padding:'12px 24px',borderRadius:'8px',fontSize:'14px',zIndex:99999,opacity:'0',transition:'opacity .3s',boxShadow:'0 4px 20px rgba(0,0,0,.25)'});
    document.body.appendChild(t);
    requestAnimationFrame(function(){t.style.opacity='1';});
    setTimeout(function(){t.style.opacity='0';setTimeout(function(){document.body.removeChild(t);},300);},2000);
}

function navigateToDetail(buId) {
    var isLocal = /localhost|127\.0\.0\.1/i.test(location.hostname);
    var m = location.search.match(/[?&]__dept=([^&]+)/);
    var deptId = m ? decodeURIComponent(m[1]) : (sessionStorage.getItem('_dept') || '');
    if (!deptId) { showToast('当前账号无权限'); return; }

    var base = isLocal ? '' : 'https://lopal603906.aiforce.cloud/app/app_179wsjrn4fj/sc/radar/' + buId;
    var file = isLocal ? (BU_FILES[buId] || 'radar_detail.html?id=' + buId) : '';
    var url = isLocal ? file : base;

    if (deptId) {
        try { sessionStorage.setItem('_dept', deptId); } catch(e) {}
    }

    var finalUrl = url + '?departmentId=' + encodeURIComponent(deptId) + '&__dept=' + encodeURIComponent(deptId);
    location.assign(finalUrl);
}
