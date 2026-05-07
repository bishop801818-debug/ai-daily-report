import os
from PIL import Image
import numpy as np

folder_path = r'C:\Users\1\Desktop\logo'
files = sorted([f for f in os.listdir(folder_path) if f.endswith('.png') and '_clean' not in f and '_no_dragon' not in f and f != '迪克化学.png'])

# 分析第一张原始图片
file = files[0]
img_path = os.path.join(folder_path, file)

img = Image.open(img_path)
print(f"文件：{file}")
print(f"原始尺寸：{img.width}x{img.height}")

# 裁剪左半部分
left_half = img.crop((0, 0, img.width // 2, img.height))
print(f"左半部分尺寸：{left_half.width}x{left_half.height}")

# 转换为 RGBA
if left_half.mode != 'RGBA':
    left_half = left_half.convert('RGBA')

img_array = np.array(left_half)
alpha = img_array[:, :, 3]

# 分析：找到 logo 的实际内容区域（排除绿色边框和透明区域）
# 方法：找到既不是绿色又不是透明的区域
green_channel = img_array[:, :, 1]
red_channel = img_array[:, :, 0]
blue_channel = img_array[:, :, 2]

# 绿色区域
green_mask = (green_channel > red_channel + 50) & (green_channel > blue_channel + 50)
# 透明区域
transparent_mask = alpha < 128
# logo 区域：既不是绿色也不是透明
logo_mask = ~green_mask & ~transparent_mask

print(f"\n总像素数：{img_array.shape[0] * img_array.shape[1]}")
print(f"绿色像素数：{np.sum(green_mask)}")
print(f"透明像素数：{np.sum(transparent_mask)}")
print(f"logo 像素数：{np.sum(logo_mask)}")

# 找到 logo 区域的边界
logo_rows = np.where(np.any(logo_mask, axis=1))[0]
logo_cols = np.where(np.any(logo_mask, axis=0))[0]

if len(logo_rows) > 0:
    print(f"\nLogo 区域边界：")
    print(f"  上：{logo_rows[0]}")
    print(f"  下：{logo_rows[-1]}")
    print(f"  左：{logo_cols[0]}")
    print(f"  右：{logo_cols[-1]}")
    print(f"  Logo 尺寸：{logo_cols[-1] - logo_cols[0] + 1} x {logo_rows[-1] - logo_rows[0] + 1}")
    
    # 裁剪出 logo
    logo_crop = left_half.crop((logo_cols[0], logo_rows[0], logo_cols[-1] + 1, logo_rows[-1] + 1))
    print(f"\n裁剪后的 logo 尺寸：{logo_crop.width}x{logo_crop.height}")
    
    # 保存测试
    logo_crop.save(os.path.join(folder_path, 'test_logo.png'))
    print("已保存测试图片：test_logo.png")
