"""
合并现有的搜索结果文件并转换为标准格式
"""
import json
from datetime import datetime

# 读取第一个搜索结果文件（结构化格式）
with open('search_results.json', 'r', encoding='utf-8') as f:
    data1 = json.load(f)

# 读取第二个搜索结果文件（扁平列表格式）
with open('websearch_results_20260411.json', 'r', encoding='utf-8') as f:
    data2 = json.load(f)

# 转换为标准格式
standard_items = []

# 处理第一个文件的 items
items1 = data1.get('items', [])
for item in items1:
    standard_item = {
        'title': item.get('title', ''),
        'content': item.get('content', ''),
        'url': item.get('url', ''),
        'date': item.get('date', ''),
        'source': item.get('source', ''),
    }
    standard_items.append(standard_item)

print(f"从 search_results.json 加载了 {len(items1)} 条数据")

# 处理第二个文件（已经是扁平列表）
for item in data2:
    standard_item = {
        'title': item.get('title', ''),
        'content': item.get('content', ''),
        'url': item.get('url', ''),
        'date': item.get('date', ''),
        'source': item.get('source', ''),
    }
    # 确保 content 长度足够
    if len(standard_item['content']) < 100:
        print(f"警告：条目 content 不足 100 字：{standard_item['title'][:30]}")
    standard_items.append(standard_item)

print(f"从 websearch_results_20260411.json 加载了 {len(data2)} 条数据")

# 去重（基于 title+url）
seen = set()
unique_items = []
for item in standard_items:
    key = item['title'] + item['url']
    if key not in seen:
        seen.add(key)
        unique_items.append(item)

print(f"\n去重后总计：{len(unique_items)} 条数据")

# 保存为标准格式
output_file = 'search_results.json'
# 先备份原文件
import shutil
shutil.copy('search_results.json', 'search_results_backup.json')

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(unique_items, f, ensure_ascii=False, indent=2)

print(f"\n合并完成！")
print(f"输出文件：{output_file}")
print(f"总条目数：{len(unique_items)}")

# 统计各来源的数据
sources = {}
for item in unique_items:
    source = item.get('source', '未知')
    sources[source] = sources.get(source, 0) + 1

print(f"\n数据来源统计：")
for source, count in sorted(sources.items(), key=lambda x: -x[1]):
    print(f"  {source}: {count} 条")
