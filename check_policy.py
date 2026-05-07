import json
with open('reports/2026-04-12.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for bu_id in ['czly','sdmd','sjld','lpsd','felt']:
    dept = data['departments'][bu_id]
    sections = dept.get('sections', {})
    # 尝试中英文政策维度名
    policy_items = sections.get('政策风向', sections.get('policy', []))
    print(f'=== {bu_id} 政策风向 ({len(policy_items)}条) ===')
    for item in policy_items:
        print(f'  [{item.get("level","?")}] {item.get("title","无标题")[:50]}')
        print(f'       {item.get("content","无内容")[:80]}')
    print()