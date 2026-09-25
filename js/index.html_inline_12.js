
        function copyReferLink(type = 'tg') {
            const linkId = type === 'web' ? 'refer-link-display-web' : 'refer-link-display-tg';
            let linkText = document.getElementById(linkId).innerText;
            // Add https:// only if not present
            if (!linkText.startsWith('http')) linkText = 'https://' + linkText;
            copyToClipboard(linkText);
        }

        function shareReferTelegram() {
            const linkText = document.getElementById('refer-link-display-tg').innerText;
            const fullLink = 'https://' + linkText;
            const text = encodeURIComponent('Hey! Join Ayno Store to buy cheap VPNs and Subscriptions. Use my link to get a special discount!');
            window.open('https://t.me/share/url?url=' + encodeURIComponent(fullLink) + '&text=' + text, '_blank');
        }

        function shareReferWhatsApp() {
            const linkText = document.getElementById('refer-link-display-web').innerText;
            const fullLink = 'https://' + linkText;
            const text = encodeURIComponent('Hey! Join Ayno Store to buy cheap VPNs and Subscriptions. Use my link to get a special discount!\n\n' + fullLink);
            window.open('https://api.whatsapp.com/send?text=' + text, '_blank');
        }

        function updateReferStats() {
            let tgId = 'LOGIN_TO_GET_CODE';
            let u = null;

            if (window.appData && window.appData.user) {
                u = window.appData.user;
                tgId = u.tgId || '0000';
            }

            // Use bot username from settings if available
            const botUsername = (window.appData && window.appData.settings && window.appData.settings.botUsername) || 'AynoStoreBot';

            // Display both links
            const webUrl = `${window.location.host}/login?ref=${tgId}`;
            const tgUrl = `t.me/${botUsername}?start=ref_${tgId}`;

            const webEl = document.getElementById('refer-link-display-web');
            const tgEl = document.getElementById('refer-link-display-tg');

            if (webEl) webEl.innerText = webUrl;
            if (tgEl) tgEl.innerText = tgUrl;

            if (u) {
                // Fix missing referral stats by pulling directly from user object
                const totalEarningsEl = document.getElementById('refer-total-earnings');
                if (totalEarningsEl) totalEarningsEl.innerText = formatCurrency(u.referralEarnings || 0);

                const refBal = u.referralBalance || 0;
                const refBalEl = document.getElementById('refer-available-balance');
                if (refBalEl) refBalEl.innerText = formatCurrency(refBal);

                const wBalEl = document.getElementById('withdraw-available-balance');
                if (wBalEl) wBalEl.innerText = formatCurrency(refBal);

                renderWithdrawMethods();
                renderWithdrawHistory();

                const joinedEl = document.getElementById('refer-total-joined');
                if (joinedEl) joinedEl.innerText = u.referralsCount || 0;

                const convEl = document.getElementById('refer-total-conversions');
                if (convEl) convEl.innerText = u.referralsConversionCount || 0;
            }
        }

        // Hook into fetchAppData success
        const originalRenderFunc = window.renderProfileStats || function () { };

        window.parseProviderStockInput = function (text) {
            if (!text) {
                document.getElementById('prov-stock-email').value = '';
                document.getElementById('prov-stock-pass').value = '';
                document.getElementById('prov-stock-key').value = '';
                return;
            }
            let email = '', password = '', code = '';

            const emailMatch = text.match(/(?:Email|Username|User|ID)\s*[:-]\s*([^\s]+)/i);
            if (emailMatch) email = emailMatch[1];
            else {
                const rawEmail = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                if (rawEmail) email = rawEmail[0];
            }

            const passMatch = text.match(/(?:Password|Pass|Passcode)\s*[:-]\s*([^\s]+)/i);
            if (passMatch) password = passMatch[1];

            const codeMatch = text.match(/(?:CODE|KEY|PIN)\s*[:-]\s*([A-Z0-9-]+)/i);
            if (codeMatch) code = codeMatch[1];

            if (!email && !password && !code) {
                const comboMatch = text.match(/([^\s:|]+)[:|]([^\s]+)/);
                if (comboMatch) {
                    email = comboMatch[1];
                    password = comboMatch[2];
                }
            }

            document.getElementById('prov-stock-email').value = email || '';
            document.getElementById('prov-stock-pass').value = password || '';
            document.getElementById('prov-stock-key').value = code || '';
        };

        window.submitProviderStock = async function () {
            const email = document.getElementById('prov-stock-email').value;
            const password = document.getElementById('prov-stock-pass').value;
            const securityKey = document.getElementById('prov-stock-key').value;

            if (!email) return alert('Email/Username could not be extracted. Please check the format.');
            if (!window.currentPendingReq || !window.currentPendingReq.productId) return alert('No pending request found.');

            try {
                const res = await fetch('/api/user/provider-submit-stock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('tg_token') },
                    body: JSON.stringify({
                        productId: window.currentPendingReq.productId,
                        productName: window.currentPendingReq.productName,
                        plan: window.currentPendingReq.plan,
                        limit: window.currentPendingReq.limit,
                        email, password, securityKey
                    })
                });
                const data = await res.json();
                if (data.success) {
                    showToast('Stock submitted successfully!', 'success');
                    document.getElementById('prov-stock-input').value = '';
                    parseProviderStockInput('');
                    fetchProviderDashboard(); // refresh
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (e) {
                alert('Failed to submit stock');
            }
        };

        window.fetchProviderDashboard = async function () {
            try {
                const res = await fetch('/api/user/provider-dashboard', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('tg_token') } });
                const data = await res.json();
                if (data.success && data.isProvider) {
                    document.getElementById('profile-provider-section').classList.remove('hidden');
                    document.getElementById('prov-added-today').innerText = data.stats.today;
                    document.getElementById('prov-added-week').innerText = data.stats.week;
                    document.getElementById('prov-unpaid-total').innerText = data.stats.unpaidCount;

                    const list = document.getElementById('prov-unpaid-list');
                    if (data.stats.unpaidBreakdown && data.stats.unpaidBreakdown.length > 0) {
                        list.innerHTML = data.stats.unpaidBreakdown.map(b => `<div class="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100"><div><p class="font-bold text-gray-700 text-[10px] uppercase">${b.productName}</p><p class="text-[9px] text-gray-500 font-semibold">${b.plan || '-'}</p></div><span class="font-bold text-rose-500 text-xs">${b.count}</span></div>`).join('');
                    } else {
                        list.innerHTML = '<div class="text-center text-gray-400 text-xs py-2">No unpaid items</div>';
                    }

                    if (data.pendingRequest) {
                        window.currentPendingReq = data.pendingRequest;
                        document.getElementById('prov-pending-request-banner').classList.remove('hidden');
                        document.getElementById('prov-pending-details').innerText = `Product: ${data.pendingRequest.productName} ${data.pendingRequest.plan ? '(' + data.pendingRequest.plan + ')' : ''}`;
                    } else {
                        window.currentPendingReq = null;
                        document.getElementById('prov-pending-request-banner').classList.add('hidden');
                    }
                } else {
                    document.getElementById('profile-provider-section').classList.add('hidden');
                }
            } catch (e) {
                console.error('Failed to load provider dashboard', e);
            }
        };

        window.renderProfileStats = function () {
            originalRenderFunc();
            updateReferStats();
        };
        // Also call immediately if data already exists
        setTimeout(updateReferStats, 1000);
    