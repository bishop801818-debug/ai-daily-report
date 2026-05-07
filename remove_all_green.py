from PIL import Image
import os
import numpy as np

folder_path = r'C:\Users\1\Desktop\logo'

def remove_green_background(img):
    """
    彻底去除绿色背景：通过检测并裁剪掉所有绿色区域
    """
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    img_array = np.array(img)
    alpha = img_array[:, :, 3]
    
    # 提取 RGB 通道
    green_channel = img_array[:, :, 1]
    red_channel = img_array[:, :, 0]
    blue_channel = img_array[:, :, 2]
    
    # 检测绿色区域：绿色明显高于红色和蓝色（降低阈值）
    green_mask = (green_channel > red_channel + 20) & (green_channel > blue_channel + 20)
    
    # 检测透明区域
    transparent_mask = alpha < 50
    
    # 检测白色/浅灰色区域（可能是阴影）
    bright_mask = (red_channel > 220) & (green_channel > 220) & (blue_channel > 220)
    
    # 合并所有需要去除的区域
    remove_mask = green_mask | transparent_mask | bright_mask
    
    # 找到实际 logo 区域（既不是绿色，也不是透明，也不是白色）
    logo_mask = ~remove_mask
    
    # 从四个方向扫描，找到 logo 的实际边界
    height, width = logo_mask.shape
    
    top = 0
    bottom = height - 1
    left = 0
    right = width - 1
    
    # 从上往下找第一个有 logo 的行
    for row in range(height):
        if np.any(logo_mask[row, :]):
            top = row
            break
    
    # 从下往上找第一个有 logo 的行
    for row in range(height - 1, -1, -1):
        if np.any(logo_mask[row, :]):
            bottom = row
            break
    
    # 从左往右找第一个有 logo 的列
    for col in range(width):
        if np.any(logo_mask[:, col]):
            left = col
            break
    
    # 从右往左找第一个有 logo 的列
    for col in range(width - 1, -1, -1):
        if np.any(logo_mask[:, col]):
            right = col
            break
    
    # 裁剪到 logo 区域
    img = img.crop((left, top, right + 1, bottom + 1))
    
    return img

# 获取所有已处理的 clean 图片
clean_images = [f for f in os.listdir(folder_path) if '_clean.png' in f]

print(f"需要处理的图片：{clean_images}")

for img_name in clean_images:
    img_path = os.path.join(folder_path, img_name)
    
    # 打开图片
    img = Image.open(img_path)
    original_size = (img.width, img.height)
    
    # 去除绿色背景
    clean_img = remove_green_background(img)
    new_size = (clean_img.width, clean_img.height)
    
    # 生成新文件名（覆盖原文件）
    new_filename = img_name
    new_path = os.path.join(folder_path, new_filename)
    
    # 保存新图片
    clean_img.save(new_path)
    print(f"已处理：{img_name} (原尺寸：{original_size[0]}x{original_size[1]} -> 新尺寸：{new_size[0]}x{new_size[1]})")

print("\n所有图片绿色背景彻底去除完成！")
