// 验证 index_v3.html 中的 JavaScript 语法
const fs = require('fs');
const file = process.argv[2] || 'index_v3.html';

const content = fs.readFileSync(file, 'utf8');

// 提取所有 <script> 标签中的内容
const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;
let match;
let scriptNum = 0;

while ((match = scriptRegex.exec(content)) !== null) {
    scriptNum++;
    const scriptContent = match[1];
    const lineNum = content.substring(0, match.index).split('\n').length;
    
    try {
        // 尝试解析 JavaScript
        new Function(scriptContent);
        console.log(`✅ Script #${scriptNum} (行 ~${lineNum}): 语法正确`);
    } catch (e) {
        console.log(`❌ Script #${scriptNum} (行 ~${lineNum}): 语法错误`);
        console.log(`   ${e.message}`);
        
        // 显示错误附近的代码
        const lines = scriptContent.split('\n');
        const errorLineMatch = e.message.match(/Unexpected .* at position (\d+)/);
        if (errorLineMatch) {
            const pos = parseInt(errorLineMatch[1]);
            const lineNumInScript = scriptContent.substring(0, pos).split('\n').length;
            console.log(`   错误位置：脚本内第 ~${lineNumInScript} 行`);
            if (lineNumInScript > 0 && lineNumInScript <= lines.length) {
                console.log(`   代码：${lines[lineNumInScript - 1].substring(0, 100)}`);
            }
        }
    }
}

console.log(`\n共找到 ${scriptNum} 个 <script> 标签`);
