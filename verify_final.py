from PIL import Image
import os
import numpy as np

folder_path = r'C:\Users\1\Desktop\logo'

# 检查最终处理结果
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
        green_mask = (green_channel > red_channel + 20) & (green_channel > blue_channel + 20)
        # 检测非透明区域
        non_transparent = alpha > 0
        # 在非透明区域中检测绿色
        green_in_visible = green_mask & non_transparent
        
        green_pixels = np.sum(green_in_visible)
        total_visible = np.sum(non_transparent)
        
        print(f"\n{filename}:")
        print(f"  尺寸：{img.width}x{img.height}")
        print(f"  可见区域像素：{total_visible}")
        print(f"  可见区域中的绿色像素：{green_pixels} ({green_pixels/max(1,total_visible)*100:.2f}%)")
        
        # 检查边缘（只看非透明部分）
        print(f"  边缘检查:")
        height, width = green_in_visible.shape
        
        # 上边缘（前 5 行）
        top_green = np.sum(green_in_visible[:5, :])
        # 下边缘（后 5 行）
        bottom_green = np.sum(green_in_visible[-5:, :])
        # 左边缘（前 5 列）
        left_green = np.sum(green_in_visible[:, :5])
        # 右边缘（后 5 列）
        right_green = np.sum(green_in_visible[:, -5:])
        
        print(f"    上边缘绿色：{top_green} | 下边缘绿色：{bottom_green} | 左边缘绿色：{left_green} | 右边缘绿色：{right_green}")
