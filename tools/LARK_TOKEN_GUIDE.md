# lark-cli Token 管理工具集 (2026-10-08 立)

> 用于解决"飞书 refresh_token 过期 → 早报自动化失败"问题。

## 问题背景

lark-cli 使用 OAuth 2.0 Device Authorization Grant 模式访问飞书：

| Token 类型 | 有效期 | 续期机制 |
|-----------|--------|----------|
| `access_token` | ~2 小时 | lark-cli 自动用 refresh_token 续期 |
| `refresh_token` | 14 ~ 30 天 | 到期后必须人工走 device flow |

**典型故障场景**：国庆/春节长假 7 天 + 假前最后一次 token 调用（默认 9-30 / 1 月除夕前）→ refresh_token 过期 → 假期后第一次自动化必失败。

## 工具集

### 1. `tools/lark_preflight.py` — 自动化前探活（方案 A）

**作用**：执行早报下载前先检查 lark-cli user.status，缺失立即退出 + 不进入后续步骤。

**调用方式**：
```bash
# 独立调用（返回 0=ready, 1=missing, 2=call_failed）
python tools/lark_preflight.py

# 在 download_feishu_docx_as_json.py 中已自动调用，无需手动操作
```

**集成位置**：`download_feishu_docx_as_json.py: main()` 函数 Step 0（新增）：
```python
# Step 0: 探活 lark-cli 用户身份
sys.path.insert(0, str(PROJECT_ROOT / "tools"))
from lark_preflight import preflight_check
is_ready, info = preflight_check()
if not is_ready:
    sys.exit(2)  # 中止后续步骤
```

### 2. `tools/lark_reauth.py` — 用户主动重授权（补救工具）

**作用**：当 preflight 失败时，用户手动运行此脚本完成 device flow 授权。

**调用方式**：
```bash
python tools/lark_reauth.py
```

**流程**（4 步，**硬规则：每步执行后不再生成新 QR**）：
1. 申请 device_code
2. 生成 QR 码 PNG（`./feishu_login_qr.png`）
3. 用户扫码 + 飞书 APP 确认授权
4. 轮询 device_code（最长 10 分钟）

**关键硬规则**：每次 `--no-wait --json` 都会**作废旧 device_code**。生成 QR 后**绝对不要再生成新 QR 码**，否则用户扫的旧码授权会被作废。

### 3. `tools/lark_pre_holiday_reauth.py` — 长假前主动探测（方案 B）

**作用**：长假前 1 天主动探测 token 状态，若发现即将过期提前提醒用户。

**调用方式**：
```bash
# 手动触发（仅在长假前 1 天有效）
python tools/lark_pre_holiday_reauth.py

# 强制探测（无论日期）
python tools/lark_pre_holiday_reauth.py --always

# 探测 + 自动调用重授权（需要用户在场扫码）
python tools/lark_pre_holiday_reauth.py --always --trigger-reauth

# 指定日期
python tools/lark_pre_holiday_reauth.py --date 2026-09-30
```

**触发日期清单**（已硬编码）：
- 国庆前 1 天：9-30（2024、2025、2026、2027）
- 春节前 1 天（农历除夕前 1 天）：2024-02-07、2025-01-27、2026-02-15、2027-02-05
- 五一前 1 天：4-30（2024、2025、2026、2027）

**WorkBuddy 自动化建议**：
```
任务 ID: automation-to-be-created
触发时间: 每年 9-30 09:00（国庆前）+ 每年 2-15 09:00（2026 春节前）
执行内容: python tools/lark_pre_holiday_reauth.py
失败处理: 当 status=missing 时发送飞书消息通知用户
```

## 自动化任务建议

| 任务 ID | 触发时间 | 执行内容 | 期望输出 |
|---------|---------|---------|---------|
| 早报日常（已有） | 工作日 08:50 | download_feishu_docx_as_json.py | Step 0 自动探活 |
| 长假前检查（待创建） | 每年 9-30 / 2-15 09:00 | lark_pre_holiday_reauth.py | user.ready / warn.user_missing |

## 故障应急流程

```
1. 早报自动化失败（08:50 trigger）
   ↓
2. 查看 download_feishu_docx_as_json.py 输出
   ↓ [Step 0] user.status = missing
3. 用户运行：python tools/lark_reauth.py
   ↓ 生成 QR
4. 用户用手机飞书扫码 → 确认授权
   ↓ 自动轮询
5. 授权完成（lark-cli token 写入 keychain）
   ↓
6. 重新触发早报自动化 → ✅ 成功
```

## 历史踩坑（避免重复）

- **2026-10-08**：国庆假期后第一次早报失败 → 用户多次生成新 QR 码 → 旧授权被作废 → 浪费 3 次尝试
- **硬规则**：每次 `auth login --no-wait --json` 都会作废旧 device_code

## 关联文件

- `download_feishu_docx_as_json.py` — 主脚本（Step 0 自动探活）
- `tools/lark_preflight.py` — 探活脚本（独立工具）
- `tools/lark_reauth.py` — 用户重授权脚本（独立工具）
- `tools/lark_pre_holiday_reauth.py` — 长假前探测脚本（独立工具）
- `tools/_env_path.sh` — bash PATH 自愈（lark-cli 通过 bash 调用）