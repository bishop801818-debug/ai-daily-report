#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
rotate_homepage_charts.py
每3天自动运行：从7个数据库的图表目录中随机选4个，更新首页 index_v3.html 的 DASHBOARDS 数组
同时生成数据洞察文案（含行业消息）
"""

import json
import random
import re
import sys
import os
from datetime import datetime
import hashlib

# ============================================================
# 图表目录 CHART_CATALOG
# 每个条目对应一个可展示在首页的图表
# ============================================================
CHART_CATALOG = [

    # =========== 碳酸锂及原料数据库 (carbonate) ===========
    {
        "id": "carbonate_price",
        "tag": "碳酸锂·现货价格",
        "title": "碳酸锂现货价格走势",
        "link": "carbonate_charts.html",
        "dataFile": "carbonate_all_data.json",
        "tableName": "碳酸锂—价格",
        "valueKey": "均价（万元/吨）",
        "timeKey": "日期",
        "isBar": False,
        "unit": "万元/吨",
        "scale": 1,
        "color": "#1e3c72",
        "insightTemplate": "function(m){var t=m.trend==='up'?'上涨':'下跌';return '碳酸锂现货均价'+m.latest.toFixed(2)+'万元/吨，环比'+t+Math.abs(m.change).toFixed(1)+'%。近3期均价'+(m.trend3==='up'?'回升':'走弱')+'。';}"
    },
    {
        "id": "carbonate_prod",
        "tag": "碳酸锂·行业产量",
        "title": "碳酸锂行业总产量走势",
        "link": "carbonate_charts.html",
        "dataFile": "carbonate_all_data.json",
        "tableName": "碳酸锂-行业总产量",
        "valueKey": "产量（吨）",
        "timeKey": "月份",
        "isBar": True,
        "unit": "吨",
        "scale": 1,
        "color": "#1e3c72",
        "insightTemplate": "function(m){var yoy=m.yoyChange!==null?(m.latest>=m.samePeriodLastYear?'同比增产':'同比减产')+Math.abs(m.yoyChange).toFixed(1)+'%':'暂无同比';return '碳酸锂产量'+(m.latest/10000).toFixed(2)+'万吨，环比'+(m.change>=0?'增长':'下降')+Math.abs(m.change).toFixed(1)+'%。'+yoy+'。';}"
    },
    {
        "id": "lh_price",
        "tag": "氢氧化锂·现货价格",
        "title": "氢氧化锂现货价格走势",
        "link": "carbonate_charts.html",
        "dataFile": "carbonate_all_data.json",
        "tableName": "氢氧化锂-价格",
        "valueKey": "均价（万元/吨）",
        "timeKey": "日期",
        "isBar": False,
        "unit": "万元/吨",
        "scale": 1,
        "color": "#9b59b6",
        "insightTemplate": "function(m){return '氢氧化锂现货均价'+m.latest.toFixed(2)+'万元/吨，环比'+(m.change>=0?'回升':'回落')+Math.abs(m.change).toFixed(1)+'%。近3期均价'+(m.trend3==='up'?'企稳':'承压')+'。';}"
    },
    {
        "id": "lsp_price",
        "tag": "锂辉石·精矿价格",
        "title": "锂辉石精矿价格走势",
        "link": "carbonate_charts.html",
        "dataFile": "carbonate_all_data.json",
        "tableName": "锂辉石精矿-价格",
        "valueKey": "均价（美元/吨）",
        "timeKey": "日期",
        "isBar": False,
        "unit": "美元/吨",
        "scale": 1,
        "color": "#e67e22",
        "insightTemplate": "function(m){return '锂辉石精矿均价'+m.latest.toFixed(0)+'美元/吨，环比'+(m.change>=0?'上涨':'下跌')+Math.abs(m.change).toFixed(0)+'。澳洲SC5.5报价'+(m.trend3==='up'?'偏强':'偏弱')+'。';}"
    },
    {
        "id": "lym_price",
        "tag": "锂云母·价格",
        "title": "锂云母价格走势",
        "link": "carbonate_charts.html",
        "dataFile": "carbonate_all_data.json",
        "tableName": "锂云母—价格",
        "valueKey": "均价（万元/吨）",
        "timeKey": "日期",
        "isBar": False,
        "unit": "万元/吨",
        "scale": 1,
        "color": "#27ae60",
        "insightTemplate": "function(m){return '锂云母均价'+m.latest.toFixed(2)+'万元/吨，环比'+(m.change>=0?'上涨':'下跌')+Math.abs(m.change).toFixed(2)+'%。江西矿区开工率'+(m.trend3==='up'?'回升':'偏低')+'。';}"
    },

    # =========== 电解液数据库 (electrolyte) ===========
    {
        "id": "lipf6_price",
        "tag": "六氟磷酸锂·价格",
        "title": "六氟磷酸锂价格走势",
        "link": "electrolyte_charts.html",
        "dataFile": "electrolyte_all_data.json",
        "tableName": "六氟磷酸锂价格-主流市场",
        "valueKey": "均价",
        "timeKey": "月份",
        "isBar": False,
        "unit": "万元/吨",
        "scale": 1,
        "color": "#c0392b",
        "insightTemplate": "function(m){return '六氟磷酸锂价格'+m.latest.toFixed(2)+'万元/吨，环比'+(m.change>=0?'回升':'回落')+Math.abs(m.change).toFixed(1)+'%。近3期均价'+(m.trend3==='up'?'企稳':'承压')+'。';}"
    },
    {
        "id": "electrolyte_prod",
        "tag": "电解液·行业产量",
        "title": "电解液行业月度产量",
        "link": "electrolyte_charts.html",
        "dataFile": "electrolyte_all_data.json",
        "tableName": "电解液-行业整体产量",
        "valueKey": "产量",
        "timeKey": "月份",
        "isBar": True,
        "unit": "吨",
        "scale": 1,
        "color": "#1e3c72",
        "insightTemplate": "function(m){var yoy=m.yoyChange!==null?(m.latest>=m.samePeriodLastYear?'同比增产':'同比减产')+Math.abs(m.yoyChange).toFixed(1)+'%':'暂无同比';return '电解液产量'+(m.latest/10000).toFixed(2)+'万吨，环比'+(m.change>=0?'增长':'下降')+Math.abs(m.change).toFixed(1)+'%。'+yoy+'。';}"
    },
    {
        "id": "electrolyte_price_lfp",
        "tag": "电解液·LFP动力价格",
        "title": "电解液（LFP动力型）价格走势",
        "link": "electrolyte_charts.html",
        "dataFile": "electrolyte_all_data.json",
        "tableName": "电解液价格-磷酸铁锂动力型",
        "valueKey": "均价",
        "timeKey": "日期",
        "isBar": False,
        "unit": "万元/吨",
        "scale": 1,
        "color": "#2980b9",
        "insightTemplate": "function(m){return 'LFP电解液均价'+m.latest.toFixed(2)+'万元/吨，环比'+(m.change>=0?'上涨':'下跌')+Math.abs(m.change).toFixed(2)+'%。储能需求'+(m.trend3==='up'?'旺盛':'偏弱')+'。';}"
    },
    {
        "id": "lfp_price_ternary",
        "tag": "电解液·三元动力价格",
        "title": "电解液（三元动力型）价格走势",
        "link": "electrolyte_charts.html",
        "dataFile": "electrolyte_all_data.json",
        "tableName": "电解液价格-三元动力型",
        "valueKey": "均价",
        "timeKey": "日期",
        "isBar": False,
        "unit": "万元/吨",
        "scale": 1,
        "color": "#8e44ad",
        "insightTemplate": "function(m){return '三元电解液均价'+m.latest.toFixed(2)+'万元/吨，环比'+(m.change>=0?'上涨':'下跌')+Math.abs(m.change).toFixed(2)+'%。高镍化趋势下需求'+(m.trend3==='up'?'回暖':'承压')+'。';}"
    },

    # =========== 磷酸铁锂数据库 (lfp) ===========
    {
        "id": "lfp_prod",
        "tag": "磷酸铁锂·行业产量",
        "title": "磷酸铁锂行业产量走势",
        "link": "lfp_charts.html",
        "dataFile": "lfp_all_data.json",
        "tableName": "LFP-行业整体产量",
        "valueKey": "产量（吨）",
        "timeKey": "月份",
        "isBar": True,
        "unit": "吨",
        "scale": 1,
        "color": "#27ae60",
        "insightTemplate": "function(m){return 'LFP产量'+(m.latest/10000).toFixed(2)+'万吨，环比'+(m.change>=0?'增长':'下降')+Math.abs(m.change).toFixed(1)+'%。产能利用率'+(m.trend3==='up'?'提升':'承压')+'。';}"
    },
    {
        "id": "lfp_export",
        "tag": "磷酸铁锂·出口量",
        "title": "磷酸铁锂出口量走势",
        "link": "lfp_charts.html",
        "dataFile": "lfp_all_data.json",
        "tableName": "LFP-出口量",
        "valueKey": "出口量（吨）",
        "timeKey": "月份",
        "isBar": True,
        "unit": "吨",
        "scale": 1,
        "color": "#f39c12",
        "insightTemplate": "function(m){return 'LFP出口量'+(m.latest/10000).toFixed(2)+'万吨，环比'+(m.change>=0?'增长':'下降')+Math.abs(m.change).toFixed(1)+'%。海外需求'+(m.trend3==='up'?'旺盛':'偏弱')+'。';}"
    },

    # =========== 三元材料数据库 (ternary) ===========
    {
        "id": "ternary_prod",
        "tag": "三元正极·行业产量",
        "title": "三元正极材料产量走势",
        "link": "ternary_charts.html",
        "dataFile": "ternary_all_data.json",
        "tableName": "三元正极-行业产量规模",
        "valueKey": "产量（吨）",
        "timeKey": "月份",
        "isBar": True,
        "unit": "吨",
        "scale": 1,
        "color": "#8e44ad",
        "insightTemplate": "function(m){return '三元正极产量'+(m.latest/10000).toFixed(2)+'万吨，环比'+(m.change>=0?'增长':'下降')+Math.abs(m.change).toFixed(1)+'%。高镍化趋势'+(m.trend3==='up'?'延续':'放缓')+'。';}"
    },

    # =========== 锂电池回收数据库 (recycling) ===========
    {
        "id": "recycling_blackmass",
        "tag": "回收·黑粉处理量",
        "title": "锂电池黑粉处理量走势",
        "link": "recycling_charts.html",
        "dataFile": "recycling_all_data.json",
        "tableName": "黑粉处理量-总计",
        "valueKey": "处理量（吨）",
        "timeKey": "月份",
        "isBar": True,
        "unit": "吨",
        "scale": 1,
        "color": "#e67e22",
        "insightTemplate": "function(m){return '黑粉处理量'+(m.latest/10000).toFixed(2)+'万吨，环比'+(m.change>=0?'增长':'下降')+Math.abs(m.change).toFixed(1)+'%。回收率'+(m.trend3==='up'?'提升':'偏低')+'。';}"
    },

    # =========== 锂电池行业数据库 (lib_battery) ===========
    {
        "id": "lib_battery_prod",
        "tag": "锂电池·行业产量",
        "title": "锂电池行业产量走势",
        "link": "lib_battery_charts.html",
        "dataFile": "lib_battery_all_data.json",
        "tableName": "行业产量（分规格）",
        "valueKey": "产量（GWh）",
        "timeKey": "月份",
        "isBar": True,
        "unit": "GWh",
        "scale": 1,
        "color": "#2c3e50",
        "insightTemplate": "function(m){return '锂电池产量'+m.latest.toFixed(1)+'GWh，环比'+(m.change>=0?'增长':'下降')+Math.abs(m.change).toFixed(1)+'%。储能装机'+(m.trend3==='up'?'超预期':'符合预期')+'。';}"
    },

    # =========== 汽车行业数据库 (automotive) ===========
    {
        "id": "automotive_ev_sales",
        "tag": "汽车·新能源销量",
        "title": "新能源汽车销量走势",
        "link": "automotive_charts.html",
        "dataFile": "automotive_all_data.json",
        "tableName": "新能源中国整体",
        "valueKey": "销量（万辆）",
        "timeKey": "月份",
        "isBar": True,
        "unit": "万辆",
        "scale": 1,
        "color": "#e74c3c",
        "insightTemplate": "function(m){return '新能源车销量'+m.latest.toFixed(1)+'万辆，环比'+(m.change>=0?'增长':'下降')+Math.abs(m.change).toFixed(1)+'%。渗透率'+(m.trend3==='up'?'提升':'承压')+'。';}"
    },
]

# ============================================================
# 工具函数
# ============================================================

def load_data_file(base_dir, data_file):
    """加载数据文件，返回解析后的数据"""
    path = os.path.join(base_dir, data_file)
    if not os.path.exists(path):
        return None
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"  [错误] 读取数据文件失败 {path}: {e}")
        return None


def get_table_rows(data_json, table_name):
    """从数据JSON中提取指定表名的数据行"""
    tables = data_json.get('tables', [])
    for t in tables:
        if t.get('table_name') == table_name:
            return t.get('data', [])
    return []


def compute_metrics(rows, value_key, time_key):
    """计算图表指标"""
    if not rows or len(rows) < 2:
        return None

    def get_time_val(row):
        t = row.get(time_key)
        if t is None:
            return ''
        return str(t)

    sorted_rows = sorted(rows, key=get_time_val)
    values = []
    for row in sorted_rows:
        v = row.get(value_key)
        t = get_time_val(row)
        if v is not None and v != '':
            try:
                values.append([t, float(v)])
            except:
                pass

    if len(values) < 2:
        return None

    latest = values[-1][1]
    prev = values[-2][1]
    change = ((latest - prev) / prev * 100) if prev != 0 else 0
    trend = 'up' if change >= 0 else 'down'

    recent3 = sum(v[1] for v in values[-3:]) / 3 if len(values) >= 3 else latest
    prev3 = sum(v[1] for v in values[-6:-3]) / 3 if len(values) >= 6 else recent3
    trend3 = 'up' if recent3 >= prev3 else 'down'

    same_period = values[-13][1] if len(values) >= 13 else None
    yoy = ((latest - same_period) / same_period * 100) if same_period and same_period != 0 else None

    return {
        'latest': latest,
        'prev': prev,
        'change': change,
        'trend': trend,
        'absChange': abs(change),
        'trend3': trend3,
        'recent3': recent3,
        'prev3': prev3,
        'samePeriodLastYear': same_period,
        'yoyChange': yoy,
    }


def select_random_charts(catalog, n=4, seed=None):
    """从目录中随机选n个图表"""
    if seed is not None:
        random.seed(seed)
    available = [c for c in catalog if os.path.exists(os.path.join(BASE_DIR, c['dataFile']))]
    if len(available) < n:
        print(f"  [警告] 可用图表不足 {n} 个（仅有 {len(available)} 个），已减少选取数量")
        n = len(available)
    selected = random.sample(available, n)
    if seed is not None:
        random.seed()
    return selected


def build_dashboards_js(selected_charts):
    """根据选中的图表，生成 DASHBOARDS JS 数组字符串"""
    items = []
    for c in selected_charts:
        # insightTemplate 是函数字符串，直接拼入JS
        item = f"""        {{
            id: '{c['id']}',
            tag: '{c['tag']}',
            title: '{c['title']}',
            link: '{c['link']}',
            dataFile: '{c['dataFile']}',
            tableName: '{c['tableName']}',
            unit: '{c['unit']}',
            valueKey: '{c['valueKey']}',
            timeKey: '{c['timeKey']}',
            isBar: {'true' if c['isBar'] else 'false'},
            scale: {c['scale']},
            insightTemplate: {c['insightTemplate']}
        }}"""
        items.append(item)

    js_array = ',\n'.join(items)
    return f"""        var DASHBOARDS = [\n{js_array}\n        ];"""


def update_index_html(html_path, new_dashboards_js):
    """更新 index_v3.html 中的 DASHBOARDS 数组"""
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 找到 DASHBOARDS = [ 到 ]; 的范围
    # 匹配：var DASHBOARDS = [\n 直到 ];\n
    pattern = r'(var DASHBOARDS\s*=\s*\[)(.*?)(\n\s*\]\s*;)'
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        print("[错误] 在 index_v3.html 中找不到 DASHBOARDS 数组")
        return False

    old_full = match.group(0)
    new_full = new_dashboards_js + '\n        '

    new_content = content.replace(old_full, new_full, 1)

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"[成功] 已更新 {html_path} 的 DASHBOARDS 数组")
    return True


# ============================================================
# 主流程
# ============================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def main():
    print("=" * 60)
    print("  首页图表轮换自动化脚本")
    print("  " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("=" * 60)

    # 1. 加载行业消息
    print("\n[1/4] 加载行业消息...")
    industry_news = []
    hot_news_path = os.path.join(BASE_DIR, 'hot_news_data.json')
    if os.path.exists(hot_news_path):
        with open(hot_news_path, 'r', encoding='utf-8') as f:
            hn = json.load(f)
            industry_news = hn.get('news', [])[:5]
            print(f"  已加载 {len(industry_news)} 条行业消息")
    else:
        print("  [警告] hot_news_data.json 不存在")

    # 2. 随机选择4个图表
    print("\n[2/4] 随机选择图表...")
    today = datetime.now().strftime("%Y-%m-%d")
    seed = int(hashlib.md5(today.encode()).hexdigest()[:8], 16)
    selected = select_random_charts(CHART_CATALOG, n=4, seed=seed)
    print(f"  今日 ({today}) 选中图表：")
    for i, c in enumerate(selected):
        print(f"    {i+1}. [{c['id']}] {c['title']}")

    # 3. 为每个选中图表计算指标
    print("\n[3/4] 计算数据指标...")
    for c in selected:
        data_json = load_data_file(BASE_DIR, c['dataFile'])
        if data_json is None:
            print(f"  [{c['id']}] 数据文件不存在，跳过")
            c['_metrics'] = None
            continue
        rows = get_table_rows(data_json, c['tableName'])
        metrics = compute_metrics(rows, c['valueKey'], c['timeKey'])
        c['_metrics'] = metrics
        if metrics:
            print(f"  [{c['id']}] latest={metrics['latest']:.2f} change={metrics['change']:+.1f}%")
        else:
            print(f"  [{c['id']}] 数据不足")

    # 4. 更新 index_v3.html
    print("\n[4/4] 更新 index_v3.html...")
    html_path = os.path.join(BASE_DIR, 'index_v3.html')
    new_dashboards_js = build_dashboards_js(selected)
    success = update_index_html(html_path, new_dashboards_js)
    if not success:
        print("[失败] 无法更新 index_v3.html")
        sys.exit(1)

    # 5. 同步更新 embedded/ 目录（如果存在且结构相同）
    embedded_html = os.path.join(BASE_DIR, 'embedded', 'index_v3.html')
    if os.path.exists(embedded_html):
        print(f"\n[5] 同步更新 embedded/index_v3.html...")
        with open(embedded_html, 'r', encoding='utf-8') as f:
            e_content = f.read()
        if 'var DASHBOARDS' in e_content:
            success2 = update_index_html(embedded_html, new_dashboards_js)
            if success2:
                print("  [成功] 已同步更新 embedded/index_v3.html")
        else:
            print("  [跳过] embedded 版本不含 DASHBOARDS")

    print("\n" + "=" * 60)
    print("  完成！请刷新 http://localhost:8888/index_v3.html 确认效果")
    print("=" * 60)


if __name__ == '__main__':
    main()
