# -*- coding: utf-8 -*-
"""
Fix the double-encoding mojibake in JSON files.
Each corrupted 2-byte pair maps back to a single original UTF-8 byte.
"""
import json, os, sys

# Mapping from corrupted 2-byte pairs (latin-1 decode of mojibake bytes) to original UTF-8 bytes
# Original: UTF-8 encode 0xe6, 0xb6, 0xa6 etc.
# Corrupted: encode each original byte as a latin-1 char, then UTF-8 encode each char
# e6 (0xe6 > 0x7F) -> latin-1 U+00E6 (æ) -> UTF-8 -> c3 a6
# b6 (0xb6 > 0x7F) -> latin-1 U+00B6 (¶) -> UTF-8 -> c2 b6
# a6 (0xa6 > 0x7F) -> latin-1 U+00A6 (¦) -> UTF-8 -> c2 a6

# The CORRUPTED bytes in the file are the UTF-8 encoding of those latin-1 chars:
# c3 a6 = UTF-8 of U+00E6 (æ)
# c2 b6 = UTF-8 of U+00B6 (¶)
# c2 a6 = UTF-8 of U+00A6 (¦)

# So the corruption chain is:
# original byte e6 -> latin-1 U+00E6 (æ) -> UTF-8 -> c3 a6
# To reverse: c3 a6 -> UTF-8 decode -> U+00E6 -> ord() -> 0xe6
# BUT: c3 a6 is valid UTF-8 = æ
# ord('æ') = 0xe6 -> CORRECT!

# Wait, this means the fix should work automatically via JSON.loads!
# Let me test this hypothesis

def test_fix():
    # Corrupted bytes: c3 a6 c2 b6 c2 a6
    # UTF-8 decode: æ ¶ ¦
    # ord(): 0xe6 0xb6 0xa6 -> CORRECT!

    corrupted = bytes([0xc3, 0xa6, 0xc2, 0xb6, 0xc2, 0xa6])
    decoded = corrupted.decode('utf-8')
    original = bytes([ord(c) for c in decoded])
    print('Corrupted hex:', corrupted.hex())
    print('Decoded chars:', list(decoded))
    print('Original bytes:', original.hex())
    print('Expected:', bytes([0xe6, 0xb6, 0xa6]).hex())
    print('Match:', original == bytes([0xe6, 0xb6, 0xa6]))

test_fix()

# Now let's fix all JSON files with this understanding
def fix_file(filepath):
    with open(filepath, 'rb') as f:
        raw = f.read()

    # Decode UTF-8 (valid UTF-8, mojibake bytes are valid UTF-8 sequences)
    text = raw.decode('utf-8', errors='replace')

    # For each string, try to fix mojibake
    # Moji byte pattern: c3 XX c2 YY (2-byte UTF-8 of latin-1 chars > 0x7F)
    # The fix: decode the UTF-8 sequence, get the latin-1 chars, convert back to original bytes

    fixed = 0
    result = []
    i = 0
    while i < len(text):
        c = text[i]
        code = ord(c)
        if code > 0x7F and code != 0xFFFD:  # Non-ASCII and not replacement char
            # Check if this is a mojibake character (latin-1 char > 0x7F encoded as UTF-8)
            # The original UTF-8 byte was > 0x7F, converted to latin-1 char, then UTF-8 encoded
            # To reverse: encode as latin-1 to get the original byte
            byte_val = ord(c.encode('latin-1'))
            result.append(chr(byte_val))
            fixed += 1
        else:
            result.append(c)
        i += 1

    fixed_text = ''.join(result)
    fixed_bytes = fixed_text.encode('utf-8')

    # Validate
    try:
        json.loads(fixed_bytes.decode('utf-8'))
        with open(filepath, 'wb') as f:
            f.write(fixed_bytes)
        print(f'Fixed: {os.path.basename(filepath)} ({fixed} chars) -> ({len(raw)} -> {len(fixed_bytes)} bytes)')
        return True
    except Exception as e:
        print(f'Failed: {os.path.basename(filepath)} - {e}')
        return False

if __name__ == '__main__':
    reports_dir = 'D:/trae/AI Daily report/reports'
    for fname in sorted(os.listdir(reports_dir)):
        if fname.startswith('2026-') and fname.endswith('.json'):
            fpath = os.path.join(reports_dir, fname)
            # Check for mojibake: chars > 0x7F that could be from latin-1
            with open(fpath, 'rb') as f:
                raw = f.read()
            text = raw.decode('utf-8', errors='replace')
            # Count chars > 0x7F that encode to latin-1 bytes > 0x7F
            suspicious = sum(1 for c in text if ord(c) > 0x7F and ord(c) != 0xFFFD and ord(c.encode('latin-1')) > 0x7F)
            if suspicious > 0:
                print(f'Mojibake: {fname} ({suspicious} chars)')
                fix_file(fpath)