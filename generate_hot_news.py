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
    返回：(is_updated, report_date_str)
    """
    if not bu_data or not isinstance(bu_data, dict):
        return False, None
    
    report_time = bu_data.get("header", {}).get("报告时间", "")
    if not report_time:
        return False, None
    
    # report_time格式： "2026-05-28"
    try:
        report_date = datetime.strptime(report_time, "%Y-%m-%d").date()
        today = date.today()
        return report_date == today, report_time
    except:
        return False, report_time

def extract_news_items(bu_data):
    """从事业部数据中提取今日关注新闻"""
    if not bu_data or not isinstance(bu_data, dict):
        return []
    
    bu_name = bu_data.get("header", {}).get("事业部", "未知BU")
    report_time = bu_data.get("header", {}).get("报告时间", "")
    today_focus = bu_data.get("sections", {}).get("今日关注", [])
    
    items = []
    for item in today_focus:
        title = item.get("标题", item.get("内容", ""))
        if title:
            items.append({
                "bu": bu_name,
                "title": title,
                "date": report_time   # 添加报告日期字段
            })
    
    return items

def select_news_evenly(all_items, target_count=5):
    """
    均匀抽取新闻，尽量避免从同一事业部抽取多条
    算法：
    1. 按事业部分组
    2. 每个事业部最多选1条（如果可能）
    3. 随机选择事业部，然后从该事业部随机选1条
    4. 如果选不出足够的条数，允许某些事业部选2条
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
    
    selected = []
    used_bu_counts = {}  # 记录每个事业部已选的条数
    
    # 第一轮：每个事业部最多选1条
    available_bus = list(bu_groups.keys())
    random.shuffle(available_bus)
    
    for bu in available_bus:
        if len(selected) >= target_count:
            break
        if bu_groups[bu]:  # 该事业部有新闻
            item = random.choice(bu_groups[bu])
            selected.append(item)
            used_bu_counts[bu] = 1
    
    # 如果还不够，第二轮：允许某些事业部选2条
    if len(selected) < target_count:
        retry_count = 0
        while len(selected) < target_count and retry_count < 100:
            retry_count += 1
            random.shuffle(available_bus)
            for bu in available_bus:
                if len(selected) >= target_count:
                    break
                # 如果该事业部已选1条，且还有剩余新闻，可以选第2条
                if used_bu_counts.get(bu, 0) < 2 and len(bu_groups[bu]) > used_bu_counts.get(bu, 0):
                    # 选一个未选过的
                    selected_titles = [s["title"] for s in selected if s["bu"] == bu]
                    available_items = [i for i in bu_groups[bu] if i["title"] not in selected_titles]
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
    返回：(url, source_name) 或 (None, None)
    """
    # 方法1：尝试Tavily API（如果配置了）
    tavily_key = os.environ.get('TAVILY_API_KEY', '')
    if tavily_key:
        result = search_with_tavily(title, tavily_key)
        if result and result[0]:
            return result

    # 方法2：Bing搜索（备用）
    return search_with_bing(title, max_results)

def search_with_tavily(title, api_key):
    """使用Tavily API搜索"""
    try:
        import urllib.request
        import json

        # Tavily Search API endpoint
        url = "https://api.tavily.com/search"

        # 构建请求数据
        data = {
            "api_key": api_key,
            "query": title,
            "max_results": 5,
            "search_depth": "basic",
            "include_answer": False,
            "include_raw_content": False
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

        # 提取第一个结果的URL
        results = result.get('results', [])
        if results:
            first_result = results[0]
            url = first_result.get('url', '')
            source = first_result.get('source', first_result.get('title', '未知来源'))

            # 检查是否是付费墙
            if is_paywall_url(url):
                print(f"    [Tavily] 跳过付费墙: {url[:60]}...")
                # 尝试第二个结果
                if len(results) > 1:
                    url2 = results[1].get('url', '')
                    source2 = results[1].get('source', results[1].get('title', '未知来源'))
                    if not is_paywall_url(url2):
                        print(f"    [Tavily] 找到链接: {source2} - {url2[:60]}...")
                        return url2, source2
            else:
                print(f"    [Tavily] 找到链接: {source} - {url[:60]}...")
                return url, source

        print(f"    [Tavily] 未找到有效结果: {title[:30]}...")
        return None, None

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
            return None, None

        # 过滤付费墙，取第一个有效链接
        for i, url in enumerate(all_matches[:max_results]):
            if is_paywall_url(url):
                print(f"    [Bing] 跳过付费墙: {url[:60]}...")
                continue
            # 取来源网站名
            try:
                from urllib.parse import urlparse
                domain = urlparse(url).netloc.replace('www.', '')
            except:
                domain = '未知来源'
            print(f"    [Bing] 找到链接: {domain} - {url[:60]}...")
            return url, domain

        print(f"    [Bing] 所有结果均为付费墙，未找到有效链接: {title[:30]}...")
        return None, None

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
                if title and url:  # 只继承有URL的旧数据
                    inheritance_map[title] = {
                        'url': url,
                        'url_source': url_source
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
    为每条新闻搜索URL，返回带url字段的新列表
    如果搜索失败，尝试从继承映射（inheritance_map）中继承相似标题的URL
    inheritance_map: dict, key=旧标题, value={url, url_source}
    """
    
    enriched = []
    for item in selected_items:
        print(f"  [搜索URL] {item['title'][:40]}...")
        url, source = search_news_url(item['title'])
        
        # 如果搜索失败，尝试继承旧URL（模糊匹配）
        if not url:
            title = item.get('title', '')
            matched = fuzzy_match_title(title, inheritance_map)
            if matched:
                url = matched['url']
                source = matched['url_source']
                print(f"    [继承] 模糊匹配，使用旧数据的URL: {source} - {url[:60]}...")
        
        new_item = dict(item)  # 复制原item
        new_item['url'] = url
        new_item['url_source'] = source
        enriched.append(new_item)
    return enriched

def enrich_news_with_images(selected_items):
    """
    为每条新闻绑定image_url（预绑定图片）
    当前实现：设置image_url为null，前端会自动调用Unsplash API
    如果需要预绑定，需要设置UNSPLASH_ACCESS_KEY环境变量并实现API调用
    """
    enriched = []
    for item in selected_items:
        new_item = dict(item)
        # TODO: 如果需要预绑定图片，取消下面的注释并实现Unsplash API调用
        # image_url = fetch_unsplash_image(item['title'])
        # new_item['image_url'] = image_url
        new_item['image_url'] = None  # 暂时设为None，前端会fallback到API
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
    
    # 容错逻辑：如果不是所有事业部都更新了，沿用昨天的数据
    if not all_updated:
        print(f"[信息] 部分事业部未更新（{updated_count}/{len(bu_list)}），沿用昨天的热点新闻数据")
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
    
    # 写入文件
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"数据已写入: {OUTPUT_FILE}")
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
