const express = require('express');
const { request } = require('undici');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '')));

// Faux User-Agent pour que Yahoo et ForexFactory croient que c'est un vrai humain sur Chrome
const requestOptions = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
};

// ==========================================
// API ACTUALITÉS (Requête directe sans proxy)
// ==========================================
app.get('/api/news', async (req, res) => {
    try {
        const rssUrl = 'https://fr.finance.yahoo.com/actualites/rss';
        
        // On interroge Yahoo directement !
        const { statusCode, body } = await request(rssUrl, requestOptions);
        
        if (statusCode !== 200) throw new Error(`Erreur réseau: ${statusCode}`);
        
        const xml = await body.text();
        res.type('application/xml').send(xml);

    } catch (error) {
        console.error("Erreur serveur actus :", error);
        res.status(500).json({ error: "Impossible de récupérer les actualités" });
    }
});

// ==========================================
// API AGENDA ÉCONOMIQUE (Requête directe sans proxy)
// ==========================================
app.get('/api/calendar', async (req, res) => {
    try {
        const targetUrl = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
        
        // On interroge ForexFactory directement !
        const { statusCode, body } = await request(targetUrl, requestOptions);
        
        if (statusCode !== 200) throw new Error(`Erreur réseau: ${statusCode}`);
        
        const data = await body.json();
        res.json(data);
    } catch (error) {
        console.error("Erreur serveur agenda :", error);
        res.status(500).json({ error: "Impossible de récupérer l'agenda" });
    }
});

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${port}`);
});