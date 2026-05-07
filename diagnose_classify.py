#诊断：验证两个错误条目的 module 判断路径
import sys
sys.path.insert(0, r"D:\trae\AI Daily report")

from generate_html_report import _build_policy_kw_tables, classify_module, get_bu_keywords
import json

kw = _build_policy_kw_tables()

test_texts = [
    # 竞品内容被误判为政策
    "动力电池市场份额下降，宁德时代进入扩产周期",
    # 客户Q&A被误判为政策
    "是否供应宁德时代、比亚迪等一线主流电池厂商",
    # 真实的政策新闻（应该被判为政策）
    "六部门联合印发新能源汽车废旧动力电池回收和综合利用管理暂行办法",
    # 真正应该判为竞品的内容
    "宁德时代拟在上海投资建设储能电池项目",
]

print("=== classify_module 诊断 ===\n")
for text in test_texts:
    # 检查各层命中
    tier1_hit = any(s in text for s in kw["signal_tier1"])
    tier2_hit = any(s in text for s in kw["signal_tier2"])
    tier3_gov = any(s in text for s in ["工信部", "发改委", "能源局", "市场监管总局", "财政部", "商务部"])
    core_downstream = [k for k in kw["core_downstream"] if k in text]
    file_prio = [k for k in kw["file_priority_kws"] if k in text]

    mod, is_prio = classify_module(text, "czly", {})

    print(f"文本: {text[:40]}...")
    print(f"  tier1命中: {tier1_hit} | tier2命中: {tier2_hit} | tier3政府: {tier3_gov}")
    print(f"  core命中: {core_downstream[:3] if core_downstream else '无'}")
    print(f"  文件高优: {file_prio[:2] if file_prio else '无'}")
    print(f"  → 判定为: {mod} (is_priority={is_prio})")
    print()