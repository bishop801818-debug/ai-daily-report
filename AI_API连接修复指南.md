# AI悬停按钮API连接修复指南

## 问题描述
首页AI悬停按钮显示 `[网络错误] 请检查代理服务器是否启动：Failed to fetch`，原因是API代理服务器未运行。

## 解决方案

### 方案1：启动代理服务器（推荐）

#### 步骤1：获取千问API密钥（可选，用于生产模式）
1. 访问阿里云模型服务灵积控制台：https://dashscope.aliyun.com/
2. 开通通义千问API服务
3. 获取API密钥（格式类似：`sk-xxxxxxxxxxxxxxxxxxxxxxxx`）

#### 步骤2：配置API密钥（可选）
编辑 `.env` 文件，将 `YOUR_DASHSCOPE_API_KEY_HERE` 替换为真实的API密钥：
```env
DASHSCOPE_API_KEY=sk-你的真实API密钥
```

**注意**：如果不配置API密钥，代理服务器会以**测试模式**运行（返回模拟回答）。

#### 步骤3：启动代理服务器
**方法A - 双击运行（推荐）**：
1. 双击运行 `启动代理服务器.bat`
2. 等待服务器启动（看到 `* Running on http://0.0.0.0:5000` 表示成功）
3. 保持此窗口打开（关闭窗口会停止服务器）

**方法B - 命令行运行**：
```bash
cd "D:\trae\AI Daily report"
python proxy_qwen.py
```

#### 步骤4：验证服务器状态
打开浏览器，访问：http://localhost:5000/health

**预期响应**（测试模式）：
```json
{
  "api_key_configured": false,
  "service": "qwen-proxy",
  "status": "ok"
}
```

**预期响应**（生产模式）：
```json
{
  "api_key_configured": true,
  "service": "qwen-proxy",
  "status": "ok"
}
```

#### 步骤5：测试API连接
1. 刷新首页：http://localhost:8888/index_v3.html
2. 点击AI悬停按钮
3. 输入测试问题（如："你好"）
4. 检查是否收到回答

**测试模式下的回答格式**：
```
[测试模式] 我已收到你的问题：「你好」。这是模拟回答，请配置DASHSCOPE_API_KEY以使用真实AI功能。
```

---

### 方案2：集成代理功能到现有服务器

如果不希望运行两个服务器（端口8888和5000），可以将代理功能集成到 `no_cache_server.py` 中。

**优点**：只需要启动一个服务器
**缺点**：需要修改现有代码，可能影响静态文件服务

如需此方案，请告知。

---

## 常见问题

### Q1：代理服务器启动后，关闭命令行窗口就停止了？
**A**：这是正常行为。要让代理服务器在后台持续运行，可以：
1. 使用 `nohup` 命令（Linux/Mac）
2. 或使用Windows任务计划程序
3. 或安装为系统服务

### Q2：如何查看代理服务器的日志？
**A**：服务器日志会显示在命令行窗口中。也可以重定向到文件：
```bash
python proxy_qwen.py > proxy_server.log 2>&1
```

### Q3：端口5000已被占用怎么办？
**A**：修改 `proxy_qwen.py` 最后一行，添加端口参数：
```python
app.run(host='0.0.0.0', port=5001, debug=True)  # 改为5001端口
```
同时修改 `index_v3.html` 第8851行：
```javascript
var __ai_api_base__ = 'http://localhost:5001/api';  // 改为5001
```

---

## 文件清单
- `proxy_qwen.py` - 代理服务器脚本
- `启动代理服务器.bat` - Windows一键启动脚本
- `.env` - API密钥配置文件
- `proxy_server.log` - 服务器日志文件（运行后自动生成）

---

## 技术细节

### API调用流程
1. 前端 `index_v3.html` 发送POST请求到 `http://localhost:5000/api/chat`
2. 代理服务器接收请求，提取用户问题
3. 代理服务器调用通义千问API（或返回测试回答）
4. 代理服务器返回格式化响应：`{ code: 0, data: { content: "AI回答" } }`
5. 前端显示AI回答

### 测试模式 vs 生产模式
| 特性 | 测试模式 | 生产模式 |
|------|----------|----------|
| API密钥 | 未配置 | 已配置 |
| AI回答 | 模拟回答 | 真实AI回答 |
| 适用场景 | 功能测试、开发调试 | 生产环境 |

---

## 更新记录
- 2026-06-17：创建代理服务器脚本，添加测试模式支持
- 2026-06-17：创建Windows启动脚本
- 2026-06-17：编写操作指南
