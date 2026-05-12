# -*- coding: utf-8 -*-
"""Fix the mojibake JSON properly"""
import json, os, sys

def fix_json_file(filepath):
    with open(filepath, 'rb') as f:
        raw = f.read()

    # Check for mojibake
    if b'\xc3\x83\xc2' not in raw:
        print(f'Clean: {os.path.basename(filepath)}')
        return False

    # The fix: raw bytes are double-encoded.
    # Each Chinese char's UTF-8 bytes were decoded as latin-1, then re-encoded as UTF-8.
    # To reverse: decode as latin-1, then encode as UTF-8.
    # BUT the raw JSON string format adds complexity. Let's try:
    # 1. Find all string values with mojibake bytes
    # 2. Apply the fix per string

    text = raw.decode('utf-8', errors='replace')
    # Now each mojibake character is: \uFFFD followed by the latin-1 chars
    # When we encode back to latin-1, we get back the original latin-1 bytes
    step2 = text.encode('latin-1')
    # But those original latin-1 bytes are NOT the correct Chinese UTF-8!
    # They are the intermediate bytes. We need to decode them as... what?

    # OK let me check: what do the raw bytes actually represent?
    # original: 润 = e6 b6 a6 (UTF-8)
    # step 1: e6 b6 a6 treated as latin-1 -> chars U+00E6 U+00B6 U+00A6
    # step 2: those chars encoded as UTF-8 -> c3 a6 c2 b6 c2 a6
    # But raw shows: c3 83 c2 a6 c3 82 c2 b6...
    # c3 a6 = æ (UTF-8 for U+00E6)
    # c2 b6 = ¶ (UTF-8 for U+00B6)
    # c2 a6 = ¦ (UTF-8 for U+00A6)
    # So the actual encoding of U+00E6 as UTF-8 is c3 a6, not c3 83!
    # Why is raw showing c3 83?

    # Wait - maybe the corruption is: e6 -> c3 83
    # Let me check: what is 0xe6 in latin-1? U+00E6 = æ
    # UTF-8 of U+00E6 (æ) = 0xc3 0xa6
    # But raw shows 0xc3 0x83 for the first byte pair

    # c3 83 in UTF-8 is invalid (83 is not a valid continuation byte)
    # In latin-1, c3 = Ã, 83 = <control>
    # So the raw bytes c3 83 are two separate latin-1 chars: Ã (U+00C3) and <control>

    # This is deeper corruption. Let me try a different approach:
    # Since we know the correct UTF-8 for common Chinese strings,
    # we can do direct replacement of known bad patterns.

    # For the specific case: we know that in the JSON, all Chinese text has this pattern.
    # Let's try: read the file as latin-1 (preserving raw bytes), then write as UTF-8.
    latin1_text = raw.decode('latin-1')
    utf8_fixed = latin1_text.encode('utf-8', errors='replace')

    # Validate
    try:
        json.loads(utf8_fixed.decode('utf-8'))
        with open(filepath, 'wb') as f:
            f.write(utf8_fixed)
        print(f'Fixed: {os.path.basename(filepath)} ({len(raw)} -> {len(utf8_fixed)})')
        return True
    except json.JSONDecodeError as e:
        print(f'Still invalid: {os.path.basename(filepath)} - {e}')
        return False

def verify_fix(filepath):
    with open(filepath, 'rb') as f:
        data = f.read()
    if b'\xc3\x83\xc2' in data:
        print(f'  STILL MOJIBAKE: {os.path.basename(filepath)}')
        return False
    # Validate JSON
    with open(filepath, 'r', encoding='utf-8') as f:
        d = json.load(f)
    # Check lhy name
    lhy_name = d['departments']['lhy']['name']
    name_hex = lhy_name.encode('utf-8').hex()
    if name_hex == 'e6b6a6e6bb91e6b2b9e4ba8be4b89ae983a8':
        print(f'  OK: lhy.name correct hex')
        return True
    else:
        print(f'  WRONG: lhy.name hex = {name_hex}')
        return False

# Main
reports_dir = 'D:/trae/AI Daily report/reports'
for fname in sorted(os.listdir(reports_dir)):
    if not (fname.startswith('2026-') and fname.endswith('.json')):
        continue
    fpath = os.path.join(reports_dir, fname)
    if b'\xc3\x83\xc2' in open(fpath, 'rb').read():
        print(f'\nFixing: {fname}')
        fix_json_file(fpath)
        verify_fix(fpath)