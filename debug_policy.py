import json
import sys
sys.path.insert(0, r"D:\trae\AI Daily report")
from generate_html_report import classify_module, get_bu_keywords, _build_policy_kw_tables

kw = _build_policy_kw_tables()

with open('search_results.json', 'r', encoding='utf-8') as f:
    raw = json.load(f)

print(f"总条目: {len(raw)}")

# 对所有条目标注 module，并统计各 module 的数量
module_counts = {}
for item in raw:
    title = item.get('title','')
    content = item.get('content','')
    text = title + ' ' + content
    mod, is_prio = classify_module(text, 'czly', {})
    item['_mod'] = mod
    module_counts[mod] = module_counts.get(mod, 0) + 1

print("各 module 条目数:", module_counts)

# 打印所有被判为 policy 的条目
print("\n=== 判为 policy 的条目 ===")
for item in raw:
    if item.get('_mod') == 'policy':
        print(f"  [{item.get('source','')[:30]}] {item.get('title','')[:60]}")
        print(f"    content: {item.get('content','')[:60]}")

# 打印被判为 competitor 但含有"动力电池"或"储能电池"的条目
print("\n=== 判为 competitor/market，含'动力电池'/'储能电池'的条目 ===")
for item in raw:
    mod = item.get('_mod','')
    if mod in ('competitor', 'market'):
        title = item.get('title','')
        content = item.get('content','')
        if '动力电池' in title or '储能电池' in title:
            print(f"  [{mod}] {title[:60]}")
            print(f"    content: {content[:60]}")