# 受保护文件清单与防回滚说明

## 目的
本文档列出**不允许被回滚到旧版本**的关键文件，并提供检测和恢复方法。

---

## 受保护文件（禁止回滚）

### 1. `index_v3.html` - 前端主页面
- **当前版本**：`HTML_VERSION = 20260602_1130`
- **保护原因**：甘特图逻辑、价格验证、动态计算都已调试正确
- **禁止操作**：
  - ❌ 不允许从任何旧备份恢复此文件
  - ❌ 不允许运行 `rollback_by_version.py`（已删除）
  - ❌ 不允许手动复制旧版 `.backup`/`.olden` 文件覆盖

### 2. `reports/market_cumulative.json` - 市场行情数据
- **当前版本**：`generator_version: 20260602_v2`, `generated_at: 2026-06-02T11:46:54`
- **保护原因**：价格数据、涨跌幅计算都已修正
- **禁止操作**：
  - ❌ 不允许从任何旧备份恢复此文件
  - ❌ 不允许运行未验证的 `generate_market_cumulative.py`（必须有价格验证）
  - ❌ 不允许手动编辑 `change_pct` 字段（必须通过脚本计算）

---

## 如何检测文件被回滚

### 检测 `index_v3.html` 被回滚
```javascript
// 浏览器控制台执行
console.log(window.HTML_VERSION);
// 正常输出: "20260602_1130"
// 如果被回滚，会显示更旧的版本号（如 "20260511_1637"）
```

### 检测 `market_cumulative.json` 被回滚
```bash
python -c "
import json
d = json.load(open('reports/market_cumulative.json'))
print('generator_version:', d['meta']['generator_version'])  # 正常: "20260602_v2"
print('generated_at:', d['meta']['generated_at'])        # 正常: "2026-06-02T11:46:54"
print('products count:', len(d['products']))           # 正常: 8
"
```

**如果被回滚的迹象**：
- `generator_version` 不是 `20260602_v2`
- `generated_at` 是过去很久的时间（如 `2026-05-20`）
- `products count` 不是 `8`（可能只剩2个产品）

---

## 恢复方法（如果被回滚）

### 方法1：从 Git 历史恢复（推荐）
```bash
# 1. 找到正确的提交
git log --oneline | grep "cleanup: 彻底清理" | head -1

# 2. 从该提交恢复文件
git checkout <commit-hash> -- index_v3.html reports/market_cumulative.json

# 3. 提交恢复
git commit -m "restore: 从Git历史恢复受保护文件 (20260602)"
git push
```

### 方法2：从 `archive/` 目录恢复（备用）
```bash
# 1. 复制存档文件
cp archive/market-monitor-20260602/index_v3.html index_v3.html
cp archive/market-monitor-20260602/market_cumulative.json reports/market_cumulative.json

# 2. 提交恢复
git add index_v3.html reports/market_cumulative.json
git commit -m "restore: 从archive目录恢复受保护文件 (20260602)"
git push
```

---

## 预防措施（防止未来被回滚）

### ✅ 已实施的防护
1. **删除所有旧版备份文件**（2026-06-02 清理完成）
   - 删除了 `backup_clean_20260601_1431/` 目录
   - 删除了项目根目录所有旧版 `index_v3.html` (`.backup`/`.olden`/`.pre_rollback`)
   - 删除了 `backups/` 下所有备份目录
   - 删除了 `rollback_by_version.py` 和 `rollback_quick.py` 回滚脚本

2. **添加价格验证**（防止异常数据写入）
   - `generate_market_cumulative.py` 和 `update_market_cumulative_lc.py` 都有 `PRICE_VALIDATION` 字典
   - 如果脚本试图写入异常价格（如锂云母 2930 元/吨），会被拒绝

3. **添加版本标记**（方便检测回滚）
   - `market_cumulative.json` 包含 `meta.generated_at` 和 `meta.generator_version`
   - `index_v3.html` 包含 `window.HTML_VERSION`

### ⚠️ 仍需注意的风险点
1. **手动编辑文件** - 有人可能直接编辑 `index_v3.html` 或 `market_cumulative.json`
   - **防护**：定期检查 Git 历史，发现异常提交要及时回滚

2. **运行旧版脚本** - 有人可能运行项目外的旧版 `generate_market_cumulative.py`
   - **防护**：确保运行的脚本有 `PRICE_VALIDATION` 验证（查看脚本内容确认）

3. **从 Git 历史恢复错误版本** - 有人可能 `git checkout <old-commit> -- index_v3.html`
   - **防护**：恢复前先检查提交信息，确认是正确版本

---

## 应急联系
如果发现文件被回滚，请立即：
1. 运行检测命令（见上文）确认被回滚
2. 从 Git 历史或 `archive/` 目录恢复（见上文）
3. 提交恢复操作到 Git
4. 通知相关人员排查回滚原因

---

## 更新记录
- 2026-06-02: 创建文档，实施彻底清理（删除377个旧文件）
- 2026-06-02: 添加价格验证和版本标记保护
