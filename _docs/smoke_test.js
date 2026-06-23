/**
 * smoke_test.js — 回归测试：验证 node_server.js 能正确处理带查询参数的请求
 * 用法: node _docs/smoke_test.js
 * 失败时退出码 1，成功时退出码 0
 */
const http = require('http');

const SERVER = 'http://localhost:8888';

// 所有 HTML 中引用过的带 ?v= 参数的本地 JS 文件
const SMOKE_FILES = [
    'electrolyte_data.js?v=20260610',
    'recycling_data_v2.js?v=20260612',
    'chemical_data.js?v=20260613',
    'recycling_gantt.js?v=20260612',
];

function get(path) {
    return new Promise((resolve, reject) => {
        http.get(`${SERVER}/${path}`, res => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        }).on('error', reject);
    });
}

async function run() {
    const results = [];
    for (const file of SMOKE_FILES) {
        const { status } = await get(file);
        results.push({ file, status, ok: status === 200 });
    }

    console.log('\n=== Server Smoke Test ===');
    let allPass = true;
    for (const r of results) {
        const mark = r.ok ? '✓' : '✗';
        console.log(`  ${mark} ${r.file} → HTTP ${r.status}`);
        if (!r.ok) allPass = false;
    }

    if (allPass) {
        console.log('\nAll tests passed.');
        process.exit(0);
    } else {
        console.log('\nSome tests FAILED. Check server is running from correct directory.');
        process.exit(1);
    }
}

run().catch(err => {
    console.error('Network error — is the server running?', err.message);
    process.exit(1);
});
