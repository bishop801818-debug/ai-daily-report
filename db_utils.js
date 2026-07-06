/*
  db_utils.js — 数据库页面共享工具函数
  所有数据库 data 页和 chart 页均可引用此文件，避免日期处理逻辑分散导致 "00:00:00" 问题。
  用法：在页面 <script src="db_utils.js"></script> 之后，若页面已有同名函数则保留（不覆盖）。
*/
(function(global) {
    'use strict';

    /* ── 日期清洗：去掉 Excel/SQL 导出的时间后缀 ── */
    function cleanDate(v) {
        if (v == null || v === '') return null;
        return String(v).replace(/ ?00:00:00$/, '').replace(/T00:00:00$/, '');
    }

    /* ── 单元格显示：null/空 → '-', 日期字段自动去掉时间后缀 ── */
    function pct(v) {
        if (v == null || v === '') return '-';
        let s = String(v);
        s = s.replace(/ ?00:00:00$/, '').replace(/T00:00:00$/, '');
        return s;
    }

    /* ── 统一日期格式化：优先显示 YYYY-MM-DD，若无则返回原值 ── */
    function fmtDate(v) {
        if (!v) return '-';
        let s = String(v).trim();
        // "2023-01-02 00:00:00" → "2023-01-02"
        s = s.replace(/ ?00:00:00$/, '').replace(/T00:00:00$/, '');
        // "2023/01/02" → "2023/01/02"（保持原格式）
        return s || '-';
    }

    /* ── 月份格式化：返回 "YY-MM" 短格式 ── */
    function fmtMonth(d) {
        if (!d) return '?';
        let s = d['月份'] || d['日期'] || d['当前日期'] || '?';
        s = cleanDate(s) || s;
        // "2023-01" → "23-01", "2023/1" → "23-01"
        var m = s.match(/^(\d{4})[\-\/](\d{1,2})/);
        if (m) return m[1].slice(2, 4) + '-' + String(m[2]).padStart(2, '0');
        return s;
    }

    /* ── 数字转千分位格式 ── */
    function fmtNum(v) {
        var n = parseFloat(v);
        if (isNaN(n)) return '-';
        return n.toLocaleString();
    }

    /* ── 仅数值（用于图表数据） ── */
    function toNum(v) {
        if (typeof v === 'number') return v;
        if (typeof v === 'string') return parseFloat(v.replace(/[,%]/g, '')) || 0;
        return 0;
    }

    /* ── 挂载到全局（若页面已有同名函数则不覆盖） ── */
    if (typeof global.cleanDate !== 'function') global.cleanDate = cleanDate;
    if (typeof global.pct !== 'function') global.pct = pct;
    if (typeof global.fmtDate !== 'function') global.fmtDate = fmtDate;
    if (typeof global.fmtMonth !== 'function') global.fmtMonth = fmtMonth;
    if (typeof global.fmtNum !== 'function') global.fmtNum = fmtNum;
    if (typeof global.toNum !== 'function') global.toNum = toNum;

})(window);
