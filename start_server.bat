@echo off
REM 启动带 Gzip 压缩的早报服务器（替代 python -m http.server）
REM 用法：双击此文件，或命令行执行 start_server.bat

cd /d "%~dp0"
echo [启动] 正在启动 Gzip 压缩服务器...
echo [访问] http://localhost:8888
echo [停止] 按 Ctrl+C 停止服务器
echo.

"C:\Users\1\.workbuddy\binaries\python\versions\3.13.12\python.exe" no_cache_server_gzip.py 8888

pause
