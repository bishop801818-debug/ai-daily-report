
    (function() {
        const originalFetch = window.fetch;
        
        window.fetch = function(input, init) {
            // 如果是JSON数据请求（reports目录或data目录），强制禁用缓存
            if (typeof input === 'string' && (input.includes('.json') || input.includes('reports/') || input.includes('data/'))) {
                init = init || {};
                init.cache = 'no-store';
                
                // 同时添加时间戳防止浏览器缓存URL
                if (input.includes('?')) {
                    input = input + '&_nocache=' + Date.now();
                } else {
                    input = input + '?_nocache=' + Date.now();
                }
            }
            
            return originalFetch.call(this, input, init);
        };
        
        console.log('[缓存修复] 全局fetch拦截器已启用 - JSON数据将实时加载');
    })();
    