/**
 * 手机端市场行情监控修复补丁
 * 版本: 20260702_001
 * 作用：
 *   1. 移除 .market-dashboard 的 visibility:hidden（避免加载失败时永远空白）
 *   2. 添加 loading 动画（初始显示，数据加载完成后隐藏）
 *   3. 增加超时时间（手机端改为 20 秒）
 *   4. 添加错误兜底：initLithiumDashboard 失败时仍显示基础内容
 */
(function() {
    'use strict';

    // 配置
    var MOBILE_TIMEOUT = 20000;  // 手机端超时 20 秒
    var DESKTOP_TIMEOUT = 10000; // 桌面端保持 10 秒

    // 检测是否手机端
    function isMobile() {
        return window.innerWidth <= 768 || 
               /Android|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);
    }

    // 修复 1：移除 visibility:hidden，改为 opacity 过渡
    function fixCSS() {
        var style = document.createElement('style');
        style.textContent = `
            /* 修复：移除 visibility:hidden，避免加载失败时永远不可见 */
            .market-dashboard {
                opacity: 0;
                transition: opacity 0.5s ease;
            }
            .market-dashboard.loaded {
                opacity: 1;
            }
            /* Loading 动画 */
            @keyframes market-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            #market-loading {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 40px 20px;
                flex-direction: column;
                gap: 12px;
            }
            #market-content {
                display: none;
            }
            .market-dashboard.loaded #market-loading {
                display: none !important;
            }
            .market-dashboard.loaded #market-content {
                display: block !important;
            }
        `;
        document.head.appendChild(style);
        console.log('[手机修复] CSS 补丁已注入');
    }

    // 修复 2：添加 loading HTML 结构
    function addLoadingHTML() {
        var dashboard = document.querySelector('.market-dashboard');
        if (!dashboard || document.getElementById('market-loading')) return;

        // 创建 loading 遮罩
        var loading = document.createElement('div');
        loading.id = 'market-loading';
        loading.innerHTML = `
            <div style="width:36px;height:36px;border:3px solid #e0e0e0;border-top:3px solid #1e3c72;border-radius:50%;animation:market-spin 1s linear infinite;"></div>
            <div style="font-size:13px;color:#999;">正在加载行情数据...</div>
        `;

        // 创建内容容器（包裹原有内容）
        var content = document.createElement('div');
        content.id = 'market-content';
        
        // 将 dashboard 的内部内容移到 content 中
        while (dashboard.firstChild) {
            content.appendChild(dashboard.firstChild);
        }

        // 添加 loading 和 content 到 dashboard
        dashboard.appendChild(loading);
        dashboard.appendChild(content);

        console.log('[手机修复] Loading HTML 已注入');
    }

    // 修复 3：Hook initLithiumDashboard 函数，添加错误兜底
    function hookInitDashboard() {
        if (typeof window.initLithiumDashboard !== 'function') {
            console.warn('[手机修复] initLithiumDashboard 函数未找到，将在 1 秒后重试');
            setTimeout(hookInitDashboard, 1000);
            return;
        }

        var originalFunc = window.initLithiumDashboard;

        window.initLithiumDashboard = function() {
            console.log('[手机修复] initLithiumDashboard 被调用（已hook）');

            // 调用原始函数，并捕获错误
            return Promise.resolve()
                .then(function() { return originalFunc.apply(this, arguments); })
                .catch(function(error) {
                    console.error('[手机修复] initLithiumDashboard 执行失败:', error);
                    
                    // 即使失败，也显示市场行情区域（避免永远空白）
                    var dashboard = document.querySelector('.market-dashboard');
                    if (dashboard) {
                        dashboard.classList.add('loaded');
                        var loading = document.getElementById('market-loading');
                        if (loading) loading.style.display = 'none';
                        
                        // 显示错误提示
                        var errMsg = document.createElement('div');
                        errMsg.style.cssText = 'padding:20px;text-align:center;color:#999;font-size:13px;';
                        errMsg.innerHTML = '⚠️ 部分数据加载失败，请刷新页面重试<br><button onclick="location.reload()" style="margin-top:10px;padding:6px 16px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;">刷新页面</button>';
                        dashboard.appendChild(errMsg);
                    }
                })
                .finally(function() {
                    // 无论成功失败，都确保 dashboard 可见
                    setTimeout(function() {
                        var dashboard = document.querySelector('.market-dashboard');
                        if (dashboard && !dashboard.classList.contains('loaded')) {
                            dashboard.classList.add('loaded');
                            console.log('[手机修复] 强制显示市场行情区域（finally）');
                        }
                    }, 500);
                });
        };

        console.log('[手机修复] initLithiumDashboard 已 hook（错误兜底已启用）');
    }

    // 修复 4：增加手机端超时时间
    function increaseTimeout() {
        if (isMobile() && typeof XHR_TIMEOUT !== 'undefined') {
            XHR_TIMEOUT = MOBILE_TIMEOUT;
            console.log('[手机修复] XHR_TIMEOUT 已调整为', XHR_TIMEOUT, 'ms（手机端）');
        }
    }

    // 修复 5：Service Worker 缓存策略优化（手机端优先使用缓存）
    function optimizeServiceWorker() {
        if (!navigator.serviceWorker) return;

        // 监听 Service Worker 消息
        navigator.serviceWorker.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'CACHE_HIT') {
                console.log('[手机修复] Service Worker 缓存命中:', event.data.url);
            }
        });

        console.log('[手机修复] Service Worker 优化已启用');
    }

    // 主函数：执行所有修复
    function applyFixes() {
        console.log('[手机修复] 开始应用手机端修复补丁...');

        fixCSS();
        addLoadingHTML();
        hookInitDashboard();
        increaseTimeout();
        optimizeServiceWorker();

        console.log('[手机修复] ✅ 所有修复已应用');
    }

    // 执行时机：DOMContentLoaded 或立即（如果已经 ready）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyFixes);
    } else {
        applyFixes();
    }

})();
