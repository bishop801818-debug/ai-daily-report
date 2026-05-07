"""
测试cninfo真实API端点
关键发现：
- URL: https://www.cninfo.com.cn/new/hisAnnouncement/query (POST)
- 需要Cookie认证 (JSESSIONID + insert_cookie)
- stock参数直接用股票代码，如 '300014'
- column用 'szse'(深市) / 'shse'(沪市) / 'bse'(北交所)
- seDate格式: 'YYYY-MM-DD~YYYY-MM-DD'
"""
import requests
import json
import time
from datetime import datetime, timedelta

# cninfo API 端点
CNINFO_URL = "https://www.cninfo.com.cn/new/hisAnnouncement/query"

# 测试用headers（从浏览器复制，需要替换真实cookie）
HEADERS = {
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Connection": "keep-alive",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Host": "www.cninfo.com.cn",
    "Origin": "https://www.cninfo.com.cn",
    "Referer": "https://www.cninfo.com.cn/new/commonUrl/pageOfSearch?url=disclosure/list/search",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
    # Cookie需要从浏览器获取
    "Cookie": "JSESSIONID=; insert_cookie=",
}

# 上市公司股票代码映射（部分关键公司）
STOCK_CODES = {
    "亿纬锂能": ("300014", "szse"),
    "宁德时代": ("300750", "szse"),
    "比亚迪": ("002594", "szse"),
    "盟固利": ("301487", "szse"),
    "天赐材料": ("002709", "szse"),
    "湖南裕能": ("301358", "szse"),
    "德方纳米": ("301567", "szse"),
    "龙蟠科技": ("603906", "shse"),
    "中伟股份": ("301919", "szse"),
    "赣锋锂业": ("002460", "szse"),
    "天齐锂业": ("002466", "szse"),
    "盐湖股份": ("000792", "szse"),
    "新宙邦": ("301037", "szse"),
    "多氟多": ("002407", "szse"),
    "石大胜华": ("603026", "shse"),
    "当升科技": ("300073", "szse"),
    "容百科技": ("688005", "shse"),
    "中矿资源": ("002738", "szse"),
    "德业股份": ("605117", "shse"),
}


def test_cninfo_basic():
    """测试1: 不带cookie直接请求，看返回什么"""
    print("=" * 60)
    print("测试1: 无Cookie请求")
    payload = {
        'pageNum': '1',
        'pageSize': '5',
        'column': 'szse',
        'tabName': 'fulltext',
        'plate': '',
        'stock': '300014',
        'searchkey': '',
        'secid': '',
        'category': '',
        'trade': '',
        'seDate': '',
        'sortName': '',
        'sortType': '',
        'isHLtitle': 'true',
    }
    try:
        resp = requests.post(CNINFO_URL, headers=HEADERS, data=payload, timeout=10)
        print(f"状态码: {resp.status_code}")
        print(f"响应: {resp.text[:500]}")
    except Exception as e:
        print(f"请求失败: {e}")


def test_cninfo_with_session():
    """测试2: 先建立session，再请求"""
    print("\n" + "=" * 60)
    print("测试2: 先建立session获取cookie，再请求")

    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
        "Accept-Language": "zh-CN,zh;q=0.9",
    })

    # 先访问首页获取cookie
    try:
        resp = session.get("https://www.cninfo.com.cn/new/commonUrl/pageOfSearch?url=disclosure/list/search", timeout=10)
        print(f"首页状态: {resp.status_code}")
        print(f"Cookies: {session.cookies.get_dict()}")

        # 再请求API
        payload = {
            'pageNum': '1',
            'pageSize': '5',
            'column': 'szse',
            'tabName': 'fulltext',
            'stock': '300014',
            'searchkey': '',
            'seDate': '',
            'isHLtitle': 'true',
        }
        resp2 = session.post(CNINFO_URL, data=payload, timeout=10)
        print(f"API状态: {resp2.status_code}")
        print(f"响应: {resp2.text[:800]}")
    except Exception as e:
        print(f"失败: {e}")


def test_cninfo_date_filter():
    """测试3: 带日期过滤，搜索近7天公告"""
    print("\n" + "=" * 60)
    print("测试3: 日期过滤，近7天亿纬锂能公告")

    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    date_range = f"{start_date}~{end_date}"

    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Accept": "*/*",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
    })

    try:
        # 先访问首页获取cookie
        session.get("https://www.cninfo.com.cn/", timeout=10)
        print(f"Session Cookies: {session.cookies.get_dict()}")

        payload = {
            'pageNum': '1',
            'pageSize': '30',
            'column': 'szse',
            'tabName': 'fulltext',
            'stock': '300014',
            'searchkey': '',
            'seDate': date_range,
            'isHLtitle': 'true',
        }
        resp = session.post(CNINFO_URL, data=payload, timeout=10)
        print(f"状态: {resp.status_code}")

        data = resp.json()
        print(f"总公告数: {data.get('totalAnnouncement', 'N/A')}")
        print(f"本次返回: {len(data.get('announcements', []))} 条")

        for ann in data.get('announcements', [])[:5]:
            print(f"\n  [{ann.get('announcementTime', '')[:10]}] {ann.get('announcementTitle', '')}")
            print(f"  ID: {ann.get('announcementId', '')}")
            print(f"  URL: https://www.cninfo.com.cn/new/announcement/detail?announcementId={ann.get('announcementId', '')}&timestamp={ann.get('announcementTime', '')}")
    except Exception as e:
        print(f"失败: {e}")


def test_multiple_companies():
    """测试4: 批量获取多个公司的近7天公告"""
    print("\n" + "=" * 60)
    print("测试4: 批量获取多家公司近7天公告")

    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
    date_range = f"{start_date}~{end_date}"

    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
        "Accept-Language": "zh-CN,zh;q=0.9",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
    })

    try:
        session.get("https://www.cninfo.com.cn/", timeout=10)
        cookies = session.cookies.get_dict()
        print(f"Cookies: {cookies}")

        if not cookies:
            print("警告: 无法获取Cookie，API请求可能失败")
            return

        # 按公司代码搜索（分批，每批间隔1秒）
        for company, (code, exchange) in list(STOCK_CODES.items())[:8]:
            payload = {
                'pageNum': '1',
                'pageSize': '10',
                'column': exchange,
                'tabName': 'fulltext',
                'stock': code,
                'searchkey': '',
                'seDate': date_range,
                'isHLtitle': 'true',
            }
            try:
                resp = session.post(CNINFO_URL, data=payload, timeout=10)
                data = resp.json()
                total = data.get('totalAnnouncement', 0)
                anns = data.get('announcements', [])
                print(f"\n{company}({code}) [{exchange}]: 共{total}条公告，近7天{len(anns)}条")
                for ann in anns[:3]:
                    print(f"  [{ann.get('announcementTime','')[:10]}] {ann.get('announcementTitle','')}")
            except Exception as e:
                print(f"{company} 请求失败: {e}")

            time.sleep(0.5)

    except Exception as e:
        print(f"整体失败: {e}")


if __name__ == "__main__":
    test_cninfo_basic()
    print("\n")
    test_cninfo_with_session()
    print("\n")
    test_cninfo_date_filter()
    print("\n")
    test_multiple_companies()
