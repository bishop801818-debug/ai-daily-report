import re, sys, json
sys.stdout.reconfigure(encoding='utf-8')

html = open('index_v3.html', encoding='utf-8').read()

# --- BU_LOGOS ---
idx = html.find("const BU_LOGOS = {")
depth = 0; end = idx
for i, c in enumerate(html[idx:]):
    if c == '{': depth += 1
    elif c == '}':
        depth -= 1
        if depth == 0: end = idx + i + 1; break
logos_block = html[idx:end]
logos = dict(re.findall(r"'(\w+)':\s*'([^']+)'", logos_block))

# --- buNames ---
idx2 = html.find("const buNames = {")
end2 = html.find("};", idx2) + 2
names_block = html[idx2:end2]
names = dict(re.findall(r"(\w+):'([^']+)'", names_block))

# --- mappings ---
BU_CAT = {
    'czly': 'lithium', 'lpsd': 'lithium', 'sjld': 'lithium',
    'felt': 'lithium', 'sdmd': 'lithium',
    'lhy': 'chemical', 'kls': 'chemical', 'bych': 'chemical', 'dhx': 'chemical'
}
BU_TAGS = {
    'czly': '新能源材料', 'lpsd': '电芯智造', 'sjld': '固态电池',
    'felt': '电解液', 'sdmd': '回收再利用',
    'lhy': '润滑防护', 'kls': '车用尿素', 'bych': '催化材料', 'dhx': '电子化学品'
}
BU_ACCENTS = {
    'czly': '#00d4ff', 'lpsd': '#4caf50', 'sjld': '#ff9800',
    'felt': '#9c27b0', 'sdmd': '#e91e63',
    'lhy': '#78909c', 'kls': '#a1887f', 'bych': '#00bcd4', 'dhx': '#7986cb'
}
BU_RADAR = {
    'czly': [78,85,90,65,70,80], 'lpsd': [72,68,75,80,65,55],
    'sjld': [60,92,40,50,55,88], 'felt': [85,78,88,75,70,65],
    'sdmd': [65,55,70,85,50,90], 'lhy':  [80,65,82,78,85,60],
    'kls':  [75,60,85,88,70,75], 'bych': [70,85,75,72,60,78],
    'dhx':  [68,80,70,75,55,82],
}

result = {}
for bu_id in BU_CAT:
    result[bu_id] = {
        'name':   names.get(bu_id, bu_id),
        'logo':   logos.get(bu_id, ''),
        'tag':    BU_TAGS.get(bu_id, ''),
        'accent': BU_ACCENTS.get(bu_id, '#00d4ff'),
        'glow':   BU_ACCENTS.get(bu_id, '#00d4ff') + '40',
        'cat':    BU_CAT[bu_id],
        'radar':  BU_RADAR.get(bu_id, [70]*6),
    }

with open('bu_meta.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"Done! {len(result)} BUs:")
for k, v in result.items():
    print(f"  {k}: {v['name']} | logo:{bool(v['logo'])} | cat:{v['cat']} | tag:{v['tag']}")