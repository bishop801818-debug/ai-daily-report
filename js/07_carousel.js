        function startAutoPlay() {
            if (autoPlayTimer) clearInterval(autoPlayTimer);
            if (progressTimer) clearInterval(progressTimer);
            
            autoPlayTimer = setInterval(() => {
                if (!isPaused) {
                    nextDept();
                }
            }, autoPlayDuration);
            
            let progress = 0;
            const progressBar = document.getElementById('progressBar');
            progressTimer = setInterval(() => {
                if (!isPaused) {
                    progress += 100 / (autoPlayDuration / 100);
                    progressBar.style.width = progress + '%';
                    if (progress >= 100) {
                        progress = 0;
                    }
                }
            }, 100);
        }
        
        // 下一个事业部
        function nextDept() {
            currentDeptIndex = (currentDeptIndex + 1) % deptList.length;
            openReport(deptList[currentDeptIndex], true);
        }
        
        // 上一个事业部
        function previousDept() {
            currentDeptIndex = (currentDeptIndex - 1 + deptList.length) % deptList.length;
            openReport(deptList[currentDeptIndex], true);
        }
        
        // 切换暂停/继续
        function togglePause() {
            isPaused = !isPaused;
            const btn = document.getElementById('pauseBtn');
            if (isPaused) {
                btn.textContent = '继续';
                btn.classList.add('active');
                document.getElementById('progressBar').style.opacity = '0.5';
            } else {
                btn.textContent = '暂停';
                btn.classList.remove('active');
                document.getElementById('progressBar').style.opacity = '1';
            }
        }
        
        // 停止自动播放
        function stopAutoPlay() {
            if (autoPlayTimer) clearInterval(autoPlayTimer);
            if (progressTimer) clearInterval(progressTimer);
            autoPlayTimer = null;
            progressTimer = null;
            document.getElementById('progressBar').style.width = '0%';
            document.getElementById('autoPlayControls').style.display = 'none';
        }
        

        // ============================================================
        // 全员晨会全览弹窗
        // ============================================================

        // 打开全览弹窗