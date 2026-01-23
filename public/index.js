const API_BASE = "http://localhost:3000";
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

async function chargerFormation() {
  try {
    const res = await fetch(`${API_BASE}/formations/${id}`); // ✅ route corrigée
    if (!res.ok) throw new Error("Formation introuvable");
    const formation = await res.json();

    document.querySelector("#titre").textContent = formation.titre;
    document.querySelector("#duree").textContent = "Durée : " + formation.duree;
    document.querySelector("#resume").textContent = formation.resume;
    document.querySelector("#contenu").textContent = formation.contenu;
    if (formation.image) {
      document.querySelector("#image").src = formation.image;
    }
  } catch (err) {
    document.querySelector("#titre").textContent = "Erreur : " + err.message;
  }
}

async function chargerFormationsHome() {
  try {
    const res = await fetch(`${API_BASE}/formations`);
    if (!res.ok) throw new Error("Impossible de charger les formations");
    const formations = await res.json();

    const container = document.querySelector("#formations-home");
    container.innerHTML = "";

    formations.forEach(f => {
      const card = document.createElement("div");
      card.className = "post-card";

      card.innerHTML = `
        ${f.image ? `<img src="http://localhost:3000${f.image}" alt="${f.titre}" class="post-img">` : ""}
        <h3>${f.titre}</h3>
        <p>${f.contenu.substring(0, 100)}...</p>
        <div class="post-meta">
          <span><i class="fas fa-eye"></i> ${f.vues || 0} vues</span>
          <span><i class="fas fa-heart"></i> ${f.likes || 0} j'aime</span>
          <span><i class="fas fa-comment"></i> ${f.commentaires || 0} commentaire</span>
        </div>
      `;

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Erreur chargement formations:", err);
    document.querySelector("#formations-home").innerHTML = `<p>Erreur : ${err.message}</p>`;
  }
}

if (id) {
  document.addEventListener("DOMContentLoaded", chargerFormation);
} else {
  document.addEventListener("DOMContentLoaded", chargerFormationsHome);
};
