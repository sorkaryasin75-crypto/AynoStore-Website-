
                document.addEventListener('DOMContentLoaded', () => {
                    // Live Activity Ticker Logic
                    const ticker = document.getElementById('live-activity-ticker');
                    if (!ticker) return;

                    const names = [
                        'Rahul', 'Ahammed', 'Rakib', 'Sakib', 'Siyam', 'Hasan', 'Naim', 'Fahim', 'Mahmud', 'Tareq', 'Sabbir', 'Ratul', 'Imran', 'Arif', 'Shawon', 'Tanvir', 'Hridoy', 'Jibon', 'Riyad', 'Sohan',
                        '꧁Töxíc Bøy꧂', 'R҉A҉H҉U҉L҉', 'MR. 3x', '★.B.O.S.S.★', 'I Am L€g£nd', 'D҉A҉R҉K҉', '☠︎Dęadpøøl☠︎', '『ᴀʏɴᴏ』B O S S', 'M_I_R_A_J', 'R_o_Y_a_L', '༄ᶦᶰᵈ᭄✿Gᴀᴍᴇʀ࿐', '亗 K I N G 亗'
                    ];
                    const actions = ['bought', 'purchased', 'just got'];

                    let realTransactions = [];
                    let realTxIndex = 0;
                    let lastFetchedDate = null;
                    let priorityQueue = [];

                    function fetchRecentTransactions() {
                        fetch('/api/recent-transactions?t=' + Date.now(), { cache: 'no-store' })
                            .then(res => res.json())
                            .then(data => {
                                if (data.success && data.transactions.length > 0) {
                                    if (realTransactions.length === 0) {
                                        realTransactions = data.transactions;
                                        lastFetchedDate = data.transactions[0].date;
                                    } else {
                                        // Find new transactions
                                        const newTxs = data.transactions.filter(tx => new Date(tx.date) > new Date(lastFetchedDate));
                                        if (newTxs.length > 0) {
                                            lastFetchedDate = data.transactions[0].date;
                                            priorityQueue.push(...newTxs);
                                            // Add to main cycle and adjust index to maintain current position
                                            realTransactions = [...newTxs, ...realTransactions].slice(0, 50);
                                            realTxIndex += newTxs.length;
                                        }
                                    }
                                }
                            }).catch(console.error);
                    }

                    // Initial fetch and poll every 30 seconds
                    fetchRecentTransactions();
                    setInterval(fetchRecentTransactions, 30000);

                    function generateTickerText() {
                        const iconContainer = document.getElementById('ticker-icon-container');
                        const defaultIconHtml = `
                            <div class="relative w-4 h-4 flex items-center justify-center text-amber-500">
                                <i class="fa-solid fa-bolt text-[10px] relative z-10 animate-pulse"></i>
                                <div class="absolute inset-0 bg-amber-400 rounded-full opacity-30 animate-ping"></div>
                            </div>
                        `;
                        window.defaultTickerIconHtml = defaultIconHtml;

                        let txToRender = null;

                        if (priorityQueue.length > 0) {
                            txToRender = priorityQueue.shift();
                        } else if (realTransactions.length > 0) {
                            txToRender = realTransactions[realTxIndex % realTransactions.length];
                            realTxIndex++;
                        }

                        if (txToRender) {
                            const tx = txToRender;
                            const action = actions[Math.floor(Math.random() * actions.length)];
                            
                            // Calculate time ago
                            const diffMs = new Date() - new Date(tx.date);
                            const diffMins = Math.floor(diffMs / 60000);
                            let timeStr = diffMins < 1 ? 'Just now' : (diffMins < 60 ? diffMins + 'm ago' : Math.floor(diffMins/60) + 'h ago');

                            if (iconContainer) {
                                if (tx.photoUrl) {
                                    iconContainer.innerHTML = `<img src="${tx.photoUrl}" class="w-5 h-5 rounded-full object-cover shadow-sm" onerror="this.outerHTML=window.defaultTickerIconHtml">`;
                                } else {
                                    iconContainer.innerHTML = defaultIconHtml;
                                }
                            }

                            return `<span class="font-bold text-slate-700">${tx.name}</span> ${action} <span class="text-indigo-700 font-extrabold">${tx.item}</span> <span class="text-slate-400 text-[9px] ml-1">${timeStr}</span>`;
                        }

                        if (iconContainer) iconContainer.innerHTML = defaultIconHtml;

                        const name = names[Math.floor(Math.random() * names.length)];
                        const action = actions[Math.floor(Math.random() * actions.length)];

                        let item = 'a USA Number'; // fallback

                        // Dynamically get available items from appData
                        let availableItems = [];
                        if (window.appData && window.appData.products) {
                            window.appData.products.forEach(p => {
                                if (p.stock) {
                                    if (p.plans && p.plans.length > 0) {
                                        p.plans.forEach(plan => availableItems.push(`${plan.name} ${p.name}`));
                                    } else if (p.category === 'proxy') {
                                        availableItems.push(`Premium Proxy`);
                                    } else {
                                        availableItems.push(p.name);
                                    }
                                }
                            });
                            // Add some generic number countries as they are always available via API
                            availableItems.push('a USA Number', 'a UK Number', 'a Telegram Number', 'an Indian Number');
                        } else {
                            availableItems = ['a USA Number', '7 days VPN', '30 days VPN', 'an Outlook Mail', 'an Edu Mail', 'High Quality Proxy'];
                        }

                        if (availableItems.length > 0) {
                            item = availableItems[Math.floor(Math.random() * availableItems.length)];
                        }

                        const time = Math.floor(Math.random() * 59) + 1;

                        return `<span class="font-bold text-slate-700">${name}</span> ${action} <span class="text-indigo-700 font-extrabold">${item}</span> <span class="text-slate-400 text-[9px] ml-1">${time}m ago</span>`;
                    }

                    function updateTicker() {
                        ticker.style.transition = 'none';
                        ticker.style.transform = 'translateY(150%)'; // Start below
                        ticker.style.opacity = '0';

                        setTimeout(() => {
                            ticker.innerHTML = generateTickerText();
                            ticker.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; // bouncy effect
                            ticker.style.transform = 'translateY(0)';
                            ticker.style.opacity = '1';
                        }, 50);

                        setTimeout(() => {
                            ticker.style.transition = 'all 0.4s ease-in';
                            ticker.style.transform = 'translateY(-150%)'; // Move up
                            ticker.style.opacity = '0';
                        }, 3200); // Wait then slide up
                    }

                    updateTicker();
                    setInterval(updateTicker, 3600); // Loop every 3.6 seconds
                });
            