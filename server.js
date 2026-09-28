const express = require('express');
const { request } = require('undici');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Sert les fichiers statiques (ton HTML, CSS, JS) depuis la racine du projet
app.use(express.static(path.join(__dirname, '')));

// ==========================================
// API ACTUALITÉS (Relais serveur)
// ==========================================
app.get('/api/news', async (req, res) => {
    try {
        // Flux RSS de Yahoo Finance
        const rssUrl = 'https://fr.finance.yahoo.com/actualites/rss';
        
        // Utilisation d'un proxy public (AllOrigins) via le serveur pour garantir le passage
        const apiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;
        
        const { statusCode, body } = await request(apiUrl);
        if (statusCode !== 200) throw new Error(`Erreur réseau: ${statusCode}`);
        
        const data = await body.json();
        
        // On renvoie le contenu XML brut au frontend
        res.type('application/xml').send(data.contents);

    } catch (error) {
        console.error("Erreur serveur actus :", error);
        res.status(500).json({ error: "Impossible de récupérer les actualités" });
    }
});

// ==========================================
// API AGENDA ÉCONOMIQUE (Relais serveur)
// ==========================================
app.get('/api/calendar', async (req, res) => {
    try {
        // Flux JSON public ForexFactory
        const targetUrl = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
        const { statusCode, body } = await request(targetUrl);
        
        if (statusCode !== 200) throw new Error(`Erreur réseau: ${statusCode}`);
        
        const data = await body.json();
        res.json(data);
    } catch (error) {
        console.error("Erreur serveur agenda :", error);
        res.status(500).json({ error: "Impossible de récupérer l'agenda" });
    }
});

// Route par défaut (redirige vers l'accueil)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${port}`);
});