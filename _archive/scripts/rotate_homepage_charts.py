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
import glob

# ============================================================
# 图表目录 CHART_CATALOG
# 每个条目对应一个可展示在首页的图表
# division: 所属事业部代码，用于从早报中提取对应事业部的分析内容
# ============================================================
CHART_CATALOG = [

    # =========== 碳酸锂及原料数据库 (carbonate) → 常州锂源事业部 (czly) ===========
    {
        "id": "carbonate_price",
        "tag": "碳酸锂·现货价格",
        "title": "碳酸锂现货价格走势",
        "link": "carbonate_charts.html",
        "dataFile": "carbonate_all_data.json",
        "tableName": "碳酸锂-价格",
        "valueKey": "均价（万元/吨）",
        "timeKey": "日期",
        "isBar": False,
        "unit": "万元/吨",
        "scale": 1,
        "color": "#1e3c72",
        "division": "czly",
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
        "division": "czly",
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
        "division": "czly",
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
        "division": "czly",
    },
    {
        "id": "lym_price",
        "tag": "锂云母·价格",
        "title": "锂云母价格走势",
        "link": "carbonate_charts.html",
        "dataFile": "carbonate_all_data.json",
        "tableName": "锂云母-价格",
        "valueKey": "均价（万元/吨）",
        "timeKey": "日期",
        "isBar": False,
        "unit": "万元/吨",
        "scale": 1,
        "color": "#27ae60",
        "division": "czly",
    },

    # =========== 电解液数据库 (electrolyte) → 法恩莱特事业部 (felt) ===========
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
        "division": "felt",
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
        "division": "felt",
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
        "division": "felt",
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
        "division": "felt",
    },

    # =========== 磷酸铁锂数据库 (lfp) → 常州锂源事业部 (czly) ===========
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
        "division": "czly",
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
        "division": "czly",
    },

    # =========== 三元材料数据库 (ternary) → 常州锂源事业部 (czly) ===========
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
        "division": "czly",
    },

    # =========== 锂电池回收数据库 (recycling) → 山东美多事业部 (sdmd) ===========
    {
        "id": "recycling_blackmass",
        "tag": "回收·黑粉处理量",
        "title": "锂电池黑粉处理量走势",
        "link": "recycling_charts.html",
        "dataFile": "recycling_all_data.json",
        "tableName": "黑粉处理量-总计",
        "valueKey": "总计",
        "timeKey": "当前日期",
        "isBar": True,
        "unit": "吨",
        "scale": 1,
        "color": "#e67e22",
        "division": "sdmd",
    },

    # =========== 锂电池行业数据库 (lib_battery) → 常州锂源事业部 (czly) ===========
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
        "division": "czly",
    },

    # =========== 汽车行业数据库 (automotive) → 常州锂源事业部 (czly) ===========
    {
        "id": "automotive_ev_sales",
        "tag": "汽车·新能源销量",
        "title": "新能源汽车销量走势",
        "link": "automotive_charts.html",
        "dataFile": "automotive_all_data.json",
        "tableName": "新能源汽车销量-中国市场",
        "valueKey": "本期销量（万辆）",
        "timeKey": "月份",
        "isBar": True,
        "unit": "万辆",
        "scale": 1,
        "color": "#e74c3c",
        "division": "czly",
    },

    # =========== 饼图候选（分类/份额数据）==========
    {
        "id": "ternary_ncm_split",
        "tag": "三元材料·型号分布",
        "title": "三元正极材料分型号产量占比",
        "link": "ternary_charts.html",
        "dataFile": "ternary_all_data.json",
        "tableName": "NCM-分型号产量",
        "chartType": "pie",
        "pieMode": "row_columns",          # 取最新一行，非日期列作为分类
        "pieExcludeColumns": ["月份"],      # 额外排除的列
        "unit": "吨",
        "scale": 1,
        "color": "#8e44ad",
        "division": "czly",
    },
    {
        "id": "recycling_market_share",
        "tag": "回收·企业份额",
        "title": "锂电池回收企业市场份额",
        "link": "recycling_charts.html",
        "dataFile": "recycling_all_data.json",
        "tableName": "黑粉整体处理量-分企业",
        "chartType": "pie",
        "pieMode": "filtered_rows",         # 按日期过滤，提取name+value
        "pieDateKey": "时间",
        "pieNameKey": "企业",
        "pieValueKey": "当月总计",
        "pieFilterExpr": "r.get('企业') and r['企业'] != '合计'",  # 排除合计行
        "unit": "吨",
        "scale": 1,
        "color": "#e67e22",
        "division": "sdmd",
    },
    {
        "id": "automotive_nev_brand_share",
        "tag": "汽车·NEV品牌份额",
        "title": "新能源汽车品牌销量份额",
        "link": "automotive_charts.html",
        "dataFile": "automotive_all_data.json",
        "tableName": "新能源汽车销量-乘用车零售分品牌",
        "chartType": "pie",
        "pieMode": "filtered_rows",
        "pieDateKey": "日期",
        "pieNameKey": "NEV厂商",
        "pieValueKey": "销量（万辆）",
        "unit": "万辆",
        "scale": 1,
        "color": "#e74c3c",
        "division": "czly",
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


def load_latest_report(base_dir):
    """加载最新的早报JSON文件"""
    reports_dir = os.path.join(base_dir, 'reports')
    if not os.path.exists(reports_dir):
        return None
    pattern = os.path.join(reports_dir, '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9].json')
    files = glob.glob(pattern)
    if not files:
        return None
    files.sort(reverse=True)
    latest_file = files[0]
    try:
        with open(latest_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"  [错误] 读取早报文件失败 {latest_file}: {e}")
        return None


def generate_pie_insight(chart, data_json, latest_report, division):
    """生成饼图数据洞察文案（完整展示，含行业分析）"""
    rows = get_table_rows(data_json, chart['tableName'])
    if not rows:
        return '数据不足，无法生成分析。'

    pie_mode = chart.get('pieMode', '')

    # 模式1: row_columns — 取最新行
    if pie_mode == 'row_columns':
        last_row = rows[-1]
        exclude_keys = set(['日期','月份','时间','date','_record_id','父记录','字段'])
        exclude_keys.update(chart.get('pieExcludeColumns', []))
        items = []
        for k, v in last_row.items():
            if k not in exclude_keys:
                try:
                    val = float(str(v).replace(',', ''))
                    if val > 0:
                        items.append((k, val))
                except:
                    pass
        items.sort(key=lambda x: x[1], reverse=True)

    # 模式2: filtered_rows
    elif pie_mode == 'filtered_rows':
        date_key = chart.get('pieDateKey', '日期')
        name_key = chart.get('pieNameKey', '')
        val_key = chart.get('pieValueKey', '')
        filter_expr = chart.get('pieFilterExpr', '')

        # 找最新日期
        latest_date = ''
        for r in rows:
            rd = str(r.get(date_key, ''))
            if rd > latest_date:
                latest_date = rd

        items = []
        for r in rows:
            if str(r.get(date_key, '')) != latest_date:
                continue
            # 应用过滤
            if filter_expr and not eval(filter_expr):
                continue
            name = str(r.get(name_key, ''))
            try:
                val = float(str(r.get(val_key, '0')).replace(',', ''))
                if name and val > 0:
                    items.append((name, val))
            except:
                pass
        items.sort(key=lambda x: x[1], reverse=True)
    else:
        return '未知饼图模式，无法生成分析。'

    if not items:
        return '数据不足，无法生成分析。'

    total = sum(v for _, v in items)
    top_name, top_val = items[0]
    top_pct = (top_val / total * 100) if total > 0 else 0
    top_str = f"{top_val:.1f}" if top_val < 10000 else f"{top_val/10000:.1f}万"

    # 取前2名
    part1 = f"TOP1「{top_name}」占{top_pct:.0f}%（{top_str}"
    unit = chart.get('unit', '')
    if unit:
        part1 += f"{unit})"
    else:
        part1 += "）"

    if len(items) >= 2:
        sec_name, sec_val = items[1]
        sec_pct = (sec_val / total * 100) if total > 0 else 0
        part1 += f"，{sec_name}{sec_pct:.0f}%"

    # 补充行业消息（使用与折线图/柱状图相同的提取逻辑）
    news_part = ""
    if latest_report and division:
        dept = latest_report.get('departments', {}).get(division, {})
        
        if dept:
            sections = dept.get('sections', {})
        elif isinstance(latest_report, dict) and 'sections' in latest_report:
            sections = latest_report.get('sections', {})
        else:
            sections = {}
        
        # 复用相同的提取逻辑
        def extract_pie_news(sections_obj):
            """从早报中提取行业分析内容"""
            if not sections_obj:
                return ""
            
            best_content = ""
            
            # 英文dim格式（list）
            if isinstance(sections_obj, list):
                for dim_name in ['action', 'topnews', 'policy']:
                    sec = next((s for s in sections_obj if s.get('dim') == dim_name), None)
                    if sec and sec.get('items'):
                        item = sec['items'][0]
                        content = item.get('content') or item.get('内容', '')
                        if content and len(content) > 15:
                            best_content = content
                            break
            
            # 中文键名格式（dict）
            elif isinstance(sections_obj, dict):
                tips = sections_obj.get('专属提示', {})
                if isinstance(tips, dict):
                    for cat in ['机会', '风险']:
                        items_list = tips.get(cat, [])
                        if items_list:
                            summary = items_list[0].get('总结', '')
                            if summary and len(summary) > 15:
                                best_content = summary
                                break
                
                if not best_content or len(best_content) < 15:
                    policy_list = sections_obj.get('政策_行业', [])
                    if policy_list:
                        item = policy_list[0]
                        sm = item.get('摘要', '')
                        if sm and len(sm) > 15:
                            best_content = sm
            
            return best_content
        
        news_part = extract_pie_news(sections)
        
        # 跨事业部回退
        if (not news_part or len(news_part) < 15) and isinstance(latest_report, dict):
            depts = latest_report.get('departments', {})
            for div_id, div_data in depts.items():
                if div_id == division:
                    continue
                div_secs = div_data.get('sections', {})
                text = extract_pie_news(div_secs)
                if text and len(text) > 15:
                    news_part = text
                    break
    
    # 压缩 news_part 到合理长度（目标：总长度 ≤100 字）
    # part1 ~40字，留给 news_part ~58字
    if news_part:
        max_news_pie = 100 - len(part1) - 3
        if max_news_pie > 10 and len(news_part) > max_news_pie:
            truncated = news_part[:max_news_pie]
            last_period = truncated.rfind('。')
            if last_period > 5:
                news_part = truncated[:last_period + 1]
            else:
                news_part = news_part[:max_news_pie - 1] + '。'
    
    # 组合文案
    full_text = part1 + "。"
    if news_part:
        news_part = news_part.replace('\n', '，').replace('  ', ' ').strip()
        if not news_part.endswith(('。', '！', '？')):
            news_part += '。'
        full_text += news_part
    
    # 上限100字（完整展示，句号处截断，不添加省略号）
    if len(full_text) > 100:
        base_len = len(part1) + 1  # part1 + "。"
        max_news = 100 - base_len - 3
        if max_news > 10:
            # 在句号处截断，不添加省略号
            truncated = news_part[:max_news]
            last_period = truncated.rfind('。')
            if last_period > 10:
                truncated = truncated[:last_period + 1]
            # 若找不到句号，直接截断，不加省略号
            full_text = part1 + "。" + truncated
        else:
            full_text = full_text[:100]
    
    return full_text


def generate_insight_with_news(chart, metrics, report, division):
    """生成数据洞察文案，从早报中提取行业分析（完整展示，不截断）"""
    if metrics is None:
        return '数据不足，无法生成分析。'
    
    latest = metrics['latest']
    change = metrics['change']
    unit = chart['unit']
    trend = '上涨' if change >= 0 else '下跌'
    abs_change = abs(change)
    
    # 格式化数值
    if unit in ['万元/吨', 'GWh', '万辆']:
        latest_str = f"{latest:.2f}"
    elif unit == '美元/吨':
        latest_str = f"{latest:.0f}"
    elif unit == '吨':
        if latest >= 10000:
            latest_str = f"{(latest/10000):.2f}万"
        else:
            latest_str = f"{latest:.0f}"
    else:
        latest_str = f"{latest:.2f}"
    
    # 1. 数据描述部分（约20字）
    data_part = f"最新值{latest_str}{unit}，环比{trend}{abs_change:.1f}%。"
    
    # 2. 同环比分析（约15字）
    yoy = metrics.get('yoyChange')
    trend3 = metrics.get('trend3', 'up')
    if yoy is not None:
        yoy_str = f"同比{'增' if yoy >= 0 else '减'}{abs(yoy):.1f}%"
    else:
        yoy_str = "暂无同比"
    
    trend3_str = "近期走强" if trend3 == 'up' else "近期承压"
    compare_part = f"{yoy_str}，{trend3_str}。"
    
    # 3. 行业分析（从早报提取摘要，目标50-100字，完整展示不截断）
    news_part = ""
    if report and division:
        # 获取该事业部的数据
        dept = report.get('departments', {}).get(division, {})
        
        if dept:
            sections = dept.get('sections', {})
        elif isinstance(report, dict) and 'sections' in report:
            # 单事业部文件格式（sections在顶层）
            sections = report.get('sections', {})
        else:
            sections = {}
        
        # 辅助函数：从中文键名sections中提取内容
        def extract_from_chinese_sections(sections_dict):
            """从中文键名sections中提取有价值的分析内容"""
            if not isinstance(sections_dict, dict):
                return ""
            
            best_content = ""
            
            # 优先级1：专属提示→机会（最有价值的行业分析，通常60-100字）
            tips = sections_dict.get('专属提示', {})
            if isinstance(tips, dict):
                for cat in ['机会', '风险', '行动建议', '重点关注']:
                    items = tips.get(cat, [])
                    if items and len(items) > 0:
                        summary = items[0].get('总结', '')
                        if summary and len(summary) > 20:
                            best_content = summary
                            break  # 找到第一个有内容的就使用
            
            # 如果专属提示没有足够内容，尝试政策_行业
            if not best_content or len(best_content) < 20:
                policy_list = sections_dict.get('政策_行业', [])
                if isinstance(policy_list, list) and len(policy_list) > 0:
                    item = policy_list[0]
                    summary = item.get('摘要', '')
                    if summary and len(summary) > 20:
                        best_content = summary
            
            # 备选：企业动态
            if not best_content or len(best_content) < 20:
                ent_list = sections_dict.get('企业动态', [])
                if isinstance(ent_list, list) and len(ent_list) > 0:
                    item = ent_list[0]
                    summary = item.get('摘要', '')
                    if summary and len(summary) > 20:
                        best_content = summary
            
            # 最后备选：技术_产品（含具体产品/技术信息）
            if not best_content or len(best_content) < 20:
                tech_list = sections_dict.get('技术_产品', [])
                if isinstance(tech_list, list) and len(tech_list) > 0:
                    item = tech_list[0]
                    summary = item.get('摘要', '')
                    if summary and len(summary) > 20:
                        best_content = summary
            
            return best_content
        
        # 辅助函数：从英文dim sections中提取内容（兼容旧格式）
        def extract_from_english_sections(sections_list):
            """从英文dim sections中提取内容"""
            if not isinstance(sections_list, list):
                return ""
            
            best_content = ""
            # 按优先级查找
            for dim_name in ['action', 'topnews', 'policy', 'tech']:
                sec = next((s for s in sections_list if s.get('dim') == dim_name), None)
                if sec and sec.get('items'):
                    item = sec['items'][0]
                    content = item.get('content') or item.get('内容', '')
                    title = item.get('title') or item.get('标题', '')
                    if content and len(content) > 20:
                        best_content = content
                        break
                    elif title and not best_content:
                        best_content = title
            
            return best_content
        
        # 根据sections格式选择提取方式
        if isinstance(sections, dict):
            news_part = extract_from_chinese_sections(sections)
        elif isinstance(sections, list):
            news_part = extract_from_english_sections(sections)
        
        # 跨事业部回退：如果本事业部没找到有效内容，遍历所有事业部
        if (not news_part or len(news_part) < 20) and isinstance(report, dict):
            depts = report.get('departments', {})
            if not depts and isinstance(report, dict) and 'sections' in report:
                # 单文件格式，没有departments，跳过回退
                pass
            else:
                for div_id, div_data in depts.items():
                    if div_id == division:
                        continue  # 已检查过
                    div_sections = div_data.get('sections', {})
                    if isinstance(div_sections, dict):
                        text = extract_from_chinese_sections(div_sections)
                    elif isinstance(div_sections, list):
                        text = extract_from_english_sections(div_sections)
                    else:
                        text = ""
                    
                    if text and len(text) > 20:
                        news_part = text
                        break
    # 压缩 news_part 到合理长度（目标：总长度 ≤100 字）
    # data_part ~25字，compare_part ~20字，留给 news_part ~55字
    if news_part:
        max_news = 100 - len(data_part) - len(compare_part) - 2
        if max_news < 10:
            max_news = 10
        if len(news_part) > max_news:
            # 在句号处截断，不添加省略号
            truncated = news_part[:max_news]
            last_period = truncated.rfind('。')
            if last_period > 5:
                news_part = truncated[:last_period + 1]
            else:
                # 找不到句号，直接在 max_news 处截断并补句号
                news_part = news_part[:max_news - 1] + '。'
    
    # 组合文案：数据 + 分析（总长度 ≤100 字，完整展示不截断）
    full_text = data_part + compare_part
    if news_part:
        # 清理news_part：去换行、多余空格
        news_part = news_part.replace('\n', '，').replace('  ', ' ').strip()
        if not news_part.endswith(('。', '！', '？')):
            news_part += '。'
        full_text += news_part
    
    # 最终长度控制：上限100字（句号处截断，不添加省略号）
    if len(full_text) > 100:
        # 智能截断：保留数据部分，在句号处截断新闻部分
        base_len = len(data_part) + len(compare_part)
        max_news = 100 - base_len - 3
        if max_news > 10:
            # 在句号处截断，不添加省略号
            truncated = news_part[:max_news]
            last_period = truncated.rfind('。')
            if last_period > 10:
                truncated = truncated[:last_period + 1]
            # 若找不到句号，直接截断，不加省略号
            full_text = data_part + compare_part + truncated
        else:
            full_text = full_text[:100]
    
    return full_text


def select_diverse_charts(catalog, n=4, seed=None):
    """
    从目录中选择n个图表，确保图表类型多样性
    策略：
      1. 确保至少选中1个折线图、1个柱状图和1个饼图（如果可用）
      2. 补充剩余位置时，优先选择当前占比较少的类型
      3. 最终打乱顺序，避免类型聚集
    """
    if seed is not None:
        random.seed(seed)

    # 过滤出数据文件存在的图表
    available = [c for c in catalog if os.path.exists(os.path.join(BASE_DIR, c['dataFile']))]

    if len(available) < n:
        print(f"  [警告] 可用图表不足 {n} 个（仅有 {len(available)} 个），已减少选取数量")
        n = len(available)

    # 按类型分组：line / bar / pie
    line_charts = [c for c in available if not c.get('isBar', False) and c.get('chartType') != 'pie']
    bar_charts = [c for c in available if c.get('isBar', False)]
    pie_charts = [c for c in available if c.get('chartType') == 'pie']

    selected = []

    # 步骤1：确保至少1个折线图、1个柱状图、1个饼图
    type_picks = [
        ('line', line_charts),
        ('bar', bar_charts),
        ('pie', pie_charts),
    ]
    for tname, pool in type_picks:
        if pool and len(selected) < n:
            remaining = [c for c in pool if c not in selected]
            if remaining:
                chosen = random.choice(remaining)
                selected.append(chosen)
            else:
                print(f"  [注意] 无可用{tname}图")

    # 步骤2：补充剩余位置，优先选择当前数量最少的类型
    while len(selected) < n:
        counts = {
            'line': sum(1 for c in selected if not c.get('isBar', False) and c.get('chartType') != 'pie'),
            'bar': sum(1 for c in selected if c.get('isBar', False)),
            'pie': sum(1 for c in selected if c.get('chartType') == 'pie'),
        }
        pools = {'line': line_charts, 'bar': bar_charts, 'pie': pie_charts}

        # 找到数量最少且有剩余的类型
        candidates = None
        min_count = 999
        for tname in ['line', 'bar', 'pie']:
            if counts[tname] < min_count:
                remain = [c for c in pools[tname] if c not in selected]
                if remain:
                    candidates = remain
                    min_count = counts[tname]

        if not candidates:
            # 所有类型都已选完或无剩余，从全部可用中随机选
            all_remain = [c for c in available if c not in selected]
            if all_remain:
                candidates = all_remain
            else:
                break

        selected.append(random.choice(candidates))

    # 步骤3：打乱顺序
    random.shuffle(selected)

    if seed is not None:
        random.seed()

    return selected


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
        # insight 是文案字符串（由Python生成），直接拼入JS
        insight_text = c.get('_insight', '数据加载中...')
        # 转义JS字符串中的单引号
        insight_escaped = insight_text.replace('\\', '\\\\').replace("'", "\\'")

        # 基础字段
        division_val = c.get('division', '')
        base_fields = f"""            id: '{c['id']}',
            tag: '{c['tag']}',
            title: '{c['title']}',
            link: '{c['link']}',
            dataFile: '{c['dataFile']}',
            tableName: '{c['tableName']}',
            unit: '{c['unit']}',
            scale: {c['scale']},
            insight: '{insight_escaped}',
            division: '{division_val}'"""

        if c.get('chartType') == 'pie':
            # 饼图特有字段
            pie_mode = c.get('pieMode', '')
            exclude_cols = json.dumps(c.get('pieExcludeColumns', []), ensure_ascii=False)
            date_key = c.get('pieDateKey', '')
            name_key = c.get('pieNameKey', '')
            val_key = c.get('pieValueKey', '')
            filter_expr = c.get('pieFilterExpr', '')

            item = f"""        {{
{base_fields},
            chartType: 'pie',
            isBar: false,
            pieMode: '{pie_mode}',
            pieExcludeColumns: {exclude_cols},
            pieDateKey: '{date_key}',
            pieNameKey: '{name_key}',
            pieValueKey: '{val_key}'}}"""
        else:
            # 折线图/柱状图字段
            item = f"""        {{
{base_fields},
            valueKey: '{c['valueKey']}',
            timeKey: '{c['timeKey']}',
            isBar: {'true' if c['isBar'] else 'false'}}}"""

        items.append(item)

    js_array = ',\n'.join(items)
    return f"""        var DASHBOARDS = [\n{js_array}\n        ];"""


def update_index_html(html_path, new_dashboards_js):
    """更新 index_v3.html 中的 DASHBOARDS 数组"""
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 找到 DASHBOARDS = [ 到 ]; 的范围
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
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


def main():
    print("=" * 60)
    print("  首页图表轮换自动化脚本")
    print("  " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("=" * 60)

    # 0. 加载最新早报JSON文件
    print("\n[0/5] 加载最新早报...")
    latest_report = load_latest_report(BASE_DIR)
    if latest_report:
        print(f"  已加载早报: {latest_report.get('date', 'unknown')}")
    else:
        print("  [警告] 未找到早报JSON文件")

    # 1. 加载行业消息（hot_news_data.json）
    print("\n[1/5] 加载行业消息...")
    industry_news = []
    hot_news_path = os.path.join(BASE_DIR, 'hot_news_data.json')
    if os.path.exists(hot_news_path):
        with open(hot_news_path, 'r', encoding='utf-8') as f:
            hn = json.load(f)
            industry_news = hn.get('news', [])[:5]
            print(f"  已加载 {len(industry_news)} 条行业消息")
    else:
        print("  [警告] hot_news_data.json 不存在")

    # 2. 选择4个图表（确保类型多样性）
    print("\n[2/5] 选择图表（确保折线图+柱状图多样性）...")
    today = datetime.now().strftime("%Y-%m-%d")
    seed = int(hashlib.md5(today.encode()).hexdigest()[:8], 16)
    selected = select_diverse_charts(CHART_CATALOG, n=4, seed=seed)
    print(f"  今日 ({today}) 选中图表：")
    for i, c in enumerate(selected):
        ctype = c.get('chartType', 'bar' if c.get('isBar') else 'line')
        type_label = {'line': '折线', 'bar': '柱状', 'pie': '饼图'}.get(ctype, ctype)
        print(f"    {i+1}. [{c['id']}] {c['title']} ({type_label})")

    # 3. 为每个选中图表计算指标并生成数据洞察文案
    print("\n[3/5] 计算数据指标并生成洞察文案...")
    for c in selected:
        data_json = load_data_file(BASE_DIR, c['dataFile'])
        if data_json is None:
            print(f"  [{c['id']}] 数据文件不存在，跳过")
            c['_metrics'] = None
            c['_insight'] = '数据不足，无法生成分析。'
            continue
        rows = get_table_rows(data_json, c['tableName'])
        if c.get('chartType') == 'pie':
            # 饼图不需要时间序列指标，直接跳到洞察生成
            c['_metrics'] = None
            print(f"  [{c['id']}] 饼图模式，使用专用解析")
        else:
            metrics = compute_metrics(rows, c['valueKey'], c['timeKey'])
            c['_metrics'] = metrics
            if metrics:
                print(f"  [{c['id']}] latest={metrics['latest']:.2f} change={metrics['change']:+.1f}%")
            else:
                print(f"  [{c['id']}] 数据不足")

        # 生成数据洞察文案
        division = c.get('division', '')
        if c.get('chartType') == 'pie':
            # 饼图使用专用洞察生成器
            insight = generate_pie_insight(c, data_json, latest_report, division)
        else:
            # 折线图/柱状图用原有逻辑
            insight = generate_insight_with_news(c, metrics, latest_report, division)
        c['_insight'] = insight
        print(f"  文案: {insight[:60]}...")

    # 4. 更新 index_v3.html
    print("\n[4/5] 更新 index_v3.html...")
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
