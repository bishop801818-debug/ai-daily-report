import sys, json, time
sys.path.insert(0, r"D:\trae\AI Daily report")
from generate_html_report import build_search_tasks, DATE_STR

# Build the 5 search tasks
tasks = build_search_tasks()
print(f"Generated {len(tasks)} search tasks\n")

# Print each query for reference
for i, t in enumerate(tasks, 1):
    print(f"Task {i} [{t['id']}]: {t['query'][:120]}...")
    print()