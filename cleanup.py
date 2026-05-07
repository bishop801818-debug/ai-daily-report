import os

folder_path = r'C:\Users\1\Desktop\logo'

# 删除所有包含_no_dragon 的文件
for file in os.listdir(folder_path):
    if '_no_dragon' in file:
        file_path = os.path.join(folder_path, file)
        os.remove(file_path)
        print(f"已删除：{file}")

print("\n清理完成！")
