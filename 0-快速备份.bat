@echo off
chcp 65001 >nul
title 📦 命名检查点备份
cd /d "D:\trae\AI Daily report"
echo.
echo ==========================================
echo       📦 命名检查点备份
echo ==========================================
echo.
py -3.12 backup_quick.py
echo.
echo ==========================================
echo 备份完成！ 可以安全修改页面了
echo 回滚运行: 2-一键回滚.bat
echo ==========================================
pause
