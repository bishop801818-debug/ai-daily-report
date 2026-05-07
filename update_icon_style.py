with open(r'd:\trae\AI Daily report\index_v3.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 替换所有 card-icon 的内联样式
old_style = 'style="background: white; padding: 5px; display: flex; align-items: center; justify-content: center; width: 80px; height: 80px;"'
new_style = 'style="background: white; padding: 10px;"'

content = content.replace(old_style, new_style)

with open(r'd:\trae\AI Daily report\index_v3.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("已更新所有 logo 容器的样式！")
