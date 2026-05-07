# -*- coding: utf-8 -*-
with open('index_v3.html','r',encoding='utf-8') as f:
    content = f.read()
content = content.replace('index_logo_v2.html', 'index_v3.html')
content = content.replace("href='archive.html'", "href='archive_v3.html'")
with open('index_v3.html','w',encoding='utf-8') as f:
    f.write(content)
print('V3 links fixed')
