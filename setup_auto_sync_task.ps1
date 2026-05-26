# setup_auto_sync_task.ps1 - 设置自动同步定时任务
# 需要以管理员权限运行

Write-Host "=== 设置 AI Daily Report 自动同步定时任务 ===" -ForegroundColor Green
Write-Host ""

# 检查是否以管理员权限运行
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ 请以管理员权限运行此脚本！" -ForegroundColor Red
    Write-Host "右键点击此脚本 → 选择'使用 PowerShell 运行'（管理员）" -ForegroundColor Yellow
    pause
    exit 1
}

# 配置
$taskName = "AI Daily Report Auto Sync"
$taskDescription = "每天自动同步 D:\trae\AI Daily report\ 到 GitHub"
$batFile = "D:\trae\AI Daily report\run_auto_sync.bat"
$runTime = "09:00"  # 每天运行时间

# 检查 bat 文件是否存在
if (-not (Test-Path $batFile)) {
    Write-Host "❌ 找不到批处理文件: $batFile" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "任务名称: $taskName" -ForegroundColor Cyan
Write-Host "运行时间: 每天 $runTime" -ForegroundColor Cyan
Write-Host "执行文件: $batFile" -ForegroundColor Cyan
Write-Host ""

# 删除已存在的同名任务
Write-Host "检查并删除已存在的同名任务..." -ForegroundColor Yellow
schtasks /Delete /TN "$taskName" /F 2>$null
Start-Sleep -Seconds 1

# 创建新任务
Write-Host "创建定时任务..." -ForegroundColor Yellow
$result = schtasks /Create /TN "$taskName" /TR "$batFile" /SC DAILY /ST $runTime /F 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 定时任务创建成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "任务详情:" -ForegroundColor Cyan
    schtasks /Query /TN "$taskName" /FO LIST | Select-Object -First 10
} else {
    Write-Host "❌ 创建任务失败: $result" -ForegroundColor Red
    Write-Host ""
    Write-Host "请尝试手动创建任务：" -ForegroundColor Yellow
    Write-Host "1. 按 Win+R，输入 taskschd.msc" -ForegroundColor Yellow
    Write-Host "2. 右侧点击'创建任务'" -ForegroundColor Yellow
    Write-Host "3. 名称: $taskName" -ForegroundColor Yellow
    Write-Host "4. 触发器: 每天 $runTime" -ForegroundColor Yellow
    Write-Host "5. 操作: 启动程序 $batFile" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
