
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
