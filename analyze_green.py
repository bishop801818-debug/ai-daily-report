from PIL import Image
import os
import numpy as np

folder_path = r'C:\Users\1\Desktop\logo'

# 检查已处理的图片
for filename in os.listdir(folder_path):
    if '_clean.png' in filename:
        filepath = os.path.join(folder_path, filename)
        img = Image.open(filepath)
        
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        img_array = np.array(img)
        alpha = img_array[:, :, 3]
        green_channel = img_array[:, :, 1]
        red_channel = img_array[:, :, 0]
        blue_channel = img_array[:, :, 2]
        
        # 检测绿色区域
        green_mask = (green_channel > red_channel + 50) & (green_channel > blue_channel + 50)
        green_pixels = np.sum(green_mask)
        
        # 检测透明区域
        transparent_pixels = np.sum(alpha < 128)
        
        # 检测白色/浅灰色区域
        bright_mask = (red_channel > 200) & (green_channel > 200) & (blue_channel > 200)
        bright_pixels = np.sum(bright_mask)
        
        print(f"\n{filename}:")
        print(f"  尺寸：{img.width}x{img.height}")
        print(f"  绿色像素数：{green_pixels} ({green_pixels/(img.width*img.height)*100:.2f}%)")
        print(f"  透明像素数：{transparent_pixels} ({transparent_pixels/(img.width*img.height)*100:.2f}%)")
        print(f"  白色/浅灰像素数：{bright_pixels} ({bright_pixels/(img.width*img.height)*100:.2f}%)")
        
        # 检查边缘
        print(f"  边缘分析:")
        # 上边缘
        top_edge = green_mask[0, :]
        print(f"    上边缘绿色：{np.sum(top_edge)} 像素")
        # 下边缘
        bottom_edge = green_mask[-1, :]
        print(f"    下边缘绿色：{np.sum(bottom_edge)} 像素")
        # 左边缘
        left_edge = green_mask[:, 0]
        print(f"    左边缘绿色：{np.sum(left_edge)} 像素")
        # 右边缘
        right_edge = green_mask[:, -1]
        print(f"    右边缘绿色：{np.sum(right_edge)} 像素")
