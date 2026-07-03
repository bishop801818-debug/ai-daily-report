
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
    /* GIF动画：页面加载后立即循环播放 */
    (function(){
        var gifImg = document.getElementById("gifImg");
        if (!gifImg) return;
        gifImg.src = "assets/dragon_anim.gif";

        /* ── 悬停时GIF暂停（切换为静态抬头表情）── */
        var GIF_SRC = "assets/dragon_anim.gif";
        var STATIC_SRC = "assets/dragon_4combined_hover_static.png";
        var wrap = document.getElementById("aiFloatWrap");
        if (!wrap) return;

        var isHovering = false;

        wrap.addEventListener('mouseenter', function() {
            if (isHovering) return;
            isHovering = true;
            // 切换为静态表情图 → GIF停止播放
            gifImg.src = STATIC_SRC;
        });

        wrap.addEventListener('mouseleave', function() {
            if (!isHovering) return;
            isHovering = false;
            // 恢复GIF → 继续循环播放
            gifImg.src = GIF_SRC;
        });

        /* 移动端触摸：按下显示静态，松开恢复 */
        wrap.addEventListener('touchstart', function(e) {
            if (isHovering) return;
            isHovering = true;
            gifImg.src = STATIC_SRC;
        }, {passive: true});

        wrap.addEventListener('touchend', function() {
            if (!isHovering) return;
            isHovering = false;
            gifImg.src = GIF_SRC;
        });
    })();
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
        
        // 构建丰富的页面上下文
        var contextParts = [];
        
        // 1. 页面基本信息
        var title = document.title || '';
        var currentDate = document.getElementById('currentDate') ? document.getElementById('currentDate').textContent : '';
        contextParts.push('[页面] 标题: ' + title + ' | 日期: ' + currentDate);
        
        // 2. 早报数据（各事业部信息）
        if (typeof dynamicReportData !== 'undefined' && dynamicReportData) {
            var depts = Object.keys(dynamicReportData);
            contextParts.push('[早报] 加载日期: ' + (CURRENT_REPORT_DATE || '未知') + ' | 事业部数量: ' + depts.length);
            
            // 提取每个事业部的关键信息（限制长度避免token过多）
            depts.forEach(function(deptId) {
                var dept = dynamicReportData[deptId];
                if (!dept) return;
                
                var deptInfo = '[事业部: ' + (dept.title || deptId) + ']';
                if (dept.headline) deptInfo += ' 头条: ' + dept.headline.substring(0, 100);
                if (dept.lead) deptInfo += ' | 主导: ' + dept.lead.substring(0, 80);
                if (dept.risk) deptInfo += ' | 风险: ' + dept.risk.substring(0, 80);
                contextParts.push(deptInfo);
            });
        }
        
        // 3. 市场行情数据（从页面文本中提取关键信息）
        var marketSection = document.querySelector('.market-dashboard');
        if (marketSection) {
            var marketText = marketSection.innerText || marketSection.textContent || '';
            // 提取前500字符（包含价格等关键信息）
            contextParts.push('[市场行情] ' + marketText.substring(0, 500));
        }
        
        // 4. 页面导航信息
        var navItems = document.querySelectorAll('.main-nav-item');
        if (navItems.length > 0) {
            var navNames = Array.from(navItems).map(function(n) { 
                return n.textContent.trim().replace(/\\s+/g, ' '); 
            }).join(', ');
            contextParts.push('[导航] ' + navNames);
        }
        
        // 5. 当前URL
        contextParts.push('[URL] ' + window.location.href);
        
        return contextParts.join('\n');
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
        return '你是龙蟠智研中心的AI助手。请用简洁专业的语气回答用户问题。\n' +
               '页面上下文：\n' + context + '\n\n' +
               '用户提问：' + userText + '\n\n' +
               '回答（100字以内，直接给出答案，不需要额外说明）：';
    }

    // 智谱AI API (GLM-4-Flash): 维护会话上下文
    // 注意：直接调用智谱API，无需代理
    var __ai_conv_id__ = 'ai-web-' + Date.now();
    var __zhipu_api_key__ = 'a84b9b55d2f34a7bbdc68afdd40bcafa.sb7cDCFaJkxjGluv';
    var __zhipu_model__ = 'glm-4-flash';
    var __ai_messages__ = [];  // 维护对话历史

    async function sendMessage() {
        var text = input.value.trim();
        if (!text) return;
        input.value = '';
        addMsg('user', text, userAvatar);
        showTyping();
        sendBtn.disabled = true;
        try {
            // 添加用户消息到历史
            __ai_messages__.push({role: 'user', content: buildPrompt(text)});

            // 调用智谱API（同步返回，无需轮询）
            var resp = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + __zhipu_api_key__,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: __zhipu_model__,
                    messages: __ai_messages__,
                    max_tokens: 512,
                    temperature: 0.7
                })
            });
            var data = await resp.json();

            removeTyping();

            if (data.error) {
                addMsg('bot', '[错误] ' + (data.error.message || 'API调用失败'), botAvatar);
                sendBtn.disabled = false;
                return;
            }

            // 提取回复内容
            var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
            if (reply) {
                // 添加助手回复到历史
                __ai_messages__.push({role: 'assistant', content: reply});
                addMsg('bot', reply, botAvatar);
                sendBtn.disabled = false;
                return;
            }

            // 无有效回复
            addMsg('bot', '[超时] AI 响应超时，请稍后再试。', botAvatar);
            sendBtn.disabled = false;
            return;
        } catch(e) {
            removeTyping();
            addMsg('bot', '[错误] ' + (e.message || 'AI 响应失败'), botAvatar);
            sendBtn.disabled = false;
        }
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
