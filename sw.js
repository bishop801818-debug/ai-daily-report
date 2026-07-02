/**
 * Service Worker for AI Daily Report
 * 版本：v1.0 (2026-07-02)
 * 功能：离线缓存静态资源和数据文件，提升二次访问速度
 */

const CACHE_NAME = 'ai-daily-v1';
const CACHE_VERSION = '20260702';

// 需要缓存的文件列表（核心资源）
const STATIC_CACHE_URLS = [
  './',                    // index_v3.html
  './index_v3.html',
  './css/style.css',       // 如果有外部CSS
  './js/core.js',
  './js/charts.js',
  './js/radar.js',
  './js/news.js',
];

// 数据文件的缓存策略：网络优先，缓存兜底
const DATA_CACHE_URLS = [
  './reports/index.json',
  './data/carbonate_spot_price_merged.json',
  './data/lithium_ore_price_history.json',
  './data/lepidolite_price_history.json',
];

// 安装事件：预缓存静态资源
self.addEventListener('install', function(event) {
  console.log('[SW] 安装中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('[SW] 预缓存静态资源');
      return cache.addAll(STATIC_CACHE_URLS);
    }).then(function() {
      console.log('[SW] 安装完成，跳过等待');
      return self.skipWaiting();  // 立即激活
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
      return self.clients.claim();  // 立即接管
    })
  );
});

// 请求拦截：缓存策略
self.addEventListener('fetch', function(event) {
  const requestUrl = event.request.url;
  const requestPath = new URL(requestUrl).pathname;
  
  // 策略1：HTML文件 - 网络优先，缓存兜底
  if (requestPath.endsWith('.html') || requestPath.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          // 网络成功：更新缓存
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(function() {
          // 网络失败：返回缓存
          console.log('[SW] HTML网络失败，使用缓存:', requestPath);
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // 策略2：JSON数据文件 - 缓存优先（长期缓存）
  if (requestPath.includes('/reports/') || requestPath.includes('/data/')) {
    event.respondWith(
      caches.match(event.request).then(function(cachedResponse) {
        // 如果有缓存，先返回缓存
        if (cachedResponse) {
          console.log('[SW] 数据文件缓存命中:', requestPath);
          
          // 后台异步更新缓存（ stale-while-revalidate ）
          fetch(event.request).then(function(response) {
            if (response && response.status === 200) {
              caches.open(CACHE_NAME).then(function(cache) {
                cache.put(event.request, response);
              });
            }
          }).catch(function() {
            // 忽略更新失败
          });
          
          return cachedResponse;
        }
        
        // 无缓存：走网络
        return fetch(event.request).then(function(response) {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // 策略3：其他资源（JS/CSS/图片）- 缓存优先
  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) {
        return response;
      }
      
      return fetch(event.request).then(function(response) {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
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
      event.ports[0].postMessage({ success: true });
    });
  }
});
