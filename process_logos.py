from PIL import Image
import os
import numpy as np

folder_path = r'C:\Users\1\Desktop\logo'

def process_logo(img):
    """
    处理 logo：将绿色背景变为透明，并裁剪到实际内容
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

# 获取所有原始 logo 图片（排除已处理的）
logo_files = [f for f in os.listdir(folder_path) if f.endswith('.png') and '_clean' not in f and f != '迪克化学.png']

print(f"需要处理的 logo: {logo_files}")

for logo_name in logo_files:
    logo_path = os.path.join(folder_path, logo_name)
    
    # 打开图片
    img = Image.open(logo_path)
    original_size = (img.width, img.height)
    
    try:
        # 处理 logo（去绿色背景）
        processed_img = process_logo(img)
        
        # 生成新文件名（添加_clean 后缀）
        name, ext = os.path.splitext(logo_name)
        new_filename = f"{name}_clean{ext}"
        new_path = os.path.join(folder_path, new_filename)
        
        # 保存新图片
        processed_img.save(new_path)
        print(f"已处理：{logo_name} -> {new_filename} (尺寸：{original_size[0]}x{original_size[1]})")
    except Exception as e:
        print(f"处理 {logo_name} 时出错：{e}")

print("\n所有 logo 处理完成！")
