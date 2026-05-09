# -*- coding: utf-8 -*-
"""
sync_to_8089_upload.py
=======================
通过 HTTP 上传的方式，把 D:\trae\AI Daily report\embedded\ 目录的所有 HTML 文件
同步到 172.16.12.100:8089 服务器。

运行方式：py -3.12 sync_to_8089_upload.py

工作原理：
  1. 读取本机 embedded/ 下所有 .html 文件
  2. 通过 HTTP PUT 上传到远程（需要目标服务器运行一个简单的接收脚本）
  3. 如果无法 HTTP 上传，提示手动操作步骤

如果 HTTP 上传失败，此脚本会输出详细的"手动操作清单"供你对照复制。
"""
import os, sys, json, socket
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

LOCAL_EMBEDDED = Path(r"D:\trae\AI Daily report\embedded")
REMOTE_SERVER = "172.16.12.100"
REMOTE_PORT = 8089
TARGET_URL_BASE = f"http://{REMOTE_SERVER}:{REMOTE_PORT}/"

def check_server():
    """测试 8089 服务器是否可达"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3)
        result = sock.connect_ex((REMOTE_SERVER, REMOTE_PORT))
        sock.close()
        return result == 0
    except:
        return False

def try_http_upload():
    """尝试用 urllib 上传文件到远程"""
    import urllib.request, urllib.error

    html_files = sorted(LOCAL_EMBEDDED.glob("*.html"))
    print(f"找到 {len(html_files)} 个 HTML 文件待上传")

    uploaded = []
    failed = []

    for f in html_files:
        url = TARGET_URL_BASE + f.name
        try:
            with open(f, "rb") as fh:
                data = fh.read()
            req = urllib.request.Request(url, data=data, method="PUT")
            req.add_header("Content-Type", "text/html; charset=utf-8")
            with urllib.request.urlopen(req, timeout=10) as resp:
                print(f"  ✓ {f.name} ({len(data)//1024}KB) -> HTTP {resp.status}")
                uploaded.append(f.name)
        except Exception as e:
            print(f"  ✗ {f.name}: {e}")
            failed.append((f.name, str(e)))

    print(f"\n上传完成: {len(uploaded)} 成功, {len(failed)} 失败")
    return uploaded, failed

def generate_manual_list():
    """生成手动操作清单"""
    html_files = sorted(LOCAL_EMBEDDED.glob("*.html"))
    lines = []
    lines.append("=" * 60)
    lines.append("  手动同步操作清单")
    lines.append(f"  本地: D:\\trae\\AI Daily report\\embedded\\")
    lines.append(f"  目标: 172.16.12.100:8089 (启动目录下的文件)")
    lines.append("=" * 60)
    lines.append(f"\n共 {len(html_files)} 个文件:\n")
    for f in html_files:
        size_kb = os.path.getsize(f) // 1024
        lines.append(f"  [{size_kb:>5}KB] {f.name}")
    lines.append("\n操作方法：")
    lines.append("  1. 在本机打开文件资源管理器")
    lines.append("  2. 地址栏输入: \\\\172.16.12.100\\")
    lines.append("     （如提示输入账号密码，请联系服务器管理员）")
    lines.append("  3. 找到 embedded/ 目录，复制以上文件过去")
    lines.append("\n或者：")
    lines.append("  在 172.16.12.100 上打开 D:\\trae\\AI Daily report\\embedded\\")
    lines.append("  从本机 D:\\trae\\AI Daily report\\embedded\\ 复制相同文件覆盖过去")
    return "\n".join(lines)

def main():
    print("=" * 60)
    print("  同步到 172.16.12.100:8089")
    print("=" * 60)

    # 检查服务器可达性
    print(f"\n检查服务器 {REMOTE_SERVER}:{REMOTE_PORT}...")
    if not check_server():
        print("[!] 服务器不可达，请确认 8089 服务器正在运行")
        print("\n" + generate_manual_list())
        return

    print("[✓] 服务器可达")

    # 尝试 HTTP 上传
    print("\n开始上传 HTML 文件...")
    uploaded, failed = try_http_upload()

    if failed:
        print("\n" + "=" * 60)
        print("  部分文件上传失败，以下文件需要手动处理:")
        print("=" * 60)
        for name, err in failed:
            print(f"  ✗ {name} ({err})")
        print("\n" + generate_manual_list())

if __name__ == "__main__":
    main()