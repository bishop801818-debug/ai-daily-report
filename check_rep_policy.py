import json

with open(r"D:\trae\AI Daily report\reports\2026-04-12.json", "r", encoding="utf-8") as f:
    data = json.load(f)

for bu_id in ["czly", "sdmd", "sjld", "lpsd", "felt", "kls", "lhy", "dhx", "bych"]:
    dept = data["departments"].get(bu_id, {})
    sections = dept.get("sections", {})
    policy_items = sections.get("政策", [])
    print(f"\n=== {bu_id} 政策 ({len(policy_items)}条) ===")
    for p in policy_items:
        print(f"  [{p.get('level','?')}] {p.get('title','')[:55]}")
        print(f"       content: {p.get('content','')[:80]}")
        print(f"       source={p.get('source','')} fallback={p.get('fallback_level','')}")