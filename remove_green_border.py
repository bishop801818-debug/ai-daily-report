from PIL import Image
import os
import numpy as np

folder_path = r'C:\Users\1\Desktop\logo'

def remove_green_border(img):
    """
    强力去除绿色边框：通过检测连续的绿色区域并裁剪掉
    """
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    img_array = np.array(img)
    alpha = img_array[:, :, 3]
    
    # 提取 RGB 通道
    green_channel = img_array[:, :, 1]
    red_channel = img_array[:, :, 0]
    blue_channel = img_array[:, :, 2]
    
    # 检测绿色区域：绿色明显高于红色和蓝色
    green_mask = (green_channel > red_channel + 30) & (green_channel > blue_channel + 30)
    
    # 检测透明区域
    transparent_mask = alpha < 128
    
    # 合并绿色和透明区域作为需要去除的区域
    remove_mask = green_mask | transparent_mask
    
    # 从底部向上扫描，找到第一个有实际内容的行
    height, width = remove_mask.shape
    top = 0
    bottom = height - 1
    left = 0
    right = width - 1
    
    # 从上往下找第一个非绿色/非透明的行
    for row in range(height):
        if not np.all(remove_mask[row, :]):
            top = row
            break
    
    # 从下往上找第一个非绿色/非透明的行
    for row in range(height - 1, -1, -1):
        if not np.all(remove_mask[row, :]):
            bottom = row
            break
    
    # 从左往右找第一个非绿色/非透明的列
    for col in range(width):
        if not np.all(remove_mask[:, col]):
            left = col
            break
    
    # 从右往左找第一个非绿色/非透明的列
    for col in range(width - 1, -1, -1):
        if not np.all(remove_mask[:, col]):
            right = col
            break
    
    # 裁剪到实际内容区域
    img = img.crop((left, top, right + 1, bottom + 1))
    
    return img

# 获取所有已处理的 clean 图片
clean_images = [f for f in os.listdir(folder_path) if '_clean.png' in f]

print(f"需要处理的图片：{clean_images}")

for img_name in clean_images:
    img_path = os.path.join(folder_path, img_name)
    
    # 打开图片
    img = Image.open(img_path)
    
    # 去除绿色边框
    clean_img = remove_green_border(img)
    
    # 生成新文件名（覆盖原文件）
    new_filename = img_name
    new_path = os.path.join(folder_path, new_filename)
    
    # 保存新图片
    clean_img.save(new_path)
    print(f"已处理：{img_name} (新尺寸：{clean_img.width}x{clean_img.height})")

print("\n所有图片绿色边框去除完成！")
