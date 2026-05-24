const fs = require('fs');
const { parseHTML } = require('linkedom');

// 读取文件
const html = fs.readFileSync('index_v3.html', 'utf-8');

// 提取所有 script 标签内容
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIndex = 0;

while ((match = scriptRegex.exec(html)) !== null) {
    const scriptContent = match[1];
    scriptIndex++;
    
    try {
        // 尝试解析 JavaScript
        new Function(scriptContent);
        console.log(`Script ${scriptIndex}: ✅ 语法正常`);
    } catch (e) {
        console.log(`Script ${scriptIndex}: ❌ 语法错误`);
        console.log(`  错误: ${e.message}`);
        
        // 尝试找到错误位置
        const lines = scriptContent.split('\n');
        const lineMatch = e.message.match(/(\d+):(\d+)/);
        if (lineMatch) {
            const lineNo = parseInt(lineMatch[1]);
            console.log(`  错误位置: line ${lineMatch[1]}:${lineMatch[2]}`);
            if (lineNo > 0 && lineNo <= lines.length) {
                console.log(`  错误代码: ${lines[lineNo - 1].trim()}`);
            }
        }
    }
}
