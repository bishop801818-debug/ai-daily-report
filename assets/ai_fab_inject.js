// AI 悬浮按钮 - 自动注入脚本
// 将此文件通过 <script src="assets/ai_fab_inject.js"></script> 引入任何页面，
// AI 按钮将自动出现在页面的固定位置。

(function() {
    'use strict';


    // 防止重复注入
    if (document.getElementById('aiFloatWrap')) return;

    // 1. 注入 CSS
    var style = document.createElement('style');
    style.id = 'aiFabStyles';
    style.textContent = /* AI 悬浮按钮 - 注入样式 */
.ai-float-wrap {
    position: fixed;
    bottom: 36px;
    right: 36px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    user-select: none;
    cursor: grab;
    animation: aiFloatIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes aiFloatIn {
    from { opacity: 0; transform: translateY(24px) scale(0.8); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
}
#aiSphere {
    position: relative !important;
    width: 80px !important;
    height: 80px !important;
    border-radius: 50% !important;
    cursor: pointer !important;
    overflow: visible !important;
    background: transparent !important;
    box-shadow: none !important;
    transform-style: flat !important;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}
#aiSphere::before {
    content: '' !important;
    position: absolute !important;
    top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
    border-radius: 50% !important;
    padding: 3px !important;
    background: linear-gradient(135deg, #2d9f6e, #4ecb8a) !important;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0) !important;
    -webkit-mask-composite: xor !important;
    mask-composite: exclude !important;
    pointer-events: none !important;
    z-index: 1 !important;
}
#aiSphere:hover { transform: scale(1.05) !important; }
#gifLayer {
    position: absolute !important;
    top: 3px !important; left: 3px !important;
    width: 74px !important; height: 74px !important;
    border-radius: 50% !important;
    overflow: hidden !important;
    opacity: 1 !important;
    pointer-events: none !important;
    z-index: 2 !important;
}
#gifLayer img {
    width: 100% !important; height: 100% !important;
    object-fit: cover !important; display: block !important;
}
.ai-float-wrap:hover #aiTooltip {
    opacity: 1;
    transform: translateX(-50%) scale(1);
}
#aiTooltip {
    position: absolute;
    top: -44px;
    left: 50%;
    transform: translateX(-50%) scale(0.7);
    background: linear-gradient(135deg, #0AA66A, #0d7a4a);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    font-family: "Microsoft YaHei", sans-serif;
    padding: 6px 16px;
    border-radius: 18px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 4px 16px rgba(10,166,106,0.45);
    z-index: 10000;
}
#aiTooltip::after {
    content: '';
    position: absolute;
    bottom: -7px;
    left: 50%;
    transform: translateX(-50%);
    width: 0; height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid #0d7a4a;
}
.ai-float-label {
    font-family: "Microsoft YaHei", sans-serif !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    color: #fff !important;
    background: linear-gradient(135deg, #2d9f6e, #4ecb8a) !important;
    padding: 3px 12px !important;
    border-radius: 20px !important;
    letter-spacing: 2px !important;
    white-space: nowrap !important;
    box-shadow: 0 3px 12px rgba(45,159,110,0.45) !important;
    text-align: center !important;
    cursor: pointer !important;
    transition: background 0.25s, box-shadow 0.25s, transform 0.25s !important;
}
.ai-float-label:hover {
    background: linear-gradient(135deg, #268a5c, #3db87a) !important;
    box-shadow: 0 5px 18px rgba(45,159,110,0.65) !important;
}
@media (max-width: 640px) {
    .ai-float-wrap { bottom: 20px !important; right: 20px !important; }
    #aiSphere { width: 64px !important; height: 64px !important; }
    #gifLayer { width: 58px !important; height: 58px !important; top: 3px !important; left: 3px !important; }
}
/* ===== AI 助手对话框 ===== */
#aiChatDialog {
    position: fixed;
    bottom: 130px;
    right: 24px;
    width: 360px;
    max-height: 480px;
    background: rgba(248,255,251,0.92);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 18px;
    box-shadow:
        0 8px 32px rgba(0,0,0,0.18),
        0 2px 8px rgba(0,0,0,0.10),
        0 0 0 1px rgba(0,125,78,0.15);
    z-index: 10001;
    display: none;
    flex-direction: column;
    overflow: hidden;
    font-family: "Microsoft YaHei", "微软雅黑", 'PingFang SC', sans-serif;
    animation: aiDialogIn 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
#aiChatDialog.open { display: flex; }
@keyframes aiDialogIn {
    from { opacity: 0; transform: translateY(20px) scale(0.92); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
}
.ai-dialog-header {
    display: flex;
    align-items: center;
    padding: 14px 16px;
    background: linear-gradient(135deg, #007D4E 0%, #007D4E 100%);
    color: #fff;
    gap: 12px;
    flex-shrink: 0;
}
.ai-dialog-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255,255,255,0.6);
    flex-shrink: 0;
}
.ai-dialog-info { flex: 1; min-width: 0; }
.ai-dialog-name { font-size: 15px; font-weight: 700; line-height: 1.3; }
.ai-dialog-status { font-size: 11px; opacity: 0.85; line-height: 1.4; }
.ai-dialog-close {
    background: rgba(255,255,255,0.22);
    border: none;
    color: #fff;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.2s;
}
.ai-dialog-close:hover { background: rgba(255,255,255,0.38); }
.ai-dialog-messages {
    flex: 1;
    overflow-y: auto;
    padding: 14px 14px 8px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 120px;
    max-height: 280px;
    scroll-behavior: smooth;
}
.ai-msg {
    display: flex;
    gap: 8px;
    align-items: flex-end;
    max-width: 88%;
    animation: aiMsgIn 0.22s ease-out forwards;
}
@keyframes aiMsgIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
}
.ai-msg.user { align-self: flex-end; flex-direction: row-reverse; }
.ai-msg-avatar {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}
.ai-msg-bubble {
    padding: 8px 12px;
    border-radius: 12px;
    font-size: 13px;
    line-height: 1.5;
    word-break: break-word;
}
.ai-msg.assistant .ai-msg-bubble {
    background: rgba(0,125,78,0.08);
    color: #1a1a1a;
    border-bottom-left-radius: 4px;
}
.ai-msg.user .ai-msg-bubble {
    background: linear-gradient(135deg, #007D4E, #007D4E);
    color: #fff;
    border-bottom-right-radius: 4px;
}
.ai-msg-welcome {
    text-align: center;
    font-size: 12px;
    color: #94a3b8;
    padding: 6px 0;
}
.ai-msg-welcome strong { color: #007D4E; display: block; font-size: 13px; margin-bottom: 3px; }
.ai-dialog-input-wrap {
    display: flex;
    gap: 8px;
    padding: 10px 14px 14px;
    border-top: 1px solid #f1f5f9;
    flex-shrink: 0;
}
.ai-dialog-input {
    flex: 1;
    border: 1px solid rgba(0,125,78,0.25);
    border-radius: 12px;
    padding: 8px 12px;
    font-size: 13px;
    font-family: inherit;
    resize: none;
    outline: none;
    min-height: 36px;
    max-height: 80px;
    background: rgba(255,255,255,0.8);
    color: #1a1a1a;
    transition: border-color 0.2s;
}
.ai-dialog-input:focus { border-color: #007D4E; }
.ai-dialog-send {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, #007D4E, #007D4E);
    color: #fff;
    border: none;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.2s, box-shadow 0.2s;
}
.ai-dialog-send:hover { transform: scale(1.08); box-shadow: 0 4px 12px rgba(0,125,78,0.4); }
;
    document.head.appendChild(style);

    // 2. 注入 HTML
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = <div class="ai-float-wrap" id="aiFloatWrap">
    <div class="ai-sphere" id="aiSphere">
        <div id="gifLayer">
            <img id="gifImg" src="" alt="动画" style="width:100%;height:100%;object-fit:cover;display:block;">
        </div>
    </div>
    <div id="aiTooltip">需要帮忙吗？</div>
    <span class="ai-float-label" id="aiFloatLabel">AI龙小蟠</span>
</div>
<div id="aiChatDialog">
    <div class="ai-dialog-header">
        <img class="ai-dialog-avatar" id="aiDialogAvatar" src="" alt="AI">
        <div class="ai-dialog-info">
            <div class="ai-dialog-name">龙蟠AI助手</div>
            <div class="ai-dialog-status">在线 · 随时为您服务</div>
        </div>
        <button class="ai-dialog-close" id="aiChatClose" title="关闭">✕</button>
    </div>
    <div class="ai-dialog-messages" id="aiDialogMsgs">
        <div class="ai-msg-welcome">
            <strong>🐉 龙蟠AI助手</strong><br>
            你好！可以问我任何关于当前页面的问题，或选中一段文字/图表后点击发送，我来帮你解读。
        </div>
    </div>
    <div class="ai-dialog-input-wrap">
        <textarea class="ai-dialog-input" id="aiChatInput" placeholder="输入问题，或选中页面内容后发送..." rows="1"></textarea>
        <button class="ai-dialog-send" id="aiChatSend" title="发送">➤</button>
    </div>
</div>;
    while (tempDiv.firstChild) {
        document.body.appendChild(tempDiv.firstChild);
    }

    // 3. 设置图片路径
    var gifImg = document.getElementById('gifImg');
    var avatarImg = document.getElementById('aiDialogAvatar');
    if (gifImg) gifImg.src = 'assets/dragon_4combined_anim.gif';
    if (avatarImg) avatarImg.src = 'assets/dragon_4combined_hover_static.png';

    // 4. 初始化逻辑
    initAiFab();

    function initAiFab() {
        var wrap = document.getElementById('aiFloatWrap');
        var sphere = document.getElementById('aiSphere');
        var tooltip = document.getElementById('aiTooltip');
        var dialog = document.getElementById('aiChatDialog');
        var chatClose = document.getElementById('aiChatClose');
        var chatInput = document.getElementById('aiChatInput');
        var chatSend = document.getElementById('aiChatSend');
        var chatMsgs = document.getElementById('aiDialogMsgs');

        if (!wrap || !sphere) { console.error('[AI FAB] Required elements not found'); return; }

        // 位置记忆
        try {
            var saved = JSON.parse(localStorage.getItem('aiBtnPos'));
            if (saved && saved.x !== undefined && saved.y !== undefined) {
                wrap.style.left = saved.x + 'px';
                wrap.style.top = saved.y + 'px';
                wrap.style.bottom = 'auto';
                wrap.style.right = 'auto';
            }
        } catch(e) {}

        // 拖拽逻辑
        var isDragging = false;
        var dragStartX, dragStartY, elStartX, elStartY;

        sphere.addEventListener('mousedown', function(e) {
            isDragging = true;
            wrap.classList.add('dragging');
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            elStartX = wrap.offsetLeft;
            elStartY = wrap.offsetTop;
            e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            var dx = e.clientX - dragStartX;
            var dy = e.clientY - dragStartY;
            var newX = elStartX + dx;
            var newY = elStartY + dy;
            newX = Math.max(0, Math.min(newX, window.innerWidth - wrap.offsetWidth));
            newY = Math.max(0, Math.min(newY, window.innerHeight - wrap.offsetHeight));
            wrap.style.left = newX + 'px';
            wrap.style.top = newY + 'px';
            wrap.style.bottom = 'auto';
            wrap.style.right = 'auto';
        });

        document.addEventListener('mouseup', function() {
            if (!isDragging) return;
            isDragging = false;
            wrap.classList.remove('dragging');
            try {
                localStorage.setItem('aiBtnPos', JSON.stringify({ x: wrap.offsetLeft, y: wrap.offsetTop }));
            } catch(e) {}
        });

        // 悬停：GIF暂停（显示静态图）
        var STATIC_SRC = 'assets/dragon_4combined_hover_static.png';
        sphere.addEventListener('mouseenter', function() {
            var gif = document.getElementById('gifImg');
            if (gif) {
                gif.style.opacity = '0';
                var staticImg = document.getElementById('staticHoverImg');
                if (!staticImg) {
                    staticImg = document.createElement('img');
                    staticImg.id = 'staticHoverImg';
                    staticImg.src = STATIC_SRC;
                    staticImg.style.cssText = 'position:absolute;top:3px;left:3px;width:74px;height:74px;border-radius:50%;object-fit:cover;display:block;z-index:3;';
                    sphere.appendChild(staticImg);
                } else {
                    staticImg.style.display = 'block';
                }
            }
        });

        sphere.addEventListener('mouseleave', function() {
            var gif = document.getElementById('gifImg');
            if (gif) gif.style.opacity = '1';
            var staticImg = document.getElementById('staticHoverImg');
            if (staticImg) staticImg.style.display = 'none';
        });

        // 点击：打开/关闭对话框
        sphere.addEventListener('click', function(e) {
            if (isDragging) return;
            if (dialog) dialog.classList.toggle('open');
        });

        if (chatClose && dialog) {
            chatClose.addEventListener('click', function(e) {
                e.stopPropagation();
                dialog.classList.remove('open');
            });
        }

        // 发送消息
        function sendMessage() {
            var text = chatInput ? chatInput.value.trim() : '';
            if (!text || !chatMsgs) return;

            var userMsg = document.createElement('div');
            userMsg.className = 'ai-msg user';
            userMsg.innerHTML = '<div class="ai-msg-bubble">' + text.replace(/</g,'<').replace(/>/g,'>') + '</div>';
            chatMsgs.appendChild(userMsg);
            chatInput.value = '';
            chatMsgs.scrollTop = chatMsgs.scrollHeight;

            // 模拟AI回复
            setTimeout(function() {
                var aiMsg = document.createElement('div');
                aiMsg.className = 'ai-msg assistant';
                aiMsg.innerHTML = '<div class="ai-msg-bubble">感谢您的提问！此功能需要接入后端API才能正式回复。</div>';
                chatMsgs.appendChild(aiMsg);
                chatMsgs.scrollTop = chatMsgs.scrollHeight;
            }, 500);
        }

        if (chatSend) {
            chatSend.addEventListener('click', sendMessage);
        }
        if (chatInput) {
            chatInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }
    }
})();
