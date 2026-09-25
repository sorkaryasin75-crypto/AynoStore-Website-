
        function showGlobalNotification(title, msg, iconClass = 'fa-bell', iconColorClass = 'text-indigo-500') {
            const modal = document.getElementById('global-notification-modal');
            const content = document.getElementById('global-notification-content');

            document.getElementById('global-notif-title').innerText = title;
            document.getElementById('global-notif-msg').innerText = msg;

            const iconEl = document.getElementById('global-notif-icon');
            iconEl.className = `fa-solid ${iconClass} ${iconColorClass} text-3xl`;

            modal.classList.remove('hidden');
            modal.classList.add('flex');

            // play a tiny sound if possible
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.volume = 0.5;
                audio.play().catch(e => { });
            } catch (e) { }

            setTimeout(() => {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
            }, 10);
        }

        function closeGlobalNotification() {
            const modal = document.getElementById('global-notification-modal');
            const content = document.getElementById('global-notification-content');
            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
        }

        // Setup 10-second polling for real-time updates
        document.addEventListener('DOMContentLoaded', () => {
            setInterval(() => {
                if (window.appData && window.appData.user) {
                    fetchAppData(true);
                }
            }, 2000);
        });
    