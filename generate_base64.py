import base64
import os

folder_path = r'C:\Users\1\Desktop\logo'

# 需要处理的 logo 文件
logo_files = [
    '润滑油_clean.png',
    '可兰素_clean.png',
    '常州锂源_clean.png',
    '龙蟠时代_clean.png',
    '美多科技_clean.png',
    '三金锂电_clean.png',
    '铂源催化_clean.png',
    '法恩莱特_clean.png',
    '迪克化学.png'
]

print("Base64 编码的 logo 图片：\n")

for logo_file in logo_files:
    logo_path = os.path.join(folder_path, logo_file)
    
    if os.path.exists(logo_path):
        with open(logo_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
            print(f"{logo_file}: data:image/png;base64,{image_data[:100]}... (总长度：{len(image_data)})\n")
    else:
        print(f"{logo_file}: 文件不存在\n")
