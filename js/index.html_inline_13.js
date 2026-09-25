
        let currentWithdrawType = 'cash';
        let selectedWithdrawMethod = null;

        function setWithdrawType(type) {
            currentWithdrawType = type;
            const btnCash = document.getElementById('btn-type-cash');
            const btnWallet = document.getElementById('btn-type-wallet');
            const formCash = document.getElementById('withdraw-cash-form');
            const formWallet = document.getElementById('withdraw-wallet-form');
            const title = document.getElementById('withdraw-form-title');
            const hint = document.getElementById('withdraw-min-hint');

            if (type === 'cash') {
                btnCash.className = 'flex-1 bg-white text-indigo-700 font-bold py-2.5 rounded-xl text-sm transition shadow-sm active:scale-95';
                btnWallet.className = 'flex-1 bg-indigo-800/50 hover:bg-indigo-800/70 text-indigo-50 font-bold py-2.5 rounded-xl text-sm transition shadow-sm border border-indigo-500/30 active:scale-95';
                formCash.classList.remove('hidden');
                formWallet.classList.add('hidden');
                title.innerText = 'Withdraw Cash';
                hint.innerText = 'Minimum withdrawal: ৳50';
            } else {
                btnWallet.className = 'flex-1 bg-white text-indigo-700 font-bold py-2.5 rounded-xl text-sm transition shadow-sm active:scale-95';
                btnCash.className = 'flex-1 bg-indigo-800/50 hover:bg-indigo-800/70 text-indigo-50 font-bold py-2.5 rounded-xl text-sm transition shadow-sm border border-indigo-500/30 active:scale-95';
                formWallet.classList.remove('hidden');
                formCash.classList.add('hidden');
                title.innerText = 'Transfer to Wallet';
                hint.innerText = 'Instantly credited to main balance';
            }
        }


        function updateWithdrawPlaceholder(methodName) {
            const lbl = document.getElementById('withdraw-account-label');
            const input = document.getElementById('withdraw-account');
            if (!lbl || !input || !methodName) return;

            const m = methodName.toLowerCase();
            if (m.includes('bep20')) {
                lbl.innerText = 'BEP20 Address';
                input.placeholder = 'e.g. 0x...';
            } else if (m.includes('binance') || m.includes('pay id')) {
                lbl.innerText = 'Binance UID / Pay ID';
                input.placeholder = 'e.g. 12345678';
            } else if (m.includes('bkash')) {
                lbl.innerText = 'bKash Number';
                input.placeholder = 'e.g. 017xxxxxxxx';
            } else if (m.includes('nagad')) {
                lbl.innerText = 'Nagad Number';
                input.placeholder = 'e.g. 017xxxxxxxx';
            } else if (m.includes('rocket')) {
                lbl.innerText = 'Rocket Number';
                input.placeholder = 'e.g. 017xxxxxxxx';
            } else {
                lbl.innerText = 'Account Number';
                input.placeholder = 'e.g. 017xxxxxxxx';
            }
        }

        function renderWithdrawMethods() {
            const container = document.getElementById('withdraw-methods-container');
            if (!container) return;
            container.innerHTML = '';

            if (window.appData && window.appData.settings && window.appData.settings.paymentMethods) {
                const methods = window.appData.settings.paymentMethods;
                if (methods.length === 0) {
                    container.innerHTML = '<p class="text-xs text-red-500 col-span-3">No payment methods found.</p>';
                    return;
                }

                methods.forEach((m, idx) => {
                    if (!selectedWithdrawMethod && idx === 0) selectedWithdrawMethod = m.name;

                    const isSelected = selectedWithdrawMethod === m.name;
                    const borderClass = isSelected ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20' : 'border-slate-200 bg-white hover:border-indigo-300';

                    const div = document.createElement('div');
                    div.className = `cursor-pointer border rounded-xl p-2 flex flex-col items-center gap-1 transition ${borderClass}`;
                    div.onclick = () => {
                        selectedWithdrawMethod = m.name;
                        renderWithdrawMethods();
                    };

                    div.innerHTML = `
                <img src="${m.logoUrl}" alt="${m.name}" class="w-8 h-8 object-contain rounded-md">
                <span class="text-[10px] font-bold text-slate-700 text-center leading-tight">${m.name}</span>
            `;
                    container.appendChild(div);
                });
            } else {
                container.innerHTML = '<p class="text-xs text-red-500 col-span-3">No payment methods found.</p>';
            }
            if (selectedWithdrawMethod) {
                updateWithdrawPlaceholder(selectedWithdrawMethod);
            }
        }

        function renderWithdrawHistory() {
            const container = document.getElementById('withdraw-history-container');
            if (!container) return;

            if (window.appData && window.appData.withdrawals) {
                const history = window.appData.withdrawals;
                if (history.length === 0) {
                    container.innerHTML = '<div class="p-6 text-center text-slate-500 text-sm">No history found.</div>';
                    return;
                }

                container.innerHTML = '';
                history.forEach((w, i) => {
                    const date = new Date(w.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' });

                    let statusClass = 'text-yellow-600 bg-yellow-50';
                    let statusIcon = 'fa-clock';
                    if (w.status === 'Completed') { statusClass = 'text-green-600 bg-green-50'; statusIcon = 'fa-check-circle'; }
                    else if (w.status === 'Rejected') { statusClass = 'text-red-600 bg-red-50'; statusIcon = 'fa-times-circle'; }

                    const methodDisplay = w.type === 'wallet' ? 'Main Wallet' : w.method;
                    const iconDisplay = w.type === 'wallet' ? '<i class="fa-solid fa-wallet text-indigo-500"></i>' : '<i class="fa-solid fa-money-bill-transfer text-emerald-500"></i>';

                    container.innerHTML += `
                <div class="p-4 flex items-center justify-between ${i !== history.length - 1 ? 'border-b border-slate-100' : ''}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shadow-sm border border-slate-100 text-lg">
                            ${iconDisplay}
                        </div>
                        <div>
                            <h4 class="font-bold text-slate-800 text-sm leading-tight">${methodDisplay}</h4>
                            <p class="text-[10px] text-slate-500 mt-0.5">${date} - ${w.id}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-extrabold text-slate-800 text-sm mb-0.5">৳${w.amount}</p>
                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 justify-end ${statusClass}">
                            <i class="fa-solid ${statusIcon}"></i> ${w.status}
                        </span>
                    </div>
                </div>
            `;
                });
            }
        }

        async function submitWithdraw() {
            const amount = document.getElementById('withdraw-amount').value;
            const account = document.getElementById('withdraw-account').value;
            const btn = document.getElementById('withdraw-submit-btn');

            if (!amount || Number(amount) <= 0) return showToast('Enter a valid amount', 'error');
            if (currentWithdrawType === 'cash' && Number(amount) < 50) return showToast('Minimum withdrawal is ৳50', 'error');
            const available = window.appData && window.appData.user && window.appData.user.referralStats ? window.appData.user.referralStats.referralBalance : 0;
            if (Number(amount) > available) return showToast('Insufficient referral balance', 'error');
            if (currentWithdrawType === 'cash' && !account) return showToast('Enter account number', 'error');
            if (currentWithdrawType === 'cash' && !selectedWithdrawMethod) return showToast('Select a payment method', 'error');

            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
            btn.disabled = true;

            try {
                const token = localStorage.getItem('tg_token');
                const res = await fetch('/api/withdraw', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify({
                        amount: amount,
                        type: currentWithdrawType,
                        method: currentWithdrawType === 'cash' ? selectedWithdrawMethod : null,
                        accountNumber: currentWithdrawType === 'cash' ? account : null
                    })
                });
                const data = await res.json();

                if (data.success) {
                    showToast(data.message, 'success');
                    document.getElementById('withdraw-amount').value = '';
                    document.getElementById('withdraw-account').value = '';

                    // Update local state
                    if (window.appData) {
                        if (window.appData.user) {
                            window.appData.user.referralStats.referralBalance = data.newReferralBalance;
                            if (data.newBalance !== undefined) window.appData.user.balance = data.newBalance;
                        }
                        if (!window.appData.withdrawals) window.appData.withdrawals = [];
                        window.appData.withdrawals.unshift(data.withdrawal);
                    }

                    updateReferStats();
                    renderProfileStats();

                    if (currentWithdrawType === 'wallet') {
                        setTimeout(() => switchTab('home'), 1500);
                    }
                } else {
                    showToast(data.error || 'Failed', 'error');
                }
            } catch (e) {
                showToast('Network error', 'error');
            }

            btn.innerHTML = '<span>Confirm Request</span><i class="fa-solid fa-arrow-right"></i>';
            btn.disabled = false;
        }


        function openLeaderboardModal() {
            const modal = document.getElementById('leaderboard-modal');
            const content = document.getElementById('leaderboard-modal-content');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                content.classList.remove('translate-y-full');
            }, 10);
        }
        function closeLeaderboardModal() {
            const modal = document.getElementById('leaderboard-modal');
            const content = document.getElementById('leaderboard-modal-content');
            modal.classList.add('opacity-0');
            content.classList.add('translate-y-full');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
        }

        async function fetchAndRenderLeaderboard() {
            const section = document.getElementById('referral-leaderboard-section');
            const list = document.getElementById('referral-leaderboard-list');
            if (!section || !list) return;

            if (window.appData && window.appData.settings && window.appData.settings.showLeaderboard === false) {
                section.classList.add('hidden');
                return;
            }

            try {
                const res = await fetch('/api/leaderboard');
                const data = await res.json();

                if (data.enabled === false) {
                    section.classList.add('hidden');
                    return;
                }

                section.classList.remove('hidden');

                if (!data.success || !data.leaderboard || data.leaderboard.length === 0) {
                    list.innerHTML = '<div class="p-8 text-center text-slate-400"><p class="text-xs font-medium">No top earners yet. Start referring!</p></div>';
                    return;
                }

                const medals = ['text-yellow-400', 'text-slate-400', 'text-amber-600'];
                const bgRanks = ['bg-yellow-50', 'bg-slate-50', 'bg-amber-50'];

                list.innerHTML = data.leaderboard.map((u, i) => {
                    const name = (u.firstName || '') + ' ' + (u.lastName || '');
                    const displayName = name.trim() || u.username || 'User';
                    const initial = displayName.charAt(0).toUpperCase();

                    const isTop3 = i < 3;
                    const rankIcon = isTop3 ? `<i class="fa-solid fa-medal ${medals[i]} text-xl"></i>` : `<span class="text-sm font-bold text-slate-400 w-5 text-center">#${i + 1}</span>`;

                    const avatarHtml = u.photoUrl ?
                        `<img src="${u.photoUrl}" class="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm">` :
                        `<div class="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm">${initial}</div>`;

                    return `
                <li class="p-4 flex items-center justify-between ${isTop3 ? bgRanks[i] : 'bg-white'} hover:bg-slate-50 transition">
                    <div class="flex items-center gap-4">
                        <div class="flex items-center justify-center w-6">${rankIcon}</div>
                        <div class="flex items-center gap-3">
                            ${avatarHtml}
                            <div class="flex flex-col">
                                <span class="text-sm font-bold text-slate-800">${displayName}</span>
                                ${isTop3 ? '<span class="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">Top Earner</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-base font-extrabold text-green-600">৳${u.referralEarnings}</span>
                    </div>
                </li>
            `;
                }).join('');

            } catch (e) {
                console.error("Leaderboard fetch error:", e);
                list.innerHTML = '<div class="p-8 text-center text-red-400"><p class="text-xs font-medium">Failed to load leaderboard</p></div>';
            }
        }

        const originalProfileStatsForLB = window.renderProfileStats;
        window.renderProfileStats = function () {
            if (originalProfileStatsForLB) originalProfileStatsForLB();
            if (document.getElementById('refer-view') && !document.getElementById('refer-view').classList.contains('hidden')) {
                fetchAndRenderLeaderboard();
            }
        };

        const originalSwitchTab = window.switchTab;
        window.switchTab = function (tabId, el) {
            if (originalSwitchTab) originalSwitchTab(tabId, el);
            if (tabId === 'refer') {
                fetchAndRenderLeaderboard();
            }
        };


        function startAdminKeyTimer(tgId) {
            // Admin Key display has been removed
        }
    