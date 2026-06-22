/**
 * 飞书 OAuth 登录集成
 * 用于在 dashboard 中实现基于飞书身份的事业部权限控制
 */

// ============ 配置区域 ============
const FEISHU_CONFIG = {
    // 后端服务地址（根据部署环境修改）
    backendUrl: 'http://localhost:5000',
    
    // 生产环境可以改为：
    // backendUrl: 'https://your-backend.herokuapp.com',
    
    // 飞书应用信息（从 .env 文件读取，前端无法直接访问）
    // 这些信息在后端配置，前端只需要调用后端接口
};

// ============ 飞书用户信息管理 ============

/**
 * 获取飞书用户信息
 * @returns {Object|null} 用户信息对象或 null
 */
function getFeishuUserInfo() {
    const userInfoStr = localStorage.getItem('feishu_user_info');
    if (userInfoStr) {
        try {
            return JSON.parse(userInfoStr);
        } catch (e) {
            console.error('[飞书] 解析用户信息失败:', e);
            return null;
        }
    }
    return null;
}

/**
 * 检查用户是否已通过飞书认证
 * @returns {boolean}
 */
function isFeishuAuthenticated() {
    const userInfo = getFeishuUserInfo();
    return userInfo !== null && userInfo.matched_bu !== null;
}

/**
 * 获取飞书认证对应的事业部
 * @returns {string|null}
 */
function getFeishuBU() {
    const userInfo = getFeishuUserInfo();
    if (userInfo && userInfo.matched_bu) {
        return userInfo.matched_bu;
    }
    return null;
}

// ============ 飞书 OAuth 流程 ============

/**
 * 开始飞书授权流程
 */
function startFeishuAuth() {
    // 显示加载提示
    showFeishuLoading(true);
    
    // 调用后端接口获取授权 URL
    fetch(`${FEISHU_CONFIG.backendUrl}/feishu/auth`)
        .then(res => res.json())
        .then(data => {
            if (data.code === 0) {
                const authUrl = data.data.auth_url;
                
                // 打开弹窗进行授权
                const popup = window.open(
                    authUrl,
                    'feishu-auth',
                    'width=600,height=700,menubar=no,toolbar=no,location=no,status=no'
                );
                
                if (!popup) {
                    alert('弹窗被浏览器阻止，请允许弹窗后重试');
                    showFeishuLoading(false);
                }
                
                // 监听弹窗关闭
                const checkPopup = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(checkPopup);
                        
                        // 检查是否授权成功
                        const userInfo = getFeishuUserInfo();
                        if (userInfo) {
                            console.log('[飞书] 授权成功:', userInfo);
                            
                            // 隐藏手动选择弹窗
                            const modal = document.getElementById('bu-select-modal');
                            if (modal) modal.style.display = 'none';
                            
                            // 重新加载页面以应用权限
                            location.reload();
                        } else {
                            console.log('[飞书] 授权未完成');
                            showFeishuLoading(false);
                        }
                    }
                }, 1000);
                
            } else {
                alert('飞书授权失败: ' + data.msg);
                showFeishuLoading(false);
            }
        })
        .catch(err => {
            console.error('[飞书] 授权请求失败:', err);
            alert('飞书授权请求失败，请检查后端服务是否启动');
            showFeishuLoading(false);
        });
}

// ============ UI 辅助函数 ============

/**
 * 显示/隐藏飞书登录加载状态
 * @param {boolean} show
 */
function showFeishuLoading(show) {
    const loadingEl = document.getElementById('feishu-loading');
    if (loadingEl) {
        loadingEl.style.display = show ? 'block' : 'none';
    }
}

/**
 * 更新 UI 显示飞书用户信息
 */
function updateFeishuUI() {
    const userInfo = getFeishuUserInfo();
    const feishuStatusEl = document.getElementById('feishu-status');
    
    if (feishuStatusEl) {
        if (userInfo) {
            const buName = getBUName(userInfo.matched_bu);
            feishuStatusEl.innerHTML = `
                <div class="feishu-user-info">
                    <span class="feishu-icon">✅</span>
                    <span class="feishu-text">已认证: ${buName}</span>
                    <button class="feishu-logout-btn" onclick="logoutFeishu()">切换账号</button>
                </div>
            `;
        } else {
            feishuStatusEl.innerHTML = `
                <button class="feishu-login-btn" onclick="startFeishuAuth()">
                    <span class="feishu-icon">🔐</span>
                    使用飞书账号登录
                </button>
            `;
        }
    }
}

/**
 * 退出飞书登录
 */
function logoutFeishu() {
    localStorage.removeItem('feishu_user_info');
    location.reload();
}

// ============ 权限逻辑修改 ============

/**
 * 重写 getAllowedBUs 函数，优先使用飞书认证
 * 注意：此函数需要在原始定义之后执行
 */
function patchPermissionLogic() {
    // 保存原始函数
    const originalGetAllowedBUs = getAllowedBUs;
    
    // 重写 getAllowedBUs
    window.getAllowedBUs = function() {
        // 优先检查飞书认证
        const feishuBU = getFeishuBU();
        if (feishuBU) {
            console.log('[权限] 使用飞书认证，事业部:', feishuBU);
            return [feishuBU];
        }
        
        // 否则使用原始逻辑
        return originalGetAllowedBUs();
    };
    
    // 重写 init 函数，跳过手动选择弹窗
    const originalInit = window.init;
    if (originalInit) {
        window.init = async function() {
            // 检查飞书认证
            if (isFeishuAuthenticated()) {
                console.log('[权限] 飞书认证已存在，跳过手动选择');
                // 直接执行原始 init 逻辑（但需要跳过显示弹窗的部分）
                // 由于原始 init 函数中会调用 showBUSelectModal()，我们需要修改这部分
                // 这里采用另一种方式：在 init 函数执行前，先设置 user_bu_permission
                const feishuBU = getFeishuBU();
                localStorage.setItem('user_bu_permission', feishuBU);
            }
            
            // 调用原始 init
            await originalInit();
        };
    }
}

// ============ 初始化 ============

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 更新飞书 UI
    updateFeishuUI();
    
    // 修改权限逻辑
    patchPermissionLogic();
    
    // 监听 localStorage 变化（用于跨标签页同步）
    window.addEventListener('storage', function(e) {
        if (e.key === 'feishu_user_info') {
            updateFeishuUI();
        }
    });
});

// 导出函数供全局使用
window.startFeishuAuth = startFeishuAuth;
window.logoutFeishu = logoutFeishu;
window.getFeishuUserInfo = getFeishuUserInfo;
window.isFeishuAuthenticated = isFeishuAuthenticated;
