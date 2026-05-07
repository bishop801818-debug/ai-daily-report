import json, sys, os, re
sys.path.insert(0, 'D:/trae/AI Daily report')
from generate_html_report import load_bu_configs, get_bu_keywords, DEPT_IDS

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

with open('D:/trae/AI Daily report/search_results.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
items = data if isinstance(data, list) else data.get('results', data.get('items', []))

configs = load_bu_configs()
# 测试 czly 的关键词匹配
kws = get_bu_keywords('czly', configs)
print(f'czly 关键词数: {len(kws)}')
print(f'前10个关键词: {kws[:10]}')

# 测试命中情况（不考虑内容质量）
hits_by_bu = {bu: 0 for bu in DEPT_IDS}
for item in items:
    title = item.get('title', '')
    content = item.get('content', '')[:500]
    combined = title + ' ' + content
    for bu_id in DEPT_IDS:
        bu_kws = get_bu_keywords(bu_id, configs)
        if any(kw in combined for kw in bu_kws):
            hits_by_bu[bu_id] += 1

print(f'\n各BU关键词命中（不过滤内容质量）:')
for bu, cnt in hits_by_bu.items():
    print(f'  {bu}: {cnt}条')

print(f'\n总条目: {len(items)}')