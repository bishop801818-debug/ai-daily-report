#!/usr/bin/env python3
"""
巨潮资讯 - 按公司代码搜索公告
测试核心思路：直接拉指定公司的近N天公告，不再依赖关键词匹配
"""
import requests
import json
import time
from datetime import datetime, timedelta

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Origin": "https://www.cninfo.com.cn",
    "Referer": "https://www.cninfo.com.cn/new/disclosure/stock?plate=szb&stockCode=&orgId=&searchkey=&secid=&category=&trade=&se=szb",
}

SESSION_URL = "https://www.cninfo.com.cn/new/disclosure/stock?plate=szb&stockCode=&orgId=&searchkey=&secid=&category=&trade=&se=szb"
API_URL = "https://www.cninfo.com.cn/new/hisAnnouncement/query"

# 各事业部核心公司（股票代码 → 公司名）
COMPANY_MAP = {
    # 法恩莱特相关
    "fellt": [
        ("002709", "天赐材料", "gssz0002709"),
        ("300037", "新宙邦", "gssz0300037"),
        ("603026", "石大胜华", "gssz0603026"),
        ("301238", "瑞泰新材", "gssz0301238"),
    ],
    # 龙蟠时代相关
    "lpsd": [
        ("002460", "赣锋锂业", "gssz0002460"),
        ("002466", "天齐锂业", "gssz0002466"),
        ("002738", "中矿资源", "gssz0002738"),
    ],
    # 常州锂源相关
    "czly": [
        ("300750", "湖南裕能", "gssz0300750"),
        ("002850", "德方纳米", "gssz0002850"),
        ("300769", "德方纳米(另)", "gssz0300769"),
    ],
    # 山东美多相关
    "sdmd": [
        ("300077", "邦普循环", "gssz0300077"),
        ("002340", "格林美", "gssz0002340"),
        ("603799", "华友钴业", "gssz0603799"),
    ],
    # 三金锂电相关
    "sjld": [
        ("300919", "中伟股份", "gssz0300919"),
        ("688005", "容百科技", "gssz0608005"),
        ("300811", "科隆股份", "gssz0300811"),
    ],
    # 亿纬锂能（参考早报里出现，但不属于上面任何一类）
    # 磷酸铁锂电池/储能
    "evey": [
        ("300014", "亿纬锂能", "gssz0300014"),
        ("002074", "国轩高科", "gssz0002074"),
        ("002594", "比亚迪", "gssz0002594"),
    ],
}


def ts_to_date(ts):
    if not ts:
        return ""
    try:
        return datetime.fromtimestamp(int(ts) / 1000).strftime("%Y-%m-%d")
    except Exception:
        return ""


def fetch_company_announcements(org_id, page=1, page_size=30):
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

    payload = {
        "stock": "",
        "tabName": "fulltext",
        "pageSize": page_size,
        "pageNum": page,
        "column": "",
        "category": "",
        "plate": "",
        "orgId": org_id,
        "startDate": start_date,
        "endDate": end_date,
        "searchkey": "",
        "secid": "",
        "trade": "",
    }

    session = requests.Session()
    try:
        session.get(SESSION_URL, headers={k: v for k, v in HEADERS.items() if k != "Content-Type"}, timeout=10)
    except Exception:
        pass

    resp = session.post(API_URL, data=payload, headers=HEADERS, timeout=15)
    return resp.json()


def run():
    print("\n" + "=" * 60)
    print("巨潮资讯 - 按公司代码搜索近7天公告")
    print("=" * 60 + "\n")

    all_results = []

    for bu_id, companies in COMPANY_MAP.items():
        for code, name, org_id in companies:
            print(f"[{name}]({code}) orgId={org_id} ...", end=" ", flush=True)
            try:
                data = fetch_company_announcements(org_id, page=1)
                total = data.get("totalAnnouncement", 0)
                announcements = data.get("announcements") or []

                print(f"{total}条", end=" ")

                for ann in announcements[:5]:
                    ts = ann.get("announcementTime", "")
                    title = ann.get("announcementTitle", "")
                    print(f"\n  [{ts_to_date(ts)}] {title[:50]}")

                if total > 5:
                    print(f"  ... 还有{total - 5}条")

                all_results.append({
                    "bu": bu_id,
                    "code": code,
                    "name": name,
                    "total": total,
                    "announcements": [
                        {"title": ann.get("announcementTitle", ""), "date": ts_to_date(ann.get("announcementTime", "")), "id": ann.get("announcementId", "")}
                        for ann in announcements
                    ]
                })

                time.sleep(0.4)

            except Exception as e:
                print(f"失败: {e}")

    return all_results


if __name__ == "__main__":
    run()
