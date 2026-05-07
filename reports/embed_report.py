# -*- coding: utf-8 -*-
"""
将早报JSON数据嵌入HTML，生成可离线打开的独立HTML文件
策略：不做任何删除，只做精准字符串替换，安全可靠
"""
import sys
import json
import os
import re
import time

def embed_report(date_str, html_path, out_path):
    json_path = os.path.join(os.path.dirname(html_path), "reports", f"{date_str}.json")
    if not os.path.exists(json_path):
        print(f"[ERROR] 未找到 {json_path}")
        sys.exit(1)

    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    json_js = json.dumps(data, ensure_ascii=False, indent=2)
    json_js = json_js.replace('<', '&lt;').replace('>', '&gt;')
    json_js = json_js.replace('</script>', '<\\/script>')
    var_name = f"EMBEDDED_{date_str.replace('-', '')}"
    ts = int(time.time())

    with open(html_path, encoding="utf-8") as f:
        content = f.read()

    # 1. 返回主页链接改为刷新当前页
    content = content.replace('href="index_v3.html"', 'href="javascript:location.reload()"')

    # 2. 找到 reportData 块末尾，插入 loadReportJSON 覆盖代码
    sep_marker = '// ============================================================\n        // 动态报告加载器'
    sep_pos = content.find(sep_marker)
    if sep_pos == -1:
        print("[ERROR] 未找到 reportData 块末尾标记")
        sys.exit(1)

    override_code = f'''

        // ===== 嵌入早报数据：覆盖 loadReportJSON =====
        const {var_name} = {json_js};
        loadReportJSON = async function(date) {{
            console.log("[loadReportJSON] 使用嵌入数据: {data["date"]}");
            return {var_name};
        }};
        // ===== 嵌入结束 =====

'''
    content = content[:sep_pos] + override_code + content[sep_pos:]

    # 3. 替换 initDynamicData 中的 loadReportJSON 调用为直接使用嵌入数据
    init_pos = content.find('async function initDynamicData')
    if init_pos == -1:
        print("[ERROR] 未找到 initDynamicData")
        sys.exit(1)

    lrj_call = 'const jsonData = await loadReportJSON(todayStr);'
    lrj_call_pos = content.find(lrj_call, init_pos)
    if lrj_call_pos == -1:
        print("[ERROR] 未找到 loadReportJSON 调用")
        sys.exit(1)

    content = content.replace(lrj_call, f'const jsonData = {var_name};')

    # 4. 替换初始化 IIFE：加入 renderAllBuOverview + 遮罩关闭
    old_iife = '(async function() {\n            console.log(\'[DEBUG] 开始加载数据...\');\n            await initDynamicData();\n            console.log(\'[DEBUG] 数据加载完成，dynamicReportData=\', dynamicReportData);\n            if (!dynamicReportData) {\n                console.error(\'[ERROR] dynamicReportData 为空\');\n            }\n        })();'

    new_iife = '''(async function() {
            console.log('[DEBUG] 开始加载数据...');
            await initDynamicData();
            renderAllBuOverview();
            const lo = document.getElementById('loadingOverlay');
            if (lo) { lo.style.display = 'none'; }
            console.log('[DEBUG] 数据加载完成，dynamicReportData=', dynamicReportData);
            if (!dynamicReportData) {
                console.error('[ERROR] dynamicReportData 为空');
            }
        })();'''

    if old_iife in content:
        content = content.replace(old_iife, new_iife)
        print("[OK] IIFE 已替换（含 renderAllBuOverview + 遮罩关闭）")
    else:
        print("[WARNING] IIFE 未匹配到，尝试正则")
        pattern = r"\(async function\(\)\s*\{\s*console\.log\('\[DEBUG\] 开始加载数据\.\.\.'\);\s*await initDynamicData\(\);\s*console\.log\('\[DEBUG\] 数据加载完成，dynamicReportData=', dynamicReportData\);\s*if \(!dynamicReportData\) \{\s*console\.error\('\[ERROR\] dynamicReportData 为空'\);\s*\}\s*\}\)\(\);"
        content, n = re.subn(pattern, new_iife, content)
        print(f"  正则替换: {n}处")

    # 5. 给内联资源URL加时间戳参数
    def add_ts_param(m):
        tag = m.group(0)
        if 'report_' in tag or 'index_v3' in tag:
            return re.sub(r'(href|src)="([^"]+)"', r'\1="\2?v=' + str(ts) + '"', tag)
        return tag
    content = re.sub(r'<((?:link|script)[^>]+(?:href|src)="[^"]*")>', add_ts_param, content)

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(content)

    size = os.path.getsize(out_path) / 1024
    print(f"[OK] 已生成: {out_path} ({size:.1f} KB)")
    print(f"     日期: {date_str} | 事业部: {len(data['departments'])}个")
    print(f"     时间戳: {ts}")
    print()
    print("使用方法:")
    print(f"  1. 双击打开: {os.path.basename(out_path)}")
    print(f"  2. Ctrl+F5 强制刷新（首次打开时）")
    print(f"  3. 明天生成新版本后，直接双击新文件即可")

if __name__ == "__main__":
    date_str = sys.argv[1] if len(sys.argv) > 1 else "2026-04-16"
    html_path = sys.argv[2] if len(sys.argv) > 2 else r"D:\trae\AI Daily report\index_v3.html"
    out_path = sys.argv[3] if len(sys.argv) > 3 else os.path.join(
        os.path.dirname(html_path), f"report_{date_str}_v{int(time.time())}.html"
    )
    embed_report(date_str, html_path, out_path)
