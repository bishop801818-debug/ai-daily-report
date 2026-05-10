# 双 AI 协作协议

> 适用场景：两个 AI 同时维护龙蟠信息中台
> 生成时间：2026-05-10

---

## 一、角色分工

### AI-1：数据侧

**职责**：
- 早报数据更新（MD → JSON）
- 市场数据维护（market_lc.json / market_lfp.json）
- 生成 8089 嵌入版（gen_embedded_all.py）
- 更新 reports/ 目录下的所有 JSON 数据文件

**可修改的文件**：
```
D:\buddy\md_to_json.py
D:\trae\AI Daily report\update_today.py
D:\trae\AI Daily report\embedded\gen_embedded_all.py
D:\trae\AI Daily report\reports\*.json
```

**禁止修改**：任何 `.html` 文件

---

### AI-2：前端侧

**职责**：
- 页面样式和功能修改
- 图表开发（ECharts / 3D图表等）
- 弹窗逻辑、交互优化
- UI/UX 改进

**可修改的文件**：
```
D:\trae\AI Daily report\*.html
D:\trae\AI Daily report\_docs\*
D:\trae\AI Daily report\*.bat
D:\trae\AI Daily report\*.py（除外 md_to_json.py / gen_embedded_all.py）
```

**禁止修改**：`D:\buddy\` 目录、`D:\trae\AI Daily report\reports\` 目录

---

## 二、协调机制

### 协调文件

在 `D:\trae\AI Daily report\reports\` 下放置 `collab_status.json`：

```json
{
  "version": "1.0",
  "data_ai": {
    "name": "AI-1",
    "status": "idle",
    "current_task": "",
    "started_at": ""
  },
  "frontend_ai": {
    "name": "AI-2",
    "status": "idle",
    "current_task": "",
    "started_at": ""
  },
  "last_updated": "2026-05-10T15:00:00"
}
```

### 操作前检查

每个 AI 开始任务前：

1. **读取** `D:\trae\AI Daily report\reports\collab_status.json`
2. **检查**对方状态是否 `idle`
3. 若对方是 `active`，等待或改期
4. 若对方是 `idle`，将自己的状态改为 `active` 并记录任务
5. **操作完成后**将自己的状态改回 `idle`

### 任务通知

当 AI-1 完成数据更新（生成新 JSON）后，**必须**：

1. 在 `collab_status.json` 记录完成时间和更新内容
2. 在 HANDOVER.md 或新建 `CHANGELOG.md` 中记录变更摘要：
   ```markdown
   ## 2026-05-10 AI-1 更新
   - 新增日期：2026-05-10（9BU全部）
   - 更新 market_lc.json
   - 同步 embedded/ 目录
   ```

这样 AI-2 可以随时查看变更历史。

---

## 三、工作流程示例

### AI-1 数据更新流程

```
1. 读取 collab_status.json → 确认 AI-2 状态为 idle
2. 更新 collab_status.json → AI-1 status: "active", task: "更新早报 2026-05-10"
3. 执行 py -3.12 update_today.py
4. 执行 py -3.12 embedded\gen_embedded_all.py
5. 更新 collab_status.json → AI-1 status: "idle", task: ""
6. 记录变更到 CHANGELOG.md
```

### AI-2 前端修改流程

```
1. 读取 collab_status.json → 确认 AI-1 状态为 idle
2. 更新 collab_status.json → AI-2 status: "active", task: "优化首页图表"
3. 备份：py -3.12 backup_quick.py
4. 修改 index_v3.html（或其他HTML）
5. 验证：http://localhost:8888/index_v3.html
6. 确认OK后：py -3.12 embedded\gen_embedded_all.py
7. 更新 collab_status.json → AI-2 status: "idle", task: ""
```

---

## 四、冲突处理

| 冲突情况 | 处理方式 |
|---------|---------|
| AI-1 发现 AI-2 状态是 active 但文件时间没变 | 等待 5 分钟后再检查 |
| AI-2 发现 AI-1 刚更新了 JSON | 重新加载最新数据再开始工作 |
| 两个 AI 同时发现对方 idle，同时开始 | 谁先更新 collab_status.json 谁优先 |
| AI-1 需要在 AI-2 修改中途更新数据 | 等 AI-2 完成后告知，优先协调 |

---

## 五、状态文件路径

```
D:\trae\AI Daily report\reports\collab_status.json   # 协调状态
D:\trae\AI Daily report\CHANGELOG.md                  # 变更记录（每次更新后追加）
```

---

## 六、快速检查命令

```bash
# 查看当前协作状态
type "D:\trae\AI Daily report\reports\collab_status.json"

# 查看最新变更
type "D:\trae\AI Daily report\CHANGELOG.md"
```

---

## 七、重要约定

1. **任何一方不得删除对方的文件**
2. **HTML 文件只归 AI-2 管，reports/ 只归 AI-1 管**
3. **每次修改前必须先看 collab_status.json**
4. **操作完成后必须更新 collab_status.json 和 CHANGELOG.md**
5. **重大变更（如新增页面、新增功能）需要双方确认**

---

*两个 AI 通过这份协议实现分工隔离，避免相互覆盖。协调核心是 collab_status.json 状态文件。*