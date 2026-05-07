import generate_html_report as g
from generate_html_report import match_items, load_bu_configs, classify_module, _get_policy_kw_tables
import json

configs = load_bu_configs()
kw = g._get_policy_kw_tables()

with open("D:/trae/AI Daily report/search_results.json", "r", encoding="utf-8") as f:
    raw_data = json.load(f)

print(f"输入条目: {len(raw_data)} 条")
if raw_data:
    print(f"Keys: {list(raw_data[0].keys())}")
print()

# sdmd 测试
bu_id = "sdmd"
items = match_items(raw_data, bu_id, configs)
print(f"[{bu_id}] match_items 匹配: {len(items)} 条")

# 分类统计
mods = {}
for it in items:
    m = it.get("module", "未分类")
    mods[m] = mods.get(m, 0) + 1
print(f"  分类分布: {mods}")

# 列出 policy 条目
policy_items = [x for x in items if x.get("module") in ("policy", "政策")]
print(f"  policy 条目: {len(policy_items)} 条")
for p in policy_items[:5]:
    print(f"    [{p.get('level','?')}] {p.get('title','')[:50]}")
    print(f"         content: {p.get('content','')[:60]}")

# 测试 classify_module 对真实政策标题的判断
test = "六部门联合印发《新能源汽车废旧动力电池回收和综合利用管理暂行办法》动力电池回收千亿元级市场待启"
mod, prio = classify_module(test, bu_id, configs)
print(f"\nclassify_module('六部门...'): {mod} prio={prio}")
t1 = any(s in test for s in kw["signal_tier1"])
t2 = any(s in test for s in kw["signal_tier2"])
t3 = any(s in test for s in ["工信部", "发改委", "能源局"])
core = [k for k in kw["core_all"] if k in test]
print(f"  tier1={t1} tier2={t2} tier3={t3} core={core[:3]}")

# 检查 search_results.json 里有没有真的政策新闻
print("\n=== search_results.json 中的政策相关标题 ===")
for item in raw_data:
    title = item.get("title", "")
    if any(kw in title for kw in ["部门", "办法", "政策", "通知", "工信部", "发改委", "能源局", "废旧动力电池", "回收"]):
        print(f"  - {title[:60]}")