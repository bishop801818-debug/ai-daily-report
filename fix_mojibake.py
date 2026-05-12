# -*- coding: utf-8 -*-
"""Fix double-encoding mojibake in JSON files"""
import json, os, sys

def fix_mojibake_file(filepath):
    """Fix mojibake by round-trip: UTF-8 decode -> latin-1 encode -> UTF-8 decode"""
    with open(filepath, 'rb') as f:
        raw = f.read()

    # Check if mojibake present
    if b'\xc3\x83\xc2' not in raw:
        print(f'  Clean: {os.path.basename(filepath)}')
        return False

    # Decode UTF-8 (with replacement for invalid sequences)
    text = raw.decode('utf-8', errors='replace')

    # Encode as latin-1 (preserves code points as raw bytes)
    step2 = text.encode('latin-1')

    # Try UTF-8 decode on each string value
    # Since we can't easily do string-level fix, we do the full file
    try:
        json.loads(step2.decode('utf-8'))
        # Valid! Write the fixed bytes
        with open(filepath, 'wb') as f:
            f.write(step2)
        print(f'  Fixed: {os.path.basename(filepath)} ({len(raw)} -> {len(step2)} bytes)')
        return True
    except json.JSONDecodeError:
        # JSON still invalid - try more aggressive fix
        print(f'  Partial fix: {os.path.basename(filepath)}, trying aggressive...')
        # Try: decode raw as latin-1, then encode as UTF-8
        try:
            latin1_text = raw.decode('latin-1')
            utf8_bytes = latin1_text.encode('utf-8', errors='replace')
            # Validate
            json.loads(utf8_bytes.decode('utf-8'))
            with open(filepath, 'wb') as f:
                f.write(utf8_bytes)
            print(f'  Aggressive fixed: {os.path.basename(filepath)} ({len(raw)} -> {len(utf8_bytes)} bytes)')
            return True
        except Exception as e:
            print(f'  FAILED: {os.path.basename(filepath)} - {e}')
            return False

def main():
    reports_dir = 'D:/trae/AI Daily report/reports'
    fixed = 0
    for fname in sorted(os.listdir(reports_dir)):
        if not (fname.startswith('2026-') and fname.endswith('.json')):
            continue
        fpath = os.path.join(reports_dir, fname)
        if fix_mojibake_file(fpath):
            fixed += 1

    print(f'\nTotal fixed: {fixed}')

    # Also fix the embedded copy
    emb = 'D:/trae/AI Daily report/embedded/reports/2026-05-09.json'
    if os.path.exists(emb):
        print(f'\nFixing embedded copy...')
        fix_mojibake_file(emb)

if __name__ == '__main__':
    main()