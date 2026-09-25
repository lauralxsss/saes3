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
    const url = 'https://newsdata.io/api/1/latest?apikey=pub_4d6d2165e3f746d2bd6f579688055847&q=bourse&country=fr&language=fr';

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erreur réseau");
        const data = await response.json();
        
        container.innerHTML = '';
        const articles = data.results.slice(0, 4);

        articles.forEach(article => {
            const dateObj = new Date(article.pubDate);
            const date = dateObj.toLocaleDateString('fr-FR') + ' à ' + dateObj.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
            
            container.innerHTML += `
                <div class="news-article">
                    <a href="${article.link}" target="_blank">${article.title}</a>
                    <div class="news-meta">
                        <span>${article.source_id || "Actualité"}</span> • <span>${date}</span>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        container.innerHTML = `
            <div class="news-article">
                <a href="#" target="_blank">Les marchés européens ouvrent en hausse ce matin</a>
                <div class="news-meta"><span>Actualité Bourse</span> • <span>À l'instant</span></div>
            </div>
        `;
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
