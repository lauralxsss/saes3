// ==========================================
// DONNÉES GLOBALES (Cartes)
// ==========================================
const marketData = {
    actions: [
        { nom: "Apple Inc.", ticker: "AAPL", prix: 175.50, devise: "$", hist: { "1J": "+1.2%", "7J": "+3.5%", "1M": "-2.1%", "6M": "+12.4%" } },
        { nom: "LVMH", ticker: "MC.PA", prix: 840.20, devise: "€", hist: { "1J": "-0.8%", "7J": "-1.5%", "1M": "+4.2%", "6M": "+8.1%" } },
        { nom: "TotalEnergies", ticker: "TTE", prix: 62.30, devise: "€", hist: { "1J": "+0.5%", "7J": "+2.1%", "1M": "+5.6%", "6M": "-1.2%" } },
        { nom: "Microsoft", ticker: "MSFT", prix: 330.10, devise: "$", hist: { "1J": "+2.5%", "7J": "+1.1%", "1M": "+4.5%", "6M": "+15.2%" } },
        { nom: "Tesla", ticker: "TSLA", prix: 210.80, devise: "$", hist: { "1J": "-1.2%", "7J": "-4.5%", "1M": "+8.2%", "6M": "-5.1%" } },
        { nom: "Amazon", ticker: "AMZN", prix: 135.40, devise: "$", hist: { "1J": "+0.9%", "7J": "+2.8%", "1M": "-1.5%", "6M": "+9.4%" } },
        { nom: "NVIDIA", ticker: "NVDA", prix: 450.20, devise: "$", hist: { "1J": "+3.1%", "7J": "+6.2%", "1M": "+12.5%", "6M": "+45.8%" } },
        { nom: "Alphabet", ticker: "GOOGL", prix: 130.50, devise: "$", hist: { "1J": "+0.4%", "7J": "+1.5%", "1M": "+2.1%", "6M": "+11.2%" } }
    ],
    indices: [
        { nom: "CAC 40", ticker: "^FCHI", prix: 7350.45, devise: "pts", hist: { "1J": "+0.4%", "7J": "-0.2%", "1M": "+2.8%", "6M": "+5.4%" } },
        { nom: "S&P 500", ticker: "^GSPC", prix: 4500.10, devise: "pts", hist: { "1J": "+1.1%", "7J": "+2.3%", "1M": "-1.0%", "6M": "+10.2%" } },
        { nom: "NASDAQ", ticker: "^IXIC", prix: 14000.20, devise: "pts", hist: { "1J": "+1.5%", "7J": "+3.1%", "1M": "+2.5%", "6M": "+15.8%" } },
        { nom: "Dow Jones", ticker: "^DJI", prix: 34500.80, devise: "pts", hist: { "1J": "+0.2%", "7J": "+0.5%", "1M": "-0.5%", "6M": "+4.2%" } },
        { nom: "DAX", ticker: "^GDAXI", prix: 15800.60, devise: "pts", hist: { "1J": "+0.8%", "7J": "+1.2%", "1M": "+3.1%", "6M": "+7.5%" } },
        { nom: "FTSE 100", ticker: "^FTSE", prix: 7400.30, devise: "pts", hist: { "1J": "-0.1%", "7J": "-0.5%", "1M": "+1.2%", "6M": "+2.1%" } }
    ],
    devises: [
        { nom: "Euro / Dollar", ticker: "EUR/USD", prix: 1.0850, devise: "$", hist: { "1J": "-0.2%", "7J": "+0.5%", "1M": "-1.1%", "6M": "+2.3%" } },
        { nom: "Euro / Yen", ticker: "EUR/JPY", prix: 158.40, devise: "¥", hist: { "1J": "+0.7%", "7J": "+1.2%", "1M": "+3.4%", "6M": "+6.8%" } },
        { nom: "Livre / Dollar", ticker: "GBP/USD", prix: 1.2540, devise: "$", hist: { "1J": "+0.1%", "7J": "-0.4%", "1M": "+1.1%", "6M": "+3.3%" } },
        { nom: "Euro / Livre", ticker: "EUR/GBP", prix: 0.8650, devise: "£", hist: { "1J": "-0.1%", "7J": "+0.2%", "1M": "-0.5%", "6M": "-1.2%" } }
    ],
    marches: [
        { nom: "Or", ticker: "XAU/USD", prix: 1950.40, devise: "$", hist: { "1J": "+0.5%", "7J": "+1.2%", "1M": "-2.4%", "6M": "+5.8%" } },
        { nom: "Pétrole WTI", ticker: "CL=F", prix: 85.20, devise: "$", hist: { "1J": "-1.2%", "7J": "+3.5%", "1M": "+8.2%", "6M": "+12.4%" } }
    ]
};

// ==========================================
// 1. ACTUALITÉS & AGENDA (via notre serveur)
// ==========================================
async function fetchFrenchNews() {
    const container = document.getElementById('news-container');
    if (!container) return;

    const fallbackArticles = [
        { title: "🔴 En direct : Suivez l'évolution du CAC 40", link: "#", source: "Boursorama", image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=500&q=60" },
        { title: "Analyse des marchés de la semaine", link: "#", source: "ZoneBourse", image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=500&q=60" }
    ];

    const renderArticles = (articles, isFallback = false) => {
        container.innerHTML = '';
        articles.forEach((article) => {
            const dateText = isFallback ? "En direct" : article.dateStr;
            container.innerHTML += `
                <div class="news-article">
                    <div class="news-image-container"><img src="${article.image}" alt="Actu" class="news-img"></div>
                    <div class="news-content">
                        <a href="${article.link}" target="_blank" style="text-decoration: none; font-weight: 500; transition: color 0.2s;">${article.title}</a>
                        <div class="news-meta"><span>${article.source}</span> • <span>${dateText}</span></div>
                    </div>
                </div>`;
        });
    };

    try {
        const response = await fetch('/api/news');
        if (!response.ok) throw new Error("HTTP " + response.status);
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 3);
        if (items.length === 0) throw new Error("Flux vide");

        const liveArticles = items.map((item, index) => {
            const dateObj = new Date(item.querySelector("pubDate")?.textContent);
            return {
                title: item.querySelector("title")?.textContent || "Titre indisponible",
                link: item.querySelector("link")?.textContent || "#",
                source: "Le Figaro Éco",
                dateStr: dateObj.toLocaleDateString('fr-FR') + ' à ' + dateObj.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
                image: fallbackArticles[index % fallbackArticles.length].image
            };
        });
        renderArticles(liveArticles, false);
    } catch (error) {
        console.warn("API actus indisponible.", error);
        renderArticles(fallbackArticles, true);
    }
}

async function fetchEconomicCalendar() {
    const container = document.getElementById('calendar-container');
    if (!container) return;

    try {
        // ✅ On passe par notre propre serveur (/api/calendar), pas par un proxy externe direct depuis le navigateur
        const response = await fetch('/api/calendar');
        if (!response.ok) throw new Error("HTTP " + response.status);
        const events = await response.json();

        const filteredEvents = events.filter(e => (e.impact === 'High' || e.impact === 'Medium') && ['USD','EUR','FR','DE'].includes(e.country));
        const now = new Date();
        const upcomingEvents = filteredEvents.filter(e => new Date(e.date) >= now).slice(0, 4);
        if (upcomingEvents.length === 0) throw new Error("Vide");

        container.innerHTML = '';
        const days = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
        upcomingEvents.forEach(e => {
            const eventDate = new Date(e.date);
            const timeStr = eventDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
            const isHigh = e.impact === 'High';
            container.innerHTML += `
                <div class="calendar-item">
                    <div class="cal-date">${days[eventDate.getDay()]}<br><span>${timeStr}</span></div>
                    <div class="cal-event">
                        <span class="event-title">[${e.country}] ${e.title.substring(0, 30)}...</span>
                        <span class="event-impact ${isHigh ? 'impact-high' : 'impact-medium'}">${isHigh ? 'Impact Fort' : 'Impact Moyen'}</span>
                    </div>
                </div>`;
        });
    } catch (error) {
        console.warn("API agenda indisponible.", error);
        container.innerHTML = `<p style="font-size:0.9rem; color:var(--text-secondary); text-align:center;">Aucun événement majeur à venir.</p>`;
    }
}

// ==========================================
// 2. SIMULATEUR DE MARCHÉ (Effet Flash)
// ==========================================
let marketInterval;
let isLive = false;

function formatVariation(valeur) {
    const isPositive = valeur.startsWith('+');
    const colorClass = isPositive ? 'positive' : 'negative';
    return `<span class="${colorClass}">${valeur}</span>`;
}

function flashElement(element, isUp) {
    const flashClass = isUp ? 'flash-up' : 'flash-down';
    element.classList.remove('flash-up', 'flash-down');
    void element.offsetWidth;
    element.classList.add(flashClass);
    setTimeout(() => element.classList.remove(flashClass), 1000);
}

function tickMarket() {
    if (!isLive) return;
    const changeElements = document.querySelectorAll('.change-up, .change-down');
    const elementsToTick = Array.from(changeElements).sort(() => 0.5 - Math.random()).slice(0, 3);

    elementsToTick.forEach(el => {
        let value = parseFloat(el.innerText.trim().replace(/[^0-9.-]+/g, ""));
        if (!isNaN(value)) {
            let variation = (Math.random() * 0.1) - 0.05;
            let newValue = (value + variation).toFixed(2);
            let isPositive = newValue >= 0;
            el.innerText = (isPositive ? '+' : '') + newValue + '%';
            el.className = isPositive ? 'change-up' : 'change-down';
            flashElement(el, isPositive);
        }
    });
}

// ==========================================
// 3. CARTES ET CAROUSEL
// ==========================================
function genererCartesModernes(donnees, containerId) {
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = '';
    donnees.forEach(actif => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header"><span class="asset-name">${actif.nom}</span><span class="asset-ticker">${actif.ticker}</span></div>
            <div class="price">${actif.prix.toFixed(2)} ${actif.devise}</div>
            <div class="history">
                <div><span>1 Jour:</span> ${formatVariation(actif.hist["1J"])}</div>
                <div><span>1 Mois:</span> ${formatVariation(actif.hist["1M"])}</div>
            </div>
            <a href="#" class="btn-trade">Trader ${actif.ticker}</a>
        `;
        container.appendChild(card);
    });
}

function initialiserCarrousels() {
    document.querySelectorAll('.prev-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const track = document.getElementById(btn.getAttribute('data-target'));
            if(track) track.scrollBy({ left: -320, behavior: 'smooth' });
        });
    });
    document.querySelectorAll('.next-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const track = document.getElementById(btn.getAttribute('data-target'));
            if(track) track.scrollBy({ left: 320, behavior: 'smooth' });
        });
    });
}

// ==========================================
// 4. CLASSEMENT DYNAMIQUE (Uniquement sur la page Classement)
// ==========================================
function initLeaderboard() {
    const INITIAL_CAPITAL = 100000;
    let traders = [];
    let filteredTraders = [];
    let currentPage = 1;
    const rowsPerPage = 20;

    const formatCurrency = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(val);
    const formatPercent = (val) => (val > 0 ? '+' : '') + new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' %';

    async function fetchRealLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard');
            if (!response.ok) throw new Error("HTTP erreur");
            processData(await response.json());
        } catch (error) {
            console.warn("Impossible de récupérer les joueurs, affichage vide.");
            processData([]);
        }
    }

    function processData(rawData) {
        rawData.forEach(p => {
            p.gain = p.value - INITIAL_CAPITAL;
            p.perf = (p.gain / INITIAL_CAPITAL) * 100;
        });
        rawData.sort((a, b) => b.value - a.value);
        rawData.forEach((p, i) => p.rank = i + 1);

        traders = rawData;
        filteredTraders = [...traders];
        updateUI();
    }

    function updateUI() {
        const count = filteredTraders.length;
        const countText = count <= 1 ? `${count} participant` : `${count} participants`;
        document.getElementById('global-count-subtitle').innerText = countText;
        document.getElementById('total-results').innerText = countText;
        renderTop3(count);
        renderTable(count);
    }

    function renderTop3(count) {
        const top3Section = document.getElementById('top3-section');
        top3Section.innerHTML = '';
        if (count === 0) { top3Section.classList.add('hidden'); return; }

        top3Section.classList.remove('hidden');
        filteredTraders.slice(0, 3).forEach((p, i) => {
            const color = ['gold', 'silver', 'bronze'][i];
            const perfClass = p.perf > 0 ? 'change-up' : (p.perf < 0 ? 'change-down' : '');
            top3Section.innerHTML += `
                <div class="top3-card">
                    <div class="top3-rank text-${color}">#${p.rank}</div>
                    <div class="top3-data">
                        <div class="top3-name">${p.name}</div>
                        <div class="top3-val num-font">${formatCurrency(p.value)}</div>
                        <div class="top3-perf ${perfClass}">${formatPercent(p.perf)}</div>
                    </div>
                </div>`;
        });
    }

    function renderTable(count) {
        const tbody = document.getElementById('leaderboard-body');
        const emptyState = document.getElementById('empty-state');
        const tableInfo = document.getElementById('page-range');
        const tableHeader = document.querySelector('thead');

        tbody.innerHTML = '';
        if (count === 0) {
            emptyState.classList.remove('hidden');
            tableHeader.classList.add('hidden');
            tableInfo.innerText = '0-0';
            updatePaginationButtons();
            return;
        }

        emptyState.classList.add('hidden');
        tableHeader.classList.remove('hidden');

        const startIdx = (currentPage - 1) * rowsPerPage;
        const endIdx = Math.min(startIdx + rowsPerPage, count);
        tableInfo.innerText = `${startIdx + 1}–${endIdx}`;

        filteredTraders.slice(startIdx, endIdx).forEach(p => {
            const tr = document.createElement('tr');
            const perfClass = p.perf > 0 ? 'change-up' : (p.perf < 0 ? 'change-down' : '');
            tr.innerHTML = `
                <td class="text-left text-secondary">#${p.rank}</td>
                <td class="text-left font-medium">${p.name}</td>
                <td class="num-font ${perfClass}">${formatPercent(p.perf)}</td>
                <td class="num-font">${formatCurrency(p.value)}</td>
                <td class="num-font ${perfClass}">${p.gain > 0 ? '+' : ''}${formatCurrency(p.gain)}</td>
                <td class="num-font text-secondary">${p.positions}</td>
            `;
            tbody.appendChild(tr);
        });
        updatePaginationButtons();
    }

    function updatePaginationButtons() {
        const totalPages = Math.ceil(filteredTraders.length / rowsPerPage);
        document.getElementById('btn-prev').disabled = currentPage === 1;
        document.getElementById('btn-next').disabled = currentPage === totalPages || totalPages === 0;
    }

    document.getElementById('trader-search')?.addEventListener('input', (e) => {
        filteredTraders = traders.filter(t => t.name.toLowerCase().includes(e.target.value.toLowerCase()));
        currentPage = 1;
        updateUI();
    });

    document.getElementById('btn-prev')?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(filteredTraders.length); } });
    document.getElementById('btn-next')?.addEventListener('click', () => { if (currentPage < Math.ceil(filteredTraders.length / rowsPerPage)) { currentPage++; renderTable(filteredTraders.length); } });

    fetchRealLeaderboard();
}

// ==========================================
// 5. ADMINISTRATION DES SESSIONS (page admin uniquement)
// ==========================================
async function loadAdminSessions() {
    try {
        const res = await fetch('/api/admin/sessions');
        if (!res.ok) throw new Error("Erreur de récupération");
        const sessions = await res.json();
        renderSessions(sessions);
    } catch (err) {
        console.error("Erreur chargement sessions", err);
    }
}

function renderSessions(sessions) {
    const container = document.getElementById('sessions-container');
    if (!container) return;

    container.innerHTML = '';

    if (!sessions || sessions.length === 0) {
        container.innerHTML = `<p class="text-secondary">Aucune session active.</p>`;
        return;
    }

    sessions.forEach(session => {
        const card = document.createElement('div');
        card.className = `session-fin-card ${!session.isActive ? 'closed' : ''}`;

        let studentsHtml = '';
        if (session.participants && session.participants.length > 0) {
            studentsHtml = session.participants.map(p => `
                <div class="student-row-item">
                    <span><strong>${p.name}</strong> <span class="text-secondary">(${p.email || 'N/A'})</span></span>
                    <span class="num-font">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(p.value)}</span>
                </div>
            `).join('');
        } else {
            studentsHtml = `<div class="text-secondary" style="font-size: 0.85rem; text-align: center; padding: 10px 0;">Aucun élève inscrit pour le moment.</div>`;
        }

        card.innerHTML = `
            <div>
                <div class="session-fin-top">
                    <div>
                        <h3 class="session-fin-name">${session.name}</h3>
                        <span class="session-fin-dates">Du ${session.startDate} au ${session.endDate}</span>
                    </div>
                    <span class="level-badge ${session.isActive ? 'expert' : 'debutant'}">${session.isActive ? 'Active' : 'Clôturée'}</span>
                </div>

                <div class="session-code-display">
                    <div>
                        <span class="session-code-label">Code d'accès unique</span>
                        <span class="session-code-val">${session.code}</span>
                    </div>
                    <button class="btn-outline copy-btn" data-code="${session.code}" style="padding: 6px 12px; font-size: 0.8rem;">
                        <i class="fa-solid fa-copy"></i> Copier
                    </button>
                </div>

                <div style="margin-bottom: 12px; font-size: 0.9rem; font-weight: 500; color: #fff; display: flex; justify-content: space-between;">
                    <span>Participants inscrits</span>
                    <strong>${session.participants ? session.participants.length : 0}</strong>
                </div>

                <div class="session-students-box">
                    <div class="student-mini-list">
                        ${studentsHtml}
                    </div>
                </div>
            </div>

            <div style="margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 12px; display: flex; justify-content: flex-end;">
                ${session.isActive ? `<button class="btn-danger-outline close-session-btn" data-id="${session.id}" style="padding: 6px 12px; font-size: 0.8rem;">Clôturer la session</button>` : ''}
            </div>
        `;

        const copyBtn = card.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const codeToCopy = copyBtn.getAttribute('data-code');
                navigator.clipboard.writeText(codeToCopy);
                alert(`Code ${codeToCopy} copié dans le presse-papier !`);
            });
        }

        const closeBtn = card.querySelector('.close-session-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                const sessionId = closeBtn.getAttribute('data-id');
                closeSession(sessionId);
            });
        }

        container.appendChild(card);
    });
}

async function closeSession(id) {
    if (confirm("Voulez-vous vraiment clôturer cette session ?")) {
        try {
            await fetch(`/api/admin/sessions/${id}/close`, { method: 'POST' });
            loadAdminSessions();
        } catch (err) {
            console.error("Erreur fermeture session", err);
        }
    }
}

function initAdminSessionsPage() {
    loadAdminSessions();

    const createModal = document.getElementById('create-modal');
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const sessionForm = document.getElementById('session-form');

    if (openModalBtn && createModal) {
        openModalBtn.addEventListener('click', () => {
            createModal.classList.remove('hidden');
        });
    }

    if (closeModalBtn && createModal) {
        closeModalBtn.addEventListener('click', () => {
            createModal.classList.add('hidden');
        });
    }

    if (sessionForm) {
        sessionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const body = {
                name: document.getElementById('session-name').value,
                startDate: document.getElementById('start-date').value,
                endDate: document.getElementById('end-date').value,
                initialCapital: document.getElementById('initial-capital').value
            };

            try {
                const res = await fetch('/api/admin/sessions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    createModal.classList.add('hidden');
                    sessionForm.reset();
                    loadAdminSessions();
                } else {
                    alert(data.message || "Erreur lors de la création de la session.");
                }
            } catch (err) {
                console.error("Erreur réseau :", err);
                alert("Erreur de connexion au serveur.");
            }
        });
    }

    setInterval(loadAdminSessions, 5000);
}

// ==========================================
// INITIALISATION GLOBALE DU SITE (un seul point d'entrée)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Accueil : actus + agenda
    fetchFrenchNews();
    fetchEconomicCalendar();

    // Simulateur de marché (ticker en direct)
    isLive = true;
    marketInterval = setInterval(tickMarket, 2000);

    // Cartes trader/investir
    genererCartesModernes(marketData.actions, 'actions-container');
    genererCartesModernes(marketData.indices, 'indices-container');
    genererCartesModernes(marketData.devises, 'devises-container');
    genererCartesModernes(marketData.marches, 'marches-container');
    initialiserCarrousels();

    // Page Classement (seulement si les éléments existent)
    if (document.getElementById('leaderboard-body')) {
        initLeaderboard();
    }

    // Page Admin Sessions (seulement si les éléments existent)
    if (document.getElementById('sessions-container')) {
        initAdminSessionsPage();
    }

    // Pages Connexion / Inscription : afficher/masquer le mot de passe
    const toggleBtn = document.getElementById('toggle-password');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const pwd = document.getElementById('password');
            const isHidden = pwd.type === 'password';
            pwd.type = isHidden ? 'text' : 'password';
        });
    }
});