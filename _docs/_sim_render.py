import re

with open('radar_detail_lpsd.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Simulate what renderScoreOverview does
dims = {'d1': 58, 'd2': 88, 'd3': 75, 'd4': 85, 'd5': 85, 'd6': 75}
weights = [20, 20, 18, 17, 13, 12]
dim_names = ['战略执行力', '经营效益', '运营效率', '技术创新力', '风险合规', '组织活力']

vals = [dims['d1'], dims['d2'], dims['d3'], dims['d4'], dims['d5'], dims['d6']]
score = round(sum(v * w / 100 for v, w in zip(vals, weights)))
print(f'Total score: {score}')

html_output = ''
for i, d in enumerate(['d1','d2','d3','d4','d5','d6']):
    v = dims[d] if dims.get(d) is not None else 0
    html_output += (
        '<div class="dim-item">'
        '<div class="dim-name">' + dim_names[i] + '<span style="font-size:10px;color:#94a3b8"> · ' + str(weights[i]) + '%</span></div>'
        '<div class="dim-score" style="color:#2e75b6">' + str(v) + '</div>'
        '<div class="dim-max">/100</div>'
        '</div>'
    )
print('Generated HTML:')
print(html_output)
print()
print('All 6 items present:', html_output.count('dim-item') == 6)
print('Values found:', re.findall(r'dim-score[^>]*>(\d+)', html_output))