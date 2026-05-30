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
      if (!img) return;
      // formation.image est de type /images/ImageFormation/<file> (servi par le backend Render)
      img.src = `${API_BASE}${formation.image}`;
      img.fetchPriority = 'high';
      img.decoding = 'async';
      img.onerror = () => {
        console.error('Formation image failed:', img.src);
        img.src = 'images/placeholder.jpg';
        img.alt = 'Image indisponible';
      };
      img.onload = () => {};
    }
  } catch (err) {
    const titreEl = document.querySelector("#titre");
    if (titreEl) titreEl.textContent = "Erreur : " + err.message;
  }
}

document.addEventListener("DOMContentLoaded", chargerFormation);
