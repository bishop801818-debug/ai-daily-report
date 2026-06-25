# index_v3.html 快照存档 - 2026-06-25 23:15

## 存档信息

- **存档时间**：2026-06-25 23:15:30 (GMT+8)
- **存档来源**：http://localhost:8888/（本地测试服务）
- **主页面版本**：HTML_VERSION = 20260625_1900
- **总大小**：约 84 MB
- **页面数**：17（1 主页面 + 16 子页面）
- **数据文件**：28 个 JSON
- **嵌入文件**：49 个（JSON + JS + 第三方库）

## 目录结构

```
_archive/index_v3_snapshot_20260625_231500/
├── html/                  # 17 个 HTML 页面（curl 实时下载）
├── data/                  # 28 个核心数据 JSON
├── embedded/              # 49 个嵌入数据/JS
├── SNAPSHOT_INFO.json     # 结构化元数据
└── README.md              # 本说明文档
```

## 包含的 HTML 页面

| 页面 | 来源URL | 大小 (bytes) |
|------|---------|---------------|
| index_v3.html（主页） | http://localhost:8888/index_v3.html | 1,524,729 |
| strategy_hub.html | http://localhost:8888/strategy_hub.html | 1,098,644 |
| analysis_hub.html | http://localhost:8888/analysis_hub.html | 19,187 |
| archive_v3.html | http://localhost:8888/archive_v3.html | 1,082,430 |
| automotive_data_v2.html | http://localhost:8888/automotive_data_v2.html | 212,624 |
| carbonate_data_v2.html | http://localhost:8888/carbonate_data_v2.html | 61,473 |
| database_hub.html | http://localhost:8888/database_hub.html | 28,854 |
| electrolyte_data_v2.html | http://localhost:8888/electrolyte_data_v2.html | 657,072 |
| help.html | http://localhost:8888/help.html | 37,441 |
| industry_news_embedded.html | http://localhost:8888/industry_news_embedded.html | 1,285,751 |
| lfp_data_v2.html | http://localhost:8888/lfp_data_v2.html | 59,967 |
| lib_battery_data_v2.html | http://localhost:8888/lib_battery_data_v2.html | 37,814 |
| policy_center_v4.html | http://localhost:8888/policy_center_v4.html | 131,553 |
| radar_hub.html | http://localhost:8888/radar_hub.html | 30,814 |
| recycling_data_v2.html | http://localhost:8888/recycling_data_v2.html | 57,076 |
| ternary_data_v2.html | http://localhost:8888/ternary_data_v2.html | 32,289 |
| toolbox.html | http://localhost:8888/toolbox.html | 36,325 |

## 子页面筛选说明

通过解析 index_v3.html 中的 `window.location.href` 和 `__NAV__.go()` 调用，识别出 16 个子页面：

**数据中心**（6 个）：
- carbonate_data_v2.html（碳酸锂）
- lfp_data_v2.html（磷酸铁锂）
- electrolyte_data_v2.html（电解液）
- ternary_data_v2.html（三元材料）
- recycling_data_v2.html（电池回收）
- lib_battery_data_v2.html（锂电池）
- automotive_data_v2.html（汽车）

**信息门户**（5 个）：
- database_hub.html（数据库中心）
- policy_center_v4.html（政策中心）
- industry_news_embedded.html（行业新闻）
- analysis_hub.html（分析中心）
- strategy_hub.html（战略中心）
- radar_hub.html（雷达中心）

**辅助页面**（3 个）：
- archive_v3.html（归档）
- toolbox.html（工具箱）
- help.html（帮助）

## 关联数据文件（data/）

28 个 JSON 数据文件，覆盖以下业务领域：

### 价格数据
- carbonate_spot_price_merged.json（碳酸锂现货-合并）
- carbonate_spot_price_jin10.json（碳酸锂现货-jin10）
- phosphate_rock_price.json（磷矿石30%品位）
- phosphate_rock_price_jin10.json
- lepidolite_price_history.json（锂云母）
- lithium_ore_price.json / lithium_ore_price_history.json（锂辉石）

### 行业数据
- carbonate_all_data.json（碳酸锂总表）
- lfp_all_data.json（磷酸铁锂总表）
- electrolyte_all_data.json（电解液总表）
- ternary_all_data.json（三元材料总表）
- recycling_all_data.json（电池回收总表）
- automotive_all_data.json（汽车总表）
- lib_battery_all_data.json（锂电池总表）

### 业务辅助
- industry_chain.json（产业链）
- policy_center_data.json（政策中心数据）
- chart_data.json / extra_chart_data.json（图表数据）
- market_cumulative*.json（市场累计涨跌幅）
- report_2026-06-22.json（最新报告）
- search_tasks.json / self_data.json / temp_metals.json（任务管理）

## 嵌入文件（embedded/）

49 个嵌入数据/JS 文件：
- 各业务域 `_embedded_data.js`
- bu_matrix.js（事业部矩阵）
- policies*.json（政策数据）
- echarts.min.js（图表库）
- market_lc.json / market_lfp.json（市场行情）
- 历史快照 2026-05-07 ~ 2026-06-25

## 验证方法

```bash
# 1. 验证HTML下载完整性
ls -la _archive/index_v3_snapshot_20260625_231500/html/

# 2. 验证文件大小
du -sh _archive/index_v3_snapshot_20260625_231500/*/

# 3. 验证JSON结构
cat _archive/index_v3_snapshot_20260625_231500/SNAPSHOT_INFO.json | python -m json.tool
```

## 注意事项

1. **HTML 通过 curl 实时下载**：保证与浏览器访问完全一致
2. **数据/嵌入文件为快照复制**：保留存档时刻的最新状态
3. **页面与数据可能存在相对路径依赖**：恢复时需要保持目录结构一致
4. **本地Git存档**：本次存档在 `D:/trae/AI Daily report/.git` 中通过 `index_v3-snapshot-20260625-2315` 分支保存

## 元数据字段

详细结构见 `SNAPSHOT_INFO.json`，主要字段：
- `snapshot_time`：存档时间
- `main_page.html_version`：主页面版本号
- `page_details`：每个页面的URL和大小
- `data_files`：所有数据文件清单
- `source_url`：数据来源URL

---

**生成时间**：2026-06-25 23:15:30 (GMT+8)
**生成工具**：WorkBuddy 自动化任务
**关联任务**：index_v3.html 页面存档与Git提交
