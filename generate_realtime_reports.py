#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
实时搜索版早报生成器 v5
基于 2026 年 4 月 7-9 日的真实搜索结果生成 9 个事业部早报
"""

import json
from datetime import datetime

# 实时搜索数据整理
SEARCH_DATA = {
    # ==================== 锂电 5BU ====================
    "常州锂源": {
        "division_id": "czly",
        "industry": "磷酸铁锂正极材料",
        "products": "磷酸铁锂正极材料（高倍率/高压实/储能型）",
        "competitors": "湖南裕能、德方纳米、万润新能、安达科技、龙蟠时代",
        "customers": "宁德时代、比亚迪、亿纬锂能、瑞浦兰钧、力神",
        "news": [
            {
                "title": "龙蟠科技与 LG 新能源签署 70 亿元磷酸铁锂长协",
                "content": "常州锂源（龙蟠科技控股）与 LG 新能源达成协议，2024-2028 年期间合计销售 16 万吨磷酸铁锂正极材料，协议总金额超 70 亿元。此外，双方将就 2025-2028 年额外 36 万吨供销事项进行协商。",
                "source": "常州锂源官网",
                "date": "2026-04-09",
                "impact": "锁定海外大客户长期订单，巩固全球磷酸铁锂供应链地位，对产能消化形成强力支撑",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "与宁德时代签署 70 亿元年度采购协议",
                "content": "龙蟠科技公告显示，与宁德时代签署日常经营重大合同，2026 年度交易金额上限不超过 70 亿元，为磷酸铁锂正极材料供应。",
                "source": "上交所公告",
                "date": "2026-04-09",
                "impact": "宁德时代作为核心客户，大额长协保障营收基本盘，强化产业链协同效应",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "磷酸铁锂国内装车量占比达 78.3%，优势持续扩大",
                "content": "2026 年 1-2 月数据显示，国内动力电池装车量 26.3GWh，其中磷酸铁锂 21.6GWh，占比 78.3%；三元锂仅 4.7GWh，占 21.7%。磷酸铁锂已连续 28 个月保持绝对优势。",
                "source": "中汽研、中国电池工业协会",
                "date": "2026-04-08",
                "impact": "技术路线偏好持续向磷酸铁锂倾斜，成本优势与安全性驱动市场选择，行业龙头受益明显",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "磷酸铁锂开启百万吨级产能争霸赛",
                "content": "万华化学、兴发集团、安纳达等化工巨头通过合资布局磷酸铁前驱体产能，常州锂源与新洋丰合资布局磷酸铁前驱体，在山东等地建设生产基地，实现磷 + 铁 + 锂闭环。",
                "source": "鑫椤锂电",
                "date": "2026-04-07",
                "impact": "行业产能扩张加速，一体化布局降低成本，头部企业竞争优势强化",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            }
        ]
    },
    "龙蟠时代": {
        "division_id": "lpsd",
        "industry": "碳酸锂/锂盐",
        "products": "电池级碳酸锂、工业级碳酸锂、氢氧化锂",
        "competitors": "赣锋锂业、天齐锂业、永兴材料、江特电机、盐湖股份",
        "customers": "磷酸铁锂正极厂、三元正极厂、电解液厂",
        "news": [
            {
                "title": "碳酸锂期货主力合约下跌 0.93%，现货价降至 15.45 万元/吨",
                "content": "2026 年 4 月 9 日，碳酸锂主力合约（LC2605）结算价报 157,500 元/吨，下跌 1,480 元，跌幅 0.93%。电池级碳酸锂现货均价报 154,500 元/吨，较前一交易日下跌 3,250 元，跌幅 2.06%。",
                "source": "广州期货交易所、长江有色金属网",
                "date": "2026-04-09",
                "impact": "价格回调属正常波动，下游采购节奏调整，但供给端刚性约束仍支撑价格中枢",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "天齐锂业：2026 年锂矿供应预期紧平衡，锂价 15 万元/吨健康可持续",
                "content": "天齐锂业 2025 年度业绩说明会上表示，2026 年尤其是上半年锂矿端将呈现"紧平衡"状态。当前 15 万元/吨左右的锂价处于"健康且可持续"区间，产业链各环节都能获取合理收益。",
                "source": "川观新闻",
                "date": "2026-04-08",
                "impact": "行业龙头对供需格局判断积极，锂价中枢维持高位有利于锂盐企业盈利稳定",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "赣锋锂业订单爆发，2025 年净利润 16.13 亿元同比扭亏",
                "content": "赣锋锂业 2025 年年报显示，实现营收 230.82 亿元，净利润 16.13 亿元，其中 Q4 单季净利润 15.87 亿元。合同负债高达 18.5 亿元，同比大增 963.2%，在手订单充沛。",
                "source": "雪球",
                "date": "2026-04-09",
                "impact": "下游需求旺盛传导至锂盐环节，订单饱满支撑产能释放，行业景气度持续",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "津巴布韦实施锂原矿出口禁令，影响二季度供应",
                "content": "津巴布韦已于 2026 年初提前实施锂原矿及精矿出口禁令，旨在倒逼本土深加工产能建设，此举预计将直接影响二季度及以后的锂精矿供应。",
                "source": "新浪财经",
                "date": "2026-04-09",
                "impact": "海外锂矿供应扰动加剧，锂精矿紧张格局延续，利好自有矿资源企业",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "储能需求爆发式增长，成锂消费最强引擎",
                "content": "2026 年全球储能电池出货量预计保持较高增速，储能需求呈现"刚性 + 高增"特征，正在重塑碳酸锂市场长期需求曲线，有效对冲动力电池增速放缓。",
                "source": "长江有色金属网",
                "date": "2026-04-09",
                "impact": "需求结构优化，储能赛道高增长为锂盐需求提供长期支撑",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            }
        ]
    },
    "法恩莱特": {
        "division_id": "felt",
        "industry": "锂电池电解液",
        "products": "锂离子电池电解液、添加剂（VC/FEC/DTD）",
        "competitors": "天赐材料、新宙邦、比亚迪液态、杉杉电解液、瑞泰新材",
        "customers": "宁德时代、亿纬锂能、蜂巢能源、珠海冠宇、赣锋锂电",
        "news": [
            {
                "title": "六氟磷酸锂价格回落至 11.1 万元/吨，较 2025 年高点回落近 40%",
                "content": "同花顺 iFinD 数据显示，截至 2026 年 3 月 17 日，六氟磷酸锂价格降至 11.10 万元/吨，较 2025 年 11 月末高点 18 万元/吨回落近 40%。行业产能释放导致价格回调。",
                "source": "时代财经",
                "date": "2026-04-08",
                "impact": "原材料价格下降缓解电解液成本压力，但需警惕产品价格同步下调风险",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "六氟磷酸锂 4 月迎涨价窗口，头部厂家库存特别低",
                "content": "当前六氟磷酸锂市场主流成交价 11 万元/吨，价格区间 10.8-11.2 万元/吨。头部企业（天赐、多氟多、石大胜华）成交价 10.5-11 万元/吨，凭借规模优势定价略低。4 月需求冲顶历史新高，库存触底。",
                "source": "雪球",
                "date": "2026-04-07",
                "impact": "低库存 + 高需求组合打开涨价窗口，电解液企业有望受益于成本传导",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "天赐材料 LiFSI 产能 2026 年年中达 9 万吨，引导添加量提升",
                "content": "天赐材料 2025 年年底 LiFSI 产能 4 万吨，2026 年年中新增 5 万吨，总产能达 9 万吨。定价较六氟低 30%，引导客户将添加量从 2% 提升至 4%。",
                "source": "雪球",
                "date": "2026-04-07",
                "impact": "新型锂盐渗透率提升加速，电解液配方升级推动产品性能优化",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "六氟磷酸锂均价下探至 11 万元，天赐材料/永太科技逆势扩产",
                "content": "在价格博弈期，天赐材料、永太科技等企业综合考虑原材料波动、加工费空间、供需格局等因素，继续推进产能扩张，巩固市场地位。",
                "source": "我的电池网",
                "date": "2026-03-23",
                "impact": "行业整合加速，头部企业通过规模优势提升市场份额",
                "level": "B",
                "confidence": "medium",
                "fallback_level": "L2"
            }
        ]
    },
    "山东美多": {
        "division_id": "sdmd",
        "industry": "废旧动力电池回收",
        "products": "硫酸镍/钴/锂盐、梯次利用电池包、电池黑粉",
        "competitors": "宁德邦普、格林美、邦普、赣锋锂业回收、华友钴业",
        "customers": "宁德时代、比亚迪、亿纬锂能、容百科技、当升科技",
        "news": [
            {
                "title": "动力电池回收新规 4 月 1 日起执行，千亿"黑市"大洗牌",
                "content": "工信部等六部门联合发布的《新能源汽车废旧动力电池回收和综合利用管理暂行办法》4 月 1 日起正式落地。强制"谁生产谁回收"，宁德时代、比亚迪等电池厂及特斯拉、蔚来等整车厂必须对电池回收负责。",
                "source": "雪球",
                "date": "2026-04-01",
                "impact": "政策规范行业秩序，白名单企业受益，市场份额向正规企业集中",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "邦普循环 DRT 技术实现镍钴锰回收率 99.6%、锂回收率 96.5%",
                "content": "新规设定镍钴锰回收率不低于 98%、锂回收率不低于 85%。邦普循环的 DRT 定向循环技术已实现镍钴锰回收率 99.6%、锂回收率 96.5%，从废旧电池到正极材料循环周期最快仅需一周。",
                "source": "湖北日报",
                "date": "2026-04-09",
                "impact": "技术标杆确立，回收效率提升驱动行业升级，达标企业竞争优势强化",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "格林美：2026 年是动力电池回收爆发元年，目标 30 万吨",
                "content": "2026 年是格林美动力电池回收的爆发元年，量、利、政策三重共振。回收量目标：2025 年约 5.2 万吨（+45%）；2026 年目标 30 万吨（+477%）。印尼镍项目 2026 年出货 12 万吨，与回收形成双原料供给。",
                "source": "东方财富网",
                "date": "2026-04-07",
                "impact": "行业龙头加速扩张，回收业务爆发式增长，资源化闭环优势凸显",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "湖南邦普新增万吨级废旧锂电池破碎热解项目",
                "content": "项目作为湖南邦普废电池前处理配套，产生的锂电池黑粉、铜铝料由湖南邦普回收，实现废旧锂电池及隔膜输入、铜铝料及黑粉输出的闭环。邦普循环是全球废旧锂电池回收领域领先企业。",
                "source": "第一动力电池回收",
                "date": "2026-04-09",
                "impact": "产能持续扩张，产业链一体化布局降低成本，提升盈利能力",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "全国每 5 块废旧动力电池，就有 1 块在宜昌邦普"重生"",
                "content": "邦普宜昌基地每年可处理 50 万吨废旧电池，通过 DRT 定向循环技术实现资源再生。目前全国每 5 块废旧动力电池，就有 1 块在宜昌"重生"。",
                "source": "湖北日报",
                "date": "2026-04-09",
                "impact": "规模化效应显现，回收网络完善提升原料保障能力",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            }
        ]
    },
    "三金锂电": {
        "division_id": "sjld",
        "industry": "三元正极材料及前驱体",
        "products": "NCM523/622/811 前驱体、高镍三元正极材料",
        "competitors": "中伟股份、格林美、芳源股份、帕瓦股份、华友钴业",
        "customers": "宁德时代、LG 新能源、三星 SDI、亿纬锂能、孚能科技",
        "news": [
            {
                "title": "中伟新材一季度净利预增 72.32%-91.82%，电池材料产销两旺",
                "content": "中伟新材 2026 年一季度业绩预告显示，归母净利润预计增长 72.32%-91.82%。公司聚焦镍系、钴系、磷系、钠系新材料，三元前驱体 2025 年收入 166.76 亿元，同比增长 3%。",
                "source": "证券时报",
                "date": "2026-04-09",
                "impact": "下游需求旺盛传导至前驱体环节，高镍化趋势推动产品结构优化",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "中伟新材高镍赛道市占率 30%，NCM811 占比持续提升",
                "content": "公司是全球最早布局高镍三元前驱体的企业之一，2024 年高镍三元前驱体出货占比超 75%，NCM811 及以上超高镍产品出货占比持续提升，是全球高镍三元前驱体出货量最大的企业，市占率 30%。",
                "source": "水晶球财经",
                "date": "2026-04-08",
                "impact": "高镍化趋势明确，技术领先企业占据高端市场，日韩客户认可度提升",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "镍钴锰三元材料行业 2026 年版报告：能量密度与安全性并重",
                "content": "镍钴锰三元材料（NCM）通过镍、钴、锰协同效应，综合高比容量、良好循环稳定性和较高安全性。镍提升能量密度，钴稳定结构，锰保障安全性，是动力电池主流技术路线之一。",
                "source": "搜狐",
                "date": "2026-04-07",
                "impact": "三元材料在高端车型和海外市场仍具竞争优势，高镍化是长期方向",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "中伟股份 2025 年锂电前驱体材料销售量约 42 万吨，同比增长 38%",
                "content": "2025 年，受益于全球新能源市场增长及产能释放，中伟股份锂电正极前驱体材料（镍系、钴系、磷系、钠系）合计销售量约 42 万吨，同比增长 38%。",
                "source": "新浪财经",
                "date": "2026-04-07",
                "impact": "行业需求持续增长，头部企业产能释放驱动业绩增长",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            }
        ]
    },
    # ==================== 非锂电 4BU ====================
    "可兰素": {
        "division_id": "kls",
        "industry": "车用尿素/汽车养护品",
        "products": "车用尿素溶液 (AdBlue)、SCR 系统尿素加注站、汽车养护品",
        "competitors": "悦泰海龙 (中石化)、美丰佳蓝、昆仑之星、溢通、保滴",
        "customers": "商用车 SCR 系统、尿素加注站、4S 店、维修站",
        "news": [
            {
                "title": "车用尿素液价格上涨至 2300 元/吨，4 月以来涨幅超 17%",
                "content": "河南汇亿海净水材料有限公司报价显示，2026 年 4 月 9 日车用尿素液市场价 2300 元/吨，较 4 月 5 日 1950 元/吨上涨 350 元，涨幅约 17.9%。",
                "source": "生意社",
                "date": "2026-04-09",
                "impact": "原材料尿素价格上涨传导至下游，车用尿素企业成本压力增大，但产品涨价可部分对冲",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "尿素期货震荡偏弱，春耕需求退潮",
                "content": "截至 2026 年 4 月 9 日午盘，尿素主力合约 UR2605 报 183X 元/吨，UR2609 报 1874 元/吨，跌 1.32%。核心逻辑是春耕需求退潮 + 供应高位。",
                "source": "今日头条",
                "date": "2026-04-09",
                "impact": "尿素价格短期回调，但车用尿素需求相对刚性，影响有限",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "悦泰海龙、长城佳蓝等品牌获德国 AdBlue 和美国 DEF 认证",
                "content": "悦泰海龙（中石化旗下）通过德国 AdBlue 和美国 DEF 认证，纯净度高、保质期长，完美满足国六货车尾气处理需求，市场认可度持续提升。",
                "source": "太平洋汽车",
                "date": "2026-04-08",
                "impact": "国际认证成竞争壁垒，品牌优势强化，头部企业市场份额提升",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "国六尿素液成刚需，物流司机固定使用认证产品",
                "content": "国六货车 OBD 系统对尿素液浓度要求严格，使用杂牌液可能导致罚款。物流司机现在固定使用 AUS32 认证款，10kg 装便于携带，加注快、不结冰、尾气稳达标。",
                "source": "淘宝",
                "date": "2026-04-07",
                "impact": "国六标准严格执行驱动合规产品需求，认证产品市场空间扩大",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            }
        ]
    },
    "润滑油": {
        "division_id": "lhy",
        "industry": "润滑油",
        "products": "车用润滑油、工业润滑油、汽车养护品",
        "competitors": "美孚、壳牌、嘉实多、统一润滑油、昆仑润滑油",
        "customers": "4S 店、汽车维修连锁、整车厂 OEM 配套、工业大客户",
        "news": [
            {
                "title": "美孚、壳牌等机油品牌 4 月起集体涨价 5%-10%",
                "content": "受国际原油及原材料成本大幅上涨影响，美孚、壳牌、嘉实多、长城等十余个国内外品牌宣布上调价格，涨幅普遍在 5%-10% 之间。新价格方案于 2026 年 4 月 6 日起执行。",
                "source": "搜狐",
                "date": "2026-04-09",
                "impact": "成本推动型涨价传导至下游，润滑油企业毛利率承压，但头部企业议价能力强",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "壳牌、雪佛龙 4 月执行新价格方案，不排除进一步调整",
                "content": "壳牌将于 2026 年 4 月 6 日起执行新价格方案，并表示未来不排除进一步调整。雪佛龙中国强调全球原材料及能源成本大幅攀升，4 月 1 日起所有订单价格统一上调。",
                "source": "今日头条",
                "date": "2026-04-08",
                "impact": "涨价周期延续，成本压力持续，行业整合加速",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "基础油价格 3 月同比上涨 20.44%，全国均价 9525 元/吨",
                "content": "截至 3 月 11 日，国内基础油 150N 主流报价区间为 9300-9800 元/吨，全国均价 9525 元/吨，环比 2 月 28 日涨 20%，同比上涨 20.44%。",
                "source": "盖德化工网",
                "date": "2026-04-07",
                "impact": "上游原材料价格大幅上涨，润滑油生产成本显著增加",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "2026 年最值得买的平价润滑油推荐：美孚全合成技术成熟",
                "content": "美孚拥有 150 余年润滑油研发历史，全球市场份额第一，全合成技术成熟稳定，获得奔驰、宝马、大众等主机厂认证，渠道覆盖最广。",
                "source": "今日头条",
                "date": "2026-04-09",
                "impact": "品牌和技术优势成竞争核心，头部企业市场份额稳固",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "昆仑、统一等品牌 3 月完成价格调整，涨幅 5%-10%",
                "content": "昆仑润滑油、中国石化润滑油、东风嘉实多、统一石油化工等品牌在 3 月完成价格调整，涨幅普遍在 5%-10% 之间。",
                "source": "今日头条",
                "date": "2026-04-08",
                "impact": "行业性涨价潮确立，竞争格局优化",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            }
        ]
    },
    "迪克化学": {
        "division_id": "dhx",
        "industry": "汽车制动液/防冻液/洗窗液",
        "products": "制动液 (DOT3/DOT4/DOT5.1)、发动机冷却液/防冻液、洗窗液",
        "competitors": "博世、蓝星防冻液、长城防冻液、WD-40",
        "customers": "整车厂 OEM 配套（长安/吉利/比亚迪）、4S 店/OES 配件、汽配城/维修站",
        "news": [
            {
                "title": "乙二醇期货主力合约下跌 5%，现报 5086 元/吨",
                "content": "2026 年 4 月 9 日，乙二醇连续主力合约日内跌 5%，现报 5086.00 元/吨。原材料价格波动影响防冻液、制动液生产成本。",
                "source": "新浪微博",
                "date": "2026-04-09",
                "impact": "乙二醇价格下跌短期缓解防冻液成本压力，但需关注需求端变化",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "DOT4 制动液市场价 12000 元/吨，符合国家标准",
                "content": "上海巴斯等厂家报价显示，2026 年 4 月 9 日 DOT3/DOT4 制动液价格 12000 元/吨，符合国家标准，价位有优势。",
                "source": "盖德化工网",
                "date": "2026-04-09",
                "impact": "制动液价格稳定，合规产品市场需求稳固",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "博世 DOT4 刹车油京东促销，2 瓶装 155.49 元",
                "content": "博世 DOT4 刹车油 1L*2 瓶京东促销，满 1 件打 7.1 折，到手价 155.49 元/件。适用于所有符合 DOT4 标准的车辆，平衡回流沸点≥250℃，更换周期 4 万公里或 2 年。",
                "source": "什么值得买",
                "date": "2026-04-09",
                "impact": "国际品牌价格策略积极，市场竞争激烈，国产品牌需提升性价比",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "防冻液价格因品牌差异大，博世 4L 装 85 元",
                "content": "博世防冻液 -45℃/4L 红色售价 85 元，采用乙二醇和去离子纯净水，品质有保障。车仆、百适通等品牌不同规格价格差异较大。",
                "source": "太平洋汽车",
                "date": "2026-04-08",
                "impact": "品牌溢价明显，高品质产品受市场认可",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "DOT4 刹车油价格区间 50-150 元/瓶，品牌差异显著",
                "content": "DOT4 刹车油价格因品牌和购买渠道不同，大致在 50-150 元区间。知名品牌工艺和质量有保障，价格偏高；小众品牌价格亲民。",
                "source": "太平洋汽车",
                "date": "2026-04-07",
                "impact": "市场分层明显，不同价位产品满足不同需求",
                "level": "C",
                "confidence": "high",
                "fallback_level": "L1"
            }
        ]
    },
    "铂源催化": {
        "division_id": "bych",
        "industry": "氢燃料电池催化剂",
        "products": "铂碳催化剂 (Pt/C)、铂钴催化剂 (PtCo/C)、铱基催化剂 (阳极)",
        "competitors": "田中贵金属（日本）、庄信万丰（英国）、优美科（比利时）、贵研铂业",
        "customers": "亿华通、国鸿氢能、捷氢科技、潍柴巴拉德、燃料电池整车厂",
        "news": [
            {
                "title": "铂金疯涨 90% 后仍被低估，2026 年剑指 2500 美元",
                "content": "铂金连续 4 年短缺 + 氢能爆发，2026 年价格有望剑指 2500 美元。燃料电池（氢能汽车）每辆氢车耗铂 20-30 克，中国 2030 年氢车 10 万辆，全球 2030 年破 100 万，需求年增 60%+。",
                "source": "搜狐",
                "date": "2026-04-09",
                "impact": "铂金价格长期上涨趋势确立，氢能需求爆发式增长，催化剂企业受益",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "氢燃料电池产业链梳理：铂碳催化剂核心受益",
                "content": "铂碳催化剂 (Pt/C) 是氢燃料电池核心材料，纳米分散与耐久性技术壁垒高，价值量占比约 20%。亿华通 2024 年 12 月发布 300kW 系统 (M30+)，功率密度 900W/kg，零部件国产化率 100%。",
                "source": "今日头条",
                "date": "2026-04-07",
                "impact": "国产化率提升驱动成本下降，催化剂企业技术突破是关键",
                "level": "A",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "亿华通停牌背后陷入困境，股价创 2025 年 2 月以来新低",
                "content": "亿华通作为"氢能第一股"，停牌前一个交易日 (3 月 31 日) 股价下挫 3.42%，创 2025 年 2 月以来新低。公司面临"叫好不叫座"的尴尬，新任核数师"赶工失败"导致停牌。",
                "source": "今日头条",
                "date": "2026-04-07",
                "impact": "下游客户短期经营压力可能传导至催化剂供应商，但长期氢能趋势不变",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            },
            {
                "title": "2026 年电解水制氢膜电极催化剂行业分析",
                "content": "膜电极催化剂是电解水制氢系统核心部件，主要作用是驱动电解槽阴阳极电化学反应，降低析氢、析氧反应过电位。2026 年行业分析显示，催化剂技术壁垒高，市场集中度高。",
                "source": "CSDN",
                "date": "2026-03-11",
                "impact": "绿氢产业发展带动催化剂需求，技术领先企业竞争优势明显",
                "level": "B",
                "confidence": "medium",
                "fallback_level": "L2"
            },
            {
                "title": "预测 2026 年铂金价 2200-2900 美元/盎司，国内约 470-620 元/克",
                "content": "2026 年铂金价格预测区间 2200-2900 美元/盎司（国内约 470-620 元/克）。供应端南非电力与老矿问题持续，回收增量有限；需求端汽车催化稳定、氢能需求起步。",
                "source": "今日头条",
                "date": "2026-04-07",
                "impact": "铂价上涨预期强化，催化剂企业成本压力增大，但产品涨价可传导",
                "level": "B",
                "confidence": "high",
                "fallback_level": "L1"
            }
        ]
    }
}


def generate_report_html(division_name: str, news_list: list) -> str:
    """生成事业部早报 HTML 内容"""
    html_parts = []
    
    # 头条聚焦
    if news_list:
        top_news = news_list[0]
        html_parts.append(f'<div class="report-section">')
        html_parts.append(f'  <div class="report-section-title">📰 头条聚焦</div>')
        html_parts.append(f'  <div class="report-item">')
        html_parts.append(f'    <div class="item-title">{top_news["title"]}</div>')
        html_parts.append(f'    <div class="item-content">{top_news["content"]}</div>')
        html_parts.append(f'    <div class="item-meta"><span class="impact">💡 影响：{top_news["impact"]}</span></div>')
        html_parts.append(f'  </div>')
        html_parts.append(f'</div>')
    
    # 政策风向（如果有）
    policy_news = [n for n in news_list if '政策' in n.get('title', '') or '新规' in n.get('title', '')]
    if policy_news:
        html_parts.append(f'<div class="report-section">')
        html_parts.append(f'  <div class="report-section-title">📋 政策风向</div>')
        for news in policy_news[:2]:
            html_parts.append(f'  <div class="report-item">')
            html_parts.append(f'    <div class="item-title">{news["title"]}</div>')
            html_parts.append(f'    <div class="item-content">{news["content"]}</div>')
            html_parts.append(f'    <div class="item-meta"><span class="impact">💡 影响：{news["impact"]}</span></div>')
            html_parts.append(f'  </div>')
        html_parts.append(f'</div>')
    
    # 市场动态
    market_news = [n for n in news_list if '价格' in n.get('title', '') or '市场' in n.get('title', '') or '涨价' in n.get('title', '')]
    if market_news:
        html_parts.append(f'<div class="report-section">')
        html_parts.append(f'  <div class="report-section-title">📈 市场动态</div>')
        for news in market_news[:3]:
            html_parts.append(f'  <div class="report-item">')
            html_parts.append(f'    <div class="item-title">{news["title"]}</div>')
            html_parts.append(f'    <div class="item-content">{news["content"]}</div>')
            html_parts.append(f'    <div class="item-meta"><span class="impact">💡 影响：{news["impact"]}</span></div>')
            html_parts.append(f'  </div>')
        html_parts.append(f'</div>')
    
    # 竞品与客户动态
    competitor_news = [n for n in news_list if any(kw in n.get('title', '') for kw in ['竞品', '客户', '订单', '长协'])]
    if competitor_news:
        html_parts.append(f'<div class="report-section">')
        html_parts.append(f'  <div class="report-section-title">🏆 竞品与客户动态</div>')
        for news in competitor_news[:3]:
            html_parts.append(f'  <div class="report-item">')
            html_parts.append(f'    <div class="item-title">{news["title"]}</div>')
            html_parts.append(f'    <div class="item-content">{news["content"]}</div>')
            html_parts.append(f'    <div class="item-meta"><span class="impact">💡 影响：{news["impact"]}</span></div>')
            html_parts.append(f'  </div>')
        html_parts.append(f'</div>')
    
    # 前沿与产品动态
    tech_news = [n for n in news_list if any(kw in n.get('title', '') for kw in ['技术', '产品', '产能', '回收率'])]
    if tech_news:
        html_parts.append(f'<div class="report-section">')
        html_parts.append(f'  <div class="report-section-title">🔬 前沿与产品动态</div>')
        for news in tech_news[:3]:
            html_parts.append(f'  <div class="report-item">')
            html_parts.append(f'    <div class="item-title">{news["title"]}</div>')
            html_parts.append(f'    <div class="item-content">{news["content"]}</div>')
            html_parts.append(f'    <div class="item-meta"><span class="impact">💡 影响：{news["impact"]}</span></div>')
            html_parts.append(f'  </div>')
        html_parts.append(f'</div>')
    
    # 风险提示
    risk_news = [n for n in news_list if any(kw in n.get('title', '') for kw in ['风险', '下跌', '压力', '困境'])]
    if risk_news:
        html_parts.append(f'<div class="report-section">')
        html_parts.append(f'  <div class="report-section-title">⚠️ 风险提示</div>')
        for news in risk_news[:2]:
            html_parts.append(f'  <div class="report-item">')
            html_parts.append(f'    <div class="item-title">{news["title"]}</div>')
            html_parts.append(f'    <div class="item-content">{news["content"]}</div>')
            html_parts.append(f'  </div>')
        html_parts.append(f'</div>')
    
    return '\n'.join(html_parts)


def main():
    """生成早报 JSON"""
    report_date = "2026-04-09"
    window_start = "2026-04-07"
    window_end = "2026-04-09"
    
    departments = {}
    
    for division_name, data in SEARCH_DATA.items():
        html_content = generate_report_html(division_name, data["news"])
        
        departments[division_name] = {
            "_raw_content": html_content,
            "news_count": len(data["news"]),
            "last_updated": f"{report_date} 09:00"
        }
    
    # 构建 JSON 结构
    output_data = {
        "report_date": report_date,
        "window": f"{window_start} 至 {window_end}",
        "generated_at": f"{report_date} 09:00",
        "source": "实时搜索数据（妙想搜索 + 联网搜索）",
        "departments": departments
    }
    
    # 保存 JSON
    output_file = "reports/2026-04-09_realtime.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"[OK] 实时搜索版早报已生成：{output_file}")
    print(f"[OK] 共 {len(departments)} 个事业部")
    
    # 统计各事业部新闻数量
    for div_name, div_data in departments.items():
        print(f"  - {div_name}: {div_data['news_count']} 条")


if __name__ == "__main__":
    main()
