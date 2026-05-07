import json

with open("reports/2026-04-12.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for bu_id in ["czly", "sdmd", "sjld", "lpsd", "felt"]:
    dept = data["departments"][bu_id]
    dims = dept.get("dimensions", {})
    print(f"\n=== {bu_id} ===")
    for dim_id, dim_data in dims.items():
        items = dim_data.get("items", [])
        lead = dim_data.get("lead", "?")
        quality = dim_data.get("_quality", "?")
        print(f"  [{dim_id}] items={len(items)} quality={quality}")
        print(f"    lead: {lead[:80] if lead else '(EMPTY)'}")
        if items:
            print(f"    first item title: {items[0].get('title', '?')[:60]}")
