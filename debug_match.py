import json
import sys
import os
sys.path.insert(0, r"D:\trae\AI Daily report")

from generate_html_report import (
    match_items, _build_policy_kw_tables, get_bu_keywords,
    classify_module, is_meaningful_content, _calc_confidence,
    load_bu_configs
)

configs = load_bu_configs()
kw = _build_policy_kw_tables()

with open('search_results.json', 'r', encoding='utf-8') as f:
    raw = json.load(f)

print(f"总原始条目: {len(raw)}")

# 只看 czly
keywords = get_bu_keywords('czly', configs)
print(f"czly 关键词数: {len(keywords)}, 前5: {keywords[:5]}")

# 手动过 match_items 逻辑
matched = []
for item in raw:
    title = item.get("title", "")
    content = item.get("content", "")
    combined = title + " " + content

    # 检查关键词命中
    hit = any(kw in combined for kw in keywords)
    if not hit:
        continue

    url = item.get("url", "") or ""
    if url.lower().endswith(".pdf"):
        continue

    uid = url + title
    if any(x.get("_uid") == uid for x in matched):
        continue

    candidate = {
        "_uid": uid,
        "title": title,
        "content": (content or "")[:500],
        "url": url,
        "date": item.get("date", ""),
        "confidence": _calc_confidence(item.get("date", "")),
        "fallback_level": "L1",
    }
    if not is_meaningful_content(candidate):
        print(f"  拦截(内容不足): {title[:50]}")
        continue
    matched.append(candidate)

print(f"\n总匹配条目（去重+内容过滤后）: {len(matched)}")

# 分类统计
for item in matched:
    text = item['title'] + ' ' + item['content']
    mod, is_prio = classify_module(text, 'czly', configs)
    item['module'] = mod

from collections import Counter
mods = Counter(x['module'] for x in matched)
print("各 module 数量:", dict(mods))

# 打印 policy 条目
print("\n=== policy 条目 ===")
for item in matched:
    if item['module'] == 'policy':
        print(f"  [{item['confidence']}] {item['title'][:60]}")
        print(f"    content: {item['content'][:80]}")

# 打印含"动力电池"但被判为非policy的条目
print("\n=== 含'动力电池'且被判为 competitor/market ===")
for item in matched:
    if item['module'] in ('competitor', 'market') and '动力电池' in (item['title'] + item['content']):
        print(f"  [{item['module']}] {item['title'][:60]}")