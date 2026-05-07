import json

with open("reports/2026-04-12.json", "r", encoding="utf-8") as f:
    data = json.load(f)

dept = data["departments"].get("sdmd", {})
policy_items = dept.get("sections", {}).get("政策", [])
print(f"sdmd policy items: {len(policy_items)}")
for p in policy_items[:3]:
    print(f"  module={p.get('module')!r}, title={p.get('title')[:40]!r}")
    print(f"  content={p.get('content')!r}")
    print(f"  confidence={p.get('confidence')}")
    print(f"  fallback_level={p.get('fallback_level')}")
    print()
