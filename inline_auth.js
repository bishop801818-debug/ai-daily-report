/**
 * 权限闸门（inline_auth.js）
 * ------------------------------------------------------------------
 * 页面加载时根据 auth_policy.js 的 AUTH_POLICY 判定当前页是否允许当前飞书用户访问。
 * - 命中（部门 ID 交集 或 事业部匹配 或 页面不设限）→ 移除遮罩，正常渲染。
 * - 未命中 → 显示"无权限访问"遮罩。
 * - 非飞书环境 → 受限页显示"请在飞书中打开"；公共页正常。
 * - 调试：URL 带 ?bypass=1 跳过鉴权（仅本地/测试用）。
 *
 * 两种模式：
 *  - 多应用模式（免后端）：若 window.APP_BU 已设置（由发布脚本按应用注入），
 *    直接按该 BU 判定可见性，无需查询飞书、无需后端；配合妙搭 access-scope 按部门限制进入。
 *  - 单应用 + 后端模式：否则走 tt.getAuthCode → 后端换部门（需部署 api/feishu.py 并填 AUTH_BACKEND）。
 * 依赖（需在其之前加载）：auth_policy.js（定义 window.AUTH_POLICY）；可选 app_config.js（定义 window.APP_BU）。
 */
(function () {
    'use strict';

    var APP_ID = (window.FEISHU_JS_CONFIG && window.FEISHU_JS_CONFIG.appId) || 'cli_aab2066784b85bcf';
    var CACHE_KEY = 'auth_identity';
    var OVERLAY_ID = 'auth_gate_overlay';

    // ---------- 工具 ----------
    function getPageKey() {
        var path = location.pathname.split('/').pop();
        if (!path) path = 'index.html';
        if (window.AUTH_POLICY && window.AUTH_POLICY[path]) return path;
        if (path === 'index.html' && window.AUTH_POLICY && window.AUTH_POLICY['index_v3.html']) return 'index_v3.html';
        return path;
    }

    function isOpen(policy) {
        return !policy || policy.open === true;
    }

    function allowedSet(policy) {
        var s = new Set();
        (policy.allowed_bus || []).forEach(function (b) { s.add('bu:' + b); });
        (policy.allowed_dept_ids || []).forEach(function (d) { s.add(d); });
        return s;
    }

    function getBypass() {
        return /[?&]bypass=1\b/.test(location.search);
    }

    // 后端是否已真实配置：未配置 / 占位符 / 显式禁用 → 返回 false
    // 返回 false 时主流程走 fail-open（全页面放行），避免受限页因无后端而打挂
    function isBackendConfigured() {
        if (window.AUTH_DISABLED === true) return false;
        var b = window.AUTH_BACKEND;
        if (!b || typeof b !== 'string') return false;
        if (b.indexOf('<') >= 0) return false;                 // 模板占位符未替换
        if (/vercel\.app|YOUR-VERCEL/i.test(b)) return false;  // 占位符域名未替换
        if (/^https?:\/\/[\s/]*$/.test(b)) return false;       // 仅协议无主机
        return true;
    }

    // ---------- 遮罩 ----------
    function ensureOverlay() {
        var el = document.getElementById(OVERLAY_ID);
        if (el) return el;
        el = document.createElement('div');
        el.id = OVERLAY_ID;
        el.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(245,247,250,.97);' +
            'display:flex;align-items:center;justify-content:center;flex-direction:column;' +
            'font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;color:#1f2329;';
        (document.body || document.documentElement).appendChild(el);
        return el;
    }

    function renderOverlay(kind, title, sub) {
        var el = ensureOverlay();
        var btn = '';
        if (kind === 'denied' || kind === 'needfeishu') {
            btn = '<button onclick="window.__authRetry && window.__authRetry()" ' +
                'style="margin-top:18px;padding:8px 18px;border:none;border-radius:6px;' +
                'background:#3370ff;color:#fff;font-size:14px;cursor:pointer;">重新验证</button>';
        }
        el.innerHTML =
            '<div style="font-size:15px;font-weight:600;letter-spacing:.5px;">' + title + '</div>' +
            (sub ? '<div style="margin-top:10px;font-size:13px;color:#646a73;max-width:320px;text-align:center;line-height:1.6;">' + sub + '</div>' : '') +
            btn;
    }

    function removeOverlay() {
        var el = document.getElementById(OVERLAY_ID);
        if (el && el.parentNode) el.parentNode.removeChild(el);
    }

    // ---------- 身份获取 ----------
    function getIdentity() {
        // 0. 多应用模式：本应用已绑定 BU，直接用 APP_BU 判定，无需查飞书/后端
        if (window.APP_BU) return Promise.resolve({ dept_ids: [], matched_bu: window.APP_BU });
        // 1. 调试绕过
        if (getBypass()) return Promise.resolve({ dept_ids: [], matched_bu: 'bypass' });
        // 2. 会话缓存
        try {
            var cached = sessionStorage.getItem(CACHE_KEY);
            if (cached) return Promise.resolve(JSON.parse(cached));
        } catch (e) {}
        // 3. 非飞书环境
        if (typeof window.tt === 'undefined') {
            return Promise.reject({ code: 'no_tt' });
        }
        // 4. 飞书免登：getAuthCode -> 后端换部门
        return new Promise(function (resolve, reject) {
            function doGet() {
                window.tt.getAuthCode({
                    appId: APP_ID,
                    success: function (res) {
                        var code = res && res.code;
                        if (!code) { reject({ code: 'no_code' }); return; }
                        fetch(window.AUTH_BACKEND + '/feishu/callback', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ code: code })
                        }).then(function (r) { return r.json(); }).then(function (data) {
                            if (!data || data.code !== 0 || !data.data) {
                                reject({ code: 'exchange_fail', msg: (data && data.msg) || '' });
                                return;
                            }
                            var identity = {
                                dept_ids: data.data.dept_ids || [],
                                matched_bu: data.data.matched_bu || 'all'
                            };
                            try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(identity)); } catch (e) {}
                            resolve(identity);
                        }).catch(function (err) { reject({ code: 'net', err: err }); });
                    },
                    fail: function (err) { reject({ code: 'getauthcode_fail', err: err }); }
                });
            }
            if (window.tt.ready) {
                window.tt.ready(doGet);
            } else {
                doGet();
            }
        });
    }

    // ---------- 判定 ----------
    function checkAccess(identity, allowed) {
        if (!identity) return false;
        if (identity.matched_bu === 'bypass') return true;
        if (allowed.has('bu:' + identity.matched_bu)) return true;
        var deptIds = identity.dept_ids || [];
        for (var i = 0; i < deptIds.length; i++) {
            if (allowed.has(deptIds[i])) return true;
        }
        return false;
    }

    // ---------- 主流程 ----------
    function run() {
        // 调试绕过
        if (getBypass()) { removeOverlay(); return; }

        var key = getPageKey();
        var policy = window.AUTH_POLICY && window.AUTH_POLICY[key];

        // ===== 多应用模式（免后端）=====
        // 本应用已通过 window.APP_BU 绑定到某个事业部（由发布脚本按应用注入）。
        // 飞书 access-scope 已保证"进来的都是本部门的人"，此处直接按 APP_BU 判定可见性，
        // 无需查询飞书、无需任何后端。跨事业部页面在本应用内被隐藏。
        if (window.APP_BU) {
            if (isOpen(policy)) { removeOverlay(); return; }
            if (checkAccess({ matched_bu: window.APP_BU, dept_ids: [] }, allowedSet(policy))) {
                removeOverlay();
            } else {
                renderOverlay('denied', '无权限访问', '本页面不在本应用授权范围内。如需访问，请联系战略研究部。');
            }
            return;
        }

        // ===== 单应用 + 后端模式 =====
        // 后端未配置 / 显式关闭 → 临时全开放（fail-open），不影响网站正常使用
        if (!isBackendConfigured()) {
            console.warn('[auth] 鉴权后端未配置(AUTH_BACKEND 为空/占位符)或已显式禁用，临时放开全部页面(fail-open)。部署后端并填写 AUTH_BACKEND 后自动恢复鉴权。');
            removeOverlay(); return;
        }

        // 公共页：直接放行
        if (isOpen(policy)) { removeOverlay(); return; }

        var allowed = allowedSet(policy);
        renderOverlay('checking', '权限校验中…', '正在核对您的飞书组织架构权限');

        getIdentity().then(function (identity) {
            if (checkAccess(identity, allowed)) {
                removeOverlay();   // 放行：正常渲染
            } else {
                renderOverlay('denied', '无权限访问', '您当前的飞书部门不在本页授权范围内。如需访问，请联系战略研究部开通权限。');
            }
        }).catch(function (err) {
            if (err && err.code === 'no_tt') {
                renderOverlay('needfeishu', '请在飞书中打开', '本页面仅对授权部门开放，请在飞书客户端/妙搭中打开本应用。');
            } else {
                var sub = '身份验证失败';
                if (err && err.msg) sub += '：' + err.msg;
                else if (err && err.code) sub += '（' + err.code + '）';
                sub += '。请点击重新验证，或在飞书内打开。';
                renderOverlay('denied', '无权限访问', sub);
            }
        });
    }

    // 暴露重试
    window.__authRetry = function () {
        try { sessionStorage.removeItem(CACHE_KEY); } catch (e) {}
        removeOverlay();
        run();
    };

    // DOM 就绪后执行（此时 body 已可挂载遮罩）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
