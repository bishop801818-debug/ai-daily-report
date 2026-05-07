import base64
import os
import re

folder_path = r'C:\Users\1\Desktop\logo'
html_file = r'd:\trae\AI Daily report\index_v3.html'

# 读取 HTML 文件
with open(html_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 原始 logo 文件列表（按卡片顺序）
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

# 找到所有包含 img src="data:image 的行并替换
logo_index = 0
for i, line in enumerate(lines):
    if 'card-icon' in line and '<img src="data:image/png;base64,' in line:
        if logo_index < len(logo_files):
            logo_file = logo_files[logo_index]
            logo_path = os.path.join(folder_path, logo_file)
            
            if os.path.exists(logo_path):
                # 生成新的 base64 编码
                with open(logo_path, 'rb') as f:
                    image_data = base64.b64encode(f.read()).decode('utf-8')
                    new_base64_src = f'data:image/png;base64,{image_data}'
                
                # 提取原行的后半部分（alt 和 style 等属性）
                match = re.search(r'<img\s+src="data:image/png;base64,[^"]*"(.*?)>', line)
                if match:
                    remaining = match.group(1)
                    new_line = f'                    <img src="{new_base64_src}"{remaining}\n'
                    lines[i] = new_line
                    print(f"已替换第 {logo_index + 1} 个 logo ({logo_file})")
                    logo_index += 1
            else:
                print(f"文件不存在：{logo_file}")
        else:
            print(f"已处理完所有 logo，但还有未处理的 img 标签")

# 保存修改后的 HTML 文件
with open(html_file, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print(f"\n完成！共替换 {logo_index} 个 logo")
