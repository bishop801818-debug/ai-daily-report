# -*- coding: utf-8 -*-
"""
早报 HTTP 服务器 - 带 Cache-Control 头，防止浏览器缓存行情数据
用法: python no_cache_server.py [port] [directory]
默认: port=8888, directory=脚本所在目录
"""
import http.server
import functools
import sys
import os

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8888
DIRECTORY = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(os.path.abspath(__file__))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    """所有响应都加 Cache-Control: no-store，防止浏览器缓存"""

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format, *args):
        # 简化日志：只记录非 favicon 请求
        if "favicon" not in str(args):
            super().log_message(format, *args)


if __name__ == "__main__":
    os.chdir(DIRECTORY)
    handler = functools.partial(NoCacheHandler, directory=DIRECTORY)
    with http.server.HTTPServer(("0.0.0.0", PORT), handler) as httpd:
        print(f"[no_cache_server] 监听 0.0.0.0:{PORT}  根目录: {DIRECTORY}")
        print(f"[no_cache_server] 所有响应附带 Cache-Control: no-store")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[no_cache_server] 已停止")
