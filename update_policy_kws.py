#!/usr/bin/env python3
"""批量更新9个BU配置文件的 policy.keywords：加入政府发文机构词+政策类型宽泛词"""
import json, os

CONFIG_DIR = r"C:\Users\1\.workbuddy\skills\lithium-division-morning-report\configs"

# 每个BU在政策维度需要额外添加的宽泛政策信号词
# 规则：不管BU主赛道是什么，政府发文和通用政策类型词都应纳入
EXTRA_POLICY_KWS = {
    # 政府发文机构（独立政策信号，命中即应进入政策模块）
    "工信部": ["工信部", "工业和信息化部"],
    "发改委": ["发改委", "国家发展改革委", "国家发改委"],
    "能源局": ["能源局", "国家能源局"],
    "市场监管总局": ["市场监管总局", "国家市场监管总局", "市场监督管理总局"],
    "财政部": ["财政部", "国务院财政部"],
    "商务部": ["商务部"],
    "生态环境部": ["生态环境部"],
    "交通运输部": ["交通运输部"],
    # 通用政策类型词（政策发文特征）
    "政策类型": [
        "行业规范条件",
        "管理暂行办法",
        "实施办法",
        "行动方案",
        "指导意见",
        "补贴政策",
        "征求意见稿",
        "标准体系",
        "规范公告",
        "实施细则",
        "公告",
        "通知",
        "办法",
        "规划",
        "路线图"
    ]
}

# 统一追加到所有BU的 extra_policy_keywords
UNIVERSAL_POLICY_KWS = (
    ["工信部", "工业和信息化部", "发改委", "国家发展改革委", "国家发改委",
     "能源局", "国家能源局", "市场监管总局", "国家市场监管总局",
     "财政部", "国务院财政部", "商务部", "生态环境部", "交通运输部",
     "行业规范条件", "管理暂行办法", "实施办法", "行动方案",
     "指导意见", "补贴政策", "征求意见稿", "标准体系",
     "规范公告", "实施细则", "公告", "通知", "办法", "规划", "路线图"]
)

def update_config(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    # 找到 policy 模块
    modules = cfg.get("modules", {})
    policy = modules.get("policy", {})
    if not policy:
        print(f"  [SKIP] {os.path.basename(filepath)}: no policy module")
        return

    existing_kws = policy.get("keywords", [])
    existing_set = set(existing_kws)

    # 追加新词（去重）
    new_kws = [k for k in UNIVERSAL_POLICY_KWS if k not in existing_set]
    if new_kws:
        policy["keywords"] = existing_kws + new_kws
        modules["policy"] = policy
        cfg["modules"] = modules

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(cfg, f, ensure_ascii=False, indent=2)
        print(f"  [OK] {os.path.basename(filepath)}: +{len(new_kws)} words: {new_kws[:5]}...")
    else:
        print(f"  [SAME] {os.path.basename(filepath)}: no new words added")

def main():
    files = [f for f in os.listdir(CONFIG_DIR) if f.endswith(".json")]
    print(f"Updating {len(files)} config files in {CONFIG_DIR}")
    for fname in files:
        update_config(os.path.join(CONFIG_DIR, fname))

if __name__ == "__main__":
    main()