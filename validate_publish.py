#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI 早报 / 行情中台 —— 发布前本地渲染校验（纯校验，不负责发布）

流程：
  1) 用与线上发布完全一致的方式构建发布包：
     python auto_miaoda_daily_test.py --no-publish  →  dist-miaoda-test/
     （该脚本负责把全部子页面、inline_*.js、embedded 数据、assets、data、reports
       以及修补 inline_01.js 的 DATA_BASE，全部按线上一致的方式组装。）
  2) 用 qa_server.js 在独立 QA 端口(默认 8890)提供 dist-miaoda-test/（即“将要推送的那个包”）
  3) 用 Playwright 无头浏览器，对构建包内【每一个 .html】逐页校验：
       - 导航成功(200/304)
       - 无致命依赖缺失(.js/.css/.html 出现 4xx/5xx → 子页面必崩/空白)
       - 加载遮罩 #loadingOverlay 已消失(否则用户只看到转圈)
       - 正文已渲染(首页要求 9 张事业部卡片 + 足够文本；子页要求有可见文本)
       - 捕获 pageerror / console error 作为【警告】记录(不单独判失败，避免误杀已上线的良性脚本错误)
  4) 全部通过 → 退出码 0；任意页面失败 → 退出码 1，并写出可读报告

设计原则（对应业务硬约束）：
  - “顶多接受不是最新数据，但不能接受页面无法展示 / 部分子页无法显示”
  - 因此只因【结构渲染失败 / 脚本缺失】而判失败；数据陈旧(.json 404)不判失败。
  - 校验对象是 dist-miaoda-test（真正要推送的包），保证“校验什么就发布什么”。

注意：发布动作由配套的 validate_and_publish.sh 在 Git Bash 中执行（lark-cli 在 bash 下最稳）。
"""
import os, sys, io, json, time, datetime, subprocess, shutil, re

# 2026-09-18 加固：Windows 控制台/重定向管道默认 GBK，print() 构建输出时若含一个
# 非 GBK 码位（某个文件名或数据里的特殊字符）就会抛 UnicodeEncodeError，
# 把整条发布链在本步直接中止（表现为“校验未通过 → 不发布”）。
# 显式把 stdout/stderr 切成 UTF-8 + errors=replace：校验结果永不受打印编码影响。
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

# Node 路径自动探测（取代旧的硬编码 22.22.2/node.exe；避免 Node 修订号升级后崩）
# 详见 _resolve_binaries.py
from _resolve_binaries import find_node_exe, find_python_exe, assert_playwright_ready
NODE_EXE = find_node_exe()

# 浏览器路径：Playwright 自带 chromium 容易因版本号升级/磁盘清理而损坏（2026-09-03 起已观察到
# chromium_headless_shell-1234 不存在的故障）。走系统 Chrome 路径最稳，可参照 verify_live.py /
# regression_dist.py 的做法。两路径都尝试，找不到再回退到 Playwright 自带版本。
CHROME_CANDIDATES = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    os.path.expandvars(r"%LOCALAPPDATA%/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-win64/chrome-headless-shell.exe"),
    os.path.expandvars(r"%LOCALAPPDATA%/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe"),
]
def _resolve_chrome():
    for c in CHROME_CANDIDATES:
        if c and os.path.exists(c):
            return c
    return None
CHROME_EXE = _resolve_chrome()

BASE = "D:/trae/AI Daily report"
DST = os.path.join(BASE, "dist-miaoda-test")          # 与线上发布同包
# 2026-10-14 根治（不再硬编码 managed 3.13.12）：
#   BUILD_CMD 只调 auto_miaoda_daily_test.py 子进程，用标准库即可；用 find_python_exe() 探测。
#   真正的 playwright 校验在 validate() 内 import（见模块顶部自检 → fail-fast）。
PY_EXE = find_python_exe()
BUILD_CMD = [PY_EXE, os.path.join(BASE, "auto_miaoda_daily_test.py"), "--no-publish"]
QA_PORT = int(os.environ.get("QA_PORT", "8890"))
QA_URL = f"http://localhost:{QA_PORT}"

# 模块级日志函数（提到顶部，让模块加载期自检也能用）
def log(m):
    ts = datetime.datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {m}", flush=True)

# 2026-10-14 根治：playwright 自检在模块加载时同步跑（fail-fast）。
# 跑不到的位置（甚至不到 main）就立刻 exit，避免下游隐式崩不易诊断。
# 自检函数找不到会直接 sys.exit(2)，不会返回；这里能跑到说明 OK。
_PYTHON_PW_EXE = assert_playwright_ready()
if not CHROME_EXE:
    log("⚠️  未找到系统 Chrome。Playwright 将回退到自带 chromium，"
        "若自带 chromium 缓存损坏请修复系统 Chrome 后重跑。")
else:
    log(f"🐍 playwright Python: {_PYTHON_PW_EXE}")
    log(f"🌐 Chrome: {CHROME_EXE}")

# 复用构建脚本的"应发布子页"判定（排除垃圾/备份/测试文件），用于完整性闸门
import importlib.util as _ilu
_spec = _ilu.spec_from_file_location("buildmod", os.path.join(BASE, "auto_miaoda_daily_test.py"))
_buildmod = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_buildmod)

# ---------- 1. 构建与线上一致的发布包 ----------
def build_package():
    log(f"==> [1/3] 构建发布包 {DST} (auto_miaoda_daily_test.py --no-publish)")
    r = subprocess.run(BUILD_CMD, cwd=BASE,
                       capture_output=True, encoding="utf-8", errors="ignore", timeout=900)
    # 仅打印尾部，便于排查
    out = (r.stdout or "")[-1500:]
    if out.strip():
        print(out)
    if r.stderr:
        print("STDERR:", r.stderr[-800:])
    if r.returncode != 0:
        log(f"❌ 构建失败（脚本退出码 {r.returncode}），中止校验")
        return False
    if not os.path.exists(os.path.join(DST, "index.html")):
        log("❌ 构建失败：dist-miaoda-test/index.html 不存在")
        return False
    log(f"✅ 构建完成 → {DST}")
    return True

# ---------- 2. 起本地 QA 服务 ----------
def start_server():
    log(f"==> [2/3] 启动 QA 服务 {QA_URL} (服务 {DST})")
    env = dict(os.environ); env["PORT"] = str(QA_PORT)
    srv_log = os.path.join(BASE, ".qa_server.log")
    with open(srv_log, "w", encoding="utf-8") as lf:
        proc = subprocess.Popen([NODE_EXE, os.path.join(BASE, "qa_server.js")],
                                cwd=DST, env=env,
                                stdout=lf, stderr=subprocess.STDOUT)
    import urllib.request
    for _ in range(40):
        if proc.poll() is not None:
            try:
                with open(srv_log, "r", encoding="utf-8", errors="ignore") as f:
                    tail = f.read()[-600:]
            except Exception:
                tail = "(无法读取日志)"
            log("❌ QA 服务进程已退出，日志：\n" + tail)
            return None
        try:
            with urllib.request.urlopen(QA_URL + "/index.html", timeout=2) as resp:
                if resp.status == 200:
                    log("✅ QA 服务就绪")
                    return proc
        except Exception:
            time.sleep(0.5)
    log("❌ QA 服务启动超时")
    proc.terminate()
    return None

# ---------- 发现包内所有页面 ----------
def discover_pages():
    pages = []
    for root, _, files in os.walk(DST):
        for f in files:
            if f.endswith(".html"):
                full = os.path.join(root, f)
                rel = "/" + os.path.relpath(full, DST).replace("\\", "/")
                pages.append(rel)
    return sorted(set(pages))

# ---------- 完整性闸门：源目录子页 vs 构建包子页 ----------
def check_completeness():
    """比对源目录'应发布'的子页 与 构建包实际包含的子页。
    只要有一个该发的页面没进包，返回缺失列表（非空=失败）。
    直接对应业务硬约束：不能漏掉任何本地子页（用户最担心的事）。"""
    src_pages = []
    for f in os.listdir(BASE):
        if f.endswith(".html") and f not in ("index.html",) and not _buildmod.is_excluded_html(f):
            src_pages.append(f)
    sub_src = os.path.join(BASE, "subpages")
    if os.path.isdir(sub_src):
        for r, _, fs in os.walk(sub_src):
            for f in fs:
                if f.endswith(".html") and not _buildmod.is_excluded_html(f):
                    rel = os.path.relpath(os.path.join(r, f), BASE).replace("\\", "/")
                    src_pages.append(rel)
    built = set()
    for r, _, fs in os.walk(DST):
        for f in fs:
            if f.endswith(".html"):
                built.add(os.path.relpath(os.path.join(r, f), DST).replace("\\", "/"))
    missing = sorted(set(src_pages) - built)
    return missing

def check_dedup_logic():
    """去重逻辑守卫：发布包内 industry_news_embedded.html 必须包含事件指纹去重逻辑。
    背景：2026-07-30 曾发生去重逻辑（__eventSig）被旧副本覆盖回退的事故，
    导致'湖南裕能涨价2000元/240亿瓮安'等同事件新闻跨日期重复。此守卫防止再犯。
    缺失任一标记 → 返回缺失列表（非空=失败，禁止发布）。"""
    target = os.path.join(DST, "industry_news_embedded.html")
    required = ["__eventSig", "__newsSim", "dedupDeptData", "dedupAdd"]
    if not os.path.isfile(target):
        return ["industry_news_embedded.html 文件缺失"]
    with open(target, "r", encoding="utf-8") as f:
        content = f.read()
    return [m for m in required if m not in content]

# ---------- 竞品监测台数据闸门 ----------
# 2026-09-17 新增（2026-09-18 扩到 3 个 BU，2026-09-23 改为 registry 推导）。背景：
# strategy_dashboard_expand{,_lpsd,_felt,_sjl}.html 会被自动纳入构建包（auto_miaoda_daily_test.py
# 3.05 节「自动纳入全部根级 .html」），但它们依赖的 *_<bu>.json 走构建脚本 4.36 节的显式清单。
# 一旦某个 BU 漏登记，线上表现是「页面打得开、数据全空」——比 404 更难排查，且正是最怕返工的场景。
# 此外这些引用写在 JS 单引号里（fetch('x.json')），copy_referenced_resources() 使用的
# 双引号正则 (?:src|href)="..." 扫不到，无法靠「被引用即自动入包」兜底 → 本闸门强制校验。
# ⚠️ 2026-09-23：原为逐 BU 手写清单 —— 新增 BU 时此处与构建脚本 4.36 两处都要改，漏一处即静默放行。
#    现改为从 bu_registry.BU_CONFIG 推导（单一事实源），registry 不可用时回退内置清单。
_COMPETITOR_PAGES_FALLBACK = [
    "strategy_dashboard_expand.html",       # 常州锂源
    "strategy_dashboard_expand_lpsd.html",  # 龙蟠时代
    "strategy_dashboard_expand_felt.html",  # 法恩莱特
]

def _competitor_pages():
    """返回需做「数据文件入包」闸门的竞品页清单（BU 页文件名的单一事实源 = bu_registry）。"""
    try:
        import importlib.util as _ilu2
        _p = os.path.join(BASE, "competitor_crawl", "_shared", "bu_registry.py")
        if os.path.isfile(_p):
            _s = _ilu2.spec_from_file_location("_bu_reg_gate", _p)
            _m = _ilu2.module_from_spec(_s)
            _s.loader.exec_module(_m)
            pages = ["strategy_dashboard_expand.html"]
            for _b in _m.BU_CONFIG:
                if _b == "czly":
                    continue
                pages.append(f"strategy_dashboard_expand_{_b}.html")
            return pages
    except Exception:
        pass
    return list(_COMPETITOR_PAGES_FALLBACK)

_COMPETITOR_PAGES = _competitor_pages()

def check_competitor_data():
    """两个承载页必须进包；且页内 fetch('*.json') 引用的每个根相对数据文件都必须真实存在于包内。
    返回问题描述列表（非空=失败，禁止发布）。"""
    problems = []
    for page in _COMPETITOR_PAGES:
        full = os.path.join(DST, page)
        if not os.path.isfile(full):
            problems.append(f"{page} 未进入构建包")
            continue
        with open(full, "r", encoding="utf-8") as f:
            html = f.read()
        for m in re.finditer(r"""fetch\(\s*['"]([^'"]+\.json)['"]""", html):
            rel = m.group(1).split("?")[0].strip()
            if not rel or rel.startswith(("http://", "https://", "/", "data:", "//")):
                continue
            if not os.path.isfile(os.path.join(DST, rel.replace("\\", "/"))):
                problems.append(f"{page} 引用的数据文件未进包：{rel}")
    return problems

# ---------- 全包 fetch 引用的 JSON 数据闸门 ----------
# ⚠️ 2026-09-28 事故：strategy_intel.html 用 fetch('./strategy_intel_feed.json') 加载数据，
#    构建脚本 (auto_miaoda_daily_test.py) 4.36 节只覆盖 competitor_feed_* 系列，漏了
#    strategy_intel_feed.json / strategy_insights.json；上线后集团监控页直接 404 白屏。
#    check_competitor_data() 只校验竞品监测台承载页，strategy_intel 系列不在覆盖范围。
# 防御：扫所有 .html 页面的 fetch('./xxx.json') 引用，逐一确认 dist 内文件存在且大小 > 0。
# 与 4.37 节互为对偶：构建脚本显式登记 + 校验脚本全量兜底，杜绝「单引号 fetch 扫描盲点」再发。
def check_all_fetched_json():
    """遍历包内所有 .html 页面，提取 fetch('./xxx.json') 形式的根相对 JSON 引用，
    确认每个文件都存在于包内且非空。返回问题描述列表（非空=失败，禁止发布）。"""
    problems = []
    _fetch_re = re.compile(r"""fetch\(\s*['"]\.?/?([^'"]+\.json)(?:\?[^'"]*)?['"]""")
    checked = 0
    missing = []
    for root, _dirs, files in os.walk(DST):
        for fn in files:
            if not fn.lower().endswith(".html"):
                continue
            full = os.path.join(root, fn)
            try:
                with open(full, "r", encoding="utf-8", errors="replace") as f:
                    html = f.read()
            except Exception:
                continue
            rel_html = os.path.relpath(full, DST).replace("\\", "/")
            for m in _fetch_re.finditer(html):
                ref = m.group(1).strip().replace("\\", "/")
                if not ref or ref.startswith(("http://", "https://", "/", "data:", "//")):
                    continue
                checked += 1
                fpath = os.path.join(DST, ref)
                if not os.path.isfile(fpath):
                    missing.append(f"{rel_html} → {ref}")
                elif os.path.getsize(fpath) == 0:
                    missing.append(f"{rel_html} → {ref} (0 字节)")
    for item in missing:
        problems.append(f"fetch 数据未入包：{item}")
    log(f"   全包 fetch JSON 闸门扫描 {checked} 个引用，发现 {len(missing)} 个缺失")
    return problems

# ---------- HTML 结构闸门 ----------
_RE_SRC_UNCLOSED = re.compile(r'<script\b[^>]*\bsrc\s*=[^>]*>(?!\s*</script>)', re.I | re.S)
_RE_INLINE_BLOCK = re.compile(r'<script\b(?![^>]*\bsrc\s*=)[^>]*>(.*?)(?=</script>)', re.S | re.I)
_RE_TITLE = re.compile(r'<title\b[^>]*>(.*?)</title>', re.S | re.I)

def check_html_structure():
    """包内页面不得含「会被浏览器吞掉脚本」的标签结构错误。
    A. <script src="..."> 未闭合  → 解析器进入 script-data 直到 EOF，其后内容（含 </body></html>）全被吞掉
    B. 内联 <script> 块内部又出现 <script 字面量 → 该块在字面量处提前收尾，整块 JS 语法错误、完全不执行
    C. <title> 开始标签未闭合、里面又写了 <script> → 整块脚本被当成标题文本，永不执行（标签栏还会显示一堆源码）
    这两类都曾真实造成线上事故（radar_hub 门禁失效、radar_detail_kls/lubricant 整页 JS 报废），
    且浏览器不报明显错误、静态语法检查也查不出，故固化为构建期闸门。
    返回问题描述列表（非空=失败，禁止发布）。"""
    problems = []
    for root, _dirs, files in os.walk(DST):
        for fn in files:
            if not fn.lower().endswith(".html"):
                continue
            full = os.path.join(root, fn)
            rel = os.path.relpath(full, DST).replace("\\", "/")
            try:
                with open(full, "r", encoding="utf-8", errors="replace") as f:
                    text = f.read()
            except Exception as e:
                problems.append(f"{rel} 读取失败：{e}")
                continue
            for m in _RE_SRC_UNCLOSED.finditer(text):
                ln = text.count("\n", 0, m.start()) + 1
                problems.append(f"{rel} L{ln}：<script src> 未闭合（其后内容与 </body> 会被吞掉）")
            for m in _RE_INLINE_BLOCK.finditer(text):
                inner = re.search(r'<script\b', m.group(1), re.I)
                if inner:
                    ln = text.count("\n", 0, m.start(1) + inner.start()) + 1
                    problems.append(f"{rel} L{ln}：内联 <script> 块内部嵌了 <script 字面量（整块 JS 会报废）")
            for m in _RE_TITLE.finditer(text):
                if re.search(r'<script\b|<style\b', m.group(1), re.I):
                    ln = text.count("\n", 0, m.start()) + 1
                    problems.append(f"{rel} L{ln}：<title> 开始标签未闭合、内部写了 <script>（整块脚本会被当成标题文本、永不执行）")
    return problems

# ---------- 3. Playwright 校验 ----------
def validate(pages):
    from playwright.sync_api import sync_playwright
    log(f"==> [3/3] Playwright 校验 {len(pages)} 个页面")
    if CHROME_EXE:
        log(f"   使用浏览器: {CHROME_EXE}（系统/缓存 Chrome）")
        launch_kwargs = {"headless": True,
                         "executable_path": CHROME_EXE,
                         "args": ["--no-sandbox", "--headless=new"]}
    else:
        log("   使用浏览器: Playwright 自带 chromium（系统 Chrome 未找到）")
        launch_kwargs = {"headless": True}
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(**launch_kwargs)
        for path in pages:
            results.append(check_page(browser, path))
        browser.close()
    return results

def check_page(browser, path):
    page = browser.new_page()
    pageerrors, console_errs, bad_res, ext_fail, local_img_404 = [], [], [], [], []
    def _is_external(u):
        # 仅 localhost/127.0.0.1 等本地地址视为站内资源；其余 http(s) 视为外网 CDN
        if "://" not in u:
            return False
        host = u.split("://", 1)[1].split("/", 1)[0].split(":")[0]
        return host not in ("localhost", "127.0.0.1", "0.0.0.0", "::1", "")
    def on_resp(r):
        u, st = r.url, r.status
        # 2026-09-21 改造：原"critical_resource_failures"只收 .js/.css/.html 4xx，
        # 把图片类（.webp/.png/.jpg/.svg）4xx 也算站内失败，否则"今日热点资讯图区"漏图不会被卡（线上灰底/全空）。
        if st >= 400 and (
            u.endswith(".js") or u.endswith(".css") or u.endswith(".html")
            or u.endswith(".webp") or u.endswith(".png") or u.endswith(".jpg")
            or u.endswith(".jpeg") or u.endswith(".svg")
        ):
            if _is_external(u):
                ext_fail.append(f"EXT {st} {u}")
            else:
                bad_res.append(f"{st} {u}")
                # 站内图片 404 单独再收集一份，便于在报告里高亮
                if any(u.lower().endswith(ext) for ext in (".webp", ".png", ".jpg", ".jpeg", ".svg")):
                    local_img_404.append(f"{st} {u}")
    def on_reqfail(r):
        u = r.url
        if (
            u.endswith(".js") or u.endswith(".css") or u.endswith(".html")
            or u.endswith(".webp") or u.endswith(".png") or u.endswith(".jpg")
            or u.endswith(".jpeg") or u.endswith(".svg")
        ):
            if _is_external(u):
                ext_fail.append(f"EXTFAIL {u} {getattr(r.failure,'__str__',lambda:'')()}")
            else:
                bad_res.append(f"REQFAIL {u} {getattr(r.failure,'__str__',lambda:'')()}")
                if any(u.lower().endswith(ext) for ext in (".webp", ".png", ".jpg", ".jpeg", ".svg")):
                    local_img_404.append(f"REQFAIL {u}")
    page.on("pageerror", lambda e: pageerrors.append(str(e)[:300]))
    page.on("console", lambda m: console_errs.append(m.text[:200]) if m.type == "error" else None)
    page.on("response", on_resp)
    page.on("requestfailed", on_reqfail)

    res = {"path": path, "ok": False, "checks": {}}
    try:
        # 使用 domcontentloaded 而非 load，避免等待所有资源（包括 defer 脚本）加载完成
        # defer 脚本是异步的，load 事件可能在它们执行完成前就触发
        resp = page.goto(QA_URL + path, wait_until="domcontentloaded", timeout=30000)
        res["checks"]["nav_status"] = resp.status if resp else None

        # 等待关键元素出现，确保页面渲染完成（主页等待 .matrix-card，其他页等待 body 内容）
        try:
            if path in ("/index.html", "/index_v3.html"):
                page.wait_for_selector(".matrix-card, #content, body", timeout=15000)
            else:
                page.wait_for_selector("body", timeout=15000)
        except Exception:
            pass  # 超时则继续检查，不阻断

        overlay_present = page.evaluate("()=>!!document.getElementById('loadingOverlay')")
        if overlay_present:
            try:
                page.wait_for_selector("#loadingOverlay", state="hidden", timeout=8000)
                overlay_hidden = True
            except Exception:
                overlay_hidden = page.evaluate("""()=>{const e=document.getElementById('loadingOverlay');if(!e)return true;const cs=getComputedStyle(e);const r=e.getBoundingClientRect();return (cs.display==='none'||cs.opacity==='0'||cs.visibility==='hidden'||r.width===0||r.height===0);}""")
        else:
            overlay_hidden = True
        cards = page.eval_on_selector_all(".matrix-card", "els=>els.length")
        body_len = page.evaluate("()=>document.body.innerText.length")
        res["checks"]["overlay_hidden"] = overlay_hidden
        res["checks"]["matrix_cards"] = cards
        res["checks"]["body_text_len"] = body_len
    except Exception as e:
        res["checks"]["exception"] = str(e)[:300]

    res["checks"]["pageerrors"] = pageerrors
    res["checks"]["console_errors"] = console_errs[:5]
    res["checks"]["critical_resource_failures"] = bad_res
    res["checks"]["external_cdn_failures"] = ext_fail
    res["checks"]["local_image_404"] = local_img_404  # 2026-09-21 新增：站内图片 4xx/REQFAIL 单独暴露

    # 判定
    nav_ok = res["checks"].get("nav_status") in (200, 304)
    no_crit = len(bad_res) == 0  # 已包含图片类
    no_local_img_404 = len(local_img_404) == 0  # 2026-09-21 新增：站内图片 404 即阻断
    overlay_ok = res["checks"].get("overlay_hidden", False)
    body = res["checks"].get("body_text_len", 0)
    cards = res["checks"].get("matrix_cards", 0)
    is_main = path in ("/index.html", "/index_v3.html")
    if is_main:
        content_ok = overlay_ok and cards >= 9 and body > 300
    else:
        content_ok = overlay_ok and body > 30

    res["ok"] = bool(nav_ok and no_crit and no_local_img_404 and content_ok)
    page.close()
    return res

# ---------- 报告 ----------
def write_report(results):
    os.makedirs(os.path.join(BASE, "publish_logs"), exist_ok=True)
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    passed = [r for r in results if r["ok"]]
    failed = [r for r in results if not r["ok"]]
    payload = {
        "timestamp": ts, "qa_url": QA_URL,
        "total": len(results), "passed": len(passed), "failed": len(failed),
        "results": results,
    }
    jpath = os.path.join(BASE, "publish_logs", f"validate_{ts}.json")
    lpath = os.path.join(BASE, "publish_logs", f"validate_{ts}.log")
    with open(jpath, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    with open(lpath, "w", encoding="utf-8") as f:
        f.write(f"校验报告 {ts}\nQA={QA_URL}\n通过 {len(passed)}/{len(results)}\n\n")
        for r in results:
            f.write(f"[{'OK' if r['ok'] else 'FAIL'}] {r['path']}  {r['checks']}\n")
    log(f"📄 报告已写出: {lpath}")
    return passed, failed

def main():
    log("=" * 60)
    log("发布前本地渲染校验（与线上同包 dist-miaoda-test）")
    log("=" * 60)
    if not build_package():
        return 1
    # 完整性闸门：任何"应发布"的本地子页若未进入构建包，直接判失败、禁止发布
    missing = check_completeness()
    if missing:
        log("⛔ 完整性闸门失败：以下源目录子页未进入构建包（被漏打包），禁止发布：")
        for m in missing:
            log(f"   - {m}")
        return 1
    log("✅ 完整性闸门通过：源目录所有应发布子页均已进入构建包")
    # 去重逻辑守卫：行业新闻页的事件指纹去重逻辑若被回退/丢失，禁止发布
    dedup_missing = check_dedup_logic()
    if dedup_missing:
        log("⛔ 去重逻辑守卫失败：industry_news_embedded.html 缺失以下去重标记（疑似被旧副本覆盖回退），禁止发布：")
        for m in dedup_missing:
            log(f"   - {m}")
        return 1
    log("✅ 去重逻辑守卫通过：事件指纹去重逻辑完整（__eventSig/__newsSim/dedupDeptData/dedupAdd）")
    # 竞品监测台数据闸门：承载页进包 + 其 fetch 的数据文件也必须进包（防「页面空数据」）
    comp_problems = check_competitor_data()
    if comp_problems:
        log("⛔ 竞品监测台数据闸门失败：以下问题会导致线上「页面可打开但数据全空」，禁止发布：")
        for m in comp_problems:
            log(f"   - {m}")
        return 1
    log(f"✅ 竞品监测台数据闸门通过：{len(_COMPETITOR_PAGES)} 个承载页及其数据文件均在包内")
    # 全包 fetch 数据闸门：兜底策略中心/其他新增页面的单引号 fetch 引用
    # （防 2026-09-28 strategy_intel_feed.json 漏拷再次静默上线）
    fetched_problems = check_all_fetched_json()
    if fetched_problems:
        log("⛔ 全包 fetch 数据闸门失败：以下页面引用的 JSON 数据未进入构建包，线上将 404/空数据，禁止发布：")
        for m in fetched_problems[:20]:
            log(f"   - {m}")
        if len(fetched_problems) > 20:
            log(f"   ... 另有 {len(fetched_problems) - 20} 处")
        return 1
    log("✅ 全包 fetch 数据闸门通过：所有页面 fetch('./xxx.json') 引用的数据文件均在包内")
    # HTML 结构闸门：检测「会被浏览器吞掉脚本」的标签错误（radar 系列线上事故的根因类型）
    struct_problems = check_html_structure()
    if struct_problems:
        log("⛔ HTML 结构闸门失败：以下页面存在标签结构错误（脚本会被吞 / 页面可能显示源码），禁止发布：")
        for m in struct_problems[:20]:
            log(f"   - {m}")
        if len(struct_problems) > 20:
            log(f"   ... 另有 {len(struct_problems) - 20} 处")
        return 1
    log("✅ HTML 结构闸门通过：包内页面无 <script> 标签嵌套 / 未闭合错误")
    proc = start_server()
    if not proc:
        return 1
    try:
        pages = discover_pages()
        if not pages:
            log("❌ 构建包内未发现任何 .html 页面")
            return 1
        log(f"发现 {len(pages)} 个页面待校验：{pages}")
        results = validate(pages)
    finally:
        try:
            proc.terminate()
        except Exception:
            pass
    passed, failed = write_report(results)
    log("-" * 60)
    for r in failed:
        log(f"❌ {r['path']}  {r['checks']}")
    log(f"结果: 通过 {len(passed)}/{len(results)}")
    if failed:
        log("⛔ 校验未通过 —— 请勿发布（保持线上上一版本）")
        return 1
    log("✅ 全部页面渲染正常 —— 可以发布")
    return 0

if __name__ == "__main__":
    sys.exit(main())
