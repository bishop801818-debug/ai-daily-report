#!/usr/bin/env python3
"""检查生成的早报内容质量"""
import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('D:/trae/AI Daily report/reports/2026-04-12.json', 'r', encoding='utf-8') as f:
    report = json.load(f)

depts = report.get('departments', {})
print(f"事业部数: {len(depts)}")
print()

# 检查各BU的头条和竞品/客户动态
for bu_id, dept in depts.items():
    bu_name = dept.get('division_name', bu_id)
    sections = dept.get('sections', {})

    print(f"=== [{bu_id}] {bu_name} ===")

    # headline
    headline = dept.get('headline', '')
    lead = dept.get('lead_judgment', '')
    print(f"  头条: {headline[:50] if headline else '(空)'}")
    print(f"  主线: {lead[:80] if lead else '(空)'}")

    # 各维度高置信条目
    for dim_name, items in sections.items():
        if not items:
            continue
        high = [x for x in items if x.get('confidence') == 'high' or x.get('level') == 'A']
        bg = '[背景]' if items and items[0].get('background_ref') else ''
        if high:
            print(f"  [{dim_name}](高置信{len(high)}条){bg}")
            for item in high[:2]:
                title = item.get('title', '')[:40]
                print(f"    - {title}")
        else:
            first_title = (items[0].get('title') or '')[:40] if items else ''
            print(f"  [{dim_name}](无高置信){bg} {first_title}")

    print()
