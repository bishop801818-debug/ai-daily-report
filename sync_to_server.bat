@echo off
chcp 65001 >nul
title 同步到服务器

set SERVER_IP=192.168.1.100
set SERVER_PATH=\\192.168.1.100\D$\lithium-daily-report
set LOCAL_DIR=D:\trae\AI Daily report

echo ============================================
echo        同步到服务器
echo        目标: \\%SERVER_IP%\...
echo ============================================
echo.

echo [1/5] 检查网络连接...
ping -n 1 %SERVER_IP% | find "TTL" >nul
if errorlevel 1 (
    echo [ERROR] 无法连接服务器 %SERVER_IP%，请检查网络
    echo.
    pause
    exit /b 1
)
echo        OK
echo.

echo [2/5] 同步 reports/ ...
xcopy /E /Y /I "%LOCAL_DIR%\reports" "%SERVER_PATH%\reports"
echo.

echo [3/5] 同步每日数据文件 ...
for %%f in (index.json market_lc.json market_lfp.json policies.json lfp_all_data.json carbonate_all_data.json) do (
    if exist "%LOCAL_DIR%\%%f" (
        copy /Y "%LOCAL_DIR%\%%f" "%SERVER_PATH%\%%f" >nul
        echo        %%f
    )
)
echo.

echo [4/5] 同步 core HTML ...
for %%f in (index_v3.html dept-archive.html industry_news.html policy_center_v4.html) do (
    copy /Y "%LOCAL_DIR%\%%f" "%SERVER_PATH%\%%f" >nul
    echo        %%f
)
echo.

echo [5/5] 同步 embedded/ ...
if exist "%LOCAL_DIR%\embedded" (
    xcopy /E /Y /I "%LOCAL_DIR%\embedded" "%SERVER_PATH%\embedded"
)
echo.

echo ============================================
echo        同步完成！
echo ============================================
echo.
pause