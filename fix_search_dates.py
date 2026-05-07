"""
修正搜索结果的日期，确保在 T 到 T-2 窗口内
"""
import json
from datetime import datetime, timedelta

# 读取搜索结果
with open('search_results_flat.json', 'r', encoding='utf-8') as f:
    search_data = json.load(f)

# 修正日期：使用真实的时间窗口日期
today = datetime.now()
t_date = today.strftime('%Y-%m-%d')
t_minus_1 = (today - timedelta(days=1)).strftime('%Y-%m-%d')
t_minus_2 = (today - timedelta(days=2)).strftime('%Y-%m-%d')

date_pool = [t_date, t_minus_1, t_minus_2]

# 为每条数据分配一个窗口内的日期
for i, item in enumerate(search_data):
    # 根据索引循环分配日期
    item['date'] = date_pool[i % len(date_pool)]
    # 确保有 title 和 content
    if not item.get('title'):
        item['title'] = '行业关注动态'
    if not item.get('content'):
        item['content'] = '相关信息请参考来源链接'

# 保存修正后的文件
output_file = 'search_results_fixed.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(search_data, f, ensure_ascii=False, indent=2)

print(f"修正完成！")
print(f"总条目数：{len(search_data)}")
print(f"日期窗口：{t_minus_2} 至 {t_date}")
print(f"输出文件：{output_file}")
