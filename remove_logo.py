from PIL import Image
import os
import numpy as np

# 图片文件夹路径
folder_path = r'C:\Users\1\Desktop\logo'

# 动态获取需要处理的原始图片（排除迪克化学.png 和已处理的文件）
def get_original_images(folder):
    result = []
    for filename in os.listdir(folder):
        if filename.endswith('.png') and \
           filename != '迪克化学.png' and \
           filename != 'test_logo.png' and \
           '_clean' not in filename and \
           '_no_dragon' not in filename:
            result.append(filename)
    return sorted(result)

def make_green_transparent(img):
    """
    将绿色背景变为透明，只保留 logo 内容
    """
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    img_array = np.array(img)
    
    # 提取 RGB 通道
    green_channel = img_array[:, :, 1]
    red_channel = img_array[:, :, 0]
    blue_channel = img_array[:, :, 2]
    
    # 检测绿色区域：绿色明显高于红色和蓝色
    green_mask = (green_channel > red_channel + 20) & (green_channel > blue_channel + 20)
    
    # 将绿色区域的 alpha 设为 0（完全透明）
    img_array[green_mask, 3] = 0
    
    # 创建新图片
    result_img = Image.fromarray(img_array)
    
    return result_img

def crop_to_content(img):
    """
    裁剪到实际内容区域（去除透明边缘）
    """
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    img_array = np.array(img)
    alpha = img_array[:, :, 3]
    
    # 找到非透明区域
    non_transparent = alpha > 0
    
    height, width = non_transparent.shape
    
    top = 0
    bottom = height - 1
    left = 0
    right = width - 1
    
    # 从上往下找
    for row in range(height):
        if np.any(non_transparent[row, :]):
            top = row
            break
    
    # 从下往上找
    for row in range(height - 1, -1, -1):
        if np.any(non_transparent[row, :]):
            bottom = row
            break
    
    # 从左往右找
    for col in range(width):
        if np.any(non_transparent[:, col]):
            left = col
            break
    
    # 从右往左找
    for col in range(width - 1, -1, -1):
        if np.any(non_transparent[:, col]):
            right = col
            break
    
    # 裁剪
    img = img.crop((left, top, right + 1, bottom + 1))
    
    return img

# 获取需要处理的图片
images_to_process = get_original_images(folder_path)

print(f"需要处理的图片：{images_to_process}")

for img_name in images_to_process:
    img_path = os.path.join(folder_path, img_name)
    
    # 打开图片
    img = Image.open(img_path)
    width, height = img.size
    
    # 裁剪左半部分
    left_half = img.crop((0, 0, width // 2, height))
    
    # 将绿色背景变为透明
    transparent_img = make_green_transparent(left_half)
    
    # 裁剪到实际内容
    final_img = crop_to_content(transparent_img)
    
    # 生成新文件名
    name, ext = os.path.splitext(img_name)
    new_filename = f"{name}_clean{ext}"
    new_path = os.path.join(folder_path, new_filename)
    
    # 保存新图片
    final_img.save(new_path)
    print(f"已处理：{img_name} -> {new_filename} (尺寸：{final_img.width}x{final_img.height})")

print("\n所有图片处理完成！绿色背景已完全去除！")
