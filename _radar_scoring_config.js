/**
 * ============================================================
 * 雷达看板 - 单一配置源
 * ============================================================
 * 所有 BU 的元数据、权重、维度定义、KPI 子项、D1 子权重
 * 统一在此文件定义，radar_hub.html 和 radar_detail_*.html 均引用此文件。
 *
 * 使用方式：
 *   在 HTML 中通过 <script src="_radar_scoring_config.js"></script> 引入
 *   然后通过 BU_CONFIG[buId] 访问对应 BU 的配置
 *
 * 新增 BU：只需在此文件添加一条记录
 * 调整权重/维度：只需修改此文件
 * ============================================================
 */

var BU_CONFIG = {
    // ============================================================
    // 迪克化学（dhx）— 试点 BU
    // ============================================================
    dhx: {
        name: '迪克化学',
        subtitle: '汽车化学品 · 冷却液 · 制动液',
        category: 'lithium',
        color: '#7986cb',

        // 六维权重（%），总和=100
        weights: [20, 22, 18, 15, 15, 10],

        // 维度中文名称（Tab1 雷达图标签 + Tab3 面板标题）
        dimNames: ['战略执行力', '经营效益', '运营效率', '技术创新力', '风险合规', '组织活力'],

        // 各维度 KPI 子项名称（Tab2 柱状图标签）
        kpiLabels: {
            d1: ['收入达成率', '利润达成率', '毛利率', '费用控制率'],
            d2: ['冷却液销售', '制动液销售', '防冻液销售', '其他化学品'],
            d3: ['准时交付率', '存货周转率', '应收账款天数', '采购降本'],
            d4: ['新产品开发', 'OEM认证', '技术降本', '研发费用率'],
            d5: ['质量体系', '环保合规', '客户投诉率', '供应商审核'],
            d6: ['AI项目立项', '新客户开发', '人才引进', '数字化项目'],
        },

        // D1 内部子指标权重（%），用于自动计算 D1 得分
        // 迪克化学：D1 = 收入达成率30% + 利润达成率30% + 毛利率25% + 费用控制率15%
        d1Weights: [30, 30, 25, 15],
    },

    // ============================================================
    // 可兰素（kls）— 车用尿素
    // ============================================================
    kls: {
        name: '可兰素',
        subtitle: '车用尿素',
        category: 'lithium',
        color: '#d35400',
        weights: [18, 22, 15, 22, 15, 8],
        dimNames: ['核心考核', '经营效益', '运营效率', '技术创新', '风险合规', '组织活力'],
        kpiLabels: {
            d1: ['产量', '营收', '净利润', '毛利率'],
            d2: ['尿素OEE', '维修费降本', '物流降本', '采购降本'],
            d3: ['总库存', '超期库存', '吨维修费', '能耗降本'],
            d4: ['来料合格率', '成品合格率', '市场抽检', 'CNAS进度'],
            d5: ['安全事故', '环保违规', '诉讼案件', '隐患整改率'],
            d6: ['网点开发', '电商出库', '干部述职', '数字化项目'],
        },
        d1Weights: [25, 30, 25, 20],
    },

    // ============================================================
    // 润滑油（lhy）
    // ============================================================
    lhy: {
        name: '润滑油',
        subtitle: '润滑油 · 冷却液 · 海外市场',
        category: 'lithium',
        color: '#c0392b',
        weights: [18, 22, 15, 22, 15, 8],
        dimNames: ['核心考核', '经营效益', '运营效率', '技术创新', '风险合规', '组织活力'],
        kpiLabels: {
            d1: ['收入达成率', '利润达成率', '毛利率', '费用控制率'],
            d2: ['冷却液销售', '油品销售', '海外市场', '玻璃水销售'],
            d3: ['一次合格率', '单吨能耗', '期间费用率', '库存周转'],
            d4: ['新产品配方', 'OEM认证', '技术服务', '国六适配'],
            d5: ['环保合规', '安全培训', '绿色工厂', '客户投诉率'],
            d6: ['AI项目立项', '新市场开拓', '数字化项目', '文章发布'],
        },
        d1Weights: [30, 30, 25, 15],
    },

    // ============================================================
    // 山东美多（sdmd）
    // ============================================================
    sdmd: {
        name: '山东美多',
        subtitle: '动力电池回收',
        category: 'lithium',
        color: '#215732',
        weights: [18, 18, 20, 15, 18, 11],
        dimNames: ['核心KPI', '经营效益', '运营效率', '技术创新力', '风险合规', '组织活力'],
        kpiLabels: {
            d1: ['收入达成率', '利润达成率', '成本控制率', '回款率'],
            d2: ['碳酸锂销量', '修复LFP交付', '磷铁液交付', '元明粉销售'],
            d3: ['碳酸锂投料', '碳酸锂产出', '磷铁液产出', '加工成本'],
            d4: ['在研课题', 'MCU项目', 'MCU降本', '技改项目'],
            d5: ['隐患整改率', '安全教育', '排查隐患', '应急演练'],
            d6: ['AI项目立项', '企业荣誉', 'IATF审核', '5S覆盖率'],
        },
        d1Weights: [35, 35, 15, 15],
    },

    // ============================================================
    // 常州锂源（czly）
    // ============================================================
    czly: {
        name: '常州锂源',
        subtitle: '磷酸铁锂正极材料',
        category: 'lithium',
        color: '#064e3b',
        weights: [20, 20, 18, 17, 13, 12],
        dimNames: ['核心考核', '经营效益', '运营效率', '技术创新', '风险合规', '组织活力'],
        kpiLabels: {
            d1: ['收入达成率', '利润达成率', '毛利率', '期间费用率'],
            d2: ['铁锂销量', '回收业务', '海外市场', '新品导入'],
            d3: ['产能利用率', '一次合格率', '单吨能耗', '存货周转'],
            d4: ['新产品开发', '技术降本', '客户认证', '研发投入'],
            d5: ['安全培训', '环保合规', '质量体系', '客户投诉率'],
            d6: ['AI项目', '新市场', '人才培养', '数字化'],
        },
        d1Weights: [30, 30, 25, 15],
    },

    // ============================================================
    // 龙蟠时代（lpsd）
    // ============================================================
    lpsd: {
        name: '龙蟠时代',
        subtitle: '碳酸锂',
        category: 'lithium',
        color: '#2e75b6',
        weights: [20, 20, 18, 17, 13, 12],
        dimNames: ['核心考核', '经营效益', '运营效率', '技术创新', '风险合规', '组织活力'],
        kpiLabels: {
            d1: ['收入达成率', '利润达成率', '毛利率', '期间费用率'],
            d2: ['碳酸锂销售', '回收业务', '海外市场', '新品导入'],
            d3: ['产能利用率', '一次合格率', '单吨能耗', '存货周转'],
            d4: ['新产品开发', '技术降本', '客户认证', '研发投入'],
            d5: ['安全培训', '环保合规', '质量体系', '客户投诉率'],
            d6: ['AI项目', '新市场', '人才培养', '数字化'],
        },
        d1Weights: [30, 30, 25, 15],
    },

    // ============================================================
    // 法恩莱特（felt）
    // ============================================================
    felt: {
        name: '法恩莱特',
        subtitle: '电解液',
        category: 'lithium',
        color: '#7b2d8b',
        weights: [15, 20, 22, 18, 15, 10],
        dimNames: ['核心考核', '经营效益', '运营效率', '技术创新', '风险合规', '组织活力'],
        kpiLabels: {
            d1: ['收入达成率', '利润达成率', '毛利率', '期间费用率'],
            d2: ['电解液销售', '溶剂销售', '添加剂销售', '海外业务'],
            d3: ['产能利用率', '一次合格率', '单吨能耗', '存货周转'],
            d4: ['新产品开发', '技术降本', '客户认证', '研发投入'],
            d5: ['安全培训', '环保合规', '质量体系', '客户投诉率'],
            d6: ['AI项目', '新市场', '人才培养', '数字化'],
        },
        d1Weights: [30, 30, 25, 15],
    },

    // ============================================================
    // 三金锂电（sjld）
    // ============================================================
    sjld: {
        name: '三金锂电',
        subtitle: '三元前驱体',
        category: 'lithium',
        color: '#34495e',
        weights: [15, 18, 15, 17, 25, 10],
        dimNames: ['核心考核', '经营效益', '运营效率', '技术创新', '风险合规', '组织活力'],
        kpiLabels: {
            d1: ['收入达成率', '利润达成率', '毛利率', '期间费用率'],
            d2: ['三元前驱体', '硫酸钴镍', '硫酸锰', '回收料'],
            d3: ['产能利用率', '一次合格率', '单吨能耗', '存货周转'],
            d4: ['新产品开发', '技术降本', '客户认证', '研发投入'],
            d5: ['安全培训', '环保合规', '质量体系', '客户投诉率'],
            d6: ['AI项目', '新市场', '人才培养', '数字化'],
        },
        d1Weights: [30, 30, 25, 15],
    },
};

// ============================================================
// 通用工具函数（供 radar_detail_*.html 调用）
// ============================================================

/**
 * 计算 D1 维度分数
 * 根据 kpis.d1 数组和该 BU 的 d1Weights 自动加权计算
 * @param {string} buId - BU ID，如 'dhx', 'kls'
 * @param {number[]} kpiArr - kpis.d1 数组 [达成率1, 达成率2, 达成率3, 达成率4]
 * @returns {number} D1 分数（0-100，四舍五入）
 */
function calcD1(buId, kpiArr) {
    var cfg = BU_CONFIG[buId];
    if (!cfg || !cfg.d1Weights) return null;
    var w = cfg.d1Weights;
    if (!kpiArr || kpiArr.length !== w.length) {
        console.warn('[calcD1] buId=' + buId + ', kpiArr 长度不匹配，期望' + w.length + '个，实际' + (kpiArr ? kpiArr.length : 'null'));
        return null;
    }
    var score = kpiArr.reduce(function(s, v, i) { return s + v * w[i] / 100; }, 0);
    return Math.round(score);
}

/**
 * 计算综合评分
 * @param {string} buId - BU ID
 * @param {object} dims - { d1, d2, d3, d4, d5, d6 }
 * @returns {number} 综合分（0-100，四舍五入）
 */
function calcTotalScore(buId, dims) {
    var cfg = BU_CONFIG[buId];
    if (!cfg) return null;
    var wts = cfg.weights;
    var DIM_KEYS = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'];
    var score = DIM_KEYS.reduce(function(s, k, i) {
        return s + (dims[k] || 0) * wts[i] / 100;
    }, 0);
    return Math.round(score);
}

// ============================================================
// BU_SCORE_DETAIL: 各BU雷达分数历史数据（供详情页使用）
// ============================================================
window.BU_SCORE_DETAIL = {
  "czly": {
    "2026-03": {
      "dims": {
        "d1": 62,
        "d2": 44,
        "d3": 75,
        "d4": 55,
        "d5": 98,
        "d6": 50
      },
      "kpis": {
        "d1": [
          47,
          78,
          0,
          104
        ],
        "d2": [
          42,
          50,
          85,
          90
        ],
        "d3": [
          42,
          99,
          81,
          77
        ],
        "d4": [
          50,
          60,
          60,
          50
        ],
        "d5": [
          99,
          100,
          100,
          100
        ],
        "d6": [
          0,
          50,
          60,
          50
        ]
      },
      "_kpiComparison": {
        "title": "3月核心KPI达成率",
        "period": "2026年3月",
        "items": [
          {
            "name": "销量(吨)",
            "budget": 25328,
            "target": 25328,
            "actual": 9404,
            "unit": "吨"
          },
          {
            "name": "加工费(元/吨)",
            "budget": 17900,
            "target": 17900,
            "actual": 17626,
            "unit": "元/吨"
          },
          {
            "name": "净利润(万元)",
            "budget": 3184,
            "target": 3184,
            "actual": -2569,
            "unit": "万元"
          },
          {
            "name": "回款率(%)",
            "budget": 85,
            "target": 85,
            "actual": 71,
            "unit": "%"
          },
          {
            "name": "一次合格率(%)",
            "budget": 99.38,
            "target": 99.38,
            "actual": 98.61,
            "unit": "%"
          },
          {
            "name": "存货周转天数",
            "budget": 60,
            "target": 60,
            "actual": 77,
            "unit": "天"
          }
        ]
      }
    },
    "2026-04": {
      "dims": {
        "d1": 73,
        "d2": 44,
        "d3": 75,
        "d4": 55,
        "d5": 99,
        "d6": 56
      },
      "kpis": {
        "d1": [
          47,
          95,
          0,
          97
        ],
        "d2": [
          47,
          60,
          100,
          100
        ],
        "d3": [
          46,
          99,
          81,
          89
        ],
        "d4": [
          50,
          60,
          60,
          50
        ],
        "d5": [
          99,
          100,
          100,
          100
        ],
        "d6": [
          0,
          60,
          60,
          50
        ]
      },
      "_kpiComparison": {
        "title": "4月核心KPI达成率",
        "period": "2026年4月",
        "items": [
          {
            "name": "销量(吨)",
            "budget": 25948,
            "target": 25948,
            "actual": 12206,
            "unit": "吨"
          },
          {
            "name": "加工费(元/吨)",
            "budget": 17900,
            "target": 17900,
            "actual": 16989,
            "unit": "元/吨"
          },
          {
            "name": "净利润(万元)",
            "budget": 3832,
            "target": 3832,
            "actual": -2673,
            "unit": "万元"
          },
          {
            "name": "回款率(%)",
            "budget": 85,
            "target": 85,
            "actual": 78,
            "unit": "%"
          },
          {
            "name": "一次合格率(%)",
            "budget": 99.38,
            "target": 99.38,
            "actual": 98.68,
            "unit": "%"
          },
          {
            "name": "存货周转天数",
            "budget": 60,
            "target": 60,
            "actual": 72,
            "unit": "天"
          }
        ]
      }
    },
    "2026-05": {
      "dims": {
        "d1": 86,
        "d2": 95,
        "d3": 88,
        "d4": 47,
        "d5": 95,
        "d6": 45
      },
      "kpis": {
        "d1": [
          86,
          111,
          80,
          97
        ],
        "d2": [
          100,
          90,
          100,
          95
        ],
        "d3": [
          103,
          100,
          95,
          120
        ],
        "d4": [
          50,
          60,
          17,
          100
        ],
        "d5": [
          99,
          100,
          100,
          100
        ],
        "d6": [
          50,
          60,
          60,
          50
        ]
      },
      "_kpiComparison": {
        "title": "5月核心KPI达成率",
        "period": "2026年5月",
        "items": [
          {
            "name": "销量(吨)",
            "budget": 41600,
            "target": 41600,
            "actual": 27000,
            "unit": "吨"
          },
          {
            "name": "产量(吨)",
            "budget": 36010,
            "target": 36010,
            "actual": 30937,
            "unit": "吨"
          },
          {
            "name": "发货量(吨)",
            "budget": 29339,
            "target": 29339,
            "actual": 29339,
            "unit": "吨"
          },
          {
            "name": "一次合格率(%)",
            "budget": 99.38,
            "target": 99.38,
            "actual": 99.77,
            "unit": "%"
          },
          {
            "name": "安全事故(起)",
            "budget": 0,
            "target": 0,
            "actual": 0,
            "unit": "起"
          }
        ]
      }
    },
    "2026-06": {
      "dims": {
        "d1": 62,
        "d2": 82,
        "d3": 86,
        "d4": 52,
        "d5": 90,
        "d6": 52
      },
      "kpis": null
    },
    "2026-07": {
      "dims": {
        "d1": 62,
        "d2": 75,
        "d3": 74,
        "d4": 55,
        "d5": 98,
        "d6": 68
      },
      "kpis": null
    },
    "2026-08": {
      "dims": {
        "d1": 60,
        "d2": 70,
        "d3": 74,
        "d4": 75,
        "d5": 98,
        "d6": 80
      },
      "kpis": {
        "d1": [81, 72, 100, 95],
        "d2": [94, 89, 71, 68],
        "d3": [93, 100, 73, 239],
        "d4": [75, 2, 10, 13],
        "d5": [100, 99.5, 100, 100],
        "d6": [80, 10, 1, 16]
      },
      "_kpiComparison": {
        "title": "8月核心KPI达成率",
        "period": "2026年8月",
        "items": [
          { "name": "产量(万吨)", "budget": 5.41, "target": 5.41, "actual": 4.40, "unit": "万吨" },
          { "name": "发货量(万吨)", "budget": 5.30, "target": 5.30, "actual": 3.83, "unit": "万吨" },
          { "name": "产销率(%)", "budget": 100, "target": 100, "actual": 89, "unit": "%" },
          { "name": "一次合格率(%)", "budget": 99.38, "target": 99.38, "actual": 99.83, "unit": "%" },
          { "name": "客户投诉(次)", "budget": 0, "target": 0, "actual": 2, "unit": "次" }
        ]
      },
      "_dimComparison_d2": {
        "title": "8月各基地净产出概览",
        "items": [
          { "name": "江苏基地净产出(吨)", "budget": 2823, "target": 2823, "actual": 2658, "unit": "吨" },
          { "name": "天津基地净产出(吨)", "budget": 252, "target": 252, "actual": 302, "unit": "吨" },
          { "name": "四川基地净产出(吨)", "budget": 14000, "target": 14000, "actual": 12430, "unit": "吨" },
          { "name": "山东基地净产出(吨)", "budget": 13021, "target": 13021, "actual": 9190, "unit": "吨" },
          { "name": "湖北基地净产出(吨)", "budget": 11062, "target": 11062, "actual": 7573, "unit": "吨" },
          { "name": "印尼基地净产出(吨)", "budget": 12022, "target": 12022, "actual": 11093, "unit": "吨" },
          { "name": "合计净产出(吨)", "budget": 53180, "target": 53180, "actual": 43246, "unit": "吨" }
        ]
      },
      "_dimComparison_d3": {
        "title": "8月运营效率",
        "format": "mom",
        "items": [
          { "name": "整体产能利用率(%)", "prev": 98, "curr": 93, "unit": "%" },
          { "name": "产品一次合格率(%)", "prev": 99.83, "curr": 99.83, "unit": "%" },
          { "name": "OEE(%)", "prev": 71.95, "curr": 73.31, "unit": "%" },
          { "name": "单吨物流成本(元)", "prev": 272, "curr": 239, "unit": "元" }
        ]
      },
      "_dimComparison_d4": {
        "title": "8月技术创新与市场",
        "format": "mom",
        "items": [
          { "name": "8月销量(吨)", "prev": 31949, "curr": 38900, "unit": "吨" },
          { "name": "行业产量排名", "prev": 2, "curr": 2, "unit": "名" },
          { "name": "新客户开发(家)", "prev": 0, "curr": 10, "unit": "家" },
          { "name": "核心长协签订(份)", "prev": 0, "curr": 1, "unit": "份" }
        ]
      },
      "_dimComparison_d5": {
        "title": "8月安全环保合规",
        "format": "mom",
        "items": [
          { "name": "可记录工伤事故(起)", "prev": 0, "curr": 0, "unit": "起" },
          { "name": "隐患整改率(%)", "prev": 99.5, "curr": 99.5, "unit": "%" },
          { "name": "环保处罚(项)", "prev": 0, "curr": 0, "unit": "项" },
          { "name": "职业健康体检率(%)", "prev": 100, "curr": 100, "unit": "%" }
        ]
      },
      "_dimComparison_d6": {
        "title": "8月组织活力",
        "format": "mom",
        "items": [
          { "name": "新客户开发(家)", "prev": 0, "curr": 10, "unit": "家" },
          { "name": "长协签订(份)", "prev": 0, "curr": 1, "unit": "份" },
          { "name": "在研项目(项)", "prev": 10, "curr": 13, "unit": "项" },
          { "name": "次月核心计划(项)", "prev": 0, "curr": 16, "unit": "项" }
        ]
      }
    }
  },
  "sdmd": {
    "2026-03": {
      "dims": {
        "d1": 100,
        "d2": 100,
        "d3": 92,
        "d4": 87,
        "d5": 85,
        "d6": 78
      },
      "kpis": {
        "d1": [
          100,
          100,
          100,
          100
        ],
        "d2": [
          100,
          100,
          100,
          100
        ],
        "d3": [
          95.2,
          107.5,
          57.4,
          107.2
        ],
        "d4": [
          100,
          80,
          80,
          null
        ],
        "d5": [
          82.3,
          108,
          100,
          50
        ],
        "d6": [
          60,
          60,
          90,
          100
        ]
      },
      "_kpiComparison": {
        "title": "3月核心KPI达标率（预算 → 挑战目标 → 实际）",
        "period": "2026年3月",
        "items": [
          {
            "name": "收入(万元)",
            "budget": 3505,
            "target": 7000,
            "actual": 7279,
            "unit": "万元"
          },
          {
            "name": "毛利(万元)",
            "budget": 252,
            "target": 850,
            "actual": 907,
            "unit": "万元"
          },
          {
            "name": "扣非净利润(万元)",
            "budget": 63,
            "target": 650,
            "actual": 692,
            "unit": "万元"
          },
          {
            "name": "经营净利润(万元)",
            "budget": 79,
            "target": 680,
            "actual": 724,
            "unit": "万元"
          },
          {
            "name": "回款(万元)",
            "budget": 3961,
            "target": 5500,
            "actual": 5835,
            "unit": "万元"
          },
          {
            "name": "加工成本(万/t)",
            "budget": 1.78,
            "target": 1.78,
            "actual": 1.66,
            "unit": "万/t"
          },
          {
            "name": "产品一次合格率",
            "budget": 100,
            "target": 100,
            "actual": 100,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d2": {
        "title": "3月产品销量达成（预算 → 目标 → 实际）",
        "items": [
          {
            "name": "碳酸锂销量(吨)",
            "budget": 400,
            "target": 400,
            "actual": 400,
            "unit": "吨"
          },
          {
            "name": "修复LFP交付(吨)",
            "budget": 400,
            "target": 400,
            "actual": 400,
            "unit": "吨"
          },
          {
            "name": "磷铁液交付(m³)",
            "budget": 3100,
            "target": 2000,
            "actual": 1297,
            "unit": "m³"
          },
          {
            "name": "元明粉销售(吨)",
            "budget": 1700,
            "target": 1400,
            "actual": 1380,
            "unit": "吨"
          }
        ]
      },
      "_dimComparison_d3": {
        "title": "3月生产效率达成（预算 → 目标 → 实际）",
        "items": [
          {
            "name": "碳酸锂投料(吨)",
            "budget": 2121,
            "target": 2121,
            "actual": 2019.5,
            "unit": "吨"
          },
          {
            "name": "碳酸锂产出(吨)",
            "budget": 372,
            "target": 372,
            "actual": 400,
            "unit": "吨"
          },
          {
            "name": "磷铁液产出(m³)",
            "budget": 3100,
            "target": 3100,
            "actual": 1777.75,
            "unit": "m³"
          },
          {
            "name": "加工成本(万/t)",
            "budget": 1.78,
            "target": 1.78,
            "actual": 1.66,
            "unit": "万/t"
          }
        ]
      },
      "_dimComparison_d4": {
        "title": "技术创新力 3月基准",
        "format": "mom",
        "items": [
          {
            "name": "在研课题(个)",
            "prev": 8,
            "curr": 8,
            "unit": "个"
          },
          {
            "name": "MCU项目(项)",
            "prev": 4,
            "curr": 4,
            "unit": "项"
          },
          {
            "name": "MCU降本(万元)",
            "prev": 43.9,
            "curr": 43.9,
            "unit": "万元"
          },
          {
            "name": "技改项目(项)",
            "prev": 4,
            "curr": 4,
            "unit": "项"
          }
        ]
      },
      "_dimComparison_d5": {
        "title": "安全环保 3月基准",
        "format": "mom",
        "items": [
          {
            "name": "隐患整改率(%)",
            "prev": 82.3,
            "curr": 82.3,
            "unit": "%"
          },
          {
            "name": "安全教育(人次)",
            "prev": 600,
            "curr": 600,
            "unit": "人次"
          },
          {
            "name": "排查隐患(项)",
            "prev": 3024,
            "curr": 3024,
            "unit": "项"
          },
          {
            "name": "应急演练(场)",
            "prev": 2,
            "curr": 2,
            "unit": "场"
          }
        ]
      },
      "_dimComparison_d6": {
        "title": "组织活力 3月基准",
        "format": "mom",
        "items": [
          {
            "name": "AI项目立项(个)",
            "prev": 0,
            "curr": 0,
            "unit": "个"
          },
          {
            "name": "获得企业荣誉(项)",
            "prev": 0,
            "curr": 0,
            "unit": "项"
          },
          {
            "name": "IATF审核问题(项)",
            "prev": 0,
            "curr": 0,
            "unit": "项"
          },
          {
            "name": "5S覆盖率(%)",
            "prev": 100,
            "curr": 100,
            "unit": "%"
          }
        ]
      }
    },
    "2026-04": {
      "dims": {
        "d1": 100,
        "d2": 88,
        "d3": 90,
        "d4": 100,
        "d5": 78,
        "d6": 75
      },
      "kpis": {
        "d1": [
          99.9,
          100,
          99,
          100
        ],
        "d2": [
          100,
          75,
          77.1,
          101.4
        ],
        "d3": [
          98.4,
          100,
          74.6,
          86.9
        ],
        "d4": [
          120,
          120,
          100,
          null
        ],
        "d5": [
          110.4,
          120,
          78.9,
          100
        ],
        "d6": [
          70,
          60,
          90,
          90
        ]
      },
      "_kpiComparison": {
        "title": "4月核心KPI达标率（预算 → 挑战目标 → 实际）",
        "period": "2026年4月",
        "items": [
          {
            "name": "收入(万元)",
            "budget": 3641,
            "target": 7100,
            "actual": 7382,
            "unit": "万元"
          },
          {
            "name": "毛利(万元)",
            "budget": 287,
            "target": 800,
            "actual": 865,
            "unit": "万元"
          },
          {
            "name": "扣非净利润(万元)",
            "budget": 97,
            "target": 480,
            "actual": 518,
            "unit": "万元"
          },
          {
            "name": "经营净利润(万元)",
            "budget": 113,
            "target": 500,
            "actual": 542,
            "unit": "万元"
          },
          {
            "name": "回款(万元)",
            "budget": 4114,
            "target": 6300,
            "actual": 6733,
            "unit": "万元"
          },
          {
            "name": "加工成本(万/t)",
            "budget": 1.78,
            "target": 1.89,
            "actual": 1.91,
            "unit": "万/t"
          },
          {
            "name": "产品一次合格率",
            "budget": 100,
            "target": 100,
            "actual": 100,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d2": {
        "title": "4月产品销量达成（预算 → 目标 → 实际）",
        "items": [
          {
            "name": "碳酸锂销量(吨)",
            "budget": 400,
            "target": 400,
            "actual": 400,
            "unit": "吨"
          },
          {
            "name": "修复LFP交付(吨)",
            "budget": 400,
            "target": 400,
            "actual": 300,
            "unit": "吨"
          },
          {
            "name": "磷铁液交付(m³)",
            "budget": 3100,
            "target": 1500,
            "actual": 1000,
            "unit": "m³"
          },
          {
            "name": "元明粉销售(吨)",
            "budget": 1700,
            "target": 1400,
            "actual": 1400,
            "unit": "吨"
          }
        ]
      },
      "_dimComparison_d3": {
        "title": "4月生产效率达成（预算 → 目标 → 实际）",
        "items": [
          {
            "name": "碳酸锂投料(吨)",
            "budget": 2100,
            "target": 2100,
            "actual": 1988,
            "unit": "吨"
          },
          {
            "name": "碳酸锂产出(吨)",
            "budget": 400,
            "target": 400,
            "actual": 400,
            "unit": "吨"
          },
          {
            "name": "磷铁液产出(m³)",
            "budget": 3100,
            "target": 2000,
            "actual": 1325.86,
            "unit": "m³"
          },
          {
            "name": "加工成本(万/t)",
            "budget": 1.78,
            "target": 1.66,
            "actual": 1.91,
            "unit": "万/t"
          }
        ]
      },
      "_dimComparison_d4": {
        "title": "技术创新力 3月→4月环比",
        "format": "mom",
        "items": [
          {
            "name": "在研课题(个)",
            "prev": 8,
            "curr": 11,
            "unit": "个"
          },
          {
            "name": "MCU项目(项)",
            "prev": 4,
            "curr": 7,
            "unit": "项"
          },
          {
            "name": "MCU降本(万元)",
            "prev": 43.9,
            "curr": 18.31,
            "unit": "万元"
          },
          {
            "name": "技改项目(项)",
            "prev": 4,
            "curr": 9,
            "unit": "项"
          }
        ]
      },
      "_dimComparison_d5": {
        "title": "安全环保 3月→4月环比",
        "format": "mom",
        "items": [
          {
            "name": "隐患整改率(%)",
            "prev": 82.3,
            "curr": 90.83,
            "unit": "%"
          },
          {
            "name": "安全教育(人次)",
            "prev": 600,
            "curr": 703,
            "unit": "人次"
          },
          {
            "name": "排查隐患(项)",
            "prev": 3024,
            "curr": 2387,
            "unit": "项"
          },
          {
            "name": "应急演练(场)",
            "prev": 2,
            "curr": 2,
            "unit": "场"
          }
        ]
      },
      "_dimComparison_d6": {
        "title": "组织活力 3月→4月环比",
        "format": "mom",
        "items": [
          {
            "name": "AI项目立项(个)",
            "prev": 0,
            "curr": 0,
            "unit": "个"
          },
          {
            "name": "获得企业荣誉(项)",
            "prev": 0,
            "curr": 0,
            "unit": "项"
          },
          {
            "name": "IATF审核问题(项)",
            "prev": 0,
            "curr": 46,
            "unit": "项"
          },
          {
            "name": "5S覆盖率(%)",
            "prev": 100,
            "curr": 100,
            "unit": "%"
          }
        ]
      }
    },
    "2026-05": {
      "dims": {
        "d1": 90,
        "d2": 90,
        "d3": 82,
        "d4": 80,
        "d5": 90,
        "d6": 78
      },
      "kpis": {
        "d1": [
          94.9,
          93.5,
          81.6,
          100
        ],
        "d2": [
          102.9,
          85.6,
          77,
          105.3
        ],
        "d3": [
          84.1,
          95.2,
          71,
          81.6
        ],
        "d4": [
          72.7,
          71.4,
          100,
          null
        ],
        "d5": [
          108.2,
          120,
          118,
          50
        ],
        "d6": [
          80,
          80,
          120,
          100
        ]
      }
    },
    "2026-06": {
      "dims": {
        "d1": 76,
        "d2": 74,
        "d3": 78,
        "d4": 89,
        "d5": 74,
        "d6": 100
      },
      "kpis": {
        "d1": [
          72.3,
          35.9,
          93.9,
          100
        ],
        "d2": [
          63,
          100,
          31.1,
          100
        ],
        "d3": [
          87.4,
          100,
          32.3,
          93.9
        ],
        "d4": [
          100,
          100,
          null,
          66.7
        ],
        "d5": [
          90,
          53.5,
          53.9,
          100
        ],
        "d6": [
          100,
          100,
          100,
          100
        ]
      },
      "_isCurrent": true,
      "_kpiComparison": {
        "title": "6月核心KPI达标率（预算 → 实际）",
        "period": "2026年6月",
        "items": [
          {
            "name": "收入(万元)",
            "budget": 3914,
            "target": 3914,
            "actual": 4682,
            "unit": "万元"
          },
          {
            "name": "毛利(万元)",
            "budget": 356,
            "target": 356,
            "actual": 187,
            "unit": "万元"
          },
          {
            "name": "扣非净利润(万元)",
            "budget": 170,
            "target": 170,
            "actual": 2,
            "unit": "万元"
          },
          {
            "name": "经营净利润(万元)",
            "budget": 182,
            "target": 182,
            "actual": 34,
            "unit": "万元"
          },
          {
            "name": "回款(万元)",
            "budget": 4423,
            "target": 4423,
            "actual": 10072,
            "unit": "万元"
          },
          {
            "name": "加工成本(万/t)",
            "budget": 1.99,
            "target": 1.99,
            "actual": 2.12,
            "unit": "万/t"
          },
          {
            "name": "产品一次合格率",
            "budget": 100,
            "target": 100,
            "actual": 100,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d2": {
        "title": "6月产品销量达成（预算 → 目标 → 实际）",
        "items": [
          {
            "name": "碳酸锂销量(吨)",
            "budget": 330,
            "target": 330,
            "actual": 208,
            "unit": "吨"
          },
          {
            "name": "修复LFP交付(吨)",
            "budget": 300,
            "target": 300,
            "actual": 310,
            "unit": "吨"
          },
          {
            "name": "磷铁液交付(m³)",
            "budget": 4500,
            "target": 4500,
            "actual": 1400,
            "unit": "m³"
          },
          {
            "name": "元明粉销售(吨)",
            "budget": 1500,
            "target": 1500,
            "actual": 1500,
            "unit": "吨"
          }
        ]
      },
      "_dimComparison_d3": {
        "title": "6月生产效率达成（预算 → 目标 → 实际）",
        "items": [
          {
            "name": "碳酸锂投料(吨)",
            "budget": 1960,
            "target": 1960,
            "actual": 1945.5,
            "unit": "吨"
          },
          {
            "name": "碳酸锂产出(吨)",
            "budget": 330,
            "target": 330,
            "actual": 364.5,
            "unit": "吨"
          },
          {
            "name": "磷铁液产出(m³)",
            "budget": 4500,
            "target": 4500,
            "actual": 1453.64,
            "unit": "m³"
          },
          {
            "name": "加工成本(万/t)",
            "budget": 1.99,
            "target": 1.99,
            "actual": 2.12,
            "unit": "万/t"
          }
        ]
      },
      "_dimComparison_d4": {
        "title": "技术创新力 5月→6月环比",
        "format": "mom",
        "items": [
          {
            "name": "在研课题(个)",
            "prev": 8,
            "curr": 10,
            "unit": "个"
          },
          {
            "name": "MCU项目(项)",
            "prev": 5,
            "curr": 12,
            "unit": "项"
          },
          {
            "name": "MCU降本(万元)",
            "prev": 5.31,
            "curr": 27.64,
            "unit": "万元"
          },
          {
            "name": "技改项目(项)",
            "prev": 12,
            "curr": 8,
            "unit": "项"
          }
        ]
      },
      "_dimComparison_d5": {
        "title": "安全环保 5月→6月环比",
        "format": "mom",
        "items": [
          {
            "name": "隐患整改率(%)",
            "prev": 98.3,
            "curr": 88.48,
            "unit": "%"
          },
          {
            "name": "安全教育(人次)",
            "prev": 2009,
            "curr": 1075,
            "unit": "人次"
          },
          {
            "name": "排查隐患(项)",
            "prev": 2816,
            "curr": 1519,
            "unit": "项"
          },
          {
            "name": "应急演练(场)",
            "prev": 1,
            "curr": 3,
            "unit": "场"
          }
        ]
      },
      "_dimComparison_d6": {
        "title": "组织活力 5月→6月环比",
        "format": "mom",
        "items": [
          {
            "name": "AI项目立项(个)",
            "prev": 16,
            "curr": 72,
            "unit": "个"
          },
          {
            "name": "获得企业荣誉(项)",
            "prev": 2,
            "curr": 4,
            "unit": "项"
          },
          {
            "name": "IATF审核问题(项)",
            "prev": 35,
            "curr": 35,
            "unit": "项"
          },
          {
            "name": "5S覆盖率(%)",
            "prev": 100,
            "curr": 100,
            "unit": "%"
          }
        ]
      }
    },
    "2026-07": {
      "dims": {
        "d1": 54,
        "d2": 71,
        "d3": 68,
        "d4": 80,
        "d5": 93,
        "d6": 93
      },
      "kpis": null
    },
    "2026-08": {
      "dims": {
        "d1": 55,
        "d2": 75,
        "d3": 75,
        "d4": 88,
        "d5": 95,
        "d6": 80
      },
      "kpis": {
        "d1": [110, 0, 95, 80],
        "d2": [110, 100, 30, 80],
        "d3": [90, 110, 30, 95],
        "d4": [80, 110, 120, 110],
        "d5": [95, 110, 110, 100],
        "d6": [100, 60, 80, 80]
      },
      "_isCurrent": true,
      "_kpiComparison": {
        "title": "8月核心KPI达成率",
        "period": "2026年8月",
        "items": [
          {"name": "碳酸锂产量(T)", "budget": 330, "target": 330, "actual": 350, "unit": "T"},
          {"name": "营业收入(万元)", "budget": 4323, "target": 4323, "actual": 296, "unit": "万元"},
          {"name": "毛利率(%)", "budget": 10.62, "target": 10.62, "actual": 11.34, "unit": "%"},
          {"name": "净利润(万元)", "budget": 288, "target": 288, "actual": -119, "unit": "万元"},
          {"name": "资产负债率(%)", "budget": 68.25, "target": 68.25, "actual": 75.0, "unit": "%"},
          {"name": "产品一次合格率(%)", "budget": 99.38, "target": 100.0, "actual": 100.0, "unit": "%"}
        ]
      },
      "_dimComparison_d2": {
        "title": "8月产品交付达成",
        "format": "mom",
        "items": [
          {"name": "碳酸锂产量(T)", "prev": 337.5, "curr": 350, "unit": "T"},
          {"name": "磷铁液产出(m³)", "prev": 2380, "curr": 3200, "unit": "m³"},
          {"name": "磷铁液交付达成率(%)", "prev": 40, "curr": 71, "unit": "%"},
          {"name": "碳酸锂达成率(%)", "prev": 102.3, "curr": 106.1, "unit": "%"}
        ]
      },
      "_dimComparison_d3": {
        "title": "8月生产效率达成",
        "format": "mom",
        "items": [
          {"name": "碳酸锂产出(T)", "prev": 337.5, "curr": 350, "unit": "T"},
          {"name": "OEE(%)", "prev": 90.7, "curr": 91.0, "unit": "%"},
          {"name": "设备故障率(%)", "prev": 1.8, "curr": 2.0, "unit": "%"},
          {"name": "采购降本(万元)", "prev": 32.81, "curr": 34.24, "unit": "万元"}
        ]
      },
      "_dimComparison_d4": {
        "title": "8月技术创新力",
        "format": "mom",
        "items": [
          {"name": "在研课题(项)", "prev": 8, "curr": 6, "unit": "项"},
          {"name": "MCU降本(万元/年)", "prev": 55.5, "curr": 67, "unit": "万元/年"},
          {"name": "技改完成率(%)", "prev": 93, "curr": 100, "unit": "%"},
          {"name": "专利实质审查(项)", "prev": 0, "curr": 8, "unit": "项"}
        ]
      },
      "_dimComparison_d5": {
        "title": "8月安全环保合规",
        "format": "mom",
        "items": [
          {"name": "安全事故(起)", "prev": 0, "curr": 0, "unit": "起"},
          {"name": "环保违规(项)", "prev": 0, "curr": 0, "unit": "项"},
          {"name": "隐患整改率(%)", "prev": 93.25, "curr": 94.84, "unit": "%"},
          {"name": "新增诉讼(件)", "prev": 1, "curr": 0, "unit": "件"}
        ]
      },
      "_dimComparison_d6": {
        "title": "8月组织活力",
        "format": "mom",
        "items": [
          {"name": "AI项目立项(个)", "prev": 72, "curr": 72, "unit": "个"},
          {"name": "重点人才引进(人)", "prev": 2, "curr": 1, "unit": "人"},
          {"name": "管培生校招(人)", "prev": 0, "curr": 9, "unit": "人"},
          {"name": "安全培训覆盖(人次)", "prev": 0, "curr": 566, "unit": "人次"}
        ]
      }
    }
  },
  "felt": {
    "2026-04": {
      "dims": {
        "d1": 20,
        "d2": 15,
        "d3": 47,
        "d4": 100,
        "d5": 71,
        "d6": 50
      },
      "kpis": {
        "d1": [
          52,
          67,
          33,
          100
        ],
        "d2": [
          52,
          67,
          65,
          96
        ],
        "d3": [
          62,
          84,
          59,
          96
        ],
        "d4": [
          116,
          86,
          100,
          54
        ],
        "d5": [
          100,
          100,
          100,
          100
        ],
        "d6": [
          0,
          50,
          50,
          0
        ]
      },
      "_kpiComparison": {
        "title": "4月核心KPI达成率",
        "period": "2026年4月",
        "items": [
          {
            "name": "销量(吨)",
            "budget": 7795,
            "target": 4500,
            "actual": 4155,
            "unit": "吨"
          },
          {
            "name": "销售收入(万)",
            "budget": 17053,
            "target": 10456,
            "actual": 9887,
            "unit": "万"
          },
          {
            "name": "毛利率(%)",
            "budget": 4.8,
            "target": 0.4,
            "actual": -2.5,
            "unit": "%"
          },
          {
            "name": "期间费用(万)",
            "budget": 366,
            "target": 322,
            "actual": 322,
            "unit": "万"
          },
          {
            "name": "净利润(万)",
            "budget": 443,
            "target": -263,
            "actual": -558,
            "unit": "万"
          },
          {
            "name": "经营现金流(万)",
            "budget": 461,
            "target": 303,
            "actual": 362,
            "unit": "万"
          },
          {
            "name": "到期回款率(%)",
            "budget": 90,
            "target": 90,
            "actual": 69,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d2": {
        "title": "4月经营效益",
        "items": [
          {
            "name": "销量达成率(%)",
            "budget": 7795,
            "target": 4500,
            "actual": 4155,
            "unit": "%"
          },
          {
            "name": "收入达成率(%)",
            "budget": 17053,
            "target": 10456,
            "actual": 9887,
            "unit": "%"
          },
          {
            "name": "毛利率(%)",
            "budget": 4.8,
            "target": 0,
            "actual": -2.5,
            "unit": "%"
          },
          {
            "name": "净利率(%)",
            "budget": 443,
            "target": 0,
            "actual": -558,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d3": {
        "title": "4月运营效率",
        "items": [
          {
            "name": "采购量达成率(%)",
            "budget": 6477,
            "target": 5438,
            "actual": 4007,
            "unit": "%"
          },
          {
            "name": "降本率(%)",
            "budget": 0,
            "target": 6,
            "actual": 1.85,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d4": {
        "title": "4月技术创新力",
        "format": "mom",
        "items": [
          {
            "name": "新产品销量(吨)",
            "prev": 0,
            "curr": 580,
            "unit": "吨"
          },
          {
            "name": "采购降本(万)",
            "prev": 0,
            "curr": 168.91,
            "unit": "万"
          }
        ]
      },
      "_dimComparison_d5": {
        "title": "4月风险合规",
        "format": "mom",
        "items": [
          {
            "name": "采购及时到货率(%)",
            "prev": 0,
            "curr": 92,
            "unit": "%"
          },
          {
            "name": "客户审核通过(家)",
            "prev": 0,
            "curr": 1,
            "unit": "家"
          }
        ]
      },
      "_dimComparison_d6": {
        "title": "4月组织活力",
        "format": "mom",
        "items": [
          {
            "name": "战略协议签订(项)",
            "prev": 0,
            "curr": 0,
            "unit": "项"
          },
          {
            "name": "AI项目立项(项)",
            "prev": 0,
            "curr": 0,
            "unit": "项"
          }
        ]
      }
    },
    "2026-05": {
      "dims": {
        "d1": 12,
        "d2": 8,
        "d3": 76,
        "d4": 100,
        "d5": 99,
        "d6": 60
      },
      "kpis": {
        "d1": [
          52,
          67,
          33,
          100
        ],
        "d2": [
          52,
          67,
          65,
          96
        ],
        "d3": [
          62,
          84,
          59,
          96
        ],
        "d4": [
          116,
          86,
          100,
          54
        ],
        "d5": [
          100,
          100,
          100,
          100
        ],
        "d6": [
          0,
          50,
          50,
          0
        ]
      },
      "_isCurrent": true,
      "_kpiComparison": {
        "title": "5月核心KPI达标率",
        "period": "2026年5月",
        "items": [
          {
            "name": "销量(吨)",
            "budget": 8115,
            "target": 4500,
            "actual": 3500,
            "unit": "吨"
          },
          {
            "name": "销售收入(万)",
            "budget": 17796,
            "target": 10456,
            "actual": 7758,
            "unit": "万"
          },
          {
            "name": "毛利率(%)",
            "budget": 4.8,
            "target": 0.4,
            "actual": -2.7,
            "unit": "%"
          },
          {
            "name": "期间费用(万)",
            "budget": 375,
            "target": 322,
            "actual": 343,
            "unit": "万"
          },
          {
            "name": "净利润(万)",
            "budget": 471,
            "target": -263,
            "actual": -540,
            "unit": "万"
          },
          {
            "name": "经营现金流(万)",
            "budget": 640,
            "target": 303,
            "actual": 14,
            "unit": "万"
          },
          {
            "name": "到期回款率(%)",
            "budget": 90,
            "target": 90,
            "actual": 66,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d2": {
        "title": "5月经营效益",
        "items": [
          {
            "name": "销量达成率(%)",
            "budget": 8115,
            "target": 4500,
            "actual": 3500,
            "unit": "%"
          },
          {
            "name": "收入达成率(%)",
            "budget": 17796,
            "target": 10456,
            "actual": 7758,
            "unit": "%"
          },
          {
            "name": "毛利率(%)",
            "budget": 4.8,
            "target": 0,
            "actual": -2.7,
            "unit": "%"
          },
          {
            "name": "净利率(%)",
            "budget": 471,
            "target": 0,
            "actual": -540,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d3": {
        "title": "5月运营效率",
        "items": [
          {
            "name": "采购量达成率(%)",
            "budget": 5438,
            "target": 5438,
            "actual": 2798,
            "unit": "%"
          },
          {
            "name": "降本率(%)",
            "budget": 0,
            "target": 6,
            "actual": 9.22,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d4": {
        "title": "5月技术创新力 4月→5月环比",
        "format": "mom",
        "items": [
          {
            "name": "新产品销量(吨)",
            "prev": 580,
            "curr": 615,
            "unit": "吨"
          },
          {
            "name": "采购降本(万)",
            "prev": 168.91,
            "curr": 678.23,
            "unit": "万"
          }
        ]
      },
      "_dimComparison_d5": {
        "title": "5月风险合规 4月→5月环比",
        "format": "mom",
        "items": [
          {
            "name": "采购及时到货率(%)",
            "prev": 92,
            "curr": 98,
            "unit": "%"
          },
          {
            "name": "客户审核通过(家)",
            "prev": 1,
            "curr": 3,
            "unit": "家"
          }
        ]
      },
      "_dimComparison_d6": {
        "title": "5月组织活力 4月→5月环比",
        "format": "mom",
        "items": [
          {
            "name": "战略协议签订(项)",
            "prev": 0,
            "curr": 3,
            "unit": "项"
          },
          {
            "name": "AI项目立项(项)",
            "prev": 0,
            "curr": 1,
            "unit": "项"
          }
        ]
      }
    },
    "2026-06": {
      "dims": {
        "d1": 52,
        "d2": 38,
        "d3": 60,
        "d4": 80,
        "d5": 100,
        "d6": 60
      },
      "kpis": {
        "d1": [
          52,
          67,
          33,
          100
        ],
        "d2": [
          52,
          67,
          65,
          96
        ],
        "d3": [
          62,
          84,
          59,
          96
        ],
        "d4": [
          116,
          86,
          100,
          54
        ],
        "d5": [
          100,
          100,
          100,
          100
        ],
        "d6": [
          0,
          50,
          50,
          0
        ]
      },
      "_kpiComparison": {
        "title": "6月核心KPI达成率",
        "period": "2026年6月",
        "items": [
          {"name": "销量(吨)", "budget": 7968, "target": 4976, "actual": 4160, "unit": "吨"},
          {"name": "销售收入(万元)", "budget": 17500, "target": 11675, "actual": 9457, "unit": "万元"},
          {"name": "毛利率(%)", "budget": 4.86, "target": 1.60, "actual": 0.96, "unit": "%"},
          {"name": "期间费用(万元)", "budget": 377, "target": 325, "actual": 364, "unit": "万元"},
          {"name": "净利润(万元)", "budget": 459, "target": -122, "actual": -262, "unit": "万元"},
          {"name": "经营现金流(万元)", "budget": 732, "target": 59, "actual": 59, "unit": "万元"},
          {"name": "到期回款率(%)", "budget": 90.0, "target": 90.0, "actual": 95.8, "unit": "%"}
        ]
      },
      "_dimComparison_d2": {
        "title": "6月经营效益",
        "format": "mom",
        "items": [
          {"name": "电解液销量(吨)", "prev": 4800, "curr": 4160, "unit": "吨"},
          {"name": "营业收入(万元)", "prev": 12000, "curr": 9457, "unit": "万元"},
          {"name": "净利润(万元)", "prev": -100, "curr": -262, "unit": "万元"},
          {"name": "回款率(%)", "prev": 96.0, "curr": 95.8, "unit": "%"}
        ]
      },
      "_dimComparison_d3": {
        "title": "6月运营效率",
        "format": "mom",
        "items": [
          {"name": "采购降本率(%)", "prev": 5.0, "curr": 7.39, "unit": "%"},
          {"name": "目标达成率(%)", "prev": 95.0, "curr": 84.0, "unit": "%"},
          {"name": "产能利用率(%)", "prev": 85.0, "curr": 62.0, "unit": "%"},
          {"name": "回款率(%)", "prev": 90.0, "curr": 95.8, "unit": "%"}
        ]
      },
      "_dimComparison_d4": {
        "title": "6月技术创新力",
        "format": "mom",
        "items": [
          {"name": "新产品配方销量(吨)", "prev": 300, "curr": 416.5, "unit": "吨"},
          {"name": "技术交流次数(次)", "prev": 15, "curr": 26, "unit": "次"},
          {"name": "在研项目(项)", "prev": 5, "curr": 6, "unit": "项"},
          {"name": "配方开发数量(批)", "prev": 18, "curr": 54, "unit": "批"}
        ]
      },
      "_dimComparison_d5": {
        "title": "6月风险合规",
        "format": "mom",
        "items": [
          {"name": "安全隐患整改率(%)", "prev": 100, "curr": 100, "unit": "%"},
          {"name": "安全教育完成率(%)", "prev": 100, "curr": 100, "unit": "%"},
          {"name": "排查隐患(起)", "prev": 0, "curr": 0, "unit": "起"},
          {"name": "客户投诉(次)", "prev": 0, "curr": 0, "unit": "次"}
        ]
      },
      "_dimComparison_d6": {
        "title": "6月组织活力",
        "format": "mom",
        "items": [
          {"name": "AI项目立项(项)", "prev": 0, "curr": 0, "unit": "项"},
          {"name": "新客户开发(家)", "prev": 2, "curr": 3, "unit": "家"},
          {"name": "人才引进(人)", "prev": 2, "curr": 3, "unit": "人"},
          {"name": "数字化项目(项)", "prev": 1, "curr": 1, "unit": "项"}
        ]
      }
    },
    "2026-07": {
      "dims": {
        "d1": 52,
        "d2": 52,
        "d3": 60,
        "d4": 85,
        "d5": 95,
        "d6": 50
      },
      "kpis": {
        "d1": [
          52,
          67,
          33,
          100
        ],
        "d2": [
          38,
          52,
          65,
          96
        ],
        "d3": [
          62,
          84,
          59,
          96
        ],
        "d4": [
          116,
          86,
          100,
          54
        ],
        "d5": [
          100,
          100,
          100,
          100
        ],
        "d6": [
          0,
          50,
          50,
          0
        ]
      },
      "_isCurrent": true,
      "_kpiComparison": {
        "title": "7月核心KPI达成率",
        "period": "2026年7月",
        "items": [
          {"name": "销量(吨)", "budget": 5427, "target": 5427, "actual": 5427, "unit": "吨"},
          {"name": "营业收入(亿元)", "budget": 1.18, "target": 1.18, "actual": 1.18, "unit": "亿元"},
          {"name": "毛利率(%)", "budget": 0.2, "target": 0.2, "actual": -1.0, "unit": "%"},
          {"name": "净利润(万元)", "budget": -388, "target": -388, "actual": -388, "unit": "万元"},
          {"name": "到期回款率(%)", "budget": 90.0, "target": 90.0, "actual": 91.0, "unit": "%"}
        ]
      },
      "_dimComparison_d2": {
        "title": "7月经营效益",
        "format": "mom",
        "items": [
          {"name": "电解液销量(吨)", "prev": 4160, "curr": 5427, "unit": "吨"},
          {"name": "均售价(元/吨)", "prev": 22128, "curr": 21742, "unit": "元/吨"},
          {"name": "营业收入(万元)", "prev": 9457, "curr": 11799, "unit": "万元"},
          {"name": "净利润(万元)", "prev": -262, "curr": -388, "unit": "万元"},
          {"name": "采购降本率(%)", "prev": 7.39, "curr": 0.24, "unit": "%"}
        ]
      },
      "_dimComparison_d3": {
        "title": "7月运营效率",
        "format": "mom",
        "items": [
          {"name": "目标达成率(%)", "prev": 84.0, "curr": 94.5, "unit": "%"},
          {"name": "单吨加工成本(元/吨)", "prev": 1778, "curr": 1552, "unit": "元/吨"},
          {"name": "回款率(%)", "prev": 95.8, "curr": 91.0, "unit": "%"}
        ]
      },
      "_dimComparison_d4": {
        "title": "7月技术创新力",
        "format": "mom",
        "items": [
          {"name": "新产品配方销量(吨)", "prev": 416.5, "curr": 416, "unit": "吨"},
          {"name": "技术交流次数(次)", "prev": 26, "curr": 46, "unit": "次"},
          {"name": "在研项目(项)", "prev": 6, "curr": 15, "unit": "项"},
          {"name": "配方开发数量(批)", "prev": 54, "curr": 120, "unit": "批"}
        ]
      },
      "_dimComparison_d5": {
        "title": "7月风险合规",
        "format": "mom",
        "items": [
          {"name": "安全事故(起)", "prev": 0, "curr": 0, "unit": "起"},
          {"name": "安全隐患整改率(%)", "prev": 100, "curr": 100, "unit": "%"},
          {"name": "客户投诉(次)", "prev": 0, "curr": 0, "unit": "次"},
          {"name": "到期回款率(%)", "prev": 95.8, "curr": 91.0, "unit": "%"}
        ]
      },
      "_dimComparison_d6": {
        "title": "7月组织活力",
        "format": "mom",
        "items": [
          {"name": "AI项目立项(项)", "prev": 0, "curr": 0, "unit": "项"},
          {"name": "新客户开发(家)", "prev": 1, "curr": 3, "unit": "家"},
          {"name": "人才引进(人)", "prev": 3, "curr": 3, "unit": "人"},
          {"name": "数字化项目(项)", "prev": 1, "curr": 1, "unit": "项"}
        ]
      }
    },
    "2026-08": {
      "dims": {
        "d1": 35,
        "d2": 88,
        "d3": 90,
        "d4": 90,
        "d5": 60,
        "d6": 70
      },
      "kpis": {
        "d1": [110, 0, 0, 100],
        "d2": [120, 100, 120, 0],
        "d3": [80, 90, 100, 95],
        "d4": [110, 120, 100, 95],
        "d5": [50, 30, 30, 0],
        "d6": [0, 100, 50, 80]
      },
      "_isCurrent": true,
      "_kpiComparison": {
        "title": "8月核心KPI达成率",
        "period": "2026年8月",
        "items": [
          {"name": "销量(吨)", "budget": 33022, "target": 6588, "actual": 7573, "unit": "吨"},
          {"name": "单吨制造加工成本(元/吨)", "budget": 1754, "target": 1319, "actual": 1242, "unit": "元/吨"},
          {"name": "营业收入(亿元)", "budget": 7.67, "target": 1.45, "actual": 1.66, "unit": "亿元"},
          {"name": "毛利率(%)", "budget": -1.00, "target": 0.67, "actual": -0.25, "unit": "%"},
          {"name": "净利润(万元)", "budget": -4330, "target": -224, "actual": -428, "unit": "万元"},
          {"name": "到期回款率(%)", "budget": 79.0, "target": 90.0, "actual": 88.0, "unit": "%"}
        ]
      },
      "_dimComparison_d2": {
        "title": "8月经营效益",
        "format": "mom",
        "items": [
          {"name": "电解液销量(吨)", "prev": 5427, "curr": 7573, "unit": "吨"},
          {"name": "均售价(元/吨)", "prev": 21742, "curr": 21927, "unit": "元/吨"},
          {"name": "营业收入(万元)", "prev": 11799, "curr": 16605, "unit": "万元"},
          {"name": "净利润(万元)", "prev": -388, "curr": -428, "unit": "万元"},
          {"name": "采购降本率(%)", "prev": 0.24, "curr": 12.35, "unit": "%"}
        ]
      },
      "_dimComparison_d3": {
        "title": "8月运营效率",
        "format": "mom",
        "items": [
          {"name": "目标达成率(%)", "prev": 94.5, "curr": 100.0, "unit": "%"},
          {"name": "单吨加工成本(元/吨)", "prev": 1552, "curr": 1242, "unit": "元/吨"},
          {"name": "回款率(%)", "prev": 91.0, "curr": 88.0, "unit": "%"}
        ]
      },
      "_dimComparison_d4": {
        "title": "8月技术创新力",
        "format": "mom",
        "items": [
          {"name": "新产品配方销量(吨)", "prev": 416, "curr": 540, "unit": "吨"},
          {"name": "技术交流次数(次)", "prev": 46, "curr": 60, "unit": "次"},
          {"name": "在研项目(项)", "prev": 15, "curr": 20, "unit": "项"},
          {"name": "配方开发数量(批)", "prev": 120, "curr": 150, "unit": "批"}
        ]
      },
      "_dimComparison_d5": {
        "title": "8月风险合规",
        "format": "mom",
        "items": [
          {"name": "安全事故(起)", "prev": 0, "curr": 1, "unit": "起"},
          {"name": "安全隐患整改率(%)", "prev": 100, "curr": 100, "unit": "%"},
          {"name": "客户投诉(次)", "prev": 0, "curr": 5, "unit": "次"},
          {"name": "到期回款率(%)", "prev": 91.0, "curr": 88.0, "unit": "%"}
        ]
      },
      "_dimComparison_d6": {
        "title": "8月组织活力",
        "format": "mom",
        "items": [
          {"name": "AI项目立项(项)", "prev": 0, "curr": 0, "unit": "项"},
          {"name": "新客户开发(家)", "prev": 3, "curr": 4, "unit": "家"},
          {"name": "人才引进(人)", "prev": 3, "curr": 2, "unit": "人"},
          {"name": "数字化项目(项)", "prev": 1, "curr": 2, "unit": "项"}
        ]
      }
    }
  },
    "2026-08": {
      "dims": {
        "d1": 52,
        "d2": 46,
        "d3": 81,
        "d4": 80,
        "d5": 96,
        "d6": 46
      },
      "kpis": {
        "d1": [115, 0, 0, 84],
        "d2": [115, 100, 115, 0],
        "d3": [115, 100, 60, 100],
        "d4": [100, 206, 60, 60],
        "d5": [100, 100, 100, 76],
        "d6": [0, 50, 50, 50]
      }
    },
  "lhy": {
    "2026-03": {
      "dims": {
        "d1": 100,
        "d2": 100,
        "d3": 100,
        "d4": 100,
        "d5": 100,
        "d6": 100
      },
      "kpis": {
        "d1": [
          100,
          100,
          100,
          100
        ],
        "d2": [
          100,
          100,
          100,
          100
        ],
        "d3": [
          100,
          100,
          100,
          100
        ],
        "d4": [
          100,
          100,
          100,
          100
        ],
        "d5": [
          100,
          100,
          100,
          100
        ],
        "d6": [
          100,
          100,
          100,
          100
        ]
      },
      "_kpiComparison": {
        "title": "3月核心KPI达标率",
        "period": "2026年3月",
        "items": [
          {
            "name": "销售收入(万)",
            "budget": 14758,
            "target": 14758,
            "actual": 14769,
            "unit": "万元"
          },
          {
            "name": "净利润(万)",
            "budget": 1300,
            "target": 1300,
            "actual": 1618,
            "unit": "万元"
          },
          {
            "name": "毛利率(%)",
            "budget": 24.3,
            "target": 24.3,
            "actual": 24.3,
            "unit": "%"
          },
          {
            "name": "期间费用率(%)",
            "budget": 9.79,
            "target": 9.79,
            "actual": 8.5,
            "unit": "%"
          },
          {
            "name": "应收账款天数",
            "budget": 52,
            "target": 52,
            "actual": 51,
            "unit": "天"
          }
        ]
      },
      "_dimComparison_d2": {
        "title": "3月品类销售达成",
        "items": [
          {
            "name": "冷却液(万)",
            "budget": 50000,
            "target": 4167,
            "actual": 10410,
            "unit": "万元"
          },
          {
            "name": "汽机油(万)",
            "budget": 40000,
            "target": 3333,
            "actual": 9650,
            "unit": "万元"
          },
          {
            "name": "柴机油(万)",
            "budget": 15000,
            "target": 1250,
            "actual": 4272,
            "unit": "万元"
          },
          {
            "name": "变速箱油(万)",
            "budget": 6000,
            "target": 500,
            "actual": 1080,
            "unit": "万元"
          }
        ]
      },
      "_dimComparison_d3": {
        "title": "3月运营效率指标",
        "items": [
          {
            "name": "海外市场(万)",
            "budget": 10000,
            "target": 833,
            "actual": 2045,
            "unit": "万元"
          },
          {
            "name": "工业油(万)",
            "budget": 5000,
            "target": 417,
            "actual": 67,
            "unit": "万元"
          },
          {
            "name": "玻璃水(万)",
            "budget": 7000,
            "target": 583,
            "actual": 380,
            "unit": "万元"
          },
          {
            "name": "应收账款天数",
            "budget": 52,
            "target": 52,
            "actual": 51,
            "unit": "天"
          }
        ]
      }
    },
    "2026-04": {
      "dims": {
        "d1": 96,
        "d2": 100,
        "d3": 100,
        "d4": 94,
        "d5": 75,
        "d6": 100
      },
      "kpis": {
        "d1": [
          100,
          90,
          94,
          100
        ],
        "d2": [
          100,
          100,
          100,
          100
        ],
        "d3": [
          100,
          100,
          100,
          100
        ],
        "d4": [
          100,
          100,
          100,
          75
        ],
        "d5": [
          100,
          100,
          100,
          0
        ],
        "d6": [
          100,
          100,
          100,
          100
        ]
      },
      "_kpiComparison": {
        "title": "4月核心KPI达标率",
        "period": "2026年4月",
        "items": [
          {
            "name": "销售收入(万)",
            "budget": 8530,
            "target": 8530,
            "actual": 11881,
            "unit": "万元"
          },
          {
            "name": "净利润(万)",
            "budget": 1125,
            "target": 1125,
            "actual": 1007,
            "unit": "万元"
          },
          {
            "name": "毛利率(%)",
            "budget": 24.3,
            "target": 24.3,
            "actual": 22.8,
            "unit": "%"
          },
          {
            "name": "期间费用率(%)",
            "budget": 13.67,
            "target": 13.67,
            "actual": 12,
            "unit": "%"
          },
          {
            "name": "应收账款天数",
            "budget": 52,
            "target": 52,
            "actual": 51,
            "unit": "天"
          }
        ]
      },
      "_dimComparison_d2": {
        "title": "4月品类销售达成",
        "items": [
          {
            "name": "冷却液(万)",
            "budget": 50000,
            "target": 4167,
            "actual": 14431,
            "unit": "万元"
          },
          {
            "name": "汽机油(万)",
            "budget": 40000,
            "target": 3333,
            "actual": 14854,
            "unit": "万元"
          },
          {
            "name": "柴机油(万)",
            "budget": 15000,
            "target": 1250,
            "actual": 5902,
            "unit": "万元"
          },
          {
            "name": "变速箱油(万)",
            "budget": 6000,
            "target": 500,
            "actual": 1630,
            "unit": "万元"
          }
        ]
      },
      "_dimComparison_d3": {
        "title": "4月运营效率指标",
        "items": [
          {
            "name": "海外市场(万)",
            "budget": 10000,
            "target": 833,
            "actual": 2613,
            "unit": "万元"
          },
          {
            "name": "工业油(万)",
            "budget": 5000,
            "target": 417,
            "actual": 67,
            "unit": "万元"
          },
          {
            "name": "玻璃水(万)",
            "budget": 7000,
            "target": 583,
            "actual": 585,
            "unit": "万元"
          },
          {
            "name": "应收账款天数",
            "budget": 52,
            "target": 52,
            "actual": 51,
            "unit": "天"
          }
        ]
      }
    },
    "2026-05": {
      "dims": {
        "d1": 98,
        "d2": 98,
        "d3": 83,
        "d4": 85,
        "d5": 80,
        "d6": 65
      },
      "kpis": {
        "d1": [
          10,
          9.79,
          9.3,
          10
        ],
        "d2": [
          10,
          9.79,
          9.3,
          10
        ],
        "d3": [
          10,
          3.19,
          10,
          10
        ],
        "d4": [
          10,
          10,
          8,
          6
        ],
        "d5": [
          10,
          10,
          7,
          5
        ],
        "d6": [
          8,
          5,
          7,
          6
        ]
      },
      "_isCurrent": true,
      "_kpiComparison": {
        "title": "5月核心KPI达标率",
        "period": "2026年5月",
        "items": [
          {
            "name": "销售收入(万)",
            "budget": 10865,
            "target": 10865,
            "actual": 11123,
            "unit": "万元"
          },
          {
            "name": "净利润(万)",
            "budget": 1109,
            "target": 1109,
            "actual": 1086,
            "unit": "万元"
          },
          {
            "name": "毛利率(%)",
            "budget": 24.3,
            "target": 24.3,
            "actual": 22.6,
            "unit": "%"
          },
          {
            "name": "期间费用率(%)",
            "budget": 11.08,
            "target": 11.08,
            "actual": 9.8,
            "unit": "%"
          },
          {
            "name": "应收账款天数",
            "budget": 52,
            "target": 52,
            "actual": 50,
            "unit": "天"
          }
        ]
      },
      "_dimComparison_d2": {
        "title": "5月品类销售达成",
        "items": [
          {
            "name": "冷却液(万)",
            "budget": 50000,
            "target": 4167,
            "actual": 19591,
            "unit": "万元"
          },
          {
            "name": "汽机油(万)",
            "budget": 40000,
            "target": 3333,
            "actual": 17816,
            "unit": "万元"
          },
          {
            "name": "柴机油(万)",
            "budget": 15000,
            "target": 1250,
            "actual": 6527,
            "unit": "万元"
          },
          {
            "name": "变速箱油(万)",
            "budget": 6000,
            "target": 500,
            "actual": 1994,
            "unit": "万元"
          }
        ]
      },
      "_dimComparison_d3": {
        "title": "5月运营效率指标",
        "items": [
          {
            "name": "海外市场(万)",
            "budget": 10000,
            "target": 833,
            "actual": 4015,
            "unit": "万元"
          },
          {
            "name": "工业油(万)",
            "budget": 5000,
            "target": 417,
            "actual": 133,
            "unit": "万元"
          },
          {
            "name": "玻璃水(万)",
            "budget": 7000,
            "target": 583,
            "actual": 788,
            "unit": "万元"
          },
          {
            "name": "应收账款天数",
            "budget": 52,
            "target": 52,
            "actual": 50,
            "unit": "天"
          }
        ]
      },
      "_dimComparison_d4": {
        "title": "5月技术创新力 4月→5月环比",
        "format": "mom",
        "items": [
          {
            "name": "新产品销量(吨)",
            "prev": 580,
            "curr": 615,
            "unit": "吨"
          },
          {
            "name": "采购降本(万)",
            "prev": 168.91,
            "curr": 678.23,
            "unit": "万元"
          },
          {
            "name": "技术服务项目(个)",
            "prev": 0,
            "curr": 4,
            "unit": "个"
          },
          {
            "name": "OEM认证(项)",
            "prev": 0,
            "curr": 1,
            "unit": "项"
          }
        ]
      },
      "_dimComparison_d5": {
        "title": "5月风险合规 4月→5月环比",
        "format": "mom",
        "items": [
          {
            "name": "采购及时到货率(%)",
            "prev": 92,
            "curr": 98,
            "unit": "%"
          },
          {
            "name": "客户审核通过(家)",
            "prev": 1,
            "curr": 3,
            "unit": "家"
          },
          {
            "name": "质量体系认证推进",
            "prev": 0,
            "curr": 1,
            "unit": "项"
          },
          {
            "name": "供应商渠道问题(个)",
            "prev": 0,
            "curr": 1,
            "unit": "个"
          }
        ]
      },
      "_dimComparison_d6": {
        "title": "5月组织活力 4月→5月环比",
        "format": "mom",
        "items": [
          {
            "name": "新客户开发(家)",
            "prev": 0,
            "curr": 10,
            "unit": "家"
          },
          {
            "name": "AI项目立项(项)",
            "prev": 0,
            "curr": 0,
            "unit": "项"
          },
          {
            "name": "海外客户开发(家)",
            "prev": 0,
            "curr": 2,
            "unit": "家"
          },
          {
            "name": "数字化项目(个)",
            "prev": 0,
            "curr": 1,
            "unit": "个"
          }
        ]
      }
    },
    "2026-06": {
      "dims": {
        "d1": 81,
        "d2": 100,
        "d3": 92,
        "d4": 90,
        "d5": 100,
        "d6": 85
      },
      "kpis": {
        "d1": [
          80.3,
          59.3,
          95.8,
          90
        ],
        "d2": [
          100,
          100,
          100,
          100
        ],
        "d3": [
          100,
          100,
          100,
          80
        ],
        "d4": [
          120,
          120,
          120,
          90
        ],
        "d5": [
          100,
          100,
          100,
          100
        ],
        "d6": [
          100,
          100,
          120,
          120
        ]
      },
      "_isCurrent": true,
      "_kpiComparison": {
        "title": "6月核心KPI达标率",
        "period": "2026年6月",
        "items": [
          {
            "name": "销售收入(万)",
            "budget": 12452,
            "target": 12452,
            "actual": 10000,
            "unit": "万元"
          },
          {
            "name": "净利润(万)",
            "budget": 1418,
            "target": 1418,
            "actual": 841,
            "unit": "万元"
          },
          {
            "name": "毛利率(%)",
            "budget": 24.3,
            "target": 24.3,
            "actual": 23.29,
            "unit": "%"
          },
          {
            "name": "期间费用率(%)",
            "budget": 10.11,
            "target": 10.11,
            "actual": 11.24,
            "unit": "%"
          },
          {
            "name": "应收账款天数",
            "budget": 52,
            "target": 52,
            "actual": 49,
            "unit": "天"
          }
        ]
      },
      "_dimComparison_d2": {
        "title": "6月品类销售达成",
        "items": [
          {
            "name": "冷却液(万)",
            "budget": 50000,
            "target": 4167,
            "actual": 25820,
            "unit": "万元"
          },
          {
            "name": "汽机油(万)",
            "budget": 40000,
            "target": 3333,
            "actual": 19680,
            "unit": "万元"
          },
          {
            "name": "柴机油(万)",
            "budget": 15000,
            "target": 1250,
            "actual": 7119,
            "unit": "万元"
          },
          {
            "name": "变速箱油(万)",
            "budget": 6000,
            "target": 500,
            "actual": 2325,
            "unit": "万元"
          }
        ]
      },
      "_dimComparison_d3": {
        "title": "6月运营效率指标",
        "items": [
          {
            "name": "海外市场(万)",
            "budget": 10000,
            "target": 833,
            "actual": 4597,
            "unit": "万元"
          },
          {
            "name": "工业油(万)",
            "budget": 5000,
            "target": 417,
            "actual": 163,
            "unit": "万元"
          },
          {
            "name": "玻璃水(万)",
            "budget": 7000,
            "target": 583,
            "actual": 970,
            "unit": "万元"
          },
          {
            "name": "应收账款天数",
            "budget": 52,
            "target": 52,
            "actual": 49,
            "unit": "天"
          }
        ]
      },
      "_dimComparison_d4": {
        "title": "6月技术创新力 5月→6月环比",
        "format": "mom",
        "items": [
          {
            "name": "新产品下线(款)",
            "prev": 3,
            "curr": 7,
            "unit": "款"
          },
          {
            "name": "客户审核通过(家)",
            "prev": 3,
            "curr": 6,
            "unit": "家"
          },
          {
            "name": "品牌内容发布(篇)",
            "prev": 15,
            "curr": 24,
            "unit": "篇"
          },
          {
            "name": "华为中试进展",
            "prev": 0,
            "curr": 90,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d5": {
        "title": "6月风险合规 5月→6月环比",
        "format": "mom",
        "items": [
          {
            "name": "安全事故(起)",
            "prev": 0,
            "curr": 0,
            "unit": "起"
          },
          {
            "name": "诉讼案件(件)",
            "prev": 0,
            "curr": 0,
            "unit": "件"
          },
          {
            "name": "零碳工厂认证",
            "prev": 0,
            "curr": 100,
            "unit": "%"
          },
          {
            "name": "安全月活动完成率(%)",
            "prev": 0,
            "curr": 300,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d6": {
        "title": "6月组织活力 5月→6月环比",
        "format": "mom",
        "items": [
          {
            "name": "AI智能体项目(项)",
            "prev": 0,
            "curr": 1,
            "unit": "项"
          },
          {
            "name": "新客户导入(家)",
            "prev": 2,
            "curr": 3,
            "unit": "家"
          },
          {
            "name": "海外市场拓展(国)",
            "prev": 3,
            "curr": 5,
            "unit": "国"
          },
          {
            "name": "数字化项目(项)",
            "prev": 2,
            "curr": 3,
            "unit": "项"
          }
        ]
      }
    },
    "2026-07": {
      "dims": {
        "d1": 92,
        "d2": 88,
        "d3": 90,
        "d4": 68,
        "d5": 83,
        "d6": 82
      },
      "kpis": null
    },
    "2026-08": {
      "dims": {
        "d1": 64,
        "d2": 62,
        "d3": 78,
        "d4": 78,
        "d5": 88,
        "d6": 80
      },
      "kpis": {
        "d1": [
          90,
          26,
          73,
          88
        ],
        "d2": [
          62,
          60,
          65,
          70
        ],
        "d3": [
          80,
          92,
          85,
          82
        ],
        "d4": [
          78,
          80,
          75,
          78
        ],
        "d5": [
          85,
          88,
          90,
          92
        ],
        "d6": [
          80,
          82,
          78,
          80
        ]
      },
      "_kpiComparison": {
        "title": "8月核心KPI达标率",
        "period": "2026年8月",
        "items": [
          {
            "name": "产量(T)",
            "budget": 17188,
            "target": 17188,
            "actual": 12113,
            "unit": "T"
          },
          {
            "name": "营业收入(万)",
            "budget": 10340,
            "target": 10340,
            "actual": 9265,
            "unit": "万元"
          },
          {
            "name": "净利润(万)",
            "budget": 886,
            "target": 886,
            "actual": 225,
            "unit": "万元"
          },
          {
            "name": "毛利率(%)",
            "budget": 24.3,
            "target": 24.3,
            "actual": 17.81,
            "unit": "%"
          },
          {
            "name": "资产负债率(%)",
            "budget": 60,
            "target": 60,
            "actual": 57,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d2": {
        "title": "8月品类销售达成（YTD截止8/29）",
        "items": [
          {
            "name": "冷却液(万)",
            "budget": 50000,
            "target": 50000,
            "actual": 34423,
            "unit": "万元"
          },
          {
            "name": "汽机油(万)",
            "budget": 40000,
            "target": 40000,
            "actual": 25760,
            "unit": "万元"
          },
          {
            "name": "柴机油(万)",
            "budget": 15000,
            "target": 15000,
            "actual": 8608,
            "unit": "万元"
          },
          {
            "name": "变速箱油(万)",
            "budget": 6000,
            "target": 6000,
            "actual": 3047,
            "unit": "万元"
          },
          {
            "name": "工业油(万)",
            "budget": 5000,
            "target": 5000,
            "actual": 264,
            "unit": "万元"
          },
          {
            "name": "玻璃水(万)",
            "budget": 7000,
            "target": 7000,
            "actual": 1283,
            "unit": "万元"
          },
          {
            "name": "海外市场(万)",
            "budget": 10000,
            "target": 10000,
            "actual": 8561,
            "unit": "万元"
          }
        ]
      },
      "_dimComparison_d3": {
        "title": "8月运营效率指标",
        "items": [
          {
            "name": "单吨生产成本(元)",
            "budget": 4051,
            "target": 4051,
            "actual": 5068,
            "unit": "元"
          },
          {
            "name": "到期应收回收率(%)",
            "budget": 90,
            "target": 90,
            "actual": 92,
            "unit": "%"
          },
          {
            "name": "应收账款天数",
            "budget": 52,
            "target": 52,
            "actual": 51,
            "unit": "天"
          },
          {
            "name": "海外市场YTD(万)",
            "budget": 10000,
            "target": 10000,
            "actual": 8561,
            "unit": "万元"
          }
        ]
      },
      "_dimComparison_d4": {
        "title": "8月技术创新（研发项目）",
        "items": [
          {
            "name": "四代低导LC420推进",
            "value": 75,
            "unit": "%"
          },
          {
            "name": "数据中心冷却液D4092",
            "value": 70,
            "unit": "%"
          },
          {
            "name": "浸没式冷却油D4016",
            "value": 70,
            "unit": "%"
          },
          {
            "name": "新能源润滑脂系列",
            "value": 68,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d5": {
        "title": "8月风险合规",
        "items": [
          {
            "name": "ISO三体系再认证",
            "value": 100,
            "unit": "%"
          },
          {
            "name": "GHS/PPWR合规",
            "value": 85,
            "unit": "%"
          },
          {
            "name": "零安全事故",
            "value": 100,
            "unit": "%"
          },
          {
            "name": "到期应收回收率",
            "value": 92,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d6": {
        "title": "8月组织活力",
        "items": [
          {
            "name": "海外展会高价值线索",
            "value": 3,
            "unit": "个"
          },
          {
            "name": "GEO知识库AI引用",
            "value": 1403,
            "unit": "次"
          },
          {
            "name": "电商绿瓜新品",
            "value": 6,
            "unit": "款"
          },
          {
            "name": "校招启动",
            "value": 1,
            "unit": "项"
          }
        ]
      }
    }
  },
  "sjld": {
    "2026-03": {
      "dims": {
        "d1": 85,
        "d2": 1,
        "d3": 15,
        "d4": 56,
        "d5": 1,
        "d6": 32
      },
      "kpis": {
        "d1": [
          54,
          100,
          86,
          100
        ],
        "d2": [
          54,
          100,
          40,
          100
        ],
        "d3": [
          87,
          100,
          32,
          94
        ],
        "d4": [
          80,
          100,
          100,
          93
        ],
        "d5": [
          93,
          100,
          100,
          67
        ],
        "d6": [
          100,
          100,
          100,
          75
        ]
      },
      "_kpiComparison": {
        "title": "3月核心KPI达成率",
        "period": "2026年3月",
        "items": [
          {
            "name": "净利润达成率",
            "budget": 85,
            "target": 85,
            "actual": 85,
            "unit": "%"
          },
          {
            "name": "管理费用控制率",
            "budget": 85,
            "target": 85,
            "actual": 85,
            "unit": "%"
          },
          {
            "name": "主材降本达成率",
            "budget": 85,
            "target": 85,
            "actual": 85,
            "unit": "%"
          },
          {
            "name": "回款率",
            "budget": 85,
            "target": 85,
            "actual": 85,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d1": {
        "title": "3月核心KPI",
        "items": [
          {
            "name": "净利润达成率",
            "value": "85",
            "unit": "%"
          },
          {
            "name": "管理费用控制率",
            "value": "85",
            "unit": "%"
          },
          {
            "name": "主材降本达成率",
            "value": "85",
            "unit": "%"
          },
          {
            "name": "回款率",
            "value": "85",
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d2": {
        "title": "3月基建进度",
        "items": [
          {
            "name": "竣工验收进度",
            "value": "1",
            "unit": "%"
          },
          {
            "name": "正常化项目",
            "value": "1",
            "unit": "项"
          },
          {
            "name": "机电板块进度",
            "value": "1",
            "unit": "%"
          },
          {
            "name": "土建板块进度",
            "value": "1",
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d3": {
        "title": "3月运营准备",
        "items": [
          {
            "name": "元明粉出售",
            "value": "15",
            "unit": "万"
          },
          {
            "name": "正常化施工",
            "value": "15",
            "unit": "%"
          },
          {
            "name": "代工客户洽谈",
            "value": "15",
            "unit": "家"
          },
          {
            "name": "成本测算",
            "value": "15",
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d4": {
        "title": "3月客户开发与技术",
        "items": [
          {
            "name": "Ni93样品交付",
            "value": "56",
            "unit": "批"
          },
          {
            "name": "BTR客户推进",
            "value": "56",
            "unit": "家"
          },
          {
            "name": "GEM代工洽谈",
            "value": "56",
            "unit": "家"
          },
          {
            "name": "LGES客户开发",
            "value": "56",
            "unit": "家"
          }
        ]
      },
      "_dimComparison_d5": {
        "title": "3月竣工验收与合规",
        "items": [
          {
            "name": "竣工验收达成",
            "value": "1",
            "unit": "%"
          },
          {
            "name": "专项报告编制",
            "value": "1",
            "unit": "份"
          },
          {
            "name": "EHS合规整改",
            "value": "1",
            "unit": "项"
          },
          {
            "name": "三体系审核",
            "value": "1",
            "unit": "项"
          }
        ]
      },
      "_dimComparison_d6": {
        "title": "3月组织活力",
        "items": [
          {
            "name": "人员稳定性",
            "value": "32",
            "unit": "%"
          },
          {
            "name": "跨组织支援",
            "value": "32",
            "unit": "人次"
          },
          {
            "name": "数字化项目",
            "value": "32",
            "unit": "项"
          },
          {
            "name": "AI创新项目",
            "value": "32",
            "unit": "项"
          }
        ]
      }
    },
    "2026-04": {
      "dims": {
        "d1": 80,
        "d2": 14,
        "d3": 48,
        "d4": 56,
        "d5": 40,
        "d6": 55
      },
      "kpis": {
        "d1": [
          62,
          100,
          88,
          50
        ],
        "d2": [
          75,
          99,
          88,
          57
        ],
        "d3": [
          99,
          72,
          95,
          62
        ],
        "d4": [
          55,
          50,
          60,
          54
        ],
        "d5": [
          100,
          100,
          100,
          95
        ],
        "d6": [
          65,
          75,
          60,
          70
        ]
      },
      "_kpiComparison": {
        "title": "4月核心KPI达成率",
        "period": "2026年4月",
        "items": [
          {
            "name": "净利润达成率",
            "budget": 80,
            "target": 80,
            "actual": 80,
            "unit": "%"
          },
          {
            "name": "管理费用控制率",
            "budget": 80,
            "target": 80,
            "actual": 80,
            "unit": "%"
          },
          {
            "name": "主材降本达成率",
            "budget": 80,
            "target": 80,
            "actual": 80,
            "unit": "%"
          },
          {
            "name": "回款率",
            "budget": 80,
            "target": 80,
            "actual": 80,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d1": {
        "title": "4月核心KPI",
        "items": [
          {
            "name": "净利润达成率",
            "value": "80",
            "unit": "%"
          },
          {
            "name": "管理费用控制率",
            "value": "80",
            "unit": "%"
          },
          {
            "name": "主材降本达成率",
            "value": "80",
            "unit": "%"
          },
          {
            "name": "回款率",
            "value": "80",
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d2": {
        "title": "4月基建进度",
        "items": [
          {
            "name": "竣工验收进度",
            "value": "14",
            "unit": "%"
          },
          {
            "name": "正常化项目",
            "value": "14",
            "unit": "项"
          },
          {
            "name": "机电板块进度",
            "value": "14",
            "unit": "%"
          },
          {
            "name": "土建板块进度",
            "value": "14",
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d3": {
        "title": "4月运营准备",
        "items": [
          {
            "name": "元明粉出售",
            "value": "48",
            "unit": "万"
          },
          {
            "name": "正常化施工",
            "value": "48",
            "unit": "%"
          },
          {
            "name": "代工客户洽谈",
            "value": "48",
            "unit": "家"
          },
          {
            "name": "成本测算",
            "value": "48",
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d4": {
        "title": "4月客户开发与技术",
        "items": [
          {
            "name": "Ni93样品交付",
            "value": "56",
            "unit": "批"
          },
          {
            "name": "BTR客户推进",
            "value": "56",
            "unit": "家"
          },
          {
            "name": "GEM代工洽谈",
            "value": "56",
            "unit": "家"
          },
          {
            "name": "LGES客户开发",
            "value": "56",
            "unit": "家"
          }
        ]
      },
      "_dimComparison_d5": {
        "title": "4月竣工验收与合规",
        "items": [
          {
            "name": "竣工验收达成",
            "value": "40",
            "unit": "%"
          },
          {
            "name": "专项报告编制",
            "value": "40",
            "unit": "份"
          },
          {
            "name": "EHS合规整改",
            "value": "40",
            "unit": "项"
          },
          {
            "name": "三体系审核",
            "value": "40",
            "unit": "项"
          }
        ]
      },
      "_dimComparison_d6": {
        "title": "4月组织活力",
        "items": [
          {
            "name": "人员稳定性",
            "value": "55",
            "unit": "%"
          },
          {
            "name": "跨组织支援",
            "value": "55",
            "unit": "人次"
          },
          {
            "name": "数字化项目",
            "value": "55",
            "unit": "项"
          },
          {
            "name": "AI创新项目",
            "value": "55",
            "unit": "项"
          }
        ]
      }
    },
    "2026-05": {
      "dims": {
        "d1": 95,
        "d2": 46,
        "d3": 61,
        "d4": 70,
        "d5": 57,
        "d6": 48
      },
      "kpis": {
        "d1": [
          95,
          95,
          95,
          95
        ],
        "d2": [
          46,
          46,
          46,
          46
        ],
        "d3": [
          61,
          61,
          61,
          61
        ],
        "d4": [
          70,
          70,
          70,
          70
        ],
        "d5": [
          57,
          57,
          57,
          57
        ],
        "d6": [
          48,
          48,
          48,
          48
        ]
      },
      "_kpiComparison": {
        "title": "5月核心KPI达成率",
        "period": "2026年5月",
        "items": [
          {
            "name": "净利润达成率",
            "budget": 95,
            "target": 95,
            "actual": 95,
            "unit": "%"
          },
          {
            "name": "管理费用控制率",
            "budget": 95,
            "target": 95,
            "actual": 95,
            "unit": "%"
          },
          {
            "name": "主材降本达成率",
            "budget": 95,
            "target": 95,
            "actual": 95,
            "unit": "%"
          },
          {
            "name": "回款率",
            "budget": 95,
            "target": 95,
            "actual": 95,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d1": {
        "title": "5月核心KPI",
        "items": [
          {
            "name": "净利润达成率",
            "value": "95",
            "unit": "%"
          },
          {
            "name": "管理费用控制率",
            "value": "95",
            "unit": "%"
          },
          {
            "name": "主材降本达成率",
            "value": "95",
            "unit": "%"
          },
          {
            "name": "回款率",
            "value": "95",
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d2": {
        "title": "5月基建进度",
        "items": [
          {
            "name": "竣工验收进度",
            "value": "46",
            "unit": "%"
          },
          {
            "name": "正常化项目",
            "value": "46",
            "unit": "项"
          },
          {
            "name": "机电板块进度",
            "value": "46",
            "unit": "%"
          },
          {
            "name": "土建板块进度",
            "value": "46",
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d3": {
        "title": "5月运营准备",
        "items": [
          {
            "name": "元明粉出售",
            "value": "61",
            "unit": "万"
          },
          {
            "name": "正常化施工",
            "value": "61",
            "unit": "%"
          },
          {
            "name": "代工客户洽谈",
            "value": "61",
            "unit": "家"
          },
          {
            "name": "成本测算",
            "value": "61",
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d4": {
        "title": "5月客户开发与技术",
        "items": [
          {
            "name": "Ni93样品交付",
            "value": "70",
            "unit": "批"
          },
          {
            "name": "BTR客户推进",
            "value": "70",
            "unit": "家"
          },
          {
            "name": "GEM代工洽谈",
            "value": "70",
            "unit": "家"
          },
          {
            "name": "LGES客户开发",
            "value": "70",
            "unit": "家"
          }
        ]
      },
      "_dimComparison_d5": {
        "title": "5月竣工验收与合规",
        "items": [
          {
            "name": "竣工验收达成",
            "value": "57",
            "unit": "%"
          },
          {
            "name": "专项报告编制",
            "value": "57",
            "unit": "份"
          },
          {
            "name": "EHS合规整改",
            "value": "57",
            "unit": "项"
          },
          {
            "name": "三体系审核",
            "value": "57",
            "unit": "项"
          }
        ]
      },
      "_dimComparison_d6": {
        "title": "5月组织活力",
        "items": [
          {
            "name": "人员稳定性",
            "value": "48",
            "unit": "%"
          },
          {
            "name": "跨组织支援",
            "value": "48",
            "unit": "人次"
          },
          {
            "name": "数字化项目",
            "value": "48",
            "unit": "项"
          },
          {
            "name": "AI创新项目",
            "value": "48",
            "unit": "项"
          }
        ]
      },
      "_isCurrent": true
    },
    "2026-06": {
      "dims": {
        "d1": 58,
        "d2": 45,
        "d3": 52,
        "d4": 72,
        "d5": 55,
        "d6": 52
      },
      "kpis": {
        "d1": [
          89,
          76,
          60,
          100
        ],
        "d2": [
          70,
          50,
          45,
          10
        ],
        "d3": [
          65,
          50,
          50,
          55
        ],
        "d4": [
          85,
          80,
          50,
          30
        ],
        "d5": [
          70,
          50,
          95,
          30
        ],
        "d6": [
          55,
          55,
          65,
          40
        ]
      },
      "_isCurrent": true,
      "_kpiComparison": {
        "title": "6月核心KPI达成率",
        "period": "2026年6月",
        "items": [
          {
            "name": "净利润(万元)",
            "budget": -518,
            "target": -518,
            "actual": -575,
            "unit": "万元"
          },
          {
            "name": "竣工验收进度(项)",
            "budget": 30,
            "target": 30,
            "actual": 21,
            "unit": "项"
          },
          {
            "name": "销售回款率(%)",
            "budget": 100,
            "target": 100,
            "actual": 100,
            "unit": "%"
          },
          {
            "name": "代加工业务(项)",
            "budget": 2,
            "target": 2,
            "actual": 1,
            "unit": "项"
          },
          {
            "name": "管理费用(万元)",
            "budget": 138,
            "target": 138,
            "actual": 182,
            "unit": "万元"
          },
          {
            "name": "正常化项目(项)",
            "budget": 2,
            "target": 2,
            "actual": 1,
            "unit": "项"
          }
        ]
      },
      "_dimComparison_d2": {
        "title": "6月基建进度",
        "items": [
          {
            "name": "竣工验收进度(%)",
            "value": 70,
            "unit": "%"
          },
          {
            "name": "正常化项目(项)",
            "value": 1,
            "unit": "项"
          },
          {
            "name": "机电板块进度(%)",
            "value": 45,
            "unit": "%"
          },
          {
            "name": "土建板块进度(%)",
            "value": 10,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d3": {
        "title": "6月运营准备",
        "items": [
          {
            "name": "前驱体发货(吨)",
            "value": 84,
            "unit": "吨"
          },
          {
            "name": "不良品出售毛利(万元)",
            "value": 278,
            "unit": "万元"
          },
          {
            "name": "代加工达成(项)",
            "value": 1,
            "unit": "项"
          },
          {
            "name": "采购降本洽谈(项)",
            "value": 2,
            "unit": "项"
          }
        ]
      },
      "_dimComparison_d4": {
        "title": "6月客户开发与技术",
        "format": "mom",
        "items": [
          {
            "name": "Ni93样品交付(kg)",
            "prev": 10,
            "curr": 30,
            "unit": "kg"
          },
          {
            "name": "Ni95样品交付(kg)",
            "prev": 20,
            "curr": 50,
            "unit": "kg"
          },
          {
            "name": "BTR客户推进(阶段)",
            "prev": 2,
            "curr": 3,
            "unit": "阶段"
          },
          {
            "name": "代工洽谈(家)",
            "prev": 1,
            "curr": 1,
            "unit": "家"
          }
        ]
      },
      "_dimComparison_d5": {
        "title": "6月竣工验收与合规",
        "items": [
          {
            "name": "竣工验收达成率(%)",
            "value": 70,
            "unit": "%"
          },
          {
            "name": "专项报告编制(份)",
            "value": 4,
            "unit": "份"
          },
          {
            "name": "EHS隐患整改率(%)",
            "value": 95,
            "unit": "%"
          },
          {
            "name": "工贸定性进展",
            "value": 40,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d6": {
        "title": "6月组织活力",
        "items": [
          {
            "name": "关键岗位到岗率(%)",
            "value": 80,
            "unit": "%"
          },
          {
            "name": "跨组织支援(人次)",
            "value": 5,
            "unit": "人次"
          },
          {
            "name": "SAP系统上线(%)",
            "value": 60,
            "unit": "%"
          },
          {
            "name": "AI创新项目(项)",
            "value": 0,
            "unit": "项"
          }
        ]
      }
    },
    "2026-07": {
      "dims": {
        "d1": 65,
        "d2": 46,
        "d3": 23,
        "d4": 28,
        "d5": 75,
        "d6": 45
      },
      "kpis": {
        "d1": [
          81,
          0,
          80,
          100
        ],
        "d2": [
          80,
          45,
          35,
          25
        ],
        "d3": [
          0,
          100,
          50,
          40
        ],
        "d4": [
          0,
          0,
          60,
          50
        ],
        "d5": [
          100,
          100,
          99,
          0
        ],
        "d6": [
          80,
          40,
          60,
          0
        ]
      },
      "_kpiComparison": {
        "title": "7月核心KPI达成率",
        "period": "2026年7月",
        "items": [
          {
            "name": "产量(T)",
            "budget": 267,
            "target": 267,
            "actual": 0,
            "unit": "T"
          },
          {
            "name": "营业收入(万元)",
            "budget": 2654,
            "target": 2654,
            "actual": 0,
            "unit": "万元"
          },
          {
            "name": "净利润(万元)",
            "budget": -628,
            "target": -628,
            "actual": -507,
            "unit": "万元"
          },
          {
            "name": "毛利率(%)",
            "budget": -6,
            "target": -6,
            "actual": -14,
            "unit": "%"
          },
          {
            "name": "资产负债率(%)",
            "budget": 91,
            "target": 91,
            "actual": 73,
            "unit": "%"
          },
          {
            "name": "主料降本率-镍(%)",
            "budget": 5,
            "target": 5,
            "actual": 4,
            "unit": "%"
          },
          {
            "name": "主料降本率-钴(%)",
            "budget": 5,
            "target": 5,
            "actual": 12.6,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d1": {
        "title": "7月核心KPI",
        "items": [
          {
            "name": "产量达成率(%)",
            "value": "0",
            "unit": "%"
          },
          {
            "name": "营收达成率(%)",
            "value": "0",
            "unit": "%"
          },
          {
            "name": "净利润达成率(%)",
            "value": "81",
            "unit": "%"
          },
          {
            "name": "资产负债率(%)",
            "value": "73",
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d2": {
        "title": "7月基建进度",
        "items": [
          {
            "name": "竣工验收进度(%)",
            "value": 80,
            "unit": "%"
          },
          {
            "name": "正常化项目(项)",
            "value": 1,
            "unit": "项"
          },
          {
            "name": "机电板块进度(%)",
            "value": 45,
            "unit": "%"
          },
          {
            "name": "土建板块进度(%)",
            "value": 10,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d3": {
        "title": "7月运营准备",
        "items": [
          {
            "name": "前驱体发货(吨)",
            "value": 0,
            "unit": "吨"
          },
          {
            "name": "有毒气体排放(起)",
            "value": 0,
            "unit": "起"
          },
          {
            "name": "代加工达成(项)",
            "value": 1,
            "unit": "项"
          },
          {
            "name": "采购降本洽谈(项)",
            "value": 2,
            "unit": "项"
          }
        ]
      },
      "_dimComparison_d4": {
        "title": "7月客户开发与技术",
        "format": "mom",
        "items": [
          {
            "name": "Ni93样品交付(kg)",
            "prev": 30,
            "curr": 0,
            "unit": "kg"
          },
          {
            "name": "Ni95样品交付(kg)",
            "prev": 50,
            "curr": 0,
            "unit": "kg"
          },
          {
            "name": "BTR客户推进(阶段)",
            "prev": 3,
            "curr": 3,
            "unit": "阶段"
          },
          {
            "name": "代工洽谈(家)",
            "prev": 1,
            "curr": 1,
            "unit": "家"
          }
        ]
      },
      "_dimComparison_d5": {
        "title": "7月竣工验收与合规",
        "items": [
          {
            "name": "安全事故(起)",
            "value": 0,
            "unit": "起"
          },
          {
            "name": "环保违规(项)",
            "value": 0,
            "unit": "项"
          },
          {
            "name": "隐患整改率(%)",
            "value": 99.2,
            "unit": "%"
          },
          {
            "name": "新增诉讼(起)",
            "value": 1,
            "unit": "起"
          }
        ]
      },
      "_dimComparison_d6": {
        "title": "7月组织活力",
        "items": [
          {
            "name": "关键岗位到岗率(%)",
            "value": 80,
            "unit": "%"
          },
          {
            "name": "跨组织支援(人次)",
            "value": 1,
            "unit": "人次"
          },
          {
            "name": "SAP系统上线(%)",
            "value": 60,
            "unit": "%"
          },
          {
            "name": "AI创新项目(项)",
            "value": 0,
            "unit": "项"
          }
        ]
      },
      "_isCurrent": true
    },
    "2026-08": {
      "dims": {
        "d1": 62,
        "d2": 75,
        "d3": 80,
        "d4": 70,
        "d5": 78,
        "d6": 70
      },
      "kpis": null
    }
  },
  "dhx": {
    "2026-03": {
      "dims": {
        "d1": 86,
        "d2": 78,
        "d3": 82,
        "d4": 80,
        "d5": 80,
        "d6": 78
      },
      "kpis": {
        "d1": [
          62,
          88,
          65,
          90
        ],
        "d2": [
          77,
          98,
          98,
          85
        ],
        "d3": [
          105,
          100,
          96,
          75
        ],
        "d4": [
          58,
          67,
          60,
          58
        ],
        "d5": [
          100,
          100,
          100,
          100
        ],
        "d6": [
          65,
          25,
          60,
          88
        ]
      }
    },
    "2026-04": {
      "dims": {
        "d1": 86,
        "d2": 71,
        "d3": 85,
        "d4": 75,
        "d5": 85,
        "d6": 77
      },
      "kpis": {
        "d1": [
          62,
          88,
          65,
          90
        ],
        "d2": [
          77,
          98,
          98,
          85
        ],
        "d3": [
          105,
          100,
          96,
          75
        ],
        "d4": [
          58,
          67,
          60,
          58
        ],
        "d5": [
          100,
          100,
          100,
          100
        ],
        "d6": [
          65,
          25,
          60,
          88
        ]
      }
    },
    "2026-05": {
      "dims": {
        "d1": 88,
        "d2": 78,
        "d3": 91,
        "d4": 80,
        "d5": 96,
        "d6": 78
      },
      "kpis": {
        "d1": [
          80,
          77,
          96,
          100
        ],
        "d2": [
          75,
          81,
          87,
          67
        ],
        "d3": [
          90,
          83,
          100,
          90
        ],
        "d4": [
          80,
          95,
          60,
          83
        ],
        "d5": [
          100,
          100,
          85,
          100
        ],
        "d6": [
          80,
          80,
          75,
          75
        ]
      }
    },
    "2026-06": {
      "dims": {
        "d1": 68,
        "d2": 72,
        "d3": 88,
        "d4": 85,
        "d5": 95,
        "d6": 82
      },
      "kpis": {
        "d1": [
          123,
          117,
          88,
          133
        ],
        "d2": [
          30491,
          22404,
          6471
        ],
        "d3": [
          80,
          98,
          90
        ],
        "d4": [
          3,
          0,
          12
        ],
        "d5": [
          100,
          100,
          100,
          0,
          100
        ],
        "d6": [
          1,
          9,
          6
        ]
      },
      "_isCurrent": true
    },
    "2026-07": {
      "dims": {
        "d1": 87,
        "d2": 85,
        "d3": 83,
        "d4": 85,
        "d5": 97,
        "d6": 88
      },
      "kpis": {
        "d1": [82, 81, 102, 83],
        "d2": [100, 72, 72, 100],
        "d3": [100, 100, 100, 83],
        "d4": [100, 100, 100, 90],
        "d5": [100, 100, 100, 91],
        "d6": [100, 90, 90, 85]
      },
      "_kpiComparison": {
        "title": "7月核心KPI达成率",
        "period": "2026年7月",
        "items": [
          {"name": "产量(吨)", "budget": 6057, "target": 6057, "actual": 5010, "unit": "吨"},
          {"name": "营业收入(万元)", "budget": 4211, "target": 4211, "actual": 3458, "unit": "万元"},
          {"name": "净利润(万元)", "budget": 500, "target": 500, "actual": 403, "unit": "万元"},
          {"name": "毛利率(%)", "budget": 20.3, "target": 20.3, "actual": 20.8, "unit": "%"},
          {"name": "1-7月累计营收(万元)", "budget": 0, "target": 0, "actual": 25556, "unit": "万元"}
        ]
      },
      "_dimComparison_d1": {
        "title": "7月核心KPI",
        "format": "mom",
        "items": [
          {"name": "产量(吨)", "prev": 0, "curr": 5010, "unit": "吨"},
          {"name": "营业收入(万元)", "prev": 0, "curr": 3458, "unit": "万元"},
          {"name": "净利润(万元)", "prev": 0, "curr": 403, "unit": "万元"},
          {"name": "毛利率(%)", "prev": 0, "curr": 20.8, "unit": "%"},
          {"name": "1-7月累计营收(万元)", "prev": 0, "curr": 25556, "unit": "万元"},
          {"name": "1-7月营收同比(%)", "prev": 0, "curr": 15.47, "unit": "%"}
        ]
      },
      "_dimComparison_d2": {
        "title": "7月经营效益",
        "format": "snapshot",
        "items": [
          {"name": "计划达成率(%)", "value": 99.85, "unit": "%"},
          {"name": "OEE", "value": 72.64, "unit": ""},
          {"name": "单吨制费(元)", "value": 212, "unit": "元"},
          {"name": "首检合格率(%)", "value": 99.67, "unit": "%"},
          {"name": "能源MCU定额(m³/t)", "value": 2.26, "unit": "m³/t"}
        ]
      },
      "_dimComparison_d3": {
        "title": "7月运营效率",
        "format": "snapshot",
        "items": [
          {"name": "周转天数(天)", "value": 41, "unit": "天"},
          {"name": "物流费用率(%)", "value": 4.5, "unit": "%"},
          {"name": "物料齐套率(%)", "value": 99.08, "unit": "%"},
          {"name": "超期库存(万元)", "value": 91.6, "unit": "万元"},
          {"name": "SKU精简(个)", "value": 158, "unit": "个"}
        ]
      },
      "_dimComparison_d4": {
        "title": "7月技术创新",
        "format": "snapshot",
        "items": [
          {"name": "客户审核(家)", "value": 5, "unit": "家"},
          {"name": "Lims系统上线", "value": 100, "unit": "%"},
          {"name": "CNAS整改关闭", "value": 100, "unit": "%"},
          {"name": "AI制动液智能体", "value": 100, "unit": "%"},
          {"name": "公众号发布(篇)", "value": 11, "unit": "篇"}
        ]
      },
      "_dimComparison_d5": {
        "title": "7月风险合规",
        "format": "snapshot",
        "items": [
          {"name": "安全事故(起)", "value": 0, "unit": "起"},
          {"name": "环保违规(项)", "value": 0, "unit": "项"},
          {"name": "诉讼案件(件)", "value": 0, "unit": "件"},
          {"name": "隐患整改率(%)", "value": 91, "unit": "%"},
          {"name": "零碳工厂", "value": 100, "unit": "%"}
        ]
      },
      "_dimComparison_d6": {
        "title": "7月组织活力",
        "format": "snapshot",
        "items": [
          {"name": "AI工作小组成立", "value": 100, "unit": "%"},
          {"name": "印尼建厂(投委会)", "value": 100, "unit": "%"},
          {"name": "AGV项目调试", "value": 80, "unit": "%"},
          {"name": "26届管培生入职", "value": 100, "unit": "%"},
          {"name": "省级智能工厂认定", "value": 100, "unit": "%"}
        ]
      }
    },
    "2026-08": {
      "dims": {
        "d1": 72,
        "d2": 83,
        "d3": 85,
        "d4": 90,
        "d5": 96,
        "d6": 88
      },
      "kpis": {
        "d1": [71, 100, 70, 98],
        "d2": [100, 95, 98, 85],
        "d3": [94, 92, 98, 100],
        "d4": [100, 100, 90, 85],
        "d5": [100, 100, 100, 100],
        "d6": [85, 100, 90, 90]
      },
      "_kpiComparison": {
        "title": "8月核心KPI达成率",
        "period": "2026年8月",
        "items": [
          {"name": "营业收入(万元)", "budget": 3956, "target": 3956, "actual": 2807, "unit": "万元"},
          {"name": "毛利率(%)", "budget": 23, "target": 23, "actual": 23, "unit": "%"},
          {"name": "净利润(万元)", "budget": 458, "target": 458, "actual": 320, "unit": "万元"},
          {"name": "净利润率(%)", "budget": 11.6, "target": 11.6, "actual": 11.4, "unit": "%"},
          {"name": "现金流(万元)", "budget": 661, "target": 661, "actual": -56, "unit": "万元"},
          {"name": "1-8月累计营收(万元)", "budget": 0, "target": 0, "actual": 28326, "unit": "万元"}
        ]
      },
      "_dimComparison_d1": {
        "title": "8月核心KPI",
        "format": "mom",
        "items": [
          {"name": "营业收入(万元)", "prev": 0, "curr": 2807, "unit": "万元"},
          {"name": "净利润(万元)", "prev": 0, "curr": 320, "unit": "万元"},
          {"name": "毛利率(%)", "prev": 0, "curr": 23.0, "unit": "%"},
          {"name": "净利润率(%)", "prev": 0, "curr": 11.4, "unit": "%"},
          {"name": "1-8月累计营收(万元)", "prev": 0, "curr": 28326, "unit": "万元"},
          {"name": "1-8月营收同比(%)", "prev": 0, "curr": 12, "unit": "%"}
        ]
      },
      "_dimComparison_d2": {
        "title": "8月经营效益",
        "format": "snapshot",
        "items": [
          {"name": "毛利率(%)", "value": 23.0, "unit": "%"},
          {"name": "单吨制费(元)", "value": 280, "unit": "元"},
          {"name": "净利润率(%)", "value": 11.4, "unit": "%"},
          {"name": "营收同比(%)", "value": -12, "unit": "%"},
          {"name": "节能降耗(元/吨)", "value": 25.22, "unit": "元/吨"}
        ]
      },
      "_dimComparison_d3": {
        "title": "8月运营效率",
        "format": "snapshot",
        "items": [
          {"name": "周转天数(天)", "value": 37, "unit": "天"},
          {"name": "物流费用率(%)", "value": 4.6, "unit": "%"},
          {"name": "超期库存(万元)", "value": 86, "unit": "万元"},
          {"name": "客户质量投诉(次)", "value": 0, "unit": "次"},
          {"name": "AGV增购批准(台)", "value": 8, "unit": "台"}
        ]
      },
      "_dimComparison_d4": {
        "title": "8月技术创新",
        "format": "snapshot",
        "items": [
          {"name": "华为去离子冷却液中试", "value": 100, "unit": "%"},
          {"name": "TEEC-ITS高潜热验收", "value": 100, "unit": "%"},
          {"name": "数据中心冷却液测试", "value": 90, "unit": "%"},
          {"name": "SGS共建联合实验室", "value": 85, "unit": "%"},
          {"name": "研发降本(万元)", "value": 372, "unit": "万元"}
        ]
      },
      "_dimComparison_d5": {
        "title": "8月风险合规",
        "format": "snapshot",
        "items": [
          {"name": "安全事故(起)", "value": 0, "unit": "起"},
          {"name": "环保违规(项)", "value": 0, "unit": "项"},
          {"name": "诉讼案件(件)", "value": 0, "unit": "件"},
          {"name": "零碳工厂认定", "value": 100, "unit": "%"},
          {"name": "体系审核通过", "value": 100, "unit": "%"}
        ]
      },
      "_dimComparison_d6": {
        "title": "8月组织活力",
        "format": "snapshot",
        "items": [
          {"name": "液冷销售团队搭建", "value": 85, "unit": "%"},
          {"name": "印尼ODI备案", "value": 100, "unit": "%"},
          {"name": "华为转训", "value": 90, "unit": "%"},
          {"name": "龙小迪智能体二期", "value": 90, "unit": "%"},
          {"name": "省级智能工厂/高企复审", "value": 100, "unit": "%"}
        ]
      }
    }
  },
  "lpsd": {
    "2026-04": {
      "dims": {
        "d1": 97,
        "d2": 79,
        "d3": 90,
        "d4": 85,
        "d5": 80,
        "d6": 75
      },
      "kpis": {
        "d1": [
          63,
          90,
          100,
          96
        ],
        "d2": [
          63,
          63,
          63,
          63,
          63,
          63,
          63,
          61
        ],
        "d3": [
          77,
          100,
          96,
          0
        ],
        "d4": [
          100,
          100,
          100,
          100
        ],
        "d5": [
          100,
          100,
          100,
          100
        ],
        "d6": [
          100,
          87,
          87,
          0
        ]
      }
    },
    "2026-05": {
      "dims": {
        "d1": 58,
        "d2": 88,
        "d3": 75,
        "d4": 85,
        "d5": 85,
        "d6": 75
      },
      "kpis": {
        "d1": [
          63,
          90,
          100,
          96
        ],
        "d2": [
          63,
          63,
          63,
          63,
          63,
          63,
          63,
          61
        ],
        "d3": [
          77,
          100,
          96,
          0
        ],
        "d4": [
          100,
          100,
          100,
          100
        ],
        "d5": [
          100,
          100,
          100,
          100
        ],
        "d6": [
          100,
          87,
          87,
          0
        ]
      },
      "_isCurrent": true
    },
    "2026-06": {
      "dims": {
        "d1": 68,
        "d2": 70,
        "d3": 78,
        "d4": 82,
        "d5": 68,
        "d6": 75
      },
      "kpis": null
    },
    "2026-07": {
      "dims": {
        "d1": 88,
        "d2": 61,
        "d3": 81,
        "d4": 95,
        "d5": 100,
        "d6": 91
      },
      "kpis": null
    },
    "2026-08": {
      "dims": {
        "d1": 70,
        "d2": 78,
        "d3": 82,
        "d4": 92,
        "d5": 95,
        "d6": 88
      },
      "kpis": {
        "d1": [58, 75, 129, 102],
        "d2": [58, 85, 70, 80],
        "d3": [95, 100, 88, 102],
        "d4": [95, 85, 90, 88],
        "d5": [90, 100, 100, 95],
        "d6": [90, 85, 75, 85]
      },
      "_isCurrent": true,
      "source": "龙蟠时代8月总结暨9月计划报告V3",
      "_kpiComparison": {
        "title": "2026年8月核心考核指标达成情况",
        "period": "2026年8月",
        "items": [
          {"name": "产量(T)", "budget": 6266, "target": 6266, "actual": 3042, "unit": "吨"},
          {"name": "单吨生产成本(元/吨)", "budget": 31749, "target": 31749, "actual": 34645, "unit": "元/吨"},
          {"name": "营业收入(万元)", "budget": 55455, "target": 55455, "actual": 32140, "unit": "万元"},
          {"name": "毛利率(%)", "budget": 9.30, "target": 9.30, "actual": 12.03, "unit": "%"},
          {"name": "净利润(万元)", "budget": 3179, "target": 3179, "actual": 2400, "unit": "万元"},
          {"name": "资产负债率(%)", "budget": 64, "target": 64, "actual": 62.1, "unit": "%"}
        ]
      },
      "_dimComparison_d1": {
        "title": "8月核心考核",
        "items": [
          {"name": "产量达成率(%)", "value": 48.5, "unit": "%"},
          {"name": "营收达成率(%)", "value": 58, "unit": "%"},
          {"name": "净利达成率(%)", "value": 75.5, "unit": "%"},
          {"name": "毛利率(%)", "value": 12.03, "unit": "%"}
        ]
      },
      "_dimComparison_d2": {
        "title": "8月经营效益",
        "items": [
          {"name": "单位全成本(万元/吨)", "budget": 10.93, "target": 10.93, "actual": 11.23, "unit": "万元/吨"},
          {"name": "冶炼加工成本(万元/吨)", "budget": 3.25, "target": 3.25, "actual": 3.46, "unit": "万元/吨"},
          {"name": "单吨物流费用(元/吨)", "budget": 190, "target": 190, "actual": 175.4, "unit": "元/吨"},
          {"name": "存货周转天数(天)", "budget": 15, "target": 15, "actual": 14.66, "unit": "天"},
          {"name": "采购降本(万元)", "value": 102.73, "unit": "万元"},
          {"name": "收率(%)", "value": 78.47, "unit": "%"}
        ]
      },
      "_dimComparison_d3": {
        "title": "8月运营效率",
        "items": [
          {"name": "产出(吨)", "budget": 3200, "target": 3200, "actual": 3042, "unit": "吨"},
          {"name": "出货(吨)", "budget": 2862, "target": 2862, "actual": 2862, "unit": "吨"},
          {"name": "焙烧转化率(%)", "value": 88.91, "unit": "%"},
          {"name": "浸出率(%)", "value": 97.81, "unit": "%"},
          {"name": "收率(%)", "value": 78.47, "unit": "%"}
        ]
      },
      "_dimComparison_d4": {
        "title": "8月技术创新",
        "items": [
          {"name": "硫化锂纯度(%)", "value": 99.9, "unit": "%"},
          {"name": "已授权专利(件)", "value": 31, "unit": "件"},
          {"name": "8月提交发明专利(篇)", "value": 3, "unit": "篇"},
          {"name": "研发样品处理(批次)", "value": 43, "unit": "批次"}
        ]
      },
      "_dimComparison_d5": {
        "title": "8月风险合规",
        "items": [
          {"name": "安全事故(起)", "value": 0, "unit": "起"},
          {"name": "环保处罚(项)", "value": 0, "unit": "项"},
          {"name": "隐患整改率(%)", "value": 95.28, "unit": "%"},
          {"name": "磁异合格率(%)", "value": 100, "unit": "%"},
          {"name": "成品一次性合格率(%)", "value": 100, "unit": "%"}
        ]
      },
      "_dimComparison_d6": {
        "title": "8月组织活力",
        "items": [
          {"name": "节能月排名", "value": 4, "unit": "名"},
          {"name": "储能净收益(万元)", "value": 7.7, "unit": "万元"},
          {"name": "技改项目(个)", "value": 10, "unit": "个"},
          {"name": "AI项目(个)", "value": 9, "unit": "个"},
          {"name": "专利受理(件)", "value": 22, "unit": "件"}
        ]
      }
    }
  },
  "kls": {
    "2026-03": {
      "dims": {
        "d1": 84,
        "d2": 72,
        "d3": 68,
        "d4": 70,
        "d5": 76,
        "d6": 70
      },
      "kpis": null
    },
    "2026-04": {
      "dims": {
        "d1": 89,
        "d2": 75,
        "d3": 70,
        "d4": 72,
        "d5": 78,
        "d6": 68
      },
      "kpis": null
    },
    "2026-05": {
      "dims": {
        "d1": 82,
        "d2": 80,
        "d3": 75,
        "d4": 76,
        "d5": 80,
        "d6": 72
      },
      "kpis": {
        "d1": [
          62,
          88,
          65,
          90
        ],
        "d2": [
          77,
          98,
          98,
          85
        ],
        "d3": [
          105,
          100,
          96,
          75
        ],
        "d4": [
          58,
          67,
          60,
          58
        ],
        "d5": [
          100,
          100,
          100,
          100
        ],
        "d6": [
          65,
          25,
          60,
          88
        ]
      }
    },
    "2026-06": {
      "dims": {
        "d1": 75,
        "d2": 85,
        "d3": 83,
        "d4": 70,
        "d5": 75,
        "d6": 60
      },
      "kpis": {
        "d1": [
          52,
          67,
          33,
          100
        ],
        "d2": [
          38,
          52,
          65,
          96
        ],
        "d3": [
          62,
          84,
          59,
          96
        ],
        "d4": [
          116,
          86,
          100,
          54
        ],
        "d5": [
          100,
          100,
          100,
          100
        ],
        "d6": [
          0,
          50,
          50,
          0
        ]
      },
      "_kpiComparison": {
        "title": "6月核心KPI达标率",
        "period": "2026年6月",
        "items": [
          {
            "name": "收入达成率(%)",
            "budget": 7247,
            "target": 7247,
            "actual": 5069,
            "unit": "%"
          },
          {
            "name": "净利润达成率(%)",
            "budget": 825,
            "target": 825,
            "actual": 606,
            "unit": "%"
          },
          {
            "name": "毛利率(%)",
            "budget": 26.27,
            "target": 26.27,
            "actual": 23.27,
            "unit": "%"
          },
          {
            "name": "期间费用率(%)",
            "budget": 14.16,
            "target": 14.16,
            "actual": 14.99,
            "unit": "%"
          },
          {
            "name": "回款率(%)",
            "budget": 100,
            "target": 100,
            "actual": 90,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d2": {
        "title": "6月经营效益",
        "items": [
          {
            "name": "尿素溶液销售(万)",
            "budget": 7247,
            "target": 603.9,
            "actual": 5069,
            "unit": "万元"
          },
          {
            "name": "一卡通网点(家)",
            "budget": 20000,
            "target": 1667,
            "actual": 18335,
            "unit": "家"
          },
          {
            "name": "加注机累计(台)",
            "budget": 3000,
            "target": 250,
            "actual": 2765,
            "unit": "台"
          },
          {
            "name": "OEM配套(家)",
            "budget": 0,
            "target": 0,
            "actual": 0,
            "unit": "家"
          }
        ]
      },
      "_dimComparison_d3": {
        "title": "6月运营效率",
        "items": [
          {
            "name": "产能利用率(%)",
            "budget": 80,
            "target": 80,
            "actual": 56.4,
            "unit": "%"
          },
          {
            "name": "一次合格率(%)",
            "budget": 100,
            "target": 100,
            "actual": 80,
            "unit": "%"
          },
          {
            "name": "单吨能耗(元/吨)",
            "budget": 37.7,
            "target": 37.7,
            "actual": 32.6,
            "unit": "元/吨"
          },
          {
            "name": "配送时效(小时)",
            "budget": 0,
            "target": 0,
            "actual": 0,
            "unit": "小时"
          }
        ]
      },
      "_dimComparison_d4": {
        "title": "6月技术创新力 5月→6月环比",
        "format": "mom",
        "items": [
          {
            "name": "新产品配方数",
            "prev": 0,
            "curr": 1,
            "unit": "个"
          },
          {
            "name": "OEM认证取得(家)",
            "prev": 0,
            "curr": 0,
            "unit": "家"
          },
          {
            "name": "国六适配型号数",
            "prev": 0,
            "curr": 0,
            "unit": "个"
          },
          {
            "name": "技术服务项目",
            "prev": 3,
            "curr": 5,
            "unit": "个"
          }
        ]
      },
      "_dimComparison_d5": {
        "title": "6月风险合规",
        "items": [
          {
            "name": "环保合规",
            "budget": 1,
            "target": 1,
            "actual": 1,
            "unit": "项"
          },
          {
            "name": "安全培训完成(次)",
            "budget": 2,
            "target": 2,
            "actual": 2,
            "unit": "次"
          },
          {
            "name": "绿色工厂认证",
            "budget": 1,
            "target": 1,
            "actual": 0,
            "unit": "项"
          },
          {
            "name": "客户投诉率(%)",
            "budget": 0,
            "target": 0,
            "actual": 0,
            "unit": "%"
          }
        ]
      },
      "_dimComparison_d6": {
        "title": "6月组织活力 5月→6月环比",
        "format": "mom",
        "items": [
          {
            "name": "AI项目立项(个)",
            "prev": 0,
            "curr": 1,
            "unit": "个"
          },
          {
            "name": "星推官(人)",
            "prev": 0,
            "curr": 4244,
            "unit": "人"
          },
          {
            "name": "新市场开拓(个)",
            "prev": 0,
            "curr": 3,
            "unit": "个"
          },
          {
            "name": "数字化项目(个)",
            "prev": 0,
            "curr": 6,
            "unit": "个"
          }
        ]
      },
      "_isCurrent": true
    },
    "2026-07": {
      "dims": {
        "d1": 87,
        "d2": 85,
        "d3": 80,
        "d4": 100,
        "d5": 100,
        "d6": 85
      },
      "kpis": null
    },
    "2026-08": {
      "dims": {
        "d1": 71,
        "d2": 80,
        "d3": 88,
        "d4": 95,
        "d5": 100,
        "d6": 88
      },
      "kpis": null
    }
  }
};

/**
 * 验证数据块的 kpis 数组是否与配置一致
 * @param {string} buId - BU ID
 * @param {object} kpis - kpis 对象 { d1: [...], d2: [...], ... }
 * @returns {object} { valid: boolean, errors: string[] }
 */
function validateKpis(buId, kpis) {
    var cfg = BU_CONFIG[buId];
    if (!cfg) return { valid: false, errors: ['未知 BU: ' + buId] };
    if (!kpis) return { valid: false, errors: ['kpis 未定义（该BU暂无明细KPI数据）'] };
    var errors = [];
    var DIM_KEYS = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'];
    DIM_KEYS.forEach(function(dimId) {
        var expectedLabels = cfg.kpiLabels[dimId];
        var actualArr = kpis[dimId];
        if (!expectedLabels) return;
        if (!actualArr) {
            errors.push(dimId + ': 缺少 kpis.' + dimId + ' 数组');
            return;
        }
        if (actualArr.length !== expectedLabels.length) {
            errors.push(dimId + ': kpis.' + dimId + ' 应有 ' + expectedLabels.length + ' 个值，实际 ' + actualArr.length + ' 个');
        }
        actualArr.forEach(function(v, i) {
            if (typeof v !== 'number' || v < 0 || v > 999) {
                errors.push(dimId + '[' + i + ']: 值 "' + v + '" 不是合理的达成率（应为 0-999 的数字）');
            }
        });
    });
    return { valid: errors.length === 0, errors: errors };
}

/**
 * 获取 BU 的维度定义（供 radar_detail_*.html 渲染 Tab2 柱状图标签）
 * @param {string} buId
 * @returns {array} DIMS_DEF 格式的数组
 */
function getDimsDef(buId) {
    var cfg = BU_CONFIG[buId];
    if (!cfg) return null;
    var DIM_KEYS = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'];
    return DIM_KEYS.map(function(id, i) {
        return {
            id: id,
            name: cfg.dimNames[i],
            kpis: cfg.kpiLabels[id] || [],
            color: cfg.color,
        };
    });
}

/**
 * 获取默认权重（用于新 BU 或未配置的情况）
 */
var DEFAULT_WEIGHTS = [20, 20, 18, 17, 13, 12];
