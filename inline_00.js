
        const allData = {};

        
        function renderAllTables() {
            const sectionMap = {
                'content-电解液-行业整体产量': '电解液-行业整体产量',
                'content-电解液-分企业产量横向': '电解液-分企业产量横向',
                'content-电解液-top15排名': '电解液-top15排名',
                'content-电解液年累-top15': '电解液年累-top15',
                'content-电解液价格-磷酸铁锂动力型': '电解液价格-磷酸铁锂动力型',
                'content-电解液价格-磷酸铁锂储能型': '电解液价格-磷酸铁锂储能型',
                'content-电解液价格-三元动力型': '电解液价格-三元动力型',
                'content-电解液价格-圆柱2600mAh': '电解液价格-圆柱2600mAh',
                'content-电解液价格-圆柱2200mAh': '电解液价格-圆柱2200mAh',
                'content-高压电解液价格-4.4V以上': '高压电解液价格-4.4V以上',
                'content-高压电解液价格-4.4V': '高压电解液价格-4.4V',
                'content-高压电解液价格-4.35V': '高压电解液价格-4.35V',
                'content-电解液价格-分企业横向': '电解液价格-分企业横向',
                'content-六氟磷酸锂-行业总产量': '六氟磷酸锂-行业总产量',
                // 'content-六氟-分企业产量': '六氟-分企业产量', // 静态HTML tbody，无需JS渲染
                'content-六氟-top15排名': '六氟-top15排名',
                'content-六氟年累-top15': '六氟年累-top15',
                'content-六氟磷酸锂价格-主流市场': '六氟磷酸锂价格-主流市场',
                'content-六氟磷酸锂价格-出口': '六氟磷酸锂价格-出口',
                'content-LiFSI价格-固态': 'LiFSI价格-固态',
                'content-LiFSI价格-液态': 'LiFSI价格-液态',
                'content-六氟磷酸锂出口-总量': '六氟磷酸锂出口-总量',
                'content-六氟出口-分国别': '六氟出口-分国别',
                'content-添加剂VC-产量': '添加剂VC-产量',
                'content-添加剂FEC-产量': '添加剂FEC-产量',
                'content-添加剂VC-价格': '添加剂VC-价格',
                'content-添加剂PS-价格': '添加剂PS-价格',
                'content-添加剂FEC-价格': '添加剂FEC-价格'
            };

            // 字段名映射：HTML表头 → JSON字段名
            const fieldMap = {
                // '厂家/企业': '企业名称' // 移除错误映射：JSON key 就是'厂家/企业'
                'YTD产量': '当期产量',   // 年累表HTML列名 → JSON字段名
                'YTD产能': '当期产能',   // 年累表HTML列名 → JSON字段名
            };

            // 日期格式化：兼容 YYYY-MM-DD、YYYY-MM、YYYYMM 三种格式
            function fmtDate(val, isMonth) {
                if (!val) return '-';
                const s = String(val);
                // YYYY-MM-DD HH:MM:SS → YYYY年M月 或 YYYY/M/D
                const m1 = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
                if (m1) {
                    if (isMonth) return m1[1] + '年' + parseInt(m1[2]) + '月';
                    return m1[1] + '/' + parseInt(m1[2]) + '/' + parseInt(m1[3]);
                }
                // 兼容 YYYY-MM 和 YYYYMM → YYYY年M月
                const m = s.match(/(\d{4})[\-]?(\d{1,2})(?!\d)/);
                if (m) return m[1] + '年' + parseInt(m[2]) + '月';
                return s;
            }

            // 按日期降序排序
            function sortDesc(data) {
                return [...data].sort((a, b) => {
                    const da = a['日期'] || a['月份'] || a['数据年月'] || '';
                    const db = b['日期'] || b['月份'] || b['数据年月'] || '';
                    return db.localeCompare(da);
                });
            }

            for (const [sectionId, tableName] of Object.entries(sectionMap)) {
                const section = document.getElementById(sectionId);
                if (!section) continue;

                const table = section.querySelector('table.data-table');
                if (!table) continue;

                const tbody = table.querySelector('tbody');
                if (!tbody) continue;

                const rawData = allData[tableName];
                if (!rawData || rawData.length === 0) continue;

                if (tableName.includes('横向')) {
                    renderHorizontalTable(table, tbody, rawData);
                } else {
                    renderVerticalTable(table, tbody, rawData, tableName, fieldMap, fmtDate, sortDesc);
                }
            }
        }

        function renderHorizontalTable(table, tbody, data) {
            const sorted = [...data].sort((a, b) => {
                const da = a['日期'] || a['月份'] || '';
                const db = b['日期'] || b['月份'] || '';
                return db.localeCompare(da);
            });

            // 提取企业名
            const firstRow = sorted[0] || {};
            const companies = [];
            for (const key of Object.keys(firstRow)) {
                if (key !== '日期' && key !== '月份') companies.push(key);
            }

            // 格式化月份列头
            const monthLabels = sorted.map(row => {
                const m = row['月份'] || row['日期'] || '';
                const match = String(m).match(/(\d{4})-(\d{1,2})/);
                if (match) return match[1] + '年' + parseInt(match[2]) + '月';
                return m;
            });

            // 重新生成thead
            const theadTr = table.querySelector('thead tr');
            if (theadTr) {
                let thHtml = '<th>企业</th>';
                for (const m of monthLabels) thHtml += '<th>' + m + '</th>';
                theadTr.innerHTML = thHtml;
            }

            // 生成tbody
            let html = '';
            for (const company of companies) {
                html += '<tr><td><strong>' + company + '</strong></td>';
                for (const row of sorted) {
                    let val = row[company];
                    if (val === null || val === undefined) val = '-';
                    html += '<td>' + val + '</td>';
                }
                html += '</tr>';
            }
            tbody.innerHTML = html;
        }

        function renderVerticalTable(table, tbody, data, tableName, fieldMap, fmtDate, sortDesc) {
            const sorted = sortDesc(data);
            const isMonthTable = tableName.includes('产量') || tableName.includes('出口');

            const ths = table.querySelectorAll('thead th');
            const headers = Array.from(ths).map(th => th.textContent.trim());

            let html = '';
            for (const row of sorted) {
                html += '<tr>';

                // FEC价格表特殊字段映射（每行只创建一次）
                const localMap = Object.assign({}, fieldMap);
                if (tableName.includes('FEC') && tableName.includes('价格')) {
                    localMap['日期'] = '文本';
                    localMap['最高价'] = '今日最高价格';
                    localMap['均价'] = '今日均价';
                }

                for (let i = 0; i < headers.length; i++) {
                    const h = headers[i];
                    let jsonKey = localMap[h] || h;
                    let val = row[jsonKey];
                    // 空格变体 fallback（JSON 字段常有前后空格）
                    if (val === null || val === undefined) {
                        val = row[' ' + jsonKey + ' '] || row[' ' + jsonKey] || row[jsonKey + ' '];
                    }

                    if (h === '序号') {
                        // 生成排名徽章
                        const rank = val ? parseInt(val) : 0;
                        const badgeClass = rank <= 3 ? 'top3' : (rank <= 5 ? 'top5' : '');
                        html += '<td><span class="rank-badge ' + badgeClass + '">' + (rank || '-') + '</span></td>';
                        continue;
                    }

                    if (val !== null && val !== undefined) {
                        if (h === '日期' || h === '数据年月' || h === '文本') {
                            val = fmtDate(val, isMonthTable && h !== '文本');
                        }
                    }

                    if (val === null || val === undefined) val = '-';
                    html += '<td>' + val + '</td>';
                }
                html += '</tr>';
            }
            tbody.innerHTML = html;
        }

function init() {
            if (typeof EMBEDDED_DATA !== 'undefined' && EMBEDDED_DATA.tables) {
                EMBEDDED_DATA.tables.forEach(t => { allData[t.table_name] = t.data; });
                document.getElementById('updateTime').textContent = EMBEDDED_DATA.update_time;
                const totalRecords = EMBEDDED_DATA.tables.reduce((sum, t) => sum + t.data.length, 0);
                document.getElementById('sidebar-table-count').textContent = EMBEDDED_DATA.tables.length;
                document.getElementById('sidebar-record-count').textContent = totalRecords.toLocaleString();
                // 动态渲染所有表格
                renderAllTables();
                // Show first section
                document.getElementById('content-电解液-行业整体产量').classList.add('active');
                document.querySelector('.nav-item').classList.add('active');
            }
        }

        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('collapsed');
        }

        function switchNav(section, el) {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            el.classList.add('active');
            const target = document.getElementById('content-' + section);
            if (target) target.classList.add('active');
        }

        window.onload = init;
    