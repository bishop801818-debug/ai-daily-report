@echo off
chcp 65001 >nul
REM ============================================
REM  月度行业分析报告 — 自动化脚本
REM  每月5日由 Windows 任务计划程序触发
REM  生成上一个月的磷酸铁锂行业分析报告
REM ============================================
echo.
echo ========================================
echo  月度行业分析报告 - 自动化执行
echo  时间: %date% %time%
echo ========================================
echo.

REM Step 1: 数据提取 + 报告骨架
echo [Step 1/2] 运行数据提取和报告骨架生成...
cd /d D:\buddy\skills\lithium-analysis-report
py -3.12 generate_monthly_report.py lfp
if %errorlevel% neq 0 (
    echo [ERROR] generate_monthly_report.py 执行失败！
    pause
    exit /b 1
)

echo.
echo ========================================
echo  报告骨架已生成，AI叙事部分请通过
echo  Claude Code Skill 手动完成：
echo  /lithium-analysis-report
echo ========================================
echo.

REM 保持窗口打开以便查看日志
timeout /t 10 >nul
