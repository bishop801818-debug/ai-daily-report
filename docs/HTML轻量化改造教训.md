# HTML轻量化改造教训

## 问题发生时间
2026-07-03 上午10:10（提交 `1fd1181`）

## 问题表现
几乎所有子页面（dept-archive.html, analysis_hub.html, radar_hub.html 等）打开后显示空白或控制台报错：
```
inline_03.js:5671 Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')
```

## 根本原因
提交 `1fd1181` 做了"HTML轻量化改造 - 提取内联脚本为外部JS"：
- 把所有HTML文件中的JS脚本提取到了共享外部文件：`inline_00.js` ~ `inline_10.js`
- 但 `inline_03.js` 包含了**只适用于主页（index.html）的DOM引用**
- 子页面加载 `inline_03.js` 时，找不到主页才有的DOM元素，于是报错，导致页面空白

### 错误示例
```javascript
// inline_03.js 中的代码（只适用于 index.html）
document.getElementById('some-element-only-in-index').addEventListener(...)
// ↑ 子页面中没有这个DOM元素 → 报错：Cannot read properties of null
```

## 为什么之前没出现过？
因为之前的版本是"完整版"：
- 每个HTML文件都**内联**了自己需要的JS代码
- 子页面（如 `dept-archive.html`）的JS代码只包含它自己需要的逻辑
- 不会加载不适用于它的DOM引用

## 正确的轻量化方案

### ❌ 不要这样做
- 把所有HTML的JS提取到共享外部文件（会破坏子页面隔离）
- 多个HTML共用同一个JS文件（除非这个JS文件是纯工具函数，不操作DOM）

### ✅ 应该这样做

#### 1. 共享库用外部CDN/本地文件（正确）
```html
<!-- 每个页面都可以引用，因为这些库不操作特定DOM -->
<script src="./echarts.min.js"></script>
<script src="./chart.min.js"></script>
<script src="./xlsx.full.min.js"></script>
```

#### 2. 页面特定逻辑保持内联（正确）
```html
<!-- dept-archive.html 的 JS 应该内联在这里 -->
<script>
// 只操作 dept-archive.html 中的DOM
function renderArchive() { ... }
</script>
```

#### 3. 如果一定要提取JS到外部文件
- 每个页面必须有自己的JS文件（不要共用）
- 例如：
  - `dept-archive.js` → 只给 `dept-archive.html` 用
  - `radar_hub.js` → 只给 `radar_hub.html` 用
  - `index.js` → 只给 `index.html` 用

#### 4. 服务端 gzip 压缩（有效且安全）
- 已经在提交 `1fd1181` 中加了服务端 gzip 配置
- 这个不影响前端代码隔离，可以保留

## 修复记录

### 采用的方案
**方案B**：恢复7月2日23:16版本（提交 `3e3297d`），并修复CDN引用

### 修复步骤
1. 从git恢复所有HTML文件到7月2日版本（JS仍为内联）
2. 下载ECharts、Chart.js、xlsx等库到本地（避免CDN被屏蔽）
3. 批量替换所有HTML文件中的CDN引用为本地文件（共183个HTML）
4. 修复 `dept-archive.html` 最新日期显示错误（`dates[0]` 而非 `dates[dates.length-1]`）
5. 恢复 `policy_center_v4.html`（含核心要点+政策定位字段）

### 存档记录
- 本地存档：`archive/backups/20260703_160302/`（214个文件）
- Git提交：`331e56c`（恢复7月版本并修复CDN引用）
- Git推送：`origin/main`

## 防止再犯的检查清单

在做任何HTML/JS改造前，必须检查：

- [ ] 改造后是否在本地服务器测试了所有子页面（至少测试5个不同页面）？
- [ ] 是否有JS文件被多个HTML共用？如果有，这个JS文件是否只包含纯工具函数（不操作DOM）？
- [ ] 是否用浏览器控制台检查了所有子页面（按F12，看是否有红色错误）？
- [ ] 是否在移动设备上也测试了（防止响应式问题）？

## 附录：当前项目结构

```
D:\trae\AI Daily report\
├── index.html              # 主页（有完整的内联JS）
├── index_v3.html          # 主页v3版本
├── dept-archive.html      # 事业部历史数据（有完整的内联JS）
├── analysis_hub.html      # 行业分析hub（有完整的内联JS）
├── radar_hub.html        # 雷达看板hub（有完整的内联JS）
├── database_hub.html      # 数据库hub（有完整的内联JS）
├── policy_center_v4.html # 政策中心（有完整的内联JS）
├── *.js                  # 共享库（echarts, chart, xlsx等）
└── archive/backups/      # 自动备份目录（不要提交到git）
```

---
**创建时间**：2026-07-03 16:45
**创建人**：AI助手
**审核人**：用户
