        const deptList = ['lhy', 'kls', 'czly', 'lpsd', 'sdmd', 'sjld', 'bych', 'felt', 'dhx'];

        // 自动播放变量
        let autoPlayTimer = null;
        let currentDeptIndex = 0;
        let isPaused = false;
        let autoPlayDuration = 8000; // 每个事业部展示 8 秒
        let progressTimer = null;

        // 当前报告日期（默认今天，可被 JSON 覆盖）
        let CURRENT_REPORT_DATE = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

        // 动态加载的报告数据（从 reports/YYYY-MM-DD.json 加载）
        let dynamicReportData = null;

        // 早报内容数据（硬编码 fallback）