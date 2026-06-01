// 在浏览器控制台执行此代码，清除Unsplash旧缓存
localStorage.removeItem('unsplash_image_cache');
localStorage.removeItem('unsplash_request_count');
localStorage.removeItem('unsplash_last_reset');
console.log('Unsplash缓存已清除，请刷新页面');
