#!/usr/bin/env bash
# =============================================================================
# 【自愈段 2026-09-30 立】WorkBuddy shell shim 偶尔传入极简 PATH（仅 shim 自身
#   目录），导致 dirname/cd/head/tail 报 `command not found`（stderr 同时含
#   `cd: null directory`）。本段先 source tools/_env_path.sh 注入完整 PATH；
#   若 source 失败（极端兜底），硬编码注入并用 `exec env -i` 干净环境重启自身。
#   详细原理与历史踩坑（09-17 / 09-18 / 09-28 / 09-30）见 tools/_env_path.sh 头注释。
#   多次验证安全（幂等：重复执行 / 重复 source 无副作用）。
# =============================================================================
_EVP_SH="D:/trae/AI Daily report/tools/_env_path.sh"
if [ -f "$_EVP_SH" ]; then
  # shellcheck disable=SC1091
  source "$_EVP_SH"
fi
unset _EVP_SH
# 兜底：若 source 失败（极端情况），硬注入并用干净 env 重启
if ! command -v dirname >/dev/null 2>&1; then
  export PATH="/c/Windows/System32:/c/Windows:/c/Users/1/.workbuddy/binaries/PortableGit/versions/1.2.0/usr/bin:/c/Users/1/.workbuddy/binaries/PortableGit/versions/1.2.0/bin:/c/Users/1/.workbuddy/binaries/node/versions/22.22.2-3:/c/Users/1/.workbuddy/binaries/python/envs/default:/c/Users/1/.workbuddy/binaries/python/envs/default/Scripts:$PATH"
  exec env -i PATH="$PATH" HOME="$HOME" "$0" "$@"
fi
# =============================================================================
# validate_and_publish.sh
# AI 早报 / 行情中台 —— 发布前本地渲染校验 + 发布（纯本地，无 GitHub）
#
# 硬约束（业务要求）：
#   - 最低要求 24 小时正常展示；顶多接受不是最新数据，
#     但不能接受页面无法展示 / 部分子页面无法显示。
#   - 因此：先校验本地构建包能正常渲染（Playwright 真渲染逐页检查），
#     校验通过才调用 lark-cli 发布；校验失败则【不发布】，保留线上上一版本。
#
# 依赖：
#   - tools/check_core_assets.py （第 0 步：核心资产 + 页面资源 + 工作区空洞）
#   - validate_publish.py  （构建 dist-miaoda-test + 8890 端口起服务 + Playwright 校验）
#   - auto_miaoda_daily_test.py 的 --no-publish 构建逻辑（与线上同包）
#   - lark-cli（妙搭 CLI，已在 WorkBuddy bash 环境 PATH 中）
#
# 校验顺序（任一失败都【不发布】）：
#   第 0 步   工作区完整性（check_core_assets.py --require-git）
#   第 0.5 步 数据格式门禁（tools/check_pct_format.py，百分比字段棘轮校验）
#   第 1 步   本地真渲染（validate_publish.py）
#   第 2 步   门禁完整性（check_publish_gating.py --reverse-fail）+ BU 口径（check_bu_scope.py）
#   第 3 步   发布（lark-cli apps +html-publish）
#
# 用法（由 WorkBuddy 自动化定时调用，或手动执行）：
#   bash validate_and_publish.sh
#
# ⚠️ 发布命令执行环境重要坑：
#   1. 【2026-08-11 修正】`C:\Users\1\.workbuddy\binaries\node\versions\22.22.2\lark-cli.cmd`
#      下的原生二进制在本环境已损坏（连 `lark-cli --version` 都零输出、退出码 1）。
#      必须用 connector 版：`C:\Users\1\.workbuddy\binaries\node\cli-connector-packages\lark-cli.cmd`
#      （v1.0.85，可正常输出 JSON 并报错）。LARK_CLI 已指向它。
#   2. lark-cli 的 --path 必须是【当前目录内的相对路径】；本脚本已先 `cd "$BASE"`，
#      故 `--path "$QA_PKG"` 即相对路径（合法）；传绝对路径会被拒（unsafe --path）。
#   3. 手动发布的最小正确命令（已验证可成功）：
#        cd /d "D:\trae\AI Daily report"
#        "C:\Users\1\.workbuddy\binaries\node\cli-connector-packages\lark-cli.cmd" ^
#            apps +html-publish --app-id app_179kjgvrq6g --path dist-miaoda-test
# =============================================================================
set -u

BASE="D:/trae/AI Daily report"
APP="app_179kjgvrq6g"          # 妙搭内容应用（直传版）
QA_PKG="dist-miaoda-test"      # 与线上同包（校验对象 = 发布对象）

# 2026-10-14 根治（取代旧 hardcoded 3.13.12）：自动探测 Python 解释器
# ----------------------------------------------------------------------------
# 旧实现：硬编码 `PY="…/versions/3.13.12/python.exe"`，会被 workbuddy 编排环境前置注入到 PATH，
# 当 validate_publish.py 内部 `import playwright` 时撞 `ModuleNotFoundError` 整个发布链中断。
#
# 新实现：自探测两个角色：
#   1) PY — 任何能跑标准库的 Python（用于 check_core_assets / check_pct_format /
#          check_publish_gating / check_bu_scope，仅需 argparse/os/re/json 等）
#   2) PY_PW — 已装 playwright 的 Python（用于 validate_publish.py）
# 探测策略：候选白名单 → 扫描 versions/<任意修订>/python.exe 兜底 → PATH 中的 python。
# 找不到时清晰退出（不是"调用时崩"）。
# ----------------------------------------------------------------------------
_PY_BASE_DIR="C:/Users/1/.workbuddy/binaries/python/versions"
_PY_VERSIONS_PYTHONS=()
if [ -d "$_PY_BASE_DIR" ]; then
  while IFS= read -r _v; do
    [ -f "$_PY_BASE_DIR/$_v/python.exe" ] && _PY_VERSIONS_PYTHONS+=("C:/Users/1/.workbuddy/binaries/python/versions/$_v/python.exe")
  done < <(ls -1 "$_PY_BASE_DIR" 2>/dev/null)
fi

_probe_python_runnable() {
  # $1 = python 候选路径；echo 0 表示可跑，否则 1
  local cand="$1"
  [ -f "$cand" ] || return 1
  "$cand" --version >/dev/null 2>&1 && return 0 || return 1
}

_probe_python_playwright() {
  # $1 = python 候选路径；echo 0 表示能 import playwright，否则 1
  local cand="$1"
  [ -f "$cand" ] || return 1
  "$cand" -c "from playwright.sync_api import sync_playwright" >/dev/null 2>&1 && return 0 || return 1
}

# 候选顺序：先 workbuddy venv / 系统 Python（playwright 可用），再 managed versions，再 PATH
_PY_RUNNABLE_CANDIDATES=(
  "C:/Users/1/.workbuddy/binaries/python/envs/default/Scripts/python.exe"
  "C:/Users/1/AppData/Local/Programs/Python/Python312/python.exe"
  "${_PY_VERSIONS_PYTHONS[@]}"
  "python"
  "python3"
)
_PY_PW_CANDIDATES=(
  "C:/Users/1/AppData/Local/Programs/Python/Python312/python.exe"
  "C:/Users/1/.workbuddy/binaries/python/envs/default/Scripts/python.exe"
  "${_PY_VERSIONS_PYTHONS[@]}"
)

# 探测「可跑 Python」
PY=""
for _cand in "${_PY_RUNNABLE_CANDIDATES[@]}"; do
  if _probe_python_runnable "$_cand"; then
    PY="$_cand"; break
  fi
done
if [ -z "$PY" ]; then
  echo "[$(ts)] ⛔ 未找到可运行的 Python（已尝试 venv / 系统 Python / managed versions/* / PATH 中的 python）。"
  echo "[$(ts)]    请安装任意一个 Python 3.10+ 或检查 PATH。"
  exit 1
fi
echo "[$(ts)] 🐍 PY (stdlib)        : $PY"

# 探测「有 playwright 的 Python」
PY_PW=""
for _cand in "${_PY_PW_CANDIDATES[@]}"; do
  if _probe_python_playwright "$_cand"; then
    PY_PW="$_cand"; break
  fi
done
if [ -z "$PY_PW" ]; then
  echo "[$(ts)] ⛔ 未找到已装 playwright 的 Python（已尝试 venv / 系统 Python / managed versions/*）。"
  echo "[$(ts)]    安装指令（系统 Python 3.12.10）："
  echo "[$(ts)]      C:/Users/1/AppData/Local/Programs/Python/Python312/python.exe -m pip install playwright"
  echo "[$(ts)]      C:/Users/1/AppData/Local/Programs/Python/Python312/python.exe -m playwright install chromium"
  exit 1
fi
echo "[$(ts)] 🐍 PY_PW (playwright) : $PY_PW"

ts() { date "+%Y-%m-%d %H:%M:%S"; }

echo "[$(ts)] echo "[TEST] PY=$PY"
echo "[TEST] PY_PW=$PY_PW"
exit 0
echo "[TEST] PY=$PY"
echo "[TEST] PY_PW=$PY_PW"
exit 0
echo "[TEST] PY=$PY"
echo "[TEST] PY_PW=$PY_PW"
exit 0
echo "[TEST] PY=$PY"
echo "[TEST] PY_PW=$PY_PW"
exit 0
echo "[TEST] PY=$PY"
echo "[TEST] PY_PW=$PY_PW"
exit 0
echo "[TEST] PY=$PY"
echo "[TEST] PY_PW=$PY_PW"
exit 0
echo "[TEST] PY=$PY"
echo "[TEST] PY_PW=$PY_PW"
exit 0
===== 发布前校验 + 发布 开始 ====="

# ---------------------------------------------------------------------------
# 第 0 步：工作区完整性（静默丢文件哨兵）
# tools/check_core_assets.py 三项检查：
#   ① 核心资产显式清单（约 40 项：门禁/雷达/服务/落库/竞品台/工具）
#   ② 页面静态资源断链（各页 <script src> / <link href> 的本地依赖）
#   ③ 工作区空洞（git ls-tree HEAD 有、磁盘上没有）
#
# 为什么要在构建之前跑：本步检查的是「源码根目录」的完整性。若根目录已缺文件，
# 后面构建出来的 dist 包本身就是残缺的（只是未必被逐页渲染校验发现），
# 先跑一遍能在源头给出明确诊断，且耗时仅 0.3s。
#
# 为什么必须 fail-closed 且带 --require-git：
#   2026-09-18 事故——`.git/refs/heads/sprint/default` 松散 ref 丢失导致 HEAD 静默
#   回退至 09-01，工作区被同步成 09-01 的树，凡 09-02 之后才纳入版本控制的文件
#   （`_radar_scoring_config.js` / `check_publish_gating.py` / `gated_baseline.json` /
#   `hooks/pre-commit` …）被 git 从工作区删除：**不进回收站、git 不报错**，
#   直到 09-27 因 13 个页面白屏才被发现，静默存续 9 天。
#   --require-git：本机 git 不在默认 PATH 上，若探测不到 git 就"无声跳过"等于没护栏，
#   故探测失败即判失败（拒绝用"查不了"冒充"没问题"）。
#
# 退出码 1 → 不发布，保留线上上一版本。恢复方式：
#   - 工作区空洞：git restore <路径>（比快照拷贝权威）
#   - 核心资产缺失：从 _archive/portal_good_* 快照恢复
# ---------------------------------------------------------------------------
"$PY" "$BASE/tools/check_core_assets.py" --require-git
CRC=$?
if [ "$CRC" -ne 0 ]; then
  echo "[$(ts)] ⛔ 工作区完整性校验未通过（退出码 $CRC）。按硬约束【不发布】，保留线上上一版本。"
  echo "[$(ts)]    工作区空洞 → git restore <路径>；核心资产缺失 → 从 _archive/portal_good_* 恢复。"
  exit 1
fi
echo "[$(ts)] 🧱 工作区完整性校验通过：核心资产齐全 / 页面资源无断链 / 无工作区空洞。"

# ---------------------------------------------------------------------------
# 第 0.5 步：数据格式门禁（百分比字段）
# 2026-09-28 事故：碳酸锂库 产能利用率/环比/同比 同列混存 0.16 与 '16%'，
#   页面 capPct=v*100 把 '16%' 放大成 1600%；lib_battery 属同源（渲染方式与
#   数据格式只是「碰巧对上」，任一侧变动即显示错）。本步做棘轮式校验：
#   只拦「新增」违规，存量已登记在 tools/pct_format_baseline.json，不卡现有流程。
#   规范单一事实源 tools/pct_canon.py；渲染契约 tools/pct_page_contract.json。
# 校验失败 → 不发布（避免把格式错误的数据推上线）。
# ---------------------------------------------------------------------------
"$PY" "$BASE/tools/check_pct_format.py"
PRC=$?
if [ "$PRC" -ne 0 ]; then
  echo "[$(ts)] ⛔ 数据格式门禁未通过（退出码 $PRC）：百分比字段存在 P0 格式问题。按硬约束【不发布】。"
  echo "[$(ts)]    写入侧请统一走 tools/pct_canon.to_ratio()；页面请用自适应 fmtPct() 而非 v*100。"
  exit 1
fi
echo "[$(ts)] 🧮 数据格式门禁通过：百分比字段无新增违规。"

# ---------------------------------------------------------------------------
# 第 1 步：发布前本地渲染校验
# validate_publish.py 内部会构建 dist-miaoda-test（与线上同包），
# 起 8890 端口 QA 服务，并用 Playwright 对每个 .html 做真渲染校验。
#   退出码 0 = 全部页面渲染正常 → 可以发布
#   退出码 1 = 有页面渲染失败/资源缺失 → 禁止发布
# 注意：这里走 PY_PW（系统 Python 3.12.10，已有 playwright），不是 PY。
# ---------------------------------------------------------------------------
"$PY_PW" "$BASE/validate_publish.py"
RC=$?
if [ "$RC" -ne 0 ]; then
  echo "[$(ts)] ⛔ 校验未通过（退出码 $RC）。按硬约束【不发布】，保留线上上一版本。"
  echo "[$(ts)]    详见 $BASE/publish_logs/ 下最新 validate_*.log / *.json 报告。"
  exit 1
fi

echo "[$(ts)] ✅ 校验通过：构建包 $QA_PKG 全部页面渲染正常。"

# ---------------------------------------------------------------------------
# 第 2 步（前）：门禁完整性门禁（轻量 check）
# 发布前确认 dist-miaoda-test 中全部门禁页仍带权限拦截，防止无门禁版发到线上。
# 校验失败 → 不发布，保留线上上一版本（与硬约束一致）。
#
# 2026-09-18 加严：补 --reverse-fail。
#   背景：法恩莱特页 strategy_dashboard_expand_felt.html 曾长期处于「带门禁标记但未登记进
#   gated_baseline.json」状态——反向扫描只 warn 不失败，页内门禁即使被改坏也不会被拦。
#   现改为失败退出：发布包里若出现任何未登记的门禁页，直接中止发布（fail-closed）。
#   合法新增门禁页的正确处置（二选一）：
#     a) 登记进基准：$PY "$BASE/check_publish_gating.py" --refresh-baseline --yes
#     b) 若为调试/示例页（非业务门禁）：加入 check_publish_gating.py 的 GATING_SCAN_EXCLUDES
# ---------------------------------------------------------------------------
"$PY" "$BASE/check_publish_gating.py" --reverse-fail
GRC=$?
if [ "$GRC" -ne 0 ]; then
  echo "[$(ts)] ⛔ 门禁完整性校验未通过（退出码 $GRC）。按硬约束【不发布】，保留线上上一版本。"
  echo "[$(ts)]    详见 check_publish_gating.py 输出：哪些门禁页丢失/被冲掉。"
  exit 1
fi
echo "[$(ts)] 🔒 门禁完整性校验通过：所有权限页均已带权限拦截。"

# ---------------------------------------------------------------------------
# 第 2 步（前·2）：BU 口径残留门禁（跨 BU 硬编码「一次扫清」）
# 三个 BU 页（strategy_dashboard_expand{,_lpsd,_felt}.html）是克隆出来的：复制一页改几个字，
# 于是每次克隆会一次性带进十几个同类硬编码（业务词 / BU 名 / 部门ID / 口径字典 / 兜底文案）。
# 本步把"发现一个修一个"反过来 —— 一次扫全部实例：
#   拦发布（P0）：页头身份错、跨 BU 部门ID、indexOf('<其它BU>') 万能令牌、
#                 相关度键用了别家口径、价格卡/renderPrices 键 ≠ price_feed_<bu>.json
#   仅提示（P1）：跨 BU 业务词残留、configs 表含非本页 BU 条目、档位兜底缺键/裸键
# ---------------------------------------------------------------------------
"$PY" "$BASE/check_bu_scope.py" --pkg "$BASE/$QA_PKG"
BRC=$?
if [ "$BRC" -ne 0 ]; then
  echo "[$(ts)] ⛔ BU 口径残留检查未通过（退出码 $BRC）。按硬约束【不发布】，保留线上上一版本。"
  echo "[$(ts)]    详见 check_bu_scope.py 输出：哪个 BU 页的哪处口径串了。"
  exit 1
fi
echo "[$(ts)] 🔒 BU 口径残留检查通过：三个 BU 页无跨 BU 硬编码。"

# ---------------------------------------------------------------------------
# 第 2 步：校验通过 → 发布到妙搭（发布对象正是刚校验过的同一个包）
# ---------------------------------------------------------------------------
echo "[$(ts)] 🚀 发布到妙搭直传版（app=$APP，推送 $QA_PKG）..."
cd "$BASE" || { echo "[$(ts)] ❌ 无法切换工作目录 $BASE"; exit 1; }

# LARK_CLI 用完整 .cmd 路径，避免 Git-Bash/PowerShell 下 PATH 解析把 C:\Users 错转为
# d:\c\Users 导致模块找不到；--path 用相对路径（脚本已 cd 到 BASE）。
# ⚠️ 务必在 cmd.exe 中执行本脚本，PowerShell 会静默吞掉 lark-cli 的 JSON 报错（见文件头）。
LARK_CLI="C:/Users/1/.workbuddy/binaries/node/cli-connector-packages/lark-cli.cmd"
"$LARK_CLI" apps +html-publish --app-id "$APP" --path "$QA_PKG"
PUB=$?
if [ "$PUB" -ne 0 ]; then
  echo "[$(ts)] ❌ 发布失败（lark-cli 退出码 $PUB）。线上版本未变，请检查网络/登录态。"
  exit 1
fi

echo "[$(ts)] 🎉 发布成功 → https://lopal603906.aiforce.cloud/app/$APP"
echo "[$(ts)] ===== 完成 ====="
exit 0
