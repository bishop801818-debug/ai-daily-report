import re

with open('radar_detail_lpsd.html', 'rb') as f:
    raw = f.read()

pattern = rb'RADAR_HISTORY_LPSD\s*=\s*\{'
for m in re.finditer(pattern, raw):
    snippet = raw[m.start():m.start()+60]
    # ASCII-safe
    s = ''.join(chr(b) if 32 <= b < 127 else '?' for b in snippet)
    print(f'at byte {m.start()}: {s!r}')