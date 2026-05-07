#!/usr/bin/env python3
"""
巨潮资讯(cninfo)公告抓取脚本 v3
===================
核心修复：日期条件直接嵌入搜索关键词，而非依赖API的startDate/endDate参数
（API在fulltext搜索模式下会忽略日期参数）

策略：搜索关键词格式 "原关键词 + 日期约束"
  - "电解液 2026年4月" → 强制限定为2026年4月
  - 多个月份组合，覆盖近N天

用法:
    python fetch_cninfo_announcements.py              # 默认近2天
    python fetch_cninfo_announcements.py --days 5     # 近5天
    python fetch_cninfo_announcements.py --test       # 测试模式(1页/关键词)
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

# ============================================================
# BU关键词配置
# ============================================================
BU_KEYWORD_MAP = {
    "fellt": {
        "name": "法恩莱特",
        "keywords": ["电解液", "六氟磷酸锂", "六氟磷酸锂产线"],
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
        "exclude": ["基金管理人"],
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


def get_date_constraints(days_back: int) -> List[str]:
    """
    生成日期约束字符串列表。
    返回如 ["2026年4月12日", "2026年4月11日", "2026年4月10日", "2026年4月", "2026年3月"]
    最近的2-3天用"X月X日"精确匹配，更早的时间用"X月"模糊匹配。
    """
    constraints = []
    today = datetime.now()
    for i in range(days_back):
        d = today - timedelta(days=i)
        constraints.append(f"{d.year}年{d.month}月{d.day}日")
    # 近期月份模糊匹配（覆盖T-3到T-30的窗口）
    for i in range(days_back, min(days_back + 5, 30)):
        d = today - timedelta(days=i)
        month_str = f"{d.year}年{d.month}月"
        if month_str not in constraints:
            constraints.append(month_str)
    return constraints


def fetch_page(keyword: str, date_constraint: str, page: int = 1, page_size: int = 30) -> Dict:
    """
    带日期约束的单页请求
    """
    # API的日期参数（作为兜底，实际API可能忽略）
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

    # 搜索关键词 = 原关键词 + 日期约束
    search_key = f"{keyword} {date_constraint}"

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
        "searchkey": search_key,
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


def fetch_keyword_all_pages(keyword: str, date_constraints: List[str], max_per_constraint: int = 3) -> List[Dict]:
    """
    对单个关键词，在多个日期约束下抓取，取最多max_per_constraint页/约束
    """
    results = []
    seen_ids = set()

    for constraint in date_constraints:
        for page in range(1, max_per_constraint + 1):
            try:
                data = fetch_page(keyword, constraint, page=page)
                announcements = data.get("announcements") or []
                if not announcements:
                    break

                for ann in announcements:
                    aid = ann.get("announcementId", "")
                    if aid in seen_ids:
                        continue
                    seen_ids.add(aid)

                    ts = ann.get("announcementTime", "")
                    results.append({
                        "announcementId": aid,
                        "orgId": ann.get("orgId", ""),
                        "title": ann.get("announcementTitle", ""),
                        "time": ts,
                        "time_str": ts_to_date(ts),
                        "keyword_matched": keyword,
                        "date_constraint": constraint,
                    })

                total = data.get("totalAnnouncement", 0)
                total_pages = max(1, (total + 29) // 30)
                if page >= total_pages:
                    break

                time.sleep(0.3)

            except Exception as e:
                break

    return results


def classify_to_bu(title: str, bu_map: dict) -> List[str]:
    """将公告归类到匹配的BU"""
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
    print(f"{'='*60}")

    date_constraints = get_date_constraints(days_back)
    print(f"日期约束: {date_constraints}\n")

    # 收集所有关键词
    all_keywords = set()
    for cfg in BU_KEYWORD_MAP.values():
        all_keywords.update(cfg.get("keywords", []))

    all_announcements = {}  # {annId: ann}

    for kw in sorted(all_keywords):
        print(f"[抓取] {kw} ...", end=" ", flush=True)
        try:
            # 精确日期匹配只取1页，月份匹配取2页
            pages = 1 if "日" in date_constraints[0] else 2
            if test_mode:
                pages = 1
            results = fetch_keyword_all_pages(kw, date_constraints, max_per_constraint=pages)
            print(f"{len(results)} 条")
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
        "total": len(all_announcements),
        "departments": {}
    }

    for bu_id in BU_KEYWORD_MAP:
        output["departments"][bu_id] = []

    # 全局
    output["departments"]["__global__"] = []

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
            output["departments"]["__global__"].append(entry)

    # 各BU统计
    print("\n各部门公告数:")
    total_assigned = 0
    for bu_id, items in output["departments"].items():
        if bu_id == "__global__":
            continue
        total_assigned += len(items)
        bu_name = BU_KEYWORD_MAP.get(bu_id, {}).get("name", bu_id)
        print(f"  {bu_name}({bu_id}): {len(items)} 条")
    print(f"  全局未分类: {len(output['departments'].get('__global__', []))} 条")
    print(f"  实际归入BU: {total_assigned} 条")

    # 保存
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