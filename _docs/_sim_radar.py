import re, json

with open('radar_detail_lpsd.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Simulate getMonthData
radar_hist = {}
idx = html.find("'2026-05':")
if idx >= 0:
    snippet = html[idx:idx+500]
    dims_m = re.search(r'dims:\s*\{([^}]+)\}', snippet)
    if dims_m:
        print('dims found:', dims_m.group(0))
        # Extract individual values
        for di in range(1, 7):
            dk = 'd' + str(di)
            kpos = dims_m.group(1).find(dk + ':')
            if kpos >= 0:
                num_start = kpos + len(dk) + 1
                num_end = num_start
                while num_end < len(dims_m.group(1)) and dims_m.group(1)[num_end].isdigit():
                    num_end += 1
                val = dims_m.group(1)[num_start:num_end]
                print(f'  {dk} = {val}')

# Simulate renderScoreOverview
print()
print('Simulating renderScoreOverview:')
dim_names = ['战略执行力', '经营效益', '运营效率', '技术创新力', '风险合规', '组织活力']
dims = {'d1': 58, 'd2': 88, 'd3': 75, 'd4': 85, 'd5': 85, 'd6': 75}
weights = [20, 20, 18, 17, 13, 12]
vals = [dims['d1'], dims['d2'], dims['d3'], dims['d4'], dims['d5'], dims['d6']]
score = round(sum(v * w / 100 for v, w in zip(vals, weights)))
print(f'Total score: {score}')
print('Individual:')
for i, d in enumerate(['d1','d2','d3','d4','d5','d6']):
    print(f'  {dim_names[i]}: {vals[i]} (权重{weights[i]}%)')

# Check renderRadar indicator
print()
print('renderRadar vals:', vals)