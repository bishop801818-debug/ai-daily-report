# 检查4月13日生成的早报内容
import json
import os
import re

# 读取 search_results.json 的基本信息和各BU内容
print('=== 日期和搜索窗口 ===')
with open('search_results.json', encoding='utf-8') as f:
    data = json.load(f)
print(f"date: {data.get('date')}")
print(f"window: {data.get('window_start')} ~ {data.get('window_end')}")
print()

# 数据在 departments 结构中
departments = data.get('departments', {})
print(f"=== BU数量: {len(departments)} ===")
print()

# 读取生成的各BU HTML内容
reports_dir = 'reports'
for bu in ['czly', 'sdmd', 'sjld', 'lpsd', 'felt']:
    if bu not in departments:
        continue
    dept = departments[bu]
    print(f'=== {bu}: {dept.get("name")} ===')
    print(f'headline: {dept.get("headline", "")}')
    print(f'lead: {dept.get("lead", "")[:100]}...')
    print()
    
    # 政策栏目
    sections = dept.get('sections', {})
    policy = sections.get('政策', [])
    print(f'政策栏目: {len(policy)}条')
    for i, p in enumerate(policy[:5]):
        level = p.get('level', '?')
        title = p.get('title', '')[:50]
        print(f'  [{level}] {title}')
    print()