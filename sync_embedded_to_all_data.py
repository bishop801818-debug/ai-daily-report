"""
同步脚本：从 *_embedded_data.js 生成 *_all_data.json
读取所有嵌入数据JS文件，生成首页用的JSON文件
"""
import json
import re
import glob
import os

# 7个数据库的JS和JSON文件映射
DB_SYNC_MAP = [
    ('电解液', 'D:/trae/AI Daily report/electrolyte_embedded_data.js', 'D:/trae/AI Daily report/electrolyte_all_data.json'),
    ('碳酸锂', 'D:/trae/AI Daily report/carbonate_embedded_data.js', 'D:/trae/AI Daily report/carbonate_all_data.json'),
    ('磷酸铁锂', 'D:/trae/AI Daily report/lfp_embedded_data.js', 'D:/trae/AI Daily report/lfp_all_data.json'),
    ('三元', 'D:/trae/AI Daily report/ternary_embedded_data.js', 'D:/trae/AI Daily report/ternary_all_data.json'),
    ('锂电池', 'D:/trae/AI Daily report/lib_battery_embedded_data.js', 'D:/trae/AI Daily report/lib_battery_all_data.json'),
    ('回收', 'D:/trae/AI Daily report/recycling_embedded_data.js', 'D:/trae/AI Daily report/recycling_all_data.json'),
    ('汽车', 'D:/trae/AI Daily report/automotive_embedded_data.js', 'D:/trae/AI Daily report/automotive_all_data.json'),
]

def js_to_json(js_file):
    """从JS文件提取数据对象并解析为JSON"""
    with open(js_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 找到JS对象：const VAR_NAME = {...};
    # 用正则找到最外层对象
    # 策略：找到第一个 '{' 然后匹配到对应的 '}'
    start = content.find('{')
    if start == -1:
        raise ValueError(f'未找到对象开始: {js_file}')
    
    # 手动匹配括号
    depth = 0
    end = start
    for i in range(start, len(content)):
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    
    js_obj_str = content[start:end]
    
    # 清理JS语法：去掉尾逗号、注释等
    # 简单处理：用json.loads尝试解析
    try:
        data = json.loads(js_obj_str)
        return data
    except json.JSONDecodeError as e:
        # 尝试清理
        # 去掉注释
        clean = re.sub(r'//[^\n]*', '', js_obj_str)
        clean = re.sub(r'/\*[^*]*\*+([^/][^*]*\*+)*/', '', clean, flags=re.DOTALL)
        # 去掉尾逗号
        clean = re.sub(r',\s*([}\]])', r'\1', clean)
        try:
            data = json.loads(clean)
            return data
        except json.JSONDecodeError as e2:
            raise ValueError(f'解析JSON失败: {js_file}, error={e2}')

def sync_one(name, js_file, json_file):
    """同步一个数据库的JS→JSON"""
    if not os.path.exists(js_file):
        print(f'[WARN] {name}: JS文件不存在 {js_file}')
        return False
    
    try:
        data = js_to_json(js_file)
        
        # 保存为JSON
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        tables_count = len(data.get('tables', []))
        update_time = data.get('update_time', '?')
        print(f'[成功] {name}: {js_file} -> {json_file}')
        print(f'  表格数: {tables_count}, update_time: {update_time}')
        return True
    except Exception as e:
        print(f'[ERROR] {name}: 同步失败 - {e}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print('=' * 60)
    print('同步嵌入数据JS → 首页JSON文件')
    print('=' * 60)
    
    success_count = 0
    for name, js_file, json_file in DB_SYNC_MAP:
        print()
        ok = sync_one(name, js_file, json_file)
        if ok:
            success_count += 1
    
    print()
    print('=' * 60)
    print(f'完成: {success_count}/{len(DB_SYNC_MAP)} 个数据库同步成功')
    print('=' * 60)
