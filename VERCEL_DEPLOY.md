# 子页面权限访问控制 — 部署指南

> 本文档说明如何将「飞书组织架构权限闸门」部署上线。
> 组件已完成并经本地验证（前端闸门 6/6 行为测试通过、后端部门树展开 + BU 匹配端到端测试通过）。
> **前端代码已注入全部 49 个子页面（见 `inject_auth_gate.py`），后端 `api/feishu.py` 待你部署到 Vercel。**

---

## 一、架构总览

| 组件 | 文件 | 作用 | 部署位置 |
|------|------|------|----------|
| 权限策略 | `auth_policy.js` | 声明每个页面允许哪些事业部/部门访问 | 随妙搭 HTML 发布 + GitHub Pages |
| 权限闸门 | `inline_auth.js` | 页面加载时按策略鉴权，未命中显示遮罩 | 随妙搭 HTML 发布 + GitHub Pages |
| 飞书 JSAPI | `feishu-jsapi.js` | `tt.getAuthCode` 免登 + 后端地址解析 | 同上 |
| 注入脚本 | `inject_auth_gate.py` | 把上述脚本注入所有子页面 `</head>` 前（幂等） | 本地维护，无需部署 |
| 鉴权后端 | `api/feishu.py` | code→用户部门树→匹配事业部（纯标准库，零依赖） | **Vercel** |
| 路由配置 | `vercel.json` | `/feishu/*` → `api/feishu.py` | Vercel |

**判定逻辑**：用户命中「事业部匹配（`allowed_bus`）」或「部门 ID 交集（`allowed_dept_ids`）」即放行；页面未配置或 `{open:true}` → 全员可见。

**两种妙搭应用均覆盖**：直传版 `app_179kjgvrq6g` 与生产版 `app_4k7069448fj88` 都是飞书 webview 内的 HTML 应用（均有 `window.tt`），鉴权链路可用。

---

## 二、后端部署到 Vercel（你来执行）

### 2.1 前置条件
- 飞书开放平台应用凭证：**App ID** 与 **App Secret**
  （即妙搭所发布飞书应用的凭证；`inline_auth.js` 中的 `APP_ID` 也必须与之匹配，见第五节）。
- Vercel 账号 + Vercel CLI（`npm i -g vercel`）。

### 2.2 步骤
```bash
# 1. 确保 api/feishu.py 与 vercel.json 已在仓库且已提交（本次已纳入版本控制）
git status   # 应看不到 api/feishu.py / inject_auth_gate.py 被忽略

# 2. 登录并关联项目
vercel login
vercel link   # 选择本仓库对应的 Vercel 项目

# 3. 配置环境变量（重要！不要硬编码到代码）
vercel env add FEISHU_APP_ID
vercel env add FEISHU_APP_SECRET
# （可选）FEISHU_REDIRECT_URI —— 静默免登（tt.getAuthCode）通常无需

# 4. 部署（先预览验证，再上生产）
vercel            # 预览，拿到 https://<项目>-<随机>.vercel.app
vercel --prod     # 生产，拿到稳定域名（建议绑定自定义域名）
```

部署成功后记下你的 Vercel 地址，例如 `https://ai-daily-report.vercel.app`。
后端接口地址即 `https://<你的域名>/feishu/callback`。

---

## 三、前端配置（你来执行）

编辑根目录 `auth_policy.js` 第一行：

```javascript
// 修改为你的 Vercel 生产域名（去掉末尾斜杠）
window.AUTH_BACKEND = 'https://ai-daily-report.vercel.app';
```

> 全项目仅此一处配置后端地址。所有页面共用。

若之后修改了任意子页面 HTML，需重新注入闸门（幂等，重复执行无害）：
```bash
python inject_auth_gate.py   # 已注入的跳过，新增的注入
```

---

## 四、发布到妙搭

后端与前端地址就绪后，重新发布两个妙搭应用（发布脚本的 `FILES` 清单已含 `auth_policy.js`/`inline_auth.js`/`feishu-jsapi.js`）：

```bash
# 直传版（工作日 12:30 自动化会自动执行）
python auto_miaoda_daily_test.py

# 生产版
python auto_miaoda_daily.py
```

GitHub Pages（18:00 自动化）会同步最新代码，公开站点的受限页对非飞书访客显示「请在飞书中打开」。

---

## 五、必查配置项

1. **App ID 一致性**：`inline_auth.js` 中
   `APP_ID = (window.FEISHU_JS_CONFIG && window.FEISHU_JS_CONFIG.appId) || 'cli_aab2066784b85bcf'`
   需确保该 ID 与妙搭飞书应用、Vercel 后端的 `FEISHU_APP_ID` 三者一致。
2. **部门名 → 事业部映射**：`api/feishu.py` 的 `DEPT_TO_BU` 用飞书部门**名称**匹配事业部。
   精确到你的真实组织架构部门名（已含模糊兜底）。若某事业部部门名不同，请更新该映射。
3. **策略微调**：`auth_policy.js` 的 `window.AUTH_POLICY` 为默认映射（按页面主题归类到事业部）。
   - 聚合/导航类页面（首页、各 hub、help、政策中心、toolbox 等）默认 `{open:true}`。
   - 若要把某导航页限制到「战略研究」等部门，请补充 `allowed_dept_ids: ['od-xxxx']`。

---

## 六、安全与行为说明（按既定方案）

- **软控制**：本方案为「页面可见性（软控制）」——未授权用户看不到内容，但底层 JSON 仍可被直接 fetch。
  这是你确认的方案；如需「数据也不可见」需后端代理数据接口（不在本次范围）。
- **Fail-open 注意**：若 `auth_policy.js` 未成功加载（如未部署到 GitHub Pages/妙搭），
  `inline_auth.js` 判定 `policy` 为 `undefined` → 视为开放页。因此**必须确保 `auth_policy.js`/`inline_auth.js` 已随站点发布**。
- **调试**：任意页面加 `?bypass=1` 可跳过鉴权（本地/测试用，不影响生产判定）。
- **遮罩文案**：非飞书环境显示「请在飞书中打开」；飞书内部门未授权显示「无权限访问」（可重试）。

---

## 七、验证清单

- [ ] Vercel 部署成功，`https://<域名>/feishu/callback` 在带 `code` 的 POST 下返回 `{"code":0,"data":{...}}`
- [ ] `auth_policy.js` 的 `AUTH_BACKEND` 已改为真实 Vercel 域名
- [ ] 妙搭重新发布后，受限页（如 `lfp_data_v2.html`）在**授权部门**飞书账号下可正常打开
- [ ] 受限页在**非授权部门**飞书账号下显示「无权限访问」
- [ ] 受限页在普通浏览器（非飞书）显示「请在飞书中打开」
- [ ] 开放页（如 `index_v3.html`）在任何环境均正常
