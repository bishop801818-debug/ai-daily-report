#!/usr/bin/env python3
import json, sys
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

with open('D:/trae/AI Daily report/search_results.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

has_date = sum(1 for x in data if x.get('date'))
print(f'Total: {len(data)}, with date: {has_date}, without: {len(data)-has_date}')

month_cnt = Counter()
recent = []
for item in data:
    d = item.get('date', '')
    if d:
        month_cnt[d[:7]] += 1
        if d >= '2026-04':
            recent.append(item)

print('By month:', dict(sorted(month_cnt.items())))
print(f'2026-April onwards: {len(recent)} items')
print()
print('--- 2026-April+ results ---')
for item in recent[:20]:
    sid = item.get('_search_id', '?')
    title = (item.get('title') or '')[:45]
    d = item.get('date', 'no-date')
    print(f'[{sid}] {d} | {title}')
