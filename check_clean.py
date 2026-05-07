import os
from PIL import Image
import numpy as np

folder_path = r'C:\Users\1\Desktop\logo'
files = sorted([f for f in os.listdir(folder_path) if f.endswith('.png') and '_clean' not in f and '_no_dragon' not in f and f != '迪克化学.png'])

# 分析处理后的图片
for file in files[:2]:  # 只分析前两个
    clean_file = file.replace('.png', '_clean.png')
    clean_path = os.path.join(folder_path, clean_file)
    
    if os.path.exists(clean_path):
        img = Image.open(clean_path)
        print(f"\n{'='*60}")
        print(f"文件：{clean_file}")
        print(f"尺寸：{img.width}x{img.height}")
        
        # 转换为 RGBA
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        img_array = np.array(img)
        alpha = img_array[:, :, 3]
        
        # 检查透明区域
        print(f"\nAlpha 通道统计：")
        print(f"  最小值：{np.min(alpha)}")
        print(f"  最大值：{np.max(alpha)}")
        print(f"  完全透明的像素数：{np.sum(alpha == 0)}")
        
        # 找到非透明区域
        non_transparent_rows = np.where(np.any(alpha > 0, axis=1))[0]
        non_transparent_cols = np.where(np.any(alpha > 0, axis=0))[0]
        
        if len(non_transparent_rows) > 0:
            print(f"\n非透明区域边界：")
            print(f"  上：{non_transparent_rows[0]}")
            print(f"  下：{non_transparent_rows[-1]}")
            print(f"  左：{non_transparent_cols[0]}")
            print(f"  右：{non_transparent_cols[-1]}")
            print(f"  建议裁剪尺寸：{non_transparent_cols[-1] - non_transparent_cols[0] + 1} x {non_transparent_rows[-1] - non_transparent_rows[0] + 1}")
        
        # 检查绿色
        green_channel = img_array[:, :, 1]
        red_channel = img_array[:, :, 0]
        blue_channel = img_array[:, :, 2]
        green_mask = (green_channel > red_channel + 50) & (green_channel > blue_channel + 50) & (alpha > 128)
        print(f"\n绿色像素数：{np.sum(green_mask)}")
        
        if np.sum(green_mask) > 0:
            green_rows = np.where(np.any(green_mask, axis=1))[0]
            green_cols = np.where(np.any(green_mask, axis=0))[0]
            print(f"绿色区域范围：行 [{green_rows[0]}:{green_rows[-1]+1}], 列 [{green_cols[0]}:{green_cols[-1]+1}]")
