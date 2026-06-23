with open('radar_detail_lpsd.html', 'r', encoding='utf-8') as f:
    html = f.read()

idx = html.find('const RADAR_HISTORY_LPSD = {')
block_start = idx
# Show first 150 chars with code points
s = html[idx:idx+150]
result = []
for ch in s:
    if ord(ch) < 128:
        result.append(ch)
    else:
        result.append(f'U+{ord(ch):04X}')
result_str = ''.join(result)
print('Block start (ASCII/codepoints):', result_str[:200])

print()
# Find PDF
pdfpos = html.find('PDF')
print('PDF position:', pdfpos)
pdfpos_lower = html.find('pdf')
print('pdf (lower) position:', pdfpos_lower)

# Check for PDF in bytes
with open('radar_detail_lpsd.html', 'rb') as f:
    raw = f.read()
pdf_bytes = raw.find(b'pdf')
print('pdf bytes position:', pdf_bytes)
if pdf_bytes >= 0:
    snippet = raw[pdf_bytes-20:pdf_bytes+20]
    print('Raw around pdf:', snippet)