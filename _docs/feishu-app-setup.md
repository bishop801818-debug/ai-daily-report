# 飞书开放平台应用创建指南

## 第一步：登录飞书开放平台

1. 打开浏览器，访问：https://open.feishu.cn
2. 使用你的飞书账号登录
3. 进入**开发者后台**

## 第二步：创建自建应用

1. 点击**创建应用**按钮
2. 选择**自建应用**
3. 填写应用信息：
   - **应用名称**：锂电产业链AI日报
   - **应用描述**：锂电产业链AI日报权限管理系统
   - **应用图标**：上传一个图标（可选）
4. 点击**创建**按钮

## 第三步：配置应用

### 3.1 基本信息

1. 在应用管理页面，找到**基本信息**
2. 记录以下信息（后续需要用到）：
   - **App ID**（应用ID）
   - **App Secret**（应用密钥）—— 点击**查看**按钮获取

### 3.2 配置重定向 URL

1. 在左侧菜单找到**安全设置**
2. 找到**重定向 URL** 配置项
3. 点击**添加**按钮
4. 输入重定向 URL：
   - 开发环境：`http://localhost:8888/feishu-callback.html`
   - 生产环境：`https://bishop801818-debug.github.io/ai-daily-report/feishu-callback.html`
5. 点击**保存**

### 3.3 开启权限

1. 在左侧菜单找到**权限管理**
2. 搜索并开启以下权限：
   - `contact:user.base:readonly`（获取用户基本信息）
   - `contact:department.base:readonly`（获取部门基本信息）
   - `contact:user.employee_id:readonly`（获取用户 employee_id）
3. 点击**申请权限**按钮
4. 如果权限需要管理员审批，请联系管理员审批

### 3.4 配置应用可见范围

1. 在左侧菜单找到**应用发布**
2. 配置**应用可见范围**：
   - 选择**所有人**（或根据实际需求选择）
3. 点击**保存**

### 3.5 发布应用

1. 在**应用发布**页面，点击**创建版本**
2. 填写版本信息：
   - **版本号**：1.0.0
   - **更新说明**：初始版本
3. 点击**保存**按钮
4. 点击**发布**按钮，提交审核
5. 等待飞书审核通过（通常1-2个工作日）

## 第四步：配置后端环境变量

获取到 App ID 和 App Secret 后，需要在后端配置环境变量。

### 方法一：修改 `.env` 文件（推荐）

在 `D:\trae\AI Daily report\.env` 文件中添加：

```
FEISHU_APP_ID=your_app_id_here
FEISHU_APP_SECRET=your_app_secret_here
FEISHU_REDIRECT_URI=http://localhost:8888/feishu-callback.html
```

### 方法二：系统环境变量

在系统中配置环境变量：
- Windows：在"系统属性 → 高级 → 环境变量"中添加
- Linux/Mac：在 `~/.bashrc` 或 `~/.zshrc` 中添加

```bash
export FEISHU_APP_ID="your_app_id_here"
export FEISHU_APP_SECRET="your_app_secret_here"
export FEISHU_REDIRECT_URI="http://localhost:8888/feishu-callback.html"
```

## 第五步：修改部门映射配置

在 `proxy_qwen.py` 文件中，找到 `DEPT_TO_BU` 配置，根据实际飞书通讯录中的部门名称进行修改：

```python
DEPT_TO_BU = {
    '山东美多': 'sdmd',
    '锂源研究院': 'lpsd',
    '常州锂源': 'czly',
    '法恩莱特': 'fnlt',
    '三金锂电': 'sjld',
    '可兰素': 'kls',
    '润滑油事业部': 'lube',
    '迪克化学': 'dkhx',
    '铂源氢能': 'bych'
}
```

**注意**：部门名称必须与飞书通讯录中的部门名称**完全一致**（包括空格、特殊字符等）。

## 第六步：测试

1. 启动后端服务：`python proxy_qwen.py`
2. 启动前端服务：`python -m http.server 8888`
3. 访问 `http://localhost:8888/index_v3.html`
4. 点击**使用飞书账号登录**按钮
5. 完成授权后，检查是否正确获取用户部门和匹配的事业部

## 常见问题

### Q1：权限申请被拒绝怎么办？

A：联系飞书管理员，说明应用需要的权限和用途，请求审批。

### Q2：重定向 URL 配置错误怎么办？

A：在**安全设置**中修改重定向 URL，确保与代码中配置的 `FEISHU_REDIRECT_URI` 完全一致。

### Q3：部门映射不匹配怎么办？

A：在飞书通讯录中查看准确的部门名称，然后修改 `proxy_qwen.py` 中的 `DEPT_TO_BU` 配置。

### Q4：应用审核需要多久？

A：通常1-2个工作日。紧急需求可以联系飞书客服加急处理。

## 下一步

应用创建完成后，将以下信息告诉我：
- **App ID**：`cli_xxxxxxxxxxxxxxxx`
- **重定向 URI**：确认已配置正确

我会继续完成前端页面的修改，然后我们可以进行联调测试。
