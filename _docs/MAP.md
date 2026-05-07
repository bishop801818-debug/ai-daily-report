# 页面导航与文件结构

> 适用对象：前端开发者 / AI 模型，修改页面布局时快速定位文件
> 重点：每个页面的文件路径、核心函数、跳转关系

---

## 一、完整页面清单

| 文件 | 行数 | 说明 |
|------|------|------|
| `index_v3.html` | ~5795 | **首页**（9BU卡片 + 市场数据） |
| `dept-archive.html` | ~626 | 事业部历史存档 |
| `industry_news.html` | ~725 | 行业新闻（5维度Tab） |
| `policy_center_v4.html` | — | 政策中心 |
| `lfp_data_v2.html` | — | 磷酸铁锂数据库（12表） |
| `carbonate_data_v2.html` | — | 碳酸锂数据库（12表） |
| `lfp_charts.html` | — | LFP可视化图表 |
| `carbonate_charts.html` | — | 碳酸锂可视化图表 |
| `lfp_report.html` | — | LFP分析报告 |
| `carbonate_analysis.html` | — | 碳酸锂分析报告 |
| `database_hub.html` | — | 数据库导航（导航页） |
| `analysis_hub.html` | — | 分析报告导航（导航页） |
| `archive.html` | — | 历史存档 |
| `archive_v3.html` | — | 历史数据总览 |

---

## 二、首页（index_v3.html）核心结构

### 关键全局变量

```javascript
let departments = {};    // 当前页面9个BU数据（JSON对象）
let historyData = {};   // 历史索引 {available_dates: [...], ...}
let selectedDivision = null; // 当前选中事业部（弹窗用）
let currentReport = null;    // 当前报告数据（详情弹窗用）
let calendarYear = 2026, calendarMonth = 3; // 日历月份（嵌入版）
```

### 关键函数

| 函数 | 行位置 | 作用 |
|------|--------|------|
| `initDynamicData()` | — | 初始化动态数据（卡片渲染入口） |
| `openReport(divisionId, dateStr)` | — | 打开早报详情弹窗 |
| `renderHistoryList()` | — | 渲染历史日期列表 |
| `loadHistoryData()` | — | fetch index.json，触发 renderCalendar + renderHistoryList |
| `renderCalendar(cy, cm)` | — | 渲染日历（含月份导航） |
| `previousMonth()` | — | 上月（嵌入版已实现） |
| `nextMonth()` | — | 下月（嵌入版已实现） |
| `renderCategoryView(divisionId)` | — | 渲染分类视图（5维度切换） |
| `viewReport(date, divisionId)` | — | dept-archive 详情查看 |
| `renderRecentDays()` | — | 渲染最近日期快捷入口 |
| `filterByDateRange()` | — | 按日期范围筛选历史 |

### 弹窗结构

```html
<!-- 早报详情弹窗 -->
<div id="reportModal">
  <div class="report-header">...事业部标题...</div>
  <div class="report-content">
    <!-- 5维度Tab -->
    <div class="category-tabs">
      <button onclick="switchCategory('政策')">政策</button>
      <button onclick="switchCategory('竞品')">竞品</button>
      <button onclick="switchCategory('客户')">客户</button>
      <button onclick="switchCategory('前沿')">前沿</button>
      <button onclick="switchCategory('市场')">市场</button>
    </div>
    <div id="reportBody">
      <!-- hy-item 结构 -->
    </div>
  </div>
</div>

<!-- 历史记录弹窗 -->
<div id="historyModal">
  <div id="historyModalBody">
    <!-- 日历 + 最近日期 + 历史列表 -->
  </div>
</div>
```

### hy-item 结构（详情条目）

```html
<div class="hy-item" onclick="toggleItem(this)">
  <div class="hy-item-header">标题</div>
  <div class="hy-item-body">正文内容</div>  <!-- ⚠ display 由 CSS 控制 -->
</div>
```

---

## 三、事业部历史存档（dept-archive.html）

### 访问方式

```
http://localhost:8888/dept-archive.html?id=czly
http://172.16.12.100:8089/dept-archive.html?id=lhy
```

### 关键参数

| 参数 | 说明 |
|------|------|
| `id` | dept_id，如 `czly` / `lhy` / `kls` 等 |

### 核心函数

| 函数 | 作用 |
|------|------|
| `loadHistory()` | 读取指定 BU 所有历史日期 |
| `renderHistory(dates)` | 渲染历史日期网格 |
| `viewReport(date, divisionId)` | 查看某日详情 |

---

## 四、行业新闻（industry_news.html）

### 访问方式

```
http://localhost:8888/industry_news.html
```

### 核心逻辑

- 5维度 Tab：政策 / 竞品 / 客户 / 前沿 / 市场
- 遍历最近60天，汇总所有 BU 的对应维度
- 按 priority（P0/P1/P2）排序

### 核心函数

| 函数 | 作用 |
|------|------|
| `initNews()` | 初始化，加载60天数据 |
| `loadDayData(date)` | 逐日 fetch JSON |
| `renderNewsGrid(items)` | 渲染新闻卡片网格 |
| `filterByPriority(priority)` | 按优先级筛选 |

---

## 五、政策中心（policy_center_v4.html）

### 数据来源

fetch `reports/policies.json`

### 核心函数

| 函数 | 作用 |
|------|------|
| `loadPolicies()` | 加载政策 JSON |
| `renderPolicies(policies)` | 渲染政策列表 |

---

## 六、磷酸铁锂/碳酸锂数据库

### 数据文件

| 数据 | 文件 |
|------|------|
| LFP 全量数据 | `lfp_all_data.json` |
| 碳酸锂全量数据 | `carbonate_all_data.json` |

### 嵌入模式

- 嵌入版使用 `window.EMBEDDED_DATA` 内联
- 动态版使用 `window.__EMBEDDED__.lfpData` / `.carbonateData`

---

## 七、页面跳转关系

```
index_v3.html（首页）
  ├─ 导航栏「早报」→ 刷新首页
  ├─ 导航栏「历史」→ historyModal（弹窗）
  ├─ 导航栏「数据库」→ database_hub.html
  ├─ 导航栏「分析报告」→ analysis_hub.html
  ├─ 9BU卡片点击 → openReport(dept_id, date) → reportModal（弹窗）
  └─ 历史记录按钮 → historyModal（弹窗）

database_hub.html
  ├─ 磷酸铁锂数据库 → lfp_data_v2.html
  ├─ 碳酸锂数据库 → carbonate_data_v2.html
  ├─ LFP可视化 → lfp_charts.html
  ├─ 碳酸锂可视化 → carbonate_charts.html
  └─ 返回首页 → index_v3.html

analysis_hub.html
  ├─ LFP分析报告 → lfp_report.html
  ├─ 碳酸锂分析 → carbonate_analysis.html
  └─ 返回首页 → index_v3.html

dept-archive.html（独立页面，非弹窗）
  └─ 某日详情 → reportModal

industry_news.html（独立页面）
  └─ 某条新闻 → 详情弹窗
```

---

## 八、HTML 版本号位置

每个 HTML 文件 `<head>` 区域：

```html
<meta name="html-version" content="20260506">
```

当前（2026-05-06）：`content="20260506"`