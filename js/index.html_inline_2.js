

        // Override submitPayment specifically for Add Balance Screenshot Upload
        function submitPayment() {
            const isAddBalance = typeof currentPlan !== 'undefined' && currentPlan && currentPlan.name && currentPlan.name.toLowerCase().includes('add balance');
            const fileInput = document.getElementById('screenshot-input');

            if (isAddBalance && fileInput && fileInput.files.length > 0) {
                // Handle Screenshot Upload Flow
                const trxIdInput = document.getElementById('trx-id-input');
                const userTrxId = trxIdInput ? trxIdInput.value.trim() : '';
                if (!userTrxId) {
                    alert("Please enter your Transaction ID (TxID) first!");
                    return;
                }

                const btn = event.currentTarget || document.querySelector('button[onclick="submitPayment()"]');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
                btn.disabled = true;

                // 1. Create Pending Order First
                const finalPrice = Math.max(0, currentPlan.price - (typeof currentDiscount !== 'undefined' ? currentDiscount : 0));
                const newOrder = {
                    id: 'AYN' + Math.floor(Math.random() * 1000000),
                    tgId: (window.appData && window.appData.user) ? window.appData.user.tgId : null,
                    item: currentPlan.name,
                    price: finalPrice,
                    method: (typeof currentMethod !== 'undefined' && currentMethod) ? currentMethod.name : 'Unknown',
                    trxId: userTrxId,
                    status: 'Pending',
                    timestamp: Date.now()
                };

                fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('tg_token')}` },
                    body: JSON.stringify(newOrder)
                }).then(res => res.json()).then(data => {
                    if (!data.success) {
                        alert(data.error || 'Failed to create order');
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                        return;
                    }

                    // 2. Upload Screenshot to /api/verify-screenshot
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
                    const formData = new FormData();
                    formData.append('screenshot', fileInput.files[0]);

                    fetch('/api/verify-screenshot', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('tg_token')}` },
                        body: formData
                    }).then(res => res.json()).then(verifyData => {
                        btn.innerHTML = originalText;
                        btn.disabled = false;

                        if (verifyData.success) {
                            // Success!
                            if (window.appData && window.appData.user) window.appData.user.balance = verifyData.newBalance;
                            document.querySelectorAll('.user-balance-text').forEach(el => el.innerText = (typeof formatCurrency !== 'undefined') ? formatCurrency(verifyData.newBalance) : verifyData.newBalance);

                            const successContainer = document.getElementById('pay-step-success');
                            if (successContainer) {
                                if (verifyData.status === 'Manual_Review') {
                                    successContainer.innerHTML = `
                                <div class="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <i class="fa-solid fa-clock text-4xl"></i>
                                </div>
                                <h3 class="text-xl font-bold text-gray-800 mb-1">Under Review!</h3>
                                <p class="text-xs text-gray-500 mb-6">Your payment screenshot has been sent for manual verification. It will be approved shortly.</p>
                                <button class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold" onclick="finishOrder()">Got it</button>
                            `;
                                } else {
                                    successContainer.innerHTML = `
                                <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                    <i class="fa-solid fa-check text-4xl"></i>
                                </div>
                                <h3 class="text-xl font-bold text-gray-800 mb-1">Payment Verified!</h3>
                                <p class="text-xs text-gray-500 mb-6">Your balance has been added automatically.</p>
                                <button class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold" onclick="finishOrder()">Great</button>
                            `;
                                }
                            }
                            if (typeof goPayStep === 'function') goPayStep(3); // show success
                        } else {
                            alert(verifyData.error || 'Verification Failed');
                        }
                    }).catch(e => {
                        alert('Verification error. Please try again.');
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                    });
                }).catch(e => {
                    alert('Network error.');
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                });

                return; // Prevent original submitPayment from running
            }

            // Fallback to original flow (e.g. for Products where they just enter TRX ID)
            if (typeof originalSubmitPaymentFunc === 'function') {
                originalSubmitPaymentFunc.apply(this, arguments);
            }
        }



        let paymentTimerInterval;
        function startPaymentTimer() {
            clearInterval(paymentTimerInterval);
            let timeLeft = 15 * 60; // 15 mins
            const timerText = document.getElementById('payment-timer-text');
            document.getElementById('payment-timer-container').classList.remove('hidden');

            paymentTimerInterval = setInterval(() => {
                timeLeft--;
                if (timeLeft <= 0) {
                    clearInterval(paymentTimerInterval);
                    timerText.innerText = "00:00";
                    alert("Payment session expired!");
                    closePaymentModal();
                } else {
                    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
                    const s = (timeLeft % 60).toString().padStart(2, '0');
                    timerText.innerText = `${m}:${s}`;
                }
            }, 1000);
        }

        function stopPaymentTimer() {
            clearInterval(paymentTimerInterval);
            const container = document.getElementById('payment-timer-container');
            if (container) container.classList.add('hidden');
        }

        // Hook into goPayStep to start timer and show/hide upload UI
        const originalGoPayStep = window.goPayStep;
        window.goPayStep = function (step) {
            if (typeof originalGoPayStep === 'function') originalGoPayStep(step);

            // Default show/hide logic (in case original is missing)
            document.getElementById('pay-step-1').classList.add('hidden');
            document.getElementById('pay-step-2').classList.add('hidden');
            document.getElementById('pay-step-success').classList.add('hidden');
            if (step === 1) document.getElementById('pay-step-1').classList.remove('hidden');
            if (step === 2) document.getElementById('pay-step-2').classList.remove('hidden');
            if (step === 3) document.getElementById('pay-step-success').classList.remove('hidden');

            if (step === 2 && !currentMethod?.isWallet) {
                startPaymentTimer();
                // Check if it's "Add Balance" to show Screenshot Upload
                // Screenshot upload removed, always show TrxID input
                document.getElementById('screenshot-upload-container').classList.add('hidden');
                document.getElementById('trx-input-container').classList.remove('hidden');
                if (document.getElementById('trx-id-input').value === 'UPLOAD_WAITING') {
                    document.getElementById('trx-id-input').value = '';
                }
            } else {
                stopPaymentTimer();
            }
        }


        document.addEventListener("DOMContentLoaded", () => {
            const particleContainer = document.getElementById('particles-container');
            if (particleContainer) {
                for (let i = 0; i < 15; i++) {
                    const particle = document.createElement('div');
                    particle.classList.add('splash-particle');
                    const size = Math.random() * 6 + 2;
                    const left = Math.random() * 100;
                    const top = Math.random() * 60 + 40;
                    const delay = Math.random() * 5;
                    const duration = Math.random() * 4 + 4;
                    particle.style.width = `${size}px`;
                    particle.style.height = `${size}px`;
                    particle.style.left = `${left}%`;
                    particle.style.top = `${top}%`;
                    particle.style.animationDelay = `${delay}s`;
                    particle.style.animationDuration = `${duration}s`;
                    particleContainer.appendChild(particle);
                }
            }

            const progressFill = document.getElementById('progressFill');
            const splashScreen = document.getElementById('splashScreen');

            if (progressFill) {
                progressFill.style.transition = 'width 3s cubic-bezier(0.75, 0, 0.25, 1)';
                void progressFill.offsetWidth;
                requestAnimationFrame(() => {
                    progressFill.style.width = '100%';
                });
            }

            window.hideSplashScreen = function () {
                const splashScreen = document.getElementById('splashScreen');
                if (splashScreen && splashScreen.style.display !== 'none' && splashScreen.style.opacity !== '0') {
                    splashScreen.style.opacity = '0';
                    setTimeout(() => {
                        splashScreen.style.display = 'none';
                        // Show the main app container just in case it wasn't shown by fetchAppData
                        document.getElementById('app-container').style.display = 'block';
                    }, 600);
                }
            };

            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('product')) {
                if (splashScreen) {
                    splashScreen.style.display = 'none';
                    splashScreen.style.opacity = '0';
                }
                document.getElementById('app-container').style.display = 'block';
            } else {
                // Fallback in case of total freeze
                setTimeout(window.hideSplashScreen, 8000);
            }
        });
    