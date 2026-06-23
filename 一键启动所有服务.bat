@echo off
chcp 65001 > nul
echo ===================================
echo  AI每日报告 - 一键启动所有服务
echo ===================================
echo.

cd /d "%~dp0"

REM 检查是否以管理员身份运行
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [✅] 管理员权限已获取
) else (
    echo [⚠️] 建议以管理员身份运行此脚本
    echo [提示] 右键点击此脚本，选择"以管理员身份运行"
    echo.
    pause
)

REM ====================================
REM 步骤1：检查端口占用
REM ====================================
echo [1/5] 检查端口占用情况...
echo -----------------------------------

REM 检查端口8888
netstat -ano | findstr :8888 | findstr LISTEN > nul 2>&1
if not errorlevel 1 (
    echo [信息] 端口8888已被占用，尝试停止占用进程...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :8888 ^| findstr LISTEN') do (
        echo [操作] 停止进程 PID: %%i
        taskkill /F /PID %%i > nul 2>&1
    )
    timeout /t 2 /nobreak > nul
)

REM 检查端口5000
netstat -ano | findstr :5000 | findstr LISTEN > nul 2>&1
if not errorlevel 1 (
    echo [信息] 端口5000已被占用，尝试停止占用进程...
    for /f "tokens=5" %%i in ('netstat -ano ^| findstr :5000 ^| findstr LISTEN') do (
        echo [操作] 停止进程 PID: %%i
        taskkill /F /PID %%i > nul 2>&1
    )
    timeout /t 2 /nobreak > nul
)

echo [✅] 端口检查完成
echo.

REM ====================================
REM 步骤2：检查Python环境
REM ====================================
echo [2/5] 检查Python环境...
echo -----------------------------------

set PYTHON_EXE=C:/Users/1/.workbuddy/binaries/python/versions/3.13.12/python.exe

if not exist "%PYTHON_EXE%" (
    echo [错误] Python环境未找到：%PYTHON_EXE%
    echo [修复] 请检查WorkBuddy安装
    pause
    exit /b 1
)

"%PYTHON_EXE%" --version > nul 2>&1
if errorlevel 1 (
    echo [错误] Python无法运行
    pause
    exit /b 1
)

echo [✅] Python环境已找到
echo.

REM ====================================
REM 步骤3：检查依赖包
REM ====================================
echo [3/5] 检查依赖包...
echo -----------------------------------

"%PYTHON_EXE%" -c "import flask, flask_cors, requests" > nul 2>&1
if errorlevel 1 (
    echo [警告] 依赖包未安装，正在安装...
    "%PYTHON_EXE%" -m pip install flask flask-cors requests -q
    if errorlevel 1 (
        echo [错误] 依赖包安装失败
        pause
        exit /b 1
    )
)

echo [✅] 依赖包已安装
echo.

REM ====================================
REM 步骤4：检查API密钥配置
REM ====================================
echo [4/5] 检查API密钥配置...
echo -----------------------------------

findstr /C:"DASHSCOPE_API_KEY=sk-" .env > nul 2>&1
if errorlevel 1 (
    echo [⚠️] 未找到有效的API密钥配置
    echo [提示] 请编辑.env文件，设置正确的DASHSCOPE_API_KEY
    echo [提示] 当前配置：
    findstr "DASHSCOPE_API_KEY" .env 2>nul
    echo.
    pause
    exit /b 1
)

echo [✅] API密钥配置已检查
echo.

REM ====================================
REM 步骤5：启动所有服务
REM ====================================
echo [5/5] 启动所有服务...
echo ===================================
echo.

REM 启动Web服务器（端口8888）
echo [服务1/2] 启动Web服务器（端口8888）...
start "Web服务器 - 首页服务" cmd /k ""%PYTHON_EXE%" -m http.server 8888 --bind 0.0.0.0"

REM 等待2秒
timeout /t 2 /nobreak > nul

REM 启动API代理服务器（端口5000）
echo [服务2/2] 启动API代理服务器（端口5000）...
start "API代理服务器 - 千问对话服务" cmd /k ""%PYTHON_EXE%" proxy_qwen.py"

REM 等待3秒
timeout /t 3 /nobreak > nul

REM ====================================
REM 完成提示
REM ====================================
echo.
echo ===================================
echo  ✅ 所有服务已启动完成！
echo ===================================
echo.
echo  服务地址：
echo  - 首页：<ADDRESS_REMOVED>
echo  - API代理：<ADDRESS_REMOVED>
echo  - 健康检查：<ADDRESS_REMOVED>
echo.
echo  正在打开浏览器...
echo.
echo  [提示] 请保持这两个命令行窗口打开
echo  [提示] 可以最小化窗口，但不要关闭
echo  [提示] 关闭窗口会停止所有服务
echo ===================================
echo.

REM 打开浏览器
start http://localhost:8888/index_v3.html

echo.
echo [操作] 按任意键停止所有服务...
pause > nul

REM 停止所有服务
echo.
echo [操作] 正在停止所有服务...
taskkill /F /IM python.exe /T > nul 2>&1
echo [✅] 所有服务已停止
pause
