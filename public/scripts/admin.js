const API_BASE = "http://localhost:3000";
const token = localStorage.getItem("token"); // récupéré après login

// Fonction pour afficher un toast moderne
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000); // Disparaît après 3 secondes
}

// ➕ Ajouter une formation
async function ajouterFormation(e) {
  e.preventDefault();
  const data = {
    titre: document.querySelector("#titre").value,
    contenu: document.querySelector("#contenu").value,
    image: document.querySelector("#image").value
  };

  try {
    const res = await fetch(`${API_BASE}/admin/formations`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
    showToast("Formation ajoutée avec succès ! 🎉");
    chargerFormations();
  } catch (error) {
    showToast(`Erreur lors de l'ajout: ${error.message}`, 'error');
  }
}

// ❌ Supprimer une formation
async function supprimerFormation(id) {
  try {
    const res = await fetch(`${API_BASE}/admin/formations/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
    showToast("Formation supprimée avec succès ! 🗑️");
    chargerFormations();
  } catch (error) {
    showToast(`Erreur lors de la suppression: ${error.message}`, 'error');
  }
}

// 🎯 Attacher l’événement au formulaire d’ajout
document.querySelector("#addForm").addEventListener("submit", ajouterFormation);
