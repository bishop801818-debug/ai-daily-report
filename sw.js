/**
 * Service Worker for AI Daily Report
 * 版本：v1.2 (2026-07-02)
 * 功能：离线缓存静态资源和数据文件，提升二次访问速度
 * 更新：修复重复缓存问题（忽略 ?t= 时间戳参数）
 */

const CACHE_NAME = 'ai-daily-v3';
const CACHE_VERSION = '20260702v3';

// 需要缓存的文件列表（预缓存）
const STATIC_CACHE_URLS = [
  './index_v3.html',
  './index.html',
];

// 规范化 URL：移除缓存破坏参数（如 ?t=xxx&v=xxx）
function normalizeUrl(url) {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname;
  
  // 只保留有意义的查询参数（如果有 API 需要特定参数，在此白名单中保留）
  // 目前：移除所有查询参数，因为数据文件不需要参数来区分
  return pathname;
}

// 安装事件：预缓存静态资源
self.addEventListener('install', function(event) {
  console.log('[SW] 安装中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] 预缓存静态资源');
      return cache.addAll(STATIC_CACHE_URLS);
    }).then(function() {
      console.log('[SW] 安装完成，跳过等待');
      return self.skipWaiting(); // 立即激活
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
      return self.clients.claim(); // 立即接管
    })
  );
});

// 请求拦截：缓存策略
self.addEventListener('fetch', function(event) {
  const requestUrl = event.request.url;
  const urlObj = new URL(requestUrl);
  const pathname = urlObj.pathname;
  const normalizedUrl = normalizeUrl(requestUrl);
  
  // 策略1：HTML文件 - 网络优先，缓存兜底
  if (pathname.endsWith('.html') || pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          // 网络成功：更新缓存（使用规范化 URL）
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              // 缓存时去掉时间戳参数
              const cacheKey = new Request(normalizedUrl);
              cache.put(cacheKey, responseClone);
            });
          }
          return response;
        })
        .catch(function() {
          // 网络失败：返回缓存（使用规范化 URL 查找）
          console.log('[SW] HTML网络失败，使用缓存:', pathname);
          const cacheKey = new Request(normalizedUrl);
          return caches.match(cacheKey).then(function(response) {
            if (response) return response;
            // 如果规范化 URL 没找到，尝试原始请求
            return caches.match(event.request);
          });
        })
    );
    return;
  }
  
  // 策略2：JSON数据文件 - 缓存优先（stale-while-revalidate）
  if (pathname.includes('/reports/') || 
      pathname.includes('/data/') || 
      pathname.endsWith('.json') ||
      pathname.endsWith('_data.js') ||
      pathname.endsWith('_data.json')) {
    event.respondWith(
      caches.match(new Request(normalizedUrl)).then(function(cachedResponse) {
        // 后台异步更新缓存
        const fetchPromise = fetch(event.request).then(function(response) {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then(function(cache) {
              // 缓存时使用规范化 URL（去掉时间戳）
              const cacheKey = new Request(normalizedUrl);
              cache.put(cacheKey, response.clone());
            });
          }
          return response;
        }).catch(function() {
          // 忽略更新失败
        });
        
        // 如果有缓存，先返回缓存
        if (cachedResponse) {
          console.log('[SW] 数据文件缓存命中:', pathname);
          return cachedResponse;
        }
        
        // 无缓存：走网络
        return fetchPromise;
      })
    );
    return;
  }
  
  // 策略3：其他资源（JS/CSS/图片）- 缓存优先
  event.respondWith(
    caches.match(new Request(normalizedUrl)).then(function(response) {
      if (response) {
        // 后台更新缓存
        fetch(event.request).then(function(networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(new Request(normalizedUrl), networkResponse.clone());
            });
          }
        }).catch(function() {
          // 忽略更新失败
        });
        return response;
      }
      
      // 无缓存：走网络并缓存
      return fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(new Request(normalizedUrl), responseClone);
          });
        }
        return response;
      });
    })
  );
});

// 监听消息：清理缓存
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] 收到清理缓存指令');
    caches.delete(CACHE_NAME).then(function() {
      console.log('[SW] 缓存已清理');
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ success: true });
      }
    });
  }
});
