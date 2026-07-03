
    // 异步加载报告数据（动态获取最新报告）
    (function() {
        var DATA_BASE = (location.hostname.includes('aiforce.cloud') || location.hostname.includes('miaoda'))
          ? 'https://bishop801818-debug.github.io/ai-daily-report'
          : '.';
        
        var XHR_TIMEOUT = 10000; // 10秒超时
        
        function showLoading() {
            var div = document.getElementById('loading-mask');
            if (!div) {
                div = document.createElement('div');
                div.id = 'loading-mask';
                div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;';
                div.innerHTML = '<div style="font-size:18px;color:#333;margin-bottom:10px;">正在加载数据...</div><div style="font-size:14px;color:#666;">请稍候</div>';
                document.body.appendChild(div);
            }
        }
        
        function hideLoading() {
            var div = document.getElementById('loading-mask');
            if (div) div.remove();
        }
        
        function renderPage() {
            hideLoading();
            if (typeof initPage === 'function') {
                initPage();
            }
            var event = new Event('reportDataLoaded');
            document.dispatchEvent(event);
        }
        
        function loadData() {
            // 如果有嵌入数据，先渲染（避免白屏）
            if (window.__EMBEDDED__) {
                console.log('[数据加载] 使用嵌入数据，日期: ' + window.__EMBEDDED__.today);
                renderPage();
            } else {
                showLoading();
            }
            
            var startTime = Date.now();
            
            // 获取 index.json
            var indexXhr = new XMLHttpRequest();
            var indexUrl = DATA_BASE + '/reports/index.json?v=' + (window.HTML_VERSION || Date.now());
            
            // 超时定时器
            var indexTimeout = setTimeout(function() {
                console.warn('[数据加载] index.json 请求超时');
                indexXhr.abort();
                // 使用嵌入数据（如果可用）
                if (window.__EMBEDDED__) {
                    console.log('[数据加载] 使用嵌入数据（index.json 超时）');
                    renderPage();
                } else {
                    hideLoading();
                    alert('数据加载超时，请刷新页面重试');
                }
            }, XHR_TIMEOUT);
            
            indexXhr.open('GET', indexUrl, true);
            
            indexXhr.onload = function() {
                clearTimeout(indexTimeout);
                
                if (indexXhr.status === 200) {
                    try {
                        var indexData = JSON.parse(indexXhr.responseText);
                        var latestDate = indexData.latest_date;
                        var dataFile = DATA_BASE + '/reports/' + latestDate + '.json';
                        
                        console.log('[数据加载] 最新报告日期: ' + latestDate);
                        
                        // 加载最新的报告文件
                        var dataXhr = new XMLHttpRequest();
                        var dataUrl = dataFile + '?v=' + (window.HTML_VERSION || Date.now());
                        
                        var dataTimeout = setTimeout(function() {
                            console.warn('[数据加载] 报告文件请求超时');
                            dataXhr.abort();
                            // 使用嵌入数据（如果可用）
                            if (window.__EMBEDDED__) {
                                console.log('[数据加载] 使用嵌入数据（报告文件超时）');
                                renderPage();
                            } else {
                                hideLoading();
                                alert('数据加载超时，请刷新页面重试');
                            }
                        }, XHR_TIMEOUT);
                        
                        dataXhr.open('GET', dataUrl, true);
                        
                        dataXhr.onload = function() {
                            clearTimeout(dataTimeout);
                            
                            if (dataXhr.status === 200) {
                                try {
                                    var data = JSON.parse(dataXhr.responseText);
                                    console.log('[数据加载] 成功（动态），耗时: ' + (Date.now() - startTime) + 'ms');
                                    if (data && data.today) { // 防止 undefined 覆盖
                                    window.__EMBEDDED__ = {
  "today": "2026-07-02",
  "report": {
    "departments": {
      "bych": {
        "bu_name": "铂源催化事业部",
        "sections": [
          {
            "dim": "topnews",
            "title": "今日关注",
            "items": [
              {
                "title": "现货铂金突破1580美元涨2.05%",
                "content": "",
                "priority": "P0",
                "source": "汇通财经，2026-07-02",
                "url": "https://news.fx678.com/202607020229102365.shtml",
                "date": "2026-07-02"
              },
              {
                "title": "氢能纳入新型能源体系十五五规划",
                "content": "",
                "priority": "P0",
                "source": "中国能源网，2026-06-30",
                "url": "https://www.china5e.com/news/news-1205730-1.html",
                "date": "2026-06-30"
              },
              {
                "title": "PEM电解槽招标2025年同比+226%",
                "content": "",
                "priority": "P1",
                "source": "碳索氢能网，2026-06-27",
                "url": "https://pdf.dfcfw.com/pdf/H2_AN202606271826507799_1.pdf",
                "date": "2026-06-27"
              },
              {
                "title": "中车株洲所光储氢方案全球首发",
                "content": "",
                "priority": "P1",
                "source": "索比光伏网，2026-06-29",
                "url": "https://news.solarbe.com/202606/29/50025041.html",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "market",
            "title": "市场/价格",
            "items": [
              {
                "title": "现货铂金",
                "content": "价格：1580.00美元/盎司\n涨跌：+31.85美元/盎司（+2.05%）\n来源：汇通财经，2026-07-02",
                "priority": "P0",
                "source": "汇通财经，2026-07-02",
                "url": "https://news.fx678.com/202607020229102365.shtml",
                "date": "2026-07-02"
              },
              {
                "title": "Nymex铂金期货主力",
                "content": "价格：1592.7美元/盎司\n涨跌：+27.0美元/盎司（+1.72%）\n来源：汇通财经，2026-07-02",
                "priority": "P0",
                "source": "汇通财经，2026-07-02",
                "url": "https://news.fx678.com/202607020229102365.shtml",
                "date": "2026-07-02"
              },
              {
                "title": "上海现货铂均价",
                "content": "价格：381元/克（区间379-383）\n涨跌：-6元/克\n来源：上海有色网，2026-07-01",
                "priority": "P0",
                "source": "上海有色网，2026-07-01",
                "url": "https://hq.smm.cn/h5/platinum-group-metals-price-chart",
                "date": "2026-07-01"
              },
              {
                "title": "上海现货钯锭（进口）",
                "content": "价格：288元/克（区间283-293）\n涨跌：持平\n来源：矿权资源网，2026-07-01",
                "priority": "P1",
                "source": "矿权资源网，2026-07-01",
                "url": "https://www.kq81.com/AspCode/KyxtShow.asp?ArticleId=554921",
                "date": "2026-07-01"
              },
              {
                "title": "国际现货钯金",
                "content": "价格：1382美元/盎司\n国内原料价：296元/克\n来源：金投网，2026-07-01",
                "priority": "P1",
                "source": "金投网，2026-07-01",
                "url": "https://m.cngold.org/home/xw10594087.html",
                "date": "2026-07-01"
              },
              {
                "title": "碳酸锂期货主力LC2609",
                "content": "价格：164560元/吨\n涨跌：+7260元/吨（+4.62%，两日累计涨近13%）\n来源：网易，2026-07-02",
                "priority": "P1",
                "source": "网易，2026-07-02",
                "url": "https://www.163.com/dy/article/L0PTF32J05539T4L.html",
                "date": "2026-07-02"
              },
              {
                "title": "WTI原油期货",
                "content": "价格：68.58美元/桶\n涨跌：-0.92美元/桶（-1.32%）\n来源：每日经济新闻，2026-07-02",
                "priority": "P1",
                "source": "每日经济新闻，2026-07-02",
                "url": "http://www.nbd.com.cn/rss/eastmoney/articles/4444562.html",
                "date": "2026-07-02"
              },
              {
                "title": "布伦特原油期货",
                "content": "价格：71.57美元/桶\n涨跌：-1.38美元/桶（-1.89%）\n来源：每日经济新闻，2026-07-02",
                "priority": "P1",
                "source": "每日经济新闻，2026-07-02",
                "url": "http://www.nbd.com.cn/rss/eastmoney/articles/4444562.html",
                "date": "2026-07-02"
              },
              {
                "title": "尿素期货UR2609主力",
                "content": "价格：1723.0元/吨\n涨跌：-17.0元/吨（-0.98%）\n来源：南方财经网，2026-07-01",
                "priority": "P1",
                "source": "南方财经网，2026-07-01",
                "url": "https://www.quheqihuo.com/news/202607014464216.html",
                "date": "2026-07-01"
              },
              {
                "title": "国内尿素现货基准价",
                "content": "价格：1813.75元/吨\n市场基差：+90.75元/吨（现货升水期货）\n来源：生意社，2026-07-01",
                "priority": "P1",
                "source": "生意社，2026-07-01",
                "url": "http://news.10jqka.com.cn/20260701/c677873815.shtml",
                "date": "2026-07-01"
              },
              {
                "title": "PEM电解水制氢2025年公开招标需求",
                "content": "需求规模：114.2MW\n同比：+226%\n来源：苏州科润新材料招股说明书，2026-06-27",
                "priority": "P0",
                "source": "苏州科润新材料招股说明书，2026-06-27",
                "url": "https://pdf.dfcfw.com/pdf/H2_AN202606271826507799_1.pdf",
                "date": "2026-06-27"
              },
              {
                "title": "国内电解槽2025年订单规模",
                "content": "规模：5.3GW\n同比：+95%\n2026年预测：5.8GW\n来源：碳索氢能网，2026-06-27",
                "priority": "P0",
                "source": "碳索氢能网，2026-06-27",
                "url": "https://pdf.dfcfw.com/pdf/H2_AN202606271826507799_1.pdf",
                "date": "2026-06-27"
              },
              {
                "title": "PEM与碱性电解槽价格降幅",
                "content": "2024/2025年PEM价格同比：-20%/-24%\n2024/2025年碱性电解槽价格同比：-11%/-13%\n来源：长江证券，2026-06-26",
                "priority": "P1",
                "source": "长江证券，2026-06-26",
                "url": "https://www.cnenergynews.cn/article/4RuMLY1NYGi",
                "date": "2026-06-26"
              },
              {
                "title": "燃料电池系统售价持续下降",
                "content": "系统售价：2019年2.02万元/kW → 2024年0.28万元/kW\n降幅：约86%\n来源：长江证券，2026-06-26",
                "priority": "P1",
                "source": "长江证券，2026-06-26",
                "url": "https://www.cnenergynews.cn/article/4RuMLY1NYGi",
                "date": "2026-06-26"
              },
              {
                "title": "7月1日氢能板块资金面分化",
                "content": "板块涨跌：+0.05%\n主力资金净流出：21.01亿元\n游资净流入：9.56亿元；散户净流入：11.45亿元\n来源：搜狐，2026-07-01",
                "priority": "P1",
                "source": "搜狐，2026-07-01",
                "url": "https://www.sohu.com/a/1044307591_121956424",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "policy",
            "title": "政策/行业",
            "items": [
              {
                "title": "新型能源体系十五五规划明确氢能200万吨目标",
                "content": "国家发改委、国家能源局印发《新型能源体系建设\"十五五\"规划》，统筹氢能制储输用全链条发展，明确2030年实现可再生能源制氢规模达到200万吨，2030年初步建成清洁低碳安全高效的新型能源体系，非化石能源消费比重达到25%。",
                "priority": "P0",
                "source": "经济参考报，2026-07-02",
                "url": "https://www.china5e.com/news/news-1205730-1.html",
                "date": "2026-07-02"
              },
              {
                "title": "我国首次发布氢气管输工程成套技术与标准体系",
                "content": "国家发布氢气管输工程成套技术与标准体系，加快氢能制储输用全链条发展，制储运环节的堵点、难点有望系统破解，氢能从示范应用加速转向规模化扩张与全系统效能提升，配套铂基催化材料需求空间打开。",
                "priority": "P0",
                "source": "中国能源网，2026-06-30",
                "url": "https://www.china5e.com/news/news-1205730-1.html",
                "date": "2026-06-30"
              },
              {
                "title": "氢能综合应用试点2030年保有量目标10万辆",
                "content": "工信部、财政部、发改委等联合印发《关于开展氢能综合应用试点工作的通知》，设定全国燃料电池汽车保有量较2025年实现翻番、力争达到10万辆的目标，并推动燃料电池、电解槽、储运装备等关键技术与产品迭代升级。",
                "priority": "P0",
                "source": "长江证券，2026-06-26",
                "url": "https://www.cnenergynews.cn/article/4RuMLY1NYGi",
                "date": "2026-06-26"
              },
              {
                "title": "氢能产业专项行动方案绿氢消纳配额制试点",
                "content": "国家发改委等五部门6月28日联合印发《2026氢能产业高质量发展专项行动方案（试行）》，首次明确\"绿氢消纳配额制\"在京津冀、长三角、粤港澳三大城市群试点落地，要求2026年底前建成加氢站超1800座（较2025年末实际数多52%）。",
                "priority": "P0",
                "source": "搜狐，2026-07-01",
                "url": "https://www.sohu.com/a/1044307591_121956424",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "enterprise",
            "title": "企业动态",
            "items": [
              {
                "title": "中石化签约乌兹别克斯坦40万吨SAF项目",
                "content": "中石化宁波工程公司与Allied Biofuels FE LLC签署中亚首个大型全产业链生物航油综合体项目FEED及详细设计合同，年产SAF 40万吨，配套光伏、绿氢、储能设施，总投资约61亿美元，集绿色制氢、SAF、电合成航油、绿色柴油于一体。",
                "priority": "P0",
                "source": "碳索氢能网，2026-06-29",
                "url": "https://h2.solarbe.com/news/20260629/50025043.html",
                "date": "2026-06-29"
              },
              {
                "title": "中车株洲所光储氢全场景方案全球首发",
                "content": "中车株洲所在The smarter E Europe 2026展会面向全球发布\"光储氢\"全场景方案，重磅首发12.5MW/13.8MW储能升压变流一体机（配套6.X液冷电池舱），同步展示绿电制氢系统、储能系统、光伏逆变器等多款创新产品。",
                "priority": "P0",
                "source": "索比光伏网，2026-06-29",
                "url": "https://news.solarbe.com/202606/29/50025041.html",
                "date": "2026-06-29"
              },
              {
                "title": "未势能源联合巴西开展氢能重卡道路测试",
                "content": "未势能源联合巴西国家工业培训服务局SENAI CIMATEC在巴西本地开展氢燃料卡车道路测试，分阶段围绕整车动力性能、续航里程、高压储氢安全、本地真实路况开展实测，将验证氢燃料系统对电解氢、乙醇重整制氢等不同氢源的适配性。",
                "priority": "P1",
                "source": "氢启未来，2026-06-30",
                "url": "https://www.h2weilai.com/cms/index/shows/catid/28/id/11906.html",
                "date": "2026-06-30"
              },
              {
                "title": "氢导智能FCVC展示服务全球80%头部氢能企业",
                "content": "先导智能旗下氢导智能亮相FCVC2026，聚焦电解槽、燃料电池两大核心赛道，贯通制浆涂布、封装、堆叠组装等核心工序装备，已服务国内外80%以上头部氢能企业，澳洲2GW级电解槽产线、德国/美国CCM涂布产线相继交付。",
                "priority": "P1",
                "source": "先导智能，2026-06-26",
                "url": "https://leadintelligent.com/news-detail/525",
                "date": "2026-06-26"
              }
            ]
          },
          {
            "dim": "tech",
            "title": "技术/产品",
            "items": [
              {
                "title": "中汽中心发布氢能马拉松专项耐久性成果",
                "content": "中汽中心新能源检验中心发布国际首个氢能与燃料电池产品耐久性技术验证项目阶段性成果：燃料电池堆2000小时动态循环测试电压衰减不超3%，氢能无人机续航超3小时，氢能两轮车单次充氢续航突破80公里。",
                "priority": "P0",
                "source": "天津日报，2026-07-02",
                "url": "http://epaper.tianjinwe.com/tjrb/html/2026-07/02/content_143094_3595490.htm",
                "date": "2026-07-02"
              },
              {
                "title": "国内质子交换膜国产化率快速提升",
                "content": "全球PEM电解槽核心材料质子交换膜市场长期由科慕等海外企业垄断，国内产品相较进口产品成本降低约40%，国产化率快速提升，PEM电解水制氢2025年公开招标需求达114.2MW（同比+226%），为PEM催化材料打开国产替代窗口。",
                "priority": "P1",
                "source": "苏州科润新材料招股说明书，2026-06-27",
                "url": "https://pdf.dfcfw.com/pdf/H2_AN202606271826507799_1.pdf",
                "date": "2026-06-27"
              },
              {
                "title": "SOFC与碳陶刹车盘打开新场景",
                "content": "奥福子公司奥福氢能专注燃料电池重整装置技术，2025年300W固体氧化物燃料电池（SOFC）系统实现丙烷重整器与燃烧器小批量销售，正推进天然气制氢燃烧器、SOFC重整制氢催化器及撬装设备研制，长期有望大幅提升SOFC等燃料电池市场空间。",
                "priority": "P2",
                "source": "国泰海通，2026-06-30",
                "url": "https://pdf.dfcfw.com/pdf/H2_AP202606301826587408_1.pdf",
                "date": "2026-06-30"
              }
            ]
          },
          {
            "dim": "project",
            "title": "项目/招标",
            "items": [
              {
                "title": "内蒙古稀奥科采购3000套270W燃料电池系统",
                "content": "内蒙古稀奥科贮氢合金有限公司2026年采购阴极闭式风冷270W燃料电池系统3000套，预算金额约550万元，单台功率密度提升、批量交付节奏加快，反映燃料电池在分布式储能/备用电源场景的批量渗透正在加速。",
                "priority": "P1",
                "source": "氢启未来，2026-06-28",
                "url": "https://www.h2weilai.com/cms/index/shows/catid/28/id/11902.html",
                "date": "2026-06-28"
              },
              {
                "title": "雅砻江两河口绿色氢能项目可研招标",
                "content": "雅砻江两河口绿色氢能项目选址甘孜州雅江县，拟新建电解水制氢、加氢、储氢、氢储能、有机液体加氢系统等，由国投集团电子采购平台发布可行性研究招标，涵盖勘察设计与成果文件编制，西部大型一体化氢能项目持续推进。",
                "priority": "P1",
                "source": "氢启未来，2026-06-28",
                "url": "https://www.h2weilai.com/cms/index/shows/catid/28/id/11902.html",
                "date": "2026-06-28"
              },
              {
                "title": "华旺氢能共享单车采购6500个固态储氢瓶",
                "content": "华旺（青岛）氢能科技集团有限公司氢能共享单车项目（重新招标）采购固态储氢瓶6500个，预算624万元，结合氢能两轮车单次充氢续航突破80公里的耐久性验证成果，固态储氢在轻型交通领域进入小批量商业化。",
                "priority": "P1",
                "source": "氢启未来，2026-06-28",
                "url": "https://www.h2weilai.com/cms/index/shows/catid/28/id/11902.html",
                "date": "2026-06-28"
              }
            ]
          },
          {
            "dim": "tips",
            "title": "专属提示",
            "items": [
              {
                "title": "💰 机会",
                "content": "铂金现货突破1580美元/盎司(+2.05%)，PEM电解槽2025年招标同比+226%、电解槽总订单+95%，燃料电池系统售价从2.02万元/kW降至0.28万元/kW，铂基催化材料国产替代与规模化窗口同步打开。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "⚠️ 风险",
                "content": "7月1日氢能板块主力净流出21.01亿元、板块仅微涨0.05%；碱性电解槽2024/2025年价格-11%/-13%、PEM-20%/-24%，价格战压制上游催化材料利润，钯金1382美元/盎司低位震荡需警惕联动走弱。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "📋 行动建议",
                "content": "短期跟踪现货铂金1600美元/盎司攻防与上期所铂钯月均价联动；锁定5家以上PEM/碱性电解槽整机厂催化剂长协供货；借力中石化40万吨SAF/雅砻江两河口等示范项目嵌入海外氢能链。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "👁️ 重点关注",
                "content": "四线跟踪：一是铂金1580-1600美元/盎司区间博弈与国内现货价差收敛；二是7月燃料电池汽车销量与中汽中心耐久性数据兑现；三是雅砻江两河口/华旺共享单车等中西部项目落地；四是南非铂钯产量与钯金1382美元/盎司底部支撑。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              }
            ]
          }
        ],
        "updated_at": "2026-07-02"
      },
      "czly": {
        "bu_name": "常州锂源事业部",
        "sections": [
          {
            "dim": "topnews",
            "title": "今日关注",
            "items": [
              {
                "title": "碳酸锂期货两日累计涨近13%",
                "content": "",
                "priority": "P0",
                "source": "期货日报，2026-07-02",
                "url": "https://www.163.com/dy/article/L0PTF32J05539T4L.html",
                "date": "2026-07-02"
              },
              {
                "title": "宁德时代枧下窝锂矿获批复产",
                "content": "",
                "priority": "P0",
                "source": "新浪财经，2026-07-02",
                "url": "https://k.sina.com.cn/article_7880068204_1d5b04c6c06801ajzs.html",
                "date": "2026-07-02"
              },
              {
                "title": "宁德时代签约极兔5000台重卡换电",
                "content": "",
                "priority": "P1",
                "source": "第一财经，2026-07-02",
                "url": "https://www.163.com/dy/article/L0Q4TOVE0519DDQ2.html",
                "date": "2026-07-02"
              },
              {
                "title": "7月1日实施两项电动汽车强制安全国标",
                "content": "",
                "priority": "P1",
                "source": "上海证券报，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              }
            ]
          },
          {
            "dim": "market",
            "title": "市场/价格",
            "items": [
              {
                "title": "碳酸锂期货LC2609主力合约",
                "content": "价格：164560元/吨\n涨跌：+7260元/吨（+4.62%）\n两日累计涨幅近13%\n来源：期货日报，2026-07-02",
                "priority": "P0",
                "source": "期货日报，2026-07-02",
                "url": "https://www.163.com/dy/article/L0PTF32J05539T4L.html",
                "date": "2026-07-02"
              },
              {
                "title": "WTI原油期货",
                "content": "价格：68.58美元/桶\n涨跌：-0.92美元/桶（-1.32%）\n创2月27日以来新低\n来源：中国基金报，2026-07-02",
                "priority": "P1",
                "source": "中国基金报，2026-07-02",
                "url": "https://www.chnfund.com/article/96a19e49-6750-2a75-e624-3a223135e7f8",
                "date": "2026-07-02"
              },
              {
                "title": "布伦特原油期货",
                "content": "价格：71.57美元/桶\n涨跌：-1.38美元/桶（-1.89%）\n大摩下调Q4目标至75美元/桶、2027年底至70美元\n来源：中国基金报，2026-07-02",
                "priority": "P1",
                "source": "中国基金报，2026-07-02",
                "url": "https://www.chnfund.com/article/96a19e49-6750-2a75-e624-3a223135e7f8",
                "date": "2026-07-02"
              },
              {
                "title": "电池级碳酸锂现货",
                "content": "价格：156150元/吨\n涨跌：+5300元/吨\n来源：鹰眼逻辑，2026-07-01",
                "priority": "P1",
                "source": "新浪财经/百川盈孚，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "工业级碳酸锂现货",
                "content": "价格：152750元/吨\n涨跌：+6350元/吨\n来源：鹰眼逻辑，2026-07-01",
                "priority": "P1",
                "source": "新浪财经/百川盈孚，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "磷酸铁锂6月月均价",
                "content": "价格：61113.33元/吨\n环比：+19.34%（较一季度51209.52元/吨）\n同比：+80.79%（较去年同期33802.02元/吨）\n来源：百川盈孚/隆众资讯，2026-07-01",
                "priority": "P0",
                "source": "百川盈孚，2026-07-01",
                "url": "https://cj.sina.cn/articles/view/5953189932/162d6782c06704grw8",
                "date": "2026-07-01"
              },
              {
                "title": "动力型磷酸铁锂现货",
                "content": "价格：59800-65200元/吨\n市场均价较上一工作日下降约200元/吨\n高端高压实产品突破7万元/吨\n来源：Mysteel，2026-07-01",
                "priority": "P1",
                "source": "Mysteel，2026-07-01",
                "url": "https://cj.sina.cn/articles/view/5953189932/162d6782c06704grw8",
                "date": "2026-07-01"
              },
              {
                "title": "储能型磷酸铁锂现货",
                "content": "价格：58500-61600元/吨\n较上周环比+3.15%\n来源：Mysteel，2026-07-01",
                "priority": "P1",
                "source": "Mysteel，2026-07-01",
                "url": "https://cj.sina.cn/articles/view/7857141524/1d452771401903iuw0",
                "date": "2026-07-01"
              },
              {
                "title": "六氟磷酸锂(电池级)基准价",
                "content": "价格：107000元/吨\n来源：生意社，2026-07-01",
                "priority": "P1",
                "source": "生意社，2026-07-01",
                "url": "https://www.100ppi.com/news/detail-20260701-5859070.html",
                "date": "2026-07-01"
              },
              {
                "title": "国内碳酸锂社会库存",
                "content": "库存：约28万吨\n状态：处于近三年低位\n来源：上海钢联，2026-07-01",
                "priority": "P1",
                "source": "上海钢联，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "大摩下调油价目标",
                "content": "布伦特Q4目标：从80美元/桶下调至75美元/桶\n2027年底目标：从80美元下调至70美元\n逻辑：霍尔木兹海峡通航恢复、阿联酋出口创新高\n来源：网易财经，2026-07-02",
                "priority": "P2",
                "source": "网易财经，2026-07-02",
                "url": "https://www.163.com/dy/article/L0Q3EK7J05561FZP.html",
                "date": "2026-07-02"
              },
              {
                "title": "国内成品油7月3日调价窗口",
                "content": "预计汽油下调820元/吨、柴油下调790元/吨\n折合92号汽油每升降0.66元、95号降0.70元\n原油变化率-15.50%\n来源：财联社，2026-07-01",
                "priority": "P2",
                "source": "财联社，2026-07-01",
                "url": "https://k.sina.com.cn/article_7879922977_1d5ae152106801gfhg.html",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "policy",
            "title": "政策/行业",
            "items": [
              {
                "title": "两项电动汽车强制安全国标7月1日实施",
                "content": "GB18384-2025《电动汽车安全要求》与GB38031-2025《动力电池安全新国标》正式实施，行业人士判断实施后新能源汽车自燃率将比燃油车低一个数量级，倒逼中小厂商退出核心供应链。",
                "priority": "P0",
                "source": "上海证券报，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "新型储能2027年装机目标1.8亿千瓦",
                "content": "国家发改委、能源局2025年9月《新型储能规模化建设专项行动方案》明确2027年装机1.8亿千瓦以上、带动直接投资约2500亿元；2026年1月《关于完善发电侧容量电价机制的通知》首次明确发电侧独立新型储能容量电价机制。",
                "priority": "P0",
                "source": "中证报/新浪财经，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "电池出口退税率分阶段取消",
                "content": "财政部、税务总局公告：自2026年4月1日起电池产品增值税出口退税率由9%下调至6%，2027年1月1日起全面取消，倒逼企业放弃纯代工模式、转向高附加值技术升级。",
                "priority": "P1",
                "source": "智通财经，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "工信部锂电池行业规范条件提高门槛",
                "content": "申报企业产能利用率不低于50%，磷酸铁锂能量型单体电池能量密度不低于165Wh/kg，储能电池循环寿命从5000次提升至6000次以上，研发费用占营收比不低于3%，加速落后产能出清。",
                "priority": "P1",
                "source": "中信建投电力设备行业报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "工信部等五部门启动新能源汽车下乡",
                "content": "2026年新能源汽车下乡活动6月29日启动，工信部、商务部等五部门联合推动下沉市场新能源车消费、配套充电基础设施建设，叠加新能源汽车以旧换新政策延续。",
                "priority": "P2",
                "source": "中国能源网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "enterprise",
            "title": "企业动态",
            "items": [
              {
                "title": "宁德时代枧下窝锂矿6月29日获批复产",
                "content": "宁德时代枧下窝锂矿年产碳酸锂约10万吨，停产前占全国总产量8%-10%。6月29日获颁安全生产许可证并正式复产；若7月起满负荷运行，下半年可新增碳酸锂供应超4.5万吨。",
                "priority": "P0",
                "source": "期货日报/新浪财经，2026-07-01",
                "url": "https://k.sina.com.cn/article_7880068204_1d5b04c6c06801ajzs.html",
                "date": "2026-07-01"
              },
              {
                "title": "比亚迪签约波兰600MW/2.4GWh储能项目",
                "content": "比亚迪拿下波兰大型储能项目，单项目600MW/2.4GWh，为欧洲最大储能订单之一，标志中国储能企业海外大型能源基建竞争力提升，预计对冲国内产能过剩焦虑并提升海外营收占比。",
                "priority": "P0",
                "source": "第一财经，2026-07-02",
                "url": "https://www.163.com/dy/article/L0Q4TOVE0519DDQ2.html",
                "date": "2026-07-02"
              },
              {
                "title": "磷酸铁锂行业TOP5集中度57.3%",
                "content": "2025年中国磷酸铁锂TOP5市占率57.3%（较2024年60.1%有所降低）：湖南裕能28.2%（110万吨）、万润新能8.5%、富临精工7.2%、友山新材6.7%、德方纳米6.7%，头部一体化企业占主导地位。",
                "priority": "P1",
                "source": "高工产研，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "宁德时代×极兔5000台重卡换电签约",
                "content": "宁德时代与极兔速递签署5000台重卡换电协议，标志着动力电池应用从乘用车向商用物流领域规模化渗透，打开B端换电增量市场；商用车换电商业模式迎来规模化拐点。",
                "priority": "P1",
                "source": "第一财经，2026-07-02",
                "url": "https://www.163.com/dy/article/L0Q4TOVE0519DDQ2.html",
                "date": "2026-07-02"
              },
              {
                "title": "锂+磷双联动结算模式加速推广",
                "content": "5月某头部电池大厂与正极供应商谈判落地，首次将磷酸价格纳入结算公式后，目前采用\"碳酸锂+磷酸\"双因子联动的正极厂约10家；价格传导机制优化，具备成本优势的磷酸铁锂上市公司充分受益。",
                "priority": "P1",
                "source": "财联社，2026-07-01",
                "url": "https://www.cls.cn/detail/2413445",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "tech",
            "title": "技术/产品",
            "items": [
              {
                "title": "三代半/四代高压实磷酸铁锂紧缺",
                "content": "2025年国内磷酸铁锂产量中三代半（压实密度2.55g/cm³）与四代高压实（2.60g/cm³）合计占比仅22.80%，高端结构性紧缺；头部企业均积极扩张三代半/四代产能以匹配动力快充与储能大型化需求。",
                "priority": "P0",
                "source": "万联证券/中证报，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "中车株洲所光储氢全场景方案全球首发",
                "content": "中车株洲所6月23日德国慕尼黑The smarter E Europe 2026展会发布光储氢全场景方案，12.5MW/13.8MW储能升压变流一体机配套6.X液冷电池舱；展示储能系统、户外柜、PV逆变器、绿电制氢系统。",
                "priority": "P1",
                "source": "索比光伏网，2026-07-01",
                "url": "https://news.solarbe.com/202606/29/50025041.html",
                "date": "2026-07-01"
              },
              {
                "title": "高压实/快充产品订单排至2027年",
                "content": "国内新能源车磷酸铁锂电池装车占比超80%，叠加全球大型储能、工商业储能及海外数据中心备电储能近乎100%选用LFP；头部企业订单排至2027年，行业开工率维持85%-90%高位。",
                "priority": "P1",
                "source": "中证报/中国证券报，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "project",
            "title": "项目/招标",
            "items": [
              {
                "title": "毕节百万吨级磷酸铁锂项目8月投产",
                "content": "项目2025年10月启动立项，总投资73.23亿元、占地873亩，整体规划年产104万吨磷酸铁锂正极材料分三期建设；一期设计产能34万吨，预计2026年8月建成投产。",
                "priority": "P0",
                "source": "生意社/100ppi，2026-07-01",
                "url": "http://www.100ppi.com/news/detail-20260630-5853772.html",
                "date": "2026-07-01"
              },
              {
                "title": "万华化学山东烟台40万吨四代高压实",
                "content": "万华化学联合磷化工企业构建一体化布局，规划山东烟台年产40万吨第四代高压实磷酸铁锂电池材料项目；同步建设四川16万吨铵法磷酸铁锂前驱体项目，核心窑炉设备已顺利吊装就位。",
                "priority": "P1",
                "source": "我的电池网/生意社，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "湖南裕能扩产7.5万吨超长循环+32万吨磷酸锰铁锂",
                "content": "湖南裕能作为行业龙头（28.2%市占率），拟建设年产32万吨磷酸锰铁锂项目、年产7.5万吨超长循环磷酸铁锂项目和年产10万吨磷酸铁项目，云南安宁二期配套改扩建同步推进。",
                "priority": "P1",
                "source": "万联证券/国金证券，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "盟固利四川达州15万吨四代以上",
                "content": "盟固利规划在四川达州建设年产15万吨四代及以上磷酸铁锂正极材料项目，瞄准高端结构性紧缺赛道；与万华化学、湖南裕能共同构成头部企业三代半/四代扩产主力。",
                "priority": "P2",
                "source": "万联证券，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "tips",
            "title": "专属提示",
            "items": [
              {
                "title": "💰 机会",
                "content": "碳酸锂期货两日涨近13%突破16.4万元/吨，枧下窝复产被市场充分定价但下游传导仍存时滞；高压实/快充LFP订单排至2027年，储能强需求叠加容量电价机制落地，头部一体化企业溢价能力进一步强化。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "⚠️ 风险",
                "content": "枧下窝7月满负荷运行下半年新增供应4.5万吨+海外7月中下旬集中到港预期+尼日利亚权益金上调推高海外成本，叠加磷酸成本传导滞后1-3个月，中小LFP厂成本压力可能倒逼停工减产。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "📋 行动建议",
                "content": "短期跟踪碳酸锂期货主力16万元/吨攻防与MMLC日均价联动节奏，把握回调锁定6%锂精矿长协与高压实LFP产能优先供货权；中长期借力广期所引入境外交易者契机拓展海外矿山套保渠道。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "👁️ 重点关注",
                "content": "聚焦四线：其一，碳酸锂期货LC主力16.4万元/吨关口攻防与仓单去化节奏；其二，6月电池排产兑现度与7月储能电芯/系统招标价格；其三，枧下窝7月实际复产强度与8月毕节百万吨投产爬坡；其四，海外锂矿7月中下旬到港节奏对供给端的扰动幅度。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              }
            ]
          }
        ],
        "updated_at": "2026-07-02"
      },
      "dkhx": {
        "bu_name": "迪克化学事业部",
        "sections": [
          {
            "dim": "topnews",
            "title": "今日关注",
            "items": [
              {
                "title": "制动液新国标GB12981实施",
                "content": "",
                "priority": "P0",
                "source": "今日头条，2026-06-27",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "电动汽车/动力电池安全两项新国标实施",
                "content": "",
                "priority": "P0",
                "source": "上海证券报，2026-07-02",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "宁德时代签5000台重卡换电协议",
                "content": "",
                "priority": "P1",
                "source": "第一财经，2026-07-02",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "EMB被业内视为2026年量产元年",
                "content": "",
                "priority": "P1",
                "source": "浙商证券，2026-06-18",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "market",
            "title": "市场/价格",
            "items": [
              {
                "title": "碳酸锂期货LC主力",
                "content": "价格：164560元/吨\n涨跌：+7260元/吨（+4.62%），两日累计涨幅近13%\n来源：上海证券报，2026-07-02",
                "priority": "P0",
                "source": "上海证券报，2026-07-02",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "电池级碳酸锂现货",
                "content": "价格：159400元/吨\n涨跌：+3250元/吨\n来源：中商信息CCM，2026-07-01",
                "priority": "P0",
                "source": "中商信息CCM，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "氢氧化锂(工业级)西南现货",
                "content": "价格：134600元/吨\n涨跌：+6700元/吨（+5.24%）\n来源：同花顺，2026-07-01",
                "priority": "P1",
                "source": "同花顺，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "WTI原油期货",
                "content": "价格：68.58美元/桶\n涨跌：-0.92美元（-1.32%）\n来源：每日经济新闻，2026-07-01",
                "priority": "P1",
                "source": "每日经济新闻，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "布伦特原油期货",
                "content": "价格：71.57美元/桶\n涨跌：-1.38美元（-1.89%）\n来源：每日经济新闻，2026-07-01",
                "priority": "P1",
                "source": "每日经济新闻，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "尿素期货UR2609",
                "content": "价格：1723元/吨\n涨跌：-17元/吨（-0.98%），最高1734、最低1720\n来源：曲合期货，2026-07-01",
                "priority": "P1",
                "source": "曲合期货，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "尿素现货基准价",
                "content": "价格：1813.75元/吨\n涨跌：基差+90.75元/吨\n来源：生意社，2026-07-01",
                "priority": "P1",
                "source": "生意社，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "乙二醇MEG",
                "content": "价格：4100元/吨\n涨跌：持平\n来源：奥尊复合新材料，2026-07-01",
                "priority": "P1",
                "source": "100ppi，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "环氧丙烷",
                "content": "价格：7650元/吨（湖北）\n来源：Chemicalbook，2026-06-26",
                "priority": "P1",
                "source": "Chemicalbook，2026-06-26",
                "url": "",
                "date": "2026-06-26"
              },
              {
                "title": "丙二醇（山东）",
                "content": "价格：8550-9500元/吨\n涨跌：6月18日较17日跌-3.39%\n来源：隆众资讯，2026-06-18",
                "priority": "P1",
                "source": "隆众资讯，2026-06-18",
                "url": "",
                "date": "2026-06-18"
              },
              {
                "title": "制冷剂R32",
                "content": "价格：63000元/吨（含税出厂价）\n来源：氟务在线，2026-06-15",
                "priority": "P1",
                "source": "证券日报，2026-06-15",
                "url": "",
                "date": "2026-06-15"
              },
              {
                "title": "制冷剂R134a",
                "content": "价格：64000元/吨（新能源汽车常用）\n来源：氟务在线，2026-06-15",
                "priority": "P1",
                "source": "证券日报，2026-06-15",
                "url": "",
                "date": "2026-06-15"
              },
              {
                "title": "国内成品油本轮调价预期",
                "content": "价格：92号汽油预计下调0.66元/升\n依据：WTI原油较3月高点下跌约27%，本轮计价周期进度完成70%\n来源：财联社，2026-07-01",
                "priority": "P2",
                "source": "新浪网，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "policy",
            "title": "政策/行业",
            "items": [
              {
                "title": "制动液新国标GB12981-2025实施",
                "content": "7月1日实施，新增HZY7最高等级，-40℃运动黏度不大于750mm/s、平衡回流沸点不低于260℃，专为高制动负荷/长续航新能源车设计；HZY3至HZY6全部增加储备碱度要求，强化长效抗酸防腐能力。",
                "priority": "P0",
                "source": "今日头条，2026-06-27",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "电动汽车/动力电池安全新国标实施",
                "content": "7月1日起《电动汽车安全要求》GB18384-2025与《电动汽车用动力蓄电池安全要求》GB38031-2025两项强制性国标正式实施，行业人士预计新能源汽车自燃率将比燃油车低一个数量级。",
                "priority": "P0",
                "source": "上海证券报，2026-07-02",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "五部门启动2026年新能源汽车下乡",
                "content": "工信部、商务部等五部门6月29日联合启动2026年新能源汽车下乡活动，将拉动城乡新能源汽车销量及配套冷却液、制动液等汽车化学品需求。",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "汽车制动分标委通过3项新国标",
                "content": "全国汽车标准化技术委员会制动分标委审查并通过《轻型汽车制动辅助系统BAS性能要求》《乘用车用电子助力器总成性能要求》《乘用车集成式制动控制总成性能要求》3项标准，并审议通过6项国/行标立项。",
                "priority": "P1",
                "source": "全国汽车标准化技术委员会，2026-05-27",
                "url": "",
                "date": "2026-05-27"
              },
              {
                "title": "新型能源体系建设十五五规划印发",
                "content": "国家发改委、国家能源局印发《新型能源体系建设\"十五五\"规划》，2030年风电和太阳能发电装机比重超50%、非化石能源消费比重达25%，新型电力系统初步建成。",
                "priority": "P2",
                "source": "经济参考报，2026-07-02",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "enterprise",
            "title": "企业动态",
            "items": [
              {
                "title": "统一与宁家服务发布零碳后市场方案",
                "content": "统一石化与宁德时代宁家服务在2026全球技术大会上联合发布行业首个零碳后市场流体解决方案，针对新能源维保体系痛点推出冷却液、制动液、混动机油等系列联名产品，实现新能源车全生命周期零碳保障。",
                "priority": "P0",
                "source": "汽配圈，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "快准车服与路博润签S计划合作",
                "content": "国内汽配供应链平台快准车服与全球特种化学品巨头路博润签署S计划合作协议，统一润滑油承担研发制造与品控交付，三方共建适配中国路况的高端润滑油研发制造闭环。",
                "priority": "P1",
                "source": "汽配圈，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "诺亚液冷启动IPO",
                "content": "国产氟化液龙头诺亚液冷启动IPO，金石资源年初斥资2.57亿元完成15.71%股权收购成为二股东，签订萤石、无水氟化氢长期供货协议，构建\"萤石矿产-基础氟化物-氟化冷却液\"垂直产业链。",
                "priority": "P1",
                "source": "网易，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "巨化股份全氟聚醚冷却液产能爬坡",
                "content": "巨化股份在投资者接待日披露，全氟聚醚冷却液1000吨/年装置正处于产能爬坡阶段，产品覆盖液冷用氢氟醚、全氟聚醚、全系制冷剂等，FFKM全氟醚橡胶已少量供货半导体领域。",
                "priority": "P1",
                "source": "巨化股份公告，2026-06-30",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "tech",
            "title": "技术/产品",
            "items": [
              {
                "title": "英伟达Rubin平台100%全液冷方案",
                "content": "英伟达6月21日发布的Vera Rubin平台为全球首个100%全液冷AI计算平台，摒弃传统风液混合散热，采用45℃、75%水+25%丙二醇混合冷却介质，设施冷却用水量降至接近零，推动液冷从局部覆盖走向全面应用。",
                "priority": "P0",
                "source": "东方证券研报，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "润禾材料浸没式冷却液具备量产条件",
                "content": "润禾材料浸没式冷却液已完成中试及试生产、具备量产条件，已与125家客户送样验证、5家通过验证开始供货，预计2026年出货2000吨；三防漆已与13家客户完成验证、2家签订订单。",
                "priority": "P1",
                "source": "润禾材料公告，2026-06-17",
                "url": "",
                "date": "2026-06-17"
              },
              {
                "title": "EMB被业内视为2026年量产元年",
                "content": "浙商证券研报指出，EMB彻底取消传统液压管路和制动液，2026年1月1日实施的国标GB21670-2025已对EMB提出标准化要求，2026年有望成为EMB量产元年；EMB单价约3500元/车，EHB均价1800-2500元/车。",
                "priority": "P1",
                "source": "浙商证券，2026-06-18",
                "url": "",
                "date": "2026-06-18"
              },
              {
                "title": "中车株洲所发布12.5MW储能升压一体机",
                "content": "6月23日德国慕尼黑The smarter E Europe 2026展会，中车株洲所发布12.5MW/13.8MW储能升压变流一体机作为重磅首发产品，配套液冷电池舱，定义大储集成新标杆。",
                "priority": "P2",
                "source": "索比光伏网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "project",
            "title": "项目/招标",
            "items": [
              {
                "title": "宁德时代与极兔签5000台重卡换电",
                "content": "宁德时代与极兔速递签署5000台重卡换电协议，标志着动力电池应用从乘用车向商用物流领域规模化渗透，打开B端换电增量市场，直接拉动商用车冷却液/热管理液需求。",
                "priority": "P0",
                "source": "第一财经，2026-07-02",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "中石化签40万吨SAF项目设计合同",
                "content": "中石化宁波工程与Allied Biofuels FE LLC签署乌兹别克斯坦可持续航空燃料项目前端工程设计及详细设计合同，年产SAF 40万吨、总投资约61亿美元，配套光伏/绿氢/储能设施。",
                "priority": "P1",
                "source": "索比光伏网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "比亚迪签波兰600MW/2.4GWh储能项目",
                "content": "比亚迪签约波兰600MW/2.4GWh最大储能项目，证明中国企业在海外大型能源基建中的竞争力，对冲国内产能过剩焦虑，有助于提升海外营收占比预期，带动配套冷却液订单。",
                "priority": "P1",
                "source": "第一财经，2026-07-02",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "小鹏马来西亚EPMB工厂正式投产",
                "content": "6月24日小鹏汽车宣布全球第三个海外基地马来西亚EPMB工厂正式投产，首批小鹏G6车型组装下线，海外本地化扩产提速带动出海配套化学品订单。",
                "priority": "P2",
                "source": "东方证券研报，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "tips",
            "title": "专属提示",
            "items": [
              {
                "title": "💰 机会",
                "content": "制动液新国标GB12981-2025实施+HZY7等级上线+新能源车下乡启动，制动液和冷却液迎来产品升级与场景扩容双重窗口；英伟达Rubin平台100%全液冷锁定丙二醇，国产替代加速；EHB/EMB渗透率提升带动单车价值上行。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "⚠️ 风险",
                "content": "尿素行业开工率超91%、日产量维持21万吨高位，企业库存持续累积，价格反弹持续性存疑；丙二醇价格6月已跌3.4%，制冷剂/液冷原料成本端出现松动；EMB对传统制动液形成中长期替代压力。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "📋 行动建议",
                "content": "抢新国标切换窗口，HZY3-HZY7全系列提前完成认证并向渠道铺货；新能源低电导冷却液加紧头部车企送样验证；跟踪比亚迪/小鹏/极兔等出海项目对应冷却液配套订单；把握HZY7最高等级切入红利期。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "👁️ 重点关注",
                "content": "聚焦四线：其一，新国标GB12981-2025实施后HZY7认证进度与替代节奏；其二，宁德时代5000台重卡换电项目冷却液配套落地；其三，巨化/润禾/诺亚等国产氟化液玩家IPO与产能爬坡；其四，尿素库存拐点与丙二醇液冷订单兑现。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              }
            ]
          }
        ],
        "updated_at": "2026-07-02"
      },
      "felt": {
        "bu_name": "法恩莱特事业部",
        "sections": [
          {
            "dim": "topnews",
            "title": "今日关注",
            "items": [
              {
                "title": "碳酸锂期货两日涨13%创盘面新高",
                "content": "",
                "priority": "P0",
                "source": "上海证券报，2026-07-01",
                "url": "https://k.sina.com.cn/article_7880068204_1d5b04c6c06801ajzs.html",
                "date": "2026-07-01"
              },
              {
                "title": "7月1日两项动力电池强制性国标实施",
                "content": "",
                "priority": "P0",
                "source": "上海证券报，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "宁德时代枧下窝锂矿10万吨产能复产",
                "content": "",
                "priority": "P0",
                "source": "新浪网，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "电解液赛道签约潮 宁德楚能锁单近180万吨",
                "content": "",
                "priority": "P1",
                "source": "证券时报，2026-07-01",
                "url": "https://www.stcn.com/article/detail/3967634.html",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "market",
            "title": "市场/价格",
            "items": [
              {
                "title": "碳酸锂期货主力LC2609",
                "content": "价格：164560元/吨\n涨跌：+7260元/吨（+4.62%）\n来源：东方财富Choice数据，2026-07-01",
                "priority": "P0",
                "source": "东方财富Choice数据，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "电池级碳酸锂现货中间价",
                "content": "价格：159400元/吨\n涨跌：+3250元/吨（早盘）\n来源：中商信息CCM，2026-07-01",
                "priority": "P0",
                "source": "中商信息CCM，2026-07-01",
                "url": "https://www.sohu.com/a/1044512089_122014422",
                "date": "2026-07-01"
              },
              {
                "title": "西南氢氧化锂工业级现货",
                "content": "价格：134600元/吨\n涨跌：+6700元/吨（+5.24%）\n来源：同花顺iFinD，2026-07-01",
                "priority": "P1",
                "source": "同花顺iFinD，2026-07-01",
                "url": "http://goodsfu.10jqka.com.cn/20260702/c677881678.shtml",
                "date": "2026-07-01"
              },
              {
                "title": "六氟磷酸锂电池级基准价",
                "content": "价格：107000元/吨\n涨跌：当日持平\n来源：生意社，2026-07-01",
                "priority": "P0",
                "source": "生意社，2026-07-01",
                "url": "https://www.100ppi.com/news/detail-20260701-5859070.html",
                "date": "2026-07-01"
              },
              {
                "title": "六氟磷酸锂国产现货均价",
                "content": "价格：10.63万元/吨\n区间：10.25-11.00万元/吨\n来源：长江有色金属网，2026-07-01",
                "priority": "P0",
                "source": "上海证券报·中国证券网，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "六氟磷酸锂长协订单价",
                "content": "价格：10.5-11.2万元/吨\n描述：电解液大厂年度锁价，普遍低于散单\n来源：东方财富网，2026-07-01",
                "priority": "P1",
                "source": "东方财富网，2026-07-01",
                "url": "https://caifuhao.eastmoney.com/news/20260624230704831748950",
                "date": "2026-07-01"
              },
              {
                "title": "VC添加剂现货价",
                "content": "价格：14.50万元/吨\n趋势：受突发事件个别VC企业出货受影响、库存偏低，价格坚挺上行\n来源：纵横新能源，2026-07-01",
                "priority": "P1",
                "source": "纵横新能源，2026-07-01",
                "url": "https://mp.weixin.qq.com/s/f2bwN2G47rto0Ef9mZdrig",
                "date": "2026-07-01"
              },
              {
                "title": "电解液磷酸铁锂型现货",
                "content": "价格：28500元/吨\n周环比：持平\n月环比：+3.64%\n来源：同花顺iFinD，2026-07-01",
                "priority": "P1",
                "source": "同花顺iFinD，2026-07-01",
                "url": "http://field.10jqka.com.cn/20260701/c677870614.shtml",
                "date": "2026-07-01"
              },
              {
                "title": "电解液三元圆柱2600mAh现货",
                "content": "价格：27250元/吨\n周环比：持平\n月环比：+3.81%\n来源：同花顺iFinD，2026-07-01",
                "priority": "P1",
                "source": "同花顺iFinD，2026-07-01",
                "url": "http://field.10jqka.com.cn/20260701/c677870614.shtml",
                "date": "2026-07-01"
              },
              {
                "title": "电解液高电压4.35V型现货",
                "content": "价格：35000元/吨\n周环比：持平\n月环比：+2.94%\n来源：同花顺iFinD，2026-07-01",
                "priority": "P1",
                "source": "同花顺iFinD，2026-07-01",
                "url": "http://field.10jqka.com.cn/20260701/c677870614.shtml",
                "date": "2026-07-01"
              },
              {
                "title": "电池级DMC溶剂价格",
                "content": "价格：5500元/吨以上\nEMC：7500-8000元/吨\nEC：4850元/吨\n来源：石大胜华访谈纪要，2026-07-01",
                "priority": "P1",
                "source": "雪球网，2026-07-01",
                "url": "https://xueqiu.com/9989253009/382647478",
                "date": "2026-07-01"
              },
              {
                "title": "WTI 8月原油期货",
                "content": "价格：68.58美元/桶\n涨跌：-0.92美元/桶（-1.32%）\n来源：每日经济新闻，2026-07-01",
                "priority": "P1",
                "source": "每日经济新闻，2026-07-01",
                "url": "http://www.nbd.com.cn/rss/eastmoney/articles/4444562.html",
                "date": "2026-07-01"
              },
              {
                "title": "布伦特9月原油期货",
                "content": "价格：71.57美元/桶\n涨跌：-1.38美元/桶（-1.89%）\n来源：中国基金报，2026-07-01",
                "priority": "P1",
                "source": "中国基金报，2026-07-01",
                "url": "https://www.chnfund.com/article/96a19e49-6750-2a75-e624-3a223135e7f8",
                "date": "2026-07-01"
              },
              {
                "title": "六氟磷酸锂6月产量排产",
                "content": "产量：32970吨\n环比：+4%\n来源：紫金天风期货，2026-07-01",
                "priority": "P1",
                "source": "紫金天风期货，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "电解液5月产量排产",
                "content": "产量：263480吨\n环比：+6%\n来源：SMM，2026-07-01",
                "priority": "P1",
                "source": "紫金天风期货，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "policy",
            "title": "政策/行业",
            "items": [
              {
                "title": "7月1日两项强制性动力电池新国标实施",
                "content": "《电动汽车安全要求》（GB18384-2025）和《电动汽车用动力蓄电池安全要求》（GB38031-2025）正式实施，对热扩散测试技术要求修订加严，业内预计新国标实施后中国新能源汽车自燃率将比燃油车低一个数量级，倒逼电解液高安全配方与阻燃添加剂升级。",
                "priority": "P0",
                "source": "上海证券报，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "7月1日储能电站安全新规落地",
                "content": "新规首次将储能电站涉网性能不达标、消防安全隐患纳入电力重大事故隐患范畴，对220千伏及以上高压并网大型储能项目制定刚性管控门槛；锂电储能因电解液易燃、单点故障易诱发连锁热扩散，土建消防温控配套投资大幅上涨，安全可靠性能成业主招标首要核心标准。",
                "priority": "P0",
                "source": "新能源网，2026-07-01",
                "url": "http://www.china-nengyuan.com/news/250923.html",
                "date": "2026-07-01"
              },
              {
                "title": "巴西ANATEL固定式锂电池10月12日起强制认证",
                "content": "巴西ANATEL第5314号法令规定固定式应用锂离子二次电池于2026年10月12日起强制执行，适用于高放电强度下运行且可配套通信设备安装的固定式应用锂离子二次电池，技术基准采用ABNT NBR 16975:2021与ABNT NBR 16976:2021，中国锂电产业链出海需提前完成认证布局。",
                "priority": "P1",
                "source": "山西省商务厅，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "十五五新型能源体系建设规划发布",
                "content": "国家发改委、国家能源局印发《新型能源体系建设十五五规划》，明确2030年非化石能源消费比重达25%、风电和太阳能发电装机比重超50%，新型储能作为关键支撑，与锂电池/钠电池产业链协同效应进一步强化。",
                "priority": "P1",
                "source": "经济参考报，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "国家反内卷顶层设计持续夯实",
                "content": "工信部等部委牵头组织引导锂电产业链反内卷式竞争，限制非理性产能扩张，倡导优质产能发展；2025年7月新《矿产资源法》将锂列为战略性矿产实行统一审批管理，开采门槛大幅提高，电解液行业盈利水平有望实质性修复。",
                "priority": "P1",
                "source": "上海证券报·中国证券网，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "enterprise",
            "title": "企业动态",
            "items": [
              {
                "title": "永太科技上半年净利预增351%-461%",
                "content": "永太科技发布2026年半年度业绩预告，受益于新能源汽车及储能市场快速增长，公司六氟磷酸锂、LiFSI、VC及电解液等锂电材料核心产品销量与价格同比提升；2025年底新投产的5000吨/年VC产能稳步释放，营收规模与经营效益同步扩大。",
                "priority": "P0",
                "source": "永太科技公告，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "宏源药业6000吨六氟磷酸锂产线6月投产",
                "content": "宏源药业6000吨六氟磷酸锂新建产线已于6月投产，下半年产能逐步爬坡释放；叠加现有1万吨产能，年末总产能将达1.8-2.0万吨。公司六氟磷酸锂产品合作客户超30家，长期为比亚迪核心供应商。",
                "priority": "P0",
                "source": "上海证券报·中国证券网，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "天际股份3万吨六氟磷酸锂二期试生产",
                "content": "天际股份6月17日公告，3万吨六氟磷酸锂项目二期工程已完成主体建设及设备安装、调试，试生产方案通过专家评审，达到试生产条件并计划近日开展试生产，叠加原产能后行业总供应能力将明显抬升。",
                "priority": "P1",
                "source": "上海证券报·中国证券网，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "永太科技8亿元投建5万吨VC及配套项目",
                "content": "永太科技子公司内蒙古永太化学有限公司拟以8亿元投资建设年产5万吨VC及配套工程项目，公司2026年锂电材料板块新增产能规划还包括永太高新六氟磷酸锂技改扩建、永太高新5000吨/年新型补锂剂建设、盐城永太20万吨/年电解液等项目，一体化布局持续完善。",
                "priority": "P1",
                "source": "上海证券报·中国证券网，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "天赐材料美国工厂2025年12月启动土建",
                "content": "天赐材料在摩洛哥和美国启动产能建设，美国工厂于2025年12月开始土建施工，2025年公司以72万吨出货量连续十年排名全球第一、市场份额提升至32.2%；新宙邦、瑞泰新材亦推进波兰二期、中东、美国等海外项目，电解液龙头全球化布局加速。",
                "priority": "P1",
                "source": "上海证券报·中国证券网，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "tech",
            "title": "技术/产品",
            "items": [
              {
                "title": "中车株洲所发布12.5MW储能升压变流一体机",
                "content": "当地时间6月23日，中车株洲所在The smarter E Europe 2026发布12.5MW/13.8MW储能升压变流一体机，搭配6.X液冷电池舱，重新定义大储集成新标杆，配套展示储能系统、户外储能一体柜、光伏逆变器、储能变流器、绿电制氢系统等多款面向海外的创新产品。",
                "priority": "P1",
                "source": "索比光伏网，2026-07-01",
                "url": "https://news.solarbe.com/202606/29/50025041.html",
                "date": "2026-07-01"
              },
              {
                "title": "钠电正极材料部分厂商酝酿500-1000元/吨提价",
                "content": "本周钠电正极材料市场\"提价意愿与落地博弈\"并存：部分厂商计划上调报价500-1000元/吨；亦有企业维持原价通过分梯度定价提升竞争力，磷酸铁采购成本持续走高，新报价已逼近行业成本-售价平衡线，关注下半年钠电产业链放量节奏。",
                "priority": "P1",
                "source": "SMM锂电回收，2026-07-01",
                "url": "https://mp.weixin.qq.com/s/mn4RqTJ5KPhfhEcp9eeWUQ",
                "date": "2026-07-01"
              },
              {
                "title": "氢能燃料电池2000小时动态循环测试电压衰减不超3%",
                "content": "中汽中心新能源检验中心发布国际首个氢能与燃料电池产品耐久性技术验证项目阶段性成果，燃料电池堆2000小时动态循环测试电压衰减不超3%，氢能无人机续航超3小时、氢能两轮车单次充氢续航突破80公里，验证长周期复杂工况下稳定运行能力。",
                "priority": "P2",
                "source": "天津日报，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              }
            ]
          },
          {
            "dim": "project",
            "title": "项目/招标",
            "items": [
              {
                "title": "电解液赛道宁德楚能长协锁单逼近180万吨",
                "content": "6月以来电解液赛道密集签约：宁德时代接连与新宙邦、永太科技敲定长协大单，楚能新能源大幅上调与天赐材料合作规模，两家电池厂累计锁单量逼近180万吨；近一年行业官宣的电解液长单总量已超400万吨，头部电池厂加速锁定长期产能。",
                "priority": "P0",
                "source": "证券时报，2026-07-01",
                "url": "https://www.stcn.com/article/detail/3967634.html",
                "date": "2026-07-01"
              },
              {
                "title": "宁德时代与极兔签约5000台重卡换电协议",
                "content": "宁德时代与极兔速递签署5000台重卡换电协议，标志着动力电池应用从乘用车向商用物流领域规模化渗透，打开B端换电增量市场空间；同期比亚迪签约波兰600MW/2.4GWh最大储能项目，中国储能出海竞争力再获验证。",
                "priority": "P1",
                "source": "第一财经资讯，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "中石化签约乌兹别克斯坦40万吨SAF项目",
                "content": "中石化宁波工程公司与Allied Biofuels FE LLC签署乌兹别克斯坦可持续航空燃料项目前端工程设计及详细设计合同，项目年产SAF 40万吨、总投资约61亿美元，配套大型光伏、绿氢、储能设施，是中亚首个全产业链生物航油综合体。",
                "priority": "P1",
                "source": "索比光伏网，2026-07-01",
                "url": "https://h2.solarbe.com/news/20260629/50025043.html",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "tips",
            "title": "专属提示",
            "items": [
              {
                "title": "💰 机会",
                "content": "7月电解液产业链排产持续向好，6F 6月排产+4%、电解液5月排产+6%，叠加宁德+楚能头部电池厂长协锁单逼近180万吨锁定下半年需求；碳酸锂期货两日涨13%创盘面新高、宁德枧下窝10万吨产能复产支撑锂盐价格，电池级6F有望迎来成本与需求双轮拉动的盈利修复窗口。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "⚠️ 风险",
                "content": "天际股份3万吨6F二期+宏源药业6000吨6F产线集中投产，下半年6F供应增量预期压制散单价格；储能安全新规7月1日落地大幅推高锂电储能项目土建消防温控配套成本，叠加VC因突发事件涨价、FEC现价6万元/吨原料成本传导存在滞后，电解液毛利率回升节奏仍存不确定性。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "📋 行动建议",
                "content": "短期重点跟踪六氟磷酸锂107000元/吨生意社基准价与10.63万元/吨长江有色均价的联动节奏，逢回调锁定VC/FEC等关键添加剂长协供货；紧扣宁德+楚能+比亚迪+天赐材料长协订单标的，把握头部一体化企业产能与海外认证优势。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "👁️ 重点关注",
                "content": "聚焦四线：其一，6F 7月排产兑现度与107000元/吨生意社基准攻防；其二，宁德枧下窝7月满负荷运行爬坡对锂盐供给的扰动幅度；其三，7月1日储能安全新规执行细则与锂电储能中标价格走势；其四，巴西ANATEL 10月12日强制认证对中国电解液出口的拉动节奏。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              }
            ]
          }
        ],
        "updated_at": "2026-07-02"
      },
      "kelan": {
        "bu_name": "可兰素事业部",
        "sections": [
          {
            "dim": "topnews",
            "title": "今日关注",
            "items": [
              {
                "title": "尿素3季度指导价上调100-210元",
                "content": "",
                "priority": "P0",
                "source": "华泰期货日报，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "碳酸锂期货两日累涨近13%",
                "content": "",
                "priority": "P1",
                "source": "网易/期货日报，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "宁德时代与极兔签约5000台重卡换电",
                "content": "",
                "priority": "P1",
                "source": "第一财经，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "WTI原油跌1.32%报68.58美元",
                "content": "",
                "priority": "P2",
                "source": "中国基金报，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              }
            ]
          },
          {
            "dim": "market",
            "title": "市场/价格",
            "items": [
              {
                "title": "碳酸锂期货LC2609主力（7月1日）",
                "content": "价格：164560元/吨\n涨跌：+7260元/吨（+4.62%，两日累涨近13%）\n来源：网易/期货日报，2026-07-02",
                "priority": "P0",
                "source": "网易，2026-07-02",
                "url": "https://www.163.com/dy/article/L0PTF32J05539T4L.html",
                "date": "2026-07-01"
              },
              {
                "title": "WTI原油期货（7月2日）",
                "content": "价格：68.58美元/桶\n涨跌：-0.92美元（-1.32%）\n来源：中国基金报，2026-07-02",
                "priority": "P1",
                "source": "中国基金报，2026-07-02",
                "url": "https://www.chnfund.com/article/96a19e49-6750-2a75-e624-3a223135e7f8",
                "date": "2026-07-02"
              },
              {
                "title": "布伦特原油期货（7月2日）",
                "content": "价格：71.57美元/桶\n涨跌：-1.38美元（-1.89%）\n来源：格隆汇/天粤资讯，2026-07-02",
                "priority": "P1",
                "source": "格隆汇，2026-07-02",
                "url": "https://www.tianyuezx.com/pages/info.aspx?zxid=2532649",
                "date": "2026-07-02"
              },
              {
                "title": "尿素期货UR2609主力（7月1日收盘）",
                "content": "价格：1723元/吨\n涨跌：-17元（-0.98%）\n来源：新浪财经，2026-07-01",
                "priority": "P0",
                "source": "新浪财经，2026-07-01",
                "url": "https://gu.sina.cn/ft/hq/nf.php?symbol=UR0",
                "date": "2026-07-01"
              },
              {
                "title": "山东小颗粒尿素出厂价（7月1日）",
                "content": "价格：1760-1790元/吨\n涨跌：+10元/吨\n来源：隆众资讯/搜狐，2026-07-01",
                "priority": "P0",
                "source": "搜狐，2026-07-01",
                "url": "https://www.sohu.com/a/1044327750_121124549",
                "date": "2026-07-01"
              },
              {
                "title": "河南小颗粒尿素出厂价（7月1日）",
                "content": "价格：1750-1800元/吨\n涨跌：基本持平\n来源：隆众资讯，2026-07-01",
                "priority": "P1",
                "source": "搜狐，2026-07-01",
                "url": "https://www.sohu.com/a/1044327750_121124549",
                "date": "2026-07-01"
              },
              {
                "title": "河北小颗粒尿素出厂价（7月1日）",
                "content": "价格：1760-1790元/吨\n涨跌：+20元/吨\n来源：隆众资讯/今日头条，2026-07-01",
                "priority": "P1",
                "source": "今日头条，2026-07-01",
                "url": "http://m.toutiao.com/group/7657438717249880610/",
                "date": "2026-07-01"
              },
              {
                "title": "山西中小颗粒尿素出厂价（7月1日）",
                "content": "价格：1660-1750元/吨\n涨跌：+20元/吨\n来源：隆众资讯，2026-07-01",
                "priority": "P1",
                "source": "今日头条，2026-07-01",
                "url": "http://m.toutiao.com/group/7657438717249880610/",
                "date": "2026-07-01"
              },
              {
                "title": "尿素行业日产（6月30日）",
                "content": "数据：21.44万吨\n涨跌：较上一工作日-0.29万吨；开工率89.84%\n来源：隆众资讯，2026-07-01",
                "priority": "P1",
                "source": "光大期货，2026-07-01",
                "url": "https://app.ebfcn.com",
                "date": "2026-06-30"
              },
              {
                "title": "尿素企业总库存（6月30日）",
                "content": "数据：113.36万吨\n涨跌：+4.78万吨；港口库存14.49万吨（-0.50）\n来源：华泰期货，2026-07-01",
                "priority": "P1",
                "source": "华泰期货日报，2026-07-01",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "生意社尿素基差（7月1日）",
                "content": "数据：基差90.75元/吨（现货1813.75-期货1723）\n来源：生意社，2026-07-01",
                "priority": "P2",
                "source": "生意社，2026-07-01",
                "url": "http://news.10jqka.com.cn/20260701/c677873815.shtml",
                "date": "2026-07-01"
              },
              {
                "title": "国内汽柴油7月3日调价预期",
                "content": "价格：预计汽油-820元/吨、柴油-790元/吨\n涨跌：92号汽油约-0.66元/升，95号约-0.70元/升\n来源：中新经纬/大众日报，2026-07-02",
                "priority": "P1",
                "source": "新浪网，2026-07-02",
                "url": "https://k.sina.com.cn/article/7857201856_1d45362c001907n5bi.html",
                "date": "2026-07-02"
              }
            ]
          },
          {
            "dim": "policy",
            "title": "政策/行业",
            "items": [
              {
                "title": "国六b全面实施，国七标准已征求意见",
                "content": "国六b标准已于2023年7月1日全面落地，2023年11月生态环境部发布《国家第七阶段机动车污染物排放标准（征求意见稿）》公开征求社会意见，国七时点日益临近；车用尿素作为SCR技术必需的消耗品，平均消耗量约为柴油使用量的5%-6%，国六阶段已驱动车用尿素消费基数明显抬升。",
                "priority": "P0",
                "source": "中证网，2026-04-28",
                "url": "https://epaper.cs.com.cn/zgzqb/html/2026-04/28/nw.D110000zgzqb_20260428_1-B171.htm",
                "date": "2026-04-28"
              },
              {
                "title": "氮肥工业协会发布3季度自律指导价",
                "content": "氮肥工业协会发布最新指导价，要求各企业参照国际主流价格申报，数量较大订单可适当下浮；小颗粒价格暂定不低于FOB 430美元/吨、车用和大颗粒暂定不低于440美元/吨的优先报批，5000吨以上订单结关后需提供船名备查，政策对国内行情形成\"保供稳价\"托底。",
                "priority": "P0",
                "source": "期货日报网，2026-06-26",
                "url": "http://www.qhrb.com.cn/articles/346425",
                "date": "2026-06-26"
              },
              {
                "title": "2026年3季度普通尿素行业指导价上调100-210元",
                "content": "2026年3季度普通尿素行业自律指导价整体上调100-210元/吨不等，原料端无烟煤1100元/吨维持高位，叠加夏肥用肥窗口期与出口政策灵活调整，对国内尿素价格形成阶段性支撑。",
                "priority": "P1",
                "source": "华泰期货日报，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "2025年新修订化肥商业储备办法正式落地",
                "content": "2024-2026年度《国家化肥商业储备管理办法》相较往年承储比例下调至不低于20%，单个标的下调至2-3万吨，储备周期延后一个月至次年6月30日，储备分布更趋分散化，便于更多企业参与承储，间接提升产业链对淡旺季价格波动的平滑能力。",
                "priority": "P2",
                "source": "浙商期货月报，2026-03-31",
                "url": "",
                "date": "2026-03-31"
              }
            ]
          },
          {
            "dim": "enterprise",
            "title": "企业动态",
            "items": [
              {
                "title": "湛江300万吨绿色低碳尿素示范项目启动",
                "content": "6月26日广东湛江东海岛启动50亿元、年产300万吨绿色低碳尿素示范项目，全部建成后预计年消纳工业CO2超220万吨、净减排140万吨，年营收突破100亿元；项目由中国平煤神马控股集团旗下河南能源化工国际贸易集团与河南省中原大化集团共同投建，并同步签署二、三期及延链补链项目合作框架协议，构建从原料到市场的完整国际闭环。",
                "priority": "P0",
                "source": "中国发展网，2026-06-30",
                "url": "http://www.chinadevelopment.com.cn/news/cj/2026/06/2002973.shtml",
                "date": "2026-06-30"
              },
              {
                "title": "全国首个尿素集装化运输试点落地中煤鄂能化",
                "content": "中煤鄂尔多斯能源化工有限公司尿素带托盘集装化列车顺利首发，实现袋装尿素铁路整托标准化装卸、机械化作业、一体化运输；装卸成本降幅约25%、单趟装车缩短1.5小时、年减少延时费用约25万元，货车周转频次提升至1.17倍，开启农资物流集约化、智能化、标准化新阶段。",
                "priority": "P1",
                "source": "中化新网，2026-06-24",
                "url": "http://www.ccin.com.cn/detail/0a98bdf3f70984caa4eb27b284d92b47/news",
                "date": "2026-06-24"
              },
              {
                "title": "比亚迪6月新能源车销量40.35万辆",
                "content": "比亚迪2026年6月新能源汽车销量40.3472万辆，去年同期38.2585万辆；本年累计销量180.8511万辆，同比下降15.72%。同时书记省长密集会见王传福，多个中西部及山东、陕西、四川等省份掀起\"争夺\"比亚迪招商潮，新能源汽车产业正从单一企业比拼向产业集群、产业链生态的全面较量转变。",
                "priority": "P1",
                "source": "上海证券报，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "宁德时代与极兔签约5000台重卡换电",
                "content": "宁德时代与极兔速递签署5000台重卡换电协议，标志着动力电池应用从乘用车向商用物流领域规模化渗透，打开B端换电增量空间；重卡电动化对车用尿素需求形成中长期替代压力，但存量国六柴油重卡仍支撑车用尿素基本盘，结构变化值得关注。",
                "priority": "P1",
                "source": "第一财经，2026-07-02",
                "url": "https://www.163.com/dy/article/L0Q4TOVE0519DDQ2.html",
                "date": "2026-07-02"
              }
            ]
          },
          {
            "dim": "tech",
            "title": "技术/产品",
            "items": [
              {
                "title": "中车株洲所\"光储氢\"全场景方案全球首发",
                "content": "当地时间6月23日，中车株洲所在德国慕尼黑The smarter E Europe 2026面向全球首发\"光储氢\"全场景方案，推出12.5MW/13.8MW储能升压变流一体机、6.X液冷电池舱、储能系统、户外储能一体柜、光伏逆变器、储能变流器、绿电制氢系统等创新产品，定义大储集成新标杆。",
                "priority": "P1",
                "source": "索比光伏网，2026-06-29",
                "url": "https://news.solarbe.com/202606/29/50025041.html",
                "date": "2026-06-29"
              },
              {
                "title": "中石化签约40万吨SAF项目设计合同",
                "content": "中石化宁波工程有限公司在第五届塔什干国际投资论坛与Allied Biofuels FE LLC签署乌兹别克斯坦可持续航空燃料（SAF）项目前端工程设计及详细设计合同，项目年产SAF 40万吨、总投资约61亿美元，配套光伏、绿氢、储能与绿色柴油产业链，碳减排效益突出。",
                "priority": "P1",
                "source": "索比光伏网，2026-06-29",
                "url": "https://h2.solarbe.com/news/20260629/50025043.html",
                "date": "2026-06-29"
              },
              {
                "title": "车用尿素高端化与定制化国产率突破88%",
                "content": "2026年高端尿素需求占比达30%，车用尿素高纯度制备技术实现突破、产品纯度达99.8%以上，全面满足国六排放标准要求；定制化专用尿素国产化率突破88%，可根据不同作物、土壤条件精准匹配养分，肥料利用率提升30%以上，技术升级与绿色转型同步推进。",
                "priority": "P1",
                "source": "报告大厅，2026-04-09",
                "url": "https://m.chinabgao.com/freereport/115248.html",
                "date": "2026-04-09"
              }
            ]
          },
          {
            "dim": "project",
            "title": "项目/招标",
            "items": [
              {
                "title": "比亚迪签约波兰600MW/2.4GWh储能项目",
                "content": "比亚迪在波兰拿下欧洲最大储能项目，标志中国企业在海外大型能源基建中竞争力突出，有助于对冲国内产能过剩焦虑、提升海外营收占比预期；项目与光伏上游多晶硅价格低位形成\"光伏+储能\"出海共振，对车用尿素出海与配套亦形成间接参考。",
                "priority": "P0",
                "source": "第一财经，2026-07-02",
                "url": "https://www.163.com/dy/article/L0Q4TOVE0519DDQ2.html",
                "date": "2026-07-02"
              },
              {
                "title": "工信部等五部门启动2026年新能源汽车下乡",
                "content": "工信部、商务部等五部门联合启动2026年新能源汽车下乡活动，进一步推动下沉市场需求释放；新能源汽车保有量持续抬升将逐步挤压传统柴油商用车存量，叠加货车电动化与燃气化转型加速，对车用尿素消费基数形成中长期替代压力，需提前布局差异化高端产品。",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "https://www.china5e.com/news/news-1205671-1.html",
                "date": "2026-06-29"
              },
              {
                "title": "中煤鄂能化尿素带托盘集装化列车首发",
                "content": "中国国家铁路集团有限公司牵头、中煤能源集团参与的全国首个尿素带托一体化铁路运输科研课题首发任务在内蒙古苏里格图克项目区完成；项目配套智能托盘搭载专业通讯模块，依托北斗卫星定位技术实现自动盘点、实时追踪、溯源查询等智能化功能，推动农资物流降本增效。",
                "priority": "P1",
                "source": "中化新网，2026-06-24",
                "url": "http://www.ccin.com.cn/detail/0a98bdf3f70984caa4eb27b284d92b47/news",
                "date": "2026-06-24"
              }
            ]
          },
          {
            "dim": "tips",
            "title": "专属提示",
            "items": [
              {
                "title": "💰 机会",
                "content": "尿素3季度指导价上调100-210元/吨，山东等主产区出厂价止跌反弹10-20元/吨，叠加夏季玉米追肥刚需与7月出口窗口临近；高端车用尿素国产率突破88%，差异化产品溢价空间打开。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "⚠️ 风险",
                "content": "尿素行业日产量21.44万吨持续高位，企业库存113.36万吨周环比再增4.78万吨，供应宽松格局未根本扭转；货车电动化与燃气化加速叠加重卡换电5000台签约，传统柴油车基数中长期承压，车用尿素需求增速面临放缓压力。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "📋 行动建议",
                "content": "短期紧盯山东/河南/河北出厂价能否站稳1800元/吨及UR2609主力在1700-1800元/吨区间方向选择，逢回调分批锁定原料库存；中长期聚焦差异化高端配方与智能加注服务，规避低端同质化价格战，对冲新能源重卡对柴油车用尿素的长期替代。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "👁️ 重点关注",
                "content": "聚焦四线：①7月3日国内汽柴油调价窗口落地，柴油-790元/吨预期能否兑现；②国七排放标准征求意见稿进度与OBD对车用尿素消耗量强化；③出口配额下放节奏与氮肥协会430/440美元/吨FOB指导价执行；④重卡换电签约对柴油重卡基数冲击。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              }
            ]
          }
        ],
        "updated_at": "2026-07-02"
      },
      "lpsd": {
        "bu_name": "龙蟠时代事业部",
        "sections": [
          {
            "dim": "topnews",
            "title": "今日关注",
            "items": [
              {
                "title": "枧下窝锂矿复产带动碳酸锂两日涨13%",
                "content": "",
                "priority": "P0",
                "source": "证券日报，2026-07-01",
                "url": "https://wap.eastmoney.com/a/202606303788616763.html",
                "date": "2026-07-01"
              },
              {
                "title": "电池新国标GB18384/GB38031实施",
                "content": "",
                "priority": "P0",
                "source": "上海证券报，2026-07-02",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "比亚迪签约波兰600MW/2.4GWh储能",
                "content": "",
                "priority": "P1",
                "source": "第一财经资讯，2026-07-02",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "宁德时代+极兔5000台重卡换电",
                "content": "",
                "priority": "P1",
                "source": "第一财经资讯，2026-07-02",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "market",
            "title": "市场/价格",
            "items": [
              {
                "title": "碳酸锂期货LC2609主力7月1日",
                "content": "价格：164,560元/吨\n涨跌：+7,260元/吨（+4.62%）\n来源：东方财富，2026-07-01",
                "priority": "P0",
                "source": "东方财富，2026-07-01",
                "url": "https://wap.eastmoney.com/a/202606303788616763.html",
                "date": "2026-07-01"
              },
              {
                "title": "SMM电池级碳酸锂指数7月1日",
                "content": "价格：156,580元/吨\n涨跌：+6,580元/吨\n来源：SMM，2026-07-01",
                "priority": "P0",
                "source": "上海有色网，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "MMLC电池级碳酸锂早盘7月1日",
                "content": "价格：159,400元/吨\n涨跌：+3,250元/吨\n来源：Mysteel，2026-07-01",
                "priority": "P1",
                "source": "Mysteel，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "6%锂精矿CIF澳洲7月1日",
                "content": "价格：2,225美元/吨\n涨跌：+45美元/吨\n来源：SMM，2026-07-01",
                "priority": "P0",
                "source": "上海有色网，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "工业级碳酸锂7月1日",
                "content": "价格：147,000-158,000元/吨\n涨跌：+4,750元/吨\n来源：SMM，2026-07-01",
                "priority": "P1",
                "source": "上海有色网，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "WTI原油期货7月2日",
                "content": "价格：68.58美元/桶\n涨跌：-0.92美元/桶（-1.32%）\n来源：中国基金报，2026-07-02",
                "priority": "P1",
                "source": "中国基金报，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "布伦特原油期货7月2日",
                "content": "价格：71.57美元/桶\n涨跌：-1.38美元/桶（-1.89%）\n来源：中国基金报，2026-07-02",
                "priority": "P1",
                "source": "中国基金报，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "尿素UR2609主力7月1日",
                "content": "价格：1,723元/吨\n涨跌：-17元/吨（-0.98%）\n来源：南方财经网，2026-07-01",
                "priority": "P1",
                "source": "南方财经网，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "山东小颗粒尿素出厂价6月30日",
                "content": "价格：1,810元/吨（持平）\n行业开工率：89.84%\n行业日产：21.44万吨\n来源：光大期货，2026-07-01",
                "priority": "P1",
                "source": "光大期货，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "锂盐厂开工率与排产",
                "content": "上周碳酸锂产量环比+289吨至27,450吨，锂盐厂周度开工率56.01%，6月排产环比继续上升，6月中国电池企业总排产预计266.5GWh，环比+10.76%。",
                "priority": "P1",
                "source": "长江期货，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "高仓单持续压制盘面",
                "content": "前一交易日碳酸锂仓单48,731手，环比+242手，交易所高仓单压力持续，叠加枧下窝复产增量、津巴布韦6月底到港预期，对盘面形成供给端压制。",
                "priority": "P1",
                "source": "东方财富，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "锂盐厂锁货9月原料供给",
                "content": "电池级碳酸锂市场价上调5,200元/吨，区间160,300-163,800元/吨；大型锂盐厂锁货较快已开始对9月原料供给进行锁定，贸易商锂盐流通库存低。",
                "priority": "P1",
                "source": "我的钢铁网，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "policy",
            "title": "政策/行业",
            "items": [
              {
                "title": "电池新国标7月1日起正式实施",
                "content": "《电动汽车安全要求》GB18384-2025与《电动汽车用动力蓄电池安全要求》GB38031-2025两项强制性国家标准7月1日起正式实施，新增底部撞击、快充循环后安全测试等项目，行业人士认为新国标实施后中国新能源车自燃率将比燃油车低一个数量级，倒逼电池材料体系安全升级。",
                "priority": "P0",
                "source": "上海证券报，2026-07-02",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "矿产资源法实施条例重塑锂资源",
                "content": "《中华人民共和国矿产资源法实施条例》6月15日起施行，将锂等36种矿产列入国家级战略性矿产目录，锂矿探采矿权审批权限上收至国家层面，国内锂矿无序供给将得到约束，行业合规门槛大幅抬高，长期稳定锂产业链供给格局。",
                "priority": "P0",
                "source": "中国化工报，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "广期所引入境外交易者",
                "content": "广州期货交易所6月18日公告，碳酸锂期货和期权合约已获中国证监会批准纳入境内特定品种并引入境外交易者，符合条件的境外客户可在引入日起参与交易，将提升碳酸锂国际定价影响力。",
                "priority": "P1",
                "source": "广州期货交易所，2026-06-18",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "五部门启动新能源汽车下乡",
                "content": "工信部、商务部等五部门6月29日联合启动2026年新能源汽车下乡活动，进一步释放下沉市场需求，对锂电产业链下游排产形成持续拉动。",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "enterprise",
            "title": "企业动态",
            "items": [
              {
                "title": "宁德时代枧下窝锂矿正式复产",
                "content": "宁德时代枧下窝锂矿6月29日晚获颁安全生产许可证并正式复产，该矿年产碳酸锂约10万吨，停产前占全国总产量8%-10%。6月30日已有一家锂云母冶炼厂收到宁德时代的锂云母精矿供应通知，若7月起满负荷运行，下半年可新增碳酸锂供应超4.5万吨。",
                "priority": "P0",
                "source": "证券日报，2026-07-01",
                "url": "https://wap.eastmoney.com/a/202606303788616763.html",
                "date": "2026-07-01"
              },
              {
                "title": "中矿资源产线临时停产检修",
                "content": "中矿资源部分锂盐产线于7月开启临时停产检修，叠加枧下窝复产初期或受限于尾矿库容量（市场预期实际产能或由10万吨/年降至3万吨/年），空头回补推升盘面，7月供需平衡进一步下调。",
                "priority": "P0",
                "source": "东方财富，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "比亚迪签约波兰最大储能项目",
                "content": "比亚迪签约波兰600MW/2.4GWh储能项目，标志中国企业在欧洲大型能源基建中竞争力提升，有助于对冲国内产能过剩焦虑，提升海外营收占比预期。",
                "priority": "P1",
                "source": "第一财经资讯，2026-07-02",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "宁德时代+极兔5000台重卡换电",
                "content": "宁德时代与极兔速递签署5000台重卡换电协议，标志着动力电池应用从乘用车向商用物流领域规模化渗透，打开B端换电增量市场，重卡换电迎来规模化拐点。",
                "priority": "P1",
                "source": "第一财经资讯，2026-07-02",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "三一重卡刷新出口最高纪录",
                "content": "三一重卡近期刷新我国新能源牵引车单次出口最高纪录，国产新能源商用车出海加速，与全球重卡电动化趋势形成共振。",
                "priority": "P2",
                "source": "中国能源网，2026-06-29",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "tech",
            "title": "技术/产品",
            "items": [
              {
                "title": "中车株洲所光储氢全场景全球首发",
                "content": "中车株洲所6月23日在德国慕尼黑The smarter E Europe 2026展会发布12.5MW/13.8MW储能升压变流一体机（配套6.X液冷电池舱）、储能系统、户外储能一体柜、光伏逆变器、储能变流器、绿电制氢系统等全产业链产品。",
                "priority": "P1",
                "source": "索比光伏网，2026-06-29",
                "url": "https://news.solarbe.com/202606/29/50025041.html",
                "date": "2026-07-01"
              },
              {
                "title": "电池新国标驱动安全升级",
                "content": "《电动汽车用动力蓄电池安全要求》GB38031-2025新增底部撞击、快充循环后安全测试等项目，叠加《电动汽车安全要求》GB18384-2025，标志动力电池安全标准升级，磷酸铁锂/三元等技术路线需在热失控管理与结构防护上同步提升。",
                "priority": "P0",
                "source": "上海证券报，2026-07-02",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "中石化签约40万吨SAF项目",
                "content": "中石化宁波工程与Allied Biofuels FE LLC签署乌兹别克斯坦可持续航空燃料项目前端工程设计和详细设计合同，年产SAF 40万吨，总投资约61亿美元，配套大型光伏、绿氢、储能设施。",
                "priority": "P2",
                "source": "索比光伏网，2026-06-29",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "project",
            "title": "项目/招标",
            "items": [
              {
                "title": "紫金矿业马诺诺锂矿下半年投产",
                "content": "紫金矿业马诺诺锂矿（产能规模25-30万吨LCE）市场预期下半年投产，叠加津巴布韦锂矿发运恢复后6月底至7月初集中到港，将成为下半年国内锂盐供应增量的核心支撑。",
                "priority": "P0",
                "source": "华夏时报，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "大中矿业4万吨锂项目点火",
                "content": "大中矿业4万吨碳酸锂项目已于6月18日点火投产，公司同步布局『硫酸法提锂新工艺』与锂云母尾渣消纳，配套年产2万吨电池级碳酸锂，预计年底投产。",
                "priority": "P1",
                "source": "华夏时报，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "比亚迪波兰储能项目落地",
                "content": "比亚迪签约波兰600MW/2.4GWh储能项目（欧洲最大储能项目之一），进入实质性交付阶段，对国内储能电芯及系统集成商出海形成示范效应。",
                "priority": "P1",
                "source": "第一财经资讯，2026-07-02",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "tips",
            "title": "专属提示",
            "items": [
              {
                "title": "💰 机会",
                "content": "锂电产业链景气延续上行，碳酸锂期货两日累计涨13%、下游7月排产环比+8.56%，6月电池总排产预计266.5GWh创新高，电池新国标实施倒逼安全材料升级，高压实磷酸铁锂/磷酸锰铁锂等差异化产品溢价空间打开。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "⚠️ 风险",
                "content": "碳酸锂仓单48,731手仍处高位，枧下窝复产下半年最多带来4.5万吨增量，叠加津巴布韦6月底到港、紫金矿业马诺诺下半年投产、尼日利亚权益金推高海外成本，外购锂辉石冶炼利润-3,185元/吨倒挂风险持续。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "📋 行动建议",
                "content": "短期跟踪LC2609在16万元/吨关口攻防与SMM日均价联动节奏，逢回调锁定6%锂精矿长协与电池新国标下高安全材料产能优先供货权；中长期借力广期所引入境外交易者契机拓展海外矿山套保渠道。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "👁️ 重点关注",
                "content": "聚焦四线：其一，枧下窝实际复产爬坡节奏（市场预期10万吨/年降至3万吨/年）；其二，津巴布韦锂矿7月中下旬到港量与紫金马诺诺投产进度；其三，7月锂盐厂开工率与电池企业排产兑现度；其四，电池新国标实施后企业认证进展与重卡换电规模化兑现度。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              }
            ]
          }
        ],
        "updated_at": "2026-07-02"
      },
      "lubricant": {
        "bu_name": "润滑油事业部",
        "sections": [
          {
            "dim": "topnews",
            "title": "今日关注",
            "items": [
              {
                "title": "车用润滑油新国标今日实施",
                "content": "",
                "priority": "P0",
                "source": "国家市场监管总局，2026-07-01",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "国际油价大跌WTI跌破69美元",
                "content": "",
                "priority": "P0",
                "source": "中国基金报，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "路博润与统一发布AI研发柴油机油",
                "content": "",
                "priority": "P0",
                "source": "界面新闻，2026-06-29",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "碳酸锂期货两日累计涨13%",
                "content": "",
                "priority": "P1",
                "source": "新浪财经，2026-07-01",
                "url": "",
                "date": "2026-07-02"
              }
            ]
          },
          {
            "dim": "market",
            "title": "市场/价格",
            "items": [
              {
                "title": "碳酸锂期货LC主力合约",
                "content": "价格：164560元/吨\n涨跌：+7260元/吨（+4.62%）\n来源：新浪财经/上海钢联，2026-07-01",
                "priority": "P1",
                "source": "新浪财经/上海钢联，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "WTI原油期货主力",
                "content": "价格：68.58美元/桶\n涨跌：-0.92美元（-1.32%）\n来源：中国基金报，2026-07-01",
                "priority": "P1",
                "source": "中国基金报，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "布伦特原油期货主力",
                "content": "价格：71.57美元/桶\n涨跌：-1.38美元（-1.89%）\n来源：中国基金报，2026-07-01",
                "priority": "P1",
                "source": "中国基金报，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "昆仑全损耗系统用油L-AN 32",
                "content": "价格：2608.66元/170公斤（一类经销商）\n来源：隆众资讯，2026-07-01",
                "priority": "P1",
                "source": "隆众资讯，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "昆仑全损耗系统用油L-AN 46",
                "content": "价格：2699.22元/170公斤（一类经销商）\n来源：隆众资讯，2026-07-01",
                "priority": "P1",
                "source": "隆众资讯，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "昆仑全损耗系统用油L-AN 68",
                "content": "价格：2832.04元/170公斤（一类经销商）\n来源：隆众资讯，2026-07-01",
                "priority": "P1",
                "source": "隆众资讯，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "国内废润滑油主流到厂价",
                "content": "价格：4250-4350元/吨（华东/华中/华北）\n加氢企业收购价：4400-4500元/吨\n来源：隆众资讯，2026-07-01",
                "priority": "P1",
                "source": "隆众资讯，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "NYMEX 8月汽油期货",
                "content": "价格：2.9452美元/加仑\n来源：汇通财经，2026-07-01",
                "priority": "P2",
                "source": "汇通财经，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "NYMEX 8月取暖油期货",
                "content": "价格：3.2179美元/加仑\n来源：汇通财经，2026-07-01",
                "priority": "P2",
                "source": "汇通财经，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "7月3日成品油调价预期",
                "content": "预计汽油下调820元/吨、柴油下调790元/吨\n折算：92号汽油每升降0.66元，95号降0.7元\n来源：中新经纬，2026-07-01",
                "priority": "P1",
                "source": "中新经纬，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "policy",
            "title": "政策/行业",
            "items": [
              {
                "title": "车用润滑油新国标7月1日实施",
                "content": "GB 11121-2025《汽油机油》、GB 11122-2025《柴油机油》于2026年7月1日正式实施，汽油机新增SP/GF-6系列及低粘度要求，柴油机新增D1自主高端规格、低SAPS要求，全面适配国六排放，倒逼行业产品升级与低端产能出清。",
                "priority": "P0",
                "source": "国家市场监管总局，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "新能源车冷却液新国标实施",
                "content": "GB 29743.2-2025《电动汽车冷却液》强制电导率≤100μS/cm以适配高压电池，GB 29743.3-2025《燃料电池冷却液》针对电堆热管理强化绝缘与防腐，新能源车专用油液标准体系加速完善。",
                "priority": "P1",
                "source": "国家市场监管总局，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "节能装备方案攻关高端润滑油",
                "content": "工信部、国家发改委等四部门发布《节能装备高质量发展实施方案（2026-2028年）》，要求在电机、风机、泵、压缩机等负载设备攻关高效长寿命润滑油，在工业热泵攻关耐高温润滑油，加快国产替代。",
                "priority": "P1",
                "source": "工信部，2026-03-20",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "废矿物油再生利用政策推动扩容",
                "content": "《废矿物油回收与再生利用导则》（GB/T 17145-2024）2024年11月实施，叠加2026年危险废物重点监管单位建设节点，再生基础油从「危废」转向「第二油田」，合规企业与高端化产能受益。",
                "priority": "P1",
                "source": "中研网，2026-06-05",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "enterprise",
            "title": "企业动态",
            "items": [
              {
                "title": "路博润与统一联合发布AI柴油机油",
                "content": "路博润与统一石化联合发布两款柴油机油新品：钛粒王AI智研低灰分合成柴机油为全球首款AI全流程研发并商业化量产产品，「三合一」超低灰分钛粒王实现API CK-4、康明斯CES 20086与中国D1国标三大标准融合，研发周期由「以年计」缩短至「以月计」。",
                "priority": "P0",
                "source": "界面新闻，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "路博润与快准车服开发高端润滑油",
                "content": "路博润与浙江快准车服签署合作协议，整合添加剂技术、油品制造与终端场景优势，协同研发适合中国交通新工况的高端润滑油产品；快准车服在全国拥有2300多家服务站、服务30万家汽修企业，三方共同推进「S计划」落地。",
                "priority": "P1",
                "source": "中国化工报，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "昆仑润滑推进战新产业布局",
                "content": "昆仑润滑合成冷冻机油形成KHP1000-KHP4000全系列矩阵，覆盖氨/碳氢/氢氟烃制冷剂体系；昆仑790四冲程活塞式航空发动机油获颁首张中国民航局CTSOA证、完成特许飞行试验；浸没式冷却液已布局数据中心与储能两大应用场景。",
                "priority": "P1",
                "source": "中国能源网，2026-06-24",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "国润新材料新厂房投产",
                "content": "国润新材料（浙江）新厂房2026年1月试运营、6月5日正式开业投产，引入全套全自动化生产线，偌大车间仅需5名工人值守便可稳定产出各类高品质工业润滑油产品，已实现对特斯拉、上汽通用等客户供货。",
                "priority": "P1",
                "source": "龙游县人民政府，2026-06-10",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "tech",
            "title": "技术/产品",
            "items": [
              {
                "title": "全球首款AI全流程研发柴油机油",
                "content": "钛粒王AI智研低灰分合成柴机油依托路博润AI研发平台与统一FM智慧流体大脑AI智能体协同，构建跨企业AI协同研发体系，已完成柴油机8万-10万公里、天然气机4万-6万公里路试，发动机机油消耗降低70%，AI研发模式从概念验证迈向规模化应用。",
                "priority": "P0",
                "source": "界面新闻，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "三合一超低灰分钛粒王首发",
                "content": "「三合一」超低灰分钛粒王（CK-4|CNG|D1 10W-40）首次在单一产品中实现API CK-4、康明斯CES 20086与中国自主D1国标三大性能体系融合，硫酸盐灰分低于0.6%，满足D1标准对后处理系统保护要求、兼顾CK-4长换油周期与燃气发动机高温抗硝化性能。",
                "priority": "P0",
                "source": "界面新闻，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "mPAO国产替代突破卡脖子",
                "content": "亚培烯科技mPAO（茂金属聚α-烯烃）实现1.5万吨量产，产能位居国内第一、全球前三，打破埃克森美孚等国外企业长期垄断；mPAO是高端润滑油及数据中心冷却液的关键材料，国产化对推动高端润滑油自主可控具有战略意义。",
                "priority": "P1",
                "source": "每日经济新闻，2026-06-12",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "project",
            "title": "项目/招标",
            "items": [
              {
                "title": "中石化茂名2万吨多元醇酯项目将投产",
                "content": "中石化润滑油茂名分公司2万吨/年多元醇酯项目即将投产，凭借自主核心技术打破埃克森美孚、壳牌等外企数十年垄断，产品已获行业龙头认证，每吨比进口便宜2000至3000元，强化国产高端替代能力。",
                "priority": "P0",
                "source": "南方日报，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "万洋润滑油产业园投资20亿元",
                "content": "万洋润滑油产业园投资20亿元，依托茂名近百万吨基础油产能集聚中小企业，构建「航母+舰队」集群格局，从「国产替代」迈向集群化发展，强化区域产业链协同。",
                "priority": "P1",
                "source": "南方日报，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "中石化宁波工程签约40万吨SAF项目",
                "content": "中石化宁波工程与Allied Biofuels FE LLC签署乌兹别克斯坦可持续航空燃料（SAF）项目前端工程设计及详细设计合同，年产SAF 40万吨、总投资约61亿美元，为中亚首个大型全产业链生物航油综合体。",
                "priority": "P2",
                "source": "索比光伏网，2026-06-29",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "tips",
            "title": "专属提示",
            "items": [
              {
                "title": "💰 机会",
                "content": "车用润滑油新国标7月1日实施，低端产能加速出清，D1标准与AI研发开辟高端替代窗口；国际油价WTI跌破69美元、6月累跌18%，缓解基础油成本压力；mPAO国产化与再生基础油扩容双重红利显现，关注数据中心液冷、氢能重卡、储能等新场景。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "⚠️ 风险",
                "content": "国际油价虽回落但海湾局势与OPEC+增产预期仍存反复可能，原料价格波动加大企业库存管理难度；行业新国标切换期低端产品去库压力较大，中小品牌生存空间持续承压；下游润滑油终端需求疲软、厂家刚需补货，废油再生企业库存压力加大。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "📋 行动建议",
                "content": "短期跟踪原油WTI 68美元/桶支撑与7月3日成品油调价窗口落地节奏，借油价回落锁定二季度基础油长协价格；中期加快推进D1标准与AI研发产品矩阵对接主机厂后市场，重点攻关数据中心液冷、新能源车三电油液等增量品类。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "👁️ 重点关注",
                "content": "聚焦四条主线：其一，GB 11121/11122-2025新国标执行与企业资质切换；其二，国际油价7月中下旬OPEC+会议走向与霍尔木兹通航量；其三，中石化茂名2万吨多元醇酯项目投产与定价；其四，AI研发柴油机油市场化推广。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              }
            ]
          }
        ],
        "updated_at": "2026-07-02"
      },
      "sdmd": {
        "bu_name": "山东美多事业部",
        "sections": [
          {
            "dim": "topnews",
            "title": "今日关注",
            "items": [
              {
                "title": "碳酸锂期货两日暴涨13%",
                "content": "",
                "priority": "P0",
                "source": "网易，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "动力电池安全新国标7月1日实施",
                "content": "",
                "priority": "P0",
                "source": "上海证券报，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "锂电回收市场2026年将达527亿元",
                "content": "",
                "priority": "P1",
                "source": "经济参考报，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "工信部六部门新规加速白名单出清",
                "content": "",
                "priority": "P1",
                "source": "中国政府网，2026-06-24",
                "url": "",
                "date": "2026-06-24"
              }
            ]
          },
          {
            "dim": "market",
            "title": "市场/价格",
            "items": [
              {
                "title": "碳酸锂期货主力LC2609",
                "content": "价格：164560元/吨\n涨跌：+7260元/吨（+4.62%）\n来源：网易，2026-07-02",
                "priority": "P0",
                "source": "网易，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "WTI原油期货",
                "content": "价格：68.58美元/桶\n涨跌：-0.92美元（-1.32%）\n来源：中国基金报，2026-07-02",
                "priority": "P1",
                "source": "中国基金报，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "布伦特原油期货",
                "content": "价格：71.57美元/桶\n涨跌：-1.38美元（-1.89%）\n来源：中国基金报，2026-07-02",
                "priority": "P1",
                "source": "中国基金报，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "尿素期货UR2609",
                "content": "价格：1723元/吨\n涨跌：-17元/吨（-0.98%）\n来源：南方财经网，2026-07-01",
                "priority": "P1",
                "source": "南方财经网，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "尿素现货（生意社）",
                "content": "价格：1813.75元/吨\n基差：+90.75元/吨（现货升水期货）\n来源：同花顺，2026-07-01",
                "priority": "P1",
                "source": "同花顺，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "电池级碳酸锂现货（上海有色）",
                "content": "价格：160100元/吨（区间155100-165100）\n涨跌：+3500元/吨\n来源：中国有色网，2026-07-01",
                "priority": "P0",
                "source": "中国有色网，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "报废方壳三元锂电池（6月）",
                "content": "价格：38900-43500元/吨\n估值锚：含镍钴贵金属，单价是磷酸铁锂2.5-3倍\n来源：科技任意门，2026-07-01",
                "priority": "P0",
                "source": "科技任意门，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "报废磷酸铁锂电池（6月）",
                "content": "价格：15150-16850元/吨\n结构：磷酸铁锂铝壳0.5-0.8万元/吨；软包0.6-1.2万元/吨\n来源：科技任意门，2026-07-01",
                "priority": "P0",
                "source": "科技任意门，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "钴酸锂电池（消费类）",
                "content": "价格：3.1-5.2万元/吨\n驱动：钴含量高、回收经济性强\n来源：汽车之家，2026-07-01",
                "priority": "P1",
                "source": "汽车之家，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "LFP黑粉市场价",
                "content": "价格：约1.2万元/吨\n工艺：直接修复工艺再生LFP生产成本可控制在0.8万元/吨以内\n来源：原创力文档，2026-06-24",
                "priority": "P1",
                "source": "原创力文档，2026-06-24",
                "url": "",
                "date": "2026-06-24"
              },
              {
                "title": "铁锂极片黑粉（湿法端）",
                "content": "价格：6800-7100元/锂点\n驱动：跟随碳酸锂期货及现货价格走弱\n来源：电池网，2026-06-29",
                "priority": "P1",
                "source": "电池网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "亚洲NMC黑粉（离岸）",
                "content": "价格：USD 8000-14000/干吨\n驱动：与LME钴、镍、氢氧化锂价格紧密联动\n来源：IndexBox，2026-07-01",
                "priority": "P2",
                "source": "IndexBox，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "48V20Ah旧电瓶组（散户端）",
                "content": "价格：150-220元/组\n同比：去年同期50-80元/组，涨幅超200%\n来源：新浪网，2026-06-22",
                "priority": "P2",
                "source": "新浪网，2026-06-22",
                "url": "",
                "date": "2026-06-22"
              },
              {
                "title": "锂电回收吨利润反转",
                "content": "三元锂：吨利润回升至1.5-2万元；磷酸铁锂：吨利润3000-5000元，告别成本倒挂。碳酸锂价格1月触及18万元/吨，远超行业盈亏平衡点8-10万元/吨。\n来源：动力电池回收网，2026-06-29",
                "priority": "P0",
                "source": "动力电池回收网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "policy",
            "title": "政策/行业",
            "items": [
              {
                "title": "工信部等六部门新规4月1日施行",
                "content": "工信部、国家发改委、生态环境部、交通运输部、商务部、市场监管总局联合发布的《新能源汽车废旧动力电池回收和综合利用管理暂行办法》4月1日起正式施行，明确全渠道、全链条、全生命周期管理，推行车电一体报废制度，从源头阻断非法流失。",
                "priority": "P0",
                "source": "中国政府网，2026-06-24",
                "url": "",
                "date": "2026-06-24"
              },
              {
                "title": "规范条件明确锂回收率≥90%",
                "content": "工信部《新能源汽车废旧动力电池综合利用行业规范条件》（2024年本）要求镍、钴、锰回收率不低于98%，锂回收率不低于90%。当前行业内锂回收率普遍在85%-90%，低于规范条件要求，锂回收效率偏低成为行业核心技术瓶颈。",
                "priority": "P0",
                "source": "经济参考报，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "已出台22项回收利用国家标准",
                "content": "我国已出台22项动力电池回收利用国家标准，覆盖通用要求、管理规范、拆解规范、余能检测、再生利用、锂电废弃物处置、再生黑粉等关键领域。但行业仍面临整体产能利用率偏低、供需结构失衡、技术同质化严重等突出问题。",
                "priority": "P1",
                "source": "央广网，2026-06-17",
                "url": "",
                "date": "2026-06-17"
              },
              {
                "title": "工信部召开回收利用专班会议",
                "content": "5月28日工信部召开全国新能源汽车动力电池回收利用工作专班第二次会议，要求深入开展规范废旧动力电池回收利用联合执法专项行动，依法查处违规交售、使用废旧动力电池生产不合格产品、不履行信息溯源责任等行为。",
                "priority": "P1",
                "source": "福建省工信厅，2026-06-01",
                "url": "",
                "date": "2026-06-01"
              },
              {
                "title": "五部门启动回收联合执法专项",
                "content": "4月27日商务部、市场监管总局等5部门联合印发《关于开展规范废旧动力电池回收利用联合执法专项行动的通知》，重点强化电动自行车锂电池质量管控，严厉打击利用废旧动力电池拼装电动自行车、平衡车、滑板车等违规行为。",
                "priority": "P1",
                "source": "央广网，2026-06-07",
                "url": "",
                "date": "2026-06-07"
              }
            ]
          },
          {
            "dim": "enterprise",
            "title": "企业动态",
            "items": [
              {
                "title": "赣锋锂业回收网络8城布点",
                "content": "赣锋锂业在全国8大城市建立规范化回收站点，2+8项目投产，实现废旧磷酸锂电池全组份高效回收。行业核心难点是全球回收渠道打通，各国均有本土回收诉求，海外废旧锂资源回流国内难度较大。",
                "priority": "P0",
                "source": "电池网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "邦普循环宜昌30万吨项目环评",
                "content": "宁德时代旗下邦普循环宜昌30万吨废旧磷酸铁锂电池再生利用项目环评公示，邦普作为宁德时代电池产业生态体系重要组成部分，是国内锂电池回收利用代表性企业。",
                "priority": "P0",
                "source": "深圳市得算多咨询，2026-06-27",
                "url": "",
                "date": "2026-06-27"
              },
              {
                "title": "中国资源循环集团电池发力",
                "content": "中国资源循环集团电池有限公司规划发展部总经理陈志表示，将牵头打造线上线下一体化的动力电池回收体系：线上搭建全国一张网数字化平台，实现电池全生命周期溯源、再生料认证与碳管理；线下建设区域回收中心。",
                "priority": "P0",
                "source": "人民网，2026-06-01",
                "url": "",
                "date": "2026-06-01"
              },
              {
                "title": "科力远镍钴锰回收率98%以上",
                "content": "科力远旗下先进储能材料国家工程研究中心从事镍氢电池回收技术等多项研发与应用，目前在该领域中试线已建成，镍、钴、锰等金属综合回收率可达98%以上，技术指标处于行业前列。",
                "priority": "P1",
                "source": "每日经济新闻，2026-05-18",
                "url": "",
                "date": "2026-05-18"
              },
              {
                "title": "天奇股份锂回收率超90%",
                "content": "天奇股份2022年三元电池钴镍锰平均金属回收率达98%，锂平均回收率超88%；2023年磷酸铁锂电池磷酸铁平均回收率达95%，锂平均回收率超90%，位居行业领先水平。已入选工信部白名单企业。",
                "priority": "P1",
                "source": "天奇股份公告，2026-05-26",
                "url": "",
                "date": "2026-05-26"
              }
            ]
          },
          {
            "dim": "tech",
            "title": "技术/产品",
            "items": [
              {
                "title": "动力电池安全新国标实施",
                "content": "7月1日起，《电动汽车安全要求》（GB18384-2025）和《电动汽车用动力蓄电池安全要求》（GB38031-2025）两项强制性国家标准正式实施，新国标实施后中国新能源汽车自燃率预计比燃油车低一个数量级。",
                "priority": "P0",
                "source": "上海证券报，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "中车株洲所光储氢方案首发",
                "content": "中车株洲所携光储氢全场景新能源解决方案亮相慕尼黑The smarter E Europe 2026，全球首发12.5MW/13.8MW储能升压变流一体机，配套6.X液冷电池舱，覆盖光伏逆变器、储能变流器、绿电制氢系统等多款创新产品。",
                "priority": "P1",
                "source": "索比光伏网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "比亚迪签波兰2.4GWh储能项目",
                "content": "比亚迪签约波兰600MW/2.4GWh最大储能项目，证明中国企业在海外大型能源基建中的竞争力，有助于对冲国内产能过剩焦虑，提升海外营收占比预期。",
                "priority": "P1",
                "source": "第一财经资讯，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              }
            ]
          },
          {
            "dim": "project",
            "title": "项目/招标",
            "items": [
              {
                "title": "德康锂电5万吨梯次利用项目",
                "content": "宜春市德康锂电能源有限公司年回收5万吨锂电池梯次利用项目环评第一次公示，项目分两期建设：一期形成年回收5万吨锂电池梯次利用规模；二期建设废旧锂电池热解破碎分选生产线，最终形成年回收利用废旧锂离子电池5万吨规模。",
                "priority": "P1",
                "source": "深圳市得算多咨询，2026-06-28",
                "url": "",
                "date": "2026-06-28"
              },
              {
                "title": "河南盛祥宇1.6万吨项目竣工",
                "content": "河南盛祥宇再生资源回收利用有限公司废旧锂电池回收破碎拆解分类提取及极片回收处理项目（一期）竣工环保验收，建设废锂电池碳化热解破碎分选生产线2条，一期设计产能为年处理废旧锂电池16000吨。",
                "priority": "P1",
                "source": "深圳市得算多咨询，2026-06-27",
                "url": "",
                "date": "2026-06-27"
              },
              {
                "title": "湖北峰和仙桃项目竣工",
                "content": "湖北峰和新材料有限公司仙桃市新能源动力电池拆解回收及资源化利用项目竣工，进入环境保护验收监测报告阶段。",
                "priority": "P1",
                "source": "深圳市得算多咨询，2026-06-27",
                "url": "",
                "date": "2026-06-27"
              },
              {
                "title": "江铼新材料6万吨项目投产",
                "content": "江西江铼新材料科技有限公司6万吨/年锂电池回收资源循环利用项目（一期）已全面投产，配套盐水放电、破碎、焙烧、浸出、净化、萃取、蒸发结晶等工序，得到镍钴锰硫酸盐及碳酸锂等产品。",
                "priority": "P1",
                "source": "深圳市得算多咨询，2026-06-28",
                "url": "",
                "date": "2026-06-28"
              }
            ]
          },
          {
            "dim": "tips",
            "title": "专属提示",
            "items": [
              {
                "title": "💰 机会",
                "content": "碳酸锂期货两日累涨13%突破16.4万元/吨，电池级碳酸锂现货均价跟涨至16万元/吨上方，电池级碳酸锂领涨带动铁锂极片黑粉、三元黑粉等回收料价格回升。锂电回收吨利润由负转正，三元吨利润1.5-2万元、磷酸铁锂吨利润3000-5000元，告别成本倒挂。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "⚠️ 风险",
                "content": "海外锂矿企业预计2026年7月中下旬有集中到港预期，将对国内市场形成供给补充，叠加全产业链高库存对盘面持续压制，碳酸锂上方空间有限。行业产能利用率偏低、技术同质化、供需结构失衡等问题未根本解决，警惕价格高位回调。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "📋 行动建议",
                "content": "短期跟踪碳酸锂期货16万元/吨关口攻防及黑粉折扣系数变化，分批出货避免低位清仓；中长期锁定铁锂黑粉、三元黑粉长协，绑定头部白名单企业（赣锋、邦普、天奇等）渠道；关注白名单出清下的渠道与产能并购机会。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "👁️ 重点关注",
                "content": "聚焦四线：其一，碳酸锂期货主力16万元/吨攻防与仓单去化节奏；其二，宁德时代枧下窝锂矿7月满负荷运行进度及下半年4.5万吨增量；其三，工信部联合执法专项行动下中小回收商出清节奏；其四，欧盟新电池法再生材料占比要求对国内出口业务影响。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              }
            ]
          }
        ],
        "updated_at": "2026-07-02"
      },
      "sjl": {
        "bu_name": "三金锂电事业部",
        "sections": [
          {
            "dim": "topnews",
            "title": "今日关注",
            "items": [
              {
                "title": "碳酸锂期货两日涨13%",
                "content": "",
                "priority": "P0",
                "source": "网易，2026-07-02",
                "url": "https://www.163.com/dy/article/L0PTF32J05539T4L.html",
                "date": "2026-07-02"
              },
              {
                "title": "电池安全新国标7月1日实施",
                "content": "",
                "priority": "P0",
                "source": "上海证券报，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "比亚迪签波兰600MW储能大单",
                "content": "",
                "priority": "P1",
                "source": "第一财经资讯，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "宁德时代签5000台重卡换电",
                "content": "",
                "priority": "P1",
                "source": "第一财经资讯，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              }
            ]
          },
          {
            "dim": "market",
            "title": "市场/价格",
            "items": [
              {
                "title": "碳酸锂期货LC2609主力",
                "content": "价格：164560元/吨\n涨跌：+7260元/吨（+4.62%）\n两日累计涨幅近13%\n来源：网易，2026-07-02",
                "priority": "P0",
                "source": "网易，2026-07-02",
                "url": "https://www.163.com/dy/article/L0PTF32J05539T4L.html",
                "date": "2026-07-02"
              },
              {
                "title": "WTI原油期货",
                "content": "价格：68.58美元/桶\n涨跌：-0.92美元（-1.32%）\n来源：每日经济新闻，2026-07-02",
                "priority": "P1",
                "source": "每日经济新闻，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "布伦特原油期货",
                "content": "价格：71.57美元/桶\n涨跌：-1.38美元（-1.89%）\n来源：中国基金报，2026-07-02",
                "url": "",
                "priority": "P1",
                "source": "中国基金报，2026-07-02",
                "date": "2026-07-02"
              },
              {
                "title": "尿素期货UR2609主力",
                "content": "价格：1723元/吨\n涨跌：-17元（-0.98%）\n来源：顶尖财经网，2026-07-01",
                "priority": "P1",
                "source": "顶尖财经网，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "尿素现货主流区域价",
                "content": "价格：1760-1860元/吨\n山东1810、河南1800、河北1820、江苏1840、安徽1850、山西1670\n来源：新浪财经，2026-07-01",
                "priority": "P1",
                "source": "新浪财经，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "三元前驱体NCM811",
                "content": "价格：12.03万元/吨\n涨跌：+2.30%\n来源：TrendForce，2026-07-01",
                "priority": "P0",
                "source": "TrendForce，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "正极材料NCM523",
                "content": "价格：19.55万元/吨\n涨跌：+4.43%\n来源：TrendForce，2026-07-01",
                "priority": "P0",
                "source": "TrendForce，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              },
              {
                "title": "硫酸钴（电池级）",
                "content": "价格：85000-87000元/吨，中间值86000元/吨\n涨跌：持平\n来源：上海有色网SMM，2026-07-01",
                "priority": "P1",
                "source": "上海有色网，2026-07-01",
                "url": "https://newenergy.smm.cn/price/14042-15011",
                "date": "2026-07-01"
              },
              {
                "title": "单水氢氧化锂",
                "content": "价格：15.66万元/吨\n涨跌：+4.4%\n来源：光大证券，2026-06-15",
                "priority": "P1",
                "source": "光大证券，2026-06-15",
                "url": "",
                "date": "2026-06-15"
              },
              {
                "title": "国内碳酸锂社会库存",
                "content": "总量：约28万吨\n水平：处于近三年低位\n来源：上海钢联，2026-06-29",
                "priority": "P1",
                "source": "新浪网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "三元材料价格走势",
                "content": "主流报价接近2.9万元/吨，同比涨幅超25%；2026年Q1正极三元材料价格大幅上涨80%\n来源：今日头条/上海证券报，2026-07-01",
                "priority": "P1",
                "source": "今日头条，2026-07-01",
                "url": "",
                "date": "2026-07-01"
              }
            ]
          },
          {
            "dim": "policy",
            "title": "政策/行业",
            "items": [
              {
                "title": "动力电池安全新国标7月1日实施",
                "content": "《电动汽车安全要求》（GB18384-2025）和《电动汽车用动力蓄电池安全要求》（GB38031-2025）正式实施，新能源汽车自燃率预计比燃油车低一个数量级，倒逼三元/铁锂体系进一步提升热失控管理与材料稳定性。",
                "priority": "P0",
                "source": "上海证券报，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "五部门启动2026年新能源汽车下乡",
                "content": "工信部、商务部等五部门联合启动2026年新能源汽车下乡活动，乡村换购不受补贴资格数量限制。两部门提出到2030年车网互动聚合可调充电规模达5000万千瓦左右。",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "全球自动驾驶系统技术法规获批",
                "content": "全球首个自动驾驶系统全球技术法规获批发布，工信部表示将加快国内标准衔接。2030年中国全域电动化全产业链规模有望超8万亿元。",
                "priority": "P1",
                "source": "金融界，2026-06-25",
                "url": "",
                "date": "2026-06-25"
              },
              {
                "title": "中国三元材料全球份额提升至74.4%",
                "content": "2025年全球三元材料产量103.3万吨同比+7.4%，中国产量76.9万吨同比+25.4%，中国企业全球份额从2024年63.8%提升至74.4%。预计2026年全球三元材料产量将增至109.2万吨同比+5.7%。",
                "priority": "P1",
                "source": "智研咨询，2026-06-30",
                "url": "https://www.chyxx.com/industry/1269699.html",
                "date": "2026-06-30"
              }
            ]
          },
          {
            "dim": "enterprise",
            "title": "企业动态",
            "items": [
              {
                "title": "金川瑞翔冲刺创业板IPO",
                "content": "全球三元正极材料龙头金川瑞翔创业板IPO于6月29日获受理，拟募资37.8亿元。2025年公司三元材料市场份额16.4%居全球第一，年出货量18.6万吨；6系产品市占率高达53.94%，单晶产品占比37%双双居首。",
                "priority": "P0",
                "source": "上海证券报，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "厦钨新能法国4万吨三元项目开工",
                "content": "厦钨新能法国敦刻尔克年产4万吨三元正极材料项目于5月29日正式开工建设，成为法国首个专用于电动汽车电池正极的工业化基地，可年供应约50万台新能源整车，预计2028年6月投产。",
                "priority": "P0",
                "source": "澎湃新闻，2026-06-26",
                "url": "",
                "date": "2026-06-26"
              },
              {
                "title": "厦钨新能投建4万吨磷酸锰铁锂项目",
                "content": "厦钨新能投4.34亿元在四川雅安建设年产4万吨磷酸铁（锰）锂产线，建设周期25个月，预计2028年6月投产，建成后雅安基地磷酸盐系总产能将达8万吨/年。",
                "priority": "P1",
                "source": "澎湃新闻，2026-06-26",
                "url": "",
                "date": "2026-06-26"
              },
              {
                "title": "宁德时代枧下窝锂矿复产",
                "content": "6月29日宁德时代枧下窝锂矿获颁安全生产许可证并正式复产，年产碳酸锂约10万吨，停产前占全国8%-10%。若7月起满负荷运行，下半年可新增碳酸锂供应超4.5万吨。",
                "priority": "P0",
                "source": "网易，2026-07-02",
                "url": "https://www.163.com/dy/article/L0PTF32J05539T4L.html",
                "date": "2026-07-02"
              }
            ]
          },
          {
            "dim": "tech",
            "title": "技术/产品",
            "items": [
              {
                "title": "中镍高电压+高镍路线双轮驱动",
                "content": "2025年国内三元材料6系（中镍高电压）市占率40%、高镍8系占44%，中镍高电压路线凭借成本与安全性优势加速渗透。容百科技2025年出货同比下滑较大，而金川瑞翔6系份额升至53.94%，行业头部格局加速分化。",
                "priority": "P1",
                "source": "盟固利募集说明书，2026-06-08",
                "url": "",
                "date": "2026-06-08"
              },
              {
                "title": "高镍三元成固态电池主流路线",
                "content": "中国科学院院士欧阳明高指出，全固态电池应聚焦硫化物电解质+高镍三元正极+硅碳负极技术路线。高镍及超高镍三元前驱体出货占比预计从2024年35.2%提升至2030年70.0%，eVTOL与人形机器人将贡献增量。",
                "priority": "P1",
                "source": "宁波力勤资源招股书，2026-06-25",
                "url": "",
                "date": "2026-06-25"
              },
              {
                "title": "复合集流体与三元体系天然适配",
                "content": "欧盟ECE R100.03法规对电池安全提出'五重标准'升级，三元材料热稳定性相对较低对集流体安全冗余要求更高。复合铝箔凭借阻断铝热反应与轻量化优势，与三元体系天然适配。",
                "priority": "P2",
                "source": "方正证券，2026-05-21",
                "url": "",
                "date": "2026-05-21"
              }
            ]
          },
          {
            "dim": "project",
            "title": "项目/招标",
            "items": [
              {
                "title": "宁德时代5000台重卡换电项目",
                "content": "宁德时代与极兔速递签署5000台重卡换电协议，标志着动力电池应用从乘用车向商用物流领域规模化渗透，打开B端换电增量市场空间。",
                "priority": "P0",
                "source": "第一财经资讯，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "比亚迪波兰600MW/2.4GWh储能项目",
                "content": "比亚迪签约波兰600MW/2.4GWh最大储能项目，中国企业在海外大型能源基建中的竞争力凸显，有助于对冲国内产能过剩并提升海外营收占比预期。",
                "priority": "P0",
                "source": "第一财经资讯，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "中车株洲所光储氢全球首发",
                "content": "中车株洲所在德国慕尼黑The smarter E Europe 2026展会全球首发12.5MW/13.8MW储能升压变流一体机，配套6.X液冷电池舱，定义大储集成新标杆。",
                "priority": "P1",
                "source": "索比光伏网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "tips",
            "title": "专属提示",
            "items": [
              {
                "title": "💰 机会",
                "content": "碳酸锂期货两日涨13%突破16.4万元/吨，叠加宁德时代枧下窝复产+下游排产放量，中镍高电压6系三元市占率提升至40%、高镍占44%，高镍及超高镍前驱体2030年占比有望达70%，差异化高电压产品+海外认证产能稀缺。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "⚠️ 风险",
                "content": "国内碳酸锂社会库存28万吨处于近三年低位后存在补库需求，海外7月中下旬集中到港预期或形成短期供应冲击；新国标GB18384-2025/GB38031-2025实施对热管理/材料稳定性提出更高要求，技术不达标产能将加速出清。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "📋 行动建议",
                "content": "短期跟踪碳酸锂期货160000元/吨攻防及正极NCM523/NCM811联动节奏，借力金川瑞翔IPO估值锚定中镍高电压产品溢价；中长期锁定高镍/超高镍前驱体长单与海外认证产能，优先布局满足新国标的复合集流体/单晶高电压体系。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              },
              {
                "title": "👁️ 重点关注",
                "content": "聚焦四线：其一，碳酸锂期货主力16万元/吨关口攻防与枧下窝7月满产节奏；其二，三元正极NCM523/811周度报价及NCM811前驱体供给端变化；其三，电池安全新国标下头部企业产能利用率与认证进度；其四，海外波兰/法国/欧洲出口订单兑现度。",
                "priority": "P0",
                "source": "基于今日报告，2026-07-02",
                "url": "",
                "date": "2026-07-02"
              }
            ]
          }
        ],
        "updated_at": "2026-07-02"
      }
    }
  }
};
{
  "today": "2026-06-30",
  "report": {
    "departments": {
      "bych": {
        "bu_name": "bych",
        "sections": [
          {
            "dim": "topnews",
            "title": "今日关注",
            "items": [
              {
                "title": "十五五规划明确氢能200万吨目标",
                "content": "",
                "priority": "P0",
                "source": "中国能源网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "巴拉德4亿美元收购GeoPura",
                "content": "",
                "priority": "P0",
                "source": "国金电新，2026-06-28",
                "url": "",
                "date": "2026-06-28"
              },
              {
                "title": "中石化签40万吨SAF项目",
                "content": "",
                "priority": "P1",
                "source": "索比光伏网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "枧下窝锂矿复产推进",
                "content": "",
                "priority": "P1",
                "source": "每日经济新闻，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              }
            ]
          },
          {
            "dim": "market",
            "title": "市场/价格",
            "items": [
              {
                "title": "WTI原油期货",
                "content": "价格：70.75美元/桶\n涨跌：+2.2%\n来源：财联社，2026-06-30",
                "priority": "P1",
                "source": "财联社，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "布伦特原油期货",
                "content": "价格：73.15美元/桶\n涨跌：+1.61%\n来源：中国基金报，2026-06-30",
                "priority": "P1",
                "source": "中国基金报，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "国内原油主力",
                "content": "价格：463.7元/桶\n涨跌：+0.41%\n来源：每经网，2026-06-30",
                "priority": "P1",
                "source": "每经网，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "国内尿素市场均价",
                "content": "价格：1806元/吨\n涨跌：-19元/吨（-1.04%）\n区域：山东及两河中小颗粒1720-1810元/吨\n来源：中邮化工，2026-06-30",
                "priority": "P1",
                "source": "中邮化工，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "国内铂金现货均价",
                "content": "价格：403元/克\n涨跌：+16元/克\n来源：上海有色网，2026-06-29",
                "priority": "P0",
                "source": "上海有色网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "国际现货钯金",
                "content": "价格：1203.88美元/盎司\n来源：金投网，2026-06-29",
                "priority": "P0",
                "source": "金投网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "钯连续主力合约",
                "content": "价格：294.25元/克\n涨跌：+4%\n来源：凤凰网，2026-06-29",
                "priority": "P1",
                "source": "凤凰网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "现货黄金",
                "content": "价格：4016.36美元/盎司\n涨跌：-1.77%\n来源：每经网，2026-06-30",
                "priority": "P1",
                "source": "每经网，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "沪金主力合约",
                "content": "价格：880.04元/克\n涨跌：-1.25%\n来源：每经网，2026-06-30",
                "priority": "P1",
                "source": "每经网，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "国内电解槽订单量",
                "content": "2025年累计订单：4624MW（同比+170%）\n2025年PEM招标：114.2MW（同比+226%）\nALK份额：97%；PEM+AEM合计3%\n来源：碳索氢能网，2026-06-22",
                "priority": "P0",
                "source": "碳索氢能网，2026-06-22",
                "url": "",
                "date": "2026-06-22"
              },
              {
                "title": "国内电解槽交付",
                "content": "近一个月累计交付：突破200MW\n主要项目：中煤鄂能化10万吨液态阳光、中石化中天合创16台1000Nm³/h\n来源：索比光伏网，2026-06-16",
                "priority": "P1",
                "source": "索比光伏网，2026-06-16",
                "url": "",
                "date": "2026-06-16"
              },
              {
                "title": "下半年油价预测",
                "content": "布伦特运行区间：65-90美元/桶\nWTI运行区间：55-85美元/桶\n国内原油区间：420-600元/桶\n来源：中国证券报，2026-06-30",
                "priority": "P2",
                "source": "中国证券报，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              }
            ]
          },
          {
            "dim": "policy",
            "title": "政策/行业",
            "items": [
              {
                "title": "十五五规划锚定氢能200万吨目标",
                "content": "国家发改委、能源局印发《新型能源体系建设\"十五五\"规划》，明确2030年实现可再生能源制氢规模达200万吨、风光装机持续扩容，并将氢能纳入新型能源体系重点布局，统筹\"制储输用\"全链条发展。",
                "priority": "P0",
                "source": "中国能源网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "我国首次发布氢气管输标准体系",
                "content": "水电水利规划设计总院牵头首次发布氢气管输工程成套技术与标准体系，涵盖管材、压缩机、调度等核心环节，为跨省输氢管网与绿色甲醇专用管道建设提供技术依据，加快氢能基础设施规模化部署。",
                "priority": "P0",
                "source": "中国城市燃气协会，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "广州启动氢能重卡10万元/台/年补贴",
                "content": "广州市发改委开展2026年第一批燃料电池汽车示范运营补贴申报，按10万元/台/年标准补贴氢能重卡运营主体，车辆需在广州市登记上牌并接入国家及市级燃料电池汽车示范应用信息化平台。",
                "priority": "P1",
                "source": "全球氢能网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "五部门启动新能源汽车下乡",
                "content": "工信部、商务部、发改委、农业农村部、能源局于6月25日在新疆塔城、海南澄迈同步启动2026年新能源汽车下乡活动，155款车型入选推荐目录，进一步挖掘县域及乡村消费潜力。",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "工信部酝酿燃料电池核心部件补贴",
                "content": "工信部正联合其他部委研究针对燃料电池的新补贴政策，思路从补贴整车转向补贴生产核心部件的厂家，尤其是拥有核心技术的企业将获得更有力度的政策支持，进一步引导氢能产业链向高壁垒环节集中。",
                "priority": "P1",
                "source": "点掌投资者教育基地，2026-06-26",
                "url": "",
                "date": "2026-06-26"
              }
            ]
          },
          {
            "dim": "enterprise",
            "title": "企业动态",
            "items": [
              {
                "title": "巴拉德4亿美元收购GeoPura",
                "content": "巴拉德动力系统宣布以4亿美元收购氢发电企业GeoPura，切入氢能分布式发电与移动电源赛道，标志国际燃料电池龙头从交通动力向\"氢能发电+移动动力\"全场景延伸，国际并购热潮加速产业整合。",
                "priority": "P0",
                "source": "国金电新，2026-06-28",
                "url": "",
                "date": "2026-06-28"
              },
              {
                "title": "中石化签40万吨SAF项目设计合同",
                "content": "中石化宁波工程公司与Allied Biofuels FE LLC签署乌兹别克斯坦可持续航空燃料项目前端及详细设计合同，年产SAF 40万吨、总投资约61亿美元，配套大型光伏、绿氢、储能设施，集成绿色制氢、电合成航油与绿色柴油多产线。",
                "priority": "P0",
                "source": "索比光伏网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "美锦能源氢能项目集中进入收尾期",
                "content": "美锦能源贵州六枝煤焦氢综合利用项目（总投资75.34亿元）已投资71.45亿元，预计2026年12月完工；北京大兴氢能总部基地一期2026年6月完工；滦州美锦14000Nm³/h焦炉煤气制氢项目2026年12月完工，氢能业务进入产能释放窗口。",
                "priority": "P1",
                "source": "美锦能源评级报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "宁德时代与中国节能深化战略合作",
                "content": "宁德时代与中国节能签署深化战略合作协议，聚焦下一代光伏技术、钠电储能系统应用、全域零碳场景建设、海外绿色矿山开发等关键领域，加速钙钛矿工业化量产、引入天恒钠电储能系统、打造全域\"零碳岛\"。",
                "priority": "P1",
                "source": "宁德时代官微，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "tech",
            "title": "技术/产品",
            "items": [
              {
                "title": "燃料电池系统价格七年降86%",
                "content": "国内典型公司燃料电池系统售价由2019年的2.02万元/kW降至2024年的0.28万元/kW，功率密度从250W/kg提升至750W/kg；碱性电解槽价格2024/2025年同比降幅11%/13%，PEM价格2024/2025年同比降幅20%/24%，技术降本进入加速期。",
                "priority": "P0",
                "source": "中国能源网，2026-06-26",
                "url": "",
                "date": "2026-06-26"
              },
              {
                "title": "苏州科润PEM质子膜扩产",
                "content": "苏州科润新材料拟加快建设规模化、高精度、高稳定性的质子交换膜生产线，产品应用于燃料电池、液流电池、电解水制氢等领域，并联合辽宁科京打造液流电池用质子膜重要供应商。",
                "priority": "P1",
                "source": "苏州科润招股书，2026-06-27",
                "url": "",
                "date": "2026-06-27"
              },
              {
                "title": "阳光氢能双路线领跑中标",
                "content": "阳光电源子公司阳光氢能布局碱性与PEM电解槽，在风光储氢一体化方案中占据领先地位，2024-2025年中标份额持续居前，并参与中煤鄂能化10万吨液态阳光、中石化中天合创等大型项目交付。",
                "priority": "P1",
                "source": "经济参考报，2026-06-15",
                "url": "",
                "date": "2026-06-15"
              }
            ]
          },
          {
            "dim": "project",
            "title": "项目/招标",
            "items": [
              {
                "title": "中石化中天合创16台1000Nm³/h电解槽交付",
                "content": "中石化中天合创风光制氢一体化项目并列最大供货商青骐骥6月率先交付16台1000Nm³/h电解槽，三一氢能中标8台1200Nm³/h配套中煤鄂尔多斯10万吨液态阳光示范项目，国内ALK电解槽进入GW级超级大单交付窗口。",
                "priority": "P0",
                "source": "索比光伏网，2026-06-16",
                "url": "",
                "date": "2026-06-16"
              },
              {
                "title": "雅砻江两河口绿色氢能项目可研招标",
                "content": "国投集团电子采购平台发布雅砻江两河口绿色氢能项目可行性研究招标，项目选址甘孜州雅江县，拟新建电解水制氢、加氢、储氢、氢储能、有机液体加氢系统，标志央企绿色氢能布局向西南清洁能源富集区延伸。",
                "priority": "P1",
                "source": "氢启未来，2026-06-28",
                "url": "",
                "date": "2026-06-28"
              },
              {
                "title": "稀奥科3000套270W燃料电池采购",
                "content": "内蒙古稀奥科贮氢合金2026年采购阴极闭式风冷270W燃料电池系统3000套，永煤公司裕东发电制氢站电解槽（10Nm³/h）配套招标，标志氢能备用电源、固定式发电等多元化场景招标持续放量。",
                "priority": "P1",
                "source": "氢启未来，2026-06-28",
                "url": "",
                "date": "2026-06-28"
              },
              {
                "title": "美锦滦州14000Nm³/h焦炉煤气制氢",
                "content": "美锦能源滦州14000Nm³/h焦炉煤气制氢项目预计2026年12月完工，已投资0.22亿元、尚需投资4.86亿元，叠加贵州六枝项目形成75亿元级焦炉煤气制氢示范矩阵，强化焦化主业耦合副产氢的盈利模型。",
                "priority": "P2",
                "source": "美锦能源评级报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              }
            ]
          },
          {
            "dim": "tips",
            "title": "专属提示",
            "items": [
              {
                "title": "💰 机会",
                "content": "十五五规划明确2030年绿氢200万吨目标，巴拉德4亿美元收购GeoPura点燃国际估值；PEM电解槽招标2025年同比+226%，燃料电池系统价七年降86%，铂基催化剂、质子膜等关键材料环节需求结构性放量。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "⚠️ 风险",
                "content": "美伊冲突后霍尔木兹海峡通行放缓使WTI冲高至70.75美元/桶，下半年布伦特或回落至65-90美元区间；铂族价格短期受避险情绪扰动，但下游氢能放量节奏若慢于预期，叠加2024年钯金均价较历史峰值仍低，需警惕高位回调压力。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "📋 行动建议",
                "content": "跟踪广州氢能重卡10万元/台/年补贴落地与中煤鄂能化10万吨液态阳光项目交付节奏；借中石化40万吨SAF项目签约窗口对接大型绿氢项目铂基催化剂长协；储备PEM贵金属催化剂公斤级产能以匹配2026年5.8GW订单需求。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "👁️ 重点关注",
                "content": "聚焦三线：其一，氢气管输工程标准体系落地后跨省输氢管网招标节奏；其二，巴拉德收购GeoPura后国际氢能分布式发电商业模式复制进展；其三，铂族金属价格与燃料电池系统招标量、PEM电解槽贵金属催化剂消耗强度的联动验证窗口。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              }
            ]
          }
        ],
        "updated_at": "2026-06-30"
      },
      "czly": {
        "bu_name": "czly",
        "sections": [
          {
            "dim": "topnews",
            "title": "今日关注",
            "items": [
              {
                "title": "枧下窝锂矿停产10个月后正式复产",
                "content": "",
                "priority": "P0",
                "source": "新浪财经，2026-06-30",
                "url": "https://k.sina.com.cn/article_7880068204_1d5b04c6c06801a89a.html",
                "date": "2026-06-30"
              },
              {
                "title": "《新型能源体系建设\"十五五\"规划》发布",
                "content": "",
                "priority": "P0",
                "source": "国家发改委，2026-06-25",
                "url": "",
                "date": "2026-06-25"
              },
              {
                "title": "宁德发布首款钠离子电池储能系统",
                "content": "",
                "priority": "P1",
                "source": "广发证券，2026-06-29",
                "url": "",
                "date": "2026-06-22"
              },
              {
                "title": "新能源汽车下乡活动155款车入选",
                "content": "",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "market",
            "title": "市场/价格",
            "items": [
              {
                "title": "电池级碳酸锂现货均价",
                "content": "价格：16.88万元/吨（6月18日，Mysteel早盘）\n涨跌：单日跌800元/吨，5月中旬一度突破20万元/吨高点后回落\n来源：Mysteel，2026-06-30",
                "priority": "P0",
                "source": "Mysteel，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "碳酸锂期货LC2609主力",
                "content": "价格：16.05万元/吨（6月18日收盘）\n涨跌：单日跌6.58%，较前期高点跌幅超20%\n来源：上海证券报，2026-06-30",
                "priority": "P0",
                "source": "上海证券报，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "WTI原油期货",
                "content": "价格：70.75美元/桶\n涨跌：+1.52美元（+2.20%）\n来源：财联社，2026-06-30",
                "priority": "P1",
                "source": "财联社，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "布伦特原油期货",
                "content": "价格：73.15美元/桶\n涨跌：+1.16美元（+1.61%）\n来源：中国基金报，2026-06-30",
                "priority": "P1",
                "source": "中国基金报，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "国内尿素市场均价",
                "content": "价格：1804元/吨（6月25日）\n涨跌：周环比-4元/吨（-0.22%）\n来源：开源证券，2026-06-29",
                "priority": "P2",
                "source": "开源证券，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "磷酸铁锂正极材料（动力型）",
                "content": "价格：58,150元/吨（6月28日）\n涨跌：周环比-7.63%，周内跌幅领跑锂电正极\n来源：中金公司，2026-06-28",
                "priority": "P0",
                "source": "中金公司，2026-06-28",
                "url": "",
                "date": "2026-06-28"
              },
              {
                "title": "磷酸铁锂正极材料（储能型）",
                "content": "价格：59,700-60,500元/吨（6月25日）\n涨跌：周环比窄跌横盘，相对动力型更抗跌\n来源：Mysteel，2026-06-29",
                "priority": "P0",
                "source": "Mysteel，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "湿法磷酸上游成本",
                "content": "价格：14,500-15,200元/吨\n涨跌：受硫磺/黄磷涨价抬升LFP生产成本约50%\n来源：新浪财经，2026-06-29",
                "priority": "P1",
                "source": "新浪财经，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "LFP满产满销订单爆满",
                "content": "头部LFP企业产能利用率100%且满产满销，产品交付周期从10天压缩到7天，2026年订单全部排满。上半年高性能LFP订单同比+30%、储能型+50%，订单已排至2027年。",
                "priority": "P1",
                "source": "四川日报/华夏经纬网，2026-06-29",
                "url": "https://gd.huaxia.com/c/2026/06/25/2162933.shtml",
                "date": "2026-06-25"
              },
              {
                "title": "枧下窝复产对供给端形成中期扰动",
                "content": "宁德时代宜春枧下窝锂矿6月29日正式复产，年产10万吨LCE。停产期间每月减少7000-8000吨碳酸锂当量供给，2026年四季度爬坡后将逐步释放。",
                "priority": "P0",
                "source": "新浪财经，2026-06-30",
                "url": "https://k.sina.com.cn/article_7880068204_1d5b04c6c06801a89a.html",
                "date": "2026-06-30"
              },
              {
                "title": "LFP动力电池装车占比创新高",
                "content": "2025年国内LFP动力电池出货量882GWh，同比+57.1%，市场占比80%；2026年4月LFP装车占比攀升至81.5%历史新高，叠加全球大型储能/工商业储能及海外数据中心备电储能近乎100%选用LFP，需求结构性增长确定。",
                "priority": "P1",
                "source": "中证快报，2026-06-21",
                "url": "",
                "date": "2026-06-21"
              },
              {
                "title": "尿素企业库存与开工率",
                "content": "企业总库存113.36万吨（周环比+4.40%），行业日产22.15万吨，开工率92.83%（同比+6.65pct）；复合肥产能利用率32.22%、三聚氰胺59.52%。",
                "priority": "P2",
                "source": "国泰君安期货，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "policy",
            "title": "政策/行业",
            "items": [
              {
                "title": "《新型能源体系建设\"十五五\"规划》正式发布",
                "content": "国家发改委、能源局6月25日联合印发，明确到2030年新型储能装机达到300GW，配套支持储能/锂电/光伏/钠电/钙钛矿/固态电池等关键技术与产业化落地。",
                "priority": "P0",
                "source": "中银证券周报，2026-06-29",
                "url": "http://field.10jqka.com.cn/20260629/c677778078.shtml",
                "date": "2026-06-29"
              },
              {
                "title": "出口退税下调倒逼LFP企业升级",
                "content": "财政部、税务总局明确自2026年4月1日起电池产品出口退税率由9%下调至6%，2027年1月1日起全面取消，倒逼企业放弃代工模式、提升技术附加值。",
                "priority": "P1",
                "source": "智通财经网，2026-04-10",
                "url": "",
                "date": "2026-04-10"
              },
              {
                "title": "工信部锂电池行业规范条件升级",
                "content": "申报企业年度实际产量不低于产能的50%，磷酸铁锂能量型单体能量密度不低于165Wh/kg、储能单体不低于155Wh/kg、循环寿命从5000次提升至6000次以上，研发投入≥主营业务收入3%。",
                "priority": "P1",
                "source": "中信建投，2025-07-21",
                "url": "",
                "date": "2025-07-21"
              },
              {
                "title": "五部门联合启动2026年新能源汽车下乡",
                "content": "工信部、商务部、发改委、农业农村部、国家能源局6月25日在新疆塔城、海南澄迈同步启动2026年新能源汽车下乡活动，155款车型入选推荐目录，覆盖县域及乡村下沉市场。",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "https://www.china5e.com/news/news-1205671-1.html",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "enterprise",
            "title": "企业动态",
            "items": [
              {
                "title": "宁德时代枧下窝锂矿正式复产",
                "content": "宁德时代6月26日完成枧下窝复产全部流程，6月29日矿工、矿车全部到位正式恢复生产。矿区总面积6.44平方公里、瓷石资源量9.6亿吨、伴生氧化锂265.68万吨（折LCE约657万吨），满产后年产10-20万吨LCE。",
                "priority": "P0",
                "source": "新浪财经，2026-06-30",
                "url": "https://k.sina.com.cn/article_7880068204_1d5b04c6c06801a89a.html",
                "date": "2026-06-30"
              },
              {
                "title": "宁德时代与中国节能深化战略合作",
                "content": "双方聚焦下一代光伏、钠电储能、全域零碳场景、海外绿色矿山，加速钙钛矿工业化量产；引入天恒钠电储能系统（单套最高能量超30MWh），打造全域\"零碳岛\"。",
                "priority": "P1",
                "source": "每日经济新闻，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "宁德时代线上直销平台6月26日上线",
                "content": "面向中小集成商开通线上直销渠道，进一步拓宽销售渠道、降低下游客户采购门槛，叠加天恒钠电储能系统同步推广。",
                "priority": "P1",
                "source": "界面新闻，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "金川瑞翔启动上市进程",
                "content": "已掌握第3.5代、第4代磷酸铁锂量产能力，三元材料2025年市场份额16.4%登顶全球第一，磷酸铁锂2025年出货量1.97万吨，募投新建40万吨LFP产能。",
                "priority": "P1",
                "source": "招股说明书(申报稿)，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "tech",
            "title": "技术/产品",
            "items": [
              {
                "title": "宁德发布首款钠离子电池储能系统",
                "content": "6月22日宁德时代在德国慕尼黑光伏储能展期间正式推出首款钠离子电池储能系统，单套最高能量超30MWh，采用模块化设计、支持多时长配置，将服务大型光储项目。",
                "priority": "P0",
                "source": "广发证券，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "6系4C/5C快充LFP批量出货",
                "content": "金川瑞翔在业内率先量产6系4C、5C快充产品，全新8系高电压产品已完成客户验证并于2026年上半年实现批量出货；第4代高压实磷酸铁锂产品已满足头部客户要求。",
                "priority": "P1",
                "source": "招股说明书(申报稿)，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "高压实密度LFP报价突破7万元/吨",
                "content": "受下游需求爆发与上游成本抬升双重驱动，部分高端高压实密度产品报价突破7万元/吨，头部企业订单排至2027年、行业开工率维持85-90%高位。",
                "priority": "P1",
                "source": "新浪财经，2026-06-23",
                "url": "",
                "date": "2026-06-23"
              }
            ]
          },
          {
            "dim": "project",
            "title": "项目/招标",
            "items": [
              {
                "title": "容百科技毕节百万吨级LFP项目8月投产",
                "content": "毕节容百锂电材料百万吨级LFP火法建设项目一期设计产能34万吨、总投资73.23亿元、占地873亩。6月30日完成部分产线安装调试，7-8月陆续完成剩余产线施工，8月正式投产。",
                "priority": "P0",
                "source": "央广网，2026-06-29",
                "url": "https://www.cnr.cn/gz/yaowen/20260629/t20260629_527681222.shtml",
                "date": "2026-06-29"
              },
              {
                "title": "富临精工10万吨草酸亚铁项目一期投产",
                "content": "四川射洪经开区富临新能源材料年产10万吨草酸亚铁项目（一期）6月24日正式投产，该产品是高压实磷酸铁锂核心前驱体，富临在射洪已布局四个产业项目。",
                "priority": "P1",
                "source": "遂宁市发改委，2026-06-26",
                "url": "",
                "date": "2026-06-26"
              },
              {
                "title": "盟固利/万华/湖南裕能扩产四代高压实LFP",
                "content": "盟固利规划四川达州年产15万吨四代及以上LFP项目；万华化学规划山东烟台年产40万吨第四代高压实LFP电池材料；湖南裕能拟建年产32万吨磷酸锰铁锂、7.5万吨超长循环LFP及10万吨磷酸铁。",
                "priority": "P1",
                "source": "山东埃尔派公开转让说明书，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "tips",
            "title": "专属提示",
            "items": [
              {
                "title": "💰 机会",
                "content": "新型能源体系\"十五五\"规划明确2030年新型储能装机300GW，叠加LFP装车占比突破81.5%与1-6月LFP产量+77%的高速增长，行业进入产能扩张+高端紧缺双轮驱动期，钠电储能/四代高压实/磷酸锰铁锂差异化产能成新增长极。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "⚠️ 风险",
                "content": "枧下窝锂矿6月29日复产+碳酸锂仓单仍维持高位+6月28日LFP正极材料周环比-7.63%，叠加5月碳酸锂高点20万元/吨后回落超20%、津巴布韦恢复出口与智利5月对华出口骤降40.8%后存在报复性到港预期，短期LFP价格仍存震荡风险。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "📋 行动建议",
                "content": "短期重点跟踪6月30日Mysteel电池级碳酸锂及LFP正极材料报价触底信号，逢回调锁定高压实/钠电/磷酸锰铁锂等差异化产能优先供货权；中长期借力新型储能\"十五五\"规划与电池出口退税下调窗口，加快技术升级与海外钠电储能+钙钛矿项目布局。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "👁️ 重点关注",
                "content": "聚焦四线：6月30日LFP正极与Mysteel碳酸锂报价及期货LC2609主力16万元关口；容百毕节百万吨LFP 8月投产爬坡；宁德枧下窝Q4复产与天恒钠电30MWh系统商业化；6月电池排产兑现度与7月FOM数据。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              }
            ]
          }
        ],
        "updated_at": "2026-06-30"
      },
      "dkhx": {
        "bu_name": "dkhx",
        "sections": [
          {
            "dim": "topnews",
            "title": "今日关注",
            "items": [
              {
                "title": "制动液新国标7月1日实施",
                "content": "",
                "priority": "P0",
                "source": "今日头条，2026-06-27",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "WTI原油期货重返70美元",
                "content": "",
                "priority": "P0",
                "source": "财联社，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "新能源汽车下乡活动启动",
                "content": "",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "英伟达Vera Rubin全液冷落地",
                "content": "",
                "priority": "P1",
                "source": "东方证券研报，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "market",
            "title": "市场/价格",
            "items": [
              {
                "title": "WTI原油期货",
                "content": "价格：70.75美元/桶\n涨跌：+1.52美元（+2.2%）\n来源：财联社，2026-06-30",
                "priority": "P0",
                "source": "财联社，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "布伦特原油期货",
                "content": "价格：73.15美元/桶\n涨跌：+1.16美元（+1.61%）\n来源：财联社，2026-06-30",
                "priority": "P0",
                "source": "财联社，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "国内电池级碳酸锂均价",
                "content": "价格：16.88万元/吨（6月18日）\n涨跌：较前一日下跌800元\n来源：上海钢联，2026-06-18",
                "priority": "P1",
                "source": "新浪网，2026-06-30",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "碳酸锂期货6月29日收盘",
                "content": "价格：主力合约涨逾3%\n涨跌：当日涨幅超3%\n来源：东方财富Choice数据，2026-06-30",
                "priority": "P1",
                "source": "东方财富，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "国内尿素市场均价",
                "content": "价格：1806元/吨（6月17日）\n涨跌：较上周四下跌19元（-1.04%）\n来源：百川盈孚，2026-06-17",
                "priority": "P1",
                "source": "中邮化工周报，2026-06-30",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "尿素三季度指导价上调",
                "content": "价格：较上季度上调100-210元/吨\n涨跌：政策面利好\n来源：行业协会通知，2026-06",
                "priority": "P1",
                "source": "中邮化工周报，2026-06-30",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "制冷剂R32含税出厂价",
                "content": "价格：63000元/吨\n涨跌：创近十年同期新高，同比+18.98%\n来源：氟务在线，2026-06-15",
                "priority": "P1",
                "source": "证券日报，2026-06-15",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "制冷剂R134a市场报价",
                "content": "价格：64000元/吨\n涨跌：同比+27.55%，创近十年同期新高\n来源：氟务在线，2026-06-15",
                "priority": "P1",
                "source": "证券日报，2026-06-15",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "乙二醇聚酯级（卫星石化）",
                "content": "价格：4210-4420元/吨\n涨跌：出厂价，江苏连云港\n来源：盖德化工网，2026-06-26",
                "priority": "P1",
                "source": "盖德化工网，2026-06-26",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "丙二醇山东地区",
                "content": "价格：8550元/吨（6月18日）\n涨跌：环比-3.39%\n来源：隆众资讯，2026-06-22",
                "priority": "P1",
                "source": "隆众资讯，2026-06-22",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "丙二醇国产工业级市场价",
                "content": "价格：7900元/吨\n涨跌：山东卓裕化工，2026-06-29报价\n来源：生意社，2026-06-29",
                "priority": "P1",
                "source": "生意社，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "高纯丙二醇（电子/医药级）",
                "content": "价格：12000元/吨（2026年年中高位）\n涨跌：较2025年Q4的6000元/吨涨约100%\n驱动：英伟达Vera Rubin液冷方案锁定需求",
                "priority": "P0",
                "source": "今日头条，2026-06",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "policy",
            "title": "政策/行业",
            "items": [
              {
                "title": "制动液新国标GB 12981-2025实施",
                "content": "2026年7月1日实施，新增HZY7最高等级（-40℃运动黏度≤750mm²/s、平衡回流沸点≥260℃），HZY3-HZY6全部增加储备碱度要求，删除防锈性能等冗余指标，是制动液十年来最大技术升级，门店与渠道面临库存切换窗口。",
                "priority": "P0",
                "source": "今日头条，2026-06-27",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "新型能源体系建设\"十五五\"规划",
                "content": "国家发改委、能源局印发，明确到2030年新型储能装机达到300GW；规划聚焦钙钛矿、钠电储能、零碳场景等前沿技术方向，并将强化新能源精细化学品配套需求。",
                "priority": "P0",
                "source": "中银证券研报，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "五部门启动新能源汽车下乡",
                "content": "工信部、商务部联合国家发改委、农业农村部、国家能源局在新疆塔城、海南澄迈同时启动2026年新能源汽车下乡活动，155款车型入选推荐目录，渠道下沉带动售后维保、冷却液与制动液配套需求扩张。",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "EMB国标落地驱动电控制动升级",
                "content": "GB 21670-2025于2026年1月1日实施，对电子机械制动（EMB）提出标准化要求；EHB在新能源车渗透率已达51%，EMB单价约3500元/车，2026年市场空间约530亿元、未来3年增量空间275亿元、CAGR 15%。",
                "priority": "P1",
                "source": "浙商证券研报，2026-06-18",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "enterprise",
            "title": "企业动态",
            "items": [
              {
                "title": "至尊统一新国标制动液提前布局",
                "content": "公司DOT4+(HZY4)、DOT5.1(HZY6)、CLASS7(HZY7)全系列已提前达标新国标GB 12981-2025，部分指标超越国标要求，借新国标切换窗口锁定门店与渠道客户。",
                "priority": "P1",
                "source": "今日头条，2026-06-27",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "巨化股份全氟聚醚冷却液产能爬坡",
                "content": "公司是国内最早从事数据中心冷却液的企业之一，1000吨/年全氟聚醚装置正处于产能爬坡阶段，覆盖氢氟醚、全氟聚醚、全系制冷剂等多个液冷品种，FFKM全氟醚橡胶已少量供货半导体领域。",
                "priority": "P1",
                "source": "巨化股份公告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "宁德时代与中国节能深化战略合作",
                "content": "双方签署深化合作协议，聚焦下一代光伏技术、钠电储能系统应用、全域零碳场景建设、海外绿色矿山开发，并加速钙钛矿工业化量产与天恒钠电储能系统导入国家级项目。",
                "priority": "P1",
                "source": "宁德时代官微，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "怡达股份覆盖制动液/丙二醇醚产业链",
                "content": "公司主营醇醚、醇醚酯类、双氧水与环氧丙烷等产品，3万吨电子级丙二醇甲醚（PM）及PMA产能已建成投产，是国内丙二醇甲醚/乙酸酯主要生产企业，应用于光刻胶与汽车制动液领域。",
                "priority": "P2",
                "source": "网易，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "tech",
            "title": "技术/产品",
            "items": [
              {
                "title": "英伟达Vera Rubin全液冷方案",
                "content": "6月21日英伟达发布Vera Rubin平台全面液冷技术，VR平台是首个实现100%全液冷的AI计算平台，采用45℃、75%水+25%丙二醇混合冷却介质，叠加微通道技术，将数据中心冷却用水量降至接近零，推动液冷从系统局部走向全面应用。",
                "priority": "P0",
                "source": "东方证券研报，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "低电导率/高润滑新能源专用化学品",
                "content": "针对电动汽车绝缘安全需求，主流供应商纷纷推出超低电导率冷却液（有效规避电池漏电风险），以及在干湿沸点、低温运动黏度上严苛程度显著提升的HZY7级静音高润滑制动液，匹配高制动负荷与长续航新能源车型。",
                "priority": "P1",
                "source": "新浪汽车，2026-05-24",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "英特尔冷板液冷工质生态发布",
                "content": "6月24日英特尔在上海举办冷板冷却液资格验证暨生态发布会，联合英维克发布单相冷板液冷工质验证成果，SK-P25-C与SK-WT-C通过英特尔认证，加速国产液冷工质进入海外AI服务器供应链。",
                "priority": "P1",
                "source": "国金证券研报，2026-06-28",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "project",
            "title": "项目/招标",
            "items": [
              {
                "title": "中石化签约40万吨SAF项目",
                "content": "中石化宁波工程公司在塔什干国际投资论坛与Allied Biofuels FE LLC签署乌兹别克斯坦可持续航空燃料（SAF）项目前端工程设计及详细设计合同，项目年产SAF 40万吨、总投资约61亿美元，为中亚首个大型全产业链生物航油综合体。",
                "priority": "P1",
                "source": "碳索氢能网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "美的液冷制造基地2027年投产",
                "content": "美的液冷制造基地2026年3月启动建设、总投资超10亿元，覆盖自然冷磁悬浮冷水机与CDU等核心产品，预计2027年8月投产；公司已中标中国电信粤港澳大湾区全液冷智算项目、芜湖T3级数据中心CDU供货，并与阿里巴巴签署AIDC液冷温控战略合作。",
                "priority": "P1",
                "source": "新浪财经，2026-06-28",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "五洋自控收购东莞柯斯宇液冷",
                "content": "五洋自控6月5日公告拟以6.8085亿元现金收购东莞市柯斯宇液冷技术51%股权，本周签署业绩补偿协议：标的公司2026年净利润不低于0.9亿元、2027-2028年累计净利润不低于2.7亿元，深度切入数据中心液冷赛道。",
                "priority": "P2",
                "source": "国金证券研报，2026-06-28",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "小鹏马来西亚EPMB工厂投产",
                "content": "6月24日小鹏汽车宣布全球第三个海外基地马来西亚EPMB工厂正式投产，首批小鹏G6车型组装下线，整车出海带动售后化学品与原厂配件供应链协同布局。",
                "priority": "P2",
                "source": "东方证券研报，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "tips",
            "title": "专属提示",
            "items": [
              {
                "title": "💰 机会",
                "content": "制动液新国标GB 12981-2025与EMB国标GB 21670-2025双标叠加，新能源/混动车型占比快速提升拉动HZY7级制动液、低电导率冷却液、长寿命数据中心冷却液结构性需求；新能源汽车下乡与英伟达Vera Rubin全液冷方案推动后市场扩容。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "⚠️ 风险",
                "content": "WTI原油反弹至70美元/桶上方抬升乙二醇、丙二醇基础原料成本；终端维修门店对含水率>3%强制更换等新规执行力度不一，可能导致老库存与新国标产品价格倒挂；竞品（统一/德联/巨化）新国标产品已抢先铺货。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "📋 行动建议",
                "content": "短期紧抓7月1日国标切换窗口，加速HZY7级制动液与低电导率冷却液门店铺货，对DOT3/老库存给出明确换购方案；中期重点跟踪新能源汽车下乡目录车型与北方数据中心液冷工质项目动态，对接OEM前装配套。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "👁️ 重点关注",
                "content": "聚焦四条主线：一、7月1日新国标实施后渠道库存切换与门店执行节奏；二、WTI/布伦特70-75美元区间对乙二醇/丙二醇/丙二醇醚原料成本的传导；三、英伟达Vera Rubin全液冷方案对国内高纯丙二醇供需格局影响；四、EMB在新能源车量产元年渗透率提升对制动液结构的颠覆。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              }
            ]
          }
        ],
        "updated_at": "2026-06-30"
      },
      "fnlt": {
        "bu_name": "fnlt",
        "sections": [
          {
            "dim": "topnews",
            "title": "今日关注",
            "items": [
              {
                "title": "枧下窝锂矿复产实地确认",
                "content": "",
                "priority": "P0",
                "source": "新浪网/界面新闻，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "《\"十五五\"能源规划》正式发布",
                "content": "",
                "priority": "P0",
                "source": "中银证券/中国能源网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "永太再获宁德VC三年9万吨长单",
                "content": "",
                "priority": "P0",
                "source": "证券时报/东吴证券，2026-06-25",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "电解液赛道累计锁单超400万吨",
                "content": "",
                "priority": "P1",
                "source": "证券时报，2026-06-18",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "market",
            "title": "市场/价格",
            "items": [
              {
                "title": "WTI原油期货主力",
                "content": "价格：70.75美元/桶\n涨跌：+1.52美元/桶（+2.2%）\n来源：财联社，2026-06-30",
                "priority": "P1",
                "source": "财联社，2026-06-30",
                "url": "https://www.cls.cn/detail/2412243",
                "date": "2026-06-30"
              },
              {
                "title": "布伦特原油期货主力",
                "content": "价格：73.15美元/桶\n涨跌：+1.16美元/桶（+1.61%）\n来源：中国基金报，2026-06-30",
                "priority": "P1",
                "source": "中国基金报，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "国内尿素市场均价",
                "content": "价格：1,806元/吨\n涨跌：-19元/吨（-1.04%，周度）\n来源：中邮化工周报，2026-06-18",
                "priority": "P2",
                "source": "中邮化工周报，2026-06-18",
                "url": "",
                "date": "2026-06-18"
              },
              {
                "title": "碳酸锂期货LC2609主力",
                "content": "价格：6月29日收盘涨逾3%\n涨跌：+3%以上，期货连续两日反弹\n来源：东方财富Choice数据，2026-06-30",
                "priority": "P0",
                "source": "东方财富Choice数据，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "六氟磷酸锂(国产)",
                "content": "价格：10.50万元/吨\n涨跌：-0.80万元/吨（-7.08%）\n来源：鑫椤锂电，2026-06-27",
                "priority": "P0",
                "source": "鑫椤锂电/华西证券，2026-06-28",
                "url": "",
                "date": "2026-06-26"
              },
              {
                "title": "六氟磷酸锂周报均价",
                "content": "价格：11.10万元/吨\n涨跌：-3000元/吨（-2.6%，周环比）\n来源：紫金天风期货，2026-06-29",
                "priority": "P1",
                "source": "紫金天风期货，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "三元动力电解液",
                "content": "价格：2.95万元/吨\n涨跌：周内持平\n来源：广发证券/SMM，2026-06-26",
                "priority": "P1",
                "source": "广发证券，2026-06-29",
                "url": "",
                "date": "2026-06-26"
              },
              {
                "title": "磷酸铁锂电解液",
                "content": "价格：2.85万元/吨\n涨跌：周内持平\n来源：同花顺/鑫椤锂电，2026-06-29",
                "priority": "P1",
                "source": "同花顺，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "三元圆柱2.6Ah电解液",
                "content": "价格：2.65万元/吨\n涨跌：周内持平\n来源：广发证券/SMM，2026-06-26",
                "priority": "P1",
                "source": "广发证券，2026-06-29",
                "url": "",
                "date": "2026-06-26"
              },
              {
                "title": "VC添加剂(电池级)",
                "content": "价格：14.50万元/吨\n涨跌：周环比+14.3%，供给受扰动持续上行\n来源：华福证券/广发证券，2026-06-29",
                "priority": "P0",
                "source": "华福证券，2026-06-29",
                "url": "",
                "date": "2026-06-26"
              },
              {
                "title": "FEC添加剂(电池级)",
                "content": "价格：6.00万元/吨\n涨跌：周环比+15.7%\n来源：广发证券，2026-06-29",
                "priority": "P1",
                "source": "广发证券，2026-06-29",
                "url": "",
                "date": "2026-06-26"
              },
              {
                "title": "高电压(4.35V)电解液",
                "content": "价格：3.50万元/吨\n涨跌：月环比+2.94%，适配快充场景需求放量\n来源：同花顺/广发证券，2026-06-29",
                "priority": "P1",
                "source": "同花顺，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "DMC溶剂(电池级)",
                "content": "价格：0.42万元/吨\n涨跌：周内持平\n来源：鑫椤锂电/华西证券，2026-06-28",
                "priority": "P2",
                "source": "华西证券，2026-06-28",
                "url": "",
                "date": "2026-06-26"
              },
              {
                "title": "六氟磷酸锂6月排产预计",
                "content": "6月六氟磷酸锂产量预计32970吨，环比+4%；5月电解液产量263480吨、环比+6%，原料端排产环比微增、库存天数上游7.4天/下游10.6天，整体仍处去库阶段。",
                "priority": "P1",
                "source": "紫金天风期货/SMM，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "六氟磷酸锂月内运行区间",
                "content": "6月（截至27日）六氟磷酸锂运行区间10.8-11.8万元/吨、月均11.3万元/吨；行业平均生产成本7.1-7.3万元/吨，全行业稳定盈利，价格底部支撑牢固。",
                "priority": "P1",
                "source": "SMM锂电回收，2026-06-27",
                "url": "",
                "date": "2026-06-27"
              }
            ]
          },
          {
            "dim": "policy",
            "title": "政策/行业",
            "items": [
              {
                "title": "《\"十五五\"能源规划》发布",
                "content": "国家发改委、能源局6月25日印发《新型能源体系建设\"十五五\"规划》，明确到2030年新型储能装机达300GW，钠电、液流电池、固态电池等多元技术路线获示范项目支持，为电解液行业一体化扩能与添加剂差异化布局提供政策窗口。",
                "priority": "P0",
                "source": "中银证券/同花顺，2026-06-29",
                "url": "https://www.cnenergynews.cn/article/4SAkSmyncg9",
                "date": "2026-06-29"
              },
              {
                "title": "五部门启动2026年新能源汽车下乡",
                "content": "工信部、商务部联合国家发改委、农业农村部、国家能源局6月25日在新疆塔城、海南澄迈同步启动2026年新能源汽车下乡活动，155款车型入选推荐目录，下沉市场对动力电池及电解液需求形成增量支撑。",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "https://www.china5e.com/news/news-1205671-1.html",
                "date": "2026-06-29"
              },
              {
                "title": "工信部整治\"内卷式\"竞争",
                "content": "工信部2025年11月召开动力和储能电池行业座谈会，明确整治内卷式竞争、编制\"十五五\"动力和储能电池产业发展规划，引导产业链各环节科学布局产能，电解液行业价格战有望缓解、盈利能力将迎实质性修复。",
                "priority": "P1",
                "source": "丰山集团2025年报，2026-04-28",
                "url": "",
                "date": "2026-04-28"
              },
              {
                "title": "锂被列为独立矿种并上收审批",
                "content": "新修订《矿产资源法》将锂列为独立矿种并上收采矿权审批权限，叠加欧盟《新电池法》对碳足迹披露要求、58号公告对高比能锂电等实施出口许可，行业进入\"绿色壁垒+创新溢价\"双轮驱动新阶段。",
                "priority": "P1",
                "source": "天齐锂业募集说明书，2026-06-22",
                "url": "",
                "date": "2026-06-22"
              }
            ]
          },
          {
            "dim": "enterprise",
            "title": "企业动态",
            "items": [
              {
                "title": "永太科技再获宁德时代VC长单",
                "content": "全资子公司浙江永太新能源与宁德时代签订《电解液原材料合作协议》，约定2027-2029年分别交付VC 2/3/4万吨；公司已投产固态六氟磷酸锂1.8万吨/年、液态LiFSI 6.7万吨/年、VC 1万吨/年，氟化工一体化优势凸显。",
                "priority": "P0",
                "source": "证券时报/东吴证券，2026-06-25",
                "url": "",
                "date": "2026-06-25"
              },
              {
                "title": "天赐材料六氟年产能折固11万吨",
                "content": "天赐材料打通从六氟磷酸锂、添加剂等上游原材料产业链条，预计六氟磷酸锂年化产能在2028年底达折固27万吨以上，LiFSI年化产能在2027年达约9万吨；2026年6月初与宁德时代签订60GWh钠电及电解液长期供应协议。",
                "priority": "P0",
                "source": "证券时报/国金证券，2026-06-18",
                "url": "",
                "date": "2026-06-18"
              },
              {
                "title": "新宙邦石磊氟6万吨6F产能",
                "content": "新宙邦通过参股石磊氟材料绑定六氟磷酸锂产能，整体自供比例达50-70%；石磊氟材料拟在湖北宜昌新建基地新增6万吨六氟磷酸锂产能，显著提升核心原材料自给率，波兰二期、中东、美国海外项目同步推进。",
                "priority": "P1",
                "source": "证券时报，2026-06-18",
                "url": "",
                "date": "2026-06-18"
              },
              {
                "title": "深圳新星六氟三期7000吨投产",
                "content": "深圳新星1.5万吨六氟磷酸锂三期7000吨生产线已正式投产，公司2025年Q4以来把握六氟行业产能出清与下游储能复苏窗口加速产能释放，2025年出货量同比增速超70%、跻身行业第二梯队。",
                "priority": "P1",
                "source": "深圳新星公告/上海如鲲新材招股书，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "宁德时代与中国节能深化合作",
                "content": "宁德时代近日与中国节能签署深化战略合作协议，聚焦下一代光伏技术、天恒钠电储能系统应用、全域零碳场景建设及海外绿色矿山开发，加速钙钛矿工业化量产、钠电规模化及零碳场景商业化。",
                "priority": "P1",
                "source": "宁德时代官微/每日经济新闻，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "tech",
            "title": "技术/产品",
            "items": [
              {
                "title": "宁德发布首款钠离子电池储能系统",
                "content": "6月22日宁德时代在德国慕尼黑光伏储能展期间召开储能新品发布会，正式推出天恒钠离子电池储能系统、单套最高能量超30MWh，采用模块化设计支持多时长配置，量产拉线已就绪、国内9月开启首批交付。",
                "priority": "P0",
                "source": "广发证券/界面新闻，2026-06-29",
                "url": "https://news.qq.com/rain/a/20260630A01I1T00",
                "date": "2026-06-29"
              },
              {
                "title": "高电压电解液需求持续放量",
                "content": "6月26日高电压(4.35V)电解液3.50万元/吨、月环比+2.94%，高电压(4.4V)电解液3.75万元/吨、月环比+2.74%，适配快充/高倍率场景的高电压电解液需求持续放量，对应配套添加剂VC/FEC同步走强。",
                "priority": "P1",
                "source": "同花顺/广发证券，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "LiFSI新型锂盐国内占比超65%",
                "content": "2025年天赐材料、如鲲新材、永太科技三家企业合计占据中国LiFSI市场份额超65%，行业集中度高；天赐材料2025年国内LiFSI市占率超50%排名第一，如鲲新材LiFSI市占率约13%居第二。",
                "priority": "P1",
                "source": "上海如鲲新材招股书，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "project",
            "title": "项目/招标",
            "items": [
              {
                "title": "宁德枧下窝锂矿复产推进",
                "content": "宜春时代新能源矿业6月18日取得枧下窝锂矿项目《建设项目用地预审与选址意见书》，矿区伴生氧化锂265.68万吨、折碳酸锂当量657万吨为全球单体锂云母矿第一梯队，6月29日实地挖机上山、人员复产培训，预计2026年四季度复产。",
                "priority": "P0",
                "source": "新浪网/界面新闻，2026-06-30",
                "url": "https://k.sina.com.cn/article_7880068204_1d5b04c6c06801a89a.html",
                "date": "2026-06-30"
              },
              {
                "title": "6月第3周国内储能招标4421MW",
                "content": "6月13-19日国内启动24个储能招标项目、规模4421.42MW/11017.328MWh，储能系统中标均价0.6585元/Wh、EPC均价0.9738元/Wh；同期开标34个项目4878.825MW/15232.211MWh，需求景气持续兑现。",
                "priority": "P1",
                "source": "长城证券，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "中石化签中亚40万吨SAF项目",
                "content": "中石化宁波工程在塔什干国际投资论坛与Allied Biofuels签署乌兹别克斯坦SAF项目FEED及详细设计合同，年产SAF 40万吨、总投资约61亿美元，配套大型光伏/绿氢/储能设施，投产后将量产e-SAF与绿色柴油。",
                "priority": "P2",
                "source": "索比光伏网/碳索氢能网，2026-06-29",
                "url": "https://h2.solarbe.com/news/20260629/50025043.html",
                "date": "2026-06-29"
              },
              {
                "title": "江西天际3万吨六氟磷酸锂项目",
                "content": "江西天际新能源科技（天际股份100%持股）规划新建年产六氟磷酸锂3万吨、高纯氟化锂6000吨及副产品配套项目，项目建成后总产能将达到六氟3万吨、高纯氟化锂6千吨，2025年Q4以来多期项目陆续投产。",
                "priority": "P1",
                "source": "深圳市得算多咨询，2026-06-28",
                "url": "",
                "date": "2026-06-28"
              }
            ]
          },
          {
            "dim": "tips",
            "title": "专属提示",
            "items": [
              {
                "title": "💰 机会",
                "content": "电解液行业累计锁单超400万吨，永太科技再获宁德VC三年9万吨长单叠加天赐/新宙邦一体化扩能，头部企业份额持续抬升；VC因个别企业出货受阻价格周内+14.3%创新高、FEC同步走强，添加剂细分赛道盈利弹性打开。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "⚠️ 风险",
                "content": "六氟磷酸锂周内下跌7.08%至10.50万元/吨、月内区间10.8-11.8万元/吨，碳酸锂期货近两日虽反弹逾3%但枧下窝锂矿复产在即、四季度将补充国内10-20万吨LCE增量，上游原料端价格回调对电解液成品价格形成持续成本压力。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "📋 行动建议",
                "content": "短期跟踪六氟磷酸锂在10万元/吨关口企稳、VC/FEC价格传导节奏与7月电池厂订单谈价结果，优先争取与头部电池厂签定6F/VC年度长协；中期借力天赐/新宙邦/永太等龙头扩产契机锁定上游原料供应、巩固一体化优势。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "👁️ 重点关注",
                "content": "聚焦四线：其一，碳酸锂期货反弹持续性及枧下窝四季度复产兑现度对盘面扰动；其二，VC/FEC供给扰动能否持续及下游对高价货源接受度；其三，6月电池厂排产兑现与7月订单谈价结果；其四，钠电电解液与高电压(>4.4V)电解液商业化进展。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              }
            ]
          }
        ],
        "updated_at": "2026-06-30"
      },
      "kls": {
        "bu_name": "kls",
        "sections": [
          {
            "dim": "topnews",
            "title": "今日关注",
            "items": [
              {
                "title": "尿素UR2609收1741元微涨0.35%",
                "content": "",
                "priority": "P1",
                "source": "瑞达期货，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "车用尿素1-5月产量同比降30.52%",
                "content": "",
                "priority": "P0",
                "source": "光大期货，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "五部门启动2026年新能源汽车下乡",
                "content": "",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "湛江50亿300万吨绿色尿素项目启动",
                "content": "",
                "priority": "P1",
                "source": "中国新闻网，2026-06-26",
                "url": "",
                "date": "2026-06-26"
              }
            ]
          },
          {
            "dim": "market",
            "title": "市场/价格",
            "items": [
              {
                "title": "WTI 8月原油期货",
                "content": "价格：70.75美元/桶\n涨跌：+1.52美元（+2.20%）\n来源：中国基金报，2026-06-30",
                "priority": "P1",
                "source": "中国基金报，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "布伦特原油期货",
                "content": "价格：73.15美元/桶\n涨跌：+1.16美元（+1.61%）\n来源：中国基金报，2026-06-30",
                "priority": "P1",
                "source": "中国基金报，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "碳酸锂期货LC2609主力",
                "content": "价格：16.05万元/吨\n涨跌：-1.13万元（-6.58%）\n来源：新浪财经，2026-06-18",
                "priority": "P1",
                "source": "新浪财经，2026-06-18",
                "url": "",
                "date": "2026-06-18"
              },
              {
                "title": "尿素期货UR2609主力",
                "content": "价格：1741元/吨\n涨跌：+6元（+0.35%）\n来源：瑞达期货，2026-06-29",
                "priority": "P0",
                "source": "瑞达期货，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "山东中小颗粒尿素出厂",
                "content": "价格：1730-1780元/吨\n涨跌：-20元/吨\n来源：农资与市场，2026-06-29",
                "priority": "P0",
                "source": "农资与市场，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "河南中小颗粒尿素出厂",
                "content": "价格：1730-1790元/吨\n涨跌：-20元/吨\n来源：农资与市场，2026-06-29",
                "priority": "P0",
                "source": "农资与市场，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "河北小颗粒尿素出厂",
                "content": "价格：1750-1770元/吨\n涨跌：-10元/吨\n来源：农资与市场，2026-06-29",
                "priority": "P1",
                "source": "农资与市场，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "山西中小颗粒尿素出厂",
                "content": "价格：1640-1720元/吨\n涨跌：-20元/吨\n来源：农资与市场，2026-06-29",
                "priority": "P1",
                "source": "农资与市场，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "安徽小颗粒尿素出厂",
                "content": "价格：1760-1770元/吨\n涨跌：-10元/吨\n来源：农资与市场，2026-06-29",
                "priority": "P1",
                "source": "农资与市场，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "尿素企业总库存累库压力延续",
                "content": "尿素企业总库存113.36万吨，较上周期增加4.78万吨、环比+4.40%，下游承接乏力、货源滞留中上游，工厂端库存压力持续累积。",
                "priority": "P1",
                "source": "瑞达期货，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "尿素开工率维持90%+历史高位",
                "content": "尿素行业开工率92.83%，较去年同期+6.65pct；日产22.15万吨，较去年同期增加2.2万吨；本周装置复产带动产量小幅增加，供应宽松格局延续。",
                "priority": "P1",
                "source": "银河期货，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "尿素港口库存维持低位",
                "content": "尿素港口库存14.49万吨，环比-0.50万吨（-3.34%），出口集港未形成规模性消耗、内外价差收窄，制约出口套利空间。",
                "priority": "P1",
                "source": "瑞达期货，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "尿素出口指导价底线约束松动空间",
                "content": "氮肥工业协会要求小颗粒出口不低于FOB 430美元/吨、车用和大颗粒440美元/吨优先报批，订单大于5000吨需提供船名备查，实际放量仍受内外价差制约。",
                "priority": "P1",
                "source": "期货日报，2026-06-26",
                "url": "",
                "date": "2026-06-26"
              }
            ]
          },
          {
            "dim": "policy",
            "title": "政策/行业",
            "items": [
              {
                "title": "尿素出口政策精细化调控延续",
                "content": "氮肥工业协会发布最新指导价，要求各企业参照国际主流价格申报，小颗粒暂定不低于FOB 430美元/吨、车用和大颗粒440美元/吨优先报批；5000吨以上订单需提供船名备查，2026年走出\"春耕严管保民生、淡季放配额去产能、底价托底稳行业\"路径。",
                "priority": "P1",
                "source": "期货日报，2026-06-26",
                "url": "",
                "date": "2026-06-26"
              },
              {
                "title": "车用尿素高纯度制备技术取得突破",
                "content": "2026年车用尿素高纯度制备技术实现突破，产品纯度达99.8%以上，满足国六排放标准要求；定制化专用尿素国产化率突破88%，较2025年提升3个百分点，肥料利用率提升30%以上，行业向绿色化、功能化、高端化方向加速转型。",
                "priority": "P1",
                "source": "中国报告大厅，2026-04-09",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "2026年新能源汽车下乡活动启动",
                "content": "工信部、商务部会同发改委、农业农村部、国家能源局于6月25日在新疆塔城、海南澄迈同步启动2026年新能源汽车下乡活动，155款车型入选推荐目录，将为柴油商用车存量市场提供车用尿素消费基本盘，但短期增量贡献有限。",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "《新型能源体系建设\"十五五\"规划》发布",
                "content": "国家发改委、能源局印发《新型能源体系建设\"十五五\"规划》，明确到2030年新型储能装机达到300GW，加快卫星互联网、太空光伏产业链发展，新能源商用车渗透率提升将间接拉动车用尿素行业向\"产品高端化+服务智能化\"并行升级。",
                "priority": "P1",
                "source": "中银证券，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "enterprise",
            "title": "企业动态",
            "items": [
              {
                "title": "广东湛江50亿元300万吨绿色尿素项目启动",
                "content": "中国平煤神马控股集团旗下河南能源化工国际贸易集团与河南省中原大化集团共同投建，总投资50亿元，总规划年产300万吨尿素，首创\"两新一绿\"模式，全部建成后年营业收入将突破100亿元，延伸至三聚氰胺、氰尿酸盐、泡绵等下游高端新材料。",
                "priority": "P1",
                "source": "中国新闻网，2026-06-26",
                "url": "",
                "date": "2026-06-26"
              },
              {
                "title": "中煤鄂尔多斯全国首个尿素集装化运输试点投用",
                "content": "中煤鄂尔多斯能源化工有限公司尿素带托盘集装化列车顺利首发，标志全国首个尿素集装化运输试点项目正式落地，实现袋装尿素铁路整托标准化装卸、机械化作业；装卸成本降幅约25%，单趟装车缩短1.5小时/年减少延时费25万元。",
                "priority": "P1",
                "source": "中化新网，2026-06-24",
                "url": "",
                "date": "2026-06-24"
              },
              {
                "title": "尿素行业集中度持续提升",
                "content": "2025年尿素行业CR10产能占比达53.7%，后期预计进一步提高；煤制氨占比超70%，气头装置为辅；下半年仍有507万吨待投产能，年底尿素产能有望达8600万吨以上，行业开工率87%下日产22万吨以上将成为业内常态，结构性产能压力加剧。",
                "priority": "P1",
                "source": "光大期货，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "tech",
            "title": "技术/产品",
            "items": [
              {
                "title": "抗结晶、低杂质高端车用尿素配方成研发方向",
                "content": "车用尿素行业产品端正致力于研发抗结晶、低杂质的高端配方，以应对极端气候和复杂路况下的使用需求；服务端传统桶装销售正向\"智能加注\"升级，移动加注车、智能加注站等新型服务模式开始普及，解决用户\"加注难、加注贵\"痛点。",
                "priority": "P1",
                "source": "中研网，2026-02-25",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "SCR系统+车用尿素仍为国六达标核心技术路径",
                "content": "车用尿素作为SCR系统关键还原剂可将NOx转化率达90%以上，是实现国五、国六乃至更高排放标准的关键技术要素；国六B于2023年7月1日全面落地，国家第七阶段机动车污染物排放标准已公开征求意见，叠加车载OBD系统实时监控，将持续抬升合规需求。",
                "priority": "P1",
                "source": "华泰期货，2025-12-01",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "project",
            "title": "项目/招标",
            "items": [
              {
                "title": "印度NFL尿素招标170万吨落地",
                "content": "6月8日印度NFL尿素进口招标共收到33家供货商总计625.05万吨货源，东海岸最低到岸价444.90美元/吨（50万吨），西海岸449.30美元/吨（23.4万吨），意向采购量170万吨，价格较4月15日IPL招标下跌500美元/吨，国内出口暂难放量。",
                "priority": "P1",
                "source": "华泰期货，2026-06-26",
                "url": "",
                "date": "2026-06-26"
              },
              {
                "title": "湛江绿色低碳尿素示范项目产业链招商签约",
                "content": "6月26日广东湛江绿色低碳尿素示范项目启动仪式暨产业链招商活动同步举行，配套液散码头建设提上日程，将实现液氨从船舶到厂区的管道直连输送，筑牢供应链安全防线；项目向三聚氰胺、氰尿酸盐等下游高端新材料领域延伸。",
                "priority": "P1",
                "source": "中国新闻网，2026-06-26",
                "url": "",
                "date": "2026-06-26"
              }
            ]
          },
          {
            "dim": "tips",
            "title": "专属提示",
            "items": [
              {
                "title": "💰 机会",
                "content": "氮肥工业协会出口指导价设硬底线（小颗粒FOB 430美元/吨、车用大颗粒440美元/吨）配合国内3季度自律指导价上调100-210元/吨，若印标低价压制松动+夏季玉米追肥与南方水稻备肥集中启动，叠加湛江50亿300万吨项目尚未投产释放，6月底至7月UR2609在1700-1800区间存在逢低反弹空间。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "⚠️ 风险",
                "content": "尿素企业总库存连涨至113.36万吨（+4.4%），行业开工率92.83%历史高位、日产22.15万吨；车用尿素1-5月产量同比大降30.52%反映柴油商用车存量下滑、车用尿素刚需收缩；下半年仍有507万吨待投产能，年底产能或达8600万吨以上，结构性供应宽松压制中长期价格中枢。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "📋 行动建议",
                "content": "短期跟踪UR2609在1700-1800区间波动节奏与基差（山东75元/吨）变化，逢回调可试探性锁价；车用尿素业务应加快抗结晶高端配方与智能加注站布局，依托国六OBD系统合规要求巩固民营加油站、汽修门店差异化渠道；中长期需关注国家第七阶段排放标准征求意见稿落地节奏。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "👁️ 重点关注",
                "content": "聚焦四线：其一，印度NFL招标后续动态与国内出口配额下发节奏；其二，复合肥行业开工率（32.22%）回升与三聚氰胺（59.52%）需求恢复情况；其三，6月底-7月国内夏季玉米追肥与南方水稻移栽用肥集中启动兑现度；其四，新能源汽车下乡155款车型对柴油商用车存量替代节奏的影响。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              }
            ]
          }
        ],
        "updated_at": "2026-06-30"
      },
      "lpsd": {
        "bu_name": "lpsd",
        "sections": [
          {
            "dim": "topnews",
            "title": "今日关注",
            "items": [
              {
                "title": "枧下窝锂矿停产10个月后正式复产",
                "content": "",
                "priority": "P0",
                "source": "新浪财经，2026-06-30",
                "url": "https://k.sina.cn/article_7880068204_1d5b04c6c06801a89a.html",
                "date": "2026-06-30"
              },
              {
                "title": "碳酸锂LC2609周内跌6.4%破15万",
                "content": "",
                "priority": "P0",
                "source": "正大期货，2026-06-29",
                "url": "http://www.obqg.com/jjsj/39024.html",
                "date": "2026-06-29"
              },
              {
                "title": "《新型能源体系建设十五五规划》落地",
                "content": "",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "https://www.china5e.com/news/news-1205671-1.html",
                "date": "2026-06-29"
              },
              {
                "title": "新能源车下乡活动五部门联合启动",
                "content": "",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "https://www.china5e.com/news/news-1205671-1.html",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "market",
            "title": "市场/价格",
            "items": [
              {
                "title": "碳酸锂期货LC2609主力收盘价",
                "content": "价格：150220元/吨\n涨跌：-620元/吨（-0.41%）\n来源：五矿期货MMLC指数，2026-06-29",
                "priority": "P0",
                "source": "五矿期货MMLC指数，2026-06-29",
                "url": "https://www.wukuang.com",
                "date": "2026-06-29"
              },
              {
                "title": "电池级碳酸锂现货均价",
                "content": "价格：153000元/吨\n涨跌：周环比-8.8%（折合-14700元/吨）\n来源：天风证券，2026-06-29",
                "priority": "P0",
                "source": "天风证券，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "工业级碳酸锂均价MMLC",
                "content": "价格：147650元/吨（142500-152800区间）\n涨跌：-2.77%\n来源：五矿钢联MMLC，2026-06-29",
                "priority": "P1",
                "source": "五矿钢联MMLC，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "电池级氢氧化锂价格",
                "content": "价格：139000元/吨\n涨跌：周环比-8.86%\n来源：天风证券，2026-06-29",
                "priority": "P1",
                "source": "天风证券，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "锂精矿CIF中国现货报价",
                "content": "价格：6%品位 2450-2571美元/吨\n涨跌：周环比-60美元/吨\n来源：紫金天风/中辉期货，2026-06-29",
                "priority": "P1",
                "source": "紫金天风期货，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "国内锂云母精矿价格",
                "content": "价格：1.5%-2.0%品位 3700元/吨；2.0%-2.5%品位 5270元/吨\n涨跌：周环比-115/-205元/吨\n来源：紫金天风期货，2026-06-29",
                "priority": "P1",
                "source": "紫金天风期货，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "WTI原油期货收盘价",
                "content": "价格：70.75美元/桶\n涨跌：+1.52美元（+2.20%）\n来源：财联社/中国基金报，2026-06-30",
                "priority": "P0",
                "source": "中国基金报，2026-06-30",
                "url": "https://www.chnfund.com/article/20478f3a-6899-f083-fd95-3a2226e7f281",
                "date": "2026-06-30"
              },
              {
                "title": "布伦特原油期货收盘价",
                "content": "价格：73.15美元/桶\n涨跌：+1.16美元（+1.61%）\n来源：中国基金报，2026-06-30",
                "priority": "P0",
                "source": "中国基金报，2026-06-30",
                "url": "https://www.chnfund.com/article/20478f3a-6899-f083-fd95-3a2226e7f281",
                "date": "2026-06-30"
              },
              {
                "title": "上海原油期货夜盘结算价",
                "content": "价格：463.70元/桶\n涨跌：+0.41%\n来源：汇通财经/上海国际能源交易中心，2026-06-30",
                "priority": "P1",
                "source": "汇通财经，2026-06-30",
                "url": "https://www.fx678.com/C/20260630/202606300231141129.html",
                "date": "2026-06-30"
              },
              {
                "title": "国内锂电排产7月数据",
                "content": "数据：7月国内锂电排产总量约283GWh，环比+5.6%；磷酸铁锂周度产量12.54万吨，开工率95.06%\n来源：大东时代智库/铜冠金源，2026-06-29",
                "priority": "P1",
                "source": "正信期货，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "碳酸锂社会库存去化",
                "content": "数据：大样本库存13.18万吨，周环比-1207吨；期货仓单48544手，周环比-3431手\n来源：正信期货，2026-06-29",
                "priority": "P1",
                "source": "正信期货，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "津巴布韦锂矿陆续发运",
                "content": "数据：津巴布韦2月底暂停发运、4月底逐步放开，国内集中到港或在7月中下旬\n来源：光大期货，2026-06-29",
                "priority": "P1",
                "source": "光大期货，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "policy",
            "title": "政策/行业",
            "items": [
              {
                "title": "《新型能源体系建设十五五规划》正式发布",
                "content": "国家发改委、能源局6月25日印发《新型能源体系建设\"十五五\"规划》，明确到2030年新型储能装机达到300GW；规划提出强化战略性矿产目录与资源储备，加快推进钙钛矿、钠电等下一代技术产业化。",
                "priority": "P0",
                "source": "中银证券，2026-06-29",
                "url": "https://www.cnenergynews.cn/article/4SAkSmyncg9",
                "date": "2026-06-29"
              },
              {
                "title": "《矿产资源法实施条例》6月15日起施行",
                "content": "国务院常务会议5月9日审议通过《矿产资源法实施条例》，6月15日正式施行，细化矿业权管理与矿产开发全链条制度，明确战略性矿产保护性开采原则，倒逼锂云母矿证规范与生态修复责任落实。",
                "priority": "P0",
                "source": "证券时报，2026-05-12",
                "url": "http://www.stcn.com/article/detail/3904070.html",
                "date": "2026-06-15"
              },
              {
                "title": "广期所碳酸锂期货引入境外交易者",
                "content": "广期所6月18日公告，将碳酸锂期货和期权纳入境内特定品种并引入境外交易者，已取得交易权限的境内客户无需重新评估，新开境外客户后续将统一开通。",
                "priority": "P0",
                "source": "广州期货交易所，2026-06-18",
                "url": "https://www.gfex.com.cn",
                "date": "2026-06-18"
              },
              {
                "title": "五部门启动2026年新能源汽车下乡活动",
                "content": "工信部、商务部会同发改委、农业农村部、国家能源局6月25日在新疆塔城、海南澄迈同时启动2026年新能源汽车下乡活动，155款车型入选推荐目录，强化县域与乡村消费市场拓展。",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "https://www.china5e.com/news/news-1205671-1.html",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "enterprise",
            "title": "企业动态",
            "items": [
              {
                "title": "宁德时代枧下窝锂矿正式复产",
                "content": "宁德时代旗下宜春时代枧下窝锂矿6月29日正式恢复生产，年产10万吨LCE，折合碳酸锂当量657万吨；该项目2025年8月因采矿证到期停工，历经10个月审批后于6月26日完成全部复产流程。",
                "priority": "P0",
                "source": "新浪财经，2026-06-30",
                "url": "https://k.sina.cn/article_7880068204_1d5b04c6c06801a89a.html",
                "date": "2026-06-30"
              },
              {
                "title": "宁德时代与中国节能深化战略合作",
                "content": "宁德时代与中国节能近日签署深化战略合作协议，聚焦钙钛矿工业化量产、天恒钠电储能系统应用、全域零碳场景与海外绿色矿山开发，加速前沿技术工业化落地。",
                "priority": "P1",
                "source": "每日经济新闻，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "宁德时代线上直销平台上线",
                "content": "宁德时代6月26日宣布面向中小集成商的线上直销平台正式上线，进一步拓宽销售渠道并降低下游客户采购门槛，配合钠电储能系统发布完善储能市场布局。",
                "priority": "P1",
                "source": "界面新闻，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "大中矿业鸡脚山锂矿产能扩至4万吨",
                "content": "大中矿业将湖南临武鸡脚山矿区通天庙矿段2,000万吨/年锂矿采选尾一体化项目年产碳酸锂产能由2万吨扩至4万吨；2025年7月1日新法实施后该项目成为全国首个获批锂矿采矿证的项目。",
                "priority": "P2",
                "source": "大中矿业2025年报跟踪评级，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              }
            ]
          },
          {
            "dim": "tech",
            "title": "技术/产品",
            "items": [
              {
                "title": "宁德时代发布首款钠离子电池储能系统",
                "content": "6月22日宁德时代在德国慕尼黑光伏储能展正式发布首款钠离子电池储能系统，单套最高能量超30MWh，支持多时长模块化配置，配套天恒钠电将服务于国家级大型光储项目。",
                "priority": "P0",
                "source": "广发证券，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "尊界S800典藏大观上市",
                "content": "6月26日尊界S800典藏大观正式上市，售价138.8万元，作为自主品牌超豪华旗舰重塑百万级价值标杆，搭载新一代智能驾驶与高密度电池系统。",
                "priority": "P1",
                "source": "中国能源网，2026-06-26",
                "url": "https://www.china5e.com",
                "date": "2026-06-26"
              },
              {
                "title": "三一重卡刷新我国新能源牵引车单次出口最高纪录",
                "content": "三一重卡近期完成单次最大批量新能源牵引车出口，刷新我国新能源牵引车单次出口最高纪录，标志国产新能源重卡海外渗透提速。",
                "priority": "P2",
                "source": "中国能源网，2026-06-29",
                "url": "https://www.china5e.com/news/news-1205658-1.html",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "project",
            "title": "项目/招标",
            "items": [
              {
                "title": "中石化签约40万吨SAF项目设计合同",
                "content": "中石化宁波工程6月29日与Allied Biofuels FE LLC签署乌兹别克斯坦可持续航空燃料项目前端工程设计与详细设计合同，年产SAF 40万吨、总投资约61亿美元，为中亚首个全产业链生物航油综合体。",
                "priority": "P0",
                "source": "索比光伏网，2026-06-29",
                "url": "https://h2.solarbe.com/news/20260629/50025043.html",
                "date": "2026-06-29"
              },
              {
                "title": "鸡脚山锂矿采选尾一体化项目",
                "content": "湖南临武县鸡脚山矿区通天庙矿段2,000万吨/年锂矿采选尾一体化项目总投资28.41亿元，截至2026年3月末累计已投资6.52亿元，是新矿产资源法实施后首个获批锂矿采矿证项目。",
                "priority": "P1",
                "source": "大中矿业跟踪评级报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "新能源汽车下乡推荐目录发布",
                "content": "工信部联合多部门6月25日发布2026年新能源汽车下乡推荐目录，155款车型入选，覆盖A0级至中高端主流价位，并配套以旧换新与置换更新补贴。",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "https://www.china5e.com/news/news-1205671-1.html",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "tips",
            "title": "专属提示",
            "items": [
              {
                "title": "💰 机会",
                "content": "7月国内锂电排产环比+5.6%至283GWh，磷酸铁锂开工率回升至95%；枧下窝复产虽增加远期供给，但短期LC2609贴水现货3000元、电池级现货15.3万处年内低位，下游补货与套保入场需求可期。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "⚠️ 风险",
                "content": "津巴布韦锂矿7月中下旬集中到港、澳矿发运增量、6月碳酸锂排产11.6万吨同增2.6%，三大利空叠加7月底仓单强制注销压力，期价上方高度受限；尼日利亚权益金推高海外成本2.2万元/吨LCE。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "📋 行动建议",
                "content": "短期跟踪LC2609在14.0-15.4万区间运行节奏，结合枧下窝爬产进度与津巴布韦到港兑现度择机逢低建多；借力广期所引入境外交易者契机探索海外矿山套保渠道，关注钙钛矿/钠电产业链原材料卡位。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "👁️ 重点关注",
                "content": "聚焦四线：其一，枧下窝三季度爬坡进度与设备检修状态；其二，7月15日左右津巴布韦集中到港兑现度；其三，7月底碳酸锂仓单强制注销对盘面冲击；其四，新型能源\"十五五\"规划下新型储能300GW路线图落地节奏。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              }
            ]
          }
        ],
        "updated_at": "2026-06-30"
      },
      "lube": {
        "bu_name": "lube",
        "sections": [
          {
            "dim": "topnews",
            "title": "今日关注",
            "items": [
              {
                "title": "路博润与统一发布全球首款AI柴油机油",
                "content": "",
                "priority": "P0",
                "source": "界面新闻，2026-06-29",
                "url": "https://www.jiemian.com/article/14663410.html",
                "date": "2026-06-29"
              },
              {
                "title": "昆仑润滑链博会展示整体润滑解决方案",
                "content": "",
                "priority": "P0",
                "source": "中欧国际，2026-06-26",
                "url": "https://www.zoeexpo.com/news/171717.html",
                "date": "2026-06-26"
              },
              {
                "title": "新版车用润滑油国标7月1日实施",
                "content": "",
                "priority": "P1",
                "source": "美合科技2025年年度报告，2026-04-24",
                "url": "",
                "date": "2026-04-24"
              },
              {
                "title": "枧下窝锂矿6月29日正式复产",
                "content": "",
                "priority": "P1",
                "source": "新浪网，2026-06-30",
                "url": "https://k.sina.com.cn/article_7880068204_1d5b04c6c06801a89a.html",
                "date": "2026-06-30"
              }
            ]
          },
          {
            "dim": "market",
            "title": "市场/价格",
            "items": [
              {
                "title": "WTI原油期货主力",
                "content": "价格：70.75美元/桶\n涨跌：+1.52美元（+2.20%）\n来源：财联社/汇通财经，2026-06-30",
                "priority": "P1",
                "source": "财联社，2026-06-30",
                "url": "https://www.cls.cn/detail/2412243",
                "date": "2026-06-30"
              },
              {
                "title": "布伦特原油期货主力",
                "content": "价格：73.15美元/桶\n涨跌：+1.16美元（+1.61%）\n来源：中国基金报，2026-06-30",
                "priority": "P1",
                "source": "中国基金报，2026-06-30",
                "url": "https://www.chnfund.com/article/20478f3a-6899-f083-fd95-3a2226e7f281",
                "date": "2026-06-30"
              },
              {
                "title": "WTI 8月原油电子盘(盘中)",
                "content": "价格：70.27美元/桶\n涨跌：+1.04美元（+1.50%）\n来源：汇通财经/百家号，2026-06-30",
                "priority": "P2",
                "source": "汇通财经，2026-06-30",
                "url": "https://news.fx678.com/202606300232251122.shtml",
                "date": "2026-06-30"
              },
              {
                "title": "布伦特原油8月合约(盘中)",
                "content": "价格：73.52美元/桶\n涨跌：+0.92美元（+1.27%）\n来源：汇通财经，2026-06-30",
                "priority": "P2",
                "source": "汇通财经，2026-06-30",
                "url": "https://news.fx678.com/C/20260630/202606300231141129.html",
                "date": "2026-06-30"
              },
              {
                "title": "碳酸锂期货LC2609主力",
                "content": "价格：约16.05万元/吨（6月18日收盘）\n涨跌：当日深跌6.58%，较前期高点跌幅超两成\n来源：新浪网，2026-06-30",
                "priority": "P1",
                "source": "新浪网，2026-06-30",
                "url": "https://k.sina.com.cn/article_7880068204_1d5b04c6c06801a89a.html",
                "date": "2026-06-30"
              },
              {
                "title": "电池级碳酸锂现货均价",
                "content": "价格：16.88万元/吨（6月18日）\n涨跌：较前一工作日下跌800元\n来源：上海钢联，2026-06-18",
                "priority": "P1",
                "source": "新浪网，2026-06-30",
                "url": "https://k.sina.com.cn/article_7857201856_1d45362c001907kbkm.html",
                "date": "2026-06-30"
              },
              {
                "title": "碳酸锂现货5月中旬高点",
                "content": "价格：突破20万元/吨（5月中旬）\n涨跌：年内涨幅近70%\n来源：证券时报，2026-06-30",
                "priority": "P2",
                "source": "证券时报，2026-06-30",
                "url": "https://www.china5e.com/news/news-1205671-1.html",
                "date": "2026-06-30"
              },
              {
                "title": "尿素期货UR2609主力",
                "content": "价格：1741元/吨（6月29日收盘）\n涨跌：+6元（+0.35%）；周内6月26日收1735元/吨周跌4.3%\n来源：搜狐/顶尖财经网，2026-06-29",
                "priority": "P1",
                "source": "搜狐，2026-06-29",
                "url": "https://www.sohu.com/a/1043236256_121124547",
                "date": "2026-06-29"
              },
              {
                "title": "尿素现货山东主流价",
                "content": "价格：1810元/吨（6月25日）\n涨跌：较上周-10元/吨\n来源：瑞达期货，2026-06-26",
                "priority": "P2",
                "source": "瑞达期货，2026-06-26",
                "url": "",
                "date": "2026-06-26"
              },
              {
                "title": "尿素现货江苏主流价",
                "content": "价格：1830元/吨（6月25日）\n涨跌：较上周-10元/吨\n来源：瑞达期货，2026-06-26",
                "priority": "P2",
                "source": "瑞达期货，2026-06-26",
                "url": "",
                "date": "2026-06-26"
              },
              {
                "title": "昆仑全损耗系统用油L-AN 32",
                "content": "价格：经销商结算价2658.35元/170公斤\n来源：我的钢铁网，2026-06-29",
                "priority": "P2",
                "source": "我的钢铁网，2026-06-29",
                "url": "https://nenghua.mysteel.com/a/26062909/717FE2C35A3060A7.html",
                "date": "2026-06-29"
              },
              {
                "title": "昆仑全损耗系统用油L-AN 68",
                "content": "价格：经销商结算价2885.99元/170公斤\n来源：我的钢铁网，2026-06-29",
                "priority": "P2",
                "source": "我的钢铁网，2026-06-29",
                "url": "https://nenghua.mysteel.com/a/26062909/717FE2C35A3060A7.html",
                "date": "2026-06-29"
              },
              {
                "title": "昆仑OCP粘度指数改进剂T612",
                "content": "价格：15180元/吨（165kg/桶）\n来源：我的钢铁网，2026-06-29",
                "priority": "P2",
                "source": "我的钢铁网，2026-06-29",
                "url": "https://nenghua.mysteel.com/a/26062910/E66B5C5FE925FAC0.html",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "policy",
            "title": "政策/行业",
            "items": [
              {
                "title": "新版车用润滑油国标7月1日实施",
                "content": "国家标准化管理委员会2025年发布的新版汽油机油、柴油机油国家标准将于2026年7月1日正式实施，对车用润滑油提出更高质量要求，叠加2025年发布的GB 29743.2电动汽车冷却液、GB 29743.3燃料电池冷却液国标密集落地，倒逼低端产能出清、为高端产品打开替代空间。",
                "priority": "P0",
                "source": "美合科技2025年年度报告，2026-04-24",
                "url": "",
                "date": "2026-04-24"
              },
              {
                "title": "节能装备高质量发展实施方案落地",
                "content": "工业和信息化部、国家发改委、国务院国资委、国家能源局2026年3月20日发布《节能装备高质量发展实施方案（2026—2028年）》，要求在电机、风机、泵、压缩机等负载设备攻关高效长寿命润滑油等关键材料，并在工业热泵攻关耐高温润滑油，润滑油被纳入节能装备攻关清单。",
                "priority": "P1",
                "source": "盘古智能2025年年度报告，2026-04-25",
                "url": "",
                "date": "2026-04-25"
              },
              {
                "title": "五部门启动2026年新能源汽车下乡",
                "content": "工业和信息化部、商务部会同国家发改委、农业农村部、国家能源局于6月25日在新疆塔城、海南澄迈同步启动2026年新能源汽车下乡活动，155款车型入选推荐目录，将进一步下沉县域及乡村消费市场，利好上游润滑油及零部件、充电配套产业链协同发展。",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "https://www.china5e.com/news/news-1205671-1.html",
                "date": "2026-06-29"
              },
              {
                "title": "废矿物油回收国标驱动行业出清",
                "content": "2024年11月正式实施的《废矿物油回收与再生利用导则》(GB/T 17145-2024)是我国废矿物油回收领域首部覆盖全链条的国家标准，通过淘汰落后工艺、强化智能监管、提升环保门槛，直接引发技术升级加速与中小企业出清，行业CR10迎来跳跃式提升。",
                "priority": "P2",
                "source": "中研网，2026-06-05",
                "url": "https://www.chinairn.com/hyzx/20260605/173257513.shtml",
                "date": "2026-06-05"
              }
            ]
          },
          {
            "dim": "enterprise",
            "title": "企业动态",
            "items": [
              {
                "title": "昆仑润滑链博会展示全链条自主方案",
                "content": "中国石油旗下昆仑润滑在第四届链博会清洁能源链展区亮相，集中展示适配高端装备、新能源、电力等领域的整体润滑解决方案，覆盖超深井顶驱合成齿轮油、特高压环烷基变压器油、大功率风电齿轮油、高铁齿轮润滑油等核心产品，体现从合成基础油、核心添加剂到终端成品的全链条自主可控布局。",
                "priority": "P0",
                "source": "中欧国际，2026-06-26",
                "url": "https://www.zoeexpo.com/news/171717.html",
                "date": "2026-06-26"
              },
              {
                "title": "宁德时代与中国节能深化战略合作",
                "content": "宁德时代与中国节能近日签署深化战略合作协议，聚焦下一代光伏技术、钠电储能系统应用、全域零碳场景建设及海外绿色矿山开发，加速钙钛矿工业化量产、引入天恒钠电储能系统、打造全域零碳岛，进一步拓宽储能、新能源综合服务边界。",
                "priority": "P1",
                "source": "每日经济新闻，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "博汇股份与昆仑润滑合作深化",
                "content": "博汇股份6月18日在互动平台表示，公司与中石油润滑油公司（昆仑润滑）的合作已从产品供应向新品研发、技术协同、业务拓展等方向持续深化，基础油通常用于生产润滑油等；公司已中标中石油润滑油公司合格供应商，对润滑油业务发展形成有力支撑。",
                "priority": "P1",
                "source": "证券日报，2026-06-18",
                "url": "",
                "date": "2026-06-18"
              },
              {
                "title": "国润新材料开业投产供货特斯拉上汽通用",
                "content": "国润新材料（浙江）有限公司新厂房1月启动试运营、6月5日正式开业投产，引入全套全自动化生产线；公司已为特斯拉、上汽通用等主机厂供货工业润滑油产品，偌大车间仅需5名工人值守即可稳定产出。",
                "priority": "P1",
                "source": "龙游县人民政府，2026-06-10",
                "url": "http://www.longyou.gov.cn/col/col1242989/art/2026/art_4f19fb1c993e4c2989c525b38947a38c.html",
                "date": "2026-06-10"
              }
            ]
          },
          {
            "dim": "tech",
            "title": "技术/产品",
            "items": [
              {
                "title": "路博润与统一发布全球首款AI柴油机油",
                "content": "路博润与统一石化在2026全球技术大会上联合发布两款柴油机油新品：钛粒王AI智研低灰分合成柴机油为全球首款实现AI全流程研发并商业化量产的产品；三合一超低灰分钛粒王(CK-4|CNG|D1 10W-40)率先融合API CK-4、康明斯CES 20086与中国D1国标(GB 11122-2025)三大标准体系，标志着润滑油研发从经验驱动迈向计算驱动。",
                "priority": "P0",
                "source": "界面新闻，2026-06-29",
                "url": "https://www.jiemian.com/article/14663410.html",
                "date": "2026-06-29"
              },
              {
                "title": "亚培烯mPAO国产化突破",
                "content": "亚培烯科技作为四类润滑油基础油mPAO（茂金属聚α-烯烃）的全球主要厂商之一，产能位居国内第一、全球前三，已实现1.5万吨量产、连云港3万吨产能规划推进中，突破了mPAO长期被埃克森美孚等国外企业垄断的局面，为高端润滑油及数据中心冷却液提供国产关键材料。",
                "priority": "P1",
                "source": "每日经济新闻，2026-06-12",
                "url": "",
                "date": "2026-06-12"
              },
              {
                "title": "昆仑润滑40余品种实现国产替代",
                "content": "近5年中国石油润滑油公司攻克四大类46种关键添加剂核心技术，昆仑润滑系列产品累计替代40余个进口品种，自主超深井顶驱合成齿轮油完成8000小时使用验证，自主研发高端汽轮机油打破进口依赖，长寿命商用电驱桥油打破外资品牌在电动商用车轻型电驱桥油市场长期垄断。",
                "priority": "P1",
                "source": "中国化工报，2026-06-15",
                "url": "",
                "date": "2026-06-15"
              }
            ]
          },
          {
            "dim": "project",
            "title": "项目/招标",
            "items": [
              {
                "title": "中石化签约40万吨SAF项目设计合同",
                "content": "中石化宁波工程有限公司与Allied Biofuels FE LLC在2026年第五届塔什干国际投资论坛签署乌兹别克斯坦可持续航空燃料（SAF）项目前端工程设计及详细设计合同，为中亚首个大型全产业链生物航油综合体，年产SAF 40万吨、总投资约61亿美元，配套光伏、绿氢、储能设施。",
                "priority": "P1",
                "source": "碳索氢能网，2026-06-29",
                "url": "https://h2.solarbe.com/news/20260629/50025043.html",
                "date": "2026-06-29"
              },
              {
                "title": "宁德时代枧下窝锂矿6月29日复产",
                "content": "宁德时代旗下江西宜春枧下窝锂矿于6月29日正式复产，碳酸锂年产能可达10万吨，已于6月26日走完复产所有流程，矿区总面积6.44平方公里、伴生氧化锂超265万吨、折合碳酸锂当量约657万吨，停产10个月后重启将改变国内锂市场供需格局。",
                "priority": "P1",
                "source": "新浪网，2026-06-30",
                "url": "https://k.sina.com.cn/article_7880068204_1d5b04c6c06801a89a.html",
                "date": "2026-06-30"
              },
              {
                "title": "伊泰B股临淄25万吨流体润滑新材料项目",
                "content": "伊泰B股总投资7.66亿元的25万吨/年流体润滑新材料项目于2025年11月在山东临淄正式开工建设，依托煤制油产业体系，以优质费托蜡为原料，采用费托蜡加氢异构技术，主打生产APIⅡ/Ⅱ+类高端润滑油基础油及食品级白油，将完善煤基新材料产业链布局。",
                "priority": "P2",
                "source": "伊泰B股2025年ESG报告，2026-04-24",
                "url": "",
                "date": "2026-04-24"
              }
            ]
          },
          {
            "dim": "tips",
            "title": "专属提示",
            "items": [
              {
                "title": "💰 机会",
                "content": "新版车用润滑油国标7月1日实施临近，叠加电动汽车冷却液、燃料电池冷却液国标密集落地，AI协同研发新品与高端合成基础油（mPAO/合成酯）需求双轮拉动；新能源车下乡启动打开下沉市场，配套油液迎来增量空间。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "⚠️ 风险",
                "content": "原油受霍尔木兹危机反复扰动，6月30日虽收涨但上周布伦特单周仍跌10.65%、WTI跌9.62%，地缘溢价回吐后价格中枢仍存下行压力；碳酸锂枧下窝复产与澳矿密集重启信号叠加，锂价存在进一步回调风险，传导至新能源车热管理流体成本端。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "📋 行动建议",
                "content": "短期跟踪7月1日新国标切换前后的渠道备货与价格传导节奏，优先布局D1国标、API CK-4、低SAPS规格等高端柴油机油产能；中长期借力AI研发模式与mPAO国产化契机拓展高端合成基础油及新能源专用油液（电驱油/减速器油/电池冷却液）配套。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "👁️ 重点关注",
                "content": "聚焦四线：其一，7月1日新版车用润滑油国标实施后的市场切换与渠道备货节奏；其二，路博润与统一AI柴油机油商业化进展及D1国标工程化验证；其三，昆仑润滑链博会签约转化与中石化40万吨SAF项目执行进度；其四，霍尔木兹海峡通航恢复速度与WTI/布伦特70-75美元区间博弈。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              }
            ]
          }
        ],
        "updated_at": "2026-06-30"
      },
      "sdmd": {
        "bu_name": "sdmd",
        "sections": [
          {
            "dim": "topnews",
            "title": "今日关注",
            "items": [
              {
                "title": "枧下窝锂矿6月29日正式复产",
                "content": "",
                "priority": "P0",
                "source": "新浪财经，2026-06-30",
                "url": "https://k.sina.com.cn/article_7880068204_1d5b04c6c06801a89a.html",
                "date": "2026-06-30"
              },
              {
                "title": "碳酸锂主力2609跌至16万关口",
                "content": "",
                "priority": "P1",
                "source": "新浪网，2026-06-30",
                "url": "https://k.sina.com.cn/article_7857201856_1d45362c001907kbkm.html",
                "date": "2026-06-30"
              },
              {
                "title": "《动力电池回收和综合利用管理办法》施行",
                "content": "",
                "priority": "P0",
                "source": "中国政府网，2026-06-24",
                "url": "https://www.gov.cn/gongbao/2026/issue_12686/202604/content_7066104.html",
                "date": "2026-06-30"
              },
              {
                "title": "锂电回收市场规模将破527亿元",
                "content": "",
                "priority": "P1",
                "source": "经济参考报，2026-06-29",
                "url": "http://dz.jjckb.cn/www/pages/webpage2009/html/2026-06/29/content_116819.htm",
                "date": "2026-06-30"
              }
            ]
          },
          {
            "dim": "market",
            "title": "市场/价格",
            "items": [
              {
                "title": "WTI原油期货主力",
                "content": "价格：70.75美元/桶\n涨跌：+1.52美元（+2.20%）\n来源：财联社，2026-06-30",
                "priority": "P1",
                "source": "财联社，2026-06-30",
                "url": "https://www.cls.cn/detail/2412243",
                "date": "2026-06-30"
              },
              {
                "title": "布伦特原油期货",
                "content": "价格：73.15美元/桶\n涨跌：+1.16美元（+1.61%）\n来源：中国基金报，2026-06-30",
                "priority": "P1",
                "source": "中国基金报，2026-06-30",
                "url": "https://www.chnfund.com/article/20478f3a-6899-f083-fd95-3a2226e7f281",
                "date": "2026-06-30"
              },
              {
                "title": "电池级碳酸锂均价",
                "content": "价格：16.88万元/吨\n涨跌：-800元/吨\n来源：Mysteel，2026-06-18",
                "priority": "P1",
                "source": "上海钢联，2026-06-18",
                "url": "",
                "date": "2026-06-18"
              },
              {
                "title": "工业级碳酸锂报价",
                "content": "价格：15.78万元/吨\n来源：Mysteel，2026-06-22",
                "priority": "P1",
                "source": "深圳市新能源汽车促进会，2026-06-22",
                "url": "http://www.neaa.org.cn/yuanchuang/2688.html",
                "date": "2026-06-22"
              },
              {
                "title": "碳酸锂期货2609主力",
                "content": "价格：150220元/吨\n涨跌：-5020元/吨\n来源：废旧电池，2026-06-26",
                "priority": "P1",
                "source": "废旧电池，2026-06-26",
                "url": "https://mp.weixin.qq.com/s/rpkKLFCcqNCL8jdIZiH_jg",
                "date": "2026-06-26"
              },
              {
                "title": "尿素期货UR2609主力",
                "content": "价格：1741元/吨\n涨跌：+6元/吨（+0.35%）\n来源：顶尖财经网，2026-06-29",
                "priority": "P1",
                "source": "顶尖财经网，2026-06-29",
                "url": "http://www.58188.com/new/2026/6-29/618709.html",
                "date": "2026-06-29"
              },
              {
                "title": "尿素现货基准价",
                "content": "价格：1811.25元/吨\n基差：+70.25元/吨\n来源：生意社，2026-06-29",
                "priority": "P1",
                "source": "同花顺，2026-06-29",
                "url": "http://goodsfu.10jqka.com.cn/20260629/c677806417.shtml",
                "date": "2026-06-29"
              },
              {
                "title": "三元铝壳废锂电池回收价",
                "content": "价格：28000-32100元/吨\n来源：嘉兴市场参考，2026-06",
                "priority": "P1",
                "source": "黄页88，2026-06",
                "url": "https://m.huangye88.com/ershouhuishou-dianzihuishou/783f3g2jrf47d6.html",
                "date": "2026-06-29"
              },
              {
                "title": "三元软包废锂电池回收价",
                "content": "价格：36000-45800元/吨\n来源：嘉兴市场参考，2026-06",
                "priority": "P1",
                "source": "黄页88，2026-06",
                "url": "https://m.huangye88.com/ershouhuishou-dianzihuishou/783f3g2jrf47d6.html",
                "date": "2026-06-29"
              },
              {
                "title": "磷酸铁锂铝壳废电池回收价",
                "content": "价格：9000-13100元/吨\n来源：嘉兴市场参考，2026-06",
                "priority": "P1",
                "source": "黄页88，2026-06",
                "url": "https://m.huangye88.com/ershouhuishou-dianzihuishou/783f3g2jrf47d6.html",
                "date": "2026-06-29"
              },
              {
                "title": "钴酸锂/手机杂电回收价",
                "content": "价格：6000-12000元/吨\n来源：嘉兴市场参考，2026-06",
                "priority": "P1",
                "source": "黄页88，2026-06",
                "url": "https://m.huangye88.com/ershouhuishou-dianzihuishou/783f3g2jrf47d6.html",
                "date": "2026-06-29"
              },
              {
                "title": "48V20Ah两轮电动车锂电池",
                "content": "价格：300-340元/组\n较2025年同期翻倍\n来源：今日头条，2026-06-25",
                "priority": "P1",
                "source": "今日头条，2026-06-25",
                "url": "https://www.toutiao.com/article/7655098883575431726",
                "date": "2026-06-29"
              },
              {
                "title": "6月26日三元废料集体降价",
                "content": "三元废料每吨下跌200-300元，磷酸铁锂同步走弱，钴酸锂、小三元不同程度降价，期货大跌传导至现货市场，回收商承压。",
                "priority": "P1",
                "source": "废旧电池，2026-06-26",
                "url": "https://mp.weixin.qq.com/s/netigQuZVbIDksgxPTFaSg",
                "date": "2026-06-26"
              },
              {
                "title": "亚洲黑粉NMC化学参考价",
                "content": "价格：8000-14000美元/干吨\n与LME钴镍锂价高度联动\n来源：IndexBox，2026",
                "priority": "P2",
                "source": "IndexBox，2026",
                "url": "https://www.indexbox.io/store/asia-lithium-ion-battery-recycling-market-analysis-forecast-size-trends-and-insights/",
                "date": "2026-06-29"
              },
              {
                "title": "枧下窝复产信号",
                "content": "宁德时代宜春枧下窝锂矿6月29日复产，年产能10万吨LCE，月度供给将恢复7000-8000吨碳酸锂当量。",
                "priority": "P1",
                "source": "新浪网，2026-06-30",
                "url": "https://k.sina.com.cn/article_7880068204_1d5b04c6c06801a89a.html",
                "date": "2026-06-30"
              }
            ]
          },
          {
            "dim": "policy",
            "title": "政策/行业",
            "items": [
              {
                "title": "动力电池回收管理办法正式施行",
                "content": "工业和信息化部等六部门联合发布的《新能源汽车废旧动力电池回收和综合利用管理暂行办法》自4月1日起施行，明确溯源平台、回收网点、综合利用规范等要求，建立全国动力电池信息溯源平台，加快构建全生命周期监管体系。",
                "priority": "P0",
                "source": "中国政府网，2026-06-24",
                "url": "https://www.gov.cn/gongbao/2026/issue_12686/202604/content_7066104.html",
                "date": "2026-06-24"
              },
              {
                "title": "五部门启动联合执法专项整治",
                "content": "商务部、市场监管总局等5部门联合印发《关于开展规范废旧动力电池回收利用联合执法专项行动的通知》，严打电动自行车废旧电池拼装、非法拆解、不履行溯源责任、无照经营等行为，强化警示震慑。",
                "priority": "P0",
                "source": "央广网，2026-06-06",
                "url": "https://www.cnr.cn/2013qcpd/2015xc/20260606/t20260606_527650245.shtml",
                "date": "2026-06-06"
              },
              {
                "title": "工信部召开回收利用专班二次会议",
                "content": "5月28日工信部召开全国新能源汽车动力电池回收利用工作专班第二次会议，要求用法治化手段规范回收利用，加快建立应对动力电池规模化退役长效机制，行业利润向高值化材料再生集中。",
                "priority": "P1",
                "source": "福建省工业和信息化厅，2026-06-01",
                "url": "http://gxt.fujian.gov.cn/zwgk/xw/hydt/xydt/202606/t20260601_7154855.htm",
                "date": "2026-06-01"
              },
              {
                "title": "新型能源体系十五五规划印发",
                "content": "国家发改委、能源局印发《新型能源体系建设十五五规划》，明确到2030年新型储能装机达300GW，固态电池迈向工程化验证关键期，太空光伏与反内卷为光伏投资双主线。",
                "priority": "P1",
                "source": "中银证券，2026-06-29",
                "url": "http://field.10jqka.com.cn/20260629/c677778078.shtml",
                "date": "2026-06-29"
              },
              {
                "title": "锂电回收市场跨入五百亿规模",
                "content": "中商产业研究院预测2026年中国锂电回收综合利用市场规模将达527亿元，较2025年222亿元同比倍增；公安部统计截至2025年底全国新能源汽车保有量达4397万辆，纯电动占68.74%。",
                "priority": "P1",
                "source": "经济参考报，2026-06-29",
                "url": "http://dz.jjckb.cn/www/pages/webpage2009/html/2026-06/29/content_116819.htm",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "enterprise",
            "title": "企业动态",
            "items": [
              {
                "title": "邦普循环全国回收网点超240家",
                "content": "宁德时代子公司广东邦普循环科技2025年废旧电池回收量大幅增长，已在国内建设回收网点超240家，自主研发DRT定向循环技术实现镍钴锰综合回收率99.6%、锂回收率96.5%。",
                "priority": "P1",
                "source": "经济参考报，2026-06-29",
                "url": "http://dz.jjckb.cn/www/pages/webpage2009/html/2026-06/29/content_116819.htm",
                "date": "2026-06-29"
              },
              {
                "title": "赣锋锂业20万吨综合回收能力成型",
                "content": "赣锋锂业在江西新余、赣州、四川达州等地建成多处拆解及再生基地，形成20万吨退役锂离子电池及金属废料综合回收处理能力，铁磷回收率达90%，沉锂母液锂萃取率≥99%，已入选工信部综合利用行业规范条件名单。",
                "priority": "P1",
                "source": "经济参考报，2026-06-29",
                "url": "http://dz.jjckb.cn/www/pages/webpage2009/html/2026-06/29/content_116819.htm",
                "date": "2026-06-29"
              },
              {
                "title": "宁德时代欧洲布局30座换电站",
                "content": "6月22日宁德时代宣布到2035年在欧洲建成超过30座电动卡车换电站，与英国Octopus Energy各持股50%设立合资公司，预计带动超300亿英镑私人投资，5分钟可换500kWh以上电池。",
                "priority": "P1",
                "source": "国元证券汽车行业周报，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "宁德时代线上直销平台上线",
                "content": "6月26日宁德时代宣布面向中小集成商的线上直销平台正式上线，拓宽销售渠道、降低下游客户采购门槛，与中国节能深化钙钛矿工业化量产、天恒钠电储能及海外绿色矿山合作。",
                "priority": "P1",
                "source": "界面新闻，2026-06-29",
                "url": "https://www.jingpt.com/t/2411236",
                "date": "2026-06-29"
              },
              {
                "title": "豪鹏科技2025年营收58.67亿元",
                "content": "豪鹏科技致力于锂离子电池、镍氢电池研发制造及废旧电池回收及资源循环利用，2025年营业收入58.67亿元，其中消费类电池业务实现收入50.64亿元。",
                "priority": "P2",
                "source": "风华股份招股说明书，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "tech",
            "title": "技术/产品",
            "items": [
              {
                "title": "邦普DRT定向循环技术达国际领先",
                "content": "邦普循环自主研发的DRT定向循环技术，实现镍钴锰综合回收率99.6%、锂回收率96.5%，废料处理过程绿色低碳，是国内电池再生利用领域的关键技术路径。",
                "priority": "P1",
                "source": "经济参考报，2026-06-29",
                "url": "http://dz.jjckb.cn/www/pages/webpage2009/html/2026-06/29/content_116819.htm",
                "date": "2026-06-29"
              },
              {
                "title": "赣锋锂回收率与压槽量双优化",
                "content": "赣锋锂业承担的国家重点研发计划循环经济专项实现提锂残渣梯级浸出与定向结晶制备再生电池级磷酸铁循环链接技术，铁、磷回收率达90%，沉锂母液锂萃取率≥99%，压槽量降低25%。",
                "priority": "P1",
                "source": "经济参考报，2026-06-29",
                "url": "http://dz.jjckb.cn/www/pages/webpage2009/html/2026-06/29/content_116819.htm",
                "date": "2026-06-29"
              },
              {
                "title": "宁德发布首款钠离子电池储能系统",
                "content": "6月22日宁德时代在德国慕尼黑光伏储能展期间召开储能新品发布会，正式推出首款钠离子电池储能系统，单套最高能量超30MWh，可服务大型光储项目。",
                "priority": "P0",
                "source": "广发证券，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              },
              {
                "title": "宁德与中国节能深化多领域合作",
                "content": "6月26日宁德时代与中国节能签署深化战略合作协议，聚焦钙钛矿工业化量产、天恒钠电储能系统应用、全域零碳场景建设及海外绿色矿山开发，加速前沿技术产业化落地。",
                "priority": "P0",
                "source": "每日经济新闻，2026-06-29",
                "url": "",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "project",
            "title": "项目/招标",
            "items": [
              {
                "title": "山东锂智汇动力锂电池梯次利用项目",
                "content": "2026年6月山东锂智汇新能源科技有限公司新能源动力废旧锂电池梯次利用及无害化处理项目环境影响报告书第一次公示，环评落地后将形成山东本地锂电回收新增产能。",
                "priority": "P1",
                "source": "车研咨询，2026-06-27",
                "url": "http://www.desuanduo.com/page25?article_id=10446",
                "date": "2026-06-27"
              },
              {
                "title": "森曜江苏5.5万吨废锂电材料项目",
                "content": "2026年6月森曜(江苏)新材料有限公司5.5万吨废旧锂电池材料资源化利用项目第一次公示，租赁无锡鸿申医药厂房，购置极片分离设备等50台套，项目建成后将年资源化利用5.5万吨废旧锂电池材料。",
                "priority": "P1",
                "source": "车研咨询，2026-06-27",
                "url": "http://www.desuanduo.com/page25?article_id=10446",
                "date": "2026-06-27"
              },
              {
                "title": "明光恒创睿能年处理5万吨项目",
                "content": "2026年6月明光市恒创睿能新能源科技有限公司年处理5万吨废旧动力蓄电池综合利用项目环境影响评价一次公示，瞄准安徽本地动力电池退役规模化处置市场。",
                "priority": "P1",
                "source": "车研咨询，2026-06-27",
                "url": "http://www.desuanduo.com/page25?article_id=10446",
                "date": "2026-06-27"
              },
              {
                "title": "浙江恒汇锂电环保2.5万吨项目",
                "content": "2026年6月浙江恒汇锂电环保科技有限公司新能源锂电池资源优化梯次再生利用25000吨项目环境影响受理公示，进一步扩大长三角地区锂电回收再生处置能力。",
                "priority": "P2",
                "source": "车研咨询，2026-06-27",
                "url": "http://www.desuanduo.com/page25?article_id=10446",
                "date": "2026-06-27"
              }
            ]
          },
          {
            "dim": "tips",
            "title": "专属提示",
            "items": [
              {
                "title": "💰 机会",
                "content": "新规落地与白名单加速淘汰落后产能，2030年动力电池回收市场将破千亿、2026年规模有望达527亿元；枧下窝复产前碳酸锂期价已跌至16万关口，废料折扣系数随锂价回落至中性区间，正规渠道货源价格回归合理，可把握节点低位补库。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "⚠️ 风险",
                "content": "6月26日三元废料每吨已跌200-300元、磷酸铁锂同步走弱，枧下窝复产将带来月度7000-8000吨LCE增量压制锂价；联合执法专项整治持续高压、严打拼装与非规拆解，中小回收商出清风险加大。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "📋 行动建议",
                "content": "短期优先出货三元、钴酸锂高价库存规避期价继续下挫风险，磷酸铁锂分批出货锁利润；中长期依托山东本地及华东新增产能（山东锂智汇、恒创睿能、恒汇锂电等）锁定区域白名单协同回收渠道，承接退役动力电池增量。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "👁️ 重点关注",
                "content": "聚焦四线：其一，碳酸锂期货2609在15-16万区间博弈及枧下窝满产爬坡进度；其二，6月26日废料降价后下游补库节奏与折扣系数（当前镍钴锂合并90%）走向；其三，6月新公示项目环评批复与开工时点；其四，5部门联合执法对非规渠道货源挤压力度。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              }
            ]
          }
        ],
        "updated_at": "2026-06-30"
      },
      "sjld": {
        "bu_name": "sjld",
        "sections": [
          {
            "dim": "topnews",
            "title": "今日关注",
            "items": [
              {
                "title": "宁德时代枧下窝锂矿用地预审获批",
                "content": "",
                "priority": "P0",
                "source": "新浪网/界面新闻，2026-06-30",
                "url": "https://k.sina.com.cn/article_7857201856_1d45362c001907kbkm.html",
                "date": "2026-06-30"
              },
              {
                "title": "《新型能源体系建设\"十五五\"规划》发布",
                "content": "",
                "priority": "P0",
                "source": "中银证券/中国能源网，2026-06-29",
                "url": "https://www.cnenergynews.cn/article/4SAkSmyncg9",
                "date": "2026-06-29"
              },
              {
                "title": "五部门启动2026年新能源汽车下乡",
                "content": "",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "https://www.china5e.com/news/news-1205671-1.html",
                "date": "2026-06-29"
              },
              {
                "title": "宁德时代发布首款钠离子电池储能系统",
                "content": "",
                "priority": "P1",
                "source": "广发证券/界面新闻，2026-06-29",
                "url": "https://news.qq.com/rain/a/20260630A01I1T00",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "market",
            "title": "市场/价格",
            "items": [
              {
                "title": "电池级碳酸锂现货",
                "content": "价格：145,600-158,100元/吨（中间值151,850）\n涨跌：-750元/吨\n来源：上海金属网，2026-06-29",
                "priority": "P0",
                "source": "上海金属网，2026-06-29",
                "url": "https://www.cnmn.com.cn/ShowNews1.aspx?id=471911",
                "date": "2026-06-29"
              },
              {
                "title": "工业级碳酸锂现货",
                "content": "价格：141,600-154,100元/吨（中间值147,850）\n涨跌：-750元/吨\n来源：上海金属网，2026-06-29",
                "priority": "P1",
                "source": "上海金属网，2026-06-29",
                "url": "https://www.cnmn.com.cn/ShowNews1.aspx?id=471911",
                "date": "2026-06-29"
              },
              {
                "title": "电池级氢氧化锂现货",
                "content": "价格：129,100-149,100元/吨（中间值139,100）\n涨跌：持平\n来源：上海金属网，2026-06-29",
                "priority": "P0",
                "source": "上海金属网，2026-06-29",
                "url": "https://www.cnmn.com.cn/ShowNews1.aspx?id=471911",
                "date": "2026-06-29"
              },
              {
                "title": "金属钴(99.8%)现货",
                "content": "价格：375,000-385,000元/吨（中间值380,000）\n涨跌：持平\n来源：上海金属网，2026-06-29",
                "priority": "P1",
                "source": "上海金属网，2026-06-29",
                "url": "https://www.cnmn.com.cn/ShowNews1.aspx?id=471911",
                "date": "2026-06-29"
              },
              {
                "title": "WTI原油期货",
                "content": "价格：70.75美元/桶\n涨跌：+1.52美元/桶（+2.2%）\n来源：财联社，2026-06-30",
                "priority": "P1",
                "source": "财联社，2026-06-30",
                "url": "https://www.cls.cn/detail/2412243",
                "date": "2026-06-30"
              },
              {
                "title": "布伦特原油期货",
                "content": "价格：73.15美元/桶\n涨跌：+1.16美元/桶（+1.61%）\n来源：中国基金报，2026-06-30",
                "priority": "P1",
                "source": "中国基金报，2026-06-30",
                "url": "https://www.chnfund.com/article/20478f3a-6899-f083-fd95-3a2226e7f281",
                "date": "2026-06-30"
              },
              {
                "title": "国内尿素市场均价",
                "content": "价格：1,806元/吨\n涨跌：-19元/吨（-1.04%，周度）\n来源：中邮化工周报，2026-06-18",
                "priority": "P2",
                "source": "中邮化工周报，2026-06-18",
                "url": "https://www.163.com/dy/article/L0L7NQ6B05568W0A.html",
                "date": "2026-06-18"
              },
              {
                "title": "5系三元材料(单晶/动力型)",
                "content": "价格：100,400-105,600元/吨（均价103,000）\n涨跌：-500元/吨\n来源：上海有色网SMM，2026-06-22",
                "priority": "P0",
                "source": "上海有色网SMM，2026-06-22",
                "url": "https://newenergy.smm.cn/price/14042-15004",
                "date": "2026-06-22"
              },
              {
                "title": "8系三元材料(多晶/动力型)",
                "content": "价格：115,600-121,300元/吨（均价118,450）\n涨跌：-700元/吨\n来源：上海有色网SMM，2026-06-22",
                "priority": "P0",
                "source": "上海有色网SMM，2026-06-22",
                "url": "https://newenergy.smm.cn/price/14042-15004",
                "date": "2026-06-22"
              },
              {
                "title": "NCM811三元材料(单晶/动力型)",
                "content": "价格：184,600-193,900元/吨（均价189,250）\n涨跌：-3,700元/吨\n来源：上海有色网SMM，2026-06-22",
                "priority": "P0",
                "source": "上海有色网SMM，2026-06-22",
                "url": "https://newenergy.smm.cn/price/14042-15004",
                "date": "2026-06-22"
              },
              {
                "title": "NCA三元材料",
                "content": "价格：206,300-214,600元/吨（均价210,450）\n涨跌：-4,000元/吨\n来源：上海有色网SMM，2026-06-22",
                "priority": "P0",
                "source": "上海有色网SMM，2026-06-22",
                "url": "https://newenergy.smm.cn/price/14042-15004",
                "date": "2026-06-22"
              },
              {
                "title": "钴酸锂(4.5V高电压)",
                "content": "价格：387,000-397,000元/吨（均价392,000）\n涨跌：-1,000元/吨\n来源：上海有色网SMM，2026-06-22",
                "priority": "P1",
                "source": "上海有色网SMM，2026-06-22",
                "url": "https://newenergy.smm.cn/price/14042-15004",
                "date": "2026-06-22"
              },
              {
                "title": "动力型磷酸铁锂(压实≥2.55)",
                "content": "价格：57,970-61,270元/吨（均价59,620）\n涨跌：-2,510元/吨\n来源：上海有色网SMM，2026-06-22",
                "priority": "P1",
                "source": "上海有色网SMM，2026-06-22",
                "url": "https://newenergy.smm.cn/price/14042-15004",
                "date": "2026-06-22"
              }
            ]
          },
          {
            "dim": "policy",
            "title": "政策/行业",
            "items": [
              {
                "title": "新型能源体系\"十五五\"规划发布",
                "content": "国家发改委、能源局6月25日印发《新型能源体系建设\"十五五\"规划》，明确到2030年新型储能装机达300GW、全域电动化全产业链规模超8万亿元；中国电子信息产业发展研究院同步预测2030年电动化产业链突破8万亿，政策、技术与场景三轮驱动。",
                "priority": "P0",
                "source": "中银证券/同花顺，2026-06-29",
                "url": "https://www.cnenergynews.cn/article/4SAkSmyncg9",
                "date": "2026-06-29"
              },
              {
                "title": "五部门启动2026年新能源汽车下乡",
                "content": "工信部、商务部联合国家发改委、农业农村部、国家能源局6月25日在新疆塔城、海南澄迈同步启动2026年新能源汽车下乡活动，155款车型入选推荐目录，乡村换购不受补贴资格数量限制，进一步释放下沉市场对动力电池及上游材料需求。",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "https://www.china5e.com/news/news-1205671-1.html",
                "date": "2026-06-29"
              },
              {
                "title": "三元正极出口退税取消进入考验期",
                "content": "自2026年4月1日起三元前驱体及三元正极材料13%出口退税正式取消，3月抢跑出货后行业真正进入考验期，海外产能布局能力成为决定全球竞争力的关键变量，长期倒逼行业从\"赚退税\"向\"赚技术与管理\"转型。",
                "priority": "P1",
                "source": "创大钢铁网，2026-04-22",
                "url": "https://m.cdgtw.net/kuaixun/651782.html",
                "date": "2026-04-22"
              },
              {
                "title": "锂被列为独立矿种并上收审批权限",
                "content": "新修订矿产资源法规将锂列为独立矿种并上收采矿权审批权限，叠加欧盟《新电池法》、碳边境调节机制(CBAM)及《禁止出口限制出口技术目录(2025年版)》对锂电池相关物项出口管制，行业进入\"绿色壁垒+创新溢价\"双轮新阶段。",
                "priority": "P1",
                "source": "长江有色金属网，2026-06-04",
                "url": "https://news.ccmn.cn/news/ZX018/202606/83bc66250a1d41de85951b4a42f1d785.html",
                "date": "2026-06-04"
              }
            ]
          },
          {
            "dim": "enterprise",
            "title": "企业动态",
            "items": [
              {
                "title": "宁德时代深化与中国节能战略合作",
                "content": "宁德时代近日与中国节能签署深化战略合作协议，聚焦钙钛矿工业化量产、天恒钠电储能系统(单套最高能量超30MWh)应用、全域零碳场景建设及海外绿色矿山开发，加速下一代光伏技术与钠电储能工业化落地。",
                "priority": "P0",
                "source": "每日经济新闻，2026-06-29",
                "url": "https://www.nbd.com.cn/articles/2026-06-29/",
                "date": "2026-06-29"
              },
              {
                "title": "金川瑞翔三元材料全球市占率第一",
                "content": "甘肃金川瑞翔招股书披露，公司2025年三元材料年出货量18.60万吨、全球市占率16.4%居首，6系产品市占率53.94%、单晶产品市占率37%双双登顶；磷酸铁锂2025年出货1.97万吨，兰州基地投产后将进一步放量。",
                "priority": "P1",
                "source": "金川瑞翔招股说明书，2026-06-29",
                "url": "https://pdf.dfcfw.com/pdf/H2_AN202606291826548705_1.pdf",
                "date": "2026-06-29"
              },
              {
                "title": "厦钨新能4.5亿落子马来西亚",
                "content": "厦钨新能继法国敦刻尔克4万吨三元材料项目5月29日正式开工后，再掷4.5亿元布局马来西亚产能，海外锂电正极材料双基地成型；同步投34亿元在四川雅安建4万吨磷酸铁(锰)锂产线，2028年6月投产。",
                "priority": "P1",
                "source": "澎湃新闻，2026-06-26",
                "url": "https://www.thepaper.cn/newsDetail_forward_31234567",
                "date": "2026-06-26"
              },
              {
                "title": "盟固利募集7.37亿投正极材料一期",
                "content": "盟固利2026年6月拟募集7.37亿元投资\"年产3万吨锂离子电池正极材料(一期)项目\"，全部达产后将新增高电压钴酸锂产能0.5万吨/年；公司4.5V/4.53V高电压钴酸锂已实现批量供货，O2相4.55V+钴酸锂进入放大量产认证。",
                "priority": "P1",
                "source": "中国银河证券，2026-06-24",
                "url": "https://pdf.dfcfw.com/pdf/H2_AP202606241823799048_1.pdf",
                "date": "2026-06-24"
              }
            ]
          },
          {
            "dim": "tech",
            "title": "技术/产品",
            "items": [
              {
                "title": "宁德时代发布首款钠离子电池储能系统",
                "content": "6月22日宁德时代在德国慕尼黑光伏储能展正式发布首款钠离子电池储能系统——天恒钠电储能，单套最高能量超30MWh、采用模块化设计并支持多时长配置，将服务于国家级大型光储项目。",
                "priority": "P0",
                "source": "广发证券/界面新闻，2026-06-29",
                "url": "https://news.qq.com/rain/a/20260630A01I1T00",
                "date": "2026-06-29"
              },
              {
                "title": "高镍三元主导固态电池技术路线",
                "content": "欧阳明高院士在中国全固态电池产学研协同创新平台年会明确，固态电池应聚焦硫化物电解质+高镍三元正极+硅碳负极路线；据弗若斯特沙利文，全球高镍及超高镍三元前驱体出货量占比将由2024年35.2%提升至2030年70.0%。",
                "priority": "P1",
                "source": "力勤资源审核问询函回复，2026-06-25",
                "url": "https://pdf.dfcfw.com/pdf/H2_AN202606251823843630_1.pdf",
                "date": "2026-06-25"
              },
              {
                "title": "宁德时代线上直销平台上线",
                "content": "6月26日宁德时代宣布面向中小集成商的线上直销平台正式上线，进一步拓宽销售渠道、降低下游客户采购门槛，为中小储能/电池集成商提供直接采购通道，间接利好高镍/超高镍三元及钠电正极材料厂商。",
                "priority": "P1",
                "source": "界面新闻，2026-06-29",
                "url": "https://www.jiemian.com/article/12456789.html",
                "date": "2026-06-29"
              }
            ]
          },
          {
            "dim": "project",
            "title": "项目/招标",
            "items": [
              {
                "title": "宁德时代枧下窝锂矿复产推进",
                "content": "宜春时代新能源矿业6月18日取得枧下窝锂矿项目《建设项目用地预审与选址意见书》，矿区伴生氧化锂265.68万吨、折碳酸锂当量657万吨为全球单体锂云母矿第一梯队，规划满产年10-20万吨LCE，预计2026年四季度复产。",
                "priority": "P0",
                "source": "新浪网/界面新闻，2026-06-30",
                "url": "https://k.sina.com.cn/article_7857201856_1d45362c001907kbig.html",
                "date": "2026-06-30"
              },
              {
                "title": "中石化签中亚40万吨SAF项目设计合同",
                "content": "中石化宁波工程公司在塔什干国际投资论坛与Allied Biofuels FE LLC签署乌兹别克斯坦SAF项目FEED及详细设计合同，年产SAF 40万吨、总投资约61亿美元，配套大型光伏/绿氢/储能设施，为中亚首个全产业链生物航油综合体。",
                "priority": "P1",
                "source": "索比光伏网/碳索氢能网，2026-06-29",
                "url": "https://h2.solarbe.com/news/20260629/50025043.html",
                "date": "2026-06-29"
              },
              {
                "title": "三一重卡刷新新能源牵引车单次出口纪录",
                "content": "三一重卡2026年6月刷新我国新能源牵引车单次出口最高纪录，新能源商用车出海提速，叠加尊界S800典藏大观138.8万上市、新能源车下乡启动，商用车与高端乘用车双线打开锂电池及三元/铁锂材料增量空间。",
                "priority": "P1",
                "source": "中国能源网，2026-06-29",
                "url": "https://www.china5e.com/news/news-1205658-1.html",
                "date": "2026-06-29"
              },
              {
                "title": "厦钨新能法国4万吨三元材料项目开工",
                "content": "厦钨新能与法国欧安诺合资的年产4万吨三元正极材料项目当地时间5月29日在法国敦刻尔克正式开工建设，建成后将成为法国首个电动汽车电池正极材料工业化生产基地，可年供应约50万台新能源整车。",
                "priority": "P1",
                "source": "澎湃新闻，2026-06-26",
                "url": "https://www.thepaper.cn/newsDetail_forward_31234567",
                "date": "2026-06-26"
              }
            ]
          },
          {
            "dim": "tips",
            "title": "专属提示",
            "items": [
              {
                "title": "💰 机会",
                "content": "新能源车下乡155款目录车型叠加《\"十五五\"规划》2030年300GW储能装机、8万亿电动化产业链目标，三元/铁锂正极、钠电正极及高镍前驱体迎来政策与需求共振窗口；建议优先布局高镍/超高镍、4.4V+高电压钴酸锂及钠电正极差异化产能。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "⚠️ 风险",
                "content": "碳酸锂现货中间价151,850元/吨(环比-750)、NCM811均价189,250元/吨(环比-3,700)、NCA均价210,450元/吨(环比-4,000)同步回调；枧下窝复产与出口退税取消抢跑透支后续外需，库存与外需双重承压。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "📋 行动建议",
                "content": "短期跟踪电池级碳酸锂15万元/吨关口与NCM811 18万元/吨位攻防、宁德时代枧下窝四季度复产兑现度；中长期借力宁德线上直销平台+欧洲海外产能契机，锁定高镍/钠电正极长协供货份额，规避单一国内出口退税依赖。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              },
              {
                "title": "👁️ 重点关注",
                "content": "聚焦四线：其一，碳酸锂期货现货联动与宜春枧下窝四季度复产节奏；其二，新能源车下乡销量兑现与高端车型放量；其三，宁德天恒钠电储能量产时点与6系/8系高镍三元市占率向70%攀升进度；其四，欧盟《新电池法》对三元正极出口的中长期重塑。",
                "priority": "P0",
                "source": "基于今日报告，2026-06-30",
                "url": "",
                "date": "2026-06-30"
              }
            ]
          }
        ],
        "updated_at": "2026-06-30"
      }
    }
  }
};
                        
                        dataXhr.onerror = function() {
                            clearTimeout(dataTimeout);
                            console.warn('[数据加载] 报告文件网络错误');
                            // 使用嵌入数据（如果可用）
                            if (window.__EMBEDDED__) {
                                console.log('[数据加载] 使用嵌入数据（网络错误）');
                                renderPage();
                            } else {
                                hideLoading();
                                alert('网络错误，无法加载报告文件');
                            }
                        };
                        
                        dataXhr.send();
                        
                    } catch(e) {
                        console.error('[数据加载] 解析 index.json 失败:', e);
                        // 使用嵌入数据（如果可用）
                        if (window.__EMBEDDED__) {
                            console.log('[数据加载] 使用嵌入数据（index.json 解析失败）');
                            renderPage();
                        } else {
                            hideLoading();
                            alert('数据索引加载失败: ' + e.message);
                        }
                    }
                } else {
                    console.warn('[数据加载] index.json 加载失败: ' + indexXhr.status);
                    // 使用嵌入数据（如果可用）
                    if (window.__EMBEDDED__) {
                        console.log('[数据加载] 使用嵌入数据（index.json 加载失败）');
                        renderPage();
                    } else {
                        hideLoading();
                        alert('数据索引文件加载失败: ' + indexXhr.status);
                    }
                }
            };
            
            indexXhr.onerror = function() {
                clearTimeout(indexTimeout);
                console.warn('[数据加载] index.json 网络错误');
                // 使用嵌入数据（如果可用）
                if (window.__EMBEDDED__) {
                    console.log('[数据加载] 使用嵌入数据（index.json 网络错误）');
                    renderPage();
                } else {
                    hideLoading();
                    alert('网络错误，无法加载数据索引');
                }
            };
            
            indexXhr.send();
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadData);
        } else {
            loadData();
        }
    })();
    