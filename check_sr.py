import json

with open(r"D:\trae\AI Daily report\search_results.json", "r", encoding="utf-8") as f:
    raw = json.load(f)

print(f"Total items: {len(raw)}")
print("\nFirst 3 items:")
for item in raw[:3]:
    print(json.dumps(item, ensure_ascii=False)[:200])

# Check what keys exist across items
all_keys = set()
for item in raw:
    all_keys.update(item.keys())
print("\nAll keys across items:", all_keys)

# Check for BU identification field
bu_keys = [k for k in all_keys if 'bu' in k.lower() or 'dept' in k.lower() or 'division' in k.lower() or 'source' in k.lower()]
print("Potential BU keys:", bu_keys)

# Count unique sources
sources = set(item.get("source","") for item in raw)
print(f"\nUnique sources ({len(sources)}):")
for s in sorted(sources):
    print(f"  - {s}")

# Check dates
dates = set(item.get("date","") for item in raw)
print(f"\nUnique dates ({len(dates)}):")
for d in sorted(dates):
    print(f"  - {d}")