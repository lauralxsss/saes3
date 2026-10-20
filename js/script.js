// ==========================================
// 1. SUPABASE (sessions et codes)
// ==========================================
const sbClient = window.supabase
  ? window.supabase.createClient(
      "https://sdbcwpkqjnkdykplzqbl.supabase.co",
      "sb_publishable_VYHMIw6eapMDK3e_Qs-YeQ_7I2dR2Q5"
    )
  : null;

function genererCode(n = 6) {
  const car = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const tab = crypto.getRandomValues(new Uint32Array(n));
  return Array.from(tab, x => car[x % car.length]).join("");
}

async function creerSession(nom) {
  for (let essai = 0; essai < 5; essai++) {
    const code = genererCode();
    const { error } = await sbClient.from("sessions").insert({ nom, code });
    if (!error) return code;
    if (error.code !== "23505") { console.error(error); break; }
  }
  return null;
}

async function verifierCode(code) {
  const { data } = await sbClient
    .from("sessions")
    .select("id, nom, capital_initial, date_fin")
    .eq("code", code.trim().toUpperCase())
    .eq("statut", "en_cours")
    .maybeSingle();
  return data;
}

async function rejoindre(sessionId, pseudo) {
  const { error } = await sbClient.from("participants").insert({ session_id: sessionId, pseudo });
  return !error;
}


// ==========================================
// 2. ACTUALITÉS & AGENDA ÉCONOMIQUE
// ==========================================
async function fetchFrenchNews() {
    const container = document.getElementById('news-container');
    if (!container) return;

    const fallbackArticles = [
        { title: "🔴 En direct : Suivez l'évolution du CAC 40", link: "#", source: "Boursorama", image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=500&q=60" },
        { title: "Analyse des marchés de la semaine", link: "#", source: "ZoneBourse", image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=500&q=60" }
    ];

    const renderArticles = (articles, isFallback = false) => {
        container.innerHTML = '';
        articles.forEach((article) => {
            const dateText = isFallback ? "En direct" : article.dateStr;
            container.innerHTML += `
                <div class="news-article">
                    <div class="news-image-container"><img src="${article.image}" alt="Actu" class="news-img"></div>
                    <div class="news-content">
                        <a href="${article.link}" target="_blank" style="text-decoration: none; font-weight: 500;">${article.title}</a>
                        <div class="news-meta"><span>${article.source}</span> • <span>${dateText}</span></div>
                    </div>
                </div>`;
        });
    };

    try {
        const response = await fetch('/api/news');
        if (!response.ok) throw new Error("HTTP " + response.status);
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 3);
        if (items.length === 0) throw new Error("Flux vide");

        const liveArticles = items.map((item, index) => {
            const dateObj = new Date(item.querySelector("pubDate")?.textContent);
            return {
                title: item.querySelector("title")?.textContent || "Titre indisponible",
                link: item.querySelector("link")?.textContent || "#",
                source: "Le Figaro Éco",
                dateStr: dateObj.toLocaleDateString('fr-FR') + ' à ' + dateObj.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}),
                image: fallbackArticles[index % fallbackArticles.length].image
            };
        });
        renderArticles(liveArticles, false);
    } catch (error) {
        renderArticles(fallbackArticles, true);
    }
}

async function fetchEconomicCalendar() {
    const container = document.getElementById('calendar-container');
    if (!container) return;

    try {
        const targetUrl = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
        const apiUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Bloqué");
        const events = await response.json();

        const filteredEvents = events.filter(e => (e.impact === 'High' || e.impact === 'Medium') && ['USD','EUR','FR','DE'].includes(e.country));
        const now = new Date();
        const upcomingEvents = filteredEvents.filter(e => new Date(e.date) >= now).slice(0, 4);
        if (upcomingEvents.length === 0) throw new Error("Vide");

        container.innerHTML = '';
        const days = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
        upcomingEvents.forEach(e => {
            const eventDate = new Date(e.date);
            const timeStr = eventDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
            const isHigh = e.impact === 'High';
            container.innerHTML += `
                <div class="calendar-item">
                    <div class="cal-date">${days[eventDate.getDay()]}<br><span>${timeStr}</span></div>
                    <div class="cal-event">
                        <span class="event-title">[${e.country}] ${e.title.substring(0, 30)}...</span>
                        <span class="event-impact ${isHigh ? 'impact-high' : 'impact-medium'}">${isHigh ? 'Impact Fort' : 'Impact Moyen'}</span>
                    </div>
                </div>`;
        });
    } catch (error) {
        container.innerHTML = `<p style="font-size:0.9rem; color:var(--text-secondary); text-align:center;">Aucun événement majeur à venir.</p>`;
    }
}

// ==========================================
// 3. SIMULATEUR DE MARCHÉ (Effet Flash)
// ==========================================
let marketInterval;
let isLive = false;

function formatVariation(valeur) {
    const isPositive = valeur.startsWith('+');
    return `<span class="${isPositive ? 'positive' : 'negative'}">${valeur}</span>`;
}

function flashElement(element, isUp) {
    const flashClass = isUp ? 'flash-up' : 'flash-down';
    element.classList.remove('flash-up', 'flash-down');
    void element.offsetWidth;
    element.classList.add(flashClass);
    setTimeout(() => element.classList.remove(flashClass), 1000);
}

function tickMarket() {
    if (!isLive) return;
    const changeElements = document.querySelectorAll('.change-up, .change-down');
    const elementsToTick = Array.from(changeElements).sort(() => 0.5 - Math.random()).slice(0, 3);

    elementsToTick.forEach(el => {
        let value = parseFloat(el.innerText.trim().replace(/[^0-9.-]+/g, ""));
        if (!isNaN(value)) {
            let variation = (Math.random() * 0.1) - 0.05;
            let newValue = (value + variation).toFixed(2);
            let isPositive = newValue >= 0;
            el.innerText = (isPositive ? '+' : '') + newValue + '%';
            el.className = isPositive ? 'change-up' : 'change-down';
            flashElement(el, isPositive);
        }
    });
}

// =======================
// Page Trader & Investir
// =======================

const marketData = {
    actions: [
        { nom: "Apple Inc.", ticker: "AAPL", prix: 175.50, devise: "$", hist: { "1J": "+1.2%", "7J": "+3.5%", "1M": "-2.1%", "6M": "+12.4%" },
            desc: "Apple conçoit, fabrique et commercialise des smartphones, ordinateurs et tablettes à l'échelle mondiale.",
            cap: "2 800 Md", res: "97.0 Md", resEvol: "+5.2%",
            div: "0.96 (0.5%)", divEvol: "+4.1%", per: "28.5", ratio: "0.12",
            chartData: [150, 155, 152, 160, 165, 162, 170, 175.50] },
        { nom: "LVMH", ticker: "MC.PA", prix: 840.20, devise: "€", hist: { "1J": "-0.8%", "7J": "-1.5%", "1M": "+4.2%", "6M": "+8.1%" },
            desc: "Leader mondial du luxe, LVMH possède des marques prestigieuses dans la mode, maroquinerie, parfums et spiritueux.",
            cap: "420 Md", res: "14.1 Md", resEvol: "+12.0%",
            div: "12.00 (1.4%)", divEvol: "+20.0%", per: "24.1", ratio: "0.28",
            chartData: [880, 875, 850, 860, 845, 830, 835, 840.20] },
        { nom: "TotalEnergies", ticker: "TTE", prix: 62.30, devise: "€", hist: { "1J": "+0.5%", "7J": "+2.1%", "1M": "+5.6%", "6M": "-1.2%" },
            desc: "Compagnie mondiale multi-énergies de production et de fourniture d'énergies : pétrole, biocarburants, gaz naturel et électricité.",
            cap: "155 Md", res: "20.5 Md", resEvol: "-4.2%",
            div: "3.01 (4.8%)", divEvol: "+7.1%", per: "7.5", ratio: "0.55",
            chartData: [55, 56, 58, 57, 59, 61, 60, 62.30] },
        { nom: "Microsoft", ticker: "MSFT", prix: 330.10, devise: "$", hist: { "1J": "+2.5%", "7J": "+1.1%", "1M": "+4.5%", "6M": "+15.2%" },
            desc: "Développe et prend en charge des logiciels, services, appareils et solutions à travers le monde. Leader dans le cloud.",
            cap: "2 500 Md", res: "72.7 Md", resEvol: "+11.4%",
            div: "2.72 (0.8%)", divEvol: "+9.7%", per: "34.2", ratio: "0.16",
            chartData: [300, 310, 305, 315, 320, 325, 322, 330.10] },
        { nom: "Tesla", ticker: "TSLA", prix: 210.80, devise: "$", hist: { "1J": "-1.2%", "7J": "-4.5%", "1M": "+8.2%", "6M": "-5.1%" },
            desc: "Tesla conçoit, développe, fabrique et commercialise des véhicules électriques haute performance ainsi que des solutions de stockage d'énergie solaire.",
            cap: "670 Md $", res: "12.6 Md $", resEvol: "+128.0%",
            div: "0.00 $ (0.0%)", divEvol: "0.0%", per: "53.1", ratio: "0.13",
            chartData: [230, 225, 215, 220, 212, 218, 210.80] },
        { nom: "Amazon", ticker: "AMZN", prix: 135.40, devise: "$", hist: { "1J": "+0.9%", "7J": "+2.8%", "1M": "-1.5%", "6M": "+9.4%" },
            desc: "Amazon est le leader mondial du commerce électronique, de l'informatique en nuage (AWS), du streaming numérique et de la logistique connectée.",
            cap: "1 400 Md $", res: "-2.7 Md $", resEvol: "-108.0%",
            div: "0.00 $ (0.0%)", divEvol: "0.0%", per: "105.4", ratio: "0.33",
            chartData: [125, 128, 130, 129, 132, 134, 135.40] },
        { nom: "NVIDIA", ticker: "NVDA", prix: 450.20, devise: "$", hist: { "1J": "+3.1%", "7J": "+6.2%", "1M": "+12.5%", "6M": "+45.8%" },
            desc: "NVIDIA est le pionnier du processeur graphique (GPU), révolutionnant le domaine de l'intelligence artificielle, du gaming et du calcul haute performance.",
            cap: "1 110 Md $", res: "4.3 Md $", resEvol: "-55.0%",
            div: "0.16 $ (0.04%)", divEvol: "0.0%", per: "112.5", ratio: "0.03",
            chartData: [380, 400, 395, 420, 415, 435, 450.20] },
        { nom: "Alphabet", ticker: "GOOGL", prix: 130.50, devise: "$", hist: { "1J": "+0.4%", "7J": "+1.5%", "1M": "+2.1%", "6M": "+11.2%" },
            desc: "Alphabet est la société mère de Google, spécialisée dans les services Internet, la publicité en ligne, le cloud computing et l'intelligence artificielle.",
            cap: "1 650 Md $", res: "60.0 Md $", resEvol: "-21.0%",
            div: "0.00 $ (0.0%)", divEvol: "0.0%", per: "27.6", ratio: "0.22",
            chartData: [120, 122, 125, 124, 128, 129, 130.50] }
    ],
    indices: [
        { nom: "CAC 40", ticker: "^FCHI", desc: "Principal indice boursier français : il regroupe les 40 plus grandes capitalisations cotées à Paris.", prix: 7350.45, devise: "pts", hist: { "1J": "+0.4%", "7J": "-0.2%", "1M": "+2.8%", "6M": "+5.4%" } },
        { nom: "S&P 500", ticker: "^GSPC", desc: "Indice qui suit 500 des plus grandes entreprises cotées aux États-Unis, référence du marché américain.", prix: 4500.10, devise: "pts", hist: { "1J": "+1.1%", "7J": "+2.3%", "1M": "-1.0%", "6M": "+10.2%" } },
        { nom: "NASDAQ", ticker: "^IXIC", desc: "Indice composite regroupant les sociétés cotées au NASDAQ, très orienté technologie.", prix: 14000.20, devise: "pts", hist: { "1J": "+1.5%", "7J": "+3.1%", "1M": "+2.5%", "6M": "+15.8%" } },
        { nom: "Dow Jones", ticker: "^DJI", desc: "Indice américain de 30 grandes entreprises industrielles et de services, l'un des plus anciens au monde.", prix: 34500.80, devise: "pts", hist: { "1J": "+0.2%", "7J": "+0.5%", "1M": "-0.5%", "6M": "+4.2%" } },
        { nom: "DAX", ticker: "^GDAXI", desc: "Indice phare de la bourse allemande : il suit les 40 plus grandes entreprises cotées à Francfort.", prix: 15800.60, devise: "pts", hist: { "1J": "+0.8%", "7J": "+1.2%", "1M": "+3.1%", "6M": "+7.5%" } },
        { nom: "FTSE 100", ticker: "^FTSE", desc: "Indice qui suit les 100 plus grandes capitalisations cotées à la bourse de Londres.", prix: 7400.30, devise: "pts", hist: { "1J": "-0.1%", "7J": "-0.5%", "1M": "+1.2%", "6M": "+2.1%" } },
        { nom: "Nikkei 225", ticker: "^N225", desc: "Indice de référence de la bourse de Tokyo, composé de 225 grandes entreprises japonaises.", prix: 32000.50, devise: "pts", hist: { "1J": "+1.2%", "7J": "+2.5%", "1M": "+4.8%", "6M": "+18.2%" } },
        { nom: "Hang Seng", ticker: "^HSI", desc: "Indice principal de la bourse de Hong Kong, qui suit les plus grandes entreprises qui y sont cotées.", prix: 18000.10, devise: "pts", hist: { "1J": "-1.5%", "7J": "-3.2%", "1M": "-5.5%", "6M": "-12.4%" } }
    ],
    devises: [
        { nom: "Euro / Dollar", ticker: "EUR/USD", desc: "Indique combien de dollars américains il faut pour acheter 1 euro.", prix: 1.0850, devise: "$", hist: { "1J": "-0.2%", "7J": "+0.5%", "1M": "-1.1%", "6M": "+2.3%" } },
        { nom: "Euro / Yen", ticker: "EUR/JPY", desc: "Indique combien de yens il faut pour acheter 1 euro.", prix: 158.40, devise: "¥", hist: { "1J": "+0.7%", "7J": "+1.2%", "1M": "+3.4%", "6M": "+6.8%" } },
        { nom: "Livre / Dollar", ticker: "GBP/USD", desc: "Indique combien de dollars américains il faut pour acheter 1 livre sterling.", prix: 1.2540, devise: "$", hist: { "1J": "+0.1%", "7J": "-0.4%", "1M": "+1.1%", "6M": "+3.3%" } },
        { nom: "Euro / Livre", ticker: "EUR/GBP", desc: "Indique combien de livres sterling il faut pour acheter 1 euro.", prix: 0.8650, devise: "£", hist: { "1J": "-0.1%", "7J": "+0.2%", "1M": "-0.5%", "6M": "-1.2%" } },
        { nom: "Dollar / Yen", ticker: "USD/JPY", desc: "Indique combien de yens il faut pour acheter 1 dollar américain.", prix: 145.20, devise: "¥", hist: { "1J": "+0.5%", "7J": "+1.1%", "1M": "+2.5%", "6M": "+8.4%" } },
        { nom: "Aussie / Dollar", ticker: "AUD/USD", desc: "Indique combien de dollars américains il faut pour acheter 1 dollar australien.", prix: 0.6420, devise: "$", hist: { "1J": "-0.4%", "7J": "-1.2%", "1M": "-2.1%", "6M": "-4.5%" } },
        { nom: "Euro / Suisse", ticker: "EUR/CHF", desc: "Indique combien de francs suisses il faut pour acheter 1 euro.", prix: 0.9540, devise: "CHF", hist: { "1J": "+0.2%", "7J": "+0.1%", "1M": "-0.8%", "6M": "-2.3%" } },
        { nom: "Dollar / CAD", ticker: "USD/CAD", desc: "Indique combien de dollars canadiens il faut pour acheter 1 dollar américain.", prix: 1.3520, devise: "CAD", hist: { "1J": "+0.3%", "7J": "+0.8%", "1M": "+1.5%", "6M": "+2.8%" } }
    ]
};

function genererCartesModernes(donnees, containerId) {
    const container = document.getElementById(containerId);
    if(!container) return;
    container.innerHTML = '';
    donnees.forEach(actif => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header"><span class="asset-name">${actif.nom}</span><span class="asset-ticker">${actif.ticker}</span></div>
            <div class="price">${actif.prix.toFixed(3)} ${actif.devise}</div>
            <div class="history">
                <div><span>1 Jour:</span> ${formatVariation(actif.hist["1J"])}</div>
                <div><span>1 Mois:</span> ${formatVariation(actif.hist["1M"])}</div>
            </div>
            <a href="#" class="btn-trade">Trader ${actif.ticker}</a>
        `;
        container.appendChild(card);
    });
}

function createCard(item) {
    return `
        <div class="card" style="box-shadow: none !important;">
            <div class="card-header">
                <span class="asset-name">${item.nom}</span>
                <span class="asset-ticker">${item.ticker}</span>
            </div>
            <div class="price">${item.prix} ${item.devise}</div>
            <div class="history">
                <div><span>1J:</span> <span class="${getChangeClass(item.hist['1J'])}">${item.hist['1J']}</span></div>
                <div><span>1M:</span> <span class="${getChangeClass(item.hist['1M'])}">${item.hist['1M']}</span></div>
                <div><span>7J:</span> <span class="${getChangeClass(item.hist['7J'])}">${item.hist['7J']}</span></div>
                <div><span>6M:</span> <span class="${getChangeClass(item.hist['6M'])}">${item.hist['6M']}</span></div>
            </div>
            <a href="#trader-${item.ticker}" class="btn-trade">Trader ${item.ticker}</a>
        </div>
    `;
}

function getChangeClass(value) {
    return value.startsWith('+') ? 'change-up' : 'change-down';
}

function initialiserCarrousels() {
    document.querySelectorAll('.prev-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const track = document.getElementById(btn.getAttribute('data-target'));
            if(track) track.scrollBy({ left: -320, behavior: 'smooth' });
        });
    });
    document.querySelectorAll('.next-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const track = document.getElementById(btn.getAttribute('data-target'));
            if(track) track.scrollBy({ left: 320, behavior: 'smooth' });
        });
    });
}

document.querySelectorAll('.carousel-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetId = e.target.getAttribute('data-target');
        const track = document.getElementById(targetId);
        if (track) {
            const scrollAmount = e.target.classList.contains('prev-btn') ? -320 : 320;
            track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    });
});

// ===================================
// Page Trader & Investir /=> Actions
// ===================================

const actionsIndex = {};

const DEFAULT_PERIOD = '1y';

// chartData peut être :
//  - un tableau simple          -> devient la série 1 an, les autres périodes sont générées (voir ensureChartData)
//  - un objet { '1d': [...], '7d': [...], '1mo': [...], '6mo': [...], '1y': [...] }
function getSeries(chartData, period) {
    if (Array.isArray(chartData)) return chartData;
    return chartData[period] || chartData[DEFAULT_PERIOD] || [];
}

/* ===== Graphique : courbe + légendes (valeurs à gauche, temps en bas) ===== */

// Durée couverte par chaque période + format des légendes de temps
const PERIOD_CONFIG = {
    '1d':  { ms: 24 * 3600e3,  format: { hour: '2-digit', minute: '2-digit' } },
    '7d':  { ms: 7 * 86400e3,  format: { weekday: 'short', day: 'numeric' } },
    '1mo': { ms: 30 * 86400e3, format: { day: 'numeric', month: 'short' } },
    '6mo': { ms: 182 * 86400e3, format: { month: 'short' } },
    '1y':  { ms: 365 * 86400e3, format: { month: 'short', year: '2-digit' } }
};

// Calcule des graduations "rondes" (10, 20, 30...) qui encadrent les données
function niceScale(min, max, targetTicks = 5) {
    if (min === max) {
        const flat = Math.abs(min) * 0.01 || 1;
        min -= flat;
        max += flat;
    }
    const margin = (max - min) * 0.03;           // un peu d'air au-dessus et en dessous de la courbe
    min -= margin;
    max += margin;

    const rough = (max - min) / (targetTicks - 1);
    const pow = Math.pow(10, Math.floor(Math.log10(rough)));
    const frac = rough / pow;
    const mult = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10;
    const step = Number((mult * pow).toPrecision(12));

    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;
    const count = Math.round((hi - lo) / step) + 1;
    const decimals = Math.min(4, (String(step).split('.')[1] || '').length);   // 4 décimales max (paires de devises)

    // Du haut vers le bas, comme à l'écran
    const ticks = Array.from({ length: count }, (_, i) => hi - i * step);
    return { lo, hi, ticks, decimals };
}

// Légendes de temps : 5 repères répartis de "il y a X" jusqu'à maintenant
function getTimeLabels(period, count = 5) {
    const cfg = PERIOD_CONFIG[period] || PERIOD_CONFIG[DEFAULT_PERIOD];
    const end = Date.now();
    return Array.from({ length: count }, (_, i) => {
        const t = end - cfg.ms + (i / (count - 1)) * cfg.ms;
        return new Date(t).toLocaleString('fr-FR', cfg.format);
    });
}

function createChartHTML(data, period, devise) {
    if (!data || data.length < 2) return '';

    const width = 300;
    const height = 120;
    const { lo, hi, ticks, decimals } = niceScale(Math.min(...data), Math.max(...data));
    const range = hi - lo;

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - lo) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    const isUp = data[data.length - 1] >= data[0];
    const strokeColor = isUp ? 'var(--color-up)' : 'var(--color-down)';

    // Lignes de repère horizontales + légendes de valeur (alignées sur les mêmes positions)
    const lastTick = ticks.length - 1;
    const gridLines = ticks.map((_, i) => {
        const y = (i / lastTick) * height;
        return `<line class="stock-chart__grid" x1="0" y1="${y}" x2="${width}" y2="${y}" vector-effect="non-scaling-stroke"/>`;
    }).join('');

    const yTexts = ticks.map(v =>
        `${v.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${devise}`
    );
    const yLabels = yTexts.map((text, i) => `<span style="top:${(i / lastTick) * 100}%">${text}</span>`).join('');
    // La colonne des valeurs s'adapte à la longueur du texte (ex. "14 000 pts")
    const yWidth = (Math.max(...yTexts.map(t => t.length)) * 0.62 + 0.4).toFixed(2);

    const xLabels = getTimeLabels(period).map(t => `<span>${t}</span>`).join('');

    return `
        <div class="stock-chart" style="grid-template-columns: ${yWidth}em minmax(0, 1fr);">
            <div class="stock-chart__y">${yLabels}</div>
            <div class="stock-chart__plot">
                <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" class="stock-chart__svg">
                    ${gridLines}
                    <polyline points="${points}" fill="none" style="stroke:${strokeColor}" stroke-width="2.5"
                              stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
                </svg>
            </div>
            <div class="stock-chart__x">${xLabels}</div>
        </div>
    `;
}

/* ===== Séries générées à partir des variations (actions, indices, devises) =====
   Pas d'historique complet, seulement hist { 1J, 7J, 1M, 6M }.
   On fabrique donc une courbe qui part du bon niveau et finit au cours actuel.
   (À remplacer par de vraies séries quand tu en auras : item.chartData = { '1d': [...], ... }) */

// Générateur pseudo-aléatoire : même ticker + même période = toujours la même courbe
function seededRandom(seed) {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return function () {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        h ^= h >>> 16;
        return (h >>> 0) / 4294967296;
    };
}

function buildSeries(prix, pct, seed, points = 30) {
    const rand = seededRandom(seed);
    const start = prix / (1 + pct / 100);                       // niveau d'il y a une période
    const amp = Math.max(Math.abs(prix - start), prix * 0.004) * 0.25;

    const walk = [0];
    for (let i = 1; i < points; i++) walk.push(walk[i - 1] + (rand() - 0.5));
    const last = walk[points - 1];

    return walk.map((w, i) => {
        const t = i / (points - 1);
        const bridge = w - t * last;                            // vaut 0 au début et à la fin
        return start + (prix - start) * t + bridge * amp;
    });
}

function ensureChartData(item) {
    if (!item.hist) return;
    // Déjà une série par période : rien à faire
    if (item.chartData && !Array.isArray(item.chartData)) return;

    const pct = key => parseFloat(item.hist[key]) || 0;
    item.chartData = {
        '1d':  buildSeries(item.prix, pct('1J'), item.ticker + '1d'),
        '7d':  buildSeries(item.prix, pct('7J'), item.ticker + '7d'),
        '1mo': buildSeries(item.prix, pct('1M'), item.ticker + '1mo'),
        '6mo': buildSeries(item.prix, pct('6M'), item.ticker + '6mo'),
        // 1 an : la courbe déjà écrite à la main pour l'action si elle existe, sinon une estimation (2 x variation 6 mois)
        '1y':  Array.isArray(item.chartData)
                   ? item.chartData
                   : buildSeries(item.prix, pct('6M') * 2, item.ticker + '1y')
    };
}

function createInfoRow(label, valueHTML) {
    return `
        <div class="stock-infos__row">
            <dt>${label}</dt>
            <dd>${valueHTML}</dd>
        </div>
    `;
}

function changeClass(variation) {
    return String(variation).startsWith('-') ? 'change-down' : 'change-up';
}

// Infos d'une action : fondamentaux
function createFundamentalsRows(action) {
    const isUpRes = action.resEvol.startsWith('+');
    const isUpDiv = action.divEvol.startsWith('+');
    return `
        ${createInfoRow('Cap. Boursière', action.cap)}
        ${createInfoRow('Résultat Net', `${action.res} <span class="${isUpRes ? 'change-up' : 'change-down'}">(${action.resEvol})</span>`)}
        ${createInfoRow('Dividendes', action.div)}
        ${createInfoRow('Évol. Dividendes', `<span class="${isUpDiv ? 'change-up' : 'change-down'}">${action.divEvol}</span>`)}
        ${createInfoRow('PER', action.per)}
        ${createInfoRow('Ratio Actifs/Cap', action.ratio)}
    `;
}

// Infos d'un indice ou d'une paire de devises : type, cotation et variations
function createMarketRows(item) {
    const type = item.ticker.includes('/') ? 'Paire de devises' : 'Indice boursier';
    const variation = key => `<span class="${changeClass(item.hist[key])}">${item.hist[key]}</span>`;
    return `
        ${createInfoRow('Type', type)}
        ${createInfoRow('Cotation', item.devise)}
        ${createInfoRow('Variation 1 jour', variation('1J'))}
        ${createInfoRow('Variation 7 jours', variation('7J'))}
        ${createInfoRow('Variation 1 mois', variation('1M'))}
        ${createInfoRow('Variation 6 mois', variation('6M'))}
    `;
}

// Un cours < 10 (paires de devises) est affiché avec 4 décimales
function formatPrice(prix) {
    return prix.toFixed(prix < 10 ? 4 : 2);
}

function createCardHTML(action) {
    actionsIndex[action.ticker] = action;
    ensureChartData(action);
    const infosRows = action.cap ? createFundamentalsRows(action) : createMarketRows(action);

    const periods = [
        ['1d', '1J'], ['7d', '7J'], ['1mo', '1M'], ['6mo', '6M'], ['1y', '1A']
    ].map(([key, label]) => `
        <button type="button" class="stock-chart__period${key === DEFAULT_PERIOD ? ' is-active' : ''}" data-period="${key}">${label}</button>
    `).join('');

    return `
        <article class="stock-card" id="trader-${action.ticker}" data-symbol="${action.ticker}">

            <header class="stock-card__header">
                <h2 class="stock-card__name">${action.nom} (${action.ticker})</h2>
                <p class="stock-card__price">${formatPrice(action.prix)} ${action.devise}</p>
            </header>

            <aside class="stock-card__infos">
                <dl class="stock-infos">
                    ${infosRows}
                </dl>
            </aside>

            <section class="stock-card__chart">
                <div class="stock-chart__periods" role="group" aria-label="Période du graphique">
                    ${periods}
                </div>
                <div class="stock-chart__canvas" id="chart-${action.ticker}">
                    ${createChartHTML(getSeries(action.chartData, DEFAULT_PERIOD), DEFAULT_PERIOD, action.devise)}
                </div>
            </section>

            <footer class="stock-card__actions">
                <a href="#achat-${action.ticker}" class="stock-btn stock-btn--buy">Acheter ${action.nom}</a>
                <a href="#vente-${action.ticker}" class="stock-btn stock-btn--sell">Vendre ${action.nom}</a>

                <div class="stock-tooltip">
                    <button type="button" class="stock-tooltip__trigger" aria-label="Informations sur ${action.nom}">
                        <i class="fa-solid fa-circle-info"></i>
                    </button>
                    <div class="stock-tooltip__content" role="tooltip">
                        <strong>${action.nom}</strong>
                        <p>${action.desc}</p>
                    </div>
                </div>
            </footer>

        </article>
    `;
}

/* ===== Navigation entre les actions ===== */

// À appeler une fois après avoir généré les cartes, avec le même tableau de données
function buildActionsNav(actions) {
    const list = document.getElementById('actions-nav-list');
    if (!list) return;

    list.innerHTML = actions.map(a => `
        <li>
            <a class="actions-nav__link" href="#trader-${a.ticker}">
                <span class="actions-nav__ticker">${a.ticker}</span>${a.nom}
            </a>
        </li>
    `).join('');
}

// Ouverture / fermeture du menu en responsive
(function initActionsNav() {
    const nav = document.getElementById('actions-nav');
    if (!nav) return;

    const toggle = nav.querySelector('.actions-nav__toggle');

    function setOpen(open) {
        nav.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open);
    }

    // Clic sur le bouton : ouvre / ferme
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));

    // Clic sur un lien : on navigue puis on referme
    nav.addEventListener('click', (e) => {
        if (e.target.closest('.actions-nav__link')) setOpen(false);
    });

    // Clic / toucher n'importe où ailleurs : on referme
    document.addEventListener('click', (e) => {
        if (!nav.contains(e.target)) setOpen(false);
    });

    // Touche Échap : on referme
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setOpen(false);
    });
})();


// ==========================================
// 4. CLASSEMENT DYNAMIQUE (Page Classement)
// ==========================================
function initLeaderboard() {
    const INITIAL_CAPITAL = 100000;
    let traders = [];
    let filteredTraders = [];
    let currentPage = 1;
    const rowsPerPage = 20;

    const formatCurrency = (val) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(val);
    const formatPercent = (val) => (val > 0 ? '+' : '') + new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' %';

    async function fetchRealLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard');
            if (!response.ok) throw new Error("HTTP erreur");
            processData(await response.json());
        } catch (error) {
            processData([]);
        }
    }

    function processData(rawData) {
        rawData.forEach(p => {
            p.gain = p.value - INITIAL_CAPITAL;
            p.perf = (p.gain / INITIAL_CAPITAL) * 100;
        });
        rawData.sort((a, b) => b.value - a.value);
        rawData.forEach((p, i) => p.rank = i + 1);

        traders = rawData;
        filteredTraders = [...traders];
        updateUI();
    }

    function updateUI() {
        const count = filteredTraders.length;
        const countText = count <= 1 ? `${count} participant` : `${count} participants`;
        document.getElementById('global-count-subtitle').innerText = countText;
        document.getElementById('total-results').innerText = countText;
        renderTop3(count);
        renderTable(count);
    }

    function renderTop3(count) {
        const top3Section = document.getElementById('top3-section');
        if (!top3Section) return;
        top3Section.innerHTML = '';
        if (count === 0) { top3Section.classList.add('hidden'); return; }
        
        top3Section.classList.remove('hidden');
        filteredTraders.slice(0, 3).forEach((p, i) => {
            const color = ['gold', 'silver', 'bronze'][i];
            const perfClass = p.perf > 0 ? 'change-up' : (p.perf < 0 ? 'change-down' : '');
            top3Section.innerHTML += `
                <div class="top3-card">
                    <div class="top3-rank text-${color}">#${p.rank}</div>
                    <div class="top3-data">
                        <div class="top3-name">${p.name}</div>
                        <div class="top3-val num-font">${formatCurrency(p.value)}</div>
                        <div class="top3-perf ${perfClass}">${formatPercent(p.perf)}</div>
                    </div>
                </div>`;
        });
    }

    function renderTable(count) {
        const tbody = document.getElementById('leaderboard-body');
        const emptyState = document.getElementById('empty-state');
        const tableInfo = document.getElementById('page-range');
        const tableHeader = document.querySelector('thead');
        
        if (!tbody) return;
        tbody.innerHTML = '';
        if (count === 0) {
            emptyState.classList.remove('hidden');
            tableHeader.classList.add('hidden');
            tableInfo.innerText = '0-0';
            updatePaginationButtons();
            return;
        }
        
        emptyState.classList.add('hidden');
        tableHeader.classList.remove('hidden');

        const startIdx = (currentPage - 1) * rowsPerPage;
        const endIdx = Math.min(startIdx + rowsPerPage, count);
        tableInfo.innerText = `${startIdx + 1}–${endIdx}`;

        filteredTraders.slice(startIdx, endIdx).forEach(p => {
            const tr = document.createElement('tr');
            const perfClass = p.perf > 0 ? 'change-up' : (p.perf < 0 ? 'change-down' : '');
            tr.innerHTML = `
                <td class="text-left text-secondary">#${p.rank}</td>
                <td class="text-left font-medium">${p.name}</td>
                <td class="num-font ${perfClass}">${formatPercent(p.perf)}</td>
                <td class="num-font">${formatCurrency(p.value)}</td>
                <td class="num-font ${perfClass}">${p.gain > 0 ? '+' : ''}${formatCurrency(p.gain)}</td>
                <td class="num-font text-secondary">${p.positions}</td>
            `;
            tbody.appendChild(tr);
        });
        updatePaginationButtons();
    }

    function updatePaginationButtons() {
        const prev = document.getElementById('btn-prev');
        const next = document.getElementById('btn-next');
        if (!prev || !next) return;
        const totalPages = Math.ceil(filteredTraders.length / rowsPerPage);
        prev.disabled = currentPage === 1;
        next.disabled = currentPage === totalPages || totalPages === 0;
    }

    document.getElementById('trader-search')?.addEventListener('input', (e) => {
        filteredTraders = traders.filter(t => t.name.toLowerCase().includes(e.target.value.toLowerCase()));
        currentPage = 1;
        updateUI();
    });

    document.getElementById('btn-prev')?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(filteredTraders.length); } });
    document.getElementById('btn-next')?.addEventListener('click', () => { if (currentPage < Math.ceil(filteredTraders.length / rowsPerPage)) { currentPage++; renderTable(filteredTraders.length); } });

    fetchRealLeaderboard();
}

// ==========================================
// 5. GESTION DE L'ESPACE ADMIN (Sessions & Codes)
// ==========================================

async function loginProf(password) {
    const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data && data.success) {
        sessionStorage.setItem('tradelab_admin_token', data.token);
        return { ok: true };
    }
    return { ok: false, message: (data && data.message) || "Connexion impossible." };
}

async function adminFetch(url, options = {}) {
    const token = sessionStorage.getItem('tradelab_admin_token');
    const res = await fetch(url, {
        ...options,
        headers: { ...(options.headers || {}), 'Authorization': 'Bearer ' + token }
    });
    if (res.status === 401) {
        sessionStorage.removeItem('tradelab_admin_token');
        window.location.href = '../connexion/connexion.html'; 
    }
    return res;
}

function initAdminSessions() {
    const container = document.getElementById('sessions-container');
    if (!container) return;

    const createModal = document.getElementById('create-modal');
    const openModalBtn = document.getElementById('open-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const sessionForm = document.getElementById('session-form');

    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput && !startDateInput.value) startDateInput.value = today;
    if (endDateInput && !endDateInput.value) endDateInput.value = nextMonth;

    if (openModalBtn && createModal) {
        openModalBtn.addEventListener('click', () => createModal.classList.remove('hidden'));
    }
    if (closeModalBtn && createModal) {
        closeModalBtn.addEventListener('click', () => createModal.classList.add('hidden'));
    }

    if (sessionForm) {
        sessionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const body = {
                name: document.getElementById('session-name').value,
                startDate: startDateInput.value,
                endDate: endDateInput.value,
                initialCapital: document.getElementById('initial-capital').value
            };

            try {
                const res = await adminFetch('/api/admin/sessions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    createModal.classList.add('hidden');
                    sessionForm.reset();
                    startDateInput.value = today;
                    endDateInput.value = nextMonth;
                    loadAdminSessions();
                } else {
                    alert(data.message || "Erreur lors de la création de la session.");
                }
            } catch (err) {
                console.error("Erreur réseau :", err);
            }
        });
    }

    loadAdminSessions();
    setInterval(loadAdminSessions, 5000);
}

async function loadAdminSessions() {
    const container = document.getElementById('sessions-container');
    if (!container) return;
    try {
        const res = await adminFetch('/api/admin/sessions');
        if (!res.ok) throw new Error("Erreur de récupération");
        const sessions = await res.json();
        renderAdminSessions(sessions);
    } catch (err) {
        console.error("Erreur chargement sessions", err);
    }
}

function renderAdminSessions(sessions) {
    const container = document.getElementById('sessions-container');
    if (!container) return;
    container.innerHTML = '';

    if (!sessions || sessions.length === 0) {
        container.innerHTML = `<p class="text-secondary">Aucune session active.</p>`;
        return;
    }

    sessions.forEach(session => {
        const card = document.createElement('div');
        card.className = `session-fin-card ${!session.isActive ? 'closed' : ''}`;
        
        let studentsHtml = '';
        if (session.participants && session.participants.length > 0) {
            studentsHtml = session.participants.map(p => `
                <div class="student-row-item">
                    <span><strong>${p.name}</strong> <span class="text-secondary">(${p.email || 'N/A'})</span></span>
                    <span class="num-font">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(p.value)}</span>
                </div>
            `).join('');
        } else {
            studentsHtml = `<div class="text-secondary" style="font-size: 0.85rem; text-align: center; padding: 10px 0;">Aucun élève inscrit pour le moment.</div>`;
        }

        card.innerHTML = `
            <div>
                <div class="session-fin-top">
                    <div>
                        <h3 class="session-fin-name">${session.name}</h3>
                        <span class="session-fin-dates">Du ${session.startDate} au ${session.endDate}</span>
                    </div>
                    <span class="level-badge ${session.isActive ? 'expert' : 'debutant'}">${session.isActive ? 'Active' : 'Clôturée'}</span>
                </div>

                <div class="session-code-display">
                    <div>
                        <span class="session-code-label">Code d'accès unique</span>
                        <span class="session-code-val">${session.code}</span>
                    </div>
                    <button class="btn-outline copy-btn" data-code="${session.code}" style="padding: 6px 12px; font-size: 0.8rem;">
                        <i class="fa-solid fa-copy"></i> Copier
                    </button>
                </div>

                <div style="margin-bottom: 12px; font-size: 0.9rem; font-weight: 500; color: #fff; display: flex; justify-content: space-between;">
                    <span>Participants inscrits</span>
                    <strong>${session.participants ? session.participants.length : 0}</strong>
                </div>
                
                <div class="session-students-box">
                    <div class="student-mini-list">
                        ${studentsHtml}
                    </div>
                </div>
            </div>

            <div style="margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 12px; display: flex; justify-content: flex-end;">
                ${session.isActive ? `<button class="btn-danger-outline close-session-btn" data-id="${session.id}" style="padding: 6px 12px; font-size: 0.8rem;">Clôturer la session</button>` : ''}
            </div>
        `;

        const copyBtn = card.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const codeToCopy = copyBtn.getAttribute('data-code');
                navigator.clipboard.writeText(codeToCopy);
                alert(`Code ${codeToCopy} copié dans le presse-papier !`);
            });
        }

        const closeBtn = card.querySelector('.close-session-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                closeSession(closeBtn.getAttribute('data-id'));
            });
        }

        container.appendChild(card);
    });
}

async function closeSession(id) {
    if (confirm("Voulez-vous vraiment clôturer cette session ?")) {
        try {
            await adminFetch(`/api/admin/sessions/${id}/close`, { method: 'POST' });
            loadAdminSessions();
        } catch (err) {
            console.error("Erreur fermeture session", err);
        }
    }
}

// ==========================================
// 6. FONCTION : GESTION DE L'AFFICHAGE DU PROFIL (Menu déroulant)
// ==========================================
function updateAuthUI() {
    // On cherche n'importe quel lien ou bouton qui contient le mot "Connexion"
    const loginBtn = Array.from(document.querySelectorAll('a, button, .btn')).find(el => 
        el.textContent.trim().toLowerCase() === 'connexion' || 
        el.textContent.trim().toLowerCase() === 'se connecter'
    );
    
    if (!loginBtn) return; // Si on ne le trouve pas, on arrête

    const adminToken = sessionStorage.getItem('tradelab_admin_token');
    const studentToken = localStorage.getItem('tradelab_token');
    const studentDataStr = localStorage.getItem('tradelab_participant');

    let pseudo = "";
    let role = "";
    let initials = "";

    if (adminToken) {
        role = "admin";
        pseudo = "Professeur";
        initials = "PR";
    } else if (studentToken && studentDataStr) {
        role = "student";
        try {
            const part = JSON.parse(studentDataStr);
            pseudo = part.name;
            initials = pseudo.substring(0, 2).toUpperCase();
        } catch(e) {}
    }

    if (role) {
        loginBtn.style.display = 'none';

        const profileContainer = document.createElement('div');
        profileContainer.style.position = 'relative';
        profileContainer.style.display = 'inline-block';
        profileContainer.style.marginLeft = '15px';

        const linkStyle = "display: block; padding: 10px; color: white; text-decoration: none; border-radius: 6px; font-size: 0.9rem; transition: 0.2s; margin-bottom: 2px;";
        const hoverFx = "onmouseover=\"this.style.background='#2A2E39'\" onmouseout=\"this.style.background='transparent'\"";

        let menuLinks = "";
        if (role === 'admin') {
            menuLinks = `
                <a href="../admin/sessions.html" style="${linkStyle}" ${hoverFx}>
                    <i class="fa-solid fa-gauge" style="margin-right: 8px; width: 16px; text-align: center;"></i> Espace Professeur
                </a>
            `;
        } else {
            menuLinks = `
                <a href="../portefeuille.html" style="${linkStyle}" ${hoverFx}>
                    <i class="fa-solid fa-wallet" style="margin-right: 8px; width: 16px; text-align: center;"></i> Mon Portefeuille
                </a>
                <a href="../parametres.html" style="${linkStyle}" ${hoverFx}>
                    <i class="fa-solid fa-gear" style="margin-right: 8px; width: 16px; text-align: center;"></i> Paramètres
                </a>
            `;
        }

        profileContainer.innerHTML = `
            <div class="profile-circle" style="width: 40px; height: 40px; border-radius: 50%; background: #22C55E; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer; user-select: none; box-shadow: 0 2px 10px rgba(34, 197, 94, 0.2);">
                ${initials}
            </div>
            <div class="profile-dropdown" style="display: none; position: absolute; right: 0; top: 50px; background: #151924; border: 1px solid #2A2E39; border-radius: 8px; width: 220px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 9999; padding: 10px;">
                <div style="padding: 10px; border-bottom: 1px solid #2A2E39; margin-bottom: 5px;">
                    <strong style="color: white; display: block; font-size: 1rem;">${pseudo}</strong>
                    <span style="font-size: 0.8rem; color: #94A3B8;">${role === 'admin' ? 'Administrateur' : 'Élève (Simulation)'}</span>
                </div>
                
                ${menuLinks}
                
                <div style="height: 1px; background: #2A2E39; margin: 5px 0;"></div>
                
                <button id="logout-btn" style="${linkStyle} width: 100%; text-align: left; background: transparent; border: none; color: #EF4444; cursor: pointer; font-family: inherit;" ${hoverFx}>
                    <i class="fa-solid fa-arrow-right-from-bracket" style="margin-right: 8px; width: 16px; text-align: center;"></i> Déconnexion
                </button>
            </div>
        `;

        loginBtn.parentNode.insertBefore(profileContainer, loginBtn.nextSibling);

        const circle = profileContainer.querySelector('.profile-circle');
        const dropdown = profileContainer.querySelector('.profile-dropdown');
        
        circle.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });

        document.addEventListener('click', () => {
            dropdown.style.display = 'none';
        });

        const logoutBtn = profileContainer.querySelector('#logout-btn');
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('tradelab_admin_token');
            localStorage.removeItem('tradelab_token');
            localStorage.removeItem('tradelab_participant');
            localStorage.removeItem('tradelab_active_session_id');
            localStorage.removeItem('tradelab_active_session_name');
            window.location.href = '../index.html'; 
        });
    }
}

// ==========================================
// 7. INITIALISATION GLOBALE DU SITE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // ---> Lancement de l'affichage du profil connecté
    updateAuthUI();

    fetchFrenchNews();
    fetchEconomicCalendar();

    isLive = true;
    marketInterval = setInterval(tickMarket, 2000);
    const actionsContainerTEI = document.getElementById('actions-container-TEI');
    const actionsContainer = document.getElementById('actions-container');
    const indicesContainer = document.getElementById('indices-container');
    const devisesContainer = document.getElementById('devises-container');
    
    if (actionsContainerTEI) {
        actionsContainerTEI.innerHTML = marketData.actions.map(createCard).join('');
    }
    if (actionsContainer) {
        actionsContainer.innerHTML = marketData.actions.map(createCardHTML).join('');
        if(typeof cardsHTML !== 'undefined') actionsContainer.innerHTML += cardsHTML;
        buildActionsNav(marketData.actions);
    }

    // Pages Indices et Devises : mêmes cartes que les actions
    const indicesDetail = document.getElementById('indices-detail-container');
    if (indicesDetail) {
        indicesDetail.innerHTML = marketData.indices.map(createCardHTML).join('');
        buildActionsNav(marketData.indices);
    }
    const devisesDetail = document.getElementById('devises-detail-container');
    if (devisesDetail) {
        devisesDetail.innerHTML = marketData.devises.map(createCardHTML).join('');
        buildActionsNav(marketData.devises);
    }
    if (indicesContainer) indicesContainer.innerHTML = marketData.indices.map(createCard).join('');
    if (devisesContainer) devisesContainer.innerHTML = marketData.devises.map(createCard).join('');


    
    initialiserCarrousels();

    if (document.getElementById('leaderboard-body')) {
        initLeaderboard();
    }
    if (document.getElementById('sessions-container')) {
        initAdminSessions();
    }

    const toggleBtn = document.getElementById('toggle-password');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const pwd = document.getElementById('password');
            if (pwd) pwd.type = pwd.type === 'password' ? 'text' : 'password';
        });
    }

    // Gestion du formulaire de connexion
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        const passwordInput = document.getElementById('password');
        
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const pwd = passwordInput ? passwordInput.value : '';
            const result = await loginProf(pwd); 
            
            if (result.ok) {
                // Succès : C'est le prof !
                window.location.href = '../admin/sessions.html'; 
            } else {
                // Échec : C'est pas le prof ! On envoie l'élève pour rejoindre une session.
                window.location.href = '../rejoindre.html'; 
            }
        });
    }
});

// ==========================================
// 8. PARCOURS ÉLÈVE : GESTION DE LA PAGE REJOINDRE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const codeForm = document.getElementById('code-form');
    if (!codeForm) return; 

    const codeInput = document.getElementById('session-code');
    const errorAlert = document.getElementById('error-alert');
    const errorMessage = document.getElementById('error-message');
    const validateBtn = document.getElementById('validate-btn');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');
    
    const previewBox = document.getElementById('simulation-preview');
    const prevName = document.getElementById('prev-name');
    const prevInstitution = document.getElementById('prev-institution');
    const prevDates = document.getElementById('prev-dates');
    const prevCapital = document.getElementById('prev-capital');
    const studentNameInput = document.getElementById('student-name');
    const startBtn = document.getElementById('start-btn');
    const backBtn = document.getElementById('back-btn');

    let currentValidatedSession = null;

    codeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorAlert.classList.add('hidden');
        
        const code = codeInput.value.trim();
        if (!code) {
            showError("Veuillez entrer un code de session.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/student/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                showError(data.message || "Code invalide ou expiré. Vérifiez votre code et réessayez.");
                setLoading(false);
                return;
            }

            currentValidatedSession = data.session;
            
            prevName.innerText = data.session.name;
            prevInstitution.innerText = data.session.institution || "TradeLab Academic";
            prevDates.innerText = `Du ${data.session.startDate} au ${data.session.endDate}`;
            prevCapital.innerText = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(data.session.initialCapital);

            codeForm.classList.add('hidden');
            previewBox.classList.remove('hidden');

        } catch (err) {
            console.error("Erreur réseau:", err);
            showError("Erreur de communication avec le serveur. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    });

    startBtn.addEventListener('click', async () => {
        const studentName = studentNameInput.value.trim();
        if (!studentName) {
            alert("Veuillez entrer votre nom ou pseudo pour commencer.");
            studentNameInput.focus();
            return;
        }

        if (!currentValidatedSession) return;

        startBtn.innerText = "Initialisation...";
        startBtn.disabled = true;

        try {
            const response = await fetch('/api/student/start-simulation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: currentValidatedSession.id,
                    studentName: studentName
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                alert(data.message || "Impossible de démarrer la simulation.");
                startBtn.innerText = "Commencer la simulation";
                startBtn.disabled = false;
                return;
            }

            localStorage.setItem('tradelab_active_session_id', data.sessionId);
            localStorage.setItem('tradelab_active_session_name', data.sessionName);
            localStorage.setItem('tradelab_participant', JSON.stringify(data.participant));
            localStorage.setItem('tradelab_token', data.token);

            window.location.href = '../index.html';

        } catch (err) {
            console.error("Erreur d'initialisation:", err);
            alert("Erreur serveur lors de la création de votre session.");
            startBtn.innerText = "Commencer la simulation";
            startBtn.disabled = false;
        }
    });

    backBtn.addEventListener('click', () => {
        previewBox.classList.add('hidden');
        codeForm.classList.remove('hidden');
        codeInput.value = '';
        codeInput.focus();
    });

    function showError(msg) {
        errorMessage.innerText = msg;
        errorAlert.classList.remove('hidden');
    }

    function setLoading(isLoading) {
        if (isLoading) {
            validateBtn.disabled = true;
            btnText.classList.add('hidden');
            btnSpinner.classList.remove('hidden');
        } else {
            validateBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
        }
    }
});


// ==========================================
// 9. PORTEFEUILLE : Gestion des graphiques
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    // bouton de scroll top
    let scrollBtn = document.getElementById("scrollTopBtn");
    const nav = document.querySelector('nav-auth');
    
    window.addEventListener("scroll", function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        scrollBtn.style.display = "none";
        // Min. 600px de scroll pour afficher le bouton
        if (scrollTop > 600) {
            scrollBtn.style.display = "flex";
        } else {
            scrollBtn.style.display = "none";
        }
    })


    const ctxPerf = document.getElementById('portfolioPerformanceChart');
    if (ctxPerf) {
        const contextPerf = ctxPerf.getContext('2d');
        const gradient = contextPerf.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.35)');
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0.0)');

        new Chart(contextPerf, {
            type: 'line',
            data: {
                labels: ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept'],
                datasets: [{
                    label: 'Valeur du portefeuille (€)',
                    data: [100000, 101200, 99800, 103500, 106000, 104200, 109800, 112000, 114250],
                    borderColor: '#22C55E',
                    borderWidth: 2,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#22C55E',
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: '#2A2E39' }, ticks: { color: '#94A3B8' } },
                    y: { grid: { color: '#2A2E39' }, ticks: { color: '#94A3B8' } }
                }
            }
        });
    }

    const ctxAlloc = document.getElementById('assetAllocationChart');
    if (ctxAlloc) {
        new Chart(ctxAlloc.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Apple', 'LVMH', 'Tesla', 'Liquidités'],
                datasets: [{
                    data: [26025, 25356, 30072, 32400],
                    backgroundColor: ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'],
                    borderWidth: 2,
                    borderColor: '#151924'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94A3B8', font: { family: 'Inter', size: 12 }, padding: 15 } }
                },
                cutout: '70%'
            }
        });
    }
});


// ==========================================
// 10. PASSAGE D'ORDRES (Achat / Vente pour les élèves)
// ==========================================
document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-action-buy') || e.target.classList.contains('btn-action-sell')) {
        e.preventDefault();
        
        const isBuy = e.target.classList.contains('btn-action-buy');
        const ticker = e.target.getAttribute('href').split('-')[1];
        
        const action = marketData.actions.find(a => a.ticker === ticker);
        if (!action) return alert("Action introuvable.");

        const quantite = prompt(`Combien d'actions ${ticker} voulez-vous ${isBuy ? 'acheter' : 'vendre'} au prix de ${action.prix} ${action.devise} ?`);
        if (!quantite || isNaN(quantite) || parseInt(quantite) <= 0) return;

        const token = localStorage.getItem('tradelab_token');
        const participantStr = localStorage.getItem('tradelab_participant');
        if (!token || !participantStr) return alert("Vous n'êtes pas connecté à une session. (Essayez de rejoindre à nouveau la session avec votre code)");

        const participantId = JSON.parse(participantStr).id;

        try {
            const response = await fetch('/api/student/orders', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    participantId: participantId,
                    symbole: ticker,
                    side: isBuy ? 'buy' : 'sell',
                    quantite: parseInt(quantite),
                    prix: action.prix
                })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                alert(`Ordre exécuté ! Vous avez ${isBuy ? 'acheté' : 'vendu'} ${quantite} actions ${ticker}.`);
            } else {
                alert(data.message || "Erreur lors de la transaction.");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur de connexion au serveur.");
        }
    }
});


/* ===== Changement de période (délégation : fonctionne pour toutes les cartes) ===== */
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.stock-chart__period');
    if (!btn) return;

    const card = btn.closest('.stock-card');
    const action = actionsIndex[card.dataset.symbol];
    if (!action) return;

    card.querySelectorAll('.stock-chart__period').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');

    card.querySelector('.stock-chart__canvas').innerHTML =
        createChartHTML(getSeries(action.chartData, btn.dataset.period), btn.dataset.period, action.devise);
});


function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
function injectScrollTopButton() {
    // Évite les doublons si le bouton est déjà dans la page
    if (document.getElementById('scrollTopBtn')) return;

    const buttonHTML = `
        <button id="scrollTopBtn" onclick="scrollToTop()" title="Remonter en haut">
            <img src="https://biggbde.fr/assets/svg/angle-up-svgrepo-com.svg" alt="Angled Up Arrow SVG ; AUTHOR: FortAwesome" class="scroll-icon" />
        </button>
    `;

    // Dans le footer en priorité, sinon à la fin du body
    const target = document.querySelector('footer.app-footer') || document.querySelector('footer') || document.body;
    target.insertAdjacentHTML('beforeend', buttonHTML);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectScrollTopButton);
} else {
    injectScrollTopButton();
}