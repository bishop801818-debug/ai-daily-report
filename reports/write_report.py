#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
早报JSON写入脚本
使用方法：将生成的JSON内容保存到 temp_report.json，然后运行此脚本
"""
import json
import os
import shutil
from datetime import datetime

# 配置路径
REPORTS_DIR = r"D:\trae\AI Daily report\reports"
TODAY = datetime.now().strftime("%Y-%m-%d")

def main():
    temp_file = os.path.join(REPORTS_DIR, "temp_report.json")
    target_file = os.path.join(REPORTS_DIR, f"{TODAY}.json")
    
    # 检查临时文件是否存在
    if not os.path.exists(temp_file):
        print(f"[错误] 找不到临时文件: {temp_file}")
        print("请先将生成的JSON内容保存到该文件")
        return False
    
    try:
        # 读取并验证JSON
        with open(temp_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 验证必要字段
        if 'date' not in data or 'departments' not in data:
            print("[错误] JSON格式不正确，缺少必要字段")
            return False
        
        # 写入目标文件
        with open(target_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"[OK] 已写入: {target_file}")
        
        # 更新 index.json
        index_file = os.path.join(REPORTS_DIR, "index.json")
        if os.path.exists(index_file):
            with open(index_file, 'r', encoding='utf-8') as f:
                index_data = json.load(f)
            
            if TODAY not in index_data.get('available_dates', []):
                index_data['available_dates'].insert(0, TODAY)
                index_data['latest_date'] = TODAY
                index_data['generated_at'] = datetime.now().isoformat()
            
            with open(index_file, 'w', encoding='utf-8') as f:
                json.dump(index_data, f, ensure_ascii=False, indent=2)
            
            print(f"[OK] 已更新 index.json")
        
        # 删除临时文件
        os.remove(temp_file)
        print("[OK] 临时文件已清理")
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"[错误] JSON格式错误: {e}")
        return False
    except Exception as e:
        print(f"[错误] 写入失败: {e}")
        return False

if __name__ == "__main__":
    main()
    print("\n请刷新浏览器 http://127.0.0.1:8766/index_v3.html 查看更新")