# 首页保护机制

本文档说明如何保护 `index_v3.html` 首页，避免修改后崩溃。

## 核心原则

**修改 index_v3.html 之前的黄金法则：**
> 每次修改前，先创建 Git tag 备份！

## 快速操作

### 1. 修改前备份（必须！）

```bash
cd "D:\trae\AI Daily report"
git tag "backup/$(date +%Y-%m-%d-%H%M)" -m "修改 index_v3.html 前的备份"
git push origin "backup/$(date +%Y-%m-%d-%H%M)"
```

### 2. 验证语法

```bash
# HTML 验证
python -c "
from html.parser import HTMLParser
class Validator(HTMLParser):
    def __init__(self):
        super().__init__()
        self.errors = []
    def error(self, msg):
        self.errors.append(msg)

with open('index_v3.html', 'r', encoding='utf-8') as f:
    content = f.read()
    
v = Validator()
try:
    v.feed(content)
    print('HTML 解析: OK')
except Exception as e:
    print(f'HTML 解析错误: {e}')
"

# JavaScript 语法验证（提取所有 <script> 标签内容）
python _docs/tools/verify_index_js.py
```

### 3. 本地测试（必须！）

```bash
# 启动本地服务器
python -m http.server 8888

# 用浏览器访问 http://localhost:8888/index_v3.html
# 强制刷新 (Ctrl+F5) 检查是否有 JS 错误
```

### 4. 一键备份+修改+推送

```bash
python _docs/tools/safe_index_edit.py "你的修改描述"
```

这个工具会：
1. 自动创建备份 tag
2. 等待你完成修改
3. 验证语法
4. 推送到远程

## 恢复流程

如果首页崩溃了：

```bash
# 方法1: 从 Git 恢复
git checkout -- index_v3.html

# 方法2: 从备份 tag 恢复
git checkout -b temp_branch backup/2026-06-19
git checkout temp_branch:index_v3.html index_v3.html
git branch -D temp_branch

# 方法3: 用恢复脚本
python _docs/tools/restore_index.py restore 2026-06-18
```

## 已知良好版本

| Tag | 日期 | 说明 |
|-----|------|------|
| `daily/2026-06-18` | 2026-06-18 | AI按钮4合1循环GIF（压缩版96MB） |
| `backup/2026-06-19` | 2026-06-19 | 修复崩溃后的备份 |

## 常用 Git 命令

```bash
# 查看所有备份 tag
git tag -l "backup/*" | sort -r

# 查看某个 tag 的内容
git show backup/2026-06-19:index_v3.html | head -20

# 删除本地 tag
git tag -d backup/2026-06-19

# 删除远程 tag
git push origin --delete backup/2026-06-19
```

## 防护工具

| 工具 | 路径 | 用途 |
|------|------|------|
| 首页恢复脚本 | `_docs/tools/restore_index.py` | 从备份恢复首页 |
| AI按钮生成器 | `_docs/tools/generate_ai_fab_safe.py` | 安全生成注入脚本 |
| HTML验证器 | `_docs/tools/verify_index_js.py` | 验证JS语法 |

## 注意事项

⚠️ **不要这样做：**
- 直接用 sed/awk 修改 index_v3.html
- 用正则批量替换 HTML 内容
- 在不备份的情况下修改

✅ **应该这样做：**
- 修改前先创建 Git tag 备份
- 先在本地测试通过再推送
- 保留多个备份版本