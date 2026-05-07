# -*- coding: utf-8 -*-
import json

with open('search_results.json', encoding='utf-8') as f:
    data = json.load(f)

policy_keywords = [
    '办法','通知','规定','条例','意见','政策','规划','实施方案',
    '管理细则','燃料电池','储能','锂电池','废旧电池','回收',
    '白名单','以旧换新','补贴','114号','136号','工信部','发改委','能源局',
    '行业规范','安全标准','准入','产能','规范条件','GB38031'
]

hits = []
for item in data:
    title = item.get('title', '') or ''
    content = (item.get('content', '') or '')[:300]
    pub = item.get('publish_date', '') or item.get('date', '') or ''
    for kw in policy_keywords:
        if kw in title or kw in content:
            hits.append({'title': title[:60], 'keyword': kw, 'date': pub})
            break

print(f'总文章数: {len(data)}')
print(f'含政策关键词文章数: {len(hits)}')
print()
for h in hits[:40]:
    print(f'[{h["date"]}] {h["keyword"]} | {h["title"]}')
