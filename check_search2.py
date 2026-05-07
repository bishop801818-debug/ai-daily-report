import json

with open("search_results.json", "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"Type: {type(data)}, Len: {len(data) if isinstance(data, list) else 'N/A'}")
if isinstance(data, list):
    print(f"\n前3条：")
    for item in data[:3]:
        print(json.dumps(item, ensure_ascii=False)[:200])
        print()
elif isinstance(data, dict):
    print(f"Keys: {list(data.keys())[:10]}")
    first_key = list(data.keys())[0]
    print(f"\nFirst key '{first_key}':")
    print(json.dumps(data[first_key], ensure_ascii=False)[:300])
