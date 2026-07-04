# 锂矿石价格数据更新工作流程（v2 - 同花顺数据源）

## 📋 概述

本文档描述如何使用**同花顺iFind**数据源自动更新锂辉石和锂云母价格数据。

**版本历史**：
- v1 (旧) ：使用Mysteel数据源 → ❌ 数据源更新滞后，锂云母数据停留在2026-03-12
- v2 (新) ：使用同花顺iFind数据源 → ✅ 数据更新及时，支持自动发现

---

## 🔍 数据源详情

### 同花顺iFind

**数据格式**：直接提供**元/吨**价格（不需转换）

**更新频率**：每日更新（工作日）

**文章URL格式**：
```
http://goodsfu.10jqka.com.cn/YYYYMMDD/cXXXXXXXXX.shtml
```

**示例文章**：
- 锂云母（2%-2.5%）：`http://goodsfu.10jqka.com.cn/20260703/c677926290.shtml`
- 锂辉石（5%-5.5%）：`http://goodsfu.10jqka.com.cn/20260702/c677894937.shtml`

**页面内容包含**：
- 当日价格（元/吨）
- 历史价格表格（最近5个交易日）
- 价格涨跌和涨跌幅

---

## 🛠️ 脚本说明

### 1. `update_lithium_ore_tonghuashun.py` （核心脚本）

**功能**：接受命令行参数，更新锂辉石或锂云母的历史数据和最新数据文件

**使用方法**：
```bash
# 更新锂云母数据
cd "D:/trae/AI Daily report" && python update_lithium_ore_tonghuashun.py --commodity lepidolite --date 2026-07-04 --price 5100 --url "http://goodsfu.10jqka.com.cn/20260704/cXXXXXXXXX.shtml"

# 更新锂辉石数据
cd "D:/trae/AI Daily report" && python update_lithium_ore_tonghuashun.py --commodity spodumene --date 2026-07-04 --price 15550 --grade "5.0-5.5%" --url "http://goodsfu.10jqka.com.cn/20260704/cXXXXXXXXX.shtml"
```

**参数说明**：
- `--commodity`：商品类型（`lepidolite` = 锂云母，`spodumene` = 锂辉石）
- `--date`：日期（格式：YYYY-MM-DD）
- `--price`：价格（元/吨，整数）
- `--url`：文章URL（可选）
- `--grade`：品位（可选，覆盖默认值）

**更新文件**：
- `data/lepidolite_price_history.json` （锂云母历史数据）
- `data/lithium_ore_price_history.json` （锂辉石历史数据）
- `data/lithium_ore_price.json` （最新数据）

---

## 🤖 自动化任务

### 任务名称
`锂辉石锂云母价格数据自动更新（同花顺数据源）`

### 任务ID
`automation-1779788037620`

### 执行计划
每周一至周五，17:00 执行

### 执行流程（方案B）

1. **搜索同花顺文章**
   - 使用WebSearch搜索今日的同花顺锂云母/锂辉石价格文章
   - 搜索关键词：`锂云母精矿 2%-2.5% <今日日期> 同花顺 现货价格`

2. **解析文章提取价格**
   - 使用WebFetch解析文章页面
   - 提取信息：日期、价格（元/吨）、涨跌

3. **运行更新脚本**
   ```bash
   cd "D:/trae/AI Daily report" && python update_lithium_ore_tonghuashun.py --commodity <lepidolite|spodumene> --date <日期> --price <价格> --url "<文章URL>"
   ```

4. **验证更新结果**
   - 检查历史数据文件的最新记录日期和价格
   - 检查最新数据文件
   - 确认总记录数增加

5. **报告结果**
   - 报告更新是否成功
   - 报告最新价格数据
   - 如有错误，报告错误信息

---

## ⚠️ 注意事项

1. **非工作日跳过**：如果今日是周六或周日，自动化任务会自动跳过更新

2. **文章发现失败**：如果WebSearch未找到今日文章，会尝试搜索昨日或前日的数据

3. **品位确认**：
   - 锂云母：**2%-2.5%** （Li₂O:2%-2.5%）
   - 锂辉石：**5%-5.5%** （Li₂O:5%-5.5%）

4. **数据源失败处理**：如果同花顺数据源失败，记录错误并跳过更新（不会使用旧数据覆盖）

---

## 📂 文件清单

### 新脚本（同花顺数据源）
- ✅ `update_lithium_ore_tonghuashun.py` - 统一更新脚本（锂辉石+锂云母）

### 旧脚本（Mysteel数据源，已弃用）
- ⚠️ `fetch_lithium_ore_price.py` - 已添加弃用警告
- ⚠️ `update_lithium_lepidolite_history.py` - 已添加弃用警告
- ⚠️ `update_lepidolite_from_ifind.py` - 已添加弃用警告

### 数据文件
- `data/lithium_ore_price.json` - 最新数据（锂辉石+锂云母）
- `data/lithium_ore_price_history.json` - 锂辉石历史数据
- `data/lepidolite_price_history.json` - 锂云母历史数据

---

## 🔧 故障排除

### 问题1：WebSearch未找到今日文章
**可能原因**：
- 今日是非工作日（周六、周日）
- 同花顺尚未发布今日文章（通常在12:00前发布）

**解决方案**：
- 检查日期是否为工作日
- 手动访问同花顺网站确认文章是否已发布
- 尝试搜索昨日或前日的数据

### 问题2：脚本更新失败
**可能原因**：
- 日期已存在（脚本会跳过）
- 数据文件格式错误
- 权限问题

**解决方案**：
- 检查数据文件的最新记录日期
- 手动运行脚本并查看错误信息
- 检查文件权限

### 问题3：自动化任务未执行
**可能原因**：
- 任务被暂停
- 执行时间未到
- 工作目录错误

**解决方案**：
- 检查自动化任务状态（使用 `/automation list` 命令）
- 手动触发任务执行（如果支持）
- 检查任务配置中的工作目录

---

## 📞 联系信息

如有问题或建议，请联系战略研究团队。

---

**文档版本**：v2.0  
**更新日期**：2026-07-04  
**作者**：AI助手
