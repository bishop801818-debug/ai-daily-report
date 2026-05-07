import json, sys
sys.path.insert(0, r"D:\trae\AI Daily report")
from generate_html_report import load_bu_configs, get_bu_keywords

configs = load_bu_configs()

with open(r"D:\trae\AI Daily report\search_results.json", "r", encoding="utf-8") as f:
    raw = json.load(f)

bu_ids = ["czly", "sdmd", "sjld", "lpsd", "felt"]

for bu_id in bu_ids:
    if bu_id not in raw:
        print(f"{bu_id}: 无数据")
        continue

    bu_kws = get_bu_keywords(bu_id, configs)
    # policy keywords for this BU
    pol_kws = configs.get(bu_id, {}).get("modules", {}).get("policy", {}).get("keywords", [])

    items = raw[bu_id]
    policy_kw_hits = []
    all_hits = []

    for item in items:
        title = item.get("title", "")
        snippet = item.get("snippet", "")
        text = title + " " + snippet
        hit_kws = [k for k in bu_kws if k in text]
        if hit_kws:
            all_hits.append((title[:50], hit_kws[:5]))

        # 检查是否命中 policy keywords
        pol_hit = [k for k in pol_kws if k in text]
        if pol_hit:
            policy_kw_hits.append((title[:60], pol_hit))

    print(f"\n=== {bu_id} ===")
    print(f"  总搜索返回: {len(items)} 条")
    print(f"  关键词命中: {len(all_hits)} 条")
    print(f"  政策关键词命中: {len(policy_kw_hits)} 条")
    if policy_kw_hits:
        print("  政策关键词命中的文章:")
        for t, kws in policy_kw_hits[:5]:
            print(f"    - {t}")
            print(f"      命中的政策词: {kws}")
    else:
        print("  [无政策关键词命中]")