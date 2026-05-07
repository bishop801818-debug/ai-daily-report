import fitz  # PyMuPDF
import pandas as pd
from pandas import ExcelWriter

def extract_all_tables(pdf_path):
    """从 PDF 中提取所有表格"""
    doc = fitz.open(pdf_path)
    all_tables = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        tables = page.find_tables()
        
        for table in tables:
            table_data = table.extract()
            if table_data:
                # 获取表格的文本内容用于识别
                table_text = '\n'.join([''.join([str(cell) if cell else '' for cell in row]) for row in table_data if row])
                all_tables.append({
                    'page': page_num + 1,
                    'data': table_data,
                    'text': table_text
                })
    
    doc.close()
    return all_tables

def identify_table_type(table_text):
    """识别表格类型"""
    # 资产负债表特征
    balance_keywords = ['资产负债表', '流动资产', '非流动资产', '流动负债', '非流动负债', '所有者权益', '资产总计', '负债和所有者权益']
    # 利润表特征
    income_keywords = ['利润表', '营业收入', '营业成本', '税金及附加', '销售费用', '管理费用', '研发费用', '财务费用', '营业利润', '利润总额', '净利润']
    # 现金流量表特征
    cash_keywords = ['现金流量表', '销售商品', '提供劳务', '经营活动', '投资活动', '筹资活动', '现金流入', '现金流出', '现金净增加额']
    
    balance_score = sum(1 for kw in balance_keywords if kw in table_text)
    income_score = sum(1 for kw in income_keywords if kw in table_text)
    cash_score = sum(1 for kw in cash_keywords if kw in table_text)
    
    if balance_score >= 2:
        return 'balance'
    elif income_score >= 2:
        return 'income'
    elif cash_score >= 2:
        return 'cash'
    return 'unknown'

def clean_table_data(table_data):
    """清理表格数据"""
    cleaned = []
    for row in table_data:
        if row and any(cell and str(cell).strip() for cell in row):
            cleaned_row = [str(cell).strip() if cell is not None else '' for cell in row]
            cleaned.append(cleaned_row)
    return cleaned

def create_excel(balance_data, income_data, cash_data, output_path):
    """创建 Excel 文件"""
    with ExcelWriter(output_path, engine='openpyxl') as writer:
        # 资产负债表
        if balance_data:
            df_balance = pd.DataFrame(clean_table_data(balance_data))
            df_balance.to_excel(writer, sheet_name='资产负债表', index=False, header=False)
        
        # 利润表
        if income_data:
            df_income = pd.DataFrame(clean_table_data(income_data))
            df_income.to_excel(writer, sheet_name='利润表', index=False, header=False)
        
        # 现金流量表
        if cash_data:
            df_cash = pd.DataFrame(clean_table_data(cash_data))
            df_cash.to_excel(writer, sheet_name='现金流量表', index=False, header=False)
    
    print(f"Excel 文件已保存到：{output_path}")

def main():
    pdf_path = r"C:\Users\1\Desktop\天赐材料年报.pdf"
    output_path = r"d:\trae\AI Daily report\天赐材料财务报表.xlsx"
    
    print("正在提取所有表格...")
    all_tables = extract_all_tables(pdf_path)
    print(f"共找到 {len(all_tables)} 个表格")
    
    balance_data = []
    income_data = []
    cash_data = []
    
    for i, table in enumerate(all_tables):
        table_type = identify_table_type(table['text'])
        print(f"表格 {i+1} (第{table['page']}页): {table_type}")
        
        if table_type == 'balance':
            balance_data.extend(table['data'])
        elif table_type == 'income':
            income_data.extend(table['data'])
        elif table_type == 'cash':
            cash_data.extend(table['data'])
    
    print(f"\n资产负债表行数：{len(balance_data)}")
    print(f"利润表行数：{len(income_data)}")
    print(f"现金流量表行数：{len(cash_data)}")
    
    if balance_data or income_data or cash_data:
        create_excel(balance_data, income_data, cash_data, output_path)
    else:
        print("未找到财务报表表格")

if __name__ == "__main__":
    main()
