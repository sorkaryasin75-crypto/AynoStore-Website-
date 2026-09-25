
        let vpnAgreeTimer = null;
        let currentPlanToBuy = null;

        function openVPNRulesView() {
            currentPlanToBuy = null;
            switchTab('vpn-rules');
            setupAgreementButton();
        }

        function showAgreementModal(plan) {
            currentPlanToBuy = plan;
            if (currentPlanToBuy) {
                startPayment(currentPlanToBuy);
            }
        }

        function setupAgreementButton() {
            // Disabled: Skipping the 5-second wait rule
        }

        function showLogoutModal() {
            const modal = document.getElementById('logout-confirm-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                setTimeout(() => {
                    modal.classList.remove('opacity-0');
                    modal.children[0].classList.remove('translate-y-full', 'sm:translate-y-8');
                }, 10);
            }
        }

        function hideLogoutModal() {
            const modal = document.getElementById('logout-confirm-modal');
            if (modal) {
                modal.classList.add('opacity-0');
                modal.children[0].classList.add('translate-y-full', 'sm:translate-y-8');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }, 300);
            }
        }

        function executeLogout() {
            localStorage.removeItem('tg_token');
            localStorage.removeItem('activeMailAccount');
            window.location.href = '/login.html';
        }

        // Keep this just in case anything else calls it
        function handleLogout() {
            showLogoutModal();
        }

        function hideBackupKeyModal() {
            const modal = document.getElementById('backup-key-modal');
            if (modal) {
                modal.classList.add('opacity-0');
                modal.children[0].classList.add('translate-y-full', 'sm:translate-y-8');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }, 300);
            }
        }

        function copyModalBackupKey() {
            const input = document.getElementById('modal-backup-key-input');
            if (input) {
                input.select();
                input.setSelectionRange(0, 99999);
                try {
                    document.execCommand("copy");
                    showToast('Backup Key copied!', 'success');
                } catch (err) {
                    showToast('Failed to copy', 'error');
                }
            }
        }

        async function fetchBackupKey() {
            try {
                showToast('Fetching backup key...', 'info');
                const token = localStorage.getItem('tg_token');
                const res = await fetch('/api/user/backup-key', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                if (data.success && data.backupKey) {
                    const input = document.getElementById('modal-backup-key-input');
                    if (input) input.value = data.backupKey;

                    const modal = document.getElementById('backup-key-modal');
                    if (modal) {
                        modal.classList.remove('hidden');
                        modal.classList.add('flex');
                        setTimeout(() => {
                            modal.classList.remove('opacity-0');
                            modal.children[0].classList.remove('translate-y-full', 'sm:translate-y-8');
                        }, 10);
                    }
                } else {
                    showToast(data.error || 'Failed to fetch backup key', 'error');
                }
            } catch (err) {
                showToast('Network error while fetching backup key', 'error');
            }
        }

        function copyBackupKey() {
            const input = document.getElementById('backup-key-input');
            input.select();
            input.setSelectionRange(0, 99999); // For mobile devices
            try {
                document.execCommand("copy");
                showToast('Backup Key copied to clipboard!', 'success');
            } catch (err) {
                showToast('Failed to copy', 'error');
            }
        }

        async function handleAvatarUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('avatar', file);

            try {
                const token = localStorage.getItem('tg_token');
                const res = await fetch('/api/user/avatar', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                const data = await res.json();
                if (data.success) {
                    const profileAvatar = document.getElementById('profile-avatar');
                    const homeAvatar = document.getElementById('home-avatar');
                    const sidebarAvatar = document.getElementById('sidebar-avatar');

                    if (profileAvatar) profileAvatar.src = data.photoUrl;
                    if (homeAvatar) homeAvatar.src = data.photoUrl;
                    if (sidebarAvatar) sidebarAvatar.src = data.photoUrl;

                    showToast('Profile picture updated successfully!', 'success');
                } else {
                    showToast(data.error || 'Failed to update profile picture', 'error');
                }
            } catch (err) {
                console.error('Upload Error:', err);
                showToast('Network error during upload', 'error');
            }
        }

        // Theme Logic
        function setTheme(mode) {
            const html = document.documentElement;
            const btnLight = document.getElementById('btn-theme-light');
            const btnDark = document.getElementById('btn-theme-dark');

            if (mode === 'dark') {
                html.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
                if (btnDark && btnLight) {
                    btnDark.classList.add('bg-white', 'shadow', 'text-gray-800');
                    btnDark.classList.remove('text-gray-500', 'hover:text-gray-700');
                    btnLight.classList.remove('bg-white', 'shadow', 'text-gray-800');
                    btnLight.classList.add('text-gray-500', 'hover:text-gray-700');
                }
            } else {
                html.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
                if (btnDark && btnLight) {
                    btnLight.classList.add('bg-white', 'shadow', 'text-gray-800');
                    btnLight.classList.remove('text-gray-500', 'hover:text-gray-700');
                    btnDark.classList.remove('bg-white', 'shadow', 'text-gray-800');
                    btnDark.classList.add('text-gray-500', 'hover:text-gray-700');
                }
            }
        }

        if (localStorage.getItem('theme') === 'dark') {
            setTheme('dark');
        }

        // Google Translate
        function googleTranslateElementInit() {
            new google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'en,bn',
                autoDisplay: false
            }, 'google_translate_element');
        }

        function changeLanguage(lang) {
            const select = document.querySelector(".goog-te-combo");
            if (select) {
                select.value = lang;
                select.dispatchEvent(new Event('change'));
            }
        }
    