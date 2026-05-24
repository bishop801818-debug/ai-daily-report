        
        /**
         * 初始化锂电板块产业链洞察Dashboard
         * 在页面加载后动态添加产业链位置标签、相关品种对比、产业链全景图
         */
        async function initLithiumDashboard() {
            console.log('[锂电Dashboard] 开始初始化产业链洞察Dashboard...');
            
            try {
                // 1. 加载产业链配置文件
                const chainResp = await fetch('data/industry_chain.json');
                if (!chainResp.ok) {
                    console.warn('[锂电Dashboard] 无法加载产业链配置文件');
                    return;
                }
                const chainConfig = await chainResp.json();
                const lithiumChain = chainConfig['锂电板块'];
                
                if (!lithiumChain) {
                    console.warn('[锂电Dashboard] 未找到锂电板块产业链配置');
                    return;
                }
                
                console.log('[锂电Dashboard] 产业链配置加载成功:', lithiumChain);
                
                // 2. 加载市场数据
                const timestamp = new Date().getTime();
                const [lcResp, lfpResp] = await Promise.allSettled([
                    fetch('reports/market_lc.json?t=' + timestamp),
                    fetch('reports/market_lfp.json?t=' + timestamp)
                ]);
                
                let marketData = {};
                if (lfpResp.status === 'fulfilled' && lfpResp.value.ok) {
                    const lfpData = await lfpResp.value.json();
                    marketData = lfpData.prices || {};
                }
                if (lcResp.status === 'fulfilled' && lcResp.value.ok) {
                    const lcData = await lcResp.value.json();
                    const lcm = lcData.contracts?.find(c => c.code === 'lcm') || lcData.contracts?.[0];
                    if (lcm) {
                        marketData['碳酸锂期货'] = {
                            price: lcm.price,
                            change_pct: lcm.change_pct,
                            update_time: lcData.update_time || ''
                        };
                    }
                }
                
                console.log('[锂电Dashboard] 市场数据加载成功:', marketData);
                
                // 3. 为每个图表卡片添加产业链位置标签和数据时效性标签
                addChainPositionTags(lithiumChain, marketData);
                
                // 4. 添加相关品种对比条形图
                addComparisonBars(lithiumChain, marketData);
                
                // 5. 添加产业链全景图
                addChainFlowDiagram(lithiumChain, marketData);
                
                console.log('[锂电Dashboard] 初始化完成！');
                
            } catch (error) {
                console.error('[锂电Dashboard] 初始化失败:', error);
            }
        }
        
        /**
         * 为每个图表卡片添加产业链位置标签和数据时效性标签
         */
        function addChainPositionTags(chainConfig, marketData) {
            console.log('[锂电Dashboard] 添加产业链位置标签...');
            
            // 定义卡片与产业链节点的映射
            const cardNodeMapping = {
                '碳酸锂期货': '碳酸锂',
                '电池级碳酸锂（现货）': '碳酸锂',
                '工业级碳酸锂（现货）': '碳酸锂',
                '磷酸铁锂': '磷酸铁锂',
                '磷酸铁': '磷酸铁'
            };
            
            // 遍历所有图表卡片
            document.querySelectorAll('.mk-chart-card').forEach(card => {
                const titleEl = card.querySelector('.chart-title-centered');
                if (!titleEl) return;
                
                const cardTitle = titleEl.textContent.trim();
                const nodeName = cardNodeMapping[cardTitle];
                if (!nodeName) return;
                
                console.log('[锂电Dashboard] 处理卡片: ' + cardTitle + ' -> 节点: ' + nodeName);
                
                // 查找当前节点在产业链中的位置
                const nodes = chainConfig.nodes;
                const currentNodeIndex = nodes.findIndex(n => n.id === nodeName || n.name === nodeName);
                if (currentNodeIndex === -1) return;
                
                const currentNode = nodes[currentNodeIndex];
                const upstreamNode = currentNodeIndex > 0 ? nodes[currentNodeIndex - 1] : null;
                const downstreamNode = currentNodeIndex < nodes.length - 1 ? nodes[currentNodeIndex + 1] : null;
                
                // 添加产业链位置标签
                let chainPositionHTML = '<div class="chain-position">';
                if (upstreamNode) {
                    chainPositionHTML += '<span class="chain-tag upstream">上游：' + upstreamNode.name + '</span>';
                    chainPositionHTML += '<span class="chain-arrow">→</span>';
                }
                chainPositionHTML += '<span class="chain-tag current">当前：' + currentNode.name + '</span>';
                if (downstreamNode) {
                    chainPositionHTML += '<span class="chain-arrow">→</span>';
                    chainPositionHTML += '<span class="chain-tag downstream">下游：' + downstreamNode.name + '</span>';
                }
                chainPositionHTML += '</div>';
                
                // 插入到图表标题下方
                titleEl.insertAdjacentHTML('afterend', chainPositionHTML);
                
                // 添加数据时效性标签
                const nodeData = marketData[nodeName] || marketData[cardTitle];
                if (nodeData && nodeData.update_time) {
                    const freshness = getDataFreshness(nodeData.update_time);
                    const labels = {
                        'fresh': '最新 (1小时内)',
                        'warning': '较新 (今天)',
                        'stale': '过期 (7天前)'
                    };
                    const freshnessHTML = '<span class="data-freshness ' + freshness + '"><span class="freshness-dot ' + freshness + '"></span>' + labels[freshness] + '</span>';
                    titleEl.insertAdjacentHTML('beforeend', freshnessHTML);
                }
            });
        }
        
        /**
         * 添加相关品种对比条形图
         */
        function addComparisonBars(chainConfig, marketData) {
            console.log('[锂电Dashboard] 添加相关品种对比条形图...');
            
            // 找到锂电板块的最后一个图表卡片
            const lithiumPanel = document.getElementById('panel-lithium');
            if (!lithiumPanel) return;
            
            const lastCard = lithiumPanel.querySelector('.mk-chart-card:last-child');
            if (!lastCard) return;
            
            // 准备对比数据（取同板块所有品种）
            const compareData = [];
            Object.entries(marketData).forEach(([name, data]) => {
                if (data.change_pct !== undefined) {
                    compareData.push({
                        name: name,
                        change_pct: data.change_pct,
                        price: data.price || 0
                    });
                }
            });
            
            // 按涨跌幅排序
            compareData.sort((a, b) => b.change_pct - a.change_pct);
            
            // 生成HTML
            let barsHTML = '<div class="related-comparison">';
            barsHTML += '<div class="comparison-title">锂电板块涨跌幅排行</div>';
            barsHTML += '<div class="comparison-bars">';
            
            compareData.slice(0, 8).forEach(item => {
                const pct = item.change_pct;
                const absPct = Math.abs(pct);
                const width = Math.min(absPct * 3, 100);
                const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'stable';
                const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
                
                barsHTML += '<div class="bar-item">';
                barsHTML += '<span class="bar-name">' + item.name + '</span>';
                barsHTML += '<div class="bar-track">';
                barsHTML += '<div class="bar-fill ' + direction + '" style="width: ' + width + '%"></div>';
                barsHTML += '</div>';
                barsHTML += '<span class="bar-value ' + direction + '">' + arrow + ' ' + (pct > 0 ? '+' : '') + pct.toFixed(2) + '%</span>';
                barsHTML += '</div>';
            });
            
            barsHTML += '</div></div>';
            
            // 插入到最后一个卡片的底部
            lastCard.insertAdjacentHTML('beforeend', barsHTML);
        }
        
        /**
         * 添加产业链全景图
         */
        function addChainFlowDiagram(chainConfig, marketData) {
            console.log('[锂电Dashboard] 添加产业链全景图...');
            
            const lithiumPanel = document.getElementById('panel-lithium');
            if (!lithiumPanel) return;
            
            const chartGrid = lithiumPanel.querySelector('.mk-chart-grid:last-child');
            if (!chartGrid) return;
            
            // 生成产业链流程图HTML
            let flowHTML = '<div class="industry-chain-panel">';
            flowHTML += '<div class="comparison-title">锂电产业链全景图</div>';
            flowHTML += '<div class="chain-flow">';
            
            const nodes = chainConfig.nodes;
            nodes.forEach((node, index) => {
                const nodeData = marketData[node.id] || marketData[node.name];
                const hasData = nodeData !== undefined;
                
                // 添加节点
                flowHTML += '<div class="chain-node ' + (hasData ? 'has-data' : 'no-data') + '">';
                flowHTML += '<div class="chain-node-name">' + node.name + '</div>';
                
                if (hasData) {
                    flowHTML += '<div class="chain-node-price">' + (nodeData.price ? nodeData.price.toLocaleString() : '--') + '</div>';
                    const pct = nodeData.change_pct || 0;
                    const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : '';
                    flowHTML += '<div class="chain-node-change ' + direction + '">';
                    flowHTML += (pct > 0 ? '↑' : pct < 0 ? '↓' : '→') + ' ' + (pct > 0 ? '+' : '') + pct.toFixed(2) + '%';
                    flowHTML += '</div>';
                } else {
                    flowHTML += '<div style="color:#999;font-size:11px;">数据待补充</div>';
                }
                
                flowHTML += '</div>';
                
                // 添加箭头（最后一个节点不加）
                if (index < nodes.length - 1) {
                    flowHTML += '<div class="chain-connector">';
                    flowHTML += '<span class="chain-connector-arrow">→</span>';
                    flowHTML += '<span class="chain-connector-label">传导</span>';
                    flowHTML += '</div>';
                }
            });
            
            flowHTML += '</div></div>';
            
            // 插入到锂电板块的底部
            chartGrid.insertAdjacentHTML('afterend', flowHTML);
        }
        
        /**
         * 计算数据时效性
         */
        function getDataFreshness(updateTimeStr) {
            if (!updateTimeStr) return 'stale';
            
            const updateTime = new Date(updateTimeStr);
            const now = new Date();
            const hoursDiff = (now - updateTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 1) return 'fresh';
            if (hoursDiff < 24) return 'warning';
            return 'stale';
        }
