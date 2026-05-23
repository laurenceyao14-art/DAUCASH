let capitalFinalBrut = 0;


// Variable globale pour stocker l'instance du graphique et éviter les conflits visuels
let monGraphique = null;




document.querySelector("#form-calcul").addEventListener("submit", function(event) {
 event.preventDefault();




 // Récupération des données du formulaire
 const capitalInitial = parseFloat(document.getElementById("capital").value) || 0;
 const versement = parseFloat(document.getElementById("epargne").value) || 0;
 const horizonAnnees = parseInt(document.getElementById("horizon").value) || 0;
 const tauxAnnuelBase = parseFloat(document.getElementById("taux").value) || 0;
 const frequenceMois = parseInt(document.getElementById("intervalle").value) || 1;




 const nbMoisTotaux = horizonAnnees * 12;




 // Définition des 3 scénarios (Base, Optimiste +2%, Pessimiste -2%)
 const tauxA = tauxAnnuelBase;
 const tauxB = tauxAnnuelBase + 2;
 const tauxC = Math.max(0, tauxAnnuelBase - 2);




 // Fonction interne pour simuler un scénario précis mois par mois
 function simulerScenario(tauxAnnuel) {
   let capital = capitalInitial;
   let cumulVerse = capitalInitial;
   const tauxMensuel = (tauxAnnuel / 100) / 12;
   const historique = [];




   // Point initial (Mois 0)
   historique.push({ mois: 0, total: capital, versements: cumulVerse });




   for (let m = 1; m <= nbMoisTotaux; m++) {
     capital += capital * tauxMensuel;
     if (m % frequenceMois === 0) {
       capital += versement;
       cumulVerse += versement;
     }
     historique.push({ mois: m, total: capital, versements: cumulVerse });
   }
   return historique;
 }




 // Calcul des courbes des 3 scénarios
 const parcoursA = simulerScenario(tauxA);
 const parcoursB = simulerScenario(tauxB);
 const parcoursC = simulerScenario(tauxC);




 // Extraction des données finales du scénario de base pour les blocs de texte
 const finalA = parcoursA[parcoursA.length - 1];
 const totalInteretsA = finalA.total - finalA.versements;




 // Affichage du bloc de résultats
 document.getElementById("result-placeholder").style.display = "none";
 document.getElementById("result-content").classList.remove("hidden");




 // Formatage des chiffres en Euros (€) sans décimales pour épurer le rendu
 const formatter = new Intl.NumberFormat('fr-FR', {
   style: 'currency',
   currency: 'EUR',
   maximumFractionDigits: 0
 });


  capitalFinalBrut = finalA.total;


 document.getElementById("capital-final").textContent = formatter.format(finalA.total);
 document.getElementById("total-verse").textContent = formatter.format(finalA.versements);
 document.getElementById("total-interets").textContent = formatter.format(totalInteretsA);




 // Génération des étiquettes temporelles de l'axe X (Filtré pour ne pas surcharger)
 const labelsX = parcoursA.map(d => {
   if (d.mois === 0) return "Aujourd'hui";
   return d.mois % 12 === 0 ? `Année ${d.mois / 12}` : "";
 });




 // Extraction des tableaux de valeurs pour Chart.js
 const donneesBase = parcoursA.map(d => d.total);
 const donneesOptimiste = parcoursB.map(d => d.total);
 const donneesPessimiste = parcoursC.map(d => d.total);




 // Sécurité : Si un graphique existe déjà, on le détruit avant de recréer
 if (monGraphique !== null) {
   monGraphique.destroy();
 }




 // Configuration et initialisation de Chart.js
 const ctx = document.getElementById('scenariosChart').getContext('2d');
 monGraphique = new Chart(ctx, {
   type: 'line',
   data: {
     labels: labelsX,
     datasets: [
       {
         label: 'Scénario Optimiste (+2%)',
         data: donneesOptimiste,
         borderColor: '#4caf7d',
         backgroundColor: 'rgba(76, 175, 125, 0.03)',
         borderWidth: 2,
         pointRadius: 0,
         pointHoverRadius: 5,
         fill: true,
         tension: 0.15
       },
       {
         label: 'Scénario de Base',
         data: donneesBase,
         borderColor: '#c9a84c',
         backgroundColor: 'rgba(201, 168, 76, 0.05)',
         borderWidth: 3,
         pointRadius: 0,
         pointHoverRadius: 6,
         fill: true,
         tension: 0.15
       },
       {
         label: 'Scénario Pessimiste (-2%)',
         data: donneesPessimiste,
         borderColor: '#cb6168ff',
         backgroundColor: 'transparent',
         borderWidth: 2,
         pointRadius: 0,
         pointHoverRadius: 5,
         borderDash: [5, 5],
         tension: 0.15
       }
     ]
   },
   options: {
     responsive: true,
     maintainAspectRatio: false,
     interaction: {
       mode: 'index',
       intersect: false
     },
     plugins: {
       legend: {
         display: true,
         position: 'top',
         labels: {
           color: '#9a9488',
           font: { family: 'Outfit', size: 12 }
         }
       },
       tooltip: {
         backgroundColor: '#131620',
         titleColor: '#eeeae0',
         bodyColor: '#eeeae0',
         borderColor: 'rgba(201, 168, 76, 0.2)',
         borderWidth: 1,
         padding: 12,
         boxPadding: 6,
         titleFont: { family: 'Outfit', size: 13, weight: 'bold' },
         bodyFont: { family: 'Outfit', size: 13 },
         callbacks: {
           title: function(context) {
             const index = context[0].dataIndex;
             const mois = parcoursA[index].mois;
             if (mois === 0) return "Situation initiale";
             const annees = Math.floor(mois / 12);
             const resteMois = mois % 12;
             return resteMois === 0 ? `Horizon : ${annees} ans` : `Horizon : ${annees} ans et ${resteMois} mois`;
           },
           label: function(context) {
             let label = context.dataset.label || '';
             if (label) label += ' : ';
             if (context.parsed.y !== null) {
               label += formatter.format(context.parsed.y);
             }
             return label;
           }
         }
       }
     },
     scales: {
       x: {
         grid: { display: false },
         ticks: {
           color: '#f2f2fbff',
           font: { family: 'Outfit', size: 11 },
           maxRotation: 0,
           autoSkip: true,
           maxTicksLimit: 6
         }
       },
       y: {
         grid: { color: 'rgba(255, 255, 255, 0.03)' },
         ticks: {
           color: '#faf2f2ff',
           font: { family: 'Outfit', size: 11 },
           callback: function(value) { return formatter.format(value); }
         }
       }
     }
   }
 });
});


// --- FONCTIONNALITÉ API TAUX DE CHANGE ---


async function getExchangeRate() {
 // 1. On vérifie si l'utilisateur a d'abord calculé son capital
 if (capitalFinalBrut === 0) {
   alert("Veuillez d'abord calculer votre capital.");
   return;
 }


 try {
   // 2. Appel à ton API avec ta clé (Base : EUR car DauCash est en Euros)
   let response = await fetch(
     "https://v6.exchangerate-api.com/v6/d34571f1bcb0841a0863c27e/latest/EUR"
   );
   let data = await response.json();
  
   // 3. On récupère la devise choisie dans le menu déroulant du HTML (ex: "USD")
   const targetCurrency = document.getElementById("target-currency").value;
  
   // 4. On extrait le taux avec la syntaxe de ton API
   const rate = data.conversion_rates[targetCurrency];
  
   // 5. Calcul mathématique
   const convertedAmount = capitalFinalBrut * rate;
  
   // 6. Formatage visuel propre et affichage
   const formatter = new Intl.NumberFormat('fr-FR', {
     style: 'currency',
     currency: targetCurrency,
     maximumFractionDigits: 0,
     currencyDisplay: 'narrowSymbol'
   });
  
   const resultElement = document.getElementById("converted-result");
   resultElement.textContent = `Équivalent : ${formatter.format(convertedAmount)}`;
   resultElement.style.display = "block";


 } catch (error) {
   // Gestion des erreurs si l'API ne répond pas
   console.error("Erreur API :", error);
   alert("Impossible de récupérer les taux de change pour le moment.");
 }
}


// Écouteur d'événement sur ton bouton "Convertir"
document.getElementById("btn-convert").addEventListener("click", function() {
 getExchangeRate();
});
