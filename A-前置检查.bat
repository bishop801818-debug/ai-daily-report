@echo off
chcp 65001 >nul
title 🛡️ 前置备份检查
cd /d "D:\trae\AI Daily report"
echo.
echo ==========================================
echo       🛡️ 修改前安全检查 — 今日是否已备份？
echo ==========================================
echo.
py -3.12 backup_before_edit.py --check
echo.
echo ==========================================
echo 如需新建检查点，运行 [0-快速备份.bat]
echo 回滚检查点，运行 [2-一键回滚.bat]
echo ==========================================
pause
