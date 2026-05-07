#!/usr/bin/env python3
"""
巨潮资讯(cninfo)公告抓取脚本 v4
===================
策略：API不限制日期 → 抓取所有结果 → 客户端按时间戳过滤
（API在fulltext搜索模式下忽略startDate/endDate，只能如此）

每关键词最多抓N页，按时间戳过滤只保留近days_back天的
"""
import requests
import json
import time
import argparse
from datetime import datetime, timedelta
from typing import List, Dict

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Origin": "https://www.cninfo.com.cn",
    "Referer": "https://www.cninfo.com.cn/new/disclosure/stock?plate=szb&stockCode=&orgId=&searchkey=&secid=&category=&trade=&se=szb",
}

SESSION_URL = "https://www.cninfo.com.cn/new/disclosure/stock?plate=szb&stockCode=&orgId=&searchkey=&secid=&category=&trade=&se=szb"
API_URL = "https://www.cninfo.com.cn/new/hisAnnouncement/query"

BU_KEYWORD_MAP = {
    "fellt": {
        "name": "法恩莱特",
        "keywords": ["电解液", "六氟磷酸锂"],
        "exclude": ["基金管理", "证券投资基金", "券商", "托管", "QDII", "FOF"],
    },
    "lpsd": {
        "name": "龙蟠时代",
        "keywords": ["碳酸锂", "盐湖提锂", "锂矿", "云母提锂", "锂精矿"],
        "exclude": ["基金管理", "证券投资基金"],
    },
    "czly": {
        "name": "常州锂源",
        "keywords": ["磷酸铁锂", "磷酸铁", "正极材料"],
        "exclude": ["基金管理", "证券投资基金", "通信用磷酸铁锂电池"],
    },
    "sdmd": {
        "name": "山东美多",
        "keywords": ["废旧动力电池", "电池回收", "梯次利用", "再生利用"],
        "exclude": ["基金管理"],
    },
    "sjld": {
        "name": "三金锂电",
        "keywords": ["三元材料", "三元前驱体", "高镍正极", "硫酸钴", "硫酸镍"],
        "exclude": ["基金管理"],
    },
    "bych": {
        "name": "铂源催化",
        "keywords": ["氢燃料电池", "燃料电池催化剂", "加氢站", "氢气", "质子交换膜"],
        "exclude": ["基金管理"],
    },
    "kls": {
        "name": "可兰素",
        "keywords": ["车用尿素", "尿素溶液", "SCR脱硝", "国六"],
        "exclude": [],
    },
    "lhy": {
        "name": "润滑油",
        "keywords": ["润滑油", "基础油", "API认证", "发动机油"],
        "exclude": [],
    },
    "dhx": {
        "name": "迪克化学",
        "keywords": ["制动液", "防冻液", "冷却液", "刹车液"],
        "exclude": ["基金管理"],
    },
}

OUTPUT_FILE = "D:/trae/AI Daily report/reports/cninfo_announcements.json"


def ts_to_date(ts) -> str:
    if not ts:
        return ""
    try:
        return datetime.fromtimestamp(int(ts) / 1000).strftime("%Y-%m-%d")
    except Exception:
        return ""


def ts_within_days(ts, days: int) -> bool:
    """检查时间戳是否在近days天内"""
    if not ts:
        return False
    try:
        ann_date = datetime.fromtimestamp(int(ts) / 1000)
        cutoff = datetime.now() - timedelta(days=days)
        return ann_date >= cutoff
    except Exception:
        return False


def fetch_page(keyword: str, page: int = 1, page_size: int = 30) -> Dict:
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")

    payload = {
        "stock": "",
        "tabName": "fulltext",
        "pageSize": page_size,
        "pageNum": page,
        "column": "",
        "category": "",
        "plate": "",
        "orgId": "",
        "startDate": start_date,
        "endDate": end_date,
        "searchkey": keyword,
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


def fetch_keyword(keyword: str, days_back: int, max_pages: int = 8) -> List[Dict]:
    """
    抓取单个关键词结果，最多max_pages页，
    客户端过滤只保留近days_back天的条目
    """
    results = []
    cutoff_ts = int((datetime.now() - timedelta(days=days_back)).timestamp() * 1000)

    for page in range(1, max_pages + 1):
        try:
            data = fetch_page(keyword, page=page)
            announcements = data.get("announcements") or []
            if not announcements:
                break

            page_has_fresh = False
            for ann in announcements:
                ts = ann.get("announcementTime", "")
                # 客户端时间过滤
                if ts and int(ts) < cutoff_ts:
                    continue  # 太旧，跳过

                page_has_fresh = True
                results.append({
                    "announcementId": ann.get("announcementId", ""),
                    "orgId": ann.get("orgId", ""),
                    "title": ann.get("announcementTitle", ""),
                    "time": ts,
                    "time_str": ts_to_date(ts),
                    "keyword_matched": keyword,
                })

            total = data.get("totalAnnouncement", 0)
            total_pages = max(1, (total + 29) // 30)
            if page >= total_pages:
                break

            time.sleep(0.4)

        except Exception as e:
            break

    return results


def classify_to_bu(title: str, bu_map: dict) -> List[str]:
    matched = []
    for bu_id, cfg in bu_map.items():
        if any(ex in title for ex in cfg.get("exclude", [])):
            continue
        if any(kw in title for kw in cfg.get("keywords", [])):
            matched.append(bu_id)
    return matched


def run(days_back: int = 2, test_mode: bool = False):
    print(f"\n{'='*60}")
    print(f"巨潮资讯公告抓取 | 近 {days_back} 天 | {'测试' if test_mode else '正式'}")
    print(f"{'='*60}\n")

    all_keywords = set()
    for cfg in BU_KEYWORD_MAP.values():
        all_keywords.update(cfg.get("keywords", []))

    all_announcements = {}

    for kw in sorted(all_keywords):
        print(f"[抓取] {kw} ...", end=" ", flush=True)
        try:
            pages = 2 if test_mode else 8
            results = fetch_keyword(kw, days_back=days_back, max_pages=pages)
            print(f"{len(results)} 条(近{-days_back}天)")
            for r in results:
                aid = r["announcementId"]
                if aid not in all_announcements:
                    all_announcements[aid] = r
        except Exception as e:
            print(f"失败: {e}")

    print(f"\n去重后合计: {len(all_announcements)} 条公告")

    # 构建输出
    output = {
        "update_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "days_back": days_back,
        "total": len(all_announcements),
        "departments": {},
        "raw_preview": [],  # 预览前几条，不做BU归类
    }

    for bu_id in BU_KEYWORD_MAP:
        output["departments"][bu_id] = []

    # 预览（原始数据，按时间倒序）
    raw = sorted(all_announcements.values(), key=lambda x: x["time"] or "", reverse=True)
    output["raw_preview"] = [
        {
            "title": r["title"][:80],
            "date": r["time_str"],
            "keyword": r["keyword_matched"],
        }
        for r in raw[:30]
    ]

    # 按BU归类
    for ann_id, ann in all_announcements.items():
        title = ann["title"]
        bus = classify_to_bu(title, BU_KEYWORD_MAP)
        entry = {
            "title": title,
            "date": ann["time_str"],
            "announcementId": ann_id,
            "orgId": ann["orgId"],
            "url": f"https://www.cninfo.com.cn/new/disclosure/detail?announcementId={ann_id}&orgId={ann['orgId']}",
            "keyword_matched": ann["keyword_matched"],
        }
        if bus:
            for bu_id in bus:
                output["departments"].setdefault(bu_id, []).append(entry)
        else:
            output["departments"].setdefault("__global__", []).append(entry)

    # 统计
    print("\n各部门公告数:")
    total_assigned = 0
    for bu_id, items in output["departments"].items():
        if bu_id == "__global__":
            continue
        total_assigned += len(items)
        bu_name = BU_KEYWORD_MAP.get(bu_id, {}).get("name", bu_id)
        print(f"  {bu_name}({bu_id}): {len(items)} 条")
    print(f"  未分类: {len(output['departments'].get('__global__', []))} 条")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\n[保存] {OUTPUT_FILE}")

    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=2, help="抓取近N天数据，默认2天")
    parser.add_argument("--test", action="store_true", help="测试模式")
    args = parser.parse_args()
    run(days_back=args.days, test_mode=args.test)
