const fs = require('fs');
const html = fs.readFileSync('index_v3.html', 'utf8');

// 提取 <script> 标签内容
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) {
    console.log('ERROR: 找不到 <script> 标签');
    process.exit(1);
}
const js = match[1];
console.log(`✓ 提取到 JS 内容：{js.length} 字符`);

// 写入临时文件
const tmp = '_tmp_full.js';
fs.writeFileSync(tmp, js);

// 用 node -c 检查语法
const { execSync } = require('child_process');
try {
    execSync(`node -c ${tmp}`, { stdio: 'inherit' });
    console.log('✅ 完整 JS 语法检查通过！');
} catch (e) {
    console.log('\n❌ 语法错误，详见上方信息');
}
