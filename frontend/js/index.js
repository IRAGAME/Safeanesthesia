let tutesLesFormations = [];
let modeRecherche = false;

function afficherFormations(formations) {
    const container = document.querySelector("#formations");
    if (!container) return;

    if (formations.length === 0) {
      container.innerHTML = `<p class="no-results">Aucune formation ne correspond à votre recherche.</p>`;
      return;
    }

    container.innerHTML = "";
    const afficher = modeRecherche ? formations : formations.slice(0, 3);

    afficher.forEach(f => {
      const card = document.createElement("div");
      card.className = "post-card";
      card.setAttribute("data-id", f.id);

      const imageDiv = document.createElement("div");
      imageDiv.className = "card-image";

      if (f.image) {
        const img = document.createElement("img");
        img.src = imageUrl(f.image);
        img.alt = f.titre;
        img.loading = "lazy";
        img.decoding = "async";
        img.onerror = function() {
          this.outerHTML = '<div class="no-image-placeholder" style="display:flex;align-items:center;justify-content:center;height:180px;background:var(--background)"><i class="fas fa-image" style="color:var(--text-light);font-size:2rem"></i></div>';
        };
        imageDiv.appendChild(img);
      }
      card.appendChild(imageDiv);

      const contentDiv = document.createElement("div");
      contentDiv.className = "card-content";
      contentDiv.innerHTML = `
        <h3 class="card-title"></h3>
        <p class="card-desc"></p>
        <span class="read-more">Decouvrir le programme</span>
      `;
      const titleEl = contentDiv.querySelector(".card-title");
      const descEl = contentDiv.querySelector(".card-desc");
      if (titleEl) titleEl.textContent = f.titre;
      if (descEl) descEl.textContent = (f.contenu || "").substring(0, 120) + "...";
      card.appendChild(contentDiv);

      card.onclick = () => { window.location.href = `formation.html?id=${f.id}`; };
      container.appendChild(card);
    });

    if (!modeRecherche && formations.length > 3) {
      const voirPlus = document.createElement("div");
      voirPlus.style.cssText = "grid-column:1/-1;text-align:center;margin-top:2rem";
      voirPlus.innerHTML = '<a href="formations.html" class="btn btn-secondary">Voir toutes les formations</a>';
      container.appendChild(voirPlus);
    }
}

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

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    chargerFormationsHome();

    const searchInput = document.getElementById('formationSearch');
    searchInput?.addEventListener('input', (e) => {
      modeRecherche = e.target.value.trim().length > 0;
      const terme = e.target.value.toLowerCase();
      const resultats = (tutesLesFormations || []).filter(f => {
        const titre = (f.titre || "").toLowerCase();
        const contenu = (f.contenu || "").toLowerCase();
        return titre.includes(terme) || contenu.includes(terme);
      });
      afficherFormations(resultats);
    });
  }
});
