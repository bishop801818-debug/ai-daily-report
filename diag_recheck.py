import json, sys
sys.path.insert(0, r"D:\trae\AI Daily report")
from generate_html_report import match_items, load_bu_configs, classify_module, recheck_item, _get_policy_kw_tables
import datetime

configs = load_bu_configs()
kw = _get_policy_kw_tables()

with open("D:/trae/AI Daily report/search_results.json", "r", encoding="utf-8") as f:
    raw_data = json.load(f)

bu_id = "sdmd"
items = match_items(raw_data, bu_id, configs)

# 检查每条被归为 policy 的 item 的旧闻复验状态
policy_items = []
for item in items:
    text = (item.get("title") or "") + " " + (item.get("content") or "")
    mod, prio = classify_module(text, bu_id, configs)
    item["module"] = mod
    item["is_priority"] = prio
    rechk = recheck_item(item, bu_id, configs)
    item.update(rechk)
    if mod == "policy":
        policy_items.append(item)

print(f"sdmd policy items: {len(policy_items)} 条\n")
for p in policy_items:
    print(f"  [{p.get('level','?')}] {p.get('title','')[:50]}")
    print(f"    module={p.get('module')} prio={p.get('is_priority')}")
    print(f"    fallback_level={p.get('fallback_level')} old_news_reason={p.get('old_news_reason','')[:50]}")
    print(f"    date={p.get('date')} confidence={p.get('confidence')}")
    print(f"    content: {p.get('content','')[:80]}")
    print()

# 测试"六部门"文章能否通过旧闻复验
test_item = {
    "title": "六部门联合印发《新能源汽车废旧动力电池回收和综合利用管理暂行办法》动力电池回收千亿元级市场待启",
    "content": "",
    "date": "2026-04-10",
    "url": "https://example.com/policy",
    "source": "新华社",
}
text = test_item["title"] + " " + test_item["content"]
mod, prio = classify_module(text, bu_id, configs)
test_item["module"] = mod
test_item["is_priority"] = prio
rechk = recheck_item(test_item, bu_id, configs)
test_item.update(rechk)

print(f"\n=== '六部门' 单独测试 ===")
print(f"  module={mod} prio={prio}")
print(f"  fallback_level={test_item.get('fallback_level')}")
print(f"  old_news_reason={test_item.get('old_news_reason','')[:80]}")
print(f"  date={test_item['date']} confidence={test_item.get('confidence')}")

# 检查 global_ind_kws 层会不会把六部门文章注入
print("\n=== global_ind_kws 测试 ===")
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
title = "六部门联合印发《新能源汽车废旧动力电池回收和综合利用管理暂行办法》动力电池回收千亿元级市场待启"
combined = title
hits = [k for k in global_ind_kws if k in combined]
print(f"  命中 global_ind_kws: {hits}")

# classify 对六部门的判断
t1 = any(s in title for s in kw["signal_tier1"])
t2 = any(s in title for s in kw["signal_tier2"])
t3_gov = any(s in title for s in ["工信部", "发改委", "能源局", "市场监管总局", "财政部", "商务部"])
core = [k for k in kw["core_all"] if k in title]
print(f"  tier1={t1} tier2={t2} tier3={t3_gov} core={core}")
print(f"  → classify: {mod}")