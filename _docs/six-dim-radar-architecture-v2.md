# 六维雷达图系统运维文档

> 版本：v2.1（2026-06-11 FNLT案例修订）| 状态：正式启用
> 适用范围：龙蟠集团9个事业部（9BU）

---

## 一、数据架构：双入口问题

### 1.1 两个入口，各自独立

雷达图数据在系统中存在**两个入口**，它们各自独立从数据源读取：

```
┌─────────────────────────────────────────────────────────────┐
│  入口A: index_v3.html                                       │
│  ├── 首页"集团矩阵"卡片 → 点击 → 抽屉面板 openPanel()       │
│  ├── 数据源: BUS_DATA[buId] + RADAR_HISTORY[buId]           │
│  └── 渲染: buildRadar() + renderDims() + calcScores()      │
│                                                             │
│  入口B: radar_hub.html                                      │
│  ├── 雷达看板专用页（多BU切换/多月份叠加）                  │
│  ├── 数据源: BU_DIMS + BU_HISTORY（独立对象）               │
│  └── 渲染: ECharts 雷达图 + 月份切换按钮                   │
└─────────────────────────────────────────────────────────────┘
```

**关键规则**：
- 更新任何一个入口的数据，**另一个入口不会自动更新**
- 更新数据时必须**同时修改两个文件**
- `index_v3.html` 的 `RADAR_HISTORY` 和 `radar_hub.html` 的 `BU_HISTORY` 必须保持一致

### 1.2 index_v3.html 评分计算路径（calcScores）

```
calcScores(buId)
  ├─ optMonth != null → 从 RADAR_HISTORY[buId][optMonth] 取 dims/kpis（预计算值）
  └─ optMonth == null → BUS_DATA[buId]
                        ├─ 有 _kpiComparison 或 _dimComparison_d2 → calcKPIsFromComparison() 自动计算
                        └─ 无对比表 → 用硬编码 dims/kpis（fallback）
```

**FNLT 特殊处理**：BUS_DATA.fnlt 有 `_kpiComparison` 对比表，但 calcKPIsFromComparison 的达成率公式**不适合 FNLT**（FNLT 的目标值逻辑与 SDMD 不同），因此：
- BUS_DATA.fnlt **不存**对比表，只存手动计算的 dims/kpis
- 对比表数据存在 `RADAR_HISTORY.fnlt['2026-04']._kpiComparison`（历史月份，用于抽屉展开展示）
- 这样 `calcScores()` 走 fallback 路径，用预计算的 dims/kpis

### 1.3 radar_hub.html 数据结构

```javascript
// radar_hub.html 独立数据对象
var BU_DIMS = {
    sdmd: { d1: 95, d2: 91, d3: 88, d4: 81, d5: 88, d6: 87 },  // 当前月 dims
    fnlt: { d1: 20, d2: 19, d3: 76, d4: 100, d5: 100, d6: 65 },
    // ...
};

var BU_HISTORY = {
    sdmd: {
        '2026-03': { d1: 100, d2: 100, d3: 92, d4: 87, d5: 85, d6: 78 },
        '2026-04': { d1: 100, d2: 88, d3: 90, d4: 100, d5: 78, d6: 75 },
        '2026-05': { d1: 90,  d2: 90, d3: 82, d4: 80, d5: 90, d6: 78 },
    },
    fnlt: {
        '2026-04': { d1: 20, d2: 15, d3: 47, d4: 100, d5: 71, d6: 50 },
        '2026-05': { d1: 20, d2: 19, d3: 76, d4: 100, d5: 100, d6: 65 },
    },
};
```

---

## 二、评分标准（永久不变）

### 2.1 核心公式

```
达成率 = actual / target        （收益类：越高越好）
达成率 = target / actual         （成本类：越低越好）
达成率 = curr / prev             （环比类/MoM：越高越好）
得分   = min(120, 达成率 × 100)  （封顶120）
```

### 2.2 各BU评分路径选择规则

| BU | 评分路径 | 说明 |
|----|----------|------|
| **SDMD** | calcKPIsFromComparison() 自动计算 | 对比表数据完整，公式适配 |
| **FNLT** | 手动 dims/kpis fallback | 对比表仅用于抽屉展开展示，不驱动计算 |
| **其他BU** | 硬编码 fallback | 统一默认值 {d1-d6: 80} |

**判断方法**：BUS_DATA[buId] 有 `_kpiComparison` + `_dimComparison_d2` → 自动计算；否则 → fallback。

---

## 三、DIMS 定义

位于 `index_v3.html` 约 L13639：

```javascript
{ id:'d1', name:'战略执行力', color:'#1a6b9e', weight:0.20,
  kpis:['KPI目标达成率','战略协同度','项目里程碑完成率','资源配置效率'] }
```

权重：D1=20%, D2=20%, D3=18%, D4=17%, D5=13%, D6=12%

**加权总分公式**：`total = Σ dims[di] × weight[i]`

---

## 四、数据更新操作规程

### 4.1 添加/更新某BU某月数据（必须同时修改两个文件）

**Step 1：更新 index_v3.html**

① 找到 `RADAR_HISTORY` 对象，在对应 BU 下添加月份数据：
```javascript
// RADAR_HISTORY[buId]['YYYY-MM'] = { dims, kpis, _kpiComparison, _dimComparison_d2-d6, _isCurrent?, _issues?, _positives? }
```

② 如果该月是当月，同时更新 `BUS_DATA[buId]` 的 dims/kpis（radar_hub.html 读取这个作为当前月数据）

**Step 2：更新 radar_hub.html**

① 更新 `BU_DIMS[buId]`（当月 dims）
② 更新 `BU_HISTORY[buId]['YYYY-MM']`（历史 dims）

**Step 3：验证**

刷新两个页面，确认：
- radar_hub.html 当月卡片显示分数与 index_v3.html 抽屉面板一致
- 历史月份卡片切换功能正常

### 4.2 修改评分标准（极罕见）

评分标准定义在 `index_v3.html` 的以下函数：
- `calcKPIAchv()` — 达成率计算（约 L13790）
- `achvToScore()` — 达成率→得分（约 L13807）
- `calcKPIsFromComparison()` — KPI综合计算（约 L13812）
- `calcDimsFromKPIs()` — dims计算（约 L13888）

修改后必须全量回归测试所有BU。

---

## 五、FNLT 案例：对比表只用于展示不用于计算

FNLT 的 `_kpiComparison` 和 `_dimComparison_d2-d6` 数据存储在 `RADAR_HISTORY.fnlt['2026-04']`（历史月份），不放在 `BUS_DATA.fnlt`，原因：

1. `calcKPIsFromComparison()` 的达成率公式是为 SDMD 设计的（预算→挑战目标→实际）
2. FNLT 的 target 值含义不同（挑战目标 vs 预算目标），直接套用会导致 dims 偏差
3. 抽屉面板展开维度时仍需显示对比表 → 数据存在 RADAR_HISTORY 历史月份中

**结论**：对于评分公式不适用的BU，对比表只作为抽屉展开的展示数据，不驱动自动计算。

---

## 六、润滑油BU案例：跨行业维度映射

### 6.1 行业差异

润滑油与SDMD（电池回收）、FNLT（电解液制造）完全不同：
- **业务模式**：品牌销售驱动型，多产品线（冷却液/汽机油/柴机油/变速箱油/工业油/玻璃水/海外）
- **KPI重心**：销售收入、利润、品类达成、渠道拓展、OEM认证
- **创新维度**：新产品配方、OEM认证数 → 替代 SDMD 的"MCU项目/技改"
- **风险维度**：质量合规、客户投诉 → 替代 SDMD 的"安全隐患/应急演练"
- **组织维度**：新客户开发、数字化 → 替代 SDMD 的"企业荣誉/IATF"

### 6.2 润滑油专属维度定义

```
D1 战略执行力 (20%): 收入达成率、净利润达成率、毛利率达成率、费用控制率
D2 经营效益   (20%): 冷却液销售达成、汽机油销售达成、柴机油销售达成、变速箱油销售达成
D3 运营效率   (18%): 海外市场销售达成、工业油销售达成、玻璃水销售达成、应收账款周转达标
D4 技术创新力 (17%): 新产品配方数、OEM认证取得、技术降本项目、技术服务项目
D5 风险合规   (13%): 质量体系审核、环境安全合规、客户投诉率、供应商审核
D6 组织活力   (12%): AI项目立项、新客户开发数、人才引进、数字化项目
```

### 6.3 BU ID 说明

- index_v3.html 使用 `lube`
- radar_hub.html / strategy_hub.html / bu_hub.html 使用 `lhy`
- 此为历史遗留不一致，与法恩莱特 (`fnlt` vs `felt`) 同理，不影响功能
- 颜色统一为龙蟠红 `#c0392b`

### 6.4 润滑油数据示例（2026-05）

| 维度 | dims | kpis | 说明 |
|------|------|------|------|
| D1 战略执行力 | 98 | [100,98,93,100] | 收入102%/净利98%/毛利93%/费用113% |
| D2 经营效益 | 88 | [52,100,100,100] | 冷却液弱(52%)/汽机油柴机油强(>120%) |
| D3 运营效率 | 77 | [96,80,32,100] | 海外强劲/玻璃水弱(32%)/应收达标 |
| D4 技术创新力 | 78 | [80,85,75,80] | OEM认证推进中/配方开发正常 |
| D5 风险合规 | 83 | [85,85,80,80] | 质量体系稳定/投诉率改善 |
| D6 组织活力 | 75 | [70,80,75,75] | AI项目起步/新客户开发超额 |

**加权总分**：98×0.20 + 88×0.20 + 77×0.18 + 78×0.17 + 83×0.13 + 75×0.12 = **84.1（A级）**

---

## 七、关键代码位置速查

| 内容 | 位置 |
|------|------|
| DIMS 定义 | ~L13639 |
| BUS_DATA（所有BU） | ~L13667 |
| calcKPIAchv() | ~L13790 |
| achvToScore() | ~L13807 |
| calcKPIsFromComparison() | ~L13812 |
| calcDimsFromKPIs() | ~L13888 |
| calcScores() | ~L13903 |
| BUS_DATA.fnlt（当前月 dims/kpis） | ~L17528 |
| RADAR_HISTORY（历史月份） | ~L17286 |
| renderDims() | ~L14406 |
| buildRadar() | ~L14237 |
| openPanel()（抽屉入口） | ~L13957 |
| radar_hub.html BU_DIMS | ~L136 |
| radar_hub.html BU_HISTORY | ~L150 |

---

## 七、版本记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-06-04 | 20260604_2300 | 评分系统初版，自动计算dims/kpis |
| 2026-06-05 | v2.0 | 评分逻辑稳定，文档初版 |
| 2026-06-11 | v2.1 | 新增双入口架构说明，FNLT案例，评分路径选择规则，同步操作规程 |
| 2026-06-11 | v2.2 | 新增润滑油BU案例：跨行业维度映射/专属指标/数据示例/加权总分84.1 |