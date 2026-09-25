
document.addEventListener('DOMContentLoaded', () => {
    genererCartes(marketData.actions, 'actions-container');
    genererCartes(marketData.indices, 'indices-container');
    genererCartes(marketData.devises, 'devises-container');

    // --- 1. GESTION DE L'AUTHENTIFICATION ---
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userMenu = document.getElementById('user-menu');
    const navPortfolio = document.getElementById('nav-portfolio');

    // Connexion
    loginBtn.addEventListener('click', () => {
        loginBtn.style.display = 'none';
        userMenu.style.display = 'flex';
        navPortfolio.style.display = 'block';
    });

    // Déconnexion
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Empêche le lien de remonter en haut de page
        userMenu.style.display = 'none';
        loginBtn.style.display = 'block';
        navPortfolio.style.display = 'none';
    });

    // --- 2. RÉCUPÉRATION DES ACTUALITÉS ---
    fetchFrenchNews();
});


async function fetchFrenchNews() {
    const container = document.getElementById('news-container');

    // Le Plan B : De VRAIS liens vers les sites officiels en direct.
    // Si l'API est bloquée, les étudiants pourront quand même cliquer et lire les vraies infos du jour.
    const fallbackArticles = [
        {
            title: "🔴 En direct : Suivez l'évolution du CAC 40 et des actions",
            link: "https://www.boursorama.com/bourse/actions/palmares/france/page-1",
            source: "Boursorama",
            image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"
        },
        {
            title: "Toutes les dernières actualités économiques et financières",
            link: "https://www.lesechos.fr/finance-marches",
            source: "Les Échos",
            image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"
        },
        {
            title: "Crypto-monnaies : Le point sur le Bitcoin et l'Ethereum aujourd'hui",
            link: "https://fr.cryptonews.com/",
            source: "CryptoNews",
            image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"
        },
        {
            title: "Analyse des marchés : Quelles sont les tendances de la semaine ?",
            link: "https://www.zonebourse.com/actualite-bourse/",
            source: "ZoneBourse",
            image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"
        }
    ];

    // Fonction interne pour générer l'affichage HTML
    const renderArticles = (articles, isFallback = false) => {
        container.innerHTML = '';
        articles.forEach((article) => {
            // Si on utilise le plan B, on affiche "En direct" à la place de l'heure
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
        // Tentative avec le flux RSS de Yahoo Finance et le proxy Codetabs (très peu bloqué)
        const rssUrl = 'https://fr.finance.yahoo.com/actualites/rss';
        const apiUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Bloqué par le réseau ou le navigateur");

        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 4);
        if (items.length === 0) throw new Error("Flux vide");

        // On formate les vrais articles récupérés
        const liveArticles = items.map((item, index) => {
            const dateObj = new Date(item.querySelector("pubDate")?.textContent);
            return {
                title: item.querySelector("title")?.textContent || "Titre indisponible",
                link: item.querySelector("link")?.textContent || "#",
                source: "Yahoo Finance",
                dateStr: dateObj.toLocaleDateString('fr-FR') + ' à ' + dateObj.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
                // On utilise les belles images de secours pour illustrer
                image: fallbackArticles[index % fallbackArticles.length].image
            };
        });

        // On affiche les vraies infos
        renderArticles(liveArticles, false);

    } catch (error) {
        console.warn("⚠️ API bloquée par le navigateur ou le Wi-Fi. Activation des liens de secours cliquables.");
        // Si ça bloque, on affiche nos VRAIS LIENS vers Boursorama, Les Échos, etc.
        renderArticles(fallbackArticles, true);
    }
}


// données fictives placeholder
const marketData = {
    actions: [
        { nom: "Apple Inc.", ticker: "AAPL", prix: 175.50, devise: "€", hist: { "1J": "+1.2%", "7J": "+3.5%", "1M": "-2.1%", "6M": "+12.4%" } },
        { nom: "LVMH", ticker: "MC.PA", prix: 840.20, devise: "€", hist: { "1J": "-0.8%", "7J": "-1.5%", "1M": "+4.2%", "6M": "+8.1%" } },
        { nom: "TotalEnergies", ticker: "TTE", prix: 62.30, devise: "€", hist: { "1J": "+0.5%", "7J": "+2.1%", "1M": "+5.6%", "6M": "-1.2%" } }
    ],
    indices: [
        { nom: "CAC 40", ticker: "^FCHI", prix: 7350.45, devise: "pts", hist: { "1J": "+0.4%", "7J": "-0.2%", "1M": "+2.8%", "6M": "+5.4%" } },
        { nom: "S&P 500", ticker: "^GSPC", prix: 4500.10, devise: "pts", hist: { "1J": "+1.1%", "7J": "+2.3%", "1M": "-1.0%", "6M": "+10.2%" } }
    ],
    devises: [
        { nom: "Euro / Dollar", ticker: "EUR/USD", prix: 1.0850, devise: "$", hist: { "1J": "-0.2%", "7J": "+0.5%", "1M": "-1.1%", "6M": "+2.3%" } },
        { nom: "Euro / Yen", ticker: "EUR/JPY", prix: 158.40, devise: "¥", hist: { "1J": "+0.7%", "7J": "+1.2%", "1M": "+3.4%", "6M": "+6.8%" } }
    ]
};


// fonctions necessaires a la validation du format de la data
function formatVariation(valeur) {
    const isPositive = valeur.startsWith('+');
    const colorClass = isPositive ? 'positive' : 'negative';
    return `<span class="${colorClass}">${valeur}</span>`;
}

function genererCartes(donnees, containerId) {
    const container = document.getElementById(containerId);
    
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

            <button class="btn-trade" onclick="alert('Ouvrir le module de passage d\\'ordre pour ${actif.ticker}')">
                Trader ${actif.ticker}
            </button>
        `;
        
        container.appendChild(card);
    });
}


// 2. Fonction pour simuler l'agenda économique
function simulateCalendar() {
    const container = document.getElementById('calendar-container');
    container.innerHTML = '<p style="text-align:center; padding:15px; color:#94A3B8;"><i class="fa-solid fa-spinner fa-spin"></i> Actualisation...</p>';
    
    setTimeout(() => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextDay = new Date(today);
        nextDay.setDate(nextDay.getDate() + 2);
        
        const days = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
        
        container.innerHTML = `
            <div class="calendar-item">
                <div class="cal-date">${days[today.getDay()]}<br><span>14:30</span></div>
                <div class="cal-event">
                    <span class="event-title">Taux d'inflation (USA)</span>
                    <span class="event-impact impact-high">Impact Fort</span>
                </div>
            </div>
            <div class="calendar-item">
                <div class="cal-date">${days[tomorrow.getDay()]}<br><span>09:00</span></div>
                <div class="cal-event">
                    <span class="event-title">Discours BCE (Europe)</span>
                    <span class="event-impact impact-medium">Impact Moyen</span>
                </div>
            </div>
            <div class="calendar-item">
                <div class="cal-date">${days[nextDay.getDay()]}<br><span>22:00</span></div>
                <div class="cal-event">
                    <span class="event-title">Résultats financiers Trimestriels</span>
                    <span class="event-impact impact-high">Impact Fort</span>
                </div>
            </div>`;
    }, 800);
}

// Lancement au chargement
document.addEventListener('DOMContentLoaded', () => {
    fetchFrenchNews();
    simulateCalendar();
});



document.addEventListener('DOMContentLoaded', async () => {
    const extendedActions = [
        { nom: "Apple Inc.", ticker: "AAPL", prix: 175.50, devise: "$", hist: { "1J": "+1.2%", "7J": "+3.5%", "1M": "-2.1%", "6M": "+12.4%" } },
        { nom: "LVMH", ticker: "MC.PA", prix: 840.20, devise: "€", hist: { "1J": "-0.8%", "7J": "-1.5%", "1M": "+4.2%", "6M": "+8.1%" } },
        { nom: "TotalEnergies", ticker: "TTE", prix: 62.30, devise: "€", hist: { "1J": "+0.5%", "7J": "+2.1%", "1M": "+5.6%", "6M": "-1.2%" } },
        { nom: "Microsoft", ticker: "MSFT", prix: 330.10, devise: "$", hist: { "1J": "+2.5%", "7J": "+1.1%", "1M": "+4.5%", "6M": "+15.2%" } },
        { nom: "Tesla", ticker: "TSLA", prix: 210.80, devise: "$", hist: { "1J": "-1.2%", "7J": "-4.5%", "1M": "+8.2%", "6M": "-5.1%" } },
        { nom: "Amazon", ticker: "AMZN", prix: 135.40, devise: "$", hist: { "1J": "+0.9%", "7J": "+2.8%", "1M": "-1.5%", "6M": "+9.4%" } },
        { nom: "NVIDIA", ticker: "NVDA", prix: 450.20, devise: "$", hist: { "1J": "+3.1%", "7J": "+6.2%", "1M": "+12.5%", "6M": "+45.8%" } },
        { nom: "Alphabet", ticker: "GOOGL", prix: 130.50, devise: "$", hist: { "1J": "+0.4%", "7J": "+1.5%", "1M": "+2.1%", "6M": "+11.2%" } }
    ];

    const extendedIndices = [
        { nom: "CAC 40", ticker: "^FCHI", prix: 7350.45, devise: "pts", hist: { "1J": "+0.4%", "7J": "-0.2%", "1M": "+2.8%", "6M": "+5.4%" } },
        { nom: "S&P 500", ticker: "^GSPC", prix: 4500.10, devise: "pts", hist: { "1J": "+1.1%", "7J": "+2.3%", "1M": "-1.0%", "6M": "+10.2%" } },
        { nom: "NASDAQ", ticker: "^IXIC", prix: 14000.20, devise: "pts", hist: { "1J": "+1.5%", "7J": "+3.1%", "1M": "+2.5%", "6M": "+15.8%" } },
        { nom: "Dow Jones", ticker: "^DJI", prix: 34500.80, devise: "pts", hist: { "1J": "+0.2%", "7J": "+0.5%", "1M": "-0.5%", "6M": "+4.2%" } },
        { nom: "DAX", ticker: "^GDAXI", prix: 15800.60, devise: "pts", hist: { "1J": "+0.8%", "7J": "+1.2%", "1M": "+3.1%", "6M": "+7.5%" } },
        { nom: "FTSE 100", ticker: "^FTSE", prix: 7400.30, devise: "pts", hist: { "1J": "-0.1%", "7J": "-0.5%", "1M": "+1.2%", "6M": "+2.1%" } },
        { nom: "Nikkei 225", ticker: "^N225", prix: 32000.50, devise: "pts", hist: { "1J": "+1.2%", "7J": "+2.5%", "1M": "+4.8%", "6M": "+18.2%" } },
        { nom: "Hang Seng", ticker: "^HSI", prix: 18000.10, devise: "pts", hist: { "1J": "-1.5%", "7J": "-3.2%", "1M": "-5.5%", "6M": "-12.4%" } }
    ];

    const fallbackDevises = [
        { nom: "Euro / Dollar", ticker: "EUR/USD", prix: 1.0850, devise: "$", hist: { "1J": "-0.2%", "7J": "+0.5%", "1M": "-1.1%", "6M": "+2.3%" } },
        { nom: "Euro / Yen", ticker: "EUR/JPY", prix: 158.40, devise: "¥", hist: { "1J": "+0.7%", "7J": "+1.2%", "1M": "+3.4%", "6M": "+6.8%" } },
        { nom: "Livre / Dollar", ticker: "GBP/USD", prix: 1.2540, devise: "$", hist: { "1J": "+0.1%", "7J": "-0.4%", "1M": "+1.1%", "6M": "+3.3%" } },
        { nom: "Euro / Livre", ticker: "EUR/GBP", prix: 0.8650, devise: "£", hist: { "1J": "-0.1%", "7J": "+0.2%", "1M": "-0.5%", "6M": "-1.2%" } },
        { nom: "Dollar / Yen", ticker: "USD/JPY", prix: 145.20, devise: "¥", hist: { "1J": "+0.5%", "7J": "+1.1%", "1M": "+2.5%", "6M": "+8.4%" } },
        { nom: "Aussie / Dollar", ticker: "AUD/USD", prix: 0.6420, devise: "$", hist: { "1J": "-0.4%", "7J": "-1.2%", "1M": "-2.1%", "6M": "-4.5%" } },
        { nom: "Euro / Suisse", ticker: "EUR/CHF", prix: 0.9540, devise: "Fr", hist: { "1J": "+0.2%", "7J": "+0.1%", "1M": "-0.8%", "6M": "-2.3%" } },
        { nom: "Dollar / CAD", ticker: "USD/CAD", prix: 1.3520, devise: "$", hist: { "1J": "+0.3%", "7J": "+0.8%", "1M": "+1.5%", "6M": "+2.8%" } }
    ];

    const fallbackMarches = [
        { nom: "Or", ticker: "XAU/USD", prix: 1950.40, devise: "$", hist: { "1J": "+0.5%", "7J": "+1.2%", "1M": "-2.4%", "6M": "+5.8%" } },
        { nom: "Pétrole WTI", ticker: "CL=F", prix: 85.20, devise: "$", hist: { "1J": "-1.2%", "7J": "+3.5%", "1M": "+8.2%", "6M": "+12.4%" } },
        { nom: "Bitcoin", ticker: "BTC", prix: 42000.50, devise: "$", hist: { "1J": "+2.1%", "7J": "-4.5%", "1M": "+15.2%", "6M": "+45.8%" } },
        { nom: "Ethereum", ticker: "ETH", prix: 2200.10, devise: "$", hist: { "1J": "+1.5%", "7J": "-2.8%", "1M": "+10.5%", "6M": "+38.4%" } },
        { nom: "Argent", ticker: "XAG/USD", prix: 23.50, devise: "$", hist: { "1J": "-0.4%", "7J": "+0.8%", "1M": "-4.1%", "6M": "+2.1%" } },
        { nom: "Cuivre", ticker: "HG=F", prix: 3.80, devise: "$", hist: { "1J": "+0.2%", "7J": "-1.5%", "1M": "+2.2%", "6M": "-1.8%" } },
        { nom: "Gaz Naturel", ticker: "NG=F", prix: 2.90, devise: "$", hist: { "1J": "-2.5%", "7J": "-5.2%", "1M": "+12.4%", "6M": "-15.2%" } },
        { nom: "Blé", ticker: "ZW=F", prix: 590.25, devise: "¢", hist: { "1J": "+1.1%", "7J": "+2.4%", "1M": "-3.8%", "6M": "-10.5%" } }
    ];

    const actionsContainer = document.getElementById('actions-container');
    const indicesContainer = document.getElementById('indices-container');
    
    if (actionsContainer) actionsContainer.innerHTML = '';
    if (indicesContainer) indicesContainer.innerHTML = '';

    genererCartesModernes(extendedActions, 'actions-container');
    genererCartesModernes(extendedIndices, 'indices-container');

    const devisesContainer = document.getElementById('devises-container');
    const marchesContainer = document.getElementById('marches-container');
    
    if (devisesContainer) devisesContainer.innerHTML = '';
    if (marchesContainer) marchesContainer.innerHTML = '';

    try {
        const response = await fetch("https://api.binance.com/api/v3/ticker/24hr");
        const data = await response.json();

        const marchesSymbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "SOLUSDT", "DOGEUSDT", "DOTUSDT"];
        const devisesSymbols = ["EURUSDT", "GBPUSDT", "AUDUSDT", "NZDUSDT"]; 

        const marchesData = data.filter(d => marchesSymbols.includes(d.symbol)).map(formatBinanceData);
        let devisesData = data.filter(d => devisesSymbols.includes(d.symbol)).map(formatBinanceData);

        if(devisesData.length < 8) {
            devisesData = [...devisesData, ...fallbackDevises].slice(0, 8);
        }

        genererCartesModernes(devisesData, 'devises-container');
        genererCartesModernes(marchesData, 'marches-container');
    } catch (error) {
        genererCartesModernes(fallbackDevises, 'devises-container');
        genererCartesModernes(fallbackMarches, 'marches-container');
    }

    initialiserCarrousels();
});

function formatBinanceData(item) {
    const price = parseFloat(item.lastPrice);
    const change = parseFloat(item.priceChangePercent);
    const sign = change >= 0 ? '+' : '';
    return {
        nom: item.symbol.replace('USDT', ''),
        ticker: item.symbol,
        prix: price,
        devise: "$",
        hist: {
            "1J": sign + change.toFixed(2) + "%",
            "7J": "N/D",
            "1M": "N/D",
            "6M": "N/D"
        }
    };
}

function genererCartesModernes(donnees, containerId) {
    const container = document.getElementById(containerId);
    if(!container) return;
    
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
            track.scrollBy({ left: -320, behavior: 'smooth' });
        });
    });

    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const track = document.getElementById(btn.getAttribute('data-target'));
            track.scrollBy({ left: 320, behavior: 'smooth' });
        });
    });
}


/* --------------------------------------------- Page Connexion ----------------------------------------------------- */

const form = document.getElementById('login-form');
const toggleBtn = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');
const eyeIcon = document.getElementById('eye-icon');

// Bascule l'affichage du mot de passe entre masqué (password) et visible (text)
toggleBtn.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';

    // Mise à jour des attributs d'accessibilité (lecteurs d'écran)
    toggleBtn.setAttribute('aria-pressed', String(isHidden));
    toggleBtn.setAttribute('aria-label', isHidden ? 'Masquer le mot de passe' : 'Afficher le mot de passe');

    // Change l'icône : œil ouvert quand le mot de passe est visible, œil barré quand il est masqué
    eyeIcon.innerHTML = isHidden
    ? '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.6 21.6 0 0 1 5.06-5.94M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 7 11 7a21.7 21.7 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>';
});

// Affiche ou masque le message d'erreur d'un champ en ajoutant/retirant la classe CSS "has-error"
function setError(fieldId, show){
    document.getElementById(fieldId).classList.toggle('has-error', show);
}

form.addEventListener('submit', (e) => {
    e.preventDefault(); // empêche le rechargement de la page (pas de backend relié pour l'instant)

    const identifiant = document.getElementById('identifiant');
    const password = document.getElementById('password');
    let valid = true;

    // Simple champ requis (fini la vérification de format email, l'identifiant n'a plus de type="email")
    if (!identifiant.checkValidity()) { setError('field-identifiant', true); valid = false; }
    else { setError('field-identifiant', false); }

    if (!password.checkValidity()) { setError('field-password', true); valid = false; }
    else { setError('field-password', false); }

    // Si tous les champs sont valides, on simule l'envoi (à remplacer par un vrai appel au backend)
    if (valid) {
        form.reset();
        alert('Connexion simulée : aucun backend n\'est relié à ce formulaire.');
    }
});


/* ---------------------------------------------------- Page Inscription ------------------------------------------------- */

const form = document.getElementById('signup-form');
const toggleBtn = document.getElementById('toggle-password');
const passwordInput = document.getElementById('password');
const eyeIcon = document.getElementById('eye-icon');

// Bascule l'affichage du mot de passe entre masqué (password) et visible (text)
toggleBtn.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    // Si le champ était masqué, on le passe en clair, et inversement
    passwordInput.type = isHidden ? 'text' : 'password';

    // Mise à jour des attributs d'accessibilité (lecteurs d'écran)
    toggleBtn.setAttribute('aria-pressed', String(isHidden));
    toggleBtn.setAttribute('aria-label', isHidden ? 'Masquer le mot de passe' : 'Afficher le mot de passe');

    // Change l'icône : œil ouvert quand le mot de passe est visible, œil barré quand il est masqué
    eyeIcon.innerHTML = isHidden
    ? '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.6 21.6 0 0 1 5.06-5.94M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 7 11 7a21.7 21.7 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>';
});

// Affiche ou masque le message d'erreur d'un champ en ajoutant/retirant la classe CSS "has-error"
function setError(fieldId, show){
    document.getElementById(fieldId).classList.toggle('has-error', show);
}

form.addEventListener('submit', (e) => {
    e.preventDefault(); // on gère la validation nous-mêmes, pas de rechargement de page

    // Liste des champs à vérifier : [id du champ, id du bloc .field associé (pour l'erreur)]
    // Mise à jour : pseudo + identifiant + mot de passe (fini nom/prénom/naissance/email)
    const fields = [
        ['pseudo', 'field-pseudo'],
        ['identifiant', 'field-identifiant'],
        ['password', 'field-password'],
    ];
    let valid = true;

    // On boucle sur tous les champs plutôt que de dupliquer le if/else pour chacun
    fields.forEach(([id, fieldId]) => {
        const input = document.getElementById(id);
        const ok = input.checkValidity(); // utilise les règles HTML natives (required, minlength...)
        setError(fieldId, !ok);
        if (!ok) valid = false;
    });

    // Tous les champs sont valides -> simulation d'envoi (à remplacer par l'appel réel au backend d'inscription)
    if (valid) {
        form.reset();
        alert('Inscription simulée : aucun backend n\'est relié à ce formulaire.');
    }
});
