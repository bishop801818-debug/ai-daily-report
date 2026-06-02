# 市场行情监控模块 - 存档快照

**存档时间**: 2026-06-02 11:44  
**存档原因**: 市场行情监控模块（甘特图）逻辑已调试正确，存档防止未来自动化脚本回滚

---

## 存档内容

| 文件 | 说明 |
|------|------|
| `index_v3.html` | 前端页面（甘特图渲染逻辑） |
| `market_cumulative.json` | 甘特图数据文件 |

---

## 版本信息

### index_v3.html
- **HTML_VERSION**: `20260602_1130`
- **关键逻辑**: `addCumulativeBarsGantt` 函数（约第9314行）
  - 动态从 `price_series` 计算涨跌幅（2026年首期 → 最新期）
  - 禁用 `marketData` 覆盖 `latestDate`/`latestPrice`
  - 右侧标签显示：起始价格 → 最新价格（日期范围）

### market_cumulative.json
- **generator_version**: `20260602_v2`
- **generated_at**: 2026-06-02T11:46:54.356554
- **产品数量**: 8个
- **价格验证**: 已启用（`PRICE_VALIDATION` 规则）

---

## 恢复方法

### 方法1：从存档恢复（推荐）
```bash
# 恢复 index_v3.html
cp archive/market-monitor-20260602/index_v3.html index_v3.html

# 恢复 market_cumulative.json
cp archive/market-monitor-20260602/market_cumulative.json reports/market_cumulative.json

# 提交到 Git
git add index_v3.html reports/market_cumulative.json
git commit -m "restore: 从存档恢复市场行情监控模块 (20260602)"
git push
```

### 方法2：从 Git 历史恢复
```bash
# 查看存档时间的提交
git log --since="2026-06-02 11:00" --until="2026-06-02 12:00" --oneline

# 恢复特定文件到该提交
git checkout <commit-hash> -- index_v3.html reports/market_cumulative.json
```

---

## 验证恢复是否成功

### 检查 index_v3.html 版本
```javascript
// 浏览器控制台执行
console.log('HTML_VERSION:', window.HTML_VERSION);
// 期望输出: "20260602_1130"
```

### 检查 market_cumulative.json 版本
```bash
python -c "
import json
d = json.load(open('reports/market_cumulative.json'))
print('generator_version:', d['meta']['generator_version'])
print('generated_at:', d['meta']['generated_at'])
print('products count:', len(d['products']))
"
# 期望输出:
# generator_version: 20260602_v2
# generated_at: 2026-06-02T11:46:54.356554
# products count: 8
```

### 检查甘特图显示
1. 打开 `http://localhost:8888/index_v3.html`
2. 滚动到"市场行情"板块
3. 确认甘特图显示：
   - 电池级碳酸锂: 120,000 → 177,000 (2026-01-04 ~ 2026-05-27)
   - 工业级碳酸锂: 106,500 → 165,000 (2026-01-04 ~ 2026-05-27)
   - 锂云母: 3,300 → 6,700 (2026-01-04 ~ 2026-05-24)

---

## 防回滚措施（已实施）

1. **价格验证** (`generate_market_cumulative.py`, `update_market_cumulative_lc.py`)
   - 异常价格会被拒绝（如锂云母 2930 元/吨）
   - 查看 `PRICE_VALIDATION` 字典了解合理价格范围

2. **时间戳检测** (`market_cumulative.json` 的 `meta.generated_at`)
   - 如果文件被回滚，`generated_at` 会显示旧时间
   - 定期检查：`python -c "import json; print(json.load(open('reports/market_cumulative.json'))['meta']['generated_at'])"`

3. **文档化** (`PROTECTED_FILES.md`)
   - 列出所有受保护文件和防回滚说明
   - 定期检查文件是否被修改

---

## 常见问题

### Q: 如何判断文件被回滚了？
**A**: 检查 `market_cumulative.json` 的 `generated_at` 字段。如果时间是过去很久的时间（如 2026-05-20），说明被回滚了。

### Q: 恢复后需要重启服务器吗？
**A**: 不需要。但浏览器需要硬刷新（`Ctrl+Shift+R` 或 `Ctrl+F5`）才能加载新版本。

### Q: 如果存档文件也坏了怎么办？
**A**: 从 Git 历史恢复（方法2），或手动重新调试（参考 `PROTECTED_FILES.md` 的"应急回滚方案"）。

---

**存档创建人**: AI Assistant  
**存档验证**: 已确认 `index_v3.html` 和 `market_cumulative.json` 逻辑正确
