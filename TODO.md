# Plan - Réorganisation Safeanesthesia (Frontend/Backend Split)

## Étapes

- [x] **1. Créer la structure `/frontend` et `/backend`**
- [x] **2. Déplacer et adapter les fichiers HTML** (chemins /public/...)
- [x] **3. Déplacer les assets statiques** vers `/frontend/public/`
- [x] **4. Déplacer le backend** vers `/backend/`
- [x] **5. Configurer CORS dans server.js** (autoriser Vercel)
- [x] **6. Mettre à jour les appels API** (window.location.origin → Render URL)
- [x] **7. Créer `vercel.json`** dans `/frontend`
- [x] **8. Créer `.env.example`** dans `/backend`
- [x] **9. Mettre à jour `README.md`**
- [x] **10. Nettoyage** des anciens fichiers à la racine

## Fichiers modifiés
- `backend/server.js` (CORS + suppression routes pages)
- `frontend/public/scripts/formations.js`
- `frontend/public/scripts/admin.js`
- `frontend/public/scripts/formation.js`
- `frontend/public/scripts/index.js`
- `frontend/index.html` (chemins CSS/JS/images)
- `frontend/about.html`
- `frontend/contact.html` (+ script inline API_BASE)
- `frontend/formations.html`
- `frontend/formation.html`
- `frontend/admin.html`
- `frontend/login.html` (+ script inline API_BASE)

## Fichiers créés
- `frontend/vercel.json`
- `backend/.env.example`

