# 受保护文件清单与防回滚说明

## 概述

本文档列出项目中**手工维护、不能被自动化脚本回滚**的关键文件，以及防护机制说明。

## 受保护文件

### 1. `index_v3.html` - 早报首页（甘特图）

**保护级别**：🔴 高危 - 手工维护

**当前版本**：`20260602_1130`

**保护机制**：
- HTML 内有版本号标记：`<meta name="html-version" content="20260602_1130">` 和 `window.HTML_VERSION = '20260602_1130'`
- 甘特图逻辑（`addCumulativeBarsGantt` 函数）已修复为：动态从 `price_series` 计算涨跌幅，禁用 `marketData` 覆盖
- **任何脚本不应重写此文件**（除非明确知道自己在做什么）

**风险脚本**：无（当前没有脚本会重写 `index_v3.html`，只有 `fix_v3_links.py` 会修复链接，但不会回滚逻辑）

---

### 2. `reports/market_cumulative.json` - 甘特图数据源

**保护级别**：🟡 中危 - 有验证保护

**当前状态**：8个产品，最后更新 2026-06-02

**保护机制**：
- **价格验证**：`generate_market_cumulative.py` 和 `update_market_cumulative_lc.py` 都有价格合理性验证，异常数据会被拒绝
- **时间戳标记**：`meta.generated_at` 字段记录最后生成时间，可用于检测回滚
- **版本标记**：`meta.generator_version` 字段记录生成脚本版本

**风险脚本**：
- `generate_market_cumulative.py` - 已修复 ✓（使用正确数据源，有价格验证）
- `update_market_cumulative_lc.py` - 已修复 ✓（有价格验证）

**检测回滚方法**：
```bash
# 检查 generated_at 时间戳
python -c "import json; d=json.load(open('reports/market_cumulative.json')); print(d['meta']['generated_at'])"
```

---

## 防护机制详解

### 机制1：价格验证（防止异常数据写入）

**脚本**：`generate_market_cumulative.py`、`update_market_cumulative_lc.py`

**规则**：
| 产品 | 最低价 | 最高价 | 单位 |
|------|--------|--------|------|
| 电池级碳酸锂 | 80,000 | 300,000 | 元/吨 |
| 工业级碳酸锂 | 70,000 | 250,000 | 元/吨 |
| 碳酸锂期货 | 80,000 | 300,000 | 元/吨 |
| 磷酸铁锂动力型 | 30,000 | 150,000 | 元/吨 |
| 磷酸铁锂储能型 | 30,000 | 150,000 | 元/吨 |
| 磷酸铁 | 8,000 | 40,000 | 元/吨 |
| 锂辉石 | 300 | 3,000 | 元/吨度 |
| 锂云母 | 2,000 | 20,000 | 元/吨 |

**效果**：如果脚本试图写入异常价格（如锂云母 2930 元/吨），会被拒绝并打印错误。

---

### 机制2：时间戳检测（发现回滚）

**文件**：`reports/market_cumulative.json`

**字段**：`meta.generated_at`（ISO 8601 格式时间戳）

**检测命令**：
```bash
python -c "
import json, datetime
d = json.load(open('reports/market_cumulative.json'))
print('最后生成时间:', d['meta']['generated_at'])
print('生成脚本版本:', d['meta'].get('generator_version', '未知'))
"
```

**如果 `generated_at` 是过去的时间**（比如今天是 2026-06-02，但 `generated_at` 显示 2026-05-20），说明文件被回滚了。

---

### 机制3：Git 跟踪（防止脚本丢失）

**已加入 Git 跟踪的脚本**：
- `generate_market_cumulative.py` ✓
- `update_market_cumulative_lc.py` ✓

**检查命令**：
```bash
git status  # 查看是否有未提交的修改
git log --oneline -- generate_market_cumulative.py  # 查看脚本修改历史
```

---

## 运维操作指南

### ✅ 可以安全运行的操作

1. **运行 `generate_market_cumulative.py`** - 只会更新3个产品（碳酸锂期货、电池级、工业级碳酸锂），有其他5个产品保持不变
2. **运行 `update_market_cumulative_lc.py`** - 只会更新2个产品（电池级、工业级碳酸锂）
3. **手动编辑 `reports/market_cumulative.json`** - 直接修改 JSON 文件（记得备份）

### ⚠️ 需要谨慎的操作

1. **从备份恢复 `index_v3.html`** - 必须先检查备份版本号是否 >= 当前版本（`20260602_1130`）
2. **运行任何未列出的 Python 脚本** - 先检查脚本内容，确认不会重写受保护文件

### ❌ 禁止的操作

1. **直接复制旧版本 `index_v3.html` 覆盖当前版本** - 会丢失甘特图修复
2. **运行旧版本 `generate_market_cumulative.py`**（无价格验证的版本）- 会写入异常数据

---

## 回滚应急方案

### 如果 `index_v3.html` 被回滚

1. 从 Git 恢复最新版本：`git checkout HEAD -- index_v3.html`
2. 或者从备份目录恢复：检查 `backups/` 目录中版本号 >= `20260602_1130` 的备份

### 如果 `market_cumulative.json` 被回滚

1. 从 Git 恢复：`git checkout HEAD -- reports/market_cumulative.json`
2. 重新运行 `generate_market_cumulative.py` 或 `update_market_cumulative_lc.py` 更新数据
3. 检查 `generated_at` 时间戳确认已修复

---

## 更新记录

| 日期 | 操作人 | 说明 |
|------|--------|------|
| 2026-06-02 | AI | 创建本文档，添加价格验证和时间戳保护 |
| 2026-06-02 | AI | 修复 `generate_market_cumulative.py` 和 `update_market_cumulative_lc.py`，添加价格验证 |
| 2026-06-02 | AI | 修复 `index_v3.html` 甘特图逻辑（动态计算涨跌幅） |

---

## 联系方式

如果发现文件被回滚或有疑问，请联系项目维护者。

**维护者**：AI Daily Report 项目团队
**最后更新**：2026-06-02
