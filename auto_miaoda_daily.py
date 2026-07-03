#!/usr/bin/env python3
"""AI 早报自动发布到妙搭"""
import os, shutil, subprocess, json, glob
from datetime import datetime

BASE = "D:/trae/AI Daily report"
DST = BASE + "/dist-miaoda"
APP = "app_4k7069448fj88"

FILES = [
    "index_v3.html",
    # 核心子页面
    "archive_v3.html", "dept-archive.html", "industry_news_embedded.html", "help.html",
    "analysis_hub.html", "strategy_hub.html", "radar_hub.html", "database_hub.html",
    "toolbox.html", "bu_hub.html",
    # 数据页面
    "automotive_data_v2.html", "carbonate_data_v2.html",
    "electrolyte_data_v2.html", "lfp_data_v2.html",
    "lib_battery_data_v2.html", "recycling_data_v2.html", "ternary_data_v2.html",
    # 报告页面
    "lfp_report.html", "lfp_report_2026_05_v2.html", "electrolyte_report.html",
    "carbonate_report_202605.html", "felt_report_202604.html", "felt_report_202605.html",
    "lib_battery_analysis.html",
    # 图表页面
    "automotive_charts.html", "carbonate_charts.html",
    "electrolyte_charts.html", "lfp_charts.html",
    "lib_battery_charts.html", "recycling_charts.html", "ternary_charts.html",
    # 雷达详情页
    "radar_detail.html", "radar_detail_czly.html", "radar_detail_dkhx.html",
    "radar_detail_felt.html", "radar_detail_kelan.html", "radar_detail_lhy.html",
    "radar_detail_lpsd.html", "radar_detail_lubricant.html", "radar_detail_sdmd.html", "radar_detail_sjld.html",
    # 数据文件
    "electrolyte_data.js", "recycling_data_v2.js", "chemical_data.js", "recycling_gantt.js",
    "hot_news_data.json", "bu_logos.json", "lib_battery_all_data.json",
    # 产业链全景图核心数据文件（根目录）
    "lfp_all_data.json",
    # 以下文件在 reports/ 子目录，由第5步报告复制逻辑覆盖
]

def log(m): print(f"[{datetime.now().strftime('%H:%M:%S')}] {m}")

def main():
    log("=" * 60)
    log("AI 早报自动发布")
    log("=" * 60)

    # 1. 清空目标目录
    if os.path.exists(DST): shutil.rmtree(DST)
    os.makedirs(DST, exist_ok=True)

    # 2. 复制主页面（改名为 index.html）
    shutil.copy2(BASE + "/index_v3.html", DST + "/index.html")
    log("✅ index.html")

    # 3. 复制子页面和依赖文件
    for f in FILES[1:]:
        src = BASE + "/" + f
        if os.path.exists(src):
            shutil.copy2(src, DST + "/" + f)
            log(f"✅ {f}")

    # 3.1 复制 inline_*.js 文件（HTML轻量化后的外部脚本依赖）
    inline_js_files = glob.glob(BASE + "/inline_*.js")
    for f in inline_js_files:
        fname = os.path.basename(f)
        shutil.copy2(f, DST + "/" + fname)
        log(f"✅ {fname} (轻量化依赖)")
    if not inline_js_files:
        log("⚠️  未找到 inline_*.js 文件（HTML可能未轻量化）")
    
    # 3.2 复制 embedded/inline_*.js 文件（离线部署版本的依赖）
    embedded_js_files = glob.glob(BASE + "/embedded/inline_*.js")
    if embedded_js_files:
        os.makedirs(DST + "/embedded", exist_ok=True)
        for f in embedded_js_files:
            fname = os.path.basename(f)
            shutil.copy2(f, DST + "/embedded/" + fname)
            log(f"✅ embedded/{fname} (离线版依赖)")
        log(f"✅ 共复制 {len(embedded_js_files)} 个离线版 JS 依赖")

    # 4. 复制 assets/
    if os.path.exists(BASE + "/assets"):
        if os.path.exists(DST + "/assets"): shutil.rmtree(DST + "/assets")
        shutil.copytree(BASE + "/assets", DST + "/assets")
        log("✅ assets/")
        
        # 4.1 删除超大文件（妙搭限制 20MB）
        oversize_files = [
            "dragon_4combined_anim.gif",  # 97MB
            "dragon_single_anim.gif",       # 9.2MB (可选)
        ]
        for fname in oversize_files:
            fpath = DST + "/assets/" + fname
            if os.path.exists(fpath):
                fsize = os.path.getsize(fpath)
                if fsize > 20 * 1024 * 1024:  # 20MB
                    os.remove(fpath)
                    log(f"⚠️  已删除超大文件：{fname} ({fsize//1024//1024}MB)")

    # 4.2 复制 data/ 目录（市场行情监控数据源）
    if os.path.exists(BASE + "/data"):
        if os.path.exists(DST + "/data"): shutil.rmtree(DST + "/data")
        shutil.copytree(BASE + "/data", DST + "/data")
        log("✅ data/")
        
        # 4.21 删除大文件（>1MB，妙搭限制 20MB）
        data_dst = DST + "/data"
        for root, dirs, files in os.walk(data_dst):
            for f in files:
                fp = os.path.join(root, f)
                fsize = os.path.getsize(fp)
                if fsize > 1 * 1024 * 1024:
                    os.remove(fp)
                    log(f"⚠️  已删除大文件：{f} ({fsize//1024//1024}MB)")
    
    # 4.3 复制根目录数据文件（市场行情监控）
    root_data_files = [
        "carbonate_spot_price_merged.json",
        "carbonate_spot_price_jin10.json",
        "phosphate_rock_price.json",
        "phosphate_rock_price_jin10.json",
        "lib_battery_all_data.json",
    ]
    for fname in root_data_files:
        src = BASE + "/" + fname
        if os.path.exists(src):
            shutil.copy2(src, DST + "/" + fname)
            log(f"✅ {fname}")

    # 4.4 复制 generated-images/ 目录（热点新闻配图）
    if os.path.exists(BASE + "/generated-images"):
        os.makedirs(DST + "/generated-images", exist_ok=True)
        # 只复制 WebP 文件（PNG/JPG 已弃用，文件太大）
        for fname in os.listdir(BASE + "/generated-images"):
            if fname.endswith('.webp'):
                src = BASE + "/generated-images/" + fname
                dst = DST + "/generated-images/" + fname
                shutil.copy2(src, dst)
        log("✅ generated-images/")

    # 5. 复制最新7天报告
    os.makedirs(DST + "/reports", exist_ok=True)
    try:
        with open(BASE + "/reports/index.json", "r", encoding="utf-8") as fp:
            dates = json.load(fp).get("available_dates", [])[:7]
            for d in dates:
                src = BASE + "/reports/" + d + ".json"
                if os.path.exists(src):
                    shutil.copy2(src, DST + "/reports/" + d + ".json")
            log(f"✅ 报告（最近{len(dates)}天）")
    except Exception as e:
        log(f"⚠️  复制报告失败：{e}")

    # 6. 发布到妙搭
    log("🚀 发布到妙搭...")
    cmd = f'cd "{BASE}" && lark-cli apps +html-publish --app-id {APP} --path dist-miaoda'
    
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, encoding='utf-8', errors='ignore', timeout=300)
        
        # 解析JSON输出
        if r.stdout:
            try:
                result = json.loads(r.stdout)
                if result.get("ok") == True:
                    app_url = result.get("data", {}).get("url", "")
                    log("✅ 发布成功！")
                    log(f"   应用ID：{APP}")
                    log(f"   应用URL：{app_url}")
                else:
                    error_msg = result.get("error", {}).get("message", "未知错误")
                    log(f"❌ 发布失败：{error_msg}")
                    return 1
            except json.JSONDecodeError:
                # 如果不是JSON，检查returncode
                if r.returncode == 0:
                    log("✅ 发布成功！")
                    log(f"   应用ID：{APP}")
                else:
                    log(f"❌ 发布失败：{r.stderr}")
                    return 1
        else:
            # 没有输出，检查returncode
            if r.returncode == 0:
                log("✅ 发布成功！")
                log(f"   应用ID：{APP}")
            else:
                log(f"❌ 发布失败：{r.stderr}")
                return 1
                
    except subprocess.TimeoutExpired:
        log("❌ 发布超时（>300秒）")
        return 1
    except Exception as e:
        log(f"❌ 发布异常：{e}")
        return 1

    log("=" * 60)
    log("✅ 全部完成！")
    log("=" * 60)

if __name__ == "__main__":
    main()
