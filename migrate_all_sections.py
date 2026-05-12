# -*- coding: utf-8 -*-
"""
migrate_all_sections.py
=======================
将所有历史JSON文件从旧格式迁移到新格式（sections对象→数组），
同时修复乱码（mojibake）。

目标格式（参考 2026-05-11.json）：
- sections: 数组，每项 { dim, title, items: [...] }
- 部门字段: headline, lead_judgment, risk_tip, summary
- 条目字段: title, content, priority, source, url, date, raw
"""
import sys, json, os, re
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

SRC_DIR = Path(r"D:\trae\AI Daily report\reports")

# ============================================================
# dim → 显示标题映射（与 index_v3.html ORDERED_DIMS 一致）
# ============================================================
DIM_LABEL_MAP = {
    "topnews": ("📌", "今日要报"),
    "市场":    ("📊", "市场/价格"),
    "政策":    ("📜", "政策/行业"),
    "竞品":   ("🔥", "企业动态"),
    "前沿":   ("💻", "技术/产品"),
    "客户":   ("🏗", "项目/招标"),
}

# 旧格式 section key → dim 映射（emoji前缀去掉后的纯中文名）
SEC_KEY_TO_DIM = {
    "政策":    "政策",
    "竞品":   "竞品",
    "客户":   "客户",
    "前沿":   "前沿",
    "市场":    "市场",
    "企业动态": "竞品",
    "技术产品": "前沿",
    "项目招标": "客户",
}

# ============================================================
# 乱码修复（UTF-8 overlong Latin-1 mojibake）
# ============================================================
def fix_mojibake_text(text):
    """修复 UTF-8 overlong Latin-1 乱码"""
    if not isinstance(text, str):
        return text
    try:
        raw = text.encode('latin-1')
    except (UnicodeDecodeError, UnicodeEncodeError):
        return text
    result = bytearray()
    i = 0
    while i < len(raw):
        b = raw[i]
        if b == 0xc3 and i + 1 < len(raw) and 0x80 <= raw[i + 1] <= 0xbf:
            cp = raw[i + 1] - 0x20
            try:
                result.extend(chr(cp).encode('utf-8'))
            except:
                result.extend([raw[i + 1]])
            i += 2
        elif b == 0xc2 and i + 1 < len(raw) and 0x80 <= raw[i + 1] <= 0xbf:
            cp = raw[i + 1]
            try:
                result.extend(chr(cp).encode('utf-8'))
            except:
                result.extend([raw[i + 1]])
            i += 2
        else:
            result.append(b)
            i += 1
    try:
        return result.decode('utf-8')
    except:
        return text

def fix_mojibake_obj(obj):
    """递归修复对象中所有字符串的乱码（包含 dict keys）"""
    if isinstance(obj, str):
        return fix_mojibake_text(obj)
    elif isinstance(obj, list):
        return [fix_mojibake_obj(item) for item in obj]
    elif isinstance(obj, dict):
        return {fix_mojibake_text(str(k)): fix_mojibake_obj(v) for k, v in obj.items()}
    else:
        return obj

# ============================================================
# Section 格式转换：object → array
# ============================================================
def section_key_to_dim(key):
    """把旧 section key（如'政策'、'🔥 企业动态'）映射为 dim"""
    # 去掉 emoji 前缀
    cleaned = re.sub(r'^[\U0001F000-\U0001FFFF]\s*', '', key)
    return SEC_KEY_TO_DIM.get(cleaned, cleaned)

def migrate_sections(sections_obj):
    """
    将旧的 sections 对象格式转换为新格式的数组。
    旧: { "政策": [...items], "竞品": [...items], ... }
    新: [{ dim: "政策", title: "政策/行业", items: [...] }, ...]
    """
    if isinstance(sections_obj, list):
        # 已经是新格式（数组），补充/修正 dim 和 title
        result = []
        for sec in sections_obj:
            if isinstance(sec, dict):
                sec = dict(sec)
                dim = sec.get('dim', '')
                # 补全 dim（从 title 推导）
                if not dim:
                    sec['dim'] = section_key_to_dim(sec.get('title', ''))
                    dim = sec['dim']
                # 补全/修正 title（从 DIM_LABEL_MAP 获取标准显示名）
                icon_label = DIM_LABEL_MAP.get(dim, ('📋', dim))
                sec['title'] = icon_label[1]
                # 补全 items
                if isinstance(sec.get('items'), list):
                    sec['items'] = [migrate_item(it) for it in sec['items']]
            result.append(sec)
        return result

    if not isinstance(sections_obj, dict):
        return []

    result = []
    for key, items in sections_obj.items():
        dim = section_key_to_dim(key)
        icon_label = DIM_LABEL_MAP.get(dim, ('📋', key))
        icon, label = icon_label
        # 迁移 items
        migrated_items = [migrate_item(item) for item in (items or [])]
        result.append({
            "dim": dim,
            "title": label,
            "items": migrated_items,
        })
    return result

def migrate_item(item):
    """迁移单个条目，补全缺失字段"""
    if not isinstance(item, dict):
        return {"title": str(item), "content": "", "priority": "P2",
                "source": "", "url": "", "date": "", "raw": ""}

    # 复制并清理
    new_item = {
        "title":    item.get("title", ""),
        "content":  item.get("content", ""),
        "priority": item.get("priority", "P2"),
        "source":   item.get("source", ""),
        "url":      item.get("url", "#"),
        "date":     item.get("date") or item.get("_date", ""),
        "raw":      item.get("raw", item.get("title", "")),
    }
    return new_item

def migrate_dept(dept):
    """迁移部门数据"""
    # 乱码修复
    dept = fix_mojibake_obj(dept)

    # 补全缺失字段
    if "headline" not in dept:
        dept["headline"] = dept.get("lead", "") or dept.get("lead_judgment", "")
    if "lead_judgment" not in dept:
        dept["lead_judgment"] = dept.get("lead", "") or dept.get("headline", "")
    if "risk_tip" not in dept:
        dept["risk_tip"] = dept.get("risk", "")
    if "summary" not in dept:
        sm = dept.get("summary", "")
        conclusion = dept.get("conclusion", "")
        dept["summary"] = conclusion if not sm else sm

    # 迁移 sections
    if "sections" in dept:
        dept["sections"] = migrate_sections(dept["sections"])

    # 补全 window 字段
    if "window_start" not in dept:
        dept["window_start"] = dept.get("report_date", "")
    if "window_end" not in dept:
        dept["window_end"] = dept.get("report_date", "")

    return dept

def migrate_file(filepath):
    """迁移单个 JSON 文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"  [!] 读取失败 {filepath.name}: {e}")
        return False

    changed = False

    # 迁移 departments
    if "departments" in data and isinstance(data["departments"], dict):
        for dept_id, dept in data["departments"].items():
            old_sections = dept.get("sections")
            dept = migrate_dept(dept)
            data["departments"][dept_id] = dept
            new_sections = dept.get("sections")
            if old_sections != new_sections:
                changed = True

    if not changed:
        # 仍检查乱码
        has_mojibake = False
        try:
            json_str = json.dumps(data, ensure_ascii=False)
            if any(ord(c) > 0xFF for c in json_str if ord(c) > 0x7F):
                has_mojibake = True
        except:
            pass
        if not has_mojibake:
            print(f"  = {filepath.name} (无需迁移)")
            return False

    # 更新 version
    data["version"] = f"migrate_all_sections.py - {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M')}"

    # 写回文件
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  ✓ {filepath.name}")
        return True
    except Exception as e:
        print(f"  [!] 写入失败 {filepath.name}: {e}")
        return False

# ============================================================
# 主流程
# ============================================================
def main():
    print("========== 迁移历史 JSON（sections object → array）==========")

    # 目标日期文件（跳过非日期文件）
    skip_names = {
        "index.json", "policies.json", "market_lc.json", "market_lfp.json",
        "_fetcher_results.json", "cninfo_announcements.json", "collab_status.json",
        "lfp_all_data.json", "lfp_industry_production.json", "lfp_power_history.json",
        "lfp_price_history.json", "lfp_storage_history.json", "lc_futures_history.json",
        "iron_phosphate_history.json", "market_feishu.json", "embed_report.py",
        "write_report.py", "update_all_depts.py", "rebuild_json.py",
        "fix_all字数.py", "fix_company动态.py", "fix_json.py",
        "update_czly.py", "update_depts_final.py", "update_lhy_bych_dhx.py",
        "update_lpsd_felt.py", "update_sdmd_sjld_kls.py", "update_other_depts.py",
        "gen_policies.py", "verify2.txt", "verify3.txt", "verify_0420.txt",
        "verify_czly.txt", "server.log", "market_fetch.log",
        "market_lc_from_akshare.json", "market_lc_from_akshare.json",
        "policies_checkpoint_20260508_chart_fix.json",
        "policies_checkpoint_20260508_pre_rollback.json",
        "_fetcher_results.json",
    }

    # 跳过所有非 2026-MM-DD.json 格式的早报文件
    date_pattern = re.compile(r'^2026-\d{2}-\d{2}\.json$')

    migrated = 0
    skipped = 0

    for fname in sorted(os.listdir(SRC_DIR)):
        if fname in skip_names:
            skipped += 1
            continue
        if not date_pattern.match(fname):
            skipped += 1
            continue

        fpath = SRC_DIR / fname
        if migrate_file(fpath):
            migrated += 1

    print(f"\n迁移完成: {migrated} 个文件已更新, {skipped} 个文件跳过")
    print(f"（建议重新运行 gen_embedded_all.py 生成嵌入版）")

if __name__ == "__main__":
    main()
