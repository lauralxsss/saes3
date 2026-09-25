
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

