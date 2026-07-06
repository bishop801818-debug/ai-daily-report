# 龙蟠智研中心 - HTML文件映射表

## 首页 (index_v3.html) 导航链接对应文件

### 政策中心
| 链接 | 文件位置 | 状态 |
|------|----------|------|
| policy_center_v4.html | 根目录 | ✓ |

### 行业资讯
| 链接 | 文件位置 | 状态 |
|------|----------|------|
| industry_news_embedded.html | 根目录 | ✓ |

### 数据库看板
| 链接 | 文件位置 | 状态 |
|------|----------|------|
| database_hub.html | 根目录 | ✓ |
| → 磷酸铁锂 | lfp_data_v2.html | 根目录 | ✓ |
| → 三元材料 | ternary_data_v2.html | 根目录 | ✓ |
| → 电解液 | electrolyte_data_v2.html | 根目录 | ✓ |
| → 碳酸锂 | carbonate_data_v2.html | 根目录 | ✓ |
| → 回收行业 | recycling_data_v2.html | 根目录 | ✓ |
| → 锂电池 | lib_battery_data_v2.html | 根目录 | ✓ |
| → 汽车行业 | automotive_data_v2.html | 根目录 | ✓ |

### 分析中心
| 链接 | 文件位置 | 状态 |
|------|----------|------|
| analysis_hub.html | 根目录 | ✓ |

### 战略中心
| 链接 | 文件位置 | 状态 |
|------|----------|------|
| strategy_hub.html | 根目录 | ✓ |

### 雷达图
| 链接 | 文件位置 | 状态 |
|------|----------|------|
| radar_hub.html | 根目录 | ✓ |

### 工具箱
| 链接 | 文件位置 | 状态 |
|------|----------|------|
| toolbox.html | 根目录 | ✓ |

### 帮助
| 链接 | 文件位置 | 状态 |
|------|----------|------|
| help.html | 根目录 | ✓ |

### 历史数据
| 链接 | 文件位置 | 状态 |
|------|----------|------|
| archive_v3.html | 根目录 | ✓ |

### 战略看板 (内嵌)
| 链接 | 文件位置 | 状态 |
|------|----------|------|
| strategy_dashboard.html | 根目录 | ✓ |

---

## 各子目录对应关系

| 子目录 | 主要文件 | 备份位置 |
|--------|----------|----------|
| 磷酸铁锂/ | lfp_data_v2.html | _archive/versions/ |
| 三元材料/ | ternary_data_v2.html | _archive/versions/ |
| 电解液/ | electrolyte_data_v2.html | _archive/versions/ |
| 碳酸锂/ | carbonate_data_v2.html | _archive/versions/ |
| 回收行业/ | recycling_data_v2.html | _archive/versions/ |
| 锂电池/ | lib_battery_data_v2.html | _archive/versions/ |
| 汽车行业/ | automotive_data_v2.html | _archive/versions/ |
| embedded/ | 嵌入式版本备份 | - |
| _archive/versions/ | 历史版本存档 | - |

---

## 数据文件位置 (data/ 目录)

| 数据类型 | 文件名 | 路径 |
|----------|--------|------|
| 碳酸锂价格 | carbonate_history.json | data/ |
| 碳酸锂全部数据 | carbonate_all_data.json | data/ |
| 磷酸铁锂价格 | lfp_history.json | data/ |
| 电解液价格 | electrolyte_history.json | data/ |
| 电解液全部数据 | electrolyte_all_data.json | data/ |
| 锂辉石精矿 | sp_history.json | data/ |
| 锂云母 | lib_ore_history.json | data/ |
| 尿素 | ur_history.json | data/ |
| 铁矿石 | i_futures_history.json | data/ |
| 乙二醇 | eg_futures_history.json | data/ |
| WTI原油 | wti_history.json | data/ |

---

## 维护说明

1. **根目录文件为工作版本** - 所有导航链接指向根目录文件
2. **子目录为分类存储** - 各品种数据页面按类别存放在对应子目录
3. **_archive/versions/ 为历史备份** - 不直接引用，仅供恢复使用
4. **embedded/ 为嵌入式备份** - 用于嵌入其他系统时的备份

如遇404错误，首先检查根目录是否存在对应文件，如不存在则从子目录或_archive/versions/恢复。