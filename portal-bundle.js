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
  parseDeptIds: parseDeptIds,
  BU_DEPT: BU_DEPT,
};

})();

      window.HTML_VERSION = "20260724_002"; // 版本号（2026-07-14早报更新）

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
              // 注册成功后，通知 SW 预取子页面（下次访问秒开）
              if (registration.active) {
                registration.active.postMessage({
                  type: 'PREFETCH_PAGES',
                  urls: [
                    './portal-bundle.js?v=' + window.HTML_VERSION,
                    './bu_gate.js',
                    './radar_hub.html',
                    './database_hub.html',
                    './dept-archive.html',
                    './reports/index.json'
                  ]
                });
              }
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
// 仅对门户页面（index_v3.html / index.html）生效
(function() {
    var pageName = location.pathname.split('/').pop() || '';
    if (pageName !== 'index_v3.html' && pageName !== 'index.html') return;
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


/* ============== inline_00.js ============== */

      window.HTML_VERSION = "20260724_001"; // 版本号（2026-07-24早报更新）

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
              // 注册成功后，通知 SW 预取子页面（下次访问秒开）
              if (registration.active) {
                registration.active.postMessage({
                  type: 'PREFETCH_PAGES',
                  urls: [
                    './portal-bundle.js?v=' + window.HTML_VERSION,
                    './bu_gate.js',
                    './radar_hub.html',
                    './database_hub.html',
                    './dept-archive.html',
                    './reports/index.json'
                  ]
                });
              }
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
    

/* ============== inline_01.js ============== */

// 异步加载报告数据（动态获取最新报告）
// 仅对门户页面（index_v3.html / index.html）生效
(function() {
    var pageName = location.pathname.split('/').pop() || '';
    if (pageName !== 'index_v3.html' && pageName !== 'index.html') return;
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


/* ============== inline_02.js ============== */

/* ===== AI 对话框 / 拖拽 JS ===== */
window.addEventListener('DOMContentLoaded', function() {
(function() {
    var wrap = document.getElementById('aiFloatWrap');
    if (!wrap) { console.error('AI button not found'); return; }

    /* ── 位置记忆 ── */
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem('aiBtnPos')); } catch(e) {}
    if (saved && saved.right !== undefined) {
        wrap.style.right  = '';
        wrap.style.bottom = '';
        wrap.style.left   = saved.left  + 'px';
        wrap.style.top    = saved.top   + 'px';
    }

    /* ── 拖拽 ── */
    var dragging = false, rx = 0, ry = 0, started = false;

    wrap.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        dragging   = true;
        started   = false;
        rx = e.clientX - wrap.offsetLeft;
        ry = e.clientY - wrap.offsetTop;
        wrap.classList.add('dragging');
        wrap.style.right  = '';
        wrap.style.bottom = '';
        e.preventDefault();
    });
    document.addEventListener('mousemove', function(e) {
        if (!dragging) return;
        if (!started) { started = true; }
        wrap.style.left = (e.clientX - rx) + 'px';
        wrap.style.top  = (e.clientY - ry) + 'px';
    });
    document.addEventListener('mouseup', function() {
        if (!dragging) return;
        dragging = false;
        wrap.classList.remove('dragging');
        try {
            localStorage.setItem('aiBtnPos', JSON.stringify({
                left: wrap.offsetLeft, top: wrap.offsetTop
            }));
        } catch(e) {}
    });

    /* ── 对话框 ── */
    var dialog = document.getElementById('aiChatDialog');
    var input  = document.getElementById('aiChatInput');
    var sendBtn= document.getElementById('aiChatSend');

    function openDialog() {
        dialog.classList.add('open');
        input.focus();
    }
    function closeDialog() {
        dialog.classList.remove('open');
    }
    wrap.addEventListener('click', function(e) {
        if (e.target.closest('.ai-sphere') && !dragging) openDialog();
    });
    document.getElementById('aiChatClose').addEventListener('click', closeDialog);
    dialog.addEventListener('click', function(e) {
        if (e.target === dialog) closeDialog();
    });

    /* ── 滚动到页面中部，选取选中文字或图表说明 ── */
    function getSelectedText() {
        var t = '';
        if (window.getSelection) t = window.getSelection().toString();
        else if (document.selection && document.selection.createRange) t = document.selection.createRange().text;
        return t.trim();
    }
    function getPageContext() {
        var sel = getSelectedText();
        if (sel) return '[用户选中了页面内容]\n' + sel;
        
        // 构建丰富的页面上下文
        var contextParts = [];
        
        // 1. 页面基本信息
        var title = document.title || '';
        var currentDate = document.getElementById('currentDate') ? document.getElementById('currentDate').textContent : '';
        contextParts.push('[页面] 标题: ' + title + ' | 日期: ' + currentDate);
        
        // 2. 早报数据（各事业部信息）
        if (typeof dynamicReportData !== 'undefined' && dynamicReportData) {
            var depts = Object.keys(dynamicReportData);
            contextParts.push('[早报] 加载日期: ' + (CURRENT_REPORT_DATE || '未知') + ' | 事业部数量: ' + depts.length);
            
            // 提取每个事业部的关键信息（限制长度避免token过多）
            depts.forEach(function(deptId) {
                var dept = dynamicReportData[deptId];
                if (!dept) return;
                
                var deptInfo = '[事业部: ' + (dept.title || deptId) + ']';
                if (dept.headline) deptInfo += ' 头条: ' + dept.headline.substring(0, 100);
                if (dept.lead) deptInfo += ' | 主导: ' + dept.lead.substring(0, 80);
                if (dept.risk) deptInfo += ' | 风险: ' + dept.risk.substring(0, 80);
                contextParts.push(deptInfo);
            });
        }
        
        // 3. 市场行情数据（从页面文本中提取关键信息）
        var marketSection = document.querySelector('.market-dashboard');
        if (marketSection) {
            var marketText = marketSection.innerText || marketSection.textContent || '';
            // 提取前500字符（包含价格等关键信息）
            contextParts.push('[市场行情] ' + marketText.substring(0, 500));
        }
        
        // 4. 页面导航信息
        var navItems = document.querySelectorAll('.main-nav-item');
        if (navItems.length > 0) {
            var navNames = Array.from(navItems).map(function(n) { 
                return n.textContent.trim().replace(/\\s+/g, ' '); 
            }).join(', ');
            contextParts.push('[导航] ' + navNames);
        }
        
        // 5. 当前URL
        contextParts.push('[URL] ' + window.location.href);
        
        return contextParts.join('\n');
    }

    /* ── 发送消息 ── */
    var botAvatar = document.getElementById('aiSphereImg')
                      ? document.getElementById('aiSphereImg').src : '';
    var userAvatar= '';

    function scrollBottom() {
        var m = document.getElementById('aiDialogMsgs');
        if (m) m.scrollTop = m.scrollHeight;
    }
    function addMsg(role, text, avatar) {
        var m = document.getElementById('aiDialogMsgs');
        var w = m.querySelector('.ai-msg-welcome');
        if (w) w.remove();
        var div = document.createElement('div');
        div.className = 'ai-msg ' + role;
        var av = avatar || botAvatar;
        div.innerHTML =
            '<img class="ai-msg-avatar" src="' + av + '" alt=""/>' +
            '<div class="ai-msg-bubble"></div>';
        div.querySelector('.ai-msg-bubble').textContent = text;
        m.appendChild(div);
        scrollBottom();
    }
    function showTyping() {
        var m = document.getElementById('aiDialogMsgs');
        var div = document.createElement('div');
        div.className = 'ai-msg ai-msg-typing';
        div.id = 'aiTypingMsg';
        div.innerHTML =
            '<img class="ai-msg-avatar" src="' + botAvatar + '" alt=""/>' +
            '<div class="ai-msg-bubble">正在思考...</div>';
        m.appendChild(div);
        scrollBottom();
    }
    function removeTyping() {
        var t = document.getElementById('aiTypingMsg');
        if (t) t.remove();
    }

    function buildPrompt(userText) {
        var context = getPageContext();
        return '你是龙蟠智研中心的AI助手。请用简洁专业的语气回答用户问题。\n' +
               '页面上下文：\n' + context + '\n\n' +
               '用户提问：' + userText + '\n\n' +
               '回答（100字以内，直接给出答案，不需要额外说明）：';
    }

    // 智谱AI API (GLM-4-Flash): 维护会话上下文
    // 注意：直接调用智谱API，无需代理
    var __ai_conv_id__ = 'ai-web-' + Date.now();
    var __zhipu_api_key__ = 'a84b9b55d2f34a7bbdc68afdd40bcafa.sb7cDCFaJkxjGluv';
    var __zhipu_model__ = 'glm-4-flash';
    var __ai_messages__ = [];  // 维护对话历史

    async function sendMessage() {
        var text = input.value.trim();
        if (!text) return;
        input.value = '';
        addMsg('user', text, userAvatar);
        showTyping();
        sendBtn.disabled = true;
        try {
            // 添加用户消息到历史
            __ai_messages__.push({role: 'user', content: buildPrompt(text)});

            // 调用智谱API（同步返回，无需轮询）
            var resp = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + __zhipu_api_key__,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: __zhipu_model__,
                    messages: __ai_messages__,
                    max_tokens: 512,
                    temperature: 0.7
                })
            });
            var data = await resp.json();

            removeTyping();

            if (data.error) {
                addMsg('bot', '[错误] ' + (data.error.message || 'API调用失败'), botAvatar);
                sendBtn.disabled = false;
                return;
            }

            // 提取回复内容
            var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
            if (reply) {
                // 添加助手回复到历史
                __ai_messages__.push({role: 'assistant', content: reply});
                addMsg('bot', reply, botAvatar);
                sendBtn.disabled = false;
                return;
            }

            // 无有效回复
            addMsg('bot', '[超时] AI 响应超时，请稍后再试。', botAvatar);
            sendBtn.disabled = false;
            return;
        } catch(e) {
            removeTyping();
            addMsg('bot', '[错误] ' + (e.message || 'AI 响应失败'), botAvatar);
            sendBtn.disabled = false;
        }
    }

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    sendBtn.addEventListener('click', sendMessage);
})();
});


/* ============== inline_03.js ============== */
// == 页面守卫：hub 子页面跳过 DOM 初始化 ==
var __isMainPage = !!document.getElementById('loadingOverlay') || window.location.pathname.endsWith('index_v3.html') || window.location.pathname === '/' || window.location.pathname === '';

// 重写 addEventListener 对 DOMContentLoaded 的调用（仅主页面执行）
var __origAddEventListener = EventTarget.prototype.addEventListener;
var __domContentLoadedCallbacks = [];
// 不直接重写，改用 wrapper 模式：
// 搜索所有 window.addEventListener('DOMContentLoaded', fn) 并在 fn 外包 guard
// 由下方正则替换自动处理


        // 事业部列表
        const deptList = ['lubricant', 'kelan', 'czly', 'lpsd', 'sdmd', 'sjl', 'bych', 'felt', 'dkhx'];

        // 自动播放变量
        let autoPlayTimer = null;
        let currentDeptIndex = 0;
        let isPaused = false;
        let autoPlayDuration = 8000; // 每个事业部展示 8 秒
        let progressTimer = null;

        // 当前报告日期（默认今天，可被 JSON 覆盖）
        let CURRENT_REPORT_DATE = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

        // 动态加载的报告数据（从 reports/YYYY-MM-DD.json 加载）
        let dynamicReportData = null;

        // 早报内容数据（硬编码 fallback）

        // 2026-07-24 改造：早报 fallback 数据外置到 reports/fallback_2026-07-24.js
        // 用 <script> 注入（避免 JS 对象 → JSON 转换问题）
        var reportData = window.__FALLBACK_DATA__ || {}; // 同步可用，由 fallback.js 注入
        if (Object.keys(reportData).length === 0) {
            // 异步注入（首屏不可用时降级）
            (function(){
                var s = document.createElement('script');
                s.src = 'reports/fallback_2026-07-24.js?v=20260724_002';
                s.async = false; // 同步加载
                document.head.appendChild(s);
            })();
        }
        var _origReportData = reportData;
        Object.defineProperty(window, '__FALLBACK_DATA__', { set: function(v) { reportData = v; } });

        // ============================================================
        // 动态报告加载器：从 reports/YYYY-MM-DD.json 读取
        // ============================================================

        /**
         * 加载指定日期的报告 JSON 文件
         * @param {string} date - YYYY-MM-DD 格式
         * @returns {Promise<object>} 报告数据对象
         */
        // ============================================================
        // 工具函数：带超时的 fetch（默认 5 秒）
        // ============================================================
        async function fetchWithTimeout(url, timeout = 5000) {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeout);
            try {
                const resp = await fetch(url, { signal: controller.signal });
                clearTimeout(id);
                return resp;
            } catch (e) {
                clearTimeout(id);
                throw e;
            }
        }

        // ============================================================
        // 加载指定日期的报告 JSON 文件（单一职责：只加载指定日期）
        // 失败直接抛异常，不做内部 fallback，由调用方决定降级策略
        // ============================================================
        async function loadReportJSON(date) {
            const TODAY = new Date().toISOString().slice(0, 10);
            console.log(`[loadReport] 开始加载 ${date}.json...`);
            const resp = await fetchWithTimeout(`reports/${date}.json?v=${HTML_VERSION}&_cb=${Date.now()}`, 5000);
            console.log(`[loadReport] HTTP状态: ${resp.status}, url=${resp.url}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            console.log(`[loadReport] 成功加载 ${date}，${Object.keys(data.departments || {}).length} 个事业部`);
            // 如果加载的是今天的报告且成功，标记缓存
            if (date === TODAY) {
                try { localStorage.setItem('cached_report_date', TODAY); } catch(e) {}
            }
            return data;
        }

        // 生成占位报告（���所有方式都失败时使用）
        function generatePlaceholderReport(date) {
            const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const d = new Date(date);
            const dayName = dayNames[d.getDay()];
            return {
                date: date,
                day: dayName,
                departments: {},
                generated_at: new Date().toISOString(),
                is_placeholder: true,
                message: '今日报告尚未生成，请运行自动化任务生成报告'
            };
        }

        /**
         * 构建 dynamicReportData，从 JSON 转换為 reportData 兼容格式
         * JSON 中 dept_id → { title, subtitle, date, content }
         */
        /**
         * 从 sections 数据构建 HTML
         */
        function sectionsToHTML(sections, windowEnd) {
            if (!sections) return '';
            console.log('[sectionsToHTML] ENTRY: sections.length=' + (sections.length || 0) + ', windowEnd=' + windowEnd);
            const stripMd = s => String(s).replace(/\*\*/g, '');
            const safe = s => stripMd(String(s)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>'));

            // MD原始顺序（key必须与JSON中的dim值匹配）
            const ORDERED_DIMS = [
                { key: 'topnews',    icon: '📌', label: '今日要报' },
                { key: 'market',     icon: '📊', label: '市场/价格' },
                { key: 'policy',     icon: '📜', label: '政策/行业' },
                { key: 'enterprise', icon: '🔥', label: '企业动态' },
                { key: 'tech',       icon: '💻', label: '技术/产品' },
                { key: 'project',    icon: '🏗', label: '项目/招标' },
                { key: 'tips',       icon: '💡', label: '专属提示' },
            ];

            const splitMultiItems = text => {
                let parts = text.split(/\n\*\*/);
                if (parts.length > 1) return parts.map(p => p.replace(/\*\*/g, '').trim()).filter(p => !!p);
                const stripped = text.replace(/\*\*/g, '');
                const p2 = stripped.split(/\n\n+/);
                if (p2.length > 1) return p2.map(p => p.trim()).filter(p => !!p);
                const p3 = stripped.split(/(?=\n\s*\d+[．、.]\s*)/);
                const result = [];
                for (const p of p3) {
                    const t = p.trim();
                    if (!t) continue;
                    const m = t.match(/^\d+[．、.]\s*(.*)$/s);
                    result.push(m ? m[1].trim() : t);
                }
                return result;
            };

            const renderMarketTable = (markdownStr) => {
                    const rows = [];
                    let inTable = false, headerDone = false;
                    for (const rawLine of markdownStr.split('\n')) {
                        const line = rawLine.trim();
                        if (!line || line === '---') continue;
                        // 跳过 markdown 表格分隔符
                        if (/^\|[\s\-:|]+\|$/.test(line)) { headerDone = true; continue; }
                        if (!line.startsWith('|')) continue;
                        const cells = [];
                        for (const cell of line.split('|')) {
                            const t = cell.trim();
                            // 去掉 **bold** 标记
                            const cleaned = t.replace(/\*\*([^*]+)\*\*/g, '$1');
                            if (cleaned) cells.push(cleaned);
                        }
                        if (cells.length < 2) continue;
                        if (!headerDone) {
                            rows.push({ type: 'th', cells });
                        } else {
                            rows.push({ type: 'td', cells });
                        }
                    }
                    if (rows.length === 0) return '';
                    const headerRow = rows[0];
                    const tbodyRows = rows.slice(1);
                    let html = '<div style="overflow-x:auto;margin:8px 0"><table style="width:100%;border-collapse:collapse;font-size:13px">';
                    // 表头
                    html += '<thead><tr>';
                    for (const cell of headerRow.cells) {
                        html += `<th style="background:#f5f5f5;padding:6px 8px;text-align:left;border-bottom:2px solid #ddd;white-space:nowrap">${cell}</th>`;
                    }
                    html += '</tr></thead>';
                    // 表体
                    html += '<tbody>';
                    for (const row of tbodyRows) {
                        html += '<tr>';
                        for (let ci = 0; ci < row.cells.length; ci++) {
                            const cell = row.cells[ci];
                            // 第一列左对齐，其余居左
                            const align = ci === 0 ? 'left' : 'left';
                            // 价格列高亮（含数字或元）
                            const isPrice = /[\d\.\，,]/.test(cell) && (cell.includes('元') || cell.includes('$') || cell.includes('%') || /\d+/.test(cell));
                            const cls = isPrice ? 'style="padding:5px 8px;border-bottom:1px solid #eee;white-space:nowrap;color:#2c3e50"' : `style="padding:5px 8px;border-bottom:1px solid #eee;vertical-align:top"`;
                            html += `<td ${cls}>${cell}</td>`;
                        }
                        html += '</tr>';
                    }
                    html += '</tbody></table></div>';
                    return html;
                };

                // 渲染 market_table 对象（来自 JSON 的 market_table 字段）
                const renderMarketTableFromObj = (tbl) => {
                    if (!tbl || !tbl.rows || !tbl.rows.length) return '';
                    let html = '<div style="overflow-x:auto;margin:8px 0"><table style="width:100%;border-collapse:collapse;font-size:13px">';
                    if (tbl.type === 'price_list') {
                        html += '<thead><tr>';
                        html += '<th style="background:#f5f5f5;padding:6px 8px;text-align:left;border-bottom:2px solid #ddd;white-space:nowrap">品种</th>';
                        html += '<th style="background:#f5f5f5;padding:6px 8px;text-align:left;border-bottom:2px solid #ddd;white-space:nowrap">价格</th>';
                        html += '<th style="background:#f5f5f5;padding:6px 8px;text-align:left;border-bottom:2px solid #ddd;white-space:nowrap">单位</th>';
                        html += '<th style="background:#f5f5f5;padding:6px 8px;text-align:left;border-bottom:2px solid #ddd;white-space:nowrap">涨跌</th>';
                        html += '<th style="background:#f5f5f5;padding:6px 8px;text-align:left;border-bottom:2px solid #ddd;white-space:nowrap">来源</th>';
                        html += '</tr></thead><tbody>';
                        for (const row of tbl.rows) {
                            html += '<tr>';
                            html += `<td style="padding:5px 8px;border-bottom:1px solid #eee;vertical-align:top">${safe(row.name || '')}</td>`;
                            const isPrice = /[\d\.\，,]/.test(row.price);
                            const cls = isPrice ? 'style="padding:5px 8px;border-bottom:1px solid #eee;white-space:nowrap;color:#2c3e50"' : 'style="padding:5px 8px;border-bottom:1px solid #eee;vertical-align:top"';
                            html += `<td ${cls}>${safe(row.price || '')}</td>`;
                            html += `<td style="padding:5px 8px;border-bottom:1px solid #eee;vertical-align:top">${safe(row.unit || '')}</td>`;
                            html += `<td style="padding:5px 8px;border-bottom:1px solid #eee;vertical-align:top">${safe(row.change || '')}</td>`;
                            html += `<td style="padding:5px 8px;border-bottom:1px solid #eee;vertical-align:top;color:#888;font-size:12px">${safe(row.source || '')}</td>`;
                            html += '</tr>';
                        }
                        html += '</tbody></table></div>';
                    } else {
                        // 未知类型，返回空字符串避免渲染异常HTML
                        return '';
                    }
                    return html;
                };

                const parseMarketPriceItem = (item) => {
                    const content = item.content || '';
                    const title = item.title || item.raw || '';
                    // 支持旧格式：价格：xxx / 涨跌：xxx / 来源：xxx
                    const priceMatch = content.match(/价格[：:]\s*([^，]+)/);
                    const changeMatch = content.match(/涨跌[：:]\s*([^。]+)/);
                    const sourceMatch = content.match(/来源[：:]\s*(.+)$/);
                    if (priceMatch) {
                        return {
                            name: title,
                            price: priceMatch[1].trim(),
                            change: changeMatch ? changeMatch[1].trim() : '',
                            source: sourceMatch ? sourceMatch[1].trim() : ''
                        };
                    }
                    // 新格式：直接包含价格和来源，如 "11.8万元/吨 待确认\n来源：CBC，2026-06-01"
                    // 提取价格（数字+单位）
                    const priceRegex = /(\d+(?:\.\d+)?\s*(?:万元\/吨|元\/吨|万元|元|‰|％|%))/;
                    const priceMatch2 = content.match(priceRegex);
                    // 提取涨跌（价格后面的文字，直到换行或"来源"）
                    let changeText = '';
                    if (priceMatch2) {
                        const afterPrice = content.slice(content.indexOf(priceMatch2[0]) + priceMatch2[0].length);
                        changeText = afterPrice.split('\n')[0].trim();
                        // 去掉开头的空格或标点
                        changeText = changeText.replace(/^[\s，,]+/, '');
                    }
                    // 提取来源
                    const sourceMatch2 = content.match(/来源[：:]\s*(.+)$/m);
                    const sourceText = sourceMatch2 ? sourceMatch2[1].trim() : '';
                    return {
                        name: title,
                        price: priceMatch2 ? priceMatch2[1].trim() : '',
                        change: changeText,
                        source: sourceText
                    };
                };

            const renderItem = (item, windowEnd) => {
                // 提取 Markdown 表格：正文中有 | 行的项，在标题后直接渲染表格
                const _hasTable = (text) => /^\|.+\|$/m.test(text || '');
                const _extractTable = (text) => {
                    if (!text) return { body: text, table: '' };
                    const lines = text.split('\n');
                    const tableLines = [];
                    const bodyLines = [];
                    let inTable = false;
                    for (const line of lines) {
                        const t = line.trim();
                        const isSep = /^\|[\s\-:|]+\|$/.test(t);
                        if (!inTable && t.startsWith('|') && !isSep) { inTable = true; }
                        if (isSep) { tableLines.push(line); continue; }
                        if (inTable && !t.startsWith('|')) { inTable = false; }
                        if (inTable) { tableLines.push(line); }
                        else { bodyLines.push(line); }
                    }
                    return {
                        body: bodyLines.join('\n').trim(),
                        table: tableLines.length >= 2 ? tableLines.join('\n') : ''
                    };
                };
                if (typeof item === 'string') {
                    const matchA = item.match(/^(\d+)[．、.]\s+([^*\n][^\n]*?)(?:\n|$)([\s\S]*)$/);
                    const matchB = item.match(/^(\d+)[．、.]\s+([^*\n][^\n]*)$/);
                    const m = matchA || matchB;
                    let num = '', titleText = '', bodyText = '';
                    if (m) {
                        num = m[1]; titleText = m[2].trim(); bodyText = (m[3] || '').trim();
                    } else {
                        const lines = item.split('\n');
                        titleText = (lines[0] || '').trim();
                        bodyText = lines.slice(1).join('\n').trim();
                    }
                    const { body: cleanBody, table: tableMd } = _extractTable(bodyText);
                    const tableHtml = tableMd ? renderMarketTable(tableMd) : '';
                    return `  <div class="hy-item" onclick="this.classList.toggle('expanded')">
    <div class="hy-item-title">
      <span class="item-num">${safe(num || '•')}</span>
      <span class="hy-item-title-text" title="${safe(titleText)}">${safe(titleText)}</span>
      <span class="hy-item-expand-icon">▼</span>
    </div>
    <div class="hy-item-body">${tableHtml}${cleanBody ? safe(cleanBody) : ''}</div>  </div>`;
                } else {
                    const lvl = item.level || (item.priority === 'P0' ? 'A' : item.priority === 'P1' ? 'B' : 'C');
                    const lvlClass = lvl === 'A' ? 'level-a' : lvl === 'P1' ? 'level-b' : 'level-c';
                    const titleText = item.title || '';
                    const bodyText = item.content || '';
                    const { body: cleanBody, table: tableMd } = _extractTable(bodyText);
                    let tableHtml = tableMd ? renderMarketTable(tableMd) : '';
                    // 也渲染 item.market_table（后端解析后的表格对象）
                    if (item.market_table && item.market_table.rows && item.market_table.rows.length) {
                        tableHtml += renderMarketTableFromObj(item.market_table);
                    }
                    // 修复问题2：title 与 content 相同时不去重复渲染
                    const finalBody = (cleanBody === titleText) ? '' : cleanBody;
                    return `<div class="report-item">
    <div class="report-item-title ${lvlClass}">${safe(titleText)}</div>
    <div class="report-item-content">${tableHtml}${finalBody ? safe(finalBody) : ''}</div>
    ${item.impact ? `<div class="report-item-impact">📎 ${safe(item.impact)}</div>\n` : ''}  </div>`;
                }
            };

            // --- 新格式：sections 是有序数组 [{dim, title, items}, ...] ---
            if (Array.isArray(sections)) {
                let html = '';
                for (const sec of sections) {
                    // 兼容 {title, name, content} 格式（content 为 Markdown 字符串）
                    if (sec.content && !sec.items) {
                        const title = sec.title || sec.name || '';
                        const iconMap = {'今日关注':'📌','市场行情':'📊','政策风向':'📜','🔥 企业动态':'🔥','前沿与产品动态':'💻','项目与招标':'🏗'};
                        const icon = iconMap[title] || '📋';
                        html += `<div class="report-section">
  <div class="report-section-title">${icon} ${safe(title)}</div>
`;
                        // 提取并渲染 Markdown 表格
                        const lines = sec.content.split('\n');
                        const tableLines = [];
                        const bodyLines = [];
                        let inTable = false;
                        for (const line of lines) {
                            const t = line.trim();
                            const isSep = /^\|[\s\-:|]+\|$/.test(t);
                            // 检测表格行：以|开头，或者包含至少3个|字符（至少2列）
                            const pipeCount = (t.match(/\|/g) || []).length;
                            const looksLikeTableRow = t.startsWith('|') || (pipeCount >= 3 && t.includes('|'));
                            if (!inTable && looksLikeTableRow && !isSep) { inTable = true; }
                            if (isSep) { tableLines.push(line); continue; }
                            if (inTable && !looksLikeTableRow) { inTable = false; }
                            if (inTable) { tableLines.push(line); }
                            else { bodyLines.push(line); }
                        }
                        if (tableLines.length >= 2) {
                            // 市场行情部分：在表格上方添加"1. 价格数据表"标题
                            if (title === '市场行情') {
                                html += `<div class="hy-item" onclick="this.classList.toggle('expanded')">
    <div class="hy-item-title">
      <span class="item-num">1</span>
      <span class="hy-item-title-text" title="价格数据表">价格数据表</span>
      <span class="hy-item-expand-icon">▼</span>
    </div>
    <div class="hy-item-body" style="display:none"></div>
  </div>`;
                            }
                            const tableHtml = renderMarketTable(tableLines.join('\n'));
                            console.log('[renderBody] title=' + (sec.title || sec.name) + ', tableLines.length=' + tableLines.length + ', tableHtml.length=' + tableHtml.length);
                            html += tableHtml;
                        }
                        // 渲染 body 文本段落
                        const bodyText = bodyLines.join('\n').trim();
                        console.log('[renderBody] title=' + (sec.title || sec.name) + ', bodyText前200=', bodyText.substring(0, 200));
                        if (bodyText) {
                            // 今日关注：只显示标题列表，不显示正文
                            if (title === '今日关注') {
                                const items = bodyText.split(/\n\n+/).map(s=>s.trim()).filter(s=>s);
                                let idx = 1;
                                for (const item of items) {
                                    const titleText = item.split('\n')[0].trim();
                                    html += `<div class="hy-item hy-item-topnews">
  <div class="hy-item-title">
    <span class="item-num">${idx}</span>
    <span class="hy-item-title-text" title="${safe(titleText)}">${safe(titleText)}</span>
  </div>
</div>`;
                                    idx++;
                                }
                            } else {
                            // 先尝试按 ## 标题分割为带序号的条目
                            const headingItems = bodyText.split(/\n##\s+/).map(s => s.trim()).filter(s => s);
                            
                            if (headingItems.length > 1) {
                                // 有多条 ## 标题，生成带序号的列表
                                let idx = 1;
                                for (const item of headingItems) {
                                    // 去掉开头的 ##（如果有）
                                    const cleanItem = item.replace(/^##\s*/, '').trim();
                                    if (!cleanItem) continue;
                                    // 把内容中的换行替换为空格
                                    const singleLine = cleanItem.replace(/\n+/g, ' ').trim();
                                    html += `<div class="hy-item" onclick="this.classList.toggle('expanded')">
    <div class="hy-item-title">
      <span class="item-num">${idx}</span>
      <span class="hy-item-title-text" title="${safe(singleLine)}">${safe(singleLine)}</span>
      <span class="hy-item-expand-icon">▼</span>
    </div>
    <div class="hy-item-body" style="display:none">${safe(singleLine)}</div>
  </div>`;
                                    idx++;
                                }
                            } else {
                                // 无 ## 标题，按格式处理
                                const paras = bodyText.split(/\n\n+/).map(s=>s.trim()).filter(s=>s);
                                
                                // 优先检查 **标题**：格式 (粗体标题带冒号)
                                const colonTitleRegex = /\*\*([^*]+)\*\*：/g;
                                const colonTitleMatches = [...bodyText.matchAll(colonTitleRegex)];
                                console.log('[renderBody] title=' + (sec.title || sec.name) + ', colonTitleMatches.length=' + colonTitleMatches.length);
                                if (colonTitleMatches.length > 0) {
                                    // 按 **标题**：分割
                                    const parts = bodyText.split(/\*\*[^*]+\*\*：/);
                                    let itemIdx = 1;
                                    
                                    // 如果有摘要部分（第一个 **标题**：之前的内容）
                                    if (parts[0].trim()) {
                                        const summaryText = parts[0].trim();
                                        let titleText = summaryText.split('\n')[0] || '';
                                        html += `<div class="hy-item" onclick="this.classList.toggle('expanded')">
    <div class="hy-item-title">
      <span class="item-num">${itemIdx}</span>
      <span class="hy-item-title-text" title="${safe(titleText)}">${safe(titleText)}</span>
      <span class="hy-item-expand-icon">▼</span>
    </div>
    <div class="hy-item-body" style="display:none">${safe(summaryText).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
  </div>`;
                                        itemIdx++;
                                    }
                                    
                                    // 处理每个 **标题**：部分
                                    for (let i = 0; i < colonTitleMatches.length; i++) {
                                        const title = colonTitleMatches[i][1];
                                        const body = parts[i + 1] ? parts[i + 1].trim() : '';
                                        html += `<div class="hy-item" onclick="this.classList.toggle('expanded')">
    <div class="hy-item-title">
      <span class="item-num">${itemIdx}</span>
      <span class="hy-item-title-text" title="${safe(title)}"><strong>${safe(title)}</strong></span>
      <span class="hy-item-expand-icon">▼</span>
    </div>
    <div class="hy-item-body" style="display:none">${safe(body).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
  </div>`;
                                        itemIdx++;
                                    }
                                } else if (paras.length > 1) {
                                    // 多个段落 → 每个段落生成一个带序号的折叠条目
                                    let idx = 1;
                                    for (const p of paras) {
                                        const trimmed = p.trim();
                                        if (!trimmed) continue;
                                        // 尝试提取 **标题**正文 格式中的标题部分
                                        const boldTitleMatch = trimmed.match(/^\*\*([^*]+)\*\*\s*([\s\S]*)$/);
                                        if (boldTitleMatch) {
                                            const titleText = boldTitleMatch[1].trim();
                                            const bodyContent = boldTitleMatch[2].trim();
                                            html += `<div class="hy-item" onclick="this.classList.toggle('expanded')">
    <div class="hy-item-title">
      <span class="item-num">${idx}</span>
      <span class="hy-item-title-text" title="${safe(titleText)}">${safe(titleText)}</span>
      <span class="hy-item-expand-icon">▼</span>
    </div>
    <div class="hy-item-body" style="display:none">${safe(bodyContent).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
  </div>`;
                                        } else {
                                            // 非 **标题** 格式，取第一行作为标题
                                            let titleText = trimmed.split('\n')[0] || '';
                                            html += `<div class="hy-item" onclick="this.classList.toggle('expanded')">
    <div class="hy-item-title">
      <span class="item-num">${idx}</span>
      <span class="hy-item-title-text" title="${safe(titleText)}">${safe(titleText)}</span>
      <span class="hy-item-expand-icon">▼</span>
    </div>
    <div class="hy-item-body" style="display:none">${safe(trimmed).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
  </div>`;
                                        }
                                        idx++;
                                    }
                                } else {
                                    // 单个段落 → 检测 **标题**正文 格式
                                    const trimmed = paras[0] ? paras[0].trim() : '';
                                    if (!trimmed) continue;
                                    const boldTitleMatch = trimmed.match(/^\*\*([^*]+)\*\*\s*([\s\S]*)$/);
                                    if (boldTitleMatch) {
                                        const titleText = boldTitleMatch[1].trim();
                                        const bodyContent = boldTitleMatch[2].trim();
                                        html += `<div class="hy-item" onclick="this.classList.toggle('expanded')">
    <div class="hy-item-title">
      <span class="item-num">1</span>
      <span class="hy-item-title-text" title="${safe(titleText)}">${safe(titleText)}</span>
      <span class="hy-item-expand-icon">▼</span>
    </div>
    <div class="hy-item-body" style="display:none">${safe(bodyContent).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
  </div>`;
                                    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                                        const listItems = trimmed.split('\n').map(it =>
                                            `<li>${safe(it.replace(/^[-*]\s+/, ''))}</li>`
                                        ).join('');
                                        html += `<ul style="margin:8px 0;padding-left:20px">${listItems}</ul>`;
                                    } else {
                                        html += `<p style="margin:8px 0;line-height:1.7">${safe(trimmed).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
                                    }
                                }
                            }
                            } // 结束今日关注的特殊处理分支
                        }
                        html += `</div>\n`;
                        continue;
                    }

                    const isTopnews = sec.dim === 'topnews';
                    const items = sec.items || [];
                    if (!items.length) continue;

                    // 今日要报：编号 + 标题 + 正文内容
                    if (isTopnews) {
                        html += `<div class="report-section">
  <div class="report-section-title">📌 ${safe(sec.title || '今日要报')}</div>
`;
                        for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            const titleText = item.title || '';
                            const contentText = item.content || '';
                            const lvl = item.priority === 'P0' ? 'level-a' : item.priority === 'P1' ? 'level-b' : 'level-c';
                            html += `  <div class="report-item ${lvl}">
    <div class="report-item-title" style="display:flex;gap:8px;align-items:baseline">
      <span style="color:#e74c3c;font-weight:bold">${i+1}.</span>
      <span>${safe(titleText)}</span>
    </div>
    ${contentText ? `    <div class="report-item-content" style="margin-top:4px">${safe(contentText)}</div>\n` : ''}  </div>\n`;
                        }
                        html += `</div>\n`;
                        continue;
                    }

                    // 市场/价格：价格类条目聚合成表格，分析类条目正常渲染
                    if (sec.dim === 'market') {
                        const priceItems = [];
                        const textItems = [];
                        for (const item of items) {
                            const content = (typeof item === 'object' ? (item.content || '') : String(item));
                            // 旧格式：content 包含 "价格：xxx"
                            // 新格式：content 包含价格数字+单位（如 "11.8万元/吨"）且包含 "来源："
                            const hasPriceTag = /价格[：:]/.test(content);
                            const hasPriceValue = /\d+(?:\.\d+)?\s*(?:万元\/吨|元\/吨|万元|元|‰|％|%)/.test(content);
                            const hasSource = /来源[：:]/.test(content);
                            if (hasPriceTag || (hasPriceValue && hasSource)) {
                                priceItems.push(item);
                            } else {
                                textItems.push(item);
                            }
                        }
                        const dimDef = ORDERED_DIMS.find(d => d.key === sec.dim) || {};
                        html += `<div class="report-section">
  <div class="report-section-title">${dimDef.icon || '📋'} ${safe(sec.title || '市场/价格')}</div>
`;
                        if (priceItems.length) {
                            const rows = priceItems.map(parseMarketPriceItem);
                            html += '<div style="overflow-x:auto;margin:8px 0"><table style="width:100%;border-collapse:collapse;font-size:13px">';
                            html += '<thead><tr>';
                            html += '<th style="background:#f5f5f5;padding:6px 8px;text-align:left;border-bottom:2px solid #ddd;white-space:nowrap">品种</th>';
                            html += '<th style="background:#f5f5f5;padding:6px 8px;text-align:left;border-bottom:2px solid #ddd;white-space:nowrap">价格</th>';
                            html += '<th style="background:#f5f5f5;padding:6px 8px;text-align:left;border-bottom:2px solid #ddd;white-space:nowrap">涨跌</th>';
                            html += '<th style="background:#f5f5f5;padding:6px 8px;text-align:left;border-bottom:2px solid #ddd;white-space:nowrap">来源</th>';
                            html += '</tr></thead><tbody>';
                            for (const row of rows) {
                                html += '<tr>';
                                html += `<td style="padding:5px 8px;border-bottom:1px solid #eee;vertical-align:top">${safe(row.name)}</td>`;
                                html += `<td style="padding:5px 8px;border-bottom:1px solid #eee;white-space:nowrap;color:#2c3e50">${safe(row.price)}</td>`;
                                html += `<td style="padding:5px 8px;border-bottom:1px solid #eee;vertical-align:top">${safe(row.change)}</td>`;
                                html += `<td style="padding:5px 8px;border-bottom:1px solid #eee;vertical-align:top;color:#888;font-size:12px">${safe(row.source)}</td>`;
                                html += '</tr>';
                            }
                            html += '</tbody></table></div>';
                        }
                        for (const item of textItems) {
                            if (typeof item === 'string') {
                                const parts = splitMultiItems(item);
                                for (const p of parts) html += renderItem(p, windowEnd) + '\n';
                            } else {
                                html += renderItem(item, windowEnd) + '\n';
                            }
                        }
                        html += `</div>\n`;
                        continue;
                    }

                    // 普通章节：保留MD原始标题
                    const dimDef = ORDERED_DIMS.find(d => d.key === sec.dim) || {};
                    html += `<div class="report-section">
  <div class="report-section-title">${dimDef.icon || '📋'} ${safe(sec.title || sec.dim)}</div>
`;
                    for (const item of items) {
                        if (typeof item === 'string') {
                            const parts = splitMultiItems(item);
                            for (const p of parts) html += renderItem(p, windowEnd) + '\n';
                        } else {
                            html += renderItem(item, windowEnd) + '\n';
                        }
                    }
                    html += `</div>\n`;
                }
                console.log('[sectionsToHTML] EXIT: html.length=' + html.length + ', sections processed=' + sections.length);
                return html;
            }

            // --- 旧dict格式：按MD顺序映射 ---
            const dimLabelMap = {
                topnews:    ['今日要报', '📌'],
                market:     ['市场/价格', '📊'],
                policy:     ['政策/行业', '📜'],
                enterprise: ['企业动态', '🔥'],
                tech:       ['技术/产品', '💻'],
                project:    ['项目/招标', '🏗'],
                tips:       ['专属提示', '💡'],
            };
            let html = '';
            for (const dimDef of ORDERED_DIMS) {
                const items = sections[dimDef.key];
                if (!items || !Array.isArray(items) || items.length === 0) continue;
                const [label, icon] = dimLabelMap[dimDef.key] || [dimDef.label, dimDef.icon];
                html += `<div class="report-section">
  <div class="report-section-title">${icon} ${label}</div>
`;
                for (const item of items) {
                    if (typeof item === 'string') {
                        const parts = splitMultiItems(item);
                        for (const p of parts) html += renderItem(p, windowEnd) + '\n';
                    } else {
                        html += renderItem(item, windowEnd) + '\n';
                    }
                }
                html += `</div>\n`;
            }
            return html;
        }

        function buildDynamicReportData(jsonReport) {
            const result = {};
            if (!jsonReport || !jsonReport.departments) return result;

            for (const [deptId, deptData] of Object.entries(jsonReport.departments)) {
                // 优先使用 _raw_content（旧格式兼容）
                const rawContent = deptData._raw_content || '';
                if (rawContent && rawContent.trim()) {
                    result[deptId] = {
                        title: deptData.name || deptId,
                        subtitle: deptData.subtitle || '',
                        date: jsonReport.date || CURRENT_REPORT_DATE,
                        content: rawContent,
                        headline: deptData.headline || '',
                        lead: deptData.lead_judgment || deptData.lead || '',
                        risk: deptData.risk_tip || deptData.risk || '',
                        summary: deptData.summary || '',
                        conclusion: deptData.conclusion || '',
                        window_start: deptData.window_start || '',
                        window_end: deptData.window_end || '',
                        sections: deptData.sections || [],
                    };
                    continue;
                    } else if (Array.isArray(deptData.sections)) {
                    // 新格式（数组）：sections 自包含全部内容
                    // 把数组格式 [{dim,title,items}] 转成对象格式 {topnews:{title,items}, market:{...}}
                    const sectionsObj = {};
                    for (const sec of deptData.sections) {
                        if (sec.dim) sectionsObj[sec.dim] = { title: sec.title || sec.dim, items: sec.items || [] };
                    }
                    let html = sectionsToHTML(deptData.sections, deptData.window_end);
                    console.log('[buildDynamicReportData] sectionsToHTML returned, html.length=' + html.length + ', sections.length=' + deptData.sections.length + ', deptId=' + deptId);
                    if (deptData.risk_tip || deptData.risk) {
                        html += `<div class="report-risk"><b>⚠️ 风险提示：</b>${deptData.risk_tip || deptData.risk}</div>\n`;
                    }
                    result[deptId] = {
                        title: deptData.name || deptId,
                        subtitle: deptData.subtitle || '',
                        date: jsonReport.date || CURRENT_REPORT_DATE,
                        content: html,
                        headline: deptData.headline || '',
                        lead: deptData.lead_judgment || deptData.lead || '',
                        risk: deptData.risk_tip || deptData.risk || '',
                        summary: deptData.summary || '',
                        conclusion: deptData.conclusion || '',
                        window_start: deptData.window_start || '',
                        window_end: deptData.window_end || '',
                        sections: deptData.sections || [],
                    };
                } else if (deptData.sections && typeof deptData.sections === 'object') {
                    // 对象格式（键值对）：sections = {topnews: [...], market: {...}, ...}
                    // 先转换为旧 dict 格式（sections[key] = {title, content} 数组）
                    const normalized = {};
                    for (const [key, value] of Object.entries(deptData.sections)) {
                        if (key === 'topnews' && Array.isArray(value)) {
                            normalized[key] = value.map(item => ({
                                title: item.标题 || item.title || '',
                                content: ''
                            }));
                        } else if (key === 'market' && value && typeof value === 'object') {
                            let items = [];
                            // 价格数据表 → markdown 表格
                            if (value['价格数据表'] && Array.isArray(value['价格数据表'])) {
                                let md = '| 品类 | 价格 | 涨跌 | 来源 |\n|:---|:---|:---|:---|\n';
                                for (const row of value['价格数据表']) {
                                    md += `| ${row.品类 || ''} | ${row.价格 || ''} | ${row.涨跌 || ''} | ${row.来源 || ''} |\n`;
                                }
                                items.push({ title: '价格数据表', content: md });
                            }
                            // 供给信号、争议风险、需求信号、行业动态
                            for (const subKey of ['供给信号', '争议风险', '需求信号', '行业动态']) {
                                if (value[subKey] && Array.isArray(value[subKey])) {
                                    for (const item of value[subKey]) {
                                        items.push({ title: item.标题 || '', content: item.正文 || '' });
                                    }
                                }
                            }
                            normalized[key] = items;
                        } else if (['policy', 'enterprise', 'tech'].includes(key) && Array.isArray(value)) {
                            normalized[key] = value.map(item => ({
                                title: item.标题 || item.title || '',
                                content: (item.摘要 || item.content || '') +
                                    (item.来源 ? '\n\n' + item.来源 : '') +
                                    (item.日期 ? ' ' + item.日期 : '')
                            }));
                        } else if (key === 'project' && Array.isArray(value)) {
                            normalized[key] = value.map(item => ({
                                title: item.标题 || item.title || '',
                                content: (item.摘要 || item.content || '') +
                                    (item.来源 ? '\n\n' + item.来源 : '') +
                                    (item.日期 ? ' ' + item.日期 : '')
                            }));
                        } else if (key === 'tips' && value && typeof value === 'object') {
                            let items = [];
                            for (const tipKey of ['机会', '风险', '行动建议']) {
                                if (value[tipKey] && Array.isArray(value[tipKey])) {
                                    for (const item of value[tipKey]) {
                                        items.push({ title: tipKey, content: item.总结 || item.content || '' });
                                    }
                                }
                            }
                            normalized[key] = items;
                        } else if (Array.isArray(value)) {
                            normalized[key] = value.map(item => typeof item === 'string' ? item : {
                                title: item.标题 || item.title || '',
                                content: item.摘要 || item.正文 || item.content || ''
                            });
                        }
                    }
                    let html = sectionsToHTML(normalized, deptData.window_end);
                    console.log('[buildDynamicReportData] sectionsToHTML (normalized object format) returned, html.length=' + html.length + ', deptId=' + deptId);
                    if (deptData.risk_tip || deptData.risk) {
                        html += `<div class="report-risk"><b>⚠️ 风险提示：</b>${deptData.risk_tip || deptData.risk}</div>\n`;
                    }
                    result[deptId] = {
                        title: deptData.name || deptId,
                        subtitle: deptData.subtitle || '',
                        date: jsonReport.date || CURRENT_REPORT_DATE,
                        content: html,
                        headline: deptData.headline || '',
                        lead: deptData.lead_judgment || deptData.lead || '',
                        risk: deptData.risk_tip || deptData.risk || '',
                        summary: deptData.summary || '',
                        conclusion: deptData.conclusion || '',
                        window_start: deptData.window_start || '',
                        window_end: deptData.window_end || '',
                        sections: deptData.sections || {},
                    };
                } else {
                    // 兜底：既无 _raw_content 也无 sections（理论上不会出现）
                    result[deptId] = {
                        title: deptData.name || deptId,
                        subtitle: deptData.subtitle || '',
                        date: jsonReport.date || CURRENT_REPORT_DATE,
                        content: `<div style="padding:20px;color:#999">该事业部数据格式异常，请检查 JSON</div>`,
                        headline: deptData.headline || '',
                        lead: deptData.lead_judgment || deptData.lead || '',
                        risk: '',
                        summary: '',
                        conclusion: '',
                        window_start: deptData.window_start || '',
                        window_end: deptData.window_end || '',
                        sections: deptData.sections || [],
                    };
                }
            }
            return result;
        }

        /**
         * 初始化：从 JSON 文件加载报告数据
         */
        async function initDynamicData() {
            // embedded 模式：直接用内嵌数据，完全不走网络
            // embedded 模式：直接用内嵌数据，完全不走网络
            if (window.__EMBEDDED__ && window.__EMBEDDED__.report) {
                console.log('[initDynamicData] embedded 模式，使用内嵌数据');
                try {
                    dynamicReportData = buildDynamicReportData(window.__EMBEDDED__.report);
                    console.log('[initDynamicData] buildDynamicReportData 成功，keys:', Object.keys(dynamicReportData || {}));
                } catch(e) {
                    console.error('[initDynamicData] buildDynamicReportData 失败:', e);
                    dynamicReportData = null;
                }
                CURRENT_REPORT_DATE = window.__EMBEDDED__.today;
            } else {
                // 正常模式：从网络加载
                const urlParams = new URLSearchParams(window.location.search);
                const urlDate = urlParams.get('date');
                const today = new Date();
                const todayStr = urlDate || `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
                console.log(`[initDynamicData] 网络模式，尝试加载 ${todayStr}.json...`);
                try {
                    const jsonData = await loadReportJSON(todayStr);
                    console.log('[initDynamicData] todayStr jsonData 结果:', jsonData ? '有数据' : '空');
                    if (jsonData && jsonData.departments) {
                        dynamicReportData = buildDynamicReportData(jsonData);
                        CURRENT_REPORT_DATE = todayStr;
                        console.log('[initDynamicData] todayStr 构建成功, keys:', Object.keys(dynamicReportData));
                    }
                } catch (e) {
                    console.warn('[initDynamicData] todayStr 加载失败，进入 fallback:', e.message);
                }
                // 如果 dynamicReportData 仍为空（todayStr 失败，或 build 抛异常），走 fallback
                if (!dynamicReportData) {
                    let found = false;
                    let availableDates = [];
                    // 优先：读取 index.json，获取可用日期列表
                    try {
                        const idxResp = await fetchWithTimeout('reports/index.json?v=' + HTML_VERSION, 5000);
                        if (idxResp.ok) {
                            const idxData = await idxResp.json();
                            availableDates = idxData.available_dates || [];
                            console.log('[initDynamicData] index.json 可用日期数:', availableDates.length, '最新:', availableDates[0]);
                        }
                    } catch(e2) {
                        console.warn('[initDynamicData] index.json 请求失败，走日期回溯:', e2);
                    }
                    // 策略1：用 index.json 里的 available_dates（从最新开始尝试，最多试10个）
                    if (!found && availableDates.length > 0) {
                        const maxTry = Math.min(availableDates.length, 10);
                        for (let i = 0; i < maxTry; i++) {
                            const tryDate = availableDates[i];
                            try {
                                const fbData = await loadReportJSON(tryDate);
                                if (fbData && fbData.departments) {
                                    dynamicReportData = buildDynamicReportData(fbData);
                                    CURRENT_REPORT_DATE = tryDate;
                                    found = true;
                                    console.log('[initDynamicData] ✅ 从 available_dates 加载成功:', tryDate);
                                    break;
                                }
                            } catch(e3) {
                                console.log(`[initDynamicData] available_dates[${i}] ${tryDate} 失败:`, e3.message);
                            }
                        }
                    }
                    // 策略2：如果 index.json 没有可用日期，7 天回溯（原30天太多）
                    if (!found) {
                        console.log('[initDynamicData] 进入日期回溯（最多7天）...');
                        for (let daysBack = 1; daysBack <= 7; daysBack++) {
                            const d = new Date(today.getTime() - daysBack * 86400000);
                            const candidate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                            try {
                                const data = await loadReportJSON(candidate);
                                if (data && data.departments) {
                                    dynamicReportData = buildDynamicReportData(data);
                                    CURRENT_REPORT_DATE = candidate;
                                    found = true;
                                    console.log('[initDynamicData] ✅ 回溯加载成功:', candidate);
                                    break;
                                }
                            } catch(e3) {
                                console.log(`[initDynamicData] 回溯 ${candidate} 失败:`, e3.message);
                            }
                        }
                    }
                    // 最终兜底：硬编码
                    if (!found) {
                        console.warn('[initDynamicData] 全部失败，使用硬编码 fallback');
                        dynamicReportData = reportData;
                        CURRENT_REPORT_DATE = '2026-04-28';
                    }
                }
            }
            
            console.log('[initDynamicData] 数据加载完成');
        }
        
        /**
         * 实时更新时钟
         */
        function updateClock() {
            const now = new Date();
            // 时间格式：HH:MM:SS（24小时制，精确到秒）
            const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
            const dateStr = now.toLocaleDateString('zh-CN', dateOptions);
            
            const clockElement = document.getElementById('realTimeClock');
            const dateElement = document.getElementById('currentDate');
            const clockIcon = document.getElementById('clockIcon');
            
            if (clockElement) {
                clockElement.textContent = timeStr;
            }
            if (dateElement) {
                dateElement.textContent = dateStr;
            }

            // 根据时间段改变时钟图标
            if (!clockIcon) return;
            const hour = now.getHours();
            if (hour >= 6 && hour < 12) {
                clockIcon.textContent = '🌅';
            } else if (hour >= 12 && hour < 18) {
                clockIcon.textContent = '☀️';
            } else if (hour >= 18 && hour < 22) {
                clockIcon.textContent = '🌆';
            } else {
                clockIcon.textContent = '🌙';
            }
        }

        // 页面加载时立即更新时钟，然后每秒更新
        window.addEventListener('DOMContentLoaded', updateClock);
        setInterval(updateClock, 1000);

        // 市场热度监控：页面加载自动刷新 + 每30秒轮询
        window.addEventListener('DOMContentLoaded', () => {
            refreshMarketData();
            setInterval(refreshMarketData, 30000);
        });

        // 隐藏加载动画（用 DOMContentLoaded 确保不管什么模式 loading 都会消失）
        window.addEventListener('DOMContentLoaded', function() {
            // 延迟1秒后关闭 loading，确保数据加载完成
            setTimeout(function() {
                const loadingOverlay = document.getElementById('loadingOverlay');
                if (loadingOverlay) {
                    loadingOverlay.classList.add('hidden');
                    setTimeout(function() {
                        loadingOverlay.style.display = 'none';
                    }, 500);
                }
            }, 1000);
        });

        // URL hash 监听：从 dept-archive 跳转回来时自动打开历史弹窗
        window.addEventListener('hashchange', function() {
            if (window.location.hash === '#history' || window.location.hash === '#history-list') {
                setTimeout(function() {
                    if (typeof openHistory === 'function') {
                        const firstDeptId = Object.keys(reportData || {})[0] || 'lubricant';
                        openHistory(firstDeptId);
                    }
                }, 500);
            }
        });
        // 页面加载时检查 hash
        if (window.location.hash === '#history' || window.location.hash === '#history-list') {
            setTimeout(function() {
                if (typeof openHistory === 'function') {
                    const firstDeptId = Object.keys(reportData || {})[0] || 'lubricant';
                    openHistory(firstDeptId);
                }
            }, 1000);
        }

        // ============================================================
        // 市场监控功能
        // ============================================================
        
        /**
         * 更新市场数据卡片
         * 数据来源：
         *   - market_lc.json  : 碳酸锂期货（东方财富→广期所）
         *   - market_lfp.json : 我的钢铁网（现货价+涨跌）
         */
        async function updateMarketCards() {
            const cards = document.querySelectorAll('.monitor-card');
            if (!cards.length) return;

            // 并行加载两路数据（市场行情用时间戳避免缓存，确保每次轮询拿最新数据）
            const [lcResp, mysteelResp] = await Promise.allSettled([
                fetch(`reports/market_lc.json?t=${Date.now()}`),
                fetch(`reports/market_lfp.json?t=${Date.now()}`),
            ]);

            // ── 碳酸锂期货（卡片0）────────────────────────────
            // 注意：东方财富 API 可能断线，price 为 "-" 时降级用 prev_close
            if (lcResp.status === 'fulfilled' && lcResp.value.ok) {
                try {
                    const lcData = await lcResp.value.json();
                    const lcm = lcData.contracts?.find(c => c.name.includes('碳酸锂')) || lcData.contracts?.[0];
                    if (lcm && cards[0]) {
                        const rawPrice = lcm.price;
                        const rawPct = lcm.change_pct;
                        // price 为 "-" 或 0 时降级用 prev_close（昨收价）
                        const p = (rawPrice && rawPrice !== '-' && Number(rawPrice) > 0)
                            ? Number(rawPrice) : (lcm.prev_close || 0);
                        const cp = (rawPrice && rawPrice !== '-' && Number(rawPrice) > 0)
                            ? Number(rawPct) : 0;
                        const card = cards[0];
                        _setCardValue(card, `碳酸锂期货(主连)`, p, cp, '元/吨');
                        const polyline = card.querySelector('.trend-mini-chart polyline');
                        if (polyline) polyline.setAttribute('stroke', cp >= 0 ? '#d32f2f' : '#388e3c');
                    }
                    console.log('[碳酸锂期货]', lcm?.name, lcm?.price || lcm?.prev_close, '元/吨');
                } catch (e) {
                    console.warn('[碳酸锂期货] 加载失败:', e.message);
                }
            }

            // ── 我的钢铁网现货数据（卡片1: LFP, 卡片2: 磷酸铁）──────────
            if (mysteelResp.status === 'fulfilled' && mysteelResp.value.ok) {
                try {
                    const mysteelData = await mysteelResp.value.json();
                    const prices = mysteelData.prices || {};

                    // 卡片1: 碳酸锂现货（市场现货价，非期货）
                    // market_lfp.json 的 "碳酸锂" 即 SMM 电池级碳酸锂现货
                    if (cards[1]) {
                        const card = cards[1];
                        const lc = prices['碳酸锂'] || {};
                        const p = Number(lc.price) > 0 ? Number(lc.price) : 0;
                        const cp = Number(lc.change_pct) || 0;
                        _setCardValue(card, `碳酸锂 现货`, p, cp, '元/吨');
                        const polyline = card.querySelector('.trend-mini-chart polyline');
                        if (polyline) polyline.setAttribute('stroke', cp >= 0 ? '#d32f2f' : '#388e3c');
                        // 更新详情
                        const detailItems = card.querySelectorAll('.detail-item span:last-child');
                        if (detailItems.length >= 3) {
                            detailItems[0].textContent = '价格';
                            detailItems[1].textContent = p > 0 ? `${(p/10000).toFixed(2)} 万元/吨` : '--';
                            detailItems[2].textContent = `数据来源: 我的钢铁网`;
                        }
                    }

                    // 卡片2: 磷酸铁现货
                    if (cards[2]) {
                        const card = cards[2];
                        const fp = prices['磷酸铁'] || {};
                        const p = Number(fp.price) > 0 ? Number(fp.price) : 0;
                        const cp = Number(fp.change_pct) || 0;
                        _setCardValue(card, `磷酸铁`, p, cp, '元/吨');
                        const polyline = card.querySelector('.trend-mini-chart polyline');
                        if (polyline) polyline.setAttribute('stroke', cp >= 0 ? '#d32f2f' : '#388e3c');
                        // 更新详情
                        const detailItems = card.querySelectorAll('.detail-item span:last-child');
                        if (detailItems.length >= 3) {
                            detailItems[0].textContent = '价格';
                            detailItems[1].textContent = p > 0 ? `${p.toLocaleString()} 元/吨` : '--';
                            detailItems[2].textContent = `数据来源: 我的钢铁网`;
                        }
                    }

                    // 更新时间标签
                    const updateTime = mysteelData.update_time || '';
                    const sectionTitle = document.querySelector('.market-monitor .section-title');
                    if (sectionTitle) {
                        const existing = sectionTitle.querySelector('.market-update-time');
                        if (existing) existing.remove();
                        const timeTag = document.createElement('span');
                        timeTag.className = 'market-update-time';
                        timeTag.style.cssText = 'font-size:11px;color:#999;margin-left:8px;font-weight:normal';
                        timeTag.textContent = updateTime ? `↑ 我的钢铁网 ${updateTime}` : `↑ ${new Date().toLocaleTimeString('zh-CN')} 刷新`;
                        sectionTitle.appendChild(timeTag);
                    }

                    console.log('[钢铁网数据] 碳酸锂:', prices['碳酸锂']?.price, '| 磷酸铁:', prices['磷酸铁']?.price);
                } catch (e) {
                    console.warn('[钢铁网数据] 加载失败:', e.message);
                }
            }
        }

        /**
         * 通用卡片更新函数
         * @param {Element} card   - .monitor-card DOM元素
         * @param {string}  label - 卡片标签
         * @param {number}  price - 价格数值
         * @param {number}  changePct - 涨跌幅 %
         * @param {string}  unit  - 单位
         */
        function _setCardValue(card, label, price, changePct, unit) {
            const labelEl = card.querySelector('.monitor-label');
            if (labelEl) labelEl.textContent = label;

            const valueEl = card.querySelector('.monitor-value');
            if (valueEl) {
                const fmt = price > 0 ? Number(price).toLocaleString('zh-CN') : '--';
                valueEl.innerHTML = `${fmt} <span class="unit">${unit}</span>`;
            }

            const changeEl = card.querySelector('.monitor-change');
            if (changeEl) {
                const arrow = changePct > 0 ? '↑' : changePct < 0 ? '↓' : '→';
                const cls = changePct > 0 ? 'up' : changePct < 0 ? 'down' : 'stable';
                changeEl.className = `monitor-change ${cls}`;
                changeEl.textContent = `${arrow} ${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%`;
            }
        }

        /**
         * 刷新市场数据（按钮触发）
         */
        async function refreshMarketData() {
            const refreshBtn = document.querySelector('.refresh-btn');
            const monitorCards = document.querySelectorAll('.monitor-card');

            // 添加旋转动画
            if (refreshBtn) refreshBtn.classList.add('spinning');

            // 为每个卡片添加更新动画
            monitorCards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('updating');
                    setTimeout(() => card.classList.remove('updating'), 800);
                }, index * 80);
            });

            // 读取最新JSON数据（Python抓取脚本由定时任务驱动）
            await updateMarketCards();

            // 移除旋转动画
            setTimeout(() => {
                if (refreshBtn) refreshBtn.classList.remove('spinning');
            }, 600);
        }
        
        /**
         * 初始化锂电板块产业链洞察Dashboard
         * 在页面加载后动态添加产业链位置标签、相关品种对比、产业链全景图
         */
        async function initLithiumDashboard() {
            console.log('[初始化] 开始加载锂电Dashboard...');
            
            try {
                // 1. 加载产业链配置文件
                console.log('[初始化] 加载产业链配置...');
                const chainResp = await fetch('data/industry_chain.json?v=' + HTML_VERSION);
                if (!chainResp.ok) {
                    throw new Error('无法加载产业链配置文件');
                }
                const chainConfig = await chainResp.json();
                const lithiumChain = chainConfig['锂电板块'];
                
                if (!lithiumChain) {
                    throw new Error('未找到锂电板块产业链配置');
                }
                
                console.log('[初始化] ✅ 产业链配置加载成功');
                
                // 2. 加载市场数据 + 图表历史数据（用于产业链节点价格）
                console.log('[初始化] 加载市场数据...');
                const timestamp = new Date().getTime();
                const [lcResp, lfpResp, lfpPowerResp, lfpStorageResp, lcFuturesResp, ironPhosResp, carbonateResp, oreResp, lepidoliteResp, lfpAllResp, ptFuturesResp, pdFuturesResp, iFuturesResp, egFuturesResp, automotiveResp, recyclingResp] = await Promise.allSettled([
                    fetch('reports/market_lc.json?t=' + timestamp),
                    fetch('reports/market_lfp.json?t=' + timestamp),
                    fetch('reports/lfp_power_history.json?t=' + timestamp),
                    fetch('reports/lfp_storage_history.json?t=' + timestamp),
                    fetch('reports/lc_futures_history.json?t=' + timestamp),
                    fetch('reports/iron_phosphate_history.json?t=' + timestamp),
                    fetch('data/carbonate_spot_price_merged.json?t=' + timestamp),
                    fetch('data/lithium_ore_price_history.json?t=' + timestamp),
                    fetch('data/lepidolite_price_history.json?t=' + timestamp),
                    fetch('reports/lfp_all_data.json?t=' + timestamp),
                    fetch('reports/pt_futures_history.json?t=' + timestamp),
                    fetch('reports/pd_futures_history.json?t=' + timestamp),
                    fetch('reports/i_futures_history.json?t=' + timestamp),
                    fetch('reports/eg_futures_history.json?t=' + timestamp),
                    fetch('embedded/automotive_embedded_data.js?t=' + timestamp),
                    fetch('embedded/recycling_embedded_data.js?t=' + timestamp)
                ]);

                let marketData = {};
                let chainHistoryData = {};  // 图表历史数据：节点名→{price, change_pct, unit}
                let cumulativeData = null;  // 添加：存储累积涨跌幅数据（局部变量，函数结束时赋值给window.cumulativeData）
                
                // 处理我的钢铁网数据
                if (lfpResp.status === 'fulfilled' && lfpResp.value.ok) {
                    const lfpData = await lfpResp.value.json();
                    marketData = lfpData.prices || {};
                    // 为每个品种添加 update_time 字段
                    const lfpUpdateTime = lfpData.update_time || '';
                    Object.keys(marketData).forEach(key => {
                        if (marketData[key] && typeof marketData[key] === 'object') {
                            marketData[key].update_time = lfpUpdateTime;
                        }
                    });
                    console.log('[初始化] ✅ 我的钢铁网数据加载成功');
                } else {
                    console.log('[初始化] ⚠️ 我的钢铁网数据加载失败');
                }
                
                // 处理碳酸锂期货数据
                if (lcResp.status === 'fulfilled' && lcResp.value.ok) {
                    const lcData = await lcResp.value.json();
                    const lcm = lcData.contracts?.find(c => c.name.includes('碳酸锂')) || lcData.contracts?.[0];
                    if (lcm) {
                        marketData['碳酸锂期货'] = {
                            price: lcm.price,
                            change_pct: lcm.change_pct,
                            update_time: lcData.update_time || ''
                        };
                        console.log('[初始化] ✅ 碳酸锂期货数据加载成功');
                    }
                } else {
                    console.log('[初始化] ⚠️ 碳酸锂期货数据加载失败');
                }
                
                // 计算累积涨跌幅数据（从各品种数据源实时计算，不再依赖 market_cumulative.json）
                try {
                    cumulativeData = { meta: { description: '2026年至今累计涨跌幅', data_source: '各产品源数据文件（实时计算）', update_time: '', year: 2026 }, products: [] };

                    function computeProduct(history, priceKey, name, unit, updateTime) {
                        if (!Array.isArray(history) || history.length < 2) return null;
                        const d26 = history.filter(d => d.date >= '2026-01-01');
                        if (d26.length < 2) return null;
                        const sp = parseFloat(d26[0][priceKey]);
                        const ep = parseFloat(d26[d26.length - 1][priceKey]);
                        if (sp <= 0) return null;
                        const ch = ep - sp;
                        const pct = ch / sp * 100;
                        if (updateTime > cumulativeData.meta.update_time) cumulativeData.meta.update_time = updateTime;
                        cumulativeData.products.push({
                            name, unit,
                            start_date: d26[0].date, end_date: d26[d26.length - 1].date,
                            start_price: sp, end_price: ep,
                            change: ch, change_pct: parseFloat(pct.toFixed(2)),
                            direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'stable',
                            data_points: d26.length
                        });
                        return true;
                    }

                    // 1.碳酸锂期货 lcFuturesResp
                    if (lcFuturesResp.status === 'fulfilled' && lcFuturesResp.value.ok) {
                        try { const d = await lcFuturesResp.value.clone().json(); computeProduct(d.history, 'close', '碳酸锂期货', '元/吨', d.update_time || ''); } catch(e) {}
                    }
                    // 2.电池级碳酸锂 carbonateResp.data.battery_grade
                    if (carbonateResp && carbonateResp.status === 'fulfilled' && carbonateResp.value.ok) {
                        try { const d = await carbonateResp.value.clone().json(); computeProduct(d.data.battery_grade, 'price', '电池级碳酸锂', '元/吨', d.update_time || ''); } catch(e) {}
                    }
                    // 3.工业级碳酸锂 carbonateResp.data.industrial_grade
                    if (carbonateResp && carbonateResp.status === 'fulfilled' && carbonateResp.value.ok) {
                        try { const d = await carbonateResp.value.clone().json(); computeProduct(d.data.industrial_grade, 'price', '工业级碳酸锂', '元/吨', d.update_time || ''); } catch(e) {}
                    }
                    // 4.磷酸铁锂动力 lfpPowerResp
                    if (lfpPowerResp.status === 'fulfilled' && lfpPowerResp.value.ok) {
                        try { const d = await lfpPowerResp.value.clone().json(); computeProduct(d.history, 'close', '磷酸铁锂(动力型)', '元/吨', d.update_time || ''); } catch(e) {}
                    }
                    // 5.磷酸铁锂储能 lfpStorageResp
                    if (lfpStorageResp.status === 'fulfilled' && lfpStorageResp.value.ok) {
                        try { const d = await lfpStorageResp.value.clone().json(); computeProduct(d.history, 'close', '磷酸铁锂(储能型)', '元/吨', d.update_time || ''); } catch(e) {}
                    }
                    // 6.磷酸铁 ironPhosResp
                    if (ironPhosResp.status === 'fulfilled' && ironPhosResp.value.ok) {
                        try { const d = await ironPhosResp.value.clone().json(); computeProduct(d.history, 'close', '磷酸铁', '元/吨', d.update_time || ''); } catch(e) {}
                    }
                    // 7.锂辉石 oreResp.history avg_price
                    if (oreResp && oreResp.status === 'fulfilled' && oreResp.value.ok) {
                        try { const d = await oreResp.value.clone().json(); computeProduct(d.history, 'avg_price', '锂辉石(5%)', '美元/吨', d.update_time || ''); } catch(e) {}
                    }
                    // 8.锂云母 lepidoliteResp.history avg_price
                    if (lepidoliteResp && lepidoliteResp.status === 'fulfilled' && lepidoliteResp.value.ok) {
                        try { const d = await lepidoliteResp.value.clone().json(); computeProduct(d.history, 'avg_price', '锂云母(2.0-2.5%)', '元/吨', d.update_time || ''); } catch(e) {}
                    }

                    cumulativeData.meta.generated_at = new Date().toISOString();
                    console.log('[初始化] ✅ 累积涨跌幅数据计算完成，共' + cumulativeData.products.length + '个品种');
                } catch (e) {
                    console.log('[初始化] ⚠️ 累积涨跌幅数据计算异常:', e.message);
                }
                
                // 处理图表历史数据，构建 chainHistoryData（磷酸铁锂产业链节点）
                // 计算环比（月环比）：当前最新价 vs 上月末最后一条数据
                function getMonthMoM(history, latestEntry) {
                    if (!latestEntry) return null;
                    const latestDate = latestEntry.date || '';
                    const latestMonth = latestDate.substring(0, 7); // 'YYYY-MM'
                    // 计算上月
                    const [y, m] = latestMonth.split('-');
                    const prevMonth = m === '01'
                        ? (parseInt(y) - 1) + '-12'
                        : y + '-' + String(parseInt(m) - 1).padStart(2, '0');
                    // 找上月末数据
                    let prevEntry = null;
                    for (let i = history.length - 2; i >= 0; i--) {
                        if (history[i].date.substring(0, 7) === prevMonth) {
                            prevEntry = history[i];
                            break;
                        }
                    }
                    if (!prevEntry) return null;
                    const latestClose = parseFloat(latestEntry.close) || 0;
                    const prevClose = parseFloat(prevEntry.close) || 0;
                    const mom = prevClose > 0 ? ((latestClose - prevClose) / prevClose * 100) : 0;
                    return { price: latestClose, change_pct: parseFloat(mom.toFixed(2)), unit: '元/吨', date: latestEntry.date, prevDate: prevEntry.date };
                }

                try {
                    const histRespList = [
                        { key: '磷酸铁锂', resp: lfpPowerResp },
                        { key: '磷酸铁锂（储能型）', resp: lfpStorageResp },
                        { key: '碳酸锂', resp: lcFuturesResp },
                        { key: '磷酸铁', resp: ironPhosResp }
                    ];
                    for (const item of histRespList) {
                        if (item.resp.status === 'fulfilled' && item.resp.value.ok) {
                            try {
                                const data = await item.resp.value.clone().json();
                                const history = data.history || [];
                                if (history.length >= 2) {
                                    const latest = history[history.length - 1];
                                    const momData = getMonthMoM(history, latest);
                                    if (momData) {
                                        chainHistoryData[item.key] = momData;
                                    }
                                }
                            } catch (e) {
                                console.log('[初始化] ⚠️ 图表历史数据解析异常: ' + item.key, e.message);
                            }
                        }
                    }
                    console.log('[初始化] ✅ chainHistoryData构建完成: ' + JSON.stringify(Object.keys(chainHistoryData)));
                } catch (e) {
                    console.log('[初始化] ⚠️ chainHistoryData构建异常:', e.message);
                }

                // 补充：铁矿石数据来自 iFuturesResp（月环比）
                if (iFuturesResp.status === 'fulfilled' && iFuturesResp.value.ok) {
                    try {
                        const iData = await iFuturesResp.value.clone().json();
                        const history = (iData.history || []).filter(d => d.date >= '2026-01-01');
                        if (history.length >= 2) {
                            const latest = history[history.length - 1];
                            const latestMonth = latest.date.substring(0, 7);
                            const [y, m] = latestMonth.split('-');
                            const prevMonth = m === '01' ? (parseInt(y) - 1) + '-12' : y + '-' + String(parseInt(m) - 1).padStart(2, '0');
                            let prevEntry = null;
                            for (let i = history.length - 2; i >= 0; i--) {
                                if (history[i].date.substring(0, 7) === prevMonth) { prevEntry = history[i]; break; }
                            }
                            if (prevEntry) {
                                const latestPrice = parseFloat(latest.close) || 0;
                                const prevPrice = parseFloat(prevEntry.close) || 0;
                                const mom = prevPrice > 0 ? ((latestPrice - prevPrice) / prevPrice * 100) : 0;
                                chainHistoryData['铁矿石'] = { price: latestPrice, change_pct: parseFloat(mom.toFixed(2)), unit: '元/吨', date: latest.date, prevDate: prevEntry.date };
                            }
                        }
                    } catch (e) { console.log('[初始化] ⚠️ 铁矿石数据解析异常:', e.message); }
                }

                // 补充：锂云母数据来自 lepidoliteResp（月环比）
                if (lepidoliteResp && lepidoliteResp.status === 'fulfilled' && lepidoliteResp.value.ok) {
                    try {
                        const lepData = await lepidoliteResp.value.clone().json();
                        const history = (lepData.history || []).filter(d => d.date >= '2026-01-01');
                        if (history.length >= 2) {
                            const latest = history[history.length - 1];
                            const latestMonth = latest.date.substring(0, 7);
                            const [y, m] = latestMonth.split('-');
                            const prevMonth = m === '01' ? (parseInt(y) - 1) + '-12' : y + '-' + String(parseInt(m) - 1).padStart(2, '0');
                            let prevEntry = null;
                            for (let i = history.length - 2; i >= 0; i--) {
                                if (history[i].date.substring(0, 7) === prevMonth) { prevEntry = history[i]; break; }
                            }
                            if (prevEntry) {
                                const latestPrice = parseFloat(latest.avg_price) || 0;
                                const prevPrice = parseFloat(prevEntry.avg_price) || 0;
                                const mom = prevPrice > 0 ? ((latestPrice - prevPrice) / prevPrice * 100) : 0;
                                chainHistoryData['锂云母'] = { price: latestPrice, change_pct: parseFloat(mom.toFixed(2)), unit: '元/吨', date: latest.date, prevDate: prevEntry.date };
                            }
                        }
                    } catch (e) { console.log('[初始化] ⚠️ 锂云母数据解析异常:', e.message); }
                }

                // 补充：锂辉石精矿数据来自 oreResp（锂辉石(5%)，月环比）
                if (oreResp && oreResp.status === 'fulfilled' && oreResp.value.ok) {
                    try {
                        const oreData = await oreResp.value.clone().json();
                        const history = (oreData.history || []).filter(d => d.date >= '2026-01-01');
                        if (history.length >= 2) {
                            const latest = history[history.length - 1];
                            const latestMonth = latest.date.substring(0, 7);
                            const [y, m] = latestMonth.split('-');
                            const prevMonth = m === '01' ? (parseInt(y) - 1) + '-12' : y + '-' + String(parseInt(m) - 1).padStart(2, '0');
                            let prevEntry = null;
                            for (let i = history.length - 2; i >= 0; i--) {
                                if (history[i].date.substring(0, 7) === prevMonth) { prevEntry = history[i]; break; }
                            }
                            if (prevEntry) {
                                const latestPrice = parseFloat(latest.avg_price) || 0;
                                const prevPrice = parseFloat(prevEntry.avg_price) || 0;
                                const mom = prevPrice > 0 ? ((latestPrice - prevPrice) / prevPrice * 100) : 0;
                                chainHistoryData['锂辉石(5%)'] = { price: latestPrice, change_pct: parseFloat(mom.toFixed(2)), unit: '美元/吨', date: latest.date, prevDate: prevEntry.date };
                                console.log('[初始化] ✅ 锂辉石精矿数据加载成功: price=' + latestPrice + ', mom=' + mom + '%');
                            }
                        }
                    } catch (e) { console.log('[初始化] ⚠️ 锂辉石精矿数据解析异常:', e.message); }
                }

                // 补充：磷矿石30%品位数据来自 lfp_all_data.json（磷酸盐价格sheet，月环比）
                if (lfpAllResp.status === 'fulfilled' && lfpAllResp.value.ok) {
                    try {
                        const lfpAllData = await lfpAllResp.value.json();
                        const phosphateTable = (lfpAllData.tables || []).find(t => t.table_name === '磷酸盐价格');
                        if (phosphateTable && phosphateTable.data && phosphateTable.data.length > 0) {
                            // 筛选磷矿石30%品位数据
                            const oreData = phosphateTable.data.filter(r => r['规格'] === '磷矿石30%品位');
                            if (oreData.length >= 2) {
                                // 按日期排序
                                oreData.sort((a, b) => a['日期'] > b['日期'] ? 1 : -1);
                                const latest = oreData[oreData.length - 1];
                                // 找上月最后一条数据
                                const latestMonth = (latest['日期'] || '').substring(0, 7);
                                const [y, m] = latestMonth.split('-');
                                const prevMonth = m === '01' ? (parseInt(y) - 1) + '-12' : y + '-' + String(parseInt(m) - 1).padStart(2, '0');
                                const prevData = oreData.filter(r => (r['日期'] || '').substring(0, 7) === prevMonth);
                                const prev = prevData[prevData.length - 1];
                                const latestPrice = parseFloat(latest['今日均价（万元/吨）']) || 0;
                                const prevPrice = prev ? (parseFloat(prev['今日均价（万元/吨）']) || 0) : 0;
                                const mom = prevPrice > 0 ? ((latestPrice - prevPrice) / prevPrice * 100) : 0;
                                chainHistoryData['磷矿石'] = {
                                    price: latestPrice * 10000, // 转为元/吨
                                    change_pct: parseFloat(mom.toFixed(2)),
                                    unit: '元/吨',
                                    date: (latest['日期'] || '').split(' ')[0],
                                    prevDate: prev ? prev['日期'].split(' ')[0] : ''
                                };
                                console.log('[初始化] ✅ 磷矿石30%品位数据加载成功: price=' + (latestPrice * 10000) + ', mom=' + mom + '%');
                            }
                        }

                        // 补充：硫酸亚铁来自 lfp_all_data.json（非磷原料价格表，月环比）
                        const feTable = (lfpAllData.tables || []).find(t => t.table_name === '非磷原料价格');
                        if (feTable && feTable.data && feTable.data.length > 0) {
                            const feData = feTable.data.filter(r => (r['规格'] || '').includes('硫酸亚铁'));
                            if (feData.length >= 2) {
                                feData.sort((a, b) => a['日期'] > b['日期'] ? 1 : -1);
                                const latest = feData[feData.length - 1];
                                const latestMonth = (latest['日期'] || '').substring(0, 7);
                                const [y, m] = latestMonth.split('-');
                                const prevMonth = m === '01' ? (parseInt(y) - 1) + '-12' : y + '-' + String(parseInt(m) - 1).padStart(2, '0');
                                const prevList = feData.filter(r => (r['日期'] || '').substring(0, 7) === prevMonth);
                                const prev = prevList[prevList.length - 1];
                                const latestPrice = parseFloat(latest['今日均价']) || 0;
                                const prevPrice = prev ? (parseFloat(prev['今日均价']) || 0) : 0;
                                const mom = prevPrice > 0 ? ((latestPrice - prevPrice) / prevPrice * 100) : 0;
                                chainHistoryData['硫酸亚铁'] = {
                                    price: latestPrice,
                                    change_pct: parseFloat(mom.toFixed(2)),
                                    unit: '元/吨',
                                    date: (latest['日期'] || '').split(' ')[0],
                                    prevDate: prev ? prev['日期'].split(' ')[0] : ''
                                };
                                console.log('[初始化] ✅ 硫酸亚铁数据加载成功: price=' + latestPrice + ', mom=' + mom + '%');
                            }
                        }
                    } catch (e) { console.log('[初始化] ⚠️ 磷矿石/硫酸亚铁数据解析异常:', e.message); }
                }

                // 补充：新能源车数据来自 automotive_embedded_data.js（新能源汽车销量—国内市场，月环比）
                if (automotiveResp && automotiveResp.status === 'fulfilled' && automotiveResp.value.ok) {
                    try {
                        const jsText = await automotiveResp.value.text();
                        const eqIdx = jsText.indexOf('=');
                        const braceStart = jsText.indexOf('{', eqIdx);
                        const braceEnd = jsText.lastIndexOf('}');
                        const jsonStr = jsText.substring(braceStart, braceEnd + 1);
                        const autoData = JSON.parse(jsonStr);
                        const autoTable = (autoData.tables || []).find(t => t.table_name.includes('新能源汽车销量'));
                        if (autoTable && autoTable.data && autoTable.data.length > 0) {
                            const byMonth = {};
                            autoTable.data.forEach(r => {
                                const month = (r['日期'] || '').substring(0, 7);
                                if (!byMonth[month] || r['日期'] > byMonth[month]['日期']) byMonth[month] = r;
                            });
                            const months = Object.keys(byMonth).sort();
                            if (months.length >= 2) {
                                const latest = byMonth[months[months.length - 1]];
                                const prev = byMonth[months[months.length - 2]];
                                const latestVal = parseFloat(latest['本期销量（万辆）']) || 0;
                                const prevVal = parseFloat(prev['本期销量（万辆）']) || 0;
                                const mom = prevVal > 0 ? ((latestVal - prevVal) / prevVal * 100) : 0;
                                chainHistoryData['新能源车'] = {
                                    price: latestVal,
                                    change_pct: parseFloat(mom.toFixed(2)),
                                    unit: '万辆',
                                    date: (latest['日期'] || '').split(' ')[0],
                                    prevDate: (prev['日期'] || '').split(' ')[0]
                                };
                                console.log('[初始化] ✅ 新能源车数据加载成功: price=' + latestVal + ', mom=' + mom + '%');
                            }
                        }
                    } catch (e) { console.log('[初始化] ⚠️ 新能源车数据解析异常:', e.message); }
                }

                // 补充：锂电池价格数据来自 recycling_embedded_data.js（锂电池价格-铁锂铝壳电池包，月环比）
                if (recyclingResp && recyclingResp.status === 'fulfilled' && recyclingResp.value.ok) {
                    try {
                        const jsText = await recyclingResp.value.text();
                        const eqIdx = jsText.indexOf('=');
                        const braceStart = jsText.indexOf('{', eqIdx);
                        const braceEnd = jsText.lastIndexOf('}');
                        const jsonStr = jsText.substring(braceStart, braceEnd + 1);
                        const recycleData = JSON.parse(jsonStr);
                        const batTable = (recycleData.tables || []).find(t => t.table_name === '锂电池价格-铁锂铝壳电池包');
                        if (batTable && batTable.data && batTable.data.length > 0) {
                            const byMonth = {};
                            batTable.data.forEach(r => {
                                const month = (r['日期'] || '').substring(0, 7);
                                if (!byMonth[month] || r['日期'] > byMonth[month]['日期']) byMonth[month] = r;
                            });
                            const months = Object.keys(byMonth).sort();
                            if (months.length >= 2) {
                                const latest = byMonth[months[months.length - 1]];
                                const prev = byMonth[months[months.length - 2]];
                                const latestVal = parseFloat(latest['今日均价']) || 0;
                                const prevVal = parseFloat(prev['今日均价']) || 0;
                                const mom = prevVal > 0 ? ((latestVal - prevVal) / prevVal * 100) : 0;
                                chainHistoryData['锂电池'] = {
                                    price: latestVal * 10000,
                                    change_pct: parseFloat(mom.toFixed(2)),
                                    unit: '元/吨',
                                    date: (latest['日期'] || '').split(' ')[0],
                                    prevDate: (prev['日期'] || '').split(' ')[0]
                                };
                                console.log('[初始化] ✅ 锂电池数据加载成功: price=' + (latestVal * 10000) + ', mom=' + mom + '%');
                            }
                        }
                    } catch (e) { console.log('[初始化] ⚠️ 锂电池数据解析异常:', e.message); }
                }

                // 计算有色金属板块累积涨跌幅数据（从各品种数据源实时计算）
                cumulativeDataMetals = null;
                try {
                    cumulativeDataMetals = { meta: { description: '有色金属2026年累计涨跌幅', data_source: '各产品源数据文件（实时计算）', update_time: '', year: 2026 }, products: [] };

                    function computeMetalsProduct(history, priceKey, name, unit, updateTime) {
                        if (!Array.isArray(history) || history.length < 2) return null;
                        const d26 = history.filter(d => d.date >= '2026-01-01');
                        if (d26.length < 2) return null;
                        const sp = parseFloat(d26[0][priceKey]);
                        const ep = parseFloat(d26[d26.length - 1][priceKey]);
                        if (sp <= 0) return null;
                        const ch = ep - sp;
                        const pct = ch / sp * 100;
                        if (updateTime && updateTime > cumulativeDataMetals.meta.update_time) cumulativeDataMetals.meta.update_time = updateTime;
                        cumulativeDataMetals.products.push({
                            name, unit,
                            start_date: d26[0].date, end_date: d26[d26.length - 1].date,
                            start_price: sp, end_price: ep,
                            change: ch, change_pct: parseFloat(pct.toFixed(2)),
                            direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'stable',
                            data_points: d26.length
                        });
                        return true;
                    }

                    // 1.铂期货主力 ptFuturesResp
                    if (ptFuturesResp && ptFuturesResp.status === 'fulfilled' && ptFuturesResp.value.ok) {
                        try { const d = await ptFuturesResp.value.clone().json(); computeMetalsProduct(d.history, 'close', '铂期货主力', '元/克', d.update_time || ''); } catch(e) {}
                    }
                    // 2.钯期货主力 pdFuturesResp
                    if (pdFuturesResp && pdFuturesResp.status === 'fulfilled' && pdFuturesResp.value.ok) {
                        try { const d = await pdFuturesResp.value.clone().json(); computeMetalsProduct(d.history, 'close', '钯期货主力', '元/克', d.update_time || ''); } catch(e) {}
                    }
                    // 3.铁矿石 iFuturesResp
                    if (iFuturesResp && iFuturesResp.status === 'fulfilled' && iFuturesResp.value.ok) {
                        try { const d = await iFuturesResp.value.clone().json(); computeMetalsProduct(d.history, 'close', '铁矿石', '元/吨', d.update_time || ''); } catch(e) {}
                    }
                    // 4.磷矿石 lfpAllResp (from lfp_all_data.json)
                    if (lfpAllResp && lfpAllResp.status === 'fulfilled' && lfpAllResp.value.ok) {
                        try {
                            const d = await lfpAllResp.value.clone().json();
                            const phosTable = (d.tables || []).find(t => t.table_name && t.table_name.includes('磷酸盐价格'));
                            if (phosTable && phosTable.data && phosTable.data.length >= 2) {
                                const phosHistory = phosTable.data
                                    .filter(r => r['日期'] && r['日期'] >= '2026-01-01')
                                    .map(r => ({
                                        date: r['日期'].split(' ')[0],
                                        price: parseFloat(r['今日均价（万元/吨）'] || 0) * 10000
                                    }))
                                    .filter(x => x.price > 0);
                                if (phosHistory.length >= 2) {
                                    computeMetalsProduct(phosHistory, 'price', '磷矿石', '元/吨', d.update_time || '');
                                }
                            }
                        } catch(e) { console.log('[初始化] ⚠️ 磷矿石数据解析异常:', e.message); }
                    }

                    cumulativeDataMetals.meta.generated_at = new Date().toISOString();
                    console.log('[初始化] ✅ 有色金属累积涨跌幅数据计算完成，共' + cumulativeDataMetals.products.length + '个品种');
                } catch (e) {
                    console.log('[初始化] ⚠️ 有色金属累积涨跌幅数据计算异常:', e.message);
                }

                console.log('[初始化] 最终chainHistoryData: ' + JSON.stringify(Object.keys(chainHistoryData)));
                console.log('[初始化] 市场数据: ' + JSON.stringify(Object.keys(marketData)));
                
                // 3. 更新页面数据
                updatePageData(lithiumChain, marketData);
                
                // 4. 添加产业链位置标签
                addChainPositionTags(lithiumChain, marketData);
                
                // 5. 添加累积涨跌幅甘特图（默认显示磷酸铁锂产业）
                addCumulativeBarsGantt(cumulativeData);
                
                // 设置默认Tab为磷酸铁锂产业
                var lfpTab = document.querySelector('.category-tab[data-subcategory="lfp"]');
                if (lfpTab) lfpTab.classList.add('active');
                
                // 6. 添加产业链全景图
                addChainFlowDiagram(lithiumChain, marketData, chainHistoryData);
                
                // 7. 隐藏其他图表（初始只显示甘特图+产业链全景图）
                document.querySelectorAll('#panel-lithium .mk-chart-grid').forEach(grid => {
                    grid.style.display = 'none';
                });
                
                console.log('[初始化] ✅ 全部完成！');
                
                // 显示市场行情监控区域（初始隐藏以避免闪烁）
                const marketDashboard = document.querySelector('.market-dashboard');
                if (marketDashboard) {
                    marketDashboard.classList.add('loaded');
                    console.log('[初始化] ✅ 市场行情监控区域已显示');
                }
                
                // 渲染有色金属甘特图（数据已在上面计算完成）
                renderSectorGantt('metals', 'gantt-chart-container-metals', cumulativeDataMetals);
                
                // 将局部累积涨跌幅数据赋值给全局变量，供 renderLithiumGantt 函数使用
                window.cumulativeData = cumulativeData;
                
                console.log('[初始化] ✅ 全部完成！');
                
                // 移除 loading 提示
                const loadingEl = document.querySelector('#gantt-chart-container .market-loading');
                if (loadingEl) {
                    loadingEl.remove();
                    console.log('[初始化] ✅ 已移除 loading 提示');
                }
            } catch (error) {
                console.log('[初始化] ❌ 错误: ' + error.message);
                console.error('[初始化] 错误:', error);
                
                // 即使失败，也尝试显示市场行情区域（避免永远空白）
                const marketDashboard = document.querySelector('.market-dashboard');
                if (marketDashboard) {
                    marketDashboard.classList.add('loaded');
                    console.log('[初始化] ⚠️ 市场行情监控区域已强制显示（错误处理）');
                }
                
                // 显示折线图作为后备（如果甘特图渲染失败）
                document.querySelectorAll('#panel-lithium .mk-chart-grid').forEach(grid => {
                    grid.style.display = 'grid';
                });
                console.log('[初始化] ⚠️ 已显示折线图作为后备');
            }
        }

function updatePageData(chainConfig, marketData) {
            console.log('[更新数据] 开始更新页面数据...');
            
            // 更新碳酸锂期货卡片
            const lcCard = document.getElementById('card-lc-futures');
            if (lcCard) {
                const lcData = marketData['碳酸锂期货'];
                if (lcData) {
                    // 更新价格
                    const priceEl = lcCard.querySelector('.chart-container');
                    if (priceEl) {
                        priceEl.innerHTML = '<div style="font-size:32px;font-weight:bold;color:#d32f2f;">' + 
                                           (lcData.price || '--') + ' <span style="font-size:16px;">元/吨</span></div>' +
                                           '<div style="font-size:18px;color:' + (lcData.change_pct > 0 ? '#d32f2f' : '#388e3c') + ';">' +
                                           (lcData.change_pct > 0 ? '↑' : '↓') + ' ' + (lcData.change_pct > 0 ? '+' : '') + 
                                           (lcData.change_pct || 0).toFixed(2) + '%</div>';
                    }
                    
                    // 更新时间
                    const timeEl = document.getElementById('lc-update-time');
                    if (timeEl && lcData.update_time) {
                        timeEl.textContent = lcData.update_time;
                    }
                }
            }
            
            // 更新电池级碳酸锂现货卡片
            const batteryCard = document.getElementById('card-battery-spot');
            if (batteryCard) {
                const batteryData = marketData['碳酸锂'];
                if (batteryData) {
                    // 更新价格
                    const priceEl = batteryCard.querySelector('.chart-container');
                    if (priceEl) {
                        priceEl.innerHTML = '<div style="font-size:32px;font-weight:bold;color:#1e88e5;">' + 
                                           (batteryData.price || '--') + ' <span style="font-size:16px;">元/吨</span></div>' +
                                           '<div style="font-size:18px;color:' + (batteryData.change_pct > 0 ? '#d32f2f' : '#388e3c') + ';">' +
                                           (batteryData.change_pct > 0 ? '↑' : '↓') + ' ' + (batteryData.change_pct > 0 ? '+' : '') + 
                                           (batteryData.change_pct || 0).toFixed(2) + '%</div>';
                    }
                    
                    // 更新时间
                    const timeEl = document.getElementById('battery-update-time');
                    if (timeEl && batteryData.update_time) {
                        timeEl.textContent = batteryData.update_time;
                    }
                }
            }
            
            // 更新全局更新时间
            const globalTimeEl = document.getElementById('lithium-update-time');
            if (globalTimeEl) {
                const now = new Date();
                globalTimeEl.textContent = now.toLocaleString('zh-CN');
            }
            
            console.log('[更新数据] ✅ 页面数据更新完成');
        }

        
        /**
         * 为每个图表卡片添加产业链位置标签和数据时效性标签
         */
        function addChainPositionTags(chainConfig, marketData) {
            console.log('[位置标签] 开始添加产业链位置标签...');
            
            // 遍历所有图表卡片
            document.querySelectorAll('.mk-chart-card').forEach(card => {
                const titleEl = card.querySelector('.chart-title-centered');
                if (!titleEl) return;
                
                const cardTitle = titleEl.textContent.trim();
                console.log('[位置标签] 检查卡片: ' + cardTitle);
                
                // 灵活的标题匹配（包含关键词即可）
                let nodeName = null;
                if (cardTitle.includes('碳酸锂期货') || cardTitle.includes('碳酸锂')) {
                    nodeName = '碳酸锂';
                } else if (cardTitle.includes('磷酸铁锂')) {
                    nodeName = '磷酸铁锂';
                } else {
                    return; // 不是锂电板块的卡片
                }
                
                console.log('[位置标签] 匹配到节点: ' + nodeName);
                
                // 查找当前节点在产业链中的位置
                const nodes = chainConfig.nodes;
                const currentNodeIndex = nodes.findIndex(n => n.id === nodeName || n.name === nodeName);
                if (currentNodeIndex === -1) {
                    console.log('[位置标签] ⚠️ 未找到节点: ' + nodeName);
                    return;
                }
                
                const currentNode = nodes[currentNodeIndex];
                // 用 edges 找上下游（替代线性索引，适配非链式结构）
                const edges = chainConfig.edges || [];
                const upstreamNodes = edges.filter(e => e.to === currentNode.id).map(e => nodes.find(n => n.id === e.from)).filter(Boolean);
                const downstreamNodes = edges.filter(e => e.from === currentNode.id).map(e => nodes.find(n => n.id === e.to)).filter(Boolean);

                // 不添加产业链位置标签（已按需求删除）
                
                // 不添加数据时效性标签（已按需求删除）
                
                console.log('[位置标签] ✅ 已添加标签到卡片: ' + cardTitle);
            });
        }
        
        /**
         * 添加相关品种对比条形图
         */
        function addComparisonBars(chainConfig, marketData) {
            // 计算时间区间（周度）
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const timeRange = weekAgo.toISOString().split('T')[0] + ' ~ ' + now.toISOString().split('T')[0];
            console.log('[对比图] 时间区间: ' + timeRange);
        
            console.log('[对比图] 开始添加相关品种对比...');
            
            // 找到锂电板块的最后一个图表卡片
            const lithiumPanel = document.getElementById('panel-lithium');
            if (!lithiumPanel) {
                console.log('[对比图] ⚠️ 未找到panel-lithium');
                return;
            }
            
            const lastCard = lithiumPanel.querySelector('.mk-chart-card:last-child');
            if (!lastCard) {
                console.log('[对比图] ⚠️ 未找到最后一个卡片');
                return;
            }
            
            // 准备对比数据（取同板块所有品种，过滤掉涨跌幅为0%的产品）
            const compareData = [];
            Object.entries(marketData).forEach(([name, data]) => {
                if (data.change_pct !== undefined && data.change_pct !== 0) {  // 只显示有真实涨跌幅数据的产品
                    compareData.push({
                        name: name,
                        change_pct: data.change_pct,
                        price: data.price || 0
                    });
                }
            });
            
            // 按涨跌幅排序
            compareData.sort((a, b) => b.change_pct - a.change_pct);
            
            // 生成HTML
            let barsHTML = '<div class="related-comparison">';
            barsHTML += '<div class="comparison-title">锂电板块日度涨跌幅排行 <span style="font-size:12px;color:#999;font-weight:normal;">(日度)</span></div>';
            barsHTML += '<div class="comparison-bars">';
            
            compareData.slice(0, 8).forEach(item => {
                const pct = item.change_pct;
                const absPct = Math.abs(pct);
                const width = Math.min(absPct * 3, 100);
                const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'stable';
                const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
                
                barsHTML += '<div class="bar-item">';
                barsHTML += '<span class="bar-name">' + item.name + '</span>';
                barsHTML += '<div class="bar-track">';
                barsHTML += '<div class="bar-fill ' + direction + '" style="width: ' + width + '%"></div>';
                barsHTML += '</div>';
                barsHTML += '<span class="bar-value ' + direction + '">' + arrow + ' ' + (pct > 0 ? '+' : '') + pct.toFixed(2) + '%</span>';
                barsHTML += '</div>';
            });
            
            barsHTML += '</div></div>';
            
            // 插入到最后一个卡片的底部
            lastCard.insertAdjacentHTML('beforeend', barsHTML);
            
            console.log('[对比图] ✅ 已添加对比图');
            
            // 添加数据来源标签
            const dataSourceInfo = {
                source: '',
                updateTime: ''
            };
            
            // 尝试从 marketData 中提取数据来源信息
            Object.values(marketData).forEach(item => {
                if (item && item.update_time && !dataSourceInfo.updateTime) {
                    dataSourceInfo.updateTime = item.update_time;
                }
            });
            
            const sourceLabel = document.createElement('div');
            sourceLabel.className = 'data-source-label';
            sourceLabel.style.cssText = 'margin-top: 15px; padding: 10px; background: rgba(248,255,251,0.7); backdrop-filter: blur(8px); border: 1px solid rgba(220,238,230,0.4); border-radius: 6px; font-size: 12px; color: #666; text-align: center;';
            sourceLabel.innerHTML = '📊 数据来源: AkShare-现货价格 | 更新时间: ' + (dataSourceInfo.updateTime || '未知');
            lastCard.appendChild(sourceLabel);
        }
        
        /**
         * 添加累积涨跌幅甘特图（2026年至今）
         */
        function addCumulativeBarsGantt(cumulativeData) {
            console.log('[甘特图] 开始添加累积涨跌幅甘特图...');
            
            if (!cumulativeData || !cumulativeData.products || cumulativeData.products.length === 0) {
                console.log('[甘特图] ⚠️ 无累积数据');
                return;
            }
            
            const ganttContainer = document.getElementById('gantt-chart-container');
            if (!ganttContainer) {
                console.log('[甘特图] ⚠️ 未找到gantt-chart-container');
                return;
            }
            
            // 生成甘特图HTML
            let ganttHTML = '<div class="cumulative-gantt">';
            ganttHTML += '<div class="gantt-title">磷酸铁锂产业2026年累计涨跌幅 <span style="font-size:12px;color:#999;font-weight:normal;">(' + (cumulativeData.meta.description || '2026年至今') + ')</span></div>';
            // 添加按钮组容器
            ganttHTML += '<div class="gantt-btn-group" id="ganttBtnGroup"></div>';
            
            // 找出最大涨跌幅（用于计算条形图宽度）
            let maxChangePct = 0;
            cumulativeData.products.forEach(p => {
                if (Math.abs(p.change_pct) > maxChangePct) maxChangePct = Math.abs(p.change_pct);
            });
            
            // 按涨跌幅降序排序（涨幅大的在前）
            cumulativeData.products.sort((a, b) => b.change_pct - a.change_pct);
            
            // 为每个产品生成一行
            cumulativeData.products.forEach(product => {
                const pct = product.change_pct;
                const absPct = Math.abs(pct);
                const width = maxChangePct > 0 ? (absPct / maxChangePct) * 80 : 0;
                const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'stable';
                const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
                const color = pct > 0 ? '#d32f2f' : pct < 0 ? '#388e3c' : '#999';
                
                // 检查数据是否完整（应从2026-01-01附近开始，到昨天附近结束）
                const dataComplete = product.start_date <= '2026-01-10' && product.end_date >= '2026-05-18';
                const warningIcon = dataComplete ? '' : ' ⚠️';
                const dateRange = product.start_date + ' ~ ' + product.end_date;
                
                ganttHTML += '<div class="gantt-row" data-product-name="' + product.name + '">';
                ganttHTML += '<span class="gantt-name">' + product.name + warningIcon + '</span>';
                ganttHTML += '<div class="gantt-bar-track">';
                ganttHTML += '<div class="gantt-bar ' + direction + '" data-target-width="' + width + '%" style="width: 0;">';
                ganttHTML += '<span class="gantt-bar-label"><span class="gantt-arrow">' + arrow + '</span> ' + (pct > 0 ? '+' : '') + pct.toFixed(2) + '%</span>';
                ganttHTML += '</div>';
                ganttHTML += '</div>';
                ganttHTML += '<span class="gantt-value" style="color:' + color + ';font-size:10px;">' + product.start_price.toLocaleString() + ' → ' + product.end_price.toLocaleString() + '<br><span style="color:#999;">(' + dateRange + ')</span></span>';
                ganttHTML += '</div>';
            });
            
            ganttHTML += '<div id="gantt-expand-area" style="display:none;margin-top:20px;"></div>';
            ganttHTML += '</div>';
            
            // 添加数据来源标签
            ganttHTML += '<div style="margin-top:10px;padding:8px;background:rgba(248,255,251,0.7);backdrop-filter:blur(8px);border:1px solid rgba(220,238,230,0.4);border-radius:4px;font-size:11px;color:#666;text-align:center;">📊 数据来源: ' + (cumulativeData.meta.data_source || '未知') + ' | 更新时间: ' + (cumulativeData.meta.update_time || '未知') + '</div>';
            
            ganttContainer.innerHTML = ganttHTML;
            
            // 触发条形增长动画
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    ganttContainer.querySelectorAll('.gantt-bar').forEach(bar => {
                        const targetWidth = bar.getAttribute('data-target-width');
                        if (targetWidth) {
                            bar.style.width = targetWidth;
                        }
                    });
                });
            });

            
            console.log('[甘特图] ✅ 已添加累积涨跌幅甘特图');
            
            // 生成按钮组
            generateGanttButtons(cumulativeData);
            
            // 绑定甘特图行点击事件（手风琴：同一时间只展开一个，支持再次点击收起）
            ganttContainer.querySelectorAll('.gantt-row').forEach(row => {
                row.style.cursor = 'pointer';
                row.addEventListener('click', function() {
                    const productName = this.getAttribute('data-product-name');
                    console.log('[甘特图] 点击行 productName=', productName);
                    
                    // 检查当前行是否已展开
                    if (this.classList.contains('active')) {
                        // 已展开，收起
                        this.classList.remove('active');
                        const area = document.getElementById('gantt-expand-area');
                        if (area) {
                            // 先添加退出动画
                            const card = area.querySelector('.mk-chart-card, .lc-futures-chart-wrapper, .lc-spot-chart-wrapper');
                            if (card) {
                                card.style.opacity = '0';
                                card.style.transform = 'translateY(20px)';
                                card.style.transition = 'opacity 0.3s, transform 0.3s';
                            }
                            // 延迟移除
                            setTimeout(() => {
                                area.style.display = 'none';
                                // 把移走的卡片移回来
                                if (card && card._origParent) {
                                    card._origParent.appendChild(card);
                                    card.style.display = '';
                                    card.style.opacity = '';
                                    card.style.transform = '';
                                    card.style.transition = '';
                                    card._origParent = null;
                                }
                                area.innerHTML = '';
                            }, 300);
                        }
                        console.log('[甘特图] 收起行 productName=', productName);
                        return;
                    }
                    
                    // 手风琴：先关闭已展开的行
                    ganttContainer.querySelectorAll('.gantt-row.active').forEach(r => {
                        r.classList.remove('active');
                        // 同时收起对应的展开区域
                        const area = document.getElementById('gantt-expand-area');
                        if (area) {
                            area.style.display = 'none';
                            const card = area.querySelector('.mk-chart-card, .lc-futures-chart-wrapper, .lc-spot-chart-wrapper');
                            if (card && card._origParent) {
                                card._origParent.appendChild(card);
                                card.style.display = '';
                                card._origParent = null;
                            }
                            area.innerHTML = '';
                        }
                    });
                    
                    this.classList.add('active');
                    // 在展开区域渲染对应图表
                    showProductChart(productName);
                });
            });
        }
        
        // 将addCumulativeBarsGantt函数暴露到全局作用域，供renderLithiumGantt函数调用
        window.addCumulativeBarsGantt = addCumulativeBarsGantt;
        
        /**
         * 生成甘特图按钮组
         * 按钮设计：品种名称 + 涨跌幅标签，按涨跌幅降序排列
         */
        function generateGanttButtons(cumulativeData) {
            console.log('[generateGanttButtons] 开始生成按钮组...');
            const btnGroup = document.getElementById('ganttBtnGroup');
            if (!btnGroup) {
                console.error('[generateGanttButtons] 未找到 ganttBtnGroup');
                return;
            }
            btnGroup.innerHTML = '';
            
            // 按涨跌幅降序排列
            const sortedProducts = [...cumulativeData.products].sort((a, b) => b.change_pct - a.change_pct);
            
            sortedProducts.forEach(product => {
                const btn = document.createElement('button');
                btn.className = `gantt-btn ${product.change_pct >= 0 ? 'up' : 'down'}`;
                btn.setAttribute('data-product', product.name);
                
                // 只保留品种名称，不显示涨跌幅和箭头
                btn.innerHTML = `<span class="product-name">${product.name}</span>`;
                
                // Hover事件：高亮甘特图对应行
                btn.addEventListener('mouseenter', function() {
                    highlightGanttRow(product.name);
                });
                
                btn.addEventListener('mouseleave', function() {
                    unhighlightGanttRow(product.name);
                });
                
                // 点击事件：选中并联动
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    selectGanttProduct(product.name);
                });
                
                btnGroup.appendChild(btn);
            });
            
            console.log('[generateGanttButtons] ✅ 按钮组已生成，共', sortedProducts.length, '个按钮');
        }
        
        /**
         * 高亮甘特图行（Hover按钮时）
         */
        function highlightGanttRow(productName) {
            const row = document.querySelector(`.gantt-row[data-product-name="${productName}"]`);
            if (row && !row.classList.contains('active')) {
                row.classList.add('hover');
            }
        }
        
        /**
         * 取消高亮甘特图行
         */
        function unhighlightGanttRow(productName) {
            const row = document.querySelector(`.gantt-row[data-product-name="${productName}"]`);
            if (row && !row.classList.contains('active')) {
                row.classList.remove('hover');
            }
        }
        
        /**
         * 选中甘特图品种（点击按钮或行时）
         */
        function selectGanttProduct(productName) {
            console.log('[selectGanttProduct] 选中品种：', productName);
            
            // 移除所有选中态
            document.querySelectorAll('.gantt-btn.active').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.gantt-row.active').forEach(r => {
                r.classList.remove('active');
                r.classList.remove('hover');
            });
            
            // 添加新选中态
            const btn = document.querySelector(`.gantt-btn[data-product="${productName}"]`);
            const row = document.querySelector(`.gantt-row[data-product-name="${productName}"]`);
            
            if (btn) btn.classList.add('active');
            if (row) row.classList.add('active');
            
            // 联动：展开图表区域
            showProductChart(productName);
        }
        
        /**
         * 在甘特图下方展开区域显示对应品种的走势图表
         * 手风琴模式：同一时间只展开一个品种
         */
        function showProductChart(productName) {
            console.log('[showProductChart] productName=', productName);
            const area = document.getElementById('gantt-expand-area');
            if (!area) { console.error('[showProductChart] 未找到 gantt-expand-area'); return; }
            area.style.display = 'block';

            // 产品名关键词 → SVG容器ID 映射
            const svgMap = [
                { keyword: '碳酸锂期货', svgId: 'lcFuturesChart' },
                { keyword: '电池级碳酸锂', svgId: 'batteryChart' },
                { keyword: '工业级碳酸锂', svgId: 'industrialChart' },
                { keyword: '磷酸铁锂', svgId: 'lfpDualChart' },
                { keyword: '磷酸铁', svgId: 'fpChart' },
                { keyword: '锂辉石', svgId: 'lithiumOreChart' },
                { keyword: '锂云母', svgId: 'lepidoliteChart' },
                { keyword: 'WTI原油', svgId: 'wtiFuturesChart' },
                { keyword: '尿素期货', svgId: 'urFuturesChart' },
                { keyword: '铁矿石', svgId: 'iFuturesChart' },
                { keyword: '磷矿石', svgId: 'phosphateChart' },
            ];

            // 根据产品名匹配SVG ID
            let targetSvgId = null;
            for (const item of svgMap) {
                if (productName.includes(item.keyword)) {
                    targetSvgId = item.svgId;
                    break;
                }
            }

            if (!targetSvgId) {
                area.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">未找到 [' + productName + '] 对应的图表配置，请联系开发</div>';
                console.error('[showProductChart] 未找到匹配 svgId, productName=', productName);
                return;
            }

            // 找到原始SVG元素，然后找到其父卡片
            const originalSvg = document.getElementById(targetSvgId);
            if (!originalSvg) {
                area.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">未找到SVG元素: ' + targetSvgId + '</div>';
                console.error('[showProductChart] 未找到SVG元素, svgId=', targetSvgId);
                return;
            }

            // 找到卡片元素（.mk-chart-card 或 .lc-futures-chart-wrapper）
            const card = originalSvg.closest('.mk-chart-card') || originalSvg.closest('.lc-futures-chart-wrapper') || originalSvg.closest('.lc-spot-chart-wrapper');
            if (!card) {
                area.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">未找到图表卡片元素</div>';
                console.error('[showProductChart] 未找到卡片元素, svgId=', targetSvgId);
                return;
            }

            // 手风琴：先把之前移动到展开区域的卡片移回原位置（必须在 area.innerHTML 之前！）
            const prevCard = area.querySelector('.mk-chart-card, .lc-futures-chart-wrapper, .lc-spot-chart-wrapper');
            if (prevCard && prevCard._origParent) {
                prevCard._origParent.appendChild(prevCard);
                prevCard.style.display = '';
                prevCard._origParent = null;
            }

            // 记录原始父节点（仅第一次移动时记录）
            if (!card._origParent) card._origParent = card.parentNode;

            // 清空展开区域，移入新卡片
            area.innerHTML = '';
            area.appendChild(card);
            card.style.display = 'block';
            
            // 触发折线绘制动画（CSS动画接管，这里只设置--line-len和--line-i变量）
            setTimeout(() => {
                const svgEl = card.querySelector('svg');
                if (!svgEl) { console.warn('[折线动画] 未找到SVG'); return; }
                const deepLines = Array.from(svgEl.querySelectorAll('.deep-line-anim'));
                console.log('[折线动画] 找到深色动画线数量:', deepLines.length, '，设置CSS变量--line-len/--line-i');
                deepLines.forEach((lineEl, i) => {
                    try {
                        let len = 10000;
                        if (typeof lineEl.getTotalLength === 'function') {
                            let tmp = lineEl.getTotalLength();
                            if (tmp && tmp > 0) len = tmp;
                        }
                        lineEl.style.setProperty('--line-len', len);
                        lineEl.style.setProperty('--line-i', i);
                        lineEl.setAttribute('stroke-dasharray', len);
                        lineEl.setAttribute('stroke-dashoffset', len);
                    } catch(e) { console.warn('[折线动画] 设置变量失败:', e); }
                });
            }, 200);
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

            console.log('[showProductChart] ✅ 已移动卡片到展开区域, svgId=', targetSvgId);

            // 触发图表重新渲染（卡片已移到可见区域，SVG应有宽度）
            const renderMap = {
                'iFuturesChart': 'renderIChart',
                'phosphateChart': 'renderPhosphateChart',
                'lcFuturesChart': 'renderLcFuturesChart',
                'batteryChart': 'renderBatteryChart',
                'industrialChart': 'renderIndustrialChart',
                'lfpDualChart': 'renderLfpDualChart',
                'fpChart': 'renderFpChart',
                'lithiumOreChart': 'renderLithiumOreChart',
                'lepidoliteChart': 'renderLepidoliteChart',
                'wtiFuturesChart': 'renderWtiFuturesChart',
                'urFuturesChart': 'renderUrFuturesChart',
            };
            const renderFnName = renderMap[targetSvgId];
            if (renderFnName && typeof window[renderFnName] === 'function') {
                setTimeout(() => {
                    try {
                        window[renderFnName]();
                        console.log('[showProductChart] ✅ 已触发重新渲染:', renderFnName);
                    } catch(e) {
                        console.warn('[showProductChart] ⚠️ 重新渲染失败:', renderFnName, e);
                    }
                }, 250);
            } else {
                console.log('[showProductChart] ℹ️ 未找到渲染函数 for svgId=', targetSvgId, ', renderFnName=', renderFnName);
            }

            // 滚动到展开区域，让图表完整可见
            setTimeout(() => {
                area.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 800);
            
        }

        /**
         * 添加产业链全景图（分组层级布局）
         * 上游/中游/下游分块展示，每块内多行并行链条
         */
        function addChainFlowDiagram(chainConfig, marketData, chainHistoryData) {
            console.log('[产业链图] 开始添加产业链全景图...');

            const chainFlowEl = document.getElementById('chain-flow');
            if (!chainFlowEl) {
                console.log('[产业链图] ⚠️ 未找到chain-flow元素');
                return;
            }

            // 节点→数据库映射
            const nodeDbMap = {
                '锂辉石精矿':  { url: 'carbonate_data_v2.html',   label: '碳酸锂数据库' },
                '锂云母':      { url: 'carbonate_data_v2.html',   label: '碳酸锂数据库' },
                '磷矿石':      { url: 'lfp_data_v2.html#phosphate',      label: '磷酸铁锂数据库' },
                '铁矿石':      { url: null,                       label: null },
                '硫酸亚铁':    { url: null,                       label: null },
                '磷酸铁':      { url: 'lfp_data_v2.html',          label: '磷酸铁锂数据库' },
                '碳酸锂':      { url: 'carbonate_data_v2.html',   label: '碳酸锂数据库' },
                '磷酸铁锂':    { url: 'lfp_data_v2.html',          label: '磷酸铁锂数据库' },
                '锂电池':      { url: 'lib_battery_data_v2.html', label: '锂电池数据库' },
                '新能源车':    { url: 'automotive_data_v2.html',  label: '汽车行业数据库' }
            };

            // 格式化价格（自动选择万/千/元单位）
            function formatPrice(price, unit) {
                if (!price && price !== 0) return '--';
                if (price >= 10000) {
                    return (price / 10000).toFixed(price >= 100000 ? 2 : 3) + '万' + (unit || '');
                } else if (price >= 1000) {
                    return (price / 1000).toFixed(2) + '千' + (unit || '');
                } else {
                    return price.toFixed(2) + (unit || '');
                }
            }

            // 查找节点数据（优先用chainHistoryData，fallback用marketData）
            function findNodeData(nodeName) {
                // 优先：从图表历史数据取最新鲜的数据
                if (chainHistoryData && chainHistoryData[nodeName]) {
                    return chainHistoryData[nodeName];
                }
                // Fallback：从marketData取（通过别名匹配）
                if (!nodeName) return null;
                if (marketData[nodeName]) return marketData[nodeName];
                const keys = Object.keys(marketData);
                for (const key of keys) {
                    if (nodeName.includes(key) || key.includes(nodeName)) return marketData[key];
                }
                const aliasMap = {
                    '锂辉石精矿': ['锂辉石(5%)', '锂辉石'],
                    '碳酸锂': ['电池级碳酸锂', '工业级碳酸锂', '碳酸锂期货'],
                    '锂云母': ['锂云母矿', '云母精矿', '宜春锂云母'],
                    '硫酸亚铁': ['铁源', '氧化铁'],
                    '新能源车': ['新能源汽车'],
                    '锂电池': ['锂电池电芯', '锂电池（电芯/电池包）']
                };
                const aliases = aliasMap[nodeName];
                if (aliases) {
                    for (const alias of aliases) {
                        // 先在 chainHistoryData 中精确查找（支持锂辉石精矿→锂辉石(5%)等映射）
                        if (chainHistoryData && chainHistoryData[alias]) {
                            console.log('[findNodeData] ' + nodeName + ' → 别名命中 chainHistoryData[' + alias + ']');
                            return chainHistoryData[alias];
                        }
                        // chainHistoryData 模糊匹配
                        if (chainHistoryData) {
                            const chainKeys = Object.keys(chainHistoryData);
                            for (const ck of chainKeys) {
                                if (ck.includes(alias) || alias.includes(ck)) {
                                    console.log('[findNodeData] ' + nodeName + ' → 模糊命中 chainHistoryData[' + ck + '] via alias ' + alias);
                                    return chainHistoryData[ck];
                                }
                            }
                        }
                        if (marketData[alias]) return marketData[alias];
                        for (const key of keys) {
                            if (key.includes(alias)) return marketData[key];
                        }
                    }
                }
                console.log('[findNodeData] ' + nodeName + ' → 完全未命中，返回null');
                return null;
            }

            // 渲染单个节点HTML
            function renderNode(nodeName) {
                const nodeData = findNodeData(nodeName);
                const hasData = nodeData && (nodeData.price !== undefined || nodeData.close !== undefined);
                const dbInfo = nodeDbMap[nodeName] || {};
                const dbUrl = dbInfo.url;

                // 提取price
                let price = null;
                if (nodeData) {
                    price = nodeData.price || nodeData.close;
                }

                let html = '<div class="chain-node ' + (hasData ? 'has-data' : 'no-data') + '">';
                // 节点名称（可点击则加链接）
                if (dbUrl) {
                    html += '<a href="' + dbUrl + '" target="_self" class="chain-node-name链" title="' + (dbInfo.label || '') + '">' + nodeName + '</a>';
                } else {
                    html += '<div class="chain-node-name">' + nodeName + '</div>';
                }

                if (hasData && price !== null) {
                    const unit = nodeData.unit || '元/吨';
                    html += '<div class="chain-node-price">' + formatPrice(price, unit) + '</div>';
                    const pct = nodeData.change_pct || 0;
                    const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
                    html += '<div class="chain-node-change ' + (pct > 0 ? 'up' : pct < 0 ? 'down' : '') + '">';
                    html += arrow + ' ' + (pct > 0 ? '+' : '') + pct.toFixed(2) + '% <span style="font-size:9px;color:#999;">月环比</span>';
                    html += '</div>';
                    // 数据库跳转按钮
                    if (dbUrl) {
                        html += '<a href="' + dbUrl + '" target="_self" class="chain-db-btn" title="' + (dbInfo.label || '查看详情') + '">📊</a>';
                    }
                } else {
                    html += '<div style="color:#bbb;font-size:10px;">暂无数据</div>';
                    if (dbUrl) {
                        html += '<a href="' + dbUrl + '" target="_self" class="chain-db-btn" title="' + (dbInfo.label || '查看详情') + '">📊</a>';
                    }
                }

                html += '</div>';
                return html;
            }

            let flowHTML = '<div class="chain-flow-main">';
            const display = chainConfig.display;

            if (display && display.levels) {
                // 新分组层级布局
                display.levels.forEach((level, levelIndex) => {
                    flowHTML += '<div class="chain-level" style="background:' + (level.bgColor || 'rgba(248,255,251,0.8)') + '; backdrop-filter: blur(8px); border: 1px solid rgba(220,238,230,0.4);">';
                    flowHTML += '<div class="chain-level-label">' + level.label + '</div>';
                    flowHTML += '<div class="chain-level-body">';

                    (level.chains || []).forEach(chain => {
                        flowHTML += '<div class="chain-row">';
                        for (let i = 0; i < chain.length; i++) {
                            const item = chain[i];
                            if (item === '→' || item === '+') {
                                flowHTML += '<span class="chain-connector-symbol">' + item + '</span>';
                            } else {
                                flowHTML += renderNode(item);
                            }
                        }
                        flowHTML += '</div>';
                    });

                    flowHTML += '</div></div>';
                    
                    // 上中下游之间加向右箭头
                    if (levelIndex < display.levels.length - 1) {
                        flowHTML += '<div class="chain-level-arrow">→</div>';
                    }
                });

                console.log('[产业链图] ✅ 已添加产业链全景图（分组层级布局）');
            } else {
                // 回退：旧线性布局（兼容）
                const nodes = chainConfig.nodes || [];
                flowHTML += '<div class="chain-row">';
                nodes.forEach((node, index) => {
                    flowHTML += renderNode(node.name);
                    if (index < nodes.length - 1) {
                        flowHTML += '<span class="chain-connector-symbol">→</span>';
                    }
                });
                flowHTML += '</div>';
                console.log('[产业链图] ⚠️ 使用旧线性布局（无display配置）');
            }

            flowHTML += '</div>';
            chainFlowEl.innerHTML = flowHTML;

            // 添加数据来源标签
            const chainDataSourceInfo = { updateTime: '' };
            Object.values(marketData).forEach(item => {
                if (item && item.update_time && !chainDataSourceInfo.updateTime) {
                    chainDataSourceInfo.updateTime = item.update_time;
                }
            });

            const chainSourceLabel = document.createElement('div');
            chainSourceLabel.className = 'data-source-label';
            chainSourceLabel.style.cssText = 'width: 100%; margin-top: 15px; padding: 10px; background: rgba(248,255,251,0.7); backdrop-filter: blur(8px); border: 1px solid rgba(220,238,230,0.4); border-radius: 6px; font-size: 12px; color: #666; text-align: center;';
            chainSourceLabel.innerHTML = '📊 数据来源: AkShare-现货价格 | 更新时间: ' + (chainDataSourceInfo.updateTime || '未知');
            chainFlowEl.appendChild(chainSourceLabel);
        }
        
        /**
         * 计算数据时效性
         */
        function getDataFreshness(updateTimeStr) {
            if (!updateTimeStr) return 'stale';
            
            const updateTime = new Date(updateTimeStr);
            const now = new Date();
            const hoursDiff = (now - updateTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 1) return 'fresh';
            if (hoursDiff < 24) return 'warning';
            return 'stale';
        }

        
        /**
         * 显示市场详情
         */
        function showMarketDetail(type) {
            console.log('显示市场详情:', type);
            // 这里可以打开详情弹窗或跳转到详情页
            // 目前通过卡片悬停已经显示详细信息
        }

        // ============================================================
        // 打开报告弹窗（支持动态数据 + hardcoded fallback）
        // ============================================================

        function getReportData(deptId) {
            // 优先用动态数据
            if (dynamicReportData && dynamicReportData[deptId]) {
                console.log('[getReportData] ✓ 命中 dynamicReportData[' + deptId + '], content长度=' + dynamicReportData[deptId].content.length);
                return dynamicReportData[deptId];
            }
            // fallback 到硬编码数据
            console.warn('[getReportData] ✗ dynamicReportData无数据，fallback: reportData[' + deptId + ']=' + (!!reportData[deptId]));
            return reportData[deptId] || null;
        }
        function openReport(deptId, autoPlay = false) {
            
            const data = getReportData(deptId);
            
            if (!data) {
                // 无数据时显示友好提示
                document.getElementById('modalBody').innerHTML =
                    '<div style="text-align:center;padding:40px;color:#999">' +
                    '<div style="font-size:48px;margin-bottom:16px">📭</div>' +
                    '<div>该事业部今日暂无早报数据</div>' +
                    '<div style="font-size:13px;margin-top:8px">请运行 python daily_briefing_search.py 生成当日数据</div>' +
                    '</div>';
                document.getElementById('modalTitle').textContent = (deptId.toUpperCase()) + ' 事业部早报';
                document.getElementById('modalDate').textContent =
                    CURRENT_REPORT_DATE.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1 年 $2 月 $3 日');
                document.getElementById('reportModal').classList.add('active');
                document.body.classList.add('report-modal-open');
                document.body.style.overflow = 'hidden';
                return;
            }

            const dateDisplay = (data.date || CURRENT_REPORT_DATE)
                .replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1 年 $2 月 $3 日');
            const modalTitleText = (data.title || '').endsWith('事业部') ? (data.title + '早报') : (data.title + '事业部早报');
            document.getElementById('modalTitle').textContent = modalTitleText;
            document.getElementById('modalDate').textContent = dateDisplay;

            let contentHtml = data.content;
            console.log('[openReport] deptId=' + deptId + ', contentHtml前1000字符=', contentHtml.substring(0, 1000));
            console.log('[openReport] deptId=' + deptId + ', contentHtml后500字符=', contentHtml.substring(contentHtml.length - 500));
            
            if (autoPlay) {
                contentHtml += '<div class="auto-play-controls" id="autoPlayControls" style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #f0f0f0;">';
                contentHtml += '<button class="control-btn" onclick="previousDept()">◀ 上一个</button>';
                contentHtml += '<button class="control-btn" id="pauseBtn" onclick="togglePause()">暂停</button>';
                contentHtml += '<button class="control-btn" onclick="nextDept()">下一个 ▶</button>';
                contentHtml += '<button class="control-btn" onclick="stopAutoPlay()">停止播放</button>';
                contentHtml += '</div>';
            }

            // 强制覆盖：确保 modalBody 有白底，hy-item 样式由 CSS class 控制（不能用 inline display:none，否则展开失效）
            const modalBody = document.getElementById('modalBody');
            modalBody.style.cssText = 'background:#fff;padding:30px;min-height:200px;';
            modalBody.innerHTML = contentHtml;

            // 只覆盖字体、颜色、间距等非 display 属性，不碰 display（由 CSS .expanded 控制展开）
            setTimeout(() => {
                document.querySelectorAll('#modalBody .hy-item').forEach(el => {
                    el.style.cssText = 'background:#f8f9fa;border-radius:10px;padding:14px 18px;margin-bottom:10px;border:1px solid #e8ecf0;border-left:4px solid #1e3c72;cursor:pointer;';
                });
                document.querySelectorAll('#modalBody .hy-item-title').forEach(el => {
                    el.style.cssText = 'font-size:15px;font-weight:bold;color:#1a2a3a;line-height:1.4;display:flex;align-items:flex-start;gap:8px;';
                });
                document.querySelectorAll('#modalBody .hy-item-body').forEach(el => {
                    // 注意：不设置 display，CSS .hy-item-body{display:none} + .expanded{display:block} 控制展开
                    el.style.cssText = 'font-size:14px;color:#555;line-height:1.85;margin-top:10px;padding-top:10px;border-top:1px solid #e8ecf0;';
                });
                document.querySelectorAll('#modalBody .item-num').forEach(el => {
                    el.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;background:#1e3c72;color:#fff;border-radius:50%;font-size:11px;font-weight:bold;flex-shrink:0;';
                });
                document.querySelectorAll('#modalBody .hy-item-expand-icon').forEach(el => {
                    el.style.cssText = 'margin-left:auto;font-size:12px;color:#999;';
                });
                document.querySelectorAll('#modalBody .report-section-title').forEach(el => {
                    el.style.cssText = 'font-size:16px;font-weight:bold;color:#1e3c72;padding:12px 0 8px 0;border-bottom:2px solid #1e3c72;margin-bottom:12px;';
                });
            }, 50);

            document.getElementById('reportModal').classList.add('active');
                document.body.classList.add('report-modal-open');
                document.body.style.overflow = 'hidden';
                
                if (autoPlay) {
                startAutoPlay();
            }
        }
        
        // 关闭报告弹窗
        function closeReport() {
            console.log('closeReport() called');
            try {
                stopAutoPlay();
                document.getElementById('reportModal').classList.remove('active');
                document.body.classList.remove('report-modal-open');
                document.body.style.overflow = 'auto';
            } catch(e) { console.error('Error closing report:', e); }
        }
        
        // 一键启动所有报告
        function startAllReports() {
            openAllBuModal();
        }
        
        // 开始自动播放
        function startAutoPlay() {
            if (autoPlayTimer) clearInterval(autoPlayTimer);
            if (progressTimer) clearInterval(progressTimer);
            
            autoPlayTimer = setInterval(() => {
                if (!isPaused) {
                    nextDept();
                }
            }, autoPlayDuration);
            
            let progress = 0;
            const progressBar = document.getElementById('progressBar');
            progressTimer = setInterval(() => {
                if (!isPaused) {
                    progress += 100 / (autoPlayDuration / 100);
                    progressBar.style.width = progress + '%';
                    if (progress >= 100) {
                        progress = 0;
                    }
                }
            }, 100);
        }
        
        // 下一个事业部
        function nextDept() {
            currentDeptIndex = (currentDeptIndex + 1) % deptList.length;
            openReport(deptList[currentDeptIndex], true);
        }
        
        // 上一个事业部
        function previousDept() {
            currentDeptIndex = (currentDeptIndex - 1 + deptList.length) % deptList.length;
            openReport(deptList[currentDeptIndex], true);
        }
        
        // 切换暂停/继续
        function togglePause() {
            isPaused = !isPaused;
            const btn = document.getElementById('pauseBtn');
            if (isPaused) {
                btn.textContent = '继续';
                btn.classList.add('active');
                document.getElementById('progressBar').style.opacity = '0.5';
            } else {
                btn.textContent = '暂停';
                btn.classList.remove('active');
                document.getElementById('progressBar').style.opacity = '1';
            }
        }
        
        // 停止自动播放
        function stopAutoPlay() {
            if (autoPlayTimer) clearInterval(autoPlayTimer);
            if (progressTimer) clearInterval(progressTimer);
            autoPlayTimer = null;
            progressTimer = null;
            const pb = document.getElementById('progressBar');
            if (pb) pb.style.width = '0%';
            const apc = document.getElementById('autoPlayControls');
            if (apc) apc.style.display = 'none';
        }
        

        // ============================================================
        // 全员晨会全览弹窗
        // ============================================================

        // 打开全览弹窗
        function openAllBuModal() {
            const modal = document.getElementById('allbuModal');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            renderAllBuOverview();
        }

        // 关闭全览弹窗
        function closeAllBuModal() {
            document.getElementById('allbuModal').classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        // 渲染9个BU的卡片
        function renderAllBuOverview() {
            const grid = document.getElementById('allbuGrid');
            const dateEl = document.getElementById('allbuModalDate');
            if (!grid) return;

            // 更新日期
            if (dateEl) {
                const d = CURRENT_REPORT_DATE.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1 年 $2 月 $3 日');
                dateEl.textContent = d;
            }

            // 检查数据是否已加载（最多等5秒，每200ms轮询一次）
            if (!dynamicReportData) {
                grid.innerHTML = '<div class="allbu-card-loading">⏳ 正在加载早报数据，请稍候...</div>';
                let waited = 0;
                const check = setInterval(() => {
                    waited += 200;
                    if (dynamicReportData) {
                        clearInterval(check);
                        _doRenderAllBu();
                    } else if (waited >= 5000) {
                        clearInterval(check);
                        grid.innerHTML = '<div class="allbu-card-loading">⚠️ 数据加载超时，请刷新重试</div>';
                    }
                }, 200);
                return;
            }
            _doRenderAllBu();
        }

const BU_LOGOS = {
            'lubricant': 'img/inline_img_44670402.png',
            'kelan': 'img/inline_img_74665931.png',
            'czly': 'img/inline_img_90174708.png',
            'lpsd': 'img/inline_img_16107537.png',
            'sdmd': 'img/inline_img_54202343.png',
            'sjl': 'img/inline_img_19524085.png',
            'bych': 'img/inline_img_90897435.png',
            'felt': 'img/inline_img_88504164.png',
            'dkhx': 'img/inline_img_83224104.png'
        };

        function _doRenderAllBu() {
            const grid = document.getElementById('allbuGrid');
            if (!grid) return;

            console.log('[_doRenderAllBu] dynamicReportData keys:', dynamicReportData ? Object.keys(dynamicReportData) : 'NULL');

            const buList = ['lubricant','czly','lpsd','sdmd','sjl','bych','kelan','felt','dkhx'];
            const buNames = {
                lubricant:'润滑油', kelan:'可兰素', czly:'常州锂源', lpsd:'龙蟠时代',
                sdmd:'山东美多', sjl:'三金锂电', bych:'铂源催化',
                felt:'法恩莱特', dkhx:'迪克化学'
            };

            let html = '';
            for (const id of buList) {
                const d = dynamicReportData[id];
                if (!d) {
                    // 数据完全不存在时，显示占位卡片
                    console.log('[_doRenderAllBu] Missing data for:', id);
                    html += `<div class="allbu-card ${id}" onclick="enterDeptFromAllBu('${id}')">
                        <div class="allbu-card-top">
                            <img class="allbu-card-logo" src="${BU_LOGOS[id] || ''}" alt="${buNames[id] || id}" />
                            <div class="allbu-card-title-wrap">
                                <div class="allbu-card-name">${buNames[id] || id}</div>
                            </div>
                        </div>
                        <div class="allbu-card-body">
                            <div class="allbu-card-no-data">暂无早报数据</div>
                        </div>
                    </div>`;
                    continue;
                }

                // 提取 topnews 今日要报（最多3条）：只展示标题，短语形式紧凑排列
                const topnewsSec = (d.sections || []).find(s => s.dim === 'topnews');
                let topnewsItems = [];
                if (topnewsSec) {
                    // 优先使用 items 字段（如果存在）
                    if (topnewsSec.items && topnewsSec.items.length > 0) {
                        topnewsItems = topnewsSec.items.slice(0, 3);
                    } else if (topnewsSec.content) {
                        // 如果没有 items 字段，从 content 解析条目
                        // 按 \n\n 分割条目，每条取第一行作为标题
                        const itemsRaw = topnewsSec.content.split(/\n\n+/).map(s => s.trim()).filter(s => s);
                        topnewsItems = itemsRaw.slice(0, 3).map(item => ({
                            title: item.split('\n')[0].trim()
                        }));
                    }
                }
                let topnewsHtml = '';
                
                // 优先使用 topnews 内容，如果为空则使用 lead_judgment 作为后备
                if (topnewsItems.length > 0) {
                    for (let i = 0; i < topnewsItems.length; i++) {
                        const item = topnewsItems[i];
                        const t = (item.title || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                        topnewsHtml += `<div class="allbu-topnews-item">
  <div class="allbu-topnews-title">${i + 1}. ${t}</div>
</div>`;
                    }
                } else if (d.lead_judgment || d.lead) {
                    // sections 为空时，使用 lead_judgment 或 lead 作为"今日关注"内容
                    const lj = (d.lead_judgment || d.lead || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                    topnewsHtml = `<div class="allbu-topnews-item">
  <div class="allbu-topnews-title">${lj}</div>
</div>`;
                }

                html += `<div class="allbu-card ${id}" onclick="enterDeptFromAllBu('${id}')">` +
                    `<div class="allbu-card-top">` +
                        `<img class="allbu-card-logo" src="${BU_LOGOS[id] || ''}" alt="${buNames[id] || id}" />` +
                        `<div class="allbu-card-title-wrap">` +
                            `<div class="allbu-card-name">${buNames[id] || id}</div>` +
                        `</div>` +
                    `</div>` +
                    `<div class="allbu-card-body">` +
                        (topnewsHtml ? topnewsHtml : `<div class="allbu-card-no-data">${d.lead_judgment || d.lead || '今日暂无数据'}</div>`) +
                    `</div>` +
                `</div>`;
            }
            grid.innerHTML = html;

            // BU 门禁过滤
            if (typeof window.applyBUFilter === 'function') {
                setTimeout(function() { window.applyBUFilter('#allbuGrid'); }, 50);
            }
        }

        // 从全览卡片进入单个BU轮播
        function enterDeptFromAllBu(deptId) {
            closeAllBuModal();
            currentDeptIndex = deptList.indexOf(deptId);
            if (currentDeptIndex < 0) currentDeptIndex = 0;
            openReport(deptList[currentDeptIndex], true);
        }

        // ============================================================
        // 早报工具栏功能
        // ============================================================
        
        /**
         * 切换目录显示
         */
        function toggleTOC() {
            const toc = document.getElementById('reportTOC');
            toc.classList.toggle('active');
            if (toc.classList.contains('active')) {
                generateTOC();
            }
        }
        
        /**
         * 生成目录
         */
        function generateTOC() {
            const modalBody = document.getElementById('modalBody');
            const sections = modalBody.querySelectorAll('.report-section-title');
            const tocList = document.getElementById('tocList');
            
            tocList.innerHTML = '';
            sections.forEach((section, index) => {
                const text = section.textContent.trim();
                const li = document.createElement('li');
                li.className = 'toc-item';
                li.textContent = text;
                li.onclick = () => {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // 高亮当前章节
                    document.querySelectorAll('.toc-item').forEach(item => item.classList.remove('active'));
                    li.classList.add('active');
                };
                tocList.appendChild(li);
            });
        }
        
        /**
         * 改变字体大小
         */
        function changeFontSize(size) {
            const modalContent = document.querySelector('.modal-content');
            if (!modalContent) return;
            modalContent.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
            modalContent.classList.add(size);
        }
        
        /**
         * 打印早报
         */
        function printReport() {
            const printWindow = window.open('', '_blank');
            const modalTitle = document.getElementById('modalTitle').textContent;
            const modalDate = document.getElementById('modalDate').textContent;
            const modalBody = document.getElementById('modalBody').innerHTML;
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${modalTitle} - ${modalDate}</title>
                    <style>
                        body { font-family: 'Microsoft YaHei', sans-serif; padding: 40px; }
                        h1 { color: var(--text-main); border-bottom: 2px solid var(--text-main); padding-bottom: 10px; }
                        .date { color: #666; margin-bottom: 20px; }
                        .section { margin-bottom: 25px; }
                        .section-title { color: var(--text-main); font-size: 18px; font-weight: bold; margin-bottom: 12px; }
                        .item { background: var(--bg-mint); padding: 12px; border-radius: 8px; margin-bottom: 10px; }
                        .item-title { font-weight: bold; margin-bottom: 6px; }
                        .item-content { color: #666; line-height: 1.6; }
                    
        /* ── BU矩阵样式 ── */

        :root {
            --linen-signal: #D5A858;
            --linen-ink: #0AA66A;
            --linen-raised: #F8FFFB;

            --navy: #075236;
            --gold: #D5A858;
            --gold-light: #F0D080;
            --cream: #F8FFFB;
            --panel-bg: rgba(248,255,251,0.97);
            --panel-surface: rgba(255,255,255,0.85);
            --panel-border: var(--line-green);
            --panel-text: var(--text-main);
            --panel-muted: rgba(7,83,54,0.4);
            --panel-accent: var(--text-main);
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Noto Sans SC', 'Microsoft YaHei', 'PingFang SC', Arial, sans-serif;
            min-height: 100vh;
            background: linear-gradient(135deg, #EFF8F2 0%, #DCEEE6 50%, #C8E8D8 100%);
            overflow-x: hidden;
            color: var(--panel-text);
        }

        /* ── 科技感背景 ── */
        .bg-atmo {
            position: fixed; top: 0; left: 0; right: 0; height: 30%;
            z-index: 0; pointer-events: none;
            background:
                radial-gradient(ellipse 70% 50% at 50% -5%, rgba(10,166,106,0.08) 0%, transparent 70%),
                radial-gradient(ellipse 50% 35% at 80% 0%, rgba(21,185,129,0.06) 0%, transparent 60%);
        }

        /* ── 页面容器 ── */
        .page-content {
            position: relative; z-index: 10;
            max-width: 1300px; margin: 0 auto;
            padding: 24px 20px 60px;
        }
        .matrix-grid {
            display: grid;
            grid-template-columns: 1fr 1.3fr 1fr;
            gap: 24px;
            align-items: stretch;
            transform-style: preserve-3d;
            perspective: 1500px;
        }

        /* ── 面板通用样式 ── */
        .matrix-panel {
            background: rgba(248,255,251,0.88);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 20px;
            padding: 28px 24px;
            position: relative;
            overflow: hidden;
            transform-style: preserve-3d;
            cursor: pointer;
        }
        .matrix-panel::before,
        .matrix-panel::after {
            content: ''; position: absolute; top: 0; bottom: 0;
            width: 20%; z-index: 1; pointer-events: none;
        }
        .matrix-panel::before {
            left: 0;
            background: linear-gradient(90deg, rgba(7,83,54,0.08), rgba(7,83,54,0.02), transparent);
            transform-origin: left center;
            transform: rotateY(-8deg) scaleX(1.1);
            border-radius: 20px 0 0 20px;
        }
        .matrix-panel::after {
            right: 0;
            background: linear-gradient(90deg, transparent, rgba(7,83,54,0.02), rgba(7,83,54,0.06));
            transform-origin: right center;
            transform: rotateY(8deg) scaleX(1.1);
            border-radius: 0 20px 20px 0;
        }
        .panel-glow-top {
            position: absolute; top: -1px; left: 10%; right: 10%;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--brand-tech), transparent);
            box-shadow: 0 0 15px var(--brand-tech);
            z-index: 4;
        }
        .panel-shadow {
            position: absolute; bottom: -20px; left: 10%; right: 10%;
            height: 30px;
            background: radial-gradient(ellipse at 50% 0%, rgba(10,166,106,0.25), transparent 70%);
            border-radius: 50%; z-index: -1;
        }
        .page-edge {
            position: absolute; top: 5%; bottom: 5%; width: 1px;
            background: linear-gradient(180deg, transparent, rgba(10,166,106,0.25), transparent);
            z-index: 2;
        }
        .page-edge-left { left: 0; box-shadow: 2px 0 10px rgba(10,166,106,0.15); }
        /* ── 动画关键帧 ── */
        @keyframes slideInLeft {
            0% { opacity: 0; transform: perspective(1000px) rotateY(5deg) translateX(-100px) scale(0.9); }
            100% { opacity: 1; transform: perspective(1000px) rotateY(5deg) translateX(-10px) scale(1); }
        }
        @keyframes slideInRight {
            0% { opacity: 0; transform: perspective(1000px) rotateY(-5deg) translateX(100px) scale(0.9); }
            100% { opacity: 1; transform: perspective(1000px) rotateY(-5deg) translateX(10px) scale(1); }
        }
        @keyframes fadeInScale {
            0% { opacity: 0; transform: perspective(1000px) scale(0.95); }
            50% { transform: perspective(1000px) scale(1.03); }
            100% { opacity: 1; transform: perspective(1000px) scale(1.02); }
        }
        @keyframes slideOutLeft {
            0% { opacity: 1; transform: perspective(1000px) rotateY(5deg) translateX(-10px); }
            100% { opacity: 0; transform: perspective(1000px) rotateY(5deg) translateX(-100px) scale(0.9); }
        }
        @keyframes slideOutRight {
            0% { opacity: 1; transform: perspective(1000px) rotateY(-5deg) translateX(10px); }
            100% { opacity: 0; transform: perspective(1000px) rotateY(-5deg) translateX(100px) scale(0.9); }
        }

        /* ── 面板内部卡片容器 ── */
        .panel-inner { position: relative; z-index: 2; }
        .panel-section-title {
            font-size: 0.65rem; font-weight: 600; color: rgba(7,63,49,0.45);
            letter-spacing: 1px; margin-bottom: 14px;
            padding-bottom: 6px;
        }

        /* ── BU 卡片（保留原有logo+名称样式）── */
        .bu-card {
            background: rgba(248,255,251,0.88);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(220,238,230,0.5);
            border-radius: 14px;
            padding: 16px 14px 12px;
            cursor: pointer;
            transition: all 0.35s cubic-bezier(0.25,0.46,0.45,0.94);
            position: relative;
            overflow: hidden;
            margin-bottom: 12px;
            -webkit-user-select: none; user-select: none;
        }
        .bu-card::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2.5px;
            background: linear-gradient(90deg, transparent, var(--card-accent), transparent);
            opacity: 0; transition: opacity 0.3s;
        }
        .bu-card:hover {
            border-color: rgba(10,166,106,0.28);
            box-shadow: 0 8px 28px rgba(10,166,106,0.12), 0 0 0 1px rgba(10,166,106,0.08);
            background: rgba(255,255,255,0.98);
        }
        .bu-card:hover::before { opacity: 1; }
        .bu-card::after {
            content: ''; position: absolute; top: -40px; right: -40px;
            width: 100px; height: 100px;
            background: radial-gradient(circle, rgba(10,166,106,0.12) 0%, transparent 70%);
            opacity: 0; transition: opacity 0.4s; pointer-events: none;
        }
        .bu-card:hover::after { opacity: 0.3; }

        /* Logo + 公司名（保留原有样式）*/
        .card-logo-wrap { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .card-logo-placeholder {
            width: 48px; height: 48px; border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-size: 0.78rem; font-weight: 800; flex-shrink: 0; letter-spacing: 0.5px;
        }
        .card-logo-img {
            width: 48px; height: 48px; border-radius: 10px;
            object-fit: contain; flex-shrink: 0;
            filter: drop-shadow(0 2px 4px rgba(7,83,54,0.1));
            transition: filter 0.3s;
        }
        .bu-card:hover .card-logo-img { filter: drop-shadow(0 2px 8px rgba(10,166,106,0.25)); }
        .card-name-block { flex: 1; min-width: 0; }
        .card-fullname {
            font-size: 0.88rem; font-weight: 800; color: var(--text-main);
            margin-bottom: 2px; letter-spacing: 0.3px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .card-tag {
            display: inline-block; padding: 2px 8px; border-radius: 20px;
            font-size: 0.58rem; font-weight: 600;
            background: rgba(7,83,54,0.04); border: 1px solid var(--line-green);
            color: var(--card-accent);
        }
        .card-glow-line {
            height: 1.5px; width: 20px;
            background: linear-gradient(90deg, var(--card-accent), transparent);
            border-radius: 2px; margin-bottom: 6px; opacity: 0.5;
        }
        .card-meta {
            font-size: 0.62rem; color: rgba(7,83,54,0.35); line-height: 1.5;
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .hover-progress {
            position: absolute; bottom: 0; left: 0; height: 2px;
            width: 0%; background: var(--card-accent);
            transition: none; opacity: 0.85;
        }
        .card-hint {
            position: absolute; top: 8px; right: 8px; font-size: 0.55rem;
            color: rgba(7,83,54,0.25); opacity: 0; transform: scale(0.85);
            transition: opacity 0.3s; white-space: nowrap;
        }
        .bu-card:hover .card-hint { opacity: 1; transform: scale(1); }

        /* ── 五边形布局（新能源面板内部）── */
        .pentagon-wrap {
            position: relative; width: 100%; height: 360px;
        }
        .pos-center    { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); z-index: 5; }
        .pos-top-left   { position: absolute; left: 0; top: 0; z-index: 3; }
        .pos-top-right  { position: absolute; right: 0; top: 0; z-index: 3; }
        .pos-bottom-left { position: absolute; left: 0; bottom: 0; z-index: 3; }
        .pos-bottom-right { position: absolute; right: 0; bottom: 0; z-index: 3; }
        .pos-center .bu-card { min-width: 130px; }
        .pos-top-left .bu-card, .pos-top-right .bu-card,
        .pos-bottom-left .bu-card, .pos-bottom-right .bu-card { min-width: 120px; }

        /* ── 右侧滑入面板（保留全部原有功能）── */
        .panel-overlay { position: fixed; inset: 0; z-index: 10001; pointer-events: none; }
        .panel-overlay.active { pointer-events: all; }
        .panel-backdrop {
            position: absolute; inset: 0;
            background: rgba(180,200,230,0.55);
            -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
            opacity: 0; transition: opacity 0.4s ease;
        }
        .panel-overlay.active .panel-backdrop { opacity: 1; }
        .panel-drawer {
            position: absolute; top: 0; right: 0; bottom: 0;
            width: 640px; max-width: 98vw;
            background: var(--panel-bg);
            border-left: 1px solid var(--panel-border);
            -webkit-backdrop-filter: blur(20px) saturate(150%);
            backdrop-filter: blur(20px) saturate(150%);
            box-shadow: -12px 0 48px rgba(7,83,54,0.15), 0 0 0 1px rgba(7,83,54,0.05);
            transform: translateX(100%);
            transition: transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            display: flex; flex-direction: column; overflow: hidden;
            border-radius: 18px 0 0 18px;
        }
        .panel-overlay.active .panel-drawer { transform: translateX(0); }
        .drawer-topbar {
            display: flex; align-items: center; justify-content: space-between;
            padding: 16px 24px;
            border-bottom: 1px solid var(--panel-border);
            flex-shrink: 0;
            background: var(--panel-surface);
            backdrop-filter: blur(12px);
        }
        .drawer-bu-info { display: flex; align-items: center; gap: 14px; }
        .drawer-logo-img {
            width: 44px; height: 44px; border-radius: 10px; object-fit: contain;
            background: rgba(7,83,54,0.05); border: 1.5px solid rgba(7,83,54,0.1);
            padding: 4px; flex-shrink: 0;
        }
        .drawer-logo-placeholder {
            width: 44px; height: 44px; border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            font-size: 0.85rem; font-weight: 800;
            background: rgba(7,83,54,0.05); border: 1.5px solid rgba(7,83,54,0.1);
            flex-shrink: 0; letter-spacing: 0.5px;
        }
        #drawerLogoWrap { display: flex; align-items: center; }
        .drawer-name { font-family: 'Noto Serif SC', serif; font-size: 1.1rem; font-weight: 700; color: var(--panel-text); }
        .drawer-tag {
            display: inline-block; padding: 2px 10px; border-radius: 20px;
            font-size: 0.62rem; font-weight: 600;
            color: var(--panel-accent);
            background: rgba(7,83,54,0.05); border: 1px solid rgba(7,83,54,0.1);
            margin-top: 3px;
        }
        .drawer-close {
            background: rgba(7,83,54,0.04); border: 1px solid var(--line-green);
            border-radius: 8px; width: 34px; height: 34px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; color: var(--panel-muted); font-size: 0.9rem; transition: all 0.2s;
        }
        .drawer-close:hover { background: rgba(7,83,54,0.1); color: var(--panel-text); border-color: rgba(7,83,54,0.2); }
        .drawer-topbar-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .drawer-detail-btn {
            background: rgba(248,255,251,0.88); border: 1px solid rgba(220,238,230,0.5);
            border-radius: 8px; padding: 0 14px; height: 34px;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; color: #c8462c; font-size: 0.8rem; font-weight: 600;
            transition: all 0.2s; white-space: nowrap; letter-spacing: 0.5px;
        }
        .drawer-detail-btn:hover { background: #c8462c; color: var(--text-main); border-color: #c8462c; }
        .drawer-body {
            flex: 1; overflow-y: auto; overflow-x: hidden;
            scrollbar-width: thin; scrollbar-color: rgba(7,83,54,0.12) transparent;
        }
        .drawer-body::-webkit-scrollbar { width: 4px; }
        .drawer-body::-webkit-scrollbar-thumb { background: rgba(7,83,54,0.12); border-radius: 2px; }

        /* ── 综合评分区 ── */
        .hexa-summary {
            background: var(--panel-surface);
            border-bottom: 1px solid var(--panel-border);
            padding: 18px 24px;
            display: flex; align-items: center; gap: 20px;
            backdrop-filter: blur(12px);
        }
        .hexa-score-block { text-align: center; flex-shrink: 0; }
        .hexa-score-num {
            font-family: 'Playfair Display', serif;
            font-size: 2.4rem; font-weight: 700;
            background: linear-gradient(135deg, var(--text-main), var(--brand-tech));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text; line-height: 1;
        }
        .hexa-score-label { font-size: 0.62rem; color: var(--panel-muted); margin-top: 3px; letter-spacing: 0.05em; }
        .hexa-divider { width: 1px; height: 48px; background: var(--panel-border); flex-shrink: 0; }
        .hexa-grade {
            font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700;
            line-height: 1; margin-bottom: 4px;
        }
        .hexa-grade-label { font-size: 0.62rem; color: var(--panel-muted); }
        .hexa-meta { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .hexa-meta-row { display: flex; align-items: center; gap: 8px; }
        .hexa-meta-key { font-size: 0.65rem; color: var(--panel-muted); width: 44px; flex-shrink: 0; }
        .hexa-meta-val { font-size: 0.72rem; font-weight: 600; color: var(--panel-text); }
        .hexa-badge {
            display: inline-block; padding: 2px 10px; border-radius: 12px;
            font-size: 0.6rem; font-weight: 700; letter-spacing: 0.05em;
        }

        /* ── 主内容区：雷达 + 维度 ── */
        .hexa-main { display: flex; gap: 0; padding: 20px 0; }
        .hexa-radar-col {
            width: 220px; flex-shrink: 0;
            display: flex; flex-direction: column; align-items: center; gap: 12px;
            padding: 0 16px;
            border-right: 1px solid var(--panel-border);
        }
        .hexa-radar-wrap { width: 190px; height: 190px; position: relative; }
        .hexa-legend { width: 100%; display: flex; flex-direction: column; gap: 4px; }
        .hexa-leg-item {
            display: flex; align-items: center; gap: 6px;
            font-size: 0.6rem; color: var(--panel-muted);
        }
        .hexa-leg-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .hexa-rank-note { font-size: 0.6rem; color: var(--panel-muted); text-align: center; margin-top: 4px; }

        /* ── 历史叠加/卡片区 ── */
        .hexa-historical-bar { width: 100%; display: flex; align-items: center; gap: 8px; }
        .hexa-historical-label { font-size: 0.6rem; color: var(--panel-muted); white-space: nowrap; }
        .hexa-historical-check { display: flex; flex-wrap: wrap; gap: 4px; }
        .hexa-historical-check label { display: flex; align-items: center; gap: 3px; font-size: 0.6rem; cursor: pointer; color: var(--panel-muted); }
        .hexa-historical-check input[type="checkbox"] { width: 10px; height: 10px; cursor: pointer; accent-color: var(--panel-accent,var(--text-main)); }
        .hexa-historical-cards { width: 100%; display: flex; gap: 6px; overflow-x: auto; padding: 4px 0 2px; scrollbar-width: thin; }
        .hexa-historical-card { flex-shrink: 0; width: 60px; cursor: pointer; border: 1px solid rgba(7,83,54,0.1); border-radius: 8px; padding: 5px 3px; text-align: center; background: rgba(240,245,255,0.5); transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s; }
        .hexa-historical-card:hover { border-color: rgba(10,166,106,0.35); box-shadow: 0 2px 8px var(--line-green); }
        .hexa-historical-card.active-card { border-color: rgba(10,166,106,0.5); background: rgba(230,242,255,0.9); box-shadow: 0 2px 10px rgba(10,166,106,0.12); }
        .hexa-hist-card-month { font-size: 0.55rem; color: var(--panel-muted); }
        .hexa-hist-card-dims { font-size: 0.5rem; line-height: 1.4; color: rgba(7,83,54,0.5); margin-top: 2px; }
        .hexa-hist-card-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-bottom: 2px; }
        .hexa-historical-section-title { font-size: 0.65rem; font-weight: 600; color: rgba(7,83,54,0.5); padding: 8px 16px 2px; }
        .hexa-historical-hint { font-weight: 400; color: rgba(7,83,54,0.25); font-size: 0.55rem; margin-left: 6px; }
        .hist-card-current-tag { font-size: 0.45rem; background: var(--text-main); color: var(--text-main); border-radius: 8px; padding: 1px 4px; margin-left: 3px; vertical-align: middle; }

        .hexa-dims-col {
            flex: 1; padding: 0 20px;
            display: flex; flex-direction: column; gap: 8px;
            overflow-y: auto; max-height: calc(100vh - 300px);
        }
        .hexa-dim-row {
            border-radius: 8px; overflow: hidden;
            border: 1px solid var(--line-green);
            background: rgba(240,245,255,0.6);
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .hexa-dim-row:hover { border-color: rgba(10,166,106,0.25); box-shadow: 0 2px 8px rgba(7,83,54,0.05); }
        .hexa-dim-row.open { border-color: rgba(10,166,106,0.35); background: rgba(230,242,255,0.8); box-shadow: 0 2px 12px var(--line-green); }
        .hexa-dim-header {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 14px; cursor: pointer;
        }
        .hexa-dim-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .hexa-dim-num { font-size: 0.62rem; color: var(--panel-muted); font-weight: 600; width: 22px; flex-shrink: 0; }
        .hexa-dim-name { font-size: 0.78rem; color: var(--panel-text); flex: 1; font-weight: 500; white-space: nowrap; }
        .hexa-dim-weight { font-size: 0.62rem; color: var(--panel-muted); margin-right: 4px; }
        .hexa-dim-bar-wrap { flex: 1; max-width: 100px; height: 5px; background: rgba(7,83,54,0.05); border-radius: 3px; overflow: hidden; }
        .hexa-dim-bar { height: 100%; border-radius: 3px; transition: width 0.6s cubic-bezier(0.34,1.2,0.64,1); }
        .hexa-dim-score { font-size: 0.85rem; font-weight: 700; color: var(--panel-text); width: 30px; text-align: right; flex-shrink: 0; }
        .hexa-dim-pts { font-size: 0.65rem; color: var(--panel-muted); width: 36px; text-align: right; flex-shrink: 0; }
        .hexa-dim-chevron { color: var(--panel-muted); transition: transform 0.25s; flex-shrink: 0; font-size: 0.65rem; }
        .hexa-dim-row.open .hexa-dim-chevron { transform: rotate(180deg); }
        .hexa-dim-kpi { display: none; padding: 0 14px 12px 44px; }
        .hexa-dim-row.open .hexa-dim-kpi { display: block; }
        .hexa-kpi-item {
            display: flex; align-items: center; gap: 8px;
            padding: 7px 10px; margin-bottom: 4px;
            background: rgba(7,83,54,0.04); border-radius: 6px;
        }
        .hexa-kpi-name { font-size: 0.7rem; color: var(--panel-muted); flex: 1; }
        .hexa-kpi-bar-wrap { width: 60px; height: 4px; background: rgba(7,83,54,0.05); border-radius: 2px; overflow: hidden; }
        .hexa-kpi-bar { height: 100%; border-radius: 2px; }
        .hexa-kpi-score { font-size: 0.68rem; font-weight: 600; color: var(--panel-text); width: 22px; text-align: right; flex-shrink: 0; }

        /* ── 全部BU横向排名 ── */
        .hexa-all-section { padding: 16px 24px 24px; border-top: 1px solid var(--panel-border); }
        .hexa-all-title {
            font-size: 0.65rem; font-weight: 600; color: var(--panel-muted);
            letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px;
        }
        .hexa-all-bars { display: flex; flex-direction: column; gap: 6px; }
        .hexa-all-row { display: flex; align-items: center; gap: 10px; font-size: 0.7rem; }
        .hexa-all-rank { color: var(--panel-muted); width: 18px; text-align: right; flex-shrink: 0; font-weight: 600; }
        .hexa-all-name { color: var(--panel-text); width: 70px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hexa-all-bar-wrap { flex: 1; height: 6px; background: rgba(7,83,54,0.05); border-radius: 3px; overflow: hidden; }
        .hexa-all-bar { height: 100%; border-radius: 3px; transition: width 0.8s cubic-bezier(0.34,1.2,0.64,1); }
        .hexa-all-score { color: var(--panel-muted); width: 30px; text-align: right; flex-shrink: 0; font-weight: 600; }
        .hexa-all-row.current .hexa-all-name { color: var(--text-main); font-weight: 700; }
        .hexa-all-row.current .hexa-all-score { color: var(--text-main); font-weight: 700; }

        /* ── 快捷入口 ── */
        .hexa-actions { padding: 0 24px 20px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .hexa-action-btn {
            display: flex; align-items: center; justify-content: center; gap: 5px;
            padding: 9px 10px; border-radius: 8px; font-size: 0.72rem; font-weight: 600;
            cursor: pointer; text-decoration: none; transition: all 0.2s; border: 1px solid;
        }
        .hexa-action-pri { background: var(--line-green); border-color: rgba(7,83,54,0.15); color: var(--text-main); }
        .hexa-action-pri:hover { background: rgba(7,83,54,0.12); }
        .hexa-action-sec { background: rgba(7,83,54,0.04); border-color: var(--line-green); color: var(--panel-muted); }
        .hexa-action-sec:hover { background: var(--line-green); color: var(--panel-text); }

        /* ── KPI目标vs达成对比表 ── */
        .kpi-compare {
            padding: 16px 24px;
            border-top: 1px solid var(--panel-border);
        }
        .kpi-compare-title {
            font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 12px;
        }
        .kpi-compare-table {
            width: 100%; border-collapse: collapse; font-size: 12px;
        }
        .kpi-compare-table th {
            background: var(--bg-mint); padding: 7px 10px; text-align: center; font-weight: 600; color: #555;
            border-bottom: 2px solid var(--line-green); font-size: 11px;
        }
        .kpi-compare-table td {
            padding: 7px 10px; text-align: center; border-bottom: 1px solid var(--line-green);
        }
        .kpi-compare-table .kpi-name { text-align: left; font-weight: 600; color: #1a1a2e; }
        .kpi-compare-table .kpi-actual { font-weight: 700; }
        .kpi-compare-table .kpi-over { color: #27ae60; }
        .kpi-compare-table .kpi-under { color: #e74c3c; }
        .kpi-compare-badge {
            display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700;
        }
        .kpi-compare-badge.exceed { background: #e8f5e9; color: #2e7d32; }
        .kpi-compare-badge.meet { background: #e3f2fd; color: #1565c0; }
        .kpi-compare-badge.miss { background: #fbe9e7; color: #c62828; }
        .kpi-compare-sub { padding: 8px 0 0 0; border-top: 1px dashed rgba(0,0,0,0.08); margin-top: 10px; }
        .kpi-compare-sub .kpi-compare-title { font-size: 11px; margin-bottom: 6px; color: #555; }
        .kpi-compare-sub .kpi-compare-table { font-size: 10px; }
        .kpi-compare-sub .kpi-compare-table th { padding: 4px 5px; font-size: 9px; background: #f8f9fb; }
        .kpi-compare-sub .kpi-compare-table td { padding: 4px 5px; }
        .kpi-compare-sub .kpi-compare-badge { font-size: 9px; padding: 1px 6px; }

        /* ── 今日关注 ── */
        .hexa-brief {
            padding: 16px 24px;
            border-top: 1px solid var(--panel-border);
            border-bottom: 1px solid var(--panel-border);
        }
        .hexa-brief-label {
            font-size: 0.65rem; font-weight: 700; color: var(--panel-muted);
            letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 10px;
            display: flex; align-items: center; gap: 8px;
        }
        .hexa-brief-date {
            font-size: 0.6rem; font-weight: 400; color: var(--panel-accent);
            background: rgba(7,83,54,0.05); border: 1px solid var(--line-green);
            padding: 1px 7px; border-radius: 10px; text-transform: none; letter-spacing: 0;
        }
        .hexa-brief-empty { font-size: 0.78rem; color: var(--panel-muted); }
        .hexa-brief-headline {
            font-size: 0.82rem; color: var(--panel-text); font-weight: 600;
            line-height: 1.55; margin-bottom: 10px;
        }
        .hexa-brief-section {
            margin-bottom: 10px;
            padding: 8px 12px;
            background: rgba(7,83,54,0.03);
            border-radius: 8px;
            border-left: 3px solid var(--panel-accent, var(--text-main));
        }
        .hexa-brief-sec-title { font-size: 0.72rem; font-weight: 700; color: var(--panel-text); margin-bottom: 4px; }
        .hexa-brief-sec-content { font-size: 0.72rem; color: var(--panel-muted); line-height: 1.55; }

        /* ── 专属提示 ── */
        .hexa-tips {
            padding: 16px 24px;
            border-top: 1px solid var(--panel-border);
            border-bottom: 1px solid var(--panel-border);
            margin-top: 12px;
        }
        .hexa-tips-label {
            font-size: 0.65rem; font-weight: 700; color: var(--panel-muted);
            letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 10px;
            display: flex; align-items: center; gap: 8px;
        }
        .hexa-tips-empty { font-size: 0.78rem; color: var(--panel-muted); }
        .hexa-tips-title {
            font-size: 0.82rem; color: var(--panel-text); font-weight: 600;
            line-height: 1.55; margin-bottom: 8px;
        }
        .hexa-tips-content {
            font-size: 0.72rem; color: var(--panel-muted); line-height: 1.55;
            padding: 8px 12px;
            background: rgba(7,83,54,0.03);
            border-radius: 8px;
            border-left: 3px solid var(--panel-accent, var(--text-main));
        }

        /* ── SVG 雷达图 ── */
        .radar-svg { width: 100%; height: 100%; overflow: visible; }
        .radar-axis-label { font-size: 6.5px; font-family: 'Noto Sans SC', sans-serif; pointer-events: none; }
        @keyframes ringReveal { 0%{transform:scale(0);opacity:0} 65%{transform:scale(1.12);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes fillReveal { 0%{opacity:0;transform:scale(0)} 70%{opacity:0.85;transform:scale(1.08)} 100%{opacity:1;transform:scale(1)} }
        @keyframes dotReveal { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.4);opacity:1} 100%{transform:scale(1);opacity:0.9} }
        @keyframes centerReveal { 0%{opacity:0;transform:scale(0.4)} 70%{opacity:1;transform:scale(1.18)} 100%{opacity:1;transform:scale(1)} }
        @keyframes axisReveal { 0%{stroke-dashoffset:200;opacity:0} 50%{opacity:1} 100%{stroke-dashoffset:0;opacity:1} }
        .radar-reveal .radar-ring-3d { transform:scale(0);opacity:0; animation:ringReveal 0.9s cubic-bezier(0.34,1.3,0.64,1) forwards; }
        .radar-reveal .radar-ring-3d:nth-child(1){animation-delay:0.08s} .radar-reveal .radar-ring-3d:nth-child(2){animation-delay:0.18s}
        .radar-reveal .radar-ring-3d:nth-child(3){animation-delay:0.28s} .radar-reveal .radar-ring-3d:nth-child(4){animation-delay:0.38s}
        .radar-reveal .radar-fill { transform-origin:80px 80px; transform:scale(0);opacity:0; animation:fillReveal 1.0s cubic-bezier(0.34,1.2,0.64,1) 0.35s forwards; }
        .radar-reveal .radar-axis { stroke-dasharray:200; stroke-dashoffset:200; animation:axisReveal 0.8s ease-out 0.15s forwards; }
        .radar-reveal .radar-dot { transform-origin:0 0; transform:scale(0);opacity:0; animation:dotReveal 0.7s cubic-bezier(0.34,1.3,0.64,1) forwards; }
        .radar-reveal .radar-dot:nth-child(1){animation-delay:0.45s} .radar-reveal .radar-dot:nth-child(2){animation-delay:0.52s}
        .radar-reveal .radar-dot:nth-child(3){animation-delay:0.59s} .radar-reveal .radar-dot:nth-child(4){animation-delay:0.66s}
        .radar-reveal .radar-dot:nth-child(5){animation-delay:0.73s} .radar-reveal .radar-dot:nth-child(6){animation-delay:0.80s}
        .radar-reveal .radar-center-val { opacity:0; animation:centerReveal 0.8s cubic-bezier(0.34,1.3,0.64,1) 0.5s forwards; }

        /* ── 早报详情弹窗（全部保留）── */
        .report-modal-overlay { display:none; position:fixed; inset:0; z-index:10002; background:rgba(15,25,45,0.65); backdrop-filter:blur(3px); justify-content:center; align-items:center; }
        .report-modal-overlay.active { display:flex; }
        body.report-modal-open .main-nav-menu,
        body.report-modal-open .dashboard-nav,
        body.report-modal-open .top-nav-bar,
        body.report-modal-open .hero-banner { filter:blur(4px) brightness(0.7); pointer-events:none; transition:filter 0.3s; }
        body.panel-open .main-nav-menu { filter:blur(4px) brightness(0.7); pointer-events:none; transition:filter 0.3s; }
        .report-modal-content { background:var(--bg-mint); border-radius:14px; border:1px solid rgba(7,83,54,0.12); width:960px; max-width:97vw; max-height:92vh; display:flex; flex-direction:column; box-shadow:0 12px 40px rgba(15,30,60,0.15); overflow:hidden; }
        .report-modal-header { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; background:var(--text-main); color:#fff; flex-shrink:0; position:relative; z-index:10; }
        .report-modal-header-left { display:flex; align-items:baseline; gap:16px; }
        .report-modal-title { font-size:18px; font-weight:600; color:#fff; }
        .report-modal-date { font-size:13px; color:rgba(255,255,255,0.75); }
        .report-modal-close { background:none; border:none; font-size:22px; color:rgba(255,255,255,0.8); cursor:pointer; line-height:1; padding:4px 8px; border-radius:6px; transition:color 0.2s,background 0.2s; }
        .report-modal-close:hover { color:#fff; background:rgba(255,255,255,0.15); }
        .report-modal-toolbar { display:flex; align-items:center; gap:8px; padding:8px 20px; border-bottom:1px solid var(--line-green); background:#EFF8F2; flex-shrink:0; font-size:13px; color:#4a5568; }
        .report-modal-toolbar select { border:1px solid rgba(7,83,54,0.12); border-radius:6px; padding:2px 8px; font-size:13px; background:#fff; color:var(--text-main); cursor:pointer; }
        .report-modal-toc { background:#EFF8F2; border-bottom:1px solid var(--line-green); padding:8px 20px; max-height:48px; overflow-y:auto; flex-shrink:0; }
        .report-modal-toc ul { list-style:none; display:flex; flex-wrap:wrap; gap:4px; margin:0; padding:0; }
        .report-modal-toc li { display:inline-block; }
        .report-modal-toc a { display:inline-block; padding:2px 10px; border-radius:12px; background:var(--line-green); color:var(--text-main); text-decoration:none; font-size:12px; white-space:nowrap; transition:background 0.2s; }
        .report-modal-toc a:hover { background:rgba(7,83,54,0.15); }
        .report-modal-body { flex:1; overflow-y:auto; padding:20px 28px; }
        .report-modal-body.font-small  { font-size:13px; line-height:1.6; }
        .report-modal-body.font-medium { font-size:15px; line-height:1.75; }
        .report-modal-body.font-large    { font-size:17px; line-height:1.8; }
        .report-modal-body.font-extra-large { font-size:19px; line-height:1.85; }
        .report-modal-body .report-no-data { text-align:center; padding:60px; color:#888; }
        .sec-card { margin-bottom:12px; border-radius:8px; overflow:hidden; border:1px solid rgba(220,238,230,0.5); background:rgba(248,255,251,0.88); }
        .sec-card-hd { display:flex; align-items:center; justify-content:space-between; padding:9px 16px; cursor:pointer; font-size:14px; font-weight:600; color:var(--text-main); background:var(--bg-mint); user-select:none; transition:background 0.2s; }
        .sec-card-hd:hover { background:var(--bg-mint); }
        .sec-card-hd .sec-title { flex:1; }
        .sec-card-hd .sec-toggle { font-size:16px; font-weight:400; margin-left:8px; color:rgba(7,83,54,0.45); transition:transform 0.25s; }
        .sec-card.open .sec-card-hd .sec-toggle { transform:rotate(180deg); }
        .sec-card-body { display:none; padding:12px 16px 8px; border-top:1px solid rgba(7,83,54,0.05); }
        .sec-card.open .sec-card-body { display:block; }
        .rcontent { color:#2d3748; }
        .rcontent h3 { font-size:15px; font-weight:700; color:var(--text-main); margin:0 0 8px; }
        .rcontent h4 { font-size:13px; font-weight:600; color:#2c5282; margin:10px 0 4px; }
        .rcontent p  { margin:0 0 6px; }
        .rcontent ul { margin:0 0 8px; padding-left:20px; }
        .rcontent li { margin-bottom:3px; }
        .rcontent table { border-collapse:collapse; width:100%; margin:6px 0; font-size:13px; }
        .rcontent th,.rcontent td { border:1px solid rgba(7,83,54,0.12); padding:4px 10px; }
        .rcontent th { background:#EFF8F2; font-weight:600; }
        .rcontent blockquote { border-left:3px solid #D5A858; margin:8px 0; padding:4px 12px; background:rgba(201,168,76,0.07); border-radius:0 4px 4px 0; }
        .rcontent strong { font-weight:600; }
        .topnews-brief-list { }
        .topnews-brief-item { padding:3px 0; border-bottom:1px solid rgba(7,83,54,0.04); }
        .topnews-brief-item:last-child { border-bottom:none; }
    
</style>
                </head>
                <body>
                    <h1>${modalTitle}</h1>
                    <div class="date">${modalDate}</div>
                    ${modalBody}
                

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

                // 保留5%澳洲历史数据与国内/中国现货5.0-5.5%数据
                if (data.history) {
                    data.history = data.history.filter(function(d) {
                        return (d.grade === '5%' && d.origin === '澳洲') ||
                               (d.grade && d.grade.indexOf('5.0-5.5%') >= 0) ||
                               (d.grade && d.grade.indexOf('5%-5.5%') >= 0);
                    });
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
                    priceEl.textContent = latest.avg_price.toFixed(0) + ' ' + (latest.unit || '元/吨');
                }
                if (changeEl && data.history.length >= 2) {
                    var prev = data.history[data.history.length - 2].avg_price;
                    var curr = latest.avg_price;
                    var pct = prev > 0 ? ((curr - prev) / prev * 100) : 0;
                    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
                }
                updateTicker('ticker-spod', latest.avg_price.toFixed(0) + ' ' + (latest.unit || '元/吨'), pct);
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

            // 保留5%澳洲历史数据与国内/中国现货5.0-5.5%数据
            var filtered = historyData.filter(function(d) {
                return (d.grade === '5%' && d.origin === '澳洲') ||
                       (d.grade && d.grade.indexOf('5.0-5.5%') >= 0) ||
                       (d.grade && d.grade.indexOf('5%-5.5%') >= 0);
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
            lineG.appendChild(mk('path', { d: linePath, fill: 'none', stroke: '#e91e63', 'stroke-width': 2 }));

            // 最新点标记
            var lastIdx = filtered.length - 1;
            lineG.appendChild(mk('circle', { cx: xScale(lastIdx), cy: yScale(filtered[lastIdx].avg_price), r: 4, fill: '#e91e63', stroke: '#fff', 'stroke-width': 2 }));
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

                // 只保留2.5%品种数据
                if (data.history) {
                    data.history = data.history.filter(function(d) {
                        return d.grade && d.grade.indexOf('2.5%') >= 0;
                    });
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
                    priceEl.textContent = latest.avg_price.toFixed(0) + ' ' + (latest.unit || '元/吨');
                }
                if (changeEl && data.history.length >= 2) {
                    var prev = data.history[data.history.length - 2].avg_price;
                    var curr = latest.avg_price;
                    var pct = prev > 0 ? ((curr - prev) / prev * 100) : 0;
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
                axisYG.lastChild.textContent = val.toFixed(2);
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
            lineG.appendChild(mk('path', { d: linePath, fill: 'none', stroke: '#9c27b0', 'stroke-width': 2 }));

            // 最新点标记
            var lastIdx = historyData.length - 1;
            lineG.appendChild(mk('circle', { cx: xScale(lastIdx), cy: yScale(historyData[lastIdx].avg_price), r: 4, fill: '#9c27b0', stroke: '#fff', 'stroke-width': 2 }));
        }

        // 初始化新图表
        if (typeof initLithiumOreChart === 'function') initLithiumOreChart();
        if (typeof initLepidoliteChart === 'function') initLepidoliteChart();

</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
        
        /**
         * 导出早报
         */
        function exportReport() {
            const modalTitle = document.getElementById('modalTitle').textContent;
            const modalDate = document.getElementById('modalDate').textContent;
            const modalBody = document.getElementById('modalBody');
            
            // 简单实现：导出为文本
            let text = `${modalTitle}\n${modalDate}\n\n`;
            const sections = modalBody.querySelectorAll('.report-section');
            sections.forEach(section => {
                const title = section.querySelector('.report-section-title');
                if (title) {
                    text += `\n${title.textContent.trim()}\n`;
                    text += '='.repeat(50) + '\n';
                }
                const items = section.querySelectorAll('.report-item');
                items.forEach(item => {
                    const itemTitle = item.querySelector('.report-item-title');
                    const itemContent = item.querySelector('.report-item-content');
                    if (itemTitle) {
                        text += `\n• ${itemTitle.textContent.trim()}\n`;
                    }
                    if (itemContent) {
                        text += `  ${itemContent.textContent.trim()}\n`;
                    }
                });
            });
            
            // 创建下载
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${modalTitle.replace('事业部早报', '')}_早报_${new Date().toISOString().slice(0,10)}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            
            alert('导出成功！文件已下载到本地。');
        }
        
        /**
         * 分享早报
         */
        function shareReport() {
            const modalTitle = document.getElementById('modalTitle').textContent;
            const modalDate = document.getElementById('modalDate').textContent;
            const shareUrl = window.location.href;
            
            // 尝试使用系统分享 API
            if (navigator.share) {
                navigator.share({
                    title: modalTitle,
                    text: `${modalTitle} - ${modalDate}`,
                    url: shareUrl
                }).catch(console.error);
            } else {
                // 降级方案：复制链接
                navigator.clipboard.writeText(`${modalTitle} - ${modalDate}\n${shareUrl}`);
                alert('链接已复制到剪贴板，可以分享给他人了！');
            }
        }
        
        // 历史日历月份状态（默认历史数据月份：April 2026）
        let calendarYear = 2026, calendarMonth = 3; // 0-indexed

        // ========== 历史早报功能 ==========
        let currentDept = 'lubricant';
        let currentDate = new Date().toISOString().slice(0, 10);
        let currentView = 'list';
        let historyData = null;
        
        // 跳转至事业部历史存档页
        function goToDeptArchive(deptId) {
            window.location.href = 'archive_v3.html?id=' + deptId;
        }

        // 打开历史记录
        function openHistory(deptId) {
            currentDept = deptId;
            currentDate = new Date().toISOString().slice(0, 10);
            
            const deptName = reportData[deptId].title;
            document.getElementById('historyModalTitle').textContent = deptName + ' - 历史早报';
            
            loadHistoryData();
            initDatePickers(); // 初始化日期选择器
            
            document.getElementById('historyModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        // 关闭历史记录
        function closeHistory() {
            document.getElementById('historyModal').classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        
        // 加载历史数据
        async function loadHistoryData() {
            try {
                const response = await fetch('reports/index.json?v=' + HTML_VERSION);
                const indexData = await response.json();
                historyData = indexData;

                renderCalendar();
                renderRecentDays();
                renderHistoryList();
            } catch (error) {
                console.error('加载历史数据失败:', error);
                const container = document.getElementById('historyModalBody');
                if (container) {
                    container.innerHTML = `
                        <div style="text-align:center;padding:60px 20px;color:#999">
                            <div style="font-size:40px;margin-bottom:12px">⚠️</div>
                            <div style="font-size:15px;margin-bottom:6px">加载历史数据失败</div>
                            <div style="font-size:12px">请确认服务器已启动，或检查网络连接</div>
                            <div style="margin-top:16px;font-size:12px;color:#aaa">${error.message}</div>
                        </div>`;
                }
            }
        }

        // 渲染日历
        function renderCalendar(cy, cm) {
            const year = (cy !== undefined) ? cy : calendarYear;
            const month = (cm !== undefined) ? cm : calendarMonth;
            
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const startDay = firstDay.getDay();
            const totalDays = lastDay.getDate();
            
            const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                               '七月', '八月', '九月', '十月', '十一月', '十二月'];
            
            let calendarHtml = `
                <div class="calendar-picker">
                    <div class="calendar-header">
                        <button class="calendar-nav" onclick="previousMonth()">◀ 上月</button>
                        <div class="calendar-title">${year}年 ${monthNames[month]}</div>
                        <button class="calendar-nav" onclick="nextMonth()">下月 ▶</button>
                    </div>
                    <div class="calendar-grid">
                        <div class="calendar-day-header">日</div>
                        <div class="calendar-day-header">一</div>
                        <div class="calendar-day-header">二</div>
                        <div class="calendar-day-header">三</div>
                        <div class="calendar-day-header">四</div>
                        <div class="calendar-day-header">五</div>
                        <div class="calendar-day-header">六</div>
            `;
            
            for (let i = 0; i < startDay; i++) {
                calendarHtml += '<div class="calendar-day empty"></div>';
            }
            
            for (let day = 1; day <= totalDays; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasReport = historyData.available_dates.includes(dateStr);
                const now = new Date();
                const isToday = dateStr === now.toISOString().slice(0, 10);
                
                let classes = 'calendar-day';
                if (hasReport) classes += ' has-report';
                if (isToday) classes += ' today';
                
                calendarHtml += `
                    <div class="${classes}" onclick="selectDate('${dateStr}')">
                        ${day}
                    </div>
                `;
            }
            
            calendarHtml += '</div></div>';
            
            let container = document.getElementById('historyModalBody');
            let existingCalendar = container.querySelector('.calendar-picker');
            if (existingCalendar) {
                existingCalendar.remove();
            }
            container.insertAdjacentHTML('afterbegin', calendarHtml);
        }
        
        // 渲染最近 7 天
        function renderRecentDays() {
            const recentDates = historyData.available_dates.slice(0, 7);
            const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            
            let html = '<div class="recent-days">';
            recentDates.forEach((date, index) => {
                const dateObj = new Date(date);
                const weekday = weekdays[dateObj.getDay()];
                const isActive = date === currentDate;
                
                html += `
                    <div class="recent-day-card ${isActive ? 'active' : ''}" onclick="selectDate('${date}')">
                        <div class="recent-day-date">${date.slice(5)}</div>
                        <div class="recent-day-weekday">${weekday}</div>
                    </div>
                `;
            });
            html += '</div>';
            
            let container = document.getElementById('historyModalBody');
            let existing = container.querySelector('.recent-days');
            if (existing) {
                existing.remove();
            }
            container.insertAdjacentHTML('afterbegin', html);
        }
        
        // 渲染历史列表
        function renderHistoryList() {
            const html = `
                <div class="history-list">
                    <div class="history-list-title">📋 历史早报列表</div>
                    ${historyData.available_dates.map(date => {
                        const today = new Date().toISOString().slice(0, 10);
                        const isToday = date === today;
                        const isActive = date === currentDate;
                        return `
                            <div class="history-item ${isActive ? 'active' : ''}" onclick="selectDate('${date}')">
                                <div>
                                    <div class="history-item-date">${date} ${isToday ? '(今日)' : ''}</div>
                                    <div class="history-item-info">点击查看详情</div>
                                </div>
                                <div class="history-item-actions">
                                    <button class="history-action-btn detail" onclick="event.stopPropagation(); viewReport('${date}')">详情页</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            
            let container = document.getElementById('historyModalBody');
            let existing = container.querySelector('.history-list');
            if (existing) {
                existing.remove();
            }
            container.insertAdjacentHTML('beforeend', html);
        }
        
        // 选择日期
        function selectDate(date) {
            // 如果在对比模式下，添加到对比列表
            if (compareMode) {
                selectCompareDate(date);
                return;
            }
            
            currentDate = date;
            renderRecentDays();
            renderHistoryList();
            viewReport(date);
        }
        
                const HISTORY_DIMS = [
            { key: 'topnews', icon: '📌', label: '今日要报' },
            { key: '市场',    icon: '📊', label: '市场/价格' },
            { key: '政策',    icon: '📜', label: '政策/行业' },
            { key: '竞品',   icon: '🔥', label: '企业动态' },
            { key: '前沿',   icon: '💻', label: '技术/产品' },
            { key: '客户',   icon: '🏗', label: '项目/招标' },
        ];

        function safeStr(s) {
            return String(s || '').replace(/\*\*/g, '')
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        // 查看早报
        function viewReport(date) {
            fetch(`reports/${date}.json?v=${HTML_VERSION}&_cb=${Date.now()}`)
                .then(response => response.json())
                .then(data => {
                    const deptData = data.departments[currentDept];
                    if (!deptData) {
                        alert('该日期暂无此事业部的早报');
                        return;
                    }

                    // ✅ 优先使用 sectionsByDim（新格式，已按维度正确分类）
                    let usedSectionsByDim = false;
                    const sectionsByDim = deptData.sectionsByDim;
                    if (sectionsByDim && typeof sectionsByDim === 'object') {
                        usedSectionsByDim = true;
                        for (const dimDef of HISTORY_DIMS) {
                            const items = sectionsByDim[dimDef.key] || [];
                            if (!items.length) continue;
                            const isTopnews = dimDef.key === 'topnews';
                            if (isTopnews) {
                                contentHtml += `<div class="report-section"><div class="report-section-title">📌 ${safeStr(dimDef.label || '今日要报')}</div>`;
                                for (let i = 0; i < items.length; i++) {
                                    const item = items[i];
                                    const title = safeStr(item.title || '');
                                    const body  = safeStr(item.content || '');
                                    const source = safeStr(item.source || '');
                                    const itemDate = safeStr(item.date || '');
                                    contentHtml += `<div class="report-item"><div class="report-item-title" style="display:flex;gap:8px;align-items:baseline;"><span style="color:#e74c3c;font-weight:bold">${i+1}.</span><span>${title}</span></div>${body ? `<div class="report-item-content" style="margin-top:4px">${body}</div>` : ''}${source || itemDate ? `<div style="font-size:12px;color:#888;margin-top:4px">来源：${source}${source && itemDate ? '，' : ''}${itemDate}</div>` : ''}</div>`;
                                }
                                contentHtml += `</div>`;
                            } else {
                                contentHtml += `<div class="report-section"><div class="report-section-title">${dimDef.icon || '📋'} ${safeStr(dimDef.label)}</div>`;
                                for (const item of items) {
                                    const title = safeStr(item.title || '');
                                    const body  = safeStr(item.content || '');
                                    const source = safeStr(item.source || '');
                                    const d = safeStr(item.date || '');
                                    const priority = item.priority || 'P2';
                                    const priorityLabel = priority === 'P0' ? '🔥' : priority === 'P1' ? '📌' : '';
                                    contentHtml += `<div class="report-item"><div class="report-item-title" style="display:flex;gap:6px;align-items:center;">${priorityLabel ? `<span style="font-size:12px;color:#e74c3c">${priorityLabel}</span>` : ''}<span>${title}</span></div>${body ? `<div class="report-item-content">${body}</div>` : ''}${(source || d) ? `<div style="font-size:12px;color:#888;margin-top:4px">${source ? '来源：'+source : ''}${source && d ? '，' : ''}${d}</div>` : ''}</div>`;
                                }
                                contentHtml += `</div>`;
                            }
                        }
                    }
                    // 回退：使用 sections 数组或字典格式
                    const sections = deptData.sections || {};
                    let contentHtml = `<div style="margin-bottom:16px;padding:12px;background:#e8f0ff;border-radius:8px;font-size:13px;color:#555;">
                        <strong>📅 报告日期：</strong>${date}　<strong>事业部：</strong>${deptData.name || currentDept}
                    </div>`;

                    // 新格式：sections 是有序数组 [{dim, title, items}, ...]
                    if (Array.isArray(sections)) {
                        for (const sec of sections) {
                            const isTopnews = sec.dim === 'topnews';
                            const items = sec.items || [];
                            if (!items.length) continue;
                            if (isTopnews) {
                                contentHtml += `<div class="report-section">
    <div class="report-section-title">📌 ${safeStr(sec.title || '今日要报')}</div>`;
                                for (let i = 0; i < items.length; i++) {
                                    const item = items[i];
                                    const title = safeStr(item.title || '');
                                    const body = safeStr(item.content || '');
                                    const source = safeStr(item.source || '');
                                    const itemDate = safeStr(item.date || '');
                                    contentHtml += `<div class="report-item">
    <div class="report-item-title" style="display:flex;gap:8px;align-items:baseline">
      <span style="color:#e74c3c;font-weight:bold">${i+1}.</span>
      <span>${title}</span>
    </div>
    ${body ? `<div class="report-item-content" style="margin-top:4px">${body}</div>\n` : ''}
    ${source || itemDate ? `<div style="font-size:12px;color:#888;margin-top:4px">来源：${source}${source && itemDate ? '，' : ''}${itemDate}</div>` : ''}
</div>`;
                                }
                                contentHtml += `</div>`;
                            } else {
                                const dimDef = HISTORY_DIMS.find(d => d.key === sec.dim) || {};
                                contentHtml += `<div class="report-section">
    <div class="report-section-title">${dimDef.icon || '📋'} ${safeStr(sec.title || sec.dim)}</div>`;
                                for (const item of items) {
                                    const rawTitle = item.title || '';
                                    const rawContent = item.content || '';
                                    const itemSource = item.source || '';
                                    const itemDate = item.date || deptData.window_end || date;
                                    let displaySource = itemSource;
                                    let displayDate = itemDate;
                                    let displayTitle = rawTitle;
                                    let displayContent = rawContent;
                                    if (!displaySource || !displayDate) {
                                        const metaMatch = rawTitle.match(/[（(]来源：([^，,]+)[，,]\s*(\d{4}-\d{2}-\d{2})[）)]/);
                                        if (metaMatch) {
                                            if (!displaySource) displaySource = metaMatch[1].trim();
                                            if (!displayDate) displayDate = metaMatch[2].trim();
                                            displayTitle = rawTitle.replace(/[（(]来源：[^）)]*[）)]/, '').trim();
                                        }
                                    }
                                    if (!displaySource || !displayDate) {
                                        const metaInContent = rawContent.match(/[（(]来源：([^，,)]+)[，,]\s*(\d{4}-\d{2}-\d{2})[）)]/);
                                        if (metaInContent) {
                                            if (!displaySource) displaySource = metaInContent[1].trim();
                                            if (!displayDate) displayDate = metaInContent[2].trim();
                                            displayContent = rawContent.replace(/[（(]来源：[^）)]*[）)]/, '').trim();
                                        }
                                    }
                                    const title = safeStr(displayTitle);
                                    const body = safeStr(displayContent);
                                    const source = safeStr(displaySource);
                                    const d = safeStr(displayDate);
                                    const priority = item.priority || 'P2';
                                    const priorityLabel = priority === 'P0' ? '🔥' : priority === 'P1' ? '📌' : '';
                                    contentHtml += `<div class="report-item">
    <div class="report-item-title" style="display:flex;gap:6px;align-items:center">
        ${priorityLabel ? `<span style="font-size:12px;color:#e74c3c">${priorityLabel}</span>` : ''}
        <span>${title}</span>
    </div>
    ${body ? `<div class="report-item-content">${body}</div>` : ''}
    ${(source || d) ? `<div style="font-size:12px;color:#888;margin-top:4px">${source ? '来源：'+source : ''}${source && d ? '，' : ''}${d}</div>` : ''}
</div>`;
                                }
                                contentHtml += `</div>`;
                            }
                        }
                    } else if (typeof sections === 'object' && sections !== null) {
                        for (const dim of HISTORY_DIMS) {
                            const items = sections[dim.key];
                            if (!items || !Array.isArray(items) || items.length === 0) continue;
                            contentHtml += `<div class="report-section">
    <div class="report-section-title">${dim.icon} ${dim.label}</div>`;
                            for (const item of items) {
                                const rawTitle = item.title || '';
                                const rawContent = item.content || '';
                                const itemSource = item.source || '';
                                const itemDate = item.date || deptData.window_end || date;
                                let displaySource = itemSource;
                                let displayDate = itemDate;
                                let displayTitle = rawTitle;
                                let displayContent = rawContent;
                                if (!displaySource || !displayDate) {
                                    const metaMatch = rawTitle.match(/[（(]来源：([^，,]+)[，,]\s*(\d{4}-\d{2}-\d{2})[）)]/);
                                    if (metaMatch) {
                                        if (!displaySource) displaySource = metaMatch[1].trim();
                                        if (!displayDate) displayDate = metaMatch[2].trim();
                                        displayTitle = rawTitle.replace(/[（(]来源：[^）)]*[）)]/, '').trim();
                                    }
                                }
                                if (!displaySource || !displayDate) {
                                    const metaInContent = rawContent.match(/[（(]来源：([^，,)]+)[，,]\s*(\d{4}-\d{2}-\d{2})[）)]/);
                                    if (metaInContent) {
                                        if (!displaySource) displaySource = metaInContent[1].trim();
                                        if (!displayDate) displayDate = metaInContent[2].trim();
                                        displayContent = rawContent.replace(/[（(]来源：[^）)]*[）)]/, '').trim();
                                    }
                                }
                                const title = safeStr(displayTitle);
                                const body = safeStr(displayContent);
                                const source = safeStr(displaySource);
                                const date = safeStr(displayDate);
                                const priority = item.priority || 'P2';
                                const priorityLabel = priority === 'P0' ? '🔥' : priority === 'P1' ? '📌' : '';
                                contentHtml += `<div class="report-item">
    <div class="report-item-title" style="display:flex;gap:6px;align-items:center">
        ${priorityLabel ? `<span style="font-size:12px;color:#e74c3c">${priorityLabel}</span>` : ''}
        <span>${title}</span>
    </div>
    ${body ? `<div class="report-item-content">${body}</div>` : ''}
    ${(source || date) ? `<div style="font-size:12px;color:#888;margin-top:4px">${source ? '来源：'+source : ''}${source && date ? '，' : ''}${date}</div>` : ''}
</div>`;
                            }
                            contentHtml += `</div>`;
                        }
                        const hasAnyData = Array.isArray(sections)
                            ? sections.some(sec => Array.isArray(sec.items) && sec.items.length > 0)
                            : HISTORY_DIMS.some(d => Array.isArray(sections[d.key]) && sections[d.key].length > 0);
                        if (!hasAnyData) {
                            contentHtml += `<div style="color:#999;text-align:center;padding:30px">暂无早报内容</div>`;
                        }

                        // 小结（summary 字段）
                        const summaryText = deptData.summary || '';
                        if (summaryText) {
                            const rawParts = summaryText.replace(/^[\s\n]+/, '').split(/\n/).filter(s => s.trim());
                            let bulletLines = rawParts.length <= 2 && summaryText.includes(' - ')
                                ? summaryText.split(/ *- */).filter(s => s.trim())
                                : rawParts;
                            const formattedSummary = bulletLines
                                .map(line => {
                                    const trimmed = line.trim();
                                    if (!trimmed || trimmed.startsWith('数据来源') || trimmed.startsWith('🦞')) return '';
                                    const cleaned = trimmed.replace(/^[💡📌🔔\s]+/, '').trim();
                                    return `<div class="summary-bullet">${cleaned}</div>`;
                                })
                                .filter(h => h.trim())
                                .join('');
                            if (formattedSummary) {
                                contentHtml += `<div class="report-summary" style="margin-top:16px">
    <div class="report-summary-title">💡 今日小结</div>
    ${formattedSummary}
</div>`;
                            }
                        }
                    } else if (Array.isArray(sections)) {
                        sections.forEach(section => {
                            contentHtml += `<div class="report-section">
    <div class="report-section-title">${safeStr(section.title || '')}</div>`;
                            (section.items || []).forEach(item => {
                                contentHtml += `<div class="report-item">
    <div class="report-item-title">${safeStr(item.title || '')}</div>
    ${item.content ? `<div class="report-item-content">${safeStr(item.content)}</div>` : ''}
</div>`;
                            });
                            contentHtml += `</div>`;
                        });
                    }

                    document.getElementById('modalTitle').textContent = deptData.name || currentDept;
                    document.getElementById('modalDate').textContent = (deptData.subtitle || '') + ' | ' + date;
                    document.getElementById('modalBody').innerHTML = contentHtml;
                    closeHistory();
                    document.getElementById('reportModal').classList.add('active');
                })
                .catch(error => {
                    console.error('加载早报失败:', error);
                    alert('加载早报失败，请稍后重试');
                });
        }
        
        // 切换视图
        function switchView(view) {
            currentView = view;
            
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            if (view === 'list') {
                renderHistoryList();
            } else if (view === 'category') {
                renderCategoryView();
            }
        }
        
        // 渲染分类视图
        function renderCategoryView() {
            fetch(`reports/${currentDate}.json?v=${HTML_VERSION}`)
                .then(response => response.json())
                .then(data => {
                    const categories = data.categories;
                    
                    let html = '<div class="category-view">';
                    
                    for (const key in categories) {
                        const category = categories[key];
                        html += `
                            <div class="category-card">
                                <div class="category-card-header">
                                    <span>${category.icon}</span>
                                    <span>${category.name}</span>
                                </div>
                        `;
                        
                        category.items.forEach(item => {
                            html += `
                                <div class="category-item">
                                    <div class="category-item-title">${item.title}</div>
                                    <div class="category-item-dept">📍 ${item.department}</div>
                                    <div class="category-item-content">${item.content}</div>
                                    <span class="impact-tag ${item.impact === '高' ? 'high' : item.impact === '中' ? 'medium' : 'low'}">
                                        影响程度：${item.impact}
                                    </span>
                                </div>
                            `;
                        });
                        
                        html += '</div>';
                    }
                    
                    html += '</div>';
                    document.getElementById('historyModalBody').innerHTML = html;
                    
                    renderCalendar();
                    renderRecentDays();
                })
                .catch(error => {
                    console.error('加载分类视图失败:', error);
                    alert('加载分类视图失败');
                });
        }
        
        // 上月
        function previousMonth() {
            calendarMonth--;
            if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
            const modalBody = document.getElementById('historyModalBody');
            const recentEl = modalBody ? modalBody.querySelector('.recent-days') : null;
            const historyEl = modalBody ? modalBody.querySelector('.history-list') : null;
            const recentHtml = recentEl ? recentEl.outerHTML : '';
            const historyHtml = historyEl ? historyEl.outerHTML : '';
            renderCalendar(calendarYear, calendarMonth);
            if (recentHtml) modalBody.insertAdjacentHTML('beforeend', recentHtml);
            if (historyHtml) modalBody.insertAdjacentHTML('beforeend', historyHtml);
        }

        // 下月
        function nextMonth() {
            const now = new Date();
            if (calendarYear === now.getFullYear() && calendarMonth >= now.getMonth()) return;
            calendarMonth++;
            if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
            const modalBody = document.getElementById('historyModalBody');
            const recentEl = modalBody ? modalBody.querySelector('.recent-days') : null;
            const historyEl = modalBody ? modalBody.querySelector('.history-list') : null;
            const recentHtml = recentEl ? recentEl.outerHTML : '';
            const historyHtml = historyEl ? historyEl.outerHTML : '';
            renderCalendar(calendarYear, calendarMonth);
            if (recentHtml) modalBody.insertAdjacentHTML('beforeend', recentHtml);
            if (historyHtml) modalBody.insertAdjacentHTML('beforeend', historyHtml);
        }
        
        // ============================================================
        // 历史记录增强功能
        // ============================================================
        
        // 全局变量
        let compareMode = false;
        let selectedDates = [];
        let filteredHistoryData = [];
        
        // 初始化日期选择器的默认值
        function initDatePickers() {
            const today = new Date();
            const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            document.getElementById('endDate').valueAsDate = today;
            document.getElementById('startDate').valueAsDate = lastWeek;
        }
        
        // 按日期范围筛选
        function filterByDateRange() {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            if (!startDate || !endDate) {
                renderHistoryList();
                return;
            }
            
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // 包含结束日期整天
            
            if (start > end) {
                alert('开始日期不能晚于结束日期！');
                return;
            }
            
            // 筛选日期范围内的数据
            if (historyData && historyData.reports) {
                filteredHistoryData = historyData.reports.filter(report => {
                    const reportDate = new Date(report.date);
                    return reportDate >= start && reportDate <= end;
                });
                renderHistoryList();
            }
        }
        
        // 重置日期筛选
        function resetDateFilter() {
            document.getElementById('startDate').value = '';
            document.getElementById('endDate').value = '';
            filteredHistoryData = [];
            document.getElementById('historySearch').value = '';
            renderHistoryList();
        }
        
        // 搜索历史记录
        function searchHistory() {
            const keyword = document.getElementById('historySearch').value.toLowerCase().trim();
            
            if (!keyword) {
                renderHistoryList();
                return;
            }
            
            // 在标题和内容中搜索关键词
            const searchResults = filteredHistoryData.length > 0 ? filteredHistoryData : historyData.reports;
            const results = searchResults.filter(report => {
                if (report.title && report.title.toLowerCase().includes(keyword)) {
                    return true;
                }
                if (report.sections) {
                    for (const section of report.sections) {
                        if (section.title && section.title.toLowerCase().includes(keyword)) {
                            return true;
                        }
                        if (section.items) {
                            for (const item of section.items) {
                                if ((item.title && item.title.toLowerCase().includes(keyword)) ||
                                    (item.content && item.content.toLowerCase().includes(keyword))) {
                                    return true;
                                }
                            }
                        }
                    }
                }
                return false;
            });
            
            renderSearchResults(results, keyword);
        }
        
        // 渲染搜索结果
        function renderSearchResults(results, keyword) {
            let html = '<div class="search-results">';
            
            if (results.length === 0) {
                html += `
                    <div class="no-results">
                        <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
                        <div style="color: #999;">未找到匹配"${keyword}"的结果</div>
                    </div>
                `;
            } else {
                html += `<div class="search-info">找到 ${results.length} 条相关记录</div>`;
                results.forEach(report => {
                    html += `
                        <div class="history-date-group" onclick="viewHistoryReport('${report.date}')">
                            <div class="history-date-header">
                                <span class="date-display">${formatDateDisplay(report.date)}</span>
                                <span class="view-report-btn">查看早报 →</span>
                            </div>
                        </div>
                    `;
                });
            }
            
            html += '</div>';
            document.getElementById('historyModalBody').innerHTML = html;
        }
        
        // 切换对比模式
        function toggleCompareMode() {
            compareMode = !compareMode;
            const compareBtn = document.querySelector('.compare-btn');
            const comparePanel = document.getElementById('comparePanel');
            
            if (compareMode) {
                compareBtn.classList.add('active');
                comparePanel.style.display = 'block';
                selectedDates = [];
                updateComparePanel();
            } else {
                compareBtn.classList.remove('active');
                comparePanel.style.display = 'none';
                selectedDates = [];
            }
        }
        
        // 关闭对比模式
        function closeCompare() {
            compareMode = false;
            document.querySelector('.compare-btn').classList.remove('active');
            document.getElementById('comparePanel').style.display = 'none';
            selectedDates = [];
            renderCalendar();
            renderRecentDays();
            renderHistoryList();
        }
        
        // 更新对比面板
        function updateComparePanel() {
            const countSpan = document.getElementById('selectedCount');
            const datesDiv = document.getElementById('compareDates');
            const startBtn = document.getElementById('startCompareBtn');
            
            countSpan.textContent = selectedDates.length;
            
            if (selectedDates.length === 0) {
                datesDiv.innerHTML = '<div style="color: rgba(255,255,255,0.8); font-size: 13px;">请在日历或日期列表中选择要对比的日期</div>';
                startBtn.style.display = 'none';
            } else {
                datesDiv.innerHTML = selectedDates.map(date => `
                    <div class="compare-date-item">
                        <span>📅 ${formatDateDisplay(date)}</span>
                        <span class="remove-date" onclick="removeCompareDate('${date}')">×</span>
                    </div>
                `).join('');
                
                if (selectedDates.length === 2) {
                    startBtn.style.display = 'block';
                } else {
                    startBtn.style.display = 'none';
                }
            }
        }
        
        // 移除对比日期
        function removeCompareDate(date) {
            selectedDates = selectedDates.filter(d => d !== date);
            updateComparePanel();
            renderCalendar();
            renderRecentDays();
            renderHistoryList();
        }
        
        // 选择对比日期
        function selectCompareDate(date) {
            if (!compareMode) return;
            
            if (selectedDates.includes(date)) {
                removeCompareDate(date);
            } else if (selectedDates.length < 2) {
                selectedDates.push(date);
                updateComparePanel();
            } else {
                alert('最多只能选择 2 个日期进行对比');
            }
        }
        
        // 开始对比
        function startCompare() {
            if (selectedDates.length !== 2) {
                alert('请选择 2 个日期进行对比');
                return;
            }
            
            // 打开对比视图
            openCompareView(selectedDates[0], selectedDates[1]);
        }
        
        // 打开对比视图
        function openCompareView(date1, date2) {
            const deptName = reportData[currentDept].title;
            const html = `
                <div class="compare-view">
                    <div class="compare-view-header">
                        <h2>📊 ${deptName} 早报对比</h2>
                        <button class="close-compare-view" onclick="closeCompareView()">×</button>
                    </div>
                    <div class="compare-dates-header">
                        <div class="compare-date-column">
                            <div class="compare-date-label">${formatDateDisplay(date1)}</div>
                        </div>
                        <div class="compare-date-column">
                            <div class="compare-date-label">${formatDateDisplay(date2)}</div>
                        </div>
                    </div>
                    <div class="compare-content">
                        <p style="text-align: center; color: #999; padding: 40px;">
                            对比功能详细实现中...<br>
                            将展示两个日期的关键数据差异分析
                        </p>
                    </div>
                </div>
            `;
            document.getElementById('historyModalBody').innerHTML = html;
        }
        
        // 关闭对比视图
        function closeCompareView() {
            renderCalendar();
            renderRecentDays();
            renderHistoryList();
        }
        
        // 格式化日期显示
        function formatDateDisplay(dateStr) {
            const date = new Date(dateStr);
            const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const weekday = weekdays[date.getDay()];
            return `${month}月${day}日 ${weekday}`;
        }
        
        // 导出历史记录
        function exportHistory() {
            const deptName = reportData[currentDept].title;
            const exportData = filteredHistoryData.length > 0 ? filteredHistoryData : historyData.reports;
            
            let text = `${deptName} 历史早报\n`;
            text += `导出时间：${new Date().toLocaleString('zh-CN')}\n`;
            text += `共 ${exportData.length} 条记录\n\n`;
            text += '='.repeat(50) + '\n\n';
            
            exportData.forEach(report => {
                text += `【${report.date}】\n`;
                if (report.sections) {
                    report.sections.forEach(section => {
                        text += `\n${section.title}\n`;
                        if (section.items) {
                            section.items.forEach(item => {
                                text += `• ${item.title || item}\n`;
                            });
                        }
                    });
                }
                text += '\n' + '-'.repeat(50) + '\n\n';
            });
            
            // 创建下载
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${deptName}_历史早报_${new Date().toISOString().slice(0,10)}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        }
        
        // 点击历史弹窗外部关闭
        const historyModal = document.getElementById('historyModal');
        if (historyModal) {
        historyModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeHistory();
            }
        });
        }
        
        // ESC 键关闭历史弹窗
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeHistory();
            }
        });
        
        // 点击弹窗外部关闭
        const reportModal = document.getElementById('reportModal');
        if (reportModal) {
        reportModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeReport();
            }
        });
        }
        
        // ESC 键关闭弹窗（优先关闭报告弹窗）
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const reportModal = document.getElementById('reportModal');
                const historyModal = document.getElementById('historyModal');
                
                if (reportModal.classList.contains('active')) {
                    closeReport();
                } else if (historyModal.classList.contains('active')) {
                    closeHistory();
                }
            }
        });

        // ============================================================
        // 页面初始化：自动加载当天报告 JSON（同步等待）
        // ============================================================
        (async function() {
            try {
                await initDynamicData();
                if (!dynamicReportData) {
                    console.error('[ERROR] dynamicReportData 为空');
                }
            } catch(e) {
                console.error('[ERROR] initDynamicData 异常:', e);
            }

            // 确保 loading overlay 消失（embedded 模式下 window.load 不触发）
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
                setTimeout(() => { loadingOverlay.style.display = 'none'; }, 500);
            }
        })();
        // 页面加载时自动读取碳酸锂期货实时数据
        updateMarketCards();


    
        // ============================================================
        // 碳酸锂期货折线图  v2 - 区间选择 + 高低标注 + 更多日期
        // ============================================================
        var _lcChartData = null;
        var _lcChartW = 800, _lcChartH = 260;
        var _lcPad = { top: 15, right: 15, bottom: 35, left: 75 };
        var _lcDragging = false, _lcDragStart = null, _lcDragEnd = null;

        // 辅助函数：更新板块最后更新时间（取最新）
        function updateCategoryTime(categoryId, timeStr) {
            var el = document.getElementById(categoryId);
            if (!el || !timeStr) return;
            var newTime = new Date(timeStr.replace(/-/g, '/'));
            var currentText = el.textContent.trim();
            if (currentText === '--' || currentText === '') {
                el.textContent = timeStr;
                return;
            }
            var currentTime = new Date(currentText.replace(/-/g, '/'));
            if (newTime > currentTime) {
                el.textContent = timeStr;
            }
        }

        async function initLCChart() {
            var loading = document.getElementById('chartLoading');
            var noData = document.getElementById('chartNoData');
            var svg = document.getElementById('lcFuturesChart');
            if (!svg) return;

            try {
                var resp = await fetch('reports/lc_futures_history.json?t=' + Date.now());
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var hist = await resp.json();

                if (!hist.history || hist.history.length === 0) {
                    if (loading) loading.style.display = 'none';
                    if (noData) noData.style.display = 'flex';
                    return;
                }

                _lcChartData = hist;

                var latest = hist.latest;
                var priceEl = document.getElementById('chartLatestPrice');
                var changeEl = document.getElementById('chartLatestChange');
                var updatedEl = document.getElementById('chartUpdated');

                if (priceEl) priceEl.textContent = (latest.close / 10000).toFixed(3) + ' 万';
                if (updatedEl) updatedEl.textContent = 'Update: ' + hist.update_time;
                updateCategoryTime('lithium-update-time', hist.update_time);

                var closes = hist.history.map(function(h) { return h.close; });
                var lastIdx = closes.length - 1;
                var prevClose = lastIdx > 0 ? closes[lastIdx - 1] : closes[lastIdx];
                var latestClose = closes[lastIdx];
                var pct = prevClose > 0 ? ((latestClose - prevClose) / prevClose * 100) : 0;
                if (changeEl) {
                    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
                }
                updateTicker('ticker-lc-futures', (latest.close / 10000).toFixed(3) + ' 万', pct);
                var container = document.getElementById('lcChartContainer');
                var cw = container ? (container.clientWidth || 800) : 800;
                var ch = Math.round(cw * 260 / 800);
                svg.setAttribute('width', cw);
                svg.setAttribute('height', ch);
                svg.setAttribute('viewBox', '0 0 ' + cw + ' ' + ch);
                drawLCChartV2(svg, hist.history, null, 'lc', cw, ch);
                triggerLineRevealAnimation(svg);

                function fitSvgToContainer() {
                    var svg2 = document.getElementById('lcFuturesChart');
                    var parent2 = svg2 && svg2.parentElement;
                    if (parent2) {
                        var pw = parent2.clientWidth || 800;
                        var ph = Math.round(pw * 260 / 800);
                        svg2.setAttribute('width', pw);
                        svg2.setAttribute('height', ph);
                        svg2.setAttribute('viewBox', '0 0 ' + pw + ' ' + ph);
                        drawLCChartV2(svg2, hist.history, null, 'lc', pw, ph);
                    }
                }
                window.addEventListener('resize', function() {
                    clearTimeout(window._lcResizeTimer);
                    window._lcResizeTimer = setTimeout(fitSvgToContainer, 200);
                });

                if (loading) loading.style.display = 'none';
            } catch (e) {
                console.warn('[LC Chart] load failed:', e);
                if (loading) loading.style.display = 'none';
                if (noData) noData.style.display = 'flex';
            }
        }

        async function initBatteryGradeChart() {
            var loading = document.getElementById('batteryChartLoading');
            var noData = document.getElementById('batteryChartNoData');
            var svg = document.getElementById('batteryChart');
            if (!svg) return;
            try {
                var resp = await fetch('carbonate_spot_price_merged.json?t=' + Date.now());
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var json = await resp.json();
                var data = (json.data && json.data.battery_grade) || [];
                // 过滤：只保留2026-01-01及之后的数据
                data = data.filter(function(d) { return d.date >= '2026-01-01'; });
                if (data.length === 0) {
                    if (loading) loading.style.display = 'none';
                    if (noData) noData.style.display = 'flex';
                    return;
                }
                var chartData = data.map(function(d) { return {close: d.price, date: d.date}; });
                var latest = chartData[chartData.length - 1];
                var priceEl = document.getElementById('batteryLatestPrice');
                var changeEl = document.getElementById('batteryLatestChange');
                var updatedEl = document.getElementById('batteryChartUpdated');
                if (priceEl) priceEl.textContent = (latest.close / 10000).toFixed(3) + ' 万';
                if (updatedEl) updatedEl.textContent = 'Update: ' + json.update_time;
                var closes = chartData.map(function(h) { return h.close; });
                var lastIdx = closes.length - 1;
                var prevClose = lastIdx > 0 ? closes[lastIdx - 1] : closes[lastIdx];
                var latestClose = closes[lastIdx];
                var pct = prevClose > 0 ? ((latestClose - prevClose) / prevClose * 100) : 0;
                if (changeEl) {
                    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
                }
                updateTicker('ticker-lc-spot', (latest.close / 10000).toFixed(3) + ' 万', pct);
                var container = document.getElementById('batteryChartContainer');
                var cw = container ? (container.clientWidth || 400) : 400;
                var ch = Math.round(cw * 200 / 400);
                svg.setAttribute('width', cw);
                svg.setAttribute('height', ch);
                svg.setAttribute('viewBox', '0 0 ' + cw + ' ' + ch);
                drawLCChartV2(svg, chartData, null, 'battery', cw, ch, {top:30,right:15,bottom:30,left:60}, 'batteryChartGrad');
                triggerLineRevealAnimation(svg);
                function fitSvg1() {
                    var svg2 = document.getElementById('batteryChart');
                    var parent2 = svg2 && svg2.parentElement;
                    if (parent2) {
                        var pw = parent2.clientWidth || 400;
                        var ph = Math.round(pw * 200 / 400);
                        svg2.setAttribute('width', pw);
                        svg2.setAttribute('height', ph);
                        svg2.setAttribute('viewBox', '0 0 ' + pw + ' ' + ph);
                        drawLCChartV2(svg2, chartData, null, 'battery', pw, ph, {top:30,right:15,bottom:30,left:60}, 'batteryChartGrad');
                    }
                }
                window.addEventListener('resize', function() {
                    clearTimeout(window._batteryResizeTimer);
                    window._batteryResizeTimer = setTimeout(fitSvg1, 200);
                });
                if (loading) loading.style.display = 'none';
            } catch (e) {
                console.warn('[Battery Grade Chart] load failed:', e);
                if (loading) loading.style.display = 'none';
                if (noData) noData.style.display = 'flex';
            }
        }

        async function initIndustrialGradeChart() {
            var loading = document.getElementById('industrialChartLoading');
            var noData = document.getElementById('industrialChartNoData');
            var svg = document.getElementById('industrialChart');
            if (!svg) return;
            try {
                var resp = await fetch('carbonate_spot_price_merged.json?t=' + Date.now());
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var json = await resp.json();
                var data = (json.data && json.data.industrial_grade) || [];
                // 过滤：只保留2026-01-01及之后的数据
                data = data.filter(function(d) { return d.date >= '2026-01-01'; });
                if (data.length === 0) {
                    if (loading) loading.style.display = 'none';
                    if (noData) noData.style.display = 'flex';
                    return;
                }
                var chartData = data.map(function(d) { return {close: d.price, date: d.date}; });
                var latest = chartData[chartData.length - 1];
                var priceEl = document.getElementById('industrialLatestPrice');
                var changeEl = document.getElementById('industrialLatestChange');
                var updatedEl = document.getElementById('industrialChartUpdated');
                if (priceEl) priceEl.textContent = (latest.close / 10000).toFixed(3) + ' 万';
                if (updatedEl) updatedEl.textContent = 'Update: ' + json.update_time;
                var closes = chartData.map(function(h) { return h.close; });
                var lastIdx = closes.length - 1;
                var prevClose = lastIdx > 0 ? closes[lastIdx - 1] : closes[lastIdx];
                var latestClose = closes[lastIdx];
                var pct = prevClose > 0 ? ((latestClose - prevClose) / prevClose * 100) : 0;
                if (changeEl) {
                    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
                }
                var container2 = document.getElementById('industrialChartContainer');
                var cw2 = container2 ? (container2.clientWidth || 400) : 400;
                var ch2 = Math.round(cw2 * 200 / 400);
                svg.setAttribute('width', cw2);
                svg.setAttribute('height', ch2);
                svg.setAttribute('viewBox', '0 0 ' + cw2 + ' ' + ch2);
                drawLCChartV2(svg, chartData, null, 'industrial', cw2, ch2, {top:30,right:15,bottom:30,left:60}, 'industrialChartGrad');
                triggerLineRevealAnimation(svg);
                function fitSvg2() {
                    var svg2 = document.getElementById('industrialChart');
                    var parent2 = svg2 && svg2.parentElement;
                    if (parent2) {
                        var pw = parent2.clientWidth || 400;
                        var ph = Math.round(pw * 200 / 400);
                        svg2.setAttribute('width', pw);
                        svg2.setAttribute('height', ph);
                        svg2.setAttribute('viewBox', '0 0 ' + pw + ' ' + ph);
                        drawLCChartV2(svg2, chartData, null, 'industrial', pw, ph, {top:30,right:15,bottom:30,left:60}, 'industrialChartGrad');
                    }
                }
                window.addEventListener('resize', function() {
                    clearTimeout(window._industrialResizeTimer);
                    window._industrialResizeTimer = setTimeout(fitSvg2, 200);
                });
                if (loading) loading.style.display = 'none';
            } catch (e) {
                console.warn('[Industrial Grade Chart] load failed:', e);
                if (loading) loading.style.display = 'none';
                if (noData) noData.style.display = 'flex';
            }
        }

        /**
         * 触发折线绘制动画（双线揭幕效果）：
         * 1. 设置 CSS 变量 --line-len（线长）和 --line-i（动画延迟）
         * 2. 设置 CSS 变量触发折线绘制动画
         */
        function triggerLineRevealAnimation(svg) {
            // 图表已渲染完成，显示SVG（防止旧内容闪屏）
            // 使用 setProperty 设置 !important，覆盖 CSS 的 visibility: hidden !important
            if (svg) svg.style.setProperty('visibility', 'visible', 'important');
            var card = svg.closest('.mk-chart-card') || svg.closest('.lc-futures-chart-wrapper') || svg.closest('.lc-spot-chart-wrapper');
            if (!card) return;
            var deepLines = svg.querySelectorAll('.deep-line-anim');
            deepLines.forEach(function(lineEl, i) {
                var len = 10000;
                try { var tmp = lineEl.getTotalLength(); if (tmp > 0) len = tmp; } catch(e) {}
                lineEl.style.setProperty('--line-len', len);
                lineEl.style.setProperty('--line-i', i);
                lineEl.setAttribute('stroke-dasharray', len);
                lineEl.setAttribute('stroke-dashoffset', len);
            });

        }

        function drawLCChartV2(svg, data, formatYTick, prefix, custW, custH, custPAD, custGradId, forceRed) {
            prefix = prefix || '';
            var gradId = custGradId || 'chartGrad';
            var forceRedColor = !!forceRed;
            var W = custW || _lcChartW, H = custH || _lcChartH;
            var PAD = custPAD || _lcPad;
            var chartW = W - PAD.left - PAD.right;
            var chartH = H - PAD.top - PAD.bottom;

            var closes = data.map(function(d) { return d.close; });
            var minP = Math.min.apply(null, closes);
            var maxP = Math.max.apply(null, closes);
            var range = maxP - minP || 1;
            var padP = range * 0.12;
            var yMin = minP - padP;
            var yMax = maxP + padP;
            var yRange = yMax - yMin;
            var n = data.length;

            var xScale = function(i) { return PAD.left + (i / (n - 1 || 1)) * chartW; };
            var yScale = function(v) { return PAD.top + chartH - ((v - yMin) / yRange) * chartH; };

            // ── Grid ─────────────────────────────────────────────────
            var gridG = svg.querySelector('#' + prefix + 'ChartGrid');
            if (gridG) gridG.innerHTML = '';

            var yTicks = 6;
            for (var ti = 0; ti <= yTicks; ti++) {
                var y = PAD.top + (ti / yTicks) * chartH;
                var val = yMax - (ti / yTicks) * yRange;
                var ln = mk('line', { x1: PAD.left, x2: W - PAD.right, y1: y, y2: y, stroke: '#e8e8e8', 'stroke-width': 1 });
                gridG.appendChild(ln);
                var txt = mk('text', { x: PAD.left - 6, y: y + 4, 'text-anchor': 'end', 'font-size': 9, fill: '#999', 'font-family': 'Microsoft YaHei, PingFang SC, Arial, sans-serif' });
                txt.textContent = formatYTick ? formatYTick(val) : (val / 10000).toFixed(2);
                gridG.appendChild(txt);
            }

            // ── X-axis date labels (more frequent) ────────────────────
            var axisXG = svg.querySelector('#' + prefix + 'ChartAxisX');
            if (axisXG) axisXG.innerHTML = '';
            // Show every ~10 days worth of labels
            var step = Math.max(1, Math.floor(n / 8));
            for (var xi = 0; xi < n; xi += step) {
                var x = xScale(xi);
                var d = data[xi];
                if (!d) continue;
                var lbl = mk('text', { x: x, y: H - 6, 'text-anchor': 'middle', 'font-size': 9, fill: '#999', 'font-family': 'Microsoft YaHei, PingFang SC, Arial, sans-serif' });
                lbl.textContent = d.date.split(' ')[0].slice(5, 10);
                axisXG.appendChild(lbl);
            }

            if (n < 2) return;

            var lastClose = closes[n - 1];
            var isUp = lastClose >= closes[0];
            var areaColor = forceRedColor ? '#d32f2f' : (isUp ? '#d32f2f' : '#388e3c');
            var gradEl = svg.querySelector('#' + gradId);
            if (gradEl) gradEl.setAttribute('stop-color', areaColor);

            // ── Area ─────────────────────────────────────────────────
            var areaG = svg.querySelector('#' + prefix + 'ChartArea');
            if (areaG) areaG.innerHTML = '';
            var areaPath = 'M ' + xScale(0) + ',' + yScale(closes[0]);
            for (var ai = 1; ai < n; ai++) areaPath += ' L ' + xScale(ai) + ',' + yScale(closes[ai]);
            areaPath += ' L ' + xScale(n - 1) + ',' + (PAD.top + chartH) + ' L ' + xScale(0) + ',' + (PAD.top + chartH) + ' Z';
            var area = mk('path', { d: areaPath, fill: 'url(#' + gradId + ')' });
            areaG.appendChild(area);

            // ── Line ─────────────────────────────────────────────────
            var lineG = svg.querySelector('#' + prefix + 'ChartLine');
            if (lineG) lineG.innerHTML = '';
            var linePath = 'M ' + xScale(0) + ',' + yScale(closes[0]);
            for (var pi = 1; pi < n; pi++) linePath += ' L ' + xScale(pi) + ',' + yScale(closes[pi]);
            // 浅色线（底层，静态显示）
            var lightLineEl = mk('path', { d: linePath, stroke: areaColor, 'stroke-width': 2, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-opacity': 0.25 });
            lineG.appendChild(lightLineEl);
            // 深色线（上层，初始不可见，等待动画揭幕）
            var lineEl = mk('path', { d: linePath, stroke: areaColor, 'stroke-width': 2, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'class': 'data-line deep-line-anim', 'stroke-dasharray': '10000', 'stroke-dashoffset': '10000' });
            lineG.appendChild(lineEl);

            // ── 末端圆点 + 日期标签（左侧）────────────────────────────
            try {
                var dotsG = svg.querySelector('#' + prefix + 'ChartDots');
                if (dotsG) dotsG.innerHTML = '';

                var lastIdx = n - 1;
                if (lastIdx >= 0 && dotsG) {
                    var lastX = xScale(lastIdx);
                    var lastY = yScale(closes[lastIdx]);

                    // 外圈（模拟发光效果）
                    dotsG.appendChild(mk('circle', {
                        cx: lastX, cy: lastY, r: 8,
                        fill: 'none', stroke: areaColor, 'stroke-width': 2, opacity: 0.4
                    }));
                    // 实心圆点
                    dotsG.appendChild(mk('circle', {
                        cx: lastX, cy: lastY, r: 5,
                        fill: areaColor, stroke: '#fff', 'stroke-width': 2
                    }));

                    // 日期标签（放在左侧）
                    var lastDate = data[lastIdx].date;
                    var month = parseInt(lastDate.slice(5,7));
                    var day = parseInt(lastDate.slice(8,10));
                    var dateLabel = mk('text', {
                        x: lastX - 12, y: lastY - 8,
                        'text-anchor': 'end',
                        'font-size': 10, 'font-weight': 'bold',
                        fill: areaColor,
                        'font-family': 'Microsoft YaHei, PingFang SC, Arial, sans-serif'
                    });
                    dateLabel.textContent = month + '/' + day;
                    dotsG.appendChild(dateLabel);
                }
            } catch (e) {
                console.warn('[LC Chart] end marker error:', e);
            }

            // ── Drag selection overlay ─────────────────────────────────
            var selG = svg.querySelector('#' + prefix + 'ChartSelection');
            if (!selG) {
                selG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                selG.id = prefix + 'ChartSelection';
                svg.appendChild(selG);
            }
            selG.innerHTML = '';

            // Invisible overlay rect for mouse events
            var hitRect = mk('rect', {
                x: PAD.left, y: PAD.top, width: chartW, height: chartH,
                fill: 'transparent', cursor: 'default'
            });
            hitRect.style.pointerEvents = 'all';
            selG.appendChild(hitRect);

            // ── Black crosshair lines ───────────────────────────────────
            var chG = svg.querySelector('#' + prefix + 'ChartCrosshair');
            if (!chG) {
                chG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                chG.id = prefix + 'ChartCrosshair';
                svg.appendChild(chG);
            }
            chG.innerHTML = '';
            var chVert = mk('line', { x1: 0, y1: PAD.top, x2: 0, y2: PAD.top + chartH, stroke: '#555', 'stroke-width': 1, 'stroke-dasharray': '3,2', 'pointer-events': 'none' });
            var chHorz = mk('line', { x1: PAD.left, y1: 0, x2: PAD.left + chartW, y2: 0, stroke: '#555', 'stroke-width': 1, 'stroke-dasharray': '3,2', 'pointer-events': 'none' });
            chG.appendChild(chVert);
            chG.appendChild(chHorz);

            var dragRect = null;
            var tooltip = null;

            function getIdx(e) {
                var rect = svg.getBoundingClientRect();
                var svgX = ((e.clientX - rect.left) / rect.width) * W;
                return Math.max(0, Math.min(n - 1, Math.round(((svgX - PAD.left) / chartW) * (n - 1))));
            }

            hitRect.addEventListener('mousedown', function(e) {
                _lcDragging = true;
                var chG5 = svg.querySelector('#' + prefix + 'ChartCrosshair');
                if (chG5) chG5.style.display = 'none';
                _lcDragStart = getIdx(e);
                _lcDragEnd = _lcDragStart;
            });

            svg.addEventListener('mousemove', function(e) {
                if (!_lcDragging) return;
                _lcDragEnd = getIdx(e);
                renderSelection();
            });

            svg.addEventListener('mouseup', function(e) {
                if (!_lcDragging) return;
                _lcDragging = false;
                _lcDragEnd = getIdx(e);
                renderSelection();
                showRangePopup();
            });

            function renderSelection() {
                selG.innerHTML = '';
                selG.appendChild(hitRect);
                if (_lcDragStart === null || _lcDragEnd === null) return;
                var s = Math.min(_lcDragStart, _lcDragEnd);
                var e2 = Math.max(_lcDragStart, _lcDragEnd);
                if (s === e2) return;
                var x1 = xScale(s), x2 = xScale(e2);
                var selRect = mk('rect', {
                    x: x1, y: PAD.top, width: x2 - x1, height: chartH,
                    fill: 'rgba(30,60,114,0.12)', stroke: '#1e3c72', 'stroke-width': 1, 'stroke-dasharray': '4,2'
                });
                selG.appendChild(selRect);
                // Left/right handles
                [x1, x2].forEach(function(x) {
                    var vln = mk('line', { x1: x, y1: PAD.top, x2: x, y2: PAD.top + chartH, stroke: '#1e3c72', 'stroke-width': 1 });
                    selG.appendChild(vln);
                });
            }

            function showRangePopup() {
                if (_lcDragStart === null || _lcDragEnd === null) return;
                var s = Math.min(_lcDragStart, _lcDragEnd);
                var e2 = Math.max(_lcDragStart, _lcDragEnd);
                if (e2 - s < 2) return;

                var d0 = data[s], d1 = data[e2];
                var pct = ((d1.close - d0.close) / d0.close * 100);
                var container = document.getElementById(prefix + 'ChartContainer');
                if (!container) return;

                if (!tooltip) {
                    tooltip = document.createElement('div');
                    tooltip.id = prefix + 'ChartRangeTip';
                    tooltip.style.cssText = 'position:absolute;background:rgba(30,60,114,0.92);color:white;padding:8px 14px;border-radius:8px;font-size:12px;pointer-events:none;z-index:20;white-space:nowrap;display:none;';
                    container.style.position = 'relative';
                    container.appendChild(tooltip);
                }
                tooltip.innerHTML =
                    '<div style="font-size:11px;opacity:0.7;margin-bottom:4px">' + d0.date + ' ~ ' + d1.date + '</div>' +
                    '<div style="font-size:14px;font-weight:bold">' +
                    (pct >= 0 ? '<span style="color:#ff6b6b">+</span>' : '<span style="color:#69db7c">') +
                    pct.toFixed(2) + '%</span></div>' +
                    '<div style="font-size:10px;opacity:0.6;margin-top:2px">' +
                    (d0.close / 10000).toFixed(3) + ' → ' + (d1.close / 10000).toFixed(3) + ' 万/吨' +
                    '</div>';
                tooltip.style.display = 'block';
                var x1p = (xScale(s) / W * 100);
                var x2p = (xScale(e2) / W * 100);
                var mid = (x1p + x2p) / 2;
                tooltip.style.left = mid + '%';
                tooltip.style.top = '10%';
                tooltip.style.transform = 'translateX(-50%)';

                setTimeout(function() {
                    if (tooltip) tooltip.style.display = 'none';
                }, 3000);
            }

            // ── Hover tooltip (simplified when not dragging) ─────────────
            var hoverTip = null;
            svg.addEventListener('mousemove', function(e) {
                if (_lcDragging) return;
                var idx = getIdx(e);
                var cx = xScale(idx), cy = yScale(data[idx].close);
                // 更新黑色十字线
                var chG2 = svg.querySelector('#' + prefix + 'ChartCrosshair');
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
                    hoverTip = document.getElementById(prefix + 'ChartHoverTip');
                }
                var container = document.getElementById(prefix + 'ChartContainer');
                if (!container) return;
                if (!hoverTip) {
                    hoverTip = document.createElement('div');
                    hoverTip.id = prefix + 'ChartHoverTip';
                    hoverTip.className = 'chart-tooltip';
                    container.style.position = 'relative';
                    container.appendChild(hoverTip);
                }
                var d = data[idx];
                var prevClose = idx > 0 ? data[idx - 1].close : d.close;
                var chgPct = prevClose > 0 ? (d.close - prevClose) / prevClose * 100 : 0;
                var chgVal = d.close - prevClose;
                var chgColor = chgPct > 0 ? '#ef5350' : (chgPct < 0 ? '#66bb6a' : '#999');
                var chgSign = chgPct >= 0 ? '+' : '';
                var unitMap = { 'lc': ' 万/吨', 'wti': ' $/桶', 'ur': ' 元/吨' };
                var unit = unitMap[prefix] || '';
                var priceNum = formatYTick ? formatYTick(d.close) : (d.close / 10000).toFixed(3);
                var priceText = priceNum + unit;
                var changeText = chgSign + chgPct.toFixed(2) + '%';
                hoverTip.innerHTML =
                    '<span style="color:#9bb5d4;font-size:11px">' + d.date + '</span><br>' +
                    '<span style="font-size:13px;font-weight:bold">' + priceText + '</span><br>' +
                    '<span style="color:' + chgColor + ';font-size:11px">' + changeText + '</span>';
                hoverTip.style.display = 'block';
                var xp = xScale(idx) / W;  // 0~1 fraction in SVG coords
                // 如果太靠右（>65%），改到鼠标左侧（减掉一个偏移量）
                if (xp > 0.65) {
                    hoverTip.style.left = 'auto';
                    hoverTip.style.right = (1 - xp + 0.02) * 100 + '%';
                } else {
                    hoverTip.style.right = 'auto';
                    hoverTip.style.left = (xp + 0.015) * 100 + '%';
                }
                hoverTip.style.top = (yScale(d.close) / H * 100) + '%';
            });
            svg.addEventListener('mouseleave', function() {
                if (_lcDragging) return;
                var ht = document.getElementById(prefix + 'ChartHoverTip');
                if (ht) ht.style.display = 'none';
                var chG3 = svg.querySelector('#' + prefix + 'ChartCrosshair');
                if (chG3) chG3.style.display = 'none';
            });
            // 鼠标再次进入时恢复十字线
            svg.addEventListener('mouseenter', function() {
                var chG4 = svg.querySelector('#' + prefix + 'ChartCrosshair');
                if (chG4) chG4.style.display = '';
            });

            function mk(tag, attrs) {
                var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
                for (var k in attrs) el.setAttribute(k, attrs[k]);
                return el;
            }
        }

        // ============================================================
        // 磷酸铁锂价格走势图（动力型 vs 储能型对比）
        // ============================================================
        var _lfpDualChartData = null;
        var _lfpDualChartW = 800, _lfpDualChartH = 260;
        var _lfpDualPad = { top: 15, right: 15, bottom: 35, left: 75 };

        async function initLFPDualChart() {
            var loading = document.getElementById('lfpDualChartLoading');
            var noData = document.getElementById('lfpDualChartNoData');
            var svg = document.getElementById('lfpDualChart');
            if (!svg) return;

            try {
                // 同时加载两个数据源
                var [powerResp, storageResp] = await Promise.all([
                    fetch('reports/lfp_power_history.json?t=' + Date.now()),
                    fetch('reports/lfp_storage_history.json?t=' + Date.now())
                ]);

                if (!powerResp.ok || !storageResp.ok) throw new Error('HTTP error');

                var powerData = await powerResp.json();
                var storageData = await storageResp.json();

                if (!powerData.history || !storageData.history ||
                    powerData.history.length === 0 || storageData.history.length === 0) {
                    if (loading) loading.style.display = 'none';
                    if (noData) noData.style.display = 'flex';
                    return;
                }

                _lfpDualChartData = { power: powerData, storage: storageData };

                // 更新标题栏信息
                var powerLatest = powerData.latest;
                var storageLatest = storageData.latest;
                var priceEl = document.getElementById('lfpDualLatestPrice');
                var changeEl = document.getElementById('lfpDualChange');
                var updatedEl = document.getElementById('lfpDualChartUpdated');

                if (priceEl && powerLatest && storageLatest) {
                    priceEl.innerHTML = '动力: <span style="color:#1e88e5">' + (powerLatest.close / 10000).toFixed(2) +
                        '万</span> / 储能: <span style="color:#43a047">' + (storageLatest.close / 10000).toFixed(2) + '万</span>';
                }
                if (changeEl && powerLatest) {
                    var ppct;
                    if (typeof powerLatest.change_pct === 'number') {
                        // 使用JSON中的change_pct
                        ppct = powerLatest.change_pct;
                    } else if (powerData.history && powerData.history.length >= 2) {
                        // 备用计算方式
                        var hist = powerData.history;
                        var prev = hist[hist.length - 2].close;
                        var curr = powerLatest.close;
                        ppct = prev > 0 ? ((curr - prev) / prev * 100) : 0;
                    } else {
                        // 无法计算涨跌幅
                        ppct = 0;
                    }
                    changeEl.textContent = (ppct >= 0 ? '+' : '') + ppct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (ppct >= 0 ? 'up' : 'down');
                }
                updateTicker('ticker-lfp', (powerLatest.close / 10000).toFixed(2) + '万', ppct);
                if (updatedEl) updatedEl.textContent = 'Update: ' + powerData.update_time;
                updateCategoryTime('lithium-update-time', powerData.update_time);
                if (storageData.update_time) {
                    updateCategoryTime('lithium-update-time', storageData.update_time);
                }

                drawLFPDualChart(svg, powerData.history, storageData.history);
                // 图表已渲染完成，显示SVG（防止旧内容闪屏）
                // 使用 setProperty 设置 !important，覆盖 CSS 的 visibility: hidden !important
                if (svg) svg.style.setProperty('visibility', 'visible', 'important');
                if (noData) noData.style.display = 'none';

                function fitSvgToContainer() {
                    var svg2 = document.getElementById('lfpDualChart');
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
                console.warn('[LFP Dual Chart] load failed:', e);
                if (loading) loading.style.display = 'none';
                if (noData) noData.style.display = 'flex';
            }
        }

        function drawLFPDualChart(svg, powerData, storageData) {
            var W = _lfpDualChartW, H = _lfpDualChartH;
            var PAD = _lfpDualPad;
            var chartW = W - PAD.left - PAD.right;
            var chartH = H - PAD.top - PAD.bottom;

            // 计算统一的价格范围（取两个数据集的最小和最大）
            var allPrices = powerData.map(function(d) { return d.close; })
                .concat(storageData.map(function(d) { return d.close; }));
            var minPrice = Math.min.apply(null, allPrices);
            var maxPrice = Math.max.apply(null, allPrices);
            var priceRange = maxPrice - minPrice || 1;
            var padding = priceRange * 0.1;
            minPrice -= padding; maxPrice += padding;

            // 收集两个数据集的所有唯一日期，排序后作为统一X轴基准
            var allDates = [];
            var dateSet = new Set();
            powerData.forEach(function(d) { dateSet.add(d.date); });
            storageData.forEach(function(d) { dateSet.add(d.date); });
            allDates = Array.from(dateSet).sort();
            var dateToIdx = {};
            allDates.forEach(function(d, i) { dateToIdx[d] = i; });
            var dataLength = allDates.length;
            // 数据保护：空数据直接返回
            if (!powerData || powerData.length === 0 || !storageData || storageData.length === 0) return;

            function xScale(i) { return PAD.left + (i / (dataLength - 1)) * chartW; }
            function xScaleByDate(date) { return xScale(dateToIdx[date] || 0); }
            function yScale(p) { return PAD.top + (1 - (p - minPrice) / (maxPrice - minPrice)) * chartH; }

            var gridG = svg.querySelector('#lfpDualChartGrid');
            var areaPowerG = svg.querySelector('#lfpDualChartAreaPower');
            var areaStorageG = svg.querySelector('#lfpDualChartAreaStorage');
            var linePowerG = svg.querySelector('#lfpDualChartLinePower');
            var lineStorageG = svg.querySelector('#lfpDualChartLineStorage');
            var axisXG = svg.querySelector('#lfpDualChartAxisX');
            var axisYG = svg.querySelector('#lfpDualChartAxisY');

            if (gridG) gridG.innerHTML = '';
            if (areaPowerG) areaPowerG.innerHTML = '';
            if (areaStorageG) areaStorageG.innerHTML = '';
            if (linePowerG) linePowerG.innerHTML = '';
            if (lineStorageG) lineStorageG.innerHTML = '';
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
            for (var j = 0; j <= 6; j++) {
                var x = PAD.left + (j / 6) * chartW;
                gridG.appendChild(mk('line', { x1: x, y1: PAD.top, x2: x, y2: PAD.top + chartH, stroke: '#eee', 'stroke-width': 1 }));
            }

            // 动力型面积图（蓝色）
            var areaPowerPath = 'M' + xScaleByDate(powerData[0].date) + ',' + yScale(powerData[0].close);
            for (var i = 0; i < powerData.length; i++) areaPowerPath += ' L' + xScaleByDate(powerData[i].date) + ',' + yScale(powerData[i].close);
            areaPowerPath += ' L' + xScaleByDate(powerData[powerData.length - 1].date) + ',' + (PAD.top + chartH) + ' L' + xScaleByDate(powerData[0].date) + ',' + (PAD.top + chartH) + ' Z';
            areaPowerG.appendChild(mk('path', { d: areaPowerPath, fill: 'url(#lfpPowerChartGrad)', 'stroke-width': 0 }));

            // 储能型面积图（绿色）
            var areaStoragePath = 'M' + xScaleByDate(storageData[0].date) + ',' + yScale(storageData[0].close);
            for (var i = 0; i < storageData.length; i++) areaStoragePath += ' L' + xScaleByDate(storageData[i].date) + ',' + yScale(storageData[i].close);
            areaStoragePath += ' L' + xScaleByDate(storageData[storageData.length - 1].date) + ',' + (PAD.top + chartH) + ' L' + xScaleByDate(storageData[0].date) + ',' + (PAD.top + chartH) + ' Z';
            areaStorageG.appendChild(mk('path', { d: areaStoragePath, fill: 'url(#lfpStorageChartGrad)', 'stroke-width': 0 }));

            // 动力型折线（蓝色）
            var linePowerPath = 'M' + xScaleByDate(powerData[0].date) + ',' + yScale(powerData[0].close);
            for (var i = 1; i < powerData.length; i++) linePowerPath += ' L' + xScaleByDate(powerData[i].date) + ',' + yScale(powerData[i].close);
            // 浅色线（底层，静态显示）
            linePowerG.appendChild(mk('path', { d: linePowerPath, fill: 'none', stroke: '#1e88e5', 'stroke-width': 2.5, 'stroke-opacity': 0.25 }));
            // 深色线（上层，初始不可见，等待动画揭幕）
            linePowerG.appendChild(mk('path', { d: linePowerPath, fill: 'none', stroke: '#1e88e5', 'stroke-width': 2.5, 'class': 'data-line deep-line-anim', 'stroke-dasharray': '10000', 'stroke-dashoffset': '10000' }));
            
            // 储能型折线（绿色）
            var lineStoragePath = 'M' + xScaleByDate(storageData[0].date) + ',' + yScale(storageData[0].close);
            for (var i = 1; i < storageData.length; i++) lineStoragePath += ' L' + xScaleByDate(storageData[i].date) + ',' + yScale(storageData[i].close);
            // 浅色线（底层，静态显示）
            lineStorageG.appendChild(mk('path', { d: lineStoragePath, fill: 'none', stroke: '#43a047', 'stroke-width': 2.5, 'stroke-opacity': 0.25 }));
            // 深色线（上层，初始不可见，等待动画揭幕）
            lineStorageG.appendChild(mk('path', { d: lineStoragePath, fill: 'none', stroke: '#43a047', 'stroke-width': 2.5, 'class': 'data-line deep-line-anim', 'stroke-dasharray': '10000', 'stroke-dashoffset': '10000' }));

            // ── 末端圆点 + 日期标签（左侧）───────────────────────────
            try {
                var markersG = svg.querySelector('#lfpDualChartMarkers');
                if (markersG) markersG.innerHTML = '';

                var lastDate = allDates[allDates.length - 1];
                var lastX = xScaleByDate(lastDate);
                if (markersG) {

                    // 动力型末端圆点 + 日期（取动力型最后一个数据点）
                    var powerLast = powerData[powerData.length - 1];
                    var powerLastY = yScale(powerLast.close);
                    var powerLastX = xScaleByDate(powerLast.date);
                    // 外圈（模拟发光）
                    markersG.appendChild(mk('circle', {
                        cx: powerLastX, cy: powerLastY, r: 8,
                        fill: 'none', stroke: '#1e88e5', 'stroke-width': 2, opacity: 0.4
                    }));
                    // 实心圆点
                    markersG.appendChild(mk('circle', {
                        cx: powerLastX, cy: powerLastY, r: 5,
                        fill: '#1e88e5', stroke: '#fff', 'stroke-width': 2
                    }));
                    var pd = powerLast.date;
                    var pm = parseInt(pd.slice(5,7)), pday = parseInt(pd.slice(8,10));
                    markersG.appendChild(mk('text', {
                        x: powerLastX - 12, y: powerLastY - 8,
                        'text-anchor': 'end', 'font-size': 10, 'font-weight': 'bold',
                        fill: '#1e88e5',
                        'font-family': 'Microsoft YaHei, PingFang SC, Arial, sans-serif'
                    })).textContent = pm + '/' + pday;

                    // 储能型末端圆点 + 日期（取储能型最后一个数据点）
                    var storageLast = storageData[storageData.length - 1];
                    var storageLastY = yScale(storageLast.close);
                    var storageLastX = xScaleByDate(storageLast.date);
                    markersG.appendChild(mk('circle', {
                        cx: storageLastX, cy: storageLastY, r: 8,
                        fill: 'none', stroke: '#43a047', 'stroke-width': 2, opacity: 0.4
                    }));
                    markersG.appendChild(mk('circle', {
                        cx: storageLastX, cy: storageLastY, r: 5,
                        fill: '#43a047', stroke: '#fff', 'stroke-width': 2
                    }));
                    var sd = storageLast.date;
                    var sm = parseInt(sd.slice(5,7)), sday = parseInt(sd.slice(8,10));
                    markersG.appendChild(mk('text', {
                        x: storageLastX - 12, y: storageLastY - 8,
                        'text-anchor': 'end', 'font-size': 10, 'font-weight': 'bold',
                        fill: '#43a047',
                        'font-family': 'Microsoft YaHei, PingFang SC, Arial, sans-serif'
                    })).textContent = sm + '/' + sday;
                }
            } catch (e) {
                console.warn('[LFP Dual Chart] end marker error:', e);
            }

            // X轴标签
            var step = Math.ceil(dataLength / 6);
            for (var i = 0; i < dataLength; i += step) {
                var x = xScale(i);
                var text = mk('text', { x: x, y: PAD.top + chartH + 20, 'text-anchor': 'middle', fill: '#666', 'font-size': 11 });
                text.textContent = allDates[i].substring(5);
                axisXG.appendChild(text);
            }

            // Y轴标签
            for (var i = 0; i <= 5; i++) {
                var price = minPrice + (maxPrice - minPrice) * (1 - i / 5);
                var y = PAD.top + (i / 5) * chartH;
                var text = mk('text', { x: PAD.left - 10, y: y + 4, 'text-anchor': 'end', fill: '#666', 'font-size': 11 });
                text.textContent = (price / 10000).toFixed(2) + '万';
                axisYG.appendChild(text);
            }

            // 十字线和tooltip（显示两条线的数据）
            var hoverTip = document.getElementById('lfpDualHoverTip');
            if (!hoverTip) {
                hoverTip = document.createElement('div');
                hoverTip.id = 'lfpDualHoverTip';
                hoverTip.style.cssText = 'position:absolute;display:none;background:rgba(30,60,114,0.95);color:#fff;padding:10px 14px;border-radius:4px;font-size:12px;pointer-events:none;z-index:1000;white-space:nowrap;';
                svg.parentElement.appendChild(hoverTip);
            }

            var hitRect = svg.querySelector('.hit-rect-lfp-dual');
            if (!hitRect) {
                hitRect = mk('rect', { class: 'hit-rect-lfp-dual', width: W, height: H, fill: 'transparent', cursor: 'default' });
                svg.appendChild(hitRect);
            }

            var crosshairG = svg.querySelector('#lfpDualCrosshair');
            if (!crosshairG) {
                crosshairG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                crosshairG.id = 'lfpDualCrosshair';
                svg.appendChild(crosshairG);
                crosshairG.appendChild(mk('line', { stroke: '#555', 'stroke-width': 1, 'stroke-dasharray': '3,2', 'pointer-events': 'none' }));
            }

            function getIdx(e) {
                var rect = svg.getBoundingClientRect();
                var rx = (e.clientX - rect.left) * (W / rect.width);
                var idx = Math.round((rx - PAD.left) / chartW * (dataLength - 1));
                return Math.max(0, Math.min(dataLength - 1, idx));
            }

            hitRect.addEventListener('mousemove', function(e) {
                var idx = getIdx(e);
                var dateStr = allDates[idx];
                // 按日期查找对应数据点（可能某一天只有一类数据）
                var powerD = null, storageD = null;
                for (var pi = 0; pi < powerData.length; pi++) {
                    if (powerData[pi].date === dateStr) { powerD = powerData[pi]; break; }
                }
                for (var si = 0; si < storageData.length; si++) {
                    if (storageData[si].date === dateStr) { storageD = storageData[si]; break; }
                }
                if (!powerD && !storageD) return;
                var cx = xScale(idx);
                var line = crosshairG.querySelector('line');
                line.setAttribute('x1', cx); line.setAttribute('x2', cx);
                line.setAttribute('y1', PAD.top); line.setAttribute('y2', PAD.top + chartH);

                // 计算涨跌幅（找各自数据集的前一天）
                var powerChg = 0, storageChg = 0;
                var powerChgSign = '', storageChgSign = '';
                var powerChgColor = '#999', storageChgColor = '#999';
                if (powerD) {
                    var powerPrevIdx = -1;
                    for (var pi = 0; pi < powerData.length; pi++) {
                        if (powerData[pi].date === dateStr) { powerPrevIdx = pi - 1; break; }
                    }
                    var powerPrev = powerPrevIdx >= 0 ? powerData[powerPrevIdx] : powerD;
                    powerChg = powerPrev.close > 0 ? ((powerD.close - powerPrev.close) / powerPrev.close * 100) : 0;
                    powerChgSign = powerChg >= 0 ? '+' : '';
                    powerChgColor = powerChg > 0 ? '#ff6b6b' : (powerChg < 0 ? '#51cf66' : '#999');
                }
                if (storageD) {
                    var storagePrevIdx = -1;
                    for (var si = 0; si < storageData.length; si++) {
                        if (storageData[si].date === dateStr) { storagePrevIdx = si - 1; break; }
                    }
                    var storagePrev = storagePrevIdx >= 0 ? storageData[storagePrevIdx] : storageD;
                    storageChg = storagePrev.close > 0 ? ((storageD.close - storagePrev.close) / storagePrev.close * 100) : 0;
                    storageChgSign = storageChg >= 0 ? '+' : '';
                    storageChgColor = storageChg > 0 ? '#ff6b6b' : (storageChg < 0 ? '#51cf66' : '#999');
                }

                var html = '<div style="margin-bottom:6px;font-weight:bold;border-bottom:1px solid #ffffff40;padding-bottom:4px;">' + dateStr + '</div>';
                if (powerD) {
                    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
                        '<span style="width:8px;height:8px;background:#1e88e5;border-radius:50%;"></span>' +
                        '<span>动力型: </span>' +
                        '<span style="font-weight:bold;">' + (powerD.close / 10000).toFixed(2) + '万</span>' +
                        '<span style="color:' + powerChgColor + ';font-size:11px;">(' + powerChgSign + powerChg.toFixed(2) + '%)</span>' +
                        '</div>';
                }
                if (storageD) {
                    html += '<div style="display:flex;align-items:center;gap:8px;">' +
                        '<span style="width:8px;height:8px;background:#43a047;border-radius:50%;"></span>' +
                        '<span>储能型: </span>' +
                        '<span style="font-weight:bold;">' + (storageD.close / 10000).toFixed(2) + '万</span>' +
                        '<span style="color:' + storageChgColor + ';font-size:11px;">(' + storageChgSign + storageChg.toFixed(2) + '%)</span>' +
                        '</div>';
                }
                hoverTip.innerHTML = html;
                hoverTip.style.display = 'block';

                var xp = cx / W;
                if (xp > 0.65) {
                    hoverTip.style.left = 'auto';
                    hoverTip.style.right = (1 - xp + 0.02) * 100 + '%';
                } else {
                    hoverTip.style.right = 'auto';
                    hoverTip.style.left = (xp + 0.015) * 100 + '%';
                }
                hoverTip.style.top = '20%';
            });

            hitRect.addEventListener('mouseleave', function() {
                hoverTip.style.display = 'none';
                crosshairG.style.display = 'none';
            });
            hitRect.addEventListener('mouseenter', function() {
                crosshairG.style.display = '';
            });
        }

        // ═══════════════════════════════════════════════════════════
        //  磷酸铁价格走势图表
        // ═══════════════════════════════════════════════════════════
        var _fpChartW = 800, _fpChartH = 260;
        var _fpPad = { top: 15, right: 15, bottom: 35, left: 75 };

        async function initFPChart() {
            var loading = document.getElementById('fpChartLoading');
            var noData = document.getElementById('fpChartNoData');
            var svg = document.getElementById('fpChart');
            try {
                var resp = await fetch('reports/iron_phosphate_history.json?t=' + Date.now());
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var data = await resp.json();
                var history = data.history || [];
                if (!history.length) throw new Error('无历史数据');

                // 与LFP一致：默认展示最近53个数据点
                var displayHistory = history.slice(-53);
                drawFPChart(svg, displayHistory);
                // 图表已渲染完成，显示SVG（防止旧内容闪屏）
                // 使用 setProperty 设置 !important，覆盖 CSS 的 visibility: hidden !important
                if (svg) svg.style.setProperty('visibility', 'visible', 'important');
                if (loading) loading.style.display = 'none';

                var latest = displayHistory[displayHistory.length - 1];
                var latestEl = document.getElementById('fpLatestPrice');
                if (latestEl) latestEl.textContent = (latest.close / 10000).toFixed(2) + '万';

                var changeEl = document.getElementById('fpLatestChange');
                if (changeEl) {
                    var fpPct = 0;
                    if (data.latest && typeof data.latest.change_pct === 'number') {
                        fpPct = data.latest.change_pct;
                    } else if (displayHistory.length >= 2) {
                        var prev = displayHistory[displayHistory.length - 2];
                        fpPct = prev.close > 0 ? ((latest.close - prev.close) / prev.close * 100) : 0;
                    }
                    changeEl.textContent = (fpPct >= 0 ? '+' : '') + fpPct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (fpPct >= 0 ? 'up' : 'down');
                }

                var updatedEl = document.getElementById('fpChartUpdated');
                if (updatedEl) updatedEl.textContent = 'Update: ' + latest.date;
                updateCategoryTime('lithium-update-time', data.update_time);

                // 与LFP图表一致：SVG尺寸匹配容器宽度，viewBox等比缩放不拉伸
                function fitFpSvgToContainer() {
                    var svg2 = document.getElementById('fpChart');
                    var parent = svg2 && svg2.parentElement;
                    if (parent) {
                        var pw = parent.clientWidth || 800;
                        svg2.setAttribute('width', pw);
                        svg2.setAttribute('height', Math.round(pw * 260 / 800));
                    }
                }
                fitFpSvgToContainer();
                window.addEventListener('resize', function() { fitFpSvgToContainer(); });

                if (loading) loading.style.display = 'none';
            } catch (e) {
                console.warn('[FP Chart] load failed:', e);
                if (loading) loading.style.display = 'none';
                if (noData) noData.style.display = 'flex';
            }
        }

        
        /**
         * WTI原油期货图表初始化
         */
        var _wtiChartData = null;
        var _wtiChartW = 800, _wtiChartH = 260;
        var _wtiPad = { top: 15, right: 15, bottom: 35, left: 75 };
        
        async function initWTIChart() {
            var loading = document.getElementById('wtiChartLoading');
            var noData = document.getElementById('wtiChartNoData');
            var svg = document.getElementById('wtiFuturesChart');
            if (!svg) return;

            try {
                var resp = await fetch(`reports/wti_history.json?t=${Date.now()}`);
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var hist = await resp.json();

                if (!hist.history || hist.history.length === 0) {
                    if (loading) loading.style.display = 'none';
                    if (noData) noData.style.display = 'flex';
                    return;
                }

                _wtiChartData = hist;

                // 更新最新价格和涨跌
                var latest = hist.latest;
                var priceEl = document.getElementById('wtiChartLatestPrice');
                var changeEl = document.getElementById('wtiChartLatestChange');
                var updatedEl = document.getElementById('wtiChartUpdated');

                if (priceEl) priceEl.textContent = latest.close.toFixed(2) + ' $/桶';
                if (updatedEl) updatedEl.textContent = 'Update: ' + hist.update_time;
                updateCategoryTime('chemical-update-time', hist.update_time);

                var closes = hist.history.map(function(h) { return h.close; });
                var lastIdx = closes.length - 1;
                var prevClose = lastIdx > 0 ? closes[lastIdx - 1] : closes[lastIdx];
                var latestClose = closes[lastIdx];
                var pct = prevClose > 0 ? ((latestClose - prevClose) / prevClose * 100) : 0;
                if (changeEl) {
                    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
                }
                updateTicker('ticker-wti', latest.close.toFixed(2) + ' $/桶', pct);
                // 复用 drawLCChartV2 函数，传入WTI价格格式化函数（美元/桶，保留2位小数）
                drawLCChartV2(svg, hist.history, function(val) { return val.toFixed(2); }, 'wti', null, null, null, 'wtiChartGrad');
                triggerLineRevealAnimation(svg);

                // 适应容器大小
                function fitSvgToContainer() {
                    var svg2 = document.getElementById('wtiFuturesChart');
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
                console.warn('[WTI Chart] load failed:', e);
                if (loading) loading.style.display = 'none';
                if (noData) noData.style.display = 'flex';
            }
        }

        /**
         * WTI原油期货重新渲染（用于面板切换时）
         */
        function renderWTIChart() {
            var svg = document.getElementById('wtiFuturesChart');
            if (!svg || !_wtiChartData || !_wtiChartData.history || _wtiChartData.history.length === 0) return;
            var rect = svg.getBoundingClientRect();
            if (rect.width < 10) return;
            try {
                drawLCChartV2(svg, _wtiChartData.history, function(val) { return val.toFixed(2); }, 'wti', null, null, null, 'wtiChartGrad');
                triggerLineRevealAnimation(svg);
            } catch(e) {
                console.error('[renderWTIChart] draw error:', e);
            }
            // 适应容器大小
            var pw = (svg.parentElement && svg.parentElement.clientWidth) || 800;
            svg.setAttribute('width', pw);
            svg.setAttribute('height', Math.round(pw * 260 / 800));
        }

        /**
         * 尿素期货图表初始化（只加载数据，不渲染）
         */
        var _urChartData = null;
        var _urChartW = 800, _urChartH = 260;
        var _urPad = { top: 15, right: 15, bottom: 35, left: 75 };

        function renderUreaChart() {
            var svg = document.getElementById('urFuturesChart');
            if (!svg || !_urChartData || !_urChartData.history || _urChartData.history.length === 0) return;
            var rect = svg.getBoundingClientRect();
            if (rect.width < 10) return;
            try {
                drawLCChartV2(svg, _urChartData.history, function(val) { return val.toFixed(0); }, 'ur', _urChartW, _urChartH, _urPad, 'chartGrad');
                triggerLineRevealAnimation(svg);
            } catch(e) {
                console.error('[renderUreaChart] draw error:', e);
            }
            // 适应容器大小
            var pw = (svg.parentElement && svg.parentElement.clientWidth) || 800;
            svg.setAttribute('width', pw);
            svg.setAttribute('height', Math.round(pw * 260 / 800));
        }

        async function initUreaChart() {
            var loading = document.getElementById('urChartLoading');
            var noData = document.getElementById('urChartNoData');
            var svg = document.getElementById('urFuturesChart');
            if (!svg) return;

            try {
                var resp = await fetch(`reports/ur_history.json?t=${Date.now()}`);
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var hist = await resp.json();

                if (!hist.history || hist.history.length === 0) {
                    if (loading) loading.style.display = 'none';
                    if (noData) noData.style.display = 'flex';
                    return;
                }

                _urChartData = hist;

                // 更新最新价格和涨跌
                var latest = hist.latest;
                var priceEl = document.getElementById('urChartLatestPrice');
                var changeEl = document.getElementById('urChartLatestChange');
                var updatedEl = document.getElementById('urChartUpdated');

                if (priceEl) priceEl.textContent = latest.close.toFixed(0) + ' 元/吨';
                if (updatedEl) updatedEl.textContent = 'Update: ' + hist.update_time;
                updateCategoryTime('chemical-update-time', hist.update_time);

                var closes = hist.history.map(function(h) { return h.close; });
                var lastIdx = closes.length - 1;
                var prevClose = lastIdx > 0 ? closes[lastIdx - 1] : closes[lastIdx];
                var latestClose = closes[lastIdx];
                var pct = prevClose > 0 ? ((latestClose - prevClose) / prevClose * 100) : 0;
                if (changeEl) {
                    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
                }
                updateTicker('ticker-urea', latest.close.toFixed(0) + ' 元/吨', pct);
                if (loading) loading.style.display = 'none';

                // 仅在容器可见时渲染
                var rect = svg.getBoundingClientRect();
                if (rect.width > 0) {
                    renderUreaChart();
                }
            } catch (e) {
                console.warn('[UR Chart] load failed:', e);
                if (loading) loading.style.display = 'none';
                if (noData) noData.style.display = 'flex';
            }
        }

        // ===== 铂期货主力 =====
        var _ptChartData = null;
        async function initPTChart() {
            var loading = document.getElementById('ptChartLoading');
            var noData = document.getElementById('ptChartNoData');
            var svg = document.getElementById('ptFuturesChart');
            if (!svg) return;
            try {
                var resp = await fetch(`reports/pt_futures_history.json?t=${Date.now()}`);
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var hist = await resp.json();
                if (!hist.history || hist.history.length === 0) {
                    if (loading) loading.style.display = 'none';
                    if (noData) noData.style.display = 'flex';
                    return;
                }
                _ptChartData = hist;
                // 更新最新价格和涨跌
                var latest = hist.latest;
                var priceEl = document.getElementById('ptChartLatestPrice');
                var changeEl = document.getElementById('ptChartLatestChange');
                var updatedEl = document.getElementById('ptChartUpdated');
                if (priceEl) priceEl.textContent = latest.close.toFixed(0) + ' 元/克';
                if (updatedEl) updatedEl.textContent = 'Update: ' + hist.update_time;
                updateCategoryTime('energy-update-time', hist.update_time);
                var closes = hist.history.map(function(h) { return h.close; });
                var lastIdx = closes.length - 1;
                var prevClose = lastIdx > 0 ? closes[lastIdx - 1] : closes[lastIdx];
                var latestClose = closes[lastIdx];
                var pct = prevClose > 0 ? ((latestClose - prevClose) / prevClose * 100) : 0;
                if (changeEl) {
                    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
                }
                if (loading) loading.style.display = 'none';
                // 仅在容器可见时渲染
                var rect = svg.getBoundingClientRect();
                if (rect.width > 0) {
                    renderPTChart();
                }
            } catch (e) {
                console.warn('[PT Chart] load failed:', e);
                if (loading) loading.style.display = 'none';
                if (noData) noData.style.display = 'flex';
            }
        }
        function renderPTChart() {
            var svg = document.getElementById('ptFuturesChart');
            if (!svg || !_ptChartData || !_ptChartData.history || _ptChartData.history.length === 0) return;
            // 过滤数据：2026-01-01 至 2026-06-03
            var filtered = _ptChartData.history.filter(function(d) { return d.date >= '2026-01-01' && d.date <= '2026-12-31'; });
            if (filtered.length === 0) filtered = _ptChartData.history.slice(-60);
            try {
                drawLCChartV2(svg, filtered, function(val) { return val.toFixed(0); }, 'pt', null, null, null, 'ptChartGrad', true);
                triggerLineRevealAnimation(svg);
            } catch(e) { console.error('[renderPTChart] draw error:', e); }
            var pw = (svg.parentElement && svg.parentElement.clientWidth) || 800;
            svg.setAttribute('width', pw);
            svg.setAttribute('height', Math.round(pw * 260 / 800));
        }

        // ===== 钯期货主力 =====
        var _pdChartData = null;
        async function initPDChart() {
            var loading = document.getElementById('pdChartLoading');
            var noData = document.getElementById('pdChartNoData');
            var svg = document.getElementById('pdFuturesChart');
            if (!svg) return;
            try {
                var resp = await fetch(`reports/pd_futures_history.json?t=${Date.now()}`);
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var hist = await resp.json();
                if (!hist.history || hist.history.length === 0) {
                    if (loading) loading.style.display = 'none';
                    if (noData) noData.style.display = 'flex';
                    return;
                }
                _pdChartData = hist;
                var latest = hist.latest;
                var priceEl = document.getElementById('pdChartLatestPrice');
                var changeEl = document.getElementById('pdChartLatestChange');
                var updatedEl = document.getElementById('pdChartUpdated');
                if (priceEl) priceEl.textContent = latest.close.toFixed(0) + ' 元/克';
                if (updatedEl) updatedEl.textContent = 'Update: ' + hist.update_time;
                updateCategoryTime('energy-update-time', hist.update_time);
                var closes = hist.history.map(function(h) { return h.close; });
                var lastIdx = closes.length - 1;
                var prevClose = lastIdx > 0 ? closes[lastIdx - 1] : closes[lastIdx];
                var latestClose = closes[lastIdx];
                var pct = prevClose > 0 ? ((latestClose - prevClose) / prevClose * 100) : 0;
                if (changeEl) {
                    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
                }
                if (loading) loading.style.display = 'none';
                var rect = svg.getBoundingClientRect();
                if (rect.width > 0) {
                    renderPDChart();
                }
            } catch (e) {
                console.warn('[PD Chart] load failed:', e);
                if (loading) loading.style.display = 'none';
                if (noData) noData.style.display = 'flex';
            }
        }
        function renderPDChart() {
            var svg = document.getElementById('pdFuturesChart');
            if (!svg || !_pdChartData || !_pdChartData.history || _pdChartData.history.length === 0) return;
            var filtered = _pdChartData.history.filter(function(d) { return d.date >= '2026-01-01' && d.date <= '2026-12-31'; });
            if (filtered.length === 0) filtered = _pdChartData.history.slice(-60);
            try {
                drawLCChartV2(svg, filtered, function(val) { return val.toFixed(0); }, 'pd', null, null, null, 'pdChartGrad', true);
                triggerLineRevealAnimation(svg);
            } catch(e) { console.error('[renderPDChart] draw error:', e); }
            var pw = (svg.parentElement && svg.parentElement.clientWidth) || 800;
            svg.setAttribute('width', pw);
            svg.setAttribute('height', Math.round(pw * 260 / 800));
        }

        // ===== 铁矿石 =====
        var _iChartData = null;
        async function initIChart() {
            var loading = document.getElementById('iChartLoading');
            var noData = document.getElementById('iChartNoData');
            var svg = document.getElementById('iFuturesChart');
            if (!svg) return;
            try {
                var resp = await fetch(`reports/i_futures_history.json?t=${Date.now()}`);
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var hist = await resp.json();
                if (!hist.history || hist.history.length === 0) {
                    if (loading) loading.style.display = 'none';
                    if (noData) noData.style.display = 'flex';
                    return;
                }
                _iChartData = hist;
                var latest = hist.latest;
                var priceEl = document.getElementById('iChartLatestPrice');
                var changeEl = document.getElementById('iChartLatestChange');
                var updatedEl = document.getElementById('iChartUpdated');
                if (priceEl) priceEl.textContent = latest.close.toFixed(0) + ' 元/吨';
                if (updatedEl) updatedEl.textContent = 'Update: ' + hist.update_time;
                updateCategoryTime('energy-update-time', hist.update_time);
                var closes = hist.history.map(function(h) { return h.close; });
                var lastIdx = closes.length - 1;
                var prevClose = lastIdx > 0 ? closes[lastIdx - 1] : closes[lastIdx];
                var latestClose = closes[lastIdx];
                var pct = prevClose > 0 ? ((latestClose - prevClose) / prevClose * 100) : 0;
                if (changeEl) {
                    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
                }
                updateTicker('ticker-iron', latest.close.toFixed(0) + ' 元/吨', pct);
                if (loading) loading.style.display = 'none';
                // 尝试渲染，带重试机制
                var tries = 0;
                function tryRenderI() {
                    var rect = svg.getBoundingClientRect();
                    var w = rect.width;
                    if (w > 10 && _iChartData && _iChartData.history && _iChartData.history.length > 0) {
                        renderIChart();
                    } else if (tries < 15) {
                        tries++;
                        setTimeout(tryRenderI, 150);
                    }
                }
                requestAnimationFrame(tryRenderI);
            } catch (e) {
                console.warn('[I Chart] load failed:', e);
                if (loading) loading.style.display = 'none';
                if (noData) noData.style.display = 'flex';
            }
        }
        function renderIChart() {
            var svg = document.getElementById('iFuturesChart');
            if (!svg || !_iChartData || !_iChartData.history || _iChartData.history.length === 0) return;
            var filtered = _iChartData.history.filter(function(d) { return d.date >= '2026-01-01' && d.date <= '2026-12-31'; });
            if (filtered.length === 0) filtered = _iChartData.history.slice(-60);
            try {
                drawLCChartV2(svg, filtered, function(val) { return val.toFixed(0); }, 'i', null, null, null, 'iChartGrad', true);
                triggerLineRevealAnimation(svg);
            } catch(e) { console.error('[renderIChart] draw error:', e); }
            var pw = (svg.parentElement && svg.parentElement.clientWidth) || 800;
            svg.setAttribute('width', pw);
            svg.setAttribute('height', Math.round(pw * 260 / 800));
        }

        // ===== 磷矿石30%品位 =====
        var _phosphateChartData = null;
        async function initPhosphateChart() {
            var loading = document.getElementById('phosphateChartLoading');
            var noData = document.getElementById('phosphateChartNoData');
            var svg = document.getElementById('phosphateChart');
            if (!svg) return;
            try {
                var resp = await fetch(`data/phosphate_rock_price.json?t=${Date.now()}`);
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var data = await resp.json();
                if (!data.data || data.data.length === 0) {
                    if (loading) loading.style.display = 'none';
                    if (noData) noData.style.display = 'flex';
                    return;
                }
                _phosphateChartData = data;
                var history = data.data;
                var latest = history[history.length - 1];
                var prev = history.length >= 2 ? history[history.length - 2] : latest;
                var priceEl = document.getElementById('phosphateLatestPrice');
                var changeEl = document.getElementById('phosphateLatestChange');
                var updatedEl = document.getElementById('phosphateChartUpdated');
                if (priceEl) priceEl.textContent = latest.price.toFixed(0) + ' 元/吨';
                if (updatedEl) updatedEl.textContent = 'Update: ' + data.update_time;
                updateCategoryTime('energy-update-time', data.update_time);
                var pct = prev.price > 0 ? ((latest.price - prev.price) / prev.price * 100) : 0;
                if (changeEl) {
                    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
                }
                if (loading) loading.style.display = 'none';
                // 尝试渲染，带重试机制
                var tries = 0;
                function tryRenderPhosphate() {
                    var rect = svg.getBoundingClientRect();
                    var w = rect.width;
                    if (w > 10 && _phosphateChartData && _phosphateChartData.data && _phosphateChartData.data.length > 0) {
                        renderPhosphateChart();
                    } else if (tries < 15) {
                        tries++;
                        setTimeout(tryRenderPhosphate, 150);
                    }
                }
                requestAnimationFrame(tryRenderPhosphate);
            } catch (e) {
                console.warn('[Phosphate Chart] load failed:', e);
                if (loading) loading.style.display = 'none';
                if (noData) noData.style.display = 'flex';
            }
        }
        function renderPhosphateChart() {
            var svg = document.getElementById('phosphateChart');
            if (!svg || !_phosphateChartData || !_phosphateChartData.data || _phosphateChartData.data.length === 0) return;
            var filtered = _phosphateChartData.data.filter(function(d) { return d.date.slice(0,10) >= '2026-01-01'; });
            if (filtered.length === 0) filtered = _phosphateChartData.data.slice(-60);
            // 转换数据格式：price -> close
            var chartData = filtered.map(function(d) {
                return { date: d.date, close: d.price };
            });
            try {
                drawLCChartV2(svg, chartData, function(val) { return val.toFixed(0); }, 'phosphate', null, null, null, 'phosphateChartGrad', true);
                triggerLineRevealAnimation(svg);
            } catch(e) { console.error('[renderPhosphateChart] draw error:', e); }
            var pw = (svg.parentElement && svg.parentElement.clientWidth) || 800;
            svg.setAttribute('width', pw);
            svg.setAttribute('height', Math.round(pw * 260 / 800));
        }

        // ===== 乙二醇 =====
        var _egChartData = null;
        async function initEGChart() {
            var loading = document.getElementById('egChartLoading');
            var noData = document.getElementById('egChartNoData');
            var svg = document.getElementById('egFuturesChart');
            if (!svg) return;
            try {
                var resp = await fetch(`reports/eg_futures_history.json?t=${Date.now()}`);
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var hist = await resp.json();
                if (!hist.history || hist.history.length === 0) {
                    if (loading) loading.style.display = 'none';
                    if (noData) noData.style.display = 'flex';
                    return;
                }
                _egChartData = hist;
                var latest = hist.latest;
                var priceEl = document.getElementById('egChartLatestPrice');
                var changeEl = document.getElementById('egChartLatestChange');
                var updatedEl = document.getElementById('egChartUpdated');
                if (priceEl) priceEl.textContent = latest.close.toFixed(0) + ' 元/吨';
                if (updatedEl) updatedEl.textContent = 'Update: ' + hist.update_time;
                updateCategoryTime('chemical-update-time', hist.update_time);
                var closes = hist.history.map(function(h) { return h.close; });
                var lastIdx = closes.length - 1;
                var prevClose = lastIdx > 0 ? closes[lastIdx - 1] : closes[lastIdx];
                var latestClose = closes[lastIdx];
                var pct = prevClose > 0 ? ((latestClose - prevClose) / prevClose * 100) : 0;
                if (changeEl) {
                    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
                }
                updateTicker('ticker-eg', latest.close.toFixed(0) + ' 元/吨', pct);
                if (loading) loading.style.display = 'none';
                // 尝试渲染，带重试机制
                var tries = 0;
                function tryRenderEG() {
                    var rect = svg.getBoundingClientRect();
                    var w = rect.width;
                    if (w > 10 && _egChartData && _egChartData.history && _egChartData.history.length > 0) {
                        renderEGChart();
                    } else if (tries < 15) {
                        tries++;
                        setTimeout(tryRenderEG, 150);
                    }
                }
                requestAnimationFrame(tryRenderEG);
            } catch (e) {
                console.warn('[EG Chart] load failed:', e);
                if (loading) loading.style.display = 'none';
                if (noData) noData.style.display = 'flex';
            }
        }
        function renderEGChart() {
            var svg = document.getElementById('egFuturesChart');
            if (!svg || !_egChartData || !_egChartData.history || _egChartData.history.length === 0) return;
            var filtered = _egChartData.history.filter(function(d) { return d.date >= '2026-01-01' && d.date <= '2026-12-31'; });
            if (filtered.length === 0) filtered = _egChartData.history.slice(-60);
            try {
                drawLCChartV2(svg, filtered, function(val) { return val.toFixed(0); }, 'eg', null, null, null, 'egChartGrad');
                triggerLineRevealAnimation(svg);
            } catch(e) { console.error('[renderEGChart] draw error:', e); }
            var pw = (svg.parentElement && svg.parentElement.clientWidth) || 800;
            svg.setAttribute('width', pw);
            svg.setAttribute('height', Math.round(pw * 260 / 800));
        }

        function drawFPChart(svg, data) {
            var W = _fpChartW, H = _fpChartH;
            var PAD = _fpPad;
            var chartW = W - PAD.left - PAD.right;
            var chartH = H - PAD.top - PAD.bottom;

            var closes = data.map(function(d) { return d.close; });
            var minPrice = Math.min.apply(null, closes);
            var maxPrice = Math.max.apply(null, closes);
            var priceRange = maxPrice - minPrice || 1;
            var padding = priceRange * 0.1;
            minPrice -= padding;
            maxPrice += padding;
            var dataLength = data.length;

            function xScale(i) { return PAD.left + (i / (dataLength - 1 || 1)) * chartW; }
            function yScale(p) { return PAD.top + (1 - (p - minPrice) / (maxPrice - minPrice)) * chartH; }
            function mk(tag, attrs) {
                var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
                for (var k in attrs) el.setAttribute(k, attrs[k]);
                return el;
            }

            var gridG = svg.querySelector('#fpChartGrid');
            var areaG = svg.querySelector('#fpChartArea');
            var lineG = svg.querySelector('#fpChartLine');
            var axisXG = svg.querySelector('#fpChartAxisX');
            var axisYG = svg.querySelector('#fpChartAxisY');
            var markersG = svg.querySelector('#fpChartMarkers');

            if (gridG) gridG.innerHTML = '';
            if (areaG) areaG.innerHTML = '';
            if (lineG) lineG.innerHTML = '';
            if (axisXG) axisXG.innerHTML = '';
            if (axisYG) axisYG.innerHTML = '';
            if (markersG) markersG.innerHTML = '';

            // 网格线：与LFP一致
            for (var i = 0; i <= 5; i++) {
                var y = PAD.top + (i / 5) * chartH;
                gridG.appendChild(mk('line', { x1: PAD.left, y1: y, x2: PAD.left + chartW, y2: y, stroke: '#eee', 'stroke-width': 1 }));
            }
            for (var j = 0; j <= 6; j++) {
                var x = PAD.left + (j / 6) * chartW;
                gridG.appendChild(mk('line', { x1: x, y1: PAD.top, x2: x, y2: PAD.top + chartH, stroke: '#eee', 'stroke-width': 1 }));
            }

            // 面积图与折线：与LFP一致风格
            var areaPath = 'M' + PAD.left + ',' + yScale(data[0].close);
            for (var a = 0; a < data.length; a++) areaPath += ' L' + xScale(a) + ',' + yScale(data[a].close);
            areaPath += ' L' + xScale(data.length - 1) + ',' + (PAD.top + chartH) + ' L' + PAD.left + ',' + (PAD.top + chartH) + ' Z';
            areaG.appendChild(mk('path', { d: areaPath, fill: 'url(#fpChartGrad)', 'stroke-width': 0 }));

            var linePath = 'M' + PAD.left + ',' + yScale(data[0].close);
            for (var p = 1; p < data.length; p++) linePath += ' L' + xScale(p) + ',' + yScale(data[p].close);
            // 浅色线（底层，静态显示）
            lineG.appendChild(mk('path', { d: linePath, fill: 'none', stroke: '#ff9800', 'stroke-width': 2.5, 'stroke-opacity': 0.25 }));
            // 深色线（上层，初始不可见，等待动画揭幕）
            lineG.appendChild(mk('path', { d: linePath, fill: 'none', stroke: '#ff9800', 'stroke-width': 2.5, 'class': 'data-line deep-line-anim', 'stroke-dasharray': '10000', 'stroke-dashoffset': '10000' }));

            // ── 末端圆点 + 日期标签（左侧）───────────────────────────
            try {
                var lastIdx2 = data.length - 1;
                if (lastIdx2 >= 0) {
                    var lastX2 = xScale(lastIdx2);
                    var lastY2 = yScale(data[lastIdx2].close);
                    var fpColor = '#ff9800';

                    // 外圈（模拟发光）
                    markersG.appendChild(mk('circle', {
                        cx: lastX2, cy: lastY2, r: 8,
                        fill: 'none', stroke: fpColor, 'stroke-width': 2, opacity: 0.4
                    }));
                    // 实心圆点
                    markersG.appendChild(mk('circle', {
                        cx: lastX2, cy: lastY2, r: 5,
                        fill: fpColor, stroke: '#fff', 'stroke-width': 2
                    }));

                    // 日期标签（放在左侧）
                    var d2 = data[lastIdx2].date;
                    var m2 = parseInt(d2.slice(5,7)), day2 = parseInt(d2.slice(8,10));
                    var lbl2 = mk('text', {
                        x: lastX2 - 12, y: lastY2 - 8,
                        'text-anchor': 'end',
                        'font-size': 10, 'font-weight': 'bold',
                        fill: fpColor,
                        'font-family': 'Microsoft YaHei, PingFang SC, Arial, sans-serif'
                    });
                    lbl2.textContent = m2 + '/' + day2;
                    markersG.appendChild(lbl2);
                }
            } catch (e) {
                console.warn('[FP Chart] end marker error:', e);
            }

            // X轴标签：与LFP一致
            var step = Math.ceil(dataLength / 6);
            for (var xi = 0; xi < dataLength; xi += step) {
                var x2 = xScale(xi);
                var textX = mk('text', { x: x2, y: PAD.top + chartH + 20, 'text-anchor': 'middle', fill: '#666', 'font-size': 11 });
                textX.textContent = data[xi].date.substring(5);
                axisXG.appendChild(textX);
            }

            // Y轴标签：与LFP一致
            for (var yi = 0; yi <= 5; yi++) {
                var price = minPrice + (maxPrice - minPrice) * (1 - yi / 5);
                var y2 = PAD.top + (yi / 5) * chartH;
                var textY = mk('text', { x: PAD.left - 10, y: y2 + 4, 'text-anchor': 'end', fill: '#666', 'font-size': 11 });
                textY.textContent = (price / 10000).toFixed(2) + '万';
                axisYG.appendChild(textY);
            }

            // Hover 与十字线：沿用LFP体验
            var hoverTip = document.getElementById('fpHoverTip');
            if (!hoverTip) {
                hoverTip = document.createElement('div');
                hoverTip.id = 'fpHoverTip';
                hoverTip.style.cssText = 'position:absolute;display:none;background:rgba(30,60,114,0.95);color:#fff;padding:10px 14px;border-radius:4px;font-size:12px;pointer-events:none;z-index:1000;white-space:nowrap;';
                svg.parentElement.appendChild(hoverTip);
            }

            var hitRect = svg.querySelector('.hit-rect-fp');
            if (!hitRect) {
                hitRect = mk('rect', { class: 'hit-rect-fp', width: W, height: H, fill: 'transparent', cursor: 'default' });
                svg.appendChild(hitRect);
            }

            var crosshairG = svg.querySelector('#fpCrosshair');
            if (!crosshairG) {
                crosshairG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                crosshairG.id = 'fpCrosshair';
                svg.appendChild(crosshairG);
                crosshairG.appendChild(mk('line', { stroke: '#555', 'stroke-width': 1, 'stroke-dasharray': '3,2', 'pointer-events': 'none' }));
            }

            function getIdx(e) {
                var rect = svg.getBoundingClientRect();
                var rx = (e.clientX - rect.left) * (W / rect.width);
                var idx = Math.round((rx - PAD.left) / chartW * (dataLength - 1));
                return Math.max(0, Math.min(dataLength - 1, idx));
            }

            hitRect.onmousemove = function(e) {
                var idx = getIdx(e);
                var d2 = data[idx];
                var cx = xScale(idx);
                var line = crosshairG.querySelector('line');
                line.setAttribute('x1', cx);
                line.setAttribute('x2', cx);
                line.setAttribute('y1', PAD.top);
                line.setAttribute('y2', PAD.top + chartH);

                var prev = idx > 0 ? data[idx - 1].close : d2.close;
                var chg = prev > 0 ? ((d2.close - prev) / prev * 100) : 0;
                var sign = chg >= 0 ? '+' : '';
                var chgColor = chg > 0 ? '#ff6b6b' : (chg < 0 ? '#51cf66' : '#999');

                hoverTip.innerHTML =
                    '<div style="margin-bottom:6px;font-weight:bold;border-bottom:1px solid #ffffff40;padding-bottom:4px;">' + d2.date + '</div>' +
                    '<div style="display:flex;align-items:center;gap:8px;">' +
                    '<span style="width:8px;height:8px;background:#ff9800;border-radius:50%;"></span>' +
                    '<span>无水型: </span>' +
                    '<span style="font-weight:bold;">' + (d2.close / 10000).toFixed(2) + '万</span>' +
                    '<span style="color:' + chgColor + ';font-size:11px;">(' + sign + chg.toFixed(2) + '%)</span>' +
                    '</div>';
                hoverTip.style.display = 'block';

                var xp = cx / W;
                if (xp > 0.65) {
                    hoverTip.style.left = 'auto';
                    hoverTip.style.right = (1 - xp + 0.02) * 100 + '%';
                } else {
                    hoverTip.style.right = 'auto';
                    hoverTip.style.left = (xp + 0.015) * 100 + '%';
                }
                hoverTip.style.top = '20%';
            };

            hitRect.onmouseleave = function() {
                hoverTip.style.display = 'none';
                crosshairG.style.display = 'none';
            };
            hitRect.onmouseenter = function() {
                crosshairG.style.display = '';
            };
        }

        // 全局常量：必须在 DOMContentLoaded 之前定义，供 init() 使用
        const LI_BUIS = ['sdmd','lpsd','czly','felt','sjl'];
        const CHEM_BUIS = ['lubricant','kelan','dkhx'];
        const HYDROGEN_BUIS = ['bych'];
        const PENTAGON_POS = {
            'sdmd':'pos-top-left','lpsd':'pos-top-right',
            'czly':'pos-center','felt':'pos-bottom-left','sjl':'pos-bottom-right'
        };

        window.addEventListener('DOMContentLoaded', function() {
            initLCChart();
            initBatteryGradeChart();
            initIndustrialGradeChart();
            initLFPDualChart();
            initFPChart();
            initWTIChart();
            initUreaChart();
            initPTChart();
            initPDChart();
            initIChart();
            initPhosphateChart();
            initEGChart();
            init();
        });
;


// ═══════════════════════════════════════════════════
// 雷达历史存档：每月手动填入数据后自动计算 dims/kpis
// 数据来源：3月总结及4月计划PDF + 4月总结及5月计划TXT + 5月总结及6月计划TXT
// D1 从7项KPI达成率(各cap100%)取平均；利润=(毛利+扣非)/2；成本=target/actual；营收=收入达成率
// D2-D6 采用MoM环比(curr/prev)：在研课题/MCU/技改 cap120；MCU降本=null(剔除)

        // 2026-07-24 改造：雷达历史数据外置到 reports/radar_history.js
        // 用 <script> 注入
        var RADAR_HISTORY = window.__RADAR_HISTORY__ || {};
        if (Object.keys(RADAR_HISTORY).length === 0) {
            (function(){
                var s = document.createElement('script');
                s.src = 'reports/radar_history.js?v=20260724_002';
                s.async = false;
                document.head.appendChild(s);
            })();
        }

// 月份列表生成：从 RADAR_HISTORY 推算
function getHistoryMonths(buId) {
    const hist = RADAR_HISTORY[buId];
    if (!hist) return [];
    return Object.keys(hist).sort().reverse(); // 最新在前
}

// 获取当前视图的有效数据源（当月 vs 历史月份）
function getBuTableData(buId) {
    const focusMonth = window._histFocusMonth;
    if (focusMonth) {
        const hist = RADAR_HISTORY[buId] && RADAR_HISTORY[buId][focusMonth];
        if (hist && hist._kpiComparison) return hist;
    }
    return BUS_DATA[buId];
}

// ═══════════════════════════════════════════════════
// 事业部差异化权重（与 radar_hub.html BU_WEIGHTS 完全一致）
// ═══════════════════════════════════════════════════
const BU_WEIGHTS = {
    sdmd:   [0.18, 0.18, 0.20, 0.15, 0.18, 0.11],
    felt:   [0.15, 0.20, 0.22, 0.18, 0.15, 0.10],
    lhy:    [0.18, 0.22, 0.15, 0.22, 0.15, 0.08],
    lubricant: [0.18, 0.22, 0.15, 0.22, 0.15, 0.08],  // lhy 同套权重
    sjld:   [0.15, 0.18, 0.15, 0.17, 0.25, 0.10],
    sjl:    [0.15, 0.18, 0.15, 0.17, 0.25, 0.10],      // sjld 同套权重
    dhx:    [0.20, 0.22, 0.18, 0.15, 0.15, 0.10],
    dkhx:   [0.20, 0.22, 0.18, 0.15, 0.15, 0.10],      // dhx 同套权重
    lpsd:   [0.20, 0.20, 0.18, 0.17, 0.13, 0.12],
    kls:    [0.18, 0.22, 0.15, 0.22, 0.15, 0.08],
    kelan:  [0.18, 0.22, 0.15, 0.22, 0.15, 0.08],      // kls 同套权重
    czly:   [0.20, 0.20, 0.18, 0.17, 0.13, 0.12],
    bych:   [0.20, 0.20, 0.18, 0.17, 0.13, 0.12],      // 默认权重
};
const DEFAULT_WEIGHTS = [0.20, 0.20, 0.18, 0.17, 0.13, 0.12];

// ═══════════════════════════════════════════════════
// 事业部专属 DIMS（与 radar_detail_*.html 中的 DIMS_DEF_* 完全一致）
// 仅 name（维度中文名）和 kpis（4项指标）因 BU 而异；id/color/weight 全局统一
// ═══════════════════════════════════════════════════
const BU_DIMS = {
    // ── 法恩莱特 ──────────────────────────────────────
    felt: {
        d1: { name:'核心KPI',   kpis:['销量达成率','收入达成率','毛利率','回款率'] },
        d2: { name:'经营效益',  kpis:['电解液销量','营业收入','净利润','回款率'] },
        d3: { name:'运营效率',  kpis:['采购降本率','目标达成率','产能利用率','回款率'] },
        d4: { name:'技术创新力',kpis:['新产品配方销量','技术交流','在研项目','配方开发'] },
        d5: { name:'风险合规',  kpis:['安全隐患整改率','安全教育完成率','排查隐患','客户投诉'] },
        d6: { name:'组织活力',  kpis:['AI项目立项','新客户开发','人才引进','数字化项目'] },
    },
    // ── 山东美多 ──────────────────────────────────────
    sdmd: {
        d1: { name:'核心KPI',   kpis:['收入达成率','利润达成率','成本控制率','回款率'] },
        d2: { name:'经营效益',  kpis:['碳酸锂销量','修复LFP交付','磷铁液交付','元明粉销售'] },
        d3: { name:'运营效率',  kpis:['碳酸锂投料','碳酸锂产出','磷铁液产出','加工成本'] },
        d4: { name:'技术创新力',kpis:['在研课题','MCU项目','技改项目','MCU降本'] },
        d5: { name:'风险合规',  kpis:['隐患整改率','安全教育','排查隐患','应急演练'] },
        d6: { name:'组织活力',  kpis:['AI项目立项','企业荣誉','IATF审核问题','5S覆盖率'] },
    },
    // ── 润滑油 ──────────────────────────────────────
    lubricant: {
        d1: { name:'战略执行力',kpis:['收入达成率','净利润达成率','毛利率达成率','费用控制率'] },
        d2: { name:'经营效益',  kpis:['冷却液销售','汽机油销售','柴机油销售','变速箱油销售'] },
        d3: { name:'运营效率',  kpis:['海外市场销售','工业油销售','玻璃水销售','应收账款周转'] },
        d4: { name:'技术创新力',kpis:['新产品配方数','OEM认证取得','技术降本项目','技术服务项目'] },
        d5: { name:'风险合规',  kpis:['质量体系审核','环境安全合规','客户投诉率','供应商审核'] },
        d6: { name:'组织活力',  kpis:['AI项目立项','新客户开发数','人才引进','数字化项目'] },
    },
    // ── 可兰素 ──────────────────────────────────────
    kelan: {
        d1: { name:'核心KPI',   kpis:['收入达成率','净利润达成率','毛利率达成率','费用控制率'] },
        d2: { name:'经营效益',  kpis:['AdBlue销量','尿素溶液销售','渠道覆盖率','OEM配套数量'] },
        d3: { name:'运营效率',  kpis:['产能利用率','一次合格率','生产成本','配送时效'] },
        d4: { name:'技术创新力',kpis:['新产品配方数','OEM认证取得','国六适配型号','技术服务'] },
        d5: { name:'风险合规',  kpis:['ISO认证','环保合规','安全生产','客户投诉率'] },
        d6: { name:'组织活力',  kpis:['AI项目立项','新市场开拓','人才引进','数字化项目'] },
    },
    // ── 迪克化学 ──────────────────────────────────────
    dkhx: {
        d1: { name:'战略执行力',kpis:['收入达成率','利润达成率','毛利率','费用控制率'] },
        d2: { name:'经营效益',  kpis:['冷却液销售','制动液销售','防冻液销售','其他化学品'] },
        d3: { name:'运营效率',  kpis:['准时交付率','存货周转率','应收账款天数','采购降本'] },
        d4: { name:'技术创新力',kpis:['新产品开发','OEM认证','技术降本','研发费用率'] },
        d5: { name:'风险合规',  kpis:['质量体系','环保合规','客户投诉率','供应商审核'] },
        d6: { name:'组织活力',  kpis:['AI项目立项','新客户开发','人才引进','数字化项目'] },
    },
    // ── 龙蟠时代 ──────────────────────────────────────
    lpsd: {
        d1: { name:'战略执行力',kpis:['收入达成率','利润达成率','毛利率','费用控制率'] },
        d2: { name:'经营效益',  kpis:['碳酸锂销售','前驱体销售','库存周转','客户结构'] },
        d3: { name:'运营效率',  kpis:['准时交付率','存货周转率','应收账款天数','采购降本'] },
        d4: { name:'技术创新力',kpis:['新产品开发','OEM认证','技术降本','研发费用率'] },
        d5: { name:'风险合规',  kpis:['质量体系','环保合规','客户投诉率','供应商审核'] },
        d6: { name:'组织活力',  kpis:['AI项目立项','新客户开发','人才引进','数字化项目'] },
    },
    // ── 三金锂电 ──────────────────────────────────────
    sjl: {
        d1: { name:'核心KPI',   kpis:['净利润达成率','管理费用控制率','主材降本达成率','回款率'] },
        d2: { name:'基建进度',  kpis:['竣工验收进度','正常化项目','机电板块进度','土建板块进度'] },
        d3: { name:'运营准备',  kpis:['元明粉出售','正常化施工','代工客户洽谈','成本测算'] },
        d4: { name:'客户开发与技术',kpis:['Ni93样品交付','BTR客户推进','GEM代工洽谈','LGES客户开发'] },
        d5: { name:'竣工验收与合规',kpis:['竣工验收达成','专项报告编制','EHS合规整改','三体系审核'] },
        d6: { name:'组织活力',  kpis:['人员稳定性','跨组织支援','数字化项目','AI创新项目'] },
    },
    // ── 常州锂源 ──────────────────────────────────────
    czly: {
        d1: { name:'战略执行力',kpis:['收入达成率','利润达成率','毛利率','费用控制率'] },
        d2: { name:'经营效益',  kpis:['磷酸铁锂销量','新品销量','库存周转','客户结构'] },
        d3: { name:'运营效率',  kpis:['产能利用率','一次合格率','加工成本','准时交付率'] },
        d4: { name:'技术创新力',kpis:['新品研发','高密度LFP','快充型LFP','工艺改进'] },
        d5: { name:'风险合规',  kpis:['质量体系','环保安全','一次合格率','客户投诉率'] },
        d6: { name:'组织活力',  kpis:['AI项目立项','新客户开发','人才引进','数字化项目'] },
    },
    // ── 铂源催化 ──────────────────────────────────────（无专属页面，使用默认）
    bych: null, // 使用全局 DIMS
};

// ═══════════════════════════════════════════════════
// 六边形评价体系（全局默认，用于 bych 等无专属 DIMS 的 BU）
// ═══════════════════════════════════════════════════
const DIMS = [
    { id:'d1', name:'核心考核指标', color:'#1a6b9e', weight:0.20, order:0,
      kpis:['KPI综合达成率','利润达成率','成本控制率','营收增长率'] },
    { id:'d2', name:'经营效益',   color:'#2e7d5a', weight:0.20, order:1,
      kpis:['碳酸锂销量','修复LFP交付','磷铁液交付','元明粉销售'] },
    { id:'d3', name:'运营效率',   color:'#7b4fa8', weight:0.18, order:2,
      kpis:['碳酸锂投料','碳酸锂产出','磷铁液产出','加工成本'] },
    { id:'d4', name:'技术创新力', color:'#c0572a', weight:0.17, order:3,
      kpis:['在研课题','MCU项目','技改项目','MCU降本'] },
    { id:'d5', name:'风险合规',   color:'#b5862a', weight:0.13, order:4,
      kpis:['隐患整改率','安全教育','排查隐患','应急演练'] },
    { id:'d6', name:'组织活力',   color:'#2a6b7c', weight:0.12, order:5,
      kpis:['AI项目立项','企业荣誉','IATF审核问题','5S覆盖率'] },
];

const BUS_DATA = {
    czly:{ name:'常州锂源', logo:'', tag:'新能源材料', accent:'#00d4ff', detailPage:'radar_detail_czly.html',
        dims:{d1:62,d2:82,d3:86,d4:52,d5:90,d6:52},
        kpis:{d1:[62,88,65,90],d2:[77,98,98,85],d3:[105,100,96,75],d4:[58,67,60,58],d5:[100,100,100,100],d6:[65,25,60,88]}},
    lpsd:{ name:'龙蟠时代', logo:'', tag:'电芯智造', accent:'#4caf50', detailPage:'radar_detail_lpsd.html',
        // 数据来源：radar_hub.html BU_HISTORY lpsd 2026-05
        dims:{d1:58,d2:88,d3:75,d4:85,d5:85,d6:75},
        kpis:{d1:[58,58,58,58],d2:[88,88,88,88],d3:[75,75,75,75],d4:[85,85,85,85],d5:[85,85,85,85],d6:[75,75,75,75]}},
    sjl:{ name:'三金锂电', logo:'', tag:'三元前驱体', accent:'#ff9800', detailPage:'radar_detail_sjl.html',
        // 数据来源：radar_hub.html BU_HISTORY sjld 2026-06
        dims:{d1:58,d2:45,d3:52,d4:72,d5:55,d6:52},
        kpis:{d1:[89,76,60,100],d2:[70,50,45,10],d3:[65,50,50,55],d4:[85,80,50,30],d5:[70,50,95,30],d6:[55,55,65,40]}},
    felt:{ name:'法恩莱特', logo:'', tag:'电解液', accent:'#9c27b0', detailPage:'radar_detail_felt.html',
        // 数据来源：radar_hub.html BU_HISTORY felt 2026-06
        dims:{d1:52,d2:38,d3:60,d4:80,d5:100,d6:60},
        kpis:{
            d1:[52, 67, 33, 100],
            d2:[52, 67, 65, 96],
            d3:[62, 84, 59, 96],
            d4:[116, 86, 100, 54],
            d5:[100, 100, 100, 100],
            d6:[0, 50, 50, 0]
        },
        _isCurrent: true,
        _history: {
            '2026-04': {
                dims:{d1:20,d2:15,d3:47,d4:100,d5:71,d6:50},
                kpis:{
                    d1:[53,58,-52,88,0,78,69],
                    d2:[53,58,-52,0],
                    d3:[62,31],
                    d4:[100,100],
                    d5:[92,50],
                    d6:[50,50]
                },
                _kpiComparison: {
                    title: '4月核心KPI达成率',
                    period: '2026年4月',
                    items: [
                        { name:'销量(吨)',        budget:7795,  target:4500,  actual:4155,  unit:'吨' },
                        { name:'销售收入(万)',   budget:17053, target:10456, actual:9887,  unit:'万' },
                        { name:'毛利率(%)',      budget:4.8,   target:0.4,   actual:-2.5,  unit:'%' },
                        { name:'期间费用(万)',    budget:366,   target:322,   actual:322,   unit:'万' },
                        { name:'净利润(万)',      budget:443,   target:-263,  actual:-558, unit:'万' },
                        { name:'经营现金流(万)', budget:461,   target:303,   actual:362,   unit:'万' },
                        { name:'到期回款率(%)',  budget:90,    target:90,    actual:69,    unit:'%' },
                    ]
                },
                _dimComparison_d2: {
                    title: '4月经营效益',
                    items: [
                        { name:'销量达成率(%)',   budget:7795, target:4500, actual:4155, unit:'%' },
                        { name:'收入达成率(%)',    budget:17053, target:10456, actual:9887, unit:'%' },
                        { name:'毛利率(%)',       budget:4.8,   target:0, actual:-2.5,  unit:'%' },
                        { name:'净利率(%)',       budget:443,   target:0,    actual:-558, unit:'%' },
                    ]
                },
                _dimComparison_d3: {
                    title: '4月运营效率',
                    items: [
                        { name:'采购量达成率(%)', budget:6477, target:5438, actual:4007, unit:'%' },
                        { name:'降本率(%)',       budget:0,    target:6,    actual:1.85, unit:'%' },
                    ]
                },
                _dimComparison_d4: {
                    title: '4月技术创新力',
                    format: 'mom',
                    items: [
                        { name:'新产品销量(吨)',   prev:0,  curr:580, unit:'吨' },
                        { name:'采购降本(万)',     prev:0,  curr:168.91, unit:'万' },
                    ]
                },
                _dimComparison_d5: {
                    title: '4月风险合规',
                    format: 'mom',
                    items: [
                        { name:'采购及时到货率(%)', prev:0, curr:92, unit:'%' },
                        { name:'客户审核通过(家)',  prev:0, curr:1,  unit:'家' },
                    ]
                },
                _dimComparison_d6: {
                    title: '4月组织活力',
                    format: 'mom',
                    items: [
                        { name:'战略协议签订(项)', prev:0, curr:0, unit:'项' },
                        { name:'AI项目立项(项)',   prev:0, curr:0, unit:'项' },
                    ]
                }
            }
        }
    },
    sdmd:{ name:'山东美多', logo:'', tag:'回收再利用', accent:'#e91e63', detailPage:'radar_detail_sdmd.html',
        // SDMD 2026年6月真实数据：对比表原始数据驱动自动计算
        dims:{d1:76,d2:74,d3:78,d4:89,d5:74,d6:100},
        kpis:{
            // D1: KPI综合达成率72.3%, 利润达成率35.9%, 成本控制率93.9%, 营收达成率100.0%
            d1:[72.3, 35.9, 93.9,100.0],
            // D2: 碳酸锂208t/330t→63.0%, 修复LFP310t/300t→100.0%, 磷铁液1400/4500→31.1%, 元明粉1500/1500→100.0%
            d2:[63.0,100.0, 31.1,100.0],
            // D3: 投料1945.5/1960→99.3%×0.88→87.4%, 产出364.5/330→100.0%, 磷铁液1453.64/4500→32.3%, 成本1.99/2.12→93.9%
            d3:[87.4,100.0, 32.3, 93.9],
            // D4: 在研课题10/8→100.0%, MCU项目12/5→100.0%, 技改8/12→66.7%, MCU降本(剔除)
            d4:[100.0,100.0, 66.7,  null],
            // D5: 隐患整改率88.48/98.3→90.0%, 安全教育1075/2009→53.5%, 排查隐患1519/2816→53.9%, 应急演练3/1→100.0%
            d5:[90.0, 53.5, 53.9,100.0],
            // D6: AI项目72/16→100.0%, 企业荣誉4/2→100.0%, IATF审核35/35→100.0%, 5S覆盖率100/100→100.0%
            d6:[100.0,100.0,100.0,100.0]
        },
        // 追加：6月预算 vs 实际达成对照表（用于弹窗扩展展示）
        _kpiComparison: {
            title: '6月核心KPI达标率（预算 → 实际）',
            period: '2026年6月',
            items: [
                { name:'收入(万元)',    budget:3914, target:3914, actual:4682,  unit:'万元' },
                { name:'毛利(万元)',    budget:356,  target:356,  actual:187,   unit:'万元' },
                { name:'扣非净利润(万元)', budget:170, target:170, actual:2,    unit:'万元' },
                { name:'经营净利润(万元)', budget:182, target:182, actual:34,   unit:'万元' },
                { name:'回款(万元)',    budget:4423, target:4423, actual:10072, unit:'万元' },
                { name:'加工成本(万/t)', budget:1.99, target:1.99, actual:2.12, unit:'万/t' },
                { name:'产品一次合格率',  budget:100,  target:100,  actual:100,  unit:'%' }
            ]
        },
        // 各维度子表：展开对应维度后显示
        _dimComparison_d2: {
            title: '6月产品销量达成（预算 → 目标 → 实际）',
            items: [
                { name:'碳酸锂销量(吨)', budget:330,  target:330,  actual:208,  unit:'吨' },
                { name:'修复LFP交付(吨)', budget:300,  target:300,  actual:310,  unit:'吨' },
                { name:'磷铁液交付(m³)',  budget:4500, target:4500, actual:1400, unit:'m³' },
                { name:'元明粉销售(吨)',  budget:1500, target:1500, actual:1500, unit:'吨' },
            ]
        },
        _dimComparison_d3: {
            title: '6月生产效率达成（预算 → 目标 → 实际）',
            items: [
                { name:'碳酸锂投料(吨)', budget:1960,   target:1960,   actual:1945.5,  unit:'吨' },
                { name:'碳酸锂产出(吨)', budget:330,    target:330,    actual:364.5,   unit:'吨' },
                { name:'磷铁液产出(m³)', budget:4500,   target:4500,   actual:1453.64, unit:'m³' },
                { name:'加工成本(万/t)', budget:1.99,   target:1.99,   actual:2.12,    unit:'万/t' },
            ]
        },
        _dimComparison_d4: {
            title: '技术创新力 5月→6月环比',
            format: 'mom',
            items: [
                { name:'在研课题(个)',   prev:8,     curr:10,    unit:'个' },
                { name:'MCU项目(项)',    prev:5,     curr:12,    unit:'项' },
                { name:'MCU降本(万元)',  prev:5.31,  curr:27.64, unit:'万元' },
                { name:'技改项目(项)',   prev:12,    curr:8,     unit:'项' },
            ]
        },
        _dimComparison_d5: {
            title: '安全环保 5月→6月环比',
            format: 'mom',
            items: [
                { name:'隐患整改率(%)',  prev:98.3,  curr:88.48, unit:'%' },
                { name:'安全教育(人次)', prev:2009,  curr:1075,  unit:'人次' },
                { name:'排查隐患(项)',   prev:2816,  curr:1519,  unit:'项' },
                { name:'应急演练(场)',   prev:1,     curr:3,     unit:'场' },
            ]
        },
        _dimComparison_d6: {
            title: '组织活力 5月→6月环比',
            format: 'mom',
            items: [
                { name:'AI项目立项(个)',   prev:16,   curr:72,   unit:'个' },
                { name:'获得企业荣誉(项)', prev:2,    curr:4,    unit:'项' },
                { name:'IATF审核问题(项)', prev:35,   curr:35,   unit:'项' },
                { name:'5S覆盖率(%)',     prev:100,  curr:100,  unit:'%' },
            ]
        }
    },
    lubricant: { name:'润滑油', logo:'', tag:'车用润滑油', accent:'#c0392b', detailPage:'radar_detail_lubricant.html',
        // 数据来源：radar_hub.html BU_HISTORY lhy 2026-06
        dims:{d1:81,d2:100,d3:92,d4:90,d5:100,d6:85},
        kpis:{d1:[80.3,59.3,95.8,90.0],d2:[100.0,100.0,100.0,100.0],d3:[100.0,100.0,100.0,80.0],d4:[120.0,120.0,120.0,90.0],d5:[100.0,100.0,100.0,100.0],d6:[100.0,100.0,120.0,120.0]},
        _kpiComparison:{title:'6月核心KPI达标率',period:'2026年6月',items:[
            {name:'销售收入(万)',budget:12452,target:12452,actual:10000,unit:'万元'},
            {name:'净利润(万)',budget:1418,target:1418,actual:841,unit:'万元'},
            {name:'毛利率(%)',budget:24.3,target:24.3,actual:23.29,unit:'%'},
            {name:'期间费用率(%)',budget:10.11,target:10.11,actual:11.24,unit:'%'},
            {name:'应收账款天数',budget:52,target:52,actual:49,unit:'天'}
        ]},
        _dimComparison_d2:{title:'6月品类销售达成',items:[
            {name:'冷却液(万)',budget:50000,target:4167,actual:25820,unit:'万元'},
            {name:'汽机油(万)',budget:40000,target:3333,actual:19680,unit:'万元'},
            {name:'柴机油(万)',budget:15000,target:1250,actual:7119,unit:'万元'},
            {name:'变速箱油(万)',budget:6000,target:500,actual:2325,unit:'万元'}
        ]},
        _dimComparison_d3:{title:'6月运营效率指标',items:[
            {name:'海外市场(万)',budget:10000,target:833,actual:4597,unit:'万元'},
            {name:'工业油(万)',budget:5000,target:417,actual:163,unit:'万元'},
            {name:'玻璃水(万)',budget:7000,target:583,actual:970,unit:'万元'},
            {name:'应收账款天数',budget:52,target:52,actual:49,unit:'天'}
        ]},
        _dimComparison_d4:{title:'6月技术创新力 5月→6月环比',format:'mom',items:[
            {name:'新产品下线(款)',prev:3,curr:7,unit:'款'},
            {name:'客户审核通过(家)',prev:3,curr:6,unit:'家'},
            {name:'品牌内容发布(篇)',prev:15,curr:24,unit:'篇'},
            {name:'华为中试进展',prev:0,curr:90,unit:'%'}
        ]},
        _dimComparison_d5:{title:'6月风险合规 5月→6月环比',format:'mom',items:[
            {name:'安全事故(起)',prev:0,curr:0,unit:'起'},
            {name:'诉讼案件(件)',prev:0,curr:0,unit:'件'},
            {name:'零碳工厂认证',prev:0,curr:100,unit:'%'},
            {name:'安全月活动完成率(%)',prev:0,curr:300,unit:'%'}
        ]},
        _dimComparison_d6:{title:'6月组织活力 5月→6月环比',format:'mom',items:[
            {name:'AI智能体项目(项)',prev:0,curr:1,unit:'项'},
            {name:'新客户导入(家)',prev:2,curr:3,unit:'家'},
            {name:'海外市场拓展(国)',prev:3,curr:5,unit:'国'},
            {name:'数字化项目(项)',prev:2,curr:3,unit:'项'}
        ]},
        _isCurrent:true,
    },
    kelan: { name:'可兰素', logo:'', tag:'车用尿素', accent:'#a1887f', detailPage:'radar_detail_kelan.html',
        // 数据来源：可兰素事业部6月总结及7月计划--6.26汇报版本
        dims:{d1:75.0,d2:85.4,d3:83.0,d4:70.2,d5:75.0,d6:60.3},
        kpis:{d1:[69.9,73.5,88.6,94.5],d2:[10138.0,91.7,90.0,60.0],d3:[56.4,80.0,115.6,80.0],d4:[1.0,80.0,80.0,120.0],d5:[100.0,100.0,0.0,100.0],d6:[1.0,80.0,80.0,80.0]},
        _kpiComparison:{title:'6月核心KPI达标率',period:'2026年6月',items:[
            {name:'收入达成率(%)',budget:7247,target:7247,actual:5069,unit:'%'},
            {name:'净利润达成率(%)',budget:825,target:825,actual:606,unit:'%'},
            {name:'毛利率(%)',budget:26.27,target:26.27,actual:23.27,unit:'%'},
            {name:'期间费用率(%)',budget:14.16,target:14.16,actual:14.99,unit:'%'},
            {name:'回款率(%)',budget:100,target:100,actual:90,unit:'%'}]},
        _dimComparison_d2:{title:'6月经营效益',items:[
            {name:'尿素溶液销售(万)',budget:7247,target:603.9,actual:5069,unit:'万元'},
            {name:'一卡通网点(家)',budget:20000,target:1667,actual:18335,unit:'家'},
            {name:'加注机累计(台)',budget:3000,target:250,actual:2765,unit:'台'},
            {name:'OEM配套(家)',budget:0,target:0,actual:0,unit:'家'}]},
        _dimComparison_d3:{title:'6月运营效率',items:[
            {name:'产能利用率(%)',budget:80,target:80,actual:56.4,unit:'%'},
            {name:'一次合格率(%)',budget:100,target:100,actual:80,unit:'%'},
            {name:'单吨能耗(元/吨)',budget:37.7,target:37.7,actual:32.6,unit:'元/吨'},
            {name:'配送时效(小时)',budget:0,target:0,actual:0,unit:'小时'}]},
        _dimComparison_d4:{title:'6月技术创新力 5月→6月环比',format:'mom',items:[
            {name:'新产品配方数',prev:0,curr:1,unit:'个'},
            {name:'OEM认证取得(家)',prev:0,curr:0,unit:'家'},
            {name:'国六适配型号数',prev:0,curr:0,unit:'个'},
            {name:'技术服务项目',prev:3,curr:5,unit:'个'}]},
        _dimComparison_d5:{title:'6月风险合规',items:[
            {name:'环保合规',budget:1,target:1,actual:1,unit:'项'},
            {name:'安全培训完成(次)',budget:2,target:2,actual:2,unit:'次'},
            {name:'绿色工厂认证',budget:1,target:1,actual:0,unit:'项'},
            {name:'客户投诉率(%)',budget:0,target:0,actual:0,unit:'%'}]},
        _dimComparison_d6:{title:'6月组织活力 5月→6月环比',format:'mom',items:[
            {name:'AI项目立项(个)',prev:0,curr:1,unit:'个'},
            {name:'星推官(人)',prev:0,curr:4244,unit:'人'},
            {name:'新市场开拓(个)',prev:0,curr:3,unit:'个'},
            {name:'数字化项目(个)',prev:0,curr:6,unit:'个'}]},
        _isCurrent:true,
    },
    bych:{ name:'铂源催化', logo:'', tag:'催化材料', accent:'#00bcd4', detailPage:'radar_detail_bych.html',
        dims:{d1:72,d2:80,d3:78,d4:88,d5:75,d6:72},
        kpis:{d1:[72,72,72,72],d2:[80,80,80,80],d3:[80,80,80,80],d4:[88,88,88,80],d5:[80,70,70,80],d6:[70,70,70,70]}},
    dkhx: { name:'迪克化学', logo:'', tag:'冷却液', accent:'#7986cb', detailPage:'radar_detail_dkhx.html',
        // 数据来源：radar_hub.html BU_HISTORY dhx 2026-06
        dims:{d1:68,d2:72,d3:88,d4:85,d5:95,d6:82},
        kpis:{d1:[78,61,79,65],d2:[70,72,75,68],d3:[85,92,80,88],d4:[88,85,80,82],d5:[95,98,100,90],d6:[85,88,80,78]}},
    };

function calcTotal(buId) {
    const scores = calcScores(buId);
    const wts = BU_WEIGHTS[buId] || DEFAULT_WEIGHTS;
    return DIMS.reduce((s, d, i) => s + scores.dims[d.id] * (wts[i] || 0.20), 0);
}
function getGrade(score) {
    if (score >= 90) return {label:'S+卓越', color:'#1a7a6e', bg:'rgba(26,122,110,0.15)'};
    if (score >= 80) return {label:'A 优秀', color:'#2d7d4f', bg:'rgba(45,125,79,0.15)'};
    if (score >= 70) return {label:'B 良好', color:'#b5862a', bg:'rgba(181,134,42,0.15)'};
    if (score >= 60) return {label:'C 待改进', color:'#c0572a', bg:'rgba(192,87,42,0.15)'};
    return {label:'D 预警', color:'#8b0000', bg:'rgba(139,0,0,0.15)'};
}
function calcRank(buId) {
    const totals = Object.keys(BUS_DATA).map(id => ({id, score: calcTotal(id)}));
    totals.sort((a, b) => b.score - a.score);
    return totals.findIndex(b => b.id === buId) + 1;
}

// ═══════════════════════════════════════════════════
// 六维评分自动计算（基于原始数据，非硬编码）
// ═══════════════════════════════════════════════════

// 单个指标的达成率计算
// format: 'target' = 有目标格式(实际 vs 目标), 'mom' = 环比格式(本期 vs 上期)
function calcKPIAchv(item, isCost, format) {
    if (format === 'mom') {
        if (!item.prev || item.prev <= 0) return item.curr > 0 ? 100 : 50;
        return Math.min(120, (item.curr / item.prev) * 100); // 封顶120%
    } else {
        if (isCost) {
            if (!item.actual || item.actual <= 0) return 0;
            return Math.min(120, (item.target / item.actual) * 100); // 成本类：越低越好
        } else {
            if (!item.target || item.target <= 0) return 0;
            return Math.min(120, (item.actual / item.target) * 100); // 收益类：越高越好
        }
    }
}

// 达成率 → 0-100分，精确到1位小数
function achvToScore(achv) {
    return Math.round(Math.min(100, achv) * 10) / 10;
}

// 从对比表数据计算各维度 kpis（0-100分 × 4项）
function calcKPIsFromComparison(buId) {
    const bd = BUS_DATA[buId];
    const kpis = {};

    // D1：核心考核指标（7项核心KPI → 4个子KPI映射）
    if (bd._kpiComparison && bd._kpiComparison.items) {
        const items = bd._kpiComparison.items;
        // 7项综合达成率
        const avgAchv = items.reduce((s, it) => {
            const isCost = it.name.includes('成本');
            return s + calcKPIAchv(it, isCost, 'target');
        }, 0) / items.length;
        // 利润达成率: (毛利 + 扣非净利润) / (目标毛利 + 目标扣非净利润)
        const profitItems = items.filter(i => i.name.includes('毛利') || i.name.includes('净利润'));
        const profitAchv = profitItems.length >= 2
            ? (profitItems[0].actual + profitItems[1].actual) / (profitItems[0].target + profitItems[1].target) * 100
            : 100;
        // 成本控制率: 目标/实际（越低越好）
        const costItem = items.find(i => i.name.includes('成本'));
        const costAchv = costItem ? calcKPIAchv(costItem, true, 'target') : 100;
        // 营收增长率: 5月收入 vs 4月收入（从items中找收入，实际vs预算→再比4月）
        // 注：PDF只有budget/target/actual三列，无法直接拿4月值。改用收入达成率作为营收增长代理
        const revItem = items.find(i => i.name.includes('收入'));
        const revAchv = revItem ? calcKPIAchv(revItem, false, 'target') : 100;

        kpis.d1 = [
            achvToScore(avgAchv),     // KPI综合达成率
            achvToScore(profitAchv),  // 利润达成率
            achvToScore(costAchv),    // 成本控制率
            achvToScore(revAchv)      // 营收增长率(达成率代理)
        ];
    } else {
        kpis.d1 = [80, 80, 80, 80];
    }

    // D2-D3：_dimComparison_d{2-3}，有 target 格式
    [2, 3].forEach(dim => {
        const dc = bd['_dimComparison_d' + dim];
        if (dc && dc.items) {
            kpis['d' + dim] = dc.items.map((it, idx) => {
                const isCost = it.name.includes('成本');
                let s = achvToScore(calcKPIAchv(it, isCost, 'target'));
                // D3：投料达成率单独压缩（易超目标，压制避免dims偏高）
                if (dim === 3 && idx === 0) s = achvToScore(s * 0.88);
                return s;
            });
        } else {
            kpis['d' + dim] = [80, 80, 80, 80];
        }
    });

    // D4-D6：_dimComparison_d{4-6}，MoM格式
    [4, 5, 6].forEach(dim => {
        const dc = bd['_dimComparison_d' + dim];
        if (dc && dc.items) {
            kpis['d' + dim] = dc.items.map(it => {
                const isCost = it.name.includes('成本');
                // D4：MCU降本额——5月因项目数减少导致绝对金额下降，不代表做得差，剔除
                if (dim === 4 && it.name.includes('MCU降本')) return null;
                // D6：prev=0 的"从无到有"指标（AI立项/企业荣誉），定性评分80
                if (dim === 6 && it.prev === 0) return 80.0;
                // D6：IATF审核问题——越少越好（逆向处理）
                if (dim === 6 && it.name.includes('IATF')) {
                    if (it.prev > 0 && it.curr > 0) {
                        return achvToScore(Math.min(120, (it.prev / it.curr) * 100));
                    }
                    return 80.0;
                }
                return achvToScore(calcKPIAchv(it, isCost, 'mom'));
            });
        } else {
            kpis['d' + dim] = [80, 80, 80, 80];
        }
    });

    return kpis;
}

// 从 kpis 数组计算各维度 dims 综合分（0-100）
function calcDimsFromKPIs(kpis) {
    const dims = {};
    DIMS.forEach(d => {
        const arr = kpis[d.id];
        if (arr && arr.length > 0) {
            // 过滤null（D4的MCU降本被剔除），只对有效项求平均
            const valid = arr.filter(v => v !== null && v !== undefined);
            if (valid.length === 0) {
                dims[d.id] = 80;
            } else {
                const avg = valid.reduce((s, v) => s + v, 0) / valid.length;
                dims[d.id] = Math.round(avg); // kpis均值即为0-100分，取整
            }
        } else {
            dims[d.id] = 80; // 默认
        }
    });
    return dims;
}

// 完整的动态评分计算（供渲染使用）
function calcScores(buId, optMonth) {
    // 历史月份：直接从 RADAR_HISTORY 取预计算的 dims/kpis
    if (optMonth) {
        const hist = RADAR_HISTORY[buId] && RADAR_HISTORY[buId][optMonth];
        if (hist && hist.dims && hist.kpis) {
            return { dims: {...hist.dims}, kpis: JSON.parse(JSON.stringify(hist.kpis)) };
        }
    }
    const bd = BUS_DATA[buId];
    if (!bd) return null;
    // 有对比表数据则自动计算，否则用硬编码兜底
    if (bd._kpiComparison || bd._dimComparison_d2) {
        const kpis = calcKPIsFromComparison(buId);
        const dims = calcDimsFromKPIs(kpis);
        // 检测全零kpis（占位数据：所有对比项 actual=0）：回退到硬编码值
        const allZero = DIMS.every(d => {
            const arr = kpis[d.id];
            return arr && arr.length > 0 && arr.every(v => v === 0);
        });
        if (allZero) {
            return { dims: bd.dims, kpis: bd.kpis };
        }
        return { dims, kpis };
    } else {
        return { dims: bd.dims, kpis: bd.kpis };
    }
}

// ═══════════════════════════════════════════════════
// 三面板轮播
// ═══════════════════════════════════════════
// LI_BUIS 等常量已在全局作用域定义，此处不再重复

function buildCard(buId) {
    const bd = BUS_DATA[buId];
    let logoHtml;
    if (bd.logo) {
        logoHtml = '<img class="card-logo-img" src="' + bd.logo + '" alt="' + bd.name + '" onerror="this.style.display=\'none\'">';
    } else {
        logoHtml = '<div class="card-logo-placeholder" style="background:' + bd.accent + '22;border:1.5px solid ' + bd.accent + '44;color:' + bd.accent + '">' + bd.name.slice(0,2) + '</div>';
    }
    
    return '<div class="bu-card" data-buid="' + buId + '" style="--card-accent:' + bd.accent + '">' +
        '<div class="hover-progress" id="hp-' + buId + '"></div>' +
        '<div class="card-hint">单击打开详情</div>' +
        '<div class="card-logo-wrap">' +
            logoHtml +
            '<div class="card-name-block">' +
                '<div class="card-fullname">' + bd.name + '</div>' +
                '<div class="card-tag" style="color:' + bd.accent + '">' + bd.tag + '</div>' +
            '</div>' +
        '</div>' +
        '<div class="card-glow-line" style="--card-accent:' + bd.accent + '"></div>' +
        '<div class="card-meta">' + bd.tag + '领域 · 六维经营健康度评估</div>' +
    '</div>';
}

async function init() {
    // 权限检查已禁用，直接加载所有数据
    // 加载logo
    try {
        const res = await fetch('bu_logos.json');
        if (res.ok) {
            const logos = await res.json();
            Object.keys(logos).forEach(buId => {
                if (BUS_DATA[buId]) BUS_DATA[buId].logo = logos[buId];
            });
        }
    } catch(e) {}

    // 新能源：五边形布局
    const pentagon = document.getElementById('pentagon-wrap');
    if (pentagon) {
        LI_BUIS.forEach(buId => {
            const posClass = PENTAGON_POS[buId] || '';
            const wrap = document.createElement('div');
            wrap.className = posClass;
            wrap.innerHTML = buildCard(buId);
            pentagon.appendChild(wrap);
        });
    }

    // 化学品：三卡片
    const chemContainer = document.getElementById('chemical-cards');
    if (chemContainer) {
        CHEM_BUIS.forEach(id => { chemContainer.innerHTML += buildCard(id); });
    }

    // 氢能：单卡片
    const hydroContainer = document.getElementById('hydrogen-cards');
    if (hydroContainer) {
        HYDROGEN_BUIS.forEach(id => { hydroContainer.innerHTML += buildCard(id); });
    }

    bindEvents();
    // startCarousel() 已禁用 - 矩阵网格为静态展示，无需轮播
}

let openTimer = null;
function bindEvents() {
    document.querySelectorAll('.bu-card').forEach(card => {
        const buId = card.dataset.buid;
        const progressEl = document.getElementById('hp-' + buId);
        card.addEventListener('click', () => {
            clearTimeout(openTimer);
            progressEl.style.transition='none'; progressEl.style.width='0%';
            openPanel(buId);
        });
        card.addEventListener('mouseenter', () => {
            progressEl.style.transition='none'; progressEl.style.width='0%';
            progressEl.style.transition='width 1000ms linear';
            requestAnimationFrame(() => { progressEl.style.width='100%'; });
            openTimer = setTimeout(() => { card.classList.add('hover-active'); openPanel(buId); }, 1000);
        });
        card.addEventListener('mouseleave', () => {
            clearTimeout(openTimer);
            progressEl.style.transition='width 0.2s ease'; progressEl.style.width='0%';
            card.classList.remove('hover-active');
        });
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });
}

// ═══════════════════════════════════════════════════
// 轮播逻辑（每10秒切换）
// ═══════════════════════════════════════════════════


// ═══════════════════════════════════════════════════
// 面板内容（全部保留原有功能）
// ═══════════════════════════════════════════════════
async function getLatestReportForBU(buId) {
    // embedded 模式：直接用内嵌数据，完全不走网络
    if (window.__EMBEDDED__ && window.__EMBEDDED__.report && window.__EMBEDDED__.report.departments) {
        const dept = window.__EMBEDDED__.report.departments[buId];
        if (dept) {
            console.log('[getLatestReportForBU] 使用嵌入数据, buId=' + buId);
            return { ...dept, _reportDate: window.__EMBEDDED__.today };
        }
    }
    // 优先从 reports/index.json 获取 available_dates，只请求有报告的日期
    console.log('[getLatestReportForBU] 开始加载, buId=' + buId);
    let availableDates = [];
    try {
        const idxRes = await fetch(`reports/index.json?v=${HTML_VERSION}&_cb=${Date.now()}`);
        if (idxRes.ok) {
            const idxData = await idxRes.json();
            availableDates = idxData.available_dates || [];
        }
    } catch (e) {
        console.log('[getLatestReportForBU] 无法加载 index.json, 使用最近3天');
    }
    // 如果 available_dates 为空，fallback 到最近3天（兼容旧版 index.json）
    if (availableDates.length === 0) {
        availableDates = [0,-1,-2].map(offset => {
            const d = new Date(); d.setDate(d.getDate()+offset);
            return d.toISOString().slice(0,10);
        });
    }
    // 尝试加载每个可用日期的报告
    for (const date of availableDates) {
        try {
            const res = await fetch(`reports/${date}.json?v=${HTML_VERSION}&_cb=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                const dept = data.departments?.[buId];
                if (dept) {
                    console.log('[getLatestReportForBU] 找到报告, buId=' + buId + ', date=' + date);
                    return {...dept, _reportDate: date};
                }
            } else {
                console.log('[getLatestReportForBU] 跳过（无报告）: ' + date + ', status=' + res.status);
            }
        } catch (e) {
            console.log('[getLatestReportForBU] 跳过（加载失败）: ' + date + ', error=' + e.message);
        }
    }
    console.log('[getLatestReportForBU] 无可用数据, buId=' + buId);
    console.log('[getLatestReportForBU] 无可用数据, buId=' + buId);
    return window.__EMBEDDED__?.report?.departments?.[buId] || null;
}

function buildKPIComparison(buId, optData) {
    const bd = optData || BUS_DATA[buId];
    if (!bd._kpiComparison) return '';
    const kc = bd._kpiComparison;
    let rows = '';
    kc.items.forEach(item => {
        let badge = '';
        const isCost = item.name.includes('成本');
        const pctToTarget = item.target ? (item.actual / item.target * 100).toFixed(0) : 0;
        // 成本类指标：越低越好，≤target为超额
        const isExceed = isCost ? (item.actual <= item.target) : (item.actual >= item.target);
        const isOverBudget = isCost ? (item.actual <= item.budget) : (item.actual >= item.budget);
        if (isExceed) {
            badge = '<span class="kpi-compare-badge exceed">超额</span>';
        } else if (isOverBudget) {
            badge = '<span class="kpi-compare-badge meet">达标</span>';
        } else {
            badge = '<span class="kpi-compare-badge miss">未达</span>';
        }
        const pctClass = isCost
            ? (isExceed ? 'kpi-over' : (isOverBudget ? '' : 'kpi-under'))
            : (isExceed ? 'kpi-over' : (isOverBudget ? '' : 'kpi-under'));
        rows += `<tr>
            <td class="kpi-name">${item.name}</td>
            <td>${item.budget.toLocaleString()}</td>
            <td>${item.target.toLocaleString()}</td>
            <td class="kpi-actual ${pctClass}">${item.actual.toLocaleString()}</td>
            <td>${badge}</td>
        </tr>`;
    });
    return `<div class="kpi-compare">
        <div class="kpi-compare-title">${kc.title}</div>
        <table class="kpi-compare-table">
            <thead><tr>
                <th>指标</th><th>预算值</th><th>挑战目标</th><th>实际达成</th><th>状态</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>
    </div>`;
}

// 一次性渲染所有对比表（D1 核心KPI + D2-D6 维度对比）
function buildAllComparisonTables(buId) {
    const bd = getBuTableData(buId);
    return `
        <div id="kpiComparisonWrap" style="display:none">${buildKPIComparison(buId, bd)}</div>
        <div id="dimComparisonWrap_d2" style="display:none">${buildDimTableHTML(bd['_dimComparison_d2'])}</div>
        <div id="dimComparisonWrap_d3" style="display:none">${buildDimTableHTML(bd['_dimComparison_d3'])}</div>
        <div id="dimComparisonWrap_d4" style="display:none">${buildDimTableHTML(bd['_dimComparison_d4'])}</div>
        <div id="dimComparisonWrap_d5" style="display:none">${buildDimTableHTML(bd['_dimComparison_d5'])}</div>
        <div id="dimComparisonWrap_d6" style="display:none">${buildDimTableHTML(bd['_dimComparison_d6'])}</div>`;
}

// 刷新对比表容器（历史月份切换时调用）
function refreshComparisonTables(buId) {
    const wrap = document.getElementById('comparisonTablesWrap');
    if (wrap) wrap.innerHTML = buildAllComparisonTables(buId);
}

// 维度专属迷你对比表渲染（用于dim-kpi内嵌）
// 支持两种格式：默认 budget/target/actual，format:'mom' 为 prev/curr/环比
function buildDimTableHTML(dc) {
    if (!dc || !dc.items) return '';
    const isMoM = dc.format === 'mom';
    let rows = '';
    dc.items.forEach(item => {
        if (isMoM) {
            // 4月→5月环比格式
            const diff = item.curr - item.prev;
            const isPct = item.name.includes('%') || item.name.includes('率');
            const diffStr = isPct
                ? (diff >= 0 ? '+' : '') + diff.toFixed(2) + 'pp'
                : (diff >= 0 ? '+' : '') + diff.toLocaleString();
            const trendClass = diff > 0 ? 'kpi-over' : (diff < 0 ? 'kpi-under' : '');
            const trendArrow = diff > 0 ? '↑' : (diff < 0 ? '↓' : '→');
            const trendColor = diff > 0 ? '#27ae60' : (diff < 0 ? '#e74c3c' : '#888');
            rows += `<tr>
                <td class="kpi-name">${item.name}</td>
                <td>${item.prev.toLocaleString()}</td>
                <td>${item.curr.toLocaleString()}</td>
                <td class="kpi-actual ${trendClass}">${diffStr}</td>
                <td><span style="color:${trendColor};font-weight:700;font-size:13px">${trendArrow}</span></td>
            </tr>`;
        } else {
            // 预算→目标→实际格式（原有逻辑）
            let badge = '';
            const isCost = item.name.includes('成本');
            const isExceed = isCost ? (item.actual <= item.target) : (item.actual >= item.target);
            const isOverBudget = isCost ? (item.actual <= item.budget) : (item.actual >= item.budget);
            if (isExceed) {
                badge = '<span class="kpi-compare-badge exceed">超额</span>';
            } else if (isOverBudget) {
                badge = '<span class="kpi-compare-badge meet">达标</span>';
            } else {
                badge = '<span class="kpi-compare-badge miss">未达</span>';
            }
            const pctClass = isCost
                ? (isExceed ? 'kpi-over' : (isOverBudget ? '' : 'kpi-under'))
                : (isExceed ? 'kpi-over' : (isOverBudget ? '' : 'kpi-under'));
            rows += `<tr>
                <td class="kpi-name">${item.name}</td>
                <td>${item.budget.toLocaleString()}</td>
                <td>${item.target.toLocaleString()}</td>
                <td class="kpi-actual ${pctClass}">${item.actual.toLocaleString()}</td>
                <td>${badge}</td>
            </tr>`;
        }
    });
    const header = isMoM
        ? '<tr><th>指标</th><th>4月</th><th>5月</th><th>环比变化</th><th>趋势</th></tr>'
        : '<tr><th>指标</th><th>预算</th><th>目标</th><th>实际</th><th>状态</th></tr>';
    return `<div class="kpi-compare">
        <div class="kpi-compare-title">${dc.title}</div>
        <table class="kpi-compare-table">
            <thead>${header}</thead>
            <tbody>${rows}</tbody>
        </table>
    </div>`;
}

async function openPanel(buId) {
    const bd = BUS_DATA[buId];
    const logoEl = document.getElementById('drawerLogoImg');
    const logoPhEl = document.getElementById('drawerLogoPlaceholder');
    if (bd.logo) {
        logoEl.src = bd.logo; logoEl.style.display = '';
        logoPhEl.style.display = 'none';
    } else {
        logoEl.style.display = 'none';
        logoPhEl.textContent = bd.name.slice(0,2);
        logoPhEl.style.color = bd.accent;
        logoPhEl.style.background = bd.accent + '18';
        logoPhEl.style.borderColor = bd.accent + '44';
        logoPhEl.style.display = '';
    }
    document.getElementById('drawerName').textContent = bd.name;
    document.getElementById('drawerTag').textContent = bd.tag;
    document.getElementById('drawerTag').style.color = bd.accent;
    document.getElementById('panelDrawer').style.setProperty('--panel-accent', bd.accent);

    // bych 无雷达数据，仅展示早报和操作按钮
    if (buId === 'bych') {
        const reportData = await getLatestReportForBU(buId);
        document.getElementById('drawerBody').innerHTML = `
            <div style="padding:16px 0;">
                ${buildBriefSection(buId, reportData)}
                ${buildTipsSection(buId, reportData)}
            </div>
            <div class="hexa-actions">
                <button class="hexa-action-btn hexa-action-pri" onclick="openReport('${buId}')">早报详情</button>
                <a class="hexa-action-btn hexa-action-sec" href="archive_v3.html?bu=${buId}">历史数据</a>
                <a class="hexa-action-btn hexa-action-sec" href="strategy_hub.html">战略洞察</a>
            </div>
        `;
        document.getElementById('panelOverlay').classList.add('active');
        document.body.classList.add('panel-open');
        return;
    }

    const reportData = await getLatestReportForBU(buId);
    const histMonths = getHistoryMonths(buId);
    const histCardsHtml = buildHistoricalCards(buId, histMonths);
    const histBarHtml = buildHistoricalBar(buId, histMonths);
    const histSectionTitle = histMonths.length > 0
        ? `<div class="hexa-historical-section-title">历史数据<span class="hexa-historical-hint">（点击卡片单独查看，再次点击返回当月）</span></div>`
        : '';
    document.getElementById('drawerBody').innerHTML = `
        <div class="hexa-main">
            <div class="hexa-radar-col">
                ${buildRadar(buId, [])}
                <div class="hexa-legend" id="hexaLegend">
                    <div class="hexa-leg-item"><div class="hexa-leg-dot" style="background:${bd.accent}"></div>${bd.name}</div>
                    <div class="hexa-leg-item"><div class="hexa-leg-dot" style="background:#1e3c72;opacity:0.6"></div>集团基准线</div>
                </div>
                ${histBarHtml}
                <div class="hexa-rank-note" id="hexaRankNote">权重：加载中...</div>
            </div>
            <div class="hexa-dims-col" id="dimsCol"></div>
        </div>
    ${histSectionTitle}
    ${histCardsHtml}
    <div id="comparisonTablesWrap">
    ${buildAllComparisonTables(buId)}
    </div>
    ${buildBriefSection(buId, reportData)}
    ${buildTipsSection(buId, reportData)}
    <div class="hexa-actions">
            <button class="hexa-action-btn hexa-action-pri" onclick="openReport('${buId}')">早报详情</button>
            <a class="hexa-action-btn hexa-action-sec" href="archive_v3.html?bu=${buId}">历史数据</a>
            <a class="hexa-action-btn hexa-action-sec" href="strategy_hub.html">战略洞察</a>
        </div>
    `;
    renderDims(buId);

    // 动态显示 BU 实际权重
    const wts = BU_WEIGHTS[buId] || DEFAULT_WEIGHTS;
    const noteEl = document.getElementById('hexaRankNote');
    if (noteEl) {
        noteEl.textContent = '权重：' + wts.map((w, i) => 'D' + (i+1) + '-' + Math.round(w*100) + '%').join(' ');
    }

    // 设置"查看详情"按钮跳转链接（跳转到对应雷达看板页）
    const detailBtn = document.getElementById('drawerDetailBtn');
    if (detailBtn) {
        const bd = BUS_DATA[buId];
        detailBtn.onclick = function() { window.location.href = (bd && bd.detailPage) || ('bu_hub.html?bu=' + buId); };
    }

    document.getElementById('panelOverlay').classList.add('active');
    document.body.classList.add('panel-open');
}

function buildHistoricalBar(buId, histMonths) {
    if (!histMonths || histMonths.length === 0) {
        return `<div class="hexa-historical-bar">
            <span class="hexa-historical-label" style="color:#aaa;font-style:italic;">暂无历史数据 — 请在 RADAR_HISTORY 中填入</span>
        </div>`;
    }
    const overlayColors = ['#9b59b6','#e67e22','#27ae60'];
    const pastMonths = histMonths.filter(m => {
        const h = RADAR_HISTORY[buId] && RADAR_HISTORY[buId][m];
        return h && !h._isCurrent;
    });
    const checkboxes = pastMonths.slice(0, 3).map((m, i) => {
        const label = m; // 如 '2026-04'
        return `<label><input type="checkbox" id="histCb_${m}" onclick="toggleHistoricalOverlay('${buId}','${m}',this.checked)"/><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${overlayColors[i]}"></span>${label}</label>`;
    }).join('');
    return `<div class="hexa-historical-bar">
        <span class="hexa-historical-label">叠加：</span>
        <div class="hexa-historical-check">${checkboxes}</div>
    </div>`;
}

function buildHistoricalCards(buId, histMonths) {
    if (!histMonths || histMonths.length === 0) {
        return `<div class="hexa-historical-cards">
            <div style="width:100%;text-align:center;font-size:0.6rem;color:#aaa;padding:8px 0;">暂无历史卡片 — 填入 RADAR_HISTORY 后自动展示</div>
        </div>`;
    }
    const overlayColors = ['#9b59b6','#e67e22','#27ae60'];
    const cards = histMonths.map((m, i) => {
        const hist = RADAR_HISTORY[buId] && RADAR_HISTORY[buId][m];
        if (!hist) return '';
        const wts = BU_WEIGHTS[buId] || DEFAULT_WEIGHTS;
        const vals = DIMS.map((d, i) => (hist.dims[d.id] || 0) * (wts[i] || 0.20));
        const avg = Math.round(vals.reduce((a, b) => a + b, 0));
        const monthLabel = m.slice(5) + '月';
        const ov = overlayColors[i % overlayColors.length];
        const isCurrent = hist._isCurrent || false;
        const currentTag = isCurrent ? '<span class="hist-card-current-tag">当月</span>' : '';
        const activeClass = window._histFocusMonth === m ? 'active-card' : '';
        const dimsLine = 'D:' + avg;
        return `<div class="hexa-historical-card ${activeClass}" id="histCard_${m}" onclick="switchToHistoricalMonth('${buId}','${m}')">
            <span class="hexa-hist-card-dot" style="background:${ov}"></span>
            <div class="hexa-hist-card-month">${monthLabel}${currentTag}</div>
            <div class="hexa-hist-card-dims">${dimsLine}</div>
        </div>`;
    }).join('');
    return `<div class="hexa-historical-cards">${cards}</div>`;
}

// 点击历史卡片：单独显示该月雷达图（再次点击返回当月）
function switchToHistoricalMonth(buId, month) {
    const hist = RADAR_HISTORY[buId] && RADAR_HISTORY[buId][month];
    const isCurrent = hist && hist._isCurrent;
    const current = window._histFocusMonth;
    const isAlreadyFocused = current === month;

    if (isCurrent) {
        // 当月卡片：仅高亮，清除其他选中，恢复当前数据
        window._histFocusMonth = null;
        document.querySelectorAll('.hexa-historical-card').forEach(c => c.classList.remove('active-card'));
        document.querySelectorAll('.hexa-historical-check input[type="checkbox"]').forEach(cb => cb.checked = false);
        refreshRadarAndDims(buId);
        return;
    }

    window._histFocusMonth = isAlreadyFocused ? null : month;

    document.querySelectorAll('.hexa-historical-card').forEach(c => c.classList.remove('active-card'));
    document.querySelectorAll('.hexa-historical-check input[type="checkbox"]').forEach(cb => cb.checked = false);
    if (window._histFocusMonth) {
        const card = document.getElementById('histCard_' + month);
        if (card) card.classList.add('active-card');
    }

    refreshRadarAndDims(buId);
}

// 统一刷新雷达图与维度面板（支持历史月份切换）
function refreshRadarAndDims(buId) {
    const radarWrap = document.getElementById('radarWrap');
    if (radarWrap) {
        const activeOverlays = Array.from(document.querySelectorAll('.hexa-historical-check input[type="checkbox"]:checked'))
            .map(cb => cb.id.replace('histCb_', ''));
        radarWrap.outerHTML = buildRadar(buId, activeOverlays);
    }
    renderDims(buId);
    updateRadarLegend(buId);
    refreshComparisonTables(buId);
}

// 叠加复选框切换
function toggleHistoricalOverlay(buId, month, checked) {
    window._histFocusMonth = null;
    document.querySelectorAll('.hexa-historical-card').forEach(c => c.classList.remove('active-card'));
    refreshRadarAndDims(buId);
}

// 统一更新雷达图图例
function updateRadarLegend(buId) {
    const bd = BUS_DATA[buId];
    const legend = document.getElementById('hexaLegend');
    if (!legend) return;
    const overlayColors = ['#9b59b6','#e67e22','#27ae60'];
    const activeOverlays = Array.from(document.querySelectorAll('.hexa-historical-check input[type="checkbox"]:checked'))
        .map(cb => cb.id.replace('histCb_', ''));
    const histLegItems = activeOverlays.map((m, i) =>
        `<div class="hexa-leg-item"><div class="hexa-leg-dot" style="background:${overlayColors[i]}"></div>${m.slice(5)}月</div>`
    ).join('');
    const focusMonth = window._histFocusMonth;
    const mainDot = focusMonth ? `<div class="hexa-leg-item"><div class="hexa-leg-dot" style="background:${overlayColors[0]}"></div>${bd.name} ${focusMonth.slice(5)}月</div>` : `<div class="hexa-leg-item"><div class="hexa-leg-dot" style="background:${bd.accent}"></div>${bd.name}</div>`;
    const baseLegend = `${mainDot}
        <div class="hexa-leg-item"><div class="hexa-leg-dot" style="background:#1e3c72;opacity:0.6"></div>集团基准线</div>`;
    legend.innerHTML = histLegItems + baseLegend;
}

function buildBriefSection(buId, reportData) {
    if (!reportData) {
        return `<div class="hexa-brief"><div class="hexa-brief-label">今日关注</div><div class="hexa-brief-empty">暂无早报数据</div></div>`;
    }
    const sections = reportData.sections;
    const reportDate = reportData._reportDate || reportData.date || '';

    let topnewsItems = [];

    if (Array.isArray(sections)) {
        // 数组格式 [{dim, title, items}, ...]
        const topnewsSection = sections.find(s => s.dim === 'topnews') || sections[0];
        if (topnewsSection) {
            topnewsItems = Array.isArray(topnewsSection.items) ? topnewsSection.items : [];
        }
    } else if (sections && typeof sections === 'object') {
        // 对象格式 {topnews: [...], market: {...}, ...}
        if (sections.topnews && Array.isArray(sections.topnews)) {
            topnewsItems = sections.topnews;
        }
    }

    // 兼容 title / 标题 / raw
    const titles = topnewsItems.map(it => it.title || it.标题 || it.raw || '').filter(t => t.length > 0);
    const contentHtml = titles.length > 0
        ? `<div class="hexa-brief-items">` + titles.map((it, i) =>
            `<div class="hexa-brief-item"><span class="hexa-brief-num">${i+1}.</span>${escapeHtml(it)}</div>`
          ).join('') + `</div>`
        : `<div class="hexa-brief-empty">暂无内容</div>`;
    return `<div class="hexa-brief">
        <div class="hexa-brief-label">
            今日关注
            ${reportDate ? `<span class="hexa-brief-date">${reportDate}</span>` : ''}
        </div>
        ${contentHtml}
    </div>`;
}

function buildTipsSection(buId, reportData) {
    if (!reportData) {
        return `<div class="hexa-tips"><div class="hexa-tips-label">专属提示</div><div class="hexa-tips-empty">暂无数据</div></div>`;
    }
    const sections = reportData.sections;
    let items = [];
    let sectionTitle = '专属提示';

    if (Array.isArray(sections)) {
        // 数组格式 [{dim, title, items}, ...]
        const tipsSection = sections.find(s => s.dim === 'tips') || sections[sections.length - 1];
        if (tipsSection) {
            sectionTitle = tipsSection.title || tipsSection.name || '专属提示';
            items = Array.isArray(tipsSection.items) ? tipsSection.items : [];
        }
    } else if (sections && typeof sections === 'object') {
        // 对象格式 {tips: {机会: [...], 风险: [...], ...}}
        if (sections.tips && typeof sections.tips === 'object') {
            const tipObj = sections.tips;
            for (const key of ['机会', '风险', '行动建议', '重点关注']) {
                if (tipObj[key] && Array.isArray(tipObj[key])) {
                    for (const item of tipObj[key]) {
                        items.push({
                            title: key,
                            content: item.总结 || item.content || ''
                        });
                    }
                }
            }
        }
    }

    if (items.length === 0) {
        return `<div class="hexa-tips"><div class="hexa-tips-label">${escapeHtml(sectionTitle)}</div><div class="hexa-tips-empty">暂无内容</div></div>`;
    }
    // 渲染 HTML：每个 item 是一个小节（机会/风险/行动建议/重点关注）
    let html = `<div class="hexa-tips-label">${escapeHtml(sectionTitle)}</div>`;
    html += `<div class="hexa-tips-sections">`;
    items.forEach((it, idx) => {
        const title = it.title || it.raw || '';
        const content = it.content || '';
        if (!title && !content) return;
        html += `<div class="hexa-tips-section">`;
        // 当 title 和 content 重复时（title 是正文而非分类标签），只显示 content，避免冗余
        if (title && title !== content && !content.startsWith(title)) {
            html += `<div class="hexa-tips-sec-title">${escapeHtml(title)}</div>`;
        }
        if (content) {
            // content 可能是多行，按换行拆分
            const contentLines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (contentLines.length > 0) {
                contentLines.forEach((line, lidx) => {
                    html += `<div class="hexa-tips-item">${escapeHtml(line)}</div>`;
                });
            } else {
                html += `<div class="hexa-tips-item">${escapeHtml(content)}</div>`;
            }
        }
        html += `</div>`;
    });
    html += `</div>`;
    return `<div class="hexa-tips">${html}</div>`;
}

function buildRadar(buId, overlayMonths) {
    overlayMonths = overlayMonths || [];
    const bd = BUS_DATA[buId];
    const focusMonth = window._histFocusMonth || null;
    const scores = calcScores(buId, focusMonth);
    const cx = 80, cy = 80, r = 62, n = 6, step = (2*Math.PI)/n;
    // 取 BU 专属维度名称（无专属则用全局 DIMS）
    const buDef = BU_DIMS[buId];
    const dimNames = DIMS.map(d => (buDef && buDef[d.id] && buDef[d.id].name) ? buDef[d.id].name : d.name);
    const dimVals  = DIMS.map(d => scores.dims[d.id]);
    function pt(i, v) {
        const a = i * step - Math.PI/2;
        return [cx + r*(v/100)*Math.cos(a), cy + r*(v/100)*Math.sin(a)];
    }
    const rings = [25,50,75,100].map(s => {
        const pts = Array.from({length:n},(_,i) => {
            const a = i*step-Math.PI/2;
            return `${cx+r*(s/100)*Math.cos(a)},${cy+r*(s/100)*Math.sin(a)}`;
        }).join(' ');
        return `<polygon class="radar-ring-3d" points="${pts}" stroke="rgba(201,168,76,${0.04+s/1200})" stroke-width="1" fill="none"/>`;
    }).join('');
    const axes = Array.from({length:n},(_,i) => {
        const a = i*step-Math.PI/2;
        const [ex,ey] = [cx+r*Math.cos(a),cy+r*Math.sin(a)];
        return `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="rgba(30,60,114,0.1)" stroke-width="1.2"/>
                <circle cx="${ex}" cy="${ey}" r="1.5" fill="rgba(30,60,114,0.2)"/>`;
    }).join('');

    // 历史叠加层：排除当前焦点月份（它已经是主图了）
    const overlayColors = ['#9b59b6','#e67e22','#27ae60'];
    const overlayLayers = overlayMonths.filter(m => m !== focusMonth).map((month, idx) => {
        if (!month) return '';
        const hist = RADAR_HISTORY[buId] && RADAR_HISTORY[buId][month];
        if (!hist) return '';
        const ov = overlayColors[idx % overlayColors.length];
        const pts = Array.from({length:n},(_,i) => pt(i, hist.dims[DIMS[i].id] || 50).join(',')).join(' ');
        const dotsOv = Array.from({length:n},(_,i) => {
            const [x,y] = pt(i, hist.dims[DIMS[i].id] || 50);
            return `<circle cx="${x}" cy="${y}" r="2" fill="${ov}" opacity="0.8"/>`;
        }).join('');
        return `<polygon points="${pts}" fill="${ov}" fill-opacity="0.06" stroke="${ov}" stroke-width="1.2" stroke-opacity="0.65" stroke-dasharray="4,2"/>${dotsOv}`;
    }).join('');

    // 焦点月份标签
    const focusLabel = focusMonth ? `<text x="${cx}" y="12" text-anchor="middle" fill="#e91e63" font-size="6" font-weight="700" font-family="'Noto Sans SC',sans-serif">${focusMonth.slice(5)}月数据</text>` : '';

    const dp = Array.from({length:n},(_,i) => pt(i,dimVals[i]).join(',')).join(' ');
    const dots = Array.from({length:n},(_,i) => {
        const [x,y] = pt(i,dimVals[i]);
        const la = i*step-Math.PI/2;
        const anchor = Math.abs(la)<0.1||Math.abs(la-Math.PI)<0.1?'middle':la>0&&la<Math.PI?'start':'end';
        return `<circle class="radar-dot" cx="${x}" cy="${y}" r="2.5" fill="${DIMS[i].color}" opacity="0.9"/>
                <text class="radar-axis-label" x="${cx+(r+14)*Math.cos(la)}" y="${cy+(r+14)*Math.sin(la)}"
                    text-anchor="${anchor}" dominant-baseline="middle" fill="${DIMS[i].color}" opacity="0.7">${dimNames[i]}</text>`;
    }).join('');
    const avgVal = Math.round(dimVals.reduce((a,b)=>a+b,0)/n);
    const mainAccent = focusMonth ? overlayColors[0] : bd.accent;
    const gid = 'rg'+Math.random().toString(36).slice(2,6);
    return `<div class="hexa-radar-wrap radar-reveal" id="radarWrap">
        <svg class="radar-svg" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" style="--accent:${mainAccent}">
            <defs>
                <filter id="${gid}f" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="${mainAccent}" stop-opacity="0.45"/>
                    <stop offset="100%" stop-color="${mainAccent}" stop-opacity="0.06"/>
                </linearGradient>
                <filter id="${gid}dp">
                    <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="${mainAccent}" flood-opacity="0.4"/>
                </filter>
            </defs>
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(30,60,114,0.04)" stroke="rgba(30,60,114,0.08)" stroke-width="1"/>
            ${rings}
            ${axes}
            ${overlayLayers}
            <polygon class="radar-fill" points="${dp}" fill="url(#${gid})" stroke="${mainAccent}" stroke-width="1.5" stroke-opacity="0.5" filter="url(#${gid}dp)"/>
            ${dots}
            <text class="radar-center-val" x="${cx}" y="${cy-4}" text-anchor="middle" dominant-baseline="middle"
                fill="#1e3c72" font-size="1.1rem" font-weight="900" font-family="'Playfair Display',serif"
                filter="url(#${gid}f)">${avgVal}</text>
            <text x="${cx}" y="${cy+12}" text-anchor="middle" fill="rgba(30,60,114,0.4)" font-size="5.5" font-family="'Noto Sans SC',sans-serif">综合评分</text>
            ${focusLabel}
        </svg>
    </div>`;
}

function renderDims(buId) {
    const bd = BUS_DATA[buId];
    const scores = calcScores(buId, window._histFocusMonth || null);
    const container = document.getElementById('dimsCol');
    // 取 BU 专属 DIMS（无专属则用全局 DIMS）
    const buDef = BU_DIMS[buId];
    container.innerHTML = DIMS.map(d => {
        const val = scores.dims[d.id];
        const dimName = (buDef && buDef[d.id] && buDef[d.id].name) ? buDef[d.id].name : d.name;
        const kpiNames = (buDef && buDef[d.id] && buDef[d.id].kpis) ? buDef[d.id].kpis : d.kpis;
        const weighted = (val * d.weight).toFixed(1);
        const kpiList = kpiNames.map((kpi, ki) => {
            const kpiVal = scores.kpis[d.id] ? (scores.kpis[d.id][ki] || 80) : 80;
            const kpiPct = Math.round(kpiVal);
            const kpiScore = kpiVal.toFixed(1);
            return `<div class="hexa-kpi-item">
                <span class="hexa-kpi-name">${kpi}</span>
                <div class="hexa-kpi-bar-wrap"><div class="hexa-kpi-bar" style="width:${kpiPct}%;background:${d.color}"></div></div>
                <span class="hexa-kpi-score" style="color:${d.color}">${kpiScore}</span>
            </div>`;
        }).join('');
        return `<div class="hexa-dim-row" id="dimrow-${d.id}" onclick="toggleDim('${buId}','${d.id}')">
            <div class="hexa-dim-header">
                <div class="hexa-dim-dot" style="background:${d.color}"></div>
                <div class="hexa-dim-num">${d.id.toUpperCase()}</div>
                <div class="hexa-dim-name">${dimName}</div>
                <div class="hexa-dim-weight">${(d.weight*100).toFixed(0)}%</div>
                <div class="hexa-dim-bar-wrap"><div class="hexa-dim-bar" style="width:${val}%;background:${d.color}"></div></div>
                <div class="hexa-dim-score" style="color:${d.color}">${val}</div>
                <div class="hexa-dim-pts">+${weighted}</div>
                <div class="hexa-dim-chevron">&#9660;</div>
            </div>
            <div class="hexa-dim-kpi">${kpiList}</div>
        </div>`;
    }).join('');
}
function toggleDim(buId, dimId) {
    var dimRow = document.getElementById('dimrow-'+dimId);
    var wasOpen = dimRow.classList.contains('open');
    // 关闭所有其他维度（dim-row + 对比表wrap）
    document.querySelectorAll('[id^="dimrow-"]').forEach(function(r) { r.classList.remove('open'); });
    document.querySelectorAll('[id^="dimComparisonWrap_"], #kpiComparisonWrap').forEach(function(w) { w.style.display = 'none'; });
    // 如果之前未打开，则打开当前维度
    if (!wasOpen) {
        dimRow.classList.add('open');
        var wrapId = dimId === 'd1' ? 'kpiComparisonWrap' : 'dimComparisonWrap_' + dimId;
        var wrap = document.getElementById(wrapId);
        if (wrap) { wrap.style.display = ''; }
    }
}
function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function closePanel() {
    console.log('closePanel() called');
    try {
        document.getElementById('panelOverlay').classList.remove('active');
    } catch(e) { console.error('Error closing panel:', e); }
    try {
        document.body.classList.remove('panel-open');
    } catch(e) {}
    try {
        document.querySelectorAll('.hover-progress').forEach(el => el.style.width='0%');
    } catch(e) {}
    try {
        document.querySelectorAll('.bu-card').forEach(el => el.classList.remove('hover-active'));
    } catch(e) {}
}

// ═══════════════════════════════════════════════════
// 早报详情弹窗（全部保留原有代码）
// ═══════════════════════════════════════════════════
function buname(buId) {
    var n={'new-energy':'新能源','chemicals':'化学品','hydrogen':'氢能',
        'lubricant':'润滑油','cleaning':'可兰素','dike':'迪克化学',
        'aviation':'航空','battery':'电池','changzhou':'常州锂源'};
    return n[buId]||buId;
}
function esch(s) {
    if (!s&&s!==0) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function toggleCard(el) {
    el.closest('.sec-card').classList.toggle('open');
}

function switchCategory(category) {
    document.querySelectorAll('.mk-nav-item').forEach(function(item) {
        item.classList.remove('active');
    });
    var activeNav = document.querySelector('.mk-nav-item[data-category="' + category + '"]');
    if (activeNav) activeNav.classList.add('active');

    document.querySelectorAll('.mk-category-panel').forEach(function(panel) {
        panel.classList.remove('active');
    });
    var activePanel = document.getElementById('panel-' + category);
    if (activePanel) activePanel.classList.add('active');

    // 控制锂电产业链全景图：仅锂电板块显示，能源/化工板块隐藏
    var chainPanel = document.getElementById('chain-panel');
    if (chainPanel) {
        chainPanel.style.display = (category === 'lithium') ? 'block' : 'none';
    }

    // 切换到化工板块时，重新渲染尿素、WTI原油、乙二醇图表
    if (category === 'chemical') {
        var tries = 0;
        function tryRender() {
            tries++;
            var svg = document.getElementById('urFuturesChart');
            var w = svg ? svg.getBoundingClientRect().width : 0;
            var dataReady = _urChartData && _urChartData.history && _urChartData.history.length > 0;
            if (w > 10 && dataReady) {
                renderUreaChart();
                renderWTIChart();
                renderEGChart();
            } else if (tries < 15) {
                setTimeout(tryRender, 150);
            }
        }
        requestAnimationFrame(function() {
            requestAnimationFrame(tryRender);
        });
    }

    // 切换到有色金属板块时，重新渲染铂、钯、铁矿石图表
    if (category === 'energy') {
        var tries2 = 0;
        function tryRender2() {
            tries2++;
            var svg = document.getElementById('ptFuturesChart');
            var w = svg ? svg.getBoundingClientRect().width : 0;
            var dataReady = _ptChartData && _ptChartData.history && _ptChartData.history.length > 0;
            if (w > 10 && dataReady) {
                renderPTChart();
                renderPDChart();
                renderIChart();
            } else if (tries2 < 15) {
                setTimeout(tryRender2, 150);
            }
        }
        requestAnimationFrame(function() {
            requestAnimationFrame(tryRender2);
        });
    }

    setTimeout(function() {
        window.dispatchEvent(new Event('resize'));
    }, 300);

    // 滚动到行情区域
    scrollToMarket();
}

function scrollToMarket() {
    var el = document.getElementById('market-section');
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ============================================================
// 锂电板块子分类切换：磷酸铁锂产业 / 电解液

var _currentLithiumSubCategory = 'lfp';

function switchLithiumSubCategory(subCategory) {
    _currentLithiumSubCategory = subCategory;
    
    // 更新Tab按钮状态
    var tabGroup = document.getElementById('lithiumCategoryTabs');
    if (tabGroup) {
        tabGroup.querySelectorAll('.category-tab').forEach(function(tab) {
            tab.classList.remove('active');
        });
        var activeTab = tabGroup.querySelector('.category-tab[data-subcategory="' + subCategory + '"]');
        if (activeTab) activeTab.classList.add('active');
    }
    
    // 控制产业链全景图显示：仅在磷酸铁锂产业时显示
    var chainPanel = document.getElementById('chain-panel');
    if (chainPanel) {
        if (subCategory === 'lfp') {
            chainPanel.style.display = 'block';
        } else {
            chainPanel.style.display = 'none';
        }
    }
    
    // 重新渲染甘特图
    renderLithiumGantt(subCategory);
    
    console.log('[锂电子分类] 已切换到: ' + subCategory + ', 产业链全景图: ' + (subCategory === 'lfp' ? '显示' : '隐藏'));
}

function renderLithiumGantt(subCategory) {
    // 获取gantt容器
    var container = document.getElementById('gantt-chart-container');
    if (!container) return;
    
    // 清空容器
    container.innerHTML = '';
    
    // 根据子分类获取不同的甘特图数据
    if (subCategory === 'lfp') {
        // 磷酸铁锂产业链甘特图（现有逻辑）
        try {
            if (typeof window.cumulativeData !== 'undefined' && window.cumulativeData) {
                // 调用全局的addCumulativeBarsGantt函数
                if (typeof window.addCumulativeBarsGantt === 'function') {
                    window.addCumulativeBarsGantt(window.cumulativeData);
                } else {
                    console.error('[甘特图] window.addCumulativeBarsGantt函数不存在！');
                    container.innerHTML = '<div style="padding:40px;text-align:center;color:#e74c3c;">系统错误：addCumulativeBarsGantt函数未定义</div>';
                }
            } else {
                console.warn('[甘特图] cumulativeData未定义');
                container.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">暂无数据（cumulativeData未定义）</div>';
            }
        } catch(e) {
            console.error('[甘特图] LFP甘特图渲染失败:', e);
            container.innerHTML = '<div style="padding:40px;text-align:center;color:#e74c3c;">渲染失败: ' + e.message + '</div>';
        }
    } else if (subCategory === 'electrolyte') {
        // 电解液甘特图
        renderElectrolyteGantt(container);
    } else if (subCategory === 'recycling') {
        // 锂电池回收甘特图
        renderRecyclingGantt(container);
    }
}

// 电解液品种定义（全局）
const ELECTROLYTE_VARIETIES = [
    { id: '电解液价格-磷酸铁锂动力型', name: '电解液-磷酸铁锂动力', unit: '元/吨', svgId: 'electrolyteLfpPowerChart' },
    { id: '电解液价格-磷酸铁锂储能型', name: '电解液-磷酸铁锂储能', unit: '元/吨', svgId: 'electrolyteLfpStorageChart' },
    { id: '电解液价格-三元动力型', name: '电解液-三元动力', unit: '元/吨', svgId: 'electrolyteTernaryPowerChart' },
    { id: 'LiFSI价格-固态', name: 'LiFSI-固态', unit: '元/吨', svgId: 'electrolyteLifsiChart' },
    { id: '添加剂VC-价格', name: '添加剂VC', unit: '元/吨', svgId: 'electrolyteVCChart' },
    { id: '添加剂FEC-价格', name: '添加剂FEC', unit: '元/吨', svgId: 'electrolyteFECChart' },
    { id: '溶剂EC-价格', name: '溶剂EC', unit: '元/吨', svgId: 'electrolyteECChart' },
    { id: '溶剂DMC-价格', name: '溶剂DMC', unit: '元/吨', svgId: 'electrolyteDMCChart' },
    { id: '溶剂EMC-价格', name: '溶剂EMC', unit: '元/吨', svgId: 'electrolyteEMCChart' }
];

// 电解液累积数据（全局）
let electrolyteCumulativeData = null;

// 计算电解液累积涨跌幅数据
function computeElectrolyteProduct(history, name, unit) {
    if (!Array.isArray(history) || history.length < 2) return null;
    const d26 = history.filter(d => d.日期 >= '2026-01-01');
    if (d26.length < 2) return null;
    const sp = parseFloat(d26[0].均价);
    const ep = parseFloat(d26[d26.length - 1].均价);
    if (sp <= 0) return null;
    const ch = ep - sp;
    const pct = ch / sp * 100;
    electrolyteCumulativeData.products.push({
        name: name,
        unit: unit,
        start_date: d26[0].日期,
        end_date: d26[d26.length - 1].日期,
        start_price: sp,
        end_price: ep,
        change: ch,
        change_pct: parseFloat(pct.toFixed(2)),
        direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'stable',
        data_points: d26.length
    });
    return true;
}

// 电解液甘特图渲染函数
function renderElectrolyteGantt(container) {
    console.log('[甘特图] 渲染电解液甘特图...');
    console.log('[甘特图] ELECTROLYTE_DATA定义:', typeof ELECTROLYTE_DATA !== 'undefined');
    console.log('[甘特图] ELECTROLYTE_VARIETIES定义:', typeof ELECTROLYTE_VARIETIES !== 'undefined');
    
    // 检查数据
    if (typeof ELECTROLYTE_DATA === 'undefined') {
        console.log('[甘特图] ⚠️ ELECTROLYTE_DATA未定义');
        container.innerHTML = '<div style="padding:40px;text-align:center;color:#e74c3c;">⚠️ 电解液数据未加载（请检查electrolyte_data.js）</div>';
        return;
    }
    
    console.log('[甘特图] ELECTROLYTE_DATA keys:', Object.keys(ELECTROLYTE_DATA));
    console.log('[甘特图] ELECTROLYTE_VARIETIES:', ELECTROLYTE_VARIETIES);
    
    // 计算累积涨跌幅数据
    electrolyteCumulativeData = {
        meta: { description: '2026年至今累计涨跌幅', data_source: 'electrolyte_data.js', update_time: '', year: 2026 },
        products: []
    };
    
    ELECTROLYTE_VARIETIES.forEach(variety => {
        const data = ELECTROLYTE_DATA[variety.id];
        if (data && data.length > 0) {
            computeElectrolyteProduct(data, variety.name, variety.unit);
        }
    });
    
    // 生成甘特图HTML（与磷酸铁锂相同的结构）
    addElectrolyteCumulativeBarsGantt(container);
    
    console.log('[甘特图] ✅ 电解液甘特图渲染完成');
}

// 添加电解液累积涨跌幅甘特图（HTML divs方式）
function addElectrolyteCumulativeBarsGantt(container) {
    console.log('[电解液甘特图] 开始添加累积涨跌幅甘特图...');
    
    if (!electrolyteCumulativeData || !electrolyteCumulativeData.products || electrolyteCumulativeData.products.length === 0) {
        console.log('[电解液甘特图] ⚠️ 无累积数据');
        return;
    }
    
    // 生成甘特图HTML
    let ganttHTML = '<div class="cumulative-gantt">';
    ganttHTML += '<div class="gantt-title">电解液产业链2026年累计涨跌幅 <span style="font-size:12px;color:#999;font-weight:normal;">(2026年至今)</span></div>';
    ganttHTML += '<div class="gantt-btn-group" id="electrolyteGanttBtnGroup"></div>';
    
    // 找出最大涨跌幅
    let maxChangePct = 0;
    electrolyteCumulativeData.products.forEach(p => {
        if (Math.abs(p.change_pct) > maxChangePct) maxChangePct = Math.abs(p.change_pct);
    });
    
    // 按涨跌幅降序排序
    electrolyteCumulativeData.products.sort((a, b) => b.change_pct - a.change_pct);
    
    // 为每个产品生成一行
    electrolyteCumulativeData.products.forEach(product => {
        const pct = product.change_pct;
        const absPct = Math.abs(pct);
        const width = maxChangePct > 0 ? (absPct / maxChangePct) * 80 : 0;
        const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'stable';
        const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
        const color = pct > 0 ? '#d32f2f' : pct < 0 ? '#388e3c' : '#999';
        
        const dateRange = product.start_date + ' ~ ' + product.end_date;
        
        ganttHTML += '<div class="gantt-row" data-product-name="' + product.name + '">';
        ganttHTML += '<span class="gantt-name">' + product.name + '</span>';
        ganttHTML += '<div class="gantt-bar-track">';
        ganttHTML += '<div class="gantt-bar ' + direction + '" data-target-width="' + width + '%" style="width: 0;">';
        ganttHTML += '<span class="gantt-bar-label"><span class="gantt-arrow">' + arrow + '</span> ' + (pct > 0 ? '+' : '') + pct.toFixed(2) + '%</span>';
        ganttHTML += '</div>';
        ganttHTML += '</div>';
        ganttHTML += '<span class="gantt-value" style="color:' + color + ';font-size:10px;">' + product.start_price.toLocaleString() + ' → ' + product.end_price.toLocaleString() + '<br><span style="color:#999;">(' + dateRange + ')</span></span>';
        ganttHTML += '</div>';
    });
    
    ganttHTML += '<div id="electrolyte-gantt-expand-area" style="display:none;margin-top:20px;"></div>';
    ganttHTML += '</div>';
    
    container.innerHTML = ganttHTML;
    
    // 触发条形增长动画
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            container.querySelectorAll('.gantt-bar').forEach(bar => {
                const targetWidth = bar.getAttribute('data-target-width');
                if (targetWidth) {
                    bar.style.width = targetWidth;
                }
            });
        });
    });
    
    console.log('[电解液甘特图] ✅ 已添加累积涨跌幅甘特图');
    
    // 生成按钮组
    generateElectrolyteGanttButtons();
    
    // 绑定甘特图行点击事件
    console.log('[电解液甘特图] 准备绑定点击事件，共', container.querySelectorAll('.gantt-row').length, '行');
    container.querySelectorAll('.gantt-row').forEach(row => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', function() {
            const productName = this.getAttribute('data-product-name');
            console.log('[电解液甘特图] 点击行 productName=', productName);
            
            // 检查当前行是否已展开
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                const area = document.getElementById('electrolyte-gantt-expand-area');
                if (area) {
                    const card = area.querySelector('.mk-chart-card');
                    if (card) {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        card.style.transition = 'opacity 0.3s, transform 0.3s';
                    }
                    setTimeout(() => {
                        area.style.display = 'none';
                        if (card && card._origParent) {
                            card._origParent.appendChild(card);
                            card.style.display = '';
                            card.style.opacity = '';
                            card.style.transform = '';
                            card.style.transition = '';
                            card._origParent = null;
                        }
                        area.innerHTML = '';
                    }, 300);
                }
                return;
            }
            
            // 先关闭已展开的行
            container.querySelectorAll('.gantt-row.active').forEach(r => {
                r.classList.remove('active');
                const area = document.getElementById('electrolyte-gantt-expand-area');
                if (area) {
                    area.style.display = 'none';
                    const card = area.querySelector('.mk-chart-card');
                    if (card && card._origParent) {
                        card._origParent.appendChild(card);
                        card.style.display = '';
                        card._origParent = null;
                    }
                    area.innerHTML = '';
                }
            });
            
            this.classList.add('active');
            showElectrolyteProductChart(productName);
        });
    });
}

// 生成电解液甘特图按钮组
function generateElectrolyteGanttButtons() {
    console.log('[generateElectrolyteGanttButtons] 开始生成按钮组...');
    const btnGroup = document.getElementById('electrolyteGanttBtnGroup');
    if (!btnGroup) {
        console.error('[generateElectrolyteGanttButtons] 未找到 electrolyteGanttBtnGroup');
        return;
    }
    btnGroup.innerHTML = '';
    
    const sortedProducts = [...electrolyteCumulativeData.products].sort((a, b) => b.change_pct - a.change_pct);
    
    sortedProducts.forEach(product => {
        const btn = document.createElement('button');
        btn.className = 'gantt-btn ' + (product.change_pct >= 0 ? 'up' : 'down');
        btn.setAttribute('data-product', product.name);
        btn.innerHTML = '<span class="product-name">' + product.name + '</span>';
        
        btn.addEventListener('mouseenter', function() {
            highlightElectrolyteGanttRow(product.name);
        });
        
        btn.addEventListener('mouseleave', function() {
            unhighlightElectrolyteGanttRow(product.name);
        });
        
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            selectElectrolyteGanttProduct(product.name);
        });
        
        btnGroup.appendChild(btn);
    });
    
    console.log('[generateElectrolyteGanttButtons] ✅ 按钮组已生成，共', sortedProducts.length, '个按钮');
}

// 高亮甘特图行
function highlightElectrolyteGanttRow(productName) {
    const row = document.querySelector('.cumulative-gantt .gantt-row[data-product-name="' + productName + '"]');
    if (row && !row.classList.contains('active')) {
        row.classList.add('hover');
    }
}

// 取消高亮甘特图行
function unhighlightElectrolyteGanttRow(productName) {
    const row = document.querySelector('.cumulative-gantt .gantt-row[data-product-name="' + productName + '"]');
    if (row && !row.classList.contains('active')) {
        row.classList.remove('hover');
    }
}

// 选中甘特图品种
function selectElectrolyteGanttProduct(productName) {
    console.log('[selectElectrolyteGanttProduct] 选中品种：', productName);
    
    document.querySelectorAll('#electrolyteGanttBtnGroup .gantt-btn.active').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.cumulative-gantt .gantt-row.active').forEach(r => {
        r.classList.remove('active');
        r.classList.remove('hover');
    });
    
    const btn = document.querySelector('#electrolyteGanttBtnGroup .gantt-btn[data-product="' + productName + '"]');
    const row = document.querySelector('.cumulative-gantt .gantt-row[data-product-name="' + productName + '"]');
    
    if (btn) btn.classList.add('active');
    if (row) row.classList.add('active');
    
    showElectrolyteProductChart(productName);
}

// 显示电解液品种图表
function showElectrolyteProductChart(productName) {
    console.log('[showElectrolyteProductChart] productName=', productName);
    
    const area = document.getElementById('electrolyte-gantt-expand-area');
    if (!area) { console.error('[showElectrolyteProductChart] 未找到 electrolyte-gantt-expand-area'); return; }
    area.style.display = 'block';
    
    // 查找对应的品种
    let matchedVariety = null;
    for (const v of ELECTROLYTE_VARIETIES) {
        if (productName.includes(v.name)) {
            matchedVariety = v;
            break;
        }
    }
    
    if (!matchedVariety) {
        area.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">未找到 [' + productName + '] 对应的图表配置</div>';
        return;
    }
    
    // 检查数据是否存在
    const data = ELECTROLYTE_DATA[matchedVariety.id];
    if (!data || data.length === 0) {
        area.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">[' + productName + '] 无数据</div>';
        return;
    }
    
    // 创建卡片容器
    const card = document.createElement('div');
    card.className = 'mk-chart-card';
    card.style.margin = '20px 0';
    card.style.width = '100%';
    
    // 创建标题
    const title = document.createElement('div');
    title.className = 'chart-title-centered';
    title.textContent = productName + '价格走势';
    card.appendChild(title);
    
    // 创建信息行（图例 + 最新价/涨跌幅）
    const infoRow = document.createElement('div');
    infoRow.className = 'chart-info-row';
    infoRow.style.padding = '4px 12px';
    infoRow.innerHTML = '<div class="chart-legend-left">' +
        '<span class="chart-legend-item"><span class="chart-legend-dot" style="background:#d32f2f;"></span>均价（元/吨）</span>' +
        '</div>' +
        '<div class="chart-price-right">' +
        '<span class="price-label">最新价：</span><span class="chart-latest-price" id="eleLatestPrice_' + matchedVariety.svgId + '">--</span>' +
        '<span class="change-label">涨跌幅：</span><span class="chart-latest-change" id="eleLatestChange_' + matchedVariety.svgId + '"></span>' +
        '</div>';
    card.appendChild(infoRow);
    
    const container = document.createElement('div');
    container.className = 'chart-container';
    container.style.position = 'relative';
    
    // 创建Canvas
    const canvas = document.createElement('canvas');
    canvas.id = matchedVariety.svgId + 'Canvas';
    canvas.style.width = '100%';
    canvas.style.height = '300px';
    canvas.style.display = 'block';
    container.appendChild(canvas);
    
    // 创建tooltip元素
    const tooltip = document.createElement('div');
    tooltip.id = matchedVariety.svgId + 'Tooltip';
    tooltip.style.cssText = 'position:absolute;display:none;padding:8px 12px;background:rgba(0,0,0,0.8);color:#fff;border-radius:4px;font-size:12px;pointer-events:none;z-index:1000;white-space:nowrap;';
    container.appendChild(tooltip);
    
    card.appendChild(container);
    
    // 清理并添加新卡片
    area.innerHTML = '';
    area.appendChild(card);
    
    // 计算最新价和涨跌幅
    const prices = data.map(d => parseFloat(d.均价));
    const latestPrice = prices[prices.length - 1];
    const prevPrice = prices.length >= 2 ? prices[prices.length - 2] : latestPrice;
    const pct = prevPrice > 0 ? ((latestPrice - prevPrice) / prevPrice * 100) : 0;
    
    // 更新最新价和涨跌幅显示
    const priceEl = document.getElementById('eleLatestPrice_' + matchedVariety.svgId);
    const changeEl = document.getElementById('eleLatestChange_' + matchedVariety.svgId);
    if (priceEl) priceEl.textContent = latestPrice.toLocaleString() + ' 元/吨';
    if (changeEl) {
        changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
        changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
    }
    
    // 绘制折线图
    drawElectrolyteCanvasLineChart(canvas, tooltip, data, productName);
}

// 使用Canvas绘制电解液折线图（仿电池级碳酸锂样式，带动画）
function drawElectrolyteCanvasLineChart(canvas, tooltip, data, productName) {
    if (!data || data.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const W = rect.width;
    const H = rect.height;
    const PAD = { top: 15, right: 60, bottom: 40, left: 60 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;
    
    // 计算价格范围
    const prices = data.map(d => parseFloat(d.均价));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const padding = priceRange * 0.08;
    const yMin = minPrice - padding;
    const yMax = maxPrice + padding;
    
    function xScale(i) { return PAD.left + (i / (data.length - 1)) * chartW; }
    function yScale(p) { return PAD.top + (1 - (p - yMin) / (yMax - yMin)) * chartH; }
    
    // 预计算所有点的坐标
    const points = [];
    data.forEach((d, i) => {
        points[i] = { x: xScale(i), y: yScale(parseFloat(d.均价)), price: parseFloat(d.均价), date: d.日期 };
    });
    
    // 绘制静态元素（网格、坐标轴、标题、填充区域）
    function drawStatic() {
        ctx.clearRect(0, 0, W, H);
        
        // 绘制背景网格线（水平）
        ctx.strokeStyle = '#f0f0f0';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = PAD.top + (i / 5) * chartH;
            ctx.beginPath();
            ctx.moveTo(PAD.left, y);
            ctx.lineTo(PAD.left + chartW, y);
            ctx.stroke();
            
            // Y轴标签
            const price = yMax - (i / 5) * (yMax - yMin);
            ctx.fillStyle = '#999';
            ctx.font = '11px Microsoft YaHei';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(price.toFixed(0), PAD.left - 8, y);
        }
        
        // X轴标签（显示6个均匀分布的日期）
        const xLabelCount = 6;
        ctx.fillStyle = '#999';
        ctx.font = '10px Microsoft YaHei';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let i = 0; i <= xLabelCount; i++) {
            const x = PAD.left + (i / xLabelCount) * chartW;
            const dataIdx = Math.round((i / xLabelCount) * (data.length - 1));
            if (data[dataIdx] && data[dataIdx].日期) {
                const dateStr = data[dataIdx].日期.substring(5);
                ctx.fillText(dateStr, x, H - 35);
            }
        }
        
        // 绘制填充区域（渐变：红色到透明）
        const gradient = ctx.createLinearGradient(0, PAD.top, 0, PAD.top + chartH);
        gradient.addColorStop(0, 'rgba(211, 47, 47, 0.15)');
        gradient.addColorStop(1, 'rgba(211, 47, 47, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.lineTo(points[points.length - 1].x, PAD.top + chartH);
        ctx.lineTo(points[0].x, PAD.top + chartH);
        ctx.closePath();
        ctx.fill();
    }
    
    // 绘制折线（带动画进度）
    function drawLine(progress) {
        const endIndex = Math.min(Math.floor(progress * (data.length - 1)), data.length - 1);
        if (endIndex < 0) return;
        
        // 绘制"浅色"线（背景）
        ctx.strokeStyle = 'rgba(211, 47, 47, 0.2)';
        ctx.lineWidth = 6;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i <= endIndex; i++) {
            if (i === 0) ctx.moveTo(points[i].x, points[i].y);
            else ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        
        // 绘制"深色"线（前景，带动画）
        ctx.strokeStyle = '#d32f2f';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i <= endIndex; i++) {
            if (i === 0) ctx.moveTo(points[i].x, points[i].y);
            else ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
    }
    
    // 绘制最后一个点的标记和日期标签
    function drawLastPoint() {
        const lastPoint = points[points.length - 1];
        // 外圈红色
        ctx.fillStyle = '#d32f2f';
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2);
        ctx.fill();
        // 内圈白色
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 最新日期标签（自适应位置：点在左侧则放右侧，点在右侧则放左侧）
        const dateText = lastPoint.date.slice(5); // 格式：MM-DD，如 06-10
        ctx.font = 'bold 11px Microsoft YaHei';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // 计算文本宽度
        const textWidth = ctx.measureText(dateText).width + 10;
        const labelWidth = textWidth + 8;
        
        // 自适应位置：如果点太靠右（距离右边小于标签宽度+20px），放在左侧；否则放右侧
        const maxX = PAD.left + chartW;
        const isTooRight = (lastPoint.x + 20 + labelWidth) > maxX;
        const bgX = isTooRight ? lastPoint.x - 12 - labelWidth : lastPoint.x + 12;
        const bgY = lastPoint.y - 10;
        
        // 半透明背景
        ctx.fillStyle = 'rgba(211, 47, 47, 0.9)';
        ctx.beginPath();
        ctx.roundRect(bgX, bgY - 8, labelWidth, 16, 3);
        ctx.fill();
        
        // 日期文字
        ctx.fillStyle = '#fff';
        ctx.fillText(dateText, bgX + 5, bgY);
    }
    
    // 动画
    let animStartTime = null;
    const animDuration = 1200;
    
    function animate(timestamp) {
        if (!animStartTime) animStartTime = timestamp;
        const elapsed = timestamp - animStartTime;
        const progress = Math.min(elapsed / animDuration, 1);
        
        drawStatic();
        drawLine(progress);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            drawStatic();
            drawLine(1);
            drawLastPoint();
            enableHover();
        }
    }
    
    // 启用悬停交互
    function enableHover() {
        let activeIndex = -1;
        
        canvas.addEventListener('mousemove', function(e) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            let minDist = Infinity;
            let closestIdx = -1;
            
            points.forEach((p, i) => {
                const dist = Math.abs(mouseX - p.x);
                if (dist < minDist) {
                    minDist = dist;
                    closestIdx = i;
                }
            });
            
            if (minDist > chartW / data.length / 2 + 10) {
                tooltip.style.display = 'none';
                if (activeIndex !== -1) {
                    activeIndex = -1;
                    drawStatic();
                    drawLine(1);
                    drawLastPoint();
                }
                return;
            }
            
            if (closestIdx !== activeIndex) {
                activeIndex = closestIdx;
                drawStatic();
                drawLine(1);
                drawLastPoint();
                
                // 高亮当前点
                const p = points[closestIdx];
                ctx.fillStyle = '#d32f2f';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // 垂直参考线
                ctx.strokeStyle = 'rgba(211, 47, 47, 0.3)';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(p.x, PAD.top);
                ctx.lineTo(p.x, PAD.top + chartH);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
            // 显示tooltip
            const p = points[closestIdx];
            tooltip.style.display = 'block';
            tooltip.innerHTML = '<strong>' + p.date + '</strong><br/>均价: ' + p.price.toLocaleString() + ' 元/吨';
            
            let tooltipX = p.x + 10;
            let tooltipY = p.y - 10;
            
            if (tooltipX + tooltip.offsetWidth > W) {
                tooltipX = p.x - tooltip.offsetWidth - 10;
            }
            if (tooltipY < 0) {
                tooltipY = p.y + 20;
            }
            
            tooltip.style.left = tooltipX + 'px';
            tooltip.style.top = tooltipY + 'px';
        });
        
        canvas.addEventListener('mouseleave', function() {
            tooltip.style.display = 'none';
            if (activeIndex !== -1) {
                activeIndex = -1;
                drawStatic();
                drawLine(1);
                drawLastPoint();
            }
        });
    }
    
    // 开始动画
    requestAnimationFrame(animate);
}// 渲染电解液折线图
function renderElectrolyteLineChart(svg, data, svgId) {
    console.log('[renderElectrolyteLineChart] ===== START =====');
    console.log('[renderElectrolyteLineChart] svgId=', svgId, 'data长度=', data ? data.length : 0);
    console.log('[renderElectrolyteLineChart] svg=', !!svg, 'svg.id=', svg ? svg.id : 'N/A');
    
    if (!data || data.length === 0) {
        console.error('[renderElectrolyteLineChart] 数据为空!');
        return;
    }
    
    // 打印第一条和最后一条数据
    console.log('[renderElectrolyteLineChart] 第1条:', JSON.stringify(data[0]));
    console.log('[renderElectrolyteLineChart] 最后1条:', JSON.stringify(data[data.length - 1]));
    
    const W = 800, H = 260;
    const PAD = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;
    
    // 计算价格范围
    const prices = data.map(d => parseFloat(d.均价));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const padding = priceRange * 0.1;
    const yMin = minPrice - padding;
    const yMax = maxPrice + padding;
    
    function xScale(i) { return PAD.left + (i / (data.length - 1)) * chartW; }
    function yScale(p) { return PAD.top + (1 - (p - yMin) / (yMax - yMin)) * chartH; }
    
    const gridG = svg.querySelector('#' + svgId + 'Grid');
    const areaG = svg.querySelector('#' + svgId + 'Area');
    const lineG = svg.querySelector('#' + svgId + 'Line');
    const axisXG = svg.querySelector('#' + svgId + 'AxisX');
    const axisYG = svg.querySelector('#' + svgId + 'AxisY');
    
    console.log('[renderElectrolyteLineChart] gridG=', !!gridG, 'areaG=', !!areaG, 'lineG=', !!lineG, 'axisXG=', !!axisXG, 'axisYG=', !!axisYG);
    
    if (gridG) gridG.innerHTML = '';
    if (areaG) areaG.innerHTML = '';
    if (lineG) lineG.innerHTML = '';
    if (axisXG) axisXG.innerHTML = '';
    if (axisYG) axisYG.innerHTML = '';
    
    if (!lineG) {
        console.error('[renderElectrolyteLineChart] lineG不存在，创建新的!');
        lineG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        lineG.setAttribute('id', svgId + 'Line');
        lineG.setAttribute('class', 'deep-line-anim');
        svg.appendChild(lineG);
    }
    
    function mk(tag, attrs) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const k in attrs) el.setAttribute(k, attrs[k]);
        return el;
    }
    
    // 网格线
    for (let i = 0; i <= 5; i++) {
        const y = PAD.top + (i / 5) * chartH;
        gridG.appendChild(mk('line', { x1: PAD.left, y1: y, x2: PAD.left + chartW, y2: y, stroke: '#eee', 'stroke-width': 1 }));
    }
    
    // Y轴标签
    for (let i = 0; i <= 5; i++) {
        const y = PAD.top + (i / 5) * chartH;
        const val = yMax - (i / 5) * (yMax - yMin);
        axisYG.appendChild(mk('text', { x: PAD.left - 8, y: y + 4, 'text-anchor': 'end', 'font-size': 11, fill: '#999' }));
        axisYG.lastChild.textContent = val.toFixed(0);
    }
    
    // X轴标签
    const step = Math.max(1, Math.floor(data.length / 6));
    for (let i = 0; i < data.length; i += step) {
        const x = xScale(i);
        let dateLabel = data[i].日期 || '';
        if (dateLabel && dateLabel.length >= 10) dateLabel = dateLabel.substring(5, 10);
        axisXG.appendChild(mk('text', { x: x, y: PAD.top + chartH + 20, 'text-anchor': 'middle', 'font-size': 10, fill: '#999' }));
        axisXG.lastChild.textContent = dateLabel;
        axisXG.appendChild(mk('line', { x1: x, y1: PAD.top + chartH, x2: x, y2: PAD.top + chartH + 5, stroke: '#ccc', 'stroke-width': 1 }));
    }
    
    // ���积图
    let areaPath = 'M ' + xScale(0) + ' ' + yScale(yMin);
    for (let i = 0; i < data.length; i++) {
        areaPath += ' L ' + xScale(i) + ' ' + yScale(parseFloat(data[i].均价));
    }
    areaPath += ' L ' + xScale(data.length - 1) + ' ' + yScale(yMin) + ' Z';
    areaG.appendChild(mk('path', { d: areaPath, fill: 'url(#' + svgId + 'Grad)', stroke: 'none' }));
    
    // 折线图
    let linePath = '';
    for (let i = 0; i < data.length; i++) {
        if (i === 0) linePath = 'M ' + xScale(i) + ' ' + yScale(parseFloat(data[i].均价));
        else linePath += ' L ' + xScale(i) + ' ' + yScale(parseFloat(data[i].均价));
    }
    lineG.appendChild(mk('path', { d: linePath, fill: 'none', stroke: '#1e3c72', 'stroke-width': 2 }));
    
    // 最新点标记
    const lastIdx = data.length - 1;
    lineG.appendChild(mk('circle', { cx: xScale(lastIdx), cy: yScale(parseFloat(data[lastIdx].均价)), r: 4, fill: '#1e3c72', stroke: '#fff', 'stroke-width': 2 }));
    
    console.log('[renderElectrolyteLineChart] 渲染完成，lineG子元素数量:', lineG ? lineG.children.length : 0);
}

// ============================================================
// 品种卡片跳转：切换分类 + 滚动到图表 + 高亮
// ============================================================
var _tickerHighlightTimer = null;

function tickerNavigate(sectionId) {
    // 品种 → 分类映射
    var SEC_CATEGORY = {
        'sec-lc-futures': 'lithium',
        'sec-lc-spot':    'lithium',
        'sec-lfp':        'lithium',
        'sec-spod':       'lithium',
        'sec-lep':        'lithium',
        'sec-wti':        'energy',
        'sec-iron':       'energy',
        'sec-urea':       'chemical',
        'sec-eg':         'chemical',
    };
    var cat = SEC_CATEGORY[sectionId];
    if (!cat) return;

    // 切换分类面板
    switchCategory(cat);

    // 延迟滚动到具体图表（等面板切换动画完成）
    setTimeout(function() {
        var target = document.getElementById(sectionId);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // 高亮效果
            target.classList.add('ticker-highlight');
            if (_tickerHighlightTimer) clearTimeout(_tickerHighlightTimer);
            _tickerHighlightTimer = setTimeout(function() {
                target.classList.remove('ticker-highlight');
            }, 2000);
        }
    }, 350);
}

// 页面加载时：如 URL 带 hash，直接跳转到对应品种图表
window.addEventListener('DOMContentLoaded', function() {
    var hash = window.location.hash.replace('#', '');
    if (hash && hash.indexOf('sec-') === 0) {
        setTimeout(function() { tickerNavigate(hash); }, 600);
    }
});

// hash 变化时（前进后退浏览器行为）
window.addEventListener('hashchange', function() {
    var hash = window.location.hash.replace('#', '');
    if (hash && hash.indexOf('sec-') === 0) {
        tickerNavigate(hash);
    }
});


/* ============== inline_04.js ============== */

// 返回顶部按钮逻辑
(function() {
    var btn = document.getElementById('backToTop');
    if (!btn) return;
    
    // 监听滚动事件
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            btn.style.display = 'flex';
            setTimeout(function() {
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
            }, 10);
        } else {
            btn.style.opacity = '0';
            btn.style.pointerEvents = 'none';
            setTimeout(function() {
                if (btn.style.opacity === '0') {
                    btn.style.display = 'none';
                }
            }, 300);
        }
    });
    
    // 点击返回顶部
    btn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // 悬停效果
    btn.addEventListener('mouseenter', function() {
        btn.style.transform = 'scale(1.1)';
        btn.style.boxShadow = '0 6px 20px rgba(0,125,78,0.6)';
    });
    
    btn.addEventListener('mouseleave', function() {
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = '0 4px 12px rgba(0,125,78,0.4)';
    });
})();


/* ============== inline_05.js ============== */

// 页面加载后立即更新时钟和日期
document.addEventListener('DOMContentLoaded', function() {
  var updateClock = function() {
    var now = new Date();
    // 日期格式：2026年5月17日 星期六
    var dateOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    var dateStr = now.toLocaleDateString('zh-CN', dateOptions);
    // 时间格式：HH:MM:SS（24小时制，精确到秒）
    var timeStr = now.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    var dateEl = document.getElementById('currentDate');
    var timeEl = document.getElementById('realTimeClock');
    var iconEl = document.getElementById('clockIcon');
    
    if(dateEl) dateEl.textContent = dateStr;
    if(timeEl) timeEl.textContent = timeStr;
    
    if(iconEl) {
      var hour = now.getHours();
      if(hour >= 6 && hour < 12) iconEl.textContent = '🌅';
      else if(hour >= 12 && hour < 18) iconEl.textContent = '☀️';
      else if(hour >= 18 && hour < 22) iconEl.textContent = '🌆';
      else iconEl.textContent = '🌙';
    }
  };
  // 立即执行
  updateClock();
  // 每秒更新
  setInterval(updateClock, 1000);

  // 导航栏滑动指示器
  (function initMainNavPill() {
    var menu = document.getElementById('mainNavMenu');
    var pill = document.getElementById('mainNavPill');
    if (!menu || !pill) return;
    var items = menu.querySelectorAll('.main-nav-item');
    function movePill(el) {
      if (!el) { pill.style.opacity = '0'; return; }
      pill.style.opacity = '1';
      pill.style.left = (el.offsetLeft - 1) + 'px';
      pill.style.width = (el.offsetWidth + 2) + 'px';
    }
    items.forEach(function(item) {
      item.addEventListener('mouseenter', function() {
        movePill(item);
        items.forEach(function(i) { i.classList.remove('active'); });
        item.classList.add('active');
      });
    });
    menu.addEventListener('mouseleave', function() {
      pill.style.opacity = '0';
      items.forEach(function(i) { i.classList.remove('active'); });
    });
    // 默认选中第一个
    if (items[0]) movePill(items[0]);
  })();
});


/* ============== inline_06.js ============== */

        // 初始化锂电板块产业链洞察Dashboard
        document.addEventListener("DOMContentLoaded", function() {
            console.log("[页面加载] 开始初始化锂电Dashboard...");
            if (typeof initLithiumDashboard === "function") {
                initLithiumDashboard();
            } else {
                console.warn("[页面加载] initLithiumDashboard函数未找到");
            }
            
            // 初始化锂辉石和锂云母图表
            setTimeout(function() {
                if (typeof initLithiumOreChart === 'function') {
                    console.log("[页面加载] 初始化锂辉石图表...");
                    initLithiumOreChart();
                } else {
                    console.warn("[页面加载] initLithiumOreChart函数未找到");
                }
                if (typeof initLepidoliteChart === 'function') {
                    console.log("[页面加载] 初始化锂云母图表...");
                    initLepidoliteChart();
                } else {
                    console.warn("[页面加载] initLepidoliteChart函数未找到");
                }
            }, 100);
        });
    

/* ============== inline_07.js ============== */

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
                    // 保留5%澳洲历史数据与国内/中国现货5.0-5.5%数据，确保曲线连续
                    data.history = data.history.filter(function(d) {
                        return (d.grade === '5%' && d.origin === '澳洲') ||
                               (d.grade && d.grade.indexOf('5.0-5.5%') >= 0) ||
                               (d.grade && d.grade.indexOf('5%-5.5%') >= 0);
                    });
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
                    priceEl.textContent = latest.avg_price.toFixed(0) + ' ' + (latest.unit || '元/吨');
                }
                var pct = 0;
                if (changeEl && data.history.length >= 2) {
                    var prev = data.history[data.history.length - 2].avg_price;
                    var curr = latest.avg_price;
                    pct = prev > 0 ? ((curr - prev) / prev * 100) : 0;
                    changeEl.textContent = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    changeEl.className = 'chart-latest-change ' + (pct >= 0 ? 'up' : 'down');
                }
                updateTicker('ticker-spod', latest.avg_price.toFixed(0) + ' ' + (latest.unit || '元/吨'), pct);
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

            // 保留5%澳洲历史数据与国内/中国现货5.0-5.5%数据
            var filtered = historyData.filter(function(d) {
                return (d.grade === '5%' && d.origin === '澳洲') ||
                       (d.grade && d.grade.indexOf('5.0-5.5%') >= 0) ||
                       (d.grade && d.grade.indexOf('5%-5.5%') >= 0);
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

/* ============== inline_08.js ============== */

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
                
                // 预加载热点资讯图片（提前开始下载，避免滑到时白屏）
                items.forEach(function(item, i) {
                    if (item.image_url) {
                        var preloadImg = new Image();
                        preloadImg.onload = (function(idx, imgUrl) {
                            return function() {
                                var slideEl = newsCarousel.children[idx];
                                if (slideEl) {
                                    var bgEl = slideEl.querySelector('.news-slide-bg');
                                    if (bgEl) {
                                        bgEl.style.backgroundImage = 'url(' + imgUrl + ')';
                                        bgEl.style.backgroundSize = 'cover';
                                        bgEl.style.backgroundPosition = 'center';
                                    }
                                }
                            };
                        })(i, item.image_url);
                        preloadImg.src = item.image_url;
                    }
                });
                
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
    


/* ============== inline_09.js ============== */

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



/* ============== inline_auth.js ============== */
/**
 * 权限闸门（inline_auth.js）
 * ------------------------------------------------------------------
 * 页面加载时根据 auth_policy.js 的 AUTH_POLICY 判定当前页是否允许当前飞书用户访问。
 * - 命中（部门 ID 交集 或 事业部匹配 或 页面不设限）→ 移除遮罩，正常渲染。
 * - 未命中 → 显示"无权限访问"遮罩。
 * - 非飞书环境 → 受限页显示"请在飞书中打开"；公共页正常。
 * - 调试：URL 带 ?bypass=1 跳过鉴权（仅本地/测试用）。
 *
 * 依赖（需在其之前加载）：auth_policy.js（定义 window.AUTH_BACKEND / window.AUTH_POLICY）
 * 鉴权链路复用飞书 JSAPI 的 tt.getAuthCode（由妙搭/Lark 运行时注入 window.tt）。
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
        renderOverlay('checking', '权限校验中…', '正在重新核对权限');
        // 重新执行（复用 run 的逻辑核心）
        var key = getPageKey();
        var policy = window.AUTH_POLICY && window.AUTH_POLICY[key];
        if (isOpen(policy)) { removeOverlay(); return; }
        var allowed = allowedSet(policy);
        getIdentity().then(function (identity) {
            if (checkAccess(identity, allowed)) removeOverlay();
            else renderOverlay('denied', '无权限访问', '您当前的飞书部门不在本页授权范围内。如需访问，请联系战略研究部开通权限。');
        }).catch(function (err) {
            if (err && err.code === 'no_tt') renderOverlay('needfeishu', '请在飞书中打开', '本页面仅对授权部门开放，请在飞书客户端/妙搭中打开本应用。');
            else renderOverlay('denied', '无权限访问', '身份验证失败，请在飞书内重试。');
        });
    };

    // DOM 就绪后执行（此时 body 已可挂载遮罩）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
