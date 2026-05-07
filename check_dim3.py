import json

with open("reports/2026-04-12.json", "r", encoding="utf-8") as f:
    data = json.load(f)

bu_id = "czly"
dept = data["departments"][bu_id]
sections = dept.get("sections", [])
print(f"sections count: {len(sections)}")
for sec in sections:
    print(f"\n  [{sec.get('id','?')}] {sec.get('title','?')}")
    items = sec.get("items", [])
    lead = sec.get("lead", "?")
    print(f"    items: {len(items)}, lead: {lead[:100] if lead else '(EMPTY)'}")
    if items:
        print(f"    first item: {items[0].get('title','?')[:70]}")
