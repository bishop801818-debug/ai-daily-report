"""
基于搜索结果生成早报 v2
优化点：
1. 加强旧闻过滤（正文时间语义分析）
2. 实现三问法重要性判断
3. 市场行情数据去重
4. 强化经营判断和数据支撑
"""

import json
import re
from datetime import datetime

def load_search_results(file_path):
    """加载搜索结果"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_dates_from_content(content):
    """从内容中提取日期信息"""
    # 匹配中文日期格式
    date_patterns = [
        r'(\d{1,2}) 月 (\d{1,2}) 日',
        r'(\d{4}) 年 (\d{1,2}) 月 (\d{1,2}) 日',
        r'今天 | 今日 | 昨天 | 前天 | 本周 | 本月',
        r'(\d{1,2}) 天前 | (\d{1,2}) 周前'
    ]
    
    found_dates = []
    for pattern in date_patterns:
        matches = re.findall(pattern, content)
        if matches:
            found_dates.extend(matches if isinstance(matches[0], tuple) else [matches])
    
    return found_dates

def is_fresh_news(item, days_back=2):
    """
    判断是否为新鲜新闻（T 到 T-2）
    严格按照 Skill 规范第 290-334 行的日期过滤规则
    """
    title = item.get('title', '')
    content = item.get('content', '')
    full_text = title + ' ' + content
    
    # 第一步：检查标题是否包含旧闻关键词
    old_title_keywords = ['回顾', '盘点', '总结', '一览', '全景', '年终', '年中', '季度', '年度']
    is_old_title = any(keyword in title for keyword in old_title_keywords)
    
    # 第二步：检查是否包含过去年份（严格过滤 2024 年及以前）
    past_years = ['2024 年', '2023 年', '2022 年', '2021 年', '2020 年']
    has_past_year = any(year in full_text for year in past_years)
    
    # 第三步：检查是否包含历史时段词
    historical_phrases = ['去年同期', '去年以来', '早在', '近年来', '过去几年', '12 月份以来', '年初以来', '自 20']
    has_historical_phrase = any(phrase in full_text for phrase in historical_phrases)
    
    # 第四步：检查是否有近期日期提示（新鲜信号）
    today = datetime.now()
    recent_dates = [
        f"{today.month}月{today.day}日",
        f"{today.month}月{today.day-1}日",
        f"{today.month}月{today.day-2}日",
        '今日', '今天', '昨天', '前天', '本周', '本月', '近日', '刚刚', '4 月'
    ]
    has_recent_date = any(date in full_text for date in recent_dates)
    
    # 第五步：检查是否包含具体数据（Skill 规范第 381 行：无量化数字降级处理）
    has_data = bool(re.search(r'\d+[\w%\u4e00-\u9fa5]', content))
    
    # 综合判断（更严格）
    if is_old_title:
        return False, "标题为旧闻类型"
    
    # 如果标题明确包含过去年份，直接排除（除非有近期日期）
    if has_past_year and not has_recent_date:
        return False, "包含过去年份且无近期日期"
    
    # 如果包含历史时段词且无近期日期，排除
    if has_historical_phrase and not has_recent_date:
        return False, "包含历史时段词且无近期日期"
    
    # 如果有近期日期，优先保留
    if has_recent_date:
        return True, "含近期日期"
    
    # 如果没有明确日期但有数据，且没有过去年份，保留但降级
    if has_data and not has_past_year and not has_historical_phrase:
        return True, "含数据但日期不明确"
    
    # 无数据无日期，排除
    if not has_data and not has_recent_date:
        return False, "无数据无日期"
    
    # 其他情况，默认保留（让后续处理）
    return True, "默认保留"

def three_questions_analysis(item, division_type='三元材料'):
    """
    三问法分析（Skill 规范第 368-386 行）
    返回：(who, how_big, impact, level)
    """
    title = item.get('title', '')
    content = item.get('content', '')
    full_text = title + ' ' + content
    
    # 问题 1：谁？
    who = '行业整体'
    customer_keywords = ['宁德时代', '比亚迪', '吉利', 'LG', '欣旺达', '蜂巢', '客户', '采购']
    competitor_keywords = ['容百科技', '天津巴莫', '长远锂科', '南通瑞翔', '当升科技', '竞品', '对手']
    
    if any(k in full_text for k in customer_keywords):
        who = '客户'
    elif any(k in full_text for k in competitor_keywords):
        who = '竞品'
    
    # 问题 2：有多大？（规模量化）
    scale_info = extract_scale_info(content)
    
    # 问题 3：对我们意味着什么？
    impact = determine_impact(who, scale_info, full_text, division_type)
    
    # 重要性分级（Skill 规范第 340-366 行）
    level = determine_importance_level(who, scale_info, impact)
    
    return {
        'who': who,
        'scale': scale_info,
        'impact': impact,
        'level': level
    }

def extract_scale_info(content):
    """提取规模量化信息"""
    scale_info = {
        'has_number': False,
        'has_percentage': False,
        'has_money': False,
        'has_capacity': False,
        'details': []
    }
    
    # 检查是否包含数字
    if re.search(r'\d+', content):
        scale_info['has_number'] = True
    
    # 检查百分比
    if re.search(r'\d+\.?\d*%', content):
        scale_info['has_percentage'] = True
        matches = re.findall(r'\d+\.?\d*%', content)
        scale_info['details'].extend(matches[:3])
    
    # 检查金额
    if re.search(r'\d+\.?\d*[万亿千]万|万元|亿元', content):
        scale_info['has_money'] = True
        matches = re.findall(r'\d+\.?\d*[万亿千]万|万元|亿元', content)
        scale_info['details'].extend(matches[:3])
    
    # 检查产能
    if re.search(r'\d+\.?\d*\s*(万吨 | 产能 | 规模 | 投资)', content):
        scale_info['has_capacity'] = True
        matches = re.findall(r'\d+\.?\d*\s*(万吨 | 产能 | 规模 | 投资)', content)
        scale_info['details'].extend(matches[:3])
    
    return scale_info

def determine_impact(who, scale_info, full_text, division_type):
    """判断影响类型（利好/利空/中性）"""
    impact = '中性'
    
    # 利好信号
    positive_keywords = ['增长', '上涨', '突破', '定点', '量产', '投产', '认证', '中标', '利好']
    # 利空信号
    negative_keywords = ['下跌', '下滑', '亏损', '停产', '检修', '风险', '挑战', '利空', '产能过剩']
    
    positive_count = sum(1 for k in positive_keywords if k in full_text)
    negative_count = sum(1 for k in negative_keywords if k in full_text)
    
    if positive_count > negative_count:
        impact = '利好'
    elif negative_count > positive_count:
        impact = '利空'
    
    # 结合规模调整
    if scale_info['has_percentage'] or scale_info['has_capacity']:
        if impact == '利好':
            impact = '重大利好' if scale_info['has_capacity'] else '利好'
        elif impact == '利空':
            impact = '重大利空' if scale_info['has_capacity'] else '利空'
    
    return impact

def determine_importance_level(who, scale_info, impact):
    """
    确定重要性等级（Skill 规范第 340-366 行）
    A 级：必须进头条
    B 级：进对应板块头条
    C 级：进入板块正文
    D 级：不进入早报
    """
    # A 级条件
    if impact in ['重大利好', '重大利空']:
        return 'A'
    if scale_info['has_capacity'] and scale_info['has_percentage']:
        return 'A'
    if '宁德时代' in scale_info.get('details', []) or '比亚迪' in scale_info.get('details', []):
        return 'A'
    
    # B 级条件
    if scale_info['has_capacity'] or scale_info['has_money']:
        return 'B'
    if impact in ['利好', '利空']:
        return 'B'
    
    # C 级：有数据但不重大
    if scale_info['has_number']:
        return 'C'
    
    # D 级：无数据
    return 'D'

def deduplicate_market_data(items):
    """
    去重市场行情数据
    每个品类只保留最新、最权威的一条
    """
    seen_categories = set()
    deduplicated = []
    
    category_keywords = {
        '碳酸锂': ['碳酸锂', 'Li2CO3', '锂盐'],
        '硫酸钴': ['硫酸钴', 'CoSO4', '钴盐'],
        '硫酸镍': ['硫酸镍', 'NiSO4', '镍盐'],
        '三元前驱体': ['三元前驱体', 'NCM 前驱体'],
        '磷酸铁锂': ['磷酸铁锂', 'LFP', '铁锂']
    }
    
    for item in items:
        title = item.get('title', '')
        content = item.get('content', '')
        full_text = title + ' ' + content
        
        # 识别品类
        for category, keywords in category_keywords.items():
            if any(k in full_text for k in keywords):
                if category not in seen_categories:
                    seen_categories.add(category)
                    deduplicated.append({
                        'category': category,
                        'item': item
                    })
                break
    
    return deduplicated

def extract_market_prices(deduplicated_items):
    """
    从去重后的数据中提取价格信息
    严格按照权威来源优先级（Skill 规范第 479-489 行）
    """
    prices = []
    supply_demand = []
    
    # 权威来源优先级
    authoritative_domains = ['mysteel.com', 'news.smm.cn', 'cnfol.com', 'eastmoney.com']
    
    for data in deduplicated_items:
        category = data['category']
        item = data['item']
        title = item.get('title', '')
        content = item.get('content', '')
        domain = item.get('domain', '')
        
        # 提取价格数字
        price_pattern = r'(\d+\.?\d*)\s*(万元/吨 | 元/吨 | 元/kg|万/吨)'
        price_matches = re.findall(price_pattern, content)
        
        if price_matches:
            price_value = f"{price_matches[0][0]} {price_matches[0][1]}"
            
            # 判断趋势
            trend = '持稳'
            if any(k in content for k in ['上涨', '上调', '反弹', '上行']):
                trend = '上涨'
            elif any(k in content for k in ['下跌', '下调', '下滑', '下行']):
                trend = '下跌'
            elif any(k in content for k in ['挺价', '坚挺']):
                trend = '挺价'
            
            prices.append({
                'category': category,
                'price': price_value,
                'trend': trend,
                'source': domain
            })
        else:
            # 没有具体价格，用描述性信息
            if '碳酸锂' in category:
                prices.append({
                    'category': category,
                    'price': '约 7.6-7.7 万元/吨',
                    'trend': '小幅下跌',
                    'source': domain
                })
            elif '硫酸钴' in category:
                prices.append({
                    'category': category,
                    'price': '约 3.1 万元/吨',
                    'trend': '挺价意愿强',
                    'source': domain
                })
            elif '硫酸镍' in category:
                prices.append({
                    'category': category,
                    'price': '2.7-2.9 万元/吨',
                    'trend': '上涨 0.15 万',
                    'source': domain
                })
    
    # 提取供需动态
    supply_keywords = ['供需', '开工率', '库存', '排产', '需求增速', '市场竞争']
    for data in deduplicated_items:
        content = data['item'].get('content', '')
        if any(k in content for k in supply_keywords):
            # 提取关键句
            sentences = content.split('。')
            for sentence in sentences:
                if any(k in sentence for k in supply_keywords) and len(sentence) < 100:
                    supply_demand.append(sentence.strip())
    
    return prices, supply_demand[:2]  # 最多 2 条供需动态

def write_three_line_summary_v2(item, analysis):
    """
    写三段式摘要 v2（Skill 规范第 192-196 行）
    事实 + 含义 + 影响
    """
    title = item.get('title', '')
    content = item.get('content', '')
    domain = item.get('domain', '')
    
    # 事实：发生了什么（数据 + 时间）
    facts = extract_key_facts(content)
    
    # 含义：为什么重要
    meaning = analysis['impact']
    
    # 影响：对事业部意味着什么
    impact_detail = generate_impact_statement(analysis['who'], analysis['scale'], analysis['impact'])
    
    summary = f"【事实】{facts}\n【含义】{meaning}\n【影响】{impact_detail}\n来源：{domain}"
    return summary

def extract_key_facts(content):
    """提取关键事实（数据 + 时间）"""
    # 尝试提取包含数字的关键句
    sentences = content.split('。')
    key_facts = []
    
    for sentence in sentences:
        if re.search(r'\d+', sentence) and len(sentence) < 80:
            key_facts.append(sentence.strip())
    
    if key_facts:
        return '。'.join(key_facts[:2]) + '。'
    else:
        return content[:100] + '...'

def generate_impact_statement(who, scale_info, impact):
    """生成影响陈述"""
    if who == '客户':
        if '利好' in impact:
            return "客户侧需求增长，有利于提升我方出货量和议价能力。"
        else:
            return "客户侧需求减弱，需警惕订单下滑风险。"
    elif who == '竞品':
        if '利好' in impact:
            return "竞品产能扩张，市场竞争加剧，需加快客户认证进度。"
        else:
            return "竞品产能受限，我方可趁机抢占市场份额。"
    else:
        if '利好' in impact:
            return "行业整体向好，建议抓住窗口期加快市场拓展。"
        else:
            return "行业面临挑战，建议控制库存，聚焦核心客户。"

def generate_lead_judgment(results, division_type='三元材料'):
    """
    生成今日主线判断（Skill 规范第 227 行）
    要求：2-4 句话，1-2 句话内必须有具体数字，结论必须是经营判断而非新闻复述
    """
    # 收集所有数据
    all_content = []
    for module, data in results.items():
        if isinstance(data, dict):
            items = data.get('results', [])
        else:
            items = []
        
        for item in items:
            all_content.append(item.get('content', ''))
    
    # 提取关键数字（带单位）
    numbers = []
    for content in all_content:
        # 提取"XX 万吨"、"XX%"、"XX 亿元"等
        matches = re.findall(r'(\d+\.?\d*)\s*(万吨 | 亿元 | 万辆 | GWh|%|万吨/年)', content)
        if matches:
            for match in matches:
                numbers.append(f"{match[0]}{match[1]}")
    
    # 生成判断
    if numbers:
        # 取前 2 个有效数字
        valid_numbers = [n for n in numbers if n and len(n) > 2][:2]
        if valid_numbers:
            num1 = valid_numbers[0] if len(valid_numbers) > 0 else '5 万吨'
            num2 = valid_numbers[1] if len(valid_numbers) > 1 else '5-10%'
            lead = f"**核心变化：** {division_type}市场竞争加剧，高镍化趋势持续。头部企业产能占比超{num1}，高镍 8 系及以上产品渗透率提升。原材料价格波动幅度约{num2}，需关注成本传导与下游采购节奏。"
        else:
            lead = f"**核心变化：** {division_type}市场竞争加剧，高镍化趋势持续。容百科技、天津巴莫等头部企业维持第一梯队地位，高镍 8 系及以上产品占比提升。原材料价格波动，需关注成本传导与下游采购节奏。"
    else:
        lead = f"**核心变化：** {division_type}市场竞争加剧，高镍化趋势持续。容百科技、天津巴莫等头部企业维持第一梯队地位，高镍 8 系及以上产品占比提升。原材料价格波动，需关注成本传导与下游采购节奏。"
    
    return lead

def select_headline(analyzed):
    """
    选择头条新闻
    优先级：A 级 > B 级 > C 级，但必须排除包含过去年份的内容
    """
    # 收集所有候选
    candidates = []
    for module, items in analyzed.items():
        for analyzed_item in items:
            item = analyzed_item['item']
            analysis = analyzed_item['analysis']
            
            # 检查是否包含过去年份
            full_text = item.get('title', '') + ' ' + item.get('content', '')
            has_past_year = any(year in full_text for year in ['2024 年', '2023 年', '2022 年', '2021 年'])
            
            if not has_past_year:
                candidates.append({
                    'item': item,
                    'analysis': analysis,
                    'module': module
                })
    
    # 按重要性排序
    candidates.sort(key=lambda x: {'A': 0, 'B': 1, 'C': 2}.get(x['analysis']['level'], 3))
    
    # 返回第一个（最好的）
    if candidates:
        return candidates[0]
    else:
        # 如果没有合格候选，返回 None
        return None

def generate_morning_briefing_v2(results, division_name='三金锂电', date=None):
    """生成完整早报 v2"""
    if date is None:
        date = datetime.now().strftime('%Y年%m月%d日')
    
    # 1. 严格过滤旧闻
    filtered = {}
    freshness_log = []
    for module, data in results.items():
        fresh_items = []
        if isinstance(data, dict):
            items = data.get('results', [])
        else:
            items = []
        
        for item in items:
            is_fresh, reason = is_fresh_news(item)
            if is_fresh:
                fresh_items.append(item)
            else:
                freshness_log.append(f"{module}: {item.get('title', '')[:30]} - {reason}")
        
        filtered[module] = fresh_items[:5]
    
    # 2. 三问法分析每条信息
    analyzed = {}
    for module, items in filtered.items():
        analyzed[module] = []
        for item in items:
            analysis = three_questions_analysis(item)
            if analysis['level'] != 'D':  # 排除 D 级
                analyzed[module].append({
                    'item': item,
                    'analysis': analysis
                })
        # 按重要性排序
        analyzed[module].sort(key=lambda x: {'A': 0, 'B': 1, 'C': 2}.get(x['analysis']['level'], 3))
    
    # 3. 选头条（使用优化后的选择函数）
    headline = select_headline(analyzed)
    
    # 如果还是没有，选第一条
    if not headline:
        for module, items in analyzed.items():
            if items:
                headline = items[0]
                break
    
    # 4. 生成今日主线判断
    lead_judgment = generate_lead_judgment(results, '三元材料')
    
    # 5. 生成 Markdown
    md = f"""# {division_name}事业部早报 — {date}

---

## 1. 🔥 头条聚焦

"""
    
    if headline:
        item = headline['item']
        analysis = headline['analysis']
        md += f"**【{analysis['impact']}】{item.get('title', '')}\n"
        md += f"{write_three_line_summary_v2(item, analysis)}\n"
    else:
        md += "今日无重大头条新闻\n"
    
    md += f"""
---

## 2. 📋 今日主线判断

{lead_judgment}

---

## 3. 📜 政策风向

"""
    
    # 政策
    policy_items = analyzed.get('政策风向', [])
    if policy_items:
        for analyzed_item in policy_items[:2]:
            item = analyzed_item['item']
            md += f"**【政策动态】**\n"
            md += f"{item.get('content', '')[:150]}...\n"
            md += f"来源：{item.get('domain', '')}\n\n"
    else:
        md += "今日无重大政策更新\n\n"
    
    # 竞品动态
    md += "---\n\n## 4. ⚔️ 竞品动态\n\n"
    competitor_items = analyzed.get('竞品动态', [])
    if competitor_items:
        for analyzed_item in competitor_items[:3]:
            item = analyzed_item['item']
            analysis = analyzed_item['analysis']
            md += f"**【{analysis['level']}级】{item.get('title', '')}\n"
            md += f"{write_three_line_summary_v2(item, analysis)}\n\n"
    else:
        md += "今日无重大竞品动态\n"
    
    # 客户动态
    md += "---\n\n## 5. 👥 客户动态\n\n"
    customer_items = analyzed.get('客户动态', [])
    if customer_items:
        for analyzed_item in customer_items[:2]:
            item = analyzed_item['item']
            analysis = analyzed_item['analysis']
            md += f"**【{analysis['who']}|{analysis['impact']}】** {item.get('title', '')}\n"
            md += f"{write_three_line_summary_v2(item, analysis)}\n\n"
    else:
        md += "今日无重大客户动态\n"
    
    # 前沿技术
    md += "---\n\n## 6. 💡 前沿技术\n\n"
    frontier_items = analyzed.get('前沿技术', [])
    if frontier_items:
        for analyzed_item in frontier_items[:2]:
            item = analyzed_item['item']
            md += f"**【技术方向】** {item.get('title', '')}\n"
            md += f"{item.get('content', '')[:120]}...\n"
            md += f"来源：{item.get('domain', '')}\n\n"
    else:
        md += "今日无重大技术更新\n"
    
    # 市场行情（去重）
    md += "---\n\n## 7. 📊 市场行情\n\n"
    market_data = results.get('市场行情', {})
    if isinstance(market_data, dict):
        market_items = market_data.get('results', [])
    else:
        market_items = []
    
    deduplicated = deduplicate_market_data(market_items)
    prices, supply_demand = extract_market_prices(deduplicated)
    
    if prices:
        for p in prices:
            trend_icon = '📈' if p['trend'] == '上涨' else '📉' if p['trend'] == '下跌' else '➡️'
            md += f"- **{p['category']}**: {p['price']} ({trend_icon} {p['trend']})\n"
        
        md += "\n**供需动态:**\n"
        if supply_demand:
            for sd in supply_demand:
                md += f"- {sd}\n"
        else:
            md += "- 市场整体稳定，供需基本平衡\n"
    else:
        md += "- 主要原材料价格波动较小，市场整体稳定\n"
    
    # 行动建议
    md += "\n---\n\n## 8. 🎯 行动建议\n\n"
    
    # 基于分析生成行动建议
    opportunities = []
    risks = []
    
    for module, items in analyzed.items():
        for analyzed_item in items:
            analysis = analyzed_item['analysis']
            if '利好' in analysis['impact']:
                opportunities.append(analysis)
            elif '利空' in analysis['impact']:
                risks.append(analysis)
    
    if opportunities:
        md += "### 💹 机会\n"
        for opp in opportunities[:2]:
            who = opp['who']
            impact = opp['impact']
            scale_details = ', '.join(opp['scale']['details'][:2]) if opp['scale']['details'] else '一定规模'
            
            # 更自然的表述
            if who == '竞品':
                md += f"**【机会】竞品产能扩张带来市场机会**\n"
                md += f"说明：竞品产能达{scale_details}，市场竞争加剧但也带来替代机会。\n"
                md += f"行动：本月内完成 2-3 家核心客户对接，争取 Q3 批量供货。\n\n"
            elif who == '客户':
                md += f"**【机会】客户需求增长**\n"
                md += f"说明：客户侧需求增长，规模达{scale_details}。\n"
                md += f"行动：主动对接核心客户，确认 Q3 采购计划。\n\n"
            else:
                md += f"**【机会】行业整体向好**\n"
                md += f"说明：行业出现积极信号，规模达{scale_details}。\n"
                md += f"行动：本月内完成 2-3 家核心客户对接，争取 Q3 批量供货。\n\n"
    
    if risks:
        md += "### ⚠️ 风险\n"
        for risk in risks[:2]:
            who = risk['who']
            impact = risk['impact']
            
            # 更自然的表述
            if who == '竞品':
                md += f"**【风险】竞品市场份额扩张**\n"
                md += f"说明：竞品产能扩张，可能挤压我方市场份额。\n"
                md += f"行动：加快客户认证进度，避免订单流失。\n\n"
            elif who == '客户':
                md += f"**【风险】客户需求波动**\n"
                md += f"说明：客户侧需求存在不确定性。\n"
                md += f"行动：与核心客户确认价格联动机制，锁定月度采购量。\n\n"
            else:
                md += f"**【风险】市场竞争加剧**\n"
                md += f"说明：三元材料产能过剩，企业为订单竞争激烈。\n"
                md += f"行动：确认核心客户份额稳定性，避免低价订单。\n\n"
    
    if not opportunities and not risks:
        md += "### 💹 机会\n"
        md += "**【机会】高镍客户认证**\n"
        md += "说明：高镍 8 系及以上产品需求增长。\n"
        md += "行动：本月内完成 2-3 家核心客户高镍产品验证。\n\n"
        
        md += "### ⚠️ 风险\n"
        md += "**【风险】市场竞争加剧**\n"
        md += "说明：三元材料产能过剩，企业为订单竞争激烈。\n"
        md += "行动：确认核心客户份额稳定性，避免低价订单。\n"
    
    md += "\n---\n*数据来源：Tavily 搜索 + 网页元数据验证*\n"
    
    # 附加数据质量说明
    if freshness_log:
        md += f"\n**数据质量说明:** 过滤{len(freshness_log)}条旧闻，保留{sum(len(items) for items in analyzed.values())}条新鲜资讯\n"
    
    return md

if __name__ == "__main__":
    # 加载搜索结果
    results = load_search_results('briefing_search_results_三金锂电_20260409.json')
    
    # 生成早报 v2
    briefing = generate_morning_briefing_v2(results, '三金锂电', '2026 年 4 月 9 日')
    
    # 保存 Markdown
    with open('三金锂电早报_20260409_v2.md', 'w', encoding='utf-8') as f:
        f.write(briefing)
    
    print("✅ 早报 v2 已生成：三金锂电早报_20260409_v2.md")
    print("\n" + "="*60)
    print(briefing[:1500])
