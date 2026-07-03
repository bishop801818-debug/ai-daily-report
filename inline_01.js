
    // ========== 热点资讯横向轮播 ==========
    (function() {
        // Unsplash API 配置
        const UNSPLASH_ACCESS_KEY = 'HTe905tIiFT-g7D2MH77LYB9-0SE65IWCpwHIrq0aM0';
        const UNSPLASH_CACHE_KEY = 'unsplash_image_cache';
        const UNSPLASH_RATE_LIMIT = 50;
        
        function getUnsplashCache() {
            try {
                const cache = localStorage.getItem(UNSPLASH_CACHE_KEY);
                return cache ? JSON.parse(cache) : {};
            } catch (e) {
                return {};
            }
        }
        
        function saveUnsplashCache(cache) {
            try {
                localStorage.setItem(UNSPLASH_CACHE_KEY, JSON.stringify(cache));
            } catch (e) {
                console.warn('无法保存Unsplash缓存:', e);
            }
        }
        
        function getFallbackImageUrl(query) {
            // Lorem Picsum 备用图：无需 API Key，根据 query 生成固定图片（seed 保证同 query 同图）
            var seed = encodeURIComponent(query || 'news');
            return 'https://picsum.photos/seed/' + seed + '/800/400';
        }

        function generateSvgPlaceholder(title) {
            // SVG 本地占位符：中国网络环境下 Lorem Picsum 也失败时的最终 fallback
            var colors = ['#1a3a5c', '#2d5a27', '#5c1a1a', '#1a1a5c', '#5c4a1a', '#3a1a5c'];
            var hash = 0;
            var str = title || 'news';
            for (var i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash = hash & hash; }
            var color = colors[Math.abs(hash) % colors.length];
            var shortTitle = (title || '资讯').substring(0, 20);
            var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect fill="' + color + '" width="800" height="400"/><text x="400" y="200" font-family="Microsoft YaHei,Arial" font-size="28" fill="rgba(255,255,255,0.8)" text-anchor="middle">' + shortTitle.replace(/&/g,'&amp;').replace(/</g,'&lt;') + '</text></svg>';
            return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
        }

        async function fetchUnsplashImage(query, excludeUrls) {
            // excludeUrls: 已使用的图片URL列表，避免重复
            excludeUrls = excludeUrls || [];
            const cache = getUnsplashCache();
            // 缓存key包含excludeUrls信息，避免返回已用图片
            const cacheKey = query + '|' + excludeUrls.join(',');
            if (cache[cacheKey]) {
                console.log('[Unsplash] 缓存命中: ' + query);
                return cache[cacheKey];
            }
            const requestCount = parseInt(localStorage.getItem('unsplash_request_count') || '0');
            const lastReset = parseInt(localStorage.getItem('unsplash_last_reset') || '0');
            const now = Date.now();
            if (now - lastReset > 3600000) {
                localStorage.setItem('unsplash_request_count', '0');
                localStorage.setItem('unsplash_last_reset', now.toString());
            } else if (requestCount >= UNSPLASH_RATE_LIMIT) {
                console.warn('[Unsplash] API达到速率限制，切换Lorem Picsum备用图');
                return getFallbackImageUrl(query);
            }
            try {
                // 优化：增加per_page到20，随机页面范围扩大到15页，增加多样性
                const randomSeed = Math.floor(Math.random() * 1000);
                const randomPage = randomSeed % 15 + 1;  // 扩大随机页面范围1-15
                const url = 'https://api.unsplash.com/search/photos?query=' + encodeURIComponent(query) + '&client_id=' + UNSPLASH_ACCESS_KEY + '&per_page=20&orientation=landscape&order_by=popularity&page=' + randomPage;
                const response = await fetch(url);
                if (!response.ok) throw new Error('HTTP ' + response.status);
                const data = await response.json();
                localStorage.setItem('unsplash_request_count', (requestCount + 1).toString());
                
                // 获取历史展示过的图片（全局去重）
                var historyUrls = [];
                try {
                    historyUrls = JSON.parse(localStorage.getItem('unsplash_history_urls') || '[]');
                } catch(e) { historyUrls = []; }
                const allUsedUrls = excludeUrls.concat(historyUrls);
                
                if (data.results && data.results.length > 0) {
                    // 优化：随机抽取 + 全局去重
                    var availableUrls = [];
                    for (var i = 0; i < data.results.length; i++) {
                        var candidateUrl = data.results[i].urls.regular;
                        if (allUsedUrls.indexOf(candidateUrl) === -1) {
                            availableUrls.push(candidateUrl);
                        }
                    }
                    
                    // 随机选择一张可用图片
                    var chosenUrl = null;
                    if (availableUrls.length > 0) {
                        var randomIndex = Math.floor(Math.random() * availableUrls.length);
                        chosenUrl = availableUrls[randomIndex];
                    } else {
                        // 如果所有图都重复，从当前结果中随机选（不考虑历史）
                        var randomIndex = Math.floor(Math.random() * data.results.length);
                        chosenUrl = data.results[randomIndex].urls.regular;
                    }
                    
                    // 保存到历史记录（最多存50张）
                    historyUrls.unshift(chosenUrl);
                    if (historyUrls.length > 50) historyUrls = historyUrls.slice(0, 50);
                    localStorage.setItem('unsplash_history_urls', JSON.stringify(historyUrls));
                    
                    cache[cacheKey] = chosenUrl;
                    saveUnsplashCache(cache);
                    console.log('[Unsplash] API成功: ' + query + ' -> ' + chosenUrl + ' (随机抽取)');
                    return chosenUrl;
                } else {
                    console.warn('[Unsplash] 未找到图片，切换Lorem Picsum备用图: ' + query);
                    return getFallbackImageUrl(query);
                }
            } catch (e) {
                console.error('[Unsplash] API错误，切换Lorem Picsum备用图:', e);
                return getFallbackImageUrl(query);
            }
        }
        
        function extractKeywords(title) {
            // 中文关键词→英文搜索词映射（Unsplash对英文搜索更友好）- 增加多变体
            const topicMap = [
                { cn: ['原油', '石油', '油价', 'WTI', '布伦特', '油气', '炼油'], en: ['oil refinery', 'oil gas', 'petroleum', 'fuel'] },
                { cn: ['尿素', '化肥', '氮肥', '农业'], en: ['fertilizer agriculture', 'farm', 'crops field', 'agritech'] },
                { cn: ['煤矿', '煤炭', '矿工', '矿井'], en: ['coal mine', 'mining', 'quarry', 'underground mine'] },
                { cn: ['锂', '锂电', '锂电池', '磷酸铁锂', 'LFP', '碳酸锂'], en: ['lithium battery', 'ev battery', 'energy storage', 'battery factory'] },
                { cn: ['新能源', '电动', '电动车', 'EV', '特斯拉'], en: ['electric vehicle', 'tesla car', 'ev charging', 'electric bus'] },
                { cn: ['化工', '化学', '化学品', '材料'], en: ['chemical plant', 'factory industrial', 'manufacturing', 'warehouse'] },
                { cn: ['汽车', '车企', '整车', '丰田', '大众', '宝马'], en: ['car factory', 'automotive', 'assembly line', 'car dealership'] },
                { cn: ['经济', '市场', '金融', '股市', '股价', '财报'], en: ['business news', 'stock market', 'office meeting', 'corporate'] },
                { cn: ['政策', '法规', '监管', '发改委', '工信部'], en: ['government policy', 'building congress', 'city hall', 'regulation'] },
                { cn: ['技术', '创新', '研发', '专利'], en: ['technology innovation', 'lab research', 'robotics', 'chip technology'] },
                { cn: ['环境', '环保', '碳排放', '绿色'], en: ['environment green', 'solar panels', 'wind turbine', 'nature landscape'] },
                { cn: ['储能', '太阳能', '光伏', '风电'], en: ['energy storage', 'solar farm', 'wind power', 'renewable energy'] },
                { cn: ['电解液', '六氟', '溶剂'], en: ['chemical laboratory', 'science', 'liquid chemical', 'experiment'] },
                { cn: ['事故', '爆炸', '安全'], en: ['industrial accident', 'safety vest', 'construction', 'warning'] },
                { cn: ['出口', '进口', '贸易'], en: ['international trade', 'shipping', 'container port', 'cargo'] },
                { cn: ['公司', '企业', '集团'], en: ['company office', 'business tower', 'corporate building', 'startup'] },
            ];
            const lowerTitle = title.toLowerCase();
            for (var i = 0; i < topicMap.length; i++) {
                var topic = topicMap[i];
                for (var j = 0; j < topic.cn.length; j++) {
                    if (lowerTitle.indexOf(topic.cn[j].toLowerCase()) !== -1) {
                        // 从多个变体中随机选择一个
                        var options = topic.en;
                        var randomTopic = options[Math.floor(Math.random() * options.length)];
                        return randomTopic;
                    }
                }
            }
            // 未匹配到任何主题，使用通用词（也从变体中随机选）
            var defaultTopics = ['business news', 'corporate', 'modern technology', 'industry'];
            return defaultTopics[Math.floor(Math.random() * defaultTopics.length)];
        }
        
        var currentNewsSlide = 0;
        var totalNewsSlides = 6;
        var newsCarousel = document.getElementById('newsCarousel');
        var newsDotsContainer = document.getElementById('newsDots');
        var newsAutoPlay = null;

        function initNewsCarousel() {
            if (!newsDotsContainer) return;
            newsDotsContainer.innerHTML = '';
            for (var i = 0; i < totalNewsSlides; i++) {
                var dot = document.createElement('div');
                dot.className = 'news-dot' + (i === 0 ? ' active' : '');
                dot.onclick = (function(idx) {
                    return function() { goToNewsSlide(idx); };
                })(i);
                newsDotsContainer.appendChild(dot);
            }
        }

        function updateNewsCarousel() {
            if (!newsCarousel) return;
            newsCarousel.style.transform = 'translateX(-' + (currentNewsSlide * 100) + '%)';
            if (newsDotsContainer) {
                var dots = newsDotsContainer.querySelectorAll('.news-dot');
                for (var i = 0; i < dots.length; i++) {
                    dots[i].classList.toggle('active', i === currentNewsSlide);
                }
            }
        }

        window.moveNewsCarousel = function(dir) {
            currentNewsSlide = (currentNewsSlide + dir + totalNewsSlides) % totalNewsSlides;
            updateNewsCarousel();
        };

        function goToNewsSlide(index) {
            currentNewsSlide = index;
            updateNewsCarousel();
        }

        // 自动轮播（5秒）
        function startNewsAutoPlay() {
            newsAutoPlay = setInterval(function() {
                moveNewsCarousel(1);
            }, 5000);
        }

        // 鼠标悬停暂停自动轮播
        var heroLeft = document.querySelector('.hero-left');
        if (heroLeft) {
            heroLeft.addEventListener('mouseenter', function() {
                if (newsAutoPlay) clearInterval(newsAutoPlay);
            });
            heroLeft.addEventListener('mouseleave', function() {
                startNewsAutoPlay();
            });
        }

        // 初始化：加载真实热点资讯
        loadHotNews();
        
        function loadHotNews() {
            // 从hot_news_data.json加载热点新闻数据
            fetch('hot_news_data.json?t=' + Date.now()).then(function(r) {
                return r.json();
            }).then(async function(data) {
                if (!data || !data.news || !data.news.length) {
                    throw new Error('热点新闻数据格式错误');
                }
                var items = data.news.slice(0, 5);
                if (items.length === 0) items = [{ bu: "系统", title: "暂无今日关注数据，请先生成早报" }];
                
                newsCarousel.innerHTML = '';
                items.forEach(function(item, i) {
                    var tag = item.url ? 'a' : 'div';
                    var slide = document.createElement(tag);
                    if (item.url) {
                        slide.href = item.url;
                        slide.target = '_blank';
                        slide.rel = 'noopener noreferrer';
                    }
                    slide.className = 'news-slide';
                    slide.innerHTML = '<div class="news-slide-bg"></div><div class="news-overlay"><div class="news-overlay-title">' + item.title + '</div></div>';
                    newsCarousel.appendChild(slide);
                });
                
                // 加载热点资讯图片（优先使用JSON中预绑定的image_url，否则fallback到API调用）
                var usedImageUrls = [];  // 已使用的图片URL，避免重复
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var slide = newsCarousel.children[i];
                    
                    // 优先使用JSON预绑定的图片URL
                    if (item.image_url) {
                        console.log('[热点资讯] 使用预绑定图片: ' + item.title.substring(0, 20) + '...');
                        if (slide) {
                            var bg = slide.querySelector('.news-slide-bg');
                            if (bg) {
                                bg.style.backgroundImage = 'url(' + item.image_url + ')';
                                bg.style.backgroundSize = 'cover';
                                bg.style.backgroundPosition = 'center';
                                // 检查图片是否可加载
                                (function(bgEl, url, title) {
                                    var img = new Image();
                                    img.onerror = function() {
                                        console.warn('[热点资讯] 预绑定图片加载失败，切换API调用: ' + url);
                                        // 异步调用Unsplash API作为fallback
                                        fetchUnsplashImage(extractKeywords(title), usedImageUrls).then(function(apiUrl) {
                                            if (apiUrl) {
                                                usedImageUrls.push(apiUrl);
                                                bgEl.style.backgroundImage = 'url(' + apiUrl + ')';
                                            }
                                        });
                                    };
                                    img.src = url;
                                })(bg, item.image_url, item.title);
                            }
                        }
                        continue;  // 跳过API调用
                    }
                    
                    // Fallback：JSON中没有image_url时，调用Unsplash API获取
                    try {
                        const searchQuery = extractKeywords(item.title);
                        const imageUrl = await fetchUnsplashImage(searchQuery, usedImageUrls);
                        console.log('[热点资讯] API调用获取图片: ' + item.title.substring(0, 20) + '...');
                        if (imageUrl) {
                            usedImageUrls.push(imageUrl);  // 记录已用URL，后续排除
                            if (slide) {
                                const bg = slide.querySelector('.news-slide-bg');
                                if (bg) {
                                    bg.style.backgroundImage = 'url(' + imageUrl + ')';
                                    bg.style.backgroundSize = 'cover';
                                    bg.style.backgroundPosition = 'center';
                                    // 加载失败检测：Lorem Picsum 也失败时换成 SVG 本地占位符
                                    (function(bgEl, url, title) {
                                        var img = new Image();
                                        img.onerror = function() {
                                            console.warn('[热点资讯] 图片加载失败，切换SVG占位符: ' + url);
                                            bgEl.style.backgroundImage = 'url(' + generateSvgPlaceholder(title || '资讯') + ')';
                                        };
                                        img.src = url;
                                    })(bg, imageUrl, item.title || searchQuery);
                                }
                            }
                        }
                    } catch (e) {
                        console.warn('[热点资讯] Unsplash图片加载失败:', e);
                    }
                }
                
                totalNewsSlides = items.length;
                currentNewsSlide = 0;
                initNewsCarousel();
                if (newsAutoPlay) clearInterval(newsAutoPlay);
                startNewsAutoPlay();
            }).catch(function(e) {
                console.warn('[热点资讯] 加载失败，使用虚拟数据', e);
                // 降级：使用默认数据
                var defaultItems = [
                    { bu: "系统", title: "热点新闻加载失败，请检查hot_news_data.json" }
                ];
                newsCarousel.innerHTML = '';
                defaultItems.forEach(function(item, i) {
                    var slide = document.createElement('div');
                    slide.className = 'news-slide';
                    slide.innerHTML = '<div class="news-slide-bg"></div><div class="news-overlay"><div class="news-overlay-title">' + item.title + '</div></div>';
                    newsCarousel.appendChild(slide);
                });
                totalNewsSlides = defaultItems.length;
                currentNewsSlide = 0;
                initNewsCarousel();
                if (newsAutoPlay) clearInterval(newsAutoPlay);
                startNewsAutoPlay();
            });
        }
    })();



    // ========== 数据库看板 - 轮播 ==========
    (function() {
        var HERO_COLORS = {
            primary: '#0AA66A',
            secondary: '#21B981',
            accent: '#0AA66A',
            up: '#0AA66A',
            down: '#21B981',
            text: '#153329',
            grid: 'rgba(10,166,106,0.12)'
        };

        // 所有可用的数据库看板配置（已根据实际数据文件校准）
                                                                                                                                                                                                                                                                                                        var DASHBOARDS = [
        {
            id: 'ternary_ncm_split',
            tag: '三元材料·型号分布',
            title: '三元正极材料分型号产量占比',
            link: 'ternary_charts.html?v=20260630',
            dataFile: 'ternary_all_data.json',
            tableName: 'NCM-分型号产量',
            unit: '吨',
            scale: 1,
            insight: 'TOP1「NCM811」占45%（1.8万吨），NCM52328%。国家发改委、能源局6月25日联合印发，明确到2030年新型储能装机达到300GW，配套支持储能/锂电/光伏/钠电/钙钛矿/固态电池等关键技术与产业化落地。',
            division: 'czly',
            chartType: 'pie',
            isBar: false,
            pieMode: 'row_columns',
            pieExcludeColumns: ["月份"],
            pieDateKey: '',
            pieNameKey: '',
            pieValueKey: ''},
        {
            id: 'lsp_price',
            tag: '锂辉石·精矿价格',
            title: '锂辉石精矿价格走势',
            link: 'carbonate_charts.html?v=20260630',
            dataFile: 'carbonate_all_data.json',
            tableName: '锂辉石精矿-价格',
            unit: '美元/吨',
            scale: 1,
            insight: '最新2010.00美元/吨，环比下跌19.6%。',
            division: 'czly',
            valueKey: '均价（美元/吨）',
            timeKey: '日期',
            isBar: false},
        {
            id: 'electrolyte_price_lfp',
            tag: '电解液·LFP动力价格',
            title: '电解液（LFP动力型）价格走势',
            link: 'electrolyte_charts.html?v=20260630',
            dataFile: 'electrolyte_all_data.json',
            tableName: '电解液价格-磷酸铁锂动力型',
            unit: '万元/吨',
            scale: 1,
            insight: '电解液（LFP动力型）价格：2.95万元/吨，涨跌：周内持平。电解液行业累计锁单超400万吨，永太科技再获宁德VC三年9万吨长单叠加天赐/新宙邦一体化扩能，头部企业份额持续抬升；VC因个别企业出货受阻价格周内+14.3%创新高、FEC同步走强，添加剂细分赛道盈利弹性打开。',
            division: 'felt',
            valueKey: '均价',
            timeKey: '日期',
            isBar: false},
        {
            id: 'ternary_prod',
            tag: '三元正极·行业产量',
            title: '三元正极材料产量走势',
            link: 'ternary_charts.html?v=20260630',
            dataFile: 'ternary_all_data.json',
            tableName: 'NCM-行业整体产量',
            unit: '吨',
            scale: 1,
            insight: '新型能源体系"十五五"规划明确2030年新型储能装机300GW，叠加LFP装车占比突破81.5%与1-6月LFP产量+77%的高速增长，行业进入产能扩张+高端紧缺双轮驱动期，钠电储能/四代高压实/磷酸锰铁锂差异化产能成新增长极。',
            division: 'czly',
            valueKey: '产量（吨）',
            timeKey: '月份',
            isBar: true}
        ];
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        

        var chartInstances = [null, null, null, null];
        var currentChartIdx = 0;
        var chartAutoPlay = null;

        function getDailySeed() {
            var today = new Date();
            var dateStr = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
            var hash = 0;
            for (var i = 0; i < dateStr.length; i++) {
                hash = ((hash << 5) - hash) + dateStr.charCodeAt(i);
                hash |= 0;
            }
            return Math.abs(hash);
        }

        function selectDailyDashboard() {
            var seed = getDailySeed();
            var idx = seed % DASHBOARDS.length;
            return DASHBOARDS[idx];
        }

        // 格式化横轴时间标签：去除日期中的 "日" 和 "时:分:秒" 部分
        function formatXAxisLabel(raw) {
            var s = String(raw);
            // 处理 "2026-04-01 00:00:00" → "2026-04"
            if (s.length >= 10 && s[4] === '-' && s[7] === '-') {
                return s.slice(0, 7);  // 取 YYYY-MM
            }
            // 处理 "05-01 00:00:00" → "05-01" 或保留原样
            if (s.indexOf(' ') !== -1) {
                return s.split(' ')[0];  // 去掉时间部分
            }
            return s;
        }

        function mkLineOpt(data, color, showAxis, unit) {
            var xData = data.map(function(d) { return formatXAxisLabel(d[0]); });
            var yData = data.map(function(d) { return d[1]; });
            var totalPoints = xData.length;
            var interval = totalPoints <= 6 ? 0 : Math.max(1, Math.floor(totalPoints / 4));
            return {
                backgroundColor: 'transparent',
                grid: { top: 16, right: 16, bottom: showAxis ? 32 : 12, left: 48, containLabel: false },
                xAxis: {
                    type: 'category',
                    show: showAxis,
                    data: xData,
                    axisLine: { lineStyle: { color: 'rgba(61,41,20,0.15)', width: 1 } },
                    axisTick: { show: false },
                    axisLabel: { show: showAxis, color: '#8C7B6B', fontSize: 10, interval: 0, rotate: totalPoints > 8 ? 30 : 0 },
                    splitLine: { show: false }
                },
                yAxis: {
                    type: 'value',
                    show: true,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: '#8C7B6B', fontSize: 10, formatter: function(v) { return v >= 10000 ? (v/10000).toFixed(1)+'万' : v.toFixed(1); } },
                    splitLine: { lineStyle: { color: 'rgba(61,41,20,0.08)', type: 'dashed' } },
                    min: function(v) { return v.min * 0.95; }
                },
                series: [{
                    type: 'line',
                    data: yData,
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 5,
                    lineStyle: { color: color, width: 2.5 },
                    itemStyle: { color: color, borderWidth: 2, borderColor: '#fff' },
                    areaStyle: {
                        color: {
                            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: color + '25' },
                                { offset: 1, color: color + '02' }
                            ]
                        }
                    }
                }],
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(248,255,251,0.96)',
                    borderColor: 'rgba(7,82,54,0.2)',
                    borderWidth: 1,
                    textStyle: { color: '#3D2914', fontSize: 12 },
                    formatter: function(params) {
                        var p = params[0];
                        return '<div style="font-weight:600">' + p.name + '</div>' +
                               '<div style="color:' + color + '">● ' + p.value.toFixed(2) + '</div>';
                    }
                },
                animation: true,
                animationDuration: 800
            };
        }

        // 通用数据洞察生成函数
        function generateInsight(db, data) {
            // ===== 优先使用后端生成的洞察（含早报内容）=====
            // 后端在 rotate_homepage_charts.py 中已生成含早报内容的 insight
            // 若 db.insight 有效（不含"不足"/"暂不可用"），直接返回
            // 修复：先确保 insight 是字符串类型
            var insightStr = db.insight ? String(db.insight) : '';
            if (insightStr.trim() &&
                insightStr.indexOf('不足') < 0 &&
                insightStr.indexOf('暂不可用') < 0 &&
                insightStr.indexOf('数据加载中') < 0) {
                return insightStr;
            }

            if (!data || !data.length) return '数据不足，无法生成分析。';
            
            // ===== 饼图专用洞察（分类/份额数据）=====
            if (db.chartType === 'pie' && data.length > 0) {
                var sorted = data.slice().sort(function(a, b) { return (b.value || 0) - (a.value || 0); });
                var total = sorted.reduce(function(s, item) { return s + (item.value || 0); }, 0);
                var t1 = sorted[0];
                var p1 = total > 0 ? ((t1.value / total * 100)).toFixed(0) : '?';
                var fmtVal = function(v) {
                    return v >= 10000 ? (v / 10000).toFixed(1) + '万' : v.toFixed(1);
                };
                var text = 'TOP1「' + t1.name + '」占' + p1 + '%（' + fmtVal(t1.value) + ')';
                if (sorted.length >= 2 && db.unit) {
                    var t2 = sorted[1];
                    var p2 = total > 0 ? ((t2.value / total * 100)).toFixed(0) : '?';
                    text += db.unit + '，' + t2.name + p2 + '%';
                }
                text += '。';
                // 如果后端已生成洞察，优先使用
                // 修复：先转换为字符串
                var insightStr2 = db.insight ? String(db.insight) : '';
                if (insightStr2 && insightStr2.indexOf('不足') < 0) {
                    return insightStr2;
                }
                return text;
            }
            
            if (data.length < 2) return '数据不足，无法生成分析。';
            
            // 1. 计算基础数据
            var latest = data[data.length - 1][1];
            var prev = data.length > 1 ? data[data.length - 2][1] : latest;
            var change = prev !== 0 ? ((latest - prev) / prev * 100) : 0;
            var trend = change >= 0 ? '上涨' : '下跌';
            var absChange = Math.abs(change).toFixed(1);
            
            // 2. 计算近期趋势（近3期 vs 前3期）
            var recent3 = data.length >= 3 ? 
                (data[data.length - 1][1] + data[data.length - 2][1] + data[data.length - 3][1]) / 3 : latest;
            var prev3 = data.length >= 6 ? 
                (data[data.length - 4][1] + data[data.length - 5][1] + data[data.length - 6][1]) / 3 : recent3;
            var trend3 = recent3 >= prev3 ? 'up' : 'down';
            
            // 3. 计算同比（去年同期）
            var samePeriodLastYear = data.length > 12 ? data[data.length - 13][1] : null;
            var yoyChange = samePeriodLastYear && samePeriodLastYear !== 0 ? 
                ((latest - samePeriodLastYear) / samePeriodLastYear * 100) : null;
            
            // 4. 调用看板专属模板生成文字
            if (db.insightTemplate && typeof db.insightTemplate === 'function') {
                return db.insightTemplate({
                    latest: latest,
                    prev: prev,
                    change: change,
                    trend: trend,
                    absChange: absChange,
                    trend3: trend3,
                    recent3: recent3,
                    prev3: prev3,
                    samePeriodLastYear: samePeriodLastYear,
                    yoyChange: yoyChange,
                    data: data
                });
            }
            
            // 5. 如果没有模板，返回默认文案（空值保护）
            if (latest === undefined || latest === null) {
                return db.title + '数据暂不可用';
            }
            return db.title + '最新值' + latest.toFixed(2) + db.unit + '，环比' + trend + absChange + '%。';
        }

        function mkBarOpt(data, color, showAxis, unit) {
            var xData = data.map(function(d) { return formatXAxisLabel(d[0]); });
            var yData = data.map(function(d) { return d[1]; });
            var totalPoints = xData.length;
            var interval = totalPoints <= 6 ? 0 : Math.max(1, Math.floor(totalPoints / 4));
            return {
                backgroundColor: 'transparent',
                grid: { top: 16, right: 16, bottom: showAxis ? 32 : 12, left: 48, containLabel: false },
                xAxis: {
                    type: 'category',
                    show: showAxis,
                    data: xData,
                    axisLine: { lineStyle: { color: 'rgba(61,41,20,0.15)', width: 1 } },
                    axisTick: { show: false },
                    axisLabel: { show: showAxis, color: '#8C7B6B', fontSize: 10, interval: 0, rotate: totalPoints > 8 ? 30 : 0 },
                    splitLine: { show: false }
                },
                yAxis: {
                    type: 'value',
                    show: true,
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { color: '#8C7B6B', fontSize: 10, formatter: function(v) { return v >= 10000 ? (v/10000).toFixed(1)+'万' : v.toFixed(1); } },
                    splitLine: { lineStyle: { color: 'rgba(61,41,20,0.08)', type: 'dashed' } },
                    min: 0
                },
                series: [{
                    type: 'bar',
                    data: yData,
                    barMaxWidth: 22,
                    barGap: '20%',
                    itemStyle: {
                        color: color,
                        borderRadius: [3, 3, 0, 0],
                        opacity: 0.85
                    },
                    emphasis: {
                        itemStyle: { opacity: 1 }
                    }
                }],
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: 'rgba(248,255,251,0.96)',
                    borderColor: 'rgba(7,82,54,0.2)',
                    borderWidth: 1,
                    textStyle: { color: '#3D2914', fontSize: 12 },
                    formatter: function(params) {
                        var p = params[0];
                        return '<div style="font-weight:600">' + p.name + '</div>' +
                               '<div style="color:' + color + '">● ' + p.value.toFixed(2) + '</div>';
                    }
                },
                animation: true,
                animationDuration: 800
            };
        }

        // 饼图配置：环形饼图，用于分类/份额数据
        // data 格式: [{name: '类别', value: 数值}, ...]
        function mkPieOpt(data, color) {
            var total = data.reduce(function(s, d) { return s + (d.value || 0); }, 0);
            // 饼图配色：使用与 accent 同色系的渐变色组
            var pieColors = [
                color,           // 主色
                color + 'CC',    // 稍浅
                color + '99',
                color + '77',
                color + '55',
                '#5B9BD5',      // 蓝色补充
                '#ED7D31',      // 橙色补充
                '#70AD47',      // 绿色补充
                '#FFC000',      // 黄色
                '#A5A5A5'       // 灰色
            ];
            return {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'item',
                    backgroundColor: 'rgba(248,255,251,0.96)',
                    borderColor: 'rgba(7,82,54,0.2)',
                    borderWidth: 1,
                    textStyle: { color: '#3D2914', fontSize: 12 },
                    formatter: function(params) {
                        var pct = total > 0 ? ((params.value / total) * 100).toFixed(1) : 0;
                        return '<div style="font-weight:600">' + params.name + '</div>' +
                               '<div style="color:' + params.color + '">● ' + params.value.toLocaleString() + ' (' + pct + '%)</div>';
                    }
                },
                legend: {
                    type: 'scroll',
                    orient: 'vertical',
                    right: 10,
                    top: 'center',
                    itemWidth: 10,
                    itemHeight: 10,
                    itemGap: 8,
                    textStyle: { color: '#8C7B6B', fontSize: 11 },
                    formatter: function(name) {
                        // 找到对应值，显示名称+百分比
                        var item = data.find(function(d) { return d.name === name; });
                        if (item && total > 0) {
                            var pct = ((item.value / total) * 100).toFixed(1);
                            return name + '  ' + pct + '%';
                        }
                        return name;
                    }
                },
                series: [{
                    type: 'pie',
                    radius: ['40%', '68%'],
                    center: ['38%', '50%'],
                    avoidLabelOverlap: true,
                    itemStyle: {
                        borderRadius: 4,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: { show: false },
                    emphasis: {
                        label: { show: true, fontSize: 13, fontWeight: 'bold' }
                    },
                    data: data.map(function(d, i) {
                        return {
                            name: d.name,
                            value: d.value,
                            itemStyle: { color: pieColors[i % pieColors.length] }
                        };
                    })
                }],
                animation: true,
                animationDuration: 800
            };
        }

        function fmtNum(v, unit) {
            if (v === null || v === undefined || isNaN(v)) return '--';
            return v.toFixed(2) + (unit || '');
        }

        function calcChange(data) {
            if (!data || data.length < 2) return null;
            var last = data[data.length - 1][1];
            var prev = data[data.length - 2][1];
            if (!last || !prev || last === 0 || prev === 0) return null;
            return ((last - prev) / prev * 100);
        }

        function renderChartSlide(data) {
            var el = document.getElementById('chartItem0');
            if (!el) return;
            if (!chartInstances[0]) {
                chartInstances[0] = echarts.init(el);
                window.addEventListener('resize', function() {
                    if (chartInstances[0]) chartInstances[0].resize();
                });
            }
            var db = DASHBOARDS[currentChartIdx];
            var opt;
            if (db.chartType === 'pie') {
                opt = mkPieOpt(data, HERO_COLORS.accent);
            } else if (db.isBar) {
                opt = mkBarOpt(data, HERO_COLORS.accent, true, db.unit);
            } else {
                opt = mkLineOpt(data, HERO_COLORS.accent, true, db.unit);
            }
            chartInstances[0].setOption(opt, true);
            setTimeout(function() { chartInstances[0].resize(); }, 50);
        }

        function updateChartInfo(data, errorMsg) {
            var db = DASHBOARDS[currentChartIdx];
            if (!db) return;

            var titleEl = document.getElementById('chartTitle0');
            var linkEl = document.getElementById('chartLink0');
            var summaryEl = document.getElementById('chartSummaryText');
            var dateEl = document.getElementById('chartDate');

            if (titleEl) titleEl.textContent = db.title;
            if (linkEl) linkEl.href = db.link;

            if (errorMsg) {
                if (summaryEl) summaryEl.textContent = errorMsg;
                if (dateEl) dateEl.textContent = '数据暂不可用';
                return;
            }

            if (summaryEl && data && data.length > 0) {
                summaryEl.textContent = generateInsight(db, data);
            } else if (summaryEl) {
                summaryEl.textContent = '暂无数据，请检查数据源配置。';
            }

            if (dateEl) {
                var today = new Date();
                dateEl.textContent = (today.getMonth() + 1) + '月' + today.getDate() + '日';
            }
        }

        // 智能查找数值字段（当指定字段不存在时）
        function findNumericField(row, preferredKey) {
            if (preferredKey && row.hasOwnProperty(preferredKey)) {
                var v = parseFloat(String(row[preferredKey]).replace(/,/g, ''));
                if (!isNaN(v) && v > 0) return v;
            }
            // 尝试常见价格/产量字段
            var candidates = ['均价', '产量', '现货价', '价格', '出口量', '产能利用率', '最低价', '最高价'];
            for (var i = 0; i < candidates.length; i++) {
                var key = candidates[i];
                if (row.hasOwnProperty(key)) {
                    var val = parseFloat(String(row[key]).replace(/,/g, ''));
                    if (!isNaN(val) && val > 0) return val;
                }
                // 尝试匹配包含候选词的字段
                for (var k in row) {
                    if (k.indexOf(key) !== -1) {
                        var v2 = parseFloat(String(row[k]).replace(/,/g, ''));
                        if (!isNaN(v2) && v2 > 0) return v2;
                    }
                }
            }
            // 最后尝试任意数值字段
            for (var k2 in row) {
                var v3 = parseFloat(String(row[k2]).replace(/,/g, ''));
                if (!isNaN(v3) && v3 > 0) return v3;
            }
            return 0;
        }

        function loadChartData(idx) {
            var db = DASHBOARDS[idx];

            fetch(db.dataFile + '?t=' + Date.now())
                .then(function(r) {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.json();
                })
                .then(function(d) {
                    if (!d.tables || !Array.isArray(d.tables)) {
                        throw new Error('数据格式错误：缺少tables数组');
                    }
                    var table = d.tables.find(function(t) {
                        return t.table_name === db.tableName;
                    });
                    if (!table) {
                        throw new Error('未找到表：' + db.tableName);
                    }
                    var rows = table.data || [];
                    if (rows.length === 0) {
                        throw new Error('表数据为空');
                    }

                    // ===== 饼图数据解析（分类/份额数据）=====
                    if (db.chartType === 'pie') {
                        var pieData;
                        // 模式1: row_columns — 取最新一行，非日期列作为分类
                        if (db.pieMode === 'row_columns') {
                            var lastRow = rows[rows.length - 1];
                            var excludeKeys = {};
                            ['日期','月份','时间','date','_record_id','父记录','字段'].forEach(function(k) { excludeKeys[k] = 1; });
                            (db.pieExcludeColumns || []).forEach(function(k) { excludeKeys[k] = 1; });
                            pieData = [];
                            for (var ck in lastRow) {
                                if (!excludeKeys[ck]) {
                                    var cv = parseFloat(String(lastRow[ck]).replace(/,/g, ''));
                                    if (!isNaN(cv) && cv > 0) {
                                        pieData.push({ name: ck, value: Math.round(cv * 100) / 100 });
                                    }
                                }
                            }
                        }
                        // 模式2: filtered_rows — 按日期过滤，提取nameKey+valueKey
                        else if (db.pieMode === 'filtered_rows') {
                            var dateCol = db.pieDateKey || '日期';
                            var nameCol = db.pieNameKey || 'name';
                            var valCol = db.pieValueKey || 'value';
                            // 找到最新日期
                            var latestDate = '';
                            rows.forEach(function(r) { var rd = String(r[dateCol] || ''); if (rd > latestDate) latestDate = rd; });
                            // 过滤该日期的行
                            var filterFn = db.pieFilter || function() { return true; };
                            pieData = rows.filter(function(r) {
                                return String(r[dateCol] || '') === latestDate && filterFn(r);
                            }).map(function(r) {
                                return { name: String(r[nameCol] || ''), value: parseFloat(String(r[valCol] || '0').replace(/,/g, '')) * (db.scale || 1) };
                            }).filter(function(d) { return d.name && d.value > 0; });
                        }
                        else {
                            throw new Error('未知饼图模式: ' + (db.pieMode || ''));
                        }

                        if (pieData.length === 0) {
                            throw new Error('饼图数据解析后无有效数据');
                        }
                        // 按值降序排列
                        pieData.sort(function(a, b) { return b.value - a.value; });
                        renderChartSlide(pieData);
                        updateChartInfo(pieData);
                        return;
                    }

                    // ===== 时间序列数据解析（折线图/柱状图）=====
                    var parsed = rows.map(function(r) {
                        var timeVal = String(r[db.timeKey] || r['日期'] || r['月份'] || '');
                        var numVal = findNumericField(r, db.valueKey);
                        // 统一时间格式
                        var label = timeVal;
                        if (label.length === 7 && label.indexOf('-') === 4) {
                            label = label.slice(5) + '月';
                        } else if (label.length === 10 && label.indexOf('-') === 4) {
                            label = label.slice(5, 7) + '/' + label.slice(8, 10);
                        } else if (label.length > 7) {
                            label = label.slice(5);
                        }
                        return { time: timeVal, label: label, value: numVal * db.scale };
                    }).filter(function(d) { return d.value > 0; });

                    // 按时间排序（从早到晚）
                    parsed.sort(function(a, b) {
                        return String(a.time).localeCompare(String(b.time));
                    });

                    // 取最近12条数据
                    var data = parsed.slice(-12).map(function(d) {
                        return [d.label, d.value];
                    });

                    if (data.length === 0) {
                        throw new Error('解析后无有效数据');
                    }

                    renderChartSlide(data);
                    updateChartInfo(data);
                })
                .catch(function(err) {
                    console.error('数据库看板数据加载失败:', err);
                    updateChartInfo(null, '数据加载失败：' + (err.message || '未知错误'));
                });
        }

        function moveChartCarousel(dir) {
            currentChartIdx = (currentChartIdx + dir + DASHBOARDS.length) % DASHBOARDS.length;
            loadChartData(currentChartIdx);
            updateChartDots();
            // 重置自动轮播计时器
            startChartAutoPlay();
        }

        function updateChartDots() {
            var dotsEl = document.getElementById('chartDots');
            if (!dotsEl) return;
            dotsEl.innerHTML = '';
            for (var i = 0; i < DASHBOARDS.length; i++) {
                var dot = document.createElement('span');
                dot.className = 'chart-dot' + (i === currentChartIdx ? ' active' : '');
                dot.onclick = (function(idx) {
                    return function() { moveChartCarousel(idx - currentChartIdx); };
                })(i);
                dotsEl.appendChild(dot);
            }
        }

        function init() {
            // 计算今日精选索引
            var seed = 0;
            try { seed = getDailySeed(); } catch(e) {}
            currentChartIdx = seed % DASHBOARDS.length;
            loadChartData(currentChartIdx);
            updateChartDots();
        }

        window.moveChartCarousel = moveChartCarousel;

        // 自动轮播（5秒，与左侧新闻一致）
        function startChartAutoPlay() {
            if (chartAutoPlay) clearInterval(chartAutoPlay);
            chartAutoPlay = setInterval(function() {
                moveChartCarousel(1);
            }, 5000);
        }

        // 鼠标悬停暂停自动轮播，离开恢复
        var heroRight = document.querySelector('.hero-right');
        if (heroRight) {
            heroRight.addEventListener('mouseenter', function() {
                if (chartAutoPlay) clearInterval(chartAutoPlay);
            });
            heroRight.addEventListener('mouseleave', function() {
                startChartAutoPlay();
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                init();
                startChartAutoPlay();
            });
        } else {
            init();
            startChartAutoPlay();
        }
    })();
    
    // ===== 有色金属 & 化工板块甘特图 =====
    var cumulativeDataMetals = null; // 有色金属累积涨跌幅数据（由初始化函数填充）
    async function renderSectorGantt(sectorKey, containerId, dataOrFile) {
        /**
         * 渲染板块甘特图（有色金属 / 化工）
         * sectorKey: 'metals' | 'chemical'
         * containerId: DOM容器ID
         * dataOrFile: JSON数据文件名(字符串) 或 数据对象(有色金属改造后传入对象)
         */
        try {
            let data;
            if (typeof dataOrFile === 'string') {
                const resp = await fetch(`reports/${dataOrFile}?t=${Date.now()}`);
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                data = await resp.json();
            } else {
                data = dataOrFile; // 直接是数据对象
            }
            
            if (!data || !data.products || data.products.length === 0) {
                console.log(`[甘特图-${sectorKey}] ⚠️ 无数据`);
                return;
            }
            
            const container = document.getElementById(containerId);
            if (!container) {
                console.log(`[甘特图-${sectorKey}] ⚠️ 未找到容器 #${containerId}`);
                return;
            }
            
            // 标题
            const titleMap = { metals: '有色板块2026年累计涨跌幅', chemical: '化工板块2026年累计涨跌幅' };
            const descMap = { metals: '2026年至今', chemical: '2026年至今' };
            
            // 找出最大涨跌幅
            let maxChangePct = 0;
            data.products.forEach(p => {
                if (Math.abs(p.change_pct) > maxChangePct) maxChangePct = Math.abs(p.change_pct);
            });
            
            // 按涨跌幅降序
            data.products.sort((a, b) => b.change_pct - a.change_pct);
            
            // 生成HTML
            let html = '<div class="cumulative-gantt">';
            html += `<div class="gantt-title">${titleMap[sectorKey]} <span style="font-size:12px;color:#999;font-weight:normal;">(${descMap[sectorKey]})</span></div>`;
            
            data.products.forEach(product => {
                const pct = product.change_pct;
                const absPct = Math.abs(pct);
                const width = maxChangePct > 0 ? (absPct / maxChangePct) * 80 : 0;
                const direction = pct > 0 ? 'up' : pct < 0 ? 'down' : 'stable';
                const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : '→';
                const color = pct > 0 ? '#d32f2f' : pct < 0 ? '#388e3c' : '#999';
                
                const dateRange = product.start_date + ' ~ ' + product.end_date;
                
                html += `<div class="gantt-row" data-sector="${sectorKey}" data-product-name="${product.name}">`;
                html += `<span class="gantt-name">${product.name}</span>`;
                html += `<div class="gantt-bar-track">`;
                html += `<div class="gantt-bar ${direction}" data-target-width="${width}%" style="width:0;">`;
                html += `<span class="gantt-bar-label"><span class="gantt-arrow">${arrow}</span> ${pct > 0 ? '+' : ''}${pct.toFixed(2)}%</span>`;
                html += '</div></div>';
                html += `<span class="gantt-value" style="color:${color};font-size:10px;">${product.start_price.toLocaleString()} → ${product.end_price.toLocaleString()}<br><span style="color:#999;">(${dateRange})</span></span>`;
                html += '</div>';
            });
            
            html += '<div id="gantt-expand-area-' + sectorKey + '" style="display:none;margin-top:20px;"></div>';
            html += '</div>';
            
            // 数据来源
            html += `<div style="margin-top:10px;padding:8px;background:rgba(248,255,251,0.7);backdrop-filter:blur(8px);border:1px solid rgba(220,238,230,0.4);border-radius:4px;font-size:11px;color:#666;text-align:center;">📊 数据来源: ${data.meta.data_source || '未知'} | 更新时间: ${data.meta.update_time || '未知'}</div>`;
            
            container.innerHTML = html;
            
            // 触发动画
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    container.querySelectorAll('.gantt-bar').forEach(bar => {
                        const tw = bar.getAttribute('data-target-width');
                        if (tw) bar.style.width = tw;
                    });
                });
            });
            
            console.log(`[甘特图-${sectorKey}] ✅ 已渲染 ${data.products.length} 个产品`);
            
            // 绑定点击事件（手风琴）
            container.querySelectorAll('.gantt-row').forEach(row => {
                row.style.cursor = 'pointer';
                row.addEventListener('click', function() {
                    const productName = this.getAttribute('data-product-name');
                    console.log(`[甘特图-${sectorKey}] 点击:`, productName);
                    
                    // 手风琴：关闭同板块其他行（先折叠再移除）
                    container.querySelectorAll('.gantt-row.active').forEach(r => {
                        if (r !== this) {
                            r.classList.remove('active');
                            const area = document.getElementById('gantt-expand-area-' + sectorKey);
                            if (area) {
                                const card = area.querySelector('.mk-chart-card');
                                if (card && card._origParent) {
                                    card._origParent.appendChild(card);
                                    card.style.display = '';
                                    // 恢复原始样式
                                    card.style.width = '';
                                    card.style.maxWidth = '';
                                    card.style.margin = '';
                                    card.style.boxSizing = '';
                                    card._origParent = null;
                                }
                                area.style.display = 'none';
                                area.innerHTML = '';
                            }
                        }
                    });
                    
                    if (this.classList.contains('active')) {
                        // 已展开，收起
                        this.classList.remove('active');
                        const area = document.getElementById('gantt-expand-area-' + sectorKey);
                        if (area) {
                            const card = area.querySelector('.mk-chart-card');
                            if (card && card._origParent) {
                                card._origParent.appendChild(card);
                                card.style.display = '';
                                // 恢复原始样式
                                card.style.width = '';
                                card.style.maxWidth = '';
                                card.style.margin = '';
                                card.style.boxSizing = '';
                                card._origParent = null;
                            }
                            area.style.display = 'none';
                            area.innerHTML = '';
                        }
                        return;
                    }
                    
                    this.classList.add('active');
                    // 展开图表：把对应卡片移到展开区域
                    const area = document.getElementById('gantt-expand-area-' + sectorKey);
                    if (!area) return;
                    area.style.display = 'block';
                    
                    // 产品名 → SVG ID 映射
                    const svgMap = [
                        { keyword: '铂期货', svgId: 'ptFuturesChart' },
                        { keyword: '钯期货', svgId: 'pdFuturesChart' },
                        { keyword: '铁矿石', svgId: 'iFuturesChart' },
                        { keyword: '尿素期货', svgId: 'urFuturesChart' },
                        { keyword: 'WTI原油', svgId: 'wtiFuturesChart' },
                        { keyword: '乙二醇', svgId: 'egFuturesChart' },
                        { keyword: '磷矿石', svgId: 'phosphateChart' },
                    ];
                    
                    let targetSvgId = null;
                    for (const item of svgMap) {
                        if (productName.includes(item.keyword)) {
                            targetSvgId = item.svgId;
                            break;
                        }
                    }
                    
                    if (!targetSvgId) {
                        area.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">未找到 [' + productName + '] 对应的图表配置</div>';
                        return;
                    }
                    
                    const originalSvg = document.getElementById(targetSvgId);
                    if (!originalSvg) {
                        area.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">未找到SVG: ' + targetSvgId + '</div>';
                        return;
                    }
                    
                    const card = originalSvg.closest('.mk-chart-card');
                    if (!card) {
                        area.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">未找到图表卡片</div>';
                        return;
                    }
                    
                    // 保存原始父节点，然后移到展开区域
                    card._origParent = card.parentNode;
                    area.appendChild(card);
                    card.style.display = '';
                    
                    // 让卡片宽度适应展开区域
                    card.style.width = '100%';
                    card.style.maxWidth = '100%';
                    card.style.margin = '0';
                    card.style.boxSizing = 'border-box';
                    
                    // 找到卡片内的SVG，调整宽度
                    const svg = card.querySelector('svg');
                    if (svg) {
                        svg.style.width = '100%';
                        svg.style.height = 'auto';
                        svg.setAttribute('width', '100%');
                        svg.removeAttribute('height');
                    }
                    
                    // 触发布局更新（重绘图表）
                    setTimeout(() => {
                        const event = new Event('resize');
                        window.dispatchEvent(event);
                    }, 100);
                    
                    // 触发图表重新渲染
                    const renderMap = {
                        'iFuturesChart': 'renderIChart',
                        'phosphateChart': 'renderPhosphateChart',
                        'ptFuturesChart': 'renderPTChart',
                        'pdFuturesChart': 'renderPDChart',
                        'urFuturesChart': 'renderUrFuturesChart',
                        'wtiFuturesChart': 'renderWtiFuturesChart',
                        'egFuturesChart': 'renderEgFuturesChart',
                    };
                    const renderFnName = renderMap[targetSvgId];
                    if (renderFnName && typeof window[renderFnName] === 'function') {
                        setTimeout(() => {
                            try {
                                window[renderFnName]();
                                console.log('[renderSectorGantt] ✅ 已触发重新渲染:', renderFnName);
                            } catch(e) {
                                console.warn('[renderSectorGantt] ⚠️ 重新渲染失败:', renderFnName, e);
                            }
                        }, 500);
                    }
                    
                    // 滚动到展开区域，让图表完整可见
                    setTimeout(() => {
                        area.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 800);
                });
            });
            
        } catch (e) {
            console.error(`[甘特图-${sectorKey}] 渲染失败:`, e);
        }
    }
    
    // 隐藏有色金属和化工板块的图表网格（初始只显示甘特图）
    document.querySelectorAll('#panel-energy .mk-chart-grid').forEach(grid => { grid.style.display = 'none'; });
    document.querySelectorAll('#panel-chemical .mk-chart-grid').forEach(grid => { grid.style.display = 'none'; });
    
    // 初始化时调用
    renderSectorGantt('chemical', 'gantt-chart-container-chemical', 'market_cumulative_chemical.json');
    
