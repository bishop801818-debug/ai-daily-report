@echo off
:: 龙蟠早报服务（局域网/嵌入版，端口8089）自启动脚本
cd /d "D:\trae\AI Daily report\embedded"
start "" /min "C:\Users\1\AppData\Local\Programs\Python\Python312\python.exe" -m http.server 8089
exit
