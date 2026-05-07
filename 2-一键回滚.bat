@echo off
chcp 65001 >nul
title 🔄 一键回滚
cd /d "D:\trae\AI Daily report"
echo.
echo ==============================================
echo       龙蟠信息中台 - 一键回滚
echo ==============================================
echo.
py -3.12 rollback_quick.py
echo.
echo ==============================================
echo 操作完成  Ctrl+Shift+R 强制刷新浏览器
echo ==============================================
pause
