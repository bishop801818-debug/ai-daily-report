@echo off
rem 回滚脚本 - 将 index_v3.html 和 FP数据 恢复到 2026-05-11 16:37 版本
rem 执行此脚本前请确认需要回滚

echo 正在回滚到 2026-05-11 16:37 版本...
echo.

echo [1/2] 恢复 index_v3.html...
copy /Y "D:\trae\AI Daily report\index_v3_backup_20260511_1637.html" "D:\trae\AI Daily report\index_v3.html"
if errorlevel 1 (
    echo 错误: index_v3.html 恢复失败
    pause
    exit /b 1
)
echo      完成

echo [2/2] 恢复 iron_phosphate_history.json...
copy /Y "D:\trae\AI Daily report\reports\iron_phosphate_history_backup_20260511_1637.json" "D:\trae\AI Daily report\reports\iron_phosphate_history.json"
if errorlevel 1 (
    echo 错误: iron_phosphate_history.json 恢复失败
    pause
    exit /b 1
)
echo      完成

echo.
echo 回滚完成!
echo 请刷新浏览器查看效果
pause