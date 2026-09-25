
        let currentVpnExpiryAlert = null;

        function showVpnExpiryPopup(alertData, user) {
            if (!alertData) return;

            // 1. Check if user already dismissed/acknowledged in this browser
            if (localStorage.getItem('vpn_expiry_dismissed') === 'true') return;
            const dismissedUntil = Number(localStorage.getItem('vpn_expiry_dismissed_until') || 0);
            if (Date.now() < dismissedUntil) return;

            // 2. Check if this specific order was already acknowledged
            if (alertData.orderId && localStorage.getItem('vpn_expiry_acked_' + alertData.orderId) === 'true') return;

            // 3. Prevent duplicate showing in the same session
            if (window.__vpnExpiryPopupShown) return;
            window.__vpnExpiryPopupShown = true;
            currentVpnExpiryAlert = alertData;

            const modal = document.getElementById('vpn-expiry-popup-modal');
            const content = document.getElementById('vpn-expiry-popup-content');
            if (!modal || !content) return;

            let userName = user ? ((user.firstName || '') + (user.lastName ? ' ' + user.lastName : '')).trim() || user.username : '';
            if (!userName) userName = 'গ্রাহক';

            const vpnName = alertData.vpnName || 'VPN';
            const pkg = alertData.packageName || '';

            const bodyEl = document.getElementById('vpn-expiry-popup-body');
            if (bodyEl) {
                bodyEl.innerHTML = `
                    <p class="text-gray-800 font-semibold text-base">প্রিয় <span class="text-indigo-600 font-bold">${userName}</span>,</p>
                    <p class="text-gray-600">আপনার <b class="text-gray-900">${vpnName}${pkg ? ` (${pkg})` : ''}</b> প্যাকেজটির মেয়াদ শেষ হয়ে গেছে। ⏳</p>
                    <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-medium leading-relaxed">
                        🚀 নিরবচ্ছিন্ন ও সুপার-ফাস্ট ইন্টারনেট উপভোগ করতে সেরা মূল্যে এখনই রিনিউ করে নিন! ⚡
                    </div>
                `;
            }

            modal.classList.remove('hidden');
            modal.classList.add('flex');

            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.volume = 0.4;
                audio.play().catch(() => { });
            } catch (_) { }

            setTimeout(() => {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
            }, 10);
        }

        function handleVpnExpiryAction(renew) {
            const modal = document.getElementById('vpn-expiry-popup-modal');
            const content = document.getElementById('vpn-expiry-popup-content');

            if (content) {
                content.classList.remove('scale-100', 'opacity-100');
                content.classList.add('scale-95', 'opacity-0');
            }
            setTimeout(() => {
                if (modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }
            }, 200);

            // Persist dismissal in localStorage so popup never pops up again
            localStorage.setItem('vpn_expiry_dismissed', 'true');
            localStorage.setItem('vpn_expiry_dismissed_until', (Date.now() + 30 * 24 * 60 * 60 * 1000).toString());
            if (currentVpnExpiryAlert && currentVpnExpiryAlert.orderId) {
                localStorage.setItem('vpn_expiry_acked_' + currentVpnExpiryAlert.orderId, 'true');
            }

            // Clear in-memory alert list immediately
            if (window.appData) {
                window.appData.expiredVpnAlerts = [];
            }

            const token = localStorage.getItem('tg_token');
            const orderId = currentVpnExpiryAlert ? currentVpnExpiryAlert.orderId : null;
            const tgId = (window.appData && window.appData.user) ? window.appData.user.tgId : null;

            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            fetch('/api/user/vpn-expiry/ack', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ orderId, tgId })
            }).catch(e => console.error("Expiry ack error:", e));

            if (renew) {
                if (typeof openVPNStore === 'function') {
                    openVPNStore('vpn');
                } else if (typeof renderVPNs === 'function') {
                    renderVPNs('vpn');
                }
            }
        }
    