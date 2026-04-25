const API_BASE = "https://safe-anesthesia.onrender.com";

// Variable globale pour stocker les données originales
let tutesLesFormations = [];

/**
 * Affiche les cartes de formation dans le conteneur
 */
function afficherFormations(formations) {
    const container = document.querySelector("#formations");
    if (!container) return;
    
    if (formations.length === 0) {
      container.innerHTML = `<p class="no-results">Aucune formation ne correspond à votre recherche.</p>`;
      return;
    }

    container.innerHTML = "";
    formations.forEach(f => {
      const card = document.createElement("div");
      card.className = "post-card";
      card.setAttribute("data-id", f.id);
      card.innerHTML = `
        <div class="card-image">
          ${f.image ? `<img src="${API_BASE}${f.image}" alt="${f.titre}">` : ""}
        </div>
        <div class="card-content">
          <h3 class="card-title"></h3>
          <p class="card-desc"></p>
          <span class="read-more">Découvrir le programme</span>
        </div>
      `;
      card.querySelector(".card-title").textContent = f.titre;
      card.querySelector(".card-desc").textContent = f.contenu.substring(0, 120) + "...";
      card.onclick = () => window.location.href = `formation.html?id=${f.id}`;
      container.appendChild(card);
    });
}

/**
 * Charge les données depuis l'API
 */
async function chargerFormationsHome() {
  try {
    const res = await fetch(`${API_BASE}/api/formations`);
    if (!res.ok) throw new Error("Impossible de charger les formations");
    tutesLesFormations = await res.json();
    afficherFormations(tutesLesFormations);
  } catch (err) {
    console.error("Erreur chargement formations:", err);
    const container = document.querySelector("#formations");
    if (container) container.innerHTML = `<p>Erreur : ${err.message}</p>`;
  }
}

// Initialisation
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    chargerFormationsHome();

    // Gestion de la recherche
    const searchInput = document.getElementById('formationSearch');
    searchInput?.addEventListener('input', (e) => {
      const terme = e.target.value.toLowerCase();
      const resultats = tutesLesFormations.filter(f => 
        f.titre.toLowerCase().includes(terme) || 
        f.contenu.toLowerCase().includes(terme)
      );
      afficherFormations(resultats);
    });
  }
});
