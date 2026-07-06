# 法恩莱特专属报告 — 运维手册

>适用版本：v32+
> 最后更新：2026-06-08
> 关联文件：`D:\buddy\skills\lithium-analysis-report\SKILL.md` 第九章

---

## 一、文件结构

```
D:\buddy\skills\lithium-analysis-report\
├── generate_felt_report.py # Phase A：结构化数据自动替换
├── fill_felt_narrative.py      # Phase B：叙事段落生成
├── events_brief.json # 行业事件简报（extract_events.py 产出）
├── felt_diagnostic_data.json   # 法恩莱特诊断数据（每月更新）
└── electrolyte_embedded_data.js # 电解液行业数据库（每月更新）

D:\trae\AI Daily report\
├── felt_report_YYYYMM.html     # 月度报告输出
├── _archive/versions/ # 版本存档
└── _docs/felt-report-operations.md  # 本文档
```

---

## 二、每月生成流程

```
┌─────────────────────────────────────────────────────┐
│  Step 0：数据准备（每月初，必须先完成）                │
│   ① 更新 electrolyte_embedded_data.js 最新月份       │
│   ② 更新 felt_diagnostic_data.json months["YYYY-MM"] │
│   ③ python extract_events.py electrolyte --month YYYY-MM --days 90 │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│  Step 1：Phase A — 结构化数据替换 │
│   python generate_felt_report.py --month YYYY-MM --skip-events  │
│   模板：_archive/versions/felt_report_202604_v20260608.html    │
│   输出：felt_report_YYYYMM.html（47处自动替换）        │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│  Step 2：Phase B — 叙事生成（可选，AI 辅助）          │
│   python fill_felt_narrative.py --month YYYY-MM      │
│   输出：narrative_YYYYMM.json（约42,000字叙事结构）   │
│   AI 读取 JSON → 润色 → 手动填入 HTML 对应位置        │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│  Step 3：存档 │
│   cp felt_report_YYYYMM.html _archive/versions/felt_report_YYYYMM_vYYYYMMDD.html  │
└──────────────────────┬──────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────┐
│  Step 4：验证 │
│   http://localhost:8888/felt_report_YYYYMM.html │
└─────────────────────────────────────────────────────┘
```

---

## 三、数据更新清单

### 3.1 felt_diagnostic_data.json（必须）

**文件路径**：`D:\buddy\skills\lithium-analysis-report\felt_diagnostic_data.json`

**每月操作**：在 `months` 对象中追加 `months["YYYY-MM"]` 节点，结构如下：

```json
{
  "months": {
    "YYYY-MM": {
      "kpi": {
        "sales_actual": 4115,
        "sales_budget": 7795,
        "revenue_actual": 9758,
        "gross_margin_actual": -3.2,
        "net_profit_actual": -549,
        "net_profit_ytd": -2427,
        "cash_flow_actual": 3576,
        "receivable_rate_actual": 68,
        "期货亏损": 1220
      },
      "bases": {
        "法恩": { "revenue": 0, "gross_margin_pct": 0, "net_profit": 0 },
        "湖南": { "revenue": 10000, "gross_margin_pct": -5.3, "net_profit": -2527, "four_expense_ratio_pct": 7.6, "cash_flow": 0 },
        "安徽": { "revenue": 0, "gross_margin_pct": 0, "net_profit": 0 },
        "广西": { "revenue": 0, "gross_margin_pct": 6.4, "net_profit": 341 }
      },
      "top_customers": [
        { "name": "多氟多", "sales": 1939, "revenue": 2667, "gross_profit": 3, "budget_rate": 153 },
        { "name": "宁德时代", "sales": 1200, "revenue": 2831, "gross_profit": -157, "budget_rate": 0 },
        ...
      ],
      "diagnosis": {
        "dimension_scores": {
          "sales_achievement": 53,
          "price_control": 30,
          "gross_margin": 0,
          "expense_control": 77,
          "cash_flow": 99,
          "receivable_rate": 62
        },
        "overall_status": "警示",
        "key_issues": [
          "客户集中度极高：多氟多/宁德/吉曜三客户合计占营收约68%",
          "期货端亏损严重：本年累计期货亏损1,220万",
          ...
        ],
        "positive_factors": [
          "多氟多强势增长：4月超预算153%",
          "六氟磷酸锂涨价可顺势调价",
          ...
        ]
      }
    }
  }
}
```

### 3.2 electrolyte_embedded_data.js（必须）

**文件路径**：`D:\trae\AI Daily report\electrolyte_embedded_data.js`

**每月操作**：在 `tables` 数组中追加当月数据行，重点表：

| 表名 | 必填字段 | 用途 |
|------|---------|------|
| `lfp_electrolyte_monthly` | 月份/产量/开工率/出口量/均价 | Part 2-5 |
| `lfp_electrolyte_top15` | 企业/产量/环比/开工率 | Part 2 TOP15 |
| `carbonate_monthly` | 月份/均价/月末价/期货收盘价 | Part 4 碳酸锂 |
| `lifophos_monthly` | 月份/产量/均价/产能 | Part 5 六氟磷酸锂 |

### 3.3 events_brief.json（自动）

**文件路径**：`D:\buddy\skills\lithium-analysis-report\events_brief.json`

**每月操作**：`extract_events.py` 自动从四个数据源提取、去重、归类，AI 无需手动维护。

---

## 四、脚本使用说明

### 4.1 generate_felt_report.py（Phase A）

```bash
# 基本用法（当月）
python generate_felt_report.py --month 2026-05

# 跳过事件提取（数据已存在）
python generate_felt_report.py --month 2026-05 --skip-events

# 完整流程（含事件提取）
python generate_felt_report.py --month 2026-05
```

**依赖**：
- `felt_diagnostic_data.json` 中必须有对应月份数据
- `electrolyte_embedded_data.js` 已更新
- 模板文件 `_archive/versions/felt_report_202604_v20260608.html` 存在

**输出**：`D:\trae\AI Daily report\felt_report_YYYYMM.html`

**替换项（共47处）**：

| 类别 | 替换内容 | 数量 |
|------|---------|------|
| KPI卡片 | 销量/毛利率/净利润/现金流数值 | 4 |
| 经营速览表 | 8行关键数据（销量/营收/毛利/净利/现金流/期货亏损/湖南净利/广西净利） | 8 |
| 三基地对比表 | 法恩/湖南/安徽/广西四栏数据 | 12 |
| 客户贡献图 | ECharts 7客户柱状图数据 | 7 |
| 雷达图 | 六维维度得分 + 评分表 | 6 |
| 诊断表 | 6维度评分行（逐行匹配） | 6 |
| 核心结论 | Part 7 banner段落 | 1 |
| 机会/风险 | 5条机会 + 5条风险列表 | 2 |
| 标题/日期 | 页面标题/数据月份/报告日期/数据提取时间 | 4 |

### 4.2 fill_felt_narrative.py（Phase B）

```bash
# 生成叙事 JSON
python fill_felt_narrative.py --month 2026-05

# 指定输出路径
python fill_felt_narrative.py --month 2026-05 --output narrative_202605.json
```

**输出**：`narrative_YYYYMM.json`（约42,000字）

**输出结构**：

```json
{
  "meta": { "target_month": "2026-05", "generated_at": "..." },
  "part1_行业动态": { "opening": "...", "themes": [...], "top_events": [...] },
  "part2_电解液市场": { "output_summary": "...", "demand_drivers": [...], "supply_drivers": [...] },
  "part3_添加剂溶剂": { "additive_summary": "...", "solvent_summary": "..." },
  "part4_碳酸锂": { "price_summary": "...", "cost_transmission": "..." },
  "part5_六氟磷酸锂": { "output_summary": "...", "price_summary": "..." },
  "part6_法恩莱特诊断": { "kpi_analysis": {...}, "base_analysis": {...}, "issues": [...], "positives": [...] },
  "part7_专属建议": { "opportunities": [...], "risks": [...], "actions": [...] }
}
```

**AI 使用方式**：AI 读取 JSON 后，在 Skill 中对每个 Part 的 `opening`/`summary`/`conclusion` 段落进行润色，然后手动填入 HTML 对应位置。

---

## 五、UI 样式规范

### 5.1 列表样式（`.felt-list-item`）

用于机会/风险/问题诊断/积极因素列表。

```css
.felt-list-item {
  font-size: 14px;
  color: var(--text-secondary);
  padding: 8px 0 8px 28px;
  line-height: 1.9;
  border-bottom: 1px solid var(--border-color);
  position: relative;
}
.felt-list-item strong { color: var(--text-color); font-weight: 600; }
.felt-list-item::before { content: '①②③④⑤⑥⑦'; } /* 固定宽度序号 */
```

**序号规则**：①②③④⑤（无顿号），序号与内容之间留空格。

### 5.2 紧急行动高亮（`.felt-action-urgent`）

用于行动建议中"本周内（紧急）"项。

```css
.felt-action-urgent {
  border-left: 3px solid var(--red) !important;
  background: rgba(198,40,40,0.04);
  padding: 8px 12px 8px 28px !important;
}
.felt-action-urgent strong { color: var(--red) !important; }
.felt-action-urgent::before { color: var(--red) !important; }
```

### 5.3 双栏布局

问题诊断与积极因素使用双栏 grid布局：

```css
.rec-card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 16px;
}
```

---

## 六、常见问题排查

### Q1：运行 `generate_felt_report.py` 提示 `[ERROR] 无法加载法恩莱特数据`

**原因**：`felt_diagnostic_data.json` 中没有对应月份数据。

**解决**：在 JSON 文件的 `months` 对象中添加 `months["YYYY-MM"]` 节点。参见 §3.1。

### Q2：运行 `fill_felt_narrative.py` 报错 `SyntaxError: invalid character`

**原因**：Python 解析 f-string 时遇到中文弯引号 `""` 误判为字符串边界（Windows CP936 编码问题）。

**解决**：已修复，脚本已添加 UTF-8 编码声明。若重现，运行：
```bash
python fix_quotes.py  # 自动修复弯引号
```

### Q3：Phase A 替换数量少于 47 处（出现 `未匹配` 项）

**原因**：模板文件 `felt_report_202604.html` 已被修改过，旧字符串已不存在。

**解决**：每次运行前从存档还原模板：
```bash
cp _archive/versions/felt_report_202604_v20260608.html felt_report_202604.html
```

### Q4：雷达图数据不正确

**原因**：`felt_diagnostic_data.json` 中 `dimension_scores` 的6 个维度值与模板不一致。

**解决**：确保 dimension_scores 包含：`sales_achievement / price_control / gross_margin / expense_control / cash_flow / receivable_rate` 六个 key。

### Q5：ECharts 客户柱状图无数据

**原因**：`top_customers` 数组为空或字段名不匹配。

**解决**：确保 `top_customers` 数组中每项有 `name / sales / revenue / gross_profit / budget_rate` 字段。

### Q6：Node.js 读取电解液数据库报错 `ENOENT`

**原因**：`electrolyte_embedded_data.js` 文件路径错误（空格/路径分隔符问题）。

**解决**：脚本已添加 `Path(...).resolve()` 处理，刷新后重试。

---

## 七、版本变更记录

| 版本 | 日期 | 变更内容 |
|------|------|---------|
| v32 | 2026-06-08 | Phase A/B 双脚本自动化完成；SKILL.md 第九章完整；存档规范化 |
| v31 | 2026-06-08 | 法恩莱特专属报告流程上线（generate_felt_report.py + SKILL.md 第九章） |
| v30 | 2026-06-08 | 电解液月报 Part 6 法恩莱特诊断板块上线（Tab7） |

---

## 八、相关文档

- [SKILL.md §九：法恩莱特事业部专属报告](../buddy/skills/lithium-analysis-report/SKILL.md#九法恩莱特事业部专属报告felt)
- [CHANGELOG.md v32+](CHANGELOG.md)
- [radar-history-feature.md：雷达图历史功能](../radar-history-feature.md)
- [six-dim-scoring-standard.md：六维评分标准](../six-dim-scoring-standard.md)