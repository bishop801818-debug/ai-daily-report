# -*- coding: utf-8 -*-
"""Fix double-encoding mojibake in JSON files"""
import json, os, sys

def fix_file(filepath):
    with open(filepath, 'rb') as f:
        raw = f.read()

    try:
        text = raw.decode('utf-8', errors='strict')
    except UnicodeDecodeError:
        print(f'Invalid UTF-8: {filepath}')
        return False

    # Check for mojibake pattern
    has_mojibake = False
    for c in text:
        code = ord(c)
        if code > 0x7F and code <= 0xFF:
            try:
                lb = ord(c.encode('latin-1'))
                if 0x80 <= lb <= 0xBF:
                    has_mojibake = True
                    break
            except (UnicodeEncodeError, UnicodeDecodeError):
                pass

    if not has_mojibake:
        print(f'Clean: {os.path.basename(filepath)}')
        return False

    print(f'Fixing: {os.path.basename(filepath)} ({len(raw)} bytes)')

    # Fix: convert mojibake chars back to original UTF-8 bytes
    result_chars = []
    fixed = 0
    for c in text:
        code = ord(c)
        if code > 0x7F and code <= 0xFF:
            try:
                lb = ord(c.encode('latin-1'))
            except (UnicodeEncodeError, UnicodeDecodeError):
                result_chars.append(c)
                continue
            if 0x80 <= lb <= 0xBF:
                result_chars.append(chr(lb))
                fixed += 1
            else:
                result_chars.append(c)
        else:
            result_chars.append(c)

    result_str = ''.join(result_chars)
    result_bytes = result_str.encode('utf-8')

    try:
        d = json.loads(result_bytes)
        with open(filepath, 'wb') as f:
            f.write(result_bytes)

        # Verify
        lhy_name = d['departments']['lhy']['name']
        name_hex = lhy_name.encode('utf-8').hex()
        correct = name_hex == 'e6b6a6e6bb91e6b2b9e4ba8be4b89ae983a8'
        sys.stdout.write(f'  OK ({len(raw)} -> {len(result_bytes)} bytes), lhy.name correct: {correct}\n')
        sys.stdout.flush()
        return True
    except Exception as e:
        sys.stdout.write(f'  FAILED: {e}\n')
        sys.stdout.flush()
        return False

def main():
    reports_dir = 'D:/trae/AI Daily report/reports'
    fixed_count = 0
    for fname in sorted(os.listdir(reports_dir)):
        if fname.startswith('2026-') and fname.endswith('.json'):
            fpath = os.path.join(reports_dir, fname)
            if fix_file(fpath):
                fixed_count += 1
    sys.stdout.write(f'\nTotal fixed: {fixed_count}\n')
    sys.stdout.flush()

if __name__ == '__main__':
    main()