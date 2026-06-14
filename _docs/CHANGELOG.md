
## v43 (2026-06-12)

**变更内容**:
- ✅ 首页锂电池回收板块上线（index_v3.html 锂电板块 → 锂电池回收标签页）
  - 新增 `recycling_gantt.js`：甘特图渲染逻辑（与电解液保持一致，HTML divs 模式）
  - 新增 `recycling_data.js`：11个回收品种历史数据（SMM数据源，字段：今日最低价格/今日最高价格/今日均价，单位：万元/吨）
  - 修改 `index_v3.html`：添加 script 标签 + 锂电池回收 Tab 按钮 + `renderLithiumGantt()` 中 `recycling` 分支
- ✅ 甘特图功能
  - 11个品种按2026年累计涨跌幅排序，红色上涨/绿色下跌
  - 条形增长动画（`requestAnimationFrame` + `data-target-width`）
  - 点击行展开 echarts 折线图（2026年价格走势）
  - 折线图卡片顶部标签栏：图例 + 最新价 + 涨跌幅
  - 折线图最新点标注日期（`markPoint`，`position: 'left'` 避免右侧截断）
  - 折线图绘制动画（`animation: true`，`animationDuration: 1500`）
- ✅ 数据品种（11个）
  - 三元黑粉-三元523极片粉、磷酸铁锂黑粉-磷酸铁锂极片粉、三元废料-三元铝壳523型
  - 磷酸铁锂废料-废旧磷酸铁锂铝壳电池、正极片-废旧磷酸铁锂动力正极片、正极片-废旧磷酸铁锂储能正极片
  - 三元电池包-三元铝壳5系电池包、钴酸锂电池包-钴酸锂铝壳电池包、三元电池包-三元软包电池包
  - 铝箔-铝粉、铜箔-铜粉

**技术文件**: `index_v3.html`, `recycling_gantt.js`, `recycling_data.js`

**迁移说明**:
- 数据更新：`recycling_data.js` 需手动从 SMM `https://newenergy.smm.cn/price/14042-15009` 爬取更新
- 代码更新：修改 `recycling_gantt.js` 后 Ctrl+F5 强制刷新即可
- 回滚：使用 `_archive/versions/index_v3_v20260612_recycling.html`

---

## v42 (2026-06-09)

**变更内容**:
- ✅ 政策富化：批量 AI 生成 6 个分析字段
  - 新增 `enrich_policies.py` 脚本，从 `policy_center_v4.html` 提取政策，调用 MiniMax-M3 API 批量分析
  - 富化字段：issuer（发布机构）/ scope（覆盖范围）/ industry（涉及行业）/ vertical（垂直领域）/ impactLink（影响环节）/ impact（一句话影响分析）
  -111 条政策富化完成（12 条静态政策跳过，99 条日报政策 AI 分析）
  - 富化质量：issuer88% / scope 95% / industry 100% / vertical 76% / impactLink 89% / impact 100%
  - 富化结果保存至 `embedded/policies_enriched.json`
  - 数据注入 `policy_center_v4.html` + `embedded/policy_center_v4.html`
- ✅ 政策中心列表页增强（renderTimeline）
  - 每条政策新增 scope badge（蓝色"全国"/紫色"海外"）+ industry tags（绿色）+ vertical tag（紫色）
  - 标签显示在类型 badge 之后，BU badge 之前
- ✅ 政策详情弹窗增强（showModal）
  - 基本信息卡新增：涉及行业 / 垂直领域字段（彩色 tag）
  - 新增"政策影响分析"区块（橙色边框卡片），展示 AI 生成的一句话影响分析
  - 新增"影响环节"行（橙红色 tag），显示生产制造/回收利用/价格波动等环节
  - 覆盖范围 badge改用 `scope` 字段（替代原 `coverage`）
  - 涉及BU 未识别时显示"（未识别）"而非空白

**技术文件**: `enrich_policies.py`, `policy_center_v4.html`, `embedded/policy_center_v4.html`, `embedded/policies_enriched.json`

**迁移说明**:
- 政策富化：`python D:\trae\AI Daily report\enrich_policies.py`（需要联网调用 MiniMax API）
- 政策数据更新：`python D:\trae\AI Daily report\generate_policy_center.py`（富化字段不覆盖，已富化的政策保留字段）
- 当前流程：先 `generate_policy_center.py`（更新数据源）→ 再 `enrich_policies.py`（富化分析字段）

---

## v41 (2026-06-09)

**变更内容**:
- ✅ 政策真实性过滤标准上线
  - 数据源：直接从 `reports/YYYY-MM-DD.json` 合并文件读取（绕过 `reports/policies.json`）
    - 原因：`md_to_json.py` 只处理当天 MD，历史合并 JSON 不会被聚合进 `policies.json`
    - 从 11 个合并文件读取 284 条原始政策（去重后）
  - 真实性过滤：284 条 → 99 条通过（34.9%），185 条被排除
  - 排除标准：券商研报（华泰/中金等）、公司公告（宁德/盐湖等）、市场数据新闻、纯商品招标
  - 纳入标准：政府机构发布、含政策文件特征词（通知/办法/规定等）、官媒报道、行业协会标准文件
  - 去重键：`normalize(title) + date`，标题去除标点空格转小写
  - 修复日期污染：清除"近期"前缀，标准化 YYYY-MM-DD 格式
  - 最终：99 条日报政策 + 12 条静态政策 = **111 条**
  - 分类：中央 28 / 地方 81 / 海外 2，含 core 字段 12 条
  - 数据截止：**2025-04 ~ 2026-06-08**（含6月8日最新政策）
- ✅ 修复 fetch override 报错：`_orig.apply()` 在 `window.fetch` 为 null 时抛出 "null is not a function"
  - 修复：`if (_orig) return _orig.apply(...)` 替换直接调用
  - 同时修复 embedded 版相同问题

**技术文件**: `generate_policy_center.py`, `policy_center_v4.html`, `embedded/policy_center_v4.html`

**迁移说明**:
- `python D:\trae\AI Daily report\generate_policy_center.py` 即可更新政策中心
- 无需依赖 `md_to_json.py`，直接读取合并 JSON 文件

---

## v40 (2026-06-09)

**变更内容**:
- ✅ 政策中心自动更新链路打通
  - 新增 `generate_policy_center.py`：从 `reports/policies.json`（日报政策）+ `reports/gen_policies.py`（12条静态政策）合并去重后注入 `policy_center_v4.html`
  - 合并去重 key：`date + title[:50]`
  - 同步更新根目录 + embedded 嵌入版
  - 统计输出：合计635条，中央418/地方208/海外9，含core字段12条
- ✅ `generate_all_embedded_data.py` 接入政策中心更新
  - 数据库生成完成后自动调用 `generate_policy_center.py`
  - 一键 `python generate_all_embedded_data.py` 即可完成全部（数据库+政策中心）更新
- ✅ 修复静态政策解析：gen_policies.py 尾部含尾部逗号，`json.loads()` 失败 → 修复后正常解析12条

**技术文件**: `generate_policy_center.py`, `generate_all_embedded_data.py`

**迁移说明**:
- 每日更新：`python D:\trae\AI Daily report\generate_policy_center.py`
- 一键全部：`python D:\trae\AI Daily report\generate_all_embedded_data.py`（数据库+政策中心）
- 前提：先跑早报生成（`D:\buddy\md_to_json.py`）确保 `reports/policies.json` 为最新

---

## v39 (2026-06-09)

**变更内容**:
- ✅ `policy_center_v4.html` 政策数据更新
  - `EMBEDDED_POLICIES` 从 67 条（5月15日）刷新为 85 条（5月20日）
  - 数据来源：`embedded/policies_clean.json`（含 core/vertical/impact 等富化字段）
  - 同步更新 `embedded/policy_center_v4.html`
  - JSON 语法验证通过

**技术文件**: `policy_center_v4.html`, `embedded/policy_center_v4.html`, `embedded/policies_clean.json`

**迁移说明**:
- 当前 `generate_all_embedded_data.py` 不处理政策数据（跳过 policy_center）
- 政策数据更新需手动从 `embedded/policies_clean.json` 注入 HTML，或重建 `gen_embedded_all.py` 流程

---

## v38 (2026-06-09)

**变更内容**:
- ✅ `archive_v3.html` + `archive.html`根目录恢复
  - 原因：根目录大清理时未做备份，两个文件从 `embedded/` 和 `_archive/html/` 恢复
  - `archive_v3.html` 从 `embedded/archive_v3.html` 恢复（干净版，无缓存控制注释）
  - `archive.html` 从 `_archive/html/archive.html` 恢复
- ✅ `root-files-manifest.json` 新增两个文件记录

**技术文件**: `archive_v3.html`, `archive.html`, `_docs/root-files-manifest.json`

**迁移说明**:
- 根目录完整文件清单已更新，`python _docs/verify_root_files.py --fix` 会自动校验

---

## v37 (2026-06-09)

**变更内容**:
- ✅ 数据库页面大规模恢复（19个文件从 `_archive/html/` + `embedded/` 恢复）
  - lfp_charts.html / lfp_data_v2.html / lfp_report.html / lfp_report_2026_04.html
  - ternary_charts.html / ternary_data_v2.html
  - electrolyte_charts.html / electrolyte_data_v2.html / electrolyte_report.html
  - carbonate_charts.html / carbonate_data_v2.html
  - recycling_charts.html / recycling_data_v2.html
  - lib_battery_charts.html / lib_battery_data_v2.html / lib_battery_analysis.html
  - automotive_charts.html / automotive_data_v2.html
- ✅ 修复 `database_hub.html` 中3个不存在的报告链接（carbonate/lib_battery/automotive月报）
- ✅ 修复三元/锂电池chart页面：原版fetch外部JSON不存在，替换为嵌入版（使用 `*_embedded_data.js`）
- ✅ 修复 `ternary_data_v2.html` 三处关键问题：
  1. 变量名错误：`TERNARY_DATA` → `EMBEDDED_DATA`（嵌入JS导出名）
  2. 表名错误：`TAB_CONFIG` 中表名（如 `三元正极-行业产量规模`）与嵌入数据实际表名（如 `NCM-行业整体产量`）不匹配，全量更正为嵌入数据实际名称
  3. 关键原料表名修正：`硫酸钴镍-*` → `四氧化三钴-*`（嵌入数据实际名称）
- ✅ 修复 `ternary_charts.html` 表名错误：`硫酸钴镍-现货市场价` → `关键原料-现货市场价`
- ✅ 修复所有数据库 data 页日期显示：7个数据页中 3 个用 `pct()`，4 个用专用 fmt 函数（已各自确认无问题）
  - `carbonate_data_v2.html` 和 `recycling_data_v2.html` 的 `pct()` 同步更新为去除 ` 00:00:00` 后缀
  - `lfp_data_v2.html` / `electrolyte_data_v2.html` / `lib_battery_data_v2.html` / `automotive_data_v2.html` 已有专用日期函数，已确认无问题
- ✅ 新增 `db_utils.js`：数据库共享工具文件（`cleanDate/pct/fmtDate/fmtMonth/fmtNum/toNum`），所有数据库页引用后统一日期处理逻辑，防止 `00:00:00` 问题再现
- ✅ 修复 `lib_battery_data_v2.html` 表名错误（4处）：页面代码用括号 `（）`，嵌入数据用短横线 `（-）`
  - `锂电池行业产量（分规格）` → `锂电池行业产量-分规格`
  - `锂电池行业产量产能（不分规格）` → `锂电池行业产量产能`
  - `锂电池分企业产量（分规格）` → `锂电池分企业产量-分规格`
  - `锂电池分企业产量产能（不分规格）` → `锂电池分企业产量产能`
- ✅ 清单更新：`_docs/root-files-manifest.json` 新增17个数据库页面（18→35个必须保留文件）

**技术文件**: `database_hub.html`, `_docs/root-files-manifest.json`

**迁移说明**:
- 所有数据库页面现已恢复正常访问（`lfp_charts.html` 等17个URL）
- `python _docs/verify_root_files.py` 已能覆盖数据库页面

---

## v36 (2026-06-08)

**变更内容**:
- ✅ 根目录文件完整性保障机制上线
  - 新增 `_docs/root-files-manifest.json`：清单记录18个必须保留在根目录的文件
  - 新增 `_docs/verify_root_files.py`：检查脚本，缺失文件自动从存档恢复（`--fix` 参数）
  - 修复：`find_in_archives()` 优先选用 `HTML_VERSION` 最高的版本，而非第一个匹配项
  - 本次执行自动恢复了：`bu_hub.html / database_hub.html / analysis_hub.html`
  - 手动恢复了：`strategy_hub.html / strategy_dashboard.html（最新版20260604） / felt_report_202604.html`

**技术文件**: `_docs/root-files-manifest.json`, `_docs/verify_root_files.py`

**迁移说明**:
- 每次归档根目录文件前，运行 `python _docs/verify_root_files.py` 确认文件齐全
- `python _docs/verify_root_files.py --fix` 可自动从存档恢复缺失文件

---

## v35 (2026-06-08)

**变更内容**:
- ✅ `radar_detail.html` Tab3 诊断视图（侧边导航 + 右侧内容卡片）
  - Tab3 布局：左侧160px导航栏（含D1-D6按钮+分数）+ 右侧内容区（诊断卡片）
  - JS层：`initDimsNav()` 初始化导航，`renderDimCard()` 渲染右侧内容，`onclick` 联动切换
  - CSS：`.dims-sidebar / .dims-nav-item / .dims-content / .dims-card / .dims-findings / .dims-flags-row` 等
  -6卡片布局 →侧边导航切换（消除堆积感）
- ✅ 存档：`radar_detail_v20260608_diag_js.html` → `_archive/html/`

**技术文件**: `radar_detail.html`

**迁移说明**:
- 页面访问：`http://localhost:8888/radar_detail.html?id=sdmd`，Tab3 查看诊断视图
- 数据源：`_diagnostic.d{1-6}.findings / issues / positives / kpis[]`

---

## v34 (2026-06-08)

**变更内容**:
- ✅ `radar_detail.html` 数据充实化（Plan A 实施）
  - 数据层：为3/4/5月各月新增 `_detail_operation/_detail_cost/_detail_mcu/_detail_quality/_detail_procurement/_detail_rd/_detail_projects/_detail_cost_save/_detail_inventory/_detail_plan_next/_detail_risk` 共11个详细模块
  - UI层：Tab3 维度详情扩展为17个 chart-section（原有5个 → 新增12个）
    - D1：月度经营总览（营收构成+毛利分解+净利润来源）
    - D2：成本结构表（5项）+ MCU改善项目（4项+月度合计）
    - D3：核心项目进展（5项）+ 降本专项（辅材/能耗/检测/包材）
    - D4：研发课题进展（6项）
    - D5：采购端（4项）+ 风险与资源需求（3项）
    - D6：质量端（5项）+ 库存管控（4类+合计）+ 下月重点计划（4项）
  - 新增渲染函数：`renderOperation/renderCost/renderMCU/renderProjects/renderCostSave/renderRD/renderProcurement/renderRisk/renderQuality/renderInventory/renderPlan`
  - 新增CSS样式：11套子模块专用样式（op-item/mcu-card/cs-card/inv-card/plan-card/proc-card/risk-item/detail-card等）
- ✅ 存档：`radar_detail_v20260608_20260608_172519.html` → `_archive/`

**技术文件**: `D:\trae\AI Daily report\_archive\html\radar_detail.html`

**迁移说明**:
- 原文件在 `_archive/html/` 目录（服务器根目录），已备份时间戳版本
- 新增数据基于 `meiduo_summary.txt`（4月）+ `meiduo_plan.txt`（5月）数据源
- 3月数据较简（基准月），4月数据较完整，5月数据最详尽

---

## v33 (2026-06-08)

**变更内容**:
- ✅ 法恩莱特月报 PPT 生成器上线
  - 新增 `extract_felt_ppt_data.py`：从 HTML 报告提取文字段落 → JSON（Parts 1-7）
  - 新增 `felt_report_to_pptx.js`：pptxgenjs 生成 23页 PPT，含封面/目录/7章节分隔页/行业内容/法恩莱特诊断
  - Part 6（法恩莱特诊断）占 6 页：KPI卡片/三基地对比/客户贡献/六维诊断/问题与积极因素
  - Part 7（专属建议）占 3 页：机会风险/行动建议/核心结论
  - 配色：深绿系（#007D4F），与电解液1.pdf模板风格一致
  - 输出：`D:\trae\AI Daily report\法恩莱特电解液月报_2026年04月.pptx`（578KB，23页）
- ✅ `felt-report-operations.md` 新增 PPT 生成流程
- ✅ `SKILL.md` 每月清单新增 PPT 生成步骤

**技术文件**: `extract_felt_ppt_data.py`, `felt_report_to_pptx.js`, `felt-report-operations.md`

**迁移说明**:
-每月流程：`extract_felt_ppt_data.py` → `felt_report_to_pptx.js` → 输出 PPT
- 数据源：`felt_ppt_data_YYYYMM.json`（由 extract_felt_ppt_data.py 产出）

---

## v32 (2026-06-08)

**变更内容**:
- ✅ `felt_report_202604.html` Part 6/7 结构性优化完成
  - 经营速览表（8行KPI）移至 Part 6 开头（"三基地对比"上方）
  - 问题诊断/积极因素：卡片布局 → 双栏段落样式（`.felt-list-item`，非表格）
  - 机会/风险：统一改为 `.felt-list-item` 段落展示，序号①②③④⑤（无顿号）
  - 行动建议重构：按时间维度分组（本周/本月/本季），各组独立编号
  - 紧急项高亮：本周内（紧急）①② 加红色左边框 + 红色标题（`.felt-action-urgent`）
- ✅ `SKILL.md` 同步更新第九章
  - 9.2 新增"经营速览表"为第一展示项
  - 9.3 更新行动建议分组逻辑 + 紧急项高亮规范
  - 新增 9.6 UI样式规范（`.felt-list-item` / `.felt-action-urgent`）
  - 新增 9.7 手动编辑工作流 + 每月必做清单
  - 新增"七补充：电解液月报完整月度周期"流程图
  - 9.4 新增 Step 4-5（Phase B叙事填充 + 存档流程）
- ✅ `generate_felt_report.py` Phase A 全自动化完成
  - 自动读取 `felt_diagnostic_data.json` 替换 Part 6/7 所有数据
  - 47 项字符串替换（KPI/基地/客户/雷达图/诊断/机会/风险）
  - 支持 `--month YYYY-MM` + `--skip-events` 参数
- ✅ `fill_felt_narrative.py` Phase B 叙事生成完成
  - 从 `events_brief.json` + `felt_diagnostic_data.json` 生成 Part 1-7 叙事 JSON
  - 输出 `narrative_YYYYMM.json`（约42,000 字结构化叙事）
  - 修复 PEP 263 UTF-8 编码声明 + 弯引号转义问题
- ✅ 运维文档：`D:\trae\AI Daily report\_docs\felt-report-operations.md`（每月流程/数据规范/UI样式/排查指南）
- ✅ `_docs/INDEX.md` 同步更新，纳入法恩莱特运维文档
- ✅ 存档：`felt_report_202604_v20260608.html` → `_archive/versions/`

**技术文件**: `felt_report_202604.html`, `generate_felt_report.py`, `fill_felt_narrative.py`, `SKILL.md`, `_docs/felt-report-operations.md`, `_docs/INDEX.md`

**迁移说明**:
- 法恩莱特专属报告 Phase A/B 双脚本自动化完成
- 每月流程：`generate_felt_report.py` → `fill_felt_narrative.py` → AI 叙事润色 → 存档
- 运维文档已统一归入 `_docs/` 目录，与雷达图等模块平级
- 每月生成前需先更新 `felt_diagnostic_data.json` + `electrolyte_embedded_data.js`

---

## v31 (2026-06-08)

**变更内容**:
- ✅ 法恩莱特专属报告流程上线：`generate_felt_report.py`
  - 新增脚本：`D:\buddy\skills\lithium-analysis-report\generate_felt_report.py`
  - 读取 `felt_diagnostic_data.json`（Part 6 数据源）
  - 读取 `electrolyte_embedded_data.js`（Parts 2-5 数据源）
  - 读取 `events_brief.json`（Part 1行业事件）
  - 模板：`felt_report_202604.html` → 输出 `felt_report_YYYYMM.html`
- ✅ `generate_monthly_report.py` 新增 `felt` 报告类型支持
  - `python generate_monthly_report.py felt --month 2026-05`
- ✅ `SKILL.md` 新增第九章：法恩莱特事业部专属报告流程
  - Part 6：法恩莱特专题诊断（KPI/基地对比/客户贡献/雷达图/诊断）
  - Part 7：法恩莱特专属建议（基于诊断结果的具体建议）

**技术文件**: `generate_felt_report.py`, `generate_monthly_report.py`, `SKILL.md`

**迁移说明**:
- 法恩莱特月报数据源：`felt_diagnostic_data.json`，每月更新后方可生成报告
- 行业报告（electrolyte）与法恩莱特报告（felt）走不同模板，互不影响

---

## v30 (2026-06-08)

**变更内容**:
- ✅ 电解液月报 Part 6：法恩莱特事业部诊断板块上线
  - 新增 Tab7「法恩莱特诊断」（电解液报告专用，lfp报告自动隐藏）
  - 4 KPI 卡片：销量达成43%/毛利率-2.7%/净利润-540万/经营现金流14万
  - 三基地横向对比表（法恩/湖南/安徽/广西）：销量/均价/毛利/边际利润/净利润/四费率
  - 客户贡献柱状图（销量+毛利双轴）：多氟多/吉曜/宁德/海辰/鹏辉
  - 六维综合诊断雷达图：销量达成/价格控制/毛利水平/费用控制/现金流/回款率
  - 问题诊断与积极因素双栏总结
  - 数据来源：`D:\buddy\skills\lithium-analysis-report\felt_diagnostic_data.json`（5月PDF提取）
- ✅ `generate_report.py` 新增 `compute_felt_diagnostic()` 函数（支持任意月份自动读取）
- ✅ `report_template_v2.html` 新增 Tab7 HTML/CSS/JS

**技术文件**: `electrolyte_report_2026_05.html`, `lfp_report_2026_05.html`, `D:\buddy\skills\...`

**迁移说明**:
- lfp报告不受影响（Tab7 根据 `{{FELT_KPI}}` 非空判断自动显示/隐藏）
- 法恩莱特数据每月更新：`felt_diagnostic_data.json` 中追加 `months["YYYY-MM"]` 即可

---

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