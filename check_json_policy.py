import json

with open(r"D:\trae\AI Daily report\reports\2026-04-12.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for bu_id in ["czly", "sdmd", "sjld"]:
    dept = data["departments"].get(bu_id, {})
    sections = dept.get("sections", {})
    all_items = []
    for sec_name, items in sections.items():
        for it in items:
            all_items.append((sec_name, it.get("module", "?"), it.get("title", "")[:40], it.get("fallback_level", ""), it.get("level", "")))

    print(f"\n=== {bu_id} ALL items ===")
    for sec, mod, title, fb, lv in all_items:
        print(f"  [{sec}] module={mod} fb={fb} level={lv} | {title}")