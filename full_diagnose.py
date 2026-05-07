import json, sys, os

# 直接加载生产配置
PROD_CONFIG_DIR = r"D:\buddy\skills\lithium-division-morning-report\configs"

bu_map = {
    "czly": "常州锂源.json", "sdmd": "山东美多.json",
    "sjld": "三金锂电.json", "lpsd": "龙蟠时代.json", "felt": "法恩莱特.json",
    "kls": "可兰素.json", "lhy": "润滑油.json", "dhx": "迪克化学.json", "bych": "铂源催化.json",
}

def load_prod_configs():
    configs = {}
    for bu_id, fname in bu_map.items():
        path = os.path.join(PROD_CONFIG_DIR, fname)
        with open(path, "r", encoding="utf-8") as f:
            configs[bu_id] = json.load(f)
    return configs

configs = load_prod_configs()

# 读取 search_results.json
with open(r"D:\trae\AI Daily report\search_results.json", "r", encoding="utf-8") as f:
    raw = json.load(f)

print(f"总原始条目: {len(raw)}")

# ============================================================
# 模拟 get_bu_keywords + match_items + classify_module 全流程
# ============================================================
import re
from datetime import datetime

TODAY = datetime(2026, 4, 12)
DATE_STR = "2026-04-12"

def _calc_confidence(date_str):
    if not date_str:
        return "low"
    try:
        ds = date_str.strip()
        if re.match(r"\d{4}-\d{2}-\d{2}", ds):
            item_date = datetime.strptime(ds[:10], "%Y-%m-%d")
        else:
            return "low"
        days_ago = (TODAY - item_date).days
        if days_ago <= 2:
            return "high"
        elif days_ago <= 5:
            return "medium"
        else:
            return "low"
    except:
        return "medium"

def get_bu_keywords_prod(bu_id, configs):
    cfg = configs[bu_id]
    kws = set(cfg.get("search", {}).get("core_keywords", []))
    kws.update(cfg.get("division_profile", {}).get("keywords_alias", []))
    mod_cfg = cfg.get("modules", {})
    for mod_key, mod_val in mod_cfg.items():
        if isinstance(mod_val, dict) and mod_key != "dimension_order":
            kws.update(mod_val.get("keywords", []))
    return list(kws)

# 全局行业关键词
GLOBAL_IND_KWS = [
    "锂电池", "锂离子电池", "动力电池", "储能电池", "新能源电池",
    "锂电", "电化学储能", "新型储能",
    "行业规范", "管理办法", "废旧动力电池", "新能源汽车", "磷酸铁锂",
]

def match_and_classify(bu_id):
    keywords = get_bu_keywords_prod(bu_id, configs)
    all_kws = keywords + GLOBAL_IND_KWS

    items_by_mod = {}
    for item in raw:
        title = item.get("title", "")
        content = item.get("content", "") or ""
        combined = title + " " + content

        hit = any(kw in combined for kw in all_kws)
        if not hit:
            continue

        url = item.get("url", "") or ""
        if url.lower().endswith(".pdf"):
            continue

        uid = url + title
        conf = _calc_confidence(item.get("date", ""))

        # 简单分类
        mod = "unknown"
        if "六部门" in title or "工信部" in title or "发改委" in title or "办法" in title:
            mod = "policy"
        elif any(c in title for c in ["宁德时代", "比亚迪", "亿纬", "国轩"]):
            mod = "competitor"
        elif "是否" in title and ("供应" in title or "配套" in title):
            mod = "customer"

        items_by_mod.setdefault(mod, []).append({
            "title": title[:50], "conf": conf, "url": url[:60]
        })

    return items_by_mod

print("\n=== 各 BU 分类诊断 ===")
for bu_id in ["czly", "sdmd", "sjld", "lpsd", "felt"]:
    print(f"\n{bu_id}:")
    mods = match_and_classify(bu_id)
    for mod, items in sorted(mods.items()):
        print(f"  {mod}: {len(items)}条")
        for it in items[:2]:
            print(f"    [{it['conf']}] {it['title']}")

# 详细检查 sdmd 的"六部门"条目
print("\n=== sdmd 中与'六部门'相关的条目 ===")
for item in raw:
    title = item.get("title","")
    if "六部门" in title or "废旧动力电池回收" in title:
        print(f"  {title[:80]}")
        print(f"    content: {(item.get('content') or '')[:60]}")