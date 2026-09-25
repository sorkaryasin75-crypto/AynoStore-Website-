

        // --- NEW CHECKOUT UI LOGIC ---

        // Override the original function
        window.continuePaymentFlow = function (plan) {
            if (!window.appData || !window.appData.user) {
                sessionStorage.setItem('pendingPaymentPlan', JSON.stringify({
                    plan: plan,
                    currentVPNId: currentVPN ? currentVPN.id : null,
                    currentDeliveryEmail: window.currentDeliveryEmail
                }));
                window.location.href = 'login.html';
                return;
            }

            window.currentPlan = plan;
            window.currentDiscount = 0;
            window.appliedCouponCode = null;

            const isAddBalance = plan.name === 'Add Balance';
            const category = currentVPN ? currentVPN.category : (plan.externalType || 'vpn');

            if (!isAddBalance && (category === 'mail' || category === 'number')) {
                const userBalance = window.appData.user?.balance || 0;

                if (category === 'mail') {
                    let productObj = currentVPN;
                    if (!productObj && window.appData.products) {
                        productObj = window.appData.products.find(p => (p._id || p.id) === plan.externalId);
                    }
                    let maxStock = productObj ? (productObj.stock || 0) : 0;
                    if (maxStock === true || String(maxStock) === 'true') maxStock = 1;
                    if (category === 'mail' && window.appData.mailStockSummary) {
                        const stockObj = window.appData.mailStockSummary.find(s => s._id === plan.externalId || (productObj && s._id === (productObj._id || productObj.id)) || (productObj && s._id === productObj.name) || s._id === plan.name);
                        if (stockObj) maxStock = stockObj.available;
                    }

                    if (maxStock <= 0) {
                        showToast("Product is out of stock!", "error");
                        return;
                    }

                    showBulkOrderConfirm(plan.name, plan.price, maxStock, (qty, totalCost) => {
                        window.currentPlan.price = totalCost;
                        window.currentBulkQuantity = qty;
                        window.currentMethod = { name: 'Wallet', isWallet: true };
                        window.appliedCouponCode = null;
                        document.getElementById('checkout-trx-id-input').value = 'DIRECT_BUY_' + Math.random().toString(36).substring(2, 10).toUpperCase();
                        showToast("Processing bulk order...", "info");
                        submitCheckoutPayment();
                    });
                } else {
                    if (userBalance < plan.price) {
                        showToast("Insufficient wallet balance! Please add funds.", "error");
                        switchTab('add-balance');
                        return;
                    }
                    showBeautifulConfirm(plan.name, plan.price, () => {
                        window.currentMethod = { name: 'Wallet', isWallet: true };
                        window.appliedCouponCode = null;
                        document.getElementById('checkout-trx-id-input').value = 'DIRECT_BUY_' + Math.random().toString(36).substring(2, 10).toUpperCase();
                        showToast("Processing order...", "info");
                        submitCheckoutPayment();
                    });
                }
                return;
            }

            // NEW FLOW: Render and show checkout view
            renderCheckoutStep1();
            switchTab('checkout');
        };

        window.renderCheckoutStep1 = function () {
            const plan = window.currentPlan;
            const vpn = currentVPN;

            // Product details
            document.getElementById('checkout-product-name').innerText = vpn ? vpn.name : plan.name;
            document.getElementById('checkout-plan-name').innerText = plan.name === 'Add Balance' ? 'Balance' : plan.name;
            const originalPriceEl = document.getElementById('checkout-plan-price');
            originalPriceEl.innerText = formatCurrency(plan.price);
            const discountedPriceEl = document.getElementById('checkout-plan-discounted-price');
            if (originalPriceEl && discountedPriceEl) {
                originalPriceEl.classList.remove('line-through', 'text-slate-400', 'text-lg');
                discountedPriceEl.classList.add('hidden');
            }

            const headerTitle = document.getElementById('checkout-header-title');
            const headerSubtitle = document.getElementById('checkout-header-subtitle');
            if (headerTitle && headerSubtitle) {
                if (plan.name === 'Add Balance' || (plan.id && plan.id.toString().toLowerCase() === 'add_balance')) {
                    headerTitle.innerText = 'Add Balance';
                    headerSubtitle.innerText = 'Choose your payment method';
                } else {
                    headerTitle.innerText = 'Checkout';
                    headerSubtitle.innerText = 'Complete your transaction';
                }
            }

            // Logo
            const logoEl = document.getElementById('checkout-product-logo');

            const fallbackEl = document.getElementById('checkout-product-logo-fallback');
            const actualLogo = (vpn && (vpn.logoUrl || vpn.logo)) ? (vpn.logoUrl || vpn.logo) : null;

            if (actualLogo) {
                logoEl.src = actualLogo;
                logoEl.style.display = 'block';
                if (fallbackEl) fallbackEl.style.display = 'none';
            } else {
                logoEl.style.display = 'none';
                if (fallbackEl) fallbackEl.style.display = 'block';
            }


            // Discount Badge
            const saveBadge = document.getElementById('checkout-save-badge');
            if (plan.originalPrice && plan.originalPrice > plan.price) {
                const discountPercentage = Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100);
                saveBadge.innerText = 'Save ' + discountPercentage + '%';
                saveBadge.classList.remove('hidden');
            } else {
                saveBadge.classList.add('hidden');
            }

            // Render Methods
            const container = document.getElementById('checkout-methods-grid');
            container.innerHTML = '';

            const settings = window.appData?.settings || {};
            let methods = [];
            if (settings.paymentMethods && Array.isArray(settings.paymentMethods)) {
                methods = settings.paymentMethods.filter(m => m.enabled !== false);
            } else {
                methods = [
                    { id: 'bk', name: 'Bkash', number: '01712345678' },
                    { id: 'ng', name: 'Nagad', number: '01712345678' }
                ];
            }

            // Always add wallet first, except for Add Balance
            const walletBalance = window.appData?.user?.balance || 0;
            if (plan.name !== 'Add Balance' && (!plan.id || plan.id.toString().toLowerCase() !== 'add_balance')) {
                methods.unshift({
                    id: 'wallet',
                    name: 'Wallet',
                    isWallet: true,
                    logo: 'fa-solid fa-wallet text-emerald-500',
                    subtitle: 'Instant Payment',
                    balance: walletBalance
                });
            }

            methods.forEach((m, i) => {
                const isSelected = i === 0;
                if (isSelected) window.currentMethod = m;

                let logoHtml = '';
                if (m.isWallet) {
                    logoHtml = `<div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                            <i class="${m.logo} text-xl"></i>
                        </div>`;
                } else {
                    const logoSrc = m.logoUrl || m.logo || `images/${m.name.toLowerCase()}.png`;
                    logoHtml = `<div class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                            <img src="${logoSrc}" class="w-full h-full object-contain p-1" onerror="this.outerHTML='<i class=\\'fa-solid fa-building-columns text-slate-400 text-xl\\'></i>'">
                        </div>`;
                }

                const subtitle = m.subtitle || (m.name.toLowerCase().includes('usdt') || m.name.toLowerCase().includes('binance') ? 'Crypto Payment' : 'Instant Payment');

                const borderClass = isSelected ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-100 bg-white hover:border-slate-200';
                const checkHtml = isSelected ? '<div class="absolute top-2 right-2 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-sm"><i class="fa-solid fa-check text-[10px]"></i></div>' : '';

                const extraInfo = m.isWallet ? `<div class="mt-1.5 inline-block bg-emerald-100/50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">৳ ${Number(walletBalance).toFixed(2)}</div>` : '';

                const card = document.createElement('div');
                card.className = `relative cursor-pointer border-2 rounded-2xl p-3 transition-all duration-200 flex items-center gap-3 ${borderClass}`;
                card.onclick = () => selectCheckoutMethod(m.id, methods);
                card.id = 'checkout-method-' + m.id;
                card.innerHTML = `
            ${checkHtml}
            ${logoHtml}
            <div>
                <div class="font-bold text-slate-800 text-sm leading-tight">${m.name}</div>
                <div class="text-[10px] text-slate-500 mt-0.5">${subtitle}</div>
                ${extraInfo}
            </div>
        `;
                container.appendChild(card);
            });

            // Reset coupon
            document.getElementById('checkout-coupon-input').value = '';
            const msg = document.getElementById('checkout-coupon-message');
            msg.classList.add('hidden');
            msg.className = 'text-[11px] font-bold text-center hidden mt-2';
            window.currentDiscount = 0;
        };

        window.selectCheckoutMethod = function (methodId, allMethods) {
            window.currentMethod = allMethods.find(m => m.id === methodId);
            // Re-render
            const container = document.getElementById('checkout-methods-grid');
            Array.from(container.children).forEach(child => {
                const id = child.id.replace('checkout-method-', '');
                if (id === methodId) {
                    child.classList.add('border-emerald-500', 'bg-emerald-50/10');
                    child.classList.remove('border-slate-100', 'bg-white', 'hover:border-slate-200');
                    if (!child.querySelector('.fa-check')) {
                        child.innerHTML += '<div class="absolute top-2 right-2 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-sm"><i class="fa-solid fa-check text-[10px]"></i></div>';
                    }
                } else {
                    child.classList.remove('border-emerald-500', 'bg-emerald-50/10');
                    child.classList.add('border-slate-100', 'bg-white', 'hover:border-slate-200');
                    const check = child.querySelector('.absolute.top-2.right-2');
                    if (check) check.remove();
                }
            });
        };

        window.applyCheckoutCoupon = async function () {
            const code = document.getElementById('checkout-coupon-input').value.trim();
            const msgEl = document.getElementById('checkout-coupon-message');

            if (!code) {
                msgEl.innerText = "Please enter a coupon code.";
                msgEl.className = "text-[11px] font-bold text-center mt-2 text-red-500";
                msgEl.classList.remove('hidden');
                return;
            }

            try {
                const response = await fetch('/api/user/validate-coupon', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (localStorage.getItem('ayno_token') || localStorage.getItem('tg_token'))
                    },
                    body: JSON.stringify({
                        code: code,
                        productId: currentVPN ? (currentVPN._id || currentVPN.id) : null,
                        category: currentVPN ? currentVPN.category : 'vpn'
                    })
                });

                const data = await response.json();

                if (response.ok && data.valid) {
                    msgEl.innerText = "Coupon applied! Discount: " + (data.coupon.discountType === 'fixed' ? '৳' + data.coupon.discountAmount : data.coupon.discountPercent + '%');
                    msgEl.className = "text-[11px] font-bold text-center mt-2 text-emerald-500";
                    msgEl.classList.remove('hidden');

                    window.appliedCouponCode = code;

                    if (data.coupon.discountType === 'fixed') {
                        window.currentDiscount = data.coupon.discountAmount;
                    } else {
                        window.currentDiscount = (window.currentPlan.price * data.coupon.discountPercent) / 100;
                    }

                    const originalPriceEl = document.getElementById('checkout-plan-price');
                    const discountedPriceEl = document.getElementById('checkout-plan-discounted-price');
                    if (originalPriceEl && discountedPriceEl) {
                        originalPriceEl.classList.add('line-through', 'text-slate-400', 'text-lg');
                        const newPrice = Math.max(0, window.currentPlan.price - window.currentDiscount);
                        discountedPriceEl.innerText = formatCurrency(newPrice);
                        discountedPriceEl.classList.remove('hidden');
                    }
                } else {
                    msgEl.innerText = data.error || "Invalid coupon code.";
                    msgEl.className = "text-[11px] font-bold text-center mt-2 text-red-500";
                    msgEl.classList.remove('hidden');
                    window.appliedCouponCode = null;
                    window.currentDiscount = 0;
                    
                    const originalPriceEl = document.getElementById('checkout-plan-price');
                    const discountedPriceEl = document.getElementById('checkout-plan-discounted-price');
                    if (originalPriceEl && discountedPriceEl) {
                        originalPriceEl.classList.remove('line-through', 'text-slate-400', 'text-lg');
                        discountedPriceEl.classList.add('hidden');
                    }
                    window.currentDiscount = 0;
                }
            } catch (error) {
                console.error('Error applying coupon:', error);
                msgEl.innerText = "Failed to validate coupon.";
                msgEl.className = "text-[11px] font-bold text-center mt-2 text-red-500";
                msgEl.classList.remove('hidden');
            }
        };

        window.proceedToPaymentStep2 = function () {
            if (!window.currentMethod) return;

            if (window.currentMethod.isWallet) {
                // Direct buy logic
                const finalPrice = Math.max(0, window.currentPlan.price - (window.currentDiscount || 0));
                const userBalance = window.appData?.user?.balance || 0;

                if (userBalance < finalPrice) {
                    showToast("Insufficient wallet balance! Please add funds or select another method.", "error");
                    return;
                }

                showBeautifulConfirm(window.currentPlan.name, finalPrice, () => {
                    document.getElementById('checkout-trx-id-input').value = 'WALLET_' + Math.random().toString(36).substring(2, 10).toUpperCase();
                    showToast("Processing order...", "info");
                    submitCheckoutPayment();
                });
                return;
            }

            // Render Step 2
            const method = window.currentMethod;
            const finalPrice = Math.max(0, window.currentPlan.price - (window.currentDiscount || 0));

            document.getElementById('checkout-step2-amount').innerText = '৳ ' + finalPrice;

            const logoSrc = method.logoUrl || method.logo || `images/${method.name.toLowerCase()}.png`;
            const mName = method.name.toLowerCase();

            // Dynamic Badge
            let badgeTextColor = 'text-slate-800';
            let bagdeIconColor = 'text-slate-600';
            if (mName.includes('bkash')) { badgeTextColor = 'text-pink-600'; bagdeIconColor = 'text-pink-500'; }
            if (mName.includes('nagad')) { badgeTextColor = 'text-orange-600'; bagdeIconColor = 'text-orange-500'; }
            if (mName.includes('rocket')) { badgeTextColor = 'text-purple-600'; bagdeIconColor = 'text-purple-500'; }
            if (mName.includes('binance') || mName.includes('usdt')) { badgeTextColor = 'text-yellow-700'; bagdeIconColor = 'text-yellow-600'; }

            document.getElementById('checkout-step2-method-badge').innerHTML = `
        <i class="fa-solid fa-wallet ${bagdeIconColor}"></i>
        <span class="font-bold text-[11px] ${badgeTextColor}">${method.name}</span>
    `;

            // Dynamic Card Color
            const card = document.getElementById('checkout-step2-card');
            card.className = "rounded-3xl p-5 shadow-xl relative overflow-hidden transition-colors duration-300 border";
            if (mName.includes('bkash')) {
                card.classList.add('bg-gradient-to-br', 'from-pink-500', 'to-rose-600', 'shadow-pink-500/30', 'border-pink-400');
            } else if (mName.includes('rocket')) {
                card.classList.add('bg-gradient-to-br', 'from-purple-500', 'to-indigo-600', 'shadow-purple-500/30', 'border-purple-400');
            } else if (mName.includes('binance') || mName.includes('usdt')) {
                card.classList.add('bg-gradient-to-br', 'from-yellow-500', 'to-amber-500', 'shadow-yellow-500/30', 'border-yellow-400');
            } else {
                // default Nagad/Orange
                card.classList.add('bg-gradient-to-br', 'from-orange-400', 'to-orange-500', 'shadow-orange-500/30', 'border-orange-300');
            }

            const list = document.getElementById('checkout-instruction-list');
            list.innerHTML = '';

            // Dynamic steps generator
            let stepNumber = 1;
            function addStep(iconHtml, textHtml, extraHtml = '') {
                const isLast = (stepNumber === 5);
                list.innerHTML += `
            <li class="flex gap-4">
                <div class="flex flex-col items-center">
                    <span class="w-[26px] h-[26px] rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-[12px] shrink-0 border border-white/30 shadow-sm backdrop-blur-sm">${stepNumber++}</span>
                    ${!isLast ? '<div class="w-0.5 h-full bg-white/20 mt-1.5 mb-1.5"></div>' : ''}
                </div>
                <div class="flex-1 pb-4">
                    <div class="flex items-start gap-3">
                        ${iconHtml}
                        <span class="text-white/95 text-[13px] font-bold leading-tight pt-1">${textHtml}</span>
                    </div>
                    ${extraHtml}
                </div>
            </li>`;
            }

            const mIcon = `<div class="w-[26px] h-[26px] rounded-lg bg-white shrink-0 shadow-sm flex items-center justify-center overflow-hidden"><img src="${logoSrc}" class="w-full h-full object-contain p-0.5" onerror="this.outerHTML='<i class=\'fa-solid fa-wallet text-slate-400 text-xs\'></i>'" /></div>`;
            const getGenericIcon = (faClass) => `<div class="w-[26px] h-[26px] rounded-lg bg-white/20 shrink-0 shadow-sm flex items-center justify-center backdrop-blur-sm border border-white/20"><i class="${faClass} text-white text-xs"></i></div>`;

            let ussd = '*247#';
            if (mName.includes('nagad')) ussd = '*167#';
            if (mName.includes('rocket')) ussd = '*322#';

            const isCrypto = mName.includes('usdt') || mName.includes('binance');

            if (isCrypto) {
                addStep(
                    mIcon,
                    `Open ${method.name} or your crypto wallet.`
                );
                addStep(
                    getGenericIcon('fa-solid fa-paper-plane'),
                    `Select "Withdraw" or "Send".`
                );
                addStep(
                    getGenericIcon('fa-solid fa-user'),
                    `Send crypto to the address below:`,
                    `<div class="mt-2.5 bg-white/10 border border-white/30 rounded-xl p-3 backdrop-blur-sm shadow-inner relative overflow-hidden">
                <div class="text-[10px] text-white/80 font-bold mb-1 uppercase tracking-wider">${method.name} Address</div>
                <div class="font-mono text-sm font-bold text-white tracking-widest break-all mb-2">${method.number}</div>
                <button class="bg-white hover:bg-white/90 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm" onclick="copyToClipboard('${method.number}')">
                    <i class="fa-regular fa-copy"></i> Copy
                </button>
            </div>`
                );
                addStep(
                    getGenericIcon('fa-solid fa-comment-dollar'),
                    `Amount: $ ${finalPrice}`
                );
                addStep(
                    getGenericIcon('fa-solid fa-file-lines'),
                    `Enter Transaction Hash (TxID) below and click VERIFY.`
                );
            } else {
                // MFS Logic (Nagad, bKash, Rocket)
                addStep(
                    mIcon,
                    `আপনার ${method.name} App অথবা USSD (${ussd}) খুলুন।`
                );
                addStep(
                    getGenericIcon('fa-solid fa-paper-plane'),
                    `"Send Money" অপশন সিলেক্ট করুন।`
                );
                addStep(
                    getGenericIcon('fa-solid fa-user'),
                    `নিচের নম্বরে টাকা পাঠান।`,
                    `<div class="mt-2.5 bg-white/10 border border-white/30 rounded-xl p-3 backdrop-blur-sm shadow-inner relative overflow-hidden">
                <div class="flex items-center justify-between">
                    <div>
                        <div class="text-[10px] text-white/80 font-bold mb-0.5 uppercase tracking-wider">${method.name} Number</div>
                        <div class="font-mono text-lg font-bold text-white tracking-widest">${method.number}</div>
                    </div>
                    <button class="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/30 shadow-sm" onclick="copyToClipboard('${method.number}')">
                        <i class="fa-regular fa-copy"></i> Copy
                    </button>
                </div>
            </div>`
                );
                addStep(
                    getGenericIcon('fa-solid fa-comment-dollar'),
                    `পরিমাণ: ৳ ${finalPrice}`
                );
                addStep(
                    getGenericIcon('fa-solid fa-file-lines'),
                    `Payment করার পর Transaction ID (TxID) দিতে ভুলবেন না। VERIFY করুন।`
                );
            }

            // Screenshot logic
            if (method.requireScreenshot) {
                document.getElementById('checkout-screenshot-upload-container').classList.remove('hidden');
            } else {
                document.getElementById('checkout-screenshot-upload-container').classList.add('hidden');
            }

            document.getElementById('checkout-trx-id-input').value = '';

            // Timer
            const timerText = document.getElementById('checkout-timer-text');
            let timeLeft = 15 * 60;

            if (window.checkoutTimerInterval) clearInterval(window.checkoutTimerInterval);
            window.checkoutTimerInterval = setInterval(() => {
                timeLeft--;
                if (timeLeft <= 0) {
                    clearInterval(window.checkoutTimerInterval);
                    timerText.innerText = "00:00";
                    showToast("Session expired. Please try again.", "error");
                    switchTab('home');
                } else {
                    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
                    const s = (timeLeft % 60).toString().padStart(2, '0');
                    timerText.innerText = `${m}:${s}`;
                }
            }, 1000);

            switchTab('checkout-step2');
        };
        window.submitCheckoutPayment = async function () {
            const trxId = document.getElementById('checkout-trx-id-input').value.trim();
            if (!trxId) {
                showToast("Please enter transaction ID", "error");
                return;
            }

            let btn = null;
            let originalText = '';
            try {
                btn = (typeof event !== 'undefined' && event && event.target) ? event.target.closest('button') : null;
            } catch (e) { }

            if (btn) {
                originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
                btn.disabled = true;
            }

            try {
                let screenshotUrl = null;
                if (window.currentMethod.requireScreenshot) {
                    const fileInput = document.getElementById('checkout-screenshot-input');
                    if (!fileInput.files[0]) {
                        showToast("Please upload payment screenshot", "error");
                        if (btn) {
                            btn.innerHTML = originalText;
                            btn.disabled = false;
                        }
                        return;
                    }
                    screenshotUrl = await uploadImageImgBB(fileInput.files[0]);
                    if (!screenshotUrl) {
                        showToast("Failed to upload screenshot", "error");
                        if (btn) {
                            btn.innerHTML = originalText;
                            btn.disabled = false;
                        }
                        return;
                    }
                }

                const isExternal = window.currentPlan && window.currentPlan.isExternal;
                const endpoint = isExternal ? '/api/buy-external' : '/api/orders';

                const finalPrice = Math.max(0, window.currentPlan.price - (window.currentDiscount || 0));
                let itemName = currentVPN ? currentVPN.name + ' - ' + window.currentPlan.name : window.currentPlan.name;

                const newOrder = {
                    id: 'AYN' + Math.floor(Math.random() * 1000000),
                    tgId: window.appData.user ? window.appData.user.tgId : null,
                    item: itemName,
                    category: currentVPN ? currentVPN.category : null,
                    plan: window.currentPlan ? window.currentPlan.name : null,
                    price: finalPrice,
                    method: window.currentMethod.name,
                    trxId: trxId,
                    status: 'Pending',
                    timestamp: Date.now(),
                    couponUsed: window.appliedCouponCode || null,
                    couponCode: window.appliedCouponCode || null,
                    deliveryEmail: window.currentDeliveryEmail || null,
                    screenshotUrl: screenshotUrl,
                    quantity: typeof window.currentBulkQuantity !== 'undefined' ? window.currentBulkQuantity : 1
                };

                const payload = isExternal ? {
                    externalId: window.currentPlan.externalId,
                    externalType: window.currentPlan.externalType,
                    service: window.currentPlan.service,
                    country: window.currentPlan.country,
                    price: finalPrice,
                    itemName: itemName,
                    quantity: typeof window.currentBulkQuantity !== 'undefined' ? window.currentBulkQuantity : 1,
                    method: window.currentMethod.name,
                    trxId: trxId,
                    deliveryEmail: window.currentDeliveryEmail || null,
                    couponCode: window.appliedCouponCode || null,
                    screenshotUrl: screenshotUrl
                } : newOrder;

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + (localStorage.getItem('ayno_token') || localStorage.getItem('tg_token'))
                    },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (res.ok) {
                    // Re-fetch user data and orders history
                    if (typeof fetchUser === 'function') fetchUser();
                    if (typeof fetchAppData === 'function') fetchAppData(true);

                    const isWallet = window.currentMethod.isWallet;

                    if (isWallet && window.appData && window.appData.user) {
                        window.appData.user.balance -= finalPrice;
                    }

                    // Generate receipt HTML
                    const receiptHtml = `
                <div class="text-center p-6 pb-2 relative">
                    <div class="absolute top-0 right-0 p-4 w-full flex justify-end z-10 pointer-events-none">
                        <img src="images/success.gif" class="w-32 opacity-80 mix-blend-multiply" style="margin-top:-20px; margin-right:-20px">
                    </div>
                    
                    <div class="w-20 h-20 bg-gradient-to-tr from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/30 text-white transform scale-110">
                        <i class="fa-solid fa-check text-4xl"></i>
                    </div>
                    
                    <h2 class="text-2xl font-black text-slate-800 mb-1 leading-tight">${isWallet ? 'Purchase Successful!' : 'Order Placed!'}</h2>
                    <p class="text-slate-500 text-sm mb-6 font-medium">${isWallet ? 'Your account details are ready.' : 'We are verifying your payment.'}</p>
                    
                    <div class="bg-slate-50 rounded-2xl p-5 text-left border border-slate-100 shadow-inner">
                        <div class="flex justify-between items-center mb-4 pb-4 border-b border-slate-200/60">
                            <span class="text-slate-500 text-xs font-bold uppercase tracking-wider">Amount Paid</span>
                            <span class="font-black text-2xl text-emerald-600">${formatCurrency(window.currentPlan.price - (window.currentDiscount || 0))}</span>
                        </div>
                        <div class="space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-slate-500 text-xs font-medium">Package</span>
                                <span class="font-bold text-slate-800 text-sm">${window.currentPlan.name}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-slate-500 text-xs font-medium">Payment Method</span>
                                <span class="font-bold text-slate-800 text-sm flex items-center gap-1.5"><i class="${isWallet ? 'fa-solid fa-wallet text-emerald-500' : 'fa-solid fa-money-bill-transfer text-blue-500'}"></i> ${window.currentMethod.name}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-slate-500 text-xs font-medium">Transaction ID</span>
                                <span class="font-mono text-xs font-bold text-slate-800 bg-slate-200/50 px-2 py-0.5 rounded">${trxId}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-slate-500 text-xs font-medium">Order ID</span>
                                <span class="font-mono text-xs font-bold text-slate-800">#${data.orderId ? data.orderId.substring(0, 8).toUpperCase() : Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <button class="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-slate-800 transition-colors transform active:scale-95" onclick="Swal.close(); switchTab('orders')">
                        View My Orders
                    </button>
                </div>
            `;

                    Swal.fire({
                        html: receiptHtml,
                        showConfirmButton: false,
                        padding: '0',
                        background: '#fff',
                        customClass: {
                            popup: 'rounded-3xl shadow-2xl border border-slate-100 overflow-hidden'
                        },
                        allowOutsideClick: false
                    });

                    if (window.checkoutTimerInterval) clearInterval(window.checkoutTimerInterval);

                } else {
                    showToast(data.error || "Payment submission failed", "error");
                }
            } catch (e) {
                console.error(e);
                showToast("Err: " + (e.message || e), "error");
            } finally {
                if (btn) {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            }
        };
    