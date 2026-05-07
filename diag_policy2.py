import json
from generate_html_report import classify_module, _get_policy_kw_tables

with open(r"D:\trae\AI Daily report\search_results.json", "r", encoding="utf-8") as f:
    raw = json.load(f)

kw = _get_policy_kw_tables()

bu_ids = ["czly", "sdmd", "sjld", "lpsd", "felt", "lhy", "kls", "dhx", "bych"]

for bu_id in bu_ids:
    if bu_id not in raw:
        continue
    items = raw[bu_id]
    policy_candidates = []
    for item in items:
        title = item.get("title", "")
        snippet = item.get("snippet", "")[:200]
        text = title + " " + snippet
        module, is_prio = classify_module(text, bu_id, {})
        if module == "policy":
            tier1 = any(s in text for s in kw["signal_tier1"])
            tier2 = any(s in text for s in kw["signal_tier2"])
            tier3 = any(s in text for s in ["工信部", "发改委", "能源局", "市场监管总局", "财政部", "商务部"])
            core = [k for k in kw["core_all"] if k in text]
            policy_candidates.append({
                "title": title[:50],
                "tier1": tier1,
                "tier2": tier2,
                "tier3": tier3,
                "core": core[:5],
                "module": module,
                "is_prio": is_prio
            })

    print(f"\n=== {bu_id} → policy 条目（共{len(policy_candidates)}条）===")
    for p in policy_candidates[:5]:
        print(f"  [优先={p['is_prio']}] {p['title']}")
        print(f"    tier1={p['tier1']} tier2={p['tier2']} tier3={p['tier3']} core={p['core']}")