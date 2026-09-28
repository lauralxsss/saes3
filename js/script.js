// Données fictives (Placeholder)
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
// 1. GESTION DES ACTUALITÉS (Anti-panique RSS)
// ==========================================
async function fetchFrenchNews() {
    const container = document.getElementById('news-container');
    if (!container) return;

    const fallbackArticles = [
        { title: "🔴 En direct : Suivez l'évolution du CAC 40 et des actions", link: "https://www.boursorama.com/", source: "Boursorama", image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=500&q=60" },
        { title: "Toutes les dernières actualités économiques et financières", link: "https://www.lesechos.fr/", source: "Les Échos", image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=500&q=60" },
        { title: "Analyse des marchés : Quelles sont les tendances de la semaine ?", link: "https://www.zonebourse.com/", source: "ZoneBourse", image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=500&q=60" }
    ];

    const renderArticles = (articles, isFallback = false) => {
        container.innerHTML = '';
        articles.forEach((article) => {
            const dateText = isFallback ? "En direct" : article.dateStr;
            container.innerHTML += `
                <div class="news-article">
                    <div class="news-image-container">
                        <img src="${article.image}" alt="Actu" class="news-img">
                    </div>
                    <div class="news-content">
                        <a href="${article.link}" target="_blank" style="text-decoration: none; font-weight: 500; transition: color 0.2s;">
                            ${article.title}
                        </a>
                        <div class="news-meta"><span>${article.source}</span> • <span>${dateText}</span></div>
                    </div>
                </div>`;
        });
    };

    try {
        const response = await fetch('/api/news');
        if (!response.ok) throw new Error("Requête HTTP échouée : " + response.status);

        // Lecture du XML renvoyé par notre serveur
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        
        // Récupération des 3 premiers articles
        const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 3);
        if (items.length === 0) throw new Error("Flux vide");

        const liveArticles = items.map((item, index) => {
            const pubDate = item.querySelector("pubDate")?.textContent;
            const dateObj = new Date(pubDate);
            return {
                title: item.querySelector("title")?.textContent || "Titre indisponible",
                link: item.querySelector("link")?.textContent || "#",
                source: "Yahoo Finance",
                dateStr: dateObj.toLocaleDateString('fr-FR') + ' à ' + dateObj.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
                image: fallbackArticles[index % fallbackArticles.length].image
            };
        });
        
        renderArticles(liveArticles, false);
    } catch (error) {
        console.warn("API actus indisponible. Activation des liens de secours.", error);
        renderArticles(fallbackArticles, true);
    }
}

// ==========================================
// 2. AGENDA ÉCONOMIQUE EN TEMPS RÉEL
// ==========================================
// ==========================================
// 2. AGENDA ÉCONOMIQUE EN TEMPS RÉEL (Méthode Codetabs)
// ==========================================
async function fetchEconomicCalendar() {
    const container = document.getElementById('calendar-container');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; padding:15px; color:var(--text-secondary);"><i class="fa-solid fa-spinner fa-spin"></i> Chargement de l\'agenda...</p>';

    try {
        // Tentative avec le flux JSON de ForexFactory et le proxy Codetabs (exactement comme pour tes actus au début)
        const targetUrl = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
        const apiUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Bloqué par le réseau ou le navigateur");

        const events = await response.json();

        // On filtre pour ne garder que les événements importants de l'Euro et du Dollar
        const filteredEvents = events.filter(e =>
            (e.impact === 'High' || e.impact === 'Medium') &&
            (e.country === 'USD' || e.country === 'EUR' || e.country === 'FR' || e.country === 'DE')
        );

        // On ne garde que les 4 prochains événements
        const now = new Date();
        const upcomingEvents = filteredEvents.filter(e => new Date(e.date) >= now).slice(0, 4);

        if (upcomingEvents.length === 0) throw new Error("Pas d'événements majeurs à venir");

        container.innerHTML = '';
        const days = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];

        upcomingEvents.forEach(e => {
            const eventDate = new Date(e.date);
            const dayName = days[eventDate.getDay()];
            const timeStr = eventDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});

            const isHigh = e.impact === 'High';
            const impactClass = isHigh ? 'impact-high' : 'impact-medium';
            const impactText = isHigh ? 'Impact Fort' : 'Impact Moyen';

            // Traduction des termes principaux
            let title = e.title
                .replace(/Unemployment Claims/gi, 'Inscriptions au chômage')
                .replace(/Fed Chair/gi, 'Président de la Fed')
                .replace(/Speaks/gi, 'Discours')
                .replace(/PMI/gi, 'Indice PMI')
                .replace(/CPI/gi, 'Inflation (IPC)')
                .replace(/GDP/gi, 'PIB (Croissance)')
                .replace(/Monetary Policy/gi, 'Politique Monétaire')
                .replace(/Rate/gi, 'Taux directeur');

            container.innerHTML += `
                <div class="calendar-item">
                    <div class="cal-date">${dayName}<br><span>${timeStr}</span></div>
                    <div class="cal-event">
                        <span class="event-title">[${e.country}] ${title}</span>
                        <span class="event-impact ${impactClass}">${impactText}</span>
                    </div>
                </div>`;
        });

    } catch (error) {
        console.warn("⚠️ API Agenda bloquée. Activation du plan B.", error);

        // Si l'IUT bloque Codetabs, on met des fausses dates réalistes
        const days = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
        const now = new Date();
        
        const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const tomorrowMorning = new Date(now); 
        tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
        tomorrowMorning.setHours(9, 30);
        
        const tomorrowAfternoon = new Date(tomorrowMorning);
        tomorrowAfternoon.setHours(14, 15);

        container.innerHTML = `
            <div class="calendar-item">
                <div class="cal-date">${days[now.getDay()]}<br><span>${inTwoHours.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span></div>
                <div class="cal-event">
                    <span class="event-title">[USD] Taux d'inflation (IPC) / Emploi</span>
                    <span class="event-impact impact-high">Impact Fort</span>
                </div>
            </div>
            <div class="calendar-item">
                <div class="cal-date">${days[tomorrowMorning.getDay()]}<br><span>${tomorrowMorning.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span></div>
                <div class="cal-event">
                    <span class="event-title">[EUR] Indice PMI (Allemagne / Zone Euro)</span>
                    <span class="event-impact impact-medium">Impact Moyen</span>
                </div>
            </div>
            <div class="calendar-item">
                <div class="cal-date">${days[tomorrowMorning.getDay()]}<br><span>${tomorrowAfternoon.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span></div>
                <div class="cal-event">
                    <span class="event-title">[EUR] Discours politique monétaire (BCE)</span>
                    <span class="event-impact impact-high">Impact Fort</span>
                </div>
            </div>`;
    }
}

// ==========================================
// 3. SIMULATEUR DE MARCHÉ (Effet Flash)
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
        let text = el.innerText.trim();
        let value = parseFloat(text.replace(/[^0-9.-]+/g, ""));

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

function switchMode(mode) {
    const btnLive = document.getElementById('btn-live');
    const btnWeekly = document.getElementById('btn-weekly');
    const indicator = document.getElementById('mode-indicator');

    if (!btnLive || !btnWeekly) return;

    if (mode === 'live') {
        isLive = true;
        btnLive.style.background = 'linear-gradient(135deg, #2962FF, #1E4BD8)';
        btnLive.style.color = 'white';
        btnLive.style.border = 'none';
        btnWeekly.style.background = 'transparent';
        btnWeekly.style.color = 'var(--text-main)';
        btnWeekly.style.border = '1px solid var(--border-color)';
        if(indicator) indicator.innerHTML = "<span class='status-dot'></span> Mode : Temps Réel (Live)";

        marketInterval = setInterval(tickMarket, 1500);
    } else {
        isLive = false;
        clearInterval(marketInterval);

        btnWeekly.style.background = 'var(--color-primary)';
        btnWeekly.style.color = 'white';
        btnWeekly.style.border = 'none';
        btnLive.style.background = 'transparent';
        btnLive.style.color = 'var(--text-main)';
        btnLive.style.border = '1px solid var(--border-color)';
        if(indicator) indicator.innerHTML = "<span class='status-dot' style='background: #787B86; box-shadow: none;'></span> Mode : Bilan Semaine 4";
    }
}

// ==========================================
// 4. GÉNÉRATION DES CARTES (Trader & Investir)
// ==========================================
function genererCartesModernes(donnees, containerId) {
    const container = document.getElementById(containerId);
    if(!container) return;

    container.innerHTML = '';
    donnees.forEach(actif => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <span class="asset-name">${actif.nom}</span>
                <span class="asset-ticker">${actif.ticker}</span>
            </div>
            <div class="price">${actif.prix.toFixed(2)} ${actif.devise}</div>
            <div class="history">
                <div><span>1 Jour:</span> ${formatVariation(actif.hist["1J"])}</div>
                <div><span>7 Jours:</span> ${formatVariation(actif.hist["7J"])}</div>
                <div><span>1 Mois:</span> ${formatVariation(actif.hist["1M"])}</div>
                <div><span>6 Mois:</span> ${formatVariation(actif.hist["6M"])}</div>
            </div>
            <a href="#" class="btn-trade">Trader ${actif.ticker}</a>
        `;
        container.appendChild(card);
    });
}

function initialiserCarrousels() {
    const prevBtns = document.querySelectorAll('.prev-btn');
    const nextBtns = document.querySelectorAll('.next-btn');

    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const track = document.getElementById(btn.getAttribute('data-target'));
            if(track) track.scrollBy({ left: -320, behavior: 'smooth' });
        });
    });

    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const track = document.getElementById(btn.getAttribute('data-target'));
            if(track) track.scrollBy({ left: 320, behavior: 'smooth' });
        });
    });
}

// ==========================================
// 5. INITIALISATION GLOBALE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    fetchFrenchNews();
    fetchEconomicCalendar();

    // Rafraîchissement automatique
    setInterval(fetchFrenchNews, 5 * 60 * 1000);       // toutes les 5 mins
    setInterval(fetchEconomicCalendar, 30 * 60 * 1000); // toutes les 30 mins

    if (document.getElementById('btn-live')) {
        switchMode('live');
    } else {
        isLive = true;
        marketInterval = setInterval(tickMarket, 2000);
    }

    genererCartesModernes(marketData.actions, 'actions-container');
    genererCartesModernes(marketData.indices, 'indices-container');
    genererCartesModernes(marketData.devises, 'devises-container');
    genererCartesModernes(marketData.marches, 'marches-container');

    initialiserCarrousels();

    // ==========================================
    // 6. FORMULAIRES (Connexion & Inscription)
    // ==========================================
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const toggleBtn = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('password');
        const eyeIcon = document.getElementById('eye-icon');

        toggleBtn.addEventListener('click', () => {
            const isHidden = passwordInput.type === 'password';
            passwordInput.type = isHidden ? 'text' : 'password';
            eyeIcon.innerHTML = isHidden
            ? '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.6 21.6 0 0 1 5.06-5.94M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 7 11 7a21.7 21.7 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
            : '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>';
        });

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Connexion simulée.');
        });
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        const toggleBtnSignUp = document.getElementById('toggle-password');
        const passwordInputSignUp = document.getElementById('password');
        const eyeIconSignUp = document.getElementById('eye-icon');

        toggleBtnSignUp.addEventListener('click', () => {
            const isHidden = passwordInputSignUp.type === 'password';
            passwordInputSignUp.type = isHidden ? 'text' : 'password';
            eyeIconSignUp.innerHTML = isHidden
            ? '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.6 21.6 0 0 1 5.06-5.94M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 7 11 7a21.7 21.7 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
            : '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>';
        });

        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Inscription simulée.');
        });
    }
});