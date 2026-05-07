import json, sys
sys.path.insert(0, r"D:\trae\AI Daily report")
from generate_html_report import (
    match_items, load_bu_configs, classify_module,
    recheck_item, _calc_confidence, DEPT_IDS
)

configs = load_bu_configs()

with open("D:/trae/AI Daily report/search_results.json", "r", encoding="utf-8") as f:
    input_items = json.load(f)

matched_all = {}
for bu_id in DEPT_IDS:
    items = match_items(input_items, bu_id, configs)
    for item in items:
        rechk = recheck_item(item, bu_id, configs)
        item.update(rechk)
    matched_all[bu_id] = items
    print(f"[{bu_id}] 初始匹配: {len(items)}条")

# Global industry fallback + reclassification
global_ind_kws = [
    "动力电池", "储能电池", "锂电池", "锂离子电池", "固态电池",
    "钠电池", "钠离子电池", "正极材料", "磷酸铁锂", "三元材料",
    "电解液", "六氟磷酸锂", "隔膜", "电池回收", "电池回收利用",
    "碳酸锂", "氢氧化锂", "锂盐", "锂辉石", "盐湖提锂",
    "电池厂", "正极厂", "材料厂",
    "工信部", "工业和信息化部", "发改委", "国家发展改革委", "国家发改委",
    "能源局", "国家能源局", "生态环境部", "市场监管总局",
    "财政部", "商务部", "交通运输部", "国家标准", "行业规范",
    "行业规范条件", "管理暂行办法", "实施办法", "行动方案", "指导意见",
    "补贴政策", "征求意见稿", "标准体系", "公告", "通知",
    "宁德时代", "比亚迪", "亿纬锂能", "中创新航", "国轩高科",
    "欣旺达", "LG新能源", "松下", "三星SDI",
]

matched_urls = set()
for bu_items in matched_all.values():
    for item in bu_items:
        uid = item.get("_uid") or (item.get("url", "") + item.get("title", ""))
        matched_urls.add(uid)

injected_global = 0
for item in input_items:
    title = item.get("title", "")
    content = item.get("content", "")
    combined = title + " " + content
    uid = (item.get("url", "") or "") + title
    if uid in matched_urls:
        continue
    if any(kw in combined for kw in global_ind_kws):
        for bu_id in DEPT_IDS:
            item_copy = dict(item)
            item_copy["_uid"] = uid + f"_global_{bu_id}"
            item_copy["fallback_level"] = "L2_global_kw"
            item_copy["is_global_fallback"] = True
            rechk = recheck_item(item_copy, bu_id, configs)
            item_copy.update(rechk)
            if item_copy.get("fallback_level") in ("L1", "L2", "L3"):
                # Reclassify for policy signal articles
                text_for_classify = (item_copy.get("title") or "") + " " + (item_copy.get("content") or "")
                mod, is_prio = classify_module(text_for_classify, bu_id, configs)
                item_copy["module"] = mod
                item_copy["is_priority"] = is_prio
                matched_all.setdefault(bu_id, []).append(item_copy)
                injected_global += 1
        matched_urls.add(uid)

print(f"\nGlobal layer injected: {injected_global} items total")

# Policy layer
policy_signal_kws = [
    "六部门", "七部门", "部门联合", "人民政府", "市场监管局",
    "工业和信息化部", "国家发展改革委", "国家能源局", "生态环境部",
    "工信部", "发改委", "能源局", "市场监管总局",
    "四部门", "五部门", "三部门", "二部门",
]
policy_type_kws = [
    "管理暂行办法", "实施办法", "行动方案", "指导意见", "补贴政策",
    "征求意见稿", "标准体系", "国家标准", "行业规范条件", "竞争秩序",
]

policy_injected = 0
for item in input_items:
    title = item.get("title", "")
    content = item.get("content", "")
    combined = title + " " + content
    has_gov = any(kw in combined for kw in policy_signal_kws)
    has_type = any(kw in combined for kw in policy_type_kws)
    if not (has_gov or has_type):
        continue

    uid = (item.get("url", "") or "") + title
    for bu_id in DEPT_IDS:
        bu_items = matched_all.get(bu_id, [])
        bu_uids = set(x.get("_uid", "") for x in bu_items)
        if uid in bu_uids or uid + f"_global_{bu_id}" in bu_uids:
            continue
        bu_policy = [x for x in bu_items if x.get("module") == "policy" and x.get("fallback_level") in ("L1", "L2")]
        if bu_policy:
            print(f"  [{bu_id}] 跳过政策注入（有L1/L2: {bu_policy[0].get('title','')[:30]}）")
            continue
        item_copy = dict(item)
        item_copy["_uid"] = uid + f"_pol_{bu_id}"
        item_copy["fallback_level"] = "L2_policy_forced"
        item_copy["is_global_fallback"] = True
        item_copy["confidence"] = _calc_confidence(item_copy.get("date", ""))
        rechk = recheck_item(item_copy, bu_id, configs)
        item_copy.update(rechk)
        if item_copy.get("fallback_level") in ("L1", "L2", "L3"):
            matched_all.setdefault(bu_id, []).append(item_copy)
            policy_injected += 1
            print(f"  [{bu_id}] 政策注入: {title[:40]}")

print(f"\nPolicy layer injected: {policy_injected} items total")

# Final policy count per BU
for bu_id in DEPT_IDS:
    bu_policy = [x for x in matched_all.get(bu_id, []) if x.get("module") == "policy"]
    print(f"[{bu_id}] 最终政策条目: {len(bu_policy)}条")
    for p in bu_policy[:3]:
        print(f"  [{p.get('fallback_level','?')}] {p.get('title','')[:50]}")