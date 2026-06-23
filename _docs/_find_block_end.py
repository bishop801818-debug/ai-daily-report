import re

with open('radar_detail_lpsd.html', 'r', encoding='utf-8', errors='replace') as f:
    html = f.read()

idx = html.find('RADAR_HISTORY_LPSD = {')
print('RADAR_HISTORY_LPSD = { at char:', idx)

depth = 0
in_string = False
string_char = None
i = 0
true_end = None

for i in range(idx + len('RADAR_HISTORY_LPSD = {') - 1, len(html)):
    c = html[i]
    if not in_string:
        if c in '"\'`':
            in_string = True
            string_char = c
        elif c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                if html[i+1:i+3] == ';\n':
                    true_end = i + 2
                    break
    else:
        if c == '\\':
            i += 1
        elif c == string_char:
            in_string = False

print('True end position:', true_end)
if true_end:
    print('Block length:', true_end - idx)
    print('After true_end snippet:', repr(html[true_end:true_end+50]))