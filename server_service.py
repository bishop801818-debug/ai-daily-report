# -*- coding: utf-8 -*-
"""
龙蟠早报服务器 - Windows 服务版
安装:   py -3.12 D:/trae/AI Daily report/server_service.py install
启动:   py -3.12 D:/trae/AI Daily report/server_service.py start
停止:   py -3.12 D:/trae/AI Daily report/server_service.py stop
卸载:   py -3.12 D:/trae/AI Daily report/server_service.py remove
"""
import win32serviceutil
import win32service
import win32event
import servicemanager
import sys
import os
import threading
import time

# ===================== 配置 =====================
SERVICE_NAME  = "龙蟠早报服务"
SERVICE_DISP  = "龙蟠科技早报内网服务"
WEB_DIR       = r"D:\trae\AI Daily report"
PORT          = 8888
PYTHON_EXE    = sys.executable   # 自动使用当前 Python


# ===================== HTTP 服务器线程 =====================
def run_http_server():
    """在子线程中运行 HTTP 服务器"""
    sys.path.insert(0, WEB_DIR)
    os.chdir(WEB_DIR)
    import http.server, socketserver
    handler = http.server.SimpleHTTPRequestHandler
    # 抑制日志输出
    with open(os.devnull, 'w') as devnull:
        old_stdout = sys.stdout
        old_stderr = sys.stderr
        sys.stdout = devnull
        sys.stderr = devnull
        try:
            with socketserver.TCPServer(("", PORT), handler, bind_and_activate=False) as httpd:
                httpd.allow_reuse_address = True
                httpd.server_bind()
                httpd.server_activate()
                # 只在有停止信号时才退出
                global _stop_event
                while not _stop_event.wait(1):
                    httpd.handle_request()
        finally:
            sys.stdout = old_stdout
            sys.stderr = old_stderr

_stop_event = threading.Event()
_http_thread = None


# ===================== Windows 服务类 =====================
class RPService(win32serviceutil.ServiceFramework):
    _svc_name_       = SERVICE_NAME
    _svc_display_name_ = SERVICE_DISP

    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.stop_event = win32event.CreateEvent(None, 0, 0, None)

    def SvcStop(self):
        global _stop_event
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        _stop_event.set()
        win32event.SetEvent(self.stop_event)

    def SvcDoRun(self):
        global _http_thread, _stop_event
        _stop_event.clear()
        servicemanager.LogMsg(servicemanager.EVENTLOG_INFORMATION_TYPE,
                              servicemanager.PYS_SERVICE_STARTED,
                              (self._svc_name_, ''))

        # 启动 HTTP 服务线程
        _http_thread = threading.Thread(target=run_http_server, daemon=True)
        _http_thread.start()

        # 等待停止信号
        win32event.WaitForSingleObject(self.stop_event, win32event.INFINITE)


# ===================== 入口 =====================
if __name__ == '__main__':
    # 将 WEB_DIR 加入 Python 路径（服务需要）
    if WEB_DIR not in sys.path:
        sys.path.insert(0, WEB_DIR)

    if len(sys.argv) == 1:
        # 无参数时以服务方式运行
        servicemanager.Initialize()
        servicemanager.PrepareToHostSingle(RPService)
        servicemanager.StartServiceCtrlDispatcher()
    else:
        win32serviceutil.HandleCommandLine(RPService)
