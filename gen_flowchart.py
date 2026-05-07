# -*- coding: utf-8 -*-
"""
电解液供应链流程图 - 美化版
配色：主色 RGB(58,94,139) = #3A5E8B
字体：微软雅黑，18pt（加大三号）
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patheffects as pe
from matplotlib.patches import FancyBboxPatch
from matplotlib.font_manager import FontProperties
import numpy as np

font_path = r'C:\Windows\Fonts\msyhbd.ttc'
fp = FontProperties(fname=font_path)

# 颜色定义（3色块）
PRIMARY   = '#3A5E8B'   # 主色 RGB(58,94,139)
LIGHT_BG  = '#D6E4F0'   # 浅色背景
MID_COLOR = '#A0BBD4'   # 中蓝色（不合格）
DARK_BG   = '#1A3550'   # 深蓝（标题）
WHITE     = '#FFFFFF'

fig, ax = plt.subplots(figsize=(28, 18))
ax.set_xlim(0, 28)
ax.set_ylim(0, 18)
ax.axis('off')
fig.patch.set_facecolor('white')

# ─────────────────────────────────────────────
def box(ax, cx, cy, w, h, text, bg=PRIMARY, fg=WHITE,
        fontsize=18, radius=0.4):
    x0 = cx - w / 2
    y0 = cy - h / 2
    ax.add_patch(FancyBboxPatch(
        (x0, y0), w, h,
        boxstyle=f'round,pad=0,rounding_size={radius}',
        facecolor=bg, edgecolor=bg, linewidth=2, zorder=3))
    ax.add_patch(FancyBboxPatch(
        (x0, y0), w, h,
        boxstyle=f'round,pad=0,rounding_size={radius}',
        facecolor='none', edgecolor=WHITE, linewidth=2.5, zorder=4))
    ax.text(cx, cy, text, ha='center', va='center',
            fontproperties=fp, fontsize=fontsize,
            color=fg, fontweight='bold', zorder=5,
            multialignment='center')

def diamond(ax, cx, cy, w, h, text, bg=DARK_BG, fg=WHITE, fontsize=18):
    dx, dy = w / 2, h / 2
    pts = np.array([[cx, cy+dy],[cx+dx, cy],[cx, cy-dy],[cx-dx, cy]])
    ax.add_patch(plt.Polygon(pts, closed=True,
        facecolor=bg, edgecolor=WHITE, linewidth=2.5, zorder=3))
    ax.text(cx, cy, text, ha='center', va='center',
            fontproperties=fp, fontsize=fontsize,
            color=fg, fontweight='bold', zorder=4)

def arrow(ax, x1, y1, x2, y2, color=PRIMARY, lw=2.5, label=''):
    ax.annotate('', xy=(x2,y2), xytext=(x1,y1),
        arrowprops=dict(arrowstyle='->', color=color, lw=lw,
                        connectionstyle='arc3,rad=0'), zorder=2)
    if label:
        mx, my = (x1+x2)/2, (y1+y2)/2
        ax.text(mx+0.1, my+0.15, label,
                fontproperties=fp, fontsize=14,
                color=DARK_BG, fontweight='bold', zorder=5)

# ══════════════════════════════════════════════
# 主标题
# ══════════════════════════════════════════════
ax.text(14, 17.6, '电解液供应链全流程',
        ha='center', va='center', fontproperties=fp, fontsize=28,
        fontweight='bold', color=PRIMARY,
        path_effects=[pe.withStroke(linewidth=4, foreground=WHITE)])

# ══════════════════════════════════════════════
# A：需求触发
# ══════════════════════════════════════════════
ax.text(2.5, 16.8, '【需求触发】', ha='center', va='center',
        fontproperties=fp, fontsize=22, fontweight='bold', color=PRIMARY, zorder=5)
box(ax, 2.5, 15.4, 3.6, 1.1, '电池厂 MES',         PRIMARY)
box(ax, 7.5, 15.4, 3.8, 1.1, '需求预测 / 订单',    PRIMARY)
box(ax, 12.5, 15.4, 3.8, 1.1, '电解液 MES',        PRIMARY)
arrow(ax, 4.3, 15.4, 5.6, 15.4)
arrow(ax, 9.4, 15.4, 10.6, 15.4)

# ══════════════════════════════════════════════
# B：原料配送
# ══════════════════════════════════════════════
ax.text(7.5, 13.4, '【原料配送】', ha='center', va='center',
        fontproperties=fp, fontsize=22, fontweight='bold', color=PRIMARY, zorder=5)
box(ax, 7.5, 12.0, 3.6, 1.1, '生产计划生成', PRIMARY)

b_xs = [2.2, 7.5, 12.8]
b_labels = ['溶剂采购订单', '锂盐采购订单', '添加剂采购订单']
b_deliver = ['溶剂罐车\nT+1 到达', '锂盐吨袋\nT+1 到达', '添加剂桶/罐\n按周配送']

for bx, bl, bd in zip(b_xs, b_labels, b_deliver):
    box(ax, bx, 10.3, 3.4, 1.0, bl, PRIMARY)
    box(ax, bx, 8.7,  3.4, 1.0, bd, PRIMARY)
    arrow(ax, 7.5, 11.45, bx, 10.8)
    arrow(ax, bx, 9.8, bx, 9.2)

# ══════════════════════════════════════════════
# C：生产调和
# ══════════════════════════════════════════════
ax.text(14.5, 7.5, '【生产调和】', ha='center', va='center',
        fontproperties=fp, fontsize=22, fontweight='bold', color=PRIMARY, zorder=5)
box(ax, 14.5, 6.0, 3.8, 1.2, '卸料 / 储存',  PRIMARY)
box(ax, 20.5, 6.0, 3.8, 1.2, '调和生产\n4 小时 / 批次', PRIMARY)
arrow(ax, 16.4, 6.0, 18.6, 6.0)

# ══════════════════════════════════════════════
# D：成品输送
# ══════════════════════════════════════════════
ax.text(22, 4.5, '【成品输送】', ha='center', va='center',
        fontproperties=fp, fontsize=22, fontweight='bold', color=PRIMARY, zorder=5)
box(ax, 22, 3.0, 3.2, 1.1, '在线检测', PRIMARY)
diamond(ax, 26.5, 3.0, 2.2, 1.4, '合格？', DARK_BG)
arrow(ax, 23.6, 3.0, 25.4, 3.0)

# 合格分支
box(ax, 26.5, 1.3, 3.2, 1.0, '低温缓存\n0-10℃', PRIMARY)
arrow(ax, 26.5, 2.45, 26.5, 1.8, label='是')

# 不合格分支
box(ax, 23.5, 1.3, 3.0, 1.0, '不合格品处理', MID_COLOR, DARK_BG)
arrow(ax, 25.9, 2.7, 24.3, 1.8, label='否')

# 最终输出
box(ax, 26.5, -0.5, 3.4, 1.1, '电池厂注液机', '#2C4A6E')
arrow(ax, 26.5, 0.8, 26.5, 0.05)

# ══════════════════════════════════════════════
# 跨子图连接线
# ══════════════════════════════════════════════
ax.annotate('', xy=(7.5, 12.55), xytext=(12.5, 14.75),
    arrowprops=dict(arrowstyle='->', color=PRIMARY, lw=2.5,
                    connectionstyle='angle,angleA=0,angleB=90,rad=0'), zorder=2)

for bx in b_xs:
    ax.annotate('', xy=(14.5, 6.55), xytext=(bx, 8.15),
        arrowprops=dict(arrowstyle='->', color=PRIMARY, lw=2.0,
                        connectionstyle='angle,angleA=-90,angleB=0,rad=5'),
        zorder=2)

ax.annotate('', xy=(22, 3.55), xytext=(20.5, 5.4),
    arrowprops=dict(arrowstyle='->', color=PRIMARY, lw=2.5,
                    connectionstyle='angle,angleA=0,angleB=90,rad=0'), zorder=2)

plt.tight_layout(pad=1.5)
out_path = r'D:\trae\AI Daily report\flowchart.png'
plt.savefig(out_path, dpi=180, bbox_inches='tight',
            facecolor='white', edgecolor='none')
print(f'已保存: {out_path}')
plt.close()
