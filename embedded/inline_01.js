
        let allData = {};
        let tableData = {};

        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('collapsed');
        }

        function showTab(tabId, el) {
            document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
            if (el) el.classList.add('active');
            window.location.hash = tabId;
        }

        function restoreTabFromHash() {
            const hash = window.location.hash.slice(1);
            if (hash) {
                const navItem = document.querySelector(`[data-tab="${hash}"]`);
                if (navItem) showTab(hash, navItem);
            }
        }

        function num(v) { return parseFloat(v) || 0; }
        function pct(v) { return v == null || v === '' ? '-' : String(v); }
        function fmtNum(v) { return num(v).toLocaleString(); }
        function fmtDate(v) { return v ? String(v).split(' ')[0] : '-'; }

        function updateBadge(name, count) {
            for (let i = 0; i < EMBEDDED_DATA.tables.length; i++) {
                const badge = document.getElementById('badge-' + i);
                if (badge && EMBEDDED_DATA.tables[i].table_name === name) {
                    badge.textContent = count;
                }
            }
        }

        function renderTable(idx, tableName, data) {
            if (!data || !data.length) {
                document.getElementById('body-' + idx).innerHTML = '<tr><td colspan="20" class="loading">暂无数据</td></tr>';
                return;
            }
            const headers = Object.keys(data[0]);
            const thead = headers.map(h => `<th>${h}</th>`).join('');
            document.querySelector('#table-' + idx + ' thead tr').innerHTML = thead;
            let rows = '';
            const dateCol = headers.find(h => h.includes('日期') || h.includes('月份') || h.includes('当前日期'));
            let sorted = data;
            if (dateCol) {
                sorted = [...data].sort((a, b) => String(b[dateCol] || '').localeCompare(String(a[dateCol] || '')));
            }
            const showRows = sorted.slice(0, 200);
            showRows.forEach(d => {
                rows += '<tr>' + headers.map(h => {
                    let v = pct(d[h]);
                    if (h.includes('\u65e5\u671f')) v = fmtDate(d[h]);
                    return `<td>${v}</td>`;
                }).join('') + '</tr>';
            });
            if (data.length > 200) rows += '<tr><td colspan="' + headers.length + '" class="loading">仅显示前200条（共' + data.length + '条）</td></tr>';
            document.getElementById('body-' + idx).innerHTML = rows;
        }

        async function loadAllData() {
            if (typeof EMBEDDED_DATA !== 'undefined' && EMBEDDED_DATA.tables) {
                EMBEDDED_DATA.tables.forEach(t => {
                    allData[t.table_name] = t.data;
                    updateBadge(t.table_name, t.data.length);
                });
                document.getElementById('updateTime').textContent = EMBEDDED_DATA.update_time || '-';
                const total = EMBEDDED_DATA.tables.reduce((s,t) => s + t.data.length, 0);
                document.getElementById('totalRecords').textContent = total + ' 条记录';
                document.getElementById('stat-tables').textContent = EMBEDDED_DATA.tables.length;
                document.getElementById('stat-rows').textContent = total.toLocaleString();
                EMBEDDED_DATA.tables.forEach((t, i) => renderTable(i, t.table_name, t.data));
                restoreTabFromHash();
                return;
            }
            try {
                const r = await fetch('recycling_all_data.json?_t=' + Date.now());
                if (!r.ok) throw new Error(r.status);
                const d = await r.json();
                document.getElementById('updateTime').textContent = d.update_time || '-';
                d.tables.forEach(t => { allData[t.table_name] = t.data; updateBadge(t.table_name, t.data.length); });
                const total = d.tables.reduce((s,t) => s + t.data.length, 0);
                document.getElementById('totalRecords').textContent = total + ' 条记录';
                document.getElementById('stat-tables').textContent = d.tables.length;
                document.getElementById('stat-rows').textContent = total.toLocaleString();
                d.tables.forEach((t, i) => renderTable(i, t.table_name, t.data));
                restoreTabFromHash();
            } catch(e) {
                console.error(e);
                document.querySelectorAll('[id^="body-"]').forEach(el => {
                    el.innerHTML = '<tr><td colspan="20" class="loading">数据加载失败，请确保在正确目录使用本地服务器打开</td></tr>';
                });
            }
        }

        function exportTable(tableId) {
            const idx = parseInt(tableId.replace('table-',''));
            const t = EMBEDDED_DATA ? EMBEDDED_DATA.tables[idx] : null;
            if (!t || !t.data.length) return;
            const headers = Object.keys(t.data[0]);
            let csv = headers.join(',') + '\n';
            t.data.forEach(row => {
                csv += headers.map(h => '"' + String(row[h]||'').replace(/"/g,'""') + '"').join(',') + '\n';
            });
            const blob = new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = t.table_name + '.csv';
            a.click();
        }

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') toggleSidebar();
        });

        loadAllData();
    