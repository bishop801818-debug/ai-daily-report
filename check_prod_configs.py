import json, os

# 直接读取生产配置目录
configs_dir = r"D:\buddy\skills\lithium-division-morning-report\configs"
bu_map = {
    "czly": "常州锂源.json",
    "sdmd": "山东美多.json",
    "sjld": "三金锂电.json",
    "lpsd": "龙蟠时代.json",
    "felt": "法恩莱特.json",
}

for bu_id, fname in bu_map.items():
    path = os.path.join(configs_dir, fname)
    with open(path, "r", encoding="utf-8") as f:
        cfg = json.load(f)
    modules = cfg.get("modules", {})
    policy_kws = modules.get("policy", {}).get("keywords", [])
    print(f"{bu_id}: modules.policy.keywords = {len(policy_kws)}个, 示例: {policy_kws[:3]}")