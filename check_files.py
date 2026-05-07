import base64
import os

folder_path = r'C:\Users\1\Desktop\logo'

# 检查原始文件和_clean 文件的尺寸
files = ['润滑油.png', '润滑油_clean.png', 
         '可兰素.png', '可兰素_clean.png',
         '龙蟠时代.png', '龙蟠时代_clean.png',
         '美多科技.png', '美多科技_clean.png']

for file in files:
    path = os.path.join(folder_path, file)
    if os.path.exists(path):
        # 计算 base64 编码的前 50 个字符
        with open(path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')[:50]
        print(f"{file}: 存在，base64 开头：{b64}...")
    else:
        print(f"{file}: 不存在")
