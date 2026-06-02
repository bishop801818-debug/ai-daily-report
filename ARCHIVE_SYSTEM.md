# 信息中台存档体系文档
> 最后更新：2026-06-02（碳酸锂看板修复） | 状态：已锁定，15天内不更新

---

## 一、当前存档状态概览

### 7个数据库 + 看板 - 最终正确版本

| 数据库 | HTML页面 | embedded_data.js (根目录) | embedded/镜像 | 同步状态 | 最新数据月份 |
|--------|---------|--------------------------|--------------|----------|------------|
| 电解液 | [electrolyte_data_v2.html](electrolyte_data_v2.html) | 1,950,530 bytes | 1,950,530 bytes | ✅ 已同步 | 2026年1-4月 |
| 碳酸锂 | [carbonate_data_v2.html](carbonate_data_v2.html) | 4,002,731 bytes | 4,002,731 bytes | ✅ 已同步 | 2026年5月 |
| 碳酸锂看板 | [carbonate_charts.html](carbonate_charts.html) | 620行 | 620行 | ✅ 已同步 | 2026-05-27 |
| 磷酸铁锂 | [lfp_data_v2.html](lfp_data_v2.html) | 3,877,519 bytes | 不存在（无src引用） | ✅ 正常 | 2026年4月 |
| 三元材料 | [ternary_data_v2.html](ternary_data_v2.html) | 3,118,344 bytes | 3,118,344 bytes | ✅ 已同步 | 2026年4月 |
| 锂电池 | [lib_battery_data_v2.html](lib_battery_data_v2.html) | 636,158 bytes | 636,158 bytes | ✅ 已同步 | 2026年4月 |
| 回收行业 | [recycling_data_v2.html](recycling_data_v2.html) | 5,795,033 bytes | 5,795,033 bytes | ✅ 已同步 | 2026年4月 |
| 汽车行业 | [automotive_data_v2.html](automotive_data_v2.html) | 643,498 bytes | 643,498 bytes | ✅ 已同步 | 2026年4月 |

**注意**：磷酸铁锂 embedded/目录无 `lfp_embedded_data.js`，因为 embedded/lfp_data_v2.html 通过 `lfp_embedded_data.js`（在根目录）加载数据，设计如此。

### Git 提交历史（2026-06-02 修复链）

```
747a4a8 fix(carbonate_charts): 更新图表数据至embedded_data.js真实数据 (2026-04) ← 碳酸锂看板修复
2f28598 fix(electrolyte): 修复fieldMap空格/静态tbody/FEC日期/六氟年累字段显示问题
8a0c2de auto: 更新数据 2026-06-02
1b528ab sync: 同步embedded/目录至2026-06-02修复版本
c65239e fix: 修复6个数据库页面展示问题，2026-06-02数据恢复
cc73e36 docs: 建立存档体系文档 + 数据库完整性验证脚本
```

---

## 二、Git 是真正的存档介质

### 为什么 Git 是唯一可靠的存档？

所有文件（HTML + JS + embedded_data）都已推送到 GitHub：
- 远程：`https://github.com/bishop801818-debug/ai-daily-report.git`
- 当前分支：main，本地领先远程 1 个 commit（`2f28598`）
- **需要执行 `git push` 将本次修复推送到远程**

### 恢复方法（如果被未知脚本破坏）

```bash
# 1. 检测损坏
python verify_db_integrity.py

# 2. 从 Git 历史恢复（推荐）
git log --oneline | grep "2026-06-02\|fix.*数据库\|fix.*embedded"
git show <commit-hash> --stat | grep embedded_data  # 确认是正确的commit
git checkout <correct-commit-hash> -- *_data_v2.html *_embedded_data.js

# 3. 同步到 embedded/ 目录
cp *_embedded_data.js embedded/

# 4. 提交恢复
git add .
git commit -m "restore: 从Git历史恢复正确版本 (20260602)"
git push
```

---

## 三、受保护文件清单

以下文件**不得被回滚**，每次维护操作前必须验证：

### 3.1 核心数据库文件

#### 7个 embedded_data.js（数据源）
```
根目录: *_embedded_data.js (7个文件)
embedded/: *_embedded_data.js (6个，不含lfp)
```

**防回滚方法**：
- 运行 `python verify_db_integrity.py` 检查文件大小
- 大小偏差超过 5% 即为异常
- 异常时检查 `git status`，从正确的 commit 恢复

#### 7个 _data_v2.html（前端页面）
```
根目录: *_data_v2.html (7个文件)
embedded/: *_data_v2.html (7个文件)
```

**防回滚方法**：
- 比对文件大小（参见第一节表格）
- git log 确认提交时间是否为 2026-06-02 之后

### 3.2 特殊保护文件

| 文件 | 保护级别 | 验证方法 |
|------|---------|---------|
| `index_v3.html` | 高 | `window.HTML_VERSION === '20260602_1130'` |
| `reports/market_cumulative.json` | 高 | `meta.generator_version === '20260602_v2'` |
| `GOLDEN_VERSION.txt` | 中 | `git log` 最新提交 |

### 3.3 禁止操作清单

❌ **绝对禁止**：
1. 运行 `generate_all_embedded_data.py`（从 Downloads 读取 Excel，会覆盖所有 7 个 embedded_data.js）
2. 运行 `regenerate_embedded.py`（同上）
3. 运行任何读取 `C:/Users/1/Downloads/*.xlsx` 的脚本
4. 手动将 `_20260602.*` 备份文件覆盖当前文件
5. `git checkout <旧commit> -- *_embedded_data.js`
6. 删除或修改 `embedded/` 目录结构

⚠️ **谨慎操作**：
- `git stash` 后再 pop，小心 stash 内容包含旧版本
- `git rebase -i` 可能导致历史丢失
- 在执行任何 Python 数据生成脚本前，先 `git status` 确认当前状态

---

## 四、验证脚本使用指南

### 4.1 verify_db_integrity.py（数据库完整性验证）

```bash
cd "D:/trae/AI Daily report"
python verify_db_integrity.py
```

**检查内容**：
1. 根目录 7 个 *_embedded_data.js 文件大小（±5% 容差）
2. embedded/ 目录 6 个 *_embedded_data.js 文件大小（±1% 容差）
3. 根目录 vs embedded/ 同步性
4. Git 提交历史（前5条）

**输出示例**：
```
[OK] electrolyte_embedded_data.js             OK: 1950530 bytes
[FAIL] embedded/lfp_embedded_data.js         文件不存在
...
[FAIL] 发现异常 - 可能被未知脚本覆盖，请立即检查！
```

### 4.2 什么时候运行？

- ✅ **每次修改数据前**（确保基线干净）
- ✅ **每次修改后**（验证修改未破坏其他文件）
- ✅ **发现页面数据异常时**（快速定位问题文件）
- ✅ **每次 `git pull` 后**（确认没有意外覆盖）
- ❌ **15天锁定期间不需要运行**（已确认无操作）

---

## 五、存档恢复流程（万一被破坏）

### 场景：假设某个 embedded_data.js 被未知脚本覆盖

```
步骤1: 运行验证脚本
  > python verify_db_integrity.py
  输出: [FAIL] lfp_embedded_data.js 大小异常: 预期 3877519 bytes, 实际 2345678 bytes

步骤2: 检查 git 状态
  > git status
  输出: M lfp_embedded_data.js  (有修改)

步骤3: 从正确的 commit 恢复
  > git checkout 2f28598 -- lfp_embedded_data.js

步骤4: 同步到 embedded/
  > copy lfp_embedded_data.js embedded\

步骤5: 验证恢复
  > python verify_db_integrity.py
  输出: [PASS] 所有检查通过

步骤6: 提交恢复
  > git add lfp_embedded_data.js
  > git commit -m "restore: lfp_embedded_data.js 从2f28598恢复"
  > git push
```

---

## 六、数据更新流程（重新开放后）

当 15 天锁定结束，需要重新更新数据时，**必须**按以下流程操作：

### 更新前
```bash
# 1. 验证当前完整性
python verify_db_integrity.py

# 2. 创建本次更新的存档快照
git add .
git commit -m "pre-update: 存档 20260602 版本"
git tag -a v20260602_final -m "数据冻结点 2026-06-02"
git push --tags
```

### 更新中
```bash
# 3. 只更新有变化的数据库
# 例如只更新碳酸锂：
python generate_all_embedded_data.py
# 检查哪些文件变化了
git diff --stat *_embedded_data.js
```

### 更新后
```bash
# 4. 验证
python verify_db_integrity.py

# 5. 提交
git add .
git commit -m "update: 更新数据至 YYYY-MM-DD"
git push
```

### 关键原则
- **永远不要运行 `generate_all_embedded_data.py`**（会覆盖全部 7 个）
- **按需更新**：只更新确实需要更新的数据库
- **验证优先**：修改前后的完整性验证不可跳过

---

## 七、关键脚本风险等级

| 脚本 | 风险 | 原因 | 建议 |
|------|------|------|------|
| `generate_all_embedded_data.py` | 🔴 极高 | 从 Downloads 读取 Excel，覆盖全部 7 个 embedded_data.js | 禁止运行 |
| `regenerate_embedded.py` | 🔴 极高 | 同上 | 禁止运行 |
| `sync_embedded_to_all_data.py` | 🟠 高 | 可能覆盖 HTML 文件 | 谨慎，确认参数 |
| `sync_to_8089.py` | 🟡 中 | 只同步到 8089，不影响主站 | 可用 |
| `update_today.py` | 🟠 高 | 从 Downloads 读取 | 谨慎 |
| `verify_db_integrity.py` | 🟢 安全 | 只读，不修改任何文件 | 随时运行 |
| `_rebuild_strategy.py` | 🟡 中 | 修改 strategy_hub.html，不碰数据文件 | 可用 |

---

## 八、存档架构图

```
GitHub (远程存档)
  └── bishop801818-debug/ai-daily-report.git
        └── main分支
              └── HEAD = 2f28598 (锁定点)
                    ├── *_data_v2.html (7个)
                    ├── *_embedded_data.js (7个)
                    └── embedded/
                          ├── *_data_v2.html (7个)
                          └── *_embedded_data.js (6个，无lfp)

本地工作目录 (D:/trae/AI Daily report/)
  ├── 20260602备份 (不上Git，只作本地参考)
  │     ├── 磷酸铁锂/lfp_embedded_data_20260602.js
  │     ├── 碳酸锂/carbonate_embedded_data_20260602.js
  │     └── ... (其他6个数据库)
  │
  ├── verify_db_integrity.py (验证脚本)
  │
  └── archive/
        ├── market-monitor-20260602/ (市场行情存档)
        └── strategy-dashboard-20260602/ (战略洞察存档)
```

---

## 九、快速参考命令

```bash
# 验证完整性
python verify_db_integrity.py

# 检查 git 状态（是否有未提交的修改）
git status --short | grep embedded_data

# 检查是否有旧的 generate 脚本被执行
git log --oneline -5 | grep -i "gen_all\|embedded\|auto.*数据"

# 从 Git 恢复单个文件
git checkout 2f28598 -- electrolyte_embedded_data.js

# 同步根目录到 embedded/
for f in *_embedded_data.js; do cp "$f" "embedded/$f"; done

# 查看当前所有 embedded_data.js 大小
for f in *_embedded_data.js; do echo "$f: $(wc -c < "$f")"; done
```

---

## 十、15天锁定期间禁止事项

1. ❌ 不运行任何读取 `C:/Users/1/Downloads/` 的 Python 脚本
2. ❌ 不执行 `generate_all_embedded_data.py`
3. ❌ 不执行 `regenerate_embedded.py`
4. ❌ 不手动将 `_20260602` 备份文件覆盖当前文件
5. ❌ 不运行 `git checkout <旧commit> -- *_data_v2.html`
6. ❌ 不运行任何数据库更新脚本
7. ⚠️ 若需修改 HTML 逻辑，先 `git status` 确认，修改后运行验证脚本

---

*本文件是存档体系的唯一权威文档。*
*如需修改存档体系，先修改本文档，再执行变更。*