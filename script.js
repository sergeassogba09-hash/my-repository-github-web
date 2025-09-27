// ====== Données d'ensoleillement (h/jour) ======
const ensoleillement = {
  lome: 5.0, kara: 5.5, dapaong: 6.0, atacora: 5.8,
  cotonou: 4.8, sokode: 5.4, kpalime: 5.2, tsevie: 5.1
};

// ====== Éléments du DOM ======
const menuToggle = document.getElementById('menuToggle');
const menuPanel = document.getElementById('menuPanel');
const shareBtn = document.getElementById('shareBtn');
const themeToggle = document.getElementById('themeToggle');

const appareilsBody = document.getElementById('appareilsBody');
const addRowBtn = document.getElementById('addRow');
const calculateBtn = document.getElementById('calculate');
const proDesignBtn = document.getElementById('getProDesign');

const villeEl = document.getElementById('ville');
const rendementEl = document.getElementById('rendement');
const DODEl = document.getElementById('DOD');
const tensionBattEl = document.getElementById('tensionBatt');
const joursAutonomieEl = document.getElementById('joursAutonomie');
const distanceEl = document.getElementById('distance');
const localTechEl = document.getElementById('localTech');

const paymentForm = document.getElementById('paymentForm');
const payForm = document.getElementById('payForm');
const materialList = document.getElementById('materialList');
const matList = document.getElementById('matList');
const quotePopup = document.getElementById('quotePopup');
const closeQuote = document.getElementById('closeQuote');
const quoteText = document.getElementById('quoteText');
let quoteTimer = null;

// Dashboard cards
const cardVille = document.getElementById('cardVille');
const cardEnergie = document.getElementById('cardEnergie');
const cardPanneaux = document.getElementById('cardPanneaux');
const cardBatterie = document.getElementById('cardBatterie');
const cardOnduleur = document.getElementById('cardOnduleur');

// Charts
let barChart = null;
let pieChart = null;

// Modal
const modal = document.getElementById('resultModal');
const closeModalBtn = document.getElementById('closeModal');
const modalGetProBtn = document.getElementById('modalGetProDesign');
let modalTimeoutId = null;

// Dimensionnement
const dimensionnementSection = document.getElementById('dimensionnementSection');
const dimensionnementBody = document.getElementById('dimensionnementBody');
const downloadPdfBtn = document.getElementById('downloadPdf');

// ====== Menu & thème ======
menuToggle.addEventListener('click', () => {
  const visible = menuPanel.style.display === 'block';
  menuPanel.style.display = visible ? 'none' : 'block';
});

shareBtn.addEventListener('click', () => {
  if (navigator.share) {
    navigator.share({ title: 'Calculateur Solaire', url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href);
    showToast('Lien copié dans le presse-papiers !');
  }
});

themeToggle.addEventListener('change', (e) => {
  document.body.classList.toggle('light', e.target.checked);
});

// ====== Appareils (aucune valeur prédéfinie) ======
function addRow(preset = { nom: '', puissance: '', heures: '', nombre: '' }) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" placeholder="Ex: TV" value="${preset.nom}"></td>
    <td><input type="number" min="0" step="1" placeholder="Ex: 100" value="${preset.puissance}"></td>
    <td><input type="number" min="0" step="0.5" placeholder="Ex: 4" value="${preset.heures}"></td>
    <td><input type="number" min="1" step="1" placeholder="Ex: 1" value="${preset.nombre}"></td>
    <td><button class="remove-btn">Supprimer</button></td>
  `;
  tr.querySelector('.remove-btn').addEventListener('click', () => tr.remove());
  appareilsBody.appendChild(tr);
}
addRow(); // une ligne vide pour commencer
addRowBtn.addEventListener('click', () => addRow());

// ====== Utilitaires ======
function getAppareils() {
  const rows = [...appareilsBody.querySelectorAll('tr')];
  const list = rows.map(row => {
    const [nomEl, pEl, hEl, nEl] = row.querySelectorAll('input');
    return {
      nom: (nomEl.value || '').trim() || 'Appareil',
      puissance: Number(pEl.value),
      heures: Number(hEl.value),
      nombre: Number(nEl.value)
    };
  }).filter(a => a.puissance > 0 && a.heures > 0 && a.nombre > 0);
  return list;
}

function getParams() {
  const ville = villeEl.value;
  const hSolaire = ensoleillement[ville] || 5;
  const rendement = Number(rendementEl.value);
  const DOD = Number(DODEl.value);
  const tensionBatt = Number(tensionBattEl.value);
  const joursAutonomie = Number(joursAutonomieEl.value);
  const distance = Number(distanceEl.value);
  const localTech = localTechEl.value === 'oui';

  const valid = [rendement, DOD, tensionBatt, joursAutonomie, distance].every(v => !isNaN(v) && v > 0);
  return { ville, hSolaire, rendement, DOD, tensionBatt, joursAutonomie, distance, localTech, valid };
}

// ====== Calculs de base ======
function calculSolaire(appareils, params) {
  const { hSolaire, rendement, DOD, tensionBatt, joursAutonomie } = params;

  const E_conso = appareils.reduce((t, a) => t + (a.puissance * a.heures * a.nombre), 0);
  const E_corrigee = E_conso / rendement;
  const P_panneaux = E_corrigee / hSolaire;

  const C_batt_Ah = (E_conso * joursAutonomie) / (tensionBatt * DOD);
  const P_max = Math.max(...appareils.map(a => a.puissance * a.nombre));
  const P_onduleur = P_max * 1.25;

  return { E_conso, E_corrigee, P_panneaux, C_batt_Ah, P_onduleur };
}

// ====== Rendu dashboard & graphiques ======
function renderDashboard(params, base) {
  const villeTxt = `${params.ville.charAt(0).toUpperCase() + params.ville.slice(1)} (${params.hSolaire} h/j)`;
  cardVille.textContent = villeTxt;
  cardEnergie.textContent = `${base.E_conso.toFixed(2)} Wh/jour`;
  cardPanneaux.textContent = `${base.P_panneaux.toFixed(2)} Wc`;
  cardBatterie.textContent = `${base.C_batt_Ah.toFixed(2)} Ah`;
  cardOnduleur.textContent = `${base.P_onduleur.toFixed(2)} W`;
}

function renderCharts(appareils) {
  const labels = appareils.map(a => a.nom);
  const dataWh = appareils.map(a => a.puissance * a.heures * a.nombre);

  if (barChart) barChart.destroy();
  if (pieChart) pieChart.destroy();

  barChart = new Chart(document.getElementById('barChart').getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Wh/j', data: dataWh, backgroundColor: '#2563eb', borderRadius: 6 }] },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--muted') } },
        y: { beginAtZero: true, ticks: { color: getComputedStyle(document.body).getPropertyValue('--muted') } }
      }
    }
  });

  pieChart = new Chart(document.getElementById('pieChart').getContext('2d'), {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: dataWh,
        backgroundColor: ['#22c55e','#f59e0b','#ef4444','#3b82f6','#a855f7','#10b981','#fb7185','#0ea5e9']
      }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: getComputedStyle(document.body).getPropertyValue('--muted') } } } }
  });
}

// ====== Dimensionnement minutieux ======
// Hypothèses standardisées pour structurer le dimensionnement
const PANEL_WATT = 350;         // Watt crête par panneau
const PANEL_AREA = 1.8;         // m² par panneau (approximatif)
const REGULATOR_MAX_A = 40;     // Intensité par régulateur
const INVERTER_STEPS = [500, 800, 1000, 1500, 2000, 3000, 5000]; // W
const BATTERY_UNIT_V = 12;      // Batterie nominale
const BATTERY_UNIT_AH = 200;    // Capacité par batterie (Ah)
const COPPER_K = 56;            // Conductivité (m * ohm * mm²) ~ simplifiée
const MAX_VDROP = 0.03;         // 3% de chute de tension max
const EXTRA_LOCAL_TECH_M = 5;   // mètres supplémentaires si local technique présent

function roundUp(value, stepArray) {
  for (const s of stepArray) if (value <= s) return s;
  return stepArray[stepArray.length - 1];
}

function cableSection(I, V, L) {
  // section S ≈ (2 * L * I) / (k * (ΔV/V)) -> simplifiée
  const dv = MAX_VDROP * V;
  const S = (2 * L * I) / (COPPER_K * dv);
  // Convert to common sizes
  if (S <= 2.5) return 2.5;
  if (S <= 4) return 4;
  if (S <= 6) return 6;
  if (S <= 10) return 10;
  if (S <= 16) return 16;
  if (S <= 25) return 25;
  return 35;
}

function buildDimensionnement(appareils, params, base) {
  const { tensionBatt, distance, localTech } = params;

  // Panneaux
  const nbPanels = Math.max(1, Math.ceil(base.P_panneaux / PANEL_WATT));
  const panelArrayPowerW = nbPanels * PANEL_WATT;

  // Courant côté PV approximatif
  const I_array = panelArrayPowerW / tensionBatt; // W/V = A
  const regCount = Math.max(1, Math.ceil(I_array / REGULATOR_MAX_A));

  // Onduleur
  const inverterRated = roundUp(base.P_onduleur, INVERTER_STEPS);

  // Batteries: calcul séries pour atteindre la tension système
  const seriesCount = Math.max(1, Math.ceil(tensionBatt / BATTERY_UNIT_V));
  const capacityPerStringAh = BATTERY_UNIT_AH; // en Ah à la tension de batterie unitaire
  const stringsNeeded = Math.max(1, Math.ceil(base.C_batt_Ah / capacityPerStringAh));
  const totalBatteries = seriesCount * stringsNeeded;

  // Câbles: longueur totale estimée
  const cableBaseLength = distance + (localTech ? EXTRA_LOCAL_TECH_M : 0);
  const cableLengthDC = Math.max(0, cableBaseLength); // DC entre panneaux/batteries/régulateur
  const cableLengthAC = Math.max(0, cableBaseLength); // AC vers onduleur/charge

  // Sections de câbles (DC et AC)
  const sectionDC = cableSection(I_array, tensionBatt, cableLengthDC);
  const I_ac = inverterRated / tensionBatt; // approx pour sizing section (simplifié)
  const sectionAC = cableSection(I_ac, tensionBatt, cableLengthAC);

  // Surface requise
  const surfaceReq = nbPanels * PANEL_AREA;

  // Tableau détaillé
  const rows = [
    // Quantitatif
    { cat: 'Quantitatif', param: 'Nombre de panneaux', val: nbPanels, det: `${PANEL_WATT} Wc par panneau` },
    { cat: 'Quantitatif', param: 'Nombre de régulateurs', val: regCount, det: `Max ${REGULATOR_MAX_A} A par régulateur` },
    { cat: 'Quantitatif', param: 'Nombre d’onduleurs', val: 1, det: `${inverterRated} W (arrondi)` },
    { cat: 'Quantitatif', param: 'Nombre de batteries', val: totalBatteries, det: `${BATTERY_UNIT_AH} Ah, ${BATTERY_UNIT_V} V, ${seriesCount} en série × ${stringsNeeded} en parallèle` },
    { cat: 'Quantitatif', param: 'Longueur câbles DC', val: `${cableLengthDC} m`, det: localTech ? `Inclut ${EXTRA_LOCAL_TECH_M} m (local technique)` : 'Liaison standard' },
    { cat: 'Quantitatif', param: 'Longueur câbles AC', val: `${cableLengthAC} m`, det: localTech ? `Inclut ${EXTRA_LOCAL_TECH_M} m (local technique)` : 'Liaison standard' },

    // Électrique
    { cat: 'Électrique', param: 'Puissance panneaux (total)', val: `${panelArrayPowerW} Wc`, det: `${nbPanels} × ${PANEL_WATT} Wc` },
    { cat: 'Électrique', param: 'Tension système', val: `${tensionBatt} V`, det: 'Configuration série des batteries' },
    { cat: 'Électrique', param: 'Courant array (approx)', val: `${I_array.toFixed(1)} A`, det: 'W/V = A' },
    { cat: 'Électrique', param: 'Section câble DC', val: `${sectionDC} mm²`, det: `Chute de tension ≤ ${(MAX_VDROP*100).toFixed(0)}%` },
    { cat: 'Électrique', param: 'Onduleur (arrondi)', val: `${inverterRated} W`, det: 'Avec marge' },
    { cat: 'Électrique', param: 'Section câble AC', val: `${sectionAC} mm²`, det: `Dimensionné sur ${inverterRated} W` },

    // Métrique
    { cat: 'Métrique', param: 'Surface requise', val: `${surfaceReq.toFixed(2)} m²`, det: `≈ ${PANEL_AREA} m² par panneau` }
  ];

  return rows;
}

// ====== Actions calcul ======
function calculate() {
  // cancel previous modal timer
  if (modalTimeoutId) { clearTimeout(modalTimeoutId); modalTimeoutId = null; }
  const appareils = getAppareils();
  if (appareils.length === 0) {
    showToast('Ajoute au moins un appareil valide (puissance > 0, heures > 0, nombre > 0).');
    return;
  }
  const params = getParams();
  if (!params.valid) {
    showToast('Renseigne tous les paramètres (rendement, DOD, tension, jours autonomie, distance).');
    return;
  }

  const base = calculSolaire(appareils, params);
  renderDashboard(params, base);
  renderCharts(appareils);

 
  

  // show modal after 10 seconds
modalTimeoutId = setTimeout(() => {
  modal.style.display = 'flex';
}, 10000);
}

calculateBtn.addEventListener('click', calculate);

// ====== Variables de contrôle ======
let freeTries = parseInt(localStorage.getItem("freeTries") || "0", 10);
let paymentValidated = localStorage.getItem("paymentValidated") === "true";

const paymentOverlay = document.getElementById('paymentOverlay');
const overlayPayForm = document.getElementById('overlayPayForm');
const toast = document.getElementById("toast");
const payBtn = document.getElementById("payBtn");

// ====== Fonction toast ======
function showToast(message) {
  toast.textContent = message;
  toast.className = "toast show";
  setTimeout(() => {
    toast.className = toast.className.replace("show", "");
  }, 4000);
}

// ====== Fonction principale Calculer ======
function calculate() {
  if (!paymentValidated) {
    freeTries++;
    localStorage.setItem("freeTries", freeTries);

    if (freeTries > 2) {
      showToast("⚠️ Nombre d'essais gratuits atteint, veuillez payer pour continuer.");
      return; // on bloque le calcul
    }
  } else {
    // Paiement validé → 5 essais
    freeTries++;
    localStorage.setItem("freeTries", freeTries);

    if (freeTries > 5) {
      showToast("⚠️ Vos 5 essais après paiement sont épuisés. Veuillez renouveler le paiement.");
      return;
    }
  }

  // Ici on exécute les calculs normaux
  const appareils = getAppareils();
  const params = getParams();
  if (appareils.length === 0 || !params.valid) {
    showToast("⚠️ Complète les paramètres et ajoute au moins un appareil valide.");
    return;
  }

  const base = calculSolaire(appareils, params);
  renderDashboard(params, base);
  renderCharts(appareils);

  const rows = buildDimensionnement(appareils, params, base);
  dimensionnementBody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.cat}</td><td>${r.param}</td><td>${r.val}</td><td>${r.det}</td>`;
    dimensionnementBody.appendChild(tr);
  });
  dimensionnementSection.style.display = 'block';
}

calculateBtn.addEventListener('click', calculate);

// ====== Bouton Paiement ======
payBtn.addEventListener('click', () => {
  showPaymentOverlay();
});

// ====== Overlay de paiement ======
function showPaymentOverlay() {
  paymentOverlay.style.display = 'flex';
}

// Vérifier au chargement si paiement non validé
window.addEventListener("load", () => {
  if (!paymentValidated && freeTries > 2) {
    setTimeout(() => {
      showToast("⚠️ Nombre d'essais gratuits atteint, veuillez payer pour continuer.");
    }, 1000);
  }
  if (paymentValidated && freeTries > 5) {
    setTimeout(() => {
      showToast("⚠️ Vos 5 essais après paiement sont épuisés. Veuillez renouveler le paiement.");
    }, 1000);
  }
});

// Validation du paiement
overlayPayForm.addEventListener('submit', (e) => {
  e.preventDefault();
  paymentValidated = true;
  localStorage.setItem("paymentValidated", "true");
  freeTries = 0; // reset compteur
  localStorage.setItem("freeTries", freeTries);
  paymentOverlay.style.display = 'none';
  showToast("✅ Paiement validé. Vous avez désormais droit à 5 essais.");
});

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast show";
  setTimeout(() => {
    toast.className = toast.className.replace("show", "");
  }, 3000);
}

const guideBtn = document.getElementById("guideBtn");
const guideModal = document.getElementById("guideModal");
const closeGuide = document.getElementById("closeGuide");

guideBtn.addEventListener("click", () => {
  guideModal.style.display = "flex";
});

closeGuide.addEventListener("click", () => {
  guideModal.style.display = "none";
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}


const closeOverlay = document.getElementById("closeOverlay");

closeOverlay.addEventListener("click", () => {
  paymentOverlay.style.display = "none";
});

const privacyBtn = document.getElementById("privacyBtn");
const privacyModal = document.getElementById("privacyModal");
const closePrivacy = document.getElementById("closePrivacy");

privacyBtn.addEventListener("click", () => {
  privacyModal.style.display = "flex";
});

closePrivacy.addEventListener("click", () => {
  privacyModal.style.display = "none";
});

// Fermer si on clique en dehors du contenu
window.addEventListener("click", (e) => {
  if (e.target === privacyModal) {
    privacyModal.style.display = "none";
  }
});
