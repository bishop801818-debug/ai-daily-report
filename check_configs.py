import sys
sys.path.insert(0, r"D:\trae\AI Daily report")
from generate_html_report import load_bu_configs, _build_policy_kw_tables

configs = load_bu_configs()
kw_tables = _build_policy_kw_tables()

print("=== 配置加载情况 ===")
print("BU IDs:", list(configs.keys()))

czly_cfg = configs.get("常州锂源", {})
print("\n常州锂源 top-level keys:", list(czly_cfg.keys()))

modules = czly_cfg.get("modules", {})
print("modules keys:", list(modules.keys()))

policy_mod = modules.get("policy", {})
print("modules.policy keys:", list(policy_mod.keys()))
print("policy.keywords count:", len(policy_mod.get("keywords", [])))
print("policy.keywords sample:", policy_mod.get("keywords", [])[:5])

# global keywords
global_kws = kw_tables["signal_all"]
print("\nglobal_ind_kws total:", len(global_kws))
print("global sample:", global_kws[:5])

# 检查 废旧动力电池 是否在 global keywords 中
test_kws = ["废旧动力电池", "动力电池回收", "新能源汽车", "六部门", "回收和综合利用"]
for kw in test_kws:
    found = kw in global_kws
    print(f"  '{kw}' in global_kws: {found}")