import json, sys
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
with open('D:/trae/AI Daily report/search_results.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
items = data if isinstance(data, list) else data.get('results', data.get('items', []))
print(f'总条目: {len(items)}')
for i, item in enumerate(items[:5]):
    title = item.get("title", "")[:60]
    url = item.get("url", "")[:80]
    content = item.get('content', '')
    print(f'--- {i+1} ---')
    print(f'title: {title}')
    print(f'url: {url}')
    print(f'content len: {len(content)}')
    print(f'content preview: {content[:80]}')