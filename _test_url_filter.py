# -*- coding: utf-8 -*-
import sys
sys.path.insert(0, r'D:\trae\AI Daily report')

from generate_html_report import (
    recheck_item, extract_url_date, is_announcement_url, TODAY
)
from datetime import datetime

print(f"TODAY = {TODAY.date()}")
print()

# 测试URL日期提取
test_urls = [
    'https://www.example.com/2026/04/08/article.html',
    'https://www.example.com/20260408_announcement.html',
    'https://www.example.com/2026-04-08-news.html',
    'https://www.example.com/wechat_mp/content/123.html',
    'https://www.cninfo.com.cn/new/disclosure/detail?announcement_id=123',
]

print('=== extract_url_date ===')
for u in test_urls:
    d = extract_url_date(u)
    days = (TODAY - d).days if d else None
    print(f'  {u[-55:]} -> {d.date() if d else None}, {days} days ago')

print()
print('=== is_announcement_url ===')
for u in test_urls:
    print(f'  {u[-55:]} -> {is_announcement_url(u)}')

print()
print('=== recheck_item rules test ===')

configs = {}

# Rule 1: URL <= 20 days
item1 = {'title': 'Test', 'content': 'Body', 'url': 'https://a.com/2026/04/10/article.html', 'date': '2026-04-10', 'source': 'Test'}
r1 = recheck_item(item1, 'felt', configs)
print(f'R1 URL<=20d: passed={r1["passed"]}, conf={r1["confidence"]}, level={r1["fallback_level"]}')

# Rule 2: URL 21-30 days
item2 = {'title': 'Test', 'content': 'Body', 'url': 'https://a.com/2026/03/20/article.html', 'date': '2026-03-20', 'source': 'Test'}
r2 = recheck_item(item2, 'felt', configs)
print(f'R2 URL 21-30d: passed={r2["passed"]}, conf={r2["confidence"]}, level={r2["fallback_level"]}, reason={r2["old_news_reason"]}')

# Rule 3: URL > 30 days
item3 = {'title': 'Test', 'content': 'Body', 'url': 'https://a.com/2026/02/01/article.html', 'date': '2026-02-01', 'source': 'Test'}
r3 = recheck_item(item3, 'felt', configs)
print(f'R3 URL>30d: passed={r3["passed"]}, level={r3["fallback_level"]}, reason={r3["old_news_reason"]}')

# Rule 5: Non-announcement URL with no date in URL
item4 = {'title': 'Test', 'content': 'Body', 'url': 'https://mp.weixin.qq.com/s/test', 'date': '2026-04-10', 'source': 'WeChat'}
r4 = recheck_item(item4, 'felt', configs)
print(f'R5 Non-ann URL no date: passed={r4["passed"]}, level={r4["fallback_level"]}, reason={r4["old_news_reason"]}')

# Rule 4: Announcement URL with no date, body has date
item5 = {'title': 'Test', 'content': '2026年4月5日，某某公司发布公告', 'url': 'https://www.cninfo.com.cn/new/detail', 'date': '', 'source': 'cninfo'}
r5 = recheck_item(item5, 'felt', configs)
print(f'R4 Ann URL no URL date, body has date: passed={r5["passed"]}, conf={r5["confidence"]}, level={r5["fallback_level"]}, reason={r5["old_news_reason"]}')

# Rule 6: No date at all
item6 = {'title': 'Test', 'content': 'This is content without any date', 'url': 'https://www.example.com/news', 'date': '', 'source': 'Test'}
r6 = recheck_item(item6, 'felt', configs)
print(f'R6 No date: passed={r6["passed"]}, level={r6["fallback_level"]}, reason={r6["old_news_reason"]}')