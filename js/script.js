document.addEventListener('DOMContentLoaded', () => {
    
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