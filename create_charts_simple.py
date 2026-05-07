import sys
import io
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.express as px
import pandas as pd
import json

# 设置控制台输出为 UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# 读取提取的数据
with open('report_content.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 创建颜色主题
colors = {
    'primary': '#1f77b4',
    'secondary': '#ff7f0e',
    'success': '#2ca02c',
    'danger': '#d62728',
    'purple': '#9467bd',
    'brown': '#8c564b',
    'pink': '#e377c2',
    'gray': '#7f7f7f',
    'olive': '#bcbd22',
    'cyan': '#17becf'
}

color_palette = list(colors.values())

print("开始创建可视化图表...")

# ============================================
# 图表 1: 月度产量/产能/利用率趋势图
# ============================================
print("创建图表 1: 月度产量/产能/利用率趋势图")

monthly_data = {
    'month': ['2024-01', '2024-02', '2024-03', '2024-06', '2024-09', '2024-12', '2025-08', '2025-11', '2026-01', '2026-02'],
    'production': [117118, 101044, 175000, 280000, 330000, 274075, 360000, 423905, 412250, 380153],
    'capacity': [349459, 349459, 379000, 400000, 430000, 460000, 480000, 470000, 609168, 602836],
    'utilization': [33.5, 28.9, 46, 70, 73, 60, 75, 90, 67.7, 63.1]
}

fig1 = make_subplots(specs=[[{"secondary_y": True}]])

fig1.add_trace(go.Bar(
    x=monthly_data['month'],
    y=monthly_data['production'],
    name='月度产量',
    marker_color=colors['primary'],
    opacity=0.8
))

fig1.add_trace(go.Bar(
    x=monthly_data['month'],
    y=monthly_data['capacity'],
    name='月度产能',
    marker_color=colors['secondary'],
    opacity=0.6
))

fig1.add_trace(go.Scatter(
    x=monthly_data['month'],
    y=monthly_data['utilization'],
    name='产能利用率',
    mode='lines+markers',
    marker=dict(color=colors['danger'], size=10),
    line=dict(width=3, color=colors['danger'])
))

fig1.update_layout(
    title='📊 磷酸铁锂月度产量/产能/利用率趋势（2024-2026）',
    xaxis=dict(title='月份'),
    yaxis=dict(title='产量/产能（吨）'),
    yaxis2=dict(title='产能利用率（%）', range=[0, 100]),
    hovermode='x unified',
    template='plotly_white',
    legend=dict(x=0, y=1.1, orientation='h'),
    height=600
)

fig1.write_html('chart1_monthly_trend.html')
print("[OK] 图表 1 已保存")

# ============================================
# 图表 2: 2026 年 2 月企业产量排名和利用率
# ============================================
print("创建图表 2: 企业产量排名和利用率对比")

company_data = pd.DataFrame({
    'company': ['湖南裕能', '万润新能', '江西升华', '德方纳米', '国轩高科', '万华化学', '常州锂源', '友山科技', '邦普循环', '协鑫锂电', '安达科技', '比亚迪'],
    'production': [85000, 38000, 30000, 25000, 18500, 17500, 17303, 20000, 11500, 10000, 8000, 2000],
    'capacity': [91917, 39000, 25000, 31250, 20000, 20833, 23376, 33333, 18583, 10000, 12500, 2917],
    'utilization': [92.5, 97.4, 120, 80.0, 92.5, 84.0, 74.0, 60.0, 61.9, 100, 64.0, 68.6]
})

fig2 = make_subplots(
    rows=1, cols=2,
    specs=[[{'type': 'bar'}, {'type': 'bar'}]],
    subplot_titles=('🏭 企业产量排名（2026 年 2 月）', '⚡ 企业产能利用率（2026 年 2 月）')
)

fig2.add_trace(go.Bar(
    x=company_data['production'],
    y=company_data['company'],
    orientation='h',
    name='产量',
    marker=dict(color=company_data['production'], colorscale='Blues', showscale=True),
), row=1, col=1)

fig2.add_trace(go.Bar(
    x=company_data['utilization'],
    y=company_data['company'],
    orientation='h',
    name='利用率',
    marker=dict(
        color=company_data['utilization'],
        colorscale='RdYlGn',
        showscale=True,
        cmin=0,
        cmax=120
    ),
), row=1, col=2)

fig2.update_layout(
    title='🏅 2026 年 2 月磷酸铁锂企业产量与产能利用率排名',
    height=600,
    showlegend=False,
    template='plotly_white'
)

fig2.update_xaxes(title_text="产量（吨）", row=1, col=1)
fig2.update_xaxes(title_text="产能利用率（%）", row=1, col=2)

fig2.write_html('chart2_company_ranking.html')
print("[OK] 图表 2 已保存")

# ============================================
# 图表 3: LFP 现货价格可视化（分规格）
# ============================================
print("创建图表 3: LFP 现货价格可视化")

price_data = pd.DataFrame({
    'spec': ['动力（2.60-2.65）-四代', '动力（2.55-2.60）-三代半', '储能（2.55-2.60）', '动力（2.50-2.55）-三代', '动力（2.40-2.50）-二代', '回收修复型'],
    'avg_price': [5.81, 5.66, 5.64, 5.43, 5.36, 3.92],
    'min_price': [5.78, 5.60, 5.55, 5.38, 5.30, 3.85],
    'max_price': [5.88, 5.72, 5.74, 5.52, 5.46, 4.00],
    'application': ['高端动力电池', '中高端动力', '储能主流', '主流动力', '低端动力', '回收再生']
})

fig3 = go.Figure(data=[
    go.Bar(
        y=price_data['spec'],
        x=price_data['avg_price'],
        orientation='h',
        marker=dict(color=price_data['avg_price'], colorscale='Blues', showscale=True),
        error_x=dict(
            type='data',
            symmetric=True,
            array=[row['max_price'] - row['avg_price'] for _, row in price_data.iterrows()],
            color=colors['danger'],
            thickness=2,
            width=10
        ),
        hovertemplate='<b>%{y}</b><br>均价：%{x:.2f}万元/吨<br>应用：%{customdata}<extra></extra>',
        customdata=price_data['application']
    )
])

fig3.update_layout(
    title='💰 LFP 现货市场价格分布（按压实密度/代际）- 2026 年 3 月',
    xaxis=dict(title='价格（万元/吨）'),
    yaxis=dict(title='规格类型'),
    template='plotly_white',
    height=500,
    showlegend=False,
)

fig3.write_html('chart3_lfp_price.html')
print("[OK] 图表 3 已保存")

# ============================================
# 图表 4: 代际产品对比分析
# ============================================
print("创建图表 4: 代际产品对比分析")

generation_data = pd.DataFrame({
    'generation': ['二代', '三代', '三代半', '四代'],
    'density': [2.40, 2.50, 2.55, 2.60],
    'market_share_2025': [33.5, 44.8, 11.5, 10.3],
    'processing_fee': [15250, 16250, 17650, 18800],
    'price_increase': [750, 1100, 1000, 1750]
})

fig4 = make_subplots(
    rows=2, cols=2,
    specs=[[{'type': 'bar'}, {'type': 'scatter'}],
           [{'type': 'bar'}, {'type': 'bar'}]],
    subplot_titles=('📈 2025 年市场份额占比', '💹 加工费对比', '🔼 价格涨幅（vs 2025Q3）', '📊 压实密度对比')
)

fig4.add_trace(go.Bar(
    x=generation_data['generation'],
    y=generation_data['market_share_2025'],
    marker_color=color_palette[:4],
    text=[f'{s}%' for s in generation_data['market_share_2025']],
    textposition='outside',
), row=1, col=1)

fig4.add_trace(go.Scatter(
    x=generation_data['generation'],
    y=generation_data['processing_fee'],
    mode='lines+markers',
    marker=dict(size=12, color=colors['primary']),
    line=dict(width=3, color=colors['primary']),
), row=1, col=2)

fig4.add_trace(go.Bar(
    x=generation_data['generation'],
    y=generation_data['price_increase'],
    marker_color=colors['success'],
    text=[f'+{i:,}' for i in generation_data['price_increase']],
    textposition='outside',
), row=2, col=1)

fig4.add_trace(go.Bar(
    x=generation_data['generation'],
    y=generation_data['density'],
    marker_color=colors['purple'],
    text=[f'{d:.2f}' for d in generation_data['density']],
    textposition='outside',
), row=2, col=2)

fig4.update_layout(
    title='🔄 LFP 代际产品综合对比分析',
    height=800,
    showlegend=False,
    template='plotly_white'
)

fig4.update_xaxes(title_text="代际", row=1, col=1)
fig4.update_xaxes(title_text="代际", row=1, col=2)
fig4.update_xaxes(title_text="代际", row=2, col=1)
fig4.update_xaxes(title_text="代际", row=2, col=2)
fig4.update_yaxes(title_text="市场份额（%）", row=1, col=1)
fig4.update_yaxes(title_text="加工费（元/吨）", row=1, col=2)
fig4.update_yaxes(title_text="涨幅（元/吨）", row=2, col=1)
fig4.update_yaxes(title_text="压实密度（g/cm³）", row=2, col=2)

fig4.write_html('chart4_generation_comparison.html')
print("[OK] 图表 4 已保存")

# ============================================
# 图表 5: 市场份额和结构分析
# ============================================
print("创建图表 5: 市场份额和结构分析")

material_share = pd.DataFrame({
    'material': ['磷酸铁锂（LFP）', '三元材料', '磷酸锰铁锂（LMFP）', '其他'],
    'share': [73, 22, 2, 3],
    'trend': ['保持主导', '持续被挤压', '快速放量', '稳定']
})

lithium_price = pd.DataFrame({
    'date': ['2025 年 9 月', '2025 年 12 月', '2026 年 1 月', '2026 年 2 月', '2026 年 3 月'],
    'price': [9900, 120000, 147500, 168440, 167500],
    'type': ['历史低点', '年底突破', '大幅拉升', '单日 +6.13%', '现货价格']
})

fig5 = make_subplots(
    rows=1, cols=2,
    specs=[[{'type': 'pie'}, {'type': 'scatter'}]],
    subplot_titles=('🥧 2026 年正极材料市场份额', '📉 碳酸锂价格走势（2025-2026）')
)

fig5.add_trace(go.Pie(
    labels=material_share['material'],
    values=material_share['share'],
    marker=dict(colors=color_palette[:4]),
    textinfo='label+percent+value',
), row=1, col=1)

fig5.add_trace(go.Scatter(
    x=lithium_price['date'],
    y=lithium_price['price'],
    mode='lines+markers',
    marker=dict(size=10, color=colors['danger']),
    line=dict(width=3, color=colors['danger']),
), row=1, col=2)

fig5.update_layout(
    title='📊 正极材料市场结构与碳酸锂价格分析',
    height=500,
    template='plotly_white'
)

fig5.update_yaxes(title_text="价格（元/吨）", row=1, col=2)

fig5.write_html('chart5_market_structure.html')
print("[OK] 图表 5 已保存")

# ============================================
# 图表 6: 2025 年核心数据概览
# ============================================
print("创建图表 6: 2025 年核心数据概览")

metrics_2025 = pd.DataFrame({
    'indicator': ['中国磷酸铁锂产量', '中国磷酸铁锂产能', '全球动力电池产量', 'LFP 动力电池占比', '全球储能电池产量', '中国 LFP 装车占比'],
    'value': [375, 688, 1421, 66, 540, 81.2],
    'unit': ['万吨', '万吨/年', 'GWh', '%', 'GWh', '%'],
    'yoy': [60, 46, 36, 6, 73, 6.6]
})

fig6 = go.Figure()

fig6.add_trace(go.Bar(
    x=metrics_2025['indicator'],
    y=metrics_2025['value'],
    marker=dict(
        color=metrics_2025['yoy'],
        colorscale='RdYlGn',
        showscale=True,
        colorbar=dict(title='同比增长'),
    ),
    text=[f'{v}{u}<br>同比：+{y}%' for v, u, y in zip(metrics_2025['value'], metrics_2025['unit'], metrics_2025['yoy'])],
    textposition='outside',
    textfont=dict(size=10),
))

fig6.update_layout(
    title='📋 2025 年磷酸铁锂行业核心数据概览',
    xaxis=dict(title='指标'),
    yaxis=dict(title='数值'),
    height=600,
    template='plotly_white',
    showlegend=False,
    margin=dict(b=150)
)

fig6.write_html('chart6_2025_metrics.html')
print("[OK] 图表 6 已保存")

# ============================================
# 图表 7: 2026 年预测数据
# ============================================
print("创建图表 7: 2026 年预测数据")

forecast_2026 = pd.DataFrame({
    'indicator': ['中国锂电池出货量', '储能锂电池出货量', '全球 LFP 材料产量', '中国 LFP 名义产能', '碳酸锂价格中枢', 'LFP 动力型价格中枢'],
    'value': [2300, 850, 670, 950, 15, 6],
    'unit': ['GWh', 'GWh', '万吨', '万吨', '万元/吨', '万元/吨'],
    'growth': [30, 35, 55, None, None, None],
    'source': ['GGII', 'GGII', 'GGII', 'SMM', '上海钢联', 'SMM']
})

fig7 = go.Figure()

fig7.add_trace(go.Bar(
    x=forecast_2026['indicator'],
    y=forecast_2026['value'],
    marker_color=colors['primary'],
    text=[f'{v}{u}' + (f'<br>+{g}%' if g else '') for v, u, g in zip(forecast_2026['value'], forecast_2026['unit'], forecast_2026['growth'])],
    textposition='outside',
    textfont=dict(size=10),
))

fig7.update_layout(
    title='🔮 2026 年磷酸铁锂行业核心预测指标',
    xaxis=dict(title='指标'),
    yaxis=dict(title='预测值'),
    height=600,
    template='plotly_white',
    showlegend=False,
    margin=dict(b=150)
)

fig7.write_html('chart7_2026_forecast.html')
print("[OK] 图表 7 已保存")

# ============================================
# 图表 8: 企业扩产项目对比
# ============================================
print("创建图表 8: 企业扩产项目")

expansion_data = pd.DataFrame({
    'company': ['湖南裕能', '万华化学', '宁德时代', '容百科技', '富临精工'],
    'project': ['32 万吨 LMFP+7.5 万吨超长循环', '累计规划 125 万吨/年', '45 万吨/年已投产', '收购贵州新仁 6 万吨/年', '累计规划超 100 万吨/年'],
})

fig8 = go.Figure()

fig8.add_trace(go.Bar(
    y=expansion_data['company'],
    x=[32, 125, 45, 6, 100],
    orientation='h',
    marker=dict(color=color_palette[:5]),
    text=[f'{p}万吨' for p in [32, 125, 45, 6, 100]],
    textposition='outside',
))

fig8.update_layout(
    title='🏗️ 主要企业产能扩张项目对比',
    xaxis=dict(title='产能（万吨）'),
    yaxis=dict(title='企业'),
    height=500,
    template='plotly_white',
    showlegend=False
)

fig8.write_html('chart8_expansion.html')
print("[OK] 图表 8 已保存")

print("\n✅ 所有图表已创建完成！")
print("\n生成的图表文件:")
for i in range(1, 9):
    print(f"  - chart{i}_*.html")
