import json

with open("reports/2026-04-12.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# 查看 czly 的完整结构
dept = data["departments"]["czly"]
print("Top-level keys:", list(dept.keys()))
print()
items = dept.get("items", [])
print(f"items count: {len(items)}")
print()

# 按维度分组
from collections import defaultdict
by_dim = defaultdict(list)
for item in items:
    dim = item.get("dimension", "unknown")
    by_dim[dim].append(item)

for dim, dim_items in by_dim.items():
    print(f"  [{dim}] count={len(dim_items)}")
    for it in dim_items[:2]:
        print(f"    title: {it.get('title','?')[:60]}")
        print(f"    lead: {it.get('lead','?')[:80] if it.get('lead') else '(EMPTY)'}")
        print(f"    confidence: {it.get('confidence','?')}")
        print()
