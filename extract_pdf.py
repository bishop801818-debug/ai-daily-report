import pdfplumber
import os
from pathlib import Path

# PDF 文件夹路径
pdf_folder = r"C:\Users\1\Desktop\法恩莱特\0413\撬装工厂"

# 输出文件夹路径
output_folder = r"d:\trae\AI Daily report\pdf_texts"
os.makedirs(output_folder, exist_ok=True)

# 获取所有 PDF 文件
pdf_files = [f for f in os.listdir(pdf_folder) if f.endswith('.pdf')]

print(f"找到 {len(pdf_files)} 个 PDF 文件")
print("=" * 80)

for pdf_file in pdf_files:
    pdf_path = os.path.join(pdf_folder, pdf_file)
    print(f"\n正在处理：{pdf_file}")
    print("-" * 80)
    
    # 提取的文本输出文件
    text_file = os.path.join(output_folder, pdf_file.replace('.pdf', '.txt'))
    
    all_text = []
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"总页数：{len(pdf.pages)}")
            
            for i, page in enumerate(pdf.pages, 1):
                try:
                    text = page.extract_text()
                    if text:
                        all_text.append(f"\n--- 第 {i} 页 ---\n")
                        all_text.append(text)
                    
                    if i % 5 == 0:
                        print(f"已处理 {i}/{len(pdf.pages)} 页")
                except Exception as page_error:
                    print(f"第 {i} 页提取失败：{str(page_error)}")
                    all_text.append(f"\n--- 第 {i} 页 (提取失败) ---\n")
        
        # 保存提取的文本
        with open(text_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(all_text))
        
        print(f"\n[OK] 提取完成，已保存到：{text_file}")
        
        # 显示前 1000 个字符作为预览
        if all_text:
            preview = ''.join(all_text)[:1000]
            print(f"\n内容预览（前 1000 字符）:")
            print(preview)
            print("...")
    
    except Exception as e:
        print(f"[ERROR] 处理失败：{str(e)}")
    
    print("=" * 80)

print(f"\n所有 PDF 文件处理完成！提取的文本保存在：{output_folder}")
