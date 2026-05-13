@echo off
:: 龙蟠早报服务自启动脚本（后台静默运行，无黑窗口）
:: 同时启动 8888（本地）和 8089（局域网），带 no-cache 头防止浏览器缓存
cd /d "D:\trae\AI Daily report"
start "" /min "C:\Users\1\AppData\Local\Programs\Python\Python312\python.exe" no_cache_server.py 8888
cd /d "D:\trae\AI Daily report"
start "" /min "C:\Users\1\AppData\Local\Programs\Python\Python312\python.exe" no_cache_server.py 8089
exit