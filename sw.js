/**
 * Service Worker for AI Daily Report
 * 版本：v1.3 (2026-07-02)
 * 功能：离线缓存静态资源和数据文件，提升二次访问速度
 * 更新：修复 response clone 时序错误，简化缓存逻辑
 */

const CACHE_NAME = 'ai-daily-v4';
const CACHE_VERSION = '20260702v4';

// 规范化 URL：移除缓存破坏参数（如 ?t=xxx）
function normalizeUrl(url) {
  const urlObj = new URL(url);
  return urlObj.pathname;
}

// 安装事件：预缓存静态资源
self.addEventListener('install', function(event) {
  console.log('[SW] 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] 预缓存静态资源');
      return cache.addAll([
        './index_v3.html',
        './index.html'
      ]);
    }).then(function() {
      console.log('[SW] 安装完成，跳过等待');
      return self.skipWaiting();
    })
  );
});

// 激活事件：清理旧缓存
self.addEventListener('activate', function(event) {
  console.log('[SW] 激活中...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('[SW] 激活完成，接管所有页面');
      return self.clients.claim();
    })
  );
});

// 请求拦截：统一缓存策略
self.addEventListener('fetch', function(event) {
  const requestUrl = event.request.url;
  const urlObj = new URL(requestUrl);
  const pathname = urlObj.pathname;
  const normalizedUrl = normalizeUrl(requestUrl);
  const cacheKey = new Request(normalizedUrl);

  // 策略：网络优先，缓存兜底（适用于所有资源）
  event.respondWith(
    fetch(event.request).then(function(response) {
      // 网络成功：克隆 response 并缓存（立即克隆，防止 body 被消耗）
      if (response && response.status === 200) {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(cacheKey, responseToCache);
        });
      }
      return response;
    }).catch(function() {
      // 网络失败：返回缓存
      return caches.match(cacheKey).then(function(cachedResponse) {
        if (cachedResponse) {
          console.log('[SW] 缓存命中:', pathname);
          return cachedResponse;
        }
        // 无缓存：返回错误
        return new Response('网络不可用', { status: 503 });
      });
    })
  );
});
