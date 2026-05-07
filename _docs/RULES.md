# 黄金法则与约束规范

> 适用对象：所有修改本平台的开发者（人类或 AI）
> 重点：这些规则是踩坑踩出来的，违反必出问题

---

## 黄金法则 #1：hy-item-body 禁止 inline display

**规则**：`hy-item-body` 的 DOM 元素永远不能设置 inline `display` 属性。

```javascript
// ❌ 错误：inline display:none 导致点击展开永远失效
el.style.cssText = 'display:none; font-size:14px; ...';

// ✅ 正确：只设置字体/颜色/间距，display 由 CSS class 控制
el.style.cssText = 'font-size:14px; color:#555; ...';
```

**原因**：CSS specificity — inline style 优先级 > 所有外部 CSS class
`display:none` 一旦写在 inline 里，`.expanded` class 的 `display:block` 永远无法覆盖它。

**CSS 正常分工**：

| 属性 | 控制方 |
|------|--------|
| `display` | CSS class `.hy-item-body` / `.expanded` |
| `font-size` / `color` / `background` | inline style（在 openReport() 中按需设置） |

**排查方法**：打开 DevTools → Elements → 找 `.hy-item-body` 元素 → 检查 `style="display: ..."` 有无 inline display

---

## 黄金法则 #2：HTML 注入 Script 块必须用字符串拼接

**规则**：在任何 HTML 中注入 JS script 块，不能直接写 `</script>` 字面量。

```javascript
// ❌ 错误：HTML 解析器在 \ 之前截断 script 块
'<script>var x=1;</script>'

// ✅ 正确
'<script>var x=1;<' + '/script>'
```

**来源**：2026-04-29 整整一天的调试，根因是 `safe_json()` 把 `</script` 转为 `<\\/script` 但 HTML 解析器看到的是字面 `</script`。

---

## 黄金法则 #3：Python 文件读写必须用 newline=''

**规则**：Windows 下对 HTML/JSON 文件读写，必须在 `open()` 中加 `newline=''`。

```python
# ❌ 错误：默认换行模式，\n 被转为 \r\n
with open(path, 'w', encoding='utf-8') as f:
    f.write(html_content)

# ✅ 正确
with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(html_content)

# ✅ 读取也必须一致
with open(path, 'r', encoding='utf-8', newline='') as f:
    content = f.read()
```

**原因**：
- 写入时 Python 把 `\n` 转 `\r\n`
- 再次读取时 Python 把 `\r\n` 转回 `\n`
- 但**替换操作**（Edit 工具）若用 `\n` 作为 old_string，则无法匹配文件中实际的 `\r\n`
- 导致文件被破坏，出现 `\r\r\n` 或内容重复

---

## 黄金法则 #4：HTML 修改后更新版本号

**规则**：每次修改 HTML 后，将 `<meta name="html-version" content="YYYYMMDD">` 改为当天日期。

```html
<meta name="html-version" content="20260506">
```

**原因**：浏览器缓存。强制刷新（Ctrl+Shift+R）清除内存缓存但不一定清除磁盘缓存，版本号变化确保所有缓存层都失效。

---

## 黄金法则 #5：8089 嵌入式 index_v3.html 的日历月份

**规则**：嵌入版 `index_v3_embedded.html` 的 `calendarMonth` 全局变量必须与历史数据月份一致。

```javascript
// 嵌入版默认 April 2026
let calendarYear = 2026, calendarMonth = 3; // 0-indexed
```

**原因**：`renderCalendar()` 默认使用 `new Date()`，若历史数据月份不是当月（当前 May 2026），日历将显示空月份。

**每次运行 gen_embedded_all.py 后检查**：若嵌入的历史数据月份变化，需同步更新该变量。

---

## 黄金法则 #6：政策模块不主动修改

**规则**：不主动修改 `policy_center_v4.html` 及相关政策数据处理逻辑。

**原因**：用户在多个场合明确表达过政策模块的优先级低于其他模块，不应主动改动。

---

## 服务器约束

- 只维护 **8888**（本地）和 **8089**（局域网）两个端口
- 8089 的 `index_v3.html` 是用户的**主入口**，修改前确认影响范围
- `start_server_loop.bat` 合并了两端口启动，修改时注意同步

---

## 文件路径约束

- **主数据目录**：`D:\trae\AI Daily report\reports\`
- **主 HTML 目录**：`D:\trae\AI Daily report\`（动态版）+ `D:\trae\AI Daily report\embedded\`（嵌入版）
- **脚本目录**：`D:\buddy\`（md_to_json.py）和 `D:\trae\AI Daily report\`（update_today.py、gen_embedded_all.py）
- 不要在 `C:\Users\1\.claude\` 目录下存放任何关键配置（曾因 ESET 杀毒软件损坏）