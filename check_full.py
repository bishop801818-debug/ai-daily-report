import json

with open("reports/2026-04-12.json", "r", encoding="utf-8") as f:
    data = json.load(f)

bu_id = "czly"
dept = data["departments"][bu_id]
print(json.dumps(dept, ensure_ascii=False, indent=2)[:3000])
