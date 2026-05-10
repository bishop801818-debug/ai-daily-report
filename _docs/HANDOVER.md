# 龙蟠科技信息中台 · 完整交接文档

> 生成时间：2026-05-10
> 适用对象：接管本平台的 AI 模型或开发者
> 目标：即使没有历史会话记忆，也能独立完成全部日常维护工作

---

## 一、系统定位与目标

龙蟠科技行业信息服务平台，展示龙蟠9个事业部每日早报，覆盖润滑油、新能源锂电等产业链信息。
目标：内部管理驾驶舱 + 外部合作伙伴行业洞察。

**不做**：App、登录认证、移动端专项优化。

---

## 二、服务器架构（必须理解）

### 两个端口，各自独立

| 端口 | 访问地址 | 目录 | 用途 |
|------|---------|------|------|
| **8888** | `http://localhost:8888/` | `D:\trae\AI Daily report` | 本地开发/测试，所有修改在此验证 |
| **8089** | `http://172.16.12.100:8089/` | `D:\trae\AI Daily report\embedded` | 局域网正式访问，嵌入版独立运行 |

### 核心规则

- **8888 是主战场**：所有修改必须在 8888 上验证OK后再同步
- **8089 是备份兜底**：永远不要直接在 8089 上操作，被 gen_embedded_all.py 覆盖会丢失
- **两个端口共用同一源文件目录**，但 embedded/ 目录是独立的嵌入版
- **开机自启**：快捷方式 `C:\Users\1\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\龙蟠早报服务.lnk` 同时启动两个端口

---

## 三、文件结构总览

```
D:\trae\AI Daily report\
│
├── index_v3.html              ★ 首页主入口（9BU卡片 + 市场数据卡片 + 碳酸锂期货图 + LFP双线图）
├── dept-archive.html          ★ 事业部历史存档
├── industry_news.html        ★ 行业新闻（60天回溯，5维度Tab）
├── policy_center_v4.html      政策中心
├── lfp_data_v2.html           磷酸铁锂数据库（12张表）
├── carbonate_data_v2.html     碳酸锂数据库（12张表）
├── lfp_charts.html            LFP可视化图表
├── carbonate_charts.html      碳酸锂可视化图表
├── lfp_report.html             LFP分析报告
├── carbonate_analysis.html    碳酸锂分析报告
├── database_hub.html          数据库导航页
├── analysis_hub.html          分析报告导航页
├── archive.html               历史存档（简单版）
├── archive_v3.html            历史数据总览
│
├── reports/                   ★★★ 核心数据目录
│   ├── index.json             可用日期列表（所有可查看的历史日期）
│   ├── 2026-04-03.json        每日早报数据（当前18个历史日期）
│   ├── 2026-04-08.json
│   ├── ...
│   ├── 2026-04-28.json
│   ├── market_lc.json         碳酸锂市场数据
│   ├── market_lfp.json        磷酸铁锂市场数据
│   ├── policies.json          政策数据
│   ├── lfp_power_history.json LFP动力型历史价格
│   ├── lfp_storage_history.json LFP储能型历史价格
│   └── lc_futures_history.json 碳酸锂期货历史价格
│
├── embedded/                  ★★★ 8089嵌入版（独立运行，不依赖 reports/）
│   ├── gen_embedded_all.py    一键生成脚本（每次更新早报后必运行）
│   ├── index_v3.html          复制自根目录（用户的实际主入口）
│   ├── index_v3_embedded.html 嵌入所有历史数据，单文件可离线运行
│   ├── dept-archive_embedded.html
│   ├── industry_news_embedded.html
│   ├── policy_center_embedded.html
│   ├── lfp_data_embedded.html
│   ├── carbonate_data_embedded.html
│   ├── database_hub.html      静态复制
│   ├── analysis_hub.html      静态复制
│   ├── lfp_charts.html        静态复制
│   ├── carbonate_charts.html  静态复制
│   ├── lfp_report.html        静态复制
│   ├── carbonate_analysis.html静态复制
│   ├── archive.html           静态复制
│   ├── archive_v3.html        静态复制
│   ├── 2026-04-28.json        今日数据（嵌入版使用）
│   └── index.json             可用日期索引
│
├── _docs/                     ★★★ 文档集（接手时必读）
│   ├── INDEX.md               主索引 / 快速开始
│   ├── OVERVIEW.md            平台架构 / 文件结构
│   ├── WORKFLOW.md            日常更新流程
│   ├── TECH_SPEC.md           关键技术方案（fetch override）
│   ├── RULES.md               黄金法则 / 禁忌
│   ├── MAP.md                 页面导航 / 核心函数
│   └── MD_SPEC.md             MD文件规范 / JSON格式
│
├── backups/                   检查点存档目录
│   └── checkpoint_YYYYMMDD_HHMMSS_标签/
│
├── _backup_YYYYMMDD/          每次备份生成的完整快照
│
├── update_today.py             每日一键更新脚本
├── backup_quick.py            快速备份脚本
├── rollback_quick.py          按检查点回滚脚本
├── _do_backup.py              完整目录存档脚本（同步OneDrive）
│
├── start_server.bat           单独启动 8888
├── start_server_lan.bat       单独启动 8089
├── start_server_loop.bat      同时启动 8888 + 8089
├── 0-快速备份.bat
└── 2-一键回滚.bat
```

---

## 四、9个事业部（BU）配置

| dept_id | 事业部 | 数据维度 |
|---------|--------|---------|
| lhy | 润滑油事业部 | 可变（早期早报可能无5维） |
| kls | 可兰素事业部 | 可变 |
| czly | 常州锂源事业部 | 5维 |
| lpsd | 龙蟠时代事业部 | 5维 |
| sdmd | 山东美多事业部 | 5维 |
| sjld | 三金锂电事业部 | 5维 |
| bych | 铂源催化事业部 | 可变 |
| felt | 法恩莱特事业部 | 5维 |
| dhx | 迪克化学事业部 | 可变 |

**5维**：政策 / 竞品 / 客户 / 前沿 / 市场
锂电相关BU（czly/lpsd/sdmd/sjld/felt）强制5维；非锂电BU（lhy/kls/bych/dhx）维度可自定义。

---

## 五、日常维护流程

### 5.1 每日更新早报（最常用）

```bash
# 推荐：一键更新（自动查找MD文件夹）
cd D:\trae\AI Daily report
py -3.12 update_today.py

# 备用：手动指定
# 1. 编辑 D:\buddy\md_to_json.py 顶部配置（SRC_DIR / DATE_STR / WINDOW_START / WINDOW_END）
# 2. cd D:\buddy && py -3.12 md_to_json.py
```

**输出**：新增 `D:\trae\AI Daily report\reports\YYYY-MM-DD.json` + 更新 `index.json`

### 5.2 生成8089嵌入版（每次更新早报后必须）

```bash
cd D:\trae\AI Daily report
py -3.12 embedded\gen_embedded_all.py
```

- 读取 `reports/` 下所有 JSON
- 生成 `embedded/` 下所有 `_embedded.html` 文件
- 覆盖同名文件（不删除）
- 运行后 8089 服务器自动读取最新内容

### 5.3 修改页面样式/功能

**流程**：
1. 备份：`cd D:\trae\AI Daily report && py -3.12 backup_quick.py`
2. 修改 8888 上的文件
3. 验证：http://localhost:8888/index_v3.html
4. 确认OK后运行 `py -3.12 embedded\gen_embedded_all.py` 同步到 8089

### 5.4 出问题时的回滚

```bash
cd D:\trae\AI Daily report && py -3.12 rollback_quick.py
```
选择之前的检查点，恢复所有文件。检查点列表在 backups/ 目录。

---

## 六、关键脚本详解

### md_to_json.py（D:\buddy\）

**作用**：将飞书下载的 MD 文件转换为前端可用的 JSON

**输入**：MD 文件夹 `C:\Users\1\Downloads\{日期}-9bu-reports\{日期}\`
- 01-润滑油事业部.md
- 02-可兰素事业部.md
- 03-常州锂源事业部.md
- ...（共9个）

**输出**：`D:\trae\AI Daily report\reports\{日期}.json`

**核心配置（顶部）**：
```python
SRC_DIR = Path(r"C:\Users\1\Downloads\{日期}-9bu-reports\{日期}")
OUT_DIR = Path(r"D:\trae\AI Daily report\reports")
DATE_STR = "{日期}"
WINDOW_START = "{前两天}"    # 内容回溯起始日
WINDOW_END = "{前一天}"       # 内容回溯截止日
```

### gen_embedded_all.py（D:\trae\AI Daily report\embedded\）

**作用**：将所有数据嵌入 HTML，单文件可离线运行

**输入**：reports/ 目录所有 JSON

**输出**：embedded/ 下各 `_embedded.html` 文件

### update_today.py（D:\trae\AI Daily report\）

**作用**：每日一键更新入口，自动查找 MD 文件夹并调用 md_to_json.py

**逻辑**：
1. 在 `C:\Users\1\Downloads` 查找 `{今天日期}-9bu-reports` 文件夹
2. 若今天不存在，向前搜索最近7天内最新的文件夹
3. 调用 md_to_json.py 生成 JSON
4. 更新 reports/ 下的 JSON 和 index.json

---

## 七、首页（index_v3.html）核心结构

### 关键全局变量

```javascript
let departments = {};      // 当前页面9个BU数据（从JSON加载）
let historyData = {};      // 历史索引 {available_dates: [...], ...}
let selectedDivision = null;  // 当前选中事业部（弹窗用）
let currentReport = null;     // 当前报告数据（详情弹窗用）
let calendarYear = 2026, calendarMonth = 3;  // 日历月份（嵌入版默认April）
```

### 关键函数

| 函数 | 作用 |
|------|------|
| `initDynamicData()` | 初始化动态数据，渲染卡片 |
| `openReport(divisionId, dateStr)` | 打开早报详情弹窗 |
| `loadHistoryData()` | fetch index.json，触发日历+历史列表 |
| `renderCalendar(cy, cm)` | 渲染日历（含月份导航） |
| `renderCategoryView(divisionId)` | 渲染分类视图（5维度切换） |
| `initLCChart()` | 加载并渲染碳酸锂期货SVG图 |
| `initLFPDualChart()` | 加载并渲染LFP动力型/储能型双线对比图 |

### 图表说明

- **碳酸锂期货**：SVG折线图，从 `reports/lc_futures_history.json` 加载数据
- **LFP动力型/储能型**：SVG双线对比图，从 `reports/lfp_power_history.json` 和 `reports/lfp_storage_history.json` 加载数据
- 两者均在 `window.addEventListener('DOMContentLoaded')` 时初始化

### 弹窗结构

- `reportModal`：早报详情弹窗（5维度Tab + hy-item展开）
- `historyModal`：历史记录弹窗（日历 + 日期列表）

---

## 八、黄金法则（必须遵守）

> 以下规则是踩坑踩出来的，违反必出问题。

### 法则1：`hy-item-body` 禁止 inline display

```javascript
// ❌ 错误：inline display:none 导致点击展开永远失效
el.style.cssText = 'display:none; font-size:14px; ...';

// ✅ 正确：display 由 CSS class 控制
el.style.cssText = 'font-size:14px; color:#555; ...';
```

**原因**：CSS specificity — inline style 优先级 > 所有外部 CSS class

### 法则2：HTML 注入 Script 块必须用字符串拼接

```javascript
// ❌ 错误
'<script>var x=1;</script>'

// ✅ 正确
'<script>var x=1;<' + '/script>'
```

**原因**：HTML 解析器以字面 `</script>` 关闭 script 块，与 JS 字符串转义无关。

### 法则3：Python 文件读写必须用 `newline=''`

```python
# ❌ 错误
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

# ✅ 正确
with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)
```

### 法则4：HTML 修改后更新版本号

每个 HTML `<head>` 区域有：
```html
<meta name="html-version" content="20260510">
```
每次修改后改为当天日期，确保浏览器缓存失效。

### 法则5：嵌入版日历月份需同步

`index_v3_embedded.html` 的 `calendarMonth` 全局变量必须与历史数据月份一致：
```javascript
let calendarYear = 2026, calendarMonth = 3; // 0-indexed, April
```

### 法则6：不主动修改政策模块

`policy_center_v4.html` 及相关政策数据处理逻辑不主动修改。

---

## 九、访问地址汇总

| 地址 | 用途 |
|------|------|
| `http://localhost:8888/index_v3.html` | 本地开发/测试（主） |
| `http://localhost:8888/dept-archive.html` | 事业部存档（本地） |
| `http://localhost:8888/industry_news.html` | 行业新闻（本地） |
| `http://localhost:8888/database_hub.html` | 数据库导航 |
| `http://172.16.12.100:8089/index_v3.html` | 局域网正式访问（主） |
| `http://172.16.12.100:8089/index_v3_embedded.html` | 离线/备用嵌入版 |

---

## 十、服务器操作命令

```cmd
:: 启动双端口（开机自启）
D:\trae\AI Daily report\start_server_loop.bat

:: 单独启动 8888
cd /d "D:\trae\AI Daily report" && python -m http.server 8888

:: 单独启动 8089
cd /d "D:\trae\AI Daily report\embedded" && python -m http.server 8089

:: 检查端口占用
netstat -ano | findstr 8089
netstat -ano | findstr 8888

:: 终止进程
taskkill /F /PID <进程ID>
```

---

## 十一、当前数据状态

- **最新早报日期**：2026-04-28（9BU全部）
- **历史日期数量**：18个（2026-04-03 ~ 2026-04-28）
- **每日期JSON大小**：约 50-200KB
- **首页HTML大小**：约 1.3MB（全部内联，无外部JS/CSS依赖）
- **index_v3.html 行数**：~7215行（git commit 56198f4）
- **悬浮按钮**：3D AI 龙蟠悬浮按钮（行2732附近）

---

## 十二、交接检查清单

接手后请按以下顺序确认：

- [ ] 启动服务器 `start_server_loop.bat`
- [ ] 访问 http://localhost:8888/index_v3.html 确认9个BU卡片正常显示
- [ ] 点击某BU卡片，确认弹窗正常展开（5维度 + hy-item点击展开）
- [ ] 打开历史记录弹窗，确认日历和日期列表正常
- [ ] 查看碳酸锂期货图和LFP双线图是否正常渲染
- [ ] 运行一次 `py -3.12 embedded\gen_embedded_all.py` 确认无报错
- [ ] 阅读 `_docs/` 目录下所有文档

---

## 十三、常见问题处理

| 现象 | 原因 | 解决 |
|------|------|------|
| 页面仍显示旧数据 | 浏览器缓存 | Ctrl+Shift+R |
| 9个BU卡片为空 | reports/index.json 不存在 | 检查 reports/ 目录 |
| 弹窗无法展开 | hy-item-body 被 inline display 覆盖 | 检查 RULES.md 法则1 |
| 8089无法访问 | 8089服务未启动 | 运行 `start_server_lan.bat` |
| 嵌入版数据不更新 | 未运行 gen_embedded_all.py | 运行该脚本后重启8089 |
| 页面空白/报错 | Python HTTP 服务器目录错误 | 确认从正确目录启动 |
| "未找到9bu-reports文件夹" | MD文件放错位置 | 确认在 `C:\Users\1\Downloads\{日期}-9bu-reports\` |

---

## 十四、重要文件路径速查

```
早报数据生成脚本：D:\buddy\md_to_json.py
一键更新脚本：D:\trae\AI Daily report\update_today.py
生成嵌入版脚本：D:\trae\AI Daily report\embedded\gen_embedded_all.py
首页主入口：D:\trae\AI Daily report\index_v3.html
核心数据目录：D:\trae\AI Daily report\reports\
备份脚本：D:\trae\AI Daily report\backup_quick.py
回滚脚本：D:\trae\AI Daily report\rollback_quick.py
文档目录：D:\trae\AI Daily report\_docs\
检查点存档：D:\trae\AI Daily report\backups\
双AI协作协议：D:\trae\AI Daily report\_docs\COLLAB_PROTOCOL.md
双AI协调状态：D:\trae\AI Daily report\reports\collab_status.json
```

---

## 十五、双 AI 协作（可选）

如果两个 AI 同时维护本平台，阅读 `COLLAB_PROTOCOL.md` 了解分工协议。

默认分工：
- **AI-1（数据侧）**：负责早报更新、市场数据、嵌入版生成，禁止修改 HTML
- **AI-2（前端侧）**：负责页面修改、图表开发，禁止修改 reports/ 目录

---

*本文档由 Claude 生成，整合了所有历史会话中的系统知识。如有疑问，请查阅 `_docs/` 目录下的详细文档。*