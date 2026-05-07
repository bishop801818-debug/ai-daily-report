@echo off
:: 后台静默抓取市场数据，无黑窗口
start "" /min "C:\Users\1\AppData\Local\Programs\Python\Python312\python.exe" fetch_market_lc.py >> "D:\trae\AI Daily report\reports\market_fetch.log" 2>&1
start "" /min "C:\Users\1\AppData\Local\Programs\Python\Python312\python.exe" fetch_market_lfp.py >> "D:\trae\AI Daily report\reports\market_fetch.log" 2>&1
