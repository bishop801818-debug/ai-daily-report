import json

with open('D:/trae/AI Daily report/reports/cninfo_announcements.json', encoding='utf-8') as f:
    data = json.load(f)

# 显示前50条原始数据（按时间倒序）
raw = data.get('raw_preview', [])
print(f"共 {len(raw)} 条原始预览\n")
for r in raw[:50]:
    print(f"[{r['date']}] {r['title'][:70]}")
