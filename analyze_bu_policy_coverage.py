# -*- coding: utf-8 -*-
"""诊断：为什么各BU政策栏目为空"""
import json
import os
import sys
sys.path.insert(0, 'd:/buddy/skills/lithium-division-morning-report')

configs_dir = 'd:/buddy/skills/lithium-division-morning-report/configs'
with open('search_results.json', encoding='utf-8') as f:
    search_results = json.load(f)

bu_ids = ['czly','sdmd','sjld','lpsd','felt','kls','lhy','dhx','bych']
bu_names = {'czly':'常州锂源','sdmd':'山东美多','sjld':'三金锂电','lpsd':'龙蟠时代',
            'felt':'法恩莱特','kls':'可兰素','lhy':'润滑油','dhx':'迪克化学','bych':'铂源催化'}

bu_configs = {}
for bid in bu_ids:
    cfg_file = os.path.join(configs_dir, f'{bid}.json')
    if os.path.exists(cfg_file):
        with open(cfg_file, encoding='utf-8') as f:
            bu_configs[bid] = json.load(f)

# 读取各BU的content.keywords（内容关键词）和policy.keywords（政策关键词）
print("=" * 70)
print("各BU配置对比")
print("=" * 70)
for bid in bu_ids:
    cfg = bu_configs.get(bid, {})
    content_kw = cfg.get('content', {}).get('keywords', [])[:8]
    policy_kw  = cfg.get('policy', {}).get('keywords', [])[:8]
    print(f"\n{bid} ({bu_names.get(bid,bid)}):")
    print(f"  content.keywords : {content_kw}")
    print(f"  policy.keywords  : {policy_kw}")

print("\n" + "=" * 70)
print("搜索结果中的政策相关文章（20篇）")
print("=" * 70)
policy_kw_list = ['办法','通知','规定','条例','意见','政策','规划','实施方案',
    '管理细则','燃料电池','储能','废旧电池','回收','白名单','以旧换新',
    '补贴','114号','136号','工信部','发改委','能源局','行业规范','安全标准',
    'GB38031','四部门','座谈']

policy_articles = []
for item in search_results:
    title = item.get('title', '') or ''
    content = (item.get('content', '') or '')[:400]
    pub = item.get('publish_date', '') or ''
    for kw in policy_kw_list:
        if kw in title or kw in content:
            policy_articles.append(item)
            break

for i, art in enumerate(policy_articles):
    title = art.get('title','')[:55]
    pub = art.get('publish_date','') or art.get('date','') or ''
    content_snippet = (art.get('content','') or '')[:80]
    print(f"\n[{i+1}] [{pub}] {title}")
    print(f"    内容摘要: {content_snippet}...")

print("\n" + "=" * 70)
print("各BU policy.keywords 与 20篇政策文章的匹配矩阵")
print("=" * 70)
print(f"{'BU':<8} | {'policy匹配文章数':>12} | 命中的文章编号")
for bid in bu_ids:
    cfg = bu_configs.get(bid, {})
    pkws = cfg.get('policy', {}).get('keywords', [])
    matched_idx = []
    for i, art in enumerate(policy_articles):
        text = (art.get('title','') or '') + ' ' + (art.get('content','') or '')[:400]
        for kw in pkws:
            if kw in text:
                matched_idx.append(i+1)
                break
    print(f"{bid:<8} | {len(matched_idx):>12} | {matched_idx}")
