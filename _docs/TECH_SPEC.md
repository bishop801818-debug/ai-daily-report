# 关键技术方案

> 适用对象：接管/调整本平台的前端开发者和 AI 模型
> 重点：理解嵌入版数据方案、fetch override、已知坑点

---

## 一、嵌入版原理（fetch override）

### 背景

8089 端口有两种模式：

1. **动态版**（`index_v3.html`，主要）：直接 fetch JSON 文件，依赖 `reports/` 目录
2. **嵌入版**（`_embedded.html`，备用）：所有数据内嵌，单文件离线运行

### 核心方案：统一 fetch override

在 HTML `<style>` 标签后注入两段 script：

**第一段：内嵌全局数据**
```javascript
window.__EMBEDDED__ = {
  mode: 'standalone',
  today: '2026-04-28',
  report: { /* 完整今日 JSON */ },
  allReports: { /* 所有历史日期 JSON */ },
  marketLc: { /* market_lc.json */ },
  marketLfp: { /* market_lfp.json */ },
  index: { /* index.json，available_dates 只含今日 */ },
  policies: { /* policies.json */ }
};
```

**第二段：fetch 拦截器**
```javascript
(function(){
  var _orig = window.fetch;
  window.fetch = function(url) {
    var s = String(url);
    if (s.includes('market_lc.json'))
      return Promise.resolve({ok:true,json:function(){return Promise.resolve(window.__EMBEDDED__.marketLc)}});
    if (s.includes('market_lfp.json'))
      return Promise.resolve({ok:true,json:function(){return Promise.resolve(window.__EMBEDDED__.marketLfp)}});
    if (s.includes('index.json'))
      return Promise.resolve({ok:true,json:function(){return Promise.resolve(window.__EMBEDDED__.index)}});
    if (s.includes('policies.json'))
      return Promise.resolve({ok:true,json:function(){return Promise.resolve(window.__EMBEDDED__.policies)}});
    var m = s.match(/reports\/(\d{4}-\d{2}-\d{2})\.json/);
    if (m) {
      var r = window.__EMBEDDED__.allReports[m[1]];
      return Promise.resolve({ok:true,json:function(){return Promise.resolve(r||{departments:{}})}});
    }
    return _orig.apply(window, arguments);
  };
})();
```

**优势**：页面原有 JS 逻辑（initDynamicData、openReport、renderCategoryView 等）完全不动，只需在 fetch 层面拦截即可。

---

## 二、Script 标签注入（已踩坑）

### 问题

HTML 解析器以**字面量** `</script>` 字符串作为 script 块关闭标记，与 JavaScript 字符串转义无关。

```javascript
// ❌ 错误写法：safe_json() 把 </script 转义为 <\/script
// 但 HTML 解析器看到的是字面文本 </script，仍然截断 script 块
'<script>window.__EMBEDDED__=' + safe_json(obj) + ';</script>'
// HTML源码：<script>window.__EMBEDDED__={...}<\/script>...</script>
// 浏览器解析：<script>块在 \ 之前关闭，剩余内容被当作裸HTML
```

### 正确写法：字符串拼接

```javascript
// ✅ 正确：用 ;< + /script> 字符串拼接
'<script>window.__EMBEDDED__=' + JSON.stringify(obj) +
  ';<' + '/script><script>' + fetchScript + ';' + '<' + '/script>'
// HTML源码：<script>...</script><script>...</script>
// 浏览器正确解析为两个独立 script 块
```

### Windows Python 文件写入（已踩坑）

```python
# ❌ 错误：默认 newline=''，写入时 \n 被 Windows 转换为 \r\n
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
# 再次读取时 \r\n 被 Python 读成 \n，但文件里实际是 \r\n
# 替换操作若用 \n 作为 old_string 则无法匹配

# ✅ 正确：必须用 newline=''
with open(path, 'w', encoding='utf-8', newline='') as f:
    f.write(content)
```

生成脚本已统一使用 `newline=''`。

---

## 三、历史记录弹窗日历修复

### 问题

`renderCalendar()` 使用 `new Date()` 获取当前月份，默认渲染当月（May 2026）。
历史数据在 April 2026，导致日历看起来是空的（没有高亮日期）。

### 修复方案

在 `index_v3_embedded.html` 中添加全局状态：

```javascript
// 全局日历月份状态（默认历史数据月份）
let calendarYear = 2026, calendarMonth = 3; // April 2026（0-indexed）

function renderCalendar(cy, cm) {
    const year = cy;
    const month = cm;
    // ...渲染当月日历...
}

function previousMonth() {
    calendarMonth--;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderCalendar(calendarYear, calendarMonth);
}

function nextMonth() {
    if (calendarYear === new Date().getFullYear() &&
        calendarMonth === new Date().getMonth()) return; // 不能超过当月
    calendarMonth++;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderCalendar(calendarYear, calendarMonth);
}
```

**重要**：每次重新生成嵌入版时，需确认 `gen_embedded_all.py` 中 `calendarMonth` 的默认值是否与最新历史数据月份匹配。

---

## 四、EMBEDDED_DATA 模式（lfp_data / carbonate_data）

部分页面使用另一种嵌入模式（早于 `__EMBEDDED__` 方案）：

```javascript
// 页面内联数据优先于 fetch
if (typeof EMBEDDED_DATA !== 'undefined') {
    // 使用内联数据
} else {
    // fetch('embedded_data.js') 动态加载
}
```

`gen_embedded_all.py` 将 `embedded_data.js` 内容直接内联为 `<script>window.EMBEDDED_DATA = {...}</script>`。

---

## 五、Python HTTP 服务器工作目录

Python `http.server` 从**进程当前工作目录**（cwd）而非文件所在目录提供文件。

```cmd
:: 错误：从 A 目录启动，访问 B 目录的文件
cd /d "C:\project" && python -m http.server 8089
:: 访问 http://x:8089/index.html 实际找的是 C:\project\index.html

:: 正确：必须切换到文件所在目录
cd /d "D:\trae\AI Daily report" && python -m http.server 8888
cd /d "D:\trae\AI Daily report\embedded" && python -m http.server 8089
```

`start_server_loop.bat` 正确处理了这一点。

---

## 六、gen_embedded_all.py 架构

```
输入：reports/*.json + 各源 HTML 文件
↓
分类处理：
  A类（index_v3 / dept-archive / industry_news）
    → 注入 window.__EMBEDDED__ + fetch override
  B类（lfp_data_v2 / carbonate_data_v2）
    → 注入 window.EMBEDDED_DATA（内联 JS）
  C类（policy_center_v4）
    → 替换 fetch 调用
  D类（database_hub / analysis_hub 等8个）
    → shutil.copy2 静态复制
↓
输出：embedded/*.html
```

**关键函数**：
- `embed_fetch_override(html, today_report, ...)` → 注入数据 + 拦截器
- `safe_json(obj)` → JSON 序列化 + `</script` 转义
- `update_version(html)` → 更新 meta html-version
- `inject_script_block(html, script_type)` → 统一脚本注入