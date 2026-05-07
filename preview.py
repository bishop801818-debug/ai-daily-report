import os
from PIL import Image
import numpy as np
import matplotlib.pyplot as plt

folder_path = r'C:\Users\1\Desktop\logo'

# 读取处理后的第一张图片
img_path = os.path.join(folder_path, '科技 + 三金组合 LOGO-2023-09_clean.png')
img = Image.open(img_path)

# 显示图片
plt.figure(figsize=(15, 10))
plt.imshow(img)
plt.axis('off')
plt.tight_layout()
plt.savefig(os.path.join(folder_path, 'preview.png'), dpi=150)
print("已保存预览图：preview.png")

# 分析颜色分布
img_array = np.array(img)
if img_array.shape[2] == 4:  # RGBA
    img_array = img_array[:, :, :3]  # 只取 RGB

# 统计颜色
pixels = img_array.reshape(-1, 3)
unique_colors, counts = np.unique(pixels, axis=0, return_counts=True)

print(f"\n总像素数：{pixels.shape[0]}")
print(f"唯一颜色数：{len(unique_colors)}")
print(f"\n最常见的 10 种颜色：")
sorted_indices = np.argsort(counts)[::-1][:10]
for idx in sorted_indices:
    color = unique_colors[idx]
    count = counts[idx]
    pct = count / pixels.shape[0] * 100
    print(f"  RGB{tuple(color)}: {count} 像素 ({pct:.2f}%)")
