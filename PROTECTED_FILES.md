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
  - ❌ 不允许运行已删除的 `rollback_by_version.py`/`rollback_quick.py`
  - ❌ 不允许手动复制旧版 `.backup`/`.olden` 文件覆盖

### 2. `reports/market_cumulative.json` - 市场行情数据
- **当前版本**：`generator_version: 20260603_v3`, `generated_at: 2026-06-03T17:45:00`
- **保护原因**：价格数据、涨跌幅计算都已修正，是纯派生文件（运行脚本即可恢复）
- **禁止操作**：
  - ❌ 不允许从任何旧备份恢复此文件（旧版本只有2-3个产品，数据不完整）
  - ❌ 不允许手动编辑 `change_pct` 字段（必须通过脚本计算）
  - ❌ 不允许提交旧的 `market_cumulative.json` 到 Git（会覆盖正确数据）

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
print('generator_version:', d['meta']['generator_version'])  # 正常: "20260603_v3"
print('generated_at:', d['meta']['generated_at'])        # 正常: "2026-06-03T17:45:00"
print('products count:', len(d['products']))           # 正常: 8
print('product names:', [p['name'] for p in d['products']])  # 正常: 8个产品名称
"
```

**如果被回滚的迹象**：
- `generator_version` 不是 `20260603_v3`
- `generated_at` 是过去很久的时间（如 `2026-05-20`）
- `products count` 不是 `8`（可能只剩2-3个产品）
- `product names` 不包含 `锂辉石(5%)` 或 `锂云母(2.0-2.5%)`

---

## 恢复方法（如果被回滚）

### 方法1：运行 `generate_market_cumulative.py`（推荐，最快）
```bash
cd "D:/trae/AI Daily report"
python generate_market_cumulative.py
```
**原理**：`market_cumulative.json` 是纯派生文件，运行脚本会从源数据重新生成所有8个产品。

### 方法2：从 Git 历史恢复（备用）
```bash
# 1. 找到正确的提交
git log --oneline --all -- reports/market_cumulative.json | head -5

# 2. 从该提交恢复文件
git checkout <commit-hash> -- reports/market_cumulative.json

# 3. 提交恢复
git commit -m "restore: 从Git历史恢复market_cumulative.json (20260603)"
git push
```

### 方法3：从 `archive/` 目录恢复（最后备用）
```bash
# 1. 复制存档文件
cp archive/market-monitor-20260603/market_cumulative.json reports/market_cumulative.json

# 2. 提交恢复
git add reports/market_cumulative.json
git commit -m "restore: 从archive目录恢复market_cumulative.json (20260603)"
git push
```

---

## 预防措施（防止未来被回滚）

### ✅ 已实施的防护

#### 1. `market_cumulative.json` 已成为纯派生文件
- **原理**：运行 `generate_market_cumulative.py` 会从8个源数据文件重新生成所有产品
- **效果**：即使文件被回滚，运行脚本即可恢复，不依赖文件历史状态
- **验证**：检查 `meta.generator_version` 是否等于脚本中的 `GENERATOR_VERSION`

#### 2. `generate_market_cumulative.py` 添加版本检查和过期检测
- **版本检查**：如果 `market_cumulative.json` 的 `generator_version` ≠ 脚本 `GENERATOR_VERSION`，强制重新生成
- **过期检测**：如果 `generated_at` 超过24小时，强制重新生成（防止使用过期数据）
- **产品数量检查**：如果产品数 ≠ 8，强制重新生成

#### 3. Git 提交保护
- **已提交**：正确的 `market_cumulative.json` 已提交到 Git (`b011185`)
- **可恢复**：`git checkout HEAD -- reports/market_cumulative.json` 可快速恢复

#### 4. `PROTECTED_FILES.md` 文档
- **明确列出**：受保护文件和禁止操作
- **检测命令**：提供检测脚本，快速判断是否被回滚
- **恢复方法**：提供3种恢复方法，按优先级排序

### ⚠️ 仍需注意的风险点

#### 风险1：手动编辑文件
- **风险**：有人可能直接编辑 `reports/market_cumulative.json`（如手动修改 `change_pct`）
- **检测**：定期运行 `python -c "import json; d=json.load(open('reports/market_cumulative.json')); print(d['meta']['generated_at'])"` 检查生成时间
- **防护**：只允许通过 `generate_market_cumulative.py` 生成此文件

#### 风险2：运行旧版脚本
- **风险**：有人可能运行项目外的旧版 `generate_market_cumulative.py`（没有版本检查）
- **检测**：检查脚本开头是否有 `GENERATOR_VERSION = "20260603_v3"`
- **防护**：确保运行的脚本有版本检查逻辑（查看脚本第12行）

#### 风险3：从 Git 历史恢复错误版本
- **风险**：有人可能 `git checkout <old-commit> -- reports/market_cumulative.json`
- **检测**：恢复后运行 `python generate_market_cumulative.py` 验证（脚本会检测并重新生成）
- **防护**：恢复前先检查提交信息，确认是正确版本（提交信息应包含 `20260603`）

#### 风险4：回滚脚本不读取 `PROTECTED_FILES.md`
- **风险**：有人运行回滚脚本，脚本没有跳过受保护文件
- **检测**：检查回滚脚本是否读取 `PROTECTED_FILES.md`
- **防护**：修改回滚脚本，让它读取并跳过受保护文件（见下文"修改回滚脚本"）

---

## 修改回滚脚本（防止意外回滚受保护文件）

### 当前回滚脚本状态
- ❌ `rollback_by_version.py` - 已删除（2026-06-02）
- ❌ `rollback_quick.py` - 已删除（2026-06-02）
- ⚠️ `2-一键回滚.bat` - 仍在调用已删除的 `rollback_quick.py`（会报错）
- ⚠️ `0-快速备份.bat` - 存在，调用 `backup_before_edit.py`

### 需要修改的内容
1. **修改 `2-一键回滚.bat`** - 让它调用新的安全回滚脚本 `safe_rollback.py`
2. **创建 `safe_rollback.py`** - 读取 `PROTECTED_FILES.md`，跳过受保护文件
3. **修改 `backup_before_edit.py`** - 添加受保护文件检查（可选）

---

## 应急联系
如果发现文件被回滚，请立即：
1. 运行检测命令（见上文）确认被回滚
2. 运行 `python generate_market_cumulative.py` 重新生成（推荐方法1）
3. 提交恢复操作到 Git
4. 通知相关人员排查回滚原因

---

## 更新记录
- 2026-06-03: 更新文档，添加 `market_cumulative.json` 防回滚方案（纯派生文件 + 版本检查）
- 2026-06-02: 创建文档，实施彻底清理（删除377个旧文件）
- 2026-06-02: 添加价格验证和版本标记保护
