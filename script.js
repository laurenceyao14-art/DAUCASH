document.addEventListener('DOMContentLoaded', function() {

  // ─── CONSTANTES GLOBALES ──────────────────────────────────────────────────────
  const CAC40_TAUX_ANNUEL = 4.4;
  const CAC40_LABEL       = 'CAC 40 moy. depuis 2001 (~4,4 %/an)';
  const CAC40_COLOR       = '#5bbfe8';

  let monGraphique = null;

  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  });

  // ─── MISE EN CACHE DU DOM ─────────────────────────────────────────────────────
  const formCalcul       = document.getElementById('form-calcul');
  const inputCapital     = document.getElementById('capital');
  const inputEpargne     = document.getElementById('epargne');
  const inputHorizon     = document.getElementById('horizon');
  const inputTaux        = document.getElementById('taux');
  const inputIntervalle  = document.getElementById('intervalle');

  const resultPlaceholder = document.getElementById('result-placeholder');
  const resultContent     = document.getElementById('result-content');
  const elCapitalFinal    = document.getElementById('capital-final');
  const elTotalVerse      = document.getElementById('total-verse');
  const elTotalInterets   = document.getElementById('total-interets');
  const apiBreakdown      = document.getElementById('api-breakdown');
  const tickerLabel       = document.getElementById('ticker-label');
  const tickerValue       = document.getElementById('ticker-value');
  const ctxChart          = document.getElementById('scenariosChart').getContext('2d');
  const resultMainNode    = document.querySelector('.result-main');

  // ─── FONCTIONS LOGIQUES ───────────────────────────────────────────────────────
  function simulerScenario(capitalInitial, versement, nbMoisTotaux, tauxAnnuel, frequenceMois) {
    let capital    = capitalInitial;
    let cumulVerse = capitalInitial;
    const tauxMensuel = (tauxAnnuel / 100) / 12;
    const historique  = [{ mois: 0, total: capital, versements: cumulVerse }];

    for (let m = 1; m <= nbMoisTotaux; m++) {
      capital += capital * tauxMensuel;
      if (m % frequenceMois === 0) {
        capital    += versement;
        cumulVerse += versement;
      }
      historique.push({ mois: m, total: capital, versements: cumulVerse });
    }
    return historique;
  }

  function lancerConfettis() {
    const colors = ['#c9a84c', '#e4c97a', '#4caf7d', '#5bbfe8', '#ffffff', '#f0d080'];
    const defaults = { colors, gravity: 0.85, scalar: 1.0 };

    confetti({ ...defaults, particleCount: 120, spread: 80, origin: { x: 0.5, y: 0.55 }, scalar: 1.1, gravity: 0.9, ticks: 280 });
    setTimeout(() => confetti({ ...defaults, particleCount: 60, angle: 60, spread: 65, origin: { x: 0, y: 0.6 }, ticks: 240 }), 180);
    setTimeout(() => confetti({ ...defaults, particleCount: 60, angle: 120, spread: 65, origin: { x: 1, y: 0.6 }, ticks: 240 }), 320);
    setTimeout(() => confetti({ ...defaults, particleCount: 40, spread: 100, origin: { x: 0.5, y: 0.3 }, shapes: ['star'], scalar: 1.4, gravity: 0.7, ticks: 300 }), 600);
  }

  function afficherBadgeMillionnaire(actif) {
    let badge = document.getElementById('badge-millionnaire');

    if (!actif) {
      if (badge) badge.remove();
      return;
    }
    if (badge) return;

    badge = document.createElement('div');
    badge.id = 'badge-millionnaire';
    badge.innerHTML = `<span class="badge-icon">🏆</span><span class="badge-text">Objectif millionnaire atteint !</span>`;

    resultMainNode.insertAdjacentElement('afterend', badge);
    requestAnimationFrame(() => badge.classList.add('badge-visible'));
  }


  // ─── ÉVÉNEMENT PRINCIPAL DE CALCUL ────────────────────────────────────────────
  if (formCalcul) {
    formCalcul.addEventListener('submit', function (event) {
      event.preventDefault();

      const capitalInitial = parseFloat(inputCapital.value)  || 0;
      const versement      = parseFloat(inputEpargne.value)  || 0;
      const horizonAnnees  = parseInt(inputHorizon.value)    || 0;
      const tauxAnnuelBase = parseFloat(inputTaux.value)     || 0;
      const frequenceMois  = parseInt(inputIntervalle.value) || 1;
      const nbMoisTotaux   = horizonAnnees * 12;

      const parcoursA     = simulerScenario(capitalInitial, versement, nbMoisTotaux, tauxAnnuelBase, frequenceMois);
      const parcoursB     = simulerScenario(capitalInitial, versement, nbMoisTotaux, tauxAnnuelBase + 2, frequenceMois);
      const parcoursC     = simulerScenario(capitalInitial, versement, nbMoisTotaux, Math.max(0, tauxAnnuelBase - 2), frequenceMois);
      const parcoursCAC40 = simulerScenario(capitalInitial, versement, nbMoisTotaux, CAC40_TAUX_ANNUEL, frequenceMois);

      const finalA         = parcoursA[parcoursA.length - 1];
      const finalCAC40     = parcoursCAC40[parcoursCAC40.length - 1];
      const totalInteretsA = finalA.total - finalA.versements;

      resultPlaceholder.style.display = 'none';
      resultContent.classList.remove('hidden');

      elCapitalFinal.textContent  = formatter.format(finalA.total);
      elTotalVerse.textContent    = formatter.format(finalA.versements);
      elTotalInterets.textContent = formatter.format(totalInteretsA);

      apiBreakdown.classList.remove('hidden');
      tickerLabel.textContent = 'CAC 40 moy. 2001';
      tickerValue.textContent = formatter.format(finalCAC40.total);
      tickerValue.style.color = CAC40_COLOR;

      const depasse1M = finalA.total >= 1_000_000;
      afficherBadgeMillionnaire(depasse1M);
      if (depasse1M) lancerConfettis();

      const labelsX = parcoursA.map(d => d.mois === 0 ? "Aujourd'hui" : (d.mois % 12 === 0 ? `An ${d.mois / 12}` : ''));

      if (monGraphique !== null) {
        monGraphique.destroy();
      }

      monGraphique = new Chart(ctxChart, {
        type: 'line',
        data: {
          labels: labelsX,
          datasets: [
            { label: 'Optimiste (+2 %)', data: parcoursB.map(d => d.total), borderColor: '#4caf7d', backgroundColor: 'transparent', borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 4, fill: false, tension: 0.2, borderDash: [4, 4] },
            { label: `Scénario de base (${tauxAnnuelBase} %)`, data: parcoursA.map(d => d.total), borderColor: '#c9a84c', backgroundColor: 'rgba(201, 168, 76, 0.07)', borderWidth: 3, pointRadius: 0, pointHoverRadius: 6, fill: true, tension: 0.2 },
            { label: CAC40_LABEL, data: parcoursCAC40.map(d => d.total), borderColor: CAC40_COLOR, backgroundColor: 'rgba(91, 191, 232, 0.05)', borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5, fill: false, tension: 0.2 },
            { label: 'Pessimiste (-2 %)', data: parcoursC.map(d => d.total), borderColor: '#5a5a6e', backgroundColor: 'transparent', borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 4, fill: false, tension: 0.2, borderDash: [5, 5] },
            { label: 'Capital versé (sans intérêts)', data: parcoursA.map(d => d.versements), borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'transparent', borderWidth: 1, pointRadius: 0, pointHoverRadius: 0, fill: false, tension: 0, borderDash: [2, 4] }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: true, position: 'top', labels: { color: '#9a9488', font: { family: 'Outfit', size: 11 }, boxWidth: 16, padding: 14 } },
            tooltip: {
              backgroundColor: '#131620', titleColor: '#eeeae0', bodyColor: '#eeeae0', borderColor: 'rgba(201, 168, 76, 0.25)', borderWidth: 1, padding: 14, boxPadding: 6, titleFont: { family: 'Outfit', size: 13, weight: 'bold' }, bodyFont: { family: 'Outfit', size: 13 },
              callbacks: {
                title: function (context) {
                  const index = context[0].dataIndex;
                  const mois  = parcoursA[index].mois;
                  if (mois === 0) return 'Situation initiale';
                  const annees    = Math.floor(mois / 12);
                  const resteMois = mois % 12;
                  return resteMois === 0 ? `Horizon : ${annees} an${annees > 1 ? 's' : ''}` : `Horizon : ${annees} an${annees > 1 ? 's' : ''} et ${resteMois} mois`;
                },
                label: function (context) {
                  let label = context.dataset.label || '';
                  if (label) label += ' : ';
                  if (context.parsed.y !== null) label += formatter.format(context.parsed.y);
                  return label;
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#5a5a6e', font: { family: 'Outfit', size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 7 } },
            y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#5a5a6e', font: { family: 'Outfit', size: 11 }, callback: value => formatter.format(value) } }
          }
        }
      });
    });
  }

});
