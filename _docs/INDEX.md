# 龙蟠科技信息中台 · 文档索引

> 适用对象：接管/调整本平台的前端开发者和 AI 模型
> 生成时间：2026-05-06
> 当前数据状态：最新早报日期 2026-04-28（9BU全部）

---

## 文档结构

```
_docs/
├── OVERVIEW.md          ← 平台整体架构/文件结构/BU对照表
├── WORKFLOW.md          ← 日常更新流程/操作命令
├── TECH_SPEC.md         ← 关键技术方案（fetch override/嵌入版/日历修复）
├── RULES.md             ← 黄金法则/禁忌/版本号规范
├── MAP.md               ← 页面导航/跳转关系/访问地址
└── MD_SPEC.md           ← MD文件规范/JSON输出格式/BU_MAP
```

---

## 快速开始

### 日常更新早报（只需一步）

```bash
# 方法1（推荐）：一键更新，自动找MD文件
cd D:\trae\AI Daily report
py -3.12 update_today.py

# 方法2：手动指定日期
#   1. 编辑 D:\buddy\md_to_json.py 顶部配置（SRC_DIR / DATE_STR / WINDOW_START / WINDOW_END）
#   2. cd D:\buddy && py -3.12 md_to_json.py
```

### 启动服务器

```bash
# 双端口同时启动（开机自启）
D:\trae\AI Daily report\start_server_loop.bat

# 单独端口
cd /d "D:\trae\AI Daily report" && python -m http.server 8888
cd /d "D:\trae\AI Daily report\embedded" && python -m http.server 8089
```

### 生成8089嵌入版

```bash
cd D:\trae\AI Daily report
py -3.12 embedded\gen_embedded_all.py
```

---

## 访问地址

| 地址 | 用途 |
|------|------|
| `http://localhost:8888/index_v3.html` | 本地开发/测试（主） |
| `http://172.16.12.100:8089/index_v3.html` | 局域网正式访问（主） |
| `http://172.16.12.100:8089/index_v3_embedded.html` | 离线/备用嵌入版 |

---

## 核心数据文件

- **早报 JSON**：`D:\trae\AI Daily report\reports\YYYY-MM-DD.json`
- **日期索引**：`D:\trae\AI Daily report\reports\index.json`（`available_dates` 数组）
- **碳酸锂市场**：`D:\trae\AI Daily report\reports\market_lc.json`
- **磷酸铁锂市场**：`D:\trae\AI Daily report\reports\market_lfp.json`
- **政策数据**：`D:\trae\AI Daily report\reports\policies.json`

---

## 9个事业部（BU）对照表

| dept_id | 事业部 |
|---------|--------|
| lhy | 润滑油事业部 |
| kls | 可兰素事业部 |
| czly | 常州锂源事业部 |
| lpsd | 龙蟠时代事业部 |
| sdmd | 山东美多事业部 |
| sjld | 三金锂电事业部 |
| bych | 铂源催化事业部 |
| felt | 法恩莱特事业部 |
| dhx | 迪克化学事业部 |

---

## 重要约束（必读）

1. **黄金法则**：`hy-item-body` 永远不能设置 inline `display` 属性（`RULES.md`）
2. **HTML 版本号**：每次修改 HTML 后更新 `meta[name="html-version"]` 为当天日期
3. **Script 标签注入**：HTML 中注入 `<script>` 块时，必须用 `';<' + '/script>'` 字符串拼接，不能直接写 `</script>`（`TECH_SPEC.md`）
4. **Python 文件读写**：Windows 下对 HTML/JSON 文件读写必须用 `newline=''`，否则 `\n` 会变成 `\r\n`，造成文件损坏
5. **历史记录弹窗日历**：默认月份由 JS `new Date()` 决定，部署后如果历史数据月份不是当月，需改 `index_v3_embedded.html` 中的 `calendarMonth` 全局变量

---

## 下一步

- 调整页面布局 → 阅读 `MAP.md` 了解页面结构
- 修改数据格式 → 阅读 `MD_SPEC.md` 了解输入输出规范
- 理解关键技术 → 阅读 `TECH_SPEC.md`
- 了解所有约束 → 阅读 `RULES.md`