"""
生成所有7个数据库的 *_embedded_data.js 文件
从Downloads文件夹的Excel文件读取数据，生成嵌入数据JS文件
"""
import pandas as pd
import json
import glob
import os
from datetime import datetime

# ========== 配置：7个数据库 =========
DB_CONFIGS = [
    {
        'name': '电解液',
        'excel_glob': 'C:/Users/1/Downloads/*电解液行业数据库*.xlsx',
        'output_js': 'D:/trae/AI Daily report/electrolyte_embedded_data.js',
        'output_json': 'D:/trae/AI Daily report/electrolyte_all_data.json',
        'js_var': 'ELECTROLYTE_DATA',
        'source_name': '电解液行业数据库.xlsx',
        'sheet_table_map': {
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
    },
    {
        'name': '碳酸锂',
        'excel_glob': 'C:/Users/1/Downloads/*碳酸锂产业链数据库*.xlsx',
        'output_js': 'D:/trae/AI Daily report/carbonate_embedded_data.js',
        'js_var': 'EMBEDDED_DATA',
        'source_name': '碳酸锂产业链数据库.xlsx',
        'sheet_table_map': {
            '碳酸锂-行业总产量': '碳酸锂-行业总产量',
            '碳酸锂-分企业产量': '碳酸锂-分企业产量',
            '碳酸锂-进口量': '碳酸锂-进口量',
            '碳酸锂-进口贸易伙伴': '碳酸锂-进口贸易伙伴',
            '碳酸锂-出口量': '碳酸锂-出口量',
            '碳酸锂-出口贸易伙伴': '碳酸锂-出口贸易伙伴',
            '碳酸锂—价格': '碳酸锂-价格',
            '氢氧化锂-行业总产量': '氢氧化锂-行业总产量',
            '氢氧化锂—分企业产量': '氢氧化锂-分企业产量',
            '氢氧化锂-进口量': '氢氧化锂-进口量',
            '氢氧化锂-进口贸易伙伴': '氢氧化锂-进口贸易伙伴',
            '氢氧化锂-出口量': '氢氧化锂-出口量',
            '氢氧化锂—出口贸易伙伴': '氢氧化锂-出口贸易伙伴',
            '氢氧化锂-价格': '氢氧化锂-价格',
            '锂云母—价格': '锂云母-价格',
            '锂辉石-进口量': '锂辉石-进口量',
            '锂辉石-进口贸易伙伴': '锂辉石-进口贸易伙伴',
            '锂辉石-出口量': '锂辉石-出口量',
            '锂辉石—出口贸易伙伴': '锂辉石-出口贸易伙伴',
            '锂辉石精矿-价格': '锂辉石精矿-价格',
        }
    },
    {
        'name': '磷酸铁锂',
        'excel_glob': 'C:/Users/1/Downloads/*磷酸铁锂产业链数据库*.xlsx',
        'output_js': 'D:/trae/AI Daily report/lfp_embedded_data.js',
        'js_var': 'LFP_DATA',
        'source_name': '磷酸铁锂产业链数据库.xlsx',
        'sheet_table_map': {
            'LFP-行业整体产量': 'LFP-行业整体产量',
            'LFP-分企业产量': 'LFP-分企业产量',
            'LFP竞对销量（客户采购量）': 'LFP竞对销量',
            'LFP-出口量': 'LFP-出口量',
            'LFP-出口贸易伙伴': 'LFP-出口贸易伙伴',
            'FP-行业整体产量': 'FP-行业整体产量',
            'FP-分企业产量': 'FP-分企业产量',
            'FP竞对销量（客户采购量）': 'FP竞对销量',
            '现货市场价（分压实密度）': 'LFP现货市场价-分压实密度',
            'LFP现货市场价': 'LFP现货市场价',
            'FP现货市场价': 'FP现货市场价',
            '磷酸盐价格数据': '磷酸盐价格',
            '非磷原料价格数据': '非磷原料价格',
        }
    },
    {
        'name': '三元',
        'excel_glob': 'C:/Users/1/Downloads/*三元前驱体产业链数据库*.xlsx',
        'output_js': 'D:/trae/AI Daily report/ternary_embedded_data.js',
        'js_var': 'TERNARY_DATA',
        'source_name': '三元前驱体产业链数据库.xlsx',
        'sheet_table_map': {
            'NCM-行业整体产量': 'NCM-行业整体产量',
            'NCM-分型号产量': 'NCM-分型号产量',
            'NCM-分企业产量': 'NCM-分企业产量',
            'NCM-出口-总量': 'NCM-出口总量',
            'NCM-出口-目的地': 'NCM-出口目的地',
            'NCM-进口-总量': 'NCM-进口总量',
            'NCM-进口-目的地': 'NCM-进口目的地',
            'NCM-现货市场价 万元吨': 'NCM-现货市场价',
            'NCMpre-行业整体产量': 'NCMpre-行业整体产量',
            'NCMpre-分型号产量': 'NCMpre-分型号产量',
            'NCMpre-分企业产量': 'NCMpre-分企业产量',
            'NCMpre-出口-总量': 'NCMpre-出口总量',
            'NCMpre-出口-目的地': 'NCMpre-出口目的地',
            'NCMpre-进口-总量': 'NCMpre-进口总量',
            'NCMpre-进口-目的地': 'NCMpre-进口目的地',
            'NCMpre-现货市场价 万元吨': 'NCMpre-现货市场价',
            '关键原料-现货市场价 万元吨': '关键原料-现货市场价',
            '四氧化三钴-行业整体产量': '四氧化三钴-行业整体产量',
            '四氧化三钴-现货市场价 万元吨': '四氧化三钴-现货市场价',
        }
    },
    {
        'name': '锂电池',
        'excel_glob': 'C:/Users/1/Downloads/*锂电池行业数据库*.xlsx',
        'output_js': 'D:/trae/AI Daily report/lib_battery_embedded_data.js',
        'js_var': 'LIB_BATTERY_DATA',
        'source_name': '锂电池行业数据库.xlsx',
        'sheet_table_map': {
            '锂电池行业产量（分规格）': '锂电池行业产量-分规格',
            '锂电池行业产量产能（不分规格）': '锂电池行业产量产能',
            '锂电池分企业产量（分规格）': '锂电池分企业产量-分规格',
            '锂电池分企业产量产能（不分规格）': '锂电池分企业产量产能',
            '电池排产预测': '电池排产预测',
        }
    },
    {
        'name': '回收',
        'excel_glob': 'C:/Users/1/Downloads/*锂电池回收行业数据库*.xlsx',
        'output_js': 'D:/trae/AI Daily report/recycling_embedded_data.js',
        'js_var': 'RECYCLING_DATA',
        'source_name': '锂电池回收行业数据库.xlsx',
        'sheet_table_map': {
            '黑粉处理量-总计': '黑粉处理量-总计',
            '黑粉处理量-三元+钴酸锂': '黑粉处理量-三元+钴酸锂',
            '黑粉处理量-铁锂': '黑粉处理量-铁锂',
            '黑粉整体处理量-分企业': '黑粉整体处理量-分企业',
            '黑粉三元+钴酸锂处理量-分企业': '黑粉三元+钴酸锂处理量-分企业',
            '黑粉磷酸铁锂处理量-分企业': '黑粉磷酸铁锂处理量-分企业',
            '锂电池价格-大三元聚合物电池包': '锂电池价格-大三元聚合物电池包',
            '锂电池价格-大三元铝壳电池包': '锂电池价格-大三元铝壳电池包',
            '锂电池价格-钴酸锂铝壳电池包': '锂电池价格-钴酸锂铝壳电池包',
            '锂电池价格-加工费电池包': '锂电池价格-加工费电池包',
            '锂电池价格-铁锂钢壳电池包': '锂电池价格-铁锂钢壳电池包',
            '锂电池价格-铁锂铝壳电池包': '锂电池价格-铁锂铝壳电池包',
            '极片价格-负极片 25%＞Cu＞22%': '极片价格-负极片',
            '极片价格-钴酸锂正极片Co≥45%;Li＞5%': '极片价格-钴酸锂正极片',
            '极片价格-加工费': '极片价格-加工费',
            '极片价格-三元523正极片Ni≥23%;Co≥8%;Li＞5%': '极片价格-三元523正极片',
            '极片价格-铁锂正极片3.8%≥Li≥3.2%': '极片价格-铁锂正极片',
            '辅料价格-铝粉Al≥90%': '辅料价格-铝粉',
            '辅料价格-铜粉Cu≥90%': '辅料价格-铜粉',
            '黑粉价格-钴酸锂电池粉30%≥Co≥25%;3.8%≥Li≥3': '黑粉价格-钴酸锂电池粉',
            '黑粉价格-钴酸锂极片粉55%≥Co≥50%;6.3%≥Li≥5': '黑粉价格-钴酸锂极片粉',
            '黑粉价格-三元523电池粉17%≥Ni≥15%;7.5%≥Co': '黑粉价格-三元523电池粉',
            '黑粉价格-三元523极片粉30%≥Ni≥26%;12%≥Co≥': '黑粉价格-三元523极片粉',
            '黑粉价格-石墨粉': '黑粉价格-石墨粉',
            '黑粉价格-铁锂电池粉加工费2.8%≥Li≥2.2%': '黑粉价格-铁锂电池粉加工费',
            '黑粉价格-铁锂极片粉4.2%≥Li＞3.6%': '黑粉价格-铁锂极片粉',
            '黑粉价格-铁锂极片粉加工费4.2%≥Li≥3.6%': '黑粉价格-铁锂极片粉加工费',
        }
    },
    {
        'name': '汽车',
        'excel_glob': 'C:/Users/1/Downloads/*全球汽车市场数据库*.xlsx',
        'output_js': 'D:/trae/AI Daily report/automotive_embedded_data.js',
        'js_var': 'AUTOMOTIVE_DATA',
        'source_name': '全球汽车市场数据库.xlsx',
        'sheet_table_map': {
            '汽车销量—全球分区域市场': '汽车销量-全球分区域',
            '汽车销量—全球分国家市场': '汽车销量-全球分国家',
            '汽车销量—中国汽车市场': '汽车销量-中国市场',
            '汽车销量—中国乘用车市场': '汽车销量-中国乘用车',
            '汽车销量—中国乘用车出口': '汽车销量-中国乘用车出口',
            '汽车销量-中国乘用车-分整车厂': '汽车销量-中国乘用车分整车厂',
            '汽车销量—中国商用车市场': '汽车销量-中国商用车',
            '汽车销量-中国商用车-分整车厂': '汽车销量-中国商用车分整车厂',
            '汽车销量-中国商用车-中重卡-分整车厂': '汽车销量-中国商用车中重卡',
            '汽车销量-中国商用车-轻卡-分整车厂': '汽车销量-中国商用车轻卡',
            '汽车销量-中国商用车-轻客-分整车厂': '汽车销量-中国商用车轻客',
            '汽车销量-中国商用车-大中客-分整车厂': '汽车销量-中国商用车大中客',
            '新能源汽车销量-全球市场-整体': '新能源汽车销量-全球整体',
            '新能源汽车销量-全球市场-分地区': '新能源汽车销量-全球分地区',
            '新能源汽车销量—中国市场': '新能源汽车销量-中国市场',
            '新能源汽车销量-出口': '新能源汽车销量-出口',
            '新能源汽车销量-国内-乘用车零售销量': '新能源汽车销量-国内乘用车零售',
            '新能源汽车销量-国内-商用车零售销量': '新能源汽车销量-国内商用车零售',
            '新能源汽车销量-乘用车零售-分类型': '新能源汽车销量-乘用车零售分类型',
            '新能源汽车销量-乘用车零售-分级别': '新能源汽车销量-乘用车零售分级别',
            '新能源汽车销量-乘用车零售-分品牌': '新能源汽车销量-乘用车零售分品牌',
            '新能源汽车销量-乘用车出口-分类型': '新能源汽车销量-乘用车出口分类型',
            '新能源汽车销量-乘用车出口-分市场': '新能源汽车销量-乘用车出口分市场',
            '新能源汽车销量-乘用车出口-分车企': '新能源汽车销量-乘用车出口分车企',
        }
    },
]

def excel_to_records(df):
    """将DataFrame转换为records列表，处理NaN"""
    records = []
    for idx, row in df.iterrows():
        record = {}
        for col in df.columns:
            val = row[col]
            if pd.isna(val):
                record[str(col)] = None
            elif isinstance(val, (int, float)):
                if pd.isna(val):
                    record[str(col)] = None
                else:
                    record[str(col)] = val
            else:
                record[str(col)] = str(val)
        records.append(record)
    return records

def generate_db(db_config):
    """为一个数据库生成嵌入数据JS文件"""
    name = db_config['name']
    excel_glob = db_config['excel_glob']
    output_js = db_config['output_js']
    js_var = db_config['js_var']
    source_name = db_config['source_name']
    sheet_table_map = db_config['sheet_table_map']
    
    # 找到Excel文件
    files = glob.glob(excel_glob)
    if not files:
        print(f'[WARN] {name}: 未找到Excel文件, glob={excel_glob}')
        return False
    
    excel_file = files[0]
    print(f'[INFO] {name}: 读取 {os.path.basename(excel_file)}')
    
    try:
        xl = pd.ExcelFile(excel_file)
    except Exception as e:
        print(f'[ERROR] {name}: 无法读取Excel - {e}')
        return False
    
    tables = []
    update_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    for sheet_name in xl.sheet_names:
        try:
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            records = excel_to_records(df)
            table_name = sheet_table_map.get(sheet_name, sheet_name)
            tables.append({
                'table_name': table_name,
                'sheet_name': sheet_name,
                'data': records,
                'row_count': len(records)
            })
            print(f'  ✓ {sheet_name} -> {table_name}: {len(records)} 条')
        except Exception as e:
            print(f'  ✗ {sheet_name}: 错误 - {e}')
    
    # 生成JS文件
    js_content = f'''const {js_var} = {json.dumps({
        "update_time": update_time,
        "source": os.path.basename(excel_file),
        "tables": tables
    }, ensure_ascii=False, indent=2)};
'''
    
    try:
        with open(output_js, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f'[成功] {name}: 已生成 {output_js}')
        print(f'  共 {len(tables)} 个表格, update_time={update_time}')
        return True
    except Exception as e:
        print(f'[ERROR] {name}: 写入JS文件失败 - {e}')
        return False

if __name__ == '__main__':
    print('=' * 60)
    print('生成所有数据库的嵌入数据JS文件')
    print('=' * 60)
    
    success_count = 0
    for db_config in DB_CONFIGS:
        print()
        ok = generate_db(db_config)
        if ok:
            success_count += 1
    
    print()
    print('=' * 60)
    print(f'完成: {success_count}/{len(DB_CONFIGS)} 个数据库生成成功')
    print('=' * 60)
