const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '')));

// Faux navigateur très complet pour tromper les sécurités anti-bots
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
};

// ==========================================
// API ACTUALITÉS
// ==========================================
app.get('/api/news', async (req, res) => {
    try {
        // Le flux du Figaro Économie est super fiable et ne bloque pas les serveurs Cloud
        const rssUrl = 'https://www.lefigaro.fr/rss/figaro_economie.xml';
        
        // Timeout de 8s : on ne laisse plus jamais la requête tourner dans le vide
        const response = await fetch(rssUrl, { 
            headers, 
            signal: AbortSignal.timeout(8000) 
        });
        
        if (!response.ok) throw new Error(`Erreur réseau: ${response.status}`);
        
        const xml = await response.text();
        res.type('application/xml').send(xml);

    } catch (error) {
        console.error("Erreur serveur actus :", error.message);
        res.status(500).json({ error: "Impossible de récupérer les actualités" });
    }
});

// ==========================================
// API AGENDA ÉCONOMIQUE
// ==========================================
app.get('/api/calendar', async (req, res) => {
    try {
        const targetUrl = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
        
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        
        const response = await fetch(proxyUrl, { 
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            signal: AbortSignal.timeout(8000) 
        });
        
        if (!response.ok) throw new Error(`Erreur réseau: ${response.status}`);
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Erreur serveur agenda :", error.message);
        res.status(500).json({ error: "Impossible de récupérer l'agenda" });
    }
});

// Route par défaut
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${port}`);
});