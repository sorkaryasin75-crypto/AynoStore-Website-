
        function base32ToBuffer(base32) {
            const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
            base32 = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
            let bits = 0;
            let value = 0;
            let index = 0;
            const output = new Uint8Array((base32.length * 5 / 8) | 0);
            for (let i = 0; i < base32.length; i++) {
                value = (value << 5) | alphabet.indexOf(base32[i]);
                bits += 5;
                if (bits >= 8) {
                    output[index++] = (value >>> (bits - 8)) & 255;
                    bits -= 8;
                }
            }
            return output;
        }

        async function generateTOTPCode(secret) {
            try {
                const keyBuffer = base32ToBuffer(secret);
                const key = await crypto.subtle.importKey(
                    'raw', keyBuffer, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
                );

                const epoch = Math.floor(Date.now() / 1000);
                const time = Math.floor(epoch / 30);

                const timeBuffer = new ArrayBuffer(8);
                const timeView = new DataView(timeBuffer);
                timeView.setUint32(4, time, false);

                const signature = await crypto.subtle.sign('HMAC', key, timeBuffer);
                const hmac = new Uint8Array(signature);

                const offset = hmac[hmac.length - 1] & 0xf;
                const code = ((hmac[offset] & 0x7f) << 24) |
                    ((hmac[offset + 1] & 0xff) << 16) |
                    ((hmac[offset + 2] & 0xff) << 8) |
                    (hmac[offset + 3] & 0xff);

                const otp = (code % 1000000).toString().padStart(6, '0');
                const remaining = 30 - (epoch % 30);
                return { otp, remaining };
            } catch (e) {
                console.error(e);
                return null;
            }
        }

        window.totpInterval = null;

        window.generateTOTPUI = async function () {
            const secret = document.getElementById('totp-secret-input').value.trim();
            if (!secret) {
                showToast('Please paste a 2FA secret key', 'error');
                return;
            }

            const res = await generateTOTPCode(secret);
            if (!res) {
                showToast('Invalid 2FA secret key', 'error');
                return;
            }

            document.getElementById('totp-result-container').classList.remove('hidden');
            document.getElementById('totp-timer-container').classList.remove('hidden');

            const codeDisplay = document.getElementById('totp-code-display');
            if (codeDisplay.innerText !== res.otp) {
                codeDisplay.innerText = res.otp;
                codeDisplay.classList.add('scale-105', 'text-indigo-600');
                setTimeout(() => codeDisplay.classList.remove('scale-105', 'text-indigo-600'), 300);
            }

            updateTOTPTimerUI(res.remaining);

            if (window.totpInterval) clearInterval(window.totpInterval);
            window.totpInterval = setInterval(async () => {
                const currentRes = await generateTOTPCode(secret);
                if (currentRes) {
                    if (codeDisplay.innerText !== currentRes.otp) {
                        codeDisplay.innerText = currentRes.otp;
                        codeDisplay.classList.add('scale-105', 'text-indigo-600');
                        setTimeout(() => codeDisplay.classList.remove('scale-105', 'text-indigo-600'), 300);
                    }
                    updateTOTPTimerUI(currentRes.remaining);
                }
            }, 1000);
        };

        function updateTOTPTimerUI(remaining) {
            document.getElementById('totp-timer-text').innerText = remaining + 's';
            const circle = document.getElementById('totp-timer-circle');
            const pct = remaining / 30;
            const dashoffset = 50.2 * (1 - pct);
            circle.style.strokeDashoffset = dashoffset;
            if (remaining <= 5) {
                circle.setAttribute('stroke', '#EF4444');
                document.getElementById('totp-timer-text').classList.add('text-red-500');
                document.getElementById('totp-timer-text').classList.remove('text-indigo-500');
            } else {
                circle.setAttribute('stroke', '#6366F1');
                document.getElementById('totp-timer-text').classList.remove('text-red-500');
                document.getElementById('totp-timer-text').classList.add('text-indigo-500');
            }
        }

        window.copyTOTP = function () {
            const text = document.getElementById('totp-code-display').innerText;
            if (text && text !== '------') {
                copyToClipboard(text);
            }
        };

        window.clearTOTP = function () {
            document.getElementById('totp-secret-input').value = '';
            if (window.totpInterval) clearInterval(window.totpInterval);
            document.getElementById('totp-result-container').classList.add('hidden');
            document.getElementById('totp-timer-container').classList.add('hidden');
            document.getElementById('totp-code-display').innerText = '------';
        };
    