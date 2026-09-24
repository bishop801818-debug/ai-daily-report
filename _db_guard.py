#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
pre-commit 磁盘基线守护 —— 保护「未被 git 跟踪的核心数据文件」。

背景（2026-09-18 实测）
------------------------------------------------------------------
pre-commit 原有的「数据库回退检测」用 git 比对 staged vs HEAD，但它的 7 个
目标文件 `*_embedded_data.js`（18.05 MB）**从未被 git 跟踪**
（.gitignore 第 40 行 `/*_embedded_data.js`），其源头 `data/*_all_data.json`
（23 MB）也未跟踪 ⇒ 该检查在 git 层面永远无法触发（对象不在索引里）。

这些大文件是有意排除在 git 之外的（避免仓库膨胀），真正的兜底是磁盘 +
`_archive/`。为让「数据不被静默回退/清空」这一保护真正生效，本脚本改用
**磁盘基线**做守护，不依赖 git：

  · 文件缺失                        -> 阻止
  · 体积相对基线缩减超过阈值         -> 阻止
  · 表数量减少                      -> 阻止
  · 某表「最新日期」倒退超过阈值      -> 阻止

基线文件：`<repo>/_db_guard_baseline.json`（自动创建 / 检查通过后自动刷新）

用法
------------------------------------------------------------------
  python _db_guard.py --check     # 检查（有异常 exit 1；通过则刷新基线）
  python _db_guard.py --update    # 仅刷新基线，不检查
  python _db_guard.py --show      # 打印当前基线与各文件概况
  python _db_guard.py --selftest  # 内置用例自检

环境变量
------------------------------------------------------------------
  DB_GUARD_MAX_SHRINK   体积缩减上限（百分比），默认 30
  DB_GUARD_MAX_LAG      表最新日期允许倒退的月数，默认 2
  DB_GUARD_TARGETS      追加目标（逗号分隔，相对仓库根）
  DB_GUARD_VERBOSE=1    打印每个文件的概况
"""
import json
import os
import re
import sys
import time

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.dirname(os.path.abspath(__file__))
BASELINE = os.path.join(ROOT, "_db_guard_baseline.json")
BASELINE_VERSION = 1

# 生成物：页面/发布包实际读取的嵌入数据
GENERATED = [
    "recycling_embedded_data.js",
    "lib_battery_embedded_data.js",
    "lfp_embedded_data.js",
    "electrolyte_embedded_data.js",
    "carbonate_embedded_data.js",
    "ternary_embedded_data.js",
    "automotive_embedded_data.js",
]

DATE_KEYS = ("日期", "当前日期", "时间", "月份", "date")
_DEC = json.JSONDecoder()
_DATE_RE = re.compile(r"^\s*(\d{4})\s*[年\-/.]\s*(\d{1,2})")
_YM_RE = re.compile(r"^(\d{4})-(\d{2})$")


def env_int(name, default):
    try:
        return int(str(os.environ.get(name, "") or default).strip())
    except Exception:
        return default


def targets():
    out = list(GENERATED)
    ddir = os.path.join(ROOT, "data")
    if os.path.isdir(ddir):
        for fn in sorted(os.listdir(ddir)):
            if fn.endswith("_all_data.json"):
                out.append("data/" + fn)
    extra = os.environ.get("DB_GUARD_TARGETS", "") or ""
    for x in extra.split(","):
        x = x.strip().replace("\\", "/")
        if x:
            out.append(x)
    seen, uniq = set(), []
    for x in out:
        if x not in seen:
            seen.add(x)
            uniq.append(x)
    return uniq


def norm_date(value):
    """把 2026-07 / 2026年5月 / 2026/7/ / 2026.07 统一成 YYYY-MM"""
    s = str(value or "").strip()
    m = _DATE_RE.match(s)
    if m:
        return "%04d-%02d" % (int(m.group(1)), int(m.group(2)))
    return s[:7]


def month_index(ym):
    m = _YM_RE.match(ym or "")
    return int(m.group(1)) * 12 + int(m.group(2)) if m else None


def load_jsonish(path):
    """提取文件里第一个 JSON 对象：兼容纯 JSON 与 `const X = {...};` 包裹"""
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
    except Exception:
        return None
    idx = content.find("{")
    if idx < 0:
        return None
    try:
        obj, _ = _DEC.raw_decode(content, idx)
        if isinstance(obj, dict):
            return obj
    except Exception:
        pass
    end = content.rfind("}")
    if end > idx:
        try:
            obj = json.loads(content[idx:end + 1])
            if isinstance(obj, dict):
                return obj
        except Exception:
            return None
    return None


def profile(path):
    """返回 {size, mtime, tables, latest} —— 无 tables 时 tables=None"""
    try:
        st = os.stat(path)
    except Exception:
        return None
    rec = {"size": st.st_size, "mtime": int(st.st_mtime), "tables": None, "latest": {}}
    obj = load_jsonish(path)
    if not isinstance(obj, dict):
        return rec
    tabs = obj.get("tables")
    if not isinstance(tabs, list):
        return rec
    rec["tables"] = len(tabs)
    latest = {}
    for t in tabs:
        if not isinstance(t, dict):
            continue
        name = t.get("table_name") or t.get("name") or ""
        if not name:
            continue
        mx = ""
        for row in (t.get("data") or []):
            if not isinstance(row, dict):
                continue
            for k in DATE_KEYS:
                v = norm_date(row.get(k, ""))
                if v and v > mx:
                    mx = v
        latest[name] = mx
    rec["latest"] = latest
    return rec


def load_baseline():
    if not os.path.exists(BASELINE):
        return {}
    try:
        with open(BASELINE, "r", encoding="utf-8") as f:
            return (json.load(f) or {}).get("files", {}) or {}
    except Exception:
        return {}


def save_baseline(files):
    data = {
        "version": BASELINE_VERSION,
        "updated": time.strftime("%Y-%m-%d %H:%M:%S"),
        "generated_by": "_db_guard.py",
        "note": "pre-commit 磁盘基线守护的快照；被保护对象未纳入 git 跟踪。",
        "files": files,
    }
    tmp = BASELINE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1, sort_keys=True)
    os.replace(tmp, BASELINE)


def check(verbose=False):
    max_shrink = env_int("DB_GUARD_MAX_SHRINK", 30)
    max_lag = env_int("DB_GUARD_MAX_LAG", 2)
    base = load_baseline()
    first_run = not base
    findings = []          # (level, message, rel)
    newbase = {}
    total_bytes = 0

    for rel in targets():
        path = os.path.join(ROOT, rel.replace("/", os.sep))
        if not os.path.exists(path):
            findings.append(("BLOCK", "文件缺失", rel))
            continue
        try:
            st = os.stat(path)
        except Exception:
            findings.append(("BLOCK", "无法读取文件属性", rel))
            continue
        size, mtime = st.st_size, int(st.st_mtime)
        total_bytes += size
        old = base.get(rel)

        # 快速路径：size+mtime 未变 => 内容必然未变，跳过昂贵的 JSON 解析
        if old and old.get("size") == size and old.get("mtime") == mtime:
            newbase[rel] = old
            continue

        pr = profile(path)
        if pr is None:
            findings.append(("WARN", "无法读取，仅按体积记录", rel))
            pr = {"size": size, "mtime": mtime, "tables": None, "latest": {}}
        pr["size"], pr["mtime"] = size, mtime
        newbase[rel] = pr

        if old is None:
            findings.append(("INFO", "首次纳入基线 size=%d tables=%s"
                             % (size, pr["tables"]), rel))
            continue

        osz = old.get("size") or 0
        if osz > 0:
            shrink = (osz - size) / float(osz) * 100.0
            if shrink > max_shrink:
                findings.append(("BLOCK", "体积缩减 %.1f%% (%d -> %d B)"
                                 % (shrink, osz, size), rel))

        ot, nt = old.get("tables"), pr["tables"]
        if isinstance(ot, int) and isinstance(nt, int) and nt < ot:
            findings.append(("BLOCK", "表数量减少 %d -> %d" % (ot, nt), rel))

        for name, od in (old.get("latest") or {}).items():
            nd = pr["latest"].get(name)
            if nd is None:
                findings.append(("BLOCK", "表消失: %s" % name, rel))
                continue
            lag = (month_index(od) or 0) - (month_index(nd) or 0)
            if od and nd and lag > max_lag:
                findings.append(("BLOCK", "表「%s」最新日期倒退 %s -> %s（%d 个月）"
                                 % (name, od, nd, lag), rel))

        if verbose:
            findings.append(("INFO", "size=%d tables=%s" % (size, pr["tables"]), rel))

    blocks = [f for f in findings if f[0] == "BLOCK"]
    warns = [f for f in findings if f[0] == "WARN"]

    if first_run and not blocks:
        print("[db-guard] 首次运行：已建立基线（%d 个文件，%.1f MB）"
              % (len(newbase), total_bytes / 1048576.0))
        for lvl, msg, rel in findings:
            if lvl == "INFO":
                print("  [db-guard] %s : %s" % (rel, msg))
        save_baseline(newbase)
        return 0

    for lvl, msg, rel in findings:
        if lvl in ("BLOCK", "WARN"):
            tag = "阻止" if lvl == "BLOCK" else "警告"
            print("  [db-guard·%s] %s : %s" % (tag, rel, msg))

    if blocks:
        print("")
        print("  [db-guard] 检测到 %d 项核心数据异常（阈值：体积缩减>%d%% / 日期倒退>%d 月）"
              % (len(blocks), max_shrink, max_lag))
        print("  [db-guard] 这些文件未纳入 git，无法用 git 恢复；请从 _archive/ 找最近副本比对")
        print("  [db-guard] 确认是有意的数据缩减时：git commit --no-verify 或")
        print("             设置 DB_GUARD_MAX_SHRINK=100 DB_GUARD_MAX_LAG=999 后重试")
        print("  [db-guard] 若数据已修好，基线会在下次 --check 通过时自动刷新")
        return 1

    save_baseline(newbase)
    print("[db-guard] OK — %d 个核心数据文件（%.1f MB）%s"
          % (len(newbase), total_bytes / 1048576.0,
             "，%d 项警告" % len(warns) if warns else "，无异常"))
    return 0


def show():
    files = load_baseline()
    if not files:
        print("[db-guard] 基线不存在：%s" % BASELINE)
    else:
        print("[db-guard] 基线 %s" % BASELINE)
        print("  文件数 %d" % len(files))
    for rel in targets():
        path = os.path.join(ROOT, rel.replace("/", os.sep))
        rec = profile(path) if os.path.exists(path) else None
        b = files.get(rel)
        if rec is None:
            print("  %-34s MISSING" % rel)
            continue
        tabs = rec["tables"]
        ntabs = len(rec["latest"])
        flag = ""
        if b:
            shrink = ((b.get("size") or 0) - rec["size"]) / float(b.get("size") or 1) * 100.0
            if shrink > env_int("DB_GUARD_MAX_SHRINK", 30):
                flag = " <== 体积缩减 %.1f%%" % shrink
        print("  %-34s %9d B  tables=%-4s latest_tables=%-4d baseline=%s%s"
              % (rel, rec["size"], tabs, ntabs, "yes" if b else "no", flag))
    return 0


def selftest():
    """内置用例：验证日期归一化、JSON 提取与回退判定"""
    ok = True

    def eq(got, want, label):
        nonlocal ok
        if got != want:
            ok = False
            print("  FAIL %-38s got=%r want=%r" % (label, got, want))
        else:
            print("  ok   %-38s %r" % (label, got))

    eq(norm_date("2026-07"), "2026-07", "norm 横杠")
    eq(norm_date("2026年5月"), "2026-05", "norm 中文")
    eq(norm_date("2026/7/"), "2026-07", "norm 斜杠")
    eq(norm_date("2026.12"), "2026-12", "norm 点")
    eq(norm_date(""), "", "norm 空")
    eq(month_index("2026-07") - month_index("2026-05"), 2, "month_index 差值")

    import tempfile
    sample = 'const EMBEDDED_DATA = {"tables":[{"table_name":"A","data":[{"日期":"2026-05"}]}]};'
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(sample)
        p = f.name
    obj = load_jsonish(p)
    eq(isinstance(obj, dict) and len(obj.get("tables", [])), 1, "raw_decode 提取 const 包裹")
    os.unlink(p)

    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
        f.write('[1,2,3]')
        p = f.name
    eq(load_jsonish(p), None, "非 dict 返回 None（[1,2,3]）")
    os.unlink(p)

    print("  ---- %s ----" % ("ALL PASS" if ok else "HAS FAILURES"))
    return 0 if ok else 1


def main():
    args = [a for a in sys.argv[1:]]
    if "--selftest" in args:
        return selftest()
    if "--show" in args:
        return show()
    if "--update" in args:
        files = {}
        for rel in targets():
            path = os.path.join(ROOT, rel.replace("/", os.sep))
            rec = profile(path)
            if rec is not None:
                files[rel] = rec
        save_baseline(files)
        print("[db-guard] 基线已刷新：%d 个文件" % len(files))
        return 0
    return check(verbose=bool(os.environ.get("DB_GUARD_VERBOSE")))


if __name__ == "__main__":
    sys.exit(main())
