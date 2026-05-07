import os
from PIL import Image
import numpy as np

folder_path = r'C:\Users\1\Desktop\logo'
files = sorted([f for f in os.listdir(folder_path) if f.endswith('.png') and '_clean' not in f and '_no_dragon' not in f and f != '迪克化学.png'])

# 分析第一张图片
first_file = files[0]
img_path = os.path.join(folder_path, first_file)

img = Image.open(img_path)
print(f"文件：{first_file}")
print(f"原始尺寸：{img.width}x{img.height}")

# 裁剪左半部分
left_half = img.crop((0, 0, img.width // 2, img.height))
print(f"左半部分尺寸：{left_half.width}x{left_half.height}")

# 转换为 RGBA 并获取 alpha 通道
if left_half.mode != 'RGBA':
    left_half = left_half.convert('RGBA')

img_array = np.array(left_half)
alpha = img_array[:, :, 3]

# 检查透明区域
print(f"\nAlpha 通道统计：")
print(f"  最小值：{np.min(alpha)}")
print(f"  最大值：{np.max(alpha)}")
print(f"  平均值：{np.mean(alpha):.2f}")
print(f"  完全透明的像素数：{np.sum(alpha == 0)}")
print(f"  半透明以上的像素数：{np.sum(alpha > 128)}")

# 找到非完全透明的区域
non_fully_transparent_rows = np.where(np.any(alpha > 0, axis=1))[0]
non_fully_transparent_cols = np.where(np.any(alpha > 0, axis=0))[0]

if len(non_fully_transparent_rows) > 0:
    print(f"\n非透明区域边界：")
    print(f"  上：{non_fully_transparent_rows[0]}")
    print(f"  下：{non_fully_transparent_rows[-1]}")
    print(f"  左：{non_fully_transparent_cols[0]}")
    print(f"  右：{non_fully_transparent_cols[-1]}")
    print(f"  裁剪后尺寸：{non_fully_transparent_cols[-1] - non_fully_transparent_cols[0] + 1} x {non_fully_transparent_rows[-1] - non_fully_transparent_rows[0] + 1}")

# 检查 RGB 通道，找到有颜色的区域（排除白色背景）
rgb = img_array[:, :, :3]
brightness = np.mean(rgb, axis=2)

# 找到非白色区域（亮度 < 250）
non_white_rows = np.where(np.any(brightness < 250, axis=1))[0]
non_white_cols = np.where(np.any(brightness < 250, axis=0))[0]

if len(non_white_rows) > 0:
    print(f"\n非白色区域边界：")
    print(f"  上：{non_white_rows[0]}")
    print(f"  下：{non_white_rows[-1]}")
    print(f"  左：{non_white_cols[0]}")
    print(f"  右：{non_white_cols[-1]}")
    print(f"  裁剪后尺寸：{non_white_cols[-1] - non_white_cols[0] + 1} x {non_white_rows[-1] - non_white_rows[0] + 1}")

# 检查是否有绿色边框
green_channel = img_array[:, :, 1]
red_channel = img_array[:, :, 0]
blue_channel = img_array[:, :, 2]
green_mask = (green_channel > red_channel + 50) & (green_channel > blue_channel + 50) & (alpha > 128)
print(f"\n绿色边框像素数：{np.sum(green_mask)}")

if np.sum(green_mask) > 0:
    green_rows = np.where(np.any(green_mask, axis=1))[0]
    green_cols = np.where(np.any(green_mask, axis=0))[0]
    print(f"绿色边框范围：行 [{green_rows[0]}:{green_rows[-1]+1}], 列 [{green_cols[0]}:{green_cols[-1]+1}]")
