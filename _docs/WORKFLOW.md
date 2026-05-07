# 日常更新工作流

> 适用对象：接管/调整本平台的开发者
> 重点：让新模型能够独立完成数据更新，不依赖历史会话记忆

---

## 一、每日更新（核心操作）

### 标准流程：使用 update_today.py（推荐）

```bash
cd D:\trae\AI Daily report
py -3.12 update_today.py
```

脚本自动完成：
1. 在 `C:\Users\1\Downloads` 查找 `{今天日期}-9bu-reports` 文件夹
2. 若今天不存在，向前搜索最近7天内最新的文件夹
3. 调用 `md_to_json.py` 生成 JSON
4. 更新 `reports/YYYY-MM-DD.json` 和 `reports/index.json`
5. 8888 + 8089 同时生效（共用同一目录）

**输出**：新增 `D:\trae\AI Daily report\reports\YYYY-MM-DD.json`

### 备用流程：手动修改 md_to_json.py

```bash
# 1. 修改配置
notepad D:\buddy\md_to_json.py

# 顶部配置段：
SRC_DIR  = Path(r"C:\Users\1\Downloads\{YYYY-MM-DD}-9bu-reports\{YYYY-MM-DD}")
OUT_DIR  = Path(r"D:\trae\AI Daily report\reports")
DATE_STR = "{YYYY-MM-DD}"
WINDOW_START = "{前两天}"
WINDOW_END   = "{前一天或当天}"
```

```bash
# 2. 运行
cd D:\buddy && py -3.12 md_to_json.py
```

---

## 二、MD 文件夹格式规范

```
C:\Users\1\Downloads\{YYYY-MM-DD}-9bu-reports\{YYYY-MM-DD}\
├── 01-润滑油事业部.md
├── 02-可兰素事业部.md
├── 03-常州锂源事业部.md
├── 04-龙蟠时代事业部.md
├── 05-山东美多事业部.md
├── 06-三金锂电事业部.md
├── 07-铂源催化事业部.md
├── 08-法恩莱特事业部.md
└── 09-迪克化学事业部.md
```

文件名**必须包含**中文事业部名（脚本按关键字匹配 BU_MAP）。

---

## 三、生成8089嵌入版

```bash
cd D:\trae\AI Daily report
py -3.12 embedded\gen_embedded_all.py
```

- 读取 `reports/` 下所有 JSON
- 生成 `embedded/` 下所有 `_embedded.html` 文件
- 覆盖同名文件（不删除）
- 运行后需重启 8089 服务器

---

## 四、服务器操作

### 启动（开机自启）

```cmd
D:\trae\AI Daily report\start_server_loop.bat
```
→ 同时启动 8888 + 8089

### 手动启动单端口

```cmd
:: 8888 本地
cd /d "D:\trae\AI Daily report"
python -m http.server 8888

:: 8089 局域网
cd /d "D:\trae\AI Daily report\embedded"
python -m http.server 8089
```

### 检查端口占用

```cmd
netstat -ano | findstr 8089
netstat -ano | findstr 8888
```

### 终止进程

```cmd
taskkill /F /PID <进程ID>
```

---

## 五、浏览器验证

更新后用 **Ctrl+Shift+R**（强制刷新）清除缓存：

- `http://localhost:8888/index_v3.html` — 验证9个BU卡片显示正常
- `http://172.16.12.100:8089/index_v3.html` — 验证8089版本正常
- 点击各BU卡片，验证弹窗内容为最新日期

---

## 六、回滚操作

```bash
# 回滚到前一天JSON
copy D:\trae\AI Daily report\reports\YYYY-MM-DD.json D:\trae\AI Daily report\reports\YYYY-MM-DD_bad.json
# 编辑 md_to_json.py，改回旧日期，重新运行
```

---

## 七、常见错误处理

| 错误 | 原因 | 解决 |
|------|------|------|
| "未找到 9bu-reports 文件夹" | MD文件放错位置 | 确认在 `C:\Users\1\Downloads\{日期}-9bu-reports\{日期}\` |
| 某BU数据为空 | MD文件名不匹配 | 确认文件名包含 BU_MAP 中的中文名 |
| 页面仍显示旧数据 | 浏览器缓存 | Ctrl+Shift+R |
| 8089无法访问 | 8089服务未启动 | 运行 `start_server_8089.bat` |
| `index_v3.html` 空白 | 服务器目录错误 | 确认从 `D:\trae\AI Daily report` 启动 |