import json

with open("reports/2026-04-12.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print("窗口:", data.get("window_start"), "至", data.get("window_end"))
print("生成时间:", data.get("generated_at"))
print()

for bu_id, dept in data["departments"].items():
    sections = dept.get("sections", {})
    policy_items = sections.get("政策", [])
    total = sum(len(v) for v in sections.values())
    print(f"{bu_id}: 总{total}事件, 政策={len(policy_items)}条")
    if policy_items:
        p = policy_items[0]
        print(f"  [{p.get('level','?')}] {p.get('title','?')[:50]}")
        print(f"  content: {p.get('content','?')[:70]}")
    else:
        print(f"  (无政策条目)")
    print()