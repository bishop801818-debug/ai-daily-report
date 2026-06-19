(function() {
    // Prevent double injection
    if (document.getElementById('aiFloatWrap')) return;

    // Inject CSS
    var style = document.createElement('style');
    style.textContent = `/* AI Floating Button - Injected Styles */
.ai-float-wrap {
    position: fixed !important;
    bottom: 36px !important;
    right: 36px !important;
    z-index: 9999 !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    gap: 6px !important;
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
    content: "" !important;
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
#aiTooltip {
    position: absolute;
    top: -44px; left: 50%;
    transform: translateX(-50%) scale(0.7);
    background: linear-gradient(135deg, #0AA66A, #0d7a4a);
    color: #fff; font-size: 13px; font-weight: 600;
    font-family: "Microsoft YaHei", sans-serif;
    padding: 6px 16px; border-radius: 18px;
    white-space: nowrap; pointer-events: none;
    opacity: 0; transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 4px 16px rgba(10,166,106,0.45);
    z-index: 10000;
}
#aiTooltip::after {
    content: ""; position: absolute;
    bottom: -7px; left: 50%; transform: translateX(-50%);
    width: 0; height: 0;
    border-left: 8px solid transparent; border-right: 8px solid transparent;
    border-top: 8px solid #0d7a4a;
}
.ai-float-wrap:hover #aiTooltip {
    opacity: 1; transform: translateX(-50%) scale(1);
}
.ai-float-label {
    font-family: "Microsoft YaHei", sans-serif !important;
    font-size: 12px !important; font-weight: 600 !important;
    color: #fff !important;
    background: linear-gradient(135deg, #2d9f6e, #4ecb8a) !important;
    padding: 3px 12px !important; border-radius: 20px !important;
    letter-spacing: 2px !important; white-space: nowrap !important;
    box-shadow: 0 3px 12px rgba(45,159,110,0.45) !important;
    text-align: center !important; cursor: pointer !important;
}
@media (max-width: 640px) {
    .ai-float-wrap { bottom: 20px !important; right: 20px !important; }
    #aiSphere { width: 64px !important; height: 64px !important; }
    #gifLayer { width: 58px !important; height: 58px !important; top: 3px !important; left: 3px !important; }
}
#aiChatDialog {
    position: fixed; bottom: 130px; right: 24px;
    width: 360px; max-height: 480px;
    background: rgba(248,255,251,0.92);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border-radius: 18px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,125,78,0.15);
    z-index: 10001; display: none; flex-direction: column;
    overflow: hidden;
    font-family: "Microsoft YaHei", sans-serif;
    animation: aiDialogIn 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
#aiChatDialog.open { display: flex; }
@keyframes aiDialogIn {
    from { opacity: 0; transform: translateY(20px) scale(0.92); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
}
.ai-dialog-header {
    display: flex; align-items: center;
    padding: 14px 16px;
    background: linear-gradient(135deg, #007D4E 0%, #007D4E 100%);
    color: #fff; gap: 12px; flex-shrink: 0;
}
.ai-dialog-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.6); flex-shrink: 0; }
.ai-dialog-info { flex: 1; min-width: 0; }
.ai-dialog-name { font-size: 15px; font-weight: 700; line-height: 1.3; }
.ai-dialog-status { font-size: 11px; opacity: 0.85; line-height: 1.4; }
.ai-dialog-close {
    background: rgba(255,255,255,0.22); border: none; color: #fff;
    width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
    font-size: 16px; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background 0.2s;
}
.ai-dialog-close:hover { background: rgba(255,255,255,0.38); }
.ai-dialog-messages {
    flex: 1; overflow-y: auto; padding: 14px 14px 8px;
    display: flex; flex-direction: column; gap: 10px;
    min-height: 120px; max-height: 280px; scroll-behavior: smooth;
}
.ai-msg { display: flex; gap: 8px; align-items: flex-end; max-width: 88%; animation: aiMsgIn 0.22s ease-out forwards; }
@keyframes aiMsgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.ai-msg.user { align-self: flex-end; flex-direction: row-reverse; }
.ai-msg-avatar { width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; }
.ai-msg-bubble {
    padding: 8px 12px; border-radius: 12px; font-size: 13px;
    line-height: 1.5; word-break: break-word;
}
.ai-msg.assistant .ai-msg-bubble {
    background: rgba(0,125,78,0.08); color: #1a1a1a;
    border-bottom-left-radius: 4px;
}
.ai-msg.user .ai-msg-bubble {
    background: linear-gradient(135deg, #007D4E, #007D4E);
    color: #fff; border-bottom-right-radius: 4px;
}
.ai-dialog-input-wrap {
    display: flex; align-items: flex-end; gap: 8px;
    padding: 10px 14px; border-top: 1px solid rgba(0,125,78,0.12);
    background: rgba(255,255,255,0.6);
}
.ai-dialog-input {
    flex: 1; border: 1px solid rgba(0,125,78,0.25); border-radius: 12px;
    padding: 8px 12px; font-size: 13px; font-family: inherit;
    resize: none; outline: none; min-height: 36px; max-height: 80px;
    background: rgba(255,255,255,0.8); color: #1a1a1a;
    transition: border-color 0.2s;
}
.ai-dialog-input:focus { border-color: #007D4E; }
.ai-dialog-send {
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, #007D4E, #007D4E);
    color: #fff; border: none; cursor: pointer;
    font-size: 16px; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: transform 0.2s, box-shadow 0.2s;
}
.ai-dialog-send:hover { transform: scale(1.08); box-shadow: 0 4px 12px rgba(0,125,78,0.4); }`;
    style.id = 'aiFabStyle';
    document.head.appendChild(style);

    // Inject HTML
    var wrap = document.createElement('div');
    wrap.innerHTML = `<!-- AI Floating Button - Injected HTML -->
<div class="ai-float-wrap" id="aiFloatWrap">
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
        <div class="ai-msg-welcome" style="padding:10px;font-size:13px;color:#555;line-height:1.6;">
            <strong>🐉 龙蟠AI助手</strong><br>
            你好！可以问我任何关于当前页面的问题，或选中一段文字/图表后点击发送，我来帮你解读。
        </div>
    </div>
    <div class="ai-dialog-input-wrap">
        <textarea class="ai-dialog-input" id="aiChatInput" placeholder="输入问题，或选中页面内容后发送..." rows="1"></textarea>
        <button class="ai-dialog-send" id="aiChatSend" title="发送">➤</button>
    </div>
</div>`;
    document.body.appendChild(wrap);

    // Set image sources
    var gifImg = document.getElementById('gifImg');
    var avatarImg = document.getElementById('aiDialogAvatar');
    if (gifImg) gifImg.src = 'assets/dragon_4combined_anim.gif';
    if (avatarImg) avatarImg.src = 'assets/dragon_4combined_hover_static.png';

    // Drag functionality
    var isDragging = false;
    var startX, startY, initX, initY;
    var floatWrap = document.getElementById('aiFloatWrap');
    var sphere = document.getElementById('aiSphere');

    sphere.addEventListener('mousedown', function(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        var rect = floatWrap.getBoundingClientRect();
        initX = rect.left;
        initY = rect.top;
        floatWrap.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        floatWrap.style.left = (initX + dx) + 'px';
        floatWrap.style.top = (initY + dy) + 'px';
    });

    document.addEventListener('mouseup', function() {
        if (!isDragging) return;
        isDragging = false;
        floatWrap.style.cursor = 'grab';
        // Save position
        try {
            localStorage.setItem('aiFab_pos', floatWrap.style.left + ',' + floatWrap.style.top);
        } catch(e) {}
    });

    // Restore position
    try {
        var pos = localStorage.getItem('aiFab_pos');
        if (pos) {
            var parts = pos.split(',');
            if (parts.length === 2) {
                floatWrap.style.left = parts[0];
                floatWrap.style.top = parts[1];
            }
        }
    } catch(e) {}

    // Hover pause - GIF to PNG
    var hoverTimeout;
    sphere.addEventListener('mouseenter', function() {
        clearTimeout(hoverTimeout);
        if (gifImg) {
            hoverTimeout = setTimeout(function() {
                gifImg.src = gifImg.src.replace('.gif', '_hover.png').replace('_hover.png', '_hover.png');
            }, 200);
        }
    });

    sphere.addEventListener('mouseleave', function() {
        clearTimeout(hoverTimeout);
        if (gifImg) {
            gifImg.src = 'assets/dragon_4combined_anim.gif';
        }
    });

    // Dialog toggle
    var dialog = document.getElementById('aiChatDialog');
    sphere.addEventListener('click', function() {
        dialog.classList.toggle('open');
    });

    // Close dialog
    var closeBtn = document.getElementById('aiChatClose');
    closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        dialog.classList.remove('open');
    });

    // Send message
    var sendBtn = document.getElementById('aiChatSend');
    var input = document.getElementById('aiChatInput');
    var msgs = document.getElementById('aiDialogMsgs');

    function addMessage(text, isUser) {
        var msg = document.createElement('div');
        msg.className = 'ai-msg' + (isUser ? ' user' : '');
        msg.innerHTML = '<img class="ai-msg-avatar" src="' + (isUser ? '' : 'assets/dragon_4combined_hover_static.png') + '"><div class="ai-msg-bubble">' + text + '</div>';
        msgs.appendChild(msg);
        msgs.scrollTop = msgs.scrollHeight;
    }

    sendBtn.addEventListener('click', function() {
        var text = input.value.trim();
        if (!text) return;
        addMessage(text, true);
        input.value = '';
        // Simulated response
        setTimeout(function() {
            addMessage('收到您的消息！AI助手功能正在开发中...', false);
        }, 500);
    });

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
        }
    });
})();