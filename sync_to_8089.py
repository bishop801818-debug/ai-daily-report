# -*- coding: utf-8 -*-
"""
sync_to_8089.py
================
通过 Windows 凭据自动挂载 172.16.12.100 的共享目录，
把 embedded/ 下所有 HTML 文件同步到远程 8089 服务器的目录。

运行：py -3.12 sync_to_8089.py
"""
import subprocess, sys, shutil, os, socket
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

REMOTE_HOST = "172.16.12.100"
LOCAL_EMBEDDED = Path(r"D:\trae\AI Daily report\embedded")
# 服务器 8089 从 D:\trae\AI Daily report\ 启动，embedded/ 子目录 → /embedded/ 路径
REMOTE_PROJECT_ROOT = r"\\172.16.12.100\D$\trae\AI Daily report"   # HTTP 根目录
REMOTE_EMBEDDED    = REMOTE_PROJECT_ROOT + r"\embedded"             # HTTP /embedded/ 路径

def check_smb(host):
    try:
        sock = socket.socket()
        sock.settimeout(3)
        r = sock.connect_ex((host, 445))
        sock.close()
        return r == 0
    except:
        return False

def try_mount_share():
    """Try mounting without explicit credentials (current user)"""
    print(f"尝试以当前 Windows 用户挂载 \\\\{REMOTE_HOST}\\D$ ...")
    r = subprocess.run(
        ['cmd', '/c', 'net use ' + r'\\\\' + REMOTE_HOST + r'\D$'],
        capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=10
    )
    return r.stdout + r.stderr

def try_mount_unc():
    """Try various UNC path approaches"""
    paths_to_try = [
        (REMOTE_HOST, r"\D$\trae\AI Daily report"),   # 正确：服务器根目录
        (REMOTE_HOST, r"\D$"),                         # 备选：D盘根
    ]
    for host, share in paths_to_try:
        path = r"\\" + host + share
        print(f"  测试: {path}")
        try:
            p = Path(path)
            items = list(p.iterdir())
            print(f"  ✓ 挂载成功，找到 {len(items)} 个项目")
            return path
        except Exception as e:
            print(f"  ✗ {str(e)[:80]}")
    return None

def sync_files_to_project(local_dir, remote_project_root, remote_embedded_dir):
    """同步文件：
       - _embedded.html → 项目根目录（HTTP 根路径 /xxx_embedded.html）
       - 其他 *.html   → embedded/ 子目录（HTTP 路径 /embedded/xxx.html）
    """
    files = sorted(Path(local_dir).glob("*.html"))
    print(f"\n找到 {len(files)} 个 HTML 文件待同步")
    success, failed = 0, []

    for f in files:
        # _embedded.html 文件同步到项目根目录（直接 /xxx_embedded.html 访问）
        if '_embedded' in f.name:
            dest_dir = Path(remote_project_root)
        else:
            dest_dir = Path(remote_embedded_dir)
        dest = dest_dir / f.name
        try:
            shutil.copy2(f, dest)
            sz = f.stat().st_size // 1024
            print(f"  ✓ {f.name} ({sz}KB) -> {dest.parts[-2]}/{dest.parts[-1]}")
            success += 1
        except Exception as e:
            print(f"  ✗ {f.name}: {str(e)[:60]}")
            failed.append((f.name, str(e)[:80]))
    return success, failed

def main():
    print("=" * 60)
    print(f"  同步 embedded/ → 172.16.12.100:8089")
    print("=" * 60)

    if not check_smb(REMOTE_HOST):
        print(f"[✗] 无法连接 {REMOTE_HOST}:445（SMB端口关闭）")
        return

    print(f"[✓] SMB 端口可达，正在尝试挂载...")

    # Try to mount with current credentials
    result = try_mount_share()
    print(f"  挂载结果: {result[:200]}")

    # Find accessible path - prefer the project root path
    unc_path = try_mount_unc()

    if unc_path:
        print(f"\n使用路径: {unc_path}")
        # unc_path = 项目根目录（如 \\172.16.12.100\D$\trae\AI Daily report）
        # 嵌入式 _embedded.html → 项目根目录
        # 其他文件 → embedded/ 子目录
        success, failed = sync_files_to_project(
            LOCAL_EMBEDDED,
            REMOTE_PROJECT_ROOT,
            REMOTE_EMBEDDED
        )
        print(f"\n完成: {success} 成功, {len(failed)} 失败")
        if failed:
            print("失败列表:")
            for f, e in failed:
                print(f"  - {f}: {e}")
    else:
        print("\n[✗] 无法通过 SMB 访问远程目录，请手动操作。")

if __name__ == "__main__":
    main()