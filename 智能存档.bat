@echo off
chcp 65001 >nul
echo ================================
echo  AI Daily Report - 智能存档脚本
echo ================================
echo.

cd /d "D:\trae\AI Daily report"

echo [1/3] 检查Git状态...
git status --short

echo.
echo [2/3] 运行智能存档脚本...
python smart_git_commit.py

echo.
echo [3/3] 验证提交结果...
git log --oneline -3

echo.
echo ================================
echo  存档完成！
echo ================================
pause
