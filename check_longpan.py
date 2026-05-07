from PIL import Image
import numpy as np

img = Image.open(r'C:\Users\1\Desktop\logo\龙蟠时代_clean.png')
img_array = np.array(img)
alpha = img_array[:, :, 3]

# 找到非透明区域
non_transparent = alpha > 0
height, width = non_transparent.shape

print(f"图片尺寸：{width}x{height}")

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

print(f"实际内容边界：上={top}, 下={bottom}, 左={left}, 右={right}")
print(f"实际内容尺寸：{right-left+1}x{bottom-top+1}")

# 检查其他 logo 做对比
print("\n--- 对比其他 logo ---")
for logo in ['润滑油_clean.png', '可兰素_clean.png', '迪克化学.png']:
    try:
        test_img = Image.open(f'C:\\Users\\1\\Desktop\\logo\\{logo}')
        test_array = np.array(test_img)
        test_alpha = test_array[:, :, 3]
        non_trans = test_alpha > 0
        h, w = non_trans.shape
        
        t = b = l = r = 0
        for row in range(h):
            if np.any(non_trans[row, :]):
                t = row
                break
        for row in range(h - 1, -1, -1):
            if np.any(non_trans[row, :]):
                b = row
                break
        for col in range(w):
            if np.any(non_trans[:, col]):
                l = col
                break
        for col in range(w - 1, -1, -1):
            if np.any(non_trans[:, col]):
                r = col
                break
        
        print(f"{logo}: {w}x{h}, 内容：{r-l+1}x{b-t+1}")
    except Exception as e:
        print(f"{logo}: 错误 - {e}")
