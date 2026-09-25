
            // --- ELITE VPN LOGIC (LOCAL STORAGE) ---
            var DEFAULT_PRODUCTS = [];
            var PAYMENT_METHODS = [];

            // Init LocalStorage safely
            try {
                if (!localStorage.getItem('ayno_products')) localStorage.setItem('ayno_products', JSON.stringify(DEFAULT_PRODUCTS));
                if (!localStorage.getItem('ayno_orders')) localStorage.setItem('ayno_orders', JSON.stringify([]));
            } catch (e) {
                console.error('LocalStorage error:', e);
            }

            let currentVPN = null;
            let currentPlan = null;
            let currentMethod = null;
            let currentNumberFilter = 'global';
            let currentStoreCategory = null;

            let smsbowerServices = [];
            let selectedService = null;

            async function fetchSmsbowerServices() {
                if (smsbowerServices.length > 0) return smsbowerServices;
                try {
                    const res = await fetch('/api/smsbower/services', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('tg_token') } });
                    const data = await res.json();
                    if (data.success) smsbowerServices = data.services;
                    return smsbowerServices;
                } catch (e) {
                    console.error("fetchSmsbowerServices error:", e);
                    return [];
                }
            }

            const countryIsoMap = {
                "russia": "ru", "ukraine": "ua", "kazakhstan": "kz", "china": "cn", "philippines": "ph",
                "myanmar": "mm", "indonesia": "id", "malaysia": "my", "kenya": "ke", "tanzania": "tz",
                "vietnam": "vn", "kyrgyzstan": "kg", "usa": "us", "united-states": "us", "israel": "il", "hong kong": "hk",
                "poland": "pl", "uk": "gb", "united-kingdom": "gb", "madagascar": "mg", "d.r. congo": "cd", "nigeria": "ng",
                "macao": "mo", "egypt": "eg", "india": "in", "ireland": "ie", "cambodia": "kh",
                "laos": "la", "haiti": "ht", "ivory coast": "ci", "gambia": "gm", "serbia": "rs",
                "yemen": "ye", "south africa": "za", "romania": "ro", "colombia": "co", "estonia": "ee",
                "azerbaijan": "az", "canada": "ca", "morocco": "ma", "ghana": "gh", "argentina": "ar",
                "uzbekistan": "uz", "cameroon": "cm", "chad": "td", "germany": "de", "lithuania": "lt",
                "croatia": "hr", "sweden": "se", "iraq": "iq", "netherlands": "nl", "latvia": "lv",
                "austria": "at", "belarus": "by", "thailand": "th", "saudi arabia": "sa", "mexico": "mx",
                "taiwan": "tw", "spain": "es", "iran": "ir", "algeria": "dz", "slovenia": "si",
                "bangladesh": "bd", "senegal": "sn", "turkey": "tr", "czechia": "cz", "sri lanka": "lk",
                "peru": "pe", "pakistan": "pk", "new zealand": "nz", "guinea": "gn", "mali": "ml",
                "venezuela": "ve", "ethiopia": "et", "mongolia": "mn", "brazil": "br", "afghanistan": "af",
                "uganda": "ug", "angola": "ao", "cyprus": "cy", "france": "fr", "papua new guinea": "pg",
                "mozambique": "mz", "nepal": "np", "belgium": "be", "bulgaria": "bg", "hungary": "hu",
                "moldova": "md", "italy": "it", "paraguay": "py", "honduras": "hn", "tunisia": "tn",
                "nicaragua": "ni", "timor-leste": "tl", "bolivia": "bo", "costa rica": "cr", "guatemala": "gt",
                "uae": "ae", "zimbabwe": "zw", "puerto rico": "pr", "sudan": "sd", "togo": "tg",
                "england": "gb"
            };

            async function renderNumberServiceList() {
                const container = document.getElementById('number-view-container');
                container.innerHTML = '<div class="text-center py-10"><i class="fa-solid fa-spinner fa-spin text-2xl text-blue-500"></i></div>';

                const services = await fetchSmsbowerServices();

                if (services.length === 0) {
                    container.innerHTML = '<div class="text-center py-10 text-gray-500">Failed to load services. Please check your connection or run the app via server.</div>';
                    return;
                }

                const VIRAL_LOGOS = {
                    'fb': 'https://img.icons8.com/color/48/facebook-new.png',
                    'ig': 'https://img.icons8.com/color/48/instagram-new--v1.png',
                    'tg': 'https://img.icons8.com/color/48/telegram-app--v1.png',
                    'go': 'https://img.icons8.com/color/48/google-logo.png',
                    'tk': 'https://img.icons8.com/color/48/tiktok--v1.png',
                    'wa': 'https://img.icons8.com/color/48/whatsapp--v1.png',
                    'tw': 'https://img.icons8.com/color/48/twitter--v1.png',
                    'vi': 'https://img.icons8.com/color/48/viber.png'
                };

                let recentCodes = [];
                try {
                    recentCodes = JSON.parse(localStorage.getItem('ayno_recent_numbers') || '[]');
                } catch (e) { }

                const recentServices = [];
                const viralServices = [];
                const otherServices = [];

                services.forEach(s => {
                    if (recentCodes.includes(s.code)) {
                        recentServices.push(s);
                    } else if (VIRAL_LOGOS[s.code]) {
                        viralServices.push(s);
                    } else {
                        otherServices.push(s);
                    }
                });

                recentServices.sort((a, b) => recentCodes.indexOf(a.code) - recentCodes.indexOf(b.code));

                const orderedServices = [...recentServices, ...viralServices, ...otherServices];
                window.numberServicesShowingAll = false;

                let html = `
                <div class="mb-4 bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-3 shadow-sm">
                    <i class="fa-solid fa-lightbulb text-yellow-500 text-lg mt-0.5"></i>
                    <p class="text-xs text-blue-800 leading-relaxed">
                        <strong class="font-bold">Tips:</strong> OTP দ্রুত পাওয়ার জন্য যে দেশের নাম্বার কিনবেন, <span class="font-bold">VPN বা Proxy</span> দিয়ে সেই দেশের সার্ভার কানেক্ট করে নিন।
                    </p>
                </div>
                <div class="mb-4">
                    <div class="relative">
                        <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input type="text" placeholder="Select service" class="w-full bg-gray-100 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition" oninput="filterServices(this.value)">
                    </div>
                </div>
                <div class="grid grid-cols-4 md:grid-cols-5 gap-3 relative" id="service-grid">
            `;

                let initialCount = recentServices.length + viralServices.length;
                if (initialCount < 8) initialCount = 8;

                orderedServices.forEach((s, index) => {
                    const isHidden = index >= initialCount;
                    const logoUrl = VIRAL_LOGOS[s.code];
                    const iconHtml = logoUrl
                        ? `<img src="${logoUrl}" alt="${s.name}" class="w-7 h-7 object-contain">`
                        : `<i class="${s.icon} ${s.color} text-xl"></i>`;

                    html += `
                    <div class="service-card flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-blue-500 hover:shadow-md transition group" onclick="saveRecentNumber('${s.code}'); renderNumberCountryList('${s.code}', '${s.name}', this)" data-name="${s.name.toLowerCase()}" style="display: ${isHidden ? 'none' : 'flex'};" data-initial="${isHidden ? 'false' : 'true'}">
                        <div class="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-blue-50 transition">
                            ${iconHtml}
                        </div>
                        <span class="text-[10px] md:text-xs font-semibold text-gray-700 text-center truncate w-full">${s.name}</span>
                    </div>
                `;
                });

                html += `
                </div>
                <div id="more-services-btn-container" class="mt-4 text-center ${initialCount >= orderedServices.length ? 'hidden' : ''}">
                    <button onclick="showAllNumberServices()" class="px-5 py-2 bg-purple-50 text-purple-600 font-bold rounded-full hover:bg-purple-100 transition text-sm flex items-center justify-center mx-auto gap-2">
                        <span>Show all</span>
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                </div>
                <div id="country-expand-container" class="hidden mt-4 bg-white border border-gray-100 rounded-xl shadow-sm p-4 w-full transition-all">
            `;
                container.innerHTML = html;
            }

            window.saveRecentNumber = function (code) {
                try {
                    let recent = JSON.parse(localStorage.getItem('ayno_recent_numbers') || '[]');
                    recent = recent.filter(c => c !== code);
                    recent.unshift(code);
                    if (recent.length > 4) recent = recent.slice(0, 4);
                    localStorage.setItem('ayno_recent_numbers', JSON.stringify(recent));
                } catch (e) { }
            };

            window.showAllNumberServices = function () {
                window.numberServicesShowingAll = true;
                document.querySelectorAll('#service-grid .service-card').forEach(card => {
                    card.style.display = 'flex';
                    card.setAttribute('data-initial', 'true');
                });
                const btnContainer = document.getElementById('more-services-btn-container');
                if (btnContainer) btnContainer.style.display = 'none';
            };

            window.filterServices = function (val) {
                val = val.toLowerCase();
                const isSearching = val !== '';

                if (isSearching) {
                    document.querySelectorAll('#service-grid .service-card').forEach(card => {
                        if (card.dataset.name.includes(val)) card.style.display = 'flex';
                        else card.style.display = 'none';
                    });
                    const btnContainer = document.getElementById('more-services-btn-container');
                    if (btnContainer) btnContainer.style.display = 'none';
                } else {
                    document.querySelectorAll('#service-grid .service-card').forEach(card => {
                        const isInitial = card.dataset.initial === 'true';
                        if (window.numberServicesShowingAll || isInitial) card.style.display = 'flex';
                        else card.style.display = 'none';
                    });
                    const btnContainer = document.getElementById('more-services-btn-container');
                    if (btnContainer && !window.numberServicesShowingAll) btnContainer.style.display = 'block';
                }
            }

            window.toggleProviders = function (countryId) {
                const el = document.getElementById('providers-' + countryId);
                const btn = document.getElementById('btn-prov-' + countryId);
                if (el.classList.contains('hidden')) {
                    el.classList.remove('hidden');
                    btn.innerHTML = 'Hide Providers <i class="fa-solid fa-caret-up"></i>';
                } else {
                    el.classList.add('hidden');
                    btn.innerHTML = 'Show Providers <i class="fa-solid fa-caret-down"></i>';
                }
            }

            window.renderNumberCountryList = async function (serviceCode, serviceName, cardElement) {
                selectedService = serviceCode;
                const expContainer = document.getElementById('country-expand-container');

                document.querySelectorAll('.service-card').forEach(c => c.classList.remove('border-blue-500', 'ring-2', 'ring-blue-200'));
                if (cardElement) cardElement.classList.add('border-blue-500', 'ring-2', 'ring-blue-200');

                expContainer.classList.remove('hidden');
                expContainer.classList.remove('bg-white', 'border-gray-100');
                expContainer.classList.add('bg-emerald-600', 'text-white', 'border-emerald-500');
                expContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

                expContainer.innerHTML = `
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-6 h-6 rounded-full bg-white text-emerald-600 flex justify-center items-center font-bold text-xs">3</div>
                    <h3 class="font-bold flex-1 text-lg">Select country</h3>
                    <button onclick="document.getElementById('country-expand-container').classList.add('hidden'); document.querySelectorAll('.service-card').forEach(c => c.classList.remove('border-blue-500', 'ring-2', 'ring-blue-200'));" class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-400 transition">
                        <i class="fa-solid fa-times text-white"></i>
                    </button>
                </div>
                <div class="text-center py-8"><i class="fa-solid fa-spinner fa-spin text-2xl text-white"></i></div>
            `;

                try {
                    const res = await fetch(`/api/smsbower/top-countries?service=${serviceCode}`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('tg_token') } });
                    const data = await res.json();

                    if (!data.success) {
                        expContainer.innerHTML = `<div class="text-red-200 text-center py-10">${data.error}</div>`;
                        return;
                    }

                    let html = `
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-6 h-6 rounded-full bg-white text-emerald-600 flex justify-center items-center font-bold text-xs shadow-sm">3</div>
                        <h3 class="font-bold flex-1 text-lg">Select country</h3>
                        <button onclick="document.getElementById('country-expand-container').classList.add('hidden'); document.querySelectorAll('.service-card').forEach(c => c.classList.remove('border-blue-500', 'ring-2', 'ring-blue-200'));" class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-400 transition shadow-sm">
                            <i class="fa-solid fa-times text-white"></i>
                        </button>
                    </div>
                    <div class="mb-4 flex gap-2 relative">
                        <div class="relative flex-1">
                            <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input type="text" placeholder="Find country" class="w-full bg-emerald-50 text-gray-800 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-emerald-400 transition text-sm border-0 shadow-inner" oninput="filterCountries(this.value)">
                        </div>
                        <button onclick="toggleCountrySort()" id="country-sort-btn" class="w-[50px] bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-100 transition shadow-inner shrink-0" title="Sort by Price">
                            <i class="fa-solid fa-arrow-down-1-9"></i>
                        </button>
                    </div>
                    <p class="text-xs text-emerald-100 mb-3 font-medium">Countries are ranked by top performance</p>
                    <div class="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-2 hide-scroll" id="country-list">
                `;

                    if (data.topCountries.length === 0) {
                        html += `<div class="text-emerald-100 text-center py-5">No countries available for this service.</div>`;
                    }

                    const rate = window.appData?.settings?.smsbowerUsdRate || 129;
                    const profit = window.appData?.settings?.smsbowerProfit || 1;
                    data.topCountries.forEach(c => {
                        const displayPrice = ((c.cost * rate) + profit).toFixed(2);
                        const iso = countryIsoMap[c.name.toLowerCase()] || countryIsoMap[c.slug] || c.slug.substring(0, 2);
                        const flagHtml = iso
                            ? `<img src="https://flagcdn.com/w40/${iso}.png" class="w-full h-full object-cover">`
                            : `<span class="text-[10px] text-gray-800">📍</span>`;

                        html += `
                        <div class="country-card bg-emerald-600 rounded-xl border border-emerald-500 shadow-sm transition-all" data-name="${c.name.toLowerCase()}" data-price="${displayPrice}">
                            <div class="p-3">
                                <div class="flex items-center gap-3 mb-3">
                                    <div class="w-8 h-6 bg-emerald-50 rounded overflow-hidden flex items-center justify-center text-[10px] shadow-sm">
                                        ${flagHtml}
                                    </div>
                                    <div class="flex-1">
                                        <h4 class="font-bold text-white text-[15px] leading-tight">${c.name}</h4>
                                        <p class="text-[11px] text-emerald-100 mt-0.5">${c.count} pcs fr. ${displayPrice} ৳</p>
                                    </div>
                                </div>
                                <button class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-1.5 rounded-lg text-xs shadow-md transition mb-2" onclick="buySmsbowerNumber('${serviceCode}', '${serviceName}', '${c.id}', ${displayPrice}, '${c.minProviderId || ''}')">Buy</button>
                    `;

                        if (c.providers && c.providers.length > 0) {
                            html += `
                                <button class="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2.5 rounded-lg text-sm flex justify-center items-center gap-1 transition shadow-inner" onclick="toggleProviders('${c.id}')" id="btn-prov-${c.id}">
                                    Show Providers <i class="fa-solid fa-caret-down"></i>
                                </button>
                            </div>
                            <div id="providers-${c.id}" class="hidden bg-emerald-600 p-3 pt-1 text-white border-t border-emerald-500 transition-all duration-300">
                                <div class="grid grid-cols-4 gap-2 text-[10px] text-emerald-100 font-semibold mb-1 pt-1 text-center">
                                    <div>Rank</div>
                                    <div>id</div>
                                    <div>Count</div>
                                    <div>Cost</div>
                                </div>
                                ${c.providers.map(p => `
                                    <div class="grid grid-cols-4 gap-2 text-xs items-center text-center py-2 border-b border-emerald-500/50 last:border-0 hover:bg-emerald-500/30 rounded px-1 transition-colors">
                                        <div>
                                            <span class="${p.rank === 'Gold' ? 'bg-amber-500 shadow-amber-500/50' : p.rank === 'Silver' ? 'bg-gray-400 shadow-gray-400/50' : 'bg-orange-800 shadow-orange-800/50'} text-white px-2 py-0.5 rounded-full text-[9px] shadow-sm font-bold tracking-wide">${p.rank}</span>
                                        </div>
                                        <div class="font-mono text-emerald-50">${p.id}</div>
                                        <div class="text-[10px]">${p.count} pcs</div>
                                        <div>
                                            <button class="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1 rounded shadow-md text-[10px] transition transform hover:scale-105 w-full" onclick="buySmsbowerNumber('${serviceCode}', '${serviceName}', '${c.id}', ${((p.price * rate) + profit).toFixed(2)}, '${p.id}')">
                                                ${formatCurrency((p.price * rate) + profit)}
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `;
                        } else {
                            html += `</div>`;
                        }

                        html += `</div>`;
                    });
                    html += `</div>`;
                    expContainer.innerHTML = html;
                } catch (err) {
                    expContainer.innerHTML = `<div class="text-red-200 text-center py-10">Error fetching countries. Please try again.</div>`;
                }
            }

            window.filterCountries = function (val) {
                val = val.toLowerCase();
                document.querySelectorAll('.country-card').forEach(card => {
                    if (card.dataset.name.includes(val)) card.style.display = 'block';
                    else card.style.display = 'none';
                });
            }

            window.currentCountrySort = 'asc'; // Initial default could be assumed asc from api or natural

            window.toggleCountrySort = function () {
                const list = document.getElementById('country-list');
                if (!list) return;
                const cards = Array.from(list.querySelectorAll('.country-card'));
                const btn = document.getElementById('country-sort-btn');

                if (window.currentCountrySort === 'desc') {
                    window.currentCountrySort = 'asc';
                    if (btn) btn.innerHTML = '<i class="fa-solid fa-arrow-down-1-9"></i>';
                    cards.sort((a, b) => parseFloat(a.dataset.price) - parseFloat(b.dataset.price));
                } else {
                    window.currentCountrySort = 'desc';
                    if (btn) btn.innerHTML = '<i class="fa-solid fa-arrow-up-9-1"></i>';
                    cards.sort((a, b) => parseFloat(b.dataset.price) - parseFloat(a.dataset.price));
                }

                cards.forEach(c => list.appendChild(c));
            };


            window.buySmsbowerNumber = async function (service, serviceName, country, price, providerId = '') {
                if (!window.appData || !window.appData.user) {
                    sessionStorage.setItem('pendingNumberPurchase', JSON.stringify({
                        args: [service, serviceName, country, price, providerId]
                    }));
                    window.location.href = 'login.html';
                    return;
                }
                if (window.appData.user.balance < price) {
                    showToast("Insufficient balance! Please add funds.", "error");
                    switchTab('add-balance');
                    return;
                }

                const itemName = serviceName + ' Number' + (providerId ? ` [P:${providerId}]` : '');

                showBeautifulConfirm(itemName, price, async () => {
                    showToast("Processing order...", "info");
                    try {
                        const res = await fetch('/api/buy-external', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('tg_token')}`
                            },
                            body: JSON.stringify({
                                externalId: service,
                                externalType: 'number',
                                service: service,
                                country: country,
                                price: price,
                                itemName: itemName,
                                providerId: providerId
                            })
                        });

                        const data = await res.json();
                        if (data.success) {
                            window.appData.orders.unshift(data.order);
                            window.appData.user.balance -= price;
                            if (window.updateNumHistoryBadge) window.updateNumHistoryBadge();
                            fetchAppData();

                            // First navigate to the number store view, then switch to History tab
                            // This ensures number-view-container exists in DOM before switching
                            renderVPNs('number');
                            setTimeout(() => {
                                if (window.switchNumTab) window.switchNumTab('history');
                            }, 100);
                            showToast("Number ordered successfully! Check History tab.", "success");
                        } else {
                            showToast(data.error || "Failed to order number", "error");
                        }
                    } catch (e) {
                        console.error("Buy Error:", e);
                        showToast(e.message || "Network error occurred", "error");
                    }
                });
            }

            window.updateNumHistoryBadge = function () {
                if (!window.appData || !window.appData.orders) return;
                const badge = document.getElementById('num-history-badge');
                if (!badge) return;
                let waitingCount = 0;
                window.appData.orders.forEach(o => {
                    if ((o.category === 'number' || o.externalType === 'number') &&
                        (o.status === 'Pending OTP' || o.status === 'Processing' || o.status === 'OTP Received')) {
                        waitingCount++;
                    }
                });
                if (waitingCount > 0) {
                    badge.innerText = waitingCount;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            };

            window.switchNumTab = function (tab) {
                const indicator = document.getElementById('num-tab-indicator');
                const btnBuy = document.getElementById('btn-num-buy');
                const btnHistory = document.getElementById('btn-num-history');
                if (tab === 'buy') {
                    indicator.style.transform = 'translateX(0)';
                    btnBuy.classList.replace('text-gray-500', 'text-gray-800');
                    btnHistory.classList.replace('text-gray-800', 'text-gray-500');
                    renderNumberServiceList();
                } else {
                    indicator.style.transform = 'translateX(100%)';
                    btnBuy.classList.replace('text-gray-800', 'text-gray-500');
                    btnHistory.classList.replace('text-gray-500', 'text-gray-800');
                    renderNumberHistory();
                }
            }

            let numHistoryPollTimer = null;

            function renderNumberHistory(tab = 'waiting') {
                const container = document.getElementById('number-view-container');
                let orders = window.appData.orders.filter(o => o.category === 'number' || o.externalType === 'number');

                // Sort by date descending
                orders.sort((a, b) => new Date(b.date) - new Date(a.date));

                let filteredOrders = [];
                let waitingCount = 0;
                let totalLocked = 0;

                orders.forEach(o => {
                    const orderDate = o.date ? new Date(o.date) : new Date();
                    const timeDiff = Math.max(0, 20 * 60 - Math.floor((Date.now() - orderDate.getTime()) / 1000));

                    if ((o.status === 'Pending OTP' || o.status === 'Processing') && timeDiff <= 0) {
                        o.status = 'Cancelled';
                    }

                    if (o.status === 'Cancelled') {
                        return; // Delete from history completely
                    }

                    const isRecentlyCompleted = o.status === 'Completed' && o.otp && (Date.now() - new Date(o.date).getTime() < 10 * 60 * 1000); // 10 mins
                    if (o.status === 'Pending OTP' || o.status === 'Processing' || o.status === 'OTP Received' || isRecentlyCompleted) {
                        if (o.status !== 'Completed') {
                            waitingCount++;
                            totalLocked += parseFloat(o.price);
                        }
                        if (tab === 'waiting' || tab === 'all') filteredOrders.push(o);
                    } else if (o.status === 'Completed') {
                        if (tab === 'paid' || tab === 'all') filteredOrders.push(o);
                    } else {
                        if (tab === 'all') filteredOrders.push(o);
                    }
                });

                let html = `
                <div class="bg-teal-50 rounded-xl p-4 border border-teal-100">
                    <div class="flex items-center gap-2 mb-4 justify-center text-teal-800">
                        <i class="fa-solid fa-clipboard-check text-2xl text-orange-400"></i>
                        <h2 class="text-xl font-bold uppercase tracking-wider">PHONE HISTORY ACTIVATIONS</h2>
                    </div>
                    
                    <div class="flex justify-center mb-6">
                        <div class="inline-flex rounded-lg shadow-sm border border-gray-200 overflow-hidden bg-white">
                            <button class="px-4 py-2 bg-teal-700 text-white font-bold text-sm relative">
                                Phone history
                                ${waitingCount > 0 ? `<span class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm">${waitingCount}</span>` : ''}
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex overflow-x-auto hide-scroll border-b-2 border-teal-200 mb-4 text-xs md:text-sm font-semibold text-teal-700/70">
                        <button onclick="renderNumberHistory('waiting')" class="whitespace-nowrap px-3 py-2 ${tab === 'waiting' ? 'text-teal-800 border-b-2 border-orange-500 -mb-[2px]' : ''}">Waiting for SMS only</button>
                        <button onclick="renderNumberHistory('paid')" class="whitespace-nowrap px-3 py-2 ${tab === 'paid' ? 'text-teal-800 border-b-2 border-orange-500 -mb-[2px]' : ''}">Paid only</button>
                        <button onclick="renderNumberHistory('all')" class="whitespace-nowrap px-3 py-2 ${tab === 'all' ? 'text-teal-800 border-b-2 border-orange-500 -mb-[2px]' : ''}">All phone activations</button>
                    </div>
                    
                    ${waitingCount > 0 ? `
                    <div class="bg-teal-50/50 border border-teal-200 rounded-full py-2 px-4 text-center font-bold text-teal-800 text-xs mb-4 shadow-sm w-fit mx-auto uppercase">
                        WAITING FOR SMS ${waitingCount} PCS / LOCKED ${formatCurrency(totalLocked)}
                    </div>
                    ` : ''}
            `;

                if (filteredOrders.length === 0) {
                    html += `<div class="text-center py-10 text-teal-600">No phone activations found.</div>`;
                } else {
                    html += '<div class="flex flex-col gap-4">';
                    filteredOrders.forEach(o => {
                        const isWaiting = o.status === 'Pending OTP' || o.status === 'Processing' || o.status === 'OTP Received';
                        const hasOTP = !!o.otp;

                        let bgClass = "bg-teal-100/50";
                        let statusHtml = `
                        <div class="text-teal-700 font-bold mb-1">Status</div>
                        <div class="text-teal-600 text-xs font-semibold">${o.status}</div>
                    `;
                        let rightAction = '';

                        if (isWaiting) {
                            bgClass = "bg-teal-100";
                            statusHtml = `
                            <div class="text-teal-600 font-bold mb-1 text-sm">Status</div>
                            <div class="text-teal-500 text-xs leading-tight font-medium">${hasOTP ? 'OTP<br>Received' : 'Waiting for<br>SMS'}</div>
                        `;
                            if (!hasOTP) {
                                rightAction = `
                                <button onclick="cancelNumberOrder('${o.id}')" class="bg-teal-600 hover:bg-teal-700 text-white font-bold py-1.5 px-3 rounded text-[10px] shadow-sm uppercase w-full">Cancel</button>
                            `;
                            }
                        }

                        let iconClass = 'fa-solid fa-mobile-screen';
                        let bgColor = 'bg-gradient-to-br from-pink-500 to-orange-400';
                        let shortName = o.item.replace(' Number', '');

                        if (shortName.toLowerCase().includes('telegram')) { iconClass = 'fa-brands fa-telegram'; bgColor = 'bg-blue-500'; }
                        if (shortName.toLowerCase().includes('whatsapp')) { iconClass = 'fa-brands fa-whatsapp'; bgColor = 'bg-green-500'; }
                        if (shortName.toLowerCase().includes('instagram')) { iconClass = 'fa-brands fa-instagram'; bgColor = 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500'; }
                        if (shortName.toLowerCase().includes('facebook')) { iconClass = 'fa-brands fa-facebook'; bgColor = 'bg-blue-600'; }
                        if (shortName.toLowerCase().includes('google')) { iconClass = 'fa-brands fa-google'; bgColor = 'bg-red-500'; }
                        if (shortName.toLowerCase().includes('twitter') || shortName.toLowerCase().includes('x')) { iconClass = 'fa-brands fa-x-twitter'; bgColor = 'bg-black'; }

                        const orderDate = o.date ? new Date(o.date) : new Date();
                        const elapsedSec = Math.floor((Date.now() - orderDate.getTime()) / 1000);
                        const timeDiff = Math.max(0, 20 * 60 - elapsedSec);
                        const isExpiredTimer = timeDiff === 0 && isWaiting && !hasOTP;
                        const mins = Math.floor(timeDiff / 60);
                        const secs = timeDiff % 60;
                        const timeStr = (!hasOTP && isWaiting)
                            ? (isExpiredTimer ? '0:00' : `${mins}:${secs.toString().padStart(2, '0')}`)
                            : orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const timerColor = isExpiredTimer ? 'color:red;font-weight:bold;' : (timeDiff < 120 && isWaiting && !hasOTP ? 'color:#f97316;' : '');

                        // Auto-trigger cancel for expired waiting orders (server will handle refund)
                        if (isExpiredTimer) {
                            setTimeout(() => cancelNumberOrder(o.id, true), 500);
                        }

                        let phoneDisplay = o.number ? '+' + o.number : 'Pending...';

                        // Try to extract country code from number format or use stored country
                        let countryCode = o.country || null;
                        // Common country prefix mapping
                        if (!countryCode && o.number) {
                            const num = String(o.number);
                            if (num.startsWith('855')) countryCode = 'kh';       // Cambodia
                            else if (num.startsWith('7') || num.startsWith('79') || num.startsWith('78')) countryCode = 'ru'; // Russia
                            else if (num.startsWith('1')) countryCode = 'us';    // USA
                            else if (num.startsWith('44')) countryCode = 'gb';   // UK
                            else if (num.startsWith('91')) countryCode = 'in';   // India
                            else if (num.startsWith('880')) countryCode = 'bd';  // Bangladesh
                            else if (num.startsWith('62')) countryCode = 'id';   // Indonesia
                            else if (num.startsWith('84')) countryCode = 'vn';   // Vietnam
                            else if (num.startsWith('63')) countryCode = 'ph';   // Philippines
                            else if (num.startsWith('66')) countryCode = 'th';   // Thailand
                            else if (num.startsWith('60')) countryCode = 'my';   // Malaysia
                            else if (num.startsWith('86')) countryCode = 'cn';   // China
                            else if (num.startsWith('49')) countryCode = 'de';   // Germany
                            else if (num.startsWith('33')) countryCode = 'fr';   // France
                            else if (num.startsWith('90')) countryCode = 'tr';   // Turkey
                            else if (num.startsWith('380')) countryCode = 'ua';  // Ukraine
                            else if (num.startsWith('48')) countryCode = 'pl';   // Poland
                        }

                        html += `
                        <div class="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white mb-3" id="order-card-${o.id}">
                            <div class="p-4 flex justify-between items-center relative">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-2xl ${bgColor} text-white flex items-center justify-center shadow-md shrink-0">
                                        <i class="${iconClass} text-lg"></i>
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-gray-800 font-bold text-sm mb-0.5 truncate max-w-[120px] sm:max-w-[150px] md:max-w-none">${shortName}</span>
                                        <div class="flex items-center gap-1.5">
                                            <div class="w-5 h-3.5 bg-gray-100 rounded-[3px] overflow-hidden flex items-center justify-center shrink-0 border border-gray-200">
                                                ${countryCode ? `<img src="https://flagcdn.com/w20/${countryCode.toLowerCase()}.png" class="w-full h-full object-cover" onerror="this.style.display='none'">` : `<i class="fa-solid fa-earth-americas text-[8px] text-gray-400"></i>`}
                                            </div>
                                            <span class="font-mono text-gray-600 font-medium text-[11px] md:text-xs tracking-wide" id="phone-${o.id}">${phoneDisplay}</span>
                                            <button onclick="copyToClipboard('${o.number || ''}')" class="text-gray-400 hover:text-blue-500 transition"><i class="fa-regular fa-copy"></i></button>
                                            ${!isWaiting ? `<button onclick="deleteNumberOrder('${o.id}')" class="text-gray-300 hover:text-red-500 transition ml-2"><i class="fa-solid fa-trash-can"></i></button>` : (isExpiredTimer ? `<button onclick="cancelNumberOrder('${o.id}')" class="text-gray-300 hover:text-red-500 transition ml-2" title="Delete & Refund"><i class="fa-solid fa-trash-can"></i></button>` : '')}
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="flex flex-col items-end gap-2">
                                    <div class="flex items-center gap-1.5">
                                        <div class="text-[10px] font-mono ${isExpiredTimer ? 'text-red-500 font-bold' : 'text-gray-400'}"><i class="fa-regular fa-clock"></i> <span id="time-${o.id}" style="${timerColor}">${timeStr}</span></div>
                                        <div class="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 shadow-sm">${formatCurrency(o.price)}</div>
                                    </div>
                                    ${(isWaiting && !hasOTP) ? `
                                        <button onclick="cancelNumberOrder('${o.id}')" class="${isExpiredTimer ? 'bg-red-500 text-white' : 'bg-red-50 hover:bg-red-100 text-red-500 border border-red-200'} font-bold py-1 px-3 rounded-lg text-[10px] transition uppercase">${isExpiredTimer ? '⚠ Expired' : 'Cancel'}</button>
                                    ` : ''}
                                </div>
                            </div>
                            
                            ${isWaiting ? `
                            <div class="bg-gray-50 p-4 border-t border-gray-100">
                                ${hasOTP ? `
                                <div class="flex flex-col items-center justify-center gap-3">
                                    <div class="text-green-600 font-bold text-xs uppercase tracking-wider"><i class="fa-solid fa-message mr-1"></i> SMS Code Received</div>
                                    <div class="text-gray-800 font-mono font-bold text-2xl tracking-widest bg-white rounded-xl py-3 px-8 border border-gray-200 shadow-sm w-fit select-all text-center">${o.otp}</div>
                                    <button onclick="completeActivation('${o.id}')" class="mt-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition text-sm w-full max-w-[250px]">Complete</button>
                                </div>
                                ` : `
                                <div class="flex flex-col gap-3">
                                    <div class="flex justify-between items-center bg-white p-3 rounded-xl border border-blue-100/50 shadow-sm">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                                                <i class="fa-solid fa-spinner fa-spin text-sm"></i>
                                            </div>
                                            <div>
                                                <div class="text-gray-800 font-bold text-xs">Waiting for SMS...</div>
                                                <div class="text-gray-400 text-[9px] mt-0.5">Usually takes 1-2 minutes</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex justify-between items-center px-1">
                                        <button onclick="switchNumTab('buy')" class="text-blue-500 hover:text-blue-700 font-bold text-[10px] flex items-center gap-1 transition uppercase">
                                            <i class="fa-solid fa-plus"></i> Buy Another
                                        </button>
                                        <div class="text-gray-400 text-[9px] text-right max-w-[150px] leading-tight hidden md:block">
                                            Tip: Use a VPN matching the number's country.
                                        </div>
                                    </div>
                                </div>
                                `}
                            </div>
                            ` : (o.otp ? `
                            <div class="bg-gray-50 p-4 border-t border-gray-100 flex flex-col items-center justify-center gap-2">
                                <div class="text-green-600 font-bold text-xs uppercase tracking-wider"><i class="fa-solid fa-check-circle mr-1"></i> Completed</div>
                                <div class="text-gray-800 font-mono font-bold text-xl tracking-widest bg-white rounded-xl py-2 px-6 border border-gray-200 shadow-sm w-fit select-all text-center opacity-70">${o.otp}</div>
                            </div>
                            ` : '')}
                        </div>
                    `;
                    });
                    html += '</div>';
                }

                html += `
                <button onclick="openVPNStore('mail')" class="w-full mt-5 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl shadow-md transition uppercase text-sm tracking-wide">
                    BUY OUTLOOK/HOTMAIL
                </button>
                </div>
            `;

                container.innerHTML = html;

                // Setup polling
                if (numHistoryPollTimer) clearInterval(numHistoryPollTimer);
                if (waitingCount > 0) {
                    numHistoryPollTimer = setInterval(pollActiveNumbers, 5000);
                }
            }

            async function pollActiveNumbers() {
                const orders = window.appData.orders.filter(o => o.category === 'number' || o.externalType === 'number');
                const waitingOrders = orders.filter(o => o.status === 'Pending OTP' || o.status === 'Processing' || o.status === 'OTP Received');

                if (waitingOrders.length === 0) {
                    if (numHistoryPollTimer) clearInterval(numHistoryPollTimer);
                    return;
                }

                let needsRender = false;

                for (const o of waitingOrders) {
                    // Update Time only if not received OTP yet
                    if (o.status !== 'OTP Received') {
                        const timeEl = document.getElementById('time-' + o.id);
                        if (timeEl) {
                            const timeDiff = Math.max(0, 20 * 60 - Math.floor((Date.now() - new Date(o.date).getTime()) / 1000));
                            if (timeDiff <= 0) {
                                cancelNumberOrder(o.id, true);
                                continue;
                            }
                            const mins = Math.floor(timeDiff / 60);
                            const secs = timeDiff % 60;
                            timeEl.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
                        }
                    }

                    if (o.status === 'OTP Received') continue; // Stop polling this order

                    try {
                        const res = await fetch('/api/get-otp', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('tg_token') },
                            body: JSON.stringify({ orderId: o.externalOrderId || o.id })
                        });
                        const data = await res.json();

                        if (data.success && data.otp) {
                            o.otp = data.otp;
                            o.status = 'OTP Received';
                            needsRender = true;

                            showToast(`SMS Code Received: ${data.otp}`, 'success');
                            try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(e => { }); } catch (e) { }

                            // Auto complete the activation on SMSBower
                            try {
                                const compRes = await fetch('/api/complete-order', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('tg_token') },
                                    body: JSON.stringify({ orderId: o.externalOrderId || o.id, internalOrderId: o.id })
                                });
                                const compData = await compRes.json();
                                if (compData.success) {
                                    o.status = 'Completed';
                                }
                            } catch (e) { }
                        } else if (data.success && data.status === 'CANCELLED') {
                            o.status = 'Cancelled';
                            needsRender = true;
                        }
                    } catch (e) { }
                }

                if (needsRender) {
                    const currentTabEl = document.querySelector('.border-b-2.border-orange-500');
                    const tab = currentTabEl ? (currentTabEl.innerText.toLowerCase().includes('waiting') ? 'waiting' : (currentTabEl.innerText.toLowerCase().includes('all') ? 'all' : 'waiting')) : 'waiting';

                    const btnHistory = document.getElementById('btn-num-history');
                    if (btnHistory && btnHistory.classList.contains('text-gray-800')) {
                        renderNumberHistory(tab);
                    }
                    fetchAppData();
                }
            }

            async function cancelNumberOrder(orderId, silent = false) {
                if (!silent && !confirm('Are you sure you want to cancel this number? The amount will be refunded to your balance.')) return;

                const o = window.appData.orders.find(ord => ord.id === orderId);
                if (!o) return;

                window.cancellingOrders = window.cancellingOrders || {};
                if (silent && window.cancellingOrders[orderId]) return;
                window.cancellingOrders[orderId] = true;

                try {
                    const btn = typeof window !== 'undefined' && window.event ? window.event.currentTarget : null;
                    if (btn && !silent) { btn.innerText = '...'; btn.disabled = true; }

                    const res = await fetch('/api/cancel-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('tg_token') },
                        body: JSON.stringify({ orderId: o.externalOrderId || o.id, price: o.price, internalOrderId: o.id })
                    });
                    const data = await res.json();

                    if (data.success) {
                        if (!silent) showToast('Order cancelled and balance refunded', 'success');

                        window.appData.orders = window.appData.orders.filter(ord => ord.id !== orderId);

                        fetch('/api/orders/' + orderId, {
                            method: 'DELETE',
                            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('tg_token') }
                        }).catch(e => { });

                        const currentTabEl = document.querySelector('.border-b-2.border-orange-500');
                        const tab = currentTabEl ? (currentTabEl.innerText.toLowerCase().includes('waiting') ? 'waiting' : (currentTabEl.innerText.toLowerCase().includes('all') ? 'all' : 'canceled')) : 'waiting';

                        const btnHistory = document.getElementById('btn-num-history');
                        if (btnHistory && btnHistory.classList.contains('text-gray-800')) {
                            renderNumberHistory(tab);
                        }
                        if (!silent) fetchAppData(true);
                    } else {
                        // If OTP was already sent, show the number to user
                        if (!silent) showToast(data.error || 'Failed to cancel order', 'error');
                        if (btn && !silent) { btn.innerText = 'CANCEL'; btn.disabled = false; }
                        delete window.cancellingOrders[orderId];
                    }
                } catch (e) {
                    if (!silent) showToast('Network error', 'error');
                    if (btn && !silent) { btn.innerText = 'CANCEL'; btn.disabled = false; }
                    delete window.cancellingOrders[orderId];
                }
            }

            async function completeActivation(orderId) {
                const o = window.appData.orders.find(ord => ord.id === orderId);
                if (!o) return;

                try {
                    const btn = typeof window !== 'undefined' && window.event ? window.event.currentTarget : null;
                    if (btn) { btn.innerText = 'Completing...'; btn.disabled = true; }

                    const res = await fetch('/api/complete-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('tg_token') },
                        body: JSON.stringify({ orderId: o.externalOrderId || o.id, internalOrderId: o.id })
                    });
                    const data = await res.json();

                    if (data.success) {
                        showToast('Activation completed successfully', 'success');
                        o.status = 'Completed';
                        const currentTabEl = document.querySelector('.border-b-2.border-orange-500');
                        const tab = currentTabEl ? (currentTabEl.innerText.toLowerCase().includes('waiting') ? 'waiting' : (currentTabEl.innerText.toLowerCase().includes('all') ? 'all' : 'paid')) : 'paid';

                        const btnHistory = document.getElementById('btn-num-history');
                        if (btnHistory && btnHistory.classList.contains('text-gray-800')) {
                            renderNumberHistory(tab);
                        }
                    } else {
                        showToast(data.error || 'Failed to complete activation', 'error');
                        if (btn) { btn.innerText = 'Complete Activation'; btn.disabled = false; }
                    }
                } catch (e) {
                    showToast('Network error', 'error');
                }
            }

            function openVPNStore(category = null) {
                switchTab('vpn-store');
                renderVPNs(category);
            }

            async function renderVPNs(category = null) {
                if (category !== null) {
                    currentStoreCategory = category;
                } else {
                    category = currentStoreCategory;
                }
                let products = window.appData.products;

                const container = document.getElementById('vpn-products-container');
                const titleEl = document.getElementById('store-view-title');

                if (category === 'mail') {
                    if (titleEl) titleEl.innerText = "Mail Services";
                    container.innerHTML = '';

                    const mailProducts = products.filter(p =>
                        ((p.category === 'mail') || ((p.category || '').toLowerCase().includes('mail')))
                        && !p.isHidden  // hide admin-hidden products
                        && (p.isAvailable !== false)
                    );

                    if (mailProducts.length > 0) {
                        mailProducts.forEach(p => {
                            const finalPrice = p.price || 0;

                            const div = document.createElement('div');
                            div.className = `bg-white border border-gray-100 p-4 rounded-2xl shadow-sm transition cursor-pointer hover:shadow-md active:scale-[0.99] mb-3`;
                            div.onclick = () => {
                                currentVPN = null;
                                startPayment({
                                    id: p._id || p.id,
                                    name: p.name,
                                    price: finalPrice,
                                    category: 'mail',
                                    externalType: 'mail',
                                    externalId: p._id || p.id,
                                    isExternal: true
                                });
                            };

                            const isOutlook = p.name.toLowerCase().includes('outlook') || p.name.toLowerCase().includes('hotmail');
                            let iconHtml = '';
                            if (p.logoUrl) {
                                iconHtml = `<div class="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 border border-gray-100 p-1 shadow-sm"><img src="${p.logoUrl}" class="w-full h-full object-contain rounded-lg" onerror="this.parentElement.innerHTML='<i class='fa-solid fa-envelope text-orange-500 text-2xl'></i>'"></div>`;
                            } else if (isOutlook) {
                                iconHtml = `<div class="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_4px_12px_rgba(59,130,246,0.3)]"><i class="fa-brands fa-microsoft text-white text-2xl drop-shadow-md"></i></div>`;
                            } else {
                                iconHtml = `<div class="w-12 h-12 rounded-xl flex items-center justify-center bg-orange-100"><i class="fa-solid fa-envelope text-orange-500 text-2xl"></i></div>`;
                            }

                            // notes to show if available
                            const notesHtml = p.detailsNotes ? `<p class="text-[11px] text-gray-400 mt-0.5 line-clamp-1">${p.detailsNotes}</p>` : '';

                            div.innerHTML = `
                            <div class="flex items-center justify-between gap-3">
                                <div class="flex items-center gap-3 flex-1 min-w-0">
                                    ${iconHtml}
                                    <div class="min-w-0 flex-1">
                                        <h4 class="font-bold text-gray-800 text-sm leading-tight truncate">${p.name}</h4>
                                        ${notesHtml}
                                        <p class="text-xs text-blue-600 font-bold mt-1">৳ ${finalPrice}</p>
                                    </div>
                                </div>
                                <button class="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition whitespace-nowrap shrink-0">
                                    <i class="fa-solid fa-cart-shopping text-[10px]"></i> Buy
                                </button>
                            </div>
                        `;
                            container.appendChild(div);
                        });
                    } else {
                        container.innerHTML = '<div class="text-center py-10 text-gray-500">No mail services available.</div>';
                    }

                    return;
                }


                window.deleteNumberOrder = async function (orderId) {
                    if (!confirm('Are you sure you want to delete this order from history?')) return;
                    try {
                        const res = await fetch('/api/orders/' + orderId, {
                            method: 'DELETE',
                            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('tg_token') }
                        });
                        const data = await res.json();
                        if (data.success) {
                            showToast('Order deleted from history');
                            window.appData.orders = window.appData.orders.filter(o => o.id !== orderId);
                            renderNumberHistory(); // Refresh view
                        } else {
                            showToast(data.error || 'Failed to delete', 'error');
                        }
                    } catch (e) {
                        showToast('Network error', 'error');
                    }
                };

                if (category === 'number') {
                    if (titleEl) titleEl.innerText = "Virtual Numbers";
                    container.innerHTML = `
                    <div class="mb-4 bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-3 flex justify-between items-center cursor-pointer hover:shadow-md transition shadow-sm" onclick="window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp.openTelegramLink('https://t.me/FreeOtpMasterbot?start=8375006707') : window.open('https://t.me/FreeOtpMasterbot?start=8375006707', '_blank')">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-lg text-purple-600 animate-pulse">
                                <i class="fa-solid fa-gift"></i>
                            </div>
                            <div>
                                <h4 class="text-sm font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">Free Virtual Numbers</h4>
                                <p class="text-[10px] text-gray-600">Get OTP without balance</p>
                            </div>
                        </div>
                        <i class="fa-solid fa-chevron-right text-purple-300 text-sm"></i>
                    </div>
                    <div class="flex bg-gray-100 p-1 rounded-xl mb-4 relative">
                        <div class="absolute inset-y-1 left-1 bg-white rounded-lg shadow-sm transition-all duration-300" id="num-tab-indicator" style="width: calc(50% - 4px); z-index: 1;"></div>
                        <button id="btn-num-buy" class="flex-1 py-2 text-sm font-bold text-gray-800 z-10 transition-colors duration-300 relative" onclick="window.switchNumTab('buy')">Buy Number</button>
                        <button id="btn-num-history" class="flex-1 py-2 text-sm font-bold text-gray-500 z-10 transition-colors duration-300 relative" onclick="window.switchNumTab('history')">
                            History
                            <span id="num-history-badge" class="hidden absolute top-1 right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full shadow-sm">0</span>
                        </button>
                    </div>
                    <div id="number-view-container"></div>
                `;
                    window.switchNumTab('buy');
                    return;
                }

                // Set Store Title
                let title = "All Services";
                if (category === 'vpn') title = "VPN Services";
                if (category === 'proxy') title = "Proxy Services";
                if (category === 'app') title = "App Subscriptions";
                if (titleEl) titleEl.innerText = title;

                // Filter Products
                let filtered = products.filter(p => !p.isHidden);
                if (category) {
                    filtered = filtered.filter(p => p.category === category);
                }

                // container already declared
                container.innerHTML = '';

                if (category === 'vpn') {
                    container.innerHTML += `
                    <div class="mb-4">
                        <button onclick="openVPNRulesView()" class="w-full bg-white border border-blue-200 shadow-sm rounded-xl p-3 flex items-center justify-between hover:bg-blue-50 transition active:scale-[0.98]">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <i class="fa-solid fa-file-contract"></i>
                                </div>
                                <div class="text-left">
                                    <h4 class="font-bold text-gray-800 text-sm">VPN Rules & Replacement Policy</h4>
                                    <p class="text-[10px] text-gray-500">Tap to read full policy</p>
                                </div>
                            </div>
                            <i class="fa-solid fa-chevron-right text-gray-400"></i>
                        </button>
                    </div>
                    `;

                    const availableVpns = filtered.filter(p => p.isAvailable !== false && (p.stock || (p.plans && p.plans.length > 0 && p.plans.some(plan => !plan.isStockOut)))).slice(0, 5);
                    let logosHtml = '';
                    if (availableVpns.length > 0) {
                        const logos = availableVpns.map(p => `
                        <div class="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center p-1 border border-blue-100 hover:scale-110 transition-transform overflow-hidden" title="${p.name}">
                            ${p.logoUrl
                                ? `<img src="${p.logoUrl}" class="w-full h-full object-contain rounded-full" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjZjhmOWZhIi8+PC9zdmc+'">`
                                : `<i class="${p.iconClass || 'fa-solid fa-shield-halved'} text-blue-500 text-[10px]"></i>`
                            }
                        </div>
                    `).join('');

                        logosHtml = `
                        <div class="mt-4 flex items-center gap-1.5 relative z-10">
                            <p class="text-[9px] text-blue-200 font-bold uppercase tracking-wider mr-1">Top Picks:</p>
                            ${logos}
                        </div>
                    `;
                    }

                    container.innerHTML += `
                    <style>
                        @keyframes slowZoom {
                            0% { transform: scale(1); }
                            50% { transform: scale(1.08); }
                            100% { transform: scale(1); }
                        }
                        @keyframes shimmer {
                            0% { transform: translateX(-150%) skewX(-15deg); }
                            100% { transform: translateX(150%) skewX(-15deg); }
                        }
                        .animate-slow-zoom { animation: slowZoom 15s ease-in-out infinite; }
                        .animate-shimmer { animation: shimmer 3s infinite; }
                    </style>
                    <div class="mb-5 rounded-2xl overflow-hidden shadow-lg relative border border-blue-100">
                        <img src="./vpn_banner.jpg" class="w-full h-40 md:h-48 object-cover object-center animate-slow-zoom">
                        <div class="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-900/60 to-transparent flex flex-col justify-center p-5 md:p-6 overflow-hidden">
                            <!-- Shine Overlay -->
                            <div class="absolute top-0 bottom-0 left-0 w-[150%] bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none mix-blend-overlay"></div>
                            
                            <div class="inline-flex items-center gap-1.5 bg-gradient-to-r from-sky-400 to-blue-600 text-white text-[9px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full shadow-md w-max mb-2 animate-pulse relative z-10">
                                <i class="fa-solid fa-shield-halved text-white"></i> Ultimate Protection
                            </div>
                            
                            <h3 class="text-white font-black text-xl md:text-2xl tracking-tight leading-tight mb-1 text-shadow-sm relative z-10">
                                Premium <span class="text-sky-300">VPN</span> Access
                            </h3>
                            
                            <p class="text-blue-50 text-[10px] md:text-[11px] max-w-[70%] leading-relaxed font-medium relative z-10">
                                Bypass restrictions, hide your IP, and secure your data with world-class servers.
                            </p>
                            
                            ${logosHtml}
                        </div>
                    </div>
                `;
                }

                if (filtered.length === 0) {
                    container.innerHTML += '<div class="text-center py-10 text-gray-500">No products available in this category.</div>';
                    return;
                }

                filtered.forEach((p, index) => {
                    const isStockOut = p.isAvailable === false || (!p.stock && (!p.plans || p.plans.length === 0 || p.plans.every(plan => plan.isStockOut)));

                    if (category === 'app') {
                        // RICH CARD RENDERING FOR APP SUBSCRIPTIONS
                        const div = document.createElement('div');
                        div.className = `w-full mb-4 rounded-3xl p-5 relative overflow-hidden transition-all duration-300 shadow-sm border border-white/50 ${isStockOut ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1 hover:shadow-lg'}`;
                        if (!isStockOut) div.onclick = () => openVPNPackages(p.id);

                        let bgGradient = 'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300';
                        let badgeColor = 'bg-slate-100 text-slate-600';
                        let btnGradient = 'bg-gradient-to-r from-slate-600 to-slate-800';
                        let features = ['Premium Access', 'Instant Delivery', 'Secure'];

                        const nameLower = (p.name || '').toLowerCase();
                        if (nameLower.includes('youtube')) {
                            bgGradient = 'bg-gradient-to-br from-[#ffe5e5] via-[#ffcccc] to-[#ffb3b3]';
                            badgeColor = 'bg-white/80 text-red-600 shadow-sm';
                            btnGradient = 'bg-gradient-to-r from-red-600 via-red-500 to-yellow-500';
                            features = ['No Ads', 'YouTube Music', 'Background Play'];
                        } else if (nameLower.includes('gemini') || nameLower.includes('ai') || nameLower.includes('gpt')) {
                            bgGradient = 'bg-gradient-to-br from-[#e0f2fe] via-[#dbeafe] to-[#e0e7ff]';
                            badgeColor = 'bg-white/80 text-blue-600 shadow-sm';
                            btnGradient = 'bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600';
                            features = ['Gemini Advanced', '5TB Cloud Storage', 'Workspace Apps'];
                        } else if (nameLower.includes('spotify') || nameLower.includes('capcut')) {
                            bgGradient = 'bg-gradient-to-br from-[#dcfce7] via-[#bbf7d0] to-[#86efac]';
                            badgeColor = 'bg-white/80 text-green-700 shadow-sm';
                            btnGradient = 'bg-gradient-to-r from-green-600 to-emerald-500';
                            features = ['Ad-free', 'Premium Features', 'High Quality'];
                        }

                        const featureHtml = features.map((f) => {
                            let fIcon = 'fa-check-circle text-slate-500';
                            const fLower = f.toLowerCase();
                            if (fLower.includes('ad-free') || fLower === 'no ads') fIcon = 'fa-ban text-red-500';
                            else if (fLower.includes('music')) fIcon = 'fa-music text-red-500';
                            else if (fLower.includes('play')) fIcon = 'fa-play text-red-500';
                            else if (fLower.includes('storage') || fLower.includes('cloud') || fLower.includes('5tb')) fIcon = 'fa-cloud text-blue-500';
                            else if (fLower.includes('1.5') || fLower.includes('pro') || fLower.includes('advanced') || fLower.includes('gemini')) fIcon = 'fa-wand-magic-sparkles text-blue-600';
                            else if (fLower.includes('workspace') || fLower.includes('app')) fIcon = 'fa-layer-group text-purple-600';
                            else if (fLower.includes('ai') || fLower.includes('feature') || fLower.includes('smart')) fIcon = 'fa-brain text-purple-600';
                            else if (fLower.includes('access') || fLower.includes('fast')) fIcon = 'fa-bolt text-yellow-500';
                            return `<div class="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-700 bg-white/60 px-2.5 py-1 rounded-full backdrop-blur-sm shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-white/40"><i class="fa-solid ${fIcon}"></i> ${f}</div>`;
                        }).join('');

                        div.innerHTML = `
                            <div class="absolute inset-0 ${bgGradient} opacity-80"></div>
                            <div class="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
                            
                            <!-- Top Badges -->
                            <div class="relative z-10 flex justify-between items-start mb-4">
                                <div class="${badgeColor} text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md">
                                    <i class="fa-solid fa-crown text-yellow-500"></i> ${nameLower.includes('youtube') ? 'Premium' : (nameLower.includes('ai') || nameLower.includes('gemini') ? 'AI Pro' : 'Pro')}
                                </div>
                                <div class="bg-green-100/90 text-green-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm backdrop-blur-md border border-green-200/50">
                                    <i class="fa-solid fa-shield-halved"></i> Trusted Store
                                </div>
                            </div>
                            
                            <!-- Main Content -->
                            <div class="relative z-10 flex items-center gap-4 mb-4">
                                ${p.logoUrl
                                ? `<div class="relative group shrink-0">
                                        <img src="${p.logoUrl}" class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-[0_8px_16px_rgba(0,0,0,0.1)] transform group-hover:scale-105 group-hover:rotate-2 transition duration-300 border-2 border-white/60 bg-white" onerror="this.outerHTML='<div class='w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center ${badgeColor} shadow-[0_8px_16px_rgba(0,0,0,0.1)] relative group shrink-0 border-2 border-white/60'><i class='${p.iconClass || 'fa-solid fa-box'} text-3xl transform group-hover:scale-110 transition duration-300'></i><i class='fa-solid fa-crown absolute -top-2.5 -right-2 text-yellow-400 text-xl drop-shadow-md transform rotate-12'></i></div>'">
                                        <i class="fa-solid fa-crown absolute -top-2.5 -right-2 text-yellow-400 text-xl drop-shadow-md transform rotate-12"></i>
                                      </div>`
                                : `<div class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center ${badgeColor} shadow-[0_8px_16px_rgba(0,0,0,0.1)] relative group shrink-0 border-2 border-white/60">
                                        <i class="${p.iconClass || 'fa-solid fa-box'} text-3xl transform group-hover:scale-110 transition duration-300"></i>
                                        <i class="fa-solid fa-crown absolute -top-2.5 -right-2 text-yellow-400 text-xl drop-shadow-md transform rotate-12"></i>
                                      </div>`
                            }
                                <div class="flex-1 min-w-0">
                                    <h3 class="font-black text-xl sm:text-2xl text-slate-900 leading-tight mb-1 truncate">${p.name}</h3>
                                    <p class="text-[11px] sm:text-xs text-slate-600 font-bold opacity-80 leading-snug line-clamp-2 mb-2">${p.detailsNotes || p.description || 'Boost your productivity with premium apps'}</p>
                                    <div class="flex flex-wrap gap-1.5">
                                        ${featureHtml}
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Buttons -->
                            <div class="relative z-10 flex items-center gap-3 w-full mt-5">
                                <button class="flex-[1.5] ${btnGradient} text-white font-bold py-3 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)] transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                                    <i class="fa-solid fa-eye"></i> View Plan <i class="fa-solid fa-arrow-right ml-1"></i>
                                </button>
                                <button onclick="event.stopPropagation(); window.openVPNPackages('${p.id}')" class="flex-1 bg-white/90 text-slate-800 font-bold py-3 rounded-2xl shadow-sm hover:bg-white transition-all flex items-center justify-center gap-2 active:scale-[0.98] border border-white/50 backdrop-blur-sm">
                                    <i class="fa-solid fa-circle-info text-slate-500"></i> Details <i class="fa-solid fa-arrow-right ml-1 text-slate-400 text-[10px]"></i>
                                </button>
                            </div>
                        `;
                        container.appendChild(div);
                    } else {
                        // NORMAL FALLBACK FOR OTHER CATEGORIES
                        const catLabel = p.category === 'proxy' ? 'Premium Proxy' : p.category === 'number' ? 'Virtual Number' : p.category === 'mail' ? ((p.name || '').toLowerCase().includes('owl') ? 'Premium Proxy' : 'Mail Service') : 'Premium VPN';
                        const div = document.createElement('div');

                        // Apply alternating solid colors like Popular Products
                        const btnColors = ['bg-blue-600', 'bg-green-500', 'bg-purple-600', 'bg-orange-500', 'bg-red-500'];
                        const tagColors = ['bg-blue-50 text-blue-600', 'bg-green-50 text-green-600', 'bg-purple-50 text-purple-600', 'bg-orange-50 text-orange-500', 'bg-red-50 text-red-500'];
                        const btnBg = btnColors[index % btnColors.length];
                        const tagColor = tagColors[index % tagColors.length];

                        div.className = `bg-white border border-slate-100 p-3 sm:p-4 rounded-[1.25rem] shadow-sm flex items-center justify-between mb-3 transition-all duration-300 relative overflow-hidden group ${isStockOut ? 'opacity-60 cursor-not-allowed grayscale-[20%]' : 'cursor-pointer hover:shadow-md'}`;
                        if (!isStockOut) {
                            if (p.category === 'proxy' && (p.name || '').toLowerCase().includes('owl')) {
                                div.onclick = () => {
                                    currentVPN = null;
                                    startPayment({
                                        id: p._id || p.id,
                                        name: p.name,
                                        price: p.price || 15,
                                        category: 'mail',
                                        externalType: 'mail',
                                        externalId: p._id || p.id,
                                        isExternal: true
                                    });
                                };
                            } else {
                                div.onclick = () => openVPNPackages(p.id);
                            }
                        }

                        const logoHtml = p.logoUrl
                            ? `<img src="${p.logoUrl}" class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover bg-slate-50 shadow-sm border border-slate-100" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjZjhmOWZhIi8+PC9zdmc+'">`
                            : p.category === 'mail'
                                ? `<img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-contain bg-white shadow-sm border border-slate-100 p-2">`
                                : `<div class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm ${p.bgClass || (p.category === 'proxy' ? 'bg-purple-100 text-purple-500' : p.category === 'number' ? 'bg-blue-100 text-blue-500' : 'bg-green-100 text-green-500')}"><i class="${p.iconClass || (p.category === 'proxy' ? 'fa-solid fa-globe' : p.category === 'number' ? 'fa-solid fa-phone' : 'fa-solid fa-shield-halved')} text-2xl sm:text-3xl"></i></div>`;

                        div.innerHTML = `
                        <!-- Left side -->
                        <div class="flex items-center gap-3 sm:gap-4 relative z-10">
                            ${logoHtml}
                            <div>
                                <h4 class="font-black text-slate-800 text-base sm:text-lg leading-tight mb-0.5 tracking-tight">${p.name}</h4>
                                <p class="text-[11px] sm:text-xs text-slate-500 font-medium mb-1.5">${catLabel}</p>
                                <div class="inline-flex items-center gap-1 ${tagColor} text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md">
                                    <i class="fa-solid fa-bolt"></i> Instant Delivery
                                </div>
                            </div>
                        </div>
                        
                        <!-- Right side -->
                        <div class="flex flex-col items-end gap-2.5 relative z-10">
                            <div class="${isStockOut ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'} text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-[0_2px_4px_rgba(0,0,0,0.02)] border border-white/50">
                                <i class="fa-solid ${isStockOut ? 'fa-circle-xmark' : 'fa-check-circle'}"></i> ${isStockOut ? 'Stock Out' : 'Available'}
                            </div>
                            
                            <button class="${isStockOut ? 'bg-slate-300' : btnBg + ' hover:opacity-90'} shadow-sm text-white text-[10px] sm:text-[11px] font-bold px-4 py-1.5 sm:py-2 rounded-full flex items-center gap-1.5 transition-all">
                                <i class="fa-solid fa-eye text-[10px] opacity-80"></i> View Plan <i class="fa-solid fa-arrow-right text-[9px] opacity-80 ml-0.5"></i>
                            </button>
                        </div>
                        `;
                        container.appendChild(div);
                    }
                });
            }

            window.copyShareLink = function (productId) {
                const url = window.location.origin + window.location.pathname + '?product=' + productId;
                navigator.clipboard.writeText(url).then(() => {
                    showToast('Link copied to clipboard!');
                }).catch(err => {
                    console.error('Failed to copy', err);
                    showToast('Failed to copy link', 'error');
                });
            }

            function openVPNPackages(id) {
                let products = window.appData.products;
                currentVPN = products.find(p => p.id === id);

                if (!currentVPN) return;

                // Block if product is hidden or stock out
                if (currentVPN.isHidden) {
                    showToast('This product is not available.', 'error');
                    return;
                }

                let bgGradient = 'bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]';
                let badgeColor = 'bg-white/80 text-blue-600 shadow-sm';
                let btnGradient = 'bg-gradient-to-r from-blue-600 to-blue-500';
                let features = ['Premium Access', '24/7 Support', 'High Speed'];

                const nameLower = (currentVPN.name || '').toLowerCase();
                if (nameLower.includes('youtube')) {
                    bgGradient = 'bg-gradient-to-br from-[#ffe5e5] via-[#ffcccc] to-[#ffb3b3]';
                    badgeColor = 'bg-white/80 text-red-600 shadow-sm';
                    btnGradient = 'bg-gradient-to-r from-red-600 via-red-500 to-orange-500';
                    features = ['No Ads', 'Background Play', 'YouTube Music', 'YouTube Premium'];
                } else if (nameLower.includes('gemini') || nameLower.includes('ai') || nameLower.includes('gpt')) {
                    bgGradient = 'bg-gradient-to-br from-[#e0f2fe] via-[#dbeafe] to-[#e0e7ff]';
                    badgeColor = 'bg-white/80 text-blue-600 shadow-sm';
                    btnGradient = 'bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600';
                    features = ['Gemini Advanced', '5TB Cloud Storage', 'Workspace Apps'];
                } else if (nameLower.includes('spotify') || nameLower.includes('capcut')) {
                    bgGradient = 'bg-gradient-to-br from-[#dcfce7] via-[#bbf7d0] to-[#86efac]';
                    badgeColor = 'bg-white/80 text-green-700 shadow-sm';
                    btnGradient = 'bg-gradient-to-r from-green-600 to-emerald-500';
                    features = ['Ad-free', 'Premium Features', 'High Quality'];
                }

                const getFeatureIcon = (f) => {
                    let fIcon = 'fa-check-circle text-slate-500';
                    const fLower = f.toLowerCase();
                    if (fLower.includes('ad-free') || fLower === 'no ads') fIcon = 'fa-ban text-red-500';
                    else if (fLower.includes('music')) fIcon = 'fa-music text-red-500';
                    else if (fLower.includes('play')) fIcon = 'fa-play text-red-500';
                    else if (fLower.includes('storage') || fLower.includes('cloud') || fLower.includes('5tb')) fIcon = 'fa-cloud text-blue-500';
                    else if (fLower.includes('1.5') || fLower.includes('pro') || fLower.includes('advanced') || fLower.includes('gemini') || fLower.includes('premium')) fIcon = 'fa-crown text-red-500';
                    else if (fLower.includes('workspace') || fLower.includes('app')) fIcon = 'fa-layer-group text-purple-600';
                    else if (fLower.includes('ai') || fLower.includes('feature') || fLower.includes('smart')) fIcon = 'fa-brain text-purple-600';
                    else if (fLower.includes('access') || fLower.includes('fast')) fIcon = 'fa-bolt text-yellow-500';
                    return fIcon;
                };

                const featureHtml = features.map(f => `<span class="text-[10px] sm:text-xs text-slate-500 font-medium whitespace-nowrap">${f}</span>`).join('<span class="text-slate-300 mx-1.5">•</span>');

                let logoHtml = '';
                if (currentVPN.logoUrl) {
                    logoHtml = `<img src="${currentVPN.logoUrl}" class="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover shadow-[0_8px_16px_rgba(0,0,0,0.1)] border-2 border-white transform -rotate-2" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjZjhmOWZhIi8+PC9zdmc+'">`;
                } else {
                    logoHtml = `<div class="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center ${currentVPN.bgClass || 'bg-slate-100 text-slate-500'} shadow-[0_8px_16px_rgba(0,0,0,0.1)] border-2 border-white transform -rotate-2"><i class="${currentVPN.iconClass || 'fa-solid fa-box'} text-4xl"></i></div>`;
                }

                document.getElementById('dynamic-package-header').innerHTML = `
                    <div class="relative overflow-hidden rounded-[1.5rem] p-5 sm:p-6 shadow-sm border border-white/50 bg-white">
                        <div class="absolute inset-0 ${bgGradient} opacity-80"></div>
                        <div class="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                        <div class="absolute bottom-0 left-0 w-32 h-32 bg-white/40 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>
                        
                        <div class="absolute top-4 right-4 z-30" onclick="event.stopPropagation()">
                            <button onclick="document.getElementById('pkg-options-${currentVPN.id}').classList.toggle('hidden')" class="w-8 h-8 rounded-full bg-white/50 hover:bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-600 transition shadow-sm border border-white/60">
                                <i class="fa-solid fa-ellipsis-vertical"></i>
                            </button>
                            <div id="pkg-options-${currentVPN.id}" class="hidden absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1 overflow-hidden">
                                <button onclick="window.copyShareLink('${currentVPN.id}'); document.getElementById('pkg-options-${currentVPN.id}').classList.add('hidden')" class="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors">
                                    <i class="fa-solid fa-share-nodes text-blue-500"></i> Share Link
                                </button>
                            </div>
                        </div>
                        
                        <div class="relative z-10 flex items-center gap-4 sm:gap-6">
                            <div class="shrink-0 relative">
                                ${logoHtml}
                                <div class="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/50 shadow-sm"><i class="fa-solid fa-crown text-yellow-500 text-[11px]"></i></div>
                            </div>
                            <div class="flex-1 min-w-0 pr-2">
                                <h3 class="font-black text-2xl sm:text-3xl text-slate-900 leading-tight tracking-tight mb-1">${currentVPN.name}</h3>
                                <p class="text-[11px] sm:text-xs text-slate-500 font-medium leading-snug line-clamp-2 mb-2">${currentVPN.detailsNotes || currentVPN.description || 'Premium Digital Subscription'}</p>
                                <div class="flex flex-wrap items-center mt-1">
                                    ${featureHtml}
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                const container = document.getElementById('vpn-packages-container');
                container.innerHTML = '';

                if (currentVPN.isAvailable === false) {
                    container.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-10 text-center">
                        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <i class="fa-solid fa-box-open text-red-500 text-2xl"></i>
                        </div>
                        <h3 class="font-bold text-gray-800 text-lg mb-1">Stock Out</h3>
                        <p class="text-sm text-gray-400">এই প্রোডাক্টটি এখন Stock Out।<br>শীঘ্রই আবার পাওয়া যাবে।</p>
                    </div>
                    `;
                    switchTab('vpn-package');
                    return;
                }

                if (currentVPN.category === 'proxy') {
                    const pricePerGb = currentVPN.pricePerGb || 0;
                    container.innerHTML = `
                    <div class="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm text-center mt-2">
                        <h4 class="font-bold text-gray-800 text-lg mb-2">Buy Proxy Traffic</h4>
                        <p class="text-sm text-gray-500 mb-4">Price: ${formatCurrency(pricePerGb)} per GB</p>
                        <div class="flex items-center justify-center gap-3 mb-6">
                            <button onclick="document.getElementById('proxy-gb-input').stepDown(); updateProxyPrice(${pricePerGb})" class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">
                                <i class="fa-solid fa-minus"></i>
                            </button>
                            <input type="number" id="proxy-gb-input" min="1" value="1" onchange="updateProxyPrice(${pricePerGb})" onkeyup="updateProxyPrice(${pricePerGb})" class="w-20 text-center font-bold text-xl border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none pb-1">
                            <span class="font-bold text-gray-500">GB</span>
                            <button onclick="document.getElementById('proxy-gb-input').stepUp(); updateProxyPrice(${pricePerGb})" class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </div>
                        <div class="flex justify-between items-center mb-4">
                            <span class="text-gray-500 font-bold">Total Price:</span>
                            <span class="text-2xl font-bold text-blue-600" id="proxy-total-price">${formatCurrency(pricePerGb)}</span>
                        </div>
                        <button onclick="buyProxy()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md transition">Continue to Payment</button>
                    </div>
                    `;
                } else {
                    const plans = currentVPN.plans || [];
                    if (plans.length === 0) {
                        container.innerHTML = `<div class="text-center py-8 text-gray-400 mt-4"><i class="fa-solid fa-box-open text-3xl mb-2"></i><p>No plans available.</p></div>`;
                    } else {
                        plans.forEach(plan => {
                            const planStockOut = plan.isStockOut === true;
                            const planName = plan.name || '';
                            let planIcon = 'fa-calendar-alt';
                            let planBadgeColor = 'bg-red-50 text-red-600 border-red-100';
                            let cardBorderColor = planStockOut ? 'border-red-100 bg-red-50' : 'border-slate-100 hover:border-orange-200';

                            if (planName.toLowerCase().includes('3 month') || planName.toLowerCase().includes('year')) {
                                planIcon = 'fa-crown';
                                planBadgeColor = 'bg-orange-50 text-orange-600 border-orange-100';
                                cardBorderColor = planStockOut ? 'border-red-100 bg-red-50' : 'border-orange-200 hover:border-orange-300 shadow-[0_4px_20px_rgba(255,165,0,0.08)]';
                            }

                            let saveBadge = '';
                            if (!planStockOut && (planName.toLowerCase().includes('3 month') || planName.toLowerCase().includes('year') || planName.toLowerCase().includes('6 month'))) {
                                saveBadge = `<div class="absolute -top-3 -right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1 transform rotate-3"><i class="fa-solid fa-tag"></i> Save ৳ ${Math.floor(plan.price * 0.2)}</div>`;
                            }

                            const featuresListHtml = features.map(f => {
                                return `<div class="flex items-center gap-2.5 mb-2"><i class="fa-solid ${getFeatureIcon(f)} w-3 text-center text-sm opacity-80"></i><span class="text-[11px] sm:text-xs text-slate-500 font-medium">${f}</span></div>`;
                            }).join('');

                            const div = document.createElement('div');
                            div.className = `relative bg-white border p-4 sm:p-5 rounded-3xl transition duration-300 ${cardBorderColor} ${planStockOut ? 'opacity-60 cursor-not-allowed grayscale-[20%]' : 'cursor-pointer group hover:shadow-lg mt-4'}`;
                            if (!planStockOut) div.onclick = () => showAgreementModal(plan);

                            div.innerHTML = `
                                ${saveBadge}
                                <div class="flex gap-4 sm:gap-6 items-center">
                                    <div class="flex-[1] border-r border-slate-100 pr-4 sm:pr-6">
                                        <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${planBadgeColor} text-[10px] sm:text-[11px] font-bold mb-3 border shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                                            <i class="fa-solid ${planIcon}"></i> ${planName}
                                        </div>
                                        <div class="flex items-baseline gap-1 mb-2">
                                            <span class="font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">৳ ${plan.price}</span>
                                        </div>
                                        ${planStockOut
                                    ? '<div class="flex items-center gap-1.5 text-[11px] text-red-500 font-bold bg-red-50 px-2.5 py-1 rounded-md w-fit"><i class="fa-solid fa-circle-xmark"></i> Stock Out</div>'
                                    : '<div class="flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-md w-fit"><i class="fa-solid fa-check-circle"></i> Available</div>'
                                }
                                    </div>
                                    <div class="flex-[1.2] pl-2">
                                        ${featuresListHtml}
                                    </div>
                                </div>
                                <div class="mt-4 pt-4 border-t border-slate-100">
                                    <button class="w-full ${planStockOut ? 'bg-slate-300' : btnGradient} text-white font-bold py-3.5 sm:py-4 rounded-2xl shadow-md transition-transform active:scale-[0.98] flex items-center justify-between px-6 group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
                                        <span class="flex items-center gap-2"><i class="fa-solid fa-shopping-cart text-white/90"></i> ${planStockOut ? 'Stock Out' : 'Buy Now'}</span>
                                        <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md"><i class="fa-solid fa-arrow-right text-xs"></i></div>
                                    </button>
                                </div>
                            `;
                            container.appendChild(div);
                        });
                    }
                }

                switchTab('vpn-package');
            }

            function updateProxyPrice(pricePerGb) {
                let gb = parseInt(document.getElementById('proxy-gb-input').value) || 1;
                if (gb < 1) gb = 1;
                document.getElementById('proxy-total-price').innerText = formatCurrency(gb * pricePerGb);
            }

            function buyProxy() {
                let gb = parseInt(document.getElementById('proxy-gb-input').value) || 1;
                if (gb < 1) gb = 1;
                const pricePerGb = currentVPN.pricePerGb || 0;
                const plan = {
                    id: 'proxy_' + gb + 'gb',
                    name: `${gb} GB`,
                    price: gb * pricePerGb
                };
                startPayment(plan);
            }

            function showBeautifulConfirm(itemName, price, onConfirm) {
                const existing = document.getElementById('beautiful-confirm-modal');
                if (existing) existing.remove();

                const currentBalance = window.appData?.user?.balance || 0;
                const newBalance = (currentBalance - price).toFixed(2);

                const modalHtml = `
            <div id="beautiful-confirm-modal" class="fixed inset-0 bg-black/60 z-[70] flex flex-col items-center justify-center p-4">
                <div class="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center transform scale-95 transition-transform duration-300" id="beautiful-confirm-content">
                    <div class="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm">
                        <i class="fa-solid fa-wallet"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-1">Confirm Purchase</h3>
                    <p class="text-[13px] text-gray-500 mb-4 px-2">You are about to buy <b class="text-gray-700">${itemName}</b></p>
                    
                    <div class="w-full bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 text-left">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Balance</span>
                            <span class="font-bold text-gray-800">${formatCurrency(currentBalance)}</span>
                        </div>
                        <div class="flex justify-between items-center mb-3 pb-3 border-b border-gray-200 border-dashed">
                            <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deduction</span>
                            <span class="font-bold text-red-500">- ${formatCurrency(price)}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-xs font-bold text-gray-700 uppercase tracking-wider">New Balance</span>
                            <span class="font-bold text-emerald-600 text-lg">${formatCurrency(newBalance)}</span>
                        </div>
                    </div>
                    
                    ${(() => {
                        if (window.appData && window.appData.settings && window.appData.settings.coinSystemEnabled !== false) {
                            let rate = 0;
                            const cat = (window.currentStoreCategory || '').toLowerCase();
                            const inName = itemName.toLowerCase();
                            if (inName.includes('vpn') || cat === 'product' || cat === 'vpn') rate = window.appData.settings.coinRateVpn || 100;
                            else if (inName.includes('proxy') || cat === 'proxy') rate = window.appData.settings.coinRateProxy || 100;
                            else if (inName.includes('mail') || cat === 'mail') rate = window.appData.settings.coinRateMail || 100;
                            else rate = window.appData.settings.coinRateVpn || 100;

                            if (!inName.includes('number') && !inName.includes('deposit') && !inName.includes('add balance') && cat !== 'number') {
                                const coins = Math.floor(price * rate);
                                if (coins > 0) {
                                    return `<div class="w-full bg-gradient-to-r from-yellow-50 to-yellow-100/50 text-yellow-700 rounded-2xl p-3 mb-6 text-xs font-bold border border-yellow-200 flex items-center justify-center gap-2 shadow-sm">
                                        <span class="text-lg">🪙</span> <span>You will earn ${coins} Coins from this order!</span>
                                    </div>`;
                                }
                            }
                        }
                        return '';
                    })()}

                    <div class="flex w-full gap-3">
                        <button id="btn-beautiful-cancel" class="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Cancel</button>
                        <button id="btn-beautiful-confirm" class="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-md shadow-blue-500/30">Yes, Buy Now</button>
                    </div>
                </div>
            </div>
            `;
                document.body.insertAdjacentHTML('beforeend', modalHtml);

                const modal = document.getElementById('beautiful-confirm-modal');
                const content = document.getElementById('beautiful-confirm-content');

                setTimeout(() => {
                    content.classList.remove('scale-95');
                    content.classList.add('scale-100');
                }, 10);

                document.getElementById('btn-beautiful-cancel').onclick = () => modal.remove();
                document.getElementById('btn-beautiful-confirm').onclick = () => {
                    modal.remove();
                    onConfirm();
                };
            }

            let currentBulkQuantity = 1;

            function showBulkOrderConfirm(itemName, unitPrice, maxStock, onConfirm) {
                const existing = document.getElementById('beautiful-confirm-modal');
                if (existing) existing.remove();

                currentBulkQuantity = 1;
                const currentBalance = window.appData?.user?.balance || 0;

                const renderModal = () => {
                    const totalPrice = unitPrice * currentBulkQuantity;
                    const newBalance = (currentBalance - totalPrice).toFixed(2);
                    const isInsufficient = currentBalance < totalPrice;

                    const product = window.appData.products?.find(p => p.name === itemName);
                    let detailsHtml = '';
                    if (product && product.detailsNotes) {
                        detailsHtml = `<div class="w-full mb-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-left text-[11px] text-blue-800 whitespace-pre-wrap leading-relaxed">${product.detailsNotes}</div>`;
                    }

                    return `
                <div id="beautiful-confirm-modal" class="fixed inset-0 bg-black/60 z-[70] flex flex-col items-center justify-center p-4">
                    <div class="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center transform scale-95 transition-transform duration-300" id="beautiful-confirm-content">
                        <div class="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm">
                            <i class="fa-solid fa-boxes-stacked"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-1">Bulk Purchase</h3>
                        <p class="text-[13px] text-gray-500 mb-4 px-2"><b class="text-gray-700">${itemName}</b></p>
                        
                        <div class="flex items-center justify-center gap-4 mb-4">
                            <button id="btn-qty-minus" class="w-10 h-10 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200">-</button>
                            <input type="number" id="bulk-qty-input" value="${currentBulkQuantity}" class="text-xl font-bold w-16 text-center border-b-2 border-gray-200 focus:outline-none focus:border-indigo-500 bg-transparent" min="1" max="${maxStock}" />
                            <button id="btn-qty-plus" class="w-10 h-10 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200">+</button>
                        </div>
                        <p class="text-xs text-gray-400 mb-4">${maxStock} items available in stock</p>
                        
                        ${detailsHtml}
                        
                        <div class="w-full bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 text-left">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Balance</span>
                                <span class="font-bold text-gray-800">${formatCurrency(currentBalance)}</span>
                            </div>
                            <div class="flex justify-between items-center mb-3 pb-3 border-b border-gray-200 border-dashed">
                                <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deduction (x${currentBulkQuantity})</span>
                                <span class="font-bold text-red-500">- ${formatCurrency(totalPrice)}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-xs font-bold text-gray-700 uppercase tracking-wider">New Balance</span>
                                <span class="font-bold ${isInsufficient ? 'text-red-500' : 'text-emerald-600'} text-lg">${isInsufficient ? 'Insufficient' : formatCurrency(newBalance)}</span>
                            </div>
                        </div>
                        
                        <div class="flex w-full gap-3">
                            <button id="btn-beautiful-cancel" class="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Cancel</button>
                            <button id="btn-beautiful-confirm" class="flex-1 py-3 rounded-xl font-bold text-white ${isInsufficient ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/30'} transition" ${isInsufficient ? 'disabled' : ''}>Yes, Buy Now</button>
                        </div>
                    </div>
                </div>
                `;
                };

                const attachEvents = () => {
                    const modal = document.getElementById('beautiful-confirm-modal');
                    const content = document.getElementById('beautiful-confirm-content');

                    document.getElementById('btn-qty-minus').onclick = () => {
                        if (currentBulkQuantity > 1) {
                            currentBulkQuantity--;
                            updateModal();
                        }
                    };

                    const qtyInput = document.getElementById('bulk-qty-input');
                    if (qtyInput) {
                        qtyInput.addEventListener('change', (e) => {
                            let val = parseInt(e.target.value);
                            if (isNaN(val) || val < 1) val = 1;
                            if (val > maxStock) {
                                val = maxStock;
                                showToast(`Only ${maxStock} items available`, "warning");
                            }
                            currentBulkQuantity = val;
                            updateModal();
                        });
                    }

                    document.getElementById('btn-qty-plus').onclick = () => {
                        if (currentBulkQuantity < maxStock) {
                            currentBulkQuantity++;
                            updateModal();
                        } else {
                            showToast(`Only ${maxStock} items available`, "warning");
                        }
                    };

                    document.getElementById('btn-beautiful-cancel').onclick = () => modal.remove();

                    const confirmBtn = document.getElementById('btn-beautiful-confirm');
                    if (confirmBtn) {
                        confirmBtn.onclick = () => {
                            modal.remove();
                            onConfirm(currentBulkQuantity, unitPrice * currentBulkQuantity);
                        };
                    }
                };

                const updateModal = () => {
                    const existingContent = document.getElementById('beautiful-confirm-content');
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = renderModal();

                    const newContent = tempDiv.querySelector('#beautiful-confirm-content');
                    if (existingContent && newContent) {
                        existingContent.innerHTML = newContent.innerHTML;
                        attachEvents();
                    }
                };

                document.body.insertAdjacentHTML('beforeend', renderModal());
                attachEvents();

                const modal = document.getElementById('beautiful-confirm-modal');
                const content = document.getElementById('beautiful-confirm-content');
                setTimeout(() => {
                    content.classList.remove('scale-95');
                    content.classList.add('scale-100');
                }, 10);
            }

            function showGmailPrompt(itemName, onConfirm) {
                const existing = document.getElementById('gmail-prompt-modal');
                if (existing) existing.remove();

                const modalHtml = `
            <div id="gmail-prompt-modal" class="fixed inset-0 bg-black/60 z-[70] flex flex-col items-center justify-center p-4">
                <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl transform transition-all scale-95 opacity-0" id="gmail-prompt-content">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 text-3xl">
                            <i class="fa-solid fa-envelope"></i>
                        </div>
                        <h3 class="text-xl font-black text-slate-800">Email Required</h3>
                        <p class="text-sm text-slate-500 mt-2 font-medium">Please enter your Gmail address to receive the invitation for <b>${itemName}</b>.</p>
                    </div>
                    
                    <input type="email" id="gmail-input" placeholder="yourname@gmail.com" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-6 text-center font-bold text-slate-700">

                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="document.getElementById('gmail-prompt-modal').remove()" class="py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                        <button id="gmail-confirm-btn" class="py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">Continue</button>
                    </div>
                </div>
            </div>`;
                document.body.insertAdjacentHTML('beforeend', modalHtml);

                setTimeout(() => {
                    document.getElementById('gmail-prompt-content').classList.remove('scale-95', 'opacity-0');
                    document.getElementById('gmail-input').focus();
                }, 10);

                document.getElementById('gmail-confirm-btn').onclick = () => {
                    const val = document.getElementById('gmail-input').value.trim();
                    if (!val || !val.includes('@')) {
                        alert("Please enter a valid email address.");
                        return;
                    }
                    document.getElementById('gmail-prompt-modal').remove();
                    onConfirm(val);
                };
            }

            function startPayment(plan) {
                const category = currentVPN ? currentVPN.category : (plan.externalType || 'vpn');
                const isGemini = currentVPN && currentVPN.name && currentVPN.name.toLowerCase().includes('gemini');
                if (category === 'app' && !isGemini) {
                    showGmailPrompt(plan.name, (email) => {
                        window.currentDeliveryEmail = email;
                        continuePaymentFlow(plan);
                    });
                    return;
                }
                window.currentDeliveryEmail = null;
                continuePaymentFlow(plan);
            }

            function continuePaymentFlow(plan) {
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
                            const tInput = document.getElementById('checkout-trx-id-input');
                            if (tInput) tInput.value = 'DIRECT_BUY_' + Math.random().toString(36).substring(2, 10).toUpperCase();
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
                            const tInput = document.getElementById('checkout-trx-id-input');
                            if (tInput) tInput.value = 'DIRECT_BUY_' + Math.random().toString(36).substring(2, 10).toUpperCase();
                            showToast("Processing order...", "info");
                            submitCheckoutPayment();
                        });
                    }
                    return;
                }

                // NEW FLOW: Render and show checkout view
                renderCheckoutStep1();
                switchTab('checkout');
            }

            function finishOrder() {
                closePaymentModal();
                if (window.currentPlan && window.currentPlan.externalType === 'number') {
                    switchTab('vpn-store');
                    if (window.switchNumTab) window.switchNumTab('history');
                } else {
                    switchTab('orders');
                }
            }

            let currentMailProduct = null;
            let mailOrderQty = 1;

            window.openMailDetailsModal = function (productId) {
                const p = window.appData.products.find(p => p.id === productId);
                if (!p) return;
                currentMailProduct = p;
                mailOrderQty = 1;

                document.getElementById('mail-details-name').innerText = p.name;
                const finalPrice = p.price || 0;
                document.getElementById('mail-details-price').innerText = `৳ ${finalPrice.toFixed(2)}`;

                const isOutlook = p.name.toLowerCase().includes('outlook') || p.name.toLowerCase().includes('hotmail');
                let iconHtml = '';
                if (p.logoUrl) {
                    iconHtml = `<img src="${p.logoUrl}" class="w-full h-full object-contain rounded-lg">`;
                } else if (isOutlook) {
                    iconHtml = `<div class="w-full h-full rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 shadow-md"><i class="fa-brands fa-microsoft text-white text-3xl"></i></div>`;
                } else {
                    iconHtml = `<div class="w-full h-full rounded-xl flex items-center justify-center bg-orange-100 shadow-inner"><i class="fa-solid fa-envelope text-orange-500 text-3xl"></i></div>`;
                }
                document.getElementById('mail-details-icon').innerHTML = iconHtml;
                document.getElementById('mail-details-notes').innerText = p.detailsNotes || 'No additional details provided.';

                updateMailTotal();
                loadMailReviews(p.id);

                document.getElementById('write-review-form').classList.add('hidden');
                setReviewStar(0);
                document.getElementById('review-comment').value = '';

                const modal = document.getElementById('mail-details-modal');
                const content = document.getElementById('mail-details-modal-content');
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                setTimeout(() => {
                    content.classList.remove('translate-y-full');
                }, 10);
            };

            window.closeMailDetailsModal = function () {
                const modal = document.getElementById('mail-details-modal');
                const content = document.getElementById('mail-details-modal-content');
                content.classList.add('translate-y-full');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }, 300);
            }

            // Setup 30-second polling for real-time updates
            document.addEventListener('DOMContentLoaded', () => {
                setInterval(() => {
                    if (window.appData && window.appData.user) {
                        fetchAppData(true);
                    }
                }, 30000);
            });;

            window.changeMailQty = function (delta) {
                mailOrderQty += delta;
                if (mailOrderQty < 1) mailOrderQty = 1;
                updateMailTotal();
            };

            function updateMailTotal() {
                if (!currentMailProduct) return;
                document.getElementById('mail-qty-display').innerText = mailOrderQty;
                const finalPrice = currentMailProduct.price || 0;
                document.getElementById('mail-total-price').innerText = `৳ ${(finalPrice * mailOrderQty).toFixed(2)}`;
            }

            window.buyMailProduct = function () {
                if (!currentMailProduct) return;
                const finalPrice = currentMailProduct.price || 0;
                closeMailDetailsModal();
                setTimeout(() => {
                    currentVPN = null;
                    startPayment({
                        id: currentMailProduct._id || currentMailProduct.id,
                        name: `${currentMailProduct.name} (Qty: ${mailOrderQty})`,
                        price: finalPrice * mailOrderQty,
                        isExternal: true,
                        externalType: 'mail',
                        externalId: currentMailProduct._id || currentMailProduct.id,
                        qty: mailOrderQty
                    });
                }, 300);
            };

            window.setReviewStar = function (val) {
                document.getElementById('review-rating-val').value = val;
                const stars = document.getElementById('review-stars-input').children;
                for (let i = 0; i < 5; i++) {
                    if (i < val) {
                        stars[i].classList.add('text-orange-400');
                        stars[i].classList.remove('text-gray-300');
                    } else {
                        stars[i].classList.remove('text-orange-400');
                        stars[i].classList.add('text-gray-300');
                    }
                }
            };

            window.submitReview = async function () {
                const rating = parseInt(document.getElementById('review-rating-val').value);
                const comment = document.getElementById('review-comment').value;

                if (!rating) return showToast('Please select a star rating', 'error');
                if (!currentMailProduct) return;

                try {
                    const res = await fetch('/api/reviews', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('tg_token') },
                        body: JSON.stringify({ productId: currentMailProduct.id, rating, comment })
                    });
                    const data = await res.json();
                    if (data.success) {
                        showToast(data.message, 'success');
                        document.getElementById('write-review-form').classList.add('hidden');
                    } else {
                        showToast(data.error, 'error');
                    }
                } catch (e) {
                    showToast('Failed to submit review', 'error');
                }
            };

            async function loadMailReviews(productId) {
                const list = document.getElementById('mail-reviews-list');
                list.innerHTML = '<div class="text-center py-4 text-gray-400 text-sm"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Loading reviews...</div>';
                try {
                    const res = await fetch('/api/reviews/' + productId);
                    const data = await res.json();
                    if (data.success) {
                        if (data.reviews.length === 0) {
                            list.innerHTML = '<div class="text-center py-4 text-gray-400 text-xs bg-gray-50 rounded-xl">No reviews yet. Be the first to review!</div>';
                        } else {
                            list.innerHTML = data.reviews.map(r => `
                            <div class="bg-gray-50 p-4 rounded-xl">
                                <div class="flex justify-between items-start mb-2">
                                    <div>
                                        <div class="font-bold text-sm text-gray-800">${r.userName}</div>
                                        <div class="text-[10px] text-gray-400">${new Date(r.date).toLocaleDateString()}</div>
                                    </div>
                                    <div class="flex text-orange-400 text-xs">
                                        ${'<i class="fa-solid fa-star"></i>'.repeat(r.rating)}${'<i class="fa-solid fa-star text-gray-300"></i>'.repeat(5 - r.rating)}
                                    </div>
                                </div>
                                ${r.comment ? `<p class="text-xs text-gray-600 mt-2">${r.comment}</p>` : ''}
                            </div>
                        `).join('');
                        }
                    }
                } catch (e) {
                    list.innerHTML = '<div class="text-center py-4 text-red-400 text-xs bg-red-50 rounded-xl">Failed to load reviews.</div>';
                }
            }

            function closePaymentModal() {
                const modal = document.getElementById('payment-modal');
                const content = document.getElementById('payment-modal-content');
                content.classList.add('translate-y-full');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }, 300);
                document.getElementById('trx-id-input').value = '';
            }

            function selectPaymentMethod(m) {
                currentMethod = m;

                // Reset Coupon
                currentDiscount = 0;
                appliedCouponCode = null;
                const msgEl = document.getElementById('coupon-message');
                if (msgEl) { msgEl.classList.add('hidden'); msgEl.innerText = ''; }
                const codeInput = document.getElementById('coupon-input-code');
                if (codeInput) { codeInput.value = ''; codeInput.disabled = false; }

                document.getElementById('pay-amount').innerText = formatCurrency(currentPlan.price);

                // Set Logo
                const logoContainer = document.getElementById('pay-method-logo-display');
                if (m.logoUrl) {
                    logoContainer.innerHTML = `<img src="${m.logoUrl}" class="h-8 object-contain" onerror="this.style.display='none';">`;
                } else {
                    logoContainer.innerHTML = `<span class="font-bold text-gray-800">${m.name}</span>`;
                }

                // Set Color Theme and Instructions
                const box = document.getElementById('pay-instruction-box');
                const list = document.getElementById('pay-instruction-list');

                if (m.isWallet) {
                    // Instantly go to a confirmation view for Wallet
                    document.getElementById('pay-step-1').classList.add('hidden');
                    document.getElementById('pay-step-2').classList.remove('hidden');

                    const userBalance = window.appData.user?.balance || 0;

                    list.innerHTML = `
                    <li class="mb-3 text-center">
                        <div class="inline-block bg-emerald-100 p-3 rounded-full text-emerald-600 mb-2">
                            <i class="fa-solid fa-wallet text-2xl"></i>
                        </div>
                        <h4 class="font-bold text-gray-800">Pay with Wallet Balance</h4>
                    </li>
                    <li class="flex justify-between items-center py-2 border-b border-gray-100">
                        <span class="text-gray-500">Current Balance:</span>
                        <span class="font-bold text-gray-800">${formatCurrency(userBalance)}</span>
                    </li>
                    <li class="flex justify-between items-center py-2 border-b border-gray-100">
                        <span class="text-gray-500">Total Price:</span>
                        <span class="font-bold text-red-500">- ${formatCurrency(currentPlan.price)}</span>
                    </li>
                    <li class="flex justify-between items-center py-2 border-b border-gray-100">
                        <span class="text-gray-500">Remaining Balance:</span>
                        <span class="font-bold text-emerald-600">${formatCurrency(Math.max(0, userBalance - currentPlan.price))}</span>
                    </li>
                    <li class="mt-4 text-center text-xs text-gray-500">
                        ${userBalance >= currentPlan.price ? 'Click VERIFY to deduct balance and instantly receive your product.' : '<span class="text-red-500 font-bold">Insufficient balance. Please add balance first.</span>'}
                    </li>
                `;

                    document.getElementById('trx-id-input').parentElement.style.display = 'none'; // hide Trx input
                    return;
                }

                document.getElementById('trx-id-input').parentElement.style.display = 'block'; // show Trx input

                let bgClass = 'bg-blue-600';
                const nameLower = m.name.toLowerCase();

                if (nameLower.includes('bkash')) bgClass = 'bg-pink-600';
                else if (nameLower.includes('nagad')) bgClass = 'bg-orange-500';
                else if (nameLower.includes('rocket')) bgClass = 'bg-purple-600';
                else if (nameLower.includes('binance')) bgClass = 'bg-yellow-400';
                else if (nameLower.includes('bep20')) bgClass = 'bg-[#26a17b]';
                else if (nameLower.includes('crypto')) bgClass = 'bg-slate-800';

                const isBinance = nameLower.includes('binance');
                const isBep20 = nameLower.includes('bep20');
                const isCrypto = isBinance || isBep20 || nameLower.includes('crypto');

                const textColor = isBinance ? 'text-gray-900' : 'text-white';

                // Reset classes
                box.className = `rounded-xl p-5 shadow-md relative overflow-hidden ${bgClass} ${textColor}`;

                // Calculate USDT amount
                const usdtRate = window.appData?.settings?.usdRate || 125;
                const usdtAmount = (currentPlan.price / usdtRate).toFixed(2);

                if (isBinance) {
                    list.innerHTML = `
                    <li class="flex items-start gap-3 mb-3">
                        <span class="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                        <span>আপনার <strong>Binance App</strong> খুলুন।</span>
                    </li>
                    <li class="flex items-start gap-3 mb-3">
                        <span class="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                        <span><strong>"Send"</strong> বা <strong>"Pay"</strong> অপশনে ক্লিক করুন।</span>
                    </li>
                    <li class="flex items-start gap-3 mb-4">
                        <span class="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                        <span>নিচের <strong>Binance ID</strong> বা <strong>Email</strong>-এ পাঠান:</span>
                    </li>
                    <li class="mb-4">
                        <div class="bg-black/10 border border-black/20 rounded-xl px-4 py-3 flex items-center justify-between gap-2">
                            <div>
                                <p class="text-[10px] font-bold opacity-70 mb-0.5">Binance ID / Email</p>
                                <span class="font-mono font-bold text-base">${m.number}</span>
                            </div>
                            <button onclick="copyToClipboard('${m.number}')" class="text-xs bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0">
                                <i class="fa-regular fa-copy"></i> Copy
                            </button>
                        </div>
                    </li>
                    <li class="flex items-start gap-3 mb-3">
                        <span class="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                        <span>পাঠানোর পরিমাণ: <strong class="text-gray-900">$${usdtAmount} USDT</strong> (${formatCurrency(currentPlan.price)})</span>
                    </li>
                    <li class="flex items-start gap-3">
                        <span class="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">5</span>
                        <span>Payment করার পর <strong>Transaction ID (TxID)</strong> এবং <strong>Screenshot</strong> নিচে দিয়ে VERIFY করুন।</span>
                    </li>
                `;
                } else if (isBep20) {
                    list.innerHTML = `
                    <li class="flex items-start gap-3 mb-3">
                        <span class="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                        <span>আপনার <strong>Crypto Wallet</strong> বা <strong>Binance App</strong> খুলুন।</span>
                    </li>
                    <li class="flex items-start gap-3 mb-3">
                        <span class="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                        <span><strong>Withdraw (USDT)</strong> অপশনে যান এবং Network হিসেবে <strong>BEP20 (BNB Smart Chain)</strong> সিলেক্ট করুন।</span>
                    </li>
                    <li class="flex items-start gap-3 mb-4">
                        <span class="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                        <span>নিচের <strong>Wallet Address</strong>-এ USDT পাঠান:</span>
                    </li>
                    <li class="mb-4">
                        <div class="bg-black/20 border border-white/20 rounded-xl px-4 py-3 flex items-center justify-between gap-2">
                            <div class="overflow-hidden">
                                <p class="text-[10px] font-bold opacity-80 mb-0.5">BEP20 Address</p>
                                <span class="font-mono font-bold text-xs md:text-sm block truncate w-full">${m.number}</span>
                            </div>
                            <button onclick="copyToClipboard('${m.number}')" class="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0">
                                <i class="fa-regular fa-copy"></i> Copy
                            </button>
                        </div>
                    </li>
                    <li class="flex items-start gap-3 mb-3">
                        <span class="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                        <span>পাঠানোর পরিমাণ: <strong>$${usdtAmount} USDT</strong> (${formatCurrency(currentPlan.price)})</span>
                    </li>
                    <li class="flex items-start gap-3">
                        <span class="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">5</span>
                        <span>Payment করার পর <strong>Transaction ID (TxID)</strong> নিচে দিয়ে VERIFY করুন।</span>
                    </li>
                `;
                } else {
                    const appName = nameLower.includes('bkash') ? 'bKash' : nameLower.includes('nagad') ? 'Nagad' : nameLower.includes('rocket') ? 'Rocket' : m.name;
                    list.innerHTML = `
                    <li class="flex items-start gap-3 mb-3">
                        <span class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                        <span>আপনার <strong>${appName} App</strong> অথবা USSD (*247#, *167#) খুলুন।</span>
                    </li>
                    
                        <span class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                        <span><strong>"Send Money"</strong> অপশন সিলেক্ট করুন।</span>
                    </li>
                    <li class="flex items-start gap-3 mb-4">
                        <span class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                        <span>নিচের নম্বরে টাকা পাঠান:</span>
                    </li>
                    <li class="mb-4">
                        <div class="bg-white/20 border border-white/30 rounded-xl px-4 py-3 flex items-center justify-between gap-2">
                            <div>
                                <p class="text-[10px] font-bold opacity-70 mb-0.5">${appName} Number</p>
                                <span class="font-mono font-bold text-base">${m.number}</span>
                            </div>
                            <button onclick="copyToClipboard('${m.number}')" class="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0">
                                <i class="fa-regular fa-copy"></i> Copy
                            </button>
                        </div>
                    </li>
                    <li class="flex items-start gap-3 mb-3">
                        <span class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                        <span>পরিমাণ: <strong>${formatCurrency(currentPlan.price)}</strong></span>
                    </li>
                    <li class="flex items-start gap-3">
                        <span class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">5</span>
                        <span>Payment করার পর <strong>Transaction ID (TxID)</strong> নিচে দিয়ে VERIFY করুন।</span>
                    </li>
                `;
                }

                goPayStep(2);
            }



            function openAddFundModal() {
                if (!window.appData || !window.appData.user) {
                    sessionStorage.setItem('pendingAddFund', 'true');
                    window.location.href = 'login.html';
                    return;
                }
                document.getElementById('add-fund-modal').classList.remove('hidden');
            }

            function goPayStep(step) {
                document.getElementById('pay-step-1').classList.add('hidden');
                document.getElementById('pay-step-2').classList.add('hidden');
                document.getElementById('pay-step-success').classList.add('hidden');

                if (step === 1) document.getElementById('pay-step-1').classList.remove('hidden');
                if (step === 2) document.getElementById('pay-step-2').classList.remove('hidden');
                if (step === 3) document.getElementById('pay-step-success').classList.remove('hidden');

                if (step === 2 && (typeof currentMethod !== 'undefined' && currentMethod && !currentMethod.isWallet)) {
                    if (typeof startPaymentTimer === 'function') startPaymentTimer();
                    // Screenshot UI completely disabled
                    const uploadContainer = document.getElementById('screenshot-upload-container');
                    const trxContainer = document.getElementById('trx-input-container');
                    if (uploadContainer) { uploadContainer.classList.add('hidden'); uploadContainer.style.display = 'none'; }
                    if (trxContainer) { trxContainer.classList.remove('hidden'); trxContainer.style.display = 'block'; }
                    const trxInput = document.getElementById('trx-id-input');
                    if (trxInput) trxInput.value = '';
                } else {
                    if (typeof stopPaymentTimer === 'function') stopPaymentTimer();
                }
            }


            let currentDiscount = 0;
            let appliedCouponCode = null;

            function applyCoupon() {
                const codeInput = document.getElementById('coupon-input-code');
                const code = codeInput.value.trim().toUpperCase();
                const msgEl = document.getElementById('coupon-message');

                if (!code) return;
                msgEl.classList.remove('hidden', 'text-green-600', 'text-red-500');

                // Check Welcome Reward First
                if (window.appData.user && window.appData.user.discountCoupon === code) {
                    if (window.appData.user.couponUsed) {
                        msgEl.classList.add('text-red-500');
                        msgEl.innerText = 'This welcome coupon has already been used!';
                        return;
                    }
                    if (!currentVPN) {
                        msgEl.classList.add('text-red-500');
                        msgEl.innerText = 'Welcome coupon is only valid for VPNs!';
                        return;
                    }
                    currentDiscount = window.appData.user.discountFixed || 5;
                    appliedCouponCode = code;
                    let finalPrice = Math.max(0, currentPlan.price - currentDiscount);
                    document.getElementById('pay-amount').innerText = formatCurrency(finalPrice);

                    msgEl.classList.add('text-green-600');
                    msgEl.innerText = `Welcome Discount Applied! ৳${window.appData.user.discountFixed || 5} OFF (${formatCurrency(currentDiscount)})`;
                    codeInput.disabled = true;
                    return;
                }

                // Existing global coupon logic
                const coupons = window.appData.coupons || [];
                const coupon = coupons.find(c => c.code.toLowerCase() === code.toLowerCase());

                if (!coupon) {
                    msgEl.classList.add('text-red-500');
                    msgEl.innerText = 'Invalid coupon code!';
                    return;
                }

                if (window.appData.user && window.appData.user.usedCoupons && window.appData.user.usedCoupons.includes(coupon.code)) {
                    msgEl.classList.add('text-red-500');
                    msgEl.innerText = 'You have already used this coupon!';
                    return;
                }

                if (coupon.targetProductId && currentVPN && currentVPN.id !== coupon.targetProductId) {
                    msgEl.classList.add('text-red-500');
                    msgEl.innerText = 'This coupon is not valid for this product!';
                    return;
                }

                if (!coupon.active || new Date() > new Date(coupon.expiryDate)) {
                    msgEl.classList.add('text-red-500');
                    msgEl.innerText = 'Coupon is inactive or has expired!';
                    return;
                }

                if (coupon.maxUses > 0 && coupon.usesCount >= coupon.maxUses) {
                    msgEl.classList.add('text-red-500');
                    msgEl.innerText = 'Coupon usage limit reached!';
                    return;
                }

                // Apply discount
                if (coupon.discountType === 'fixed') {
                    currentDiscount = coupon.discountAmount || 0;
                } else {
                    currentDiscount = (currentPlan.price * (coupon.discountPercent || 0)) / 100;
                }

                appliedCouponCode = coupon.code;

                let finalPrice = Math.max(0, currentPlan.price - currentDiscount);
                document.getElementById('pay-amount').innerText = formatCurrency(finalPrice);

                const discountMsg = coupon.discountType === 'fixed' ? `৳${coupon.discountAmount} OFF` : `${coupon.discountPercent}% OFF`;
                msgEl.classList.add('text-green-600');
                msgEl.innerText = `Coupon applied! ${discountMsg} (${formatCurrency(currentDiscount)}).`;
                codeInput.disabled = true;
            }

            function originalSubmitPaymentFunc() {

                const trxId = document.getElementById('trx-id-input').value.trim();
                if (!currentMethod.isWallet && !trxId) {
                    alert("Please enter Transaction ID!");
                    return;
                }

                if (currentMethod.isWallet) {
                    const userBalance = window.appData.user?.balance || 0;
                    if (userBalance < currentPlan.price) {
                        alert("Insufficient wallet balance! Please add balance first.");
                        return;
                    }
                }

                let orders = (window.appData.orders || []).filter(o => o.category !== 'number' && o.externalType !== 'number');

                // Duplicate TrxID check
                if (!currentMethod.isWallet) {
                    const isDuplicate = orders.some(o => o.trxId && o.trxId.toLowerCase() === trxId.toLowerCase());
                    if (isDuplicate) {
                        const msgEl = document.getElementById('coupon-message');
                        if (msgEl) {
                            msgEl.classList.remove('hidden', 'text-green-600');
                            msgEl.classList.add('text-red-600');
                            msgEl.innerHTML = `Already you have submitted! Please check <a href="#" onclick="closePaymentModal(); switchTab('orders')" class="underline font-bold text-blue-600">recent trx history</a>.`;
                        } else {
                            alert("Already you have submitted! Please check recent trx history.");
                        }
                        return;
                    }
                }

                const finalPrice = Math.max(0, currentPlan.price - currentDiscount);
                const itemName = currentVPN ? `${currentVPN.name} - ${currentPlan.name}` : currentPlan.name;
                const newOrder = {
                    id: 'AYN' + Math.floor(Math.random() * 1000000),
                    tgId: window.appData.user ? window.appData.user.tgId : null,
                    item: itemName,
                    category: currentVPN ? currentVPN.category : null,
                    plan: currentPlan ? currentPlan.name : null,
                    price: finalPrice,
                    method: currentMethod.name,
                    trxId: trxId,
                    status: 'Pending',
                    timestamp: Date.now(),
                    couponUsed: appliedCouponCode || null,
                    couponCode: appliedCouponCode || null,
                    deliveryEmail: window.currentDeliveryEmail || null,
                    quantity: typeof currentBulkQuantity !== 'undefined' ? currentBulkQuantity : 1
                };

                // Note: coupon usage tracking is now handled securely by the backend in /api/orders

                const isExternal = currentPlan.isExternal;
                const endpoint = isExternal ? '/api/buy-external' : '/api/orders';
                const payload = isExternal ? {
                    externalId: currentPlan.externalId,
                    externalType: currentPlan.externalType,
                    service: currentPlan.service,
                    country: currentPlan.country,
                    price: finalPrice,
                    itemName: itemName,
                    quantity: typeof currentBulkQuantity !== 'undefined' ? currentBulkQuantity : 1
                } : newOrder;

                // Post to backend
                fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('tg_token')}`
                    },
                    body: JSON.stringify(payload)
                }).then(res => res.json()).then(data => {
                    if (data.success) {
                        orders.unshift(data.order);
                        window.appData.orders = orders;

                        if (data.allocatedStocks && data.allocatedStocks.length > 0) {
                            if (!window.appData.stocks) window.appData.stocks = [];
                            window.appData.stocks.push(...data.allocatedStocks);
                        }
                        if (currentMethod.isWallet) {
                            // Deduct local balance
                            if (window.appData.user) {
                                window.appData.user.balance -= finalPrice;
                                document.querySelectorAll('.user-balance-text').forEach(el => el.innerText = formatCurrency(window.appData.user.balance));
                            }

                            if (appliedCouponCode && window.appData.user && window.appData.user.discountCoupon === appliedCouponCode) {
                                window.appData.user.couponUsed = true;
                                updateRewardTrayUI();
                            }

                            if (data.order.status === 'Completed') {
                                const isMail = data.order.category === 'mail' || data.order.externalType === 'mail';
                                document.getElementById('pay-step-success').innerHTML = `
                                <div class="text-center">
                                    <div class="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                                        <i class="fa-solid fa-check"></i>
                                    </div>
                                    <h3 class="font-bold text-xl text-gray-800 mb-2">Order Delivered!</h3>
                                    <p class="text-gray-500 text-sm mb-4">You have successfully purchased via Wallet.</p>
                                    
                                    ${isMail ? `
                                    <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 text-left mb-4">
                                        <h4 class="font-bold text-blue-800 text-sm mb-1"><i class="fa-solid fa-boxes-stacked mr-1"></i> Mail Accounts Ready</h4>
                                        <p class="text-xs text-blue-600">Your accounts have been successfully allocated to this order.</p>
                                    </div>
                                    ` : `
                                    <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 text-left">
                                        <p class="text-xs text-gray-500 mb-1">Email / Username:</p>
                                        <p class="font-mono font-bold text-sm text-gray-800 mb-3">${data.order.deliveryEmail || 'N/A'}</p>
                                        
                                        <p class="text-xs text-gray-500 mb-1">Password:</p>
                                        <p class="font-mono font-bold text-sm text-gray-800 ${data.order.deliverySecurityKey ? 'mb-3' : ''}">${data.order.deliveryPass || 'N/A'}</p>
                                        
                                        ${data.order.deliverySecurityKey ? `
                                        <p class="text-xs text-gray-500 mb-1">Token / Extra Details:</p>
                                        <p class="font-mono font-bold text-sm text-gray-800 break-all">${data.order.deliverySecurityKey}</p>
                                        ` : ''}
                                    </div>
                                    `}
                                </div>
                                <div class="flex flex-col gap-2 mt-6">
                                    <button onclick="finishOrder()" class="w-full bg-gray-900 text-white font-bold py-3 rounded-xl">Go to Orders</button>
                                    ${isMail ? `
                                    <button onclick="addMailsToInbox('${data.order.id}')" class="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-sm"><i class="fa-solid fa-envelope-open mr-1"></i> Add to Inbox</button>
                                    <button 
                                    ` : ''}
                                </div>
                            `;
                            }
                        } else {
                            const successContainer = document.getElementById('pay-step-success');
                            let timeLeft = 10;
                            let countdownInterval;
                            if (successContainer) {
                                successContainer.innerHTML = `
                                <div class="relative w-20 h-20 mx-auto mb-4">
                                    <div class="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <div class="absolute inset-0 flex items-center justify-center font-black text-2xl text-blue-600" id="verify-countdown">10</div>
                                </div>
                                <h3 class="text-xl font-bold text-gray-800 mb-1">Verifying...</h3>
                                <p class="text-xs text-gray-500 mb-6">Waiting for PayBridge confirmation...</p>
                            `;
                                countdownInterval = setInterval(() => {
                                    timeLeft--;
                                    const cdEl = document.getElementById('verify-countdown');
                                    if (cdEl) cdEl.innerText = timeLeft > 0 ? timeLeft : 0;
                                    if (timeLeft <= 0) clearInterval(countdownInterval);
                                }, 1000);
                            }

                            let attempts = 0;
                            const pollInterval = setInterval(() => {
                                attempts++;
                                fetch('/api/data', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('tg_token') } })
                                    .then(r => r.json()).then(respData => {
                                        if (respData.success && successContainer) {
                                            const updatedOrder = (respData.orders || []).find(o => o.id === data.order.id);
                                            if (updatedOrder && (updatedOrder.status === 'Approved' || updatedOrder.status === 'Completed')) {
                                                clearInterval(pollInterval);
                                                if (countdownInterval) clearInterval(countdownInterval);
                                                if (respData.user && window.appData && window.appData.user) {
                                                    window.appData.user.balance = respData.user.balance;
                                                    document.querySelectorAll('.user-balance-text').forEach(el => el.innerText = typeof formatCurrency !== 'undefined' ? formatCurrency(window.appData.user.balance) : window.appData.user.balance);
                                                }
                                                successContainer.innerHTML = `
                                            <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-sm border border-green-200">
                                                <i class="fa-solid fa-check text-4xl"></i>
                                            </div>
                                            <h3 class="text-xl font-black text-gray-800 mb-1 tracking-tight">Payment Verified!</h3>
                                            <p class="text-xs text-gray-500 mb-6 font-medium">Your payment was auto-approved via PayBridge.</p>
                                            <button class="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-sm" onclick="finishOrder()">Great</button>
                                        `;
                                            }
                                        }
                                    });

                                if (attempts >= 5) {
                                    clearInterval(pollInterval);
                                    if (countdownInterval) clearInterval(countdownInterval);
                                    if (successContainer) {
                                        successContainer.innerHTML = `
                                        <div class="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse shadow-sm border border-yellow-200">
                                            <i class="fa-solid fa-clock text-4xl"></i>
                                        </div>
                                        <h3 class="text-xl font-black text-gray-800 mb-1 tracking-tight">Under Review!</h3>
                                        <p class="text-xs text-gray-500 mb-6 font-medium">Payment will be approved shortly once the SMS is received.</p>
                                        <button class="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-sm" onclick="finishOrder()">Got it</button>
                                    `;
                                    }
                                }
                            }, 2000);
                        }

                        // Make sure the modal is visible for direct buys
                        const modal = document.getElementById('payment-modal');
                        if (modal && modal.classList.contains('hidden')) {
                            modal.classList.remove('hidden');
                            modal.classList.add('flex');
                            const content = document.getElementById('payment-modal-content');
                            if (content) setTimeout(() => { content.classList.remove('translate-y-full'); }, 10);
                        }

                        goPayStep(3);
                        renderOrdersStats();
                        renderOrdersList();
                    } else {
                        alert("Failed to submit order: " + (data.error || "Unknown error"));
                    }
                }).catch(e => {
                    console.error("Order error:", e);
                    alert("Error while submitting order: " + e.message + "\nCheck if the server is running.");
                });
            }

            function openOrderDetails(type, orderId) {
                const order = window.appData.orders.find(o => o.id === orderId);
                if (!order) return;

                const modal = document.getElementById('order-details-modal');
                const content = document.getElementById('order-details-content');
                const body = document.getElementById('order-details-body');

                let detailsHtml = '';

                if (order.item === 'Add Balance') {
                    let mIcon = '<i class="fa-solid fa-building-columns"></i>';
                    let mBg = 'bg-gray-100 text-gray-600';
                    let mName = order.method || 'Unknown';
                    const mNameLower = mName.toLowerCase();
                    if (mNameLower.includes('bkash')) { mIcon = '<i class="fa-solid fa-b"></i>'; mBg = 'bg-pink-100 text-pink-600'; }
                    else if (mNameLower.includes('nagad')) { mIcon = '<i class="fa-solid fa-n"></i>'; mBg = 'bg-orange-100 text-orange-600'; }
                    else if (mNameLower.includes('rocket')) { mIcon = '<i class="fa-solid fa-rocket"></i>'; mBg = 'bg-purple-100 text-purple-600'; }
                    else if (mNameLower.includes('upay')) { mIcon = '<i class="fa-solid fa-u"></i>'; mBg = 'bg-blue-100 text-blue-600'; }

                    let statusBg = order.status === 'Approved' ? 'bg-green-50 border-green-100' : order.status === 'Pending' ? 'bg-orange-50 border-orange-100' : order.status === 'Rejected' ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100';
                    let statusText = order.status === 'Approved' ? 'text-green-800' : order.status === 'Pending' ? 'text-orange-800' : order.status === 'Rejected' ? 'text-red-800' : 'text-gray-800';
                    let statusSubText = order.status === 'Approved' ? 'text-green-600' : order.status === 'Pending' ? 'text-orange-600' : order.status === 'Rejected' ? 'text-red-600' : 'text-gray-600';
                    let statusIcon = order.status === 'Approved' ? 'fa-circle-check' : order.status === 'Pending' ? 'fa-clock' : order.status === 'Rejected' ? 'fa-xmark' : 'fa-circle-info';

                    let dateStr = new Date(order.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                    detailsHtml = `
                    <div class="${statusBg} p-5 rounded-2xl border mb-5 text-center relative overflow-hidden shadow-sm">
                        <div class="absolute -right-4 -top-4 opacity-5">
                            <i class="fa-solid fa-wallet text-8xl"></i>
                        </div>
                        <div class="w-14 h-14 bg-white rounded-full flex items-center justify-center text-2xl mx-auto mb-3 shadow-md border border-gray-100 relative z-10">
                            <i class="fa-solid fa-wallet text-indigo-600"></i>
                        </div>
                        <h4 class="font-extrabold ${statusText} text-lg mb-0.5 relative z-10"><i class="fa-solid ${statusIcon} mr-1"></i> Deposit ${order.status}</h4>
                        <p class="text-[11px] ${statusSubText} relative z-10 font-medium">Wallet balance top-up request</p>
                        <h2 class="text-3xl font-black text-gray-800 mt-4 relative z-10 tracking-tight">${formatCurrency(order.price)}</h2>
                    </div>
                    <div class="space-y-4">
                        <div>
                            <label class="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider pl-1 mb-1.5 block">Payment Method</label>
                            <div class="bg-white p-3.5 rounded-xl border border-gray-100 font-bold text-sm flex items-center gap-3 text-gray-800 text-left shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                                <div class="w-10 h-10 rounded-lg flex items-center justify-center ${mBg} shadow-sm border border-gray-50 text-lg">${mIcon}</div>
                                <span class="text-base">${mName}</span>
                            </div>
                        </div>
                        ${order.trxId ? `
                        <div>
                            <label class="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider pl-1 mb-1.5 block">Transaction ID</label>
                            <div class="bg-white p-3.5 rounded-xl border border-gray-100 font-mono text-sm flex justify-between items-center text-gray-800 break-all text-left shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                                <span class="font-bold text-indigo-600 text-base">${order.trxId}</span>
                                <button onclick="copyToClipboard('${order.trxId}')" class="w-9 h-9 bg-gray-50 border border-gray-200 text-blue-600 rounded-lg hover:bg-blue-100 transition ml-2 flex-shrink-0 flex items-center justify-center shadow-sm" title="Copy"><i class="fa-regular fa-copy"></i></button>
                            </div>
                        </div>` : ''}
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider pl-1 mb-1.5 block">Order ID</label>
                                <div class="bg-white p-3.5 rounded-xl border border-gray-100 text-sm text-gray-800 text-left font-mono font-bold shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] truncate flex items-center h-[52px]">
                                    #${order.id}
                                </div>
                            </div>
                            <div>
                                <label class="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider pl-1 mb-1.5 block">Date & Time</label>
                                <div class="bg-white p-3.5 rounded-xl border border-gray-100 text-[11px] text-gray-800 text-left font-bold shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex items-center h-[52px] leading-tight">
                                    ${dateStr}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                } else if (order.status === 'Completed' || order.status === 'Delivered' || order.status === 'Approved') {
                    detailsHtml = `
                    <div class="bg-green-50 p-4 rounded-xl border border-green-100 mb-3">
                        <h4 class="font-bold text-green-800 text-sm mb-1"><i class="fa-solid fa-circle-check mr-1"></i> Order Approved</h4>
                        <p class="text-[10px] text-green-600">Your ${order.item} is ready.</p>
                    </div>`;

                    const orderStocks = (window.appData.stocks || []).filter(s => s.orderId === orderId);

                    if (orderStocks.length > 0) {
                        const isMail = order.category === 'mail' || order.externalType === 'mail';
                        detailsHtml += `<div class="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-3 flex justify-between items-center">
                            <div>
                                <h4 class="font-bold text-blue-800 text-sm mb-1"><i class="fa-solid fa-boxes-stacked mr-1"></i> ${isMail ? 'Mail Accounts' : 'Account Details'}</h4>
                                <p class="text-[10px] text-blue-600">${orderStocks.length} account(s) allocated</p>
                            </div>
                            ${isMail ? `<div class="flex gap-2">
                                <button onclick="downloadMailTXT('${order.id}')" class="bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition shadow-sm"><i class="fa-solid fa-download mr-1"></i> TXT</button>
                                <button onclick="addMailsToInbox('${order.id}')" class="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-sm"><i class="fa-solid fa-envelope-open mr-1"></i> Inbox</button>
                            </div>` : ''}
                        </div>`;

                        detailsHtml += `<div class="space-y-3 max-h-64 overflow-y-auto pr-1">`;
                        orderStocks.forEach((stock, idx) => {
                            // Reconstruct the raw line as it was added
                            let stockDataStr = '';
                            if (stock.securityKey && stock.securityKey.includes('|')) {
                                stockDataStr = [stock.email, stock.password, stock.securityKey].filter(Boolean).join('|');
                            } else if (stock.password) {
                                stockDataStr = [stock.email, stock.password, stock.securityKey].filter(Boolean).join(':');
                            } else {
                                stockDataStr = stock.email || '';
                            }

                            const isProxy = (order.category && order.category.toLowerCase() === 'proxy') || (order.productName && order.productName.toLowerCase().includes('proxy'));

                            detailsHtml += `
                            <div class="mb-4 last:mb-0 border border-gray-200 rounded-xl p-3 bg-white shadow-sm">
                                <div class="flex flex-col gap-2">`;

                            // Only split into separate boxes if it has standard delimiters and they didn't just paste a raw string
                            if (stock.password) {
                                let label1 = isProxy ? 'IP / Host' : 'Username / Email';
                                let label2 = isProxy ? 'Port / Pass' : 'Password';

                                detailsHtml += `
                                    <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-sm flex justify-between items-center text-gray-800 text-left">
                                        <div class="flex-1 truncate"><span class="text-[11px] text-gray-400 font-sans font-bold uppercase tracking-wide mr-2">${label1}:</span> <span class="font-semibold text-gray-700">${stock.email || 'N/A'}</span></div>
                                        <button onclick="copyToClipboard('${(stock.email || '').replace(/'/g, "'")}')" class="text-blue-500 hover:text-blue-700 ml-2 flex-shrink-0 bg-white w-8 h-8 rounded-lg shadow-sm border border-gray-200 flex items-center justify-center text-sm" title="Copy"><i class="fa-regular fa-copy"></i></button>
                                    </div>
                                    <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-sm flex justify-between items-center text-gray-800 text-left">
                                        <div class="flex-1 truncate"><span class="text-[11px] text-gray-400 font-sans font-bold uppercase tracking-wide mr-2">${label2}:</span> <span class="font-semibold text-gray-700">${stock.password}</span></div>
                                        <button onclick="copyToClipboard('${(stock.password || '').replace(/'/g, "'")}')" class="text-blue-500 hover:text-blue-700 ml-2 flex-shrink-0 bg-white w-8 h-8 rounded-lg shadow-sm border border-gray-200 flex items-center justify-center text-sm" title="Copy"><i class="fa-regular fa-copy"></i></button>
                                    </div>`;

                                if (stock.securityKey) {
                                    let label3 = isProxy ? 'Proxy User/Pass' : 'Security Key';
                                    detailsHtml += `
                                    <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-sm flex justify-between items-center text-gray-800 text-left">
                                        <div class="flex-1 truncate"><span class="text-[11px] text-gray-400 font-sans font-bold uppercase tracking-wide mr-2">${label3}:</span> <span class="font-semibold text-gray-700">${stock.securityKey}</span></div>
                                        <button onclick="copyToClipboard('${(stock.securityKey || '').replace(/'/g, "'")}')" class="text-blue-500 hover:text-blue-700 ml-2 flex-shrink-0 bg-white w-8 h-8 rounded-lg shadow-sm border border-gray-200 flex items-center justify-center text-sm" title="Copy"><i class="fa-regular fa-copy"></i></button>
                                    </div>`;
                                }
                            }

                            // Always show the exact raw format at the bottom
                            detailsHtml += `
                                    <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono flex flex-col gap-2 text-gray-800 break-all text-left">
                                        <div class="text-[11px] text-gray-400 font-sans font-bold uppercase tracking-wide">Exact Format (As Added):</div>
                                        <div class="flex justify-between items-end gap-2">
                                            <div class="flex-1 text-xs leading-relaxed font-medium text-gray-800">${stockDataStr}</div>
                                            <button onclick="copyToClipboard('${stockDataStr.replace(/'/g, "'")}')" class="text-blue-500 hover:text-blue-700 flex-shrink-0 bg-white w-8 h-8 rounded-lg shadow-sm border border-gray-200 flex items-center justify-center text-sm" title="Copy Exact Data"><i class="fa-regular fa-copy"></i></button>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                        });
                        detailsHtml += `</div>`;
                    } else if (order.deliveryEmail || order.deliveryPass || order.deliverySecurityKey) {
                        let parsedFields = [];
                        if (order.deliveryEmail && order.deliveryEmail.includes(' | ') && order.deliveryEmail.includes(': ')) {
                            const parts = order.deliveryEmail.split(' | ');
                            parts.forEach(part => {
                                const splitIndex = part.indexOf(': ');
                                if (splitIndex !== -1) {
                                    parsedFields.push({ key: part.substring(0, splitIndex).trim(), val: part.substring(splitIndex + 2).trim() });
                                } else {
                                    parsedFields.push({ key: 'Info', val: part.trim() });
                                }
                            });
                        } else if (order.deliveryEmail && !order.deliveryPass && order.deliveryEmail.includes(':') && !order.deliveryEmail.includes(' ')) {
                            const isProxy = (order.category && order.category.toLowerCase() === 'proxy') || (order.productName && order.productName.toLowerCase().includes('proxy'));
                            const parts = order.deliveryEmail.split(':');
                            const labels = isProxy ? ['IP / Host', 'Port', 'Username', 'Password', 'Extra 1', 'Extra 2'] : ['Email / Username', 'Password', 'Token', 'Extra 1', 'Extra 2', 'Extra 3'];
                            parts.forEach((part, idx) => {
                                if (part.trim()) parsedFields.push({ key: labels[idx] || `Extra ${idx - 2}`, val: part.trim() });
                            });
                            // Provide full raw copy
                            parsedFields.push({ key: 'Exact Format (As Added)', val: order.deliveryEmail });
                        } else {
                            if (order.deliveryEmail) parsedFields.push({ key: 'Email / Username / Data', val: order.deliveryEmail });
                            if (order.deliveryPass) parsedFields.push({ key: 'Password', val: order.deliveryPass });
                            if (order.deliverySecurityKey) parsedFields.push({ key: 'Security Code / 2FA', val: order.deliverySecurityKey });

                            // Provide full combined token for easy copying
                            const fullData = [order.deliveryEmail, order.deliveryPass, order.deliverySecurityKey].filter(Boolean).join(':');
                            if (fullData) {
                                parsedFields.push({ key: 'Exact Format (As Added)', val: fullData });
                            }
                        }

                        detailsHtml += `<div class="space-y-3">`;
                        parsedFields.forEach(field => {
                            let displayKey = field.key.replace(/_/g, ' ').toUpperCase();
                            detailsHtml += `
                       <div>
                           <label class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">${displayKey}</label>
                           <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 font-mono text-sm flex justify-between items-center text-gray-800 break-all text-left">
                               <span>${field.val}</span>
                               <button onclick="copyToClipboard('${field.val}')" class="text-blue-500 hover:text-blue-700 ml-2 flex-shrink-0" title="Copy"><i class="fa-regular fa-copy"></i></button>
                           </div>
                       </div>`;
                        });
                        detailsHtml += `</div>`;

                        if (order.category === 'vpn' || (order.item && order.item.toLowerCase().includes('vpn'))) {
                            detailsHtml += `
                        <div class="mt-4 bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm relative overflow-hidden">
                            <div class="absolute -right-2 -bottom-2 text-amber-500 opacity-10 text-5xl">
                                <i class="fa-solid fa-lightbulb"></i>
                            </div>
                            <h4 class="font-bold text-amber-800 text-sm mb-1 flex items-center gap-2">
                                <i class="fa-solid fa-triangle-exclamation"></i> Important Login Tip
                            </h4>
                            <p class="text-xs text-amber-700 font-medium leading-relaxed mt-1.5 relative z-10">
                                অনুগ্রহ করে অফিসিয়াল অ্যাপ থেকে Login করুন। কোনোভাবেই পাসওয়ার্ড পরিবর্তন করার চেষ্টা করবেন না, অন্যথায় আপনার ওয়ারেন্টি বাতিল হয়ে যাবে!
                            </p>
                        </div>
                        `;
                        }

                    } else if (order.method === 'Wallet' && order.item.includes('Balance')) {
                        detailsHtml += `<p class="text-center text-gray-500 text-sm py-4">Balance was added to your wallet successfully.</p>`;
                    } else if (order.externalType === 'number') {
                        detailsHtml += `
                   <div class="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-3 text-center">
                        <h4 class="font-bold text-indigo-800 text-sm mb-1"><i class="fa-solid fa-check-double mr-1"></i> Activation Completed</h4>
                        <p class="text-xs text-indigo-600 mt-2">This number activation has been completed and finalized.</p>
                   </div>
                   `;
                    } else {
                        detailsHtml += `<p class="text-center text-gray-500 text-sm py-4">Details are not available for this completed order.</p>`;
                    }
                } else if (order.status === 'Rejected' || order.status === 'Cancelled') {
                    detailsHtml = `
                    <div class="bg-red-50 p-4 rounded-xl border border-red-100 mb-2">
                        <h4 class="font-bold text-red-800 text-sm mb-1"><i class="fa-solid fa-xmark mr-1"></i> Order ${order.status}</h4>
                        <p class="text-[10px] text-red-600">Unfortunately, this order was rejected or cancelled.</p>
                    </div>`;
                } else if (order.externalType === 'number' || order.externalType === 'local') {
                    // Pending OTP / OTP Received handling for numbers
                    const phoneStr = order.number || 'Waiting for number';
                    const hasOTP = !!order.otp;

                    detailsHtml = `
                    <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-3">
                        <h4 class="font-bold text-blue-800 text-sm mb-1"><i class="fa-solid fa-phone mr-1"></i> Virtual Number</h4>
                        <div class="bg-white p-3 rounded-lg border border-blue-100 font-mono text-center text-lg text-blue-900 font-bold tracking-widest mt-2 flex items-center justify-between">
                            <span id="copy-number-${order.id}">${phoneStr}</span>
                            <button onclick="copyToClipboard('${phoneStr}')" class="text-blue-500 hover:text-blue-700"><i class="fa-regular fa-copy"></i></button>
                        </div>
                    </div>
                `;

                    if (hasOTP) {
                        detailsHtml += `
                    <div class="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-3 text-center">
                        <h4 class="font-bold text-indigo-800 text-sm mb-1"><i class="fa-solid fa-message mr-1"></i> OTP Received</h4>
                        <p class="text-xl font-bold text-indigo-600 font-mono tracking-widest my-2 select-all">${order.otp}</p>
                    </div>
                    <button class="w-full bg-green-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-green-700 transition shadow-sm" onclick="completeExternalOrder('${order.id}', '${order.externalOrderId}')">
                        <i class="fa-solid fa-check-double mr-1"></i> Complete Activation
                    </button>
                    <p class="text-[10px] text-center text-gray-500 mt-2">Activation cannot be cancelled anymore as OTP has been received.</p>
                    `;
                    } else {
                        detailsHtml += `
                    <div id="otp-result-${order.id}" class="text-sm font-mono text-center text-gray-700 bg-gray-50 p-2 rounded hidden mb-3 border border-gray-200"></div>
                    <div id="otp-actions-${order.id}" class="flex gap-2">
                        <button id="btn-getotp-${order.id}" class="flex-1 bg-green-600 text-white font-bold py-2 rounded-xl text-sm hover:bg-green-700 transition shadow-sm" onclick="getOTP('${order.id}', '${order.externalOrderId}')"><i class="fa-solid fa-message mr-1"></i> Get OTP</button>
                        <button id="btn-cancelotp-${order.id}" class="flex-1 bg-red-600 text-white font-bold py-2 rounded-xl text-sm hover:bg-red-700 transition shadow-sm" onclick="cancelExternalOrder('${order.id}', '${order.externalOrderId}', ${order.price})"><i class="fa-solid fa-ban mr-1"></i> Cancel</button>
                    </div>
                    <button id="btn-completeotp-${order.id}" class="hidden w-full bg-green-600 text-white font-bold py-3 rounded-xl text-sm hover:bg-green-700 transition shadow-sm" onclick="completeExternalOrder('${order.id}', '${order.externalOrderId}')">
                        <i class="fa-solid fa-check-double mr-1"></i> Complete Activation
                    </button>
                    `;
                    }
                } else {
                    detailsHtml = `
                    <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-2">
                        <h4 class="font-bold text-blue-800 text-sm mb-1"><i class="fa-solid fa-arrows-rotate fa-spin mr-1"></i> Processing</h4>
                        <p class="text-[10px] text-blue-600">Your order is being processed. Please wait patiently.</p>
                    </div>`;
                }

                body.innerHTML = detailsHtml;
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                setTimeout(() => { content.classList.remove('translate-y-full'); }, 10);

            }

            function closeOrderDetails() {
                const modal = document.getElementById('order-details-modal');
                const content = document.getElementById('order-details-content');
                content.classList.add('translate-y-full');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }, 300);
            }

            function downloadMailTXT(orderId) {
                const order = window.appData.orders.find(o => String(o.id) === String(orderId));
                if (!order) return;
                const orderStocks = (window.appData.stocks || []).filter(s => String(s.orderId) === String(orderId));
                if (!orderStocks.length) {
                    showToast("No accounts to download.", "error");
                    return;
                }

                let txtContent = orderStocks.map(s => [s.email, s.password, s.securityKey].filter(Boolean).join(':')).join('\n');
                const blob = new Blob([txtContent], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Mails_${orderId}_${new Date().getTime()}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                showToast("Downloaded TXT! Content also copied to clipboard.");
                try { navigator.clipboard.writeText(txtContent); } catch (e) { }
            }

            async function addMailsToInbox(orderId) {
                let btn = null;
                let origHTML = '';
                if (window.event && window.event.currentTarget) {
                    btn = window.event.currentTarget;
                } else if (window.event && window.event.srcElement) {
                    btn = window.event.srcElement;
                    if (btn.tagName !== 'BUTTON') btn = btn.closest('button');
                }
                if (btn) {
                    origHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Adding...';
                    btn.disabled = true;
                }

                const order = window.appData.orders.find(o => o.id === orderId);
                if (!order) {
                    if (btn) { btn.innerHTML = origHTML; btn.disabled = false; }
                    return;
                }
                const orderStocks = (window.appData.stocks || []).filter(s => s.orderId === orderId);
                if (!orderStocks.length) {
                    showToast("No accounts to add.", "error");
                    if (btn) { btn.innerHTML = origHTML; btn.disabled = false; }
                    return;
                }

                showToast("Adding accounts to inbox...", "info");

                let successCount = 0;
                let failCount = 0;
                let addedEmails = [];

                for (let stock of orderStocks) {
                    try {
                        let email = stock.email || '';
                        let pass = stock.password || '';
                        let client = '';
                        let refresh = '';

                        if (stock.securityKey) {
                            const secParts = stock.securityKey.split('|');
                            let p1 = (secParts[0] || '').trim();
                            let p2 = (secParts[1] || '').trim();

                            if (p1.length === 36 && p2.length > 50) {
                                client = p1;
                                refresh = p2;
                            } else if (p2.length === 36 && p1.length > 50) {
                                client = p2;
                                refresh = p1;
                            } else {
                                refresh = p1;
                                client = p2;
                            }
                        }
                        if (email.includes(':')) {
                            const ep = email.split(':');
                            email = ep[0];
                            if (pass && pass.length > 30) {
                                refresh = pass;
                                if (stock.securityKey) client = stock.securityKey.split('|')[0];
                            }
                        }

                        // Fallbacks if password contains tokens (some sellers put everything in password)
                        if (!refresh && pass.includes('|')) {
                            const p2 = pass.split('|');
                            pass = p2[0];
                            let t1 = (p2[1] || '').trim();
                            let t2 = (p2[2] || '').trim();
                            if (t1.length === 36 && t2.length > 50) { client = t1; refresh = t2; }
                            else if (t2.length === 36 && t1.length > 50) { client = t2; refresh = t1; }
                            else { refresh = t1; client = t2; }
                        }
                        if (!refresh && pass.includes(':')) {
                            const p3 = pass.split(':');
                            pass = p3[0];
                            let t1 = (p3[1] || '').trim();
                            let t2 = (p3[2] || '').trim();
                            if (t1.length === 36 && t2.length > 50) { client = t1; refresh = t2; }
                            else if (t2.length === 36 && t1.length > 50) { client = t2; refresh = t1; }
                            else { refresh = t1; client = t2; }
                        }

                        if (!client) {
                            client = 'd3590ed6-52b3-4102-aeff-aad2292ab01c'; // Default MS App Client ID
                        }

                        if (!email || !refresh) {
                            failCount++;
                            continue;
                        }

                        const res = await fetch('/api/mail/inbox', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('tg_token') || '') },
                            body: JSON.stringify({ emailAddress: email, clientId: client, refreshToken: refresh })
                        });

                        if (res.ok) {
                            successCount++;
                            addedEmails.push(email);
                        } else {
                            failCount++;
                        }
                    } catch (e) {
                        failCount++;
                    }
                }

                if (btn) {
                    btn.innerHTML = origHTML;
                    btn.disabled = false;
                }

                if (successCount > 0) {
                    let msg = addedEmails.length === 1 ? `Added ${addedEmails[0]} to Inbox!` : `Added ${successCount} accounts to Inbox! (${addedEmails.slice(0, 2).join(', ')}${addedEmails.length > 2 ? '...' : ''})`;
                    showToast(msg, "success");
                    setTimeout(() => {
                        closeOrderDetails();
                        readOrderInInbox(orderId);
                    }, 1500);
                } else {
                    showToast("Failed to add accounts to Inbox.", "error");
                }
            }

            async function getOTP(internalOrderId, externalOrderId) {
                const btnGet = document.getElementById(`btn-getotp-${internalOrderId}`);
                const btnCancel = document.getElementById(`btn-cancelotp-${internalOrderId}`);
                const btnComplete = document.getElementById(`btn-completeotp-${internalOrderId}`);
                const resultDiv = document.getElementById(`otp-result-${internalOrderId}`);

                if (btnGet) {
                    btnGet.disabled = true;
                    btnGet.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Checking...';
                }

                try {
                    const token = localStorage.getItem('tg_token');
                    const res = await fetch('/api/get-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({ orderId: externalOrderId })
                    });
                    const data = await res.json();

                    if (data.success && data.otp) {
                        if (resultDiv) {
                            resultDiv.innerHTML = `<span class="text-green-600 font-bold"><i class="fa-solid fa-check"></i> OTP Received: ${data.otp}</span>`;
                            resultDiv.classList.remove('hidden');
                        }

                        // Modify UI to reflect OTP received
                        if (document.getElementById(`otp-actions-${internalOrderId}`)) {
                            document.getElementById(`otp-actions-${internalOrderId}`).classList.add('hidden');
                        }
                        if (btnComplete) {
                            btnComplete.classList.remove('hidden');
                        }

                        // Update local appData cache to prevent issues if they close modal
                        const orderIdx = window.appData.orders.findIndex(o => o.id === internalOrderId);
                        if (orderIdx !== -1) {
                            window.appData.orders[orderIdx].otp = data.otp;
                            window.appData.orders[orderIdx].status = 'OTP Received';
                        }
                        fetchAppData(); // Silent refresh
                    } else if (data.success && data.status === 'WAITING') {
                        if (resultDiv) {
                            resultDiv.innerHTML = `<span class="text-blue-600"><i class="fa-solid fa-clock"></i> Waiting for SMS...</span>`;
                            resultDiv.classList.remove('hidden');
                        }
                        if (btnGet) {
                            btnGet.disabled = false;
                            btnGet.innerHTML = '<i class="fa-solid fa-message mr-1"></i> Get OTP';
                        }
                    } else if (data.success && data.status) {
                        if (resultDiv) {
                            resultDiv.innerHTML = `<span class="text-amber-500"><i class="fa-solid fa-info-circle"></i> ${data.status}</span>`;
                            resultDiv.classList.remove('hidden');
                        }
                        if (btnGet) {
                            btnGet.disabled = false;
                            btnGet.innerHTML = '<i class="fa-solid fa-message mr-1"></i> Get OTP';
                        }
                    } else {
                        if (resultDiv) {
                            resultDiv.innerHTML = `<span class="text-red-500"><i class="fa-solid fa-xmark"></i> ${data.error || 'Failed'}</span>`;
                            resultDiv.classList.remove('hidden');
                        }
                        if (btnGet) {
                            btnGet.disabled = false;
                            btnGet.innerHTML = '<i class="fa-solid fa-message mr-1"></i> Get OTP';
                        }
                    }
                } catch (e) {
                    if (resultDiv) {
                        resultDiv.innerHTML = `<span class="text-red-500"><i class="fa-solid fa-triangle-exclamation"></i> Network error</span>`;
                        resultDiv.classList.remove('hidden');
                    }
                    if (btnGet) {
                        btnGet.disabled = false;
                        btnGet.innerHTML = '<i class="fa-solid fa-message mr-1"></i> Get OTP';
                    }
                }
            }

            async function cancelExternalOrder(internalOrderId, externalOrderId, price) {
                if (!confirm('Are you sure you want to cancel this activation? You will be refunded if successful.')) return;

                const btnCancel = document.getElementById(`btn-cancelotp-${internalOrderId}`);
                if (btnCancel) {
                    btnCancel.disabled = true;
                    btnCancel.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Cancelling...';
                }

                try {
                    const token = localStorage.getItem('tg_token');
                    const res = await fetch('/api/cancel-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({ orderId: externalOrderId, internalOrderId, price })
                    });
                    const data = await res.json();

                    if (data.success) {
                        alert('Order cancelled successfully. Balance refunded.');
                        closeOrderDetails();
                        fetchAppData(); // refresh history
                    } else {
                        alert('Failed to cancel: ' + (data.error || 'Unknown error'));
                        if (btnCancel) {
                            btnCancel.disabled = false;
                            btnCancel.innerHTML = '<i class="fa-solid fa-ban mr-1"></i> Cancel';
                        }
                    }
                } catch (e) {
                    alert('Network error while cancelling');
                    if (btnCancel) {
                        btnCancel.disabled = false;
                        btnCancel.innerHTML = '<i class="fa-solid fa-ban mr-1"></i> Cancel';
                    }
                }
            }

            async function completeExternalOrder(internalOrderId, externalOrderId) {
                if (!confirm('Did you finish using this number? This will finalize the order and remove it from active lists.')) return;

                const btnComplete = document.getElementById(`btn-completeotp-${internalOrderId}`);
                if (btnComplete) {
                    btnComplete.disabled = true;
                    btnComplete.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Completing...';
                }

                try {
                    const token = localStorage.getItem('tg_token');
                    const res = await fetch('/api/complete-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({ orderId: externalOrderId, internalOrderId })
                    });
                    const data = await res.json();

                    if (data.success) {
                        alert('Activation completed!');
                        closeOrderDetails();
                        fetchAppData(); // refresh history
                    } else {
                        alert('Failed to complete: ' + (data.error || 'Unknown error'));
                        if (btnComplete) {
                            btnComplete.disabled = false;
                            btnComplete.innerHTML = '<i class="fa-solid fa-check-double mr-1"></i> Complete Activation';
                        }
                    }
                } catch (e) {
                    alert('Network error while completing');
                    if (btnComplete) {
                        btnComplete.disabled = false;
                        btnComplete.innerHTML = '<i class="fa-solid fa-check-double mr-1"></i> Complete Activation';
                    }
                }
            }

            // --- DYNAMIC ORDERS RENDER ---
            window.currentOrderFilter = 'All';

            function filterOrders(status, btn) {
                window.currentOrderFilter = status;

                const container = btn.parentElement;
                const buttons = container.querySelectorAll('button');
                buttons.forEach(b => {
                    b.className = "flex-shrink-0 flex items-center gap-2 bg-white text-gray-600 border border-gray-100 px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:bg-gray-50";
                    const span = b.querySelector('span');
                    if (span) span.className = "bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-md font-bold";
                });

                btn.className = "flex-shrink-0 flex items-center gap-2 bg-indigo-500 text-white border-transparent px-4 py-2 rounded-xl text-sm font-semibold shadow-md shadow-indigo-200";
                const span = btn.querySelector('span');
                if (span) span.className = "bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold";

                renderOrdersList();
            }

            function renderOrdersStats() {
                const orders = window.appData.orders || [];
                const completed = orders.filter(o => o.status === 'Completed' || o.status === 'Delivered').length;
                const pending = orders.filter(o => o.status === 'Pending').length;
                const processing = orders.filter(o => o.status === 'Processing').length;
                const cancelled = orders.filter(o => o.status === 'Cancelled').length;

                const ordersView = document.getElementById('orders-view');
                if (!ordersView) return;

                // The tabs
                const tabs = ordersView.querySelectorAll('section')[0].querySelectorAll('button span');
                if (tabs.length >= 4) {
                    tabs[0].innerText = completed;
                    tabs[1].innerText = pending;
                    tabs[2].innerText = processing;
                    tabs[3].innerText = cancelled;
                }
            }

            function renderOrdersList() {
                let orders = (window.appData.orders || []).filter(o => o.category !== 'number' && o.externalType !== 'number');
                if (window.currentOrderFilter !== 'All') {
                    if (window.currentOrderFilter === 'Completed') {
                        orders = orders.filter(o => o.status === 'Completed' || o.status === 'Delivered');
                    } else {
                        orders = orders.filter(o => o.status === window.currentOrderFilter);
                    }
                }

                const ordersContainer = document.getElementById('orders-list-container');
                if (!ordersContainer) return;

                if (orders.length > 0) {
                    let htmlStr = '<div id="orders-list-container" class="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 flex flex-col">';

                    orders.forEach(o => {
                        // Fix date - use o.date (from DB) or o.timestamp as fallback
                        const rawDate = o.date || o.timestamp || o.createdAt;
                        let dateStr = 'N/A';
                        if (rawDate) {
                            const dateObj = new Date(rawDate);
                            if (!isNaN(dateObj.getTime())) {
                                dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' &bull; ' + dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                            }
                        }

                        let p = window.appData?.products?.find(prod => prod.name === o.item) || {};
                        if (!p.id && window.appData?.products) {
                            p = window.appData.products.find(prod => (o.item || '').toLowerCase().startsWith(prod.name.toLowerCase()) || (o.item || '').toLowerCase().includes(prod.name.toLowerCase())) || {};
                        }

                        let itemLower = (o.item || '').toLowerCase();

                        let bgClass = p.bgClass || 'bg-blue-600';
                        let iconHtml = p.logoUrl
                            ? `<img src="${p.logoUrl}" class="w-full h-full object-cover rounded-full bg-white p-1">`
                            : `<i class="${p.iconClass || 'fa-solid fa-box'}"></i>`;

                        if (p.isExternal || !p.id) {
                            if (itemLower.includes('mail') || itemLower.includes('gmail') || itemLower.includes('hotmail') || itemLower.includes('outlook')) {
                                iconHtml = '<i class="fa-solid fa-envelope"></i>';
                                bgClass = 'bg-orange-500';
                            } else if (itemLower.includes('number') || (p.category === 'number')) {
                                iconHtml = '<i class="fa-solid fa-phone"></i>';
                                bgClass = 'bg-emerald-500';
                            } else if (itemLower.includes('proxy') || (p.category === 'proxy')) {
                                iconHtml = '<i class="fa-solid fa-globe"></i>';
                                bgClass = 'bg-indigo-500';
                            }
                        }

                        let type = p.category || 'vpn';
                        let textColor = p.logoUrl ? '' : 'text-white';

                        if (itemLower.includes('express')) type = 'vpn';
                        else if (itemLower.includes('nord')) type = 'vpn';
                        else if (itemLower.includes('hma')) type = 'vpn';
                        else if (itemLower.includes('proxy')) type = 'proxy';
                        else if (itemLower.includes('mail')) type = 'mail';
                        else if (itemLower.includes('number')) type = 'number';
                        else if (itemLower.includes('balance') || itemLower.includes('deposit')) {
                            bgClass = 'bg-green-600'; iconHtml = '<i class="fa-solid fa-wallet"></i>'; type = 'deposit'; textColor = 'text-white';
                        }

                        const statusColor = (o.status === 'Completed' || o.status === 'Delivered') ? 'green' : o.status === 'Processing' ? 'blue' : o.status === 'Rejected' ? 'red' : 'orange';
                        const statusIcon = (o.status === 'Completed' || o.status === 'Delivered') ? 'fa-circle-check' : o.status === 'Processing' ? 'fa-arrows-rotate' : o.status === 'Rejected' ? 'fa-xmark' : 'fa-clock';

                        // Method badge
                        const isWallet = (o.method === 'Wallet');
                        const methodBadge = isWallet ? `<span class="text-[9px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-bold"><i class="fa-solid fa-wallet mr-0.5"></i>Wallet</span>` : '';

                        // Delivery info badge
                        let deliveryBadge = '';
                        if ((o.status === 'Completed' || o.status === 'Delivered') && o.deliveryEmail) {
                            deliveryBadge = `<span class="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold ml-1"><i class="fa-solid fa-circle-check mr-0.5"></i>Delivered</span>`;
                        }

                        htmlStr += `
                    <div onclick="openOrderDetails('${type}', '${o.id}')" class="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0 rounded-2xl">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 md:w-12 md:h-12 ${bgClass} ${textColor} rounded-full flex items-center justify-center text-sm md:text-base font-bold shadow-sm flex-shrink-0">
                                ${iconHtml}
                            </div>
                            <div>
                                <h4 class="text-sm font-bold text-gray-800">${o.item}</h4>
                                <p class="text-[10px] text-gray-500 truncate mt-0.5 flex items-center gap-1">Order #${o.id} ${methodBadge}${deliveryBadge}</p>
                                <p class="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><i class="fa-regular fa-calendar"></i> ${dateStr}</p>
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-2">
                            <span class="bg-${statusColor}-50 text-${statusColor}-600 px-2 py-1 rounded-full text-[9px] font-bold flex items-center gap-1 border border-${statusColor}-100">
                                <i class="fa-solid ${statusIcon}"></i> ${o.status}
                            </span>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="font-bold text-gray-800 text-sm">${formatCurrency(o.price)}</span>
                                <i class="fa-solid fa-chevron-right text-gray-300 text-[10px]"></i>
                            </div>
                        </div>
                    </div>`;
                    });
                    htmlStr += '</div>';

                    ordersContainer.outerHTML = htmlStr;
                } else {
                    ordersContainer.innerHTML = '<div class="text-center py-10 text-gray-400 font-medium">No orders found.</div>';
                }
            }

            // --- DYNAMIC POPULAR PRODUCTS ---
            function renderPopularProducts() {
                let products = window.appData.products;

                // Only filter out explicitly hidden or unavailable products
                products = products.filter(p => !p.isHidden && p.isAvailable !== false);

                const homeContainer = document.getElementById('home-popular-products-container');
                const allContainer = document.getElementById('all-popular-products-container');

                if (homeContainer) homeContainer.innerHTML = '';
                if (allContainer) allContainer.innerHTML = '';

                products.forEach((p, index) => {

                    // Calculate plan name and price
                    let planName = '';
                    let planPrice = 0;
                    if (p.plans && p.plans.length > 0) {
                        planName = p.plans[0].name;
                        planPrice = p.plans[0].price;
                    } else if (p.category === 'proxy') {
                        planName = 'Per GB';
                        planPrice = p.pricePerGb || 0;
                    } else if (p.price !== undefined) {
                        planPrice = p.price;
                        planName = typeof p.stock === 'number' ? `${p.stock} pcs available` : 'In Stock';
                    }

                    // Determine styling and icon for mails
                    let iconClass = p.iconClass || 'fa-solid fa-box';
                    let bgClass = p.bgClass || 'bg-slate-800';
                    if (p.category === 'mail') {
                        const nameLower = p.name.toLowerCase();
                        if (nameLower.includes('outlook') || nameLower.includes('hotmail')) {
                            iconClass = 'fa-brands fa-microsoft';
                            bgClass = 'bg-blue-600';
                        } else if (nameLower.includes('yahoo')) {
                            iconClass = 'fa-brands fa-yahoo';
                            bgClass = 'bg-purple-600';
                        } else if (nameLower.includes('gmail')) {
                            iconClass = 'fa-brands fa-google';
                            bgClass = 'bg-red-500';
                        } else {
                            iconClass = 'fa-solid fa-envelope';
                            bgClass = 'bg-orange-500';
                        }
                    }

                    let logoHtml = '';
                    if (p.logoUrl) {
                        logoHtml = `<img src="${p.logoUrl}" class="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover bg-black mb-2 shadow-sm" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIHZpZXdCb3g9IjAgMCA0OCA0OCI+PHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjMDAwIi8+PHRleHQgeD0iMjQiIHk9IjMwIiBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Vk48L3RleHQ+PC9zdmc+'">`;
                    } else {
                        logoHtml = `<div class="w-12 h-12 md:w-14 md:h-14 ${bgClass} text-white rounded-full flex items-center justify-center text-xl font-bold mb-2 shadow-sm"><i class="${iconClass}"></i></div>`;
                    }

                    // Color mapping for buttons based on category or index
                    const btnColors = ['bg-blue-600', 'bg-green-500', 'bg-purple-600', 'bg-orange-500', 'bg-red-500'];
                    const btnBg = btnColors[index % btnColors.length];

                    const cardHtml = `
                    <div onclick="openVPNPackages('${p.id}')" class="cursor-pointer hover:shadow-md transition ${homeContainer ? 'min-w-[130px] md:min-w-[150px]' : 'w-full'} h-fit bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm relative">
                        ${index < 3 ? `<span class="absolute top-0 right-0 bg-green-100 text-green-700 text-[9px] md:text-[10px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-xl">Popular</span>` : ''}
                        ${logoHtml}
                        <h4 class="text-xs md:text-sm font-bold text-gray-800">${p.name}</h4>
                        <p class="text-[10px] md:text-xs text-gray-500 truncate mb-1">${planName}</p>
                        <p class="text-sm md:text-base font-bold ${btnBg.replace('bg-', 'text-')} mb-3">${formatCurrency(planPrice)}</p>
                        <button onclick="event.stopPropagation(); directBuy('${p.id}')" class="w-full ${btnBg} text-white text-xs md:text-sm font-semibold py-1.5 md:py-2 rounded-lg flex items-center justify-center gap-1 hover:opacity-90 transition-all">
                            <i class="fa-solid fa-cart-shopping"></i> Buy Now
                        </button>
                    </div>
                `;

                    if (homeContainer) homeContainer.innerHTML += cardHtml;
                    if (allContainer) allContainer.innerHTML += cardHtml;
                });
            }

            function directBuy(productId) {
                let products = window.appData.products;
                const product = products.find(p => p.id === productId);
                if (!product) return;

                currentVPN = product;

                if (product.category === 'proxy') {
                    openVPNPackages(productId);
                } else if (product.plans && product.plans.length === 1) {
                    startPayment(product.plans[0]);
                } else if (product.plans && product.plans.length > 1) {
                    openVPNPackages(productId);
                } else if (!product.plans || product.plans.length === 0) {
                    let finalPrice = product.price || 0;
                    let isExt = product.isExternal;
                    let extType = product.externalType;
                    let extId = product.externalId;

                    if (product.category === 'mail' || (product.category || '').toLowerCase().includes('mail')) {
                        const margin = window.appData?.settings?.mailApiMargin ?? 0.50;
                        finalPrice = parseFloat((finalPrice + margin).toFixed(2));
                        isExt = true;
                        extType = 'mail';
                        extId = product._id || product.id;
                    }

                    startPayment({
                        id: 'default',
                        name: product.name,
                        price: finalPrice,
                        isExternal: isExt,
                        externalType: extType,
                        externalId: extId
                    });
                }
            }

            // Render orders initially on load
            document.addEventListener('DOMContentLoaded', () => {
                renderOrdersList();
                renderPopularProducts();

            });


            // --- ADD BALANCE LOGIC ---
            function toggleBalanceVisibility() {
                const el = document.getElementById('current-balance-display');
                const icon = document.getElementById('current-balance-icon');
                if (el.dataset.hidden === 'true') {
                    el.innerText = formatCurrency(el.dataset.balance || window.appData?.user?.balance || 0);
                    el.dataset.hidden = 'false';
                    icon.className = 'fa-regular fa-eye text-indigo-200 cursor-pointer text-lg';
                } else {
                    if (!el.dataset.balance) {
                        el.dataset.balance = window.appData?.user?.balance || 0;
                    }
                    el.innerText = window.userCurrency === 'USDT' ? '$ *****' : '৳ *****';
                    el.dataset.hidden = 'true';
                    icon.className = 'fa-regular fa-eye-slash text-indigo-200 cursor-pointer text-lg';
                }
            }

            function setAddBalance(amount, btnEl) {
                document.getElementById('add-balance-input').value = amount;

                // Update active state of buttons
                document.querySelectorAll('.quick-amt-btn').forEach(btn => {
                    btn.className = "quick-amt-btn flex-shrink-0 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm";
                    btn.innerHTML = btn.innerText; // remove icon
                });

                if (btnEl) {
                    const formattedAmt = formatCurrency(amount);
                    btnEl.className = "quick-amt-btn flex-shrink-0 px-5 py-2.5 bg-indigo-500 border border-indigo-500 rounded-xl text-sm font-semibold text-white shadow-md shadow-indigo-200 relative";
                    btnEl.innerHTML = `${formattedAmt} <div class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm"><i class="fa-solid fa-check text-green-600 text-[10px]"></i></div>`;
                }

                checkAddBalance();
            }

            function checkAddBalance() {
                const val = parseFloat(document.getElementById('add-balance-input').value);
                const section = document.getElementById('add-balance-methods-section');
                const minAmt = window.appData?.settings?.minAddBalance !== undefined ? window.appData.settings.minAddBalance : 50;
                if (val >= minAmt) {
                    section.classList.remove('hidden');
                    renderAddBalanceMethods();
                } else {
                    section.classList.add('hidden');
                }
            }

            function renderAddBalanceMethods() {
                let settings = window.appData.settings || {};
                const methods = (settings.paymentMethods && settings.paymentMethods.length > 0)
                    ? settings.paymentMethods.filter(m => m.enabled !== false)
                    : [
                        { id: 'bk', name: 'Bkash', number: '01712345678' },
                        { id: 'ng', name: 'Nagad', number: '01712345678' }
                    ];

                const container = document.getElementById('add-balance-methods-container');
                container.innerHTML = '';

                methods.forEach(m => {
                    const btn = document.createElement('div');
                    btn.className = "border border-gray-200 bg-white rounded-2xl p-3 flex flex-col items-center gap-2 cursor-pointer shadow-sm hover:border-indigo-500 hover:bg-indigo-50 transition";
                    btn.onclick = () => startAddBalancePayment(m.id);

                    let iconHtml = `<i class="fa-solid fa-money-bill-wave text-blue-600 text-xl"></i>`;
                    if (m.logoUrl) {
                        iconHtml = `<img src="${m.logoUrl}" class="w-8 h-8 object-contain">`;
                    } else {
                        if (m.name.toLowerCase().includes('bkash')) iconHtml = `<div class="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center text-white"><i class="fa-solid fa-paper-plane"></i></div>`;
                        if (m.name.toLowerCase().includes('nagad')) iconHtml = `<div class="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white"><i class="fa-solid fa-fire"></i></div>`;
                    }

                    btn.innerHTML = `
                    ${iconHtml}
                    <div class="text-center">
                        <h4 class="text-xs font-bold text-gray-800 leading-tight">${m.name}</h4>
                        <p class="text-[9px] text-gray-500">Pay Now</p>
                    </div>
                `;
                    container.appendChild(btn);
                });
            }

            window.openUserProfile = function (tgId, username) {
                if (username && username !== 'undefined' && username.trim() !== '') {
                    let uname = username.replace('@', '');
                    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) {
                        window.Telegram.WebApp.openTelegramLink('https://t.me/' + uname);
                    } else {
                        window.open('https://t.me/' + uname, '_blank');
                    }
                } else {
                    showToast('This user does not have a public username', 'error');
                }
            };

            function startAddBalancePayment(methodId) {
                const amount = parseFloat(document.getElementById('add-balance-input').value);
                if (isNaN(amount) || amount < (window.appData?.settings?.minAddBalance !== undefined ? window.appData.settings.minAddBalance : 50)) return alert('Minimum amount is ৳ ' + (window.appData?.settings?.minAddBalance !== undefined ? window.appData.settings.minAddBalance : 50));

                currentVPN = null;
                window.currentPlan = { name: 'Add Balance', price: amount };
                window.currentDiscount = 0;
                let settings = window.appData.settings || {};
                const methods = (settings.paymentMethods && settings.paymentMethods.length > 0)
                    ? settings.paymentMethods.filter(m => m.enabled !== false)
                    : [
                        { id: 'bk', name: 'Bkash', number: '01712345678' },
                        { id: 'ng', name: 'Nagad', number: '01712345678' }
                    ];
                const method = methods.find(m => m.id === methodId) || methods[0];

                window.currentMethod = method;
                renderCheckoutStep1();
                proceedToPaymentStep2();
            }

            // --- RECEIPT MODAL LOGIC ---
            function openReceiptModal(transferId) {
                const t = window.appData.transfers.find(tr => tr.id === transferId);
                if (!t) return;

                const isSent = t.senderTgId === window.appData.user.tgId;
                const name = isSent ? t.receiverName : t.senderName;
                const actionLabel = isSent ? 'Sent to' : 'Received from';

                const dateObj = new Date(t.date);
                const dateStr = dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                document.getElementById('receipt-date-time').innerText = `${dateStr}, ${timeStr}`;
                document.getElementById('receipt-action-label').innerText = actionLabel;
                document.getElementById('receipt-name').innerText = name;
                document.getElementById('receipt-amount').innerText = formatCurrency(t.amount);
                document.getElementById('receipt-trx-id').innerText = t.id.substring(0, 10).toUpperCase();

                const modal = document.getElementById('receipt-modal');
                const content = document.getElementById('receipt-modal-content');
                modal.classList.remove('hidden');
                modal.classList.add('flex');
                setTimeout(() => {
                    content.classList.remove('scale-95', 'opacity-0');
                    content.classList.add('scale-100', 'opacity-100');
                }, 10);
            }

            function closeReceiptModal() {
                const modal = document.getElementById('receipt-modal');
                const content = document.getElementById('receipt-modal-content');
                content.classList.remove('scale-100', 'opacity-100');
                content.classList.add('scale-95', 'opacity-0');
                setTimeout(() => {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }, 300);
            }

            function shareReceipt() {
                if (navigator.share) {
                    const amount = document.getElementById('receipt-amount').innerText;
                    const action = document.getElementById('receipt-action-label').innerText;
                    const name = document.getElementById('receipt-name').innerText;
                    const trx = document.getElementById('receipt-trx-id').innerText;

                    navigator.share({
                        title: 'Transaction Receipt',
                        text: `Ayno Store Receipt\n${action}: ${name}\nAmount: ${amount}\nTRX ID: ${trx}`
                    }).catch(console.error);
                } else {
                    showToast("Sharing not supported on this browser.");
                }
            }

            function renderQuickContacts() {
                const list = document.getElementById('quick-contacts-list');
                if (!list) return;
                const transfers = window.appData.transfers || [];

                // Extract unique users we sent money to
                const contacts = new Map();
                transfers.forEach(t => {
                    if (t.senderTgId === window.appData.user.tgId) {
                        if (!contacts.has(t.receiverTgId)) {
                            contacts.set(t.receiverTgId, t.receiverName);
                        }
                    }
                });

                if (contacts.size === 0) {
                    list.innerHTML = '<p class="text-xs text-gray-400 italic">No recent contacts</p>';
                    return;
                }

                let html = '';
                let count = 0;
                contacts.forEach((name, tgId) => {
                    if (count >= 5) return;
                    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=EEF2FF&color=4F46E5&size=100`;
                    const firstName = name.split(' ')[0];
                    html += `
                <div class="flex flex-col items-center gap-1 cursor-pointer min-w-[60px]" onclick="document.getElementById('transfer-search-input').value = '${tgId}'; searchTransferUser();">
                    <img src="${avatar}" class="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 shadow-sm active:scale-95 transition">
                    <span class="text-[10px] font-bold text-gray-700 truncate w-full text-center">${firstName}</span>
                </div>
                `;
                    count++;
                });
                list.innerHTML = html;
            }


            // --- MAIL INBOX UI LOGIC ---


            // Persistent Login Logic
            const originalFetchInboxAccounts = window.fetchInboxAccounts;
            window.fetchInboxAccounts = async function () {
                await originalFetchInboxAccounts();

                // Apply persistent login
                const savedMail = localStorage.getItem('activeMailAccount');
                const selectEl = document.getElementById('inbox-account-select');

                if (savedMail && selectEl) {
                    // Check if the saved mail actually exists in the options
                    let exists = false;
                    for (let i = 0; i < selectEl.options.length; i++) {
                        if (selectEl.options[i].value === savedMail) {
                            exists = true;
                            break;
                        }
                    }

                    if (exists) {
                        selectEl.value = savedMail;
                        // Mock event
                        onInboxAccountChange();
                    }
                }
            };


            // --- API INTEGRATION ---
            window.appData = {
                products: DEFAULT_PRODUCTS,
                orders: [],
                settings: {}
            };

            function uiLog(msg) {
                console.log("UI LOG:", msg);
                // Debug overlay hidden for clean UI
            }

            window.updateBalanceUI = function () {
                // Update static from-price elements first, since they exist independent of user
                document.querySelectorAll('.from-price').forEach(el => {
                    if (el.dataset.price) el.innerText = 'From ' + formatCurrency(el.dataset.price);
                });

                // Update currency symbols in inputs or static labels
                document.querySelectorAll('.currency-symbol').forEach(el => {
                    el.innerText = window.userCurrency === 'USDT' ? '$' : '৳';
                });

                if (!window.appData || !window.appData.user) return;
                const balanceEls = document.querySelectorAll('.user-balance-text');
                balanceEls.forEach(el => el.innerText = formatCurrency(window.appData.user.balance));

                // Re-calc profile spent if needed
                const completedOrders = (window.appData.orders || []).filter(o => o.status === 'Completed' && !(o.item || o.name || '').toLowerCase().includes('add balance'));
                const totalSpent = completedOrders.reduce((sum, o) => sum + o.price, 0);
                const elSpent = document.getElementById('profile-total-spent');
                if (elSpent) elSpent.innerText = formatCurrency(totalSpent);

                const depositOrders = (window.appData.orders || []).filter(o => o.status === 'Completed' && (o.item || o.name || '').toLowerCase().includes('add balance'));
                const totalDeposit = depositOrders.reduce((sum, o) => sum + o.price, 0);
                const elDeposit = document.getElementById('profile-total-deposit');
                if (elDeposit) elDeposit.innerText = formatCurrency(totalDeposit);
            };

            function renderUserProfile() {
                if (!window.appData || !window.appData.user) return;
                const user = window.appData.user;
                const name = (user.firstName || '') + ' ' + (user.lastName || '');
                const finalName = name.trim() || 'Telegram User';

                const nameEl = document.getElementById('profile-name-display');
                if (nameEl) nameEl.innerHTML = `${finalName} <i class="fa-solid fa-circle-check text-blue-600 text-sm"></i>`;

                const uname = user.username ? '@' + user.username : user.tgId;
                const unameEl = document.getElementById('profile-username-display');
                if (unameEl) {
                    unameEl.innerHTML = `${uname} <i class="fa-regular fa-copy ml-1 cursor-pointer"></i>`;
                    unameEl.onclick = () => copyToClipboard(uname);
                }

                if (window.appData.settings && window.appData.settings.coinSystemEnabled !== false) {
                    const coinSec = document.getElementById('profile-coins-section');
                    if (coinSec) coinSec.style.display = 'block';
                    const coinDisp = document.getElementById('profile-coins-display');
                    if (coinDisp) coinDisp.innerText = Math.floor(user.loyaltyPoints || 0);

                    // Render Scratch Cards Notification
                    const scratchBanner = document.getElementById('scratch-notification-banner');
                    if (scratchBanner) {
                        if (user.pendingScratchCards && user.pendingScratchCards.length > 0) {
                            scratchBanner.classList.remove('hidden');
                            document.getElementById('scratch-notification-text').innerText = `You have ${user.pendingScratchCards.length} unscratched card${user.pendingScratchCards.length > 1 ? 's' : ''}`;
                        } else {
                            scratchBanner.classList.add('hidden');
                        }
                    }

                    // Render 7-day calendar
                    const calBox = document.getElementById('checkin-calendar-box');
                    if (calBox) {
                        calBox.style.display = 'block';
                        const rewards = [100, 300, 600, 1000, 2000, 2500, 3500];
                        let streak = user.checkinStreak || 0;
                        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
                        const claimedToday = user.lastCheckinDate === today;

                        document.getElementById('checkin-streak-text').innerHTML = `<i class="fa-solid fa-fire text-[#ff9800]"></i> Streak: ${streak} Days`;

                        let currentProgress = (streak / 7) * 100;
                        if (currentProgress > 100) currentProgress = 100;
                        const progressBar = document.getElementById('checkin-progress-bar');
                        if (progressBar) progressBar.style.width = currentProgress + '%';

                        const container = document.getElementById('checkin-calendar-container');
                        container.innerHTML = '';

                        for (let i = 0; i < 7; i++) {
                            const dayNum = i + 1;
                            let stateClass = "bg-white border-gray-100 opacity-70";
                            let icon = `<i class="fa-solid fa-coins text-gray-300 text-xl"></i>`;
                            let textClass = "text-gray-500";
                            let lockIcon = `<i class="fa-solid fa-lock text-[8px] text-gray-300 absolute top-1.5 right-1.5"></i>`;
                            let dayTextClass = "text-gray-500 font-bold";

                            if (i < streak) {
                                // Claimed
                                stateClass = "bg-[#f8f9fa] border-gray-100 opacity-70";
                                icon = `<div class="w-6 h-6 bg-[#f1c453] rounded-full flex justify-center items-center"><i class="fa-solid fa-check text-white text-xs"></i></div>`;
                                textClass = "text-gray-400 font-bold line-through";
                                lockIcon = "";
                                dayTextClass = "text-gray-400 font-bold";
                            } else if (i === streak) {
                                if (claimedToday) {
                                    // Next to claim (tomorrow)
                                    stateClass = "bg-[#fffdf8] border-yellow-400 shadow-sm";
                                    icon = `<i class="fa-solid fa-lock text-yellow-500 text-xl"></i>`;
                                    textClass = "text-[#c28415] font-black text-[12px]";
                                    lockIcon = `<i class="fa-solid fa-caret-down text-yellow-400 absolute -top-2.5 left-1/2 -translate-x-1/2 text-sm"></i>`;
                                    dayTextClass = "text-[#c28415] font-bold";
                                } else {
                                    // Can claim right now
                                    stateClass = "bg-[#fffbeb] border-[#fde08b] shadow-md transform scale-[1.02] relative z-10";
                                    icon = `<i class="fa-solid fa-gift text-yellow-500 text-2xl animate-bounce drop-shadow-sm"></i>`;
                                    textClass = "text-[#c28415] font-black text-[12px]";
                                    lockIcon = `<i class="fa-solid fa-caret-down text-yellow-400 absolute -top-2.5 left-1/2 -translate-x-1/2 text-sm"></i>`;
                                    dayTextClass = "text-[#c28415] font-bold";
                                }
                            }

                            container.innerHTML += `
                                <div class="min-w-[65px] relative snap-center flex flex-col items-center justify-center p-2 rounded-xl border-2 ${stateClass} transition-all">
                                    ${lockIcon}
                                    <span class="text-[10px] mb-2 ${dayTextClass}">Day ${dayNum}</span>
                                    <div class="h-8 flex items-center justify-center mb-1">${icon}</div>
                                    <span class="text-[10px] ${textClass}">${rewards[i]}</span>
                                </div>
                            `;
                        }
                    }
                } else {
                    const coinSec = document.getElementById('profile-coins-section');
                    if (coinSec) coinSec.style.display = 'none';
                    const calBox = document.getElementById('checkin-calendar-box');
                    if (calBox) calBox.style.display = 'none';
                }

                const initial = finalName.charAt(0).toUpperCase() || 'U';
                const avatarEl = document.getElementById('profile-avatar');
                if (avatarEl) avatarEl.src = `https://ui-avatars.com/api/?name=${initial}&background=E0E7FF&color=3730A3&size=100`;
            }

            window.retryFetchAppData = function () {
                const overlay = document.getElementById('no-network-overlay');
                if (overlay) {
                    overlay.classList.add('hidden');
                    overlay.classList.remove('flex');
                }
                const loader = document.getElementById('splashScreen') || document.getElementById('initial-loader');
                if (loader) loader.style.display = 'flex';
                if (typeof fetchAppData === 'function') fetchAppData();
            };

            function showNetworkError(silent) {
                if (silent) return;
                const loader = document.getElementById('splashScreen') || document.getElementById('initial-loader');
                if (loader) loader.style.display = 'none';
                const appContainer = document.getElementById('app-container');
                if (appContainer) appContainer.style.display = 'none';

                const overlay = document.getElementById('no-network-overlay');
                if (overlay) {
                    overlay.classList.remove('hidden');
                    overlay.classList.add('flex');
                }
            }

            async function fetchAppData(silent = false) {
                try {
                    const urlParams = new URLSearchParams(window.location.search);
                    const urlToken = urlParams.get('token');
                    if (urlToken) {
                        localStorage.setItem('tg_token', urlToken);
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }

                    let initData = '';
                    if (window.Telegram && window.Telegram.WebApp) {
                        window.Telegram.WebApp.ready();
                        window.Telegram.WebApp.expand();
                        if (window.Telegram.WebApp.initData) {
                            initData = window.Telegram.WebApp.initData;
                            uiLog("initData found! Length: " + initData.length);
                        }
                    }

                    let token = localStorage.getItem('tg_token');

                    // If no token and no initData, treat as Guest
                    if (!initData && !token) {
                        window.isGuest = true;
                        uiLog("Operating in Guest Mode.");
                        // Hide Balance and Avatar, Show Login Button
                        const balPill = document.getElementById('home-balance-pill');
                        const profAvatar = document.getElementById('home-profile-avatar');
                        const loginBtn = document.getElementById('home-login-btn');
                        if (balPill) balPill.style.display = 'none';
                        if (profAvatar) profAvatar.style.display = 'none';
                        if (loginBtn) loginBtn.style.display = 'block';
                    } else {
                        window.isGuest = false;
                    }

                    if (initData) { // ALWAYS re-auth if inside Telegram to prevent token hijacking
                        try {
                            uiLog("Sending auth request to /api/auth/telegram...");
                            const authRes = await fetch('/api/auth/telegram', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                                body: JSON.stringify({ initData })
                            });
                            const authData = await authRes.json();
                            uiLog("Auth Response: " + JSON.stringify(authData));

                            if (authData.success) {
                                token = authData.token;
                                localStorage.setItem('tg_token', token);
                                if (authData.user) {
                                    window.appData.user = authData.user;
                                }
                            } else {
                                const errMsg = 'Auth Failed: ' + (authData.error || 'Check Bot Token');
                                showToast(errMsg, 'error');
                                document.body.insertAdjacentHTML('afterbegin', '<div style="background:red;color:white;padding:10px;text-align:center;position:fixed;top:0;width:100%;z-index:99999;">' + errMsg + '</div>');
                                console.error('Auth Failed', authData.error);
                                localStorage.removeItem('tg_token');
                                token = null;
                            }
                        } catch (e) {
                            showToast("Error connecting to server", 'error');
                            return showNetworkError(silent);
                        }
                    } else if (!token) {
                        // Anonymous User outside Telegram
                        localStorage.removeItem('tg_token');
                    }

                    // Fetch App Data using JWT token (if authenticated)
                    const headers = { 'Bypass-Tunnel-Reminder': 'true' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;

                    try {
                        uiLog("Sending data request to /api/data with cache-busting...");
                        const res = await fetch('/api/data?t=' + new Date().getTime(), { headers, cache: 'no-store' });
                        const data = await res.json();

                        if (!data.user && window.appData.user) {
                            data.user = window.appData.user;
                            uiLog("DEBUG: /api/data returned no user! Used authData.user as fallback!");
                        } else if (!data.user) {
                            uiLog("DEBUG: /api/data returned no user! Token was: " + token);
                        }
                        uiLog("Data Response user exists? " + !!data.user);

                        // --- REALTIME DIFFING LOGIC ---
                        if (silent && window.appData.orders && data.orders) {
                            data.orders.forEach(newOrder => {
                                const oldOrder = window.appData.orders.find(o => o.id === newOrder.id);
                                if (oldOrder && oldOrder.status === 'Pending' && (newOrder.status === 'Approved' || newOrder.status === 'Completed' || newOrder.status === 'Delivered')) {
                                    showGlobalNotification('Order Approved!', `Your request for ${newOrder.item} has been approved.`, 'fa-circle-check', 'text-green-500');
                                }
                                if (oldOrder && oldOrder.status === 'Pending' && newOrder.status === 'Rejected') {
                                    showGlobalNotification('Order Rejected', `Your request for ${newOrder.item} was rejected.`, 'fa-circle-xmark', 'text-red-500');
                                }
                            });
                        }

                        if (silent && window.appData.transfers && data.transfers) {
                            if (data.transfers.length > window.appData.transfers.length) {
                                const newTransfer = data.transfers[0];
                                if (data.user && newTransfer.receiverTgId === data.user.tgId) {
                                    showGlobalNotification('Money Received!', `You received ${formatCurrency(newTransfer.amount)} in your wallet.`);
                                }
                            }
                        }
                        // --- END DIFFING ---

                        if (data.user && data.user.webNotifications && data.user.webNotifications.length > 0) {
                            data.user.webNotifications.forEach(msg => {
                                Swal.fire({
                                    icon: 'info',
                                    title: 'New Notification',
                                    html: msg,
                                    confirmButtonColor: '#4f46e5'
                                });
                                try {
                                    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
                                    audio.play();
                                } catch (e) { }
                            });

                            // Ack notifications
                            fetch('/api/user/notifications/ack', {
                                method: 'POST',
                                headers: headers
                            }).catch(e => console.error("Ack error:", e));

                            data.user.webNotifications = [];
                        }

                        if (data.expiredVpnAlerts && data.expiredVpnAlerts.length > 0) {
                            showVpnExpiryPopup(data.expiredVpnAlerts[0], data.user);
                        }

                        if (data.products) {
                            let productsChanged = false;
                            if (silent && window.appData.products) {
                                if (JSON.stringify(window.appData.products) !== JSON.stringify(data.products)) {
                                    productsChanged = true;
                                }
                            }

                            window.appData.products = data.products;
                            updateAllCategoryIcons();

                            if (productsChanged) {
                                if (document.getElementById('home-view') && document.getElementById('home-view').classList.contains('active')) {
                                    renderPopularProducts();
                                }
                                if (typeof updateHomeCategoryPrices === 'function') updateHomeCategoryPrices();

                                if (document.getElementById('vpn-store-view') && document.getElementById('vpn-store-view').classList.contains('active')) {
                                    // Only re-render if the checkout modal is NOT open, to avoid interrupting user purchase flow
                                    const paymentModal = document.getElementById('payment-modal');
                                    if (!paymentModal || paymentModal.classList.contains('hidden')) {
                                        renderVPNs();
                                    }
                                }
                            }
                        }
                        if (data.stocks) window.appData.stocks = data.stocks;
                        if (data.coupons) window.appData.coupons = data.coupons;
                        if (data.orders) {
                            let ordersChanged = false;
                            if (window.appData.orders) {
                                if (JSON.stringify(window.appData.orders) !== JSON.stringify(data.orders)) {
                                    ordersChanged = true;
                                }
                            }
                            window.appData.orders = data.orders;
                            if (window.updateNumHistoryBadge) window.updateNumHistoryBadge();

                            // Re-render number history if it's currently open and orders changed
                            if (ordersChanged) {
                                const btnHistory = document.getElementById('btn-num-history');
                                const numView = document.getElementById('number-view-container');
                                if (btnHistory && btnHistory.classList.contains('text-gray-800') && numView && !numView.classList.contains('hidden')) {
                                    const currentTabEl = document.querySelector('.border-b-2.border-orange-500');
                                    const tab = currentTabEl ? (currentTabEl.innerText.toLowerCase().includes('waiting') ? 'waiting' : (currentTabEl.innerText.toLowerCase().includes('all') ? 'all' : 'paid')) : 'waiting';
                                    if (typeof renderNumberHistory === 'function') {
                                        renderNumberHistory(tab);
                                    }
                                }

                                renderOrdersStats();
                                // Also re-render normal history if it's open
                                if (document.getElementById('orders-view') && document.getElementById('orders-view').classList.contains('active')) {
                                    if (typeof renderOrdersList === 'function') renderOrdersList();
                                }
                            }
                        }
                        if (data.settings) {
                            window.appData.settings = data.settings;
                            const minAmt = data.settings.minAddBalance !== undefined ? data.settings.minAddBalance : 50;
                            const minTxt = document.getElementById('min-add-balance-text');
                            if (minTxt) minTxt.innerText = 'Minimum add balance ' + formatCurrency(minAmt);

                            // Category Visibility & Dynamic Grid (2-lines layout)
                            const catList = [
                                { id: 'home-card-vpn', visible: data.settings.catVpnVisible !== false },
                                { id: 'home-card-proxy', visible: data.settings.catProxyVisible !== false },
                                { id: 'home-card-mail', visible: data.settings.catMailVisible !== false },
                                { id: 'home-card-app', visible: data.settings.catAppVisible !== false },
                                { id: 'home-card-number', visible: data.settings.catNumberVisible !== false }
                            ];
                            const visibleCards = [];
                            catList.forEach(c => {
                                const el = document.getElementById(c.id);
                                if (el) {
                                    el.classList.remove('col-span-1', 'col-span-2', 'col-span-3', 'col-span-4', 'col-span-5', 'col-span-6');
                                    el.style.gridColumn = '';
                                    if (c.visible) {
                                        el.style.display = 'flex';
                                        visibleCards.push(el);
                                    } else {
                                        el.style.display = 'none';
                                    }
                                }
                            });
                            const gridEl = document.getElementById('home-categories-grid');
                            if (gridEl) {
                                gridEl.style.gridTemplateColumns = '';
                                gridEl.classList.remove('grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5');
                                gridEl.classList.add('grid-cols-6');
                            }
                            const count = visibleCards.length;
                            if (count === 4) {
                                // 2 lines: 2 products per line (each 3 cols in 6-col grid)
                                visibleCards.forEach(el => {
                                    el.classList.add('col-span-3');
                                    el.style.gridColumn = 'span 3 / span 3';
                                });
                            } else if (count === 5) {
                                // 2 lines: Line 1 has 3 products (2 cols each = 6 cols), Line 2 has 2 products (3 cols each = 6 cols)
                                visibleCards.forEach((el, index) => {
                                    if (index < 3) {
                                        el.classList.add('col-span-2');
                                        el.style.gridColumn = 'span 2 / span 2';
                                    } else {
                                        el.classList.add('col-span-3');
                                        el.style.gridColumn = 'span 3 / span 3';
                                    }
                                });
                            } else if (count >= 6) {
                                // 2 lines: 3 products per line (each 2 cols in 6-col grid)
                                visibleCards.forEach(el => {
                                    el.classList.add('col-span-2');
                                    el.style.gridColumn = 'span 2 / span 2';
                                });
                            } else if (count === 3) {
                                // 1 line of 3 products (2 cols each)
                                visibleCards.forEach(el => {
                                    el.classList.add('col-span-2');
                                    el.style.gridColumn = 'span 2 / span 2';
                                });
                            } else if (count === 2) {
                                // 1 line of 2 products (3 cols each)
                                visibleCards.forEach(el => {
                                    el.classList.add('col-span-3');
                                    el.style.gridColumn = 'span 3 / span 3';
                                });
                            } else if (count === 1) {
                                visibleCards[0].classList.add('col-span-6');
                                visibleCards[0].style.gridColumn = 'span 6 / span 6';
                            }
                        }
                        if (data.transfers) window.appData.transfers = data.transfers;
                        if (data.mailStockSummary) window.appData.mailStockSummary = data.mailStockSummary;

                        // Update UI with User Data
                        if (data.user) {
                            window.appData.user = data.user;
                            renderTransferHistory();
                            renderQuickContacts();

                            updateBalanceUI();
                            renderUserProfile();

                            // Update Profile Stats
                            const completedOrders = (data.orders || []).filter(o => o.status === 'Completed');
                            const pendingOrders = (data.orders || []).filter(o => o.status === 'Pending');

                            const elTotal = document.getElementById('profile-total-orders');
                            const elCompleted = document.getElementById('profile-completed-orders');
                            const elPending = document.getElementById('profile-pending-orders');

                            if (elTotal) elTotal.innerText = (data.orders || []).length;
                            if (elCompleted) elCompleted.innerText = completedOrders.length;
                            if (elPending) elPending.innerText = pendingOrders.length;

                            // Update Profile Tab
                            const profileName = document.querySelector('#profile-view h2.text-lg, #profile-view h2.text-xl');
                            if (profileName) profileName.innerHTML = data.user.firstName + ' ' + (data.user.lastName || '') + ' <i class="fa-solid fa-circle-check text-blue-600 text-sm"></i>';

                            const profileUsername = document.querySelector('#profile-view span.text-xs.text-blue-600');
                            if (profileUsername) {
                                profileUsername.innerHTML = `@${data.user.username || 'user'} <i class="fa-regular fa-copy ml-1 cursor-pointer" onclick="copyToClipboard('@${data.user.username || 'user'}')"></i>`;
                            }

                            const memberSinceEl = document.getElementById('profile-member-since');
                            if (memberSinceEl && data.user.joinedAt) {
                                const date = new Date(data.user.joinedAt);
                                const options = { month: 'short', year: 'numeric' };
                                memberSinceEl.innerText = 'Joined ' + date.toLocaleDateString('en-US', options);
                            }

                            const profileReferrals = document.getElementById('profile-referrals-text');
                            if (profileReferrals && data.user.referralsCount !== undefined) {
                                if (data.user.referralsCount > 0) {
                                    profileReferrals.innerHTML = `You have referred <span class="font-bold text-pink-500">${data.user.referralsCount}</span> users`;
                                } else {
                                    profileReferrals.innerHTML = `Invite friends and earn rewards`;
                                }
                            }

                            const profileAvatar = document.getElementById('profile-avatar');
                            const homeAvatar = document.getElementById('home-avatar');
                            const avatarUrl = data.user.photoUrl ? data.user.photoUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user.firstName)}+${encodeURIComponent(data.user.lastName || '')}&background=E0E7FF&color=3730A3&size=100`;

                            if (profileAvatar) profileAvatar.src = avatarUrl;
                            if (homeAvatar) homeAvatar.src = avatarUrl;

                            // Admin check
                            if (data.user.role === 'admin') {
                                const gearBtn = document.getElementById('admin-gear-btn');
                                if (gearBtn) gearBtn.classList.remove('hidden');
                            }

                            // Check Welcome Reward
                            if (window.appData.settings && window.appData.settings.rewardEnabled) {
                                if (data.user.referredBy && !data.user.rewardClaimed && !data.user.rewardIgnored) {
                                    document.getElementById('reward-modal').classList.remove('hidden');
                                    document.getElementById('reward-modal').classList.add('flex');
                                    setTimeout(() => {
                                        document.getElementById('reward-modal-content').classList.remove('scale-95', 'opacity-0');
                                        document.getElementById('reward-modal-content').classList.add('scale-100', 'opacity-100');
                                    }, 50);
                                }
                            }
                            updateRewardTrayUI();
                        }
                    } catch (err) {
                        uiLog("DEBUG: /api/data fetch error: " + err.message);
                        return showNetworkError(silent);
                    }

                    // Re-render everything after data loads
                    document.getElementById('app-container').style.display = 'block';
                    const loader = document.getElementById('initial-loader');
                    if (loader) loader.style.display = 'none';

                    if (!silent) {
                        renderPopularProducts();
                        renderOrdersStats();
                        renderOrdersList();
                        if (typeof updateHomeCategoryPrices === 'function') updateHomeCategoryPrices();
                        if (typeof updateReferStats === 'function') updateReferStats();
                        if (document.getElementById('vpn-store-view').classList.contains('active') && currentStoreCategory !== 'number') {
                            renderVPNs();
                        }
                    }
                    if (window.hideSplashScreen) window.hideSplashScreen();

                    const urlObj = new URL(window.location);
                    const deepLinkProduct = urlObj.searchParams.get('product');
                    if (deepLinkProduct) {
                        openVPNPackages(deepLinkProduct);
                        urlObj.searchParams.delete('product');
                        window.history.replaceState({}, document.title, urlObj.toString());
                    }

                    // Resume pending flows after login
                    const pendingPlanData = sessionStorage.getItem('pendingPaymentPlan');
                    if (pendingPlanData) {
                        sessionStorage.removeItem('pendingPaymentPlan');
                        const data = JSON.parse(pendingPlanData);
                        if (data.currentVPNId && window.appData && window.appData.products) {
                            currentVPN = window.appData.products.find(p => p.id === data.currentVPNId);
                            if (currentVPN) openVPNPackages(currentVPN.id);
                        }
                        if (data.currentDeliveryEmail) window.currentDeliveryEmail = data.currentDeliveryEmail;
                        if (data.plan) setTimeout(() => continuePaymentFlow(data.plan), 500);
                    }

                    const pendingNumber = sessionStorage.getItem('pendingNumberPurchase');
                    if (pendingNumber) {
                        sessionStorage.removeItem('pendingNumberPurchase');
                        const data = JSON.parse(pendingNumber);
                        setTimeout(() => buySmsbowerNumber(...data.args), 500);
                    }

                    const pendingAddFund = sessionStorage.getItem('pendingAddFund');
                    if (pendingAddFund) {
                        sessionStorage.removeItem('pendingAddFund');
                        setTimeout(() => openAddFundModal(), 500);
                    }
                } catch (e) {
                    console.error("Failed to fetch app data", e);
                    return showNetworkError(silent);
                }
            }

            function updateHomeCategoryPrices() {
                if (!window.appData || !window.appData.products) return;
                const products = window.appData.products;

                const minPrices = {
                    vpn: Infinity,
                    proxy: Infinity,
                    mail: Infinity,
                    number: Infinity,
                    app: Infinity
                };

                products.forEach(p => {
                    if (p.isHidden || p.isAvailable === false) return;

                    let cat = (p.category || '').toLowerCase();
                    if (cat.includes('mail')) cat = 'mail';

                    let price = Infinity;
                    if (p.plans && p.plans.length > 0) {
                        price = Math.min(...p.plans.map(pl => parseFloat(pl.price) || Infinity));
                    } else if (p.category === 'proxy' && p.pricePerGb !== undefined) {
                        price = parseFloat(p.pricePerGb);
                    } else if (p.price !== undefined) {
                        price = parseFloat(p.price);
                    }

                    if (minPrices[cat] !== undefined && price < minPrices[cat]) {
                        minPrices[cat] = price;
                    }
                });

                ['vpn', 'proxy', 'mail', 'number', 'app'].forEach(cat => {
                    const el = document.getElementById(`home-price-${cat}`);
                    if (el && minPrices[cat] !== Infinity) {
                        el.innerText = `Starting ৳ ${minPrices[cat]}`;
                    }
                });
            }


            // ======= HELPER FUNCTIONS =======

            // Reward System Logic
            async function claimWelcomeReward() {
                const btn = document.getElementById('btn-claim-reward');
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Verifying...';
                btn.disabled = true;

                try {
                    const res = await fetch('/api/reward/claim', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('tg_token') }
                    });
                    const data = await res.json();

                    if (data.success) {
                        showGlobalNotification('Reward Claimed!', `You received a ৳${data.discountFixed || 5} discount coupon!`, 'fa-gift', 'text-pink-500');
                        if (window.appData.user) {
                            window.appData.user.rewardClaimed = true;
                            window.appData.user.discountCoupon = data.coupon;
                            window.appData.user.discountFixed = data.discountFixed;
                            window.appData.user.couponUsed = false;
                        }
                        closeRewardModal();
                        updateRewardTrayUI();
                    } else {
                        if (data.error === 'not_joined') {
                            const errDiv = document.getElementById('reward-error-msg');
                            if (errDiv) {
                                errDiv.classList.remove('hidden');
                                errDiv.innerText = 'আপনি এখনো চ্যানেলে জয়েন করেননি! অফারটি নিতে আগে জয়েন করুন।';
                            }
                        } else {
                            showToast(data.error || 'Failed to claim reward', 'error');
                        }
                        btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles mr-2"></i> Verify & Claim';
                        btn.disabled = false;
                    }
                } catch (e) {
                    showToast('Network error', 'error');
                    btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles mr-2"></i> Verify & Claim';
                    btn.disabled = false;
                }
            }

            async function ignoreWelcomeReward() {
                closeRewardModal();
                try {
                    await fetch('/api/reward/ignore', {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + localStorage.getItem('tg_token') }
                    });
                    if (window.appData.user) window.appData.user.rewardIgnored = true;
                } catch (e) { }
            }

            function closeRewardModal() {
                const content = document.getElementById('reward-modal-content');
                content.classList.remove('scale-100', 'opacity-100');
                content.classList.add('scale-95', 'opacity-0');
                setTimeout(() => {
                    document.getElementById('reward-modal').classList.add('hidden');
                    document.getElementById('reward-modal').classList.remove('flex');
                }, 300);
            }

            function toggleRewardTray() {
                const tray = document.getElementById('reward-tray');
                if (tray.classList.contains('scale-0')) {
                    tray.classList.remove('scale-0', 'opacity-0');
                    tray.classList.add('scale-100', 'opacity-100');
                } else {
                    tray.classList.remove('scale-100', 'opacity-100');
                    tray.classList.add('scale-0', 'opacity-0');
                }
            }

            function updateRewardTrayUI() {
                const user = window.appData.user;
                const content = document.getElementById('reward-tray-content');
                const badge = document.getElementById('reward-bell-badge');
                const staticBadge = document.getElementById('reward-bell-badge-static');

                if (!user || !user.rewardClaimed) {
                    if (user && user.referredBy && !user.rewardClaimed && window.appData.settings && window.appData.settings.rewardEnabled) {
                        badge.classList.remove('hidden');
                        staticBadge.classList.remove('hidden');
                        content.innerHTML = `
                        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 text-center">
                            <i class="fa-solid fa-gift text-blue-500 text-2xl mb-2"></i>
                            <h4 class="font-bold text-slate-800 text-sm mb-1">Welcome Reward</h4>
                            <p class="text-[10px] text-slate-500 mb-3">You haven't claimed your welcome reward yet!</p>
                            <button onclick="document.getElementById('reward-tray').classList.add('scale-0', 'opacity-0'); document.getElementById('reward-modal').classList.remove('hidden'); document.getElementById('reward-modal').classList.add('flex'); setTimeout(() => { document.getElementById('reward-modal-content').classList.remove('scale-95', 'opacity-0'); document.getElementById('reward-modal-content').classList.add('scale-100', 'opacity-100'); }, 50);" class="bg-blue-600 text-white font-bold py-1.5 px-4 rounded-lg text-xs w-full hover:bg-blue-700 transition shadow-sm"><i class="fa-solid fa-hand-pointer mr-1"></i> Claim Now</button>
                        </div>
                    `;
                    } else {
                        content.innerHTML = '<div class="text-center text-slate-500 py-4 text-sm"><i class="fa-solid fa-face-frown-open mb-2 text-2xl"></i><br>No rewards yet.</div>';
                        badge.classList.add('hidden');
                        staticBadge.classList.add('hidden');
                    }
                    return;
                }

                if (user.discountCoupon && !user.couponUsed) {
                    badge.classList.remove('hidden');
                    staticBadge.classList.remove('hidden');
                    content.innerHTML = `
                    <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 relative overflow-hidden">
                        <div class="absolute -right-4 -top-4 w-16 h-16 bg-blue-100 rounded-full opacity-50 blur-xl"></div>
                        <div class="flex justify-between items-center mb-2 relative z-10">
                            <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">Welcome Discount</span>
                            <span class="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">৳${user.discountFixed || 5} OFF</span>
                        </div>
                        <div class="text-lg font-black text-slate-800 tracking-widest mt-1 mb-3 relative z-10 font-mono">${user.discountCoupon}</div>
                        <div class="flex items-center justify-between mt-2 pt-3 border-t border-blue-200/50 relative z-10">
                            <span class="text-xs text-slate-500 font-medium">Status: <span class="text-green-600">Available</span></span>
                            <button onclick="copyToClipboard('${user.discountCoupon}'); showToast('Coupon copied!', 'success')" class="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1 transition">
                                <i class="fa-regular fa-copy"></i> Copy
                            </button>
                        </div>
                    </div>
                    <p class="text-[10px] text-slate-400 text-center mt-3">* Can be used once on any VPN purchase.</p>
                `;
                } else if (user.couponUsed) {
                    badge.classList.add('hidden');
                    staticBadge.classList.add('hidden');
                    content.innerHTML = `
                    <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 grayscale opacity-75">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Welcome Discount</span>
                            <span class="bg-slate-300 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">৳${user.discountFixed || 5} OFF</span>
                        </div>
                        <div class="text-lg font-black text-slate-400 tracking-widest mt-1 mb-3 font-mono line-through">${user.discountCoupon}</div>
                        <div class="flex items-center justify-between mt-2 pt-3 border-t border-slate-200">
                            <span class="text-xs text-slate-500 font-medium">Status: <span class="text-red-500">Used</span></span>
                        </div>
                    </div>
                `;
                }
            }



            function renderTransferHistory() {
                const list = document.getElementById('transfer-history-list');
                if (!list) return;
                const transfers = window.appData.transfers || [];
                if (transfers.length === 0) {
                    list.innerHTML = '<div class="text-center text-gray-500 text-xs py-4">No recent transfers</div>';
                    return;
                }
                list.innerHTML = transfers.map(t => {
                    const isSent = t.senderTgId === window.appData.user.tgId;
                    const sign = isSent ? '-' : '+';
                    const color = isSent ? 'text-rose-600' : 'text-emerald-600';
                    const bgIconClass = isSent ? 'bg-rose-50' : 'bg-emerald-50';
                    const iconColor = isSent ? 'text-rose-500' : 'text-emerald-500';
                    const icon = isSent ? 'fa-arrow-up-right-from-square' : 'fa-arrow-down-to-line';
                    const name = isSent ? t.receiverName : t.senderName;
                    const targetId = isSent ? t.receiverTgId : t.senderTgId;
                    const photoUrl = isSent ? t.receiverPhoto : t.senderPhoto;
                    const avatar = photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E0E7FF&color=3730A3&size=100`;
                    const dateObj = new Date(t.date);
                    const dateStr = dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
                    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    const statusLabel = isSent ? 'Sent to' : 'Received from';

                    return `
                <div onclick="openReceiptModal('${t.id}')" class="flex items-center justify-between p-3.5 bg-white border border-gray-100 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-md hover:-translate-y-0.5 transition cursor-pointer mb-2 group">
                    <div class="flex items-center gap-3.5" onclick="event.stopPropagation(); openUserProfile('${targetId}', '${isSent ? (t.receiverUsername || '') : (t.senderUsername || '')}')">
                        <div class="relative">
                            <img src="${avatar}" class="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-indigo-100 transition hover:scale-110">
                            <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${bgIconClass} border border-white flex items-center justify-center shadow-sm">
                                <i class="fa-solid ${icon} ${iconColor} text-[8px]"></i>
                            </div>
                        </div>
                        <div>
                            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${statusLabel}</p>
                            <p class="text-sm font-bold text-gray-800 hover:text-indigo-600 transition">${name}</p>
                            <p class="text-[10px] text-gray-500 font-medium mt-0.5 flex items-center"><i class="fa-regular fa-clock mr-1 text-gray-400"></i>${dateStr}, ${timeStr}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-base font-black ${color} tracking-tight">${sign}${formatCurrency(t.amount).replace(/^[৳$]\s*/, '')} <span class="text-xs">${window.userCurrency === 'USDT' ? '$' : '৳'}</span></div>
                        <div class="text-[9px] text-gray-400 font-bold mt-1 uppercase flex justify-end items-center"><i class="fa-solid fa-check-double text-green-500 mr-1"></i> Success</div>
                    </div>
                </div>`;
                }).join('');
            }

            function renderQuickContacts() {
                const list = document.getElementById('quick-contacts-list');
                if (!list) return;
                const transfers = window.appData.transfers || [];

                // Extract unique users we sent money to
                const contacts = new Map();
                transfers.forEach(t => {
                    if (t.senderTgId === window.appData.user.tgId) {
                        if (!contacts.has(t.receiverTgId)) {
                            contacts.set(t.receiverTgId, { name: t.receiverName, photoUrl: t.receiverPhoto });
                        }
                    }
                });

                if (contacts.size === 0) {
                    list.innerHTML = '<p class="text-xs text-gray-400 italic">No recent contacts</p>';
                    return;
                }

                let html = '';
                let count = 0;
                contacts.forEach((data, tgId) => {
                    if (count >= 5) return;
                    const name = data.name;
                    const photoUrl = data.photoUrl;
                    const avatar = photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=EEF2FF&color=4F46E5&size=100`;
                    const firstName = name.split(' ')[0];
                    const safeName = name.replace(/'/g, "\'");
                    const safePhoto = photoUrl ? photoUrl.replace(/'/g, "\'") : '';

                    // Directly select the user instead of just searching
                    html += `
                <div class="flex flex-col items-center gap-1 cursor-pointer min-w-[60px]" onclick="selectTransferUser('${tgId}', '${safeName}', '${safePhoto}')">
                    <img src="${avatar}" class="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 shadow-sm active:scale-95 transition">
                    <span class="text-[10px] font-bold text-gray-700 truncate w-full text-center">${firstName}</span>
                </div>
                `;
                    count++;
                });
                list.innerHTML = html;
            }
            function showToast(msg) {
                const toast = document.createElement('div');
                toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg z-[9999] transition-all duration-300 transform translate-y-10 opacity-0';
                toast.innerText = msg;
                document.body.appendChild(toast);
                setTimeout(() => {
                    toast.classList.remove('translate-y-10', 'opacity-0');
                }, 10);
                setTimeout(() => {
                    toast.classList.add('translate-y-10', 'opacity-0');
                    setTimeout(() => toast.remove(), 300);
                }, 3000);
            }

            function copyToClipboard(text) {
                const clean = (text || '').replace(/ /g, '').trim();
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(clean).then(() => showToast('Copied to clipboard!')).catch(() => {
                        const el = document.createElement('textarea');
                        el.value = clean; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
                        showToast('Copied!');
                    });
                } else {
                    const el = document.createElement('textarea');
                    el.value = clean; document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
                    showToast('Copied!');
                }
            }

            async function redeemCoins() {
                const coins = window.appData?.user?.loyaltyPoints || 0;
                if (coins < 1000) {
                    return showToast('You need at least 1000 Coins to redeem.', 'error');
                }
                showBeautifulConfirm('Redeem Coins', coins / 1000, async () => {
                    try {
                        const token = localStorage.getItem('ayno_token');
                        const tgId = localStorage.getItem('ayno_tgId');
                        const res = await fetch('/api/loyalty/redeem', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ tgId, points: Math.floor(coins) })
                        });
                        const data = await res.json();
                        if (data.success) {
                            if (typeof window.showCoinRewardPopup === 'function') {
                                window.showCoinRewardPopup(Math.floor(coins), true); // true = is claim
                            } else {
                                showToast(`Redeemed successfully! Added ${data.amountAdded}৳ to balance.`, 'success');
                            }
                            await fetchAppData();
                        } else {
                            showToast(data.error || 'Failed to redeem', 'error');
                        }
                    } catch (e) {
                        showToast('Network error', 'error');
                    }
                });
            }

            window.showCoinRewardPopup = function (coinsAmount, isClaim = false) {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
                audio.play().catch(e => console.log(e));

                const div = document.createElement('div');
                div.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300";

                const title = isClaim ? "Redeemed!" : "Awesome!";
                const text = isClaim
                    ? `You successfully claimed <span class="text-yellow-600 font-bold text-xl">🪙 ${coinsAmount}</span> Coins for Taka!`
                    : `You just earned <span class="text-yellow-600 font-bold text-xl">🪙 ${coinsAmount}</span> Coins from this order!`;

                div.innerHTML = `
                    <div class="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl transform scale-90 transition-transform duration-500 flex flex-col items-center">
                        <div class="w-24 h-24 mb-4 relative">
                            <div class="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20"></div>
                            <div class="relative bg-gradient-to-br from-yellow-300 to-yellow-500 w-full h-full rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                                <span class="text-5xl drop-shadow-md animate-bounce">🪙</span>
                            </div>
                        </div>
                        <h2 class="text-3xl font-black text-gray-800 mb-2">${title}</h2>
                        <p class="text-gray-500 mb-6 font-medium">${text}</p>
                        <button onclick="this.closest('.fixed').remove()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95">Awesome!</button>
                    </div>
                `;
                document.body.appendChild(div);
                setTimeout(() => {
                    div.querySelector('.bg-white').classList.remove('scale-90');
                    div.querySelector('.bg-white').classList.add('scale-100');
                }, 10);
                setTimeout(() => {
                    if (document.body.contains(div)) div.remove();
                }, 5000);
            };

            window.claimDailyReward = async function () {
                try {
                    const token = localStorage.getItem('ayno_token') || localStorage.getItem('tg_token');
                    if (!token) return showToast('Please login first', 'error');

                    showToast('Claiming daily reward...', 'info');
                    const res = await fetch('/api/loyalty/checkin', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();

                    if (data.success) {
                        if (typeof window.showCoinRewardPopup === 'function') {
                            window.showCoinRewardPopup(data.coinsEarned);
                        } else {
                            showToast(`You claimed ${data.coinsEarned} Coins!`, 'success');
                        }
                        await fetchAppData();
                    } else {
                        showToast(data.error || 'Failed to claim reward', 'error');
                    }
                } catch (e) {
                    showToast('Network error', 'error');
                }
            };

            function toggleProfileBalance() {
                const el = document.getElementById('profile-balance-display');
                const icon = document.getElementById('profile-balance-eye');
                if (!el) return;
                if (el.dataset.hidden === 'true') {
                    el.innerText = '৳ ' + (el.dataset.balance || '0');
                    el.dataset.hidden = 'false';
                    if (icon) icon.className = 'fa-regular fa-eye text-indigo-200 cursor-pointer text-lg';
                } else {
                    el.dataset.balance = el.innerText.replace('৳ ', '').trim();
                    el.innerText = '৳ ****';
                    el.dataset.hidden = 'true';
                    if (icon) icon.className = 'fa-regular fa-eye-slash text-indigo-200 cursor-pointer text-lg';
                }
            }

            function showReferralSheet() {
                const botLink = "https://t.me/AynoStoreBot";
                const userId = (window.appData && window.appData.user && window.appData.user.tgId) || '12345';
                const referLink = botLink + '?start=' + userId;
                const message = encodeURIComponent('🚀 Join Ayno Store today and get premium digital services at the lowest prices!\n\nClick the link below to get started:');
                const shareUrl = "https://t.me/share/url?url=" + encodeURIComponent(referLink) + "&text=" + message;

                if (window.Telegram && window.Telegram.WebApp) {
                    window.Telegram.WebApp.openTelegramLink(shareUrl);
                } else {
                    window.open(shareUrl, '_blank');
                }
            }

            function openLiveChat() {
                const botLink = "https://t.me/AynoStoreBot";
                const liveChatLink = botLink + '?start=livechat';
                if (window.Telegram && window.Telegram.WebApp) { window.Telegram.WebApp.openTelegramLink(liveChatLink); }
                else { window.open(liveChatLink, '_blank'); }
            }

            function openTelegramSupport() {
                const link = (window.appData && window.appData.settings && window.appData.settings.telegramLink) || 'https://t.me/aynoshop';
                if (window.Telegram && window.Telegram.WebApp) { window.Telegram.WebApp.openTelegramLink(link); }
                else { window.open(link, '_blank'); }
            }

            function openEmailSupport() {
                const email = (window.appData && window.appData.settings && window.appData.settings.supportEmail) || 'support@aynostore.com';
                window.open('mailto:' + email + '?subject=Support%20Request', '_blank');
            }

            function toggleFaq(header) {
                const parent = header.parentElement;
                const answer = parent.querySelector('.faq-answer');
                const icon = header.querySelector('i.fa-chevron-down');
                if (!answer) return;
                const isOpen = !answer.classList.contains('hidden');
                document.querySelectorAll('.faq-answer').forEach(function (a) { a.classList.add('hidden'); });
                document.querySelectorAll('#faq-list i.fa-chevron-down').forEach(function (i) { i.style.transform = ''; });
                if (!isOpen) {
                    answer.classList.remove('hidden');
                    if (icon) icon.style.transform = 'rotate(180deg)';
                }
            }
            // ======= END HELPER FUNCTIONS =======

            function updateCategoryIcon(category, containerId) {
                if (!window.appData || !window.appData.products) return;
                const prods = window.appData.products.filter(p => p.category === category);
                const prodsWithImages = prods.filter(p => p.logoUrl);
                const container = document.getElementById(containerId);

                if (container && prodsWithImages.length > 0) {
                    const toShow = prodsWithImages.slice(0, 4);
                    let html = '';

                    if (toShow.length === 1) {
                        container.className = 'w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden mb-3 bg-white shadow-sm border border-gray-100 flex items-center justify-center p-1';
                        html = `<img src="${toShow[0].logoUrl}" class="w-full h-full object-contain rounded-lg" alt="${toShow[0].name}">`;
                    } else if (toShow.length === 2) {
                        container.className = 'w-12 h-12 md:w-14 md:h-14 grid grid-cols-2 gap-1 rounded-xl overflow-hidden mb-3 bg-gray-50 p-1 shadow-inner border border-gray-100';
                        html = `<img src="${toShow[0].logoUrl}" class="w-full h-full object-contain bg-white rounded-md shadow-sm" alt="${toShow[0].name}">
                            <img src="${toShow[1].logoUrl}" class="w-full h-full object-contain bg-white rounded-md shadow-sm" alt="${toShow[1].name}">`;
                    } else if (toShow.length === 3) {
                        container.className = 'w-12 h-12 md:w-14 md:h-14 grid grid-cols-2 gap-[2px] rounded-xl overflow-hidden mb-3 bg-gray-100 p-1 border border-gray-100';
                        html = `<div class="col-span-1 h-full"><img src="${toShow[0].logoUrl}" class="w-full h-full object-contain bg-white rounded-l-md" alt="${toShow[0].name}"></div>
                            <div class="col-span-1 grid grid-rows-2 gap-[2px] h-full">
                                <img src="${toShow[1].logoUrl}" class="w-full h-full object-contain bg-white rounded-tr-md" alt="${toShow[1].name}">
                                <img src="${toShow[2].logoUrl}" class="w-full h-full object-contain bg-white rounded-br-md" alt="${toShow[2].name}">
                            </div>`;
                    } else {
                        container.className = 'w-12 h-12 md:w-14 md:h-14 grid grid-cols-2 grid-rows-2 gap-[2px] rounded-xl overflow-hidden mb-3 bg-gray-100 p-1 border border-gray-100';
                        html = `<img src="${toShow[0].logoUrl}" class="w-full h-full object-contain bg-white rounded-tl-md" alt="${toShow[0].name}">
                            <img src="${toShow[1].logoUrl}" class="w-full h-full object-contain bg-white rounded-tr-md" alt="${toShow[1].name}">
                            <img src="${toShow[2].logoUrl}" class="w-full h-full object-contain bg-white rounded-bl-md" alt="${toShow[2].name}">
                            <img src="${toShow[3].logoUrl}" class="w-full h-full object-contain bg-white rounded-br-md" alt="${toShow[3].name}">`;
                    }

                    container.innerHTML = html;
                }
            }

            function updateAllCategoryIcons() {
                updateCategoryIcon('vpn', 'home-vpn-icon-container');
                updateCategoryIcon('proxy', 'home-proxy-icon-container');
                updateCategoryIcon('mail', 'home-mail-icon-container');
                updateCategoryIcon('app', 'home-app-icon-container');
            }

            // Fetch data on load
            document.addEventListener('DOMContentLoaded', () => {
                if (window.Telegram && window.Telegram.WebApp) {
                    window.Telegram.WebApp.ready(); // Call ready immediately to populate initData
                    if (!window.Telegram.WebApp.initData) {
                        let attempts = 0;
                        const interval = setInterval(() => {
                            attempts++;
                            if (window.Telegram.WebApp.initData || attempts >= 30) {
                                clearInterval(interval);
                                fetchAppData();
                            }
                        }, 50); // Faster polling
                        return;
                    }
                }
                fetchAppData();
            });
        