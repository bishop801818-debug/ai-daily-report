import os
from PIL import Image
import numpy as np

folder_path = r'C:\Users\1\Desktop\logo'
files = sorted([f for f in os.listdir(folder_path) if f.endswith('_clean.png') and f != 'test_logo_clean.png'])

print("处理后的图片统计：")
print("="*80)

for file in files:
    file_path = os.path.join(folder_path, file)
    img = Image.open(file_path)
    
    # 转换为 RGBA
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    img_array = np.array(img)
    alpha = img_array[:, :, 3]
    
    # 检查绿色
    green_channel = img_array[:, :, 1]
    red_channel = img_array[:, :, 0]
    blue_channel = img_array[:, :, 2]
    green_mask = (green_channel > red_channel + 50) & (green_channel > blue_channel + 50)
    
    print(f"{file}")
    print(f"  尺寸：{img.width}x{img.height}")
    print(f"  绿色像素：{np.sum(green_mask)} ({np.sum(green_mask) / (img.width * img.height) * 100:.2f}%)")
    print()

print("="*80)
print("验证完成！")
