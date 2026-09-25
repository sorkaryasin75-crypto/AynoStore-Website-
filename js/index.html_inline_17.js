
        function showPublicFeed() {
            document.getElementById('public-feed-view').classList.remove('hidden');
            document.getElementById('public-feed-view').classList.add('flex');
            // Default to today if not set
            const dateInput = document.getElementById('public-feed-date');
            if (!dateInput.value) {
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const dd = String(today.getDate()).padStart(2, '0');
                dateInput.value = `${yyyy}-${mm}-${dd}`;
            }
            loadPublicFeed(dateInput.value);
        }

        function hidePublicFeed() {
            document.getElementById('public-feed-view').classList.add('hidden');
            document.getElementById('public-feed-view').classList.remove('flex');
        }

        function loadPublicFeed(dateStr) {
            const listEl = document.getElementById('public-feed-list');
            listEl.innerHTML = `
                <div class="p-8 text-center text-slate-400">
                    <i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2"></i>
                    <p class="text-sm">Loading feed...</p>
                </div>
            `;
            
            fetch('/api/public-feed?date=' + (dateStr || '') + '&t=' + Date.now(), { cache: 'no-store' })
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.feed) {
                        if (data.feed.length === 0) {
                            listEl.innerHTML = `
                                <div class="p-8 text-center text-slate-400">
                                    <i class="fa-solid fa-box-open text-3xl mb-2 opacity-50"></i>
                                    <p class="text-sm">No orders found for this date.</p>
                                </div>
                            `;
                            return;
                        }
                        
                        listEl.innerHTML = data.feed.map(tx => {
                            let statusBadge = '';
                            if (tx.status === 'Completed' || tx.status === 'Approved') {
                                statusBadge = '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold tracking-wider uppercase">COMPLETED</span>';
                            } else if (tx.status === 'Cancelled' || tx.status === 'Rejected') {
                                statusBadge = '<span class="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[9px] font-bold tracking-wider uppercase">CANCELLED</span>';
                            } else {
                                statusBadge = '<span class="px-2 py-0.5 bg-orange-100 text-orange-600 rounded text-[9px] font-bold tracking-wider uppercase">PENDING</span>';
                            }

                            const d = new Date(tx.date);
                            let hours = d.getHours();
                            let minutes = String(d.getMinutes()).padStart(2, '0');
                            const ampm = hours >= 12 ? 'PM' : 'AM';
                            hours = hours % 12;
                            hours = hours ? hours : 12; 
                            const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

                            const firstLetter = tx.name ? tx.name.charAt(0).toUpperCase() : 'U';
                            const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-blue-500', 'bg-orange-500', 'bg-purple-500', 'bg-rose-500'];
                            const colorClass = colors[tx.name.length % colors.length] || 'bg-indigo-500';
                            
                            let avatarHtml = '';
                            if (tx.photoUrl) {
                                avatarHtml = `<img src="${tx.photoUrl}" class="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover shadow-sm shrink-0" onerror="this.outerHTML='<div class=\\'w-10 h-10 md:w-12 md:h-12 rounded-full ${colorClass} text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0\\'>${firstLetter}</div>'">`;
                            } else {
                                avatarHtml = `<div class="w-10 h-10 md:w-12 md:h-12 rounded-full ${colorClass} text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">${firstLetter}</div>`;
                            }

                            return `
                                <div class="p-3 md:p-4 hover:bg-slate-50 transition flex items-center justify-between gap-2 md:gap-4">
                                    <div class="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                                        ${avatarHtml}
                                        <div class="min-w-0 pr-2">
                                            <p class="text-[9px] md:text-[10px] text-slate-400 mb-0.5">${timeStr}</p>
                                            <p class="text-xs md:text-base font-bold text-slate-800 truncate">${tx.name}</p>
                                        </div>
                                    </div>
                                    
                                    <div class="hidden sm:flex items-center gap-3 flex-[1.5] px-2 md:px-4">
                                        <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0 shadow-inner">
                                            <i class="fa-solid fa-cart-shopping text-sm"></i>
                                        </div>
                                        <div class="min-w-0">
                                            <p class="text-xs font-bold text-slate-800">Purchase</p>
                                            <p class="text-[10px] text-slate-500 truncate">${tx.item}</p>
                                        </div>
                                    </div>
                                    
                                    <div class="sm:hidden flex flex-col flex-[1.2] min-w-0 px-2 border-l border-slate-100">
                                        <p class="text-[9px] font-bold text-slate-800 truncate">Purchase</p>
                                        <p class="text-[9px] text-slate-500 truncate leading-tight mt-0.5">${tx.item}</p>
                                    </div>

                                    <div class="flex flex-col items-end gap-1 shrink-0 w-[60px] md:w-[80px]">
                                        ${statusBadge}
                                        <p class="text-xs md:text-sm font-bold text-slate-700 mt-0.5">৳${tx.price}</p>
                                    </div>
                                </div>
                            `;
                        }).join('');
                    } else {
                        listEl.innerHTML = `
                            <div class="p-8 text-center text-red-400">
                                <i class="fa-solid fa-triangle-exclamation text-2xl mb-2"></i>
                                <p class="text-sm">Failed to load feed.</p>
                            </div>
                        `;
                    }
                }).catch(e => {
                    listEl.innerHTML = `
                        <div class="p-8 text-center text-red-400">
                            <i class="fa-solid fa-wifi text-2xl mb-2"></i>
                            <p class="text-sm">Network error.</p>
                        </div>
                    `;
                });
        }
    