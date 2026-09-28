const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES
// ==========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques
app.use(express.static(__dirname));

// ==========================================
// DONNÉES EN MÉMOIRE
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
            {
                id: "el_1",
                name: "Thomas Martin",
                email: "thomas@iut.fr",
                value: 100000,
                cash: 100000,
                positions: 0,
                status: "Connecté"
            },
            {
                id: "el_2",
                name: "Emma Dupont",
                email: "emma@iut.fr",
                value: 103240,
                cash: 3240,
                positions: 3,
                status: "Connectée"
            },
            {
                id: "el_3",
                name: "Lucas Bernard",
                email: "lucas@iut.fr",
                value: 98750,
                cash: 8750,
                positions: 1,
                status: "Connecté"
            }
        ]
    }
];

// ==========================================
// GÉNÉRATION CODE SESSION
// ==========================================

function generateSecureCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;

    do {
        code = '';
        for (let i = 0; i < 6; i++) {
            const index = Math.floor(Math.random() * chars.length);
            code += chars[index];
        }
    } while (sessions.some(session => session.code === code));

    return code;
}

// ==========================================
// ROUTES API (GET & POST)
// ==========================================

app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: "API TradeLab opérationnelle",
        date: new Date().toISOString()
    });
});

// ADMIN — RÉCUPÉRER LES SESSIONS
app.get('/api/admin/sessions', (req, res) => {
    console.log("GET /api/admin/sessions");
    res.json(sessions);
});

// ADMIN — CRÉER UNE SESSION
app.post('/api/admin/sessions', (req, res) => {
    console.log("POST /api/admin/sessions");
    console.log("Données reçues :", req.body);

    try {
        const { name, startDate, endDate, initialCapital } = req.body;

        if (!name || !startDate || !endDate || !initialCapital) {
            return res.status(400).json({ success: false, message: "Tous les champs sont obligatoires." });
        }

        if (new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({ success: false, message: "La date de fin doit être après la date de début." });
        }

        const capital = Number(initialCapital);
        if (!Number.isFinite(capital) || capital <= 0) {
            return res.status(400).json({ success: false, message: "Le capital initial doit être supérieur à 0." });
        }

        const code = generateSecureCode();
        const newSession = {
            id: `sess_${Date.now()}`,
            name: name.trim(),
            code,
            startDate,
            endDate,
            initialCapital: capital,
            adminId: "admin_prof1",
            isActive: true,
            participants: []
        };

        sessions.push(newSession);
        console.log("✅ Session créée :", newSession);

        return res.status(201).json({
            success: true,
            message: "Session créée avec succès.",
            session: newSession
        });

    } catch (error) {
        console.error("❌ Erreur création session :", error);
        return res.status(500).json({ success: false, message: "Erreur interne lors de la création." });
    }
});

// ADMIN — FERMER UNE SESSION
app.post('/api/admin/sessions/:id/close', (req, res) => {
    const session = sessions.find(s => s.id === req.params.id);

    if (!session) {
        return res.status(404).json({ success: false, message: "Session introuvable." });
    }

    session.isActive = false;
    console.log("🔒 Session clôturée :", session.id);

    res.json({ success: true, message: "Session clôturée avec succès." });
});

// ÉLÈVE — REJOINDRE UNE SESSION (Ancienne route)
app.post('/api/student/join', (req, res) => {
    const { email, password, sessionCode } = req.body;

    if (!email || !sessionCode) {
        return res.status(400).json({ success: false, message: "Email et code de session obligatoires." });
    }

    const normalizedCode = sessionCode.trim().toUpperCase();
    const session = sessions.find(s => s.code === normalizedCode);

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
        email,
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

// PARCOURS ÉLÈVE : Étape 1 — Vérification et prévisualisation du code
app.post('/api/student/verify-code', (req, res) => {
    try {
        const { code } = req.body;
        
        if (!code || !code.trim()) {
            return res.status(400).json({ success: false, error: 'empty', message: "Veuillez entrer un code de session." });
        }

        const cleanCode = code.toUpperCase().trim();
        const session = sessions.find(s => s.code === cleanCode);

        if (!session) {
            return res.status(404).json({ success: false, error: 'invalid', message: "Code invalide ou expiré. Vérifiez votre code et réessayez." });
        }

        if (!session.isActive) {
            return res.status(400).json({ success: false, error: 'deactivated', message: "Cette session a été désactivée ou est terminée." });
        }

        const today = new Date().toISOString().split('T')[0];
        if (session.endDate && today > session.endDate) {
            return res.status(400).json({ success: false, error: 'expired', message: "Ce code a expiré." });
        }

        res.json({
            success: true,
            session: {
                id: session.id,
                name: session.name,
                startDate: session.startDate,
                endDate: session.endDate,
                initialCapital: session.initialCapital,
                institution: "TradeLab Academic Platform"
            }
        });
    } catch (error) {
        console.error("Erreur validation code:", error);
        res.status(500).json({ success: false, error: 'server_error', message: "Erreur serveur lors de la validation." });
    }
});

// PARCOURS ÉLÈVE : Étape 2 — Initialisation officielle de la session de l'étudiant
app.post('/api/student/start-simulation', (req, res) => {
    try {
        const { sessionId, studentName } = req.body;
        const session = sessions.find(s => s.id === sessionId);

        if (!session || !session.isActive) {
            return res.status(400).json({ success: false, message: "Session invalide ou inactive." });
        }

        const name = studentName && studentName.trim() ? studentName.trim() : `Étudiant_${Math.floor(Math.random() * 900 + 100)}`;
        const email = `${name.toLowerCase().replace(/\s+/g, '')}@etudiant.fr`;

        let participant = session.participants.find(p => p.email === email);
        if (!participant) {
            participant = {
                id: `el_${Date.now()}`,
                name: name,
                email: email,
                value: session.initialCapital,
                cash: session.initialCapital,
                positions: 0,
                status: "🟢 Connecté"
            };
            session.participants.push(participant);
        }

        res.json({
            success: true,
            sessionId: session.id,
            sessionName: session.name,
            participant: participant
        });
    } catch (error) {
        console.error("Erreur démarrage simulation:", error);
        res.status(500).json({ success: false, message: "Impossible d'initialiser la simulation." });
    }
});

// CLASSEMENT
app.get('/api/leaderboard', (req, res) => {
    const activeSession = sessions.find(s => s.isActive);
    if (!activeSession) {
        return res.json([]);
    }
    res.json(activeSession.participants);
});

app.get('/api/sessions/:sessionId/leaderboard', (req, res) => {
    const session = sessions.find(s => s.id === req.params.sessionId);
    if (!session) {
        return res.status(404).json({ error: "Session introuvable." });
    }
    res.json({
        sessionName: session.name,
        totalParticipants: session.participants.length,
        participants: session.participants
    });
});

// ACTUALITÉS
app.get('/api/news', async (req, res) => {
    try {
        const rssUrl = 'https://www.lefigaro.fr/rss/figaro_economie.xml';
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
        
        const response = await fetch(proxyUrl, { 
            headers: { 'User-Agent': 'Mozilla/5.0' }, 
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
// ROUTE CATCH-ALL (DOIT TOUJOURS ÊTRE EN DERNIER)
// ==========================================

app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// DÉMARRAGE
// ==========================================

app.listen(PORT, () => {
    console.log('');
    console.log('====================================');
    console.log('🚀 TradeLab démarré');
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`🧪 http://localhost:${PORT}/api/test`);
    console.log('====================================');
    console.log('');
});