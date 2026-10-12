const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// CONNEXION SUPABASE
//===========================================

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error("❌ Variables SUPABASE_URL et SUPABASE_KEY manquantes (Render > Environment).");
    process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ==========================================
// MIDDLEWARES
// ========================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));


// ========================================================
// SÉCURITÉ ET IDENTIFICATION (Professeur & Élèves)
// ========================================================

// Mot de passe et clé secrète (récupérés depuis Render, ou valeur par défaut)
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'prof123';
const SECRET_KEY = process.env.AUTH_SECRET || 'super_secret_tradelab_2026';

// Fonction pour fabriquer un jeton sécurisé
function creerJeton(data) {
    const payload = Buffer.from(JSON.stringify(data)).toString('base64');
    const signature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('base64');
    return `${payload}.${signature}`;
}

// Middleware pour vérifier l'identité à chaque requête
function verifierJeton(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: "Non autorisé" });

    try {
        const [payload, signature] = token.split('.');
        const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('base64');
        if (signature === expectedSignature) {
            req.user = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
            return next();
        }
    } catch (e) {}
    return res.status(403).json({ success: false, message: "Jeton invalide" });
}

// ==========================================
// OUTILS
// ==========================================

// Convertit une ligne Supabase en objet attendu par le site (mêmes noms qu'avant)
function toParticipant(p) {
    return {
        id: p.id,
        name: p.name,
        email: p.email,
        value: Number(p.value),
        cash: Number(p.cash),
        positions: p.positions,
        status: p.status
    };
}

function toSession(s, participants = []) {
    return {
        id: s.id,
        name: s.name,
        code: s.code,
        startDate: s.start_date,
        endDate: s.end_date,
        initialCapital: Number(s.initial_capital),
        adminId: s.admin_id,
        isActive: s.is_active,
        participants: participants.map(toParticipant)
    };
}

function generateSecureCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[crypto.randomInt(chars.length)];
    }
    return code;
}

// Renvoie une erreur JSON propre si quelque chose plante
const wrap = (fn) => (req, res) =>
    fn(req, res).catch((error) => {
        console.error("❌ Erreur :", error);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    });

async function findSessionByCode(code) {
    const { data, error } = await supabase.from('tl_sessions').select('*').eq('code', code).maybeSingle();
    if (error) throw error;
    return data;
}

async function getParticipants(sessionId) {
    const { data, error } = await supabase
        .from('tl_participants')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
    if (error) throw error;
    return data.map(toParticipant);
}


// ==========================================
// ROUTES API - AUTHENTIFICATION
// ==========================================

// 1. ROUTE : Connexion du professeur
app.post('/api/auth/admin-login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASS) {
        return res.json({ success: true, token: creerJeton({ role: 'admin' }) });
    }
    res.status(401).json({ success: false, message: "Mot de passe incorrect" });
});

// SÉCURITÉ : Protéger TOUTES les routes /api/admin/...
// Ce bloc empêche quiconque d'accéder aux routes admin sans être le professeur
app.use('/api/admin', verifierJeton, (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Accès refusé" });
    next();
});

// ==========================================
// ROUTES API - ADMIN ET SESSIONS
// ==========================================

app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: "API TradeLab opérationnelle",
        date: new Date().toISOString()
    });
});

// ADMIN — RÉCUPÉRER LES SESSIONS
app.get('/api/admin/sessions', wrap(async (req, res) => {
    const { data, error } = await supabase
        .from('tl_sessions')
        .select('*, tl_participants(*)')
        .order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data.map(s => toSession(s, s.tl_participants || [])));
}));

// ADMIN — CRÉER UNE SESSION
app.post('/api/admin/sessions', wrap(async (req, res) => {
    console.log("POST /api/admin/sessions", req.body);

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

    // On réessaie si le code (ou l'id) existe déjà
    let created = null;
    for (let essai = 0; essai < 5 && !created; essai++) {
        const { data, error } = await supabase
            .from('tl_sessions')
            .insert({
                id: `sess_${Date.now()}`,
                name: name.trim(),
                code: generateSecureCode(),
                start_date: startDate,
                end_date: endDate,
                initial_capital: capital
            })
            .select()
            .single();

        if (!error) created = data;
        else if (error.code !== '23505') throw error; // 23505 = doublon
    }

    if (!created) {
        return res.status(500).json({ success: false, message: "Impossible de générer un code unique." });
    }

    console.log("✅ Session créée :", created.id, created.code);
    res.status(201).json({
        success: true,
        message: "Session créée avec succès.",
        session: toSession(created, [])
    });
}));

// ADMIN — FERMER UNE SESSION
app.post('/api/admin/sessions/:id/close', wrap(async (req, res) => {
    const { data, error } = await supabase
        .from('tl_sessions')
        .update({ is_active: false })
        .eq('id', req.params.id)
        .select();
    if (error) throw error;

    if (!data || data.length === 0) {
        return res.status(404).json({ success: false, message: "Session introuvable." });
    }

    console.log("🔒 Session clôturée :", req.params.id);
    res.json({ success: true, message: "Session clôturée avec succès." });
}));


// ==========================================
// ROUTES API - PARCOURS ÉLÈVE
// ==========================================

// ÉLÈVE — REJOINDRE UNE SESSION (ancienne route)
app.post('/api/student/join', wrap(async (req, res) => {
    const { email, sessionCode } = req.body;

    if (!email || !sessionCode) {
        return res.status(400).json({ success: false, message: "Email et code de session obligatoires." });
    }

    const session = await findSessionByCode(sessionCode.trim().toUpperCase());

    if (!session) {
        return res.status(404).json({ success: false, message: "Code de session invalide." });
    }

    if (!session.is_active) {
        return res.status(400).json({ success: false, message: "Cette session est terminée." });
    }

    const { data: existing, error: errExisting } = await supabase
        .from('tl_participants')
        .select('id')
        .eq('session_id', session.id)
        .eq('email', email)
        .maybeSingle();
    if (errExisting) throw errExisting;

    if (existing) {
        return res.status(400).json({ success: false, message: "Vous avez déjà rejoint cette session." });
    }

    const { error } = await supabase.from('tl_participants').insert({
        id: `el_${Date.now()}`,
        session_id: session.id,
        name: email.split('@')[0],
        email,
        value: session.initial_capital,
        cash: session.initial_capital,
        positions: 0,
        status: "🟢 Connecté"
    });
    if (error) throw error;

    res.json({
        success: true,
        message: "Session rejointe avec succès !",
        sessionId: session.id,
        sessionName: session.name,
        code: session.code
    });
}));

// PARCOURS ÉLÈVE : Étape 1 — Vérification et prévisualisation du code
app.post('/api/student/verify-code', wrap(async (req, res) => {
    const { code } = req.body;

    if (!code || !code.trim()) {
        return res.status(400).json({ success: false, error: 'empty', message: "Veuillez entrer un code de session." });
    }

    const session = await findSessionByCode(code.toUpperCase().trim());

    if (!session) {
        return res.status(404).json({ success: false, error: 'invalid', message: "Code invalide ou expiré. Vérifiez votre code et réessayez." });
    }

    if (!session.is_active) {
        return res.status(400).json({ success: false, error: 'deactivated', message: "Cette session a été désactivée ou est terminée." });
    }

    const today = new Date().toISOString().split('T')[0];
    if (session.end_date && today > session.end_date) {
        return res.status(400).json({ success: false, error: 'expired', message: "Ce code a expiré." });
    }

    res.json({
        success: true,
        session: {
            id: session.id,
            name: session.name,
            startDate: session.start_date,
            endDate: session.end_date,
            initialCapital: Number(session.initial_capital),
            institution: "TradeLab Academic Platform"
        }
    });
}));

// PARCOURS ÉLÈVE : Étape 2 — Initialisation officielle de la session de l'étudiant
app.post('/api/student/start-simulation', wrap(async (req, res) => {
    const { sessionId, studentName } = req.body;

    const { data: session, error: errSession } = await supabase
        .from('tl_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();
    if (errSession) throw errSession;

    if (!session || !session.is_active) {
        return res.status(400).json({ success: false, message: "Session invalide ou inactive." });
    }

    const name = studentName && studentName.trim() ? studentName.trim() : `Étudiant_${Math.floor(Math.random() * 900 + 100)}`;
    const email = `${name.toLowerCase().replace(/\s+/g, '')}@etudiant.fr`;

    let { data: participant, error: errPart } = await supabase
        .from('tl_participants')
        .select('*')
        .eq('session_id', session.id)
        .eq('email', email)
        .maybeSingle();
    if (errPart) throw errPart;

    if (!participant) {
        const { data, error } = await supabase
            .from('tl_participants')
            .insert({
                id: `el_${Date.now()}`,
                session_id: session.id,
                name,
                email,
                value: session.initial_capital,
                cash: session.initial_capital,
                positions: 0,
                status: "🟢 Connecté"
            })
            .select()
            .single();
        if (error) throw error;
        participant = data;
    }

    // --- NOUVEAU : On génère le jeton (token) pour l'élève et on lui envoie ---
    res.json({
        success: true,
        sessionId: session.id,
        sessionName: session.name,
        participant: toParticipant(participant),
        token: creerJeton({ role: 'student', participantId: participant.id, sessionId: session.id })
    });
}));

// ==========================================
// ROUTES API - ORDRES (Achat/Vente Élève)
// ==========================================

app.post('/api/student/orders', verifierJeton, async (req, res) => {
    const { participantId, symbole, side, quantite, prix } = req.body;

    try {
        // A. Chercher l'élève dans la BDD
        const { data: part } = await supabase.from('tl_participants').select('*').eq('id', participantId).single();
        if (!part) return res.status(404).json({ success: false, message: "Élève introuvable" });

        const montantTotal = quantite * prix;

        // B. Vérifier que l'élève a assez d'argent
        if (side === 'buy' && part.cash < montantTotal) {
            return res.status(400).json({ success: false, message: "Fonds insuffisants sur le compte" });
        }

        // C. Sauvegarder l'ordre
        await supabase.from('tl_orders').insert({
            id: 'ord_' + Math.random().toString(36).substr(2, 9),
            session_id: part.session_id,
            participant_id: participantId,
            symbole, 
            side, 
            quantite, 
            prix, 
            statut: 'execute'
        });

        // D. Retirer ou ajouter l'argent du compte
        const nouveauCash = side === 'buy' ? part.cash - montantTotal : part.cash + montantTotal;
        await supabase.from('tl_participants').update({ cash: nouveauCash }).eq('id', participantId);

        res.json({ success: true, message: "Ordre exécuté" });
    } catch (error) {
        console.error("Erreur serveur lors de l'ordre:", error);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
});

// ==========================================
// ROUTES API - DIVERS
// ==========================================

// CLASSEMENT (première session active)
app.get('/api/leaderboard', wrap(async (req, res) => {
    const { data: active, error } = await supabase
        .from('tl_sessions')
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
    if (error) throw error;

    if (!active) {
        return res.json([]);
    }
    res.json(await getParticipants(active.id));
}));

app.get('/api/sessions/:sessionId/leaderboard', wrap(async (req, res) => {
    const { data: session, error } = await supabase
        .from('tl_sessions')
        .select('id, name')
        .eq('id', req.params.sessionId)
        .maybeSingle();
    if (error) throw error;

    if (!session) {
        return res.status(404).json({ error: "Session introuvable." });
    }

    const participants = await getParticipants(session.id);
    res.json({
        sessionName: session.name,
        totalParticipants: participants.length,
        participants
    });
}));

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