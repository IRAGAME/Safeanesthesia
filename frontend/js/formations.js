let toutesLesFormations = [];

function creerCarte(f) {
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
    img.style.display = "block";
    img.onerror = function() {
      this.outerHTML = '<div class="no-image-placeholder" style="display:flex;align-items:center;justify-content:center;height:180px;background:var(--background)"><i class="fas fa-image" style="color:var(--text-light);font-size:2rem"></i></div>';
    };
    imageDiv.appendChild(img);
  } else {
    imageDiv.innerHTML = '<div class="no-image-placeholder" style="display:flex;align-items:center;justify-content:center;height:180px;background:var(--background)"><i class="fas fa-image" style="color:var(--text-light);font-size:2rem"></i></div>';
  }

  const contentDiv = document.createElement("div");
  contentDiv.className = "card-content";
  contentDiv.innerHTML = `
    <h3>${f.titre}</h3>
    <p>${f.contenu.substring(0, 120)}...</p>
    <span class="read-more">Découvrir le programme</span>
  `;

  card.appendChild(imageDiv);
  card.appendChild(contentDiv);

  card.addEventListener("click", () => {
    window.location.href = `formation.html?id=${f.id}`;
  });

  return card;
}

function afficherFormations(formations) {
  const container = document.querySelector("#formations");
  container.innerHTML = "";

  if (formations.length === 0) {
    container.innerHTML = '<p class="no-results" style="text-align:center;grid-column:1/-1;padding:40px 0;color:var(--text-secondary)">Aucune formation ne correspond à votre recherche.</p>';
    return;
  }

  formations.forEach(f => {
    container.appendChild(creerCarte(f));
  });
}

async function chargerFormations() {
  try {
    const res = await fetch(`${API_BASE}/api/formations`);
    if (!res.ok) throw new Error("Impossible de charger les formations");
    toutesLesFormations = await res.json();
    afficherFormations(toutesLesFormations);
  } catch (err) {
    console.error("Erreur chargement formations:", err);
    const container = document.querySelector("#formations");
    if (container) container.innerHTML = `<p>Erreur : ${err.message}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  chargerFormations();

  const searchInput = document.getElementById("formationSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const terme = e.target.value.toLowerCase().trim();
      if (!terme) {
        afficherFormations(toutesLesFormations);
        return;
      }
      const resultats = toutesLesFormations.filter(f => {
        const titre = (f.titre || "").toLowerCase();
        const contenu = (f.contenu || "").toLowerCase();
        return titre.includes(terme) || contenu.includes(terme);
      });
      afficherFormations(resultats);
    });
  }
});
