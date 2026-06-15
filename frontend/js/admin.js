let token = localStorage.getItem("adminToken");
let currentEditId = null;

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${icon}"></i><span class="toast-text">${message}</span>`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function boutonLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.style.opacity = '0.7';
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
    btn.style.opacity = '1';
  }
}

function escHTML(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escJS(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

function createSafeButton(text, iconClass, className) {
  const btn = document.createElement('button');
  btn.className = className;
  btn.innerHTML = `<i class="fas ${iconClass}"></i> ${text}`;
  return btn;
}

function updateUI() {
  const loginForm = document.getElementById('loginForm');
  const dashboard = document.getElementById('dashboardContent');
  if (!loginForm || !dashboard) return;
  if (!token) {
    loginForm.style.display = 'block';
    dashboard.style.display = 'none';
  } else {
    loginForm.style.display = 'none';
    dashboard.style.display = 'flex';
    chargerFormations();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try { updateUI(); } catch (e) { console.error(e); }

  const loginForm = document.querySelector("#login");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const passwordInput = document.querySelector("#password");
      if (!passwordInput) return;
      const password = passwordInput.value;
      const btn = e.target.querySelector('button[type="submit"]');
      boutonLoading(btn, true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password })
        });
        if (!res.ok) throw new Error("Mot de passe incorrect");
        const data = await res.json();
        if (!data.token) throw new Error("Réponse invalide du serveur");
        token = data.token;
        localStorage.setItem("adminToken", token);
        location.reload();
      } catch (error) {
        showToast(`Erreur: ${error.message}`, 'error');
      }
      boutonLoading(btn, false);
    });
  }

  const addForm = document.querySelector("#addForm");
  if (addForm) {
    addForm.addEventListener("submit", ajouterFormation);
  }

  const closeBtn = document.getElementById('closeModal');
  if (closeBtn) {
    closeBtn.onclick = () => {
      const modal = document.getElementById('editModal');
      if (modal) modal.classList.remove('open');
      currentEditId = null;
    };
  }

  const editForm = document.querySelector("#editForm");
  if (editForm) {
    editForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentEditId) return;

      const btn = e.target.querySelector('button[type="submit"]');
      boutonLoading(btn, true);
      const formData = new FormData(e.target);

      try {
        const res = await fetch(`${API_BASE}/api/admin/formations/${currentEditId}`, {
          method: "PUT",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });
        if (!res.ok) {
          let msg = `Erreur ${res.status}`;
          try { const body = await res.json(); if (body.error) msg += `: ${body.error}`; } catch {}
          throw new Error(msg);
        }
        showToast("Formation mise à jour avec succès !");
        const modal = document.getElementById('editModal');
        if (modal) modal.classList.remove('open');
        currentEditId = null;
        chargerFormations();
      } catch (error) {
        showToast(`Erreur: ${error.message}`, 'error');
      }
      boutonLoading(btn, false);
    });
  }
});

async function chargerFormations() {
  try {
    const res = await fetch(`${API_BASE}/api/formations`);
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    const formations = await res.json();
    if (!Array.isArray(formations)) throw new Error("Réponse invalide");

    const container = document.querySelector("#formations");
    if (!container) return;
    container.innerHTML = "";

    formations.forEach(f => {
      const card = document.createElement("div");
      card.className = "admin-card";

      const titreSafe = escJS(f.titre || '');
      const contenuSafe = escJS(f.contenu || '');
      const imageUrlStr = f.image ? escJS(f.image) : '';

      const imgDiv = document.createElement('div');
      imgDiv.className = 'card-image';
      if (f.image) {
        const img = document.createElement('img');
        img.src = imageUrl(f.image);
        img.alt = f.titre || '';
        img.loading = 'lazy';
        imgDiv.appendChild(img);
      } else {
        imgDiv.innerHTML = '<div style="height:160px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;"><i class="fas fa-image" style="color:#ccc;font-size:2rem;"></i></div>';
      }
      card.appendChild(imgDiv);

      const contentDiv = document.createElement('div');
      contentDiv.className = 'admin-card-content';

      const h3 = document.createElement('h3');
      h3.className = 'card-title-text';
      h3.textContent = f.titre || '';
      contentDiv.appendChild(h3);

      const p = document.createElement('p');
      p.className = 'card-desc-text';
      p.textContent = (f.contenu || '').substring(0, 100) + '...';
      contentDiv.appendChild(p);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'admin-actions';

      const editBtn = createSafeButton('', 'fa-pen', 'action-btn btn-edit');
      editBtn.addEventListener('click', () => {
        currentEditId = f.id;
        const editTitre = document.getElementById('editTitre');
        const editContenu = document.getElementById('editContenu');
        const currentImageDiv = document.getElementById('currentImage');
        const modal = document.getElementById('editModal');

        if (editTitre) editTitre.value = f.titre || '';
        if (editContenu) editContenu.value = f.contenu || '';

        if (currentImageDiv) {
          if (f.image) {
            currentImageDiv.innerHTML = `<p><i class="fas fa-image"></i> Image actuelle</p><img src="${imageUrl(f.image)}" alt="Image actuelle" style="max-width:200px;border-radius:8px;">`;
          } else {
            currentImageDiv.innerHTML = '<div class="no-image"><i class="fas fa-image"></i> Aucune image actuelle</div>';
          }
        }

        if (modal) modal.classList.add('open');
      });
      actionsDiv.appendChild(editBtn);

      const deleteBtn = createSafeButton(' Supprimer', 'fa-trash', 'action-btn btn-delete');
      deleteBtn.addEventListener('click', () => supprimerFormation(f.id));
      actionsDiv.appendChild(deleteBtn);

      contentDiv.appendChild(actionsDiv);
      card.appendChild(contentDiv);

      container.appendChild(card);
    });
  } catch (error) {
    showToast(`Erreur lors du chargement: ${error.message}`, 'error');
  }
}

async function ajouterFormation(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  boutonLoading(btn, true);
  const formData = new FormData(e.target);

  try {
    const res = await fetch(`${API_BASE}/api/admin/formations`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: formData
    });
    if (!res.ok) {
      let msg = `Erreur ${res.status}`;
      try { const body = await res.json(); if (body.error) msg += `: ${body.error}`; } catch {}
      throw new Error(msg);
    }
    showToast("Formation ajoutée avec succès !");
    try { e.target.reset(); } catch {}
    chargerFormations();
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
  boutonLoading(btn, false);
}

async function supprimerFormation(id) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cette formation ?")) return;
  try {
    const res = await fetch(`${API_BASE}/api/admin/formations/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) {
      let msg = `Erreur ${res.status}`;
      try { const body = await res.json(); if (body.error) msg += `: ${body.error}`; } catch {}
      throw new Error(msg);
    }
    showToast("Formation supprimée avec succès !");
    chargerFormations();
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

window.addEventListener('unhandledrejection', (e) => {
  console.error('Erreur non gérée:', e.reason);
  showToast('Une erreur inattendue est survenue', 'error');
  e.preventDefault();
});