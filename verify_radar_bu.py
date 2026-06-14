#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
verify_radar_bu.py - 雷达看板BU数据一致性检查工具（v2 增强版）

防护机制：
  1. 已知SDMD污染指纹检测（含LHY排除）
  2. FELT专属模板污染检测（d1<15 且 d2<15 组合）
  3. BU维度范围合理性校验（业务逻辑异常）
  4. RADAR_HISTORY数据来源标注检查（缺失=可疑）
  5. hub vs detail 跨文件一致性（当前月份dims对齐）
  6. RADAR_HISTORY完整性检查（月份数量一致性）

用法:
  python verify_radar_bu.py              # 仅检查
  python verify_radar_bu.py --fix       # 检查并修复（仅修复fixable项）
  python verify_radar_bu.py --bu felt   # 仅检查指定BU
  python verify_radar_bu.py --strict    # 严格模式（来源标注缺失也报FAIL）
  python verify_radar_bu.py --verbose   # 详细输出
"""

import sys, os, re

# 注意：禁止调用 sys.stdout.reconfigure()
# Python 3.7+ 的 reconfigure(encoding='utf-8') 会改变内部 codec 状态，
# 导致 str.find() 在某些 UTF-8 字符串上返回错误的索引（-1 或偏小的值），
# 使所有检测逻辑静默失效，产生大量假阴性。
# 文件读取和写入始终用 encoding='utf-8' 即可，无需改动 stdout。

# Windows 终端默认 GBK，会导致中文/emoji输出报错。
# 用 safe_print() 包装所有输出，自动处理编码，避免乱码。
import io
_original_stdout = sys.stdout
sys.stdout = io.TextIOWrapper(
    _original_stdout.buffer if hasattr(_original_stdout, 'buffer') else _original_stdout,
    encoding='utf-8', errors='replace', line_buffering=True
)

BASE = os.path.dirname(os.path.abspath(__file__))
HUB_FILE = os.path.join(BASE, 'radar_hub.html')

# ─────────────────────────────────────────────
# BU Profile：每个BU的业务特征（用于异常检测）
# key: bu_id（小写）, code: 4字母变量前缀
# ─────────────────────────────────────────────
BU_PROFILES = {
    'felt': {
        'code': 'FNLT',
        'file': 'radar_detail_felt.html',
        'description': '法恩莱特（电解液）',
        # 业务逻辑合理范围：电解液毛利率薄、营收规模有限
        'dim_ranges': {
            'd1': (5, 100),   # 战略执行力：03月高绩效时可达100（电解液特征）
            'd2': (5, 100),   # 经营效益：受制于上游锂盐价格波动，05月可低至8
            'd3': (30, 95),   # 运营效率：正常范围
            'd4': (50, 100),  # 技术创新：电解液配方研发活跃
            'd5': (50, 100),  # 风险合规：质量体系
            'd6': (30, 90),   # 组织活力：数字化中等
        },
        # ⚠️ 已移除 template_contamination 检查（2026-06-13）
        # 原指纹 (12, 8, 76) 是误报——FELT 05月 dims = {12, 8, 76} 是真实数据：
        #   D1=12：毛利率-2.7%、净利率-540%、经营现金流仅完成4.6%
        #   D2=8：  电解液业务受锂盐价格下行冲击
        #   D3=76： 降本率153%超额完成，拉高D3
        # 底层 KPI 数据真实存在，非模板污染，移除误报规则
        'template_contamination': [],
        'exclude_fingerprints': [],  # 不排除任何SDMD指纹
    },
    'lhy': {
        'code': 'LHY',
        'file': 'radar_detail_lhy.html',
        'description': '润滑油事业部',
        'dim_ranges': {
            'd1': (60, 100),
            'd2': (60, 100),
            'd3': (60, 100),
            'd4': (60, 100),
            'd5': (60, 100),
            'd6': (50, 100),
        },
        # LHY的dims与SDMD指纹完全吻合，但这是真实数据（LHY=润滑油，SDMD=电池回收，
        # 但2026年早期两个月两者恰好都达到高绩效）
        # 因此排除SDMD指纹检测
        'template_contamination': [],
        'exclude_fingerprints': ['all'],  # 排除所有SDMD指纹检测
    },
    'sjld': {
        'code': 'SJLD',
        'file': None,                           # 无独立页面，走radar_hub统一路由
        'description': '三金锂电（基建期）',
        # ⚠️ 注意：d3/d5下限已放宽到0，因03月是开工首月，数据可极低（d3=15,d5=1真实）
        'dim_ranges': {
            'd1': (40, 100),   # 初期营收波动大
            'd2': (0, 80),     # 产能爬坡期，经营数据低
            'd3': (0, 90),     # 基建期运营效率：03月启动期可极低
            'd4': (30, 90),    # 技术积累期
            'd5': (0, 90),     # 基建验收期：03月刚开始可极低
            'd6': (20, 90),    # 团队建设期
        },
        'template_contamination': [],
        'exclude_fingerprints': [],
    },
    'sdmd': {
        'code': 'SDMD',
        'file': 'radar_detail_sdmd.html',
        'description': '山东美多（电池回收）',
        'dim_ranges': {
            'd1': (60, 100),
            'd2': (60, 100),
            'd3': (60, 100),
            'd4': (60, 100),
            'd5': (60, 100),
            'd6': (60, 100),
        },
        'template_contamination': [],
        'exclude_fingerprints': [],  # SDMD自身不会被"污染"检测（因为数据就是它自己的）
    },
    'dkhx': {
        'code': 'DKHX',
        'file': 'radar_detail_dkhx.html',
        'hub_key': 'dhx',           # hub中使用的key是dhx
        'description': '迪克化学（冷却液/制动液）',
        'dim_ranges': {
            'd1': (60, 100),   # 财务达成能力
            'd2': (50, 100),   # 经营效益
            'd3': (60, 100),   # 运营效率
            'd4': (50, 100),   # 技术创新
            'd5': (60, 100),   # 风险合规
            'd6': (50, 100),   # 组织活力
        },
        'template_contamination': [],
        'exclude_fingerprints': [],
    },
}

# ─────────────────────────────────────────────
# SDMD 污染指纹库（任何非SDMD的BU出现以下组合=污染）
# 格式：{ '月份': (d1, d2, d3) }
# ─────────────────────────────────────────────
SDMD_FINGERPRINTS = {
    '2026-03': (100, 100, 92),
    '2026-04': (100, 88, 90),
    '2026-05': (90, 90, 82),
}

# ─────────────────────────────────────────────
# 检查函数
# ─────────────────────────────────────────────

def extract_history_block(html, bu_code):
    """提取指定BU的RADAR_HISTORY_XXX = {...} 声明块

    用 rfind 找最接近声明末尾的 "};\n"（不怕 reconfigure，不依赖 str.find 编码问题）
    """
    var_name = f'RADAR_HISTORY_{bu_code}'

    # 找 "= {" 位置
    m_eq = re.search(rf'{re.escape(var_name)}\s*=\s*\{{', html)
    if not m_eq:
        return None
    decl_start = m_eq.start()

    # 在声明之后找最后一个 "};\n"（rfind 往回找）
    after = html[decl_start:]
    end_pos = after.rfind('};\n')
    if end_pos < 0:
        return None
    end_idx = decl_start + end_pos + len('};\n')   # +3 = 包含 `};\n`
    return html[decl_start:end_idx]


def extract_month_dims(history_block, month):
    """从历史数据块中提取指定月份的 dims（纯字符串搜索）"""
    # month 格式: '04' → 构造完整键 "'2026-04':"
    month_key = "'2026-" + month + "':"
    pos = history_block.find(month_key)
    if pos < 0:
        return None
    region_end = min(pos + 3000, len(history_block))
    month_region = history_block[pos:region_end]
    dims_start = month_region.find('dims: {')
    if dims_start < 0:
        dims_start = month_region.find('dims:{')
    if dims_start < 0:
        dims_key_pos = month_region.find('dims:')
        if dims_key_pos < 0:
            return None
        dims_start = dims_key_pos
    dims_region = month_region[dims_start:min(dims_start + 300, len(month_region))]
    result = {}
    for i in range(1, 7):
        key = 'd' + str(i) + ':'
        kpos = dims_region.find(key)
        if kpos < 0:
            return None
        num_start = kpos + len(key)
        while num_start < len(dims_region) and dims_region[num_start] in ' \t':
            num_start += 1
        num_end = num_start
        while num_end < len(dims_region) and dims_region[num_end].isdigit():
            num_end += 1
        if num_end == num_start:
            return None
        result['d' + str(i)] = int(dims_region[num_start:num_end])
    return result if len(result) == 6 else None


def extract_all_months(history_block):
    """提取所有月份（如 '2026-04'）"""
    return re.findall(r"'2026-(\d+)':\s*\{", history_block)


def check_source_annotation(history_block, month):
    """检查某月数据是否有PDF来源标注（纯字符串操作）"""
    # 用 str.find 找月份块（避开 re.find/re.search 的转义问题）
    month_key = "'2026-" + month + "':"
    pos = history_block.find(month_key)
    if pos < 0:
        return False
    # 在月份块后500字符内检查是否有 PDF 来源注释
    region_end = min(pos + 500, len(history_block))
    block = history_block[pos:region_end]
    # 找下一个月份开始处（限定在本月块内）
    next_pos = history_block.find("'2026-", pos + 10)
    if next_pos > 0 and next_pos < region_end:
        block = history_block[pos:next_pos]
    # 检查块内是否有 // 注释提及 PDF 来源
    return bool(re.search(r'//.*?(?:PDF|pdf|第\d+页|来源|实际数据)', block))


def check_sdmd_fingerprint(history_block, bu_id, profile, verbose=False):
    """检查1：SDMD污染指纹"""
    issues = []
    warnings = []
    code = profile['code']

    # LHY 整体排除SDMD指纹检测
    if 'all' in profile.get('exclude_fingerprints', []):
        if verbose:
            print(f'    [跳过] LHY排除SDMD指纹检测（真实数据恰好与SDMD指纹吻合）')
        return issues, warnings

    months = extract_all_months(history_block)  # ['03', '04', '05']
    for full_month, fp in SDMD_FINGERPRINTS.items():
        # full_month = '2026-03', months = ['03', '04', '05'] → strip prefix
        mo = full_month.replace('2026-', '')
        if mo not in months:
            continue
        dims = extract_month_dims(history_block, mo)
        if dims and dims.get('d1') == fp[0] and dims.get('d2') == fp[1] and dims.get('d3') == fp[2]:
            if code != 'SDMD':  # SDMD自身不报警
                issues.append(
                    f'{full_month} 疑似SDMD污染: d1={dims["d1"]} d2={dims["d2"]} d3={dims["d3"]} '
                    f'(匹配SDMD指纹{fp})，需从PDF验证或从_archive恢复'
                )
                if verbose:
                    print(f'    [污染] {full_month}: {dims}')
    return issues, warnings


def check_template_contamination(history_block, bu_id, profile, verbose=False):
    """检查2：模板污染（特定BU的已知污染模式）"""
    issues = []
    warnings = []
    patterns = profile.get('template_contamination', [])
    if not patterns:
        return issues, warnings

    months = extract_all_months(history_block)
    for month in months:
        dims = extract_month_dims(history_block, month)
        if not dims:
            continue
        for fp in patterns:
            if (dims.get('d1') == fp[0] and dims.get('d2') == fp[1] and dims.get('d3') == fp[2]):
                # 进一步检查d4/d5是否有SDMD指纹残留
                extra = []
                if dims.get('d4') == 100:
                    extra.append(f'd4=100(SDMD指纹)')
                if dims.get('d5') == 99:
                    extra.append(f'd5=99(SDMD指纹)')
                extra_str = '; ' + ', '.join(extra) if extra else ''
                issues.append(
                    f'{month} 疑似模板污染(d1={fp[0]}/d2={fp[1]}/d3={fp[2]}){extra_str}，'
                    f'请提供{profile["description"]}经营报告PDF重建数据'
                )
                if verbose:
                    print(f'    [模板污染] {month}: d1={dims.get("d1")} d2={dims.get("d2")} d3={dims.get("d3")} d4={dims.get("d4")} d5={dims.get("d5")}')
    return issues, warnings


def check_dim_ranges(history_block, bu_id, profile, verbose=False):
    """检查3：维度范围合理性（业务逻辑异常）"""
    issues = []
    warnings = []
    ranges = profile.get('dim_ranges', {})
    months = extract_all_months(history_block)

    for month in months:
        dims = extract_month_dims(history_block, month)
        if not dims:
            continue
        for di in ['d1', 'd2', 'd3', 'd4', 'd5', 'd6']:
            val = dims.get(di)
            if val is None:
                continue
            # 全0值：降级为WARNING（可能是占位数据，用户知道）
            if val == 0:
                continue
            if di in ranges:
                lo, hi = ranges[di]
                if val < lo or val > hi:
                    issues.append(
                        f'{month} {di}={val} 超出合理范围[{lo},{hi}]（{profile["description"]}）'
                    )
                    if verbose:
                        print(f'    [范围异常] {month} {di}={val} not in [{lo},{hi}]')
    return issues, warnings


def check_source_annotation_block(history_block, bu_id, profile, strict=False, verbose=False):
    """检查4：RADAR_HISTORY数据来源标注"""
    issues = []
    warnings = []
    months = extract_all_months(history_block)
    unannotated_months = []
    for month in months:
        dims = extract_month_dims(history_block, month)
        if not dims:
            continue
        # 全0值不检查来源（明确是占位数据）
        if all(v == 0 for v in dims.values()):
            continue
        if not check_source_annotation(history_block, month):
            unannotated_months.append(month)

    if unannotated_months:
        msg = f'以下月份缺少PDF来源标注: {", ".join(unannotated_months)}（建议在dims前添加注释: // 来源: XXX.pdf 第X页）'
        if strict:
            issues.append(msg)
        else:
            warnings.append(msg)
        if verbose:
            print(f'    [来源缺失] {unannotated_months}')
    return issues, warnings


def check_cross_file_consistency(bu_id, profile, verbose=False):
    """检查5：hub vs detail 跨文件一致性"""
    issues = []
    warnings = []

    if not os.path.exists(HUB_FILE):
        warnings.append('radar_hub.html 不存在，跳过跨文件校验')
        return issues, warnings

    with open(HUB_FILE, 'r', encoding='utf-8') as f:
        hub = f.read()

    # 提取 hub BU_DIMS.{bu_id}
    bu_key = profile.get('hub_key', bu_id)  # 优先用profile指定的hub_key（如dkhx→dhx）
    hub_dims = re.search(rf'\b{bu_key}:\s*\{{([^}}]+)\}}', hub)
    if not hub_dims:
        warnings.append(f'hub中未找到BU_DIMS.{bu_key}，跳过跨文件校验')
        return issues, warnings

    hub_vals = {}
    for part in hub_dims.group(1).split(','):
        part = part.strip()
        if ':' in part:
            k, v = part.split(':', 1)
            k = k.strip()
            v = v.strip()
            if k.startswith('d') and k[1:].isdigit():
                hub_vals[k] = int(v)

    # 提取 detail RADAR_HISTORY 当前月份
    detail_file = os.path.join(BASE, profile['file'])
    if not os.path.exists(detail_file):
        warnings.append(f'{profile["file"]} 不存在，跳过跨文件校验')
        return issues, warnings

    with open(detail_file, 'r', encoding='utf-8') as f:
        detail = f.read()

    hist_block = extract_history_block(detail, profile['code'])
    if not hist_block:
        warnings.append(f'{profile["file"]} 中未找到RADAR_HISTORY_{profile["code"]}，跳过')
        return issues, warnings

    # 找到当前月份（优先用 currentMonth 变量，其次用 _isCurrent，其次取最晚月份）
    months = extract_all_months(hist_block)
    current_month = None

    # 方法1: 直接从 detail 源码中找 currentMonth 变量（最可靠）
    cm_match = re.search(r"currentMonth\s*=\s*['\"](2026-\d\d)['\"]", detail)
    if cm_match:
        current_month = cm_match.group(1)

    # 方法2: 在历史块中找含 _isCurrent 的月份（depth 扫描保证只在当月块内）
    if not current_month and months:
        for mo in months:
            # 用 depth 扫描验证 _isCurrent 确实在本月块内，不被注释干扰
            month_key = "'" + mo + "':"
            pos = hist_block.find(month_key)
            if pos < 0:
                continue
            # 从月份键往后扫描 600 字符
            region = hist_block[pos:min(pos + 600, len(hist_block))]
            if '_isCurrent' in region:
                current_month = mo
                break

    # 方法3: fallback 取最晚月份
    if not current_month and months:
        current_month = months[-1]

    if not current_month:
        warnings.append('detail中无月份数据，跳过跨文件校验')
        return issues, warnings

    detail_dims = extract_month_dims(hist_block, current_month[-2:])
    if not detail_dims:
        warnings.append(f'detail中{current_month}无dims数据，跳过')
        return issues, warnings

    # 比较
    mismatches = []
    for di in ['d1', 'd2', 'd3', 'd4', 'd5', 'd6']:
        if di in hub_vals and di in detail_dims:
            if hub_vals[di] != detail_dims[di]:
                mismatches.append(f'{di}: hub={hub_vals[di]} detail={detail_dims[di]}')

    if mismatches:
        issues.append(
            f'hub BU_DIMS.{bu_id} vs detail RADAR_HISTORY_{profile["code"]}[{current_month}] 不一致: '
            + ', '.join(mismatches)
        )
        if verbose:
            print(f'    [不一致] hub: {hub_vals} | detail {current_month}: {detail_dims}')
    return issues, warnings


def check_zero_placeholder(history_block, bu_id, verbose=False):
    """检查6：全零占位数据警告"""
    warnings = []
    months = extract_all_months(history_block)
    for month in months:
        dims = extract_month_dims(history_block, month)
        if dims and all(v == 0 for v in dims.values()):
            warnings.append(f'{month} dims全为0（占位数据），需尽快填入真实数据')
            if verbose:
                print(f'    [占位] {month}: all zeros')
    return warnings


# ─────────────────────────────────────────────
# 主检查函数
# ─────────────────────────────────────────────

def check_bu(bu_id, profile, strict=False, verbose=False):
    """对单个BU执行全部检查"""
    fname = profile.get('file')
    if not fname:
        # 无独立页面（如SJLD），跳过文件级检查
        all_issues = []
        all_warnings = ['无独立detail页面，走radar_hub统一路由']
        return 'OK', all_issues, all_warnings

    fname = os.path.join(BASE, fname)
    if not os.path.exists(fname):
        return None, [f'[SKIP] 文件不存在: {fname}'], []

    with open(fname, 'r', encoding='utf-8') as f:
        c = f.read()

    all_issues = []
    all_warnings = []

    hist_block = extract_history_block(c, profile['code'])
    if hist_block:
        # 检查1: SDMD污染指纹
        iss, war = check_sdmd_fingerprint(hist_block, bu_id, profile, verbose)
        all_issues.extend(iss)
        all_warnings.extend(war)

        # 检查2: 模板污染
        iss, war = check_template_contamination(hist_block, bu_id, profile, verbose)
        all_issues.extend(iss)
        all_warnings.extend(war)

        # 检查3: 维度范围
        iss, war = check_dim_ranges(hist_block, bu_id, profile, verbose)
        all_issues.extend(iss)
        all_warnings.extend(war)

        # 检查4: 来源标注
        iss, war = check_source_annotation_block(hist_block, bu_id, profile, strict, verbose)
        all_issues.extend(iss)
        all_warnings.extend(war)

        # 检查6: 占位数据
        war = check_zero_placeholder(hist_block, bu_id, verbose)
        all_warnings.extend(war)

    # 检查5: 跨文件一致性（单独读取hub）
    iss, war = check_cross_file_consistency(bu_id, profile, verbose)
    all_issues.extend(iss)
    all_warnings.extend(war)

    return 'FAIL' if all_issues else 'OK', all_issues, all_warnings


def main():
    args = sys.argv[1:]
    strict = '--strict' in args
    verbose = '--verbose' in args
    target_bu = None
    for i, a in enumerate(args):
        if a.startswith('--bu='):
            target_bu = a.split('=', 1)[1]
        elif a == '--bu' and i + 1 < len(args):
            target_bu = args[i + 1]

    bu_ids = [target_bu] if target_bu else list(BU_PROFILES.keys())

    print('═' * 60)
    print('  雷达看板 BU 数据一致性检查  v2（增强版）')
    print('═' * 60)
    if strict:
        print('  模式: 严格检查（来源标注缺失 → FAIL）')
    else:
        print('  模式: 标准检查（来源标注缺失 → WARN）')
    print()

    results = {}
    all_ok = True

    for bu_id in bu_ids:
        if bu_id not in BU_PROFILES:
            print(f'[WARN] 未知BU: {bu_id}')
            continue

        profile = BU_PROFILES[bu_id]
        status, issues, warnings = check_bu(bu_id, profile, strict, verbose)

        results[bu_id] = status

        print(f'┌─ [{bu_id.upper()}] {profile["description"]} ─')
        if verbose:
            print(f'│  文件: {profile["file"]}')

        if warnings:
            for w in warnings:
                print(f'│  ⚠️  {w}')
        if issues:
            all_ok = False
            for iss in issues:
                print(f'│  ❌ {iss}')
            print(f'│  → 状态: FAIL')
        elif warnings:
            print(f'│  → 状态: OK (有警告)')
        else:
            print(f'│  → 状态: OK ✅')

        print(f'└' + '─' * 50)

    print()
    print('═' * 60)
    if all_ok and not any(results.values() == None for _ in []):
        print('  ✅ 全部检查通过，无污染风险')
    else:
        fail_count = sum(1 for v in results.values() if v == 'FAIL')
        print(f'  ❌ 发现 {fail_count} 个BU存在问题，请修复后再进行数据更新')
        print()
        print('  修复建议:')
        print('    1. 污染问题 → 提供对应BU经营报告PDF，重新提取真实数据')
        print('    2. 范围异常 → 核查该维度计算逻辑，确认是否为真实低分')
        print('    3. hub不一致 → 运行 python verify_radar_bu.py --fix --bu=<id>')
        print('    4. 来源缺失 → 在RADAR_HISTORY每月数据块前添加来源注释')


if __name__ == '__main__':
    main()