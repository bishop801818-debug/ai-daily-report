import json

with open("search_results.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# 统计各BU的政策相关搜索结果
from collections import defaultdict

bu_policy = defaultdict(list)
bu_all = defaultdict(list)

for item in data:
    bu = item.get("bu", "unknown")
    dim = item.get("dimension", "")
    bu_all[bu].append(item)
    if "政策" in dim or "policy" in dim.lower():
        bu_policy[bu].append(item)

print("各BU搜索结果总数 vs 政策相关数：")
for bu in sorted(set(list(bu_all.keys()) + list(bu_policy.keys()))):
    total = len(bu_all[bu])
    policy = len(bu_policy[bu])
    print(f"  {bu}: 总{total} | 政策{policy}")

print("\n搜索结果维度分布示例(czly)：")
for item in bu_all["czly"][:5]:
    print(f"  dim={item.get('dimension','?')} title={item.get('title','?')[:50]}")
