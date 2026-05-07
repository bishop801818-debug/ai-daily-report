import json

f = open(r'D:\trae\AI Daily report\reports\2026-04-13.json', 'r', encoding='utf-8')
d = json.load(f)
f.close()

print('=== JSON验证通过 ===')
print('日期:', d['date'])
print('事业部数:', len(d['departments']))

bad_found = []
for bu_key, bu_data in d['departments'].items():
    name = bu_data.get('name', '?')
    sections = bu_data.get('sections', {})
    total_items = sum(len(v) for v in sections.values() if isinstance(v, dict))
    
    full_str = json.dumps(bu_data, ensure_ascii=False)
    has_150 = '150字' in full_str
    has_xx = ('XX万吨' in full_str or 'XX亿元' in full_str or 'XX%' in full_str)
    
    status = 'OK'
    if has_150 or has_xx:
        status = 'PROBLEM'
        bad_found.append(bu_key)
    
    print(f'  [{bu_key}] {name}: {len(sections)}栏目, {total_items}条 | 150字:{has_150} | XX占位符:{has_xx} => {status}')

# Global check
full_json = json.dumps(d, ensure_ascii=False)
print()
if '150字' in full_json:
    print('!!! 警告: 发现"150字"残留 !!!')
else:
    print('[OK] 无150字残留')
if 'XX万吨' in full_json or 'XX亿元' in full_json or 'XX%' in full_json:
    print('!!! 警告: 发现XX占位符残留 !!!')
else:
    print('[OK] 无XX占位符残留')

if not bad_found:
    print('\n[SUCCESS] 全部9个BU检查通过！无占位符/概括性文字问题。')
