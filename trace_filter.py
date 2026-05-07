# -*- coding: utf-8 -*-
import json, sys
sys.path.insert(0, 'd:/buddy/skills/lithium-division-morning-report')

with open('search_results.json', encoding='utf-8') as f:
    search_data = json.load(f)

# 检查这些"四部门"文章的详情
four_dept = [a for a in search_data
    if (a.get('title','') or '').find('四部门') >= 0]

print("=== FourDept search articles - ALL FIELDS ===")
for i, a in enumerate(four_dept[:3]):
    print(f"\n--- Article {i+1} ---")
    for k, v in a.items():
        v_str = str(v)[:150] if v else '(empty)'
        print(f"  {k}: {v_str}")

# Now check: in matched filtering, what does the text look like?
# For czly, what content keywords are used?
import os, json as j
configs_dir = 'd:/buddy/skills/lithium-division-morning-report/configs'
cfg_file = os.path.join(configs_dir, '常州锂源.json')
with open(cfg_file, encoding='utf-8') as f:
    czly_cfg = j.load(f)

search_cfgs = czly_cfg.get('search', {})
core_kw = search_cfgs.get('core_keywords', [])
print("\n=== czly search core_keywords ===")
for kw in core_kw:
    print(f"  {kw}")

# Check: do the four_dept titles contain any of these czly core_keywords?
print("\n=== FourDept titles vs czly core_keywords ===")
for a in four_dept[:3]:
    title = a.get('title','') or ''
    for kw in core_kw:
        if kw in title:
            print(f"  MATCH '{kw}' in '{title[:50]}'")
            break
    else:
        print(f"  NO MATCH: {title[:50]}")
