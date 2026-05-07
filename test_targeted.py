#!/usr/bin/env python3
"""测试定向搜索：具体公司+具体事件类型"""
import json, urllib.request, time

API_KEY = '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'
URL = 'https://api.tavily.com/search'

queries = [
    ('亿纬锂能', '亿纬锂能 公告 互动易 机构调研 投资 扩产 2026年'),
    ('盟固利', '盟固利 公告 互动易 磷酸铁锂 投资协议 2026年'),
    ('天齐锂业', '天齐锂业 投资者关系 业绩说明会 调研 2026年'),
    ('中矿资源', '中矿资源 公告 业绩预增 投资 2026年4月'),
    ('德方纳米', '德方纳米 公告 互动易 机构调研 磷酸铁锂 2026年'),
    ('龙蟠科技', '龙蟠科技 公告 碳酸锂 锂矿 2026年'),
]

for name, q in queries:
    payload = json.dumps({
        'api_key': API_KEY, 'query': q, 'max_results': 5,
        'search_depth': 'advanced', 'include_answer': True
    }).encode()
    req = urllib.request.Request(URL, data=payload,
        headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.loads(r.read())
            items = data.get('results', []) or []
            print(f"\n=== {name} ({len(items)}条) ===")
            for item in items[:3]:
                print(f"  {item.get('url','')[:55]}")
                print(f"  {item.get('title','')[:50]}")
                print(f"  {item.get('content','')[:80]}")
    except Exception as e:
        print(f"Error for {name}: {e}")
    time.sleep(0.5)
