# 首页产业链全景图节点数据源运维文档

> 生成时间：2026-06-24
> 适用页面：http://localhost:8888/index_v3.html
> 代码位置：initLithiumDashboard() 函数，约第 11078-11900 行

---

## 一、数据源完整对照表

| 节点显示名 | chainHistoryData key | 数据源文件 | 具体表/路径 | 价格字段 | 单位 | 月环比 |
|-----------|---------------------|-----------|------------|---------|------|--------|
| 锂辉石精矿 | `锂辉石(5%)` | `data/lithium_ore_price_history.json` | `history[]` | `avg_price` | 美元/吨 | -7.35% |
| 磷矿石 | `磷矿石` | `reports/lfp_all_data.json` | `磷酸盐价格`表，规格=`磷矿石30%品位` | `今日均价(万元/吨)×10000` | 元/吨 | 0% |
| 硫酸亚铁 | `硫酸亚铁` | `reports/lfp_all_data.json` | `非磷原料价格`表，规格含`硫酸亚铁` | `今日均价` | 元/吨 | +5.58% |
| 新能源车 | `新能源车` | `embedded/automotive_embedded_data.js` | `新能源汽车销量—国内市场`表 | `本期销量(万辆)` | 万辆 | +11.31% |
| 锂电池 | `锂电池` | `embedded/recycling_embedded_data.js` | `锂电池价格-铁锂铝壳电池包`表 | `今日均价×10000` | 元/吨 | 0% |
| 锂云母 | `锂云母` | `data/lepidolite_price_history.json` | `history[]` | `avg_price` | 元/吨 | 有数据 |
| 磷酸铁锂 | `磷酸铁锂` | `reports/lfp_power_history.json` | `history[]` | `close` | 元/吨 | 有数据 |
| 磷酸铁锂（储能型） | `磷酸铁锂（储能型）` | `reports/lfp_storage_history.json` | `history[]` | `close` | 元/吨 | 有数据 |
| 碳酸锂 | `碳酸锂` | `reports/lc_futures_history.json` | `history[]` | `close` | 元/吨 | 有数据 |
| 磷酸铁 | `磷酸铁` | `reports/iron_phosphate_history.json` | `history[]` | `close` | 元/吨 | 有数据 |

---

## 二、JS 文件解析方案（关键！）

`embedded_*.js` 文件格式为 `const EMBEDDED_DATA = {...};`，**不能用正则 `.*`**，因为 `.*` 在 JavaScript 里不匹配换行符！

正确方式：用 `indexOf` 定位首尾大括号：

```javascript
const eqIdx = jsText.indexOf('=');
const braceStart = jsText.indexOf('{', eqIdx);
const braceEnd = jsText.lastIndexOf('}');
const jsonStr = jsText.substring(braceStart, braceEnd + 1);
const data = JSON.parse(jsonStr);
```

适用文件：
- `embedded/automotive_embedded_data.js` — 666KB，新能源汽车数据
- `embedded/recycling_embedded_data.js` — 4.3MB，锂电池价格数据

---

## 三、aliasMap 链路（findNodeData 函数）

节点显示名和数据 key 不同，通过 aliasMap 映射：

```javascript
const aliasMap = {
    '碳酸锂': ['电池级碳酸锂', '工业级碳酸锂', '碳酸锂期货'],
    '锂云母': ['锂云母矿', '云母精矿', '宜春锂云母'],
    '锂辉石精矿': ['锂辉石(5%)', '锂辉石'],         // 节点名→实际key
    '磷酸铁锂': ['磷酸铁锂(动力型)', '磷酸铁锂(储能型)'],
    '硫酸亚铁': ['铁源', '氧化铁'],
    '新能源车': ['新能源汽车'],
    '锂电池': ['锂电池电芯', '锂电池（电芯/电池包）']
};
```

查找顺序：
1. `chainHistoryData[nodeName]` 直接匹配
2. `chainHistoryData[alias]` 别名精确匹配（2026-06-24 新增）
3. `chainHistoryData` key 模糊包含匹配（2026-06-24 新增）
4. `marketData[alias]`
5. `marketData` key 模糊包含匹配

---

## 四、月环比计算统一逻辑

所有节点统一用**月末最后一条数据**作为月度数据点：

```javascript
// 按月取最后一条
const byMonth = {};
records.forEach(r => {
    const month = r['日期'].substring(0, 7);
    if (!byMonth[month] || r['日期'] > byMonth[month]['日期']) byMonth[month] = r;
});
const months = Object.keys(byMonth).sort();
const latestMonth = months[months.length - 1];
const prevMonth = months[months.length - 2];
const latestVal = parseFloat(byMonth[latestMonth]['价格字段']) || 0;
const prevVal = parseFloat(byMonth[prevMonth]['价格字段']) || 0;
const mom = prevVal > 0 ? ((latestVal - prevVal) / prevVal * 100) : 0;
```

---

## 五、数据库归属

| 数据文件 | 归属数据库（database_hub） | 数据库名 |
|---------|--------------------------|---------|
| `reports/lfp_all_data.json` | lfp | 磷酸铁锂数据库 |
| `embedded/automotive_embedded_data.js` | automotive | 汽车行业数据库 |
| `embedded/recycling_embedded_data.js` | recycling | 锂电池回收行业数据库 |
| `data/lithium_ore_price_history.json` | — | 独立数据文件 |
| `data/lepidolite_price_history.json` | — | 独立数据文件 |

---

## 六、2026-06-24 本次接入记录

本次修复了以下三个节点之前无数据的问题：

1. **锂辉石精矿**：`oreResp` 从未被写入 `chainHistoryData`，添加了独立处理块
2. **新能源车**：`autoResp` 加入 fetch，JS 解析改用 indexOf 方案，`chainHistoryData['新能源车']` 写入成功
3. **锂电池**：`recyclingResp` 加入 fetch，`recycling_embedded_data.js` 中 `锂电池价格-铁锂铝壳电池包` 表接入
