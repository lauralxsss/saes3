// ==========================================
// Petit serveur : sert le site + fait les appels API à la place du navigateur
// ==========================================
const express = require('express');
const path = require('path');
const { ProxyAgent, setGlobalDispatcher } = require('undici');

// ⚠️ Le proxy de l'IUT n'est utile qu'en local, sur le réseau de l'école.
// Une fois hébergé ailleurs (Render, etc.), il ne faut PAS l'utiliser.
// On l'active seulement si la variable d'environnement USE_SCHOOL_PROXY vaut "true".
if (process.env.USE_SCHOOL_PROXY === 'true') {
    setGlobalDispatcher(new ProxyAgent('http://proxy.iutbourg.univ-lyon1.fr:3128'));
    console.log('Proxy IUT activé');
}

const app = express();
// La plupart des hébergeurs (Render, Railway...) imposent leur propre port via cette variable
const PORT = process.env.PORT || 3000;

// Sert tous les fichiers du projet (index.html, css, js...) comme le fait Live Server
app.use(express.static(path.join(__dirname)));

// --- Route pour l'agenda économique ---
app.get('/api/calendar', async (req, res) => {
    try {
        const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Erreur /api/calendar :', error.message);
        res.status(502).json({ error: 'Impossible de récupérer l\'agenda' });
    }
});

// --- Route pour les actus (parsing RSS -> JSON fait ici, côté serveur) ---
app.get('/api/news', async (req, res) => {
    try {
        const response = await fetch('https://www.lemonde.fr/economie/rss_full.xml');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const xml = await response.text();

        // Extraction simple des <item> du flux RSS (pas besoin de librairie externe)
        const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
        const items = itemBlocks.slice(0, 3).map(block => {
            const getTag = (tag) => {
                const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
                if (!match) return '';
                return match[1].replace('<![CDATA[', '').replace(']]>', '').trim();
            };
            return {
                title: getTag('title'),
                link: getTag('link'),
                pubDate: getTag('pubDate')
            };
        });

        res.json({ items });
    } catch (error) {
        console.error('Erreur /api/news :', error.message);
        res.status(502).json({ error: 'Impossible de récupérer les actus' });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});