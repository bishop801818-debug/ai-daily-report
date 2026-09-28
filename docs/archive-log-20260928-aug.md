# 2026-09-28 14:30 本次存档清单

## git commit
- `9332caf19 chore(gating): 门禁基准刷新 66→70 页…`（实际包含本次全部 27 个业务文件 + `gated_baseline.json` 共 28 个；message 由 pre-commit gating 钩子改写）
- 本 commit `docs/archive-20260928-1430`：在 9332caf19 之上叠加语义说明

## 本次存档覆盖的资产

### A. 8 月月报（6 份新增）
| 文件 | 大小 | 主题色 | 库 |
|---|---|---|---|
| `carbonate_report_2026_08.html` | 64,805 B | 绿 #0a6e3f | 碳酸锂 |
| `lfp_report_2026_08.html` | 60,907 B | 蓝 | 磷酸铁锂 |
| `lib_battery_report_2026_08.html` | 50,957 B | 蓝 #1e3c72 | 锂电池 |
| `recycling_report_2026_08.html` | 68,253 B | 蓝 | 回收 |
| `felt_report_202608.html` | 62,098 B | 红 #c62828 | 电解液/法恩莱特 |
| `ternary_report_202608.html` | 63,101 B | 蓝 | 三元正极 |

> automotive 8 月未生成（最新仍是 `automotive_report_202607.html`），P1 待办。

### B. 数据库 7 库（修改）
- `lfp_data_v2.html`（4 sheets 补齐：FP 现货 +25 / 磷酸盐 +125 / 非磷原料 +275 / 分压实密度 +245；renderer 字段名 2 处 bug 修复；最新日期 09-24）
- `lfp_charts.html`（版本戳 bump）
- `lfp_all_data.json`（93K 行 delta）
- `carbonate_data_v2.html`（碳酸锂库归一 09-28 已确认）
- `carbonate_charts.html`（版本戳 bump）
- `carbonate_all_data.json`
- `carbonate_embedded_data.js`
- `ternary_data_v2.html` + `ternary_charts.html`
- `electrolyte_data_v2.html`
- `recycling_data_v2.html` + `recycling_charts.html`
- `lib_battery_data_v2.html` + `lib_battery_charts.html`
- embedded 副本同步：`embedded/carbonate_all_data.json` / `embedded/carbonate_embedded_data.js` / `embedded/lfp_all_data.json` / `embedded/lfp_embedded_data.js`

### C. 入口接线（新增 4 份）
- `analysis_hub.html`（ROOT + embedded）：8 月置 index=0 默认选中
- `database_hub.html`（ROOT + embedded）：8 月 `current:true`

## 重要修复
1. **碳酸锂 8 月月报**：10 个 `new Chart()` 必须包在 `<script>` 块里，否则 HTML 解析器忽略 → canvas 停 300x150（修后 byte 级一致 7 月）。
2. **碳酸锂 8 月月报**：f-string 字面 `+` 与 `:+.1f` 强制正负号同时使用 → `++13.6%` / `++0.6pct` 双 `+` bug。
3. **LFP renderer 字段名**：渲染器读 `今日最低价格` 但数据字段是 `今日最低价格（万元/吨）` → 恒显 0；`renderPriceDensity` 读 `密度` 但字段是 `压实密度` → 恒显 `-`。

## 本地存档副本
- `_archive/versions/20260928_aug_all/` （24 个业务文件，9.3 MB）
- `_archive/report_generators/_gen_carbonate_aug_20260928.py`（碳酸锂 8 月生成器）
- `_archive/versions/20260928_carbonate_aug/carbonate_report_2026_08.html`（碳酸锂 8 月报告快照）

## 未推送
- **未推 `origin`**（妙搭壳禁推）
- **未推 `gitee`**（用户未要求推送；公开镜像变更需用户明确决策）

## 关联
- skill `monthly-industry-report-html` 新增 2 条铁律（Chart.js 必须包 `<script>`、禁用 `:+.1f` 配字面 `+`）
- skill `database-base-pipeline` 已增铁律十五/十六（renderer 字段审计、宽表反向映射）
- 工作记忆 MEMORY.md 持续更新