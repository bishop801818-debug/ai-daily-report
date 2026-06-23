/**
 * 飞书 JSAPI 免登集成（方案 C）
 * 适用于在飞书客户端内打开的页面（妙搭应用）
 * 无需弹窗授权，自动获取用户身份
 */

// ============ 配置区域 ============
const FEISHU_JS_CONFIG = {
    // 后端服务地址（需要公网可访问）
    // 开发环境：使用内网穿透地址（如 ngrok）
    // 生产环境：使用云函数地址
    backendUrl: 'http://localhost:5000',  // 开发环境
    
    // 飞书应用信息
    appId: 'cli_aab2066784b85bcf'
};

// ============ JSAPI 初始化 ============

/**
 * 加载飞书 JSAPI SDK
 */
function loadFeishuJSSDK() {
    return new Promise((resolve, reject) => {
        if (window.tt) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://lf1-cdn-tos.bytecdntp.com/obj/eden-cn/ptlheh7vho/ljhwZthlaukjlkulzlp/jssdk.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('加载飞书 JSAPI SDK 失败'));
        document.head.appendChild(script);
    });
}

/**
 * 初始化飞书 JSAPI
 */
async function initFeishuJSAPI() {
    try {
        // 1. 加载 JSAPI SDK
        await loadFeishuJSSDK();
        
        // 2. 初始化 JSAPI
        return new Promise((resolve, reject) => {
            window.tt.ready(() => {
                console.log('[飞书JSAPI] 初始化成功');
                resolve();
            });
            
            window.tt.error((err) => {
                console.error('[飞书JSAPI] 初始化失败:', err);
                reject(err);
            });
        });
    } catch (err) {
        console.error('[飞书JSAPI] 加载失败:', err);
        throw err;
    }
}

// ============ 免登流程 ============

/**
 * 使用 JSAPI 获取用户身份（免登）
 */
async function feishuSilentLogin() {
    try {
        console.log('[飞书免登] 开始免登流程...');
        
        // 1. 获取 auth code
        const authCode = await getFeishuAuthCode();
        console.log('[飞书免登] 获取 auth code 成功');
        
        // 2. 发送到后端交换用户信息
        const userInfo = await exchangeAuthCode(authCode);
        console.log('[飞书免登] 获取用户信息成功:', userInfo);
        
        // 3. 保存到 localStorage
        saveFeishuUserInfo(userInfo);
        
        // 4. 更新 UI
        updateFeishuUI();
        
        // 5. 应用权限
        applyFeishuPermission(userInfo.matched_bu);
        
        return userInfo;
    } catch (err) {
        console.error('[飞书免登] 失败:', err);
        throw err;
    }
}

/**
 * 获取飞书 auth code
 */
function getFeishuAuthCode() {
    return new Promise((resolve, reject) => {
        if (!window.tt) {
            reject(new Error('飞书 JSAPI 未加载'));
            return;
        }
        
        window.tt.getAuthCode({
            appId: FEISHU_JS_CONFIG.appId,
            success: (res) => {
                resolve(res.code);
            },
            fail: (err) => {
                reject(new Error(`获取 auth code 失败: ${JSON.stringify(err)}`));
            }
        });
    });
}

/**
 * 交换 auth code 为用户信息
 */
async function exchangeAuthCode(authCode) {
    const response = await fetch(`${FEISHU_JS_CONFIG.backendUrl}/feishu/callback`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({code: authCode})
    });
    
    const data = await response.json();
    
    if (data.code !== 0) {
        throw new Error(data.msg || '交换 auth code 失败');
    }
    
    // 后端返回的用户信息
    return {
        user_id: data.data.user_id,
        matched_bu: data.data.matched_bu,
        matched_dept_name: data.data.matched_dept_name,
        auth_time: new Date().toISOString()
    };
}

/**
 * 保存飞书用户信息到 localStorage
 */
function saveFeishuUserInfo(userInfo) {
    localStorage.setItem('feishu_user_info', JSON.stringify(userInfo));
    // 同时设置 user_bu_permission 以便现有逻辑工作
    if (userInfo.matched_bu) {
        localStorage.setItem('user_bu_permission', userInfo.matched_bu);
    }
}

/**
 * 获取已保存的飞书用户信息
 */
function getFeishuUserInfo() {
    const userInfoStr = localStorage.getItem('feishu_user_info');
    if (userInfoStr) {
        try {
            return JSON.parse(userInfoStr);
        } catch (e) {
            return null;
        }
    }
    return null;
}

/**
 * 应用飞书权限（过滤事业部卡片）
 */
function applyFeishuPermission(matchedBu) {
    if (!matchedBu) {
        console.log('[飞书权限] 未匹配到事业部，显示默认权限');
        return;
    }
    
    console.log('[飞书权限] 应用权限:', matchedBu);
    
    // 设置 user_bu_permission
    localStorage.setItem('user_bu_permission', matchedBu);
    
    // 重新加载页面以应用权限
    // 或者动态过滤事业部卡片（更优雅）
    filterBUCards(matchedBu);
}

/**
 * 动态过滤事业部卡片
 */
function filterBUCards(allowedBu) {
    // 新能源事业部
    const pentagon = document.getElementById('pentagon-wrap');
    if (pentagon) {
        const allCards = pentagon.querySelectorAll('[id^="bu-card-"]');
        allCards.forEach(card => {
            const buId = card.id.replace('bu-card-', '');
            if (buId !== allowedBu && allowedBu !== 'all') {
                card.style.display = 'none';
            }
        });
    }
    
    // 化学品事业部
    const chemContainer = document.getElementById('chemical-cards');
    if (chemContainer) {
        const allCards = chemContainer.querySelectorAll('[id^="bu-card-"]');
        allCards.forEach(card => {
            const buId = card.id.replace('bu-card-', '');
            if (buId !== allowedBu && allowedBu !== 'all') {
                card.style.display = 'none';
            }
        });
    }
    
    // 氢能事业部
    const hydroContainer = document.getElementById('hydrogen-cards');
    if (hydroContainer) {
        const allCards = hydroContainer.querySelectorAll('[id^="bu-card-"]');
        allCards.forEach(card => {
            const buId = card.id.replace('bu-card-', '');
            if (buId !== allowedBu && allowedBu !== 'all') {
                card.style.display = 'none';
            }
        });
    }
}

// ============ UI 更新 ============

/**
 * 更新页面上的飞书用户信息显示
 */
function updateFeishuUI() {
    const userInfo = getFeishuUserInfo();
    const feishuStatusEl = document.getElementById('feishu-status');
    
    if (feishuStatusEl) {
        if (userInfo && userInfo.matched_bu) {
            const buName = getBUName(userInfo.matched_bu);
            feishuStatusEl.innerHTML = `
                <div class="feishu-user-info">
                    <span class="feishu-icon">✅</span>
                    <span class="feishu-text">已认证: ${buName}</span>
                    <button class="feishu-logout-btn" onclick="logoutFeishu()">切换</button>
                </div>
            `;
        } else {
            feishuStatusEl.innerHTML = `
                <button class="feishu-login-btn" onclick="startFeishuSilentLogin()">
                    <span class="feishu-icon">🔐</span>
                    飞书自动登录
                </button>
            `;
        }
    }
}

/**
 * 获取事业部名称
 */
function getBUName(buId) {
    const BU_NAMES = {
        'czly': '常州锂源',
        'sdmd': '山东美多',
        'sjld': '三金锂电',
        'lpsd': '龙蟠时代',
        'fnlt': '法恩莱特',
        'kls': '可兰素',
        'lube': '润滑油',
        'dkhx': '迪克化学',
        'bych': '铂源催化'
    };
    return BU_NAMES[buId] || buId;
}

// ============ 主动登录 ============

/**
 * 开始飞书免登（手动触发）
 */
async function startFeishuSilentLogin() {
    try {
        showFeishuLoading(true);
        
        // 检查是否在飞书客户端内
        if (!isInFeishuClient()) {
            alert('请在飞书客户端内打开此页面');
            showFeishuLoading(false);
            return;
        }
        
        // 执行免登
        await feishuSilentLogin();
        
        showFeishuLoading(false);
        alert('登录成功！');
        
        // 重新加载页面
        location.reload();
    } catch (err) {
        console.error('[飞书登录] 失败:', err);
        showFeishuLoading(false);
        alert('登录失败: ' + err.message);
    }
}

/**
 * 检查是否在飞书客户端内
 */
function isInFeishuClient() {
    return navigator.userAgent.includes('Lark') || 
           navigator.userAgent.includes('Feishu') ||
           typeof window.tt !== 'undefined';
}

/**
 * 退出飞书登录
 */
function logoutFeishu() {
    localStorage.removeItem('feishu_user_info');
    localStorage.removeItem('user_bu_permission');
    location.reload();
}

/**
 * 显示/隐藏加载状态
 */
function showFeishuLoading(show) {
    const loadingEl = document.getElementById('feishu-loading');
    if (loadingEl) {
        loadingEl.style.display = show ? 'block' : 'none';
    }
}

// ============ 自动登录 ============

/**
 * 页面加载时尝试自动登录
 */
async function autoFeishuLogin() {
    // 1. 检查是否已经登录
    const userInfo = getFeishuUserInfo();
    if (userInfo && userInfo.matched_bu) {
        console.log('[飞书免登] 已登录:', userInfo);
        updateFeishuUI();
        return;
    }
    
    // 2. 检查是否在飞书客户端内
    if (!isInFeishuClient()) {
        console.log('[飞书免登] 不在飞书客户端内，跳过自动登录');
        updateFeishuUI();
        return;
    }
    
    // 3. 尝试自动登录
    try {
        await initFeishuJSAPI();
        await feishuSilentLogin();
    } catch (err) {
        console.log('[飞书免登] 自动登录失败（可能是首次访问）:', err.message);
        updateFeishuUI();
    }
}

// ============ 初始化 ============

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 延迟执行，确保其他脚本已加载
    setTimeout(() => {
        autoFeishuLogin();
    }, 1000);
});

// 导出函数供全局使用
window.startFeishuSilentLogin = startFeishuSilentLogin;
window.logoutFeishu = logoutFeishu;
window.getFeishuUserInfo = getFeishuUserInfo;
