# 平台整体架构

> 适用对象：接管/调整本平台的前端开发者和 AI 模型
> 重点：让新模型快速理解目录结构、数据流向、服务器架构

---

## 一、系统定位

龙蟠科技行业信息服务平台，展示9个事业部每日早报，覆盖润滑油、新能源锂电产业链信息。
目标：内部管理驾驶舱 + 外部合作伙伴行业洞察。

**不做的方向**：App、登录认证、移动端专项优化。

---

## 二、服务器架构

两个 Python `http.server` 实例，同一物理目录：

| 端口 | 访问地址 | 用途 | 启动方式 |
|------|---------|------|---------|
| 8888 | `http://localhost:8888/` | 本地开发/测试 | `start_server_loop.bat` |
| 8089 | `http://172.16.12.100:8089/` | 局域网正式访问 | `start_server_loop.bat` |

**根目录**：`D:\trae\AI Daily report`

**开机自启**：`C:\Users\1\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\龙蟠早报服务.lnk`
（调用 `start_server_loop.bat`，同时启动两个端口）

---

## 三、文件结构

```
D:\trae\AI Daily report\
├── index_v3.html                  # 【主入口】首页：9BU早报卡片 + 市场数据
│                                  #   关键函数：initDynamicData() / openReport() / loadHistoryData()
│                                  #   关键变量：departments (9BU数据) / historyData (历史索引)
│
├── dept-archive.html              # 事业部历史存档
│                                  #   关键函数：loadHistory() / renderHistory() / viewReport()
│
├── industry_news.html            # 行业新闻（5维度Tab，回溯60天）
│                                  #   关键函数：initNews() / loadDayData() / renderNewsGrid()
│
├── policy_center_v4.html          # 政策中心
│                                  #   关键函数：loadPolicies() / renderPolicies()
│
├── lfp_data_v2.html              # 磷酸铁锂数据库（12张表）
│                                  #   优先读取 window.EMBEDDED_DATA（嵌入版）或 window.__EMBEDDED__（通用）
│
├── carbonate_data_v2.html        # 碳酸锂数据库（12张表）
│                                  #   同上模式
│
├── lfp_charts.html               # LFP可视化图表
├── carbonate_charts.html         # 碳酸锂可视化图表
├── lfp_report.html               # LFP分析报告
├── carbonate_analysis.html       # 碳酸锂分析报告
├── database_hub.html             # 数据库导航
├── analysis_hub.html             # 分析报告导航
├── archive.html                  # 历史存档（简单版）
├── archive_v3.html               # 历史数据总览
│
├── reports/                      # 【核心数据目录】
│   ├── index.json                # 可用日期列表 {"available_dates": ["2026-04-03", ...]}
│   ├── 2026-04-03.json ~ 2026-04-28.json  # 每日早报（当前18个历史日期）
│   ├── market_lc.json            # 碳酸锂市场数据
│   ├── market_lfp.json           # 磷酸铁锂市场数据
│   └── policies.json             # 政策数据
│
├── embedded/                     # 【8089嵌入版】
│   ├── gen_embedded_all.py       # 一键生成脚本（生成所有 _embedded.html）
│   ├── index_v3.html             # 复制自根目录（用户的实际主入口）
│   ├── index_v3_embedded.html    # 嵌入所有历史数据，单文件可离线运行
│   ├── dept-archive_embedded.html
│   ├── industry_news_embedded.html
│   ├── policy_center_embedded.html
│   ├── lfp_data_embedded.html
│   ├── carbonate_data_embedded.html
│   ├── reports -> ../reports     # 符号链接（指向 ../reports）
│   ├── database_hub.html         # 静态复制
│   ├── analysis_hub.html         # 静态复制
│   ├── lfp_charts.html           # 静态复制
│   ├── carbonate_charts.html     # 静态复制
│   ├── lfp_report.html           # 静态复制
│   ├── carbonate_analysis.html   # 静态复制
│   ├── archive.html              # 静态复制
│   └── archive_v3.html           # 静态复制
│
├── update_today.py               # 每日一键更新脚本（自动查找MD文件夹）
├── start_server_loop.bat         # 同时启动 8888 + 8089
├── start_server_8089.bat         # 单独启动 8089
└── _docs/                        # 本文档集
```

---

## 四、数据流向

```
MD文件（C:\Users\1\Downloads\{日期}-9bu-reports\{日期}\）
    │
    ▼ md_to_json.py（D:\buddy\md_to_json.py）
    │
    ▼
reports/YYYY-MM-DD.json          ← index_v3.html fetch 读取
    │
    ▼ update_index() 自动追加
reports/index.json               ← loadHistoryData() 读取，用于日历高亮
```

---

## 五、9个事业部（BU）配置

| dept_id | 事业部 | 数据维度 |
|---------|--------|---------|
| lhy | 润滑油事业部 | 可变 |
| kls | 可兰素事业部 | 可变 |
| czly | 常州锂源事业部 | 5维 |
| lpsd | 龙蟠时代事业部 | 5维 |
| sdmd | 山东美多事业部 | 5维 |
| sjld | 三金锂电事业部 | 5维 |
| bych | 铂源催化事业部 | 可变 |
| felt | 法恩莱特事业部 | 5维 |
| dhx | 迪克化学事业部 | 可变 |

5维：政策 / 竞品 / 客户 / 前沿 / 市场

---

## 六、关键脚本文件

| 文件 | 位置 | 作用 |
|------|------|------|
| `md_to_json.py` | `D:\buddy\` | MD → JSON，核心数据生成 |
| `update_today.py` | `D:\trae\AI Daily report\` | 每日一键更新入口 |
| `gen_embedded_all.py` | `D:\trae\AI Daily report\embedded\` | 生成8089嵌入版 |

---

## 七、每日数据量

- 当前历史日期：18个（2026-04-03 至 2026-04-28）
- 每日期 JSON 大小：约 50-200KB
- 首页 HTML 大小：约 1.3MB（全部内联，无外部JS/CSS依赖）