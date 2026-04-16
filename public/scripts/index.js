const API_BASE = "http://localhost:3000";
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

async function chargerFormation() {
  try {
    const res = await fetch(`${API_BASE}/formations/${id}`); //
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

    const container = document.querySelector("#formations");
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
    document.querySelector("#formations-home").innerHTML = `<p>Erreur : ${err.message}</p>`;
  }
}

if (id) {
  document.addEventListener("DOMContentLoaded", chargerFormation);
} else {
  document.addEventListener("DOMContentLoaded", chargerFormationsHome);
};
