@echo off
REM ========================================
REM AI日报系统 - 通义千问代理服务器自启动脚本
REM 创建日期: 2026-06-10
REM 说明: 开机自动启动 proxy_qwen.py，供首页AI按钮使用
REM ========================================

echo [启动] 正在启动通义千问代理服务器...

REM 切换到项目目录
cd /d "D:\trae\AI Daily report"

REM 检查端口5000是否被占用
netstat -ano | findstr :5000 | findstr LISTENING > nul
if %errorlevel% equ 0 (
    echo [警告] 端口5000已被占用，尝试停止旧进程...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
        taskkill /F /PID %%i
    )
    timeout /t 2 /nobreak > nul
)

REM 启动代理服务器（最小化窗口运行）
echo [信息] 启动 proxy_qwen.py...
start /min "通义千问代理" python proxy_qwen.py

REM 等待3秒，检查代理是否启动成功
timeout /t 3 /nobreak > nul
curl -s http://localhost:5000/health > nul 2>&1
if %errorlevel% equ 0 (
    echo [成功] 代理服务器启动成功！访问 http://localhost:5000/health 验证
) else (
    echo [错误] 代理服务器启动失败，请检查日志文件 proxy.log
)

REM 保持窗口打开（方便查看错误信息）
echo.
echo 按任意键关闭此窗口（代理已在后台运行）...
pause > nul
