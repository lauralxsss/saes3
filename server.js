const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '')));

// Faux navigateur pour les requêtes externes
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
        const rssUrl = 'https://www.lefigaro.fr/rss/figaro_economie.xml';
        const response = await fetch(rssUrl, { headers, signal: AbortSignal.timeout(8000) });
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
        const response = await fetch(proxyUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) });
        if (!response.ok) throw new Error(`Erreur réseau: ${response.status}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Erreur serveur agenda :", error.message);
        res.status(500).json({ error: "Impossible de récupérer l'agenda" });
    }
});


// ==========================================
// BASES DE DONNÉES EN MÉMOIRE (Sessions & Participants)
// ==========================================
let sessions = [
    {
        id: "sess_1",
        name: "Simulation Boursière — Classe BTS Finance",
        code: "B7K4P9",
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        initialCapital: 100000,
        adminId: "admin_prof1",
        isActive: true,
        participants: [
            { id: "el_1", name: "Thomas Martin", email: "thomas@iut.fr", value: 100000, cash: 100000, positions: 0, status: "Connecté" },
            { id: "el_2", name: "Emma Dupont", email: "emma@iut.fr", value: 103240, cash: 3240, positions: 3, status: "Connectée" },
            { id: "el_3", name: "Lucas Bernard", email: "lucas@iut.fr", value: 98750, cash: 8750, positions: 1, status: "Connecté" }
        ]
    }
];

// Fonction robuste pour générer un code unique à 6 caractères (ex: B7K4P9)
function generateSecureCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}


// ==========================================
// 1. ROUTES ADMINISTRATEUR (Création & Gestion)
// ==========================================

// Créer une nouvelle session (UNIQUE et sécurisée)
app.post('/api/admin/sessions', (req, res) => {
    try {
        const { name, startDate, endDate, initialCapital } = req.body;
        const code = generateSecureCode();

        const newSession = {
            id: `sess_${Date.now()}`,
            name: name || "Simulation Sans Nom",
            code,
            startDate: startDate || new Date().toISOString().split('T')[0],
            endDate: endDate || "2026-12-31",
            initialCapital: Number(initialCapital) || 100000,
            adminId: "admin_prof1",
            isActive: true,
            participants: []
        };

        sessions.push(newSession);
        res.status(201).json({ success: true, session: newSession });
    } catch (error) {
        console.error("Erreur création session:", error);
        res.status(500).json({ success: false, message: "Erreur lors de la création de la session." });
    }
});

// Récupérer les sessions de l'administrateur
app.get('/api/admin/sessions', (req, res) => {
    res.json(sessions);
});

// Terminer / Fermer une session
app.post('/api/admin/sessions/:id/close', (req, res) => {
    const session = sessions.find(s => s.id === req.params.id);
    if (!session) return res.status(404).json({ success: false, message: "Session introuvable." });
    
    session.isActive = false;
    res.json({ success: true, message: "Session clôturée avec succès." });
});


// ==========================================
// 2. ROUTES ÉLÈVE (Rejoindre une session)
// ==========================================

app.post('/api/student/join', (req, res) => {
    const { email, password, sessionCode } = req.body;

    const session = sessions.find(s => s.code === sessionCode.toUpperCase().trim());
    if (!session) {
        return res.status(404).json({ success: false, message: "Code de session invalide." });
    }

    if (!session.isActive) {
        return res.status(400).json({ success: false, message: "Cette session est terminée." });
    }

    const existingParticipant = session.participants.find(p => p.email === email);
    if (existingParticipant) {
        return res.status(400).json({ success: false, message: "Vous avez déjà rejoint cette session." });
    }

    const newParticipant = {
        id: `el_${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        value: session.initialCapital,
        cash: session.initialCapital,
        positions: 0,
        status: "🟢 Connecté"
    };

    session.participants.push(newParticipant);

    res.json({ 
        success: true, 
        message: "Session rejointe avec succès !", 
        sessionId: session.id,
        sessionName: session.name,
        code: session.code
    });
});


// ==========================================
// 3. API CLASSEMENT GÉNÉRAL & PAR SESSION
// ==========================================

// Route globale pour la page Classement de base
app.get('/api/leaderboard', (req, res) => {
    // Par défaut, renvoie les participants de la première session active pour le classement
    const activeSession = sessions.find(s => s.isActive) || sessions[0];
    if (!activeSession) return res.json([]);
    res.json(activeSession.participants);
});

// Route spécifique par session
app.get('/api/sessions/:sessionId/leaderboard', (req, res) => {
    const session = sessions.find(s => s.id === req.params.sessionId);
    if (!session) return res.status(404).json({ error: "Session introuvable." });

    res.json({
        sessionName: session.name,
        totalParticipants: session.participants.length,
        participants: session.participants
    });
});

// Route par défaut (Single Page App / Statique)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${port}`);
});