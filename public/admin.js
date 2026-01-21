const API_BASE = "http://localhost:3000";
const token = localStorage.getItem("token"); // récupéré après login

// ➕ Ajouter une formation
async function ajouterFormation(e) {
  e.preventDefault();
  const data = {
    titre: document.querySelector("#titre").value,
    contenu: document.querySelector("#contenu").value,
    image: document.querySelector("#image").value
  };

  await fetch(`${API_BASE}/admin/formations`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "Authorization": `Bearer ${token}` 
    },
    body: JSON.stringify(data)
  });

  alert("✅ Formation ajoutée !");
  chargerFormations();
}

// ❌ Supprimer une formation
async function supprimerFormation(id) {
  await fetch(`${API_BASE}/admin/formations/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });

  alert("✅ Formation supprimée !");
  chargerFormations();
}

// 🎯 Attacher l’événement au formulaire d’ajout
document.querySelector("#addForm").addEventListener("submit", ajouterFormation);
