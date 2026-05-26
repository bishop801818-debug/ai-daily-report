# 完整备份 - 2026-05-26 21:51

## 备份内容

### 核心页面
- index_v3.html - V3仪表盘（当前主力）
- index_v4.html - V4仪表盘
- dept-archive.html - 历史数据归档

### 子页面（charts）
- electrolyte_charts.html - 电解液
- carbonate_charts.html - 碳酸锂
- lfp_charts.html - 磷酸铁锂
- recycling_charts.html - 电池回收
- lib_battery_charts.html - 锂电池
- automotive_charts.html - 汽车

### 数据文件
- data/*.json - 所有JSON数据

---

## 回滚方法

### 方法1：Git回滚（推荐）
```bash
# 查看历史回滚点
git tag | grep rollback

# 回滚到指定点
git checkout rollback_20260526_2151 -- index_v3.html

# 或者重置整个分支（谨慎使用）
git reset --hard rollback_20260526_2151
```

### 方法2：从备份目录恢复
```bash
# 例如恢复index_v3.html
cp backups/full_backup_2026_05_26_2151/index_v3.html ./

# 例如恢复数据文件
cp backups/full_backup_2026_05_26_2151/data/*.json ./data/
```

### 方法3：Git stash临时保存当前修改后恢复
```bash
# 先暂存当前修改
git stash push -m "temporary_backup_$(date +%Y%m%d_%H%M%S)"

# 然后从备份目录手动复制文件恢复
```

---

## 如何创建新的备份点

每次重大修改前，建议：
1. 备份核心页面到本目录
2. 创建新的Git标签
3. 更新本README

```bash
# 创建带时间戳的备份
BACKUP_TIME=$(date +%Y%m%d_%H%M)
mkdir -p backups/full_backup_$BACKUP_TIME
cp index_v3.html index_v4.html backups/full_backup_$BACKUP_TIME/
# ... 其他核心文件

# 创建Git标签
git tag -a "rollback_$BACKUP_TIME" -m "完整备份回滚点：$BACKUP_TIME"
```

---

**创建时间**: 2026-05-26 21:51
**备份人**: WorkBuddy AI助手