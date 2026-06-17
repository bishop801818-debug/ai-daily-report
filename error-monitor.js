/**
 * 自动错误收集与记录系统
 * 功能：
 * 1. 自动捕获所有JS错误、网络错误、Promise错误
 * 2. 记录错误详情（时间、类型、堆栈、解决建议）
 * 3. 提供错误查看和分析界面
 * 4. 支持错误导出（JSON/CSV）
 * 
 * 使用方法：
 * 1. 在首页 <head> 中引入此文件：<script src="error-monitor.js?v=20260617"></script>
 * 2. 错误会自动记录到 localStorage
 * 3. 访问 error-viewer.html 查看所有错误
 */

(function() {
    'use strict';
    
    // ============ 配置区域 ============
    const CONFIG = {
        storageKey: 'homepage_error_logs',  // localStorage 键名
        maxLogs: 500,                        // 最多保存的错误数量
        enableConsoleOverride: true,           // 是否重写 console.error
        enableNetworkMonitor: true,             // 是否监控网络请求
        enableAutoReporting: false,            // 是否自动上报（需要后端支持）
        reportUrl: 'http://localhost:5000/api/error-report' // 上报地址
    };
    
    // ============ 错误类型定义 ============
    const ERROR_TYPES = {
        JS_ERROR: 'JavaScript错误',
        PROMISE_ERROR: 'Promise未捕获错误',
        NETWORK_ERROR: '网络请求错误',
        RESOURCE_ERROR: '资源加载错误',
        DATA_ERROR: '数据解析错误',
        RENDER_ERROR: '图表渲染错误',
        API_ERROR: 'API调用错误',
        UNKNOWN_ERROR: '未知错误'
    };
    
    // ============ 错误解决建议库 ============
    const ERROR_SOLUTIONS = {
        'Failed to load resource': '检查文件路径是否正确，文件是否存在',
        'Unexpected end of input': 'JS文件可能未完整加载，检查文件语法错误或网络中断',
        'is not a function': '调用了不存在的函数，检查函数名拼写或函数定义',
        'Cannot read properties of null': '尝试读取null对象的属性，检查DOM元素是否存在',
        'Cannot read properties of undefined': '尝试读取undefined对象的属性，检查数据是否为空',
        'fetch failed': '网络请求失败，检查网络连接或API地址是否正确',
        'ERR_CONNECTION_REFUSED': '无法连接到服务器，检查服务器是否启动',
        '401 Client Error': 'API密钥无效或已过期，检查.env配置',
        '404 Not Found': '请求的资源不存在，检查URL路径是否正确',
        'chart is not a function': 'ECharts未正确加载，检查echarts.min.js是否引入',
        'defaultOption is not defined': '缺少图表配置，检查mkBarOpt/mkLineOpt函数定义'
    };
    
    // ============ 核心功能 ============
    
    /**
     * 获取解决建议
     */
    function getSolution(errorMsg) {
        for (const [key, solution] of Object.entries(ERROR_SOLUTIONS)) {
            if (errorMsg && errorMsg.includes(key)) {
                return solution;
            }
        }
        return '暂无自动解决建议，请查看错误堆栈或联系开发者';
    }
    
    /**
     * 记录错误到 localStorage
     */
    function logError(errorInfo) {
        try {
            // 添加时间戳和唯一ID
            errorInfo.id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            errorInfo.timestamp = new Date().toISOString();
            errorInfo.userAgent = navigator.userAgent;
            errorInfo.url = window.location.href;
            
            // 获取现有日志
            let logs = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]');
            
            // 添加新日志
            logs.push(errorInfo);
            
            // 限制日志数量
            if (logs.length > CONFIG.maxLogs) {
                logs = logs.slice(-CONFIG.maxLogs);
            }
            
            // 保存回 localStorage
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(logs));
            
            // 可选：自动上报到后端
            if (CONFIG.enableAutoReporting) {
                reportErrorToServer(errorInfo);
            }
            
            // 在控制台显示错误提示
            if (errorInfo.type !== 'console.error') {
                console.warn(`[错误监控] ${errorInfo.type}: ${errorInfo.message}`);
            }
            
        } catch (e) {
            // 避免递归：使用原始console.error（如果存在）
            if (console.error._original) {
                console.error._original('[错误监控] 保存日志失败:', e);
            }
        }
    }
    
    /**
     * 上报错误到后端（可选）
     */
    function reportErrorToServer(errorInfo) {
        if (!CONFIG.reportUrl) return;
        
        fetch(CONFIG.reportUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(errorInfo)
        }).catch(e => {
            console.error('[错误监控] 上报失败:', e);
        });
    }
    
    /**
     * 重写 console.error 来捕获所有 console.error 调用
     */
    function overrideConsoleError() {
        const originalConsoleError = console.error;
        let isLogging = false;  // 防递归标志
        
        console.error = function(...args) {
            // 调用原始 console.error
            originalConsoleError.apply(console, args);
            
            // 如果正在记录错误，避免递归
            if (isLogging) {
                return;
            }
            
            // 设置标志，防止递归
            isLogging = true;
            
            try {
                // 记录错误
                const message = args.map(arg => {
                    if (typeof arg === 'object') {
                        try {
                            return JSON.stringify(arg);
                        } catch (e) {
                            return String(arg);
                        }
                    }
                    return String(arg);
                }).join(' ');
                
                // 判断错误类型
                let type = ERROR_TYPES.API_ERROR;
                if (message.includes('[loadReport]')) type = ERROR_TYPES.DATA_ERROR;
                if (message.includes('[render') || message.includes('Chart')) type = ERROR_TYPES.RENDER_ERROR;
                if (message.includes('fetch') || message.includes('请求')) type = ERROR_TYPES.NETWORK_ERROR;
                
                logError({
                    type: 'console.error',
                    category: type,
                    message: message,
                    stack: new Error().stack,
                    solution: getSolution(message)
                });
            } finally {
                // 清除标志
                isLogging = false;
            }
        };
        
        // 保存原始函数以便恢复
        console.error._original = originalConsoleError;
    }
    
    /**
     * 捕获全局JS错误
     */
    function captureJSErrors() {
        window.addEventListener('error', function(event) {
            const error = event.error || {};
            
            logError({
                type: 'window.onerror',
                category: ERROR_TYPES.JS_ERROR,
                message: error.message || '未知JS错误',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: error.stack || '无堆栈信息',
                solution: getSolution(error.message)
            });
        });
    }
    
    /**
     * 捕获Promise未处理错误
     */
    function capturePromiseErrors() {
        window.addEventListener('unhandledrejection', function(event) {
            const reason = event.reason || {};
            
            logError({
                type: 'unhandledrejection',
                category: ERROR_TYPES.PROMISE_ERROR,
                message: reason.message || String(reason),
                stack: reason.stack || '无堆栈信息',
                solution: getSolution(reason.message)
            });
        });
    }
    
    /**
     * 监控网络请求错误
     */
    function monitorNetworkErrors() {
        // 监控 fetch 请求
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            return originalFetch.apply(this, args)
                .then(response => {
                    if (!response.ok) {
                        logError({
                            type: 'fetch',
                            category: ERROR_TYPES.NETWORK_ERROR,
                            message: `HTTP ${response.status}: ${response.statusText}`,
                            url: args[0],
                            solution: getSolution(response.statusText)
                        });
                    }
                    return response;
                })
                .catch(error => {
                    logError({
                        type: 'fetch',
                        category: ERROR_TYPES.NETWORK_ERROR,
                        message: `fetch失败: ${error.message}`,
                        url: args[0],
                        stack: error.stack,
                        solution: getSolution(error.message)
                    });
                    throw error;
                });
        };
        
        // 监控 XMLHttpRequest
        const originalXHR = window.XMLHttpRequest;
        window.XMLHttpRequest = function() {
            const xhr = new originalXHR();
            const originalSend = xhr.send;
            
            xhr.send = function(...args) {
                xhr.addEventListener('error', function() {
                    logError({
                        type: 'XHR',
                        category: ERROR_TYPES.NETWORK_ERROR,
                        message: 'XHR请求失败',
                        url: xhr.responseURL,
                        solution: '检查网络连接或API地址'
                    });
                });
                
                xhr.addEventListener('load', function() {
                    if (xhr.status >= 400) {
                        logError({
                            type: 'XHR',
                            category: ERROR_TYPES.NETWORK_ERROR,
                            message: `XHR ${xhr.status}: ${xhr.statusText}`,
                            url: xhr.responseURL,
                            solution: getSolution(xhr.statusText)
                        });
                    }
                });
                
                return originalSend.apply(xhr, args);
            };
            
            return xhr;
        };
    }
    
    /**
     * 监控资源加载错误
     */
    function monitorResourceErrors() {
        window.addEventListener('error', function(event) {
            // 过滤掉JS错误（已经在 captureJSErrors 中处理）
            if (event.target && event.target !== window) {
                const target = event.target;
                const src = target.src || target.href || '未知资源';
                
                logError({
                    type: 'resource',
                    category: ERROR_TYPES.RESOURCE_ERROR,
                    message: `资源加载失败: ${src}`,
                    element: target.tagName,
                    url: src,
                    solution: '检查资源路径是否正确，文件是否存在'
                });
            }
        }, true);  // 使用捕获阶段
    }
    
    // ============ 公开API ============
    
    /**
     * 手动记录错误
     */
    window.logCustomError = function(message, category = ERROR_TYPES.UNKNOWN_ERROR, extra = {}) {
        logError({
            type: 'manual',
            category: category,
            message: message,
            extra: extra,
            solution: getSolution(message)
        });
    };
    
    /**
     * 获取所有错误日志
     */
    window.getErrorLogs = function() {
        return JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]');
    };
    
    /**
     * 清空错误日志
     */
    window.clearErrorLogs = function() {
        localStorage.removeItem(CONFIG.storageKey);
        console.log('[错误监控] 错误日志已清空');
    };
    
    /**
     * 导出错误日志为JSON
     */
    window.exportErrorLogs = function(format = 'json') {
        const logs = window.getErrorLogs();
        
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `error-logs-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } else if (format === 'csv') {
            // 转换为CSV格式
            const csvRows = [
                ['ID', '时间', '类型', '分类', '错误消息', '解决建议'].join(',')
            ];
            
            logs.forEach(log => {
                csvRows.push([
                    log.id,
                    log.timestamp,
                    log.type,
                    log.category,
                    `"${(log.message || '').replace(/"/g, '""')}"`,
                    `"${(log.solution || '').replace(/"/g, '""')}"`
                ].join(','));
            });
            
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `error-logs-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };
    
    // ============ 初始化 ============
    
    function init() {
        console.log('[错误监控] 初始化中...');
        
        // 重写 console.error
        if (CONFIG.enableConsoleOverride) {
            overrideConsoleError();
        }
        
        // 捕获全局JS错误
        captureJSErrors();
        
        // 捕获Promise错误
        capturePromiseErrors();
        
        // 监控网络请求
        if (CONFIG.enableNetworkMonitor) {
            monitorNetworkErrors();
        }
        
        // 监控资源加载
        monitorResourceErrors();
        
        console.log('[错误监控] ✅ 初始化完成');
        console.log('[错误监控] 使用说明:');
        console.log('  - 查看日志: getErrorLogs()');
        console.log('  - 清空日志: clearErrorLogs()');
        console.log('  - 导出日志: exportErrorLogs("json") 或 exportErrorLogs("csv")');
        console.log('  - 手动记录: logCustomError("错误消息", "错误分类")');
    }
    
    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
