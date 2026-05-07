import json

# 比较 2026-04-10 和 2026-04-12 的结构差异
for date in ["2026-04-10", "2026-04-12"]:
    path = f"reports/{date}.json"
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        deps = data.get("departments", data) if isinstance(data, dict) else {}
        if isinstance(deps, dict):
            first_bu = list(deps.keys())[0]
            first_dept = deps[first_bu]
            print(f"\n{date}: type={type(data).__name__}, keys={list(data.keys())[:5]}")
            print(f"  first bu keys: {list(first_dept.keys())[:8]}")
            sections = first_dept.get("sections", {})
            if isinstance(sections, dict):
                print(f"  sections keys: {list(sections.keys())}")
                pol = sections.get("政策", [{}])[0] if sections.get("政策") else {}
                print(f"  policy item keys: {list(pol.keys())}")
                print(f"  policy content: {str(pol.get('content',''))[:80]}")
        else:
            print(f"\n{date}: list with {len(data)} items")
    except Exception as e:
        print(f"\n{date}: ERROR - {e}")
