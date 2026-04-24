const API_BASE = window.location.origin;
let token = localStorage.getItem("token");

// 🎨 Toast
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// 🔐 Initialisation
function updateUI() {
  if (!token) {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('dashboardContent').style.display = 'none';
  } else {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'flex';
    chargerFormations();
  }
}

// Login
document.addEventListener('DOMContentLoaded', () => {
  updateUI();
  
  const loginForm = document.querySelector("#login");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const password = document.querySelector("#password").value;
      try {
        const res = await fetch(`${API_BASE}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password })
        });
        if (!res.ok) throw new Error("Mot de passe incorrect");
        const data = await res.json();
        token = data.token;
        localStorage.setItem("token", token);
        location.reload();
      } catch (error) {
        showToast(`Erreur: ${error.message}`, 'error');
      }
    });
  }

  // Form events
  const addForm = document.querySelector("#addForm");
  if (addForm) {
    addForm.addEventListener("submit", ajouterFormation);
  }

  const closeBtn = document.getElementById('closeModal');
  if (closeBtn) {
    closeBtn.onclick = () => {
      document.getElementById('editModal').classList.remove('open');
      currentEditId = null;
    };
  }
});

// 📚 Charger formations
async function chargerFormations() {
  try {
    const res = await fetch(`${API_BASE}/api/formations`);
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    const formations = await res.json();
    const container = document.querySelector("#formations");
    container.innerHTML = "";

    formations.forEach(f => {
      const card = document.createElement("div");
      card.className = "admin-card";
      card.innerHTML = `
        <div class="card-image">
          ${f.image ? `<img src="${API_BASE}${f.image}" alt="${f.titre}">` : '<div style="height:160px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;"><i class="fas fa-image" style="color:#ccc;font-size:2rem;"></i></div>'}
        </div>
        <div class="admin-card-content">
          <h3 class="card-title-text"></h3>
          <p class="card-desc-text"></p>
          <div class="admin-actions">
            <button class="action-btn btn-edit" onclick="prepareEdit(${f.id}, \`${f.titre.replace(/`/g, '\\`')}\`, \`${f.contenu.replace(/`/g, '\\`')}\`, '${f.image || ''}')">
              <i class="fas fa-pen"></i>
            </button>
            <button class="action-btn btn-delete" onclick="supprimerFormation(${f.id})">
              <i class="fas fa-trash"></i> Supprimer
            </button>
          </div>
        </div>
      `;
      card.querySelector(".card-title-text").textContent = f.titre;
      card.querySelector(".card-desc-text").textContent = f.contenu.substring(0, 100) + "...";
      container.appendChild(card);
    });
  } catch (error) {
    showToast(`Erreur lors du chargement: ${error.message}`, 'error');
  }
}

// ➕ Ajouter formation
async function ajouterFormation(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  try {
    const res = await fetch(`${API_BASE}/api/admin/formations`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`
        // Note: Ne pas mettre Content-Type avec FormData, le navigateur le fait seul
      },
      body: formData
    });
    if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
    showToast("Formation ajoutée avec succès ! 🎉");
    e.target.reset();
    chargerFormations();
  } catch (error) {
    showToast(`Erreur lors de l'ajout: ${error.message}`, 'error');
  }
}

// ❌ Supprimer formation
async function supprimerFormation(id) {
  if (confirm("Êtes-vous sûr de vouloir supprimer cette formation ?")) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/formations/${id}`, {
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
}

let currentEditId = null;

window.prepareEdit = function(id, titre, contenu, image) {
  currentEditId = id;
  document.getElementById('editTitre').value = titre;
  document.getElementById('editContenu').value = contenu;
  const currentImageDiv = document.getElementById('currentImage');
  if (image) {
    currentImageDiv.innerHTML = `<p><i class="fas fa-image"></i> Image actuelle</p><img src="${API_BASE}${image}" alt="Image actuelle">`;
  } else {
    currentImageDiv.innerHTML = '<div class="no-image"><i class="fas fa-image"></i> Aucune image actuelle</div>';
  }
  document.getElementById('editModal').classList.add('open');
}

document.addEventListener('DOMContentLoaded', () => {
  const editForm = document.querySelector("#editForm");
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentEditId) return;
      
      const formData = new FormData(e.target);
      
      try {
        const res = await fetch(`${API_BASE}/api/admin/formations/${currentEditId}`, {
          method: "PUT",
          headers: { 
            "Authorization": `Bearer ${token}`
          },
          body: formData
        });
        if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
        showToast("Formation mise à jour avec succès ! ✏️");
        document.getElementById('editModal').classList.remove('open');
        chargerFormations();
      } catch (error) {
        showToast(`Erreur lors de la modification: ${error.message}`, 'error');
      }
    });
  }
});
