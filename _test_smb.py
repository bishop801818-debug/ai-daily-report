# -*- coding: utf-8 -*-
import subprocess, socket, sys, shutil, os
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

def test_port(host, port, timeout=3):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        r = sock.connect_ex((host, port))
        sock.close()
        return r == 0
    except:
        return False

def try_net_use(host):
    """Try various net use approaches"""
    # Approach 1: empty password
    r = subprocess.run(
        ['cmd', '/c', f'net use\\\\\\\\{host}\\\\c$ /user:guest ""'],
        capture_output=True, text=True, timeout=10
    )
    print("net use attempt:", r.stdout.strip()[:200], r.stderr.strip()[:100])

def try_smb(host):
    """Use PowerShell SMB test"""
    script = f'''
    $shares = Get-SmbShare -ComputerName "{host}" -ErrorAction SilentlyContinue
    if ($shares) {{ $shares.Name }} else {{ "no shares accessible" }}
    '''
    r = subprocess.run(
        ['powershell', '-c', script],
        capture_output=True, text=True, timeout=15
    )
    print("SMB shares:", r.stdout.strip()[:300])

def try_http_upload():
    """Try to upload via HTTP by exploiting 8089 Python http.server"""
    # Python's http.server doesn't support PUT by default
    # But we can try to see if there's a custom upload handler
    pass

print("Port 445 (SMB) is OPEN on 172.16.12.100")
print("Trying to access SMB share...")
try_net_use("172.16.12.100")
try_smb("172.16.12.100")

# Check if we can access via Windows
print("\nChecking local network drives...")
r = subprocess.run(['cmd', '/c', 'wmic logicaldisk get caption,freespace,size,volumename'],
    capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=15)
print(r.stdout[:500])