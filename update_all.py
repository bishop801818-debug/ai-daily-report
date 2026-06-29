#!/usr/bin/env python3
"""
update_all.py
=============
一键更新所有数据库 + 可视化看板 + 存档推送。

用法:
  python update_all.py              # 标准流程
  python update_all.py --data-only  # 仅更新数据库，不动看板
  python update_all.py --charts-only # 仅同步看板，不跑 import
  python update_all.py --no-push    # 不 push，仅本地 commit
"""
import os, sys, subprocess, re
from datetime import datetime
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = "D:/trae/AI Daily report"
DATE = datetime.now().strftime('%Y%m%d')

MODE = "full"
PUSH = True

for arg in sys.argv[1:]:
    if arg == "--data-only":   MODE = "data"
    elif arg == "--charts-only": MODE = "charts"
    elif arg == "--no-push":   PUSH = False
    else:
        print(f"未知参数: {arg}"); sys.exit(1)

# 7个数据库对应的 embedded JS 和 charts.html
DB_FILES = [
    ("lfp_embedded_data.js",       "lfp_charts.html"),
    ("ternary_embedded_data.js",   "ternary_charts.html"),
    ("automotive_embedded_data.js","automotive_charts.html"),
    ("carbonate_embedded_data.js", "carbonate_charts.html"),
    ("electrolyte_embedded_data.js","electrolyte_charts.html"),
    ("lib_battery_embedded_data.js","lib_battery_charts.html"),
    ("recycling_embedded_data.js", "recycling_charts.html"),
]

PAGES = [
    BASE + "/index_v3.html", BASE + "/database_hub.html",
    BASE + "/archive_v3.html", BASE + "/bu_hub.html",
    BASE + "/lfp_data_v2.html",
]

def run(cmd, desc, cwd=BASE, check=True):
    print(f"\n{'='*50}")
    print(f"  {desc}")
    print(f"  $ {cmd}")
    print('='*50)
    r = subprocess.run(cmd, shell=True, cwd=cwd,
                       capture_output=True, text=True,
                       encoding='utf-8', errors='replace')
    if r.stdout: print(r.stdout)
    if r.stderr: print(r.stderr)
    if check and r.returncode != 0:
        print(f"[ERROR] {desc} 失败，退出码 {r.returncode}")
        sys.exit(1)
    return r

def git_add_targeted(files):
    """精确 add 指定文件列表（避免临时文件污染）"""
    for f in files:
        # 统一用正斜杠（Windows os.path.join 产生反斜杠，git 需要 /）
        f_unix = f.replace("\\", "/")
        full = os.path.join(BASE, f)
        if os.path.exists(full):
            subprocess.run(f"git add {f_unix}", shell=True, cwd=BASE,
                           encoding='utf-8', errors='replace')
            print(f"  [git add] {f_unix}")
        else:
            print(f"  [skip] {f_unix} (不存在)")

# ── Step 1: 更新数据库 (import_all.py) ──────────────────────
if MODE in ("full", "data"):
    print("\n\n>>> Step 1: 运行 import_all.py 更新 7 个 embedded JS")
    run("python import_all.py", "import_all.py", cwd=BASE)
else:
    print("\n[跳过] --charts-only 模式，跳过数据库更新")

# ── Step 2: 同步 charts.html → embedded/ 副本 ─────────────
if MODE in ("full", "charts"):
    print("\n\n>>> Step 2: 同步 charts.html → embedded/")
    embedded_dir = os.path.join(BASE, "embedded")
    if not os.path.exists(embedded_dir):
        print(f"[WARN] embedded/ 目录不存在，跳过同步")
    else:
        for _, chart in DB_FILES:
            src = os.path.join(BASE, chart)
            dst = os.path.join(embedded_dir, chart)
            if os.path.exists(src):
                with open(src, 'r', encoding='utf-8') as f:
                    content = f.read()
                with open(dst, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"  [sync] {chart} → embedded/")
            else:
                print(f"  [skip] {chart} (源文件不存在)")
else:
    print("\n[跳过] --data-only 模式，跳过看板同步")

# ── Step 3: bust_cache ──────────────────────────────────────
if MODE in ("full", "charts"):
    print("\n\n>>> Step 3: bust_cache 加版本戳")

    # 3a. charts.html 内部的 embedded_data.js 引用也要加版本戳
    for _, chart in DB_FILES:
        src = os.path.join(BASE, chart)
        if not os.path.exists(src):
            continue
        with open(src, 'r', encoding='utf-8') as f:
            content = f.read()
        original = content
        for js, _ in DB_FILES:
            vs = f"?v={DATE}"
            # 三种情况: src="xxx.js" / src="xxx.js?v=old" / src='xxx.js'
            # 替换为带版本戳的版本
            for q in ['"', "'"]:
                old_with_q = f"src={q}{js}{q}"
                new_with_q = f"src={q}{js}{vs}{q}"
                old_no_v = f"src={q}{js}{vs}{q}"  # 已加过的跳过
                if old_with_q in content and new_with_q not in content:
                    content = content.replace(old_with_q, new_with_q)
                # 处理已有旧版本戳的情况: src="xxx.js?v=OLD" → src="xxx.js?v=DATE"
                import re as re2
                old_pat = f"src={q}{js}\\?v=\\d+" + q
                def _rep(m, js=js, q=q, vs=vs):
                    return f"src={q}{js}{vs}{q}"
                content = re2.sub(old_pat, _rep, content)
        if content != original:
            with open(src, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  [bust] {chart} 内嵌 JS 引用加 ?v={DATE}")
        else:
            print(f"  [ok]   {chart} 已是最新版本")

        # embedded/ 副本同样处理
        dst = os.path.join(BASE, "embedded", chart)
        if os.path.exists(dst):
            with open(dst, 'r', encoding='utf-8') as f:
                content2 = f.read()
            original2 = content2
            for js, _ in DB_FILES:
                vs = f"?v={DATE}"
                for q in ['"', "'"]:
                    old_with_q = f"src={q}{js}{q}"
                    new_with_q = f"src={q}{js}{vs}{q}"
                    if old_with_q in content2 and new_with_q not in content2:
                        content2 = content2.replace(old_with_q, new_with_q)
                    import re as re2
                    old_pat = f"src={q}{js}\\?v=\\d+" + q
                    def _rep2(m, js=js, q=q, vs=vs):
                        return f"src={q}{js}{vs}{q}"
                    content2 = re2.sub(old_pat, _rep2, content2)
            if content2 != original2:
                with open(dst, 'w', encoding='utf-8') as f:
                    f.write(content2)
                print(f"  [bust] embedded/{chart} 内嵌 JS 引用加 ?v={DATE}")

    # 3b. 引用页的图表文件链接也加版本戳
    bust_cache = "C:/Users/1/bust_cache.py"
    if os.path.exists(bust_cache):
        run(f"python \"{bust_cache}\"", "bust_cache.py", cwd=BASE, check=False)
    else:
        print(f"[WARN] bust_cache.py 不在 C:/Users/1/，跳过")
else:
    print("\n[跳过] --data-only 模式，跳过 bust_cache")

# ── Step 4: git commit + push ────────────────────────────────
if MODE in ("full", "charts"):
    print("\n\n>>> Step 4: git commit")
    # 只 add 本次实际修改的文件
    to_add = [c for _, c in DB_FILES]                          # 7个 charts.html
    to_add += ["embedded/" + c for _, c in DB_FILES]             # 7个 embedded/
    to_add += [p.replace(BASE + "/", "").replace("\\","/") for p in PAGES]  # 5个引用页
    to_add += [js for js, _ in DB_FILES]                          # 7个 embedded JS
    to_add = sorted(set(to_add))

    print(f"  本次提交文件 ({len(to_add)} 个):")
    git_add_targeted(to_add)

    msg = f"chore: 更新数据库及看板 {DATE}"
    run(f'git commit -m "{msg}"', "git commit", cwd=BASE, check=False)
else:
    print("\n[跳过] --data-only 模式，跳过看板 git commit")

if PUSH:
    print("\n\n>>> Step 5: git push")
    run("git push", "git push", cwd=BASE, check=False)
else:
    print("\n[跳过] --no-push 模式")

print(f"\n\n{'='*50}")
print(f"  完成！ Ctrl+Shift+R 刷新各页面验证")
print('='*50)