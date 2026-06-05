# 稳定版回滚机制操作指南
## 更新时间：2026-05-17 00:23

---

## 📌 当前稳定版信息

| 项目 | 内容 |
|------|------|
| **黄金版本文件** | `index_v3_20260517_002321.html` |
| **文件大小** | 1120KB |
| **创建时间** | 2026-05-17 00:23:21 |
| **版本说明** | 稳定版v2：4个界面修改（集团矩阵标题+导航栏一行+矩阵标题居中+早报跳转修复） |
| **稳定版副本** | `index_v3.html.stable_latest` |

---

## ✅ 包含的修改内容

### 1. 添加"集团矩阵"标题
- 位置：BU矩阵模块上方
- 样式：居中，使用 `section-title` 类，与"市场行情监控"标题一致
- 代码位置：Line 3947-3949

### 2. 导航栏优化
- 删除"事业部中心"按钮（Line 3910-3913）
- 所有导航键一行展示（`flex-wrap: nowrap`）
- CSS修改：`.main-nav-menu` (Line 161-173)

### 3. 矩阵标题居中
- 新能源矩阵、化学品矩阵、氢能业务三个标题改为居中样式
- 使用 `section-title` 类，与"市场行情监控"保持一致
- 代码位置：Line 3960, 3972, 3984

### 4. 早报跳转修复
- 卡片中添加"早报详情"按钮，跳转到早报弹窗
- 修复右上角关闭按钮交互
- 增强 `closePanel()` 和 `closeReport()` 函数

---

## 🔄 回滚操作方法

### 方法1：使用备份脚本（推荐）
```bash
cd "D:/trae/AI Daily report"
python backup.py restore index_v3_20260517_002321.html
```
**优点**：自动备份当前版本，安全可逆

### 方法2：手动复制到工作版本
```bash
cp "D:/trae/AI Daily report/_backups/index_v3_20260517_002321.html" "D:/trae/AI Daily report/index_v3.html"
```
**优点**：快速直接

### 方法3：使用稳定版副本
```bash
cp "D:/trae/AI Daily report/index_v3.html.stable_latest" "D:/trae/AI Daily report/index_v3.html"
```
**优点**：最简单，稳定版副本与黄金版本同步

---

## 📂 备份文件清单

### 黄金版本备份
- **当前**：`index_v3_20260517_002321.html` (1120KB) ⭐
- 旧版：`index_v3_20260516_224817.html` (不建议使用)

### 中间版本备份
- `index_v3_20260516_231831.html`

### 稳定版副本
- `index_v3.html.stable_latest` (与黄金版本同步)

### 版本标记文件
- `GOLDEN_VERSION.txt` (记录当前黄金版本信息)

---

## 🛡️ 回滚机制验证

### 验证步骤
1. **检查备份文件存在**：
   ```bash
   ls -lh "D:/trae/AI Daily report/_backups/index_v3_20260517_002321.html"
   ```

2. **检查稳定版副本**：
   ```bash
   ls -lh "D:/trae/AI Daily report/index_v3.html.stable_latest"
   ```

3. **检查版本标记**：
   ```bash
   cat "D:/trae/AI Daily report/GOLDEN_VERSION.txt"
   ```

4. **测试回滚功能**：
   ```bash
   cd "D:/trae/AI Daily report"
   python backup.py restore index_v3_20260517_002321.html
   ```

---

## 📝 版本历史记录

| 版本 | 时间 | 说明 |
|------|------|------|
| v1 | 2026-05-16 22:48 | 初始黄金版本（BU矩阵迁移完成） |
| **v2** | **2026-05-17 00:23** | **当前稳定版（4个界面修改）** |

---

## ⚠️ 注意事项

1. **回滚前自动备份**：使用 `backup.py restore` 时，当前 `index_v3.html` 会自动备份到 `_backups` 目录
2. **浏览器缓存**：回滚后请按 `Ctrl + Shift + R` 硬刷新浏览器
3. **版本确认**：回滚后打开 `index_v3.html`，检查顶部注释中的版本信息
4. **问题反馈**：如遇回滚失败，检查 `backup.py` 脚本权限和文件路径

---

## 📞 快速参考

**用户提示词模板**：
```
请回滚到稳定版v2（2026-05-17 00:23）
或者
请用黄金版本 index_v3_20260517_002321.html 回滚
```

**AI执行命令**：
```bash
cd "D:/trae/AI Daily report"
python backup.py restore index_v3_20260517_002321.html
```

---
**文档版本**：v1.0  
**最后更新**：2026-05-17 00:30  
**维护者**：AI助手
