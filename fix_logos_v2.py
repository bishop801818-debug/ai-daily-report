import base64
import os
import re

folder_path = r'C:\Users\1\Desktop\logo'
html_file = r'd:\trae\AI Daily report\index_v3.html'

# 读取 HTML 文件
with open(html_file, 'r', encoding='utf-8') as f:
    html_content = f.read()

# 原始 logo 文件列表（按顺序对应 9 个事业部）
logo_files = [
    '润滑油.png',
    '可兰素.png',
    '常州锂源.png',
    '龙蟠时代.png',
    '美多科技.png',
    '三金锂电.png',
    '铂源催化.png',
    '法恩莱特.png',
    '迪克化学.png'
]

# 对于每个 logo，找到并替换其 base64 编码
for logo_file in logo_files:
    logo_path = os.path.join(folder_path, logo_file)
    
    if os.path.exists(logo_path):
        # 读取原始 logo 文件并生成 base64
        with open(logo_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
            new_base64_src = f'data:image/png;base64,{image_data}'
        
        # 找到 HTML 中对应的 img 标签并替换
        # 使用正则表达式匹配包含该 logo 名称的 img 标签
        pattern = r'(<img\s+src="data:image/png;base64,)[^"]*(".*?>)'
        
        # 由于无法直接知道哪个 img 对应哪个 logo，我们需要按顺序替换
        # 先找到所有 img 标签的位置
        matches = list(re.finditer(pattern, html_content))
        
        # 根据 logo 文件名判断是第几个 logo，然后替换对应的 img 标签
        logo_index = logo_files.index(logo_file)
        
        if logo_index < len(matches):
            match = matches[logo_index]
            old_src = match.group(0)
            # 构建新的 img 标签
            new_src = f'<img src="{new_base64_src}"'
            # 提取原标签的剩余部分（alt 和 style 等属性）
            remaining = re.search(r'<img\s+src="data:image/png;base64,[^"]*"(.*?)>', old_src).group(1)
            new_img_tag = f'<img src="{new_base64_src}"{remaining}'
            
            html_content = html_content[:match.start()] + new_img_tag + html_content[match.end():]
            print(f"已替换第 {logo_index + 1} 个 logo: {logo_file}")
        else:
            print(f"警告：未找到第 {logo_index + 1} 个 logo 的位置")
    else:
        print(f"文件不存在：{logo_file}")

# 保存修改后的 HTML 文件
with open(html_file, 'w', encoding='utf-8') as f:
    f.write(html_content)

print("\n所有 logo 已替换为原始文件！")
