
## v29 (2026-06-08)

**变更内容**:
- ✅ 根因定位：6月8日 ef3fd30 commit 错误将 `industry_news_embedded.html` 改为 `industry_news.html`，实际 embedded才是用户正确版本
- ✅ 删除废弃文件：根目录 `industry_news.html` + `embedded/industry_news.html`（git rm）
- ✅ 修复 `embedded/index_v3.html` 导航链接为 `industry_news_embedded.html`
- ✅ `embedded/index_v3.html` `window.__EMBEDDED__` 版本号更新至 `20260608_001`

**技术文件**: industry_news.html, embedded/industry_news.html, embedded/index_v3.html

**迁移说明**:
- 行业新闻正确URL: `industry_news_embedded.html`，`industry_news.html` 已不存在

---

## v28 (2026-06-08)

**变更内容**:
- ✅ industry_news_embedded.html 顶栏改为纯黑色(#111111)，替代原蓝渐变
- ✅ EMBEDDED_NEWS更新至6月5日数据：1525条（market+topnews），含333条6月数据
- ✅ embedded/industry_news_embedded.html 顶栏同步改为纯黑色
- ✅ index_v3.html 导航链接改为 industry_news_embedded.html（原industry_news.html）

**技术文件**: industry_news_embedded.html, embedded/industry_news_embedded.html, index_v3.html, industry_news_source/industry_news_clean.json

**迁移说明**:
- 无破坏性变更，数据源不变

---

## v27 (2026-06-08)

**变更内容**:
- ✅ policy_center_v4.html政策中心数据加载修复
  - 根本原因：6月2日重构后改为fetch动态加载，fetch失败时返回空数组导致页面无数据
  - 修复方案：将policies_source/policies_clean.json的67条政策内嵌为EMBEDDED_POLICIES
  - loadPoliciesJson优先使用内嵌数据，fetch作为备用（消除网络依赖）
  - 同步更新embedded/policy_center_v4.html的loadPoliciesJson函数
- ✅ 行业新闻导航修复（5处industry_news_embedded.html→industry_news.html）
- ✅ loadReportJSON增强：今日报告缓存标记/index.json fallback/占位报告防白屏

**技术文件**: policy_center_v4.html, embedded/policy_center_v4.html, index_v3.html

**存档**: _archive/policy_center_v4_20260608_before_embedded_fix.html

**迁移说明**:
- 无破坏性变更，数据源不变（仍是policies_source/policies_clean.json）

---

## v26 (2026-06-07)

**变更内容**:
- ✅ radar_detail.html 雷达图增强功能上线
  - 视觉：渐变线条（橙→深橙）、径向渐变填充、发光数据点、同色系渐变网格线
  - 交互：时间轴播放动画（▶播放按钮+pulse-glow动画+1800ms轮播）、月份点击同步时间轴进度
  - 功能：单对象/多对象对比模式切换（叠加3个月雷达图+80分基准线）
  - 图例：对比模式动态渲染3个月+基准线图例
  - 背景：三层同心圆装饰（同色系虚线边框）
- ✅ 运维框架升级v4.0：新增"第十章 雷达看板模块运维规范"
  - 数据结构（RADAR_HISTORY/RADAR_HISTORY_SDMD）
  - BU元数据定义（BU_META/BU_DIMS）
  - 评分标准（永久不变）
  - 每月数据更新流程
  - 快速检查清单 + 常见问题排查
- ✅ 雷达历史功能文档更新（_docs/radar-history-feature.md v26增强版）
- ✅ .gitignore：_docs/目录纳入版本控制（!_docs/!_docs/*）

**技术文件**: radar_detail.html, 运维框架.md, _docs/radar-history-feature.md, .gitignore

**存档**: _archive/radar_detail_v26_20260607_enhanced_radar.html →覆盖为v27品牌蓝完整版

**迁移说明**:
- 无破坏性变更

---

## v25 (2026-06-07)

**变更内容**:
- ✅ 山东美多雷达图迁移：radar_detail.html 完整迁移三个月真实数据
  - 六维雷达图（3/4/5月 dims真实值）
  - 核心KPI表（7项：收入/毛利/净利/回款/成本/合格率）
  - 维度详情Tab（D2销量/D3生产/D4技术/D5安全/D6组织 MoM环比）
  - 月份切换器（支持3月/4月/5月切换）
- ✅ radar_hub.html 山东美多评分更新为真实值（90分）
- ✅ radar_hub.html 卡片雷达图升级为真实 ECharts 六维雷达图
  - 9个BU全部使用 ECharts 渲染（替代 SVG 模拟图）
  - 各维度分数 chip标签 + ★当月标记
  - 窗口 resize 自适应重绘

**技术文件**: radar_detail.html, radar_hub.html

**迁移说明**:
- 无破坏性变更

---

## v24 (2026-06-05)

**变更内容**:
- ✅ 新增"雷达看板"模块：导航栏按钮 + Hub页 + 详情页
  - 导航栏新增"雷达看板"入口（竞品比对与市场行情之间）
  - `radar_hub.html`：9事业部卡片展示，带logo、名称、六维雷达图预览、综合评分
  - `radar_detail.html`：事业部详情页，含六维雷达图/KPI卡片/历史趋势三个Tab

**技术文件**: index_v3.html, radar_hub.html, radar_detail.html

**迁移说明**:
- 无破坏性变更，可直接使用

---

## v23 (2026-06-05)

**变更内容**:
- ✅ 导航栏：分析报告 → 行业分析，战略洞察 → 竞品比对
- ✅ analysis_hub.html 电解液卡片添加报告链接 → felt_report_202604.html
- ✅ 根目录大整理：300+ 文件归档至子目录，根目录保留87 个核心文件
  - `_archive/debug/` 调试/诊断/修复脚本（180+ 个）
  - `_archive/versions/` 历史版本HTML（40+ 个）
  - `_archive/server/` 服务器文件
  - `_archive/reports/` 过期PPTX
  - `_archive/scripts/` 辅助脚本
  - `data/` 大型数据JSON
  - `_docs/` 中文旧文档
  - 更新 .gitignore 适配新目录结构

**技术文件**: index_v3.html, analysis_hub.html, .gitignore

**迁移说明**:
- 无破坏性变更，所有文件已 Git 记录，可随时恢复

---

## v22 (2026-05-28)

**变更内容**:
- ✅ 去掉热点资讯右侧"更多"按钮
- ✅ 优化URL跳转功能（严格T-3校验+WebFetch链接有效性校验）
- ✅ 替代新闻机制（搜不到T-3内有效URL时，从同事业部今日关注中找替代）

**技术文件**: index_v3.html

**迁移说明**:
- 无破坏性变更，可直接使用

---

## v21 (2026-05-28)

**变更内容**:
- ✅ 集成Unsplash API到热点资讯轮播模块（9个事业部今日关注配图）
- ✅ 修复图片分辨率问题（small→regular，400px→1080px）
- ✅ 修复图片重复问题（excludeUrls机制，5张图完全不重复）
- ✅ 热点资讯接入真实数据（fetch 9个BU JSON，提取今日关注前5条）

**技术文件**: index_v3.html, index_v5_portal.html, database_hub.html, bu_hub.html, policy_center_v4.html, industry_news.html, help.html, toolbox.html, dept-archive.html

**迁移说明**:
- 无破坏性变更，可直接使用
- 所有9个子页面已同步存档

---

## v20 (2026-05-27)

**变更内容**:
- 页面底色改为亚麻色 #F1EDE3
- 战略中心信息中台、导航栏、市场行情监控、行情分类侧边栏底色同步改为 #F1EDE3
- 材料品种展示条（ticker）底色改为白色
- 集团矩阵外框底色改为 #F1EDE3，矩阵卡片改为白色

**迁移说明**:
- 无破坏性变更，可直接使用

---
# 变更记录 CHANGELOG

> 双 AI 协作变更历史，每次更新后追加

---

## v16 (2026-05-21) - index_v3.html 甘特图升级

**变更内容**:
- 交互升级: 点击行展开图表，再次点击收起（toggle交互）
- 视觉升级: 条形渐变填充（浅红→深红）、科技背景（网格线+渐变）、发光标签、分层阴影、6px圆角

**技术文件**: index_v3.html

---

## v4 (2026-05-21) - industry_news.html

**变更内容**:
- 同步存档 2026-05-21

**迁移说明**:
- 无破坏性变更，可直接使用

---


## v3 (2026-05-21) - policy_center_v4.html

**变更内容**:
- 同步存档 2026-05-21

**迁移说明**:
- 无破坏性变更，可直接使用

---


## v15 (2026-05-21) - index_v3.html

**变更内容**:
- 同步存档 2026-05-21

**迁移说明**:
- 无破坏性变更，可直接使用

---


## v14 (2026-05-21)

**变更内容**:
- ✅ 修复 panel-lithium 错误提前闭合导致锂辉石/锂云母在能源/化工板块重复显示
- ✅ 累积涨跌幅图表标题改为"磷酸铁锂产业2026年累计涨跌幅"
- ✅ 累积涨跌幅图表按涨跌幅降序排序（涨幅大的在前）
- ✅ 添加锂云母(1.8%)和锂辉石(6%澳洲)到累积涨跌幅数据
- ✅ 同步存档 policy_center_v4.html (v2) 和 industry_news.html (v3)

**迁移说明**:
- 无破坏性变更，可直接使用
- 子页面（policy_center_v4.html, industry_news.html）已同步存档，回滚时会一并回滚

---

## v13 (2026-05-21)

**变更内容**:
- ✅ 修复锂辉石图表数据显示问题（添加 grade/origin 过滤，只显示6%澳洲数据）
- ✅ 修复锂云母图表单位显示问题（元/吨 → 万元/吨）
- ✅ 修复悬停卡片样式问题（添加十字线 + 浮动卡片，参照碳酸锂期货样式）
- ✅ 修复锂云母图例和Y轴单位显示（万元/吨，保留2位小数）
- ✅ 同步存档 policy_center_v4.html 和 industry_news.html

**迁移说明**:
- 无破坏性变更，可直接使用
- 子页面（policy_center_v4.html, industry_news.html）已同步存档，回滚时会一并回滚

---

## 2026-05-10 AI-2（前端侧）

- ✅ 建立初始检查点 `初始检查点`（20260510_150003）
- 📁 备份文件：21 个核心 HTML/Python/BAT 文件
- 📍 备份目录：`backups/checkpoint_20260510_150003_初始检查点`
- 📝 Git commit 已创建

> 状态：idle，当前无 active 任务

---

## 2026-05-10 AI-2（弹窗优化任务存档）

- ⏸️ 弹窗优化任务暂停（因时间不足）
- 🆕 新任务已添加：搭建本地SQLite数据库
- 📋 待办清单已更新：TODO.md

> 状态：idle

---

## v1 (2026-05-27) - index_v5_portal.html V5框架初始版本

**变更内容**:
- V5框架初始版本（华尔街见闻风格首页）
- 左侧热点资讯横向轮播，右侧数据库图表上下滚动
- 6层布局：导航→行情条→焦点区→两栏内容→矩阵→产业链

**技术文件**: index_v5_portal.html

---