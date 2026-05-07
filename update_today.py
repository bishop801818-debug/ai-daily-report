# -*- coding: utf-8 -*-
"""
每日早报一键更新
自动查找 C:/Users/1/Downloads/{日期}-9bu-reports 文件夹
"""
import sys, os
from datetime import date

sys.stdout.reconfigure(encoding='utf-8')

def get_latest_md_folder():
    """在 Downloads 目录中找最新日期的 9bu-reports 文件夹"""
    downloads = r"C:\Users\1\Downloads"
    today = date.today()
    today_str = today.strftime('%Y-%m-%d')
    today_folder = os.path.join(downloads, f"{today_str}-9bu-reports")
    if os.path.isdir(today_folder):
        # 优先找嵌套的 9bu_report_YYYYMMDD 子目录
        inner = os.path.join(today_folder, f"9bu_report_{today_str.replace('-','')}")
        if os.path.isdir(inner):
            return today_str, inner
        # 回退：直接子目录
        for sub in os.listdir(today_folder):
            sub_path = os.path.join(today_folder, sub)
            if os.path.isdir(sub_path) and sub.endswith('.md') is False:
                return today_str, sub_path
        return today_str, today_folder
    for days_back in range(1, 8):
        d = date.fromordinal(today.toordinal() - days_back)
        folder = os.path.join(downloads, f"{d.strftime('%Y-%m-%d')}-9bu-reports")
        if os.path.isdir(folder):
            inner = os.path.join(folder, f"9bu_report_{d.strftime('%Y%m%d')}")
            if os.path.isdir(inner):
                print(f"[INFO] 今日文件夹未找到，使用 {inner}")
                return d.strftime('%Y-%m-%d'), inner
            for sub in os.listdir(folder):
                sub_path = os.path.join(folder, sub)
                if os.path.isdir(sub_path):
                    print(f"[INFO] 今日文件夹未找到，使用 {sub_path}")
                    return d.strftime('%Y-%m-%d'), sub_path
            print(f"[INFO] 今日文件夹未找到，使用 {folder}")
            return d.strftime('%Y-%m-%d'), folder
    return None, None

def main():
    date_str, md_folder = get_latest_md_folder()
    if not md_folder:
        print("[ERROR] 未找到 9bu-reports 文件夹")
        sys.exit(1)
    print(f"=== 更新日期: {date_str} ===")
    md_files = sorted([f for f in os.listdir(md_folder) if f.endswith('.md')])
    print(f"文件夹: {md_folder}")
    print(f"找到 {len(md_files)} 个MD文件: {md_files}")
    print()
    md_to_json = r"D:\buddy\md_to_json.py"
    print(f">>> python \"{md_to_json}\"")
    import subprocess
    result = subprocess.run(
        ['py', '-3.12', md_to_json, md_folder, date_str],
        capture_output=False
    )
    sys.exit(result.returncode)

if __name__ == "__main__":
    main()
