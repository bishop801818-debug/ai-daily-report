# 电解液月度分析报告 Skill

> 版本：v1.0
> 适用：法恩莱特事业部（FELT）
> 目标月份：2026年4月（基本面数据），前瞻部分可引用5月数据
> 生成方式：Skill-based + 数据脚本，不直接 AI 写作原始数据

---

## 一、报告结构（6章节）

| 章节 | 标题 | 数据来源 | 核心输出 |
|------|------|----------|----------|
| Part 1 | 行业动态与市场热点 | 行业新闻 + 政策数据 | 事件摘要 + 经营判断 |
| Part 2 | 电解液市场月度分析 | electrolyte_embedded_data.js Table[0/2/3/13/21/22] | 产量/价格/出口 + 法恩莱特定位 |
| Part 3 | 添加剂与溶剂价格走势 | electrolyte_embedded_data.js Table[4-12] | VC/FEC/PS + EC/DMC/EMC价格 |
| Part 4 | 碳酸锂市场 | carbonate_embedded_data.js Table[6] | 月均价/趋势 + 传导分析 |
| Part 5 | 六氟磷酸锂市场 | electrolyte_embedded_data.js Table[15-16/23/25-27] | 产量/价格 + 格局演变 |
| Part 6 | 总结与建议 | 全部数据 + 行业新闻 | 机会/风险 + 行动建议 |

---

## 二、数据源规格

### 2.1 electrolyte_embedded_data.js

**解析方式**（文件有JSON边界bug，最后一个`}`缺失）：
```python
json_bytes = raw[22:154629+1]  # 起始:{ → 结尾:}
data = json.loads(json_bytes)
tables = data['tables']
```

**关键数据表**：

| Table索引 | 内容 | 用途 |
|-----------|------|------|
| Table[0] | 电解液行业整体产量（2023-01~2026-04，月度） | Part 2 行业总量 |
| Table[2] | 企业TOP15月度产量（2023-01~2026-04，月度） | Part 2 企业排名 |
| Table[3] | 企业TOP15年累产量（~2026年1-4月，年累） | Part 2 年累排名 |
| Table[4] | VC日度价格（~2026-05-21，当前2.75万元/吨） | Part 3 VC |
| Table[5] | FEC日度价格（~2026-05-21，当前2.63万元/吨） | Part 3 FEC |
| Table[6] | PS日度价格（~2026-05-21，当前2.90万元/吨） | Part 3 PS |
| Table[7] | EC溶剂日度价格（~2026-05-21，当前2.63万元/吨） | Part 3 EC |
| Table[8] | DMC溶剂日度价格（~2026-05-21，当前2.41万元/吨） | Part 3 DMC |
| Table[9] | EMC溶剂日度价格（~2026-05-21，当前3.85万元/吨） | Part 3 EMC |
| Table[13] | 电解液出口（2023-01~2026-04，月度） | Part 2 出口分析 |
| Table[15] | LiPF6月度产量（2023-01~2026-04，月度） | Part 5 产量数据 |
| Table[16] | LiPF6年累产量（~2026年1-4月，年累） | Part 5 年累产量 |
| Table[23] | LiPF6行业整体产量（2023-01~2026-04，月度） | Part 5 行业产量 |
| Table[25] | LiPF6日度价格（~2026-05-21，~13万元/吨，高端） | Part 5 |
| Table[26] | LiPF6日度价格（~2026-05-21，~16.5万元/吨，超高端） | Part 5 |
| Table[27] | LiPF6日度价格（~2026-05-21，~5.4万元/吨，工业级） | Part 5 |

### 2.2 carbonate_embedded_data.js

**解析方式**：
```python
# 标准 JSON 格式
data = json.load(open('carbonate_embedded_data.js', 'r', encoding='utf-8'))
# Table[6]: 碳酸锂日度价格（电池级99.5%），45行 April 2026 数据
# April 2026 均价: ~16.27万元/吨（4月1日15.2 → 4月末16.9）
```

### 2.3 行业新闻

**来源**：`http://localhost:8888/industry_news_embedded.html?dept=felt`
- 4月法恩莱特新闻：14条（2026-04-09 ~ 2026-04-29）
- 仅引用4月日期的新闻，禁止引用5月内容于正文（前瞻除外）

**来源**：`http://localhost:8888/policy_center_embedded_data.js`
- 解析：JSON边界 `raw[22:154629+1]`
- 4月政策：仅1条（2026-04-09 锂电行业研讨恳谈）

### 2.4 法恩莱特基础数据（固定值）

来自数据库（电解液DB 3月数据 + 4月早报）：
- **4月产量**：4,200吨（TOP15排名第12）
- **4月开工率**：14%（年产能36,000吨级）
- **年累产量**：17,800吨（排名第12）
- **年累开工率**：19%
- **定位**：出货量第12，开工率偏低（14%），反映新进入者爬坡期

---

## 三、生成流程

### Step 1：数据提取（extract）

运行 `electrolyte_extract.py`：
1. 解析 electrolyte_embedded_data.js（固定偏移量 22:154629）
2. 解析 carbonate_embedded_data.js（标准JSON）
3. 提取4月数据：2026-04 行
4. 提取4月末日度价格（最近日期行）
5. 输出 `electrolyte_april_data.json`

### Step 2：数据分析（analyze）

运行 `electrolyte_analyze.py`：
1. 计算环比（MoM）：4月 vs 3月
2. 计算同比（YoY）：4月 vs 2025年4月
3. 年累 vs 去年同期
4. 法恩莱特行业排名定位
5. 价格趋势分析（月均值 vs 日末值）
6. 输出 `electrolyte_april_analysis.json`

### Step 3：新闻筛选（news）

手动从 `industry_news_embedded.html?dept=felt` 提取4月新闻：
- 仅4月日期（2026-04-09 ~ 2026-04-29）
- 按重要性分级：A级（影响大）B级（重要）C级（一般）
- 输出 `felt_april_news.json`

### Step 4：AI撰写（prompt）

使用 `report_prompt.md` 唤起 AI，传入：
- `electrolyte_april_data.json`（数据）
- `electrolyte_april_analysis.json`（分析）
- `felt_april_news.json`（新闻）
- 法恩莱特基础数据

AI按6章节结构撰写，输出 Markdown。

### Step 5：HTML渲染

使用 `electrolyte_report.html` 模板：
1. 读取 Markdown 内容
2. 渲染为 HTML
3. 插入 ECharts 图表（柱状图/折线图）
4. 输出 `法恩莱特电解液月报_202604.html`

---

## 四、报告撰写规则

### 4.1 数据引用规则

- **正文**：4月数据（产量/价格/月均值）
- **前瞻**：可引用5月价格数据进行趋势外推
- **禁止**：正文引用5月产量数据进行分析
- **数据精度**：价格保留2位小数，产量保留整数

### 4.2 法恩莱特定位标注

每个章节必须包含法恩莱特定位：
```
【法恩莱特】4月产量4,200吨，排名行业第12，开工率14%，
年累17,800吨；出货量处于行业腰部，新产能爬坡期，
需重点关注开工率提升节奏与客户开拓进度。
```

### 4.3 重要性分级

- **A级**（头条）：六氟磷酸锂价格大幅波动（>10%）、重大政策变动
- **B级**（板块头条）：TOP3企业产量变化、出口大幅波动
- **C级**（板块正文）：一般价格变动、常规行业动态

### 4.4 行动建议规则

每条行动建议必须包含：
- **具体对象**：找谁、做什么
- **时间边界**：本周/本月/下次会议前
- **量化参考**：多少量/多少钱

---

## 五、文件清单

```
D:\trae\AI Daily report\
├── electrolyte_embedded_data.js         # 原始数据（只读）
├── carbonate_embedded_data.js          # 碳酸锂数据（只读）
├── industry_news_embedded.html         # 行业新闻（只读）
├── policy_center_embedded_data.js       # 政策数据（只读）
├── electrolyte_extract.py              # 数据提取脚本
├── electrolyte_analyze.py             # 数据分析脚本
├── electrolyte_april_data.json        # 提取结果
├── electrolyte_april_analysis.json    # 分析结果
├── felt_april_news.json               # 新闻数据
├── report_prompt.md                    # AI撰写Prompt
├── electrolyte_report.html             # HTML模板
└── 法恩莱特电解液月报_202604.html     # 最终报告
```

---

## 六、ECharts 图表配置

| 图表 | 类型 | 用途 |
|------|------|------|
| 电解液月度产量 | 柱状+折线组合 | 2024-01~2026-04行业总量+法恩莱特 |
| TOP15企业产量 | 横向柱状图 | 2026年4月企业排名（法恩莱特高亮） |
| 添加剂价格 | 多折线图 | VC/FEC/PS价格走势（近12个月） |
| 溶剂价格 | 多折线图 | EC/DMC/EMC价格走势（近12个月） |
| 碳酸锂价格 | 折线图 | 日度价格+月均线（2025-01~2026-04） |
| LiPF6价格 | 折线图 | 多规格价格对比（2025-01~2026-04） |
| LiPF6产量 | 柱状+折线 | 行业产量+月均价格 |

---

## 七、版本历史

- v1.0（2026-06-03）：初始版本，基于常州锂源磷酸铁锂月度报告Skill规范定制