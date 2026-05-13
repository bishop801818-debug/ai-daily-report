import pandas as pd
import json
from datetime import datetime

# 读取Excel
excel_file = 'C:/Users/1/Downloads/电解液行业数据库.xlsx'
xl = pd.ExcelFile(excel_file)

# Sheet名称映射到HTML期望的table_name
sheet_table_map = {
    '电解液产量-全企业': '电解液-行业整体产量',
    '电解液产量-分企业': '电解液-分企业产量横向',
    '电解液产量-top15': '电解液-top15排名',
    '电解液产量年累-top15': '电解液年累-top15',
    '电解液价格-磷酸铁锂动力型': '电解液价格-磷酸铁锂动力型',
    '电解液价格-磷酸铁锂储能型': '电解液价格-磷酸铁锂储能型',
    '电解液价格-三元动力型': '电解液价格-三元动力型',
    '电解液价格-圆柱2600mAh': '电解液价格-圆柱2600mAh',
    '电解液价格-圆柱2200mAh': '电解液价格-圆柱2200mAh',
    '高压电解液-＞4.4V': '高压电解液价格-4.4V以上',
    '高压电解液-4.4V': '高压电解液价格-4.4V',
    '高压电解液-4.35V': '高压电解液价格-4.35V',
    '电解液价格-分企业': '电解液价格-分企业横向',
    '六氟产量-全行业': '六氟磷酸锂-行业总产量',
    '六氟产量-分企业': '六氟-分企业产量',
    '六氟产量-top15': '六氟-top15排名',
    '六氟产量年累-top15': '六氟年累-top15',
    '溶质价格-六氟主流市场': '六氟磷酸锂价格-主流市场',
    '溶质价格-六氟出口': '六氟磷酸锂价格-出口',
    '溶质价格-LiFSI-固态': 'LiFSI价格-固态',
    '溶质价格-LiFSI-液态': 'LiFSI价格-液态',
    '六氟-出口': '六氟磷酸锂出口-总量',
    '六氟出口-分国别': '六氟出口-分国别',
    '添加剂-产量-VC': '添加剂VC-产量',
    '添加剂-产量-FEC': '添加剂FEC-产量',
    '添加剂-价格-VC': '添加剂VC-价格',
    '添加剂-价格-PS': '添加剂PS-价格',
    '添加剂-价格-FEC': '添加剂FEC-价格',
}

tables = []
update_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

for sheet_name in xl.sheet_names:
    try:
        df = pd.read_excel(excel_file, sheet_name=sheet_name)
        # 转换为records
        records = []
        for idx, row in df.iterrows():
            record = {}
            for col in df.columns:
                val = row[col]
                # 处理NaN
                if pd.isna(val):
                    record[str(col)] = None
                elif isinstance(val, (int, float)):
                    if val == val and val != 0:  # 检查不是NaN
                        record[str(col)] = val
                    else:
                        record[str(col)] = None
                else:
                    record[str(col)] = str(val)
            records.append(record)
        
        table_name = sheet_table_map.get(sheet_name, sheet_name)
        tables.append({
            'table_name': table_name,
            'sheet_name': sheet_name,
            'data': records,
            'row_count': len(records)
        })
        print(f'✓ {sheet_name} -> {table_name}: {len(records)} 条')
    except Exception as e:
        print(f'✗ {sheet_name}: 错误 - {e}')

# 生成JS文件
js_content = f'''const ELECTROLYTE_DATA = {{
    "update_time": "{update_time}",
    "source": "电解液行业数据库.xlsx",
    "tables": {json.dumps(tables, ensure_ascii=False, indent=4)}
}};
'''

# 保存文件
output_file = 'D:/trae/AI Daily report/electrolyte_embedded_data.js'
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f'\\n✅ 数据已生成: {output_file}')
print(f'总共 {len(tables)} 个表格')