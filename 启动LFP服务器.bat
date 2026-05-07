@echo off
echo 启动 LFP 数据服务器...
echo 请在浏览器访问: http://localhost:8080/lfp_data_v2.html
echo 按 Ctrl+C 停止服务器
python -m http.server 8080 -d "D:\trae\AI Daily report"
pause