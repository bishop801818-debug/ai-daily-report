
//<![CDATA[
document.addEventListener('DOMContentLoaded', function() {
    var _errors = [];
    try { eval('BU_WEIGHTS_LPSD'); } catch(e) { _errors.push('BU_WEIGHTS_LPSD 未定义 ← 模板复制不完整'); }
    try { eval('RADAR_HISTORY_LPSD'); } catch(e) { _errors.push('RADAR_HISTORY_LPSD 未定义'); }
    try { eval('DIMS_DEF_LPSD'); } catch(e) { _errors.push('DIMS_DEF_LPSD 未定义 ← 模板复制不完整'); }
    try {
        var _hist = eval('RADAR_HISTORY_LPSD');
        var _months = Object.keys(_hist);
        if (_months.length > 0) {
            var _latest = _hist[_months[_months.length - 1]];
            if (_latest && _latest.dims &&
                _latest.dims.d1 === 90 &&
                _latest.dims.d2 === 90 &&
                _latest.dims.d3 === 82) {
                _errors.push('RADAR_HISTORY_LPSD 被SDMD数据污染(d1=90/d2=90/d3=82)，请从 _archive/ 恢复');
            }
        }
    } catch(e) {}
    if (_errors.length > 0) {
        document.open();
        document.write('<div style="padding:40px;font-family:Microsoft YaHei,sans-serif;background:#fee;border:3px solid #c00;border-radius:8px">'
 + '<h2 style="color:#c00">BU 数据校验失败</h2>'
            + '<p>文件: <b>' + location.pathname + '</b></p>'
            + '<p>预期BU: <b>lpsd</b></p>'
            + '<p>发现问题：</p><ul style="color:#c00">'
            + _errors.map(function(e){ return '<li>' + e + '</li>'; }).join('')
            + '</ul><p style="color:#888">请从 _archive/ 恢复原始版本</p></div>');
        document.close();
        console.error('[BU ASSERTION FAILED]', _errors.join('; '));
        throw new Error('BU ASSERTION: ' + _errors.join('; '));
    }
    console.log('[BU OK] lpsd assertion passed, data clean');
});
// ]]>
