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

      window.HTML_VERSION = "20260714_001"; // 版本号（2026-07-14早报更新）

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
