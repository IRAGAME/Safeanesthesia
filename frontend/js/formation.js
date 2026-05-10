const API_BASE = "https://safeanesthesia.onrender.com";
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

async function chargerFormation() {
  try {
    const res = await fetch(`${API_BASE}/api/formations/${id}`);
    if (!res.ok) throw new Error("Formation introuvable");
    const formation = await res.json();

    document.querySelector("#titre").textContent = formation.titre;
    document.querySelector("#contenu").textContent = formation.contenu;
    
    if (formation.image) {
      const img = document.querySelector("#image");
      // formation.image est déjà un chemin relatif du type /images/ImageFormation/<file>
      // On charge donc depuis le frontend Vercel (static), pas depuis l'API Render.
      img.src = formation.image;
      img.fetchPriority = 'high';
      img.decoding = 'async';
      img.onerror = () => {
        console.error('Formation image failed:', img.src);
        img.src = 'images/placeholder.jpg';
        img.alt = 'Image indisponible';
      };
      img.onload = () => console.log('Formation image loaded:', img.src);
    }
  } catch (err) {
    document.querySelector("#titre").textContent = "Erreur : " + err.message;
  }
}

document.addEventListener("DOMContentLoaded", chargerFormation);
