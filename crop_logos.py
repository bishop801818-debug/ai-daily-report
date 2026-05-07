from PIL import Image
import numpy as np
import os

folder_path = r'C:\Users\1\Desktop\logo'

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
    
    # 找到边界
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

# 处理龙蟠时代
logo_name = '龙蟠时代_clean.png'
logo_path = os.path.join(folder_path, logo_name)

img = Image.open(logo_path)
print(f"原始尺寸：{img.width}x{img.height}")

# 裁剪到实际内容
cropped_img = crop_to_content(img)
print(f"裁剪后尺寸：{cropped_img.width}x{cropped_img.height}")

# 添加一些边距（10%）
padding_x = int(cropped_img.width * 0.1)
padding_y = int(cropped_img.height * 0.1)

new_width = cropped_img.width + 2 * padding_x
new_height = cropped_img.height + 2 * padding_y

# 创建一个带边距的新图片
padded_img = Image.new('RGBA', (new_width, new_height), (0, 0, 0, 0))
padded_img.paste(cropped_img, (padding_x, padding_y))

print(f"加边距后尺寸：{padded_img.width}x{padded_img.height}")

# 保存
padded_img.save(logo_path)
print(f"已保存：{logo_path}")

# 对其他 logo 也做同样处理
print("\n--- 处理其他 logo ---")
for logo_name in ['润滑油_clean.png', '可兰素_clean.png', '常州锂源_clean.png', '美多科技_clean.png', 
                  '三金锂电_clean.png', '铂源催化_clean.png', '法恩莱特_clean.png']:
    logo_path = os.path.join(folder_path, logo_name)
    if os.path.exists(logo_path):
        img = Image.open(logo_path)
        try:
            cropped_img = crop_to_content(img)
            
            # 添加 10% 边距
            padding_x = int(cropped_img.width * 0.1)
            padding_y = int(cropped_img.height * 0.1)
            
            new_width = cropped_img.width + 2 * padding_x
            new_height = cropped_img.height + 2 * padding_y
            
            padded_img = Image.new('RGBA', (new_width, new_height), (0, 0, 0, 0))
            padded_img.paste(cropped_img, (padding_x, padding_y))
            
            padded_img.save(logo_path)
            print(f"{logo_name}: {img.width}x{img.height} -> {padded_img.width}x{padded_img.height}")
        except Exception as e:
            print(f"{logo_name}: 错误 - {e}")

print("\n完成！")
