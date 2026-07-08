#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将 _aily_kb/*.md 同步到飞书云盘指定文件夹，供 Aily 知识空间「直连云盘文件夹」准实时索引。

前置（用户一次性配置）：
1. 在飞书云盘建一个文件夹（如「AI早报知识库」）。
2. 拿到该文件夹的 folder_token（飞书云盘网页 URL 里 folder/ 后的那段）。
3. 把 token 写入 _aily_config.json 的 feishu_drive_folder_token 字段（该文件已 gitignore，不提交密钥）；
   也可运行时 --folder-token 传入，或设环境变量 FEISHU_DRIVE_FOLDER_TOKEN。
4. 在 Aily 后台建知识空间 -> 数据源选「飞书云盘」-> 直连上述文件夹。

特性：
- 增量：基于文件 sha256 比对 _aily_kb/.sync_state.json，未变更跳过（每日仅上传新增/变更的报告）。
- --dry-run：只列出将要上传的文件，不真实调用 lark-cli（用于本地验证）。
- 不删远端旧文件（retention 由用户/飞书侧策略控制，避免误删）。

用法：
    python _aily_sync.py --dry-run
    python _aily_sync.py --folder-token <token>
    python _aily_sync.py            # 读 _aily_config.json 中的 token
"""
import os, sys, json, hashlib, subprocess, argparse, shutil
from pathlib import Path

ROOT = Path(r"D:/trae/AI Daily report")
KB = ROOT / "_aily_kb"
STATE = KB / ".sync_state.json"
CONFIG = ROOT / "_aily_config.json"

def load_config_token():
    """从 _aily_config.json 读取 folder_token（git 忽略，不提交密钥）。"""
    if CONFIG.exists():
        try:
            d = json.loads(CONFIG.read_text(encoding="utf-8"))
            t = (d.get("feishu_drive_folder_token") or "").strip()
            if t:
                return t
        except Exception:
            pass
    return ""

def sha256(p: Path):
    h = hashlib.sha256()
    h.update(p.read_bytes())
    return h.hexdigest()

def load_state():
    if STATE.exists():
        try: return json.loads(STATE.read_text(encoding="utf-8"))
        except: return {}
    return {}

def save_state(s):
    STATE.write_text(json.dumps(s, ensure_ascii=False, indent=2), encoding="utf-8")

def lark_drive_upload(filepath: Path, folder_token: str):
    """调用 lark-cli 上传到云盘文件夹，返回 (ok, msg)。"""
    # Windows 上 lark-cli 实为 lark-cli.cmd，subprocess(shell=False) 不会自动补扩展名，
    # 用 shutil.which 解析真实可执行路径。
    # lark-cli 要求 --file 为「当前目录下的相对路径」，故转成相对 ROOT 的路径。
    lark = shutil.which("lark-cli") or "lark-cli"
    rel = filepath.relative_to(ROOT)
    cmd = [
        lark, "drive", "+upload",
        "--file", str(rel),
        "--folder-token", folder_token,
    ]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        if r.returncode == 0:
            return True, (r.stdout or "").strip()[:200]
        return False, (r.stderr or r.stdout or "未知错误").strip()[:300]
    except Exception as e:
        return False, str(e)

def main():
    os.chdir(str(ROOT))  # 保证 --file 相对路径相对于项目根
    ap = argparse.ArgumentParser()
    # 优先级：--folder-token > 环境变量 FEISHU_DRIVE_FOLDER_TOKEN > _aily_config.json
    _env_tok = os.environ.get("FEISHU_DRIVE_FOLDER_TOKEN", "") or load_config_token()
    ap.add_argument("--folder-token", default=_env_tok,
                    help="飞书云盘目标文件夹 token（也可设 FEISHU_DRIVE_FOLDER_TOKEN 或 _aily_config.json）")
    ap.add_argument("--dry-run", action="store_true", help="只列出待上传文件，不真实调用")
    args = ap.parse_args()

    if not KB.exists():
        print("⚠️ 未找到 _aily_kb/，请先运行 _aily_export.py 生成 Markdown")
        sys.exit(1)
    mds = sorted(KB.glob("*.md"))
    mds = [m for m in mds if m.name != ".sync_state.json"]
    if not mds:
        print("⚠️ _aily_kb/ 下没有 .md 文件，请先运行 _aily_export.py")
        sys.exit(1)

    state = load_state()
    todo = []
    for m in mds:
        h = sha256(m)
        if state.get(m.name) == h:
            continue
        todo.append((m, h))

    if not todo:
        print(f"✅ 已是最新，{len(mds)} 个文档均无变更，无需上传。")
        return

    print(f"📤 待同步 {len(todo)} / {len(mds)} 个文档" + ("（DRY-RUN，不真实上传）" if args.dry_run else ""))
    ok_cnt = 0
    for m, h in todo:
        if args.dry_run:
            print(f"   [dry] {m.name}  ({m.stat().st_size} bytes)")
            ok_cnt += 1
            continue
        if not args.folder_token:
            print("❌ 未提供 folder-token（--folder-token 或 FEISHU_DRIVE_FOLDER_TOKEN），中止。")
            sys.exit(1)
        ok, msg = lark_drive_upload(m, args.folder_token)
        if ok:
            state[m.name] = h
            ok_cnt += 1
            print(f"   ✅ {m.name}")
        else:
            print(f"   ❌ {m.name}: {msg}")

    if not args.dry_run and ok_cnt:
        save_state(state)
    print(f"\n完成：{ok_cnt}/{len(todo)} 成功" + ("（dry-run）" if args.dry_run else ""))

if __name__ == "__main__":
    main()
