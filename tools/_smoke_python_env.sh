#!/usr/bin/env bash
# =============================================================================
# tools/_smoke_python_env.sh
# Python + Playwright + Chrome 环境烟测（~2 秒）
# =============================================================================
# 【背景 / 使用场景】
# 2026-10-14 故障：managed Python 3.13.12 裸装无 playwright，
#              workbuddy 编排环境把它前置注入到 PATH，
#              validate_and_publish.sh 内部 import playwright 时撞 ModuleNotFoundError，
#              整个发布链中断，无声失败。
#
# 根治后（_resolve_binaries.py / validate_publish.py 自检 / validate_and_publish.sh 自探测）
# 不再撞这个坑。但人为排障时仍需要一个"快速知道当前系统 Python 解释器"是否健康的脚本：
#   - 当 validate_and_publish.sh 报 "未找到已装 playwright 的 Python" 时，跑这个脚本看候选清单
#   - 当怀疑 PATH 被污染时，跑这个脚本核对
#   - 日常 sanity check（每日开工前 1 秒验一下）
#
# 【用法】
#   bash tools/_smoke_python_env.sh
#   # 或在 PowerShell / cmd 下：
#   bash /d/trae/AI\ Daily\ report/tools/_smoke_python_env.sh
#
# 退出码：0 = 一切就绪；1 = Python 可跑但 playwright/chrome 缺失；
#         2 = 任何 Python 都跑不起来（严重）
# =============================================================================

ts() { date "+%Y-%m-%d %H:%M:%S"; }
_source_safe() { [ -f "$1" ] && source "$1"; }

# source PATH 自愈（与 validate_and_publish.sh 同源）
_source_safe "D:/trae/AI Daily report/tools/_env_path.sh"

# 候选清单（与 validate_and_publish.sh 同源 —— 单一事实源是 _resolve_binaries.py
# 但 bash 这边也要硬编码一份以便独立运行—— 此处刻意保持与 .sh 一致）
_PY_CANDIDATES_RAW=(
  "C:/Users/1/.workbuddy/binaries/python/envs/default/Scripts/python.exe"
  "C:/Users/1/AppData/Local/Programs/Python/Python312/python.exe"
  "C:/Users/1/.workbuddy/binaries/python/versions/3.13.12/python.exe"
)
if [ -d "C:/Users/1/.workbuddy/binaries/python/versions" ]; then
  while IFS= read -r _v; do
    [ -f "C:/Users/1/.workbuddy/binaries/python/versions/$_v/python.exe" ] && \
      _PY_CANDIDATES_RAW+=("C:/Users/1/.workbuddy/binaries/python/versions/$_v/python.exe")
  done < <(ls -1 "C:/Users/1/.workbuddy/binaries/python/versions" 2>/dev/null)
fi

# 去重 + 保留顺序（避免打印 4 行一样的 3.13.12）
_PY_CANDIDATES=()
declare -A _PY_SEEN=()
for _cand in "${_PY_CANDIDATES_RAW[@]}"; do
  if [ -z "${_PY_SEEN[$_cand]:-}" ]; then
    _PY_CANDIDATES+=("$_cand")
    _PY_SEEN[$_cand]=1
  fi
done

echo "[$(ts)] ===== Python + Playwright + Chrome 环境烟测 ====="

# 1. 任何可跑 Python？
echo ""
echo "── 候选 1：任意可跑 Python（_probe_python_runnable）──"
RC_ANY=1
for cand in "${_PY_CANDIDATES[@]}"; do
  if [ -f "$cand" ] && "$cand" --version >/dev/null 2>&1; then
    _ver=$("$cand" --version 2>&1 | head -1)
    echo "  ✅ $cand"
    echo "        $_ver"
    RC_ANY=0
  else
    echo "  ❌ $cand (not found or --version failed)"
  fi
done
if [ "$RC_ANY" -ne 0 ]; then
  echo ""
  echo "⛔ 任何一个可跑 Python 都没找到！请安装 Python 3.10+ 或修复 PATH。"
  exit 2
fi

# 2. 已装 playwright 的 Python？
echo ""
echo "── 候选 2：已装 playwright 的 Python（_probe_python_playwright）──"
RC_PW=1
for cand in "${_PY_CANDIDATES[@]}"; do
  if [ -f "$cand" ]; then
    if "$cand" -c "from playwright.sync_api import sync_playwright" >/dev/null 2>&1; then
      _ver=$("$cand" -c "import playwright, sys; print(getattr(playwright,'__version__','?'))" 2>&1 | tail -1)
      echo "  ✅ $cand (playwright $_ver)"
      RC_PW=0
    else
      echo "  ❌ $cand (no playwright)"
    fi
  else
    echo "  ❌ $cand (not found)"
  fi
done

# 3. 系统 Chrome？
echo ""
echo "── 候选 3：系统 Chrome ──"
RC_CHROME=1
_CHROME_CANDS=(
  "C:/Program Files/Google/Chrome/Application/chrome.exe"
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
)
for cand in "${_CHROME_CANDS[@]}"; do
  if [ -f "$cand" ]; then
    _ver=$("$cand" --version 2>&1 | head -1)
    echo "  ✅ $cand"
    echo "        $_ver"
    RC_CHROME=0
  fi
done

echo ""
echo "[$(ts)] ===== 烟测结论 ====="
if [ "$RC_PW" -eq 0 ] && [ "$RC_CHROME" -eq 0 ]; then
  echo "  ✅ Python+playwright+Chrome 全就绪 → validate_and_publish.sh 应能跑通"
  echo ""
  echo "验证脚本自检（推荐最终确认方式）："
  cat <<'PYEOF'

  # 在任意候选 Python 下执行：
  C:/Users/1/AppData/Local/Programs/Python/Python312/python.exe -c "
from _resolve_binaries import find_python_with_playwright, find_python_exe
print('runnable   :', find_python_exe())
print('with_pw    :', find_python_with_playwright())
"

PYEOF
  exit 0
elif [ "$RC_PW" -ne 0 ]; then
  echo "  ⛔ 没找到已装 playwright 的 Python。请："
  echo "       C:/Users/1/AppData/Local/Programs/Python/Python312/python.exe -m pip install playwright"
  echo "       C:/Users/1/AppData/Local/Programs/Python/Python312/python.exe -m playwright install chromium"
  exit 1
elif [ "$RC_CHROME" -ne 0 ]; then
  echo "  ⚠️  Python+playwright OK，但没找到系统 Chrome。"
  echo "       Playwright 会回退自带 chromium，但如损坏请安装系统 Chrome。"
  exit 1
fi
