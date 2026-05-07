$WshShell = New-Object -ComObject WScript.Shell
$desktopPath = [Environment]::GetFolderPath('Desktop')

$targetPath = "D:\trae\AI Daily report\1-先备份再修改.bat"
$shortcut = $WshShell.CreateShortcut($desktopPath + "\1-Backup-Before-Edit.lnk")
$shortcut.TargetPath = $targetPath
$shortcut.WorkingDirectory = "D:\trae\AI Daily report"
$shortcut.Description = "Backup before editing files"
$shortcut.Save()

Start-Sleep -Milliseconds 300

$WshShell2 = New-Object -ComObject WScript.Shell
$targetPath2 = "D:\trae\AI Daily report\2-一键回滚.bat"
$shortcut2 = $WshShell2.CreateShortcut($desktopPath + "\2-Rollback.lnk")
$shortcut2.TargetPath = $targetPath2
$shortcut2.WorkingDirectory = "D:\trae\AI Daily report"
$shortcut2.Description = "Rollback to previous version"
$shortcut2.Save()

Write-Host "Shortcuts created successfully!"