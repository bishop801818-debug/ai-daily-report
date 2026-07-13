
// 异步加载报告数据（动态获取最新报告）
(function() {
    var DATA_BASE = (location.hostname.includes('aiforce.cloud') || location.hostname.includes('miaoda'))
      ? 'https://bishop801818-debug.github.io/ai-daily-report'
      : '.';

    var XHR_TIMEOUT = 10000; // 10秒超时（桌面端）

    // 手机端增加超时时间（网络较慢）
    if (/Android|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768) {
        XHR_TIMEOUT = 25000; // 手机端 25 秒超时
        console.log('[配置] 检测到手机端，XHR_TIMEOUT 调整为', XHR_TIMEOUT, 'ms');
    }

    function showLoading() {
        var div = document.getElementById('loading-mask');
        if (!div) {
            div = document.createElement('div');
            div.id = 'loading-mask';
            div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;';
            div.innerHTML = '<div style="font-size:18px;color:#333;margin-bottom:10px;">正在加载数据...</div><div style="font-size:14px;color:#666;">请稍候</div>';
            document.body.appendChild(div);
        }
    }

    function hideLoading() {
        var div = document.getElementById('loading-mask');
        if (div) div.remove();
    }

    function renderPage() {
        hideLoading();
        if (typeof initPage === 'function') {
            initPage();
        }
        var event = new Event('reportDataLoaded');
        document.dispatchEvent(event);
    }

    function loadData() {
        // 如果有嵌入数据，先渲染（避免白屏）
        if (window.__EMBEDDED__) {
            console.log('[数据加载] 使用嵌入数据，日期: ' + window.__EMBEDDED__.today);
            renderPage();
        } else {
            showLoading();
        }

        var startTime = Date.now();

        // 获取 index.json
        var indexXhr = new XMLHttpRequest();
        var indexUrl = DATA_BASE + '/reports/index.json?v=' + (window.HTML_VERSION || Date.now());

        // 超时定时器
        var indexTimeout = setTimeout(function() {
            console.warn('[数据加载] index.json 请求超时');
            indexXhr.abort();
            // 使用嵌入数据（如果可用）
            if (window.__EMBEDDED__) {
                console.log('[数据加载] 使用嵌入数据（index.json 超时）');
                renderPage();
            } else {
                hideLoading();
                alert('数据加载超时，请刷新页面重试');
            }
        }, XHR_TIMEOUT);

        indexXhr.open('GET', indexUrl, true);

        indexXhr.onload = function() {
            clearTimeout(indexTimeout);

            if (indexXhr.status === 200) {
                // 解析 index.json
                try {
                    var indexData = JSON.parse(indexXhr.responseText);
                } catch(e) {
                    console.warn('[数据加载] index.json JSON解析失败:', e.message);
                    if (window.__EMBEDDED__) {
                        console.log('[数据加载] 使用嵌入数据（index.json 解析失败）');
                        renderPage();
                    } else {
                        hideLoading();
                        alert('数据索引文件格式错误');
                    }
                    return;
                }

                var latestDate = indexData.latest_date;
                var dataFile = DATA_BASE + '/reports/' + latestDate + '.json';

                console.log('[数据加载] 最新报告日期: ' + latestDate);

                // 加载最新的报告文件
                var dataXhr = new XMLHttpRequest();
                var dataUrl = dataFile + '?v=' + (window.HTML_VERSION || Date.now());

                var dataTimeout = setTimeout(function() {
                    console.warn('[数据加载] 报告文件请求超时');
                    dataXhr.abort();
                    // 使用嵌入数据（如果可用）
                    if (window.__EMBEDDED__) {
                        console.log('[数据加载] 使用嵌入数据（报告文件超时）');
                        renderPage();
                    } else {
                        hideLoading();
                        alert('数据加载超时，请刷新页面重试');
                    }
                }, XHR_TIMEOUT);

                dataXhr.open('GET', dataUrl, true);

                dataXhr.onload = function() {
                    clearTimeout(dataTimeout);

                    if (dataXhr.status === 200) {
                        try {
                            var data = JSON.parse(dataXhr.responseText);
                            console.log('[数据加载] 成功（动态），耗时: ' + (Date.now() - startTime) + 'ms');
                            if (data && data.today) {
                                window.__EMBEDDED__ = data;
                                console.log('[数据加载] 数据已缓存到 window.__EMBEDDED__');
                            }
                        } catch(e) {
                            console.warn('[数据加载] JSON解析失败:', e.message);
                        }

                        renderPage(); // 渲染页面
                    } else {
                        console.warn('[数据加载] 报告文件状态码: ' + dataXhr.status);
                        // 使用嵌入数据（如果可用）
                        if (window.__EMBEDDED__) {
                            console.log('[数据加载] 使用嵌入数据（报告文件状态码异常）');
                            renderPage();
                        } else {
                            hideLoading();
                            alert('数据加载失败: ' + dataXhr.status);
                        }
                    }

                };  // 闭合 onload 函数

                dataXhr.onerror = function() {
                    clearTimeout(dataTimeout);
                    console.warn('[数据加载] 报告文件网络错误');
                    // 使用嵌入数据（如果可用）
                    if (window.__EMBEDDED__) {
                        console.log('[数据加载] 使用嵌入数据（网络错误）');
                        renderPage();
                    } else {
                        hideLoading();
                        alert('网络错误，无法加载报告文件');
                    }
                };

                dataXhr.send();

            } else {
                console.warn('[数据加载] index.json 加载失败: ' + indexXhr.status);
                // 使用嵌入数据（如果可用）
                if (window.__EMBEDDED__) {
                    console.log('[数据加载] 使用嵌入数据（index.json 加载失败）');
                    renderPage();
                } else {
                    hideLoading();
                    alert('数据索引文件加载失败: ' + indexXhr.status);
                }
            }
        };

        indexXhr.onerror = function() {
            clearTimeout(indexTimeout);
            console.warn('[数据加载] index.json 网络错误');
            // 使用嵌入数据（如果可用）
            if (window.__EMBEDDED__) {
                console.log('[数据加载] 使用嵌入数据（index.json 网络错误）');
                renderPage();
            } else {
                hideLoading();
                alert('网络错误，无法加载数据索引');
            }
        };

        indexXhr.send();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadData);
    } else {
        loadData();
    }
})();

// ============================================================
// __dept 导航拦截器（inline_01 2026-07-10）
// 作用：读取 index_v3.html URL 中的 __dept 参数，自动追加到所有子页面导航链接
// 这样 radar_hub/analysis_hub 等子页面都能通过 getDept() 读到 __dept，
// secure-content 服务端门禁才能正确校验部门权限。
// ============================================================
(function() {
    // 读取 __dept 并存入 sessionStorage（跨页面持久化）
    var deptMatch = location.search.match(/[?&]__dept=([^&]+)/);
    if (deptMatch) {
        var deptVal = decodeURIComponent(deptMatch[1]);
        sessionStorage.setItem('_dept', deptVal);
        console.log('[导航拦截] 读取 __dept:', deptVal);
    }

    var STORAGE_KEY = '_dept';
    var SUB_PAGE_EXTENSIONS = ['.html', '_hub', '_detail', '_data', '_v4'];

    function shouldAppendDept(href) {
        if (!href) return false;
        if (/^https?:\/\//.test(href)) {
            // 跨域绝对 URL：不追加（安全）
            return false;
        }
        // 去掉 hash 和 query 判断是否子页面
        var base = href.split('#')[0].split('?')[0];
        return SUB_PAGE_EXTENSIONS.some(function(ext) {
            return base.indexOf(ext) !== -1;
        });
    }

    function appendDept(url) {
        var dept = sessionStorage.getItem(STORAGE_KEY) || '';
        if (!dept) return url;
        var hash = '';
        var hashIdx = url.indexOf('#');
        if (hashIdx !== -1) {
            hash = url.slice(hashIdx);
            url = url.slice(0, hashIdx);
        }
        var sep = url.indexOf('?') !== -1 ? '&' : '?';
        // 不重复追加
        if (url.indexOf('__dept=') !== -1) return url + hash;
        return url + sep + '__dept=' + encodeURIComponent(dept) + hash;
    }

    // 拦截所有 onclick handler（内联 JS，如 window.location.href='xxx.html'）
    document.addEventListener('click', function(e) {
        var el = e.target.closest('[onclick]');
        if (!el) return;
        var onclick = el.getAttribute('onclick') || '';
        // 只处理 location.href 相关的导航
        if (onclick.indexOf('location') === -1) return;
        var hrefMatch = onclick.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
        if (!hrefMatch) return;
        var targetUrl = hrefMatch[1];
        if (shouldAppendDept(targetUrl)) {
            e.preventDefault();
            e.stopPropagation();
            var newUrl = appendDept(targetUrl);
            console.log('[导航拦截] 跳转:', targetUrl, '->', newUrl);
            window.location.href = newUrl;
        }
    }, true);

    // 先拦截 location.assign / location.replace（跨环境可靠）
    var _loc = window.location;
    ['assign', 'replace'].forEach(function(method) {
        var orig = _loc[method].bind(_loc);
        _loc[method] = function(url) {
            if (url && shouldAppendDept(String(url))) {
                url = appendDept(String(url));
                console.log('[导航拦截] location.' + method + ':', url);
            }
            return orig(url);
        };
    });

    // 尝试拦截 location.href 直接赋值（部分环境不允许重定义，捕获忽略）
    try {
        Object.defineProperty(window, 'location', {
            get: function() { return _loc; },
            set: function(newVal) {
                var url = String(newVal);
                if (shouldAppendDept(url)) {
                    url = appendDept(url);
                    console.log('[导航拦截] location 赋值:', url);
                }
                _loc.href = url;
            },
            configurable: true
        });
    } catch(e) {
        console.log('[导航拦截] location defineProperty 跳过:', e.message);
    }

    // 拦截 location.assign / location.replace / location.replace
    ['assign', 'replace'].forEach(function(method) {
        var orig = _loc[method].bind(_loc);
        _loc[method] = function(url) {
            if (url && shouldAppendDept(String(url))) {
                url = appendDept(String(url));
                console.log('[导航拦截] location.' + method + ':', url);
            }
            return orig(url);
        };
    });

    // 拦截 <a> 标签（显式 href）
    document.addEventListener('click', function(e) {
        var a = e.target.closest('a');
        if (!a) return;
        var href = a.getAttribute('href');
        if (!href || !shouldAppendDept(href)) return;
        if (a.target === '_blank') return; // 新标签页不拦截
        e.preventDefault();
        var newUrl = appendDept(href);
        console.log('[导航拦截] <a> 跳转:', href, '->', newUrl);
        window.location.href = newUrl;
    }, true);

    console.log('[导航拦截] __dept 拦截器已初始化，当前 sessionStorage._dept =', sessionStorage.getItem('_dept') || '(无)');
})();
