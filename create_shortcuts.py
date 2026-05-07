import os
from win32com.client import Dispatch

def get_desktop_path():
    shell = Dispatch('WScript.Shell')
    return shell.SpecialFolders('Desktop')

desktop_path = get_desktop_path()

def create_shortcut(shortcut_name, target_path, description):
    shell = Dispatch('WScript.Shell')
    shortcut_path = os.path.join(desktop_path, shortcut_name)
    shortcut = shell.CreateShortCut(shortcut_path)
    shortcut.TargetPath = target_path
    shortcut.WorkingDirectory = os.path.dirname(target_path)
    shortcut.Description = description
    shortcut.save()

create_shortcut("1-Backup-Before-Edit.lnk", 
                r"D:\trae\AI Daily report\1-先备份再修改.bat",
                "Backup before editing")

create_shortcut("2-Rollback.lnk",
                r"D:\trae\AI Daily report\2-一键回滚.bat",
                "Rollback to previous version")

print("Shortcuts created on desktop!")