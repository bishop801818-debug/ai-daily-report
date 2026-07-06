@echo off
REM 锂电池回收数据自动更新任务
REM 每个工作日17:00运行

cd /d D:\trae\AI Daily report

echo [%date% %time%] 开始更新锂电池回收数据... >> recycling_update_log.txt

"C:\Users\1\.workbuddy\binaries\python\versions\3.13.12\python.exe" recycling_smm_auto_update_v2.py >> recycling_update_log.txt 2>&1

echo [%date% %time%] 更新完成，退出码: %errorlevel% >> recycling_update_log.txt
