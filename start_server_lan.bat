@echo off
chcp 65001 >nul 2>&1
cd /d "D:\trae\AI Daily report\embedded"
echo ================================================
echo   龙蟠早报 · 局域网访问服务器（端口8089）
echo   本机访问: http://localhost:8089/
echo   局域网访问: http://172.16.12.100:8089/
echo   主    页: http://172.16.12.100:8089/index_v3.html
echo ================================================
echo.
echo 正在启动服务器...
python -m http.server 8089
pause
