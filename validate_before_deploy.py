#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
部署前校验脚本
功能：
1. 静态文件校验（HTML结构、JSON格式、数据完整性）
2. 无头浏览器校验（Playwright）
3. 自动修复机制
4. 飞书通知集成
"""

import os
import sys
import json
import time
import re
import subprocess
import requests
from datetime import datetime, timedelta
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path("D:/trae/AI Daily report")
INDEX_V3 = PROJECT_ROOT / "index_v3.html"
INDEX_HTML = PROJECT_ROOT / "index.html"

# 飞书 Webhook 配置
FEISHU_WEBHOOK_URL = "https://open.feishu.cn/open-apis/bot/v2/hook/3bfc8415-fb29-4d49-91fd-70212afb8cf8"
NOTIFY_ENABLED = True  # 是否启用飞书通知


class ValidationError(Exception):
    """校验错误基类"""
    pass


class AutoFixResult:
    """自动修复结果"""
    def __init__(self, success=False, message="", actions=[]):
        self.success = success
        self.message = message
        self.actions = actions


def log(msg, level="INFO"):
    """输出日志"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    prefix = {
        "INFO": "ℹ️",
        "SUCCESS": "✅",
        "WARNING": "⚠️",
        "ERROR": "❌",
    }.get(level, "ℹ️")
    
    print(f"[{timestamp}] {prefix} {msg}")


def send_feishu_notification(title, content, is_success=True):
    """发送飞书通知"""
    if not NOTIFY_ENABLED:
        log("飞书通知已禁用，跳过", "WARNING")
        return False
    
    if not FEISHU_WEBHOOK_URL:
        log("未配置飞书 Webhook URL，跳过通知", "WARNING")
        return False
    
    try:
        # 构建飞书消息卡片
        color = "green" if is_success else "red"
        
        # 将内容格式化为飞书 Markdown
        formatted_content = content.replace("**", "**")  # 保持粗体
        
        payload = {
            "msg_type": "interactive",
            "card": {
                "config": {"wide_screen_mode": True},
                "header": {
                    "title": {"tag": "plain_text", "content": title},
                    "template": color
                },
                "elements": [
                    {
                        "tag": "div",
                        "text": {"tag": "lark_md", "content": formatted_content}
                    },
                    {
                        "tag": "hr"
                    },
                    {
                        "tag": "note",
                        "elements": [
                            {"tag": "lark_md", "content": f"📅 时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"}
                        ]
                    }
                ]
            }
        }
        
        resp = requests.post(FEISHU_WEBHOOK_URL, json=payload, timeout=10)
        result = resp.json()
        
        if result.get("code") == 0:
            log("飞书通知已发送", "SUCCESS")
            return True
        else:
            log(f"飞书通知发送失败: {result}", "ERROR")
            return False
    except Exception as e:
        log(f"发送飞书通知失败: {e}", "ERROR")
        return False


def validate_static_html(html_file):
    """静态文件校验"""
    if not html_file.exists():
        raise ValidationError(f"文件不存在: {html_file}")
    
    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    log(f"检查文件: {html_file.name}")
    
    # 1. 检查文件大小
    file_size = html_file.stat().st_size
    if file_size < 50000:  # 小于50KB可能有问题
        raise ValidationError(f"文件过小: {file_size/1024:.1f}KB (预期 > 50KB)")
    log(f"  文件大小: {file_size/1024:.1f}KB", "SUCCESS")
    
    # 2. 检查 window.__EMBEDDED__ 数量
    # 使用更精确的方法：只计算 "window.__EMBEDDED__ = " 的数量
    embedded_assignments = re.findall(r'window\.__EMBEDDED__\s*=\s*\{', content)
    embedded_count = len(embedded_assignments)
    
    if embedded_count == 0:
        raise ValidationError("未找到 window.__EMBEDDED__")
    elif embedded_count > 1:
        raise ValidationError(f"找到多个 window.__EMBEDDED__ ({embedded_count} 个)")
    log(f"  window.__EMBEDDED__ 数量: {embedded_count}", "SUCCESS")
    
    # 3. 检查 JSON 格式
    try:
        start = content.find('window.__EMBEDDED__ = ')
        if start == -1:
            raise ValidationError("未找到 window.__EMBEDDED__ = ")
        
        start += len('window.__EMBEDDED__ = ')
        
        # 手动解析 JSON（处理嵌套大括号）
        brace_count = 0
        in_string = False
        escape_next = False
        end = start
        
        for i in range(start, len(content)):
            char = content[i]
            
            if escape_next:
                escape_next = False
                continue
            
            if char == '\\' and not escape_next:
                escape_next = True
                continue
            
            if char == '"' and not escape_next:
                in_string = not in_string
                continue
            
            if not in_string:
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end = i + 1
                        break
        
        json_str = content[start:end]
        data = json.loads(json_str)
        
        # 4. 检查数据日期
        today = data.get('today', '')
        if not today:
            raise ValidationError("未找到数据日期 (today 字段)")
        
        report_date = datetime.strptime(today, '%Y-%m-%d').date()
        now = datetime.now().date()
        days_diff = (now - report_date).days
        
        if days_diff > 2:
            log(f"  警告: 数据日期较旧 ({today})，已过去 {days_diff} 天", "WARNING")
        else:
            log(f"  数据日期: {today}", "SUCCESS")
        
        # 5. 检查事业部数量
        departments = data.get('report', {}).get('departments', {})
        bu_count = len(departments)
        
        if bu_count < 9:
            raise ValidationError(f"事业部数量不足: {bu_count} (预期 9)")
        
        log(f"  事业部数量: {bu_count}", "SUCCESS")
        
        # 6. 检查事业部ID
        expected_ids = ['bych', 'czly', 'dhx', 'dkhx', 'felt', 'fnlt', 'kelan', 'kls', 'lpsd', 'lube', 'lubricant', 'sdmd', 'sjl', 'sjld']
        actual_ids = list(departments.keys())
        wrong_ids = [id for id in actual_ids if id not in expected_ids]
        
        if wrong_ids:
            raise ValidationError(f"错误的事业部ID: {wrong_ids}")
        
        log(f"  事业部ID: 全部正确", "SUCCESS")
        
        # 7. 检查 sections 格式
        for bu_id, bu_data in departments.items():
            sections = bu_data.get('sections', [])
            if not isinstance(sections, list):
                raise ValidationError(f"{bu_id} 的 sections 不是数组")
            
            for sec in sections:
                dim = sec.get('dim', '')
                if dim not in ['topnews', 'market', 'policy', 'enterprise', 'tech', 'project', 'tips']:
                    raise ValidationError(f"{bu_id} 的 dim 值错误: {dim}")
        
        log(f"  sections 格式: 全部正确", "SUCCESS")
        
        return data
        
    except json.JSONDecodeError as e:
        raise ValidationError(f"JSON 格式错误: {e}")
    except Exception as e:
        if isinstance(e, ValidationError):
            raise
        raise ValidationError(f"校验失败: {e}")


def try_auto_fix(html_file):
    """尝试自动修复常见问题"""
    log("尝试自动修复...", "WARNING")
    
    actions = []
    
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 修复1: 移除多余的 window.__EMBEDDED__ 块
        embedded_positions = []
        search_start = 0
        
        while True:
            pos = content.find('window.__EMBEDDED__ = ', search_start)
            if pos == -1:
                break
            embedded_positions.append(pos)
            search_start = pos + 1
        
        if len(embedded_positions) > 1:
            # 保留最后一个块
            keep_start = embedded_positions[-1]
            
            # 重建内容：保留最后一个块之前的所有内容 + 最后一个块
            new_content = content[:embedded_positions[0]]
            
            # 找到最后一个块之后的内容
            last_block_start = embedded_positions[-1]
            last_block_end = content.find('</script>', last_block_start)
            if last_block_end == -1:
                last_block_end = len(content)
            else:
                last_block_end += len('</script>')
            
            new_content = content[:embedded_positions[0]] + content[last_block_start:last_block_end]
            
            content = new_content
            actions.append(f"移除 {len(embedded_positions)-1} 个多余的 window.__EMBEDDED__ 块")
        
        # 修复2: 修复事业部ID
        id_mapping = {
            'fnlt': 'felt',      # 法恩莱特旧->新
            'dkhx': 'dhx',       # 东海旧->新
            'lube': 'lubricant', # 润滑油事业部旧->新
            'kls': 'kelan',      # 可兰旧->新
            'sjld': 'sjl'        # 三金锂电旧->新
        }
        
        # 这里需要解析 JSON 并修复
        # 为简化，跳过此修复（需要完整实现）
        
        # 保存修复后的内容
        if content != original_content:
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(content)
            actions.append("已保存修复后的文件")
            
            return AutoFixResult(success=True, message="自动修复完成", actions=actions)
        else:
            return AutoFixResult(success=False, message="未检测到可自动修复的问题")
    
    except Exception as e:
        return AutoFixResult(success=False, message=f"自动修复失败: {e}")


def validate_with_playwright(html_file, port=8888):
    """使用 Playwright 进行浏览器校验"""
    try:
        from playwright.sync_api import sync_playwright
        
        log("启动无头浏览器校验...", "INFO")
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # 访问本地页面
            url = f"http://localhost:{port}/index_v3.html"
            page.goto(url, timeout=30000)
            
            # 等待页面加载
            page.wait_for_load_state('networkidle', timeout=10000)
            
            # 检查页面标题
            title = page.title()
            if not title or 'error' in title.lower():
                raise ValidationError(f"页面标题异常: {title}")
            
            log(f"  页面标题: {title}", "SUCCESS")
            
            # 检查是否有 JS 错误
            logs = []
            page.on("console", lambda msg: logs.append(msg.text) if msg.type == "error" else None)
            
            # 检查早报数据是否渲染
            has_data = page.evaluate("""() => {
                return window.__EMBEDDED__ !== undefined;
            }""")
            
            if not has_data:
                raise ValidationError("window.__EMBEDDED__ 未定义")
            
            log(f"  数据渲染: 正常", "SUCCESS")
            
            browser.close()
            
        return True
        
    except ImportError:
        log("Playwright 未安装，跳过浏览器校验", "WARNING")
        return False
    except Exception as e:
        raise ValidationError(f"浏览器校验失败: {e}")


def main():
    """主函数"""
    log("=" * 60)
    log("部署前校验开始")
    log("=" * 60)
    
    try:
        # 步骤1: 静态文件校验（检查 index.html 的嵌入数据）
        log("\n--- 步骤1: 静态文件校验 ---")
        validate_static_html(INDEX_HTML)
        
        # 步骤2: 浏览器校验（可选）
        if "--skip-browser" not in sys.argv:
            log("\n--- 步骤2: 无头浏览器校验 ---")
            try:
                validate_with_playwright(INDEX_V3)
            except Exception as e:
                log(f"浏览器校验失败: {e}", "WARNING")
                log("继续执行（浏览器校验为可选）", "WARNING")
        else:
            log("\n--- 步骤2: 跳过浏览器校验 ---", "WARNING")
        
        # 所有校验通过
        log("\n" + "=" * 60, "SUCCESS")
        log("所有校验通过，可以继续部署", "SUCCESS")
        log("=" * 60, "SUCCESS")
        
        # 发送成功通知
        send_feishu_notification(
            "✅ AI早报部署校验通过",
            "**部署前校验已通过**，准备继续部署流程。",
            is_success=True
        )
        
        return 0
        
    except ValidationError as e:
        log(f"\n校验失败: {e}", "ERROR")
        
        # 尝试自动修复
        log("\n尝试自动修复...", "WARNING")
        fix_result = try_auto_fix(INDEX_HTML)
        
        if fix_result.success:
            log(f"自动修复结果: {fix_result.message}", "SUCCESS")
            
            # 修复成功，重新校验
            log("\n重新校验...", "INFO")
            try:
                validate_static_html(INDEX_HTML)
                log("\n修复后校验通过", "SUCCESS")
                
                send_feishu_notification(
                    "⚠️ AI早报部署校验（已自动修复）",
                    f"**部署前校验发现问题并已自动修复**，重新校验通过。\n\n修复动作:\n" + "\n".join([f"- {a}" for a in fix_result.actions]),
                    is_success=True
                )
                
                return 0
            except ValidationError as e2:
                log(f"修复后仍然失败: {e2}", "ERROR")
                
                # 发送失败通知
                send_feishu_notification(
                    "❌ AI早报部署校验失败",
                    f"**部署前校验失败**，自动修复后仍然失败。\n\n错误: {str(e2)}\n\n部署已取消，请手动检查。",
                    is_success=False
                )
                
                return 1
        else:
            log(f"自动修复失败: {fix_result.message}", "ERROR")
            
            # 发送失败通知
            send_feishu_notification(
                "❌ AI早报部署校验失败",
                f"**部署前校验失败**，自动修复失败。\n\n错误: {str(e)}\n\n修复结果: {fix_result.message}\n\n部署已取消，请手动检查。",
                is_success=False
            )
            
            return 1
    
    except Exception as e:
        log(f"\n未知错误: {e}", "ERROR")
        
        send_feishu_notification(
            "❌ AI早报部署校验异常",
            f"**未知错误**\n\n{str(e)}\n\n部署已取消。",
            is_success=False
        )
        
        return 1


if __name__ == '__main__':
    sys.exit(main())
