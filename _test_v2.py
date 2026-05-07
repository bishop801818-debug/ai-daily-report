# -*- coding: utf-8 -*-
# 核心解析函数（测试用，不修改原文件）
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
    """双遍分割：兼容 Format A 和 Format B"""
    raw = section_text.strip()
    if not raw:
        return []

    # 两遍分割取并集去重
    # Format B: **N. 标题** → 用 \n(?=\*\*\d+\.) 分割
    # Format A: N. **标题** → 用 \n(?=\d+\. ) 分割
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

# 测试常州锂源所有章节
path = r'C:/Users/1/Downloads/2026-04-24-9bu-reports/2026-04-24/03-常州锂源事业部.md'
raw = open(path, encoding='utf-8').read()

SECTION_MAP = {
    "企业动态":"竞品","技术/产品":"前沿","市场/价格":"市场",
    "政策/行业":"政策","项目/招标":"客户",
}

section_pattern = r'\n##\s+([^\n]+)\n'
parts = re.split(section_pattern, raw)

results = []
for i in range(1, len(parts)-1, 2):
    sec_title = parts[i].strip()
    sec_body  = parts[i+1] if i+1 < len(parts) else ""

    # 去掉 emoji（测试用：\U0001F000-\U0010FFFF）
    sec_clean = re.sub(r'^[\U0001F000-\U0010FFFF]\s+', '', sec_title)
    results.append(f'Section raw: {repr(sec_title[:40])}')
    results.append(f'Section clean: {repr(sec_clean)} -> in_map={sec_clean in SECTION_MAP}')
    if sec_clean in SECTION_MAP:
        items = parse_section_v2(sec_body)
        results.append(f'  items: {len(items)}')
        for item in items:
            results.append(f'    [{item["priority"]}] {item["title"][:50]}')
    results.append('')

with open('D:/trae/AI Daily report/_v2_test.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(results))
print('done')
