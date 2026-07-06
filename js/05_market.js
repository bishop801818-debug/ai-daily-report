        function _setCardValue(card, label, price, changePct, unit) {
            const labelEl = card.querySelector('.monitor-label');
            if (labelEl) labelEl.textContent = label;

            const valueEl = card.querySelector('.monitor-value');
            if (valueEl) {
                const fmt = price > 0 ? Number(price).toLocaleString('zh-CN') : '--';
                valueEl.innerHTML = `${fmt} <span class="unit">${unit}</span>`;
            }

            const changeEl = card.querySelector('.monitor-change');
            if (changeEl) {
                const arrow = changePct > 0 ? '↑' : changePct < 0 ? '↓' : '→';
                const cls = changePct > 0 ? 'up' : changePct < 0 ? 'down' : 'stable';
                changeEl.className = `monitor-change ${cls}`;
                changeEl.textContent = `${arrow} ${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%`;
            }
        }

        /**
         * 刷新市场数据（按钮触发）
         */
        async function refreshMarketData() {
            const refreshBtn = document.querySelector('.refresh-btn');
            const monitorCards = document.querySelectorAll('.monitor-card');

            // 添加旋转动画
            if (refreshBtn) refreshBtn.classList.add('spinning');

            // 为每个卡片添加更新动画
            monitorCards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('updating');
                    setTimeout(() => card.classList.remove('updating'), 800);
                }, index * 80);
            });

            // 读取最新JSON数据（Python抓取脚本由定时任务驱动）
            await updateMarketCards();

            // 移除旋转动画
            setTimeout(() => {
                if (refreshBtn) refreshBtn.classList.remove('spinning');
            }, 600);
        }
        
        /**
         * 显示市场详情
         */