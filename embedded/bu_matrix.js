// ═════════════════════════════════════════════════
// 事业部矩阵 · 嵌入首页版 JS（最简版）
// ═════════════════════════════════════════════════
console.log('[BU-MATRIX] JS 已加载');

const BU_DIMS = [
    { id:'d1', name:'战略执行力', color:'#1e3c72', weight:0.20 },
    { id:'d2', name:'经营效益',   color:'#2a5298', weight:0.20 },
    { id:'d3', name:'运营效率',   color:'#1a6b9e', weight:0.18 },
    { id:'d4', name:'技术创新力', color:'#c0572a', weight:0.17 },
    { id:'d5', name:'风险合规',   color:'#b5862a', weight:0.13 },
    { id:'d6', name:'组织活力',   color:'#2a6b7c', weight:0.12 },
];

const BU_DATA = {
    czly:{ name:'常州锂源', logo:'', tag:'新能源材料', accent:'#1e3c72',
        dims:{d1:72,d2:68,d3:78,d4:80,d5:70,d6:68} },
    lpsd:{ name:'龙蟠时代', logo:'', tag:'电芯智造', accent:'#2a5298',
        dims:{d1:65,d2:58,d3:68,d4:75,d5:72,d6:62} },
    sjld:{ name:'三金锂电', logo:'', tag:'三元前驱体', accent:'#1a6b9e',
        dims:{d1:68,d2:62,d3:72,d4:78,d5:68,d6:62} },
    felt:{ name:'法恩莱特', logo:'', tag:'电解液', accent:'#c0572a',
        dims:{d1:70,d2:65,d3:72,d4:82,d5:70,d6:65} },
    sdmd:{ name:'山东美多', logo:'', tag:'回收再利用', accent:'#b5862a',
        dims:{d1:75,d2:65,d3:70,d4:72,d5:72,d6:68} },
    lhy: { name:'润滑油', logo:'', tag:'润滑防护', accent:'#78909c',
        dims:{d1:78,d2:82,d3:80,d4:65,d5:85,d6:75} },
    kls: { name:'可兰素', logo:'', tag:'车用尿素', accent:'#a1887f',
        dims:{d1:80,d2:78,d3:82,d4:62,d5:82,d6:73} },
    bych:{ name:'铂源催化', logo:'', tag:'催化材料', accent:'#00bcd4',
        dims:{d1:72,d2:80,d3:78,d4:88,d5:75,d6:72} },
    dhx: { name:'迪克化学', logo:'', tag:'冷却液', accent:'#7986cb',
        dims:{d1:72,d2:80,d3:78,d4:68,d5:78,d6:70} },
};

const NEW_ENERGY_IDS = ['sdmd','lpsd','czly','felt','sjld'];
const CHEM_IDS      = ['lhy','kls','dhx'];
const HYDROGEN_IDS  = ['bych'];

function calcBuTotal(buId) {
    var bd = BU_DATA[buId];
    var s = 0;
    for (var i = 0; i < BU_DIMS.length; i++) {
        s += (bd.dims[BU_DIMS[i].id]||0) * BU_DIMS[i].weight;
    }
    return s;
}

function buildBuCard(buId) {
    var bd = BU_DATA[buId];
    var logoHtml;
    if (bd.logo) {
        logoHtml = '<img class="bu-card-logo-img" src="' + bd.logo + '" alt="' + bd.name + '" onerror="this.style.display=\\'none\\'">';
    } else {
        logoHtml = '<div class="bu-drawer-logo-placeholder" style="background:' + bd.accent + '22;border:1.5px solid ' + bd.accent + '44;color:' + bd.accent + '">' + bd.name.slice(0,2) + '</div>';
    }
    var total = Math.round(calcBuTotal(buId));
    var color = total >= 80 ? '#2a5298' : total >= 70 ? '#b5862a' : '#c0572a';
    return '<div class="bu-matrix-card" data-buid="' + buId + '" onclick="openBuPanel(\\'' + buId + '\\')">'
        + '<div class="bu-card-logo-wrap">'
        + logoHtml
        + '<div class="bu-card-name-block">'
        + '<div class="bu-card-name">' + bd.name + '</div>'
        + '<span class="bu-card-tag">' + bd.tag + '</span>'
        + '</div></div>'
        + '<div style="display:flex;align-items:center;gap:8px;margin-top:6px;">'
        + '<span style="font-size:0.6rem;color:rgba(30,60,114,0.5);">六维评分</span>'
        + '<span style="font-weight:700;color:' + color + ';font-size:0.85rem;">' + total + '分</span>'
        + '</div></div>';
}

function renderBuCards() {
    console.log('[BU-MATRIX] renderBuCards 开始');
    var ne = '';
    for (var i = 0; i < NEW_ENERGY_IDS.length; i++) { ne += buildBuCard(NEW_ENERGY_IDS[i]); }
    document.getElementById('newenergyCards').innerHTML = ne;

    var ch = '';
    for (var i = 0; i < CHEM_IDS.length; i++) { ch += buildBuCard(CHEM_IDS[i]); }
    document.getElementById('chemicalCards').innerHTML = ch;

    var hy = '';
    for (var i = 0; i < HYDROGEN_IDS.length; i++) { hy += buildBuCard(HYDROGEN_IDS[i]); }
    document.getElementById('hydrogenCards').innerHTML = hy;
    console.log('[BU-MATRIX] renderBuCards 完成');
}

// ── 右侧面板 ──
function openBuPanel(buId) {
    console.log('[BU-MATRIX] openBuPanel:', buId);
    var bd = BU_DATA[buId];
    var logoImg = document.getElementById('buDrawerLogoImg');
    var logoPh  = document.getElementById('buDrawerLogoPlaceholder');
    if (bd.logo) {
        logoImg.src = bd.logo; logoImg.style.display = '';
        logoPh.style.display = 'none';
    } else {
        logoImg.style.display = 'none';
        logoPh.textContent = bd.name.slice(0,2);
        logoPh.style.color = bd.accent;
        logoPh.style.background = bd.accent + '18';
        logoPh.style.borderColor = bd.accent + '44';
        logoPh.style.display = '';
    }
    document.getElementById('buDrawerName').textContent = bd.name;
    document.getElementById('buDrawerTag').textContent  = bd.tag;

    var total = Math.round(calcBuTotal(buId));
    var gradeColor = total >= 80 ? '#2a5298' : total >= 70 ? '#b5862a' : '#c0572a';
    var gradeLabel = total >= 90 ? 'S+卓越' : total >= 80 ? 'A优秀' : total >= 70 ? 'B良好' : total >= 60 ? 'C待改进' : 'D预警';

    var dimsHtml = '';
    for (var i = 0; i < BU_DIMS.length; i++) {
        var d = BU_DIMS[i];
        var v = bd.dims[d.id]||0;
        var w = (v*d.weight).toFixed(1);
        dimsHtml += '<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:0.65rem;">'
            + '<span style="width:42px;color:rgba(30,60,114,0.5);">' + d.name.slice(0,4) + '</span>'
            + '<div style="flex:1;height:4px;background:rgba(30,60,114,0.08);border-radius:2px;overflow:hidden;">'
            + '<div style="width:' + v + '%;height:100%;background:' + d.color + ';border-radius:2px;"></div>'
            + '</div>'
            + '<span style="font-weight:700;color:' + d.color + ';width:28px;text-align:right;">' + v + '</span>'
            + '<span style="color:rgba(30,60,114,0.4);font-size:0.6rem;width:32px;">+' + w + '</span>'
            + '</div>';
    }

    document.getElementById('buDrawerBody').innerHTML =
        '<div style="padding:12px 0;">'
        + '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">'
        + '<div style="font-size:1.5rem;font-weight:900;color:' + gradeColor + ';">' + total + '</div>'
        + '<div><div style="font-size:0.75rem;color:' + gradeColor + ';font-weight:700;">' + gradeLabel + '</div>'
        + '<div style="font-size:0.6rem;color:rgba(30,60,114,0.5);">综合评分</div></div></div>'
        + '<div style="font-size:0.7rem;font-weight:600;color:rgba(30,60,114,0.6);margin-bottom:6px;">六维评分明细</div>'
        + dimsHtml
        + '<div style="margin-top:14px;display:flex;gap:8px;">'
        + '<button onclick="openBuReport(\\'' + buId + '\\')" style="flex:1;padding:8px;border:none;border-radius:8px;background:linear-gradient(135deg,#1e3c72,#2a5298);color:#fff;font-size:0.75rem;cursor:pointer;">早报详情</button>'
        + '<a href="dept-archive.html?bu=' + buId + '" style="flex:1;text-align:center;padding:8px;border:1px solid rgba(30,60,114,0.15);border-radius:8px;color:#1e3c72;font-size:0.75rem;text-decoration:none;">历史存档</a>'
        + '</div></div>';

    document.getElementById('buPanelOverlay').classList.add('active');
}

function closeBuPanel() {
    document.getElementById('buPanelOverlay').classList.remove('active');
}

// ── 早报弹窗（简化版，不依赖 fetch）──
function openBuReport(buId) {
    var bd = BU_DATA[buId];
    document.getElementById('buModalTitle').textContent = bd.name + ' - 事业部早报';
    document.getElementById('buModalBody').innerHTML = '<div style="padding:20px;color:#999;font-size:0.85rem;">正在尝试加载最新早报...</div>';
    document.getElementById('buReportModal').classList.add('active');
    // 尝试加载近3天早报
    var offsets = [0, -1, -2, -3];
    var found = false;
    function tryLoad(idx) {
        if (idx >= offsets.length) {
            document.getElementById('buModalBody').innerHTML = '<div style="padding:40px;text-align:center;color:#999;">暂无近3天早报数据</div>';
            return;
        }
        var d = new Date(); d.setDate(d.getDate() + offsets[idx]);
        var ds = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        fetch('reports/' + ds + '.json').then(function(r){
            if (!r.ok) { tryLoad(idx+1); return; }
            return r.json();
        }).then(function(data){
            if (!data || !data.departments || !data.departments[buId]) { tryLoad(idx+1); return; }
            var dept = data.departments[buId];
            document.getElementById('buModalDate').textContent = ds;
            if (dept.sections && dept.sections.length) {
                var html = '';
                for (var i = 0; i < dept.sections.length; i++) {
                    var s = dept.sections[i];
                    var t = s.title || s.name || '';
                    var c = s.content || s.summary || '';
                    html += '<div style="margin-bottom:12px;"><div style="font-weight:600;color:#1e3c72;margin-bottom:4px;">' + t + '</div>'
                         + '<div style="font-size:0.8rem;color:#444;line-height:1.6;">' + String(c).slice(0,300) + '</div></div>';
                }
                document.getElementById('buModalBody').innerHTML = html;
            } else {
                document.getElementById('buModalBody').innerHTML = '<div style="color:#999;">该日早报无详细内容</div>';
            }
        }).catch(function(){ tryLoad(idx+1); });
    }
    tryLoad(0);
}

function closeBuReport() {
    document.getElementById('buReportModal').classList.remove('active');
}

// ESC 关闭
document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') { closeBuPanel(); closeBuReport(); }
});

// 启动：直接执行，不依赖 DOMContentLoaded
console.log('[BU-MATRIX] 脚本加载完成，开始渲染');
try {
    renderBuCards();
    console.log('[BU-MATRIX] 渲染完成');
} catch(e) {
    console.error('[BU-MATRIX] 渲染错误:', e);
}
