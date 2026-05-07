import json, sys
sys.path.insert(0, r"D:\trae\AI Daily report")
from generate_html_report import match_items, load_bu_configs, classify_module, _get_policy_kw_tables

configs = load_bu_configs()
kw = _get_policy_kw_tables()

with open("D:/trae/AI Daily report/search_results.json", "r", encoding="utf-8") as f:
    raw_data = json.load(f)

# 检查各BU对"六部门联合印发"文章的分类结果
target = "六部门联合印发新能源汽车废旧动力电池回收和综合利用管理暂行办法"

for bu_id in ["czly", "sdmd", "sjld", "lpsd", "felt", "kls", "lhy", "dhx", "bych"]:
    items = match_items(raw_data, bu_id, configs)
    matched_titles = [x.get("title","") for x in items]

    # 直接对目标标题分类
    mod, prio = classify_module(target, bu_id, configs)
    t1 = any(s in target for s in kw["signal_tier1"])
    t2 = any(s in target for s in kw["signal_tier2"])
    t3 = any(s in target for s in ["工信部", "发改委", "能源局", "市场监管总局", "财政部", "商务部"])
    gov = any(s in target for s in ["六部门", "人民政府", "市场监管局", "生态环境部"])
    core = [k for k in kw["core_all"] if k in target]

    print(f"[{bu_id}]")
    print(f"  match_items 匹配数: {len(items)}")
    print(f"  是否命中目标文章: {target[:30] in matched_titles}")
    print(f"  classify: {mod} prio={prio}")
    print(f"  tier1={t1} tier2={t2} tier3={t3} gov_body={gov}")
    print(f"  core命中: {core[:3]}")
    print()