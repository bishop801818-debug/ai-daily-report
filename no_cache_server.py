# -*- coding: utf-8 -*-
"""
早报 HTTP 服务器 - 带 Cache-Control 头，防止浏览器缓存行情数据
支持 gzip 压缩，显著减少 HTML/JS/CSS 传输体积
用法: python no_cache_server.py [port] [directory]
默认: port=8888, directory=脚本所在目录
"""
import http.server
import functools
import sys
import os
import gzip
from socketserver import ThreadingMixIn

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8888
DIRECTORY = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(os.path.abspath(__file__))

# 可压缩的文件扩展名
COMPRESSIBLE_EXTS = {'.html', '.htm', '.css', '.js', '.json', '.xml', '.svg', '.txt', '.md', '.csv'}

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    """所有响应都加 Cache-Control: no-store，防止浏览器缓存；对文本文件启用 gzip 压缩"""

    def end_headers(self):
        # 先写 Cache-Control 等通用头
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        # 覆盖 Content-Type：所有文本文件统一加 charset=utf-8
        if self.path.endswith('.js'):
            self.send_header("Content-Type", "application/javascript; charset=utf-8")
        elif self.path.endswith('.html') or self.path.endswith('.htm'):
            self.send_header("Content-Type", "text/html; charset=utf-8")
        super().end_headers()

    def do_GET(self):
        """覆盖 do_GET，对支持的文本文件启用 gzip 压缩传输"""
        path = self.translate_path(self.path)

        # 非普通文件（目录、404 等）走默认逻辑
        if not os.path.isfile(path):
            super().do_GET()
            return

        # 客户端不支持 gzip → 走默认逻辑
        accept_encoding = self.headers.get('Accept-Encoding', '')
        if 'gzip' not in accept_encoding:
            super().do_GET()
            return

        # 仅压缩特定扩展名
        ext = os.path.splitext(path)[1].lower()
        if ext not in COMPRESSIBLE_EXTS:
            super().do_GET()
            return

        # 读取文件内容
        try:
            with open(path, 'rb') as f:
                content = f.read()
        except IOError:
            super().do_GET()
            return

        # 小于 1KB 的文件不压缩（压缩后可能更大）
        if len(content) < 1024:
            super().do_GET()
            return

        # gzip 压缩（compresslevel=6 是速度与压缩比的good balance）
        compressed = gzip.compress(content, compresslevel=6)

        # 发送响应头
        self.send_response(200)
        # 先让 end_headers 发送 Cache-Control 等通用头
        # 但我们需要先设好自定义头
        self.send_header('Content-Encoding', 'gzip')
        self.send_header('Content-Length', str(len(compressed)))
        self.send_header('Content-Type', self.guess_type(path))
        self.end_headers()

        # 写入压缩后的内容
        self.wfile.write(compressed)

    def log_message(self, format, *args):
        # 简化日志：只记录非 favicon 请求
        if "favicon" not in str(args):
            super().log_message(format, *args)


class ThreadingHTTPServer(ThreadingMixIn, http.server.HTTPServer):
    """支持多线程的 HTTP Server — 解决单请求阻塞问题"""
    daemon_threads = True


if __name__ == "__main__":
    os.chdir(DIRECTORY)
    handler = functools.partial(NoCacheHandler, directory=DIRECTORY)
    with ThreadingHTTPServer(("0.0.0.0", PORT), handler) as httpd:
        print(f"[no_cache_server] 监听 0.0.0.0:{PORT}  根目录: {DIRECTORY}")
        print(f"[no_cache_server] 所有响应附带 Cache-Control: no-store")
        print(f"[no_cache_server] gzip 压缩已启用（.html/.js/.css 等文本文件）")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[no_cache_server] 已停止")
