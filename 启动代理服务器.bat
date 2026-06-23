@echo off
chcp 65001 > nul
echo ===================================
echo  通义千问API代理服务器
echo ===================================
echo.

cd /d "%~dp0"

echo [1/4] 检查Python环境...
"C:/Users/1/.workbuddy/binaries/python/versions/3.13.12/python.exe" --version > nul 2>&1
if errorlevel 1 (
    echo [错误] Python环境未找到
    pause
    exit /b 1
)
echo [成功] Python环境已找到

echo.
echo [2/4] 检查依赖包...
"C:/Users/1/.workbuddy/binaries/python/versions/3.13.12/python.exe" -c "import flask, flask_cors, requests" 2>nul
if errorlevel 1 (
    echo [警告] 正在安装依赖包...
    "C:/Users/1/.workbuddy/binaries/python/versions/3.13.12/python.exe" -m pip install flask flask-cors requests -q
)
echo [成功] 依赖包已安装

echo.
echo [3/4] 检查API密钥配置...
findstr /C:"DASHSCOPE_API_KEY=sk-" .env > nul 2>&1
if errorlevel 1 (
    echo [警告] 未找到有效的API密钥配置
    echo [提示] 请编辑.env文件，设置正确的DASHSCOPE_API_KEY
    echo.
)
echo [成功] .env文件已检查

echo.
echo [4/4] 启动代理服务器...
echo -----------------------------------
echo  服务器地址: <http://localhost:5000>
echo  健康检查: http://localhost:5000/health
echo  关闭服务器: 按 Ctrl+C
echo -----------------------------------
echo.

"C:/Users/1/.workbuddy/binaries/python/versions/3.13.12/python.exe" proxy_qwen.py

echo.
echo [信息] 服务器已停止
pause
