"""
将 run_search.py 的搜索结果转换为 generate_html_report.py 可用的扁平列表格式
"""
import json
from datetime import datetime

# 读取搜索结果
with open('briefing_search_results.json', 'r', encoding='utf-8') as f:
    search_data = json.load(f)

# 转换为扁平列表
flat_items = []

for module_name, module_data in search_data.items():
    results = module_data.get('results', [])
    for result in results:
        item = {
            'title': result.get('title', ''),
            'content': result.get('content', ''),
            'url': result.get('url', ''),
            'source': result.get('domain', ''),
            'date': datetime.now().strftime('%Y-%m-%d'),  # 添加日期
            'module': module_name  # 添加模块信息
        }
        flat_items.append(item)

# 保存为新的 JSON 文件
output_file = 'search_results_flat.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(flat_items, f, ensure_ascii=False, indent=2)

print(f"转换完成！")
print(f"原始模块数：{len(search_data)}")
print(f"扁平条目数：{len(flat_items)}")
print(f"输出文件：{output_file}")
