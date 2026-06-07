# 六维雷达图 — 历史存档功能 & 增强雷达图

> 最后更新：2026-06-07（v26增强雷达图功能上线）

---

## 一、功能说明

六维雷达图弹窗新增两层历史数据能力：

| 模块 | 位置 | 功能 |
|------|------|------|
| 叠加复选框 | 雷达图上方 | 勾选后在当月雷达图上叠加历史月份（虚线+半透明） |
| 历史卡片列表 | 雷达图下方 | 点击历史卡片单独显示该月雷达图；再次点击返回当月 |

---

## 二、数据结构

文件：`index_v3.html` 内 `RADAR_HISTORY` 对象（L13913前后）

```javascript
const RADAR_HISTORY = {
    sdmd: {
        '2026-05': {
            dims: { d1: 90, d2: 90, d3: 82, d4: 80, d5: 90, d6: 78 },
            kpis: {
                d1: [94.9, 93.5, 81.6, 100],
                d2: [102.9, 85.6, 77, 105.3],
                d3: [84.1, 95.2, 71, 81.6],
                d4: [72.7, 71.4, 100, null],   // null = 剔除（如 MCU降本）
                d5: [108.2, 120, 118, 50],
                d6: [80, 80, 120, 100],
            },
            _isCurrent: true,  // 标记当月（必须有，否则当月卡片逻辑异常）
        },
        '2026-04': { dims: { d1: 82, d2: 85, d3: 80, d4: 76, d5: 78, d6: 72 }, kpis: { ... } },
        '2026-03': { dims: { d1: 85, d2: 88, d3: 82, d4: 78, d5: 80, d6: 75 }, kpis: { ... } },
    },
    // 其他 BU 同理
    // lpsd: { '2026-05': { dims: {...}, kpis: {...}, _isCurrent: true }, ... },
};
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `dims` | object | 各维度综合分（0-100），由 kpis 均值得出 |
| `kpis` | object | 各维度下 4 个子 KPI 的达成率（0-120%），用于雷达图展开时显示 |
| `_isCurrent` | boolean | 标记当月，仅当月数据设为 true；点击当月卡片时不清除雷达图 |

---

## 三、评分标准（自动计算）

### 子 KPI 达成率公式

| 类型 | 公式 | 示例 |
|------|------|------|
| 收益/数量类（目标↑） | `actual / target` | 销量 actual=102.9, target=100 → 102.9% |
| 成本/费用类（目标↓） | `target / actual` | 成本 target=1.60, actual=1.96 → 81.6% |
| MoM 环比类（无目标） | `curr / prev` | 上月=80，本月=85 → 106.3%（上限120%） |
| 约束/事件类 | 实际=0 → 达成率=1.0 | 安全事故0次 → 100% |
| 特殊 null | 该 KPI 剔除 | MCU降本=null → 不参与计算 |

**达成率上限**：120%（超过120%按120%计分）

### 得分换算

```
子KPI得分 = min(100, 达成率)   （已转为百分制，直接使用）
dims[dimId] = kpis[dimId] 均值
```

---

## 四、运维操作

### 4.1 添加当月数据（每月更新）

1. 打开 `index_v3.html`
2. 找到 `RADAR_HISTORY` 对象（约L13913）
3. 将当月 `_isCurrent: true` 的记录取消标记：`'_isCurrent': false`
4. 在对应 BU 下新增当月条目，标记 `'_isCurrent': true`

```javascript
// 操作示例：2026年6月添加山东美多数据
const RADAR_HISTORY = {
    sdmd: {
        // 旧当月（5月）→ 取消标记
        '2026-05': { dims: {...}, _isCurrent: false },
        // 旧历史月（4月）保持不变
        '2026-04': { dims: {...} },
        // 新当月（6月）→ 添加并标记
        '2026-06': {
            dims: { d1: 88, d2: 86, d3: 80, d4: 79, d5: 85, d6: 76 },
            kpis: {
                d1: [92, 90, 80, 95],
                d2: [100, 82, 78, 100],
                d3: [83, 92, 70, 80],
                d4: [72, 70, 100, null],
                d5: [105, 118, 115, 50],
                d6: [80, 80, 110, 100],
            },
            _isCurrent: true,
        },
    },
};
```

### 4.2 添加其他 BU 的历史数据

参考山东美多的结构，在 `RADAR_HISTORY` 中为其他 BU 添加条目：

```javascript
const RADAR_HISTORY = {
    sdmd: { ... },
    czly: {
        '2026-05': { dims: {d1:85,d2:82,d3:80,d4:78,d5:80,d6:75}, kpis:{...}, _isCurrent:true },
        '2026-04': { dims: {...}, kpis:{...} },
    },
    lpsd: { ... },
    fnlt: { ... },
    sjld: { ... },
};
```

### 4.3 存档点

| 日期 | 文件 | 说明 |
|------|------|------|
| 2026-06-05 | `backup/index_v3_20260605_radar_history.html` | 雷达历史功能初版 |

---

## 五、已知逻辑

1. **当月卡片点击** → 仅高亮，不切换雷达图
2. **历史月卡片点击** → 单独显示该月雷达图，再次点击返回当月
3. **叠加checkbox** → 仅显示历史月，不含当月；勾选后在当月雷达图上叠加热力（虚线）
4. **最多展示月份** → 历史卡片取最新3个月（按月倒序）
5. **RADAR_HISTORY 为空** → 显示"暂无历史数据"提示，不影响主功能

---

## 六、代码位置索引

| 内容 | 行号 |
|------|------|
| `RADAR_HISTORY` 数据结构 | L13913 |
| `getHistoryMonths()` 获取历史月份列表 | L13923 |
| CSS 样式（hexa-historical*） | L4064 |
| `buildHistoricalBar()` 叠加复选框 | L14524 |
| `buildHistoricalCards()` 历史卡片 | L14547 |
| `switchToHistoricalMonth()` 卡片点击切换 | L14570 |
| `toggleHistoricalOverlay()` 叠加checkbox | L14595 |
| `buildRadar()` 改造支持overlay | L14620 |
| `openPanel()` 渲染历史区域 | L14486 |

---

## 七、增强雷达图（radar_detail.html v26）

### 7.1 功能总览

| 功能 | 实现方式 |
|------|---------|
| 渐变线条 | `lineStyle.color{type:'linear', x:0,y:0,x2:1,y2:1, colorStops:[{#e67e22},{#d35400}]}` |
| 径向填充 | `areaStyle.color{type:'radial', colorStops:[{offset:0,rgba:0.35},{offset:1,rgba:0.08}]}` |
| 发光数据点 | `itemStyle{shadowBlur:16, shadowColor:'rgba(211,84,0,0.5)'}` |
| 渐变网格线 | `splitLine.colorStops`3层渐变（深→浅） |
| 时间轴动画 | `initTimeline()`+`togglePlay()`+`seekTimeline()`，1800ms/帧，pulse-glow动画 |
| 对比模式 | `setRadarMode('compare')`，叠加3个月+80分基准线 |
| 图例渲染 | `renderCompareLegend()` 动态生成3个月+基准线图例 |
| 背景装饰 | 三层`.radar-deco-hex`同心圆虚线边框 |

### 7.2 radar_detail.html 数据结构

```javascript
const RADAR_HISTORY_SDMD = {
    '2026-05': {
        dims: { d1: 90, d2: 90, d3: 82, d4: 80, d5: 90, d6: 78 },
        kpis: {
            d1: [94.9, 93.5, 81.6, 100],
            d2: [102.9, 85.6, 77.0, 105.3],
            d3: [84.1, 95.2, 71.0, 81.6],
            d4: [72.7, 71.4, 100, null],
            d5: [108.2, 120, 118, 50],
            d6: [80, 80, 120, 100],
        },
        _isCurrent: true,
        _kpiComparison: { title:'5月核心KPI达标率', period:'2026年5月', items:[...] },
        _dimComparison_d2: { title:'5月产品销量达成', items:[...] },
        _dimComparison_d3: { title:'5月生产效率达成', items:[...] },
        _dimComparison_d4: { format:'mom', items:[...] },
        _dimComparison_d5: { format:'mom', items:[...] },
        _dimComparison_d6: { format:'mom', items:[...] },
    },
    '2026-04': { dims: {d1:100,d2:88,d3:90,d4:100,d5:78,d6:75}, kpis:{...} },
    '2026-03': { dims: {d1:100,d2:100,d3:92,d4:87,d5:85,d6:78}, kpis:{...} },
};
```

每月末将当月数据追加进 `RADAR_HISTORY_SDMD`，保留最近3个月。

### 7.3 扩展到其他BU

1. 复制 `radar_detail.html` → `radar_detail_xxx.html`
2. 替换 BU_META_SDMD / RADAR_HISTORY_SDMD 为新BU数据
3. 更新BU色调（`BU_META_SDMD.color`）
4. 在 `radar_hub.html` 添加卡片链接 `href="radar_detail_xxx.html?id=xxx"`

### 7.4 版本记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-06-04 | 雷达历史功能初版 | RADAR_HISTORY叠加复选框+历史卡片 |
| 2026-06-05 | v2.0 | 评分标准文档发布 |
| 2026-06-07 | v26 | 增强雷达图功能上线（渐变/发光/时间轴/对比模式） |
| 2026-06-07 | v26 | radar_detail.html 完整迁移3个月真实数据 |
| 2026-06-07 | v26 | radar_hub.html 升级为真实ECharts六维雷达图 |