import sys, re
sys.stdout.reconfigure(encoding='utf-8')
with open('D:/trae/AI Daily report/save_mx_results.py', 'r', encoding='utf-8') as f:
    content = f.read()
# Find lines with Chinese curly quotes
for i, line in enumerate(content.split('\n'), 1):
    if '\u201c' in line or '\u201d' in line:
        print(f'Line {i}: {repr(line[:100])}')