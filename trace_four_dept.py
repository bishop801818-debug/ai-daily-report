# -*- coding: utf-8 -*-
"""追踪"四部门"文章为什么没有进入政策"""
import json, sys
sys.path.insert(0, 'd:/buddy/skills/lithium-division-morning-report')

# 模拟 classify_module 的关键判断
gov_body_hit = any(s in "四部门部署规范动力及储能电池行业竞争秩序" for s in [
    "六部门", "七部门", "八部门", "四部门", "三部门", "部门联合",
    "人民政府", "市场监管局", "生态环境部",
    "工业和信息化部", "国家发展改革委", "国家能源局"
])
print(f"'四部门部署规范...' 中 gov_body_hit: {gov_body_hit}")

# 手动检查 "四部门" 是否在标题中
title1 = "四部门部署规范动力及储能电池行业竞争秩序"
print(f"'四部门' in title1: {'四部门' in title1}")
print(f"gov_body_hit: {gov_body_hit}")

# 检查 signal_tier2
signal_tier2 = ["办法", "通知", "规定", "条例", "意见", "管理", "标准", "规范", "制度",
                "体系", "政策", "规划", "实施方案", "行动方案", "指南", "目录", "公约"]
text1 = "四部门部署规范动力及储能电池行业竞争秩序"
tier2_hit = any(s in text1 for s in signal_tier2)
print(f"tier2_hit: {tier2_hit}")
for s in signal_tier2:
    if s in text1:
        print(f"  命中: {s}")

# 现在检查完整的文章对象
with open('D:/trae/AI Daily report/reports/2026-04-12.json', encoding='utf-8') as f:
    report = json.load(f)

# 找所有包含"四部门"的文章
four_dept_arts = [a for a in report if "四部门" in (a.get('title','')+a.get('content',''))]
print(f"\nJSON中含'四部门'的文章数: {len(four_dept_arts)}")
for a in four_dept_arts:
    mod = a.get('module','?')
    prio = a.get('is_priority','?')
    print(f"  [{mod}] prio={prio} | {a.get('title','')[:60]}")

# 检查这些文章的内容是否包含"工信部"
for a in four_dept_arts:
    content = a.get('content','')[:300]
    title = a.get('title','')
    if '工信部' in content or '工信部' in title:
        print(f"\n文章含'工信部': {title[:50]}")
        print(f"  content snippet: {content[:150]}")
