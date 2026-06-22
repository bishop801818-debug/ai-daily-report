#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成热点新闻数据文件
从9个事业部早报中提取"今日关注"新闻，随机抽取5条，生成hot_news_data.json

容错逻辑：
- 检查事业部JSON的"报告时间"字段
- 如果不是今天，则沿用昨天的hot_news_data.json（不覆盖）
- 如果是今天，则生成新数据

URL搜索逻辑：
- 对每条新闻，用Tavily API搜索相关链接（优先）
- 如果Tavily不可用，回退到Bing搜索
- 过滤付费墙网站，取第一个有效链接
- 写入 url 和 url_source 字段
"""

import json
import random
import os
import re
import urllib.request
import urllib.parse
from datetime import datetime, date, timedelta
from html import unescape

# 加载 .env 文件中的环境变量（如果存在）
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("[信息] 已加载 .env 文件")
except ImportError:
    print("[警告] python-dotenv 未安装，将无法从 .env 文件读取环境变量")
    print("[提示] 可运行: pip install python-dotenv")

# 配置
REPORTS_DIR = "D:/trae/AI Daily report/reports"
OUTPUT_FILE = "D:/trae/AI Daily report/hot_news_data.json"

# Unsplash API配置（用于预绑定图片）
UNSPLASH_ACCESS_KEY = os.environ.get('UNSPLASH_ACCESS_KEY', '')
UNSPLASH_API_URL = "https://api.unsplash.com/search/photos"

# 事业部简称到文件名前缀的映射（用于动态查找文件）
# 格式：事业部简称 -> 文件名前缀
BU_PREFIX_MAP = {
    "润滑油事业部": "lube",
    "可兰素事业部": "kls",
    "常州锂源事业部": "czly",
    "龙蟠时代事业部": "lpsd",
    "山东美多事业部": "sdmd",
    "三金锂电事业部": "sjld",
    "铂源催化事业部": "bych",
    "法恩莱特事业部": "fnlt",
    "迪克化学事业部": "dkhx"
}

# 事业部行业关键词映射（用于图片搜索优化）
# 当标题过于复杂时，用行业关键词搜索更精准的图片
BU_KEYWORDS = {
    "润滑油事业部": "oil lubricant industrial",
    "可兰素事业部": "urea fertilizer agriculture",
    "常州锂源事业部": "lithium battery LFP",
    "龙蟠时代事业部": "lithium carbonate battery",
    "山东美多事业部": "battery recycling EV",
    "三金锂电事业部": "lithium battery ternary",
    "铂源催化事业部": "hydrogen electrolysis catalyst",
    "法恩莱特事业部": "electrolyte battery lithium",
    "迪克化学事业部": "coolant brake fluid"
}

# 兼容旧格式文件名（备用）
BU_FILES_LEGACY = [
    "01-润滑油事业部.json",
    "02-可兰素事业部.json",
    "03-常州锂源事业部.json",
    "04-龙蟠时代事业部.json",
    "05-山东美多事业部.json",
    "06-三金锂电事业部.json",
    "07-铂源催化事业部.json",
    "08-法恩莱特事业部.json",
    "09-迪克化学事业部.json"
]

def find_bu_file(bu_name):
    """
    动态查找事业部文件
    优先查找新格式（2026-06-08-XXX.json），找不到则查找旧格式
    """
    today_str = date.today().strftime("%Y-%m-%d")
    
    # 尝试新格式：2026-06-08-XXX.json
    prefix = BU_PREFIX_MAP.get(bu_name)
    if prefix:
        new_format_path = os.path.join(REPORTS_DIR, f"{today_str}-{prefix}.json")
        if os.path.exists(new_format_path):
            return new_format_path
    
    # 尝试旧格式：01-润滑油事业部.json
    legacy_names = {
        "润滑油事业部": "01-润滑油事业部.json",
        "可兰素事业部": "02-可兰素事业部.json",
        "常州锂源事业部": "03-常州锂源事业部.json",
        "龙蟠时代事业部": "04-龙蟠时代事业部.json",
        "山东美多事业部": "05-山东美多事业部.json",
        "三金锂电事业部": "06-三金锂电事业部.json",
        "铂源催化事业部": "07-铂源催化事业部.json",
        "法恩莱特事业部": "08-法恩莱特事业部.json",
        "迪克化学事业部": "09-迪克化学事业部.json"
    }
    legacy_path = os.path.join(REPORTS_DIR, legacy_names.get(bu_name, ""))
    if os.path.exists(legacy_path):
        return legacy_path
    
    return None

def load_bu_data(file_path):
    """加载事业部JSON文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[警告] 无法加载文件 {file_path}: {e}")
        return None

def check_bu_updated(bu_data):
    """
    检查事业部数据是否已更新（报告时间是否是今天）
    支持两种格式：
      - 旧格式：header.报告时间 = "2026-06-09"
      - 新格式（2026-06-09起）：顶层name + sections为list，无header.报告时间
        新格式的文件日期已由find_bu_file()的文件名校验保证
    返回：(is_updated, report_date_str)
    """
    if not bu_data or not isinstance(bu_data, dict):
        return False, None
    
    # 旧格式：header.报告时间
    report_time = bu_data.get("header", {}).get("报告时间", "")
    if report_time:
        try:
            report_date = datetime.strptime(report_time, "%Y-%m-%d").date()
            today = date.today()
            return report_date == today, report_time
        except:
            return False, report_time
    
    # 新格式：无header.报告时间，但有name和sections(list) → 认为已更新
    if "name" in bu_data and isinstance(bu_data.get("sections"), list):
        # 文件名已由find_bu_file()校验日期，此处返回True
        return True, date.today().strftime("%Y-%m-%d")
    
    return False, None

def extract_news_items(bu_data):
    """从事业部数据中提取今日关注新闻（兼容新旧两种JSON格式）"""
    if not bu_data or not isinstance(bu_data, dict):
        return []
    
    # 尝试旧格式：header.事业部、sections["今日关注"]
    bu_name = bu_data.get("header", {}).get("事业部", "")
    report_time = bu_data.get("header", {}).get("报告时间", "")
    
    # 如果旧格式没找到事业部名，尝试新格式：顶层 name
    if not bu_name:
        bu_name = bu_data.get("name", "未知BU")
    
    # 如果旧格式没找到报告时间，默认为今天
    if not report_time:
        report_time = date.today().strftime("%Y-%m-%d")
    
    # 尝试旧格式：sections["今日关注"]（dict形式）
    sections = bu_data.get("sections", {})
    if isinstance(sections, dict):
        today_focus = sections.get("今日关注", [])
    elif isinstance(sections, list):
        # 新格式：sections是list，找 dim="topnews" 的section
        today_focus = []
        for section in sections:
            if section.get("dim") == "topnews":
                today_focus = section.get("items", [])
                break
    else:
        today_focus = []
    
    items = []
    for idx, item in enumerate(today_focus):
        # 旧格式：标题/内容；新格式：title
        title = item.get("标题", item.get("title", item.get("内容", "")))
        if title:
            items.append({
                "bu": bu_name,
                "title": title,
                "date": report_time
            })
    
    return items

def is_market_price_news(title):
    """
    判断新闻是否是纯行情类新闻（价格波动、股价涨停等）
    这类新闻不适合在首页热点新闻展示，应该过滤掉
    
    返回True表示是行情类新闻，应该过滤
    返回False表示是有深度的行业新闻，应该保留
    """
    if not title:
        return False
    
    title_lower = title.lower()
    
    # 1. 包含涨跌百分比（如"涨2.87%"、"跌4%"、"单日跌近3%"）
    if re.search(r'[涨跌][\d.]+%|[单双]日[涨跌][\d.]+%', title):
        return True
    
    # 2. 包含具体价格单位（这是行情数据的显著特征）
    price_units = [
        '美元/盎司', '美元/桶', '美元/吨',
        '万元/吨', '万元/吨',
        '元/吨', '元/克', '元/千克',
        '元/桶',
    ]
    for unit in price_units:
        if unit in title:
            return True
    
    # 3. 包含"涨停"、"首板"、"跌停"（股价行情）
    if '涨停' in title or '首板' in title or '跌停' in title:
        return True
    
    # 4. 包含"涨跌"关键词
    if '涨跌' in title:
        return True
    
    # 5. 明显的行情描述词汇
    market_keywords = ['重挫', '暴涨', '暴跌', '飙升', '跳水', '崩盘', '反弹']
    for kw in market_keywords:
        if kw in title:
            # 但要排除一些可能是行业新闻的情况
            # 如果只是价格数字+涨跌，没有其他实质内容，才是行情
            if re.search(r'[涨跌][\d.]+%', title) or re.search(r'\d+[\d.]*%', title):
                return True
    
    return False


def select_news_evenly(all_items, target_count=5):
    """
    均匀抽取新闻，尽量避免从同一事业部抽取多条
    算法：
    1. 按事业部分组
    2. 每个事业部最多选1条（如果可能）
    3. 随机选择事业部，然后从该事业部随机选1条
    4. 如果选不出足够的条数，允许某些事业部选2条
    
    新增：过滤掉纯行情类新闻，只保留有深度的行业新闻
    """
    if not all_items:
        return []
    
    # 按事业部分组
    bu_groups = {}
    for item in all_items:
        bu = item["bu"]
        if bu not in bu_groups:
            bu_groups[bu] = []
        bu_groups[bu].append(item)
    
    # 【新增】过滤掉纯行情类新闻，只保留有深度的行业新闻
    filtered_bu_groups = {}
    market_filtered_count = 0
    for bu, items in bu_groups.items():
        filtered_items = []
        for item in items:
            title = item.get("title", "")
            if is_market_price_news(title):
                market_filtered_count += 1
                print(f"  [过滤] 行情类新闻: [{bu}] {title[:40]}...")
            else:
                filtered_items.append(item)
        if filtered_items:
            filtered_bu_groups[bu] = filtered_items
    
    if market_filtered_count > 0:
        print(f"[信息] 过滤掉 {market_filtered_count} 条行情类新闻，保留 {sum(len(v) for v in filtered_bu_groups.values())} 条行业新闻")
    
    # 如果过滤后没有足够的新闻，回退到使用未过滤的数据
    if not filtered_bu_groups:
        print(f"[警告] 过滤后没有剩余新闻，回退到未过滤数据")
        filtered_bu_groups = bu_groups
    
    selected = []
    used_bu_counts = {}  # 记录每个事业部已选的条数
    
    # 第一轮：每个事业部最多选1条（使用过滤后的filtered_bu_groups）
    available_bus = list(filtered_bu_groups.keys())
    random.shuffle(available_bus)
    
    for bu in available_bus:
        if len(selected) >= target_count:
            break
        if filtered_bu_groups[bu]:  # 该事业部有新闻
            item = random.choice(filtered_bu_groups[bu])
            selected.append(item)
            used_bu_counts[bu] = 1
    
    # 如果还不够，第二轮：允许某些事业部选2条（使用过滤后的filtered_bu_groups）
    if len(selected) < target_count:
        retry_count = 0
        while len(selected) < target_count and retry_count < 100:
            retry_count += 1
            random.shuffle(available_bus)
            for bu in available_bus:
                if len(selected) >= target_count:
                    break
                # 如果该事业部已选1条，且还有剩余新闻，可以选第2条
                if used_bu_counts.get(bu, 0) < 2 and len(filtered_bu_groups[bu]) > used_bu_counts.get(bu, 0):
                    # 选一个未选过的
                    selected_titles = [s["title"] for s in selected if s["bu"] == bu]
                    available_items = [i for i in filtered_bu_groups[bu] if i["title"] not in selected_titles]
                    if available_items:
                        item = random.choice(available_items)
                        selected.append(item)
                        used_bu_counts[bu] = used_bu_counts.get(bu, 0) + 1
    
    return selected

def load_existing_data():
    """加载已有的hot_news_data.json（用于容错）"""
    try:
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return None

# 付费墙/需登录的域名列表（搜索结果出现这些域名时跳过）
PAYWALL_DOMAINS = [
    'caixin.com',
    'ft.com',
    'wsj.com',
    'bloomberg.com',
    'economist.com',
    'nytimes.com',
    'reuters.com',  # 部分内容付费
    'financialtimes.com',
    'sgx.com',  # 新交所需登录
]

def is_paywall_url(url):
    """判断URL是否属于付费墙网站"""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.netloc.lower().replace('www.', '')
        return any(pw in domain for pw in PAYWALL_DOMAINS)
    except:
        return False

def search_news_url(title, max_results=5):
    """
    用多种方法搜索新闻URL
    优先使用Tavily API（如果配置了TAVILY_API_KEY）
    备用：使用Bing搜索
    返回：(url, source_name, image_url) 或 (None, None, None)
    """
    # 方法1：尝试Tavily API（如果配置了）
    tavily_key = os.environ.get('TAVILY_API_KEY', '')
    if tavily_key:
        result = search_with_tavily(title, tavily_key)
        if result and result[0]:
            return result
    
    # 方法2：Bing搜索（备用）
    return search_with_bing(title, max_results)

import re

def extract_date_from_url(url):
    """
    从 URL 中提取日期，返回 date 对象或 None。
    支持格式（按匹配优先级）：
      - YYYY/MM/DD  或  YYYY/MM/DD/    （斜杠分隔）
      - YYYY-MM-DD                      （短横杠分隔）
      - YYYY-MM/DD  或  YYYY/MM-DD    （混合分隔，常见于国内新闻站）
      - YYYYMMDD（8位连续数字，如东方财富）
    """
    if not url:
        return None
    import re

    # 辅助：验证并构造 date 对象
    def try_date(y, mo, d):
        try:
            y, mo, d = int(y), int(mo), int(d)
            if 1 <= mo <= 12 and 1 <= d <= 31:
                return datetime(y, mo, d).date()
        except:
            pass
        return None

    # 格式1：YYYY/MM/DD 或 YYYY/MM/DD/（纯斜杠）
    m = re.search(r'/(\d{4})/(\d{1,2})/(\d{1,2})(?:/|$)', url)
    if m:
        d = try_date(m.group(1), m.group(2), m.group(3))
        if d:
            return d

    # 格式2：YYYY-MM-DD（纯短横杠）
    m = re.search(r'(\d{4})-(\d{2})-(\d{2})', url)
    if m:
        d = try_date(m.group(1), m.group(2), m.group(3))
        if d:
            return d

    # 格式3：YYYY-MM/DD 或 YYYY/MM-DD（混合分隔）
    m = re.search(r'/(\d{4})-(\d{2})/(\d{1,2})(?:/|$)', url)
    if m:
        d = try_date(m.group(1), m.group(2), m.group(3))
        if d:
            return d
    m = re.search(r'/(\d{4})/(\d{2})-(\d{1,2})(?:/|$)', url)
    if m:
        d = try_date(m.group(1), m.group(2), m.group(3))
        if d:
            return d

    # 格式4：YYYYMMDD（8位连续数字，如东方财富 URL）
    for m4 in re.finditer(r'\d{8}', url):
        s = m4.group(0)
        y, mo, d = s[:4], s[4:6], s[6:8]
        # 粗略过滤：年2000-2030，月1-12，日1-31
        try:
            y2, mo2, d2 = int(y), int(mo), int(d)
            if 2000 <= y2 <= 2030 and 1 <= mo2 <= 12 and 1 <= d2 <= 31:
                return datetime(y2, mo2, d2).date()
        except:
            pass

    return None


def is_old_url(url, max_days=7):
    """
    判断 URL 是否是旧闻（从 URL 中提取日期，早于当前日期-max_days 则认为是旧闻）。
    返回 True 表示是旧闻，应该过滤。
    """
    if not url:
        return False
    url_date = extract_date_from_url(url)
    if url_date is None:
        return False  # 无法提取日期，不过滤
    from datetime import date, timedelta
    cutoff = date.today() - timedelta(days=max_days)
    if url_date < cutoff:
        print(f"    [日期过滤] 旧闻URL（{url_date}）: {url[:60]}...")
        return True
    return False


def search_with_tavily(title, api_key):
    """
    使用Tavily API搜索新闻URL（只获取URL，不获取图片）

    ⚠️ 重要：Tavily返回的image_url全部是新闻文章的嵌入配图/截图/图表，
    这类图片质量差且不符合展示要求。因此本函数不再返回任何image_url。
    图片统一由 Unsplash 高质量图库提供。
    """
    try:
        import urllib.request
        import json

        # Tavily Search API endpoint
        url = "https://api.tavily.com/search"

        # 构建请求数据（新增 max_days 参数，只返回近期结果）
        data = {
            "api_key": api_key,
            "query": title,
            "max_results": 5,
            "search_depth": "basic",
            "include_answer": False,
            "include_raw_content": False,
            "include_images": False,
            "max_days": 7  # 🆕 只返回最近7天的结果
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={
                'Content-Type': 'application/json'
            }
        )

        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read().decode('utf-8'))

        # 提取结果，过滤付费墙和旧闻URL
        results = result.get('results', [])
        valid_result = None
        for res in results:
            u = res.get('url', '')
            s = res.get('source', res.get('title', '未知来源'))
            # 检查付费墙
            if is_paywall_url(u):
                print(f"    [Tavily] 跳过付费墙: {u[:60]}...")
                continue
            # 🆕 检查是否是旧闻URL
            if is_old_url(u, max_days=7):
                continue  # 已打印日志，直接跳过
            valid_result = (u, s)
            break

        if valid_result:
            url, source = valid_result
            print(f"    [Tavily] 找到链接: {source} - {url[:60]}... (图片由Unsplash提供)")
            return url, source, ''
        else:
            # 所有结果都被过滤，回退：取第一个非付费墙结果（不过日期过滤）
            for res in results:
                u = res.get('url', '')
                s = res.get('source', res.get('title', '未知来源'))
                if not is_paywall_url(u):
                    print(f"    [Tavily] ⚠️ 所有结果均为旧闻，回退使用: {s} - {u[:60]}...")
                    return u, s, ''

        print(f"    [Tavily] 未找到有效结果: {title[:30]}...")
        return None, None, None

    except Exception as e:
        print(f"    [Tavily] API调用失败: {e}")
        return None, None

def search_with_bing(title, max_results=5):
    """使用Bing搜索（备用方法）"""
    try:
        query = urllib.parse.quote_plus(title)
        search_url = f"https://www.bing.com/search?q={query}&setlang=zh-CN"

        req = urllib.request.Request(
            search_url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            }
        )

        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')

        # 从Bing HTML中提取结果链接（改进的正则）
        # 尝试多种格式
        patterns = [
            r'<li class="b_algo"><h2><a[^>]+href="(https?://[^"]+)"',  # 标准格式
            r'<h2><a href="(https?://[^"]+)"',  # 简化格式
            r'<a href="(https?://[^"]+)"[^>]*class="[^"]*tilk[^"]*"',  # 另一个格式
            r'<cite[^>]*>(https?://[^<]+)</cite>',  # cite标签
        ]

        all_matches = []
        for pattern in patterns:
            matches = re.findall(pattern, html)
            if matches:
                all_matches.extend(matches)

        if not all_matches:
            # 调试：保存HTML到文件
            debug_file = f"D:/trae/AI Daily report/debug_bing_{title[:20].replace(' ', '_')}.html"
            with open(debug_file, 'w', encoding='utf-8') as f:
                f.write(html)
            print(f"    [Bing] 未找到结果，HTML已保存到: {debug_file}")
            return None, None, None
            
        # 过滤付费墙和旧闻URL，取第一个有效链接
        for i, url in enumerate(all_matches[:max_results]):
            if is_paywall_url(url):
                print(f"    [Bing] 跳过付费墙: {url[:60]}...")
                continue
            # 🆕 检查是否是旧闻URL
            if is_old_url(url, max_days=30):  # Bing 结果较杂，放宽到30天
                continue
            # 取来源网站名
            try:
                from urllib.parse import urlparse
                domain = urlparse(url).netloc.replace('www.', '')
            except:
                domain = '未知来源'
            print(f"    [Bing] 找到链接: {domain} - {url[:60]}...")
            return url, domain, None  # Bing搜索不返回图片URL
        
        print(f"    [Bing] 所有结果均为付费墙或旧闻，未找到有效链接: {title[:30]}...")
        return None, None, None

    except Exception as e:
        print(f"    [Bing] 搜索失败: {e}")
        return None, None

def load_existing_news_for_url_inheritance():
    """
    加载旧的hot_news_data.json，返回一个字典：title -> {url, url_source}
    用于在URL搜索失败时继承旧的URL
    优先读取当前文件，如果无URL记录则尝试从git历史加载
    """
    inheritance_map = {}
    
    def parse_and_build_map(json_str_or_data):
        """解析JSON并构建inheritance_map，返回记录数"""
        nonlocal inheritance_map
        inheritance_map = {}  # 重置
        try:
            if isinstance(json_str_or_data, str):
                old_data = json.loads(json_str_or_data)
            else:
                old_data = json_str_or_data
            old_news = old_data.get('news', [])
            for old_item in old_news:
                title = old_item.get('title', '')
                url = old_item.get('url')
                url_source = old_item.get('url_source')
                image_url = old_item.get('image_url')  # 也继承image_url
                if title and url:  # 只继承有URL的旧数据
                    inheritance_map[title] = {
                        'url': url,
                        'url_source': url_source,
                        'image_url': image_url
                    }
            return len(inheritance_map)
        except Exception as e:
            print(f"  [继承] 解析JSON失败: {e}")
            return 0
    
    # 方法1：读取当前文件
    try:
        if os.path.exists(OUTPUT_FILE):
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                content = f.read()
            count = parse_and_build_map(content)
            if count > 0:
                print(f"  [继承] 从当前文件加载URL映射（{count}条有URL的记录）")
                return inheritance_map
            else:
                print(f"  [继承] 当前文件无URL记录（{count}条），尝试git历史...")
    except Exception as e:
        print(f"  [继承] 读取当前文件失败: {e}")
    
    # 方法2：从git历史加载（找到最近一个有URL记录的版本）
    try:
        import subprocess
        # 找到最近修改hot_news_data.json的commit（最多查10个）
        result = subprocess.run(
            ['git', 'log', '--oneline', '-10', '--', 'hot_news_data.json'],
            capture_output=True, text=True, cwd=os.path.dirname(OUTPUT_FILE)
        )
        if result.returncode == 0 and result.stdout.strip():
            commits = result.stdout.strip().split('\n')
            for commit_line in commits:
                commit_hash = commit_line.split()[0]
                # 读取该commit的hot_news_data.json
                show_result = subprocess.run(
                    ['git', 'show', f'{commit_hash}:hot_news_data.json'],
                    capture_output=True, text=True, cwd=os.path.dirname(OUTPUT_FILE)
                )
                if show_result.returncode == 0:
                    count = parse_and_build_map(show_result.stdout)
                    if count > 0:
                        print(f"  [继承] 从git历史 {commit_hash} 加载URL映射（{count}条有URL的记录）")
                        return inheritance_map
            print(f"  [继承] git历史中未找到有URL记录的版本")
    except Exception as e:
        print(f"  [继承] 读取git历史失败: {e}")
    
    return inheritance_map

def fuzzy_match_title(new_title, inheritance_map, min_prefix=15):
    """
    模糊匹配标题：如果新标题的前min_prefix个字符与旧标题的前min_prefix个字符相同，
    则认为匹配（返回旧标题的url信息）
    """
    if not new_title or not inheritance_map:
        return None
    
    new_prefix = new_title[:min_prefix]
    
    # 方法1：前缀匹配（最快）
    for old_title, old_data in inheritance_map.items():
        if old_title.startswith(new_prefix) or new_title.startswith(old_title[:min_prefix]):
            return old_data
    
    # 方法2：包含相同关键词（备用）
    # 提取关键词（简单方法：按空格/标点分割，取长度>3的词）
    import re
    new_keywords = set(re.findall(r'[\w\u4e00-\u9fff]{3,}', new_title))
    for old_title, old_data in inheritance_map.items():
        old_keywords = set(re.findall(r'[\w\u4e00-\u9fff]{3,}', old_title))
        # 如果有2个以上共同关键词，认为相关
        if len(new_keywords & old_keywords) >= 2:
            return old_data
    
    return None

def enrich_news_with_urls(selected_items, inheritance_map=None):
    """
    为每条新闻搜索URL，返回带url、url_source、image_url字段的新列表
    如果搜索失败，尝试从继承映射（inheritance_map）中继承相似标题的URL
    inheritance_map: dict, key=旧标题, value={url, url_source, image_url}
    """
    
    enriched = []
    for item in selected_items:
        print(f"  [搜索URL] {item['title'][:40]}...")
        url, source, image_url = search_news_url(item['title'])
        
        # 如果搜索失败，尝试继承旧URL（模糊匹配）
        if not url:
            title = item.get('title', '')
            matched = fuzzy_match_title(title, inheritance_map)
            if matched:
                url = matched['url']
                source = matched['url_source']
                image_url = matched.get('image_url')  # 继承时也继承image_url
                print(f"    [继承] 模糊匹配，使用旧数据的URL: {source} - {url[:60]}...")
        
        new_item = dict(item)  # 复制原item
        new_item['url'] = url
        new_item['url_source'] = source
        new_item['image_url'] = image_url  # 添加image_url字段
        enriched.append(new_item)
    return enriched

def is_low_quality_image(url):
    """
    检测图片URL是否是低质量的截图/图表
    返回True表示是低质量图片，应该被过滤
    """
    if not url:
        return True
    
    url_lower = url.lower()
    
    # 1. 已知的截图/图表域名（扩展版）
    # 注意：这些域名会被直接过滤，不检查safe_domains
    screenshot_domains = [
        'cv.ce.cn',           # 中国经济网汽车频道，经常返回数据图表
        'img.ce.cn',          # 中国经济网图片
        'eastmoney.com',      # 东方财富，财经门户截图
        'sina.com.cn',       # 新浪财经，截图为主
        'securities.eastmoney.com',  # 东方财富证券APP
        'mobappconfig.securities.eastmoney.com',  # 东方财富APP配置图
        'sinakd',           # 新浪山东分站
        'mmbiz.qpic.cn',     # 腾讯民报公众号
    ]
    for domain in screenshot_domains:
        if domain in url_lower:
            return True
    
    # 1.5 允许来自这些高质量图床/媒体网站的图片（不过滤）
    safe_image_domains = [
        'cctvpic.com',            # 央视图片
        'chinadaily.com.cn',     # 中国日报
        'people.com.cn',         # 人民网
        'xinhua.net',            # 新华网
        'img3.chinadaily.com.cn', # 中国日报图片
        'imgqn.smm.cn',         # 上海有色
        'static.mianbaoban',    # 面包板
        'cankao.com',           # 参考消息
        'ouralpha.app',         # 行业网站
        'catl.com',           # 宁德时代
        'in-en.com',          # 国际能源网
        'sinolub.com',        # 中国润滑油网
        'aliyuncs.com',      # 阿里云OSS
        'faiusr.com',        # 懒人图客
    ]
    for domain in safe_image_domains:
        if domain in url_lower:
            return False  # 允许
    
    # 2. URL路径包含截图特征命名（如 W020260610532405801766.png）
    # 这种命名通常是网页截图或数据图表
    if re.search(r'W\d{12,}\.(png|jpg|jpeg)', url, re.IGNORECASE):
        return True
    
    # 3. URL包含新闻子路径 + png格式（通常是新闻网页截图）
    # 但允许来自大型媒体网站的图片
    if '/news/' in url_lower and url_lower.endswith('.png'):
        # 允许来自这些大型媒体网站的图片
        safe_domains = [
            'cctvpic.com',            # 央视
            'chinadaily.com.cn',     # 中国日报
            'people.com.cn',         # 人民网
            'xinhua.net',            # 新华网
            'img3.chinadaily.com.cn', # 中国日报图片
            'imgqn.smm.cn',         # 上海有色
            'static.mianbaoban',    # 面包板
            'cankao.com',           # 参考消息
            'news.cn',               # 新华网
            'ouralpha.app',         # 行业网站
        ]
        is_safe = any(cdn in url_lower for cdn in safe_domains)
        if not is_safe:
            return True
    
    # 3.1 腾讯民报公众号图片（mmbiz.qpic.cn）- 公众号文章截图，质量差
    if 'mmbiz.qpic.cn' in url_lower:
        return True
    
    # 4. 上传图片的时间戳命名（如 1780909599170804.jpg）
    if re.search(r'/\d{14,}\.(jpg|jpeg|png)', url, re.IGNORECASE):
        return True
    
    # 5. 路径包含 sinakd（新浪山东分站）- 通常是截图
    if 'sinakd' in url_lower:
        return True
    
    # 6. 剪贴板截图（clipboard-*）或本地clipboard-images目录的图片
    if 'clipboard' in url_lower:
        return True
    
    # 7. 包含日期时间戳格式的图片（如 2026-06-16T10-05）
    if re.search(r'\d{4}-\d{2}-\d{2}T\d{2}-\d{2}', url, re.IGNORECASE):
        return True
    
    return False

# 已知公司/品牌名列表（用于从标题中精确提取新闻主体）
KNOWN_COMPANIES = [
    # 锂电池产业链
    '宁德时代', '比亚迪', '亿纬锂能', '国轩高科', '中创新航',
    '欣旺达', '蜂巢能源', '瑞浦兰钧', '远景动力', 'LG新能源',
    '松下电池', '三星SDI', 'SK on', '特斯拉', '蔚来', '小鹏', '理想',
    '吉利', '长城汽车', '长安汽车', '广汽埃安', '赛力斯', '零跑',
    # 上游资源
    '天齐锂业', '赣锋锂业', '盛新锂能', '雅化集团', '融捷股份',
    '藏格矿业', '盐湖股份', '西藏矿业', '西藏城投', '中矿资源',
    '格林美', '华友钴业', '寒锐钴业', '洛阳钼业',
    # 正极材料
    '德方纳米', '湖南裕能', '万润新能', '龙蟠科技', '常州锂源', '长远锂科',
    '容百科技', '当升科技', '杉杉股份', '厦钨新能', '振华新材',
    # 电解液
    '天赐材料', '新宙邦', '多氟多', '石大胜华', '法恩莱特',
    # 隔膜/铜箔
    '恩捷股份', '星源材质', '诺德股份', '嘉元科技',
    # 其他化工
    '蓝黛科技', '阳光氢能', '华电', '国家发改委', '发改委',
    '工信部', '中煤', '山东黄金', '紫金矿业',
]

# 产品/场景关键词（用于补充搜索词）
PRODUCT_KEYWORDS = {
    '锂电池': ['lithium battery', 'battery factory'],
    '磷酸铁锂': ['LFP battery', 'lithium iron phosphate'],
    '碳酸锂': ['lithium carbonate', 'lithium mining'],
    '电解液': ['electrolyte', 'chemical plant'],
    '氢能': ['hydrogen energy', 'green hydrogen'],
    '尿素': ['urea fertilizer', 'agriculture'],
    '润滑油': ['lubricant oil', 'industrial oil'],
    '回收': ['battery recycling', 'EV recycling'],
    '新能源汽车': ['electric vehicle', 'EV car'],
    '储能': ['energy storage', 'battery storage'],
    '光伏': ['solar panel', 'solar energy'],
    '风电': ['wind turbine', 'wind power'],
}


def extract_image_keywords(title, bu_name):
    """
    从新闻标题中提取用于图片搜索的核心关键词

    策略（2026-06-18 优化）：
    1. 优先匹配已知公司/品牌名（最精准）
    2. 提取产品/行业关键词
    3. 去掉行情修饰词、数字、百分比
    4. 如果提取到公司名 + 产品，组合为 "公司 产品" 英文搜索词
    5. 回退到 BU 行业关键词

    返回：Unsplash 可用的英文搜索关键词
    """
    # 步骤1：检查是否包含已知公司名（最高优先级）
    found_company = None
    for company in KNOWN_COMPANIES:
        if company in title:
            found_company = company
            break

    # 步骤2：检查是否包含已知产品/场景关键词
    found_product = None
    for product, eng_terms in PRODUCT_KEYWORDS.items():
        if product in title:
            found_product = eng_terms[0]  # 取英文术语作为搜索词
            break

    # 步骤3：如果有公司名，优先用公司名搜索
    if found_company:
        # 公司名 + 产品（如果有的话）
        if found_product:
            return f"{found_company} {found_product}"
        # 纯公司名 → 用公司名本身（Unsplash 支持中文搜索）
        return found_company

    # 步骤4：没有公司名，尝试从标题提取通用关键词
    # 行情修饰词（需要移除）
    market_words = [
        r'\d+[\.\d]*%', r'涨\d+', r'跌\d+', r'重挫\d+', r'暴跌\d+', r'飙升\d+',
        r'上涨\d+', r'下跌\d+', r'涨停', r'跌停', r'首板', r'腰斩',
        r'\d+元/吨', r'\d+美元', r'\d+万元', r'\d+亿吨',
        r'周涨', r'周跌', r'日涨', r'日跌', r'同比', r'环比',
        r'创.*新高', r'创.*新低', r'突破', r'回落', r'反弹',
        r'第\d+个', r'TOP\d+', r'前\d+', r'\d+强',
        r'年内', r'季度', r'月份', r'年度',
    ]

    keywords = title
    for pattern in market_words:
        keywords = re.sub(pattern, '', keywords)

    # 只保留中英文和空格
    keywords = re.sub(r'[^\u4e00-\u9fa5a-zA-Z\s]', ' ', keywords)
    keywords = re.sub(r'\s+', ' ', keywords).strip()

    # 如果提取的关键词太短或太长，回退到BU关键词
    if len(keywords) < 3 or len(keywords) > 50:
        return BU_KEYWORDS.get(bu_name, "industry")

    # 取前两个有意义的词
    parts = keywords.split()
    if len(parts) >= 2:
        return ' '.join(parts[:2])
    elif len(parts) == 1:
        bu_kw = BU_KEYWORDS.get(bu_name, "industry")
        return f"{parts[0]} {bu_kw}"
    else:
        return BU_KEYWORDS.get(bu_name, "industry")


def fetch_unsplash_image(title, bu_name=""):
    """
    使用Unsplash API搜索与标题相关的图片
    返回图片URL，如���失败返回None
    
    优化策略：
    1. 从标题提取核心关键词（去掉行情词）
    2. 如果提取失败，回退到BU行业关键词
    3. 用更精准的关键词搜索图片
    """
    if not UNSPLASH_ACCESS_KEY:
        return None
    
    try:
        # 提取关键词（使用优化后的函数）
        keywords = extract_image_keywords(title, bu_name)
        
        # 调用Unsplash API
        query = urllib.parse.quote_plus(keywords)
        api_url = f"{UNSPLASH_API_URL}?query={query}&per_page=5&client_id={UNSPLASH_ACCESS_KEY}"
        
        req = urllib.request.Request(
            api_url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        )
        
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        
        results = data.get('results', [])
        if results:
            # 返回第一张图片的regular尺寸URL
            image_url = results[0].get('urls', {}).get('regular', '')
            if image_url:
                print(f"    [Unsplash] 找到图片: {image_url[:60]}...")
                return image_url
        
        # 如果第一轮没找到，尝试用BU关键词（兜底）
        if bu_name and keywords != BU_KEYWORDS.get(bu_name, ""):
            bu_kw = BU_KEYWORDS.get(bu_name, "industry")
            query = urllib.parse.quote_plus(bu_kw)
            api_url = f"{UNSPLASH_API_URL}?query={query}&per_page=5&client_id={UNSPLASH_ACCESS_KEY}"
            
            req = urllib.request.Request(
                api_url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            )
            
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
            
            results = data.get('results', [])
            if results:
                image_url = results[0].get('urls', {}).get('regular', '')
                if image_url:
                    print(f"    [Unsplash] 回退BU关键词找到图片: {image_url[:60]}...")
                    return image_url
        
        print(f"    [Unsplash] 未找到图片: {title[:30]}...")
        return None
        
    except Exception as e:
        print(f"    [Unsplash] API调用失败: {e}")
        return None

def enrich_news_with_images(selected_items):
    """
    为每条新闻绑定image_url（高质量配图）

    ⚠️ 图片策略（2026-06-18 更新）：
    - 完全禁用 Tavily 返回的新闻嵌入图片（截图/图表/活动现场照）
    - 全部使用 Unsplash 高质量图库图片
    - 关键词从新闻标题中提取核心实体（公司名、产品名、行业场景）
    - 如果 Unsplash 也失败，设置为 None（前端会 fallback 到默认图）

    🔒 保护逻辑（2026-06-22 修复）：
    - 如果 item 已有有效 image_url（来自 inheritance_map 或上次运行），
      直接保留，绝不覆盖为 None
    - 只有 image_url 为 null/空 的新闻才尝试获取新图片
    - 获取失败时也保留原 image_url（不强制设为 None）
    """
    enriched = []
    for item in selected_items:
        new_item = dict(item)
        existing_image = new_item.get('image_url')

        # 🔒 保护：已有有效配图，直接保留
        if existing_image and str(existing_image).strip():
            print(f"    [图片] 保留已有配图: [{new_item.get('bu','')}] {new_item['title'][:30]}...")
            enriched.append(new_item)
            continue

        # 无配图，尝试获取
        unsplash_url = fetch_unsplash_image(new_item['title'], new_item.get('bu', ''))
        if unsplash_url:
            new_item['image_url'] = unsplash_url
            print(f"    [图片] Unsplash高质量: {unsplash_url[:60]}...")
        # 🔒 获取失败时保留原 image_url（已是 None，不用再设）
        enriched.append(new_item)
    return enriched

def main():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] 开始生成热点新闻数据...")
    
    # 【关键】立即保存旧数据的URL映射（防止后续被覆盖）
    # 必须在脚本刚开始运行时就保存，不能等到enrich_news_with_urls内部再读文件
    inheritance_map = load_existing_news_for_url_inheritance()
    print(f"[信息] 已保存旧数据URL映射（{len(inheritance_map)}条），防止后续被覆盖")
    
    # 动态获取所有事业部列表
    bu_list = list(BU_PREFIX_MAP.keys())
    
    # 检查事业部数据是否已更新
    all_updated = True
    updated_count = 0
    found_count = 0
    
    for bu_name in bu_list:
        file_path = find_bu_file(bu_name)
        if file_path:
            found_count += 1
            bu_data = load_bu_data(file_path)
            if bu_data:
                is_updated, report_time = check_bu_updated(bu_data)
                if is_updated:
                    updated_count += 1
                    print(f"  [{bu_name}] 已更新 (报告时间: {report_time})")
                else:
                    all_updated = False
                    print(f"  [{bu_name}] 未更新 (报告时间: {report_time})")
            else:
                all_updated = False
                print(f"  [{bu_name}] 无法加载")
        else:
            all_updated = False
            print(f"  [{bu_name}] 文件不存在")
    
    print(f"[信息] 找到 {found_count}/{len(bu_list)} 个事业部文件")
    
    # 容错逻辑：如果更新的事业部少于7个，沿用昨天的数据
    # 注意：三金锂电、铂源催化可能没有数据，所以阈值是7而不是9
    MIN_UPDATED_THRESHOLD = 7
    if updated_count < MIN_UPDATED_THRESHOLD:
        print(f"[信息] 更新的事业部太少（{updated_count}/{MIN_UPDATED_THRESHOLD}），沿用昨天的热点新闻数据")
        existing_data = load_existing_data()
        if existing_data:
            print(f"[信息] 已加载昨天的数据 (生成时间: {existing_data.get('generated_at', '未知')})")
            print(f"[信息] 不会覆盖 hot_news_data.json")
            return True  # 成功（但不生成新数据）
        else:
            print(f"[警告] 找不到昨天的数据，将继续尝试生成新数据")
    
    # 读取所有事业部数据
    all_items = []
    for bu_name in bu_list:
        file_path = find_bu_file(bu_name)
        if file_path:
            bu_data = load_bu_data(file_path)
            if bu_data:
                items = extract_news_items(bu_data)
                print(f"  [{bu_name}] 提取到 {len(items)} 条今日关注新闻")
                all_items.extend(items)
    
    print(f"总计提取到 {len(all_items)} 条今日关注新闻")
    
    # 过滤掉T-3以外的旧闻（报告日期早于T-3的不要）
    today = date.today()
    t_minus_3 = today - timedelta(days=3)
    
    filtered_items = []
    old_count = 0
    for item in all_items:
        item_date_str = item.get("date", "")
        try:
            item_date = datetime.strptime(item_date_str, "%Y-%m-%d").date()
            if item_date >= t_minus_3:
                filtered_items.append(item)
            else:
                old_count += 1
                print(f"  [过滤] 旧闻(T-3以外): [{item['date']}] {item['title'][:40]}...")
        except Exception as e:
            # 如果日期解析失败，保留该条目
            filtered_items.append(item)
    
    if filtered_items:
        all_items = filtered_items
        print(f"过滤后剩余 {len(all_items)} 条（过滤掉 {old_count} 条T-3以外的旧闻）")
    else:
        print(f"[警告] 过滤后没有剩余新闻（过滤掉 {old_count} 条），将使用未过滤数据")
    
    # 均匀抽取5条（重试机制：优先选能继承URL的新闻）
    selected_items = []
    max_retries = 3
    for attempt in range(max_retries):
        selected_items = select_news_evenly(all_items, target_count=5)
        
        # 检查选中的新闻是否能继承URL（模糊匹配）
        import re
        inherit_count = 0
        for item in selected_items:
            title = item['title']
            can_inherit = False
            for old_title in inheritance_map:
                # 前缀匹配
                if title.startswith(old_title[:15]) or old_title.startswith(title[:15]):
                    can_inherit = True
                    break
                # 关键词匹配
                new_kw = set(re.findall(r'[\w\u4e00-\u9fff]{3,}', title))
                old_kw = set(re.findall(r'[\w\u4e00-\u9fff]{3,}', old_title))
                if len(new_kw & old_kw) >= 2:
                    can_inherit = True
                    break
            if can_inherit:
                inherit_count += 1
        
        if inherit_count > 0 or attempt == max_retries - 1:
            # 能继承URL，或已达到最大重试次数
            break
        print(f"  [重试] 第{attempt+1}次选择，{inherit_count}条能继承URL，重新选择...")
    
    if not selected_items:
        print("[错误] 没有找到任何今日关注新闻，使用默认数据")
        selected_items = [{
            "bu": "系统",
            "title": "暂无今日关注数据，请先生成早报"
        }]
    
    print(f"随机抽取到 {len(selected_items)} 条新闻（{inherit_count}条能继承URL）：")
    for i, item in enumerate(selected_items, 1):
        print(f"  {i}. [{item['bu']}] {item['title']}")

    # 为每条新闻搜索URL
    print(f"\n开始为新闻搜索URL...")
    enriched_items = enrich_news_with_urls(selected_items, inheritance_map)

    # 为每条新闻绑定image_url（预绑定图片，避免前端每次加载都调用API）
    print(f"\n开始为新闻绑定图片URL...")
    enriched_items = enrich_news_with_images(enriched_items)

    # 生成输出数据
    output_data = {
        "generated_at": datetime.now().isoformat(),
        "news": enriched_items
    }

    # 🔒 最终合并保护（2026-06-22 新增）
    # 将现有 JSON 中的 image_url 按标题回填到新数据中，
    # 防止因随机抽签变化导致已有配图丢失。
    try:
        if os.path.exists(OUTPUT_FILE):
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                old_data = json.load(f)
            old_image_map = {}
            for old_item in old_data.get('news', []):
                title = old_item.get('title', '')
                image_url = old_item.get('image_url')
                if title and image_url:
                    old_image_map[title] = image_url

            merged_count = 0
            for item in output_data['news']:
                title = item.get('title', '')
                if not item.get('image_url') and title in old_image_map:
                    item['image_url'] = old_image_map[title]
                    merged_count += 1
                    print(f"    [合并] 保留已有配图: [{item.get('bu','')}] {title[:30]}...")

            if merged_count > 0:
                print(f"[信息] 最终合并保护：为 {merged_count} 条新闻保留了已有配图")
    except Exception as e:
        print(f"[警告] 最终合并保护失败（不影响主流程）: {e}")

    # 写入文件
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"数据已写入: {OUTPUT_FILE}")
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
