import sys, json, time
sys.path.insert(0, r"D:\trae\AI Daily report")
from generate_html_report import build_search_tasks, DATE_STR

tasks = build_search_tasks()
print(f"Starting {len(tasks)} mx_search calls...\n")

all_results = []

for i, task in enumerate(tasks, 1):
    print(f"[{i}/{len(tasks)}] Calling mx_search for: {task['id']}")
    print(f"  Query: {task['query'][:80]}...")

    try:
        result = mcp_call_tool(
            arguments=json.dumps({"query": task["query"]}),
            serverName="eastmoney-mx-search",
            toolName="mx_finance_search"
        )
        print(f"  Result: {str(result)[:200]}")
    except Exception as e:
        print(f"  ERROR: {e}")
        result = None

    if result and isinstance(result, dict):
        items = result.get("results", result.get("data", []))
        if isinstance(items, list):
            print(f"  → Got {len(items)} results")
            all_results.extend(items)
        else:
            print(f"  → Unexpected format: {type(items)}")
    else:
        print(f"  → No results")

print(f"\nTotal results collected: {len(all_results)}")

# Save to search_results.json
output_path = "D:/trae/AI Daily report/search_results.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(all_results, f, ensure_ascii=False, indent=2)
print(f"Saved to {output_path}")