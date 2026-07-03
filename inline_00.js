
      window.HTML_VERSION = "20260702_010"; // 版本号（修复市场行情监控闪烁问题）
      
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
    