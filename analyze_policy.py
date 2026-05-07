import json
import os

# 读取政策数据
with open('d:/buddy/data/policy.json', encoding='utf-8') as f:
    data = json.load(f)

items = data.get('items', [])
print(f"=== 政策总数: {len(items)} ===\n")

# 按时间排序
sorted_items = sorted(items, key=lambda x: x.get('date', ''))
print("=== 时间范围 ===")
print(f"最早: {sorted_items[0].get('date')}")
print(f"最晚: {sorted_items[-1].get('date')}")
print()

# 按BU关键词过滤
bu_keywords = {
    '常州锂源': ['磷酸铁锂', '正极材料', 'LFP', '锂电'],
    '山东美多': ['动力电池', '回收', '废旧电池', '电池回收'],
    '三金锂电': ['三元', '前驱体', '高镍', '固态电池'],
    '龙蟠时代': ['碳酸锂', '锂矿', '盐湖', '云母'],
    '法恩莱特': ['电解液', '六氟', '溶剂', '添加剂'],
    '可兰素': ['尿素', '车用尿素', 'SCR', '国六'],
    '润滑油': ['润滑油', '机油', '润滑', 'API认证'],
    '迪克化学': ['制动液', '冷却液', '防冻液', '制动系统'],
    '铂源催化': ['氢能', '燃料电池', '催化剂', '加氢站']
}

print("=== 各BU相关政策 ===")
for bu, keywords in bu_keywords.items():
    matched = []
    for item in items:
        title = item.get('title', '') + item.get('summary', '')
        if any(k in title for k in keywords):
            matched.append(item.get('date') + ' ' + item.get('title')[:50])
    print(f"\n{bu} ({len(matched)}条):")
    for m in matched[:10]:
        print(f"  {m}")