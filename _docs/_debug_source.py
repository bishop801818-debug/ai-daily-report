import re

with open('radar_detail_lpsd.html', 'r', encoding='utf-8') as f:
    html = f.read()

idx = html.find("'2026-05':")
block = html[idx:idx+500]

print('Block content (repr first 300):')
print(repr(block[:300]))
print()

# Test the regex
pattern = r'//.*?(?:PDF|pdf|第\d+页|来源|实际数据)'
m = re.search(pattern, block)
print('Regex match:', m.group(0) if m else 'NOT FOUND')

# Also check in wider region
block2 = html[idx:idx+2000]
m2 = re.search(pattern, block2)
print('Regex match in wider region:', m2.group(0) if m2 else 'NOT FOUND')