import json

with open(r"D:\trae\AI Daily report\search_results.json", "r", encoding="utf-8") as f:
    raw = json.load(f)

print("Type:", type(raw))
if isinstance(raw, dict):
    print("Keys:", list(raw.keys())[:10])
    for k in list(raw.keys())[:3]:
        v = raw[k]
        print(f"  {k}: {type(v).__name__} len={len(v) if hasattr(v,'__len__') else 'N/A'}")
        if isinstance(v, list) and v:
            print(f"    [0] keys: {list(v[0].keys()) if isinstance(v[0], dict) else type(v[0])}")
            print(f"    [0] snippet: {str(v[0])[:100]}")
elif isinstance(raw, list):
    print("List len:", len(raw))
    if raw:
        print("[0] keys:", list(raw[0].keys()) if isinstance(raw[0], dict) else type(raw[0]))