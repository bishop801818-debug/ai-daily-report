#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
多妙搭应用发布（按飞书部门组织架构实现子页面权限控制，免后端）。

设计：
  - 每个事业部一个妙搭应用，飞书原生 access-scope 限制"谁能打开该应用"。
  - 每个应用注入 window.APP_BU（由发布脚本按应用写入），inline_auth.js 据此
    在应用【内】隐藏跨事业部页面（飞书已保证进来的是本部门的人，无需查飞书/后端）。
  - 公共应用 APP_BU='public'，不匹配任何 allowed_bus → 仅显示开放页。

依赖：lark-cli 已登录（feishu 连接器）。

用法：
  python publish_multi_app.py            # 真实建应用+发布+设访问范围
  python publish_multi_app.py --dry-run  # 仅预演（构建+打印计划，不创建/发布/设范围）
"""
import os, shutil, subprocess, json, glob, io, tarfile, gzip, re, sys, shlex
from datetime import datetime

BASE = "D:/trae/AI Daily report"

# ============ 7 个应用配置 ============
# bu: 注入到 window.APP_BU 的值（'public' 表示公共应用）
# app_id: 已知则复用；None 则创建新应用（创建后写入 app_ids.json 复用）
# scope / dept_ids: 飞书 access-scope 配置
APP_CONFIGS = [
    {'bu': 'public', 'name': '龙蟠科技AI战略信息中台（公共）',
     'app_id': 'app_4k7069448fj88', 'scope': 'tenant', 'dept_ids': []},
    {'bu': 'sdmd', 'name': '锂电产业链早报·山东美多',
     'app_id': 'app_179kjgvrq6g', 'scope': 'specific',
     'dept_ids': ['od-05e668aea865f92b574f366b3d976094']},   # 宜春美多锂业
    {'bu': 'felt', 'name': '锂电产业链早报·法恩莱特',
     'app_id': None, 'scope': 'specific',
     'dept_ids': ['od-2e6cc0918fbe3086ebf636680997a2f2']},   # 法恩莱特
    {'bu': 'czly', 'name': '锂电产业链早报·碳酸锂',
     'app_id': None, 'scope': 'specific',
     'dept_ids': ['od-349632b3f04edaa205990f6c96e66c26',
                  'od-c36a380b50b52171d47b7a8f5c1f3a70']},   # 宜春龙蟠时代锂业 + 龙蟠时代
    {'bu': 'lpsd', 'name': '锂电产业链早报·锂源',
     'app_id': None, 'scope': 'specific',
     'dept_ids': ['od-c8c5bc8612d60825208196a97cd0686d']},   # 常州锂源事业部（含三元/锂电/回收）
    {'bu': 'dhx', 'name': '锂电产业链早报·迪克',
     'app_id': None, 'scope': 'specific',
     'dept_ids': ['od-7a313bc06887dc30349237cb0d64ce83']},   # 张家港迪克
    {'bu': 'sjld', 'name': '锂电产业链早报·三金',
     'app_id': None, 'scope': 'specific',
     'dept_ids': ['od-310bdafba6cb5bdbd3300cf326878caa']},   # 江苏三金锂电
]

# ============ 发布文件清单（复用测试版完整清单）============
FILES = [
    "index_v3.html",
    "auth_policy.js", "inline_auth.js", "feishu-jsapi.js",
    "archive_v3.html", "dept-archive.html", "industry_news_embedded.html", "policy_center_v4.html", "help.html",
    "analysis_hub.html", "strategy_hub.html", "strategy_dashboard.html", "radar_hub.html", "database_hub.html",
    "toolbox.html", "bu_hub.html",
    "automotive_data_v2.html", "carbonate_data_v2.html",
    "electrolyte_data_v2.html", "lfp_data_v2.html",
    "lib_battery_data_v2.html", "recycling_data_v2.html", "ternary_data_v2.html",
    "lfp_report.html", "lfp_report_2026_05_v2.html", "electrolyte_report.html",
    "carbonate_report_202605.html", "felt_report_202604.html", "felt_report_202605.html",
    "automotive_report_202605.html", "carbonate_analysis.html", "lfp_report_2026_04.html", "ternary_report_202605.html",
    "lib_battery_analysis.html",
    "automotive_charts.html", "carbonate_charts.html",
    "electrolyte_charts.html", "lfp_charts.html",
    "lib_battery_charts.html", "recycling_charts.html", "ternary_charts.html",
    "radar_detail.html", "radar_detail_czly.html", "radar_detail_dkhx.html",
    "radar_detail_felt.html", "radar_detail_kelan.html", "radar_detail_lhy.html",
    "radar_detail_lpsd.html", "radar_detail_lubricant.html", "radar_detail_sdmd.html", "radar_detail_sjld.html",
    "electrolyte_data.js", "recycling_data_v2.js", "chemical_data.js", "recycling_gantt.js", "latest_data.js",
    "hot_news_data.json", "bu_logos.json", "lib_battery_all_data.json",
    "echarts.min.js", "chart.min.js", "html2canvas.min.js", "xlsx.full.min.js", "jspdf.umd.min.js",
    "automotive_embedded_data.js", "carbonate_embedded_data.js", "electrolyte_embedded_data.js",
    "lfp_embedded_data.js", "lib_battery_embedded_data.js", "recycling_embedded_data.js",
    "ternary_embedded_data.js",
    "shared_nav.css",
    "lfp_all_data.json",
]

def log(m): print(f"[{datetime.now().strftime('%H:%M:%S')}] {m}")


def check_size_budget(dist_dir):
    """模拟妙搭打包（tar.gz）体积，返回 MB；失败返回 None。"""
    try:
        buf = io.BytesIO()
        with tarfile.open(fileobj=buf, mode='w', format=tarfile.USTAR_FORMAT) as tar:
            for root, dirs, files in os.walk(dist_dir):
                for f in files:
                    fp = os.path.join(root, f)
                    arcname = os.path.relpath(fp, dist_dir)
                    try:
                        tar.add(fp, arcname=arcname)
                    except Exception:
                        pass
        tar_bytes = buf.getvalue()
        gz_buf = io.BytesIO()
        with gzip.GzipFile(fileobj=gz_buf, mode='wb', mtime=0, compresslevel=6) as gz:
            gz.write(tar_bytes)
        return len(gz_buf.getvalue()) / (1024 * 1024)
    except Exception as e:
        print(f"[体积检测异常] {e}")
        return None


def build_dist(dst):
    """构建单个应用的基础目录（Serving 模式：inline_01.js 的 DATA_BASE→'.'）。"""
    os.makedirs(dst, exist_ok=True)

    # 主页面
    shutil.copy2(BASE + "/index_v3.html", dst + "/index.html")
    shutil.copy2(BASE + "/index_v3.html", dst + "/index_v3.html")

    # FILES 清单
    for f in FILES[1:]:
        src = BASE + "/" + f
        if os.path.exists(src):
            shutil.copy2(src, dst + "/" + f)

    # inline_*.js（轻量化依赖）
    for f in glob.glob(BASE + "/inline_*.js"):
        shutil.copy2(f, dst + "/" + os.path.basename(f))

    # embedded/inline_*.js + embedded/*_embedded_data.js
    os.makedirs(dst + "/embedded", exist_ok=True)
    for f in glob.glob(BASE + "/embedded/inline_*.js"):
        shutil.copy2(f, dst + "/embedded/" + os.path.basename(f))
    for f in glob.glob(BASE + "/embedded/*_embedded_data.js"):
        shutil.copy2(f, dst + "/embedded/" + os.path.basename(f))

    # 修补 inline_01.js DATA_BASE → '.'（Serving 模式必需）
    inline_01 = dst + "/inline_01.js"
    if os.path.exists(inline_01):
        with open(inline_01, 'r', encoding='utf-8') as f:
            c = f.read()
        old = "'https://bishop801818-debug.github.io/ai-daily-report"
        new = "'.'  /* Serving模式：相对路径'.' */"
        if old in c:
            c = c.replace(old, new, 1)
            with open(inline_01, 'w', encoding='utf-8') as f:
                f.write(c)
            log("✅ inline_01.js 修补（DATA_BASE→'.'）")

    # assets/
    if os.path.exists(BASE + "/assets"):
        shutil.copytree(BASE + "/assets", dst + "/assets")
        oversize = ["dragon_4combined_anim.gif", "dragon_single_anim.gif"]
        for fn in oversize:
            fp = dst + "/assets/" + fn
            if os.path.exists(fp) and os.path.getsize(fp) > 20 * 1024 * 1024:
                os.remove(fp)
        # 清理未引用图片（孤儿）
        img_exts = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp")
        referenced = set()
        for root, dirs, files in os.walk(dst):
            for ff in files:
                if ff.endswith((".html", ".js", ".css")):
                    try:
                        with open(os.path.join(root, ff), "r", encoding="utf-8", errors="ignore") as fh:
                            content = fh.read()
                        for m in re.findall(r'[\w\-./]+\.(?:png|jpe?g|gif|webp|svg|bmp)', content, re.I):
                            referenced.add(os.path.basename(m).lower())
                    except Exception:
                        pass
        adir = dst + "/assets"
        if os.path.isdir(adir):
            for ff in os.listdir(adir):
                fp = os.path.join(adir, ff)
                if os.path.isfile(fp) and ff.lower().endswith(img_exts) and ff.lower() not in referenced:
                    os.remove(fp)

    # data/ + 根目录数据文件
    if os.path.exists(BASE + "/data"):
        shutil.copytree(BASE + "/data", dst + "/data")
        for root, dirs, files in os.walk(dst + "/data"):
            for f in files:
                fp = os.path.join(root, f)
                if os.path.getsize(fp) > 1 * 1024 * 1024:
                    os.remove(fp)
    for fn in ["carbonate_spot_price_merged.json", "carbonate_spot_price_jin10.json",
               "phosphate_rock_price.json", "phosphate_rock_price_jin10.json", "lib_battery_all_data.json"]:
        src = BASE + "/" + fn
        if os.path.exists(src):
            shutil.copy2(src, dst + "/" + fn)

    # 看板/全景数据（根目录，>1MB 不能放 data/）
    for fn, src in [("ternary_all_data.json", BASE + "/dist/ternary_all_data.json"),
                    ("carbonate_all_data.json", BASE + "/dist/carbonate_all_data.json"),
                    ("electrolyte_all_data.json", BASE + "/dist/electrolyte_all_data.json"),
                    ("recycling_all_data.json", BASE + "/dist/recycling_all_data.json")]:
        if os.path.exists(src):
            shutil.copy2(src, dst + "/" + fn)
        else:
            log(f"⚠️  缺失看板数据：{src}")

    # generated-images/
    if os.path.exists(BASE + "/generated-images"):
        os.makedirs(dst + "/generated-images", exist_ok=True)
        for fn in os.listdir(BASE + "/generated-images"):
            if fn.endswith('.webp'):
                shutil.copy2(BASE + "/generated-images/" + fn, dst + "/generated-images/" + fn)

    # reports/（索引 + 近7天 + 历史数据）
    os.makedirs(dst + "/reports", exist_ok=True)
    idx_src = BASE + "/reports/index.json"
    if os.path.exists(idx_src):
        shutil.copy2(idx_src, dst + "/reports/index.json")
        try:
            dates = json.load(open(idx_src, encoding="utf-8")).get("available_dates", [])[:7]
            for d in dates:
                s = BASE + "/reports/" + d + ".json"
                if os.path.exists(s):
                    shutil.copy2(s, dst + "/reports/" + d + ".json")
        except Exception as e:
            log(f"⚠️  复制报告失败：{e}")
        dp = re.compile(r'^\d{4}-\d{2}-\d{2}\.json$')
        for fn in sorted(os.listdir(BASE + "/reports")):
            if fn.endswith('.json') and not dp.match(fn) and fn != 'index.json':
                s = BASE + "/reports/" + fn
                if not os.path.exists(dst + "/reports/" + fn):
                    shutil.copy2(s, dst + "/reports/" + fn)


def inject_app_bu(dst, bu):
    """在每个 html 中注入 window.APP_BU（置于 auth_policy.js 之前）。"""
    marker = '<script src="auth_policy.js"></script>'
    n = 0
    for root, dirs, files in os.walk(dst):
        for f in files:
            if not f.endswith('.html'):
                continue
            fp = os.path.join(root, f)
            with open(fp, 'r', encoding='utf-8') as fh:
                c = fh.read()
            if marker in c:
                c = c.replace(marker, "<script>window.APP_BU='%s';</script>\n    %s" % (bu, marker), 1)
                with open(fp, 'w', encoding='utf-8') as fh:
                    fh.write(c)
                n += 1
    log(f"✅ 注入 APP_BU='{bu}' 到 {n} 个 html")


def _quote(a):
    # Windows cmd.exe（shell=True）只认双引号；shlex.quote 产生的单引号在 cmd 下失效，
    # 会导致含空格的路径（如 "AI Daily report"）被拆成多个位置参数。
    return '"' + a + '"' if ' ' in a else a

def run_cli(args, dry_run=False):
    cmd = 'lark-cli ' + ' '.join(_quote(a) for a in args)
    if dry_run:
        print('  [DRY-RUN] ' + cmd)
        return True, {}
    r = subprocess.run(cmd, shell=True, capture_output=True, encoding='utf-8', errors='ignore', timeout=300)
    try:
        data = json.loads(r.stdout or '{}')
    except Exception:
        data = {}
    ok = (r.returncode == 0) and (data.get('ok') in (True, None,))
    if not ok:
        log(f"  ⚠️  CLI 返回非预期：rc={r.returncode} err={r.stderr[:300]}")
    return ok, data


def ensure_app_id(cfg, dry_run):
    if cfg.get('app_id'):
        return cfg['app_id']
    ok, data = run_cli(['apps', '+create', '--name', cfg['name'], '--app-type', 'html'], dry_run)
    if dry_run:
        return '<NEW-ID>'
    if not ok:
        log(f"  ❌ 创建应用失败：{cfg['name']}")
        return None
    app_id = data.get('data', {}).get('app', {}).get('app_id')
    if not app_id:
        log(f"  ❌ 未取到 app_id：{data}")
        return None
    cfg['app_id'] = app_id
    log(f"  ✅ 已创建应用 {cfg['name']} → {app_id}")
    return app_id


def publish(app_id, dst, dry_run):
    # 飞书 CLI 要求 --path 为「当前目录内的相对路径」，故先 cd 到 dst 再用 '.'
    cd_dst = dst.replace('/', '\\')
    cmd = f'cd /d "{cd_dst}" && lark-cli apps +html-publish --app-id {app_id} --path .'
    if dry_run:
        print('  [DRY-RUN] ' + cmd)
        return True
    r = subprocess.run(cmd, shell=True, capture_output=True, encoding='utf-8', errors='ignore', timeout=300)
    try:
        data = json.loads(r.stdout or '{}')
    except Exception:
        data = {}
    ok = (r.returncode == 0) and (data.get('ok') in (True, None,))
    if ok:
        log(f"  ✅ 发布成功 → {data.get('data', {}).get('url', app_id)}")
    else:
        log(f"  ❌ 发布失败：{app_id} rc={r.returncode} err={r.stderr[:300]}")
    return ok


def set_scope(cfg, app_id, dry_run):
    if cfg['scope'] == 'tenant':
        ok, _ = run_cli(['apps', '+access-scope-set', '--app-id', app_id, '--scope', 'tenant'], dry_run)
        log(f"  {'✅' if ok or dry_run else '❌'} 访问范围=tenant(全员)")
    else:
        targets_json = json.dumps([{'type': 'department', 'id': d} for d in cfg['dept_ids']], ensure_ascii=False, separators=(',', ':'))
        # Windows cmd 会吃掉 JSON 内层双引号：外层加双引号，内层双引号转义为 \"
        targets_arg = '"' + targets_json.replace('\\', '\\\\').replace('"', '\\"') + '"'
        ok, _ = run_cli(['apps', '+access-scope-set', '--app-id', app_id, '--scope', 'specific',
                         '--targets', targets_arg], dry_run)
        log(f"  {'✅' if ok or dry_run else '❌'} 访问范围=specific {cfg['dept_ids']}")


def main():
    dry = '--dry-run' in sys.argv
    log("=" * 60)
    log("多妙搭应用发布（免后端权限）" + (" [DRY-RUN]" if dry else ""))
    log("=" * 60)

    ids_file = BASE + "/app_ids.json"
    persisted = {}
    if os.path.exists(ids_file):
        try:
            persisted = json.load(open(ids_file, encoding='utf-8'))
        except Exception:
            persisted = {}
    for cfg in APP_CONFIGS:
        if not cfg.get('app_id') and cfg['bu'] in persisted:
            cfg['app_id'] = persisted[cfg['bu']]

    # 1. 构建基础目录（仅一次，使用唯一时间戳目录，避免删除旧目录触发沙箱拦截）
    ts = datetime.now().strftime('%Y%m%d%H%M%S')
    base = BASE + f"/dist-multi-base-{ts}"
    log("🔧 构建基础目录 ...")
    build_dist(base)
    sz = check_size_budget(base)
    if sz:
        log(f"   基础包体积 {sz:.2f} MB（占 20MB 上限 {sz/20*100:.0f}%）")

    # 2. 逐应用：复制→注入→发布→设范围
    for cfg in APP_CONFIGS:
        log(f"\n=== 应用 {cfg['name']} (bu={cfg['bu']}) ===")
        app_id = ensure_app_id(cfg, dry)
        if not app_id:
            continue
        dst = BASE + f"/dist-app-{cfg['bu']}-{ts}"
        shutil.copytree(base, dst)
        inject_app_bu(dst, cfg['bu'])
        size = check_size_budget(dst)
        if size and size > 18.5:
            log(f"  ❌ 体积安全网拦截：{size:.2f} MB > 18.5MB")
            continue
        elif size:
            log(f"  ℹ️ 包体积 {size:.2f} MB")
        publish(app_id, dst, dry)
        set_scope(cfg, app_id, dry)
        persisted[cfg['bu']] = app_id
        if not dry:
            json.dump(persisted, open(ids_file, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

    log("\n" + "=" * 60)
    log("✅ 全部完成" + (" [DRY-RUN]" if dry else ""))
    log("=" * 60)


if __name__ == "__main__":
    main()
