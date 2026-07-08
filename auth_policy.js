/**
 * 权限策略配置（auth_policy.js）
 * ------------------------------------------------------------------
 * 由 inline_auth.js 在页面加载时读取，决定"当前页面允许哪些飞书部门/事业部访问"。
 *
 * 【部署后必做】把 AUTH_BACKEND 改为你的 Vercel 云函数地址
 *   （即 api/feishu.py 部署后的 https://<xxx>.vercel.app ，
 *    该地址下需可访问 /feishu/callback）。
 *   全项目仅此一处配置后端地址。
 *
 * 【策略结构】window.AUTH_POLICY = { "<页面文件名>.html": { ... }, ... }
 *   每页可声明：
 *     - allowed_bus:       事业部 ID 列表（sdmd/lpsd/czly/felt/sjld/kls/lhy/dhx/bych）
 *     - allowed_dept_ids: 飞书部门 ID 列表（细粒度，如 "od-xxxxxxxx"）
 *   判定逻辑（inline_auth.js）：用户命中 任一部级ID交集 或 任一部业ID 即放行。
 *   页面【未出现在本表】或显式 { open: true } → 全员可见（不限制）。
 *
 * 【默认映射说明】以下为初始默认方案（按页面主题归类到对应事业部）。
 *   雷达详情页 radar_detail_<bu>.html 已明确对应 BU；其余数据/报告/图表页按主题归类。
 *   注：回收(recycling)与锂电(lib_battery)原属 kls/lhy，2026-07-08 已并入 lpsd（常州锂源事业部）。
 *   ⚠️ 这是"建议默认"，请据实际组织架构确认/微调；要更细可用 allowed_dept_ids 指定具体部门。
 *   聚合/导航类页面（首页、行业新闻、help、政策中心、toolbox、各 hub、归档）默认全员可见，
 *   若需限制到"战略研究"等相关部门，请补充 allowed_dept_ids。
 */

// ============ 鉴权后端地址（部署后修改此处）============
window.AUTH_BACKEND = 'https://<YOUR-VERCEL-APP>.vercel.app'; // TODO: 部署后替换为真实地址

// ============ 页面 → 允许访问的部门/事业部 ============
window.AUTH_POLICY = {
    // ---------- 全员可见（公共/聚合/导航类）----------
    'index.html':              { open: true },
    'index_v3.html':           { open: true },
    'industry_news_embedded.html': { open: true },
    'help.html':               { open: true },
    'policy_center_v4.html':   { open: true },   // 如需限战略研究，补 allowed_dept_ids
    'toolbox.html':            { open: true },
    'bu_hub.html':             { open: true },
    'dept-archive.html':       { open: true },
    'archive_v3.html':         { open: true },
    'analysis_hub.html':       { open: true },   // 如需限战略研究，补 allowed_dept_ids
    'strategy_hub.html':       { open: true },   // 如需限战略研究，补 allowed_dept_ids
    'strategy_dashboard.html': { open: true },   // 如需限战略研究，补 allowed_dept_ids
    'database_hub.html':       { open: true },   // 如需限战略研究，补 allowed_dept_ids
    'radar_hub.html':          { open: true },   // 如需限战略研究，补 allowed_dept_ids

    // ---------- 磷酸铁锂（山东美多 sdmd）----------
    'lfp_data_v2.html':        { allowed_bus: ['sdmd'] },
    'lfp_report.html':         { allowed_bus: ['sdmd'] },
    'lfp_report_2026_05_v2.html': { allowed_bus: ['sdmd'] },
    'lfp_report_2026_04.html': { allowed_bus: ['sdmd'] },
    'lfp_charts.html':         { allowed_bus: ['sdmd'] },
    'radar_detail_sdmd.html':  { allowed_bus: ['sdmd'] },
    'automotive_data_v2.html': { allowed_bus: ['sdmd'] },      // 疑似新能源/汽车线，待确认
    'automotive_report_202605.html': { allowed_bus: ['sdmd'] }, // 待确认
    'automotive_charts.html':  { allowed_bus: ['sdmd'] },      // 待确认

    // ---------- 电解液 / 法恩莱特（felt）----------
    'electrolyte_data_v2.html':{ allowed_bus: ['felt'] },
    'electrolyte_report.html': { allowed_bus: ['felt'] },
    'electrolyte_charts.html': { allowed_bus: ['felt'] },
    'felt_report_202604.html': { allowed_bus: ['felt'] },
    'felt_report_202605.html': { allowed_bus: ['felt'] },
    'radar_detail_felt.html':  { allowed_bus: ['felt'] },

    // ---------- 碳酸锂 / 锂源系（czly + lpsd）----------
    'carbonate_data_v2.html':  { allowed_bus: ['czly', 'lpsd'] },
    'carbonate_report_202605.html': { allowed_bus: ['czly', 'lpsd'] },
    'carbonate_analysis.html': { allowed_bus: ['czly', 'lpsd'] },
    'carbonate_charts.html':   { allowed_bus: ['czly', 'lpsd'] },
    'radar_detail_czly.html':  { allowed_bus: ['czly'] },
    'radar_detail_lpsd.html':  { allowed_bus: ['lpsd'] },

    // ---------- 回收（原 kls，已并入 lpsd 常州锂源事业部）----------
    'recycling_data_v2.html':  { allowed_bus: ['lpsd'] },
    'recycling_charts.html':   { allowed_bus: ['lpsd'] },
    'radar_detail_kelan.html': { allowed_bus: ['lpsd'] },

    // ---------- 锂电 / 润滑油（原 lhy，已并入 lpsd 常州锂源事业部）----------
    'lib_battery_data_v2.html':{ allowed_bus: ['lpsd'] },
    'lib_battery_analysis.html': { allowed_bus: ['lpsd'] },
    'lib_battery_charts.html': { allowed_bus: ['lpsd'] },
    'radar_detail_lhy.html':   { allowed_bus: ['lpsd'] },
    'radar_detail_lubricant.html': { allowed_bus: ['lpsd'] },

    // ---------- 三元 / 锂源系（lpsd + czly）----------
    'ternary_data_v2.html':    { allowed_bus: ['lpsd', 'czly'] },
    'ternary_report_202605.html': { allowed_bus: ['lpsd', 'czly'] },
    'ternary_charts.html':     { allowed_bus: ['lpsd', 'czly'] },

    // ---------- 迪克化学（dhx）----------
    'radar_detail_dkhx.html':  { allowed_bus: ['dhx'] },

    // ---------- 三金锂电（sjld）----------
    'radar_detail_sjld.html':  { allowed_bus: ['sjld'] },
};
