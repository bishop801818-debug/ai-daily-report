# -*- coding: utf-8 -*-
import os, shutil
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

REMOTE_ROOT = Path("//172.16.12.100/D$/trae/AI Daily report")
REMOTE_EMBEDDED = REMOTE_ROOT / "embedded"
LOCAL_EMBEDDED = Path(r"D:\trae\AI Daily report\embedded")

# Check what's in remote root
print("=== Remote root (D:/trae/AI Daily report/) ===")
try:
    items = sorted(os.listdir("//172.16.12.100/D$/trae/AI Daily report"))
    for it in items[:10]:
        print(f"  {it}")
    print(f"  ... ({len(items)} total)")
except Exception as e:
    print(f"Error: {e}")

print("\n=== Remote embedded/ ===")
try:
    items = sorted(os.listdir("//172.16.12.100/D$/trae/AI Daily report/embedded"))
    for it in items[:10]:
        print(f"  {it}")
    print(f"  ... ({len(items)} total)")
except Exception as e:
    print(f"Error: {e}")

print("\n=== Remote D:/ root (files copied here by mistake) ===")
try:
    htmls = [f for f in os.listdir("//172.16.12.100/D$/") if f.endswith('.html')]
    for f in sorted(htmls)[:10]:
        print(f"  {f}")
    print(f"  ... ({len(htmls)} total)")
except Exception as e:
    print(f"Error: {e}")