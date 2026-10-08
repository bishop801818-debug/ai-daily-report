#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从飞书云文件夹下载早报 JSON 文件到本地 reports/ 目录

功能：
1. 用 lark-cli 列出飞书文件夹 SBIafdY3plhq0pdiJf9cb1qCn6e 中的文件
2. 过滤出今天日期的 JSON 文件（文件名含 YYYY-MM-DD）
3. 下载到 reports/YYYY-MM-DD-<BU_ID>.json

用法：
  python download_feishu_docx_as_json.py [YYYY-MM-DD]
  # 不传日期参数则默认用今天
"""

import os
import sys
import json
import subprocess
from datetime import datetime
from pathlib import Path

# 项目根目录（脚本所在目录的父目录）
PROJECT_ROOT = Path(__file__).resolve().parent

# 飞书文件夹 token（早报文件所在文件夹）
FEISHU_FOLDER_TOKEN = "SBIafdY3plhq0pdiJf9cb1qCn6e"

# 事业部名称→ID 映射（从文件名提取事业部关键词后映射）
# 支持中文名称和英文缩写
BU_NAME_TO_ID = {
    # 中文名称
    "铂源": "bych",
    "催化": "bych",
    "常州锂源": "czly",
    "锂源": "czly",
    "迪克": "dkhx",
    "迪克化学": "dkhx",
    "法恩莱特": "fnlt",
    "法恩": "fnlt",
    "可兰素": "kls",
    "可兰": "kls",
    "龙蟠时代": "lpsd",
    "龙蟠": "lpsd",
    "润滑油": "lube",
    "山东美多": "sdmd",
    "美多": "sdmd",
    "三金锂电": "sjld",
    "三金": "sjld",
    # 英文缩写（飞书文件名中使用）
    "felt": "fnlt",      # 法恩莱特
    "bych": "bych",      # 铂源/催化
    "czly": "czly",      # 常州锂源
    "sdmd": "sdmd",      # 山东美多
    "sjl": "sjld",       # 三金锂电
    "dkhx": "dkhx",      # 迪克化学
    "lpsd": "lpsd",      # 龙蟠时代
    "kelan": "kls",      # 可兰素
    "lubricant": "lube", # 润滑油
}

REPORTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")

# lark-cli shell 包装脚本候选路径（Windows 下 Python subprocess 无法直接找到，需通过 bash 调用）
# 注意：必须用 "C:/..." 形式而非 "/c/..." MSYS 形式。
# lark-cli 包装脚本内部依赖 cygpath 把 basedir 转成 Windows 路径；当 cygpath 不可用时
# basedir 保持 "/c/..."，node 会按当前盘符解析成 "D:\c\Users\..." 导致 Cannot find module。
#
# 【重要】两个副本的可用性会随宿主升级而互换（历史上两边都出现过原生 .exe 的
# "Permission denied"(exit 126, Windows ACL) 问题），因此不再硬编码单一路径，
# 改为启动时自动探测：用 `--version` 逐个试跑，选第一个能正常返回的副本。
_LARK_CLI_CANDIDATES = [
    "C:/Users/1/.workbuddy/binaries/node/cli-connector-packages/lark-cli",
    # 【2026-09-03 修正】22.22.2 → 22.22.2-2（Node 修订号升级），与 _resolve_binaries.py 探测范围保持一致；
    # _resolve_lark_cli() 会逐个 --version 探测，路径不存在会自动跳过，所以这里列错也无害。
    "C:/Users/1/.workbuddy/binaries/node/versions/22.22.2-2/lark-cli",
]
_LARK_CLI_BASH_PATH = None  # 由 _resolve_lark_cli() 惰性填充


def _get_bash_exe():
    bash_exe = r"C:\Program Files\Git\bin\bash.exe"
    if not os.path.exists(bash_exe):
        bash_exe = "bash"
    return bash_exe


def _resolve_lark_cli():
    """探测可用的 lark-cli 包装脚本，缓存并返回其路径。"""
    global _LARK_CLI_BASH_PATH
    if _LARK_CLI_BASH_PATH:
        return _LARK_CLI_BASH_PATH

    bash_exe = _get_bash_exe()
    for cand in _LARK_CLI_CANDIDATES:
        if not os.path.exists(cand):
            continue
        try:
            probe = subprocess.run(
                [bash_exe, cand, "--version"],
                capture_output=True, text=True, encoding="utf-8", timeout=60,
            )
        except Exception:
            continue
        if probe.returncode == 0 and (probe.stdout or "").strip():
            _LARK_CLI_BASH_PATH = cand
            print(f"[INFO] 使用 lark-cli: {cand} ({probe.stdout.strip()})")
            return cand
        print(f"[WARN] lark-cli 副本不可用，跳过: {cand} (rc={probe.returncode})")

    # 全部探测失败时退回第一个候选，让后续调用报出真实错误
    _LARK_CLI_BASH_PATH = _LARK_CLI_CANDIDATES[0]
    print("[ERROR] 未探测到可用的 lark-cli 副本，将尝试默认路径")
    return _LARK_CLI_BASH_PATH


def _run_lark_cli(args_list, capture=True):
    """通过 bash 运行 lark-cli 命令，返回 (returncode, stdout, stderr)

    使用 bash <lark-cli-path> <args> 方式调用，避免 bash -c 的引号问题。
    添加 --as user 参数确保使用用户级 token（不过期）。
    """
    bash_exe = _get_bash_exe()
    cli_path = _resolve_lark_cli()

    # 在参数列表开头插入 --as user
    cmd = [bash_exe, cli_path, "--as", "user"] + args_list
    result = subprocess.run(cmd, capture_output=capture, text=True, encoding="utf-8")
    return result.returncode, result.stdout, result.stderr


def get_date_str():
    """获取目标日期（命令行参数或今天）"""
    if len(sys.argv) > 1:
        return sys.argv[1]
    return datetime.now().strftime("%Y-%m-%d")


def list_feishu_files(folder_token):
    """用 lark-cli 列出飞书文件夹中的文件"""
    args = [
        "drive", "files", "list",
        "--params", json.dumps({"folder_token": folder_token}),
        "--format", "json"
    ]
    print(f"[INFO] 列出飞书文件夹: {folder_token}")
    rc, stdout, stderr = _run_lark_cli(args)
    if rc != 0:
        print(f"[ERROR] lark-cli 执行失败 (rc={rc}): {stderr[:200]}")
        return []
    try:
        data = json.loads(stdout)
        items = data.get("data", {}).get("files", [])
        print(f"[INFO] 文件夹中有 {len(items)} 个文件/文件夹")
        return items
    except json.JSONDecodeError:
        print(f"[ERROR] 无法解析 lark-cli 输出: {stdout[:200]}")
        return []


def download_feishu_file(file_token, output_path):
    """用 lark-cli 下载飞书文件
    
    lark-cli drive +download 要求 --output 是相对路径（当前目录下），
    所以先 chdir 到输出文件所在目录，用相对路径下载，再 chdir 回来。
    """
    target_dir = os.path.dirname(output_path) or "."
    rel_name = os.path.basename(output_path)
    
    # 保存当前目录，切换到目标目录
    saved_dir = os.getcwd()
    os.chdir(target_dir)
    try:
        args = [
            "drive", "+download",
            "--file-token", file_token,
            "--output", rel_name,
            # 必须带 --overwrite：同日重跑时目标文件已存在，lark-cli 默认拒绝覆盖
            # (validation/invalid_argument: output file already exists)，
            # 会导致部分 BU 保留旧快照、部分为新快照的「混合快照」错误状态。
            "--overwrite"
        ]
        print(f"[INFO] 下载 file_token={file_token} → {rel_name} (cwd={target_dir})")
        rc, stdout, stderr = _run_lark_cli(args, capture=True)
    finally:
        os.chdir(saved_dir)
    
    if rc != 0:
        err_msg = (stderr or "")[:100]
        print(f"[ERROR] 下载失败 (rc={rc}): {err_msg}")
        return False
    return os.path.exists(output_path)


def extract_bu_id(filename):
    """从文件名中提取事业部 ID"""
    for name, bu_id in BU_NAME_TO_ID.items():
        if name in filename:
            return bu_id
    return None


def main():
    date_str = get_date_str()
    print(f"[INFO] 目标日期: {date_str}")
    print(f"[INFO] 本地保存目录: {REPORTS_DIR}")

    # Step 0: 探活 lark-cli 用户身份（2026-10-08 立，避免假期后 token 过期推送陈旧数据）
    # 失败立即退出，不进入后续步骤，避免"飞书读不到 → 退化用昨日数据"
    print("[Step 0/3] 探活 lark-cli 用户身份 ...")
    try:
        sys.path.insert(0, str(PROJECT_ROOT / "tools"))
        from lark_preflight import preflight_check
        is_ready, preflight_info = preflight_check()
        user_status = preflight_info.get("status", "?")
        user_name = preflight_info.get("user_name", "?")
        if not is_ready:
            print(f"[ERROR] lark-cli user.status = {user_status}（{user_name}）")
            print(f"[ERROR] 长假后 token 过期场景，必须先重授权才能继续")
            print(f"[ERROR] 修复命令: python tools/lark_reauth.py")
            print(f"[ERROR] 拒绝进入后续步骤，避免推送陈旧/错误数据")
            sys.exit(2)
        print(f"[OK] user.status = ready ({user_name})")
    except ImportError as e:
        # lark_preflight.py 不存在时降级（旧脚本继续可用，不阻断）
        print(f"[WARN] tools/lark_preflight.py 未找到 ({e})，跳过探活")
    except Exception as e:
        # 探活本身异常时降级，不阻断（避免探活脚本 bug 反向影响业务）
        print(f"[WARN] 探活异常 ({type(e).__name__}: {e})，跳过探活")

    # Step 1: 列出飞书文件夹中的所有文件
    items = list_feishu_files(FEISHU_FOLDER_TOKEN)
    if not items:
        print("[ERROR] 无法获取飞书文件列表，请检查 lark-cli 是否已认证")
        sys.exit(1)

    # Step 2: 过滤出目标日期的 JSON 文件
    target_files = []
    for item in items:
        name = item.get("name", "")
        file_token = (item.get("token") or
                     item.get("file_token") or
                     item.get("document_id") or "")
        if not file_token:
            continue
        if date_str in name and name.endswith(".json"):
            target_files.append({"name": name, "token": file_token})
            print(f"[INFO] 找到目标文件: {name}")

    if not target_files:
        print(f"[WARN] 未找到日期 {date_str} 的 JSON 文件")
        print("[INFO] 文件夹中的文件（最近20个）:")
        for item in items[:20]:
            print(f"  - {item.get('name', '?')}")
        sys.exit(1)

    print(f"[INFO] 找到 {len(target_files)} 个目标 JSON 文件")

    # Step 3: 下载每个文件到 reports/YYYY-MM-DD-<BU_ID>.json
    os.makedirs(REPORTS_DIR, exist_ok=True)
    downloaded = []

    for f in target_files:
        filename = f["name"]
        file_token = f["token"]
        bu_id = extract_bu_id(filename)

        if not bu_id:
            print(f"[WARN] 无法识别事业部: {filename}，跳过")
            continue

        output_filename = f"{date_str}-{bu_id}.json"
        output_path = os.path.join(REPORTS_DIR, output_filename)

        ok = download_feishu_file(file_token, output_path)
        if ok:
            try:
                with open(output_path, "r", encoding="utf-8") as fp:
                    data = json.load(fp)
                
                # 关键修复：根据文件内bu_id重命名，确保文件名与内容一致
                # 飞书文档内部的 bu_id 可能与 BU_NAME_TO_ID 映射结果不同
                inner_bu_id = data.get('bu_id', '').strip()
                if inner_bu_id and inner_bu_id != bu_id:
                    correct_name = f"{date_str}-{inner_bu_id}.json"
                    correct_path = os.path.join(REPORTS_DIR, correct_name)
                    if os.path.exists(correct_path):
                        os.remove(correct_path)
                    os.rename(output_path, correct_path)
                    output_filename = correct_name
                    output_path = correct_path
                    print(f"  ↳ 重命名为 {correct_name} (文件内bu_id={inner_bu_id})")
                
                print(f"[OK] {output_filename}")
                downloaded.append(output_filename)
            except json.JSONDecodeError as e:
                print(f"[ERROR] JSON 格式错误 {output_filename}: {e}")
                print(f"[INFO] 删除损坏文件: {output_path}")
                os.remove(output_path)
        else:
            print(f"[ERROR] 下载失败: {filename}")

    print(f"\n[INFO] 下载完成: {len(downloaded)}/{len(target_files)} 个文件")
    print(f"[INFO] 已下载文件: {downloaded}")

    if len(downloaded) == 0:
        print("[ERROR] 没有成功下载任何文件")
        sys.exit(1)

    print("[INFO] 全部完成！")


if __name__ == "__main__":
    main()
