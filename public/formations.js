const API_BASE = "http://localhost:3000";

async function chargerFormations() {
  try {
    const res = await fetch(`${API_BASE}/formations`); // ✅ route corrigée
    if (!res.ok) throw new Error("Impossible de charger les formations");
    const formations = await res.json();

    const container = document.querySelector("#formations");
    container.innerHTML = "";

    formations.forEach(f => {
      const card = document.createElement("div");
      card.className = "post-card";
      card.setAttribute("data-id", f.id);

      card.innerHTML = `
        ${f.image ? `<img src="http://localhost:3000${f.image}" alt="${f.titre}" class="post-img">` : ""}
        <h3>${f.titre}</h3>
        <p>${f.contenu.substring(0, 100)}...</p> <!-- résumé automatique -->
      `;

      // Lorsqu’on clique sur une carte, on ouvre la page détail
      card.addEventListener("click", () => {
        window.location.href = `formation.html?id=${f.id}`;
      });

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Erreur chargement formations:", err);
    document.querySelector("#formations").innerHTML = `<p>Erreur : ${err.message}</p>`;
  }
}

// Charger automatiquement au démarrage
document.addEventListener("DOMContentLoaded", chargerFormations);
