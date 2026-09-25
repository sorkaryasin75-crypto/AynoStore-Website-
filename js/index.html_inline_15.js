
        let scratchIsRevealed = false;
        let scratchIsDragging = false;
        let scratchCtx;

        function openScratchModal() {
            if (!window.appData || !window.appData.user || !window.appData.user.pendingScratchCards || window.appData.user.pendingScratchCards.length === 0) return;
            const card = window.appData.user.pendingScratchCards[0];

            document.getElementById('scratch-prize-source').innerText = 'Reward for: ' + (card.productName || 'Premium Product');
            document.getElementById('scratch-modal').classList.remove('hidden');
            document.getElementById('scratch-modal').classList.add('flex');
            initScratchCanvas();
        }

        function closeScratchModal() {
            document.getElementById('scratch-modal').classList.add('hidden');
            document.getElementById('scratch-modal').classList.remove('flex');
        }

        function closeScratchModalAndRefresh() {
            closeScratchModal();
            fetchAppData();
        }

        function initScratchCanvas() {
            const canvas = document.getElementById('scratch-canvas');
            const container = document.getElementById('scratch-container');
            scratchCtx = canvas.getContext('2d', { willReadFrequently: true });

            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;

            const gradient = scratchCtx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#e5e7eb');
            gradient.addColorStop(0.5, '#9ca3af');
            gradient.addColorStop(1, '#d1d5db');

            scratchCtx.fillStyle = gradient;
            scratchCtx.fillRect(0, 0, canvas.width, canvas.height);

            scratchCtx.fillStyle = 'rgba(255,255,255,0.4)';
            scratchCtx.font = 'bold 24px sans-serif';
            scratchCtx.textAlign = 'center';
            scratchCtx.textBaseline = 'middle';

            scratchCtx.save();
            scratchCtx.translate(canvas.width / 2, canvas.height / 2);
            scratchCtx.rotate(-Math.PI / 4);
            scratchCtx.fillText('SCRATCH HERE', 0, 0);
            scratchCtx.fillText('SCRATCH HERE', 0, -100);
            scratchCtx.fillText('SCRATCH HERE', 0, 100);
            scratchCtx.restore();

            scratchCtx.globalCompositeOperation = 'destination-out';
            scratchIsRevealed = false;
            canvas.style.opacity = '1';
            canvas.style.pointerEvents = 'auto';

            // Reset Prize UI
            document.getElementById('scratch-coin-icon').classList.remove('scale-100');
            document.getElementById('scratch-coin-icon').classList.remove('opacity-100');
            document.getElementById('scratch-prize-title').style.opacity = '0';
            document.getElementById('scratch-prize-amount').style.opacity = '0';
            document.getElementById('scratch-claim-btn').classList.remove('scale-100');
        }

        function getScratchMousePos(evt) {
            const canvas = document.getElementById('scratch-canvas');
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            let clientX, clientY;
            if (evt.touches && evt.touches.length > 0) {
                clientX = evt.touches[0].clientX;
                clientY = evt.touches[0].clientY;
            } else {
                clientX = evt.clientX;
                clientY = evt.clientY;
            }

            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        }

        function doScratch(x, y) {
            if (scratchIsRevealed) return;
            scratchCtx.beginPath();
            scratchCtx.arc(x, y, 25, 0, Math.PI * 2);
            scratchCtx.fill();
            checkScratchReveal();
        }

        function checkScratchReveal() {
            if (Math.random() > 0.1) return;
            const canvas = document.getElementById('scratch-canvas');
            const imageData = scratchCtx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            let transparentPixels = 0;
            for (let i = 3; i < pixels.length; i += 4) {
                if (pixels[i] === 0) transparentPixels++;
            }
            const totalPixels = pixels.length / 4;
            const percentScratched = (transparentPixels / totalPixels) * 100;

            if (percentScratched > 50 && !scratchIsRevealed) {
                revealScratchPrize();
            }
        }

        async function revealScratchPrize() {
            scratchIsRevealed = true;
            const canvas = document.getElementById('scratch-canvas');
            canvas.style.opacity = '0';
            canvas.style.pointerEvents = 'none';

            // Fetch actual reward from backend
            try {
                const token = localStorage.getItem('ayno_token') || localStorage.getItem('tg_token');
                const res = await fetch('/api/loyalty/scratch', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                if (data.success) {
                    document.getElementById('scratch-prize-amount').innerText = data.reward + ' Coins';

                    document.getElementById('scratch-coin-icon').classList.add('scale-100');
                    document.getElementById('scratch-coin-icon').classList.add('opacity-100');
                    document.getElementById('scratch-prize-title').style.opacity = '1';
                    document.getElementById('scratch-prize-amount').style.opacity = '1';
                    document.getElementById('scratch-claim-btn').classList.add('scale-100');

                    if (typeof confetti !== 'undefined') {
                        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                    }
                } else {
                    showToast(data.error || 'Failed to claim', 'error');
                }
            } catch (e) {
                showToast('Network error', 'error');
            }
        }

        const scratchCanvasEl = document.getElementById('scratch-canvas');
        if (scratchCanvasEl) {
            scratchCanvasEl.addEventListener('mousedown', (e) => { scratchIsDragging = true; const pos = getScratchMousePos(e); doScratch(pos.x, pos.y); });
            scratchCanvasEl.addEventListener('mousemove', (e) => { if (scratchIsDragging) { const pos = getScratchMousePos(e); doScratch(pos.x, pos.y); } });
            scratchCanvasEl.addEventListener('mouseup', () => { scratchIsDragging = false; });
            scratchCanvasEl.addEventListener('mouseleave', () => { scratchIsDragging = false; });
            scratchCanvasEl.addEventListener('touchstart', (e) => { e.preventDefault(); scratchIsDragging = true; const pos = getScratchMousePos(e); doScratch(pos.x, pos.y); });
            scratchCanvasEl.addEventListener('touchmove', (e) => { e.preventDefault(); if (scratchIsDragging) { const pos = getScratchMousePos(e); doScratch(pos.x, pos.y); } });
            scratchCanvasEl.addEventListener('touchend', () => { scratchIsDragging = false; });
        }
    