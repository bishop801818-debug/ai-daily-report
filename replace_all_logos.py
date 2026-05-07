import base64
import os

folder_path = r'C:\Users\1\Desktop\logo'
html_file = r'd:\trae\AI Daily report\index_v3.html'

# 读取 HTML 文件
with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 原始 logo 文件列表（按卡片顺序）
logo_files = [
    ('润滑油.png', '润滑油'),
    ('可兰素.png', '可兰素'),
    ('常州锂源.png', '常州锂源'),
    ('龙蟠时代.png', '龙蟠时代'),
    ('美多科技.png', '美多科技'),
    ('三金锂电.png', '三金锂电'),
    ('铂源催化.png', '铂源催化'),
    ('法恩莱特.png', '法恩莱特'),
    ('迪克化学.png', '迪克化学')
]

# 对于每个 logo，找到包含其中文名称的卡片，并替换其中的 img 标签
for logo_file, chinese_name in logo_files:
    logo_path = os.path.join(folder_path, logo_file)
    
    if os.path.exists(logo_path):
        # 生成新的 base64
        with open(logo_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
            new_base64_src = f'data:image/png;base64,{image_data}'
        
        # 找到包含该中文名称的卡片区域
        # 查找模式：<div class="card-icon"...><img src="data:image/..."></div>
        start_marker = f'<!-- 卡片'
        end_marker = '</div>\n                <div class="card-actions">'
        
        # 找到包含中文名称的卡片起始位置
        card_start = content.find(f'{chinese_name}</div>')
        if card_start == -1:
            print(f"未找到包含 {chinese_name} 的卡片")
            continue
        
        # 向前找到 card-icon div 的开始
        card_icon_start = content.rfind('<div class="card-icon"', 0, card_start)
        if card_icon_start == -1:
            print(f"未找到 {chinese_name} 的 card-icon 标签")
            continue
        
        # 找到该 card-icon div 的结束
        card_icon_end = content.find('</div>', card_icon_start)
        if card_icon_end == -1:
            print(f"未找到 {chinese_name} 的 card-icon 结束标签")
            continue
        
        # 提取旧的 img 标签部分
        old_card_icon = content[card_icon_start:card_icon_end+6]
        
        # 构建新的 card-icon div
        new_card_icon = f'<div class="card-icon" style="background: white; padding: 10px;">\n                    <img src="{new_base64_src}" alt="{chinese_name}" style="max-width: 100%; max-height: 100%; object-fit: contain;">\n                </div>'
        
        # 替换
        content = content[:card_icon_start] + new_card_icon + content[card_icon_end+6:]
        print(f"已替换：{chinese_name} -> {logo_file}")
    else:
        print(f"文件不存在：{logo_file}")

# 保存
with open(html_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n完成！")
