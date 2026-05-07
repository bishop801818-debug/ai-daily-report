import sys, json
sys.path.insert(0, r"D:\trae\AI Daily report")
from generate_html_report import (
    match_items, load_bu_configs, classify_module,
    recheck_item, _calc_confidence, DEPT_IDS
)
import copy

configs = load_bu_configs()
with open("D:/trae/AI Daily report/search_results.json", "r", encoding="utf-8") as f:
    input_items = json.load(f)

# Step 1: initial match
matched_all = {}
for bu_id in DEPT_IDS:
    items = match_items(input_items, bu_id, configs)
    for item in items:
        rechk = recheck_item(item, bu_id, configs)
        item.update(rechk)
    matched_all[bu_id] = items

print(f"After initial match:")
print(f"  czly: {len(matched_all['czly'])} items")
print(f"  sdmd: {len(matched_all['sdmd'])} items")

# Step 2: global layer with reclassification
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

matched_urls = set()
for bu_items in matched_all.values():
    for item in bu_items:
        uid = item.get("_uid") or (item.get("url", "") + item.get("title", ""))
        matched_urls.add(uid)

print(f"\nmatched_urls count: {len(matched_urls)}")

injected_count = 0
for item in input_items:
    title = item.get("title", "")
    content = item.get("content", "")
    combined = title + " " + content
    uid = (item.get("url", "") or "") + title
    if uid in matched_urls:
        continue
    if any(kw in combined for kw in global_ind_kws):
        for bu_id in DEPT_IDS:
            item_copy = copy.copy(item)
            item_copy["_uid"] = uid + f"_global_{bu_id}"
            item_copy["fallback_level"] = "L2_global_kw"
            item_copy["is_global_fallback"] = True
            rechk = recheck_item(item_copy, bu_id, configs)
            item_copy.update(rechk)
            if item_copy.get("fallback_level") in ("L1", "L2", "L3"):
                text_for_classify = (item_copy.get("title") or "") + " " + (item_copy.get("content") or "")
                mod, is_prio = classify_module(text_for_classify, bu_id, configs)
                item_copy["module"] = mod
                item_copy["is_priority"] = is_prio
                matched_all.setdefault(bu_id, []).append(item_copy)
                injected_count += 1
        matched_urls.add(uid)

print(f"Injected {injected_count} items total")

# Step 3: czly final policy items
czly_policy = [x for x in matched_all.get("czly", []) if x.get("module") == "policy"]
print(f"\nczly policy items after global layer: {len(czly_policy)}")
for p in czly_policy:
    print(f"  [{p.get('fallback_level','?')}] {p.get('title','')[:50]}")
    print(f"    url={p.get('url','')[:30]} _uid={p.get('_uid','')[:50]}")
    print(f"    source={p.get('source','')} date={p.get('date','')}")