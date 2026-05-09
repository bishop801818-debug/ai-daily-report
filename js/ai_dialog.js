/* ===== AI 对话框 / 拖拽 JS ===== */
window.addEventListener('DOMContentLoaded', function() {
(function() {
    var wrap = document.getElementById('aiFloatWrap');
    if (!wrap) { console.error('AI button not found'); return; }

    /* ── 位置记忆 ── */
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem('aiBtnPos')); } catch(e) {}
    if (saved && saved.right !== undefined) {
        wrap.style.right  = '';
        wrap.style.bottom = '';
        wrap.style.left   = saved.left  + 'px';
        wrap.style.top    = saved.top   + 'px';
    }

    /* ── 拖拽 ── */
    var dragging = false, rx = 0, ry = 0, started = false;

    wrap.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        dragging   = true;
        started   = false;
        rx = e.clientX - wrap.offsetLeft;
        ry = e.clientY - wrap.offsetTop;
        wrap.classList.add('dragging');
        wrap.style.right  = '';
        wrap.style.bottom = '';
        e.preventDefault();
    });
    document.addEventListener('mousemove', function(e) {
        if (!dragging) return;
        if (!started) { started = true; }
        wrap.style.left = (e.clientX - rx) + 'px';
        wrap.style.top  = (e.clientY - ry) + 'px';
    });
    document.addEventListener('mouseup', function() {
        if (!dragging) return;
        dragging = false;
        wrap.classList.remove('dragging');
        try {
            localStorage.setItem('aiBtnPos', JSON.stringify({
                left: wrap.offsetLeft, top: wrap.offsetTop
            }));
        } catch(e) {}
    });

    /* ── 对话框 ── */
    var dialog = document.getElementById('aiChatDialog');
    var input  = document.getElementById('aiChatInput');
    var sendBtn= document.getElementById('aiChatSend');

    function openDialog() {
        dialog.classList.add('open');
        input.focus();
    }
    function closeDialog() {
        dialog.classList.remove('open');
    }
    wrap.addEventListener('click', function(e) {
        if (e.target.closest('.ai-sphere') && !dragging) openDialog();
    });
    document.getElementById('aiChatClose').addEventListener('click', closeDialog);
    dialog.addEventListener('click', function(e) {
        if (e.target === dialog) closeDialog();
    });

    /* ── 滚动到页面中部，选取选中文字或图表说明 ── */
    function getSelectedText() {
        var t = '';
        if (window.getSelection) t = window.getSelection().toString();
        else if (document.selection && document.selection.createRange) t = document.selection.createRange().text;
        return t.trim();
    }
    function getPageContext() {
        var sel = getSelectedText();
        if (sel) return '[用户选中了页面内容]\n' + sel;
        // 返回页面标题和主要模块信息
        var title = document.title || '';
        var buCards = document.querySelectorAll('.bu-card').length;
        var navItems = document.querySelectorAll('.main-nav-item').length;
        return '[页面信息] 标题: ' + title + ' | BU卡片: ' + buCards + '个 | 导航项: ' + navItems + '个\n（可直接描述图表或段落内容向我提问）';
    }

    /* ── 发送消息 ── */
    var botAvatar = document.getElementById('aiSphereImg')
                      ? document.getElementById('aiSphereImg').src : '';
    var userAvatar= '';

    function scrollBottom() {
        var m = document.getElementById('aiDialogMsgs');
        if (m) m.scrollTop = m.scrollHeight;
    }
    function addMsg(role, text, avatar) {
        var m = document.getElementById('aiDialogMsgs');
        var w = m.querySelector('.ai-msg-welcome');
        if (w) w.remove();
        var div = document.createElement('div');
        div.className = 'ai-msg ' + role;
        var av = avatar || botAvatar;
        div.innerHTML =
            '<img class="ai-msg-avatar" src="' + av + '" alt=""/>' +
            '<div class="ai-msg-bubble"></div>';
        div.querySelector('.ai-msg-bubble').textContent = text;
        m.appendChild(div);
        scrollBottom();
    }
    function showTyping() {
        var m = document.getElementById('aiDialogMsgs');
        var div = document.createElement('div');
        div.className = 'ai-msg ai-msg-typing';
        div.id = 'aiTypingMsg';
        div.innerHTML =
            '<img class="ai-msg-avatar" src="' + botAvatar + '" alt=""/>' +
            '<div class="ai-msg-bubble">正在思考...</div>';
        m.appendChild(div);
        scrollBottom();
    }
    function removeTyping() {
        var t = document.getElementById('aiTypingMsg');
        if (t) t.remove();
    }

    function buildPrompt(userText) {
        var context = getPageContext();
        return '你是龙蟠战略中心信息中台的AI助手。请用简洁专业的语气回答用户问题。\n' +
               '页面上下文：\n' + context + '\n\n' +
               '用户提问：' + userText + '\n\n' +
               '回答（100字以内，直接给出答案，不需要额外说明）：';
    }

    async function sendMessage() {
        var text = input.value.trim();
        if (!text) return;
        input.value = '';
        addMsg('user', text, userAvatar);
        showTyping();
        sendBtn.disabled = true;
        try {
            var resp = await fetch('https://api.coze.cn/v1/chat', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + (window.__AI_TOKEN__ || ''),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    conversation_id: 'ai-chat-' + Date.now(),
                    bot_id: window.__AI_BOT_ID__ || '',
                    user_id: 'web-user',
                    query: buildPrompt(text),
                    stream: false
                })
            });
            removeTyping();
            if (resp.ok) {
                var data = await resp.json();
                var answer = (data.data && data.data.messages &&
                              data.data.messages.find(function(m){return m.role==='assistant';}))
                             || { content: '抱歉，暂时无法回答，请稍后再试。' };
                addMsg('bot', answer.content || '收到！', botAvatar);
            } else {
                addMsg('bot', '[错误] 服务暂时不可用（HTTP ' + resp.status + '）', botAvatar);
            }
        } catch(err) {
            removeTyping();
            addMsg('bot', '[网络错误] 请检查网络连接。', botAvatar);
        }
        sendBtn.disabled = false;
    }

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    sendBtn.addEventListener('click', sendMessage);
})();
});