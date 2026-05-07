import sys, json, copy
sys.path.insert(0, r"D:\trae\AI Daily report")
from generate_html_report import (
    match_items, load_bu_configs, classify_module,
    recheck_item, _calc_confidence, DEPT_IDS
)

configs = load_bu_configs()
with open("D:/trae/AI Daily report/search_results.json", "r", encoding="utf-8") as f:
    input_items = json.load(f)

# Build matched_all
matched_all = {}
for bu_id in DEPT_IDS:
    items = match_items(input_items, bu_id, configs)
    for item in items:
        rechk = recheck_item(item, bu_id, configs)
        item.update(rechk)
    matched_all[bu_id] = items

# matched_urls
matched_urls = set()
for bu_items in matched_all.values():
    for item in bu_items:
        uid = item.get("_uid") or (item.get("url", "") + item.get("title", ""))
        matched_urls.add(uid)

# Czly keywords
czly_kws = set(configs.get("czly", {}).get("search", {}).get("core_keywords", []))
for mkws in configs.get("czly", {}).get("modules", {}).values():
    if isinstance(mkws, dict):
        czly_kws.update(mkws.get("keywords", []))
czly_kws.update(configs.get("czly", {}).get("division_profile", {}).get("keywords_alias", []))

global_ind_kws = [
    "动力电池", "储能电池", "锂电池", "锂离子电池", "固态电池",
    "钠电池", "钠离子电池", "正极材料", "磷酸铁锂", "三元材料",
    "电解液", "六氟磷酸锂", "隔膜", "电池回收", "电池回收利用",
    "碳酸锂", "氢氧化锂", "锂盐", "锂辉石", "盐湖提锂",
    "电池厂", "正极厂", "材料厂",
    "工信部", "工业和信息化部", "发改委", "国家发展改革委", "国家发改委",
    "能源局", "国家能源局", "生态环境部", "市场监管总局",
    "财政部", "商务部", "交通运输部",
    "行业规范条件", "管理暂行办法", "实施办法", "行动方案", "指导意见",
    "补贴政策", "征求意见稿", "标准体系",
    "废旧动力电池", "废旧动力电池回收", "回收和综合利用",
    "行业竞争秩序", "反内卷",
    "宁德时代", "比亚迪", "亿纬锂能", "中创新航", "国轩高科",
    "欣旺达", "LG新能源", "松下", "三星SDI",
]

# Find what gets injected for czly
print("Items injected into czly:")
injected_for_czly = []
for item in input_items:
    title = item.get("title", "")
    content = item.get("content", "")
    combined = title + " " + content
    uid = (item.get("url", "") or "") + title
    if uid in matched_urls:
        continue
    if any(kw in combined for kw in global_ind_kws):
        item_copy = copy.copy(item)
        item_copy["_uid"] = uid + f"_global_czly"
        rechk = recheck_item(item_copy, "czly", configs)
        item_copy.update(rechk)
        text_for_classify = (item_copy.get("title") or "") + " " + (item_copy.get("content") or "")
        mod, is_prio = classify_module(text_for_classify, "czly", configs)
        item_copy["module"] = mod
        item_copy["is_priority"] = is_prio
        injected_for_czly.append(item_copy)

print(f"Total injected for czly: {len(injected_for_czly)}\n")
for it in injected_for_czly:
    czly_hit = [k for k in czly_kws if k in (it.get("title","") + " " + it.get("content",""))]
    policy_hit_gov = [k for k in ["工信部","发改委","能源局","市场监管总局","四部门"] if k in it.get("title","")]
    policy_hit_type = [k for k in ["废旧动力电池回收","管理暂行办法","行业规范条件","竞争秩序"] if k in it.get("title","")]
    print(f"  [{it.get('module')}] {it.get('title','')[:45]}")
    print(f"    czly_kws命中: {czly_hit[:3]}")
    print(f"    policy信号: gov={policy_hit_gov} type={policy_hit_type}")
    print(f"    fb={it.get('fallback_level')} date={it.get('date')} conf={it.get('confidence')}")
    print()