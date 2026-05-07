"""
index_v3.html 改造脚本 v2 - 2026/05/05
1. 删除 quick-start-section 全员晨会大区块
2. 缩小卡片占地（minmax 400→200，padding/icon/title等相应缩小）
3. 去掉所有"详情页"按钮
4. 全员晨会汇报卡片加入 grid 第一个位置
5. 重新排列9BU顺序：常州锂源→龙蟠时代→三金锂电→法恩莱特→山东美多→可兰素→润滑油→迪克化学→铂源催化
"""

import re

with open("D:/trae/AI Daily report/index_v3.html", "r", encoding="utf-8") as f:
    content = f.read()

print(f"原始文件大小: {len(content)} bytes")

# ============================================================
# 修改1: 删除 quick-start-section 区块
# ============================================================
start_marker = "        <!-- 一键启动区域 -->"
end_marker = "        <!-- 事业部卡片网格 -->"
s = content.find(start_marker)
e = content.find(end_marker)
print(f"[1] quick-start-section: {s} -> {e}")
content = content[:s] + content[e:]
print(f"    删除后大小: {len(content)} bytes")

# ============================================================
# 修改2: 缩小卡片占地 - CSS
# ============================================================
content = content.replace(
    "grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));",
    "grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));"
)
print("[2a] business-grid minmax 400→200")

content = content.replace(
    """            background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
            border-radius: 16px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;""",
    """            background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
            border-radius: 10px;
            padding: 10px;
            display: flex;
            align-items: center;
            gap: 8px;"""
)
print("[2b] business-card padding/gap/border-radius 缩小")

content = content.replace(
    """        .card-icon {
            width: 100px;
            height: 100px;
            border-radius: 12px;""",
    """        .card-icon {
            width: 50px;
            height: 50px;
            border-radius: 8px;"""
)
print("[2c] card-icon 100→50")

content = content.replace(
    """        .card-title {
            font-size: 18px;""",
    """        .card-title {
            font-size: 14px;"""
)
print("[2d] card-title 18→14")

content = content.replace(
    """        .card-subtitle {
            font-size: 13px;""",
    """        .card-subtitle {
            font-size: 11px;"""
)
print("[2e] card-subtitle 13→11")

# card-icon svg 尺寸
content = content.replace(
    """            .card-icon svg {
                width: 50px;
                height: 50px;""",
    """            .card-icon svg {
                width: 30px;
                height: 30px;"""
)
print("[2f] card-icon svg 50→30")

# ============================================================
# 修改3: 去掉所有"详情页"按钮
# ============================================================
detail_btn_pat = re.compile(r'\s*<button class="detail-btn"[^>]*>详情页</button>\s*', re.MULTILINE)
count = len(detail_btn_pat.findall(content))
content = detail_btn_pat.sub('', content)
print(f"[3] 删除 {count} 个详情页按钮，剩余: {'无' if '详情页' not in content else '有'}")

# ============================================================
# 修改4+5: 提取9个业务卡片 + 重新排序 + 全员卡片插入开头
# ============================================================
card_pat = re.compile(
    r'(<!-- 卡片 \d+: [^\n]+ -->\s*<div class="business-card" data-dept="([^"]+)">.*?</div>\s*)',
    re.MULTILINE | re.DOTALL
)
raw_cards = card_pat.findall(content)
print(f"[4] 提取到 {len(raw_cards)} 个原始卡片")

# 只保留9个业务卡片
order = ["czly", "lpsd", "sjld", "felt", "sdmd", "kls", "lhy", "dhx", "bych"]
dept_cards = {}
for html, dept in raw_cards:
    if dept in order:
        dept_cards[dept] = html
print(f"    业务卡片: {list(dept_cards.keys())}")

# 全员晨会卡片
allbu_html = """<!-- 事业部 0: 全员晨会汇报 -->
            <div class="business-card" data-dept="allbu" onclick="openAllBuModal()" style="border-left-color: #6366f1;">
                <div class="card-icon" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 5px;">
                    <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="25" cy="15" r="8" fill="white" opacity="0.9"/>
                        <circle cx="10" cy="30" r="6" fill="white" opacity="0.6"/>
                        <circle cx="40" cy="30" r="6" fill="white" opacity="0.6"/>
                        <circle cx="18" cy="38" r="5" fill="white" opacity="0.5"/>
                        <circle cx="32" cy="38" r="5" fill="white" opacity="0.5"/>
                    </svg>
                </div>
                <div class="card-info">
                    <div class="card-title">全员晨会汇报</div>
                    <div class="card-subtitle">All Employees Morning Briefing · 9 个事业部汇总</div>
                </div>
                <div class="card-actions">
                    <button class="get-report-btn">启动汇报</button>
                </div>
            </div>
"""

# 按新顺序拼接新 grid 内容
dept_cn = {
    "czly": "常州锂源", "lpsd": "龙蟠时代", "sjld": "三金锂电",
    "felt": "法恩莱特", "sdmd": "山东美多", "kls": "可兰素",
    "lhy": "润滑油", "dhx": "迪克化学", "bych": "铂源催化"
}

new_grid_parts = ["<!-- 事业部卡片网格 -->\n"]
new_grid_parts.append(allbu_html)

for i, dept in enumerate(order, 1):
    if dept in dept_cards:
        # 更新注释中的编号和中文名称
        card_html = dept_cards[dept]
        new_comment = f"<!-- 事业部 {i}: {dept_cn[dept]} -->"
        card_html = re.sub(r'<!-- 卡片 \d+: [^→]+ -->', new_comment, card_html)
        new_grid_parts.append(card_html)
        print(f"    第{i}个: {dept} ({dept_cn[dept]})")

new_grid = "\n".join(new_grid_parts)

# 找到新的 grid 内容在 content 中的范围（第一次出现的 事业部卡片网格 注释）
grid_comment_pos = content.find("<!-- 事业部卡片网格 -->")
# 从这里开始找 business-card div
first_card_pos = content.find('<div class="business-card"', grid_comment_pos)
# 找 </div> closing the business-card (first one after business-grid comment)
# 我们要找 business-grid div 的结束位置
# 先找 grid_comment_pos 之后最近的 business-card 开始位置
# 然后从那个位置开始向后找最后一个 business-card 结束

# 找 business-grid container div 的结束
# 实际上我们只需要找到最后一个 business-card div 结束的位置
# 从 grid_comment_pos 开始找所有 business-card 开始
bc_starts = [m.start() for m in re.finditer('<div class="business-card"', content[grid_comment_pos:])]
print(f"\n    找到 {len(bc_starts)} 个 business-card (从 grid_comment_pos={grid_comment_pos} 之后)")
if bc_starts:
    last_bc_start = grid_comment_pos + bc_starts[-1]
    # 从最后一个 business-card 开始，找它的 </div> 结束
    # 实际上每个 business-card 的 HTML 里有嵌套的 div，但我们需要找的是最外层 business-card 的结束
    # business-card div 结构是：<div class="business-card"...>...<div class="card-info">...<div class="card-actions">...<button...>...<\/div>
    # 最简单的方式：从第一个 business-card 开始，数到9个，然后找它们之后的 </div>

    # 找最后一个 business-card 结尾位置
    last_bc_end = last_bc_start
    depth = 0
    in_card = False
    for m in re.finditer(r'<div class="business-card"', content[last_bc_start:]):
        pass  # 已经在 last_bc_start

    # 用更简单的方式：从第一个 business-card 开始向后读30000字符，里面应该包含了所有9个卡片
    after_first_card = content[first_card_pos:]
    # 找到第9个 business-card 结束的地方
    # 通过数 <div class="business-card" 开始找9次
    all_bc_matches = list(re.finditer(r'<div class="business-card"', after_first_card))
    print(f"    在 after_first_card 中找到 {len(all_bc_matches)} 个 business-card")

    if len(all_bc_matches) >= 9:
        # 找到第9个 business-card 开始的绝对位置
        ninth_bc_start_abs = first_card_pos + all_bc_matches[8].start()
        # 从第9个 business-card 开始向后，找到它们全部结束的位置（下一个非card内容）
        # 最简单：找第9个卡片结束后的 </div> 后面跟着的注释
        # 从第9个卡片开始向后5000字符，找 <!-- 进度条 --> 或 <!-- 进度条 -->
        snippet9 = content[ninth_bc_start_abs:ninth_bc_start_abs+10000]
        progress_pos_in_snippet = snippet9.find("<!-- 进度条 -->")
        progress_pos = ninth_bc_start_abs + progress_pos_in_snippet
        print(f"    第9个卡片结束位置: {progress_pos}")

        # 替换
        new_content = content[:grid_comment_pos] + new_grid + content[progress_pos:]
        content = new_content
        print(f"[5] 重新排列 + 插入全员卡片完成，最终大小: {len(content)}")
    else:
        print(f"    WARN: 只找到 {len(all_bc_matches)} 个 business-card，无法确定范围")
        print(f"    尝试直接用 business-grid 范围...")

# ============================================================
# 保存
# ============================================================
with open("D:/trae/AI Daily report/index_v3.html", "w", encoding="utf-8") as f:
    f.write(content)

print(f"\n改造完成！最终大小: {len(content)} bytes")
print("回滚方法: cp _backup_20260505_index_v3_改造前/index_v3.html index_v3.html")
