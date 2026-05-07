# -*- coding: utf-8 -*-
"""精确定位：为什么项目/招标章节没有解析出条目"""
import re

def safe_json_str(s):
    import json as _json
    raw = str(s).strip()
    raw = re.sub(r'\*{1,3}([^*]+)\*{1,3}', r'\1', raw)
    return _json.dumps(raw, ensure_ascii=False)[1:-1]

def parse_source(line):
    m = re.search(r'（来源：([^，]+)[，\)]', line)
    src = m.group(1) if m else ""
    url_m = re.search(r'https?://[^\s）\)]+', line)
    url = url_m.group(0) if url_m else ""
    return src, url

def parse_item_block(block: str):
    block = block.strip()
    if not block:
        return None
    num_m = re.match(r'^\*\*(\d+)\.\s*([^*]+)\*\*', block)
    if num_m:
        num = int(num_m.group(1))
        title = safe_json_str(num_m.group(2))
        rest = block[num_m.end():].strip()
    else:
        num_m2 = re.match(r'^(\d+)\.\s+\*\*([^*]+)\*\*', block)
        if num_m2:
            num = int(num_m2.group(1))
            title = safe_json_str(num_m2.group(2))
            rest = block[num_m2.end():].strip()
        else:
            return None
    priority = "P0" if num == 1 else ("P1" if num == 2 else "P2")
    lines = rest.splitlines()
    content_lines = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if re.match(r'（来源：', stripped) or stripped.startswith("🦞") or stripped.startswith("💡"):
            break
        content_lines.append(stripped)
    content = safe_json_str(" ".join(content_lines))
    src, url = parse_source(rest)
    return {"priority": priority, "title": title, "content": content, "source": src, "url": url}

def parse_section_v2(section_text: str):
    raw = section_text.strip()
    if not raw:
        return []

    seen = set()
    items = []
    for pat in (r'\n(?=\*\*\d+\.)', r'\n(?=\d+\. )'):
        parts = re.split(pat, raw)
        for part in parts:
            part = part.strip()
            if not part:
                continue
            item = parse_item_block(part)
            if item and item['title'] not in seen:
                seen.add(item['title'])
                items.append(item)

    items.sort(key=lambda x: x.get('priority', 'P2'))
    return items

# 读取常州锂源MD，找到项目/招标章节
with open('C:/Users/1/Downloads/2026-04-24-9bu-reports/2026-04-24/03-常州锂源事业部.md', encoding='utf-8') as f:
    raw = f.read()

section_pattern = r'\n##\s+([^\n]+)\n'
parts = re.split(section_pattern, raw)

results = []
for i in range(1, len(parts)-1, 2):
    sec_title = parts[i].strip()
    sec_body = parts[i+1] if i+1 < len(parts) else ""

    # 去掉 emoji（当前脚本里的 regex）
    sec_clean = re.sub(r'^[\U0001F000-\U0010FFFF\U0000FE0F]\s*', '', sec_title)
    results.append(f'Raw title: {repr(sec_title)}')
    results.append(f'After emoji remove: {repr(sec_clean)}')
    results.append(f'Body first 100 chars: {repr(sec_body[:100])}')

    if '项目' in sec_clean or '招标' in sec_clean:
        results.append(f'=== PROJECT SECTION FOUND ===')
        results.append(f'Body repr: {repr(sec_body)}')
        results.append(f'Body length: {len(sec_body)}')

        # Test the two split patterns
        for pat_name, pat in [
            ('Format B \\n(?=\\*\\*\\d+\\.)', r'\n(?=\*\*\d+\.)'),
            ('Format A \\n(?=\\d+\\. )', r'\n(?=\d+\. )'),
        ]:
            split_result = re.split(pat, sec_body.strip())
            results.append(f'Pattern [{pat_name}]: {len(split_result)} parts')
            for j, part in enumerate(split_result):
                results.append(f'  Part[{j}]: {repr(part[:60])}')

        # 直接测试 parse_item_block
        test_part = sec_body.strip()
        results.append(f'\\nDirect parse_item_block on body[{len(test_part)} chars]:')
        item = parse_item_block(test_part)
        results.append(f'  Result: {item}')

        # 测试每条
        items = parse_section_v2(sec_body)
        results.append(f'\\nparse_section_v2 result: {len(items)} items')
        for item in items:
            results.append(f'  [{item["priority"]}] {item["title"]}')

with open('D:/trae/AI Daily report/_proj_debug.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(results))
print('done')
