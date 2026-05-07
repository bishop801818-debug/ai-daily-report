# -*- coding: utf-8 -*-
"""
AI Daily Report 一键生成脚本
双击运行即可生成当日日报
"""
import json
import os
from datetime import datetime, timedelta

# 获取今日日期
today = datetime.now()
report_date = today.strftime("%Y-%m-%d")
search_start = (today - timedelta(days=2)).strftime("%Y-%m-%d")
search_end = (today - timedelta(days=1)).strftime("%Y-%m-%d")
print(f"正在生成 {report_date} 的日报...")
print(f"搜索时间范围: {search_start} 至 {search_end}")

# TODO: 在这里添加自动搜索逻辑
# 1. 搜索各事业部新闻
# 2. 生成JSON数据
# 3. 保存文件

print(f"\n✅ 脚本已就绪！")
print(f"请手动编辑以下文件添加内容:")
print(f"  - D:\\trae\\AI Daily report\\reports\\{report_date}.json")
print(f"\n然后访问 http://127.0.0.1:8766/index_logo_v2.html 查看")
input("\n按回车键退出...")
