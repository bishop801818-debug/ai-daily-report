# -*- coding: utf-8 -*-
import json, sys, os
os.chdir('D:/trae/AI Daily report')
sys.path.insert(0, 'd:/buddy/skills/lithium-division-morning-report')

with open('reports/2026-04-12.json', encoding='utf-8') as f:
    report = json.load(f)

# Find all articles with "四部门" in search_results.json
with open('search_results.json', encoding='utf-8') as f:
    search_data = json.load(f)

four_dept_search = [a for a in search_data
    if (a.get('title','') or '').find('\u56db\u90e8\u95e8') >= 0
    or (a.get('content','') or '').find('\u56db\u90e8\u95e8') >= 0]
print("search_results.json - FourDept articles:")
for a in four_dept_search:
    print("  Title:", (a.get('title','') or '')[:70])
    print("  Content:", (a.get('content','') or '')[:100])
    print()

print("JSON report - departments structure:")
for bu_id, bu_data in report.get('departments', {}).items():
    print("  BU:", bu_id, "type:", type(bu_data).__name__)
    if isinstance(bu_data, dict):
        for k in list(bu_data.keys())[:5]:
            print("    key:", k)
    break
