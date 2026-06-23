with open('radar_detail_lpsd.html', 'rb') as f:
    raw = f.read()

# Find '2026-05':
pos = raw.find(b"'2026-05':")
print("'2026-05': byte position:", pos)

# Count total bytes before this position
total_before = pos
print("Total bytes before:", total_before)

# Read as UTF-8
with open('radar_detail_lpsd.html', 'r', encoding='utf-8', errors='replace') as f:
    html = f.read()

char_pos = html.find("'2026-05':")
print("'2026-05': char position:", char_pos)

# Check char at that position
ch = html[char_pos]
print("Char at position:", repr(ch), "ord:", ord(ch))

# Check around the position for replacement chars
sample = html[char_pos-5:char_pos+50]
print("Sample around:", repr(sample))

# Count replacement chars in full html
rc_count = html.count('\ufffd')
print("Total replacement chars:", rc_count)

# Check raw bytes for U+FFFD (ef bf bd) in the area
fffd_bytes = raw.find(b'\xef\xbf\xbd')
print("U+FFFD bytes (EF BF BD) first occurrence:", fffd_bytes)
if fffd_bytes >= 0:
    print("Around FFFD:", repr(raw[fffd_bytes-20:fffd_bytes+20]))