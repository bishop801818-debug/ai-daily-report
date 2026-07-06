        function updateClock() {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false });
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