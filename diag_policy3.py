import json, sys
sys.path.insert(0, r"D:\trae\AI Daily report")
from generate_html_report import classify_module, _get_policy_kw_tables, load_bu_configs, CONFIGS_DIR
import os

configs = load_bu_configs()
kw = _get_policy_kw_tables()

bu_ids = ["czly", "sdmd", "sjld", "lpsd", "felt"]

# 测试几个典型标题
test_titles = [
    # sdmd 真实政策
    "六部门联合印发《新能源汽车废旧动力电池回收和综合利用管理暂行办法》动力电池回收千亿元级市场待启",
    "新能源汽车废旧动力电池回收和综合利用管理暂行办法",
    # 之前误报的文章
    "动力电池市场份额下降，宁德时代进入扩产周期",
    # 之前误报的另一篇
    "是否供应宁德时代、比亚迪等一线主流电池厂商",
    # 典型行业文章（不应该进政策）
    "磷酸铁锂订单爆发万润新能签下宁德时代5年采购大单",
    # 行业新闻
    "龙蟠科技拟投建年产24万吨高压实磷酸铁锂项目",
]

print("=== classify_module 测试（configs 已加载）===\n")
for title in test_titles:
    for bu_id in ["sdmd", "czly"]:
        mod, is_prio = classify_module(title, bu_id, configs)
        tier1 = any(s in title for s in kw["signal_tier1"])
        tier2 = any(s in title for s in kw["signal_tier2"])
        tier3 = any(s in title for s in ["工信部", "发改委", "能源局", "市场监管总局", "财政部", "商务部"])
        core = [k for k in kw["core_all"] if k in title]
        print(f"[{bu_id}] {mod}{'★' if is_prio else ''} | tier1={tier1} tier2={tier2} tier3={tier3} | {title[:40]}")
    print()