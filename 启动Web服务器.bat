@echo off
chcp 65001 > nul
echo ===================================
echo  启动AI每日报告Web服务器
echo ===================================
echo.

cd /d "%~dp0"

echo [1/3] 检查端口占用...
netstat -ano | findstr :8888 | findstr LISTEN > nul 2>&1
if not errorlevel 1 (
    echo [警告] 端口8888已被占用
    echo [提示] 将尝试停止占用端口的进程...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :8888 ^| findstr LISTEN') do (
        taskkill /F /PID %%i > nul 2>&1
    )
    timeout /t 2 /nobreak > nul
)

echo.
echo [2/3] 启动HTTP服务器...
echo -----------------------------------
echo  服务器地址: <ADDRESS_REMOVED>
echo  关闭服务器: 按 Ctrl+C 或关闭此窗口
echo -----------------------------------
echo.

"C:/Users/1/.workbuddy/binaries/python/versions/3.13.12/python.exe" -m http.server 8888 --bind 0.0.0.0

echo.
echo [信息] 服务器已停止
pause
