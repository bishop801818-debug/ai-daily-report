# -*- coding: utf-8 -*-
"""
Node.js / lark-cli / Python 路径自动探测工具
==============================================

【背景 / 背景问题】
项目历史上 Node.js 升级过两次版本号后缀（22.22.2 → 22.22.2-2 → 后续可能继续变），
期间多个 Python 脚本把 node.exe / lark-cli.cmd 路径硬编码到源码里，导致升级时
只有当时正在维护的脚本跟着改了，其它脚本引用了一个不存在的目录路径，
subprocess.Popen 触发 FileNotFoundError [WinError 2]。

为根治该问题，本模块统一对外暴露函数：
    - find_node_exe()              探测 node.exe 真实路径
    - find_lark_cli_cmd()          探测 lark-cli.cmd 真实路径
    - find_python_exe()            探测「任意可跑 Python」真实路径（标准库级别）
    - find_python_with_playwright() 探测「已装 playwright 的 Python」真实路径
    - assert_playwright_ready()    自检入口：在调用方启动时立刻 fail-fast

实现要点：
1. 候选路径白名单（connector 包是历史稳定源、versions 下最新修订号是兜底）
2. 优先用 --version / import 测试探测可用性，避免 PATH 解析歧义
3. 模块级缓存：每个进程只探测一次
4. 探测失败时回退到约定最佳猜测，让上层脚本报出真实错误
5. WORKBUDDY_ORCHESTRATED：标记本进程是否在 workbuddy 编排环境（防 managed 3.13 被前置注入）

【使用示例】
    from _resolve_binaries import find_node_exe, find_lark_cli_cmd, find_python_with_playwright
    NODE = find_node_exe()
    LARK = find_lark_cli_cmd()
    PY = find_python_with_playwright()
    subprocess.run([NODE, "qa_server.js"])
    subprocess.run([LARK, "apps", "+html-publish", ...])
    subprocess.run([PY, "validate_publish.py"])

【创建日期】2026-09-03（自动化 1785335632183 连续两轮失败后落地）
【2026-10-14 扩展】增加 find_python_with_playwright() + assert_playwright_ready()；
                  根因：managed 3.13.12 裸装无 playwright，而 workbuddy 编排环境
                  会把其 bin 路径前置注入到 PATH，导致硬编码 3.13.12 的脚本每次跑
                  都撞 ModuleNotFoundError。
"""
import os
import subprocess
import sys
from typing import Optional, List


# ---------------------------------------------------------------------------
# 候选路径常量
# ---------------------------------------------------------------------------
# 1) PATH 里直接可用的 "node" / "lark-cli"（最高优先级 — 不依赖任何硬编码路径）
# 2) cli-connector-packages/lark-cli.cmd（历史稳定副本，单独保留）
# 3) versions/<最新修订>/node.exe 与 lark-cli.cmd（managed runtime 真实位置）
#
# 注意：必须用 "C:/..." 形式而非 "/c/..." MSYS 形式（参见 download_feishu_docx_as_json.py）。
# ---------------------------------------------------------------------------
_NODE_CANDIDATES: List[str] = [
    "node",                                                                     # 1. PATH 全局
    r"C:/Users/1/.workbuddy/binaries/node/versions/22.22.2-2/node.exe",          # 2. 当前 managed
]

_LARK_CLI_CANDIDATES: List[str] = [
    "lark-cli",                                                                 # 1. PATH 全局
    r"C:/Users/1/.workbuddy/binaries/node/cli-connector-packages/lark-cli.cmd", # 2. 历史稳定副本
    r"C:/Users/1/.workbuddy/binaries/node/versions/22.22.2-2/lark-cli.cmd",     # 3. managed runtime
]

_NODE_BASE_DIR = r"C:/Users/1/.workbuddy/binaries/node/versions"

# ---------------------------------------------------------------------------
# Python 候选顺序（按「已装 playwright 的可能性」由高到低）
#
# 历史背景（2026-10-14 incident）：
#   - workbuddy managed Python (versions/3.13.12) 是【裸装】——没装 playwright
#   - 系统 Python 3.12.10 是最早装 playwright 的（带 LibreOffice / kafka）
#   - workbuddy venv (envs/default) 也装了 playwright
#   - workbuddy 编排环境会在 PATH 前置注入 versions/3.13.12 的 bin 目录
#   - 任何"硬编码 3.13.12 + 跑 validate_publish.py"的脚本都会在第 312 行 import playwright 撞 ModuleNotFoundError
#
# 此处的解决：把已知 playwright 可用的两个解释器放在候选最前面，
# managed 3.13.12 作为最后兜底（实际跑时仍会失败，但至少失败信息是清晰的）。
# ---------------------------------------------------------------------------
_PYTHON_PLAYWRIGHT_CANDIDATES: List[str] = [
    r"C:/Users/1/AppData/Local/Programs/Python/Python312/python.exe",      # 1. 系统 Python 3.12（最早装 playwright）
    r"C:/Users/1/.workbuddy/binaries/python/envs/default/Scripts/python.exe",  # 2. workbuddy venv default
]

_PYTHON_RUNNABLE_CANDIDATES: List[str] = [
    "python",                                                              # 1. PATH 全局
    "python3",                                                             # 2. PATH 全局
] + _PYTHON_PLAYWRIGHT_CANDIDATES                                         # 3-4. playwright 可用也是可跑

_PYTHON_VERSIONS_DIR = r"C:/Users/1/.workbuddy/binaries/python/versions"

# ---------------------------------------------------------------------------
# 模块级缓存（每个 Python 进程只探测一次）
# ---------------------------------------------------------------------------
_NODE_CACHED: Optional[str] = None
_LARK_CACHED: Optional[str] = None
_PYTHON_RUNNABLE_CACHED: Optional[str] = None
_PYTHON_PW_CACHED: Optional[str] = None


def _scan_versions_for_node() -> List[str]:
    """扫描 versions/ 目录下所有 node.exe（应对未来修订号再次升级）。"""
    if not os.path.isdir(_NODE_BASE_DIR):
        return []
    found = []
    try:
        for entry in sorted(os.listdir(_NODE_BASE_DIR), reverse=True):
            # 跳过临时目录（*.installing.*、*.extract_temp*、current 符号链接）
            if entry.startswith(".") or "installing" in entry or "extract_temp" in entry:
                continue
            cand = os.path.join(_NODE_BASE_DIR, entry, "node.exe")
            if os.path.isfile(cand):
                found.append(cand)
    except OSError:
        pass
    return found


def _scan_versions_for_lark_cli() -> List[str]:
    """扫描 versions/ 目录下所有 lark-cli.cmd。"""
    if not os.path.isdir(_NODE_BASE_DIR):
        return []
    found = []
    try:
        for entry in sorted(os.listdir(_NODE_BASE_DIR), reverse=True):
            if entry.startswith(".") or "installing" in entry or "extract_temp" in entry:
                continue
            cand = os.path.join(_NODE_BASE_DIR, entry, "lark-cli.cmd")
            if os.path.isfile(cand):
                found.append(cand)
    except OSError:
        pass
    return found


def _probe(args: List[str]) -> bool:
    """探测一个二进制是否可用：用 --version 试跑，能正常返回则视为可用。"""
    try:
        r = subprocess.run(
            args + ["--version"],
            capture_output=True,
            timeout=15,
            encoding="utf-8",
            errors="ignore",
        )
        return r.returncode == 0
    except (FileNotFoundError, PermissionError, OSError, subprocess.TimeoutExpired):
        return False


def find_node_exe() -> str:
    """
    探测可用的 node.exe 真实路径。优先顺序：
      1. PATH 中的 "node"
      2. versions/<最新修订>/node.exe（自动扫描最新修订号）
      3. 候选白名单（兜底）

    若全部失败，返回 best-guess（硬编码约定位置），让上层脚本报出真实错误。
    """
    global _NODE_CACHED
    if _NODE_CACHED is not None:
        return _NODE_CACHED

    candidates: List[str] = ["node"] + _scan_versions_for_node() + _NODE_CANDIDATES
    seen = set()
    for cand in candidates:
        if cand in seen:
            continue
        seen.add(cand)
        if _probe([cand]):
            _NODE_CACHED = cand
            return cand

    # 全部失败：返回最佳猜测
    _NODE_CACHED = _NODE_CANDIDATES[-1]
    return _NODE_CACHED


def find_lark_cli_cmd() -> str:
    """
    探测可用的 lark-cli.cmd 真实路径。优先顺序：
      1. PATH 中的 "lark-cli"
      2. cli-connector-packages/lark-cli.cmd（历史稳定源）
      3. versions/<最新修订>/lark-cli.cmd（自动扫描）
      4. 候选白名单（兜底）

    若全部失败，返回最佳猜测。
    """
    global _LARK_CACHED
    if _LARK_CACHED is not None:
        return _LARK_CACHED

    candidates: List[str] = (
        ["lark-cli", "lark-cli.cmd"]
        + [r"C:/Users/1/.workbuddy/binaries/node/cli-connector-packages/lark-cli.cmd"]
        + _scan_versions_for_lark_cli()
        + _LARK_CLI_CANDIDATES
    )
    seen = set()
    for cand in candidates:
        if cand in seen:
            continue
        seen.add(cand)
        if _probe([cand]):
            _LARK_CACHED = cand
            return cand

    # 全部失败：返回最佳猜测
    _LARK_CACHED = _LARK_CLI_CANDIDATES[-1]
    return _LARK_CACHED


def reset_cache() -> None:
    """清空缓存（用于测试或多轮切换路径场景）。"""
    global _NODE_CACHED, _LARK_CACHED, _PYTHON_RUNNABLE_CACHED, _PYTHON_PW_CACHED
    _NODE_CACHED = None
    _LARK_CACHED = None
    _PYTHON_RUNNABLE_CACHED = None
    _PYTHON_PW_CACHED = None


# ===========================================================================
# Python 解释器探测（2026-10-14 落地，根治 managed 3.13.12 无 playwright 故障）
# ===========================================================================

def _scan_versions_for_python() -> List[str]:
    """扫描 versions/ 目录下所有 python.exe（应对未来修订号再次升级）。"""
    found: List[str] = []
    if not os.path.isdir(_PYTHON_VERSIONS_DIR):
        return found
    try:
        for entry in sorted(os.listdir(_PYTHON_VERSIONS_DIR), reverse=True):
            if entry.startswith(".") or "installing" in entry or "extract_temp" in entry:
                continue
            cand = os.path.join(_PYTHON_VERSIONS_DIR, entry, "python.exe")
            if os.path.isfile(cand):
                found.append(cand)
    except OSError:
        pass
    return found


def _probe_python_runnable(py: str) -> bool:
    """检查某 Python 至少能跑 (`--version`)。"""
    try:
        r = subprocess.run(
            [py, "--version"],
            capture_output=True, timeout=10, encoding="utf-8", errors="ignore",
        )
        return r.returncode == 0
    except (FileNotFoundError, PermissionError, OSError, subprocess.TimeoutExpired):
        return False


def _probe_python_with_playwright(py: str) -> bool:
    """检查某 Python 能否 `import playwright.sync_api`（不实际启动浏览器，只 import）。"""
    try:
        r = subprocess.run(
            [py, "-c", "from playwright.sync_api import sync_playwright; pass"],
            capture_output=True, timeout=20, encoding="utf-8", errors="ignore",
        )
        return r.returncode == 0
    except (FileNotFoundError, PermissionError, OSError, subprocess.TimeoutExpired):
        return False


def find_python_exe() -> str:
    """
    探测「任意可跑 Python」的真实路径。仅需标准库即可（用于 BUILD 子进程）。
    优先顺序：
      1. 当前进程的 sys.executable（最准确，避免解释器分裂）
      2. PATH 中的 "python" / "python3"
      3. 系统 Python 3.12 + workbuddy venv（playwright 可用也是可跑）
      4. 候选白名单兜底
      5. versions/<任意最新>/python.exe（managed，全裸装可能不可写但一般可跑）

    全部失败抛 FileNotFoundError。
    """
    global _PYTHON_RUNNABLE_CACHED
    if _PYTHON_RUNNABLE_CACHED is not None:
        return _PYTHON_RUNNABLE_CACHED

    candidates: List[str] = (
        [sys.executable]
        + _PYTHON_RUNNABLE_CANDIDATES
        + _scan_versions_for_python()
    )
    seen = set()
    for cand in candidates:
        if not cand or cand in seen:
            continue
        seen.add(cand)
        if _probe_python_runnable(cand):
            _PYTHON_RUNNABLE_CACHED = cand
            return cand
    raise FileNotFoundError(
        "未找到任何可运行的 Python。请检查 PATH 或安装任意一个 Python 3.10+。"
    )


def find_python_with_playwright() -> str:
    """
    探测「已装 playwright 的 Python」真实路径（用于 VALIDATE 校验）。
    优先顺序：
      1. 当前进程的 sys.executable（最准确）
      2. 系统 Python 3.12 + workbuddy venv（历史已知 playwright 可用）
      3. 版本目录扫描兜底（包含 managed 但其多半不可用，仅作最佳猜测）

    全部失败抛 FileNotFoundError（自动携带安装指令）。
    """
    global _PYTHON_PW_CACHED
    if _PYTHON_PW_CACHED is not None:
        return _PYTHON_PW_CACHED

    candidates: List[str] = (
        [sys.executable]
        + _PYTHON_PLAYWRIGHT_CANDIDATES
        + _scan_versions_for_python()
    )
    seen = set()
    for cand in candidates:
        if not cand or cand in seen:
            continue
        seen.add(cand)
        if _probe_python_with_playwright(cand):
            _PYTHON_PW_CACHED = cand
            return cand
    raise FileNotFoundError(
        "未找到已装 playwright 的 Python。请安装：\n"
        "  C:/Users/1/AppData/Local/Programs/Python/Python312/python.exe -m pip install playwright\n"
        "  C:/Users/1/AppData/Local/Programs/Python/Python312/python.exe -m playwright install chromium"
    )


def assert_playwright_ready() -> str:
    """
    启动期自检：调用方应在脚本入口先调用本函数。
    返回值：可用的 python 路径（方便调用方缓存到模块级变量）。
    失败时打印结构化错误后 sys.exit(2)（fail-closed，绝不静默放行）。
    """
    try:
        return find_python_with_playwright()
    except FileNotFoundError as e:
        sys.stderr.write("=" * 78 + "\n")
        sys.stderr.write("⚠️  Playwright 自检失败 — 发布前校验不可继续\n")
        sys.stderr.write("=" * 78 + "\n")
        sys.stderr.write(str(e) + "\n")
        sys.stderr.write("=" * 78 + "\n")
        sys.exit(2)


if __name__ == "__main__":
    # 自检：直接运行本文件可查看当前探测到的真实路径
    print("node.exe               →", find_node_exe())
    print("lark-cli               →", find_lark_cli_cmd())
    try:
        print("python (runnable)      →", find_python_exe())
    except FileNotFoundError as e:
        print("python (runnable)      → ⚠️", e)
    try:
        print("python (with PW)       →", find_python_with_playwright())
    except FileNotFoundError as e:
        print("python (with PW)       → ⚠️", e)