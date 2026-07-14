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
  // 从 sessionStorage 中读取（inline_01.js 中存储）
  try { return sessionStorage.getItem('_dept') || ''; } catch(e) { return ''; }
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
    // 方法3: 从 data-bu 属性识别
    if (!buId) {
      buId = card.getAttribute('data-bu') || '';
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
  BU_DEPT: BU_DEPT,
};

})();

      window.HTML_VERSION = "20260713_001"; // 版本号（2026-07-13早报更新）

      /* ========== 全局 fetch 去重（防止并发重复请求同一资源）========== */
      (function() {
        var _origFetch = window.fetch.bind(window);
        var _cache = {};

        // 规范化 URL：去掉缓存破坏参数（?t= & _t= & v= & _cb=）
        function _normUrl(url) {
          if (typeof url !== 'string') return url;
          // 只保留 pathname，query 中的 t/_t/v/_cb 都是缓存破坏，对并发去重无意义
          var bare = url.split('#')[0].split('?')[0];
          return bare;
        }

        window.fetch = function(url, options) {
          var opts = options || {};
          var method = (opts.method || 'GET').toUpperCase();
          // 只去重 GET 请求
          if (method !== 'GET') return _origFetch(url, opts);

          var key = _normUrl(url);
          if (_cache[key]) {
            // 复用进行中的请求，返回独立 clone
            console.log('[fetch去重] ' + url + ' → 复用进行中的请求');
            return _cache[key].then(function(resp) {
              return resp.clone();
            });
          }

          // 发起新请求，缓存 promise
          var p = _origFetch(url, opts).then(function(resp) {
            // 请求成功：缓存克隆后的响应（供后续复用）
            return resp.clone();
          });
          _cache[key] = p;

          // 请求结束后清除缓存（允许下次重新请求）
          p.finally(function() {
            delete _cache[key];
          });

          // 返回独立 clone 给当前调用者
          return p.then(function(resp) {
            return resp.clone();
          });
        };

        console.log('[fetch去重] ✅ 全局 fetch() 已重载，支持并发去重');
      })();

      
      /* ---------- Service Worker 注册（离线缓存）---------- */
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('./sw.js?v=' + window.HTML_VERSION)
            .then(function(registration) {
              console.log('[SW] 注册成功:', registration.scope);
            })
            .catch(function(error) {
              console.log('[SW] 注册失败:', error);
            });
        });
      }


      /* ---------- 彻底防止图表旧内容闪屏（bfcache + 渲染残留）----------
       * 问题：浏览器前进后退缓存(bfcache)会保存完整页面状态，
       *       刷新时先显示旧页面（含旧图表），约1秒后才加载新数据。
       * 方案：
       *   1. 页面解析时立即清空已存在的SVG图表内容
       *   2. DOMContentLoaded后再次清空所有SVG（确保body中的也被处理）
       *   3. 重置loading状态，确保显示"数据加载中..."
       *   4. 监听pageshow事件，bfcache恢复时强制重新加载 */
      (function() {
        function clearAllCharts() {
          document.querySelectorAll('svg[id*="Chart"] g').forEach(function(g) {
            g.innerHTML = '';
          });
          document.querySelectorAll('svg[id*="Chart"]').forEach(function(svg) {
            svg.style.visibility = 'hidden';
          });
          document.querySelectorAll('.chart-loading').forEach(function(el) {
            el.style.display = 'flex';
          });
          document.querySelectorAll('.chart-no-data').forEach(function(el) {
            el.style.display = 'none';
          });
        }

        // 1. 立即清空已解析的SVG（head中执行时可能只有部分）
        clearAllCharts();

        // 2. DOMContentLoaded后再次清空所有SVG（确保完整）
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', clearAllCharts);
        } else {
          clearAllCharts();
        }

        // 3. 监听pageshow：若从bfcache恢复，强制重新加载页面
        window.addEventListener('pageshow', function(e) {
          if (e.persisted) {
            console.log('[bfcache] 从缓存恢复，强制重新加载...');
            location.reload();
          }
        });
        // 4. 监听pagehide：页面进入bfcache前，清除SVG的inline visibility，
        //    防止bfcache保存"SVG可见"状态（否则下次恢复时会先闪旧图）
        window.addEventListener('pagehide', function(e) {
          if (e.persisted) {
            document.querySelectorAll('svg[id*="Chart"]').forEach(function(svg) {
              svg.style.visibility = 'hidden';
            });
          }
        });
      })();

        /* ---------- Ticker 同步辅助函数 ---------- */
        function updateTicker(priceId, priceText, changePct) {
            var priceEl = document.getElementById(priceId);
            var changeEl = document.getElementById(priceId + '-change');
            if (priceEl) priceEl.textContent = priceText;
            if (changeEl) {
                var pctVal = typeof changePct === 'number' ? changePct : 0;
                changeEl.textContent = (pctVal >= 0 ? '+' : '') + pctVal.toFixed(2) + '%';
                changeEl.className = 'ticker-change ' + (pctVal >= 0 ? 'up' : 'down');
            }
        }
    
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

// 锂辉石精矿价格走势图
        // ============================================================
        var _lithiumOreChartData = null;
        var _lithiumOreChartW = 800, _lithiumOreChartH = 260;
        var _lithiumOrePad = { top: 15, right: 15, bottom: 35, left: 75 };

        async function initLithiumOreChart() {
            var loading = document.getElementById('lithiumOreChartLoading');
            var noData = document.getElementById('lithiumOreChartNoData');
            var svg = document.getElementById('lithiumOreChart');
            if (!svg) return;

            try {
                var resp = await fetch('data/lithium_ore_price_history.json?t=' + Date.now());
                if (!resp.ok) throw new Error('HTTP error');
                var data = await resp.json();

                // 过滤：只保留2026-01-01及之后的数据，并按日期升序排序
                if (data.history) {
                    data.history = data.history.filter(function(d) { return d.date >= '2026-01-01'; });
                    // 只保留5%澳洲的数据用于图表显示
                    data.history = data.history.filter(function(d) { return d.grade === '5%' && d.origin === '澳洲'; });
                    data.history.sort(function(a, b) { return a.date.localeCompare(b.date); });
                }

                if (!data.history || data.history.length === 0) {
                    if (loading) loading.style.display = 'none';
                    if (noData) noData.style.display = 'flex';
                    return;
                }

                _lithiumOreChartData = data;

                // 更新标题栏信息（显示5%澳洲的最新价）
                var latest = data.history[data.history.length - 1];
                var priceEl = document.getElementById('lithiumOreLatestPrice');
                var changeEl = document.getElementById('lithiumOreLatestChange');
                var updatedEl = document.getElementById('lithiumOreChartUpdated');

                if (priceEl && latest) {
                    priceEl.textContent = latest.avg_price.toFixed(0) + ' ' + (latest.unit || '美元/吨');
                }
                var pct = 0;
                if (changeEl && data.history.length >= 2) {
                    var prev = data.history[data.history.length - 2].avg_price;
                    var curr = latest.avg_price;
                    pct = prev > 0 ? ((curr - prev) / prev * 100) : 0;
                    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
                }
                updateTicker('ticker-spod', latest.avg_price.toFixed(0) + ' ' + (latest.unit || '美元/吨'), pct);
                if (updatedEl) updatedEl.textContent = 'Update: ' + data.update_time;

                drawLithiumOreChart(svg, data.history);
                if (noData) noData.style.display = 'none';

                function fitSvgToContainer() {
                    var svg2 = document.getElementById('lithiumOreChart');
                    var parent = svg2 && svg2.parentElement;
                    if (parent) {
                        var pw = parent.clientWidth || 800;
                        svg2.setAttribute('width', pw);
                        svg2.setAttribute('height', Math.round(pw * 260 / 800));
                    }
                }
                fitSvgToContainer();
                window.addEventListener('resize', function() { fitSvgToContainer(); });

                if (loading) loading.style.display = 'none';
            } catch (e) {
                console.warn('[LithiumOre Chart] load failed:', e);
                if (loading) loading.style.display = 'none';
                if (noData) noData.style.display = 'flex';
            }
        }

        function drawLithiumOreChart(svg, historyData) {
            var W = _lithiumOreChartW, H = _lithiumOreChartH;
            var PAD = _lithiumOrePad;
            var chartW = W - PAD.left - PAD.right;
            var chartH = H - PAD.top - PAD.bottom;

            // 过滤出5%澳洲的数据
            var filtered = historyData.filter(function(d) {
                return d.grade === '5%' && d.origin === '澳洲';
            });
            if (filtered.length === 0) filtered = historyData;

            var prices = filtered.map(function(d) { return d.avg_price; });
            var minPrice = Math.min.apply(null, prices);
            var maxPrice = Math.max.apply(null, prices);
            var priceRange = maxPrice - minPrice || 1;
            var padding = priceRange * 0.1;
            minPrice -= padding; maxPrice += padding;

            function xScale(i) { return PAD.left + (i / (filtered.length - 1)) * chartW; }
            function yScale(p) { return PAD.top + (1 - (p - minPrice) / (maxPrice - minPrice)) * chartH; }

            var gridG = svg.querySelector('#lithiumOreChartGrid');
            var areaG = svg.querySelector('#lithiumOreChartArea');
            var lineG = svg.querySelector('#lithiumOreChartLine');
            var axisXG = svg.querySelector('#lithiumOreChartAxisX');
            var axisYG = svg.querySelector('#lithiumOreChartAxisY');

            if (gridG) gridG.innerHTML = '';
            if (areaG) areaG.innerHTML = '';
            if (lineG) lineG.innerHTML = '';
            if (axisXG) axisXG.innerHTML = '';
            if (axisYG) axisYG.innerHTML = '';

            function mk(tag, attrs) {
                var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
                for (var k in attrs) el.setAttribute(k, attrs[k]);
                return el;
            }

            // 网格线
            for (var i = 0; i <= 5; i++) {
                var y = PAD.top + (i / 5) * chartH;
                gridG.appendChild(mk('line', { x1: PAD.left, y1: y, x2: PAD.left + chartW, y2: y, stroke: '#eee', 'stroke-width': 1 }));
            }

            // Y轴标签
            for (var i = 0; i <= 5; i++) {
                var y = PAD.top + (i / 5) * chartH;
                var val = maxPrice - (i / 5) * (maxPrice - minPrice);
                axisYG.appendChild(mk('text', { x: PAD.left - 8, y: y + 4, 'text-anchor': 'end', 'font-size': 11, fill: '#999' }));
                axisYG.lastChild.textContent = val.toFixed(0);
            }

            // X轴标签（显示部分日期）
            var step = Math.max(1, Math.floor(filtered.length / 6));
            for (var i = 0; i < filtered.length; i += step) {
                var x = xScale(i);
                var date = filtered[i].date;
                if (date && date.length >= 10) date = date.substring(5, 10); // MM-DD
                axisXG.appendChild(mk('text', { x: x, y: PAD.top + chartH + 20, 'text-anchor': 'middle', 'font-size': 10, fill: '#999' }));
                axisXG.lastChild.textContent = date;
                axisXG.appendChild(mk('line', { x1: x, y1: PAD.top + chartH, x2: x, y2: PAD.top + chartH + 5, stroke: '#ccc', 'stroke-width': 1 }));
            }

            // 面积图
            var areaPath = 'M ' + xScale(0) + ' ' + yScale(minPrice);
            for (var i = 0; i < filtered.length; i++) {
                areaPath += ' L ' + xScale(i) + ' ' + yScale(filtered[i].avg_price);
            }
            areaPath += ' L ' + xScale(filtered.length - 1) + ' ' + yScale(minPrice) + ' Z';
            areaG.appendChild(mk('path', { d: areaPath, fill: 'url(#lithiumOreChartGrad)', stroke: 'none' }));

            // 折线图
            var linePath = '';
            for (var i = 0; i < filtered.length; i++) {
                if (i === 0) linePath = 'M ' + xScale(i) + ' ' + yScale(filtered[i].avg_price);
                else linePath += ' L ' + xScale(i) + ' ' + yScale(filtered[i].avg_price);
            }
            // 浅色线（底层，静态显示）
            lineG.appendChild(mk('path', { d: linePath, fill: 'none', stroke: '#ef5350', 'stroke-width': 2, 'stroke-opacity': 0.25 }));
            // 深色线（上层，初始不可见，等待动画揭幕）
            lineG.appendChild(mk('path', { d: linePath, fill: 'none', stroke: '#ef5350', 'stroke-width': 2, 'class': 'data-line deep-line-anim', 'stroke-dasharray': '10000', 'stroke-dashoffset': '10000' }));

            // 最新点标记
            var lastIdx = filtered.length - 1;
            lineG.appendChild(mk('circle', { cx: xScale(lastIdx), cy: yScale(filtered[lastIdx].avg_price), r: 4, fill: '#e91e63', stroke: '#fff', 'stroke-width': 2 }));
            // ── Black crosshair lines ──────────────────────────────────
            var chG = svg.querySelector('#lithiumOreChartCrosshair');
            if (!chG) {
                chG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                chG.id = 'lithiumOreChartCrosshair';
                svg.appendChild(chG);
            }
            chG.innerHTML = '';
            var chVert = mk('line', { x1: 0, y1: PAD.top, x2: 0, y2: PAD.top + chartH, stroke: '#555', 'stroke-width': 1, 'stroke-dasharray': '3,2', 'pointer-events': 'none' });
            var chHorz = mk('line', { x1: PAD.left, y1: 0, x2: PAD.left + chartW, y2: 0, stroke: '#555', 'stroke-width': 1, 'stroke-dasharray': '3,2', 'pointer-events': 'none' });
            chG.appendChild(chVert);
            chG.appendChild(chHorz);

            function getIdxOre(e) {
                var rect = svg.getBoundingClientRect();
                var svgX = ((e.clientX - rect.left) / rect.width) * W;
                return Math.max(0, Math.min(filtered.length - 1, Math.round(((svgX - PAD.left) / chartW) * (filtered.length - 1))));
            }

            var hoverTip = null;
            svg.addEventListener('mousemove', function(e) {
                var idx = getIdxOre(e);
                var cx = xScale(idx), cy = yScale(filtered[idx].avg_price);
                // 更新黑色十字线
                var chG2 = svg.querySelector('#lithiumOreChartCrosshair');
                if (chG2) {
                    var lines = chG2.querySelectorAll('line');
                    if (lines.length >= 2) {
                        lines[0].setAttribute('x1', cx); lines[0].setAttribute('x2', cx);
                        lines[0].setAttribute('y1', PAD.top); lines[0].setAttribute('y2', PAD.top + chartH);
                        lines[1].setAttribute('x1', PAD.left); lines[1].setAttribute('x2', PAD.left + chartW);
                        lines[1].setAttribute('y1', cy); lines[1].setAttribute('y2', cy);
                    }
                }
                
                if (hoverTip === null) {
                    hoverTip = document.getElementById('lithiumOreChartHoverTip');
                }
                var container = svg.parentElement;
                if (!container) { console.error('[Tooltip] Container not found'); return; }
                
                if (!hoverTip) {
                    hoverTip = document.createElement('div');
                    hoverTip.id = 'lithiumOreChartHoverTip';
                    hoverTip.className = 'chart-tooltip';
                    hoverTip.style.cssText = 'position:absolute;background:rgba(30,60,114,0.95);color:white;padding:6px 10px;border-radius:6px;font-size:12px;pointer-events:none;white-space:nowrap;display:none;z-index:9999;';
                    container.style.position = 'relative';
                    container.appendChild(hoverTip);
                    console.log('[Tooltip] Created hoverTip element', hoverTip);
                }
                
                var d = filtered[idx];
                if (!d) { console.warn('[Tooltip] No data at idx', idx); return; }
                var prevPrice = idx > 0 ? filtered[idx - 1].avg_price : d.avg_price;
                var chgPct = prevPrice > 0 ? ((d.avg_price - prevPrice) / prevPrice * 100) : 0;
                var chgColor = chgPct > 0 ? '#ef5350' : (chgPct < 0 ? '#66bb6a' : '#999');
                var chgSign = chgPct >= 0 ? '+' : '';
                var priceText = d.avg_price.toFixed(0) + ' 美元/吨';
                var changeText = chgSign + chgPct.toFixed(2) + '%';
                
                hoverTip.innerHTML =
                    '<span style="color:#9bb5d4;font-size:11px">' + d.date + '</span><br>' +
                    '<span style="font-size:13px;font-weight:bold">' + priceText + '</span><br>' +
                    '<span style="color:' + chgColor + ';font-size:11px">' + changeText + '</span>';
                hoverTip.style.display = 'block';
                hoverTip.style.left = '10px';
                hoverTip.style.top = '10px';
                hoverTip.style.right = 'auto';
                console.log('[Tooltip] Should be visible at 10x10', 'display=' + hoverTip.style.display, 'left=' + hoverTip.style.left);
            });
            svg.addEventListener('mouseleave', function() {
                var ht = document.getElementById('lithiumOreChartHoverTip');
                if (ht) ht.style.display = 'none';
                var chG3 = svg.querySelector('#lithiumOreChartCrosshair');
                if (chG3) chG3.style.display = 'none';
            });
            svg.addEventListener('mouseenter', function() {
                var chG4 = svg.querySelector('#lithiumOreChartCrosshair');
                if (chG4) chG4.style.display = '';
            });
            // 显示SVG（防止旧内容闪屏）
            svg.style.setProperty('visibility', 'visible', 'important');
        }

        // 锂云母价格走势图
        // ============================================================
        var _lepidoliteChartData = null;
        var _lepidoliteChartW = 800, _lepidoliteChartH = 260;
        var _lepidolitePad = { top: 15, right: 15, bottom: 35, left: 75 };

        async function initLepidoliteChart() {
            var loading = document.getElementById('lepidoliteChartLoading');
            var noData = document.getElementById('lepidoliteChartNoData');
            var svg = document.getElementById('lepidoliteChart');
            if (!svg) return;

            try {
                var resp = await fetch('data/lepidolite_price_history.json?t=' + Date.now());
                if (!resp.ok) throw new Error('HTTP error');
                var data = await resp.json();
                // 过滤：只保留2026-01-01及之后的数据，并按日期升序排序
                if (data.history) {
                    data.history = data.history.filter(function(d) { return d.date >= '2026-01-01'; });
                    data.history.sort(function(a, b) { return a.date.localeCompare(b.date); });
                }

                if (!data.history || data.history.length === 0) {
                    if (loading) loading.style.display = 'none';
                    if (noData) noData.style.display = 'flex';
                    return;
                }

                _lepidoliteChartData = data;

                // 更新标题栏信息
                var latest = data.history[data.history.length - 1];
                var priceEl = document.getElementById('lepidoliteLatestPrice');
                var changeEl = document.getElementById('lepidoliteLatestChange');
                var updatedEl = document.getElementById('lepidoliteChartUpdated');

                if (priceEl && latest) {
                    priceEl.textContent = latest.avg_price.toFixed(0) + ' 元/吨';
                }
                var pct = 0;
                if (changeEl && data.history.length >= 2) {
                    var prev = data.history[data.history.length - 2].avg_price;
                    var curr = latest.avg_price;
                    pct = prev > 0 ? ((curr - prev) / prev * 100) : 0;
                    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
                }
                var lepPriceText = latest.avg_price.toFixed(0) + ' 元/吨';
                updateTicker('ticker-lep', lepPriceText, pct);
                if (updatedEl) updatedEl.textContent = 'Update: ' + data.update_time;

                drawLepidoliteChart(svg, data.history);
                if (noData) noData.style.display = 'none';

                function fitSvgToContainer2() {
                    var svg2 = document.getElementById('lepidoliteChart');
                    var parent = svg2 && svg2.parentElement;
                    if (parent) {
                        var pw = parent.clientWidth || 800;
                        svg2.setAttribute('width', pw);
                        svg2.setAttribute('height', Math.round(pw * 260 / 800));
                    }
                }
                fitSvgToContainer2();
                window.addEventListener('resize', function() { fitSvgToContainer2(); });

                if (loading) loading.style.display = 'none';
            } catch (e) {
                console.warn('[Lepidolite Chart] load failed:', e);
                if (loading) loading.style.display = 'none';
                if (noData) noData.style.display = 'flex';
            }
        }

        function drawLepidoliteChart(svg, historyData) {
            var W = _lepidoliteChartW, H = _lepidoliteChartH;
            var PAD = _lepidolitePad;
            var chartW = W - PAD.left - PAD.right;
            var chartH = H - PAD.top - PAD.bottom;

            var prices = historyData.map(function(d) { return d.avg_price; });
            var minPrice = Math.min.apply(null, prices);
            var maxPrice = Math.max.apply(null, prices);
            var priceRange = maxPrice - minPrice || 1;
            var padding = priceRange * 0.1;
            minPrice -= padding; maxPrice += padding;

            function xScale(i) { return PAD.left + (i / (historyData.length - 1)) * chartW; }
            function yScale(p) { return PAD.top + (1 - (p - minPrice) / (maxPrice - minPrice)) * chartH; }

            var gridG = svg.querySelector('#lepidoliteChartGrid');
            var areaG = svg.querySelector('#lepidoliteChartArea');
            var lineG = svg.querySelector('#lepidoliteChartLine');
            var axisXG = svg.querySelector('#lepidoliteChartAxisX');
            var axisYG = svg.querySelector('#lepidoliteChartAxisY');

            if (gridG) gridG.innerHTML = '';
            if (areaG) areaG.innerHTML = '';
            if (lineG) lineG.innerHTML = '';
            if (axisXG) axisXG.innerHTML = '';
            if (axisYG) axisYG.innerHTML = '';

            function mk(tag, attrs) {
                var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
                for (var k in attrs) el.setAttribute(k, attrs[k]);
                return el;
            }

            // 网格线
            for (var i = 0; i <= 5; i++) {
                var y = PAD.top + (i / 5) * chartH;
                gridG.appendChild(mk('line', { x1: PAD.left, y1: y, x2: PAD.left + chartW, y2: y, stroke: '#eee', 'stroke-width': 1 }));
            }

            // Y轴标签
            for (var i = 0; i <= 5; i++) {
                var y = PAD.top + (i / 5) * chartH;
                var val = maxPrice - (i / 5) * (maxPrice - minPrice);
                axisYG.appendChild(mk('text', { x: PAD.left - 8, y: y + 4, 'text-anchor': 'end', 'font-size': 11, fill: '#999' }));
                axisYG.lastChild.textContent = val.toFixed(0);
            }

            // X轴标签
            var step = Math.max(1, Math.floor(historyData.length / 6));
            for (var i = 0; i < historyData.length; i += step) {
                var x = xScale(i);
                var date = historyData[i].date;
                if (date && date.length >= 10) date = date.substring(5, 10);
                axisXG.appendChild(mk('text', { x: x, y: PAD.top + chartH + 20, 'text-anchor': 'middle', 'font-size': 10, fill: '#999' }));
                axisXG.lastChild.textContent = date;
                axisXG.appendChild(mk('line', { x1: x, y1: PAD.top + chartH, x2: x, y2: PAD.top + chartH + 5, stroke: '#ccc', 'stroke-width': 1 }));
            }

            // 面积图
            var areaPath = 'M ' + xScale(0) + ' ' + yScale(minPrice);
            for (var i = 0; i < historyData.length; i++) {
                areaPath += ' L ' + xScale(i) + ' ' + yScale(historyData[i].avg_price);
            }
            areaPath += ' L ' + xScale(historyData.length - 1) + ' ' + yScale(minPrice) + ' Z';
            areaG.appendChild(mk('path', { d: areaPath, fill: 'url(#lepidoliteChartGrad)', stroke: 'none' }));

            // 折线图
            var linePath = '';
            for (var i = 0; i < historyData.length; i++) {
                if (i === 0) linePath = 'M ' + xScale(i) + ' ' + yScale(historyData[i].avg_price);
                else linePath += ' L ' + xScale(i) + ' ' + yScale(historyData[i].avg_price);
            }
            // 浅色线（底层，静态显示）
            lineG.appendChild(mk('path', { d: linePath, fill: 'none', stroke: '#ef5350', 'stroke-width': 2, 'stroke-opacity': 0.25 }));
            // 深色线（上层，初始不可见，等待动画揭幕）
            lineG.appendChild(mk('path', { d: linePath, fill: 'none', stroke: '#ef5350', 'stroke-width': 2, 'class': 'data-line deep-line-anim', 'stroke-dasharray': '10000', 'stroke-dashoffset': '10000' }));

            // 最新点标记
            var lastIdx = historyData.length - 1;
            lineG.appendChild(mk('circle', { cx: xScale(lastIdx), cy: yScale(historyData[lastIdx].avg_price), r: 4, fill: '#9c27b0', stroke: '#fff', 'stroke-width': 2 }));
            // ── Black crosshair lines ──────────────────────────────────
            var chG = svg.querySelector('#lepidoliteChartCrosshair');
            if (!chG) {
                chG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                chG.id = 'lepidoliteChartCrosshair';
                svg.appendChild(chG);
            }
            chG.innerHTML = '';
            var chVert = mk('line', { x1: 0, y1: PAD.top, x2: 0, y2: PAD.top + chartH, stroke: '#555', 'stroke-width': 1, 'stroke-dasharray': '3,2', 'pointer-events': 'none' });
            var chHorz = mk('line', { x1: PAD.left, y1: 0, x2: PAD.left + chartW, y2: 0, stroke: '#555', 'stroke-width': 1, 'stroke-dasharray': '3,2', 'pointer-events': 'none' });
            chG.appendChild(chVert);
            chG.appendChild(chHorz);

            function getIdxLep(e) {
                var rect = svg.getBoundingClientRect();
                var svgX = ((e.clientX - rect.left) / rect.width) * W;
                return Math.max(0, Math.min(historyData.length - 1, Math.round(((svgX - PAD.left) / chartW) * (historyData.length - 1))));
            }

            var hoverTip = null;
            svg.addEventListener('mousemove', function(e) {
                var idx = getIdxLep(e);
                var cx = xScale(idx), cy = yScale(historyData[idx].avg_price);
                // 更新黑色十字线
                var chG2 = svg.querySelector('#lepidoliteChartCrosshair');
                if (chG2) {
                    var lines = chG2.querySelectorAll('line');
                    if (lines.length >= 2) {
                        lines[0].setAttribute('x1', cx); lines[0].setAttribute('x2', cx);
                        lines[0].setAttribute('y1', PAD.top); lines[0].setAttribute('y2', PAD.top + chartH);
                        lines[1].setAttribute('x1', PAD.left); lines[1].setAttribute('x2', PAD.left + chartW);
                        lines[1].setAttribute('y1', cy); lines[1].setAttribute('y2', cy);
                    }
                }
                
                if (hoverTip === null) {
                    hoverTip = document.getElementById('lepidoliteChartHoverTip');
                }
                var container = svg.parentElement;
                if (!container) { console.error('[Lep Tooltip] Container not found'); return; }
                
                if (!hoverTip) {
                    hoverTip = document.createElement('div');
                    hoverTip.id = 'lepidoliteChartHoverTip';
                    hoverTip.className = 'chart-tooltip';
                    hoverTip.style.cssText = 'position:absolute;background:rgba(30,60,114,0.95);color:white;padding:6px 10px;border-radius:6px;font-size:12px;pointer-events:none;white-space:nowrap;display:none;z-index:9999;';
                    container.style.position = 'relative';
                    container.appendChild(hoverTip);
                    console.log('[Lep Tooltip] Created hoverTip element', hoverTip);
                }
                
                var d = historyData[idx];
                if (!d) { console.warn('[Lep Tooltip] No data at idx', idx); return; }
                var prevPrice = idx > 0 ? historyData[idx - 1].avg_price : d.avg_price;
                var chgPct = prevPrice > 0 ? ((d.avg_price - prevPrice) / prevPrice * 100) : 0;
                var chgColor = chgPct > 0 ? '#ef5350' : (chgPct < 0 ? '#66bb6a' : '#999');
                var chgSign = chgPct >= 0 ? '+' : '';
                var priceText = d.avg_price.toFixed(0) + ' 元/吨';
                var changeText = chgSign + chgPct.toFixed(2) + '%';
                
                hoverTip.innerHTML =
                    '<span style="color:#9bb5d4;font-size:11px">' + d.date + '</span><br>' +
                    '<span style="font-size:13px;font-weight:bold">' + priceText + '</span><br>' +
                    '<span style="color:' + chgColor + ';font-size:11px">' + changeText + '</span>';
                hoverTip.style.display = 'block';
                hoverTip.style.left = '10px';
                hoverTip.style.top = '10px';
                hoverTip.style.right = 'auto';
                console.log('[Lep Tooltip] Should be visible at 10x10', 'display=' + hoverTip.style.display, 'left=' + hoverTip.style.left);
            });          svg.addEventListener('mouseleave', function() {
                var ht = document.getElementById('lepidoliteChartHoverTip');
                if (ht) ht.style.display = 'none';
                var chG3 = svg.querySelector('#lepidoliteChartCrosshair');
                if (chG3) chG3.style.display = 'none';
            });
            svg.addEventListener('mouseenter', function() {
                var chG4 = svg.querySelector('#lepidoliteChartCrosshair');
                if (chG4) chG4.style.display = '';
            });
            // 显示SVG（防止旧内容闪屏）
            svg.style.setProperty('visibility', 'visible', 'important');
        }    
    // ========== 热点资讯横向轮播 ==========
    (function() {
        
        // Unsplash API 配置
        const UNSPLASH_ACCESS_KEY = 'HTe905tIiFT-g7D2MH77LYB9-0SE65IWCpwHIrq0aM0';
        const UNSPLASH_CACHE_KEY = 'unsplash_image_cache';
        const UNSPLASH_RATE_LIMIT = 50;
        
        function getUnsplashCache() {
            try {
                const cache = localStorage.getItem(UNSPLASH_CACHE_KEY);
                return cache ? JSON.parse(cache) : {};
            } catch (e) {
                return {};
            }
        }
        
        function saveUnsplashCache(cache) {
            try {
                localStorage.setItem(UNSPLASH_CACHE_KEY, JSON.stringify(cache));
            } catch (e) {
                console.warn('无法保存Unsplash缓存:', e);
            }
        }
        
        function getFallbackImageUrl(query) {
            // Lorem Picsum 备用图：无需 API Key，根据 query 生成固定图片（seed 保证同 query 同图）
            var seed = encodeURIComponent(query || 'news');
            return 'https://picsum.photos/seed/' + seed + '/800/400';
        }

        function generateSvgPlaceholder(title) {
            // SVG 本地占位符：中国网络环境下 Lorem Picsum 也失败时的最终 fallback
            var colors = ['#1a3a5c', '#2d5a27', '#5c1a1a', '#1a1a5c', '#5c4a1a', '#3a1a5c'];
            var hash = 0;
            var str = title || 'news';
            for (var i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash = hash & hash; }
            var color = colors[Math.abs(hash) % colors.length];
            var shortTitle = (title || '资讯').substring(0, 20);
            var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect fill="' + color + '" width="800" height="400"/><text x="400" y="200" font-family="Microsoft YaHei,Arial" font-size="28" fill="rgba(255,255,255,0.8)" text-anchor="middle">' + shortTitle.replace(/&/g,'&amp;').replace(/</g,'&lt;') + '</text></svg>';
            return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
        }

        async function fetchUnsplashImage(query, excludeUrls) {
            // excludeUrls: 已使用的图片URL列表，避免重复
            excludeUrls = excludeUrls || [];
            const cache = getUnsplashCache();
            // 缓存key包含excludeUrls信息，避免返回已用图片
            const cacheKey = query + '|' + excludeUrls.join(',');
            if (cache[cacheKey]) {
                console.log('[Unsplash] 缓存命中: ' + query);
                return cache[cacheKey];
            }
            const requestCount = parseInt(localStorage.getItem('unsplash_request_count') || '0');
            const lastReset = parseInt(localStorage.getItem('unsplash_last_reset') || '0');
            const now = Date.now();
            if (now - lastReset > 3600000) {
                localStorage.setItem('unsplash_request_count', '0');
                localStorage.setItem('unsplash_last_reset', now.toString());
            } else if (requestCount >= UNSPLASH_RATE_LIMIT) {
                console.warn('[Unsplash] API达到速率限制，切换Lorem Picsum备用图');
                return getFallbackImageUrl(query);
            }
            try {
                // 优化：增加per_page到20，随机页面范围扩大到15页，增加多样性
                const randomSeed = Math.floor(Math.random() * 1000);
                const randomPage = randomSeed % 15 + 1;  // 扩大随机页面范围1-15
                const url = 'https://api.unsplash.com/search/photos?query=' + encodeURIComponent(query) + '&client_id=' + UNSPLASH_ACCESS_KEY + '&per_page=20&orientation=landscape&order_by=popularity&page=' + randomPage;
                const response = await fetch(url);
                if (!response.ok) throw new Error('HTTP ' + response.status);
                const data = await response.json();
                localStorage.setItem('unsplash_request_count', (requestCount + 1).toString());
                
                // 获取历史展示过的图片（全局去重）
                var historyUrls = [];
                try {
                    historyUrls = JSON.parse(localStorage.getItem('unsplash_history_urls') || '[]');
                } catch(e) { historyUrls = []; }
                const allUsedUrls = excludeUrls.concat(historyUrls);
                
                if (data.results && data.results.length > 0) {
                    // 优化：随机抽取 + 全局去重
                    var availableUrls = [];
                    for (var i = 0; i < data.results.length; i++) {
                        var candidateUrl = data.results[i].urls.regular;
                        if (allUsedUrls.indexOf(candidateUrl) === -1) {
                            availableUrls.push(candidateUrl);
                        }
                    }
                    
                    // 随机选择一张可用图片
                    var chosenUrl = null;
                    if (availableUrls.length > 0) {
                        var randomIndex = Math.floor(Math.random() * availableUrls.length);
                        chosenUrl = availableUrls[randomIndex];
                    } else {
                        // 如果所有图都重复，从当前结果中随机选（不考虑历史）
                        var randomIndex = Math.floor(Math.random() * data.results.length);
                        chosenUrl = data.results[randomIndex].urls.regular;
                    }
                    
                    // 保存到历史记录（最多存50张）
                    historyUrls.unshift(chosenUrl);
                    if (historyUrls.length > 50) historyUrls = historyUrls.slice(0, 50);
                    localStorage.setItem('unsplash_history_urls', JSON.stringify(historyUrls));
                    
                    cache[cacheKey] = chosenUrl;
                    saveUnsplashCache(cache);
                    console.log('[Unsplash] API成功: ' + query + ' -> ' + chosenUrl + ' (随机抽取)');
                    return chosenUrl;
                } else {
                    console.warn('[Unsplash] 未找到图片，切换Lorem Picsum备用图: ' + query);
                    return getFallbackImageUrl(query);
                }
            } catch (e) {
                console.error('[Unsplash] API错误，切换Lorem Picsum备用图:', e);
                return getFallbackImageUrl(query);
            }
        }
        
        function extractKeywords(title) {
            // 中文关键词→英文搜索词映射（Unsplash对英文搜索更友好）- 增加多变体
            const topicMap = [
                { cn: ['原油', '石油', '油价', 'WTI', '布伦特', '油气', '炼油'], en: ['oil refinery', 'oil gas', 'petroleum', 'fuel'] },
                { cn: ['尿素', '化肥', '氮肥', '农业'], en: ['fertilizer agriculture', 'farm', 'crops field', 'agritech'] },
                { cn: ['煤矿', '煤炭', '矿工', '矿井'], en: ['coal mine', 'mining', 'quarry', 'underground mine'] },
                { cn: ['锂', '锂电', '锂电池', '磷酸铁锂', 'LFP', '碳酸锂'], en: ['lithium battery', 'ev battery', 'energy storage', 'battery factory'] },
                { cn: ['新能源', '电动', '电动车', 'EV', '特斯拉'], en: ['electric vehicle', 'tesla car', 'ev charging', 'electric bus'] },
                { cn: ['化工', '化学', '化学品', '材料'], en: ['chemical plant', 'factory industrial', 'manufacturing', 'warehouse'] },
                { cn: ['汽车', '车企', '整车', '丰田', '大众', '宝马'], en: ['car factory', 'automotive', 'assembly line', 'car dealership'] },
                { cn: ['经济', '市场', '金融', '股市', '股价', '财报'], en: ['business news', 'stock market', 'office meeting', 'corporate'] },
                { cn: ['政策', '法规', '监管', '发改委', '工信部'], en: ['government policy', 'building congress', 'city hall', 'regulation'] },
                { cn: ['技术', '创新', '研发', '专利'], en: ['technology innovation', 'lab research', 'robotics', 'chip technology'] },
                { cn: ['环境', '环保', '碳排放', '绿色'], en: ['environment green', 'solar panels', 'wind turbine', 'nature landscape'] },
                { cn: ['储能', '太阳能', '光伏', '风电'], en: ['energy storage', 'solar farm', 'wind power', 'renewable energy'] },
                { cn: ['电解液', '六氟', '溶剂'], en: ['chemical laboratory', 'science', 'liquid chemical', 'experiment'] },
                { cn: ['事故', '爆炸', '安全'], en: ['industrial accident', 'safety vest', 'construction', 'warning'] },
                { cn: ['出口', '进口', '贸易'], en: ['international trade', 'shipping', 'container port', 'cargo'] },
                { cn: ['公司', '企业', '集团'], en: ['company office', 'business tower', 'corporate building', 'startup'] },
            ];
            const lowerTitle = title.toLowerCase();
            for (var i = 0; i < topicMap.length; i++) {
                var topic = topicMap[i];
                for (var j = 0; j < topic.cn.length; j++) {
                    if (lowerTitle.indexOf(topic.cn[j].toLowerCase()) !== -1) {
                        // 从多个变体中随机选择一个
                        var options = topic.en;
                        var randomTopic = options[Math.floor(Math.random() * options.length)];
                        return randomTopic;
                    }
                }
            }
            // 未匹配到任何主题，使用通用词（也从变体中随机选）
            var defaultTopics = ['business news', 'corporate', 'modern technology', 'industry'];
            return defaultTopics[Math.floor(Math.random() * defaultTopics.length)];
        }
        
        var currentNewsSlide = 0;
        var totalNewsSlides = 6;
        var newsCarousel = document.getElementById('newsCarousel');
        var newsDotsContainer = document.getElementById('newsDots');
        var newsAutoPlay = null;

        function initNewsCarousel() {
            if (!newsDotsContainer) return;
            newsDotsContainer.innerHTML = '';
            for (var i = 0; i < totalNewsSlides; i++) {
                var dot = document.createElement('div');
                dot.className = 'news-dot' + (i === 0 ? ' active' : '');
                dot.onclick = (function(idx) {
                    return function() { goToNewsSlide(idx); };
                })(i);
                newsDotsContainer.appendChild(dot);
            }
        }

        function updateNewsCarousel() {
            if (!newsCarousel) return;
            newsCarousel.style.transform = 'translateX(-' + (currentNewsSlide * 100) + '%)';
            if (newsDotsContainer) {
                var dots = newsDotsContainer.querySelectorAll('.news-dot');
                for (var i = 0; i < dots.length; i++) {
                    dots[i].classList.toggle('active', i === currentNewsSlide);
                }
            }
        }

        window.moveNewsCarousel = function(dir) {
            currentNewsSlide = (currentNewsSlide + dir + totalNewsSlides) % totalNewsSlides;
            updateNewsCarousel();
        };

        function goToNewsSlide(index) {
            currentNewsSlide = index;
            updateNewsCarousel();
        }

        // 自动轮播（5秒）
        function startNewsAutoPlay() {
            newsAutoPlay = setInterval(function() {
                moveNewsCarousel(1);
            }, 5000);
        }

        // 鼠标悬停暂停自动轮播
        var heroLeft = document.querySelector('.hero-left');
        if (heroLeft) {
            heroLeft.addEventListener('mouseenter', function() {
                if (newsAutoPlay) clearInterval(newsAutoPlay);
            });
            heroLeft.addEventListener('mouseleave', function() {
                startNewsAutoPlay();
            });
        }

        // 初始化：加载真实热点资讯
        loadHotNews();
        
        function loadHotNews() {
            // 从hot_news_data.json加载热点新闻数据
            fetch('hot_news_data.json?t=' + Date.now()).then(function(r) {
                return r.json();
            }).then(async function(data) {
                if (!data || !data.news || !data.news.length) {
                    throw new Error('热点新闻数据格式错误');
                }
                var items = data.news.slice(0, 5);
                if (items.length === 0) items = [{ bu: "系统", title: "暂无今日关注数据，请先生成早报" }];
                
                newsCarousel.innerHTML = '';
                items.forEach(function(item, i) {
                    var tag = item.url ? 'a' : 'div';
                    var slide = document.createElement(tag);
                    if (item.url) {
                        slide.href = item.url;
                        slide.target = '_blank';
                        slide.rel = 'noopener noreferrer';
                    }
                    slide.className = 'news-slide';
                    slide.innerHTML = '<div class="news-slide-bg"></div><div class="news-overlay"><div class="news-overlay-title">' + item.title + '</div></div>';
                    newsCarousel.appendChild(slide);
                });
                
                // 加载热点资讯图片（优先使用JSON中预绑定的image_url，否则fallback到API调用）
                var usedImageUrls = [];  // 已使用的图片URL，避免重复
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var slide = newsCarousel.children[i];
                    
                    // 优先使用JSON预绑定的图片URL
                    if (item.image_url) {
                        console.log('[热点资讯] 使用预绑定图片: ' + item.title.substring(0, 20) + '...');
                        if (slide) {
                            var bg = slide.querySelector('.news-slide-bg');
                            if (bg) {
                                bg.style.backgroundImage = 'url(' + item.image_url + ')';
                                bg.style.backgroundSize = 'cover';
                                bg.style.backgroundPosition = 'center';
                                // 检查图片是否可加载
                                (function(bgEl, url, title) {
                                    var img = new Image();
                                    img.onerror = function() {
                                        console.warn('[热点资讯] 预绑定图片加载失败，切换API调用: ' + url);
                                        // 异步调用Unsplash API作为fallback
                                        fetchUnsplashImage(extractKeywords(title), usedImageUrls).then(function(apiUrl) {
                                            if (apiUrl) {
                                                usedImageUrls.push(apiUrl);
                                                bgEl.style.backgroundImage = 'url(' + apiUrl + ')';
                                            }
                                        });
                                    };
                                    img.src = url;
                                })(bg, item.image_url, item.title);
                            }
                        }
                        continue;  // 跳过API调用
                    }
                    
                    // Fallback：JSON中没有image_url时，调用Unsplash API获取
                    try {
                        const searchQuery = extractKeywords(item.title);
                        const imageUrl = await fetchUnsplashImage(searchQuery, usedImageUrls);
                        console.log('[热点资讯] API调用获取图片: ' + item.title.substring(0, 20) + '...');
                        if (imageUrl) {
                            usedImageUrls.push(imageUrl);  // 记录已用URL，后续排除
                            if (slide) {
                                const bg = slide.querySelector('.news-slide-bg');
                                if (bg) {
                                    bg.style.backgroundImage = 'url(' + imageUrl + ')';
                                    bg.style.backgroundSize = 'cover';
                                    bg.style.backgroundPosition = 'center';
                                    // 加载失败检测：Lorem Picsum 也失败时换成 SVG 本地占位符
                                    (function(bgEl, url, title) {
                                        var img = new Image();
                                        img.onerror = function() {
                                            console.warn('[热点资讯] 图片加载失败，切换SVG占位符: ' + url);
                                            bgEl.style.backgroundImage = 'url(' + generateSvgPlaceholder(title || '资讯') + ')';
                                        };
                                        img.src = url;
                                    })(bg, imageUrl, item.title || searchQuery);
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('[热点资讯] Unsplash图片加载失败:', e);
                    }
                }
                
                totalNewsSlides = items.length;
                currentNewsSlide = 0;
                initNewsCarousel();
                if (newsAutoPlay) clearInterval(newsAutoPlay);
                startNewsAutoPlay();
            }).catch(function(e) {
                console.warn('[热点资讯] 加载失败，使用虚拟数据', e);
                // 降级：使用默认数据
                var defaultItems = [
                    { bu: "系统", title: "热点新闻加载失败，请检查hot_news_data.json" }
                ];
                newsCarousel.innerHTML = '';
                defaultItems.forEach(function(item, i) {
                    var slide = document.createElement('div');
                    slide.className = 'news-slide';
                    slide.innerHTML = '<div class="news-slide-bg"></div><div class="news-overlay"><div class="news-overlay-title">' + item.title + '</div></div>';
                    newsCarousel.appendChild(slide);
                });
                totalNewsSlides = defaultItems.length;
                currentNewsSlide = 0;
                initNewsCarousel();
                if (newsAutoPlay) clearInterval(newsAutoPlay);
                startNewsAutoPlay();
            });
        }
    })();



    // ========== 数据库看板 - 轮播 ==========
    (function() {
        var HERO_COLORS = {
            primary: '#0AA66A',
            secondary: '#21B981',
            accent: '#0AA66A',
            up: '#0AA66A',
            down: '#21B981',
            text: '#153329',
            grid: 'rgba(10,166,106,0.12)'
        };

        // 所有可用的数据库看板配置（已根据实际数据文件校准）
                                                                                                                                                                                                                                                                                                        var DASHBOARDS = [
        {
            id: 'ternary_ncm_split',
            tag: '三元材料·型号分布',
            title: '三元正极材料分型号产量占比',
            link: 'ternary_charts.html?v=20260630',
            dataFile: 'ternary_all_data.json',
            tableName: 'NCM-分型号产量',
            unit: '吨',
            scale: 1,
            insight: 'TOP1「NCM811」占45%（1.8万吨），NCM52328%。国家发改委、能源局6月25日联合印发，明确到2030年新型储能装机达到300GW，配套支持储能/锂电/光伏/钠电/钙钛矿/固态电池等关键技术与产业化落地。',
            division: 'czly',
            chartType: 'pie',
            isBar: false,
            pieMode: 'row_columns',
            pieExcludeColumns: ["月份"],
            pieDateKey: '',
            pieNameKey: '',
            pieValueKey: ''},
        {
            id: 'lsp_price',
            tag: '锂辉石·精矿价格',
            title: '锂辉石精矿价格走势',
            link: 'carbonate_charts.html?v=20260630',
            dataFile: 'carbonate_all_data.json',
            tableName: '锂辉石精矿-价格',
            unit: '美元/吨',
            scale: 1,
            insight: '最新2010.00美元/吨，环比下跌19.6%。',
            division: 'czly',
            valueKey: '均价（美元/吨）',
            timeKey: '日期',
            isBar: false},
        {
            id: 'electrolyte_price_lfp',
            tag: '电解液·LFP动力价格',
            title: '电解液（LFP动力型）价格走势',
            link: 'electrolyte_charts.html?v=20260630',
            dataFile: 'electrolyte_all_data.json',
            tableName: '电解液价格-磷酸铁锂动力型',
            unit: '万元/吨',
            scale: 1,
            insight: '电解液（LFP动力型）价格：2.95万元/吨，涨跌：周内持平。电解液行业累计锁单超400万吨，永太科技再获宁德VC三年9万吨长单叠加天赐/新宙邦一体化扩能，头部企业份额持续抬升；VC因个别企业出货受阻价格周内+14.3%创新高、FEC同步走强，添加剂细分赛道盈利弹性打开。',
            division: 'felt',
            valueKey: '均价',
            timeKey: '日期',
            isBar: false},
        {
            id: 'ternary_prod',
            tag: '三元正极·行业产量',
            title: '三元正极材料产量走势',
            link: 'ternary_charts.html?v=20260630',
            dataFile: 'ternary_all_data.json',
            tableName: 'NCM-行业整体产量',
            unit: '吨',
            scale: 1,
            insight: '新型能源体系"十五五"规划明确2030年新型储能装机300GW，叠加LFP装车占比突破81.5%与1-6月LFP产量+77%的高速增长，行业进入产能扩张+高端紧缺双轮驱动期，钠电储能/四代高压实/磷酸锰铁锂差异化产能成新增长极。',
            division: 'czly',
            valueKey: '产量（吨）',
            timeKey: '月份',
            isBar: true}
        ];
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        

        var chartInstances = [null, null, null, null];
        var currentChartIdx = 0;
        var chartAutoPlay = null;

        function getDailySeed() {
            var today = new Date();
            var dateStr = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
            var hash = 0;
            for (var i = 0; i < dateStr.length; i++) {
                hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
                hash |= 0;
            }
            return Math.abs(hash);
        }

        function selectDailyDashboard() {
            var seed = getDailySeed();
            var idx = seed % DASHBOARDS.length;
            return DASHBOARDS[idx];
        }

        // 格式化横轴时间标签：去除日期中的 "日" 和 "时:分:秒" 部分
        function formatXAxisLabel(raw) {
            var s = String(raw);
            // 处理 "2026-04-01 00:00:00" → "2026-04"
            if (s.length >= 10 && s[4] === '-' && s[7] === '-') {
                return s.slice(0, 7);  // 取 YYYY-MM
            }
            // 处理 "05-01 00:00:00" → "05-01" 或保留原样
            if (s.indexOf(' ') !== -1) {
                return s.split(' ')[0];  // 去掉时间部分
            }
            return s;
        }

        function mkLineOpt(data, color, showAxis, unit) {
            var xData = data.map(function(d) { return formatXAxisLabel(d[0]); });
            var yData = data.map(function(d) { return d[1]; });
            var totalPoints = xData.length;
            var interval = totalPoints <= 6 ? 0 : Math.max(1, Math.floor(totalPoints / 4));
            return {
                backgroundColor: 'transparent',
                grid: { top: 16, right: 16, bottom: showAxis ? 32 : 12, left: 48, containLabel: false },
                xAxis: {
                    type: 'category',
                    show: showAxis,
                    data: xData,
                    axisLine: { lineStyle: { color: 'rgba(61,41,20,0.15)', width: 1 } },
                    axisTick: { show: false },
                    axisLabel: { show: showAxis, color: '#8C7B6B', fontSize: 10, interval: 0, rotate: totalPoints > 8 ? 30 : 0 },
                    splitLine: { show: false }
                },
                yAxis: {
                    type: 'value',
                    show: true,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: '#8C7B6B', fontSize: 10, formatter: function(v) { return v >= 10000 ? (v/10000).toFixed(1)+'万' : v.toFixed(1); } },
                    splitLine: { lineStyle: { color: 'rgba(61,41,20,0.08)', type: 'dashed' } },
                    min: function(v) { return v.min * 0.95; }
                },
                series: [{
                    type: 'line',
                    data: yData,
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 5,
                    lineStyle: { color: color, width: 2.5 },
                    itemStyle: { color: color, borderWidth: 2, borderColor: '#fff' },
                    areaStyle: {
                        color: {
                            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: color + '25' },
                                { offset: 1, color: color + '02' }
                            ]
                        }
                    }
                }],
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(248,255,251,0.96)',
                    borderColor: 'rgba(7,82,54,0.2)',
                    borderWidth: 1,
                    textStyle: { color: '#3D2914', fontSize: 12 },
                    formatter: function(params) {
                        var p = params[0];
                        return '<div style="font-weight:600">' + p.name + '</div>' +
                               '<div style="color:' + color + '">● ' + p.value.toFixed(2) + '</div>';
                    }
                },
                animation: true,
                animationDuration: 800
            };
        }

        // 通用数据洞察生成函数
        function generateInsight(db, data) {
            // ===== 优先使用后端生成的洞察（含早报内容）=====
            // 后端在 rotate_homepage_charts.py 中已生成含早报内容的 insight
            // 若 db.insight 有效（不含"不足"/"暂不可用"），直接返回
            // 修复：先确保 insight 是字符串类型
            var insightStr = db.insight ? String(db.insight) : '';
            if (insightStr.trim() &&
                insightStr.indexOf('不足') < 0 &&
                insightStr.indexOf('暂不可用') < 0 &&
                insightStr.indexOf('数据加载中') < 0) {
                return insightStr;
            }

            if (!data || !data.length) return '数据不足，无法生成分析。';
            
            // ===== 饼图专用洞察（分类/份额数据）=====
            if (db.chartType === 'pie' && data.length > 0) {
                var sorted = data.slice().sort(function(a, b) { return (b.value || 0) - (a.value || 0); });
                var total = sorted.reduce(function(s, item) { return s + (item.value || 0); }, 0);
                var t1 = sorted[0];
                var p1 = total > 0 ? ((t1.value / total * 100)).toFixed(0) : '?';
                var fmtVal = function(v) {
                    return v >= 10000 ? (v / 10000).toFixed(1) + '万' : v.toFixed(1);
                };
                var text = 'TOP1「' + t1.name + '」占' + p1 + '%（' + fmtVal(t1.value) + ')';
                if (sorted.length >= 2 && db.unit) {
                    var t2 = sorted[1];
                    var p2 = total > 0 ? ((t2.value / total * 100)).toFixed(0) : '?';
                    text += db.unit + '，' + t2.name + p2 + '%';
                }
                text += '。';
                // 如果后端已生成洞察，优先使用
                // 修复：先转换为字符串
                var insightStr2 = db.insight ? String(db.insight) : '';
                if (insightStr2 && insightStr2.indexOf('不足') < 0) {
                    return insightStr2;
                }
                return text;
            }
            
            if (data.length < 2) return '数据不足，无法生成分析。';
            
            // 1. 计算基础数据
            var latest = data[data.length - 1][1];
            var prev = data.length > 1 ? data[data.length - 2][1] : latest;
            var change = prev !== 0 ? ((latest - prev) / prev * 100) : 0;
            var trend = change >= 0 ? '上涨' : '下跌';
            var absChange = Math.abs(change).toFixed(1);
            
            // 2. 计算近期趋势（近3期 vs 前3期）
            var recent3 = data.length >= 3 ? 
                (data[data.length - 1][1] + data[data.length - 2][1] + data[data.length - 3][1]) / 3 : latest;
            var prev3 = data.length >= 6 ? 
                (data[data.length - 4][1] + data[data.length - 5][1] + data[data.length - 6][1]) / 3 : recent3;
            var trend3 = recent3 >= prev3 ? 'up' : 'down';
            
            // 3. 计算同比（去年同期）
            var samePeriodLastYear = data.length > 12 ? data[data.length - 13][1] : null;
            var yoyChange = samePeriodLastYear && samePeriodLastYear !== 0 ? 
                ((latest - samePeriodLastYear) / samePeriodLastYear * 100) : null;
            
            // 4. 调用看板专属模板生成文字
            if (db.insightTemplate && typeof db.insightTemplate === 'function') {
                return db.insightTemplate({
                    latest: latest,
                    prev: prev,
                    change: change,
                    trend: trend,
                    absChange: absChange,
                    trend3: trend3,
                    recent3: recent3,
                    prev3: prev3,
                    samePeriodLastYear: samePeriodLastYear,
                    yoyChange: yoyChange,
                    data: data
                });
            }
            
            // 5. 如果没有模板，返回默认文案（空值保护）
            if (latest === undefined || latest === null) {
                return db.title + '数据暂不可用';
            }
            return db.title + '最新值' + latest.toFixed(2) + db.unit + '，环比' + trend + absChange + '%。';
        }

        function mkBarOpt(data, color, showAxis, unit) {
            var xData = data.map(function(d) { return formatXAxisLabel(d[0]); });
            var yData = data.map(function(d) { return d[1]; });
            var totalPoints = xData.length;
            var interval = totalPoints <= 6 ? 0 : Math.max(1, Math.floor(totalPoints / 4));
            return {
                backgroundColor: 'transparent',
                grid: { top: 16, right: 16, bottom: showAxis ? 32 : 12, left: 48, containLabel: false },
                xAxis: {
                    type: 'category',
                    show: showAxis,
                    data: xData,
                    axisLine: { lineStyle: { color: 'rgba(61,41,20,0.15)', width: 1 } },
                    axisTick: { show: false },
                    axisLabel: { show: showAxis, color: '#8C7B6B', fontSize: 10, interval: 0, rotate: totalPoints > 8 ? 30 : 0 },
                    splitLine: { show: false }
                },
                yAxis: {
                    type: 'value',
                    show: true,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: '#8C7B6B', fontSize: 10, formatter: function(v) { return v >= 10000 ? (v/10000).toFixed(1)+'万' : v.toFixed(1); } },
                    splitLine: { lineStyle: { color: 'rgba(61,41,20,0.08)', type: 'dashed' } },
                    min: 0
                },
                series: [{
                    type: 'bar',
                    data: yData,
                    barMaxWidth: 22,
                    barGap: '20%',
                    itemStyle: {
                        color: color,
                        borderRadius: [3, 3, 0, 0],
                        opacity: 0.85
                    },
                    emphasis: {
                        itemStyle: { opacity: 1 }
                    }
                }],
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(248,255,251,0.96)',
                    borderColor: 'rgba(7,82,54,0.2)',
                    borderWidth: 1,
                    textStyle: { color: '#3D2914', fontSize: 12 },
                    formatter: function(params) {
                        var p = params[0];
                        return '<div style="font-weight:600">' + p.name + '</div>' +
                               '<div style="color:' + color + '">● ' + p.value.toFixed(2) + '</div>';
                    }
                },
                animation: true,
                animationDuration: 800
            };
        }

        // 饼图配置：环形饼图，用于分类/份额数据
        // data 格式: [{name: '类别', value: 数值}, ...]
        function mkPieOpt(data, color) {
            var total = data.reduce(function(s, d) { return s + (d.value || 0); }, 0);
            // 饼图配色：使用与 accent 同色系的渐变色组
            var pieColors = [
                color,           // 主色
                color + 'CC',    // 稍浅
                color + '99',
                color + '77',
                color + '55',
                '#5B9BD5',      // 蓝色补充
                '#ED7D31',      // 橙色补充
                '#70AD47',      // 绿色补充
                '#FFC000',      // 黄色
                '#A5A5A5'       // 灰色
            ];
            return {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(248,255,251,0.96)',
                    borderColor: 'rgba(7,82,54,0.2)',
                    borderWidth: 1,
                    textStyle: { color: '#3D2914', fontSize: 12 },
                    formatter: function(params) {
                        var pct = total > 0 ? ((params.value / total) * 100).toFixed(1) : 0;
                        return '<div style="font-weight:600">' + params.name + '</div>' +
                               '<div style="color:' + params.color + '">● ' + params.value.toLocaleString() + ' (' + pct + '%)</div>';
                    }
                },
                legend: {
                    type: 'scroll',
                    orient: 'vertical',
                    right: 10,
                    top: 'center',
                    itemWidth: 10,
                    itemHeight: 10,
                    itemGap: 8,
                    textStyle: { color: '#8C7B6B', fontSize: 11 },
                    formatter: function(name) {
                        // 找到对应值，显示名称+百分比
                        var item = data.find(function(d) { return d.name === name; });
                        if (item && total > 0) {
                            var pct = ((item.value / total) * 100).toFixed(1);
                            return name + '  ' + pct + '%';
                        }
                        return name;
                    }
                },
                series: [{
                    type: 'pie',
                    radius: ['40%', '68%'],
                    center: ['38%', '50%'],
                    avoidLabelOverlap: true,
                    itemStyle: {
                        borderRadius: 4,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: { show: false },
                    emphasis: {
                        label: { show: true, fontSize: 13, fontWeight: 'bold' }
                    },
                    data: data.map(function(d, i) {
                        return {
                            name: d.name,
                            value: d.value,
                            itemStyle: { color: pieColors[i % pieColors.length] }
                        };
                    })
                }],
                animation: true,
                animationDuration: 800
            };
        }

        function fmtNum(v, unit) {
            if (v === null || v === undefined || isNaN(v)) return '--';
            return v.toFixed(2) + (unit || '');
        }

        function calcChange(data) {
            if (!data || data.length < 2) return null;
            var last = data[data.length - 1][1];
            var prev = data[data.length - 2][1];
            if (!last || !prev || last === 0 || prev === 0) return null;
            return ((last - prev) / prev * 100);
        }

        function renderChartSlide(data) {
            var el = document.getElementById('chartItem0');
            if (!el) return;
            if (!chartInstances[0]) {
                chartInstances[0] = echarts.init(el);
                window.addEventListener('resize', function() {
                    if (chartInstances[0]) chartInstances[0].resize();
                });
            }
            var db = DASHBOARDS[currentChartIdx];
            var opt;
            if (db.chartType === 'pie') {
                opt = mkPieOpt(data, HERO_COLORS.accent);
            } else if (db.isBar) {
                opt = mkBarOpt(data, HERO_COLORS.accent, true, db.unit);
            } else {
                opt = mkLineOpt(data, HERO_COLORS.accent, true, db.unit);
            }
            chartInstances[0].setOption(opt, true);
            setTimeout(function() { chartInstances[0].resize(); }, 50);
        }

        function updateChartInfo(data, errorMsg) {
            var db = DASHBOARDS[currentChartIdx];
            if (!db) return;

            var titleEl = document.getElementById('chartTitle0');
            var linkEl = document.getElementById('chartLink0');
            var summaryEl = document.getElementById('chartSummaryText');
            var dateEl = document.getElementById('chartDate');

            if (titleEl) titleEl.textContent = db.title;
            if (linkEl) linkEl.href = db.link;

            if (errorMsg) {
                if (summaryEl) summaryEl.textContent = errorMsg;
                if (dateEl) dateEl.textContent = '数据暂不可用';
                return;
            }

            if (summaryEl && data && data.length > 0) {
                summaryEl.textContent = generateInsight(db, data);
            } else if (summaryEl) {
                summaryEl.textContent = '暂无数据，请检查数据源配置。';
            }

            if (dateEl) {
                var today = new Date();
                dateEl.textContent = (today.getMonth() + 1) + '月' + today.getDate() + '日';
            }
        }

        // 智能查找数值字段（当指定字段不存在时）
        function findNumericField(row, preferredKey) {
            if (preferredKey && row.hasOwnProperty(preferredKey)) {
                var v = parseFloat(String(row[preferredKey]).replace(/,/g, ''));
                if (!isNaN(v) && v > 0) return v;
            }
            // 尝试常见价格/产量字段
            var candidates = ['均价', '产量', '现货价', '价格', '出口量', '产能利用率', '最低价', '最高价'];
            for (var i = 0; i < candidates.length; i++) {
                var key = candidates[i];
                if (row.hasOwnProperty(key)) {
                    var val = parseFloat(String(row[key]).replace(/,/g, ''));
                    if (!isNaN(val) && val > 0) return val;
                }
                // 尝试匹配包含候选词的字段
                for (var k in row) {
                    if (k.indexOf(key) !== -1) {
                        var v2 = parseFloat(String(row[k]).replace(/,/g, ''));
                        if (!isNaN(v2) && v2 > 0) return v2;
                    }
                }
            }
            // 最后尝试任意数值字段
            for (var k2 in row) {
                var v3 = parseFloat(String(row[k2]).replace(/,/g, ''));
                if (!isNaN(v3) && v3 > 0) return v3;
            }
            return 0;
        }

        function loadChartData(idx) {
            var db = DASHBOARDS[idx];

            fetch(db.dataFile + '?t=' + Date.now())
                .then(function(r) {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.json();
                })
                .then(function(d) {
                    if (!d.tables || !Array.isArray(d.tables)) {
                        throw new Error('数据格式错误：缺少tables数组');
                    }
                    var table = d.tables.find(function(t) {
                        return t.table_name === db.tableName;
                    });
                    if (!table) {
                        throw new Error('未找到表：' + db.tableName);
                    }
                    var rows = table.data || [];
                    if (rows.length === 0) {
                        throw new Error('表数据为空');
                    }

                    // ===== 饼图数据解析（分类/份额数据）=====
                    if (db.chartType === 'pie') {
                        var pieData;
                        // 模式1: row_columns — 取最新一行，非日期列作为分类
                        if (db.pieMode === 'row_columns') {
                            var lastRow = rows[rows.length - 1];
                            var excludeKeys = {};
                            ['日期','月份','时间','date','_record_id','父记录','字段'].forEach(function(k) { excludeKeys[k] = 1; });
                            (db.pieExcludeColumns || []).forEach(function(k) { excludeKeys[k] = 1; });
                            pieData = [];
                            for (var ck in lastRow) {
                                if (!excludeKeys[ck]) {
                                    var cv = parseFloat(String(lastRow[ck]).replace(/,/g, ''));
                                    if (!isNaN(cv) && cv > 0) {
                                        pieData.push({ name: ck, value: Math.round(cv * 100) / 100 });
                                    }
                                }
                            }
                        }
                        // 模式2: filtered_rows — 按日期过滤，提取nameKey+valueKey
                        else if (db.pieMode === 'filtered_rows') {
                            var dateCol = db.pieDateKey || '日期';
                            var nameCol = db.pieNameKey || 'name';
                            var valCol = db.pieValueKey || 'value';
                            // 找到最新日期
                            var latestDate = '';
                            rows.forEach(function(r) { var rd = String(r[dateCol] || ''); if (rd > latestDate) latestDate = rd; });
                            // 过滤该日期的行
                            var filterFn = db.pieFilter || function() { return true; };
                            pieData = rows.filter(function(r) {
                                return String(r[dateCol] || '') === latestDate && filterFn(r);
                            }).map(function(r) {
                                return { name: String(r[nameCol] || ''), value: parseFloat(String(r[valCol] || '0').replace(/,/g, '')) * (db.scale || 1) };
                            }).filter(function(d) { return d.name && d.value > 0; });
                        }
                        else {
                            throw new Error('未知饼图模式: ' + (db.pieMode || ''));
                        }

                        if (pieData.length === 0) {
                            throw new Error('饼图数据解析后无有效数据');
                        }
                        // 按值降序排列
                        pieData.sort(function(a, b) { return b.value - a.value; });
                        renderChartSlide(pieData);
                        updateChartInfo(pieData);
                        return;
                    }

                    // ===== 时间序列数据解析（折线图/柱状图）=====
                    var parsed = rows.map(function(r) {
                        var timeVal = String(r[db.timeKey] || r['日期'] || r['月份'] || '');
                        var numVal = findNumericField(r, db.valueKey);
                        // 统一时间格式
                        var label = timeVal;
                        if (label.length === 7 && label.indexOf('-') === 4) {
                            label = label.slice(5) + '月';
                        } else if (label.length === 10 && label.indexOf('-') === 4) {
                            label = label.slice(5, 7) + '/' + label.slice(8, 10);
                        } else if (label.length > 7) {
                            label = label.slice(5);
                        }
                        return { time: timeVal, label: label, value: numVal * db.scale };
                    }).filter(function(d) { return d.value > 0; });

                    // 按时间排序（从早到晚）
                    parsed.sort(function(a, b) {
                        return String(a.time).localeCompare(String(b.time));
                    });

                    // 取最近12条数据
                    var data = parsed.slice(-12).map(function(d) {
                        return [d.label, d.value];
                    });

                    if (data.length === 0) {
                        throw new Error('解析后无有效数据');
                    }

                    renderChartSlide(data);
                    updateChartInfo(data);
                })
                .catch(function(err) {
                    console.error('数据库看板数据加载失败:', err);
                    updateChartInfo(null, '数据加载失败：' + (err.message || '未知错误'));
                });
        }

        function moveChartCarousel(dir) {
            currentChartIdx = (currentChartIdx + dir + DASHBOARDS.length) % DASHBOARDS.length;
            loadChartData(currentChartIdx);
            updateChartDots();
            // 重置自动轮播计时器
            startChartAutoPlay();
        }

        function updateChartDots() {
            var dotsEl = document.getElementById('chartDots');
            if (!dotsEl) return;
            dotsEl.innerHTML = '';
            for (var i = 0; i < DASHBOARDS.length; i++) {
                var dot = document.createElement('span');
                dot.className = 'chart-dot' + (i === currentChartIdx ? ' active' : '');
                dot.onclick = (function(idx) {
                    return function() { moveChartCarousel(idx - currentChartIdx); };
                })(i);
                dotsEl.appendChild(dot);
            }
        }

        function init() {
            // 计算今日精选索引
            var seed = 0;
            try { seed = getDailySeed(); } catch(e) {}
            currentChartIdx = seed % DASHBOARDS.length;
            loadChartData(currentChartIdx);
            updateChartDots();
        }

        window.moveChartCarousel = moveChartCarousel;

        // 自动轮播（5秒，与左侧新闻一致）
        function startChartAutoPlay() {
            if (chartAutoPlay) clearInterval(chartAutoPlay);
            chartAutoPlay = setInterval(function() {
                moveChartCarousel(1);
            }, 5000);
        }

        // 鼠标悬停暂停自动轮播，离开恢复
        var heroRight = document.querySelector('.hero-right');
        if (heroRight) {
            heroRight.addEventListener('mouseenter', function() {
                if (chartAutoPlay) clearInterval(chartAutoPlay);
            });
            heroRight.addEventListener('mouseleave', function() {
                startChartAutoPlay();
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                init();
                startChartAutoPlay();
            });
        } else {
            init();
            startChartAutoPlay();
        }
    })();
    
    // ===== 有色金属 & 化工板块甘特图 =====
    var cumulativeDataMetals = null; // 有色金属累积涨跌幅数据（由初始化函数填充）
    async function renderSectorGantt(sectorKey, containerId, dataOrFile) {
        /**
         * 渲染板块甘特图（有色金属 / 化工）
         * sectorKey: 'metals' | 'chemical'
         * containerId: DOM容器ID
         * dataOrFile: JSON数据文件名(字符串) 或 数据对象(有色金属改造后传入对象)
         */
        try {
            let data;
            if (typeof dataOrFile === 'string') {
                const resp = await fetch(`reports/${dataOrFile}?t=${Date.now()}`);
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                data = await resp.json();
            } else {
                data = dataOrFile; // 直接是数据对象
            }
            
            if (!data || !data.products || data.products.length === 0) {
                console.log(`[甘特图-${sectorKey}] ⚠️ 无数据`);
                return;
            }
            
            const container = document.getElementById(containerId);
            if (!container) {
                console.log(`[甘特图-${sectorKey}] ⚠️ 未找到容器 #${containerId}`);
                return;
            }
            
            // 标题
            const titleMap = { metals: '有色板块2026年累计涨跌幅', chemical: '化工板块2026年累计涨跌幅' };
            const descMap = { metals: '2026年至今', chemical: '2026年至今' };
            
            // 找出最大涨跌幅
            let maxChangePct = 0;
            data.products.forEach(p => {
                if (Math.abs(p.change_pct) > maxChangePct) maxChangePct = Math.abs(p.change_pct);
            });
            
            // 按涨跌幅降序
            data.products.sort((a, b) => b.change_pct - a.change_pct);
            
            // 生成HTML
            let html = '<div class="cumulative-gantt">';
            html += `<div class="gantt-title">${titleMap[sectorKey]} <span style="font-size:12px;color:#999;font-weight:normal;">(${descMap[sectorKey]})</span></div>`;
            
            data.products.forEach(product => {
                const pct = product.change_pct;
                const absPct = Math.abs(pct);
                const width = maxChangePct > 0 ? (absPct / maxChangePct) * 80 : 0;
                const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'stable';
                const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
                const color = pct > 0 ? '#d32f2f' : pct < 0 ? '#388e3c' : '#999';
                
                const dateRange = product.start_date + ' ~ ' + product.end_date;
                
                html += `<div class="gantt-row" data-sector="${sectorKey}" data-product-name="${product.name}">`;
                html += `<span class="gantt-name">${product.name}</span>`;
                html += `<div class="gantt-bar-track">`;
                html += `<div class="gantt-bar ${direction}" data-target-width="${width}%" style="width:0;">`;
                html += `<span class="gantt-bar-label"><span class="gantt-arrow">${arrow}</span> ${pct > 0 ? '+' : ''}${pct.toFixed(2)}%</span>`;
                html += '</div></div>';
                html += `<span class="gantt-value" style="color:${color};font-size:10px;">${product.start_price.toLocaleString()} → ${product.end_price.toLocaleString()}<br><span style="color:#999;">(${dateRange})</span></span>`;
                html += '</div>';
            });
            
            html += '<div id="gantt-expand-area-' + sectorKey + '" style="display:none;margin-top:20px;"></div>';
            html += '</div>';
            
            // 数据来源
            html += `<div style="margin-top:10px;padding:8px;background:rgba(248,255,251,0.7);backdrop-filter:blur(8px);border:1px solid rgba(220,238,230,0.4);border-radius:4px;font-size:11px;color:#666;text-align:center;">📊 数据来源: ${data.meta.data_source || '未知'} | 更新时间: ${data.meta.update_time || '未知'}</div>`;
            
            container.innerHTML = html;
            
            // 触发动画
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    container.querySelectorAll('.gantt-bar').forEach(bar => {
                        const tw = bar.getAttribute('data-target-width');
                        if (tw) bar.style.width = tw;
                    });
                });
            });
            
            console.log(`[甘特图-${sectorKey}] ✅ 已渲染 ${data.products.length} 个产品`);
            
            // 绑定点击事件（手风琴）
            container.querySelectorAll('.gantt-row').forEach(row => {
                row.style.cursor = 'pointer';
                row.addEventListener('click', function() {
                    const productName = this.getAttribute('data-product-name');
                    console.log(`[甘特图-${sectorKey}] 点击:`, productName);
                    
                    // 手风琴：关闭同板块其他行（先折叠再移除）
                    container.querySelectorAll('.gantt-row.active').forEach(r => {
                        if (r !== this) {
                            r.classList.remove('active');
                            const area = document.getElementById('gantt-expand-area-' + sectorKey);
                            if (area) {
                                const card = area.querySelector('.mk-chart-card');
                                if (card && card._origParent) {
                                    card._origParent.appendChild(card);
                                    card.style.display = '';
                                    // 恢复原始样式
                                    card.style.width = '';
                                    card.style.maxWidth = '';
                                    card.style.margin = '';
                                    card.style.boxSizing = '';
                                    card._origParent = null;
                                }
                                area.style.display = 'none';
                                area.innerHTML = '';
                            }
                        }
                    });
                    
                    if (this.classList.contains('active')) {
                        // 已展开，收起
                        this.classList.remove('active');
                        const area = document.getElementById('gantt-expand-area-' + sectorKey);
                        if (area) {
                            const card = area.querySelector('.mk-chart-card');
                            if (card && card._origParent) {
                                card._origParent.appendChild(card);
                                card.style.display = '';
                                // 恢复原始样式
                                card.style.width = '';
                                card.style.maxWidth = '';
                                card.style.margin = '';
                                card.style.boxSizing = '';
                                card._origParent = null;
                            }
                            area.style.display = 'none';
                            area.innerHTML = '';
                        }
                        return;
                    }
                    
                    this.classList.add('active');
                    // 展开图表：把对应卡片移到展开区域
                    const area = document.getElementById('gantt-expand-area-' + sectorKey);
                    if (!area) return;
                    area.style.display = 'block';
                    
                    // 产品名 → SVG ID 映射
                    const svgMap = [
                        { keyword: '铂期货', svgId: 'ptFuturesChart' },
                        { keyword: '钯期货', svgId: 'pdFuturesChart' },
                        { keyword: '铁矿石', svgId: 'iFuturesChart' },
                        { keyword: '尿素期货', svgId: 'urFuturesChart' },
                        { keyword: 'WTI原油', svgId: 'wtiFuturesChart' },
                        { keyword: '乙二醇', svgId: 'egFuturesChart' },
                        { keyword: '磷矿石', svgId: 'phosphateChart' },
                    ];
                    
                    let targetSvgId = null;
                    for (const item of svgMap) {
                        if (productName.includes(item.keyword)) {
                            targetSvgId = item.svgId;
                            break;
                        }
                    }
                    
                    if (!targetSvgId) {
                        area.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">未找到 [' + productName + '] 对应的图表配置</div>';
                        return;
                    }
                    
                    const originalSvg = document.getElementById(targetSvgId);
                    if (!originalSvg) {
                        area.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">未找到SVG: ' + targetSvgId + '</div>';
                        return;
                    }
                    
                    const card = originalSvg.closest('.mk-chart-card');
                    if (!card) {
                        area.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">未找到图表卡片</div>';
                        return;
                    }
                    
                    // 保存原始父节点，然后移到展开区域
                    card._origParent = card.parentNode;
                    area.appendChild(card);
                    card.style.display = '';
                    
                    // 让卡片宽度适应展开区域
                    card.style.width = '100%';
                    card.style.maxWidth = '100%';
                    card.style.margin = '0';
                    card.style.boxSizing = 'border-box';
                    
                    // 找到卡片内的SVG，调整宽度
                    const svg = card.querySelector('svg');
                    if (svg) {
                        svg.style.width = '100%';
                        svg.style.height = 'auto';
                        svg.setAttribute('width', '100%');
                        svg.removeAttribute('height');
                    }
                    
                    // 触发布局更新（重绘图表）
                    setTimeout(() => {
                        const event = new Event('resize');
                        window.dispatchEvent(event);
                    }, 100);
                    
                    // 触发图表重新渲染
                    const renderMap = {
                        'iFuturesChart': 'renderIChart',
                        'phosphateChart': 'renderPhosphateChart',
                        'ptFuturesChart': 'renderPTChart',
                        'pdFuturesChart': 'renderPDChart',
                        'urFuturesChart': 'renderUrFuturesChart',
                        'wtiFuturesChart': 'renderWtiFuturesChart',
                        'egFuturesChart': 'renderEgFuturesChart',
                    };
                    const renderFnName = renderMap[targetSvgId];
                    if (renderFnName && typeof window[renderFnName] === 'function') {
                        setTimeout(() => {
                            try {
                                window[renderFnName]();
                                console.log('[renderSectorGantt] ✅ 已触发重新渲染:', renderFnName);
                            } catch(e) {
                                console.warn('[renderSectorGantt] ⚠️ 重新渲染失败:', renderFnName, e);
                            }
                        }, 500);
                    }
                    
                    // 滚动到展开区域，让图表完整可见
                    setTimeout(() => {
                        area.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 800);
                });
            });
            
        } catch (e) {
            console.error(`[甘特图-${sectorKey}] 渲染失败:`, e);
        }
    }
    
    // 隐藏有色金属和化工板块的图表网格（初始只显示甘特图）
    document.querySelectorAll('#panel-energy .mk-chart-grid').forEach(grid => { grid.style.display = 'none'; });
    document.querySelectorAll('#panel-chemical .mk-chart-grid').forEach(grid => { grid.style.display = 'none'; });
    
    // 初始化时调用
    renderSectorGantt('chemical', 'gantt-chart-container-chemical', 'market_cumulative_chemical.json');
    

/* ========= 天气动画（全屏背景式 v3）========== */
(function() {
    var cvs = document.getElementById('weather-canvas');
    if (!cvs) { console.log('[天气] 未找到canvas'); return; }
    var ctx = cvs.getContext('2d');
    var header = document.getElementById('tickerWrap');
    var W = 0, H = 0;
    var weatherType = 'cloudy';
    var particles = [];
    var animId = null;
    var frameCount = 0;
    var lightningTimer = 0;
    var lightningFlash = 0;
    var snowGround = {};
    var particlesInited = false;

    function resizeCanvas() {
        if (!header) return;
        var rect = header.getBoundingClientRect();
        W = Math.round(rect.width);
        H = Math.round(rect.height);
        if (cvs.width !== W) cvs.width = W;
        if (cvs.height !== H) cvs.height = H;
        snowGround = {};
    }

    function getWeatherType(code) {
        if (code === 0 || code === 1) return 'sunny';
        if (code === 2 || code === 3) return 'cloudy';
        if (code === 45 || code === 48) return 'fog';
        if ([51,53,55,61,63,65,80,81,82].includes(code)) return 'rain';
        if ([95,96,99].includes(code)) return 'thunderstorm';
        if ([71,73,75,77,85,86].includes(code)) return 'snow';
        return 'cloudy';
    }

    /* 根据天气类型动态调整行情条字体颜色 */
    function updateTickerTheme(type) {
        var wrap = document.getElementById('tickerWrap');
        if (!wrap) return;
        // 深色底（雨/雷暴）→ 白字；浅色底（晴/云/雪/雾）→ 深色字
        var isDark = (type === 'rain' || type === 'thunderstorm');
        if (isDark) {
            wrap.style.setProperty('--ticker-fg', '#ffffff');
            wrap.style.setProperty('--ticker-shadow', '0 1px 4px rgba(0,0,0,0.5)');
            wrap.style.setProperty('--ticker-up', '#ff6b6b');
            wrap.style.setProperty('--ticker-down', '#51cf66');
        } else {
            wrap.style.setProperty('--ticker-fg', '#1a1a2e');
            wrap.style.setProperty('--ticker-shadow', '0 1px 3px rgba(255,255,255,0.4)');
            wrap.style.setProperty('--ticker-up', '#e74c3c');
            wrap.style.setProperty('--ticker-down', '#27ae60');
        }
        console.log('[天气] 行情条主题切换 → ' + type + (isDark ? ' (白字)' : ' (深色字)'));
    }

    function fetchWeather() {
        console.log('[天气] fetchWeather() 触发，当前天气类型=' + weatherType);
        if (!navigator.geolocation) {
            console.log('[天气] 浏览器不支持geolocation，使用默认天气');
            if (!particlesInited) { initParticles(); particlesInited = true; }
            updateTickerTheme(weatherType);
            return;
        }
        navigator.geolocation.getCurrentPosition(function(pos) {
            console.log('[天气] 获取位置成功 lat=' + pos.coords.latitude + ' lon=' + pos.coords.longitude);
            fetch('https://api.open-meteo.com/v1/forecast?latitude=' + pos.coords.latitude + '&longitude=' + pos.coords.longitude + '&current=weather_code')
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    var oldType = weatherType;
                    weatherType = getWeatherType(data.current.weather_code);
                    console.log('[天气] API返回 weather_code=' + data.current.weather_code + ' → 天气类型=' + weatherType + ' (原类型=' + oldType + ')');
                    if (oldType !== weatherType) {
                        console.log('[天气] 天气类型变化，重新初始化粒子 old=' + oldType + ' new=' + weatherType);
                    } else if (!particlesInited) {
                        console.log('[天气] 首次初始化粒子，天气类型=' + weatherType);
                    }
                    if (oldType !== weatherType || !particlesInited) {
                        snowGround = {};
                        initParticles();
                        particlesInited = true;
                        updateTickerTheme(weatherType);
                    } else {
                        console.log('[天气] 天气类型未变化，保持当前动画');
                    }
                })
                .catch(function(e) {
                    console.log('[天气] API请求失败', e);
                    if (!particlesInited) { initParticles(); particlesInited = true; }
                    updateTickerTheme(weatherType);
                });
        }, function(err) {
            console.log('[天气] 获取位置失败 code=' + err.code + ' msg=' + err.message);
            if (!particlesInited) { initParticles(); particlesInited = true; }
            updateTickerTheme(weatherType);
        }, {timeout: 8000});
    }

    function initParticles() {
        console.log('[天气] initParticles() 开始，天气类型=' + weatherType + ' W=' + W + ' H=' + H);
        particles = [];
        frameCount = 0;
        lightningTimer = 0;
        lightningFlash = 0;
        if (weatherType === 'rain' || weatherType === 'thunderstorm') {
            var density = Math.max(30, Math.floor(W * H / 8000));
            for (var i = 0; i < density; i++) {
                particles.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    vy: 10 + Math.random() * 15,
                    vx: -1 - Math.random() * 1.5,
                    len: 15 + Math.random() * 20,
                    opacity: 0.3 + Math.random() * 0.4,
                    splash: false
                });
            }
        } else if (weatherType === 'sunny') {
            for (var i = 0; i < 18; i++) {
                particles.push({
                    side: Math.floor(Math.random() * 4),
                    pos: Math.random(),
                    targetAngle: Math.random() * Math.PI * 2,
                    speed: 0.003 + Math.random() * 0.004,
                    opacity: 0.08 + Math.random() * 0.15,
                    len: 30 + Math.random() * 60
                });
            }
            for (var i = 0; i < 25; i++) {
                particles.push({
                    isGlow: true,
                    x: Math.random() * W,
                    y: Math.random() * H,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.2,
                    r: 1 + Math.random() * 2,
                    opacity: 0.2 + Math.random() * 0.5
                });
            }
        } else if (weatherType === 'snow') {
            var sdensity = Math.max(20, Math.floor(W * H / 6000));
            for (var i = 0; i < sdensity; i++) {
                particles.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    vy: 0.5 + Math.random() * 1.5,
                    vxBase: (Math.random() - 0.5) * 0.8,
                    r: 2 + Math.random() * 3,
                    phase: Math.random() * Math.PI * 2,
                    opacity: 0.6 + Math.random() * 0.4
                });
            }
        } else if (weatherType === 'fog') {
            var fdensity = Math.max(5, Math.floor(W * H / 40000));
            for (var i = 0; i < fdensity; i++) {
                particles.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    vx: (Math.random() - 0.5) * 0.15,
                    vy: (Math.random() - 0.5) * 0.1,
                    r: 50 + Math.random() * 100,
                    opacity: 0.04 + Math.random() * 0.1
                });
            }
        } else {
            for (var i = 0; i < 5; i++) {
                particles.push({
                    x: (W / 5) * i + Math.random() * 60,
                    y: 15 + Math.random() * (H - 30),
                    vx: 0.15 + Math.random() * 0.25,
                    opacity: 0.5 + Math.random() * 0.3,
                    scale: 0.7 + Math.random() * 0.6
                });
            }
        }
    }

    function drawCloud(cx, cy, opacity, scale) {
        ctx.fillStyle = 'rgba(255,255,255,' + opacity + ')';
        ctx.beginPath();
        var circles = [
            {x:0, y:0, r:18*scale},
            {x:12*scale, y:-5*scale, r:14*scale},
            {x:-10*scale, y:-3*scale, r:13*scale},
            {x:6*scale, y:6*scale, r:12*scale},
            {x:-5*scale, y:7*scale, r:10*scale},
            {x:18*scale, y:3*scale, r:10*scale},
            {x:-15*scale, y:4*scale, r:9*scale}
        ];
        for (var i = 0; i < circles.length; i++) {
            ctx.moveTo(cx + circles[i].x + circles[i].r, cy + circles[i].y);
            ctx.arc(cx + circles[i].x, cy + circles[i].y, circles[i].r, 0, Math.PI * 2);
        }
        ctx.fill();
    }

    function draw() {
        frameCount++;
        if (W === 0 || H === 0) { animId = requestAnimationFrame(draw); return; }

        if (weatherType === 'sunny') {
            var sg = ctx.createLinearGradient(0, 0, 0, H);
            sg.addColorStop(0, '#4a90e2');
            sg.addColorStop(1, '#ffcc80');
            ctx.fillStyle = sg;
            ctx.fillRect(0, 0, W, H);
            var sunX = W * 0.5, sunY = H * 0.3, sunR = Math.min(W, H) * 0.22;
            var sunG = ctx.createRadialGradient(sunX, sunY, 2, sunX, sunY, sunR);
            sunG.addColorStop(0, 'rgba(255,255,200,0.95)');
            sunG.addColorStop(0.5, 'rgba(255,230,100,0.5)');
            sunG.addColorStop(1, 'rgba(255,200,50,0)');
            ctx.fillStyle = sunG;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
            ctx.fill();
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                if (p.isGlow) {
                    ctx.fillStyle = 'rgba(255,240,180,' + p.opacity + ')';
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fill();
                    p.x += p.vx; p.y += p.vy;
                    if (p.x < -5 || p.x > W+5 || p.y < -5 || p.y > H+5) { p.x = Math.random()*W; p.y = Math.random()*H; }
                } else {
                    var startX, startY;
                    if (p.side === 0) { startX = p.pos * W; startY = 0; }
                    else if (p.side === 1) { startX = W; startY = p.pos * H; }
                    else if (p.side === 2) { startX = p.pos * W; startY = H; }
                    else { startX = 0; startY = p.pos * H; }
                    var ex = sunX + Math.cos(p.targetAngle) * p.len;
                    var ey = sunY + Math.sin(p.targetAngle) * p.len;
                    ctx.strokeStyle = 'rgba(255,220,100,' + p.opacity + ')';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(ex, ey);
                    ctx.stroke();
                    p.targetAngle += p.speed;
                }
            }
        } else if (weatherType === 'cloudy') {
            var cg = ctx.createLinearGradient(0, 0, 0, H);
            cg.addColorStop(0, '#7a8b99');
            cg.addColorStop(1, '#cfd9e0');
            ctx.fillStyle = cg;
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = 'rgba(255,255,255,0.75)';
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                drawCloud(p.x, p.y, p.opacity, p.scale);
                p.x += p.vx;
                if (p.x > W + 60) { p.x = -80; p.y = 15 + Math.random() * (H - 30); }
            }
        } else if (weatherType === 'rain' || weatherType === 'thunderstorm') {
            var bgColor = weatherType === 'thunderstorm' ? '#0b0c10' : '#1c2833';
            var rg = ctx.createLinearGradient(0, 0, 0, H);
            rg.addColorStop(0, bgColor);
            rg.addColorStop(1, weatherType === 'thunderstorm' ? '#15171f' : '#2c3e50');
            ctx.fillStyle = rg;
            ctx.fillRect(0, 0, W, H);
            if (weatherType === 'thunderstorm') {
                lightningTimer++;
                if (lightningFlash > 0) {
                    ctx.fillStyle = 'rgba(255,255,255,' + (lightningFlash * 0.15) + ')';
                    ctx.fillRect(0, 0, W, H);
                    lightningFlash -= 0.05;
                    if (lightningFlash <= 0) lightningFlash = 0;
                }
                if (lightningTimer > 180 + Math.random() * 420) {
                    lightningFlash = 1.0;
                    lightningTimer = 0;
                }
                ctx.fillStyle = 'rgba(30,30,40,0.3)';
                var t = frameCount * 0.3;
                for (var L = 0; L < 3; L++) {
                    ctx.beginPath();
                    for (var x = 0; x <= W; x += 6) {
                        var y = H * 0.1 + L * H * 0.12 + Math.sin((x + t + L * 80) * 0.02) * 12;
                        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                    }
                    ctx.lineTo(W, H * 0.35 + L * 10);
                    ctx.lineTo(0, H * 0.35 + L * 10);
                    ctx.closePath();
                    ctx.fill();
                }
            }
            ctx.fillStyle = 'rgba(0,0,0,0.06)';
            ctx.fillRect(0, 0, W, H);
            ctx.strokeStyle = 'rgba(174,194,224,0.55)';
            ctx.lineWidth = 1.2;
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                if (p.splash) {
                    ctx.fillStyle = 'rgba(174,194,224,0.4)';
                    for (var s = 0; s < 3; s++) {
                        var sx = p.x + (Math.random()-0.5) * 6;
                        var sy = H - 2 + Math.random() * 3;
                        ctx.beginPath(); ctx.arc(sx, sy, 1, 0, Math.PI*2); ctx.fill();
                    }
                    p.splash = false;
                }
                ctx.strokeStyle = 'rgba(174,194,224,' + p.opacity + ')';
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.vx, p.y + p.len);
                ctx.stroke();
                p.y += p.vy;
                p.x += p.vx;
                if (p.y > H) {
                    p.y = -p.len - 5;
                    p.x = Math.random() * W;
                    if (Math.random() < 0.3) p.splash = true;
                }
            }
        } else if (weatherType === 'snow') {
            var sg2 = ctx.createLinearGradient(0, 0, 0, H);
            sg2.addColorStop(0, '#bdd4e7');
            sg2.addColorStop(1, '#e2e8f0');
            ctx.fillStyle = sg2;
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#ffffff';
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                var sway = Math.sin(frameCount * 0.02 + p.phase) * p.vxBase * 2;
                ctx.beginPath();
                ctx.arc(p.x + sway, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
                p.y += p.vy;
                p.x += sway * 0.3;
                if (p.y > H - 3) {
                    var gx = Math.round(p.x / 4) * 4;
                    if (!snowGround[gx]) snowGround[gx] = 0;
                    snowGround[gx] = Math.min(snowGround[gx] + 0.5, 8);
                    p.y = -5; p.x = Math.random() * W;
                }
            }
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            var keys = Object.keys(snowGround);
            for (var j = 0; j < keys.length; j++) {
                var kx = parseInt(keys[j]);
                ctx.beginPath();
                ctx.ellipse(kx, H, 3, snowGround[keys[j]], 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (weatherType === 'fog') {
            ctx.fillStyle = '#b0b5b9';
            ctx.fillRect(0, 0, W, H);
            for (var i = 0; i < particles.length; i++) {
                var p = particles[i];
                ctx.fillStyle = 'rgba(220,225,230,' + p.opacity + ')';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
                p.x += p.vx; p.y += p.vy;
                if (p.x < -p.r*2) p.x = W + p.r;
                if (p.x > W + p.r*2) p.x = -p.r;
                if (p.y < -p.r*2) p.y = H + p.r;
                if (p.y > H + p.r*2) p.y = -p.r;
            }
        }
        animId = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    fetchWeather();
    setInterval(fetchWeather, 30 * 60 * 1000);
    draw();
})();

