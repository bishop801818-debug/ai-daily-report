                await initDynamicData();
                console.log('[DEBUG] 数据加载完成，dynamicReportData=', dynamicReportData);
                if (!dynamicReportData) {
                    console.error('[ERROR] dynamicReportData 为空');
                }
            } catch(e) {
                console.error('[ERROR] initDynamicData 异常:', e);
            }

            // 确保 loading overlay 消失（embedded 模式下 window.load 不触发）
            const loadingOverlay = document.getElementById('loadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
                setTimeout(() => { loadingOverlay.style.display = 'none'; }, 500);
            }
        })();
        // 页面加载时自动读取碳酸锂期货实时数据
        updateMarketCards();


    
        // ============================================================
        // 碳酸锂期货折线图  v2 - 区间选择 + 高低标注 + 更多日期