import json

with open("reports/2026-04-12.json", "r", encoding="utf-8") as f:
    data = json.load(f)

bu_id = "czly"
dept = data["departments"][bu_id]
sections = dept.get("sections", [])
print(f"sections type: {type(sections)}, len={len(sections)}")
if sections:
    print(f"first item type: {type(sections[0])}")
    print(f"first item: {sections[0][:100] if isinstance(sections[0], str) else sections[0]}")
