import json

with open(r"D:\trae\AI Daily report\search_results.json", "r", encoding="utf-8") as f:
    items = json.load(f)

# 检查含政策信号词的所有文章
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

print("含政策信号词的文章:")
for item in items:
    title = item.get("title", "")
    combined = title
    has_gov = any(kw in combined for kw in policy_signal_kws)
    has_type = any(kw in combined for kw in policy_type_kws)
    if has_gov or has_type:
        matched = [kw for kw in policy_signal_kws if kw in combined] + [kw for kw in policy_type_kws if kw in combined]
        print(f"  [{item.get('date')}] {title[:50]}")
        print(f"    命中: {matched}")