# -*- coding: utf-8 -*-
import json

# 读取文件
with open('2026-04-13.json', 'r', encoding='utf-8') as f:
    content = f.read()

# 替换中文引号为英文引号 (先替换所有中文引号为英文)
# 中文双引号 " 和 " 替换为英文 "
content = content.replace('\u201c', '"').replace('\u201d', '"')
# 中文单引号 ' 和 ' 替换为英文 '
content = content.replace('\u2018', "'").replace('\u2019', "'")

# 尝试解析并重新写入
try:
    data = json.loads(content)
    with open('2026-04-13.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print('JSON修复成功')
except json.JSONDecodeError as e:
    print(f'解析失败: {e}')