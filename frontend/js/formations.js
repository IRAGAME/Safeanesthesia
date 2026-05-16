const API_BASE = "https://safe-anesthesia.onrender.com";

async function chargerFormations() {
  try {
    const res = await fetch(`${API_BASE}/api/formations`); // ✅ route corrigée
    if (!res.ok) throw new Error("Impossible de charger les formations");
    const formations = await res.json();

    const container = document.querySelector("#formations");
    container.innerHTML = "";

    formations.forEach(f => {
      const card = document.createElement("div");
      card.className = "post-card";
      card.setAttribute("data-id", f.id);

      card.innerHTML = `
        <div class="card-image">
${f.image ? `<img src="${API_BASE}${f.image}" alt="${f.titre}" loading="lazy" decoding="async" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'" style="display:block">` : '<div class="no-image-placeholder" style="display:flex;align-items:center;justify-content:center;height:180px;background:var(--background)"><i class="fas fa-image" style="color:var(--text-light);font-size:2rem"></i></div>'}
        </div>
        <div class="card-content">
          <h3>${f.titre}</h3>
          <p>${f.contenu.substring(0, 120)}...</p>
          <span class="read-more">Découvrir le programme</span>
        </div>
      `;

      // Lorsqu’on clique sur une carte, on ouvre la page détail
      card.addEventListener("click", () => {
        window.location.href = `formation.html?id=${f.id}`;
      });

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Erreur chargement formations:", err);
    const container = document.querySelector("#formations");
    if (container) container.innerHTML = `<p>Erreur : ${err.message}</p>`;
  }
}

// Charger automatiquement au démarrage
document.addEventListener("DOMContentLoaded", chargerFormations);
