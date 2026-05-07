import json

with open(r"D:\trae\AI Daily report\reports\2026-04-12.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for bu_id in ["czly", "sdmd", "sjld", "lpsd", "felt"]:
    dept = data["departments"][bu_id]
    sections = dept.get("sections", {})
    print(f"\n=== {bu_id} sections ===")
    print("Section keys:", list(sections.keys()))

    for sec_name, items in sections.items():
        if items:
            print(f"  {sec_name}: {len(items)}条")
            for it in items[:3]:
                print(f"    [{it.get('level','?')}] {it.get('title','无标题')[:50]}")
                print(f"         content: {it.get('content','')[:60]}")