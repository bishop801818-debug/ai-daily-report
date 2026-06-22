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
        'name': 'Carbonate',
        'excel_glob': 'C:/Users/1/Downloads/*电解液行业数据库*.xlsx',
        'output_js': 'D:/trae/AI Daily report/electrolyte_embedded_data.js',
        'output_json': 'D:/trae/AI Daily report/electrolyte_all_data.json',
        'js_var': 'EMBEDDED_DATA',
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
        'name': 'Carbonate_Li',
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
        'name': 'LFP',
        'excel_glob': 'C:/Users/1/Downloads/*磷酸铁锂产业链数据库*.xlsx',
        'output_js': 'D:/trae/AI Daily report/lfp_embedded_data.js',
        'js_var': 'EMBEDDED_DATA',
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
        'name': 'NCM',
        'excel_glob': 'C:/Users/1/Downloads/*三元前驱体产业链数据库*.xlsx',
        'output_js': 'D:/trae/AI Daily report/ternary_embedded_data.js',
        'js_var': 'EMBEDDED_DATA',
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
        'name': 'LIB_BATT',
        'excel_glob': 'C:/Users/1/Downloads/*锂电池行业数据库*.xlsx',
        'output_js': 'D:/trae/AI Daily report/lib_battery_embedded_data.js',
        'js_var': 'EMBEDDED_DATA',
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
        'name': 'Recycling',
        'excel_glob': 'C:/Users/1/Downloads/*锂电池回收行业数据库*.xlsx',
        'output_js': 'D:/trae/AI Daily report/recycling_embedded_data.js',
        'js_var': 'EMBEDDED_DATA',
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
        'name': 'Auto',
        'excel_glob': 'C:/Users/1/Downloads/*全球汽车市场数据库*.xlsx',
        'output_js': 'D:/trae/AI Daily report/automotive_embedded_data.js',
        'js_var': 'EMBEDDED_DATA',
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

def to_utf8(v):
    """Force value to clean UTF-8 string, eliminating GBK/latin1 mixed-encoding hazards.

    When openpyxl reads Excel files, non-ASCII characters in sheet names / column names
    may be decoded as latin1 instead of UTF-8, producing garbled strings like
    '����Ų�Ԥ��'. These byte sequences are valid UTF-8 encoded as latin1.
    We detect this by trying to re-encode as UTF-8 and decode as GBK (which is
    compatible with the mis-decoded bytes) to recover the original Chinese text.
    """
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return v
    if isinstance(v, bytes):
        return v.decode('utf-8', errors='replace')
    if isinstance(v, str):
        # Already valid UTF-8?
        try:
            v.encode('utf-8')
            return v
        except UnicodeEncodeError:
            pass
        # openpyxl latin1 mis-decode fix: bytes are valid UTF-8 encoded text,
        # but opened as latin1. Re-encode as latin1 (getting the raw UTF-8 bytes)
        # then decode as GBK -> re-encode as UTF-8.
        # This works because latin1 decode of UTF-8 bytes gives garbage that,
        # when re-encoded as latin1, produces the original UTF-8 byte sequence.
        try:
            raw_bytes = v.encode('latin1')
            # Only fix if the resulting bytes look like valid UTF-8 (high byte set)
            # and GBK decode of those bytes gives readable Chinese
            try:
                gbk_decoded = raw_bytes.decode('gbk')
                # Verify it's actually Chinese-rich (not a random latin1 string)
                chinese_count = sum(1 for c in gbk_decoded if '\u4e00' <= c <= '\u9fff')
                if chinese_count >= len(gbk_decoded) * 0.3:
                    return gbk_decoded
            except (UnicodeDecodeError, LookupError):
                pass
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass
        # Fallback: latin1 round-trip
        return v.encode('latin1').decode('utf-8', errors='replace')
    return str(v)

def sort_tables(tables):
    """按'当前日期'倒序排列所有表格数据（最近日期在前），保证展示顺序一致性"""
    DATE_KEYS = ('当前日期', '日期', 'date', 'update_date')
    for table in tables:
        rows = table.get('data', [])
        if not rows:
            continue
        date_key = next((k for k in DATE_KEYS if k in rows[0]), None)
        if not date_key:
            continue
        table['data'] = sorted(rows, key=lambda r: str(r.get(date_key) or ''), reverse=True)


def excel_to_records(df):
    """Convert DataFrame to records list, handle NaN."""
    records = []
    for idx, row in df.iterrows():
        record = {}
        for col in df.columns:
            col_name = to_utf8(col)
            val = row[col]
            if pd.isna(val):
                record[col_name] = None
            elif isinstance(val, (int, float)):
                if pd.isna(val):
                    record[col_name] = None
                else:
                    record[col_name] = val
            else:
                record[col_name] = to_utf8(val)
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

    # ── 0. 保护机制：若当前 JS 已存在且比 Excel 新，先创建 golden backup ──
    if os.path.exists(output_js):
        try:
            with open(output_js, 'r', encoding='utf-8') as f:
                existing_content = f.read()
            existing_data = json.loads(re.sub(r'^const\s+\w+\s*=\s*', '',
                                               existing_content.strip()).rstrip().rstrip(';'))
            existing_update = existing_data.get('update_time', '')
            # 读取 Excel 修改时间
            files = glob.glob(excel_glob)
            if files:
                excel_file = max(files, key=os.path.getmtime)
                excel_mtime = os.path.getmtime(excel_file)
                import datetime
                excel_date = datetime.datetime.fromtimestamp(excel_mtime)
                # 解析 JS update_time
                if existing_update:
                    try:
                        js_date = datetime.datetime.strptime(existing_update, '%Y-%m-%d %H:%M:%S')
                        # 如果当前 JS 比 Excel 更新（说明数据是手动录入而非从 Excel 生成），创建 golden backup
                        if js_date > excel_date:
                            backup_path = output_js + f'.golden_{datetime.datetime.now().strftime("%Y%m%d_%H%M%S")}'
                            with open(backup_path, 'w', encoding='utf-8') as f:
                                f.write(existing_content)
                            print(f'  [PROTECT] 当前 JS 比 Excel 新，已创建备份: {os.path.basename(backup_path)}')
                    except (ValueError, TypeError):
                        pass
        except Exception:
            pass  # 保护机制失败不影响主流程

    # 找到Excel文件
    files = glob.glob(excel_glob)
    if not files:
        print(f'[WARN] {name}: Excel file not found, glob={excel_glob}')
        return False

    # Pick the newest file (not first alphabetical), to avoid picking stale "(1)" copies
    excel_file = max(files, key=os.path.getmtime)
    print('[INFO] ' + name + ': reading ' + ''.join([c if ord(c) < 128 or c in ' ()-.' else '_' for c in os.path.basename(excel_file)]))

    # Fix: openpyxl mis-decodes some sheet names as GBK (locale default) when the XML
    # stores them as UTF-8. We read the raw UTF-8 bytes directly from the xlsx zip
    # (workbook.xml is always UTF-8 encoded per the XML declaration) and extract
    # the correct sheet names to replace the garbled ones from pandas.
    def _fix_openpyxl_sheet_names(excel_file, sheet_names):
        try:
            import zipfile, re as re_module
            with zipfile.ZipFile(excel_file) as z:
                with z.open('xl/workbook.xml') as f:
                    raw_bytes = f.read()
            # Extract sheet names from raw UTF-8 bytes.
            # The XML encoding declaration says UTF-8, so attribute values ARE UTF-8.
            # We scan byte-by-byte to extract the name attribute values.
            xml_sheet_names = []
            needle = b'<sheet name="'
            pos = 0
            while True:
                idx = raw_bytes.find(needle, pos)
                if idx < 0:
                    break
                # Find the closing quote
                start = idx + len(needle)
                end = raw_bytes.find(b'"', start)
                if end < 0:
                    break
                name_bytes = raw_bytes[start:end]
                # Decode this UTF-8 name to a Python string
                name = name_bytes.decode('utf-8', errors='replace')
                xml_sheet_names.append(name)
                pos = end
            # Match by position: both pandas and XML give sheets in same order
            if len(xml_sheet_names) == len(sheet_names):
                # Verify at least one name is different (fix is actually needed)
                changed = any(a != b for a, b in zip(sheet_names, xml_sheet_names))
                if changed:
                    return xml_sheet_names
            return sheet_names
        except Exception:
            return sheet_names

    try:
        xl = pd.ExcelFile(excel_file)
    except Exception as e:
        print(f'[ERROR] {name}: Excel read error - {e}')
        return False

    tables = []
    update_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    # Fix openpyxl sheet name encoding (GBK mis-decode issue)
    fixed_sheet_names = _fix_openpyxl_sheet_names(excel_file, xl.sheet_names)

    for i, sheet_name in enumerate(xl.sheet_names):
        # Use fixed name for both data reading and table naming
        fixed_name = fixed_sheet_names[i] if i < len(fixed_sheet_names) else sheet_name
        try:
            df = pd.read_excel(excel_file, sheet_name=sheet_name)
            records = excel_to_records(df)
            table_name = sheet_table_map.get(fixed_name, fixed_name)
            tables.append({
                'table_name': table_name,
                'sheet_name': fixed_name,
                'data': records,
                'row_count': len(records)
            })
            print(f'  [OK] {fixed_name} -> {table_name}: {len(records)} rows')
        except Exception as e:
            print(f'  [FAIL] {sheet_name}: error - {e}')

    # 全局排序：按'当前日期'倒序，保证展示时最近日期在上
    sort_tables(tables)

    # Generate JS file
    js_content = f'''const {js_var} = {json.dumps({
        "update_time": update_time,
        "source": os.path.basename(excel_file),
        "tables": tables
    }, ensure_ascii=False, indent=2)};
'''

    try:
        with open(output_js, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f'[OK] {name}: generated {output_js}')
        print(f'  tables={len(tables)}, update={update_time}')
        return True
    except Exception as e:
        print(f'[ERROR] {name}: JS write failed - {e}')
        return False

def post_generate_validation():
    """生成后一致性检查：防止 JS 变量名与 HTML 引用不匹配"""
    import re, os
    project = os.path.dirname(os.path.abspath(__file__))
    errors = []
    ok_count = 0

    # 1. 数据库看板 *_embedded_data.js 必须导出 EMBEDDED_DATA
    #    （跳过 policy_center 等非图表数据文件）
    DB_CHART_BASES = {'automotive', 'carbonate', 'electrolyte', 'lfp',
                      'lib_battery', 'recycling', 'ternary'}
    for fname in os.listdir(project):
        base = fname.replace('_embedded_data.js', '')
        if fname.endswith('_embedded_data.js') and base in DB_CHART_BASES:
            fpath = os.path.join(project, fname)
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    first_line = f.readline()
                m = re.match(r'^\s*const\s+(\w+)\s*=', first_line)
                var = m.group(1) if m else '?'
                if var != 'EMBEDDED_DATA':
                    errors.append(f'  [FAIL] {fname}: exports "{var}" but must be "EMBEDDED_DATA"')
                else:
                    ok_count += 1
            except Exception as e:
                errors.append(f'  [FAIL] {fname}: read error - {e}')

    # 2. 所有 *_charts.html 必须引用 EMBEDDED_DATA（不能有旧变量名）
    OLD_VARS = {'ELECTROLYTE_DATA', 'TERNARY_DATA', 'AUTOMOTIVE_DATA',
                'LIB_BATTERY_DATA', 'RECYCLING_DATA', 'CARBONATE_DATA', 'LFP_DATA'}
    for fname in os.listdir(project):
        if fname.endswith('_charts.html'):
            fpath = os.path.join(project, fname)
            try:
                with open(fpath, 'r', encoding='utf-8') as f:
                    content = f.read()
                for ov in OLD_VARS:
                    if re.search(r'\b' + ov + r'\b', content):
                        errors.append(f'  [FAIL] {fname}: uses old var "{ov}" instead of "EMBEDDED_DATA"')
            except Exception as e:
                errors.append(f'  [FAIL] {fname}: read error - {e}')

    print()
    print('=' * 60)
    print('  变量名一致性检查')
    print('=' * 60)
    if errors:
        print('FAIL - 发现以下问题:')
        for e in errors:
            print(e)
        return False
    else:
        print(f'PASS - {ok_count} 个数据文件全部正确 (exports EMBEDDED_DATA)')
        return True


if __name__ == '__main__':
    print('=' * 60)
    print('Generate all DB embedded JS files')
    print('=' * 60)

    success_count = 0
    for db_config in DB_CONFIGS:
        print()
        ok = generate_db(db_config)
        if ok:
            success_count += 1

    print()
    print('=' * 60)
    print(f'Done: {success_count}/{len(DB_CONFIGS)} DB generated')
    print('=' * 60)

    # 强制一致性检查：失败则退出非0
    if not post_generate_validation():
        print()
        print('[ERROR] 数据一致性检查失败！请修复后再重新生成。')
        import sys
        sys.exit(1)

    # ── B方案：自动同步 JS → JSON（看板数据）────────────────────────────
    print()
    print('[INFO] 开始同步看板 JSON 文件...')
    from _sync_embed_to_json import sync_all, print_report
    results = sync_all()
    print_report(results)
