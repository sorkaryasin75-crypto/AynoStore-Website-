
            // --- Currency State ---
            window.userCurrency = localStorage.getItem('ayno_currency') || 'BDT';
            window.formatCurrency = function (amountInBdt) {
                let num = Number(amountInBdt);
                if (isNaN(num)) num = 0;
                if (window.userCurrency === 'USDT') {
                    const rate = window.appData?.settings?.usdRate || 125;
                    return '$' + (num / rate).toFixed(2);
                }
                return '৳ ' + num.toFixed(2).replace(/\.00$/, ''); // keeps it clean for whole numbers
            };
            window.toggleUserCurrency = function () {
                window.userCurrency = window.userCurrency === 'BDT' ? 'USDT' : 'BDT';
                localStorage.setItem('ayno_currency', window.userCurrency);

                // Re-render views
                updateBalanceUI();
                if (document.getElementById('home-view').classList.contains('active')) renderProducts();
                if (document.getElementById('orders-view').classList.contains('active')) renderOrders();

                // Re-render quick add buttons and labels if we are on add-balance view
                document.querySelectorAll('.quick-amt-btn').forEach(btn => {
                    if (btn.dataset.balance) {
                        btn.innerText = formatCurrency(btn.dataset.balance);
                    }
                });
                const minEl = document.getElementById('min-add-balance-text');
                if (minEl) {
                    const minVal = window.appData?.settings?.minAddBalance || 50;
                    minEl.innerText = 'Minimum add balance ' + formatCurrency(minVal);
                }

                const prefLabel = document.getElementById('profile-currency-label');
                if (prefLabel) prefLabel.innerText = window.userCurrency;

                showToast('Currency switched to ' + window.userCurrency, 'success');
            };
            // ----------------------

            let inboxPollInterval = null;

            async function buyExternalMailProduct(product) {
                if (!confirm(`Buy ${product.name} for ${formatCurrency(product.price)}?`)) return;

                showToast('Processing purchase...', 'info');

                try {
                    const token = localStorage.getItem('tg_token');
                    const res = await fetch('/api/buy-external', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + token },
                        body: JSON.stringify({
                            externalId: product.id,
                            externalType: 'mail',
                            itemName: product.name,
                            price: product.price
                        })
                    });

                    const data = await res.json();
                    if (data.success) {
                        showToast('Purchase successful!', 'success');
                        window.appData.orders.unshift(data.order);
                        if (data.order && data.order.pointsEarned && data.order.pointsEarned > 0) {
                            if (typeof window.showCoinRewardPopup === 'function') {
                                window.showCoinRewardPopup(data.order.pointsEarned);
                            }
                        }
                        fetchAppData(); // refresh balance
                        switchTab('orders');
                    } else {
                        showToast(data.error || 'Purchase failed', 'error');
                    }
                } catch (e) {
                    showToast('Network error', 'error');
                }
            }

            function switchTab(tabId, skipHistory = false) {
                if (tabId === 'profile' && window.isGuest) {
                    window.location.href = '/login.html';
                    return;
                }

                const isTg = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData;
                if (!skipHistory && !isTg) {
                    try {
                        history.pushState({ tab: tabId }, '', '#' + tabId);
                    } catch (e) {
                        console.warn("history.pushState not supported or allowed", e);
                    }
                }

                // Hide all views
                document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
                // Show target view
                document.getElementById(tabId + '-view').classList.add('active');

                // Scroll to top to prevent white space
                window.scrollTo(0, 0);

                // Reset all nav items
                document.getElementById('nav-home').className = 'flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 w-12 md:w-16 pb-2 cursor-pointer';
                document.getElementById('nav-home').querySelector('span').className = 'text-[9px] md:text-[10px] font-medium';
                document.getElementById('nav-home').querySelector('i').className = 'fa-solid fa-house text-xl md:text-2xl';

                document.getElementById('nav-orders').className = 'flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 w-12 md:w-16 pb-2 cursor-pointer';
                document.getElementById('nav-orders').querySelector('span').className = 'text-[9px] md:text-[10px] font-medium';
                document.getElementById('nav-orders').querySelector('i').className = 'fa-regular fa-clipboard text-xl md:text-2xl';

                document.getElementById('nav-inbox').className = 'flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 w-12 md:w-16 pb-2 cursor-pointer';
                document.getElementById('nav-inbox').querySelector('span').className = 'text-[9px] md:text-[10px] font-medium';
                document.getElementById('nav-inbox').querySelector('i').className = 'fa-regular fa-envelope text-xl md:text-2xl';

                document.getElementById('nav-profile').className = 'flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 w-12 md:w-16 pb-2 cursor-pointer';
                document.getElementById('nav-profile').querySelector('span').className = 'text-[9px] md:text-[10px] font-medium';
                document.getElementById('nav-profile').querySelector('i').className = 'fa-regular fa-user text-xl md:text-2xl';

                // Reset middle button
                let btn = document.getElementById('add-balance-btn');
                btn.className = 'absolute -top-2 w-14 h-14 md:w-16 md:h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 text-2xl border-4 border-white cursor-pointer hover:bg-indigo-100 transition shadow-sm';
                let btnInner = btn.querySelector('.bg-white.text-indigo-600');
                if (btnInner) {
                    btnInner.className = 'absolute bottom-2 right-2 md:bottom-3 md:right-3 bg-white text-indigo-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-indigo-100 shadow-sm';
                }
                let btnText = document.getElementById('add-balance-text');
                btnText.className = 'text-[9px] md:text-[10px] font-medium text-gray-600 mt-2';

                // Set active tab classes
                if (tabId === 'home') {
                    document.getElementById('nav-home').className = 'flex flex-col items-center gap-1 text-indigo-600 w-12 md:w-16 pb-2 cursor-pointer';
                    document.getElementById('nav-home').querySelector('span').className = 'text-[9px] md:text-[10px] font-semibold';

                    document.body.style.backgroundColor = '#fcfdfd';

                    // Re-style middle button for home page style
                    btn.className = 'absolute -top-2 w-14 h-14 md:w-16 md:h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-200 border-4 border-white cursor-pointer hover:bg-indigo-600 transition';
                }
                else if (tabId === 'orders') {
                    document.getElementById('nav-orders').className = 'flex flex-col items-center gap-1 text-indigo-600 w-12 md:w-16 pb-2 cursor-pointer';
                    document.getElementById('nav-orders').querySelector('span').className = 'text-[9px] md:text-[10px] font-bold';
                    document.getElementById('nav-orders').querySelector('i').className = 'fa-solid fa-clipboard-list text-xl md:text-2xl';

                    document.body.style.backgroundColor = '#f8fafc';
                }
                else if (tabId === 'add-balance') {
                    btn.className = 'absolute -top-2 w-14 h-14 md:w-16 md:h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-300 border-4 border-indigo-50 cursor-pointer hover:bg-indigo-700 transition';
                    if (btnInner) {
                        btnInner.className = 'absolute bottom-2 right-2 md:bottom-3 md:right-3 bg-white text-indigo-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-indigo-200';
                    }
                    btnText.className = 'text-[9px] md:text-[10px] font-bold text-indigo-600 mt-2';

                    document.body.style.backgroundColor = '#f8fafc';
                }
                else if (tabId === 'inbox') {
                    document.getElementById('nav-inbox').className = 'flex flex-col items-center gap-1 text-indigo-600 w-12 md:w-16 pb-2 cursor-pointer';
                    document.getElementById('nav-inbox').querySelector('span').className = 'text-[9px] md:text-[10px] font-bold';
                    document.getElementById('nav-inbox').querySelector('i').className = 'fa-solid fa-envelope text-xl md:text-2xl';

                    document.body.style.backgroundColor = '#f4f7fb';
                }
                else if (tabId === 'withdraw') {
                    document.body.style.backgroundColor = '#f8fafc';
                }
                else if (tabId === 'profile') {
                    document.getElementById('nav-profile').className = 'flex flex-col items-center gap-1 text-indigo-600 w-12 md:w-16 pb-2 cursor-pointer';
                    document.getElementById('nav-profile').querySelector('span').className = 'text-[9px] md:text-[10px] font-bold';
                    document.getElementById('nav-profile').querySelector('i').className = 'fa-solid fa-user text-xl md:text-2xl';

                    document.body.style.backgroundColor = '#f8fafc';
                }
            }

            // Default to home on load
            switchTab('home', true);

            // Handle back button
            window.addEventListener('popstate', (e) => {
                if (e.state && e.state.tab) {
                    switchTab(e.state.tab, true);
                } else {
                    // Default or empty state
                    const hash = window.location.hash.replace('#', '');
                    if (hash) {
                        switchTab(hash, true);
                    } else {
                        switchTab('home', true);
                    }
                }
            });

        