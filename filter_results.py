#!/usr/bin/env python3
"""分析2026年4月以后的数据质量（改进版）"""
import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open('D:/trae/AI Daily report/search_results.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 精确噪音关键词（股评/平台/聚合页面）
PRECISE_NOISE = [
    '财富号', '新浪财经_金融信息服务商', 'App', '网易订阅',
    '行情走势', '同花顺', '东方财富股吧', '雪球',
    '涨停分析', '主力净流入', '飙涨超7倍',
    '盘后公告精选', '调研速递',  # 这类是综合汇编
]

# 有价值信号词
SIGNAL_WORDS = [
    '公告', '调研', '投资者关系', '业绩预告', '预增', '预减',
    '协议', '签约', '投资协议', '合作框架',
    '扩产', '新建', '投资', '中标', '订单', '签约',
    '互动易', '回购', '分红', '股权激励',
    '磷酸铁锂', '碳酸锂', '电解液', '六氟磷酸锂',
    '储能电池', '固态电池', '钠离子电池',
    '清洁化', '一体化', '回收',
    '一季度', '半年度', '年度', '净利', '净利润', '营收',
    '交流会', '说明会', '活动记录',
]

def score_item(item):
    title = item.get('title', '') or ''
    content = item.get('content', '') or ''
    text = title + ' ' + content[:200]

    # 噪音检查
    for kw in PRECISE_NOISE:
        if kw in text:
            return 'NOISE', kw

    # 信号检查
    signals = []
    for kw in SIGNAL_WORDS:
        if kw in text:
            signals.append(kw)

    if signals:
        return 'SIGNAL', signals[:2]
    return 'UNCERTAIN', []

april_items = [x for x in data if x.get('date', '') >= '2026-04-08']
print(f'2026-04-08 以后: {len(april_items)} 条')

signal_items = [x for x in april_items if score_item(x)[0] == 'SIGNAL']
noise_items = [x for x in april_items if score_item(x)[0] == 'NOISE']
uncertain_items = [x for x in april_items if score_item(x)[0] == 'UNCERTAIN']

print(f'信号明确: {len(signal_items)} 条')
print(f'噪音: {len(noise_items)} 条')
print(f'不确定: {len(uncertain_items)} 条')
print()

print('=== 信号明确的事件 ===')
for item in signal_items:
    sid = item.get('_search_id', '?')
    title = item.get('title', '')[:45]
    d = item.get('date', '?')
    _, sigs = score_item(item)
    url_domain = item.get('url', '').split('/')[2] if item.get('url') else ''
    content_snippet = (item.get('content', '') or '')[:80].replace('\n', ' ')
    print(f'[{sid}] {d} | {sigs} | {title}')
    print(f'    url: {url_domain}')
    print(f'    snippet: {content_snippet[:80]}')
    print()

print('=== 噪音样本 ===')
for item in noise_items[:5]:
    title = item.get('title', '')[:50]
    _, reason = score_item(item)
    print(f'  NOISE:{reason} | {title}')

print()
print('=== 不确定样本 ===')
for item in uncertain_items[:5]:
    title = item.get('title', '')[:50]
    print(f'  {title}')
