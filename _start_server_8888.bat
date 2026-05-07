@echo off
chcp 65001 >nul 2>&1
cd /d "D:\trae\AI Daily report"
python -m http.server 8888
