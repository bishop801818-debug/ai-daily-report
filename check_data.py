import json
with open('D:/trae/AI Daily report/reports/cninfo_announcements.json', encoding='utf-8') as f:
    data = json.load(f)

for bu in ['fellt', 'lpsd', 'czly', 'sdmd', 'sjld', 'bych', 'kls', 'lhy', 'dhx']:
    items = data['departments'].get(bu, [])[:5]
    bu_name = {
        'fellt': '法恩莱特', 'lpsd': '龙蟠时代', 'czly': '常州锂源',
        'sdmd': '山东美多', 'sjld': '三金锂电', 'bych': '铂源催化',
        'kls': '可兰素', 'lhy': '润滑油', 'dhx': '迪克化学'
    }.get(bu, bu)
    print(f'\n=== {bu_name}({bu}) 前5条 ===')
    for it in items:
        print(f'  [{it["date"]}] {it["title"][:60]}')

# 全局条目示例
global_items = data['departments'].get('__global__', [])[:10]
print(f'\n=== 全局未分类条目({len(global_items)}条展示10条) ===')
for it in global_items:
    print(f'  [{it["date"]}] {it["title"][:60]}')
