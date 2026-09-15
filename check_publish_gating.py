#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check_publish_gating.py —— 发布前门禁完整性校验（轻量只读）

目的：
  在把 dist-miaoda-test 发布到妙搭 app_179kjgvrq6g 之前，拦截任何「门禁丢失」的包，
  避免把无权限控制的子页面发到线上（权限系统悄无声息失效）。
  与 sync_miaoda_data.py 的防线互补：sync 防线管「本地→dist 同步」是否冲掉门禁；
  本脚本管「发布链路」是否把无门禁版发到线上。
  两者都遵循业务硬约束：宁可保留线上旧版本，也不发布坏的/无门禁的版本。

阶段A 改造（2026-08-05）：
  A1 基准外置：门禁页清单从硬编码常量 GATED_PAGES 改为外部数据文件 gated_baseline.json。
      更新清单 = 改数据文件（diff 清晰、不碰逻辑代码），不再手改源码。
  A2 反向扫描：正向核对清单后，再扫整个发布包，找出「带门禁标记但不在清单里的页」，
      堵住「新增门禁页未登记 → 被静默漏检」的洞。默认仅 warn（不卡发布），
      可加 --reverse-fail 加严为失败退出（建议先 warn 跑稳再开）。
  A3 一键刷新：--refresh-baseline 重扫权威源（默认 dist-miaoda）、默认仅打印 diff
     （新增/删除/保留）；需配合 --yes 才真正写 gated_baseline.json（2026-09-04 增强，
     防止默默覆盖历史基线）。

门禁判定仍基于 GATING_MARKERS 文本标记（近似匹配），阶段B 将进一步用 @gate 哨兵注释 +
运行时验证加固（不影响本脚本的阶段A 逻辑）。

优先级（决定用哪份基准）：
  --baseline <dir>  >  gated_baseline.json（若存在）  >  硬编码 GATED_PAGES（最后回退）

用法：
  python check_publish_gating.py [--pkg <dir>]
                                [--baseline <dir>]            # 用该目录实时扫描代替 JSON 基准
                                [--baseline-json <file>]      # 外置基准 JSON 路径（默认 gated_baseline.json）
                                [--reverse-fail]              # 反向扫描发现未登记门禁页时失败退出
                                [--refresh-baseline]          # 重扫权威源：先打印 diff，需 --yes 才真正写 JSON
                                [--refresh-src <dir>]         # refresh 扫描源（默认 dist-miaoda）
                                [--yes]                       # 配合 --refresh-baseline 使用，确认覆盖 JSON

退出码：
  0 = 门禁完整（反向扫描 warn 不影响退出码），或 refresh 仅打印 diff 后用户已留档
  1 = 发现门禁缺失（漏打包 / 门禁被冲掉），或开启 --reverse-fail 时发现有未登记门禁页

A3 增强（2026-09-04）：
  --refresh-baseline 不再是「一键覆盖」。它会先打印 diff（新增 / 删除 / 保留），
  仅在用户显式加 --yes 时才真正写入 gated_baseline.json。
  理由：历史上 --refresh-baseline 把基线从 60 页重写成 39 页（默认扫描源只覆盖
  dist-miaoda），默默删除了 21 项历史基线。这种破坏性写入应当强制人工 review。
"""
import os
import sys
import argparse
import json
import datetime

BASE = "D:/trae/AI Daily report"

# 门禁标记：该页自身实现了权限拦截（而非仅仅引用 bu_gate.js 库文件）
# 2026-08-09 扩充：雷达看板门禁已从「密钥#key=/#uid=」升级为「部门白名单 RADAR_DEPT_WHITELIST
# + 个人白名单 + 本地预览」(decide/clearDeny 浮层)，锁屏文案为「您的账号暂无权限浏览」。
# 新门禁不再携带旧的 4 个哨兵字符串，故补充新标记，避免校验误报「门禁被冲掉」而拦截发布。
# 2026-08-10 补充 'applyBUFilter'：archive_v3.html 等页通过「调用 bu_gate.js 的
# applyBUFilter 门禁 API」实现部门门禁（函数体在库里），页内只含函数名、不含量化
# marker 字符串，原先被漏检为「门禁被冲掉」而误拦发布。补此标记后，凡是真正调用
# bu_gate 门禁 API 的页面都能被正确识别为带门禁（仅引用 bu_gate.js 而不调用的页仍不命中）。
GATING_MARKERS = ['无权限访问', 'ALLOWED_BU', 'isAllowed', 'getCurrentDeptId',
                  'applyBUFilter', 'RADAR_DEPT_WHITELIST', '您的账号暂无权限浏览', '无权限查看']

# 兜底基准：2026-08-03 扫描线上权威源 dist-miaoda 得到的带门禁 html（均为根目录级）。
# 仅在 gated_baseline.json 缺失/读取失败时作为最后回退，日常应以 JSON 为准。
GATED_PAGES = [
    "analysis_hub.html",
    "archive_v3.html",
    "automotive_charts.html",
    "automotive_data_v2.html",
    "automotive_report_202605.html",
    "automotive_report_202606.html",
    "carbonate_charts.html",
    "carbonate_data_v2.html",
    "carbonate_report_2026_05.html",
    "carbonate_report_2026_06.html",
    "database_hub.html",
    "debug_permission.html",
    "dept-archive.html",
    "electrolyte_charts.html",
    "electrolyte_data_v2.html",
    "electrolyte_report.html",
    "felt_report_202604.html",
    "felt_report_202605.html",
    "felt_report_202606.html",
    "lfp_charts.html",
    "lfp_data_v2.html",
    "lfp_report_2026_05.html",
    "lfp_report_2026_06.html",
    "lib_battery_charts.html",
    "lib_battery_data_v2.html",
    "radar_detail_czly.html",
    "radar_detail_dkhx.html",
    "radar_detail_felt.html",
    "radar_detail_kelan.html",
    "radar_detail_kls.html",
    "radar_detail_lhy.html",
    "radar_detail_lpsd.html",
    "radar_detail_lubricant.html",
    "radar_detail_sdmd.html",
    "radar_detail_sjl.html",
    "radar_detail_sjld.html",
    "radar_detail.html",
    "radar_hub.html",
    "recycling_charts.html",
    "recycling_data_v2.html",
    "recycling_report_2026_05.html",
    "recycling_report_2026_06.html",
    "strategy_dashboard.html",
    "strategy_hub.html",
    "ternary_charts.html",
    "ternary_data_v2.html",
    "ternary_report_202605.html",
]

# 反向扫描白名单：已知带门禁写法但非真实业务门禁页（调试/示例页），
# 不应被 A2 反向扫描当作"未登记门禁页"提示。新增此类页请加于此。
GATING_SCAN_EXCLUDES = ['debug_permission.html']

# A1：外置基准 JSON（默认路径）
BASELINE_JSON = os.path.join(BASE, "gated_baseline.json")
# A3：refresh 默认扫描源。须与发布校验的实际包一致（dist-miaoda-test），
# 否则会扫到陈旧的 dist-miaoda 快照、把基线错误缩水（历史上 56→39 假象即由此而来，2026-09-07 修正）。
DEFAULT_REFRESH_SRC = os.path.join(BASE, "dist-miaoda-test")


def page_has_gating(p):
    """该文件是否带门禁标记（自身实现权限拦截）。"""
    if not os.path.isfile(p):
        return False
    try:
        t = open(p, 'rb').read()
    except Exception:
        return False
    return any(m.encode('utf-8') in t for m in GATING_MARKERS)


def find_in_pkg(pkg, name):
    """在发布包里找同名 html（优先根目录，否则递归）。"""
    cand = os.path.join(pkg, name)
    if os.path.isfile(cand):
        return cand
    for root, _, files in os.walk(pkg):
        if name in files:
            return os.path.join(root, name)
    return None


def gather_baseline_from_dir(baseline_dir):
    """扫描目录下「自身实现门禁」的 html 页（仅 .html，排除 bu_gate.js 等库文件）。"""
    out = []
    for root, _, files in os.walk(baseline_dir):
        for f in files:
            if not f.endswith('.html'):
                continue
            fp = os.path.join(root, f)
            if page_has_gating(fp):
                out.append(os.path.basename(fp))
    return out


def load_baseline_json(path):
    """读取外置基准 JSON，返回 (pages列表, meta字典)。"""
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    pages = data.get('pages', [])
    if not isinstance(pages, list):
        raise ValueError("JSON 中 pages 必须是列表")
    return pages, data


def refresh_baseline(src_dir, out_path, apply=False):
    """A3：重扫权威源，按 basename 去重写 gated_baseline.json。

    2026-09-04 增强：默认仅打印 diff（新增/删除/保留），不直接覆盖；只有在
    apply=True（用户传 --yes）时才真正写入。理由：历史上 --refresh-baseline
    把基线从 60 页重写成 39 页（默认扫描源只覆盖 dist-miaoda），默默删除了
    21 项历史基线 + 未来可能新增的页。这种破坏性写入应强制人工 review。
    """
    if not os.path.isdir(src_dir):
        print(f"⛔ refresh 源目录不存在：{src_dir}")
        print("   （可用 --refresh-src <dir> 指定其他扫描源）")
        return 1

    # 计算新基线 pages
    pages = sorted(set(gather_baseline_from_dir(src_dir)))

    # 对比旧基线（如果存在）
    old_pages, old_meta = [], {}
    if os.path.isfile(out_path):
        try:
            old_pages, old_meta = load_baseline_json(out_path)
        except Exception as e:
            print(f"⚠️ 读取旧基线失败：{e}，当作空基线处理")

    old_set, new_set = set(old_pages), set(pages)
    added = sorted(new_set - old_set)
    removed = sorted(old_set - new_set)
    kept = sorted(new_set & old_set)

    print(f"\n📊 refresh diff（来源 {os.path.relpath(src_dir, BASE)}，共 {len(pages)} 页）：")
    print(f"   - 旧基线 {len(old_pages)} 页（{old_meta.get('generated', '?')}）")
    print(f"   - 新基线 {len(pages)} 页")
    print(f"   - 保留：{len(kept)} 页")
    if added:
        print(f"   - 新增 {len(added)} 页：")
        for n in added:
            print(f"       + {n}")
    else:
        print("   - 新增：无")
    if removed:
        print(f"   - 删除 {len(removed)} 页：")
        for n in removed:
            print(f"       - {n}")
    else:
        print("   - 删除：无")

    if not apply:
        print(f"\n🟡 仅打印 diff、未写入。如需覆盖 {out_path}，请加 --yes 重跑。")
        return 0

    # apply=True：真正写盘
    data = {
        "generated": datetime.date.today().isoformat(),
        "source": os.path.relpath(src_dir, BASE),
        "markers": GATING_MARKERS,
        "note": "由 check_publish_gating.py --refresh-baseline --yes 生成；pages 为带门禁标记的 html basename",
        "pages": pages,
    }
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    # 同时写一份带时间戳备份，便于回退
    bak = out_path + "." + datetime.date.today().isoformat() + ".bak"
    try:
        with open(bak, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception:
        pass
    print(f"\n✅ 已刷新 {out_path}：{len(pages)} 个门禁页（来源 {data['source']}，备份 {os.path.basename(bak)}）")
    return 0


def main():
    ap = argparse.ArgumentParser(description="发布前门禁完整性校验（轻量只读，阶段A）")
    ap.add_argument('--pkg', default=os.path.join(BASE, 'dist-miaoda-test'),
                    help='待发布的构建包目录（默认 dist-miaoda-test）')
    ap.add_argument('--baseline', default=None,
                    help='若指定目录，则用该目录下带门禁的 html 作为基准（取代 JSON / 硬编码）')
    ap.add_argument('--baseline-json', default=BASELINE_JSON,
                    help=f'外置基准 JSON 路径（默认 {BASELINE_JSON}）')
    ap.add_argument('--reverse-fail', action='store_true',
                    help='反向扫描发现未登记门禁页时失败退出（默认仅 warn）')
    ap.add_argument('--refresh-baseline', action='store_true',
                    help='重扫权威源并打印 diff（新增/删除/保留）。需配合 --yes 才真正写 gated_baseline.json。')
    ap.add_argument('--refresh-src', default=DEFAULT_REFRESH_SRC,
                    help=f'refresh 扫描源目录（默认 {DEFAULT_REFRESH_SRC}；亦可用 --baseline 指定）')
    ap.add_argument('--yes', action='store_true',
                    help='配合 --refresh-baseline 使用，确认覆盖 gated_baseline.json；非 refresh 模式下忽略。')
    args = ap.parse_args()

    # A3：刷新动作优先，写完即退出
    if args.refresh_baseline:
        src = args.baseline if args.baseline else args.refresh_src
        return refresh_baseline(src, args.baseline_json, apply=args.yes)

    # 决定基准来源
    if args.baseline:
        baseline = sorted(set(gather_baseline_from_dir(args.baseline)))
        print(f"🔎 使用活基准（扫描 {args.baseline}）：{len(baseline)} 个门禁页")
    elif os.path.isfile(args.baseline_json):
        try:
            baseline, meta = load_baseline_json(args.baseline_json)
            print(f"🔎 使用外置基准 {os.path.basename(args.baseline_json)}"
                  f"（{meta.get('generated', '?')}，源 {meta.get('source', '?')}）：{len(baseline)} 个门禁页")
        except Exception as e:
            print(f"⚠️ 读取 {args.baseline_json} 失败：{e}，回退硬编码 GATED_PAGES")
            baseline = GATED_PAGES
    else:
        print(f"⚠️ 未找到 {args.baseline_json}，回退硬编码 GATED_PAGES（{len(GATED_PAGES)} 个）")
        baseline = GATED_PAGES

    baseline_set = set(baseline)

    pkg = args.pkg
    if not os.path.isdir(pkg):
        print(f"⛔ 发布包目录不存在：{pkg}")
        print("   （请先构建 dist-miaoda-test 再运行本检查）")
        return 1

    # —— 正向核对（既有逻辑）——
    missing = []   # 漏打包：基准页未进入发布包
    stripped = []  # 在包里但门禁被冲掉
    ok = 0
    for name in baseline:
        fp = find_in_pkg(pkg, name)
        if fp is None:
            missing.append(name)
            continue
        if not page_has_gating(fp):
            stripped.append(name)
            continue
        ok += 1

    print(f"✅ 门禁完整：{ok}/{len(baseline)}")
    if missing:
        print(f"⛔ 漏打包（门禁页未进入发布包，将导致线上无此页/回退首页）：")
        for n in missing:
            print(f"   - {n}")
    if stripped:
        print(f"⛔ 门禁被冲掉（页在包里但无权限拦截代码，发布即权限失效）：")
        for n in stripped:
            print(f"   - {n}")

    # —— A2：反向扫描，抓漏登记的门禁页 ——
    unregistered = []
    for root, _, files in os.walk(pkg):
        for f in files:
            if not f.endswith('.html'):
                continue
            fp = os.path.join(root, f)
            rel = os.path.relpath(fp, pkg).replace(os.sep, '/')
            base = os.path.basename(f)
            if rel in baseline_set or base in baseline_set:
                continue
            if base in GATING_SCAN_EXCLUDES:
                continue
            if page_has_gating(fp):
                unregistered.append(rel)
    if unregistered:
        print(f"⚠️ 反向扫描发现 {len(unregistered)} 个带门禁标记但不在基准清单里的页"
              f"（可能新增门禁页未登记 / 或调试页）：")
        for n in sorted(unregistered):
            print(f"   - {n}")
        if args.reverse_fail:
            print("❌ --reverse-fail 已开启 → 视为校验失败，中止发布。")
            print("   （若确属合理新增页，请先 --refresh-baseline 登记，或评估后移除 --reverse-fail）")
        else:
            print("   （当前默认仅提醒、不卡发布；确认无误后可 --reverse-fail 加严，或用 --refresh-baseline 登记）")

    # —— 退出码 ——
    if missing or stripped:
        print("❌ 门禁完整性校验未通过 → 应中止发布，保留线上旧版本。")
        return 1
    if unregistered and args.reverse_fail:
        return 1
    print("✅ 门禁完整性校验通过 → 可以发布。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
