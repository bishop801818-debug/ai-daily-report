const fs = require('fs');
const acorn = require('acorn');  // 如果可用
const esprima = require('esprima');  // 如果可用

// 读取文件
const html = fs.readFileSync('index_v3.html', 'utf8');

// 提取所有 script 标签内容
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIndex = 0;
let hasError = false;

console.log('=== 检查 JS 语法 ===\n');

while ((match = scriptRegex.exec(html)) !== null) {
    scriptIndex++;
    const scriptContent = match[1];
    
    try {
        // 尝试用 Function 构造函数解析
        new Function(scriptContent);
        console.log(`Script ${scriptIndex}: ✅ 语法正常`);
    } catch (e) {
        hasError = true;
        console.log(`Script ${scriptIndex}: ❌ 语法错误`);
        console.log(`  错误信息: ${e.message}`);
        
        // 尝试定位错误行
        const lineMatch = e.message.match(/Unexpected .* at position (\d+)/i);
        if (lineMatch) {
            const pos = parseInt(lineMatch[1]);
            const before = scriptContent.substring(0, pos);
            const lineNo = before.split('\n').length;
            console.log(`  错误位置: 第 ${lineNo} 行附近`);
            
            // 显示错误行前后内容
            const lines = scriptContent.split('\n');
            if (lineNo >= 1 && lineNo <= lines.length) {
                console.log(`  错误行内容: ${lines[lineNo-1].trim()}`);
                if (lineNo > 1) console.log(`  前一行: ${lines[lineNo-2].trim()}`);
                if (lineNo < lines.length) console.log(`  后一行: ${lines[lineNo].trim()}`);
            }
        }
        console.log('');
    }
}

if (!hasError) {
    console.log('\n✅ 所有 script 标签语法正常！');
} else {
    console.log('\n❌ 发现语法错误，请修复后再试');
}
