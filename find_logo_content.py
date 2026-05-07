from PIL import Image
import os
import numpy as np

folder_path = r'C:\Users\1\Desktop\logo'

def find_logo_content(img):
    """
    找到 logo 的实际内容（非背景部分）
    假设：logo 内容是颜色变化丰富的区域，背景是单一的绿色
    """
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    img_array = np.array(img)
    alpha = img_array[:, :, 3]
    
    # 提取 RGB 通道
    green_channel = img_array[:, :, 1]
    red_channel = img_array[:, :, 0]
    blue_channel = img_array[:, :, 2]
    
    # 检测非绿色区域（logo 内容）
    # 方法：红色或蓝色至少有一个明显高于绿色，或者三个通道差异较大
    not_green = (red_channel > green_channel - 20) | (blue_channel > green_channel - 20)
    
    # 检测透明区域
    transparent = alpha < 50
    
    # logo 内容：既不是纯绿色背景，也不是透明
    logo_content = not_green & ~transparent
    
    # 形态学操作：膨胀以连接断开的区域
    from scipy import ndimage
    logo_content = ndimage.binary_dilation(logo_content, iterations=2)
    logo_content = ndimage.binary_erosion(logo_content, iterations=2)
    
    # 找到边界
    height, width = logo_content.shape
    
    top = 0
    bottom = height - 1
    left = 0
    right = width - 1
    
    # 从上往下找
    for row in range(height):
        if np.any(logo_content[row, :]):
            top = row
            break
    
    # 从下往上找
    for row in range(height - 1, -1, -1):
        if np.any(logo_content[row, :]):
            bottom = row
            break
    
    # 从左往右找
    for col in range(width):
        if np.any(logo_content[:, col]):
            left = col
            break
    
    # 从右往左找
    for col in range(width - 1, -1, -1):
        if np.any(logo_content[:, col]):
            right = col
            break
    
    # 裁剪
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
    
    try:
        # 找到 logo 内容
        clean_img = find_logo_content(img)
        new_size = (clean_img.width, clean_img.height)
        
        # 生成新文件名（覆盖原文件）
        new_filename = img_name
        new_path = os.path.join(folder_path, new_filename)
        
        # 保存新图片
        clean_img.save(new_path)
        print(f"已处理：{img_name} (原尺寸：{original_size[0]}x{original_size[1]} -> 新尺寸：{new_size[0]}x{new_size[1]})")
    except Exception as e:
        print(f"处理 {img_name} 时出错：{e}")

print("\n所有图片 logo 内容提取完成！")
