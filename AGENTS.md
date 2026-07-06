# AGENTS.md - AI 协作规范

> 本文件是 AI 编码助手的标准入口文件。
> 其他 AI（如 Cursor、Cline、Copilot 等）在修改本项目代码前，应首先阅读此文件。
> 人类开发者维护此文档，AI 遵循此规范。

---

## 1. 项目概述

**项目名称：** AI Daily Report
**项目路径：** `D:\trae\AI Daily report\`
**用途：** 锂电产业链多事业部每日早报系统，面向妙搭平台展示
**技术栈：** 纯 HTML + CSS + JavaScript（无框架），Python 自动化脚本

---

## 2. 目录结构

```
AI Daily report/
├── index.html              # 主页（index_v3.html 的别名版本）
├── index_v3.html          # 当前主版本首页
├── embedded/               # 嵌入式版本（用于妙搭 iframe）
│   ├── index.html
│   ├── index_v3.html
│   └── inline_*.js         # 嵌入式版本专用 JS
├── inline_*.js            # 从 HTML 提取的内联脚本（序号 00~10）
├── data/                   # 市场行情 JSON 数据（fetch 加载）
│   ├── carbonate_spot_price_merged.json   # 碳酸锂现货价格
│   ├── lithium_ore_price_history.json     # 锂矿石历史价格
│   ├── lepidolite_price_history.json     # 锂云母历史价格
│   └── phosphate_rock_price.json          # 磷矿石价格
├── reports/                # 早报 JSON 数据（fetch 加载）
│   ├── YYYY-MM-DD.json    # 每日早报数据
│   ├── index.json         # 早报索引
│   └── *_all_data.json   # 各品种全部历史数据
├── assets/                 # 静态资源
│   ├── *.webp             # WebP 格式图片（优先使用）
│   └── *.png              # PNG 格式图片（备用）
├── sw.js                  # Service Worker（离线缓存）
└── *.html                 # 各子页面（数据库、行业分析、历史数据等）
```

---

## 3. 数据加载规范

### 3.1 核心原则

> **禁止将 JSON 数据内嵌到 HTML 文件中。**
> 所有数据必须通过 `fetch()` 从独立 `.json` 文件动态加载。

### 3.2 正确的数据加载方式

```javascript
// ✅ 正确：通过 fetch() 加载独立 JSON 文件
async function loadReportData() {
    try {
        const resp = await fetch('reports/2026-07-04.json?t=' + Date.now());
        const data = await resp.json();
        // 处理数据...
    } catch (err) {
        console.error('数据加载失败:', err);
    }
}

// ✅ 正确：带超时的 fetch
async function fetchWithTimeout(url, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return resp;
}
```

### 3.3 错误的数据加载方式

```javascript
// ❌ 错误：将 JSON 直接内嵌到 HTML 中
window.__EMBEDDED__ = {
    "date": "2026-07-04",
    "departments": { ... }  // 可能 500KB ~ 1MB
};
```

### 3.4 为什么禁止内嵌数据？

| 内嵌方式 | 问题 | fetch 方式 | 优势 |
|---------|------|-----------|------|
| 数据在 HTML 里 | HTML 变大（+500KB~1MB） | 数据在独立 .json | HTML 轻量化（<150KB）|
| 上传到妙搭 | 可能因文件过大失败 | 通过 fetch() 加载 | 妙搭上传稳定 |
| 缓存 | 改数据需改 HTML | 改 .json 即可 | 维护简单 |
| 多个页面共享 | 数据重复内嵌 | 同一 .json 文件 | 节省带宽 |

---

## 4. 文件大小红线

> **仅发出警告，不阻断操作。**
> 脚本会在控制台输出警告，但仍会继续执行。

| 文件类型 | 大小上限 | 警告触发值 |
|---------|---------|-----------|
| `index.html` / `index_v3.html` | **300 KB** | 超过 300KB 时警告 |
| 单个 `inline_*.js` | **500 KB** | 超过 500KB 时警告 |
| 总资源（未压缩） | 无硬性限制 | 建议 < 10MB |

**超过红线的处理：**
1. 脚本输出警告信息，标明超出量
2. 不阻断后续操作（防止误报阻断正常流程）
3. 建议人工审查是否需要优化

---

## 5. HTML 轻量化规范

### 5.1 何时需要轻量化

当修改 HTML 后出现以下情况时，需要运行轻量化脚本：
- HTML 文件大小接近或超过 300KB
- 添加了大量内联 `<script>` 代码块
- 添加了大量 base64 图片

### 5.2 轻量化脚本使用方式

```bash
cd "D:/trae/AI Daily report"

# 轻量化主版本
python optimize_html.py index_v3.html

# 轻量化嵌入式版本
python optimize_html.py embedded/index_v3.html
```

### 5.3 轻量化后必须验证

1. 启动本地服务器：`python no_cache_server_gzip.py 8888`
2. 浏览器访问：`http://localhost:8888/index_v3.html`
3. 打开 Console（F12），确认无 JavaScript 错误
4. 确认所有图表、数据正常加载

---

## 6. 禁止操作清单

以下操作被明确禁止，除非经过充分测试：

| 禁止操作 | 原因 | 正确做法 |
|---------|------|---------|
| ❌ 把 JSON 数据内嵌到 HTML | 增大 HTML 体积，上传妙搭可能失败 | 使用 `fetch()` 加载独立 .json 文件 |
| ❌ 修改 `inline_00.js` | 包含 HTML_VERSION、fetch 去重、Service Worker 注册等核心运行时代码 | ❌ **绝对禁止修改** |
| ❌ 修改 `inline_01.js` | 包含数据加载逻辑、DATA_BASE 配置等运行时代码 | ❌ **绝对禁止修改** |
| ❌ 覆盖 `inline_00.js` / `inline_01.js` | `optimize_html.py` 提取脚本块时会覆盖这两个文件 | 脚本已内置保护，跳过这两个文件 |
| ❌ 修改 `sw.js` 中的预缓存列表 | 可能导致旧资源缓存不更新 | 如需修改，同时更新 `HTML_VERSION` |
| ❌ 直接修改 `index.html` | 会被 `index_v3.html` 覆盖 | 修改 `index_v3.html`，然后复制 |
| ❌ 删除 `data/` 或 `reports/` 目录 | 这些是数据来源 | 如需清理，运行 `clean_embedded_data.py` |
| ❌ 修改妙搭上传限制 | 平台限制无法突破 | 优化 HTML 体积或分割文件 |

### 6.1 受保护的核心文件说明

| 文件 | 内容 | 重要性 | 如果被覆盖会怎样 |
|------|------|--------|----------------|
| `inline_00.js` | `HTML_VERSION`、`全局 fetch 去重`、`Service Worker 注册`、`图表闪屏防护` | ⭐⭐⭐⭐⭐ 极高 | 首页无法工作、fetch 去重失效、Service Worker 无法注册 |
| `inline_01.js` | `数据加载逻辑`、`DATA_BASE` 配置、`报告路径` 逻辑 | ⭐⭐⭐⭐ 高 | 首页数据加载失败、报告无法获取 |
| `embedded/inline_00.js` | 同上（嵌入式版本） | ⭐⭐⭐⭐⭐ 极高 | 嵌入式首页无法工作 |

---

## 7. 自动化任务

### 7.1 自动化任务 ID

- **任务名称：** AI早报自动同步与发布（GitHub + 妙搭）
- **任务 ID：** `automation-1782312453264`
- **执行时间：** 每个工作日 10:05

### 7.2 自动化任务步骤（参考）

```
步骤 -1：WebP 图片转换        → convert_to_webp.py
步骤 0：更新市场行情数据       → 运行数据更新脚本
步骤 0.5：修复 JSON dim 值     → Python 内联脚本
步骤 0.75：清理嵌入式数据       → clean_embedded_data.py   【新增】
步骤 0.8：HTML 轻量化+大小校验  → optimize_html.py（含警告）
步骤 1：部署前校验             → validate_before_deploy.py
步骤 2：推送到 GitHub
步骤 3：发布到妙搭
```

### 7.3 手动部署命令

```bash
# 本地测试
cd "D:/trae/AI Daily report"
python no_cache_server_gzip.py 8888

# 发布到妙搭
python auto_miaoda_daily.py
```

---

## 8. Git 分支管理规范

| 分支 | 用途 | 稳定性 |
|------|------|--------|
| `main` | 生产版本，稳定性最高 | ✅ 稳定 |
| `optimize-*` | 功能优化开发分支 | ⚠️ 测试中 |
| `hotfix-*` | 紧急修复分支 | ⚠️ 测试中 |

**开发流程：**
1. 从 `main` 创建功能分支（如 `optimize-v3`）
2. 在功能分支开发和测试
3. 测试通过后合并回 `main`
4. 自动化任务自动推送 `main` 到 GitHub 和妙搭

---

## 9. 常见问题

### Q1：为什么 index.html 和 index_v3.html 内容相同？
A：`index.html` 是 `index_v3.html` 的副本，用于 GitHub Pages 默认入口。
修改时请修改 `index_v3.html`，然后手动同步到 `index.html`。

### Q2：为什么有些数据在 `reports/` 而不是在 `data/`？
A：`data/` 存放市场行情数据（价格、指数等），`reports/` 存放早报内容（各事业部动态）。
前者由数据采集脚本定时更新，后者由早报生成脚本生成。

### Q3：如何确认 fetch() 数据加载正常？
A：打开浏览器 Console，搜索以下关键词：
- `[fetch去重]` → 全局 fetch 去重已启用
- `数据加载失败` → 检查网络请求和 JSON 格式
- 无报错 → 数据加载正常

### Q4：上传妙搭失败怎么办？
A：检查 `auto_miaoda_daily.py` 输出，常见原因：
- 单个文件超过 2MB → 运行 `optimize_html.py` 轻量化
- HTML 包含大量内联数据 → 运行 `clean_embedded_data.py` 清理

---

## 10. 更新日志

| 日期 | 更新内容 | 更新人 |
|------|---------|--------|
| 2026-07-04 | 初版创建，定义数据加载规范和文件大小红线 | WorkBuddy |

---

*本文件由人类开发者维护，如有疑问请联系项目负责人。*
