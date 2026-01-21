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

document.addEventListener("DOMContentLoaded", chargerFormation);;
