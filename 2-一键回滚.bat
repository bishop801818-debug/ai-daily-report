@echo off
chcp 65001 >nul
title 🔄 安全回滚（尊重受保护文件）
cd /d "D:\trae\AI Daily report"
echo.
echo ==============================================
echo       🔄 安全回滚 - 受保护文件不会被回滚
echo ==============================================
echo.
echo 受保护文件（不会被回滚）：
echo   - index_v3.html
echo   - reports/market_cumulative.json
echo.
echo 其他文件可以被回滚到之前的检查点。
echo.
py -3.12 safe_rollback.py
echo.
echo ==============================================
echo 回滚完成  Ctrl+Shift+R 强制刷新浏览器
echo ==============================================
pause
