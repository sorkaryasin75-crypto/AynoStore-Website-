
        window.openProxyCheckerModal = function () {
            document.getElementById('proxy-checker-input').value = '';
            document.getElementById('proxy-checker-result').classList.add('hidden');

            const modal = document.getElementById('proxy-checker-modal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        };

        window.closeProxyCheckerModal = function () {
            const modal = document.getElementById('proxy-checker-modal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        };

        window.checkProxyMb = async function () {
            const input = document.getElementById('proxy-checker-input').value.trim();
            if (!input) {
                showToast('Please enter Proxy Port or ID', 'error');
                return;
            }

            const btn = document.getElementById('proxy-check-btn');
            const origHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking...';
            btn.disabled = true;

            try {
                const res = await fetch('/api/tools/proxy-checker', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('tg_token') },
                    body: JSON.stringify({ port: input })
                });
                const data = await res.json();

                if (data.success) {
                    document.getElementById('proxy-checker-result').classList.remove('hidden');
                    document.getElementById('proxy-checker-mb').innerText = data.remainingMb + ' MB';
                    document.getElementById('proxy-checker-desc').innerText = `Valid for Port: ${input}`;
                    showToast('Proxy data fetched successfully', 'success');
                } else {
                    showToast(data.error || 'Failed to check proxy', 'error');
                }
            } catch (e) {
                showToast('Network error, try again.', 'error');
            }

            btn.innerHTML = origHtml;
            btn.disabled = false;
        };
    