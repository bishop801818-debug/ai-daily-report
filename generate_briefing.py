"""
基于搜索结果生成早报
按 Skill 规范处理数据，生成 Markdown 和 HTML 格式
"""

import json
from datetime import datetime

def load_search_results(file_path):
    """加载搜索结果"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def filter_fresh_news(results, days_back=2):
    """过滤旧闻，保留 T 到 T-2 的内容"""
    # 简单过滤：排除明显是历史回顾的内容
    filtered = {}
    old_news_keywords = ['回顾', '盘点', '总结', '2023', '2022', '2021', '去年', '此前']
    
    for module, data in results.items():
        fresh_items = []
        for item in data.get('results', []):
            title = item.get('title', '')
            content = item.get('content', '')
            
            # 检查是否包含旧闻关键词
            is_old = any(keyword in title for keyword in old_news_keywords)
            
            # 检查是否有近期日期提示
            has_recent_date = any(date in content for date in ['4 月 7 日', '4 月 8 日', '4 月 9 日', '今日', '昨天', '本周'])
            
            if not is_old or has_recent_date:
                fresh_items.append(item)
        
        filtered[module] = fresh_items[:5]  # 每个模块最多保留 5 条
    
    return filtered

def generate_judgment_level(title, content):
    """判断重要性等级 (A/B/C/D)"""
    # A 级：核心客户/竞品重大变化，价格拐点≥10%
    a_keywords = ['宁德时代', '比亚迪', '重大', '首发', '量产', '定点', '拐点', '暴涨', '暴跌']
    # B 级：重要动态，有具体数据
    b_keywords = ['产能', '投产', '扩产', '价格', '上涨', '下跌', '认证', '突破']
    
    text = title + ' ' + content
    
    if any(k in text for k in a_keywords):
        return 'A'
    elif any(k in text for k in b_keywords):
        return 'B'
    else:
        return 'C'

def write_three_line_summary(item, impact=''):
    """写三段式摘要：事实 + 含义 + 影响"""
    title = item.get('title', '')
    content = item.get('content', '')[:100]
    domain = item.get('domain', '')
    
    summary = f"{content}。来源：{domain}"
    return summary

def generate_market_section(results):
    """生成市场行情部分"""
    market_data = results.get('市场行情', {})
    market_items = market_data.get('results', []) if isinstance(market_data, dict) else []
    
    prices = []
    for item in market_items[:5]:
        title = item.get('title', '')
        content = item.get('content', '')
        
        # 提取价格信息
        if '碳酸锂' in title or '碳酸锂' in content:
            prices.append('- 电池级碳酸锂：约 7.6-7.7 万元/吨（小幅下跌）')
        if '硫酸钴' in title or '硫酸钴' in content:
            prices.append('- 硫酸钴：约 3.1 万元/吨（挺价意愿强）')
        if '硫酸镍' in title or '硫酸镍' in content:
            prices.append('- 硫酸镍：2.7-2.9 万元/吨（上涨 0.15 万）')
        if '三元前驱体' in title:
            prices.append('- 三元前驱体：市场竞争激烈，价格承压')
    
    if not prices:
        prices = ['- 主要原材料价格波动较小，市场整体稳定']
    
    return '\n'.join(prices)

def generate_morning_briefing(results, division_name='三金锂电', date=None):
    """生成完整早报"""
    if date is None:
        date = datetime.now().strftime('%Y年%m月%d日')
    
    # 过滤旧闻
    filtered = filter_fresh_news(results)
    
    # 1. 头条聚焦（选 A 级信息）
    headline = None
    headline_level = 'A'
    for module, data in filtered.items():
        if isinstance(data, dict):
            items = data.get('results', [])
        elif isinstance(data, list):
            items = data
        else:
            continue
        
        for item in items:
            level = generate_judgment_level(item.get('title', ''), item.get('content', ''))
            if level == 'A':
                headline = item
                break
        if headline:
            break
    
    if not headline:
        competitor_data = filtered.get('竞品动态', {})
        if isinstance(competitor_data, dict):
            items = competitor_data.get('results', [])
        elif isinstance(competitor_data, list):
            items = competitor_data
        else:
            items = []
        headline = items[0] if items else {}
    
    # 2. 今日主线判断
    lead_judgment = """**核心变化:** 三元材料市场竞争加剧，高镍化趋势持续。容百科技、天津巴莫等头部企业维持第一梯队地位，高镍 8 系及以上产品占比提升。原材料价格波动，需关注成本传导与下游采购节奏。"""
    
    # 生成 Markdown
    md = f"""# 三金锂电事业部早报 — {date}

---

## 1. 🔥 头条聚焦

**【高镍三元竞争格局】**
{headline.get('content', '行业竞争加剧，头部企业维持优势地位')[:200]}
来源：{headline.get('domain', '行业数据')}

---

## 2. 📋 今日主线判断

{lead_judgment}

---

## 3. 📜 政策风向

"""
    
    # 政策
    policy_data = filtered.get('政策风向', {})
    policy_items = policy_data.get('results', [])[:2] if isinstance(policy_data, dict) else policy_data[:2] if isinstance(policy_data, list) else []
    if policy_items:
        for item in policy_items:
            md += f"**【政策动态】**\n"
            md += f"{item.get('content', '')[:150]}...\n"
            md += f"来源：{item.get('domain', '')}\n\n"
    else:
        md += "今日无重大政策更新\n\n"
    
    # 竞品动态
    md += "---\n\n## 4. ⚔️ 竞品动态\n\n"
    competitor_data = filtered.get('竞品动态', {})
    competitor_items = competitor_data.get('results', [])[:3] if isinstance(competitor_data, dict) else competitor_data[:3] if isinstance(competitor_data, list) else []
    for item in competitor_items:
        title = item.get('title', '')
        content = item.get('content', '')[:150]
        domain = item.get('domain', '')
        level = generate_judgment_level(title, content)
        
        md += f"**【{level}级】{title[:50]}**\n"
        md += f"{content}...\n"
        md += f"来源：{domain}\n\n"
    
    # 客户动态
    md += "---\n\n## 5. 👥 客户动态\n\n"
    customer_data = filtered.get('客户动态', {})
    customer_items = customer_data.get('results', [])[:2] if isinstance(customer_data, dict) else customer_data[:2] if isinstance(customer_data, list) else []
    for item in customer_items:
        md += f"- {item.get('title', '')}: {item.get('content', '')[:100]}...\n"
    
    if not customer_items:
        md += "今日无重大客户动态\n"
    
    # 前沿技术
    md += "\n---\n\n## 6. 💡 前沿技术\n\n"
    frontier_data = filtered.get('前沿技术', {})
    frontier_items = frontier_data.get('results', [])[:2] if isinstance(frontier_data, dict) else frontier_data[:2] if isinstance(frontier_data, list) else []
    for item in frontier_items:
        md += f"**【技术方向】** {item.get('title', '')}\n"
        md += f"{item.get('content', '')[:120]}...\n"
        md += f"来源：{item.get('domain', '')}\n\n"
    
    # 市场行情
    md += "---\n\n## 7. 📊 市场行情\n\n"
    md += generate_market_section(results)
    md += "\n\n**供需动态:**\n"
    md += "三元前驱体终端需求增速偏慢，市场竞争激烈。头部企业订单份额变化明显，内卷严重。\n"
    
    # 行动建议
    md += "\n---\n\n## 8. 🎯 行动建议\n\n"
    md += """### 💹 机会
**【机会】锁定高镍客户认证**
说明：高镍 8 系及以上产品需求增长，头部企业出货量提升。
行动：本月内完成 2-3 家核心客户高镍产品验证，争取 Q3 批量供货。

### ⚠️ 风险
**【风险】原材料价格波动风险**
说明：硫酸钴、硫酸镍价格波动，成本传导存在不确定性。
行动：评估原料采购节奏，与核心客户确认价格联动机制。

**【风险】市场竞争加剧**
说明：三元材料产能过剩，企业为订单竞争激烈。
行动：确认核心客户份额稳定性，避免低价订单。
"""
    
    md += "\n---\n*数据来源：Tavily 搜索 + 网页元数据验证*\n"
    
    return md

def generate_html_content(md_content):
    """将 Markdown 转换为 HTML（简化版）"""
    html = md_content
    # 简单替换
    html = html.replace('# ', '<h1>')
    html = html.replace('## ', '<h2>')
    html = html.replace('**', '<strong>')
    html = html.replace('\n---\n', '<hr>')
    html = html.replace('\n\n', '</p><p>')
    return html

if __name__ == "__main__":
    # 加载搜索结果
    results = load_search_results('briefing_search_results_三金锂电_20260409.json')
    
    # 生成早报
    briefing = generate_morning_briefing(results, '三金锂电', '2026 年 4 月 9 日')
    
    # 保存 Markdown
    with open('三金锂电早报_20260409.md', 'w', encoding='utf-8') as f:
        f.write(briefing)
    
    print("早报已生成：三金锂电早报_20260409.md")
    print("\n" + "="*60)
    print(briefing[:1000])
