        function changeFontSize(size) {
            const modalContent = document.querySelector('.modal-content');
            if (!modalContent) return;
            modalContent.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
            modalContent.classList.add(size);
        }
        
        /**
         * 打印早报
         */
        function printReport() {
            const printWindow = window.open('', '_blank');
            const modalTitle = document.getElementById('modalTitle').textContent;
            const modalDate = document.getElementById('modalDate').textContent;
            const modalBody = document.getElementById('modalBody').innerHTML;
            
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${modalTitle} - ${modalDate}</title>
                    <style>
                        body { font-family: 'Microsoft YaHei', sans-serif; padding: 40px; }
                        h1 { color: #1e3c72; border-bottom: 2px solid #1e3c72; padding-bottom: 10px; }
                        .date { color: #666; margin-bottom: 20px; }
                        .section { margin-bottom: 25px; }
                        .section-title { color: #1e3c72; font-size: 18px; font-weight: bold; margin-bottom: 12px; }
                        .item { background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 10px; }
                        .item-title { font-weight: bold; margin-bottom: 6px; }
                        .item-content { color: #666; line-height: 1.6; }
                    </style>
                </head>
                <body>
                    <h1>${modalTitle}</h1>
                    <div class="date">${modalDate}</div>
                    ${modalBody}
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
        
        /**
         * 导出早报
         */
        function exportReport() {
            const modalTitle = document.getElementById('modalTitle').textContent;
            const modalDate = document.getElementById('modalDate').textContent;
            const modalBody = document.getElementById('modalBody');
            
            // 简单实现：导出为文本
            let text = `${modalTitle}\n${modalDate}\n\n`;
            const sections = modalBody.querySelectorAll('.report-section');
            sections.forEach(section => {
                const title = section.querySelector('.report-section-title');
                if (title) {
                    text += `\n${title.textContent.trim()}\n`;
                    text += '='.repeat(50) + '\n';
                }
                const items = section.querySelectorAll('.report-item');
                items.forEach(item => {
                    const itemTitle = item.querySelector('.report-item-title');
                    const itemContent = item.querySelector('.report-item-content');
                    if (itemTitle) {
                        text += `\n• ${itemTitle.textContent.trim()}\n`;
                    }
                    if (itemContent) {
                        text += `  ${itemContent.textContent.trim()}\n`;
                    }
                });
            });
            
            // 创建下载
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${modalTitle.replace('事业部早报', '')}_早报_${new Date().toISOString().slice(0,10)}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            
            alert('导出成功！文件已下载到本地。');
        }
        
        /**
         * 分享早报
         */
        function shareReport() {
            const modalTitle = document.getElementById('modalTitle').textContent;
            const modalDate = document.getElementById('modalDate').textContent;
            const shareUrl = window.location.href;
            
            // 尝试使用系统分享 API
            if (navigator.share) {
                navigator.share({
                    title: modalTitle,
                    text: `${modalTitle} - ${modalDate}`,
                    url: shareUrl
                }).catch(console.error);
            } else {
                // 降级方案：复制链接
                navigator.clipboard.writeText(`${modalTitle} - ${modalDate}\n${shareUrl}`);
                alert('链接已复制到剪贴板，可以分享给他人了！');
            }
        }
        
        // 历史日历月份状态（默认历史数据月份：April 2026）