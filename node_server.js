const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8888;
const ROOT = process.cwd();

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.gif':  'image/gif',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.txt':  'text/plain; charset=utf-8',
    '.md':   'text/plain; charset=utf-8',
};

// Cache-Control policy by file type
// HTML/JSON: no cache (data changes daily)
// JS/CSS: cache with version param (reload on version change)
// Images: cache for 1 day
const CACHE_POLICY = {
    '.html': 'no-cache, no-store, must-revalidate',
    '.json': 'no-cache, no-store, must-revalidate',
    '.js':   'public, max-age=31536000',  // 1 year, use ?v=xxx to force reload
    '.css':  'public, max-age=31536000',  // 1 year, use ?v=xxx to force reload
    '.png':  'public, max-age=86400',     // 1 day
    '.jpg':  'public, max-age=86400',
    '.gif':  'public, max-age=86400',
    '.svg':  'public, max-age=86400',
    '.ico':  'public, max-age=86400',
    '.txt':  'no-cache, no-store, must-revalidate',
    '.md':   'no-cache, no-store, must-revalidate',
};

function serveFile(req, res) {
    // Strip query string so ?v=xxx doesn't cause 404 on disk
    let pathname = req.url.split('?')[0];
    let filePath = path.join(ROOT, pathname === '/' ? 'index.html' : pathname);
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const cachePolicy = CACHE_POLICY[ext] || 'no-cache, no-store, must-revalidate';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, {
                    'Content-Type': 'text/plain',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                });
                res.end('404 Not Found');
            } else {
                res.writeHead(500, {
                    'Content-Type': 'text/plain',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                });
                res.end('500 Internal Server Error');
            }
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': cachePolicy,
                'Pragma': ext === '.html' || ext === '.json' ? 'no-cache' : '',
                'Expires': ext === '.html' || ext === '.json' ? '0' : ''
            });
            res.end(content);
        }
    });
}

// Startup smoke test: verify all local JS files with query-string cache-busters serve correctly
// (These are the exact files referenced across all HTML pages with ?v=xxx)
const SMOKE_FILES = [
    'electrolyte_data.js?v=20260610',
    'recycling_data_v2.js?v=20260612',
    'chemical_data.js?v=20260613',
    'recycling_gantt.js?v=20260612',
];

function smokeTest() {
    return new Promise((resolve) => {
        let pending = SMOKE_FILES.length;
        let failed = [];
        SMOKE_FILES.forEach(file => {
            http.get(`http://localhost:${PORT}/${file}`, res => {
                if (res.statusCode !== 200) failed.push(`${file} → ${res.statusCode}`);
                if (--pending === 0) {
                    if (failed.length) {
                        console.error('\nSMOKE TEST FAILED — files returned non-200:');
                        failed.forEach(f => console.error(' ', f));
                        process.exit(1);
                    }
                    console.log('SMOKE TEST PASSED — all files serve correctly with query strings');
                    resolve();
                }
            }).on('error', () => {
                failed.push(`${file} → NETWORK ERROR`);
                if (--pending === 0) { console.error('SMOKE TEST FAILED'); process.exit(1); }
            });
        });
    });
}

const server = http.createServer(serveFile);
server.listen(PORT, '0.0.0.0', async () => {
    console.log(`Node.js server running at http://localhost:${PORT}/`);
    console.log(`Serving files from: ${ROOT}`);
    await smokeTest();
});
