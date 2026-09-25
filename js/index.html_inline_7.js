
            window.onInboxAccountChange = async function (isSilent = false) {
                const select = document.getElementById('inbox-account-select');
                if (!select) return;
                const container = document.getElementById('inbox-emails-container');
                const status = document.getElementById('inbox-status');
                const val = select.value;
                if (!val) {
                    localStorage.removeItem('activeMailAccount');
                    if (container) {
                        container.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-3xl mb-4 shadow-inner">
                            <i class="fa-solid fa-inbox"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">No Account Selected</h3>
                        <p class="text-gray-500 max-w-xs text-sm">Please select a mail account from the dropdown above to view emails.</p>
                    </div>`;
                    }
                    if (status) status.innerHTML = '';
                    return;
                }
                localStorage.setItem('activeMailAccount', val);

                let refreshToken = '';
                let clientId = '';
                let emailAddress = '';

                if (val.startsWith('stock_')) {
                    const stockId = val.replace('stock_', '');
                    const stock = (window.appData.stocks || []).find(s => s._id === stockId || s.id === stockId);
                    if (stock) {
                        emailAddress = stock.email || '';
                        const pass = stock.password || '';

                        if (stock.securityKey) {
                            const secParts = stock.securityKey.split('|');
                            let p1 = (secParts[0] || '').trim();
                            let p2 = (secParts[1] || '').trim();

                            // Client IDs are UUIDs which are 36 characters long
                            if (p1.length === 36 && p2.length > 50) {
                                clientId = p1;
                                refreshToken = p2;
                            } else if (p2.length === 36 && p1.length > 50) {
                                clientId = p2;
                                refreshToken = p1;
                            } else {
                                // Default assumption
                                refreshToken = p1;
                                clientId = p2;
                            }
                        } else if (stock.data) {
                            // Legacy fallback
                            const parts = stock.data.split(':');
                            if (parts.length >= 4) {
                                emailAddress = parts[0].trim();
                                clientId = parts[2].trim();
                                refreshToken = parts[3].trim();
                            } else if (stock.data.includes('|')) {
                                const p2 = stock.data.split('|');
                                emailAddress = p2[0].trim();
                                if (p2[2]) {
                                    const p3 = p2[2].split(':');
                                    clientId = p3[0].trim();
                                    refreshToken = (p3[1] || p3[0]).trim();
                                }
                            } else {
                                emailAddress = parts[0].trim();
                                refreshToken = (parts[1] || parts[0]).trim();
                                clientId = refreshToken;
                            }
                        } else {
                            if (pass.includes('|')) {
                                const p2 = pass.split('|');
                                refreshToken = p2[1] || '';
                                clientId = p2[2] || '';
                            } else if (pass.includes(':')) {
                                const p3 = pass.split(':');
                                refreshToken = p3[1] || '';
                                clientId = p3[2] || '';
                            }
                        }
                        if (!clientId) clientId = 'd3590ed6-52b3-4102-aeff-aad2292ab01c';
                    }
                } else if (val.startsWith('order_')) {
                    const orderId = val.replace('order_', '');
                    const order = window.appData.orders.find(o => o.id === orderId);
                    if (order) {
                        emailAddress = order.deliveryEmail || order.item || '';
                        if (order.deliverySecurityKey) {
                            const parts = order.deliverySecurityKey.trim().split(/[\s|:]+/);
                            if (parts.length >= 2) {
                                clientId = parts[0].trim();
                                refreshToken = parts[parts.length - 1].trim();
                            } else {
                                clientId = parts[0].trim();
                                refreshToken = parts[0].trim();
                            }
                        }
                    }
                } else if (val.startsWith('manual_')) {
                    const idx = parseInt(val.split('_')[1]);
                    const acc = manualAccounts[idx];
                    refreshToken = acc.token;
                    clientId = acc.clientId;
                    emailAddress = acc.email;
                }

                if (!isSilent) {
                    container.innerHTML = '';
                    status.classList.remove('hidden');
                }

                const refreshBtn = document.querySelector('[onclick="refreshInbox()"] i');
                if (refreshBtn) refreshBtn.classList.add('fa-spin');

                try {
                    const res = await fetch('/api/mail/inbox', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('tg_token') || '') },
                        body: JSON.stringify({ refreshToken, clientId, emailAddress })
                    });

                    const data = await res.json();
                    status.classList.add('hidden');

                    if (data.success) {
                        if (!data.emails || data.emails.length === 0) {
                            const emptyHtml = `<div class="text-center py-10"><p class="text-sm font-semibold text-gray-700">Inbox is empty</p></div>`;
                            if (container.innerHTML !== emptyHtml) container.innerHTML = emptyHtml;
                        } else {
                            window.currentEmails = data.emails;
                            let html = '';
                            data.emails.forEach((email, idx) => {
                                const date = new Date(email.receivedDateTime);
                                const timeAgo = Math.floor((Date.now() - date.getTime()) / 60000);
                                const timeStr = timeAgo < 60 ? `${timeAgo}m ago` : (timeAgo < 1440 ? `${Math.floor(timeAgo / 60)}h ago` : `${Math.floor(timeAgo / 1440)}d ago`);
                                const senderName = email.sender?.emailAddress?.name || email.sender?.emailAddress?.address || 'Unknown';
                                const firstLetter = senderName.charAt(0).toUpperCase();

                                // Extract code from subject
                                let vCode = null;
                                const subjectText = email.subject || '';
                                const codeMatch = subjectText.match(/\b(G-\d{6}|\d{4,8})\b/);
                                if (codeMatch) {
                                    vCode = codeMatch[1];
                                }

                                const codeBtnHtml = vCode ? `<button onclick="event.stopPropagation(); copyToClipboard('${vCode}');" class="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-md transition-colors border border-indigo-200 shadow-sm shrink-0 flex items-center gap-1" title="Copy Code"><i class="fa-regular fa-copy"></i> ${vCode}</button>` : '';

                                html += `
                        <div class="bg-white p-4 rounded-2xl border border-indigo-50 shadow-[0_2px_10px_rgba(0,0,0,0.02)] cursor-pointer hover:shadow-[0_4px_15px_rgba(79,70,229,0.08)] hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-0.5 group mb-3" onclick="openEmail(${idx})">
                            <div class="flex gap-3">
                                <div class="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold text-lg shadow-inner">
                                    ${firstLetter}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex justify-between items-center mb-0.5">
                                        <span class="font-bold text-sm text-gray-900 truncate pr-2 group-hover:text-indigo-700 transition-colors">${senderName}</span>
                                        <div class="flex items-center gap-2">
                                            ${codeBtnHtml}
                                            <span class="text-[10px] font-medium text-gray-400 whitespace-nowrap bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100 shrink-0">${timeStr}</span>
                                        </div>
                                    </div>
                                    <h4 class="text-[13px] font-semibold text-indigo-600 mb-1 truncate mt-1">${email.subject || '(No Subject)'}</h4>
                                    <p class="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">${email.bodyPreview || ''}</p>
                                </div>
                            </div>
                        </div>`;
                            });
                            if (container.innerHTML !== html) container.innerHTML = html;
                        }
                    } else if (!isSilent) {
                        if (data.error && data.error.includes('Could not find email address')) {
                            container.innerHTML = `<div class="text-center py-10"><p class="text-sm font-semibold text-gray-700">Inbox is empty for this email token</p></div>`;
                        } else {
                            container.innerHTML = `<div class="bg-red-50 p-4 rounded-xl text-red-600 text-xs">${data.error}<br>${data.details || ''}</div>`;
                        }
                    }
                } catch (e) {
                    status.classList.add('hidden');
                    if (!isSilent) container.innerHTML = `<div class="bg-red-50 p-4 rounded-xl text-red-600 text-xs">Error fetching emails</div>`;
                } finally {
                    const refreshBtn = document.querySelector('[onclick="refreshInbox()"] i');
                    if (refreshBtn) refreshBtn.classList.remove('fa-spin');
                }
            };


            // === AI CHAT LOGIC (Groq — Zero MongoDB Storage) ===
            let aiChatHistory = []; // Browser memory only, cleared on session end
            let aiChatTyping = false;

            function aiMsg(role, text) {
                return `<div class="flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-1">
                    ${role !== 'user' ? `<div class="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs mr-2 shrink-0 mt-1"><i class="fa-solid fa-robot"></i></div>` : ''
                    }
                    <div class="${role === 'user' ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-2xl rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm'} px-4 py-2.5 text-sm max-w-[78%] shadow-sm leading-relaxed">
                        ${text}
                    </div>
                </div>`;
            }

            function aiTypingIndicator() {
                return `<div class="flex justify-start mb-1" id="ai-typing">
                    <div class="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs mr-2 shrink-0 mt-1"><i class="fa-solid fa-robot"></i></div>
                    <div class="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                        <div class="flex gap-1 items-center">
                            <span class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay:0ms"></span>
                            <span class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay:150ms"></span>
                            <span class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay:300ms"></span>
                        </div>
                    </div>
                </div>`;
            }

            window.startAIChat = function () {
                document.getElementById('support-menu').classList.add('hidden');
                document.getElementById('live-chat-window').classList.remove('hidden');
                document.getElementById('live-chat-window').classList.add('flex');
                aiChatHistory = [];

                const msgBox = document.getElementById('chat-messages');
                msgBox.innerHTML = aiMsg('ai', '👋 আমি <b>Ayno AI</b>! Ayno Store সম্পর্কে যেকোনো প্রশ্ন করুন — product, price, payment, order সব বিষয়ে সাহায্য করতে পারব।') +
                    `<div class="flex flex-wrap gap-2 mt-3 mb-1">
                        <button onclick="sendQuickMsg('কোন কোন product আছে?')" class="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition font-medium">📦 Products দেখাও</button>
                        <button onclick="sendQuickMsg('Balance কীভাবে add করব?')" class="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition font-medium">💳 Balance add</button>
                        <button onclick="sendQuickMsg('Order pending কেন?')" class="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition font-medium">⏳ Pending Order</button>
                    </div>`;
                msgBox.scrollTop = msgBox.scrollHeight;
                document.getElementById('chat-input').focus();
            };

            window.sendQuickMsg = function (text) {
                document.getElementById('chat-input').value = text;
                sendChatMessage();
            };

            window.startAutomatedChat = function (question) {
                startAIChat();
                setTimeout(() => {
                    document.getElementById('chat-input').value = question;
                    sendChatMessage();
                }, 300);
            };

            window.startLiveChat = function () { startAIChat(); };

            window.closeLiveChat = function () {
                document.getElementById('live-chat-window').classList.add('hidden');
                document.getElementById('live-chat-window').classList.remove('flex');
                document.getElementById('support-menu').classList.remove('hidden');
                aiChatHistory = [];
            };

            window.sendChatMessage = async function () {
                if (aiChatTyping) return;
                const input = document.getElementById('chat-input');
                const text = input.value.trim();
                if (!text) return;
                input.value = '';

                const msgBox = document.getElementById('chat-messages');
                // Remove quick reply buttons if present
                const quickBtns = msgBox.querySelector('.flex.flex-wrap.gap-2');
                if (quickBtns) quickBtns.remove();

                // Show user message
                msgBox.innerHTML += aiMsg('user', text);
                msgBox.scrollTop = msgBox.scrollHeight;

                // Add to history
                aiChatHistory.push({ role: 'user', content: text });

                // Show typing indicator
                aiChatTyping = true;
                const sendBtn = document.getElementById('ai-send-btn');
                if (sendBtn) sendBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-sm"></i>';
                msgBox.innerHTML += aiTypingIndicator();
                msgBox.scrollTop = msgBox.scrollHeight;

                try {
                    const res = await fetch('/api/ai-support', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                        body: JSON.stringify({ messages: aiChatHistory })
                    });
                    const data = await res.json();

                    // Remove typing indicator
                    const typingEl = document.getElementById('ai-typing');
                    if (typingEl) typingEl.remove();

                    const reply = data.success ? data.reply : 'দুঃখিত, এই মুহূর্তে উত্তর দিতে পারছি না। Telegram এ contact করুন।';

                    // Render reply with line breaks
                    const formattedReply = reply.replace(/\n/g, '<br>');
                    msgBox.innerHTML += aiMsg('ai', formattedReply);

                    // Add AI reply to history
                    aiChatHistory.push({ role: 'assistant', content: reply });

                    // Show Telegram fallback after 3 messages
                    if (aiChatHistory.length >= 6) {
                        const tgLink = (window.appData && window.appData.settings && window.appData.settings.telegramLink) || 'https://t.me/aynoshop';
                        msgBox.innerHTML += `<div class="flex justify-center my-2"><a href="${tgLink}" target="_blank" class="text-[11px] bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-full font-medium hover:bg-blue-100 transition"><i class="fa-brands fa-telegram mr-1"></i>Need more help? Contact on Telegram</a></div>`;
                    }

                } catch (e) {
                    const typingEl = document.getElementById('ai-typing');
                    if (typingEl) typingEl.remove();
                    msgBox.innerHTML += aiMsg('ai', 'দুঃখিত, connection error। একটু পরে try করুন।');
                } finally {
                    aiChatTyping = false;
                    if (sendBtn) sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane text-sm"></i>';
                    msgBox.scrollTop = msgBox.scrollHeight;
                    input.focus();
                }
            };

            // Background polling for inbox with visible countdown
            let inboxCountdown = 5;
            setInterval(() => {
                const inboxView = document.getElementById('inbox-view');
                const selectEl = document.getElementById('inbox-account-select');
                if (inboxView && inboxView.classList.contains('active') && selectEl && selectEl.value) {
                    inboxCountdown--;
                    const timerEl = document.getElementById('inbox-refresh-timer');
                    if (timerEl) timerEl.innerText = inboxCountdown + 's';

                    if (inboxCountdown <= 0) {
                        inboxCountdown = 5;
                        if (timerEl) timerEl.innerText = inboxCountdown + 's';
                        const refreshBtn = document.querySelector('[onclick="refreshInbox()"] i');
                        if (refreshBtn) {
                            refreshBtn.classList.add('fa-spin');
                            setTimeout(() => refreshBtn.classList.remove('fa-spin'), 600);
                        }
                        onInboxAccountChange(true);
                    }
                }
            }, 1000);

            function showSettingsModal() {
                const modal = document.getElementById('settings-modal');
                const content = modal.querySelector('div.bg-white');
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('translate-y-full', 'sm:translate-y-8'); }, 10);
            }

            function hideSettingsModal() {
                const modal = document.getElementById('settings-modal');
                const content = modal.querySelector('div.bg-white');
                modal.classList.add('opacity-0');
                content.classList.add('translate-y-full', 'sm:translate-y-8');
                setTimeout(() => { modal.classList.remove('flex'); modal.classList.add('hidden'); }, 300);
            }

            function showManualLoginModal() {
                const modal = document.getElementById('manual-login-modal');
                const inner = modal.querySelector('div');
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                setTimeout(() => {
                    modal.classList.remove('opacity-0');
                    inner.classList.remove('translate-y-full', 'sm:translate-y-8');
                }, 10);
            }

            function hideManualLoginModal() {
                const modal = document.getElementById('manual-login-modal');
                const inner = modal.querySelector('div');
                modal.classList.add('opacity-0');
                inner.classList.add('translate-y-full', 'sm:translate-y-8');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }, 300);
            }

            function openEmail(idx) {
                if (!window.currentEmails || !window.currentEmails[idx]) return;
                const email = window.currentEmails[idx];
                const modal = document.getElementById('email-read-modal');
                const inner = modal.querySelector('div');

                document.getElementById('email-read-subject').textContent = email.subject || '(No Subject)';
                const senderName = email.sender?.emailAddress?.name || '';
                const senderEmail = email.sender?.emailAddress?.address || 'Unknown';
                document.getElementById('email-read-sender').textContent = senderName ? `${senderName} <${senderEmail}>` : senderEmail;

                const iframe = document.getElementById('email-read-iframe');

                const bodyContent = email.body?.content || email.bodyPreview || 'No content';
                const htmlContent = email.body?.contentType === 'html' ? bodyContent : `<pre style="font-family:sans-serif;white-space:pre-wrap;padding:10px;">${bodyContent}</pre>`;

                iframe.srcdoc = htmlContent;

                modal.classList.remove('hidden');
                modal.classList.add('flex');
                setTimeout(() => {
                    modal.classList.remove('opacity-0');
                    inner.classList.remove('translate-y-full', 'sm:translate-y-8');
                }, 10);
            }

            function closeEmailModal() {
                const modal = document.getElementById('email-read-modal');
                const inner = modal.querySelector('div');
                modal.classList.add('opacity-0');
                inner.classList.add('translate-y-full', 'sm:translate-y-8');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                    document.getElementById('email-read-iframe').srcdoc = '';
                }, 300);
            }

            let customDropdownOpen = false;
            function toggleCustomDropdown() {
                const list = document.getElementById('custom-dropdown-list');
                const icon = document.getElementById('custom-dropdown-icon');
                if (customDropdownOpen) {
                    list.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
                    setTimeout(() => list.classList.add('hidden'), 200);
                    icon.style.transform = 'rotate(0deg)';
                    customDropdownOpen = false;
                } else {
                    list.classList.remove('hidden', 'pointer-events-none');
                    setTimeout(() => list.classList.remove('opacity-0', 'scale-95'), 10);
                    icon.style.transform = 'rotate(180deg)';
                    customDropdownOpen = true;
                }
            }

            window.openAccountSelector = function () {
                const modal = document.getElementById('account-selector-modal');
                const panel = document.getElementById('account-selector-panel');
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                setTimeout(() => {
                    modal.classList.remove('opacity-0');
                    panel.classList.remove('translate-y-full');
                }, 10);
            };

            window.closeAccountSelector = function () {
                const modal = document.getElementById('account-selector-modal');
                const panel = document.getElementById('account-selector-panel');
                modal.classList.add('opacity-0');
                panel.classList.add('translate-y-full');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }, 300);
            };

            window.selectInboxAccount = function (val, text) {
                document.getElementById('inbox-account-select').value = val;
                document.getElementById('account-selector-text').textContent = text;
                localStorage.setItem('activeMailAccount', val);
                initInbox(); // Re-render so the tick mark highlights the correct item
                closeAccountSelector();
                onInboxAccountChange();
            };

            function selectCustomOption(val, text) {
                selectInboxAccount(val, text);
            }

            let manualAccounts = JSON.parse(localStorage.getItem('manualMailAccounts') || '[]');

            function initInbox() {
                const selectEl = document.getElementById('inbox-account-select');
                const listEl = document.getElementById('account-selector-list');
                if (!selectEl || !listEl) return;

                let optionsData = [];
                let hidden = JSON.parse(localStorage.getItem('hiddenInboxOrders') || '[]');

                const pushOption = (val, text, icon = 'fa-solid fa-envelope', colorClass = 'text-indigo-500 bg-indigo-50', dateStr = null) => {
                    optionsData.push({ val, text, icon, colorClass, dateStr });
                };

                manualAccounts.forEach((acc, idx) => {
                    pushOption('manual_' + idx, acc.email, 'fa-solid fa-user-pen', 'text-amber-500 bg-amber-50');
                });

                if (window.appData && window.appData.orders) {
                    const mailProductNames = (window.appData.products || []).filter(p => p.category === 'mail').map(p => p.name);
                    const expiryDays = (window.appData.settings && window.appData.settings.mailExpiryDays) || 3;
                    const expiryMs = expiryDays * 24 * 60 * 60 * 1000;
                    const now = new Date().getTime();
                    const expiryTextEl = document.getElementById('expiry-days-text');
                    if (expiryTextEl) expiryTextEl.innerText = expiryDays + ' days';

                    const mailOrders = window.appData.orders.filter(o => {
                        const orderTime = new Date(o.date || new Date()).getTime();
                        if (now - orderTime > expiryMs) return false;
                        if (hidden.includes(o.id)) return false;
                        if (o.externalType === 'mail') return true;
                        if (o.deliveryEmail && o.deliverySecurityKey) return true;
                        const orderStocks = (window.appData.stocks || []).filter(s => s.orderId === o.id);
                        return orderStocks.some(s => mailProductNames.includes(s.productName));
                    });

                    mailOrders.forEach(o => {
                        const orderStocks = (window.appData.stocks || []).filter(s => s.orderId === o.id);
                        if (orderStocks.length > 0) {
                            orderStocks.forEach((stock, sIdx) => {
                                if (hidden.includes(stock._id || stock.id)) return;
                                let email = stock.email || '';
                                if (!email && stock.data) {
                                    const parts = stock.data.split(':');
                                    if (parts.length >= 4) email = parts[0];
                                    else if (stock.data.includes('|')) email = stock.data.split('|')[0];
                                    else email = parts[0];
                                }
                                if (email) {
                                    if (email.includes(':')) email = email.split(':')[0];
                                    const dateFormatted = new Date(o.date || new Date()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                                    pushOption('stock_' + (stock._id || stock.id), email, 'fa-solid fa-envelope', 'text-indigo-500 bg-indigo-50', dateFormatted);
                                }
                            });
                        } else if (o.deliveryEmail && o.deliverySecurityKey) {
                            const email = o.deliveryEmail || o.item;
                            const dateFormatted = new Date(o.date || new Date()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                            pushOption('order_' + o.id, email, 'fa-solid fa-cart-shopping', 'text-emerald-500 bg-emerald-50', dateFormatted);
                        }
                    });
                }

                let activeAcc = localStorage.getItem('activeMailAccount');
                let activeIndex = optionsData.findIndex(opt => opt.val === activeAcc);

                if (activeIndex === -1 && optionsData.length > 0) {
                    activeAcc = optionsData[0].val;
                    activeIndex = 0;
                } else if (optionsData.length === 0) {
                    activeAcc = null;
                }

                selectEl.innerHTML = '<option value="">Select an account...</option>';
                listEl.innerHTML = '';

                optionsData.forEach(opt => {
                    const isActive = (opt.val === activeAcc);
                    selectEl.innerHTML += '<option value="' + opt.val + '" ' + (isActive ? 'selected' : '') + '>' + opt.text + '</option>';
                    listEl.innerHTML += `
            <button onclick="selectInboxAccount('${opt.val}', '${opt.text}')" class="w-full bg-white border ${isActive ? 'border-indigo-400 shadow-md ring-2 ring-indigo-50' : 'border-gray-100 hover:border-indigo-300 hover:shadow-md'} p-3 rounded-2xl flex items-center gap-3 transition-all text-left group relative">
                <div class="w-10 h-10 rounded-xl ${opt.colorClass} flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'group-hover:bg-indigo-600 group-hover:text-white'}">
                    <i class="${opt.icon}"></i>
                </div>
                <div class="flex-1 min-w-0 flex flex-col justify-center">
                    <span class="font-bold text-sm ${isActive ? 'text-indigo-600' : 'text-gray-800'} truncate w-full">${opt.text}</span>
                    ${opt.dateStr ? `<span class="text-[10.5px] text-gray-400 mt-0.5 font-medium"><i class="fa-regular fa-clock mr-1"></i>${opt.dateStr}</span>` : ''}
                </div>
                ${isActive ? '<div class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0"></div>' : ''}
            </button>
        `;
                });

                if (activeAcc && activeIndex !== -1) {
                    selectEl.value = activeAcc;
                    localStorage.setItem('activeMailAccount', activeAcc);
                    document.getElementById('account-selector-text').textContent = optionsData[activeIndex].text;
                } else {
                    selectEl.value = "";
                    localStorage.removeItem('activeMailAccount');
                    document.getElementById('account-selector-text').textContent = 'Select an account...';
                    const container = document.getElementById('inbox-emails-container');
                    const status = document.getElementById('inbox-status');
                    if (container) {
                        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-3xl mb-4 shadow-inner">
                    <i class="fa-solid fa-inbox"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-2">No Account Selected</h3>
                <p class="text-gray-500 max-w-xs text-sm">Please select a mail account from the dropdown above to view emails.</p>
            </div>`;
                    }
                    if (status) status.innerHTML = '';
                }
            }

            function saveManualAccount() {
                const input = document.getElementById('manual-token-input').value.trim();
                if (!input) return alert('Please enter a token');

                let delimiter = ':';
                const firstColon = input.indexOf(':');
                const firstPipe = input.indexOf('|');
                if (firstPipe !== -1 && (firstColon === -1 || firstPipe < firstColon)) {
                    delimiter = '|';
                }

                const parts = input.split(delimiter);

                if (parts.length < 3) return alert('Invalid token format. It must contain at least email, pass, and token.');

                const email = parts[0].trim();

                let token = '';
                let clientId = '';

                if (parts.length === 3) {
                    const thirdPart = parts[2].trim();
                    const spaceIdx = thirdPart.lastIndexOf(' ');
                    if (spaceIdx !== -1) {
                        token = thirdPart.substring(0, spaceIdx).trim();
                        clientId = thirdPart.substring(spaceIdx + 1).trim();
                    } else {
                        token = thirdPart;
                    }
                } else {
                    clientId = parts[parts.length - 1].trim();
                    token = parts.slice(2, parts.length - 1).join(delimiter).trim();
                }

                manualAccounts.unshift({ email, token, clientId });
                localStorage.setItem('manualMailAccounts', JSON.stringify(manualAccounts));

                document.getElementById('manual-token-input').value = '';
                hideManualLoginModal();
                initInbox();

                const selectEl = document.getElementById('inbox-account-select');
                selectEl.value = 'manual_0';
                onInboxAccountChange();
            }

            function copyInboxEmail() {
                const selectEl = document.getElementById('inbox-account-select');
                const val = selectEl.value;
                if (!val) return;

                const text = selectEl.options[selectEl.selectedIndex].text;
                let email = text;
                if (text.includes(': ')) {
                    email = text.split(': ')[1];
                }

                copyToClipboard(email);
            }

            function deleteInboxAccount() {
                const selectEl = document.getElementById('inbox-account-select');
                const val = selectEl.value;
                if (!val) return;

                // Show beautiful confirm popup instead of browser confirm()
                const existingModal = document.getElementById('delete-inbox-confirm-modal');
                if (existingModal) existingModal.remove();

                const modalHtml = `
            <div id="delete-inbox-confirm-modal" class="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4" style="backdrop-filter:blur(4px)">
                <div class="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center transform scale-95 transition-transform duration-300" id="delete-inbox-confirm-content">
                    <div class="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl mb-4 shadow-sm">
                        <i class="fa-solid fa-trash"></i>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800 mb-1">Remove Account?</h3>
                    <p class="text-[13px] text-gray-500 mb-6 px-2">Are you sure you want to remove this inbox account? This action cannot be undone.</p>
                    <div class="flex w-full gap-3">
                        <button id="btn-delete-inbox-cancel" class="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Cancel</button>
                        <button id="btn-delete-inbox-confirm" class="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition shadow-md shadow-red-500/30">Delete</button>
                    </div>
                </div>
            </div>
            `;
                document.body.insertAdjacentHTML('beforeend', modalHtml);

                const modal = document.getElementById('delete-inbox-confirm-modal');
                const content = document.getElementById('delete-inbox-confirm-content');
                setTimeout(() => { content.classList.remove('scale-95'); content.classList.add('scale-100'); }, 10);

                document.getElementById('btn-delete-inbox-cancel').onclick = () => modal.remove();
                document.getElementById('btn-delete-inbox-confirm').onclick = () => {
                    modal.remove();
                    const accountName = selectEl.options[selectEl.selectedIndex].text;
                    if (val.startsWith('manual_')) {
                        const idx = parseInt(val.split('_')[1]);
                        manualAccounts.splice(idx, 1);
                        localStorage.setItem('manualMailAccounts', JSON.stringify(manualAccounts));
                    } else if (val.startsWith('order_')) {
                        const orderId = val.split('_')[1];
                        let hidden = JSON.parse(localStorage.getItem('hiddenInboxOrders') || '[]');
                        if (!hidden.includes(orderId)) {
                            hidden.push(orderId);
                            localStorage.setItem('hiddenInboxOrders', JSON.stringify(hidden));
                        }
                    } else if (val.startsWith('stock_')) {
                        const stockId = val.split('_')[1];
                        let hidden = JSON.parse(localStorage.getItem('hiddenInboxOrders') || '[]');
                        if (!hidden.includes(stockId)) {
                            hidden.push(stockId);
                            localStorage.setItem('hiddenInboxOrders', JSON.stringify(hidden));
                        }
                    }
                    initInbox();
                    onInboxAccountChange();
                    showToast(`Successfully deleted mail ${accountName}`, 'success');
                };
            }

            async function refreshInbox() {
                const selectEl = document.getElementById('inbox-account-select');
                if (!selectEl || !selectEl.value) {
                    showToast('No account selected', 'error');
                    return;
                }
                // Animate the refresh icon
                const refreshBtn = document.querySelector('[onclick="refreshInbox()"] i');
                if (refreshBtn) {
                    refreshBtn.classList.add('fa-spin');
                }
                try {
                    await onInboxAccountChange(false);
                } finally {
                    // Stop spinning after fetch completes
                    setTimeout(() => {
                        if (refreshBtn) refreshBtn.classList.remove('fa-spin');
                    }, 600);
                }
            }

            function readOrderInInbox(orderId) {
                closePaymentModal();
                switchTab('inbox');

                // Un-hide the order if it was hidden
                let hidden = JSON.parse(localStorage.getItem('hiddenInboxOrders') || '[]');
                hidden = hidden.filter(id => id !== orderId);
                localStorage.setItem('hiddenInboxOrders', JSON.stringify(hidden));

                const orderStocks = (window.appData.stocks || []).filter(s => s.orderId === orderId);
                let valToSelect = '';
                if (orderStocks.length > 0) {
                    valToSelect = 'stock_' + (orderStocks[0]._id || orderStocks[0].id);
                } else {
                    valToSelect = 'order_' + orderId;
                }
                localStorage.setItem('activeMailAccount', valToSelect);

                initInbox();

                const selectEl = document.getElementById('inbox-account-select');
                if (selectEl) selectEl.value = valToSelect;
                onInboxAccountChange();
            }

            let currentTransferReceiver = null;

            async function searchTransferUser() {
                const input = document.getElementById('transfer-search-input').value.trim();
                const resultDiv = document.getElementById('transfer-search-result');
                const actionSection = document.getElementById('transfer-action-section');

                if (!input) {
                    showToast('Please enter a username or Telegram ID', 'error');
                    return;
                }

                resultDiv.innerHTML = '<div class="text-center text-sm text-indigo-600"><i class="fa-solid fa-spinner fa-spin"></i> Searching...</div>';
                resultDiv.classList.remove('hidden');
                actionSection.classList.add('hidden');
                currentTransferReceiver = null;

                try {
                    const token = localStorage.getItem('tg_token');
                    const query = input.replace('@', '');
                    const res = await fetch('/api/users/search?q=' + encodeURIComponent(query), {
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    const data = await res.json();

                    if (data.success && data.users && data.users.length > 0) {
                        const user = data.users[0];
                        currentTransferReceiver = user;
                        const photo = user.photoUrl ? `<img src="${user.photoUrl}" class="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm">` : `<div class="w-10 h-10 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm">${user.firstName ? user.firstName[0] : '?'}</div>`;

                        resultDiv.innerHTML = `
                        <div class="flex items-center gap-3">
                            ${photo}
                            <div>
                                <h4 class="font-bold text-gray-800 text-sm">${user.firstName} ${user.lastName || ''}</h4>
                                <p class="text-[10px] text-gray-500">@${user.username || user.tgId}</p>
                            </div>
                            <button onclick="clearTransferSelection()" class="ml-auto w-8 h-8 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center transition">
                                <i class="fa-solid fa-times"></i>
                            </button>
                        </div>
                    `;
                        actionSection.classList.remove('hidden');
                    } else {
                        resultDiv.innerHTML = '<div class="text-center text-sm font-semibold text-red-500 py-2"><i class="fa-solid fa-user-xmark mr-1"></i> User not found.</div>';
                    }
                } catch (e) {
                    resultDiv.innerHTML = '<div class="text-center text-sm font-semibold text-red-500 py-2">Error searching user.</div>';
                }
            }

            function clearTransferSelection() {
                currentTransferReceiver = null;
                document.getElementById('transfer-search-result').classList.add('hidden');
                document.getElementById('transfer-action-section').classList.add('hidden');
                document.getElementById('transfer-search-input').value = '';
            }

            function selectTransferUser(tgId, name, photoUrl) {
                currentTransferReceiver = { tgId: tgId, firstName: name, photoUrl: photoUrl };
                const resultDiv = document.getElementById('transfer-search-result');
                const actionSection = document.getElementById('transfer-action-section');

                const photo = photoUrl && photoUrl !== 'undefined' ? `<img src="${photoUrl}" class="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm">` : `<div class="w-10 h-10 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm">${name ? name[0] : '?'}</div>`;

                resultDiv.innerHTML = `
                <div class="flex items-center gap-3">
                    ${photo}
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-gray-800 text-sm truncate">${name}</h4>
                        <p class="text-[10px] text-gray-500 truncate">ID: ${tgId}</p>
                    </div>
                    <button onclick="clearTransferSelection()" class="ml-auto w-8 h-8 rounded-full bg-red-100 text-red-500 hover:bg-red-200 flex items-center justify-center transition shrink-0">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
            `;
                resultDiv.classList.remove('hidden');
                actionSection.classList.remove('hidden');
                document.getElementById('transfer-search-input').value = tgId;
            }

            async function submitTransfer() {
                if (!currentTransferReceiver) return;
                const amountInput = document.getElementById('transfer-amount-input');
                const amount = parseFloat(amountInput.value);

                if (isNaN(amount) || amount <= 0) {
                    return showToast('Please enter a valid amount');
                }
                if (window.appData && window.appData.user && window.appData.user.balance < amount) {
                    return showToast('Insufficient balance!');
                }

                const confirmMsg = `Are you sure you want to send ${formatCurrency(amount)} to ${currentTransferReceiver.firstName}?`;
                if (!confirm(confirmMsg)) return;

                try {
                    const token = localStorage.getItem('tg_token');
                    const res = await fetch('/api/transfer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({
                            receiverTgId: currentTransferReceiver.tgId,
                            amount: amount
                        })
                    });

                    const data = await res.json();
                    if (data.success) {
                        showToast('Transfer successful!');
                        amountInput.value = '';
                        document.getElementById('transfer-search-input').value = '';
                        document.getElementById('transfer-search-result').classList.add('hidden');
                        document.getElementById('transfer-action-section').classList.add('hidden');
                        currentTransferReceiver = null;
                        if (typeof fetchAppData === 'function') fetchAppData(silent);
                    } else {
                        showToast(data.error || 'Transfer failed');
                    }
                } catch (e) {
                    showToast('Network error during transfer');
                }
            }

            // Add switchTab hook to init inbox
            const originalSwitchTabForInbox = switchTab;
            switchTab = function (tabId, skipHistory = false) {
                originalSwitchTabForInbox(tabId, skipHistory);
                if (tabId === 'inbox') {
                    initInbox();
                }
            };

        