import base64
import os
import re

folder_path = r'C:\Users\1\Desktop\logo'
html_file = r'd:\trae\AI Daily report\index_v3.html'

# 需要处理的 logo 文件
logo_files = {
    '润滑油_clean.png': 'file:///C:/Users/1/Desktop/logo/润滑油_clean.png',
    '可兰素_clean.png': 'file:///C:/Users/1/Desktop/logo/可兰素_clean.png',
    '常州锂源_clean.png': 'file:///C:/Users/1/Desktop/logo/常州锂源_clean.png',
    '龙蟠时代_clean.png': 'file:///C:/Users/1/Desktop/logo/龙蟠时代_clean.png',
    '美多科技_clean.png': 'file:///C:/Users/1/Desktop/logo/美多科技_clean.png',
    '三金锂电_clean.png': 'file:///C:/Users/1/Desktop/logo/三金锂电_clean.png',
    '铂源催化_clean.png': 'file:///C:/Users/1/Desktop/logo/铂源催化_clean.png',
    '法恩莱特_clean.png': 'file:///C:/Users/1/Desktop/logo/法恩莱特_clean.png',
    '迪克化学.png': 'file:///C:/Users/1/Desktop/logo/迪克化学.png'
}

# 读取 HTML 文件
with open(html_file, 'r', encoding='utf-8') as f:
    html_content = f.read()

# 替换每个图片
for logo_file, old_path in logo_files.items():
    logo_path = os.path.join(folder_path, logo_file)
    
    if os.path.exists(logo_path):
        with open(logo_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
            base64_src = f'data:image/png;base64,{image_data}'
        
        # 替换 HTML 中的图片路径
        html_content = html_content.replace(old_path, base64_src)
        print(f"已替换：{logo_file}")
    else:
        print(f"文件不存在：{logo_file}")

# 保存修改后的 HTML 文件
with open(html_file, 'w', encoding='utf-8') as f:
    f.write(html_content)

print("\n所有图片已替换为 base64 编码！")
