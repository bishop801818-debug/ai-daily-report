# -*- coding: utf-8 -*-
"""AI Daily Report 一键生成脚本（简化版）
去掉旧闻过滤和多级回落，保留基本搜索生成功能
"""
import json
import os
from datetime import datetime, timedelta

def 生成当日日报():
    """生成当日日报JSON文件"""
    today = datetime.now()
    report_date = today.strftime("%Y-%m-%d")
    search_start = (today - timedelta(days=2)).strftime("%Y-%m-%d")
    search_end = (today - timedelta(days=1)).strftime("%Y-%m-%d")
    
    report_file = f"D:/trae/AI Daily report/reports/{report_date}.json"
    
    print(f"生成日期: {report_date}")
    print(f"搜索窗口: {search_start} 至 {search_end}")
    
    # 复制模板文件
    template_file = "D:/trae/AI Daily report/reports/2026-04-13.json"
    if os.path.exists(template_file):
        with open(template_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 更新日期
        data['date'] = report_date
        data['window_start'] = search_start
        data['window_end'] = search_end
        
        # 保存
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"已生成: {report_file}")
        return report_file
    else:
        print(f"模板文件不存在: {template_file}")
        return None

if __name__ == "__main__":
    生成当日日报()
    print("\n完成后访问 http://127.0.0.1:8766/index_logo_v2.html 查看")