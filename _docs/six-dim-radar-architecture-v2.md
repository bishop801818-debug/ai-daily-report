# 六维雷达图系统运维文档

> 版本：v2.0（2026-06-05 评分系统重构后）| 状态：正式启用
> 适用范围：龙蟠集团9个事业部（9BU），SDMD为首个成熟案例

---

## 一、评分标准（永久不变）

### 1.1 核心公式

```
达成率 = actual / target        （收益类：越高越好）
达成率 = target / actual         （成本类：越低越好）
达成率 = curr / prev             （环比类/MoM：越高越好）
得分   = 达成率 × 100            （达成率1.0 = 100分）
得分   = min(120, 达成率 × 100)  （封顶120分）
```

### 1.2 指标类型与达成率公式

| 类型 | 判断规则 | 达成率公式 |
|------|----------|------------|
| 收益/数量类 | 名称含"收入""毛利""销量""产出""交付"等 | actual / target |
| 成本/费用类 | 名称含"成本""费用" | target / actual（越低越好） |
| 约束/事件类 | 名称含"事故""纠纷""投诉""问题" | 实际=0 → 达成率=1.0；每发生1次 → -0.1 |
| 比例/率类 | 名称含"率""占比""覆盖率" | actual / target |
| 环比类（无目标） | MoM格式，无 target 字段 | curr / prev（越高越好） |

### 1.3 各维度评分规则

**D1 战略执行力**（4个子KPI）：
- KPI目标达成率：7项核心KPI达成率的平均值
- 战略协同度：收入达成率（actual/target）
- 项目里程碑完成率：产品一次合格率达成率
- 资源配置效率：回款达成率

**D2 经营效益**（4个子KPI）：直接 actual/target
**D3 运营效率**（4个子KPI）：直接 actual/target

**D4 技术创新力**（4个子KPI，MoM格式）：
- 在研课题数 / MCU项目数 / 技改项目数：直接 curr/prev
- MCU降本额：**剔除**（5月因项目数减少导致绝对金额下降，不代表做得差）

**D5 风险合规**（4个子KPI，MoM格式）：
- 隐患整改率 / 安全教育人次 / 排查隐患数：curr/prev
- 应急演练场次：curr/prev（越少越低分）

**D6 组织活力**（4个子KPI，MoM格式）：
- AI项目立项数（prev=0）：定性评分100分
- 企业荣誉数（prev=0）：定性评分100分
- IATF审核问题数：逆向计算（prev/curr，越少越好）
- 5S覆盖率：curr/prev

### 1.4 维度综合分计算

```
dims[dimId] = kpis[dimId]数组的平均值（四舍五入取整）
```

---

## 二、DIMS 定义（六维度 × 四子KPI）

位于 `index_v3.html` 约 L13639，每个维度定义：

```javascript
{ id:'d1', name:'战略执行力', color:'#1a6b9e', weight:0.20, order:0,
  kpis:['KPI目标达成率','战略协同度','项目里程碑完成率','资源配置效率'] }
```

| 维度ID | 名称 | 权重 | 颜色 | 4个子KPI（均来自PDF真实数据） |
|--------|------|------|------|------------------------------|
| d1 | 战略执行力 | 20% | #1a6b9e | KPI目标达成率、战略协同度、项目里程碑完成率、资源配置效率 |
| d2 | 经营效益 | 20% | #2e7d5a | 营收同比增长、碳酸锂销量、修复LFP交付、磷铁液销售 |
| d3 | 运营效率 | 18% | #7b4fa8 | 投料达成率、产出达成率、磷铁液交付达成率、锂回收率 |
| d4 | 技术创新力 | 17% | #c0572a | 在研课题数、MCU项目数、技改项目数、MCU降本额 |
| d5 | 风险合规 | 13% | #b5862a | 隐患整改率、安全教育人次、排查隐患数、应急演练场次 |
| d6 | 组织活力 | 12% | #2a6b7c | AI项目立项数、企业荣誉数、IATF审核问题数、5S覆盖率 |

---

## 三、数据结构（每个BU的BUS_DATA）

```javascript
buId: {
    name: '事业部名称',
    logo: '',           // logo URL（空则显示文字头像）
    tag: '标签',
    accent: '#颜色',
    dims: { d1:0-120, d2:0-120, ... },  // 六个维度综合分（0-120分）
    kpis: {
        d1: [0-120, 0-120, 0-120, 0-120],   // 每个维度的4个子KPI（0-120分）
        d2: [...], ...
    },
    _kpiComparison: {   // D1：7项核心KPI预算→目标→实际
        title: '表标题',
        period: '期间',
        items: [
            { name:'指标名', budget:数值, target:数值, actual:数值, unit:'单位' },
            ...
        ]
    },
    _dimComparison_d2: { items: [{ name, budget, target, actual, unit }, ...] },
    _dimComparison_d3: { items: [{ name, budget, target, actual, unit }, ...] },
    _dimComparison_d4: { format:'mom', items: [{ name, prev, curr, unit }, ...] },
    _dimComparison_d5: { format:'mom', items: [{ name, prev, curr, unit }, ...] },
    _dimComparison_d6: { format:'mom', items: [{ name, prev, curr, unit }, ...] },
}
```

**关键约束**：
- `dims` 和 `kpis` 为自动计算结果（由 calcKPIsFromComparison + calcDimsFromKPIs 计算）
- `_kpiComparison`（D1）和 `_dimComparison_d{2-3}`（D2-D3）使用 budget/target/actual 格式
- `_dimComparison_d{4-6}`（D4-D6）使用 prev/curr MoM格式
- 所有原始数据必须来自PDF，注释中注明数据来源章节

---

## 四、核心计算函数

### 4.1 calcKPIAchv(item, isCost, format)

**位置**：index_v3.html 约 L13790

输入：item对象, isCost布尔, format('target'|'mom')
输出：达成率（0-1.2的小数）

```javascript
// 收益类：actual/target，封顶1.0
// 成本类：target/actual，封顶1.0
// MoM类：curr/prev，封顶1.0
```

### 4.2 achvToScore(achv)

**位置**：index_v3.html 约 L13807

输入：达成率（0-1.2的小数）
输出：得分（0-120的整数，自动四舍五入到1位小数）

```javascript
return Math.round(Math.min(1.2, achv) * 100 * 10) / 10;
```

### 4.3 calcKPIsFromComparison(buId)

**位置**：index_v3.html 约 L13812

功能：从BU的对比表数据计算6个维度的kpis数组
- D1：7项KPI → 4个子KPI映射
- D2-D3：直接 actual/target
- D4-D6：MoM格式，特殊规则处理（D4剔除MCU降本、D6 prev=0项）
- 无数据时默认 [60,60,60,60]（及格线）

### 4.4 calcDimsFromKPIs(kpis)

**位置**：index_v3.html 约 L13888

功能：kpis数组 → dims综合分
逻辑：dims[dimId] = kpis[dimId]有效项平均值（四舍五入）

### 4.5 calcScores(buId)

**位置**：index_v3.html 约 L13903

功能：对外统一入口，返回 {dims, kpis}
逻辑：优先从对比表自动计算，无对比表则用硬编码 fallback

---

## 五、渲染函数

| 函数 | 位置 | 功能 |
|------|------|------|
| buildRadar(buId) | ~L14237 | SVG六边雷达图，dims数据驱动 |
| renderDims(buId) | ~L14406 | 右侧维度展开行，0-100分制子KPI |
| toggleDim(buId, dimId) | ~L14438 | 展开/收起维度 + 对比表（互斥） |
| buildKPIComparison(buId) | ~L13864 | D1的7项核心KPI对比表 |
| buildDimTableHTML(dc) | ~L13954 | D2-D6的各维度对比表（自动识别mom/target格式） |

---

## 六、扩展到其他BU的操作步骤

### 步骤1：获取数据

两个PDF文件：
- 当月计划书（预算值 + 挑战目标值）
- 当月总结书（实际达成值）

### 步骤2：提取数据 → 对比表

在 BUS_DATA 中构造：
- `_kpiComparison`：D1的7项核心KPI（从计划PDF"5月关键考核指标"部分提取）
- `_dimComparison_d2`：D2的4项产品指标（收入/毛利/净利/回款）
- `_dimComparison_d3`：D3的4项生产指标（投料/产出/交付/成本）
- `_dimComparison_d{4-6}`：D4-D6的MoM环比数据（从计划PDF4月数据 + 总结PDF5月数据）

### 步骤3：确认KPI名称与DIMS对齐

DIMS定义中的子KPI名称必须与对比表items中的name完全一致，用于代码中识别类型：
- 名称含"成本"→成本类（逆向计算）
- 名称含"MCU降本"→D4剔除
- 名称含"IATF"→D6逆向计算
- MoM格式中 prev=0 → 定性评分100分

### 步骤4：删除旧dims/kpis硬编码

其他BU目前用统一默认值 `{d1:80,...,d6:80}` 和 `kpis:{d1:[8,8,8,8],...}`。扩展时删除这些硬编码，由 calcScores() 自动计算。

### 步骤5：验证

刷新页面，检查：
1. 雷达图形状是否符合预期（超标项突出，未达标项凹陷）
2. 展开维度时子KPI得分是否与PDF数据吻合
3. 综合分是否在合理区间（60-120分）

---

## 七、关键代码位置速查

| 内容 | 位置 |
|------|------|
| DIMS 定义 | ~L13639 |
| BUS_DATA（SDMD） | ~L13667 |
| calcKPIAchv() | ~L13790 |
| achvToScore() | ~L13807 |
| calcKPIsFromComparison() | ~L13812 |
| calcDimsFromKPIs() | ~L13888 |
| calcScores() | ~L13903 |
| buildKPIComparison() | ~L13864 |
| buildDimTableHTML() | ~L13954 |
| renderDims() | ~L14406 |
| toggleDim() | ~L14438 |
| HTML_VERSION | ~L11 |
| kpiComparisonWrap（drawerBody） | ~L13938 |

---

## 八、版本记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-06-04 | 20260604_2300 | 评分系统初版，自动计算dims/kpis |
| 2026-06-04 | 20260604_2330 | 达成率封顶从1.2改为1.0 |
| 2026-06-04 | 20260604_2345 | D3-D6 KPI名称改为PDF真实数据 |
| 2026-06-05 | 20260605_0015 | 改为60分及格线（新公式） |
| 2026-06-05 | 20260605_0030 | 改回达成率×100（0-100分制，cap 120） |
| 2026-06-05 | 20260605_0040 | renderDims子KPI从0-10改为0-100分制 |
| 2026-06-05 | v2.0 | 本文档更新，DIMSKPI全对齐，评分逻辑稳定 |