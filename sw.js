/**
 * Service Worker for AI Daily Report
 * 版本：v2.0 (2026-07-14)
 * 策略：
 *   - 动态资源（JSON/JS/HTML）：缓存优先 + 后台更新（stale-while-revalidate）
 *   - 预取：门户页加载后 postMessage 触发子页面缓存
 *   - 用户第一次浏览时体验不变（走网络+缓存），后续访问全部从缓存秒开
 */

const CACHE_NAME = 'ai-daily-v9';
const CACHE_VERSION = '20260724v1';

/** 归一化 URL：移除缓存破坏参数 */
function normalizeUrl(url) {
  try {
    const u = new URL(url);
    return u.pathname;
  } catch { return url; }
}

// ============================================================
//  安装阶段：预缓存门户入口页
// ============================================================
self.addEventListener('install', function(event) {
  console.log('[SW v8] 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW v8] 预缓存门户入口');
      return cache.addAll(['./index_v3.html', './index.html']);
    }).then(function() {
      console.log('[SW v8] 安装完成，跳过等待');
      return self.skipWaiting();
    })
  );
});

// ============================================================
//  激活阶段：清理旧缓存
// ============================================================
self.addEventListener('activate', function(event) {
  console.log('[SW v8] 激活中...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(name) {
          if (name !== CACHE_NAME) {
            console.log('[SW v8] 删除旧缓存:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(function() {
      console.log('[SW v8] 激活完成');
      return self.clients.claim();
    })
  );
});

// ============================================================
//  消息处理：门户页通知 SW 预取子页面
// ============================================================
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'PREFETCH_PAGES') {
    var urls = event.data.urls || [];
    console.log('[SW v8] 收到预取请求:', urls.length, '个页面');
    event.waitUntil(
      caches.open(CACHE_NAME).then(function(cache) {
        return Promise.allSettled(
          urls.map(function(url) {
            return fetch(url).then(function(res) {
              if (res && res.status === 200) {
                cache.put(normalizeUrl(url), res).catch(function() {});
              }
            }).catch(function() { /* 静默失败 */ });
          })
        );
      })
    );
  }
});

// ============================================================
//  请求拦截：缓存优先 + 后台更新
// ============================================================
self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = request.url;
  var pathname = normalizeUrl(url);

  // 只处理 GET 请求
  if (request.method !== 'GET') return;

  // 只处理同域请求（ai-daily-report 域下的资源）
  if (!url.includes('ai-daily-report')) return;

  event.respondWith(
    caches.match(pathname).then(function(cached) {
      // 后台发起网络更新（不阻塞当前响应）
      var fetcher = fetch(request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(pathname, clone).catch(function(err) {
              console.log('[SW v8] 缓存更新非关键错误（不阻塞）:', err.message);
            });
          });
        }
        return response;
      }).catch(function() {
        return cached || new Response('', { status: 503 });
      });

      // 有缓存 → 直接返回缓存（0ms），后台静默更新
      if (cached) {
        return cached;
      }

      // 无缓存 → 等待网络
      return fetcher;
    })
  );
});
