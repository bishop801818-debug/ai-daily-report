
        // 初始化锂电板块产业链洞察Dashboard
        document.addEventListener("DOMContentLoaded", function() {
            console.log("[页面加载] 开始初始化锂电Dashboard...");
            if (typeof initLithiumDashboard === "function") {
                initLithiumDashboard();
            } else {
                console.warn("[页面加载] initLithiumDashboard函数未找到");
            }
            
            // 初始化锂辉石和锂云母图表
            setTimeout(function() {
                if (typeof initLithiumOreChart === 'function') {
                    console.log("[页面加载] 初始化锂辉石图表...");
                    initLithiumOreChart();
                } else {
                    console.warn("[页面加载] initLithiumOreChart函数未找到");
                }
                if (typeof initLepidoliteChart === 'function') {
                    console.log("[页面加载] 初始化锂云母图表...");
                    initLepidoliteChart();
                } else {
                    console.warn("[页面加载] initLepidoliteChart函数未找到");
                }
            }, 100);
        });
    