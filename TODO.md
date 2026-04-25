# TODO - Correction Frontend Vercel

## Étapes terminées ✅

1. **Renommer `frontend/scripts/` → `frontend/js/`** ✅
2. **Mettre à jour les chemins dans les fichiers HTML** (`scripts/` → `js/`) ✅
   - [x] index.html
   - [x] about.html
   - [x] admin.html
   - [x] contact.html
   - [x] formation.html
   - [x] formations.html
3. **Corriger les chemins absolus en JS/HTML** ✅
   - [x] js/index.js : `/formation?id=` → `formation.html?id=`
   - [x] js/formations.js : `/formation?id=` → `formation.html?id=`
   - [x] login.html : `/admin` → `admin.html`
   - [x] contact.html : `action="/send"` → `action="#"` (géré par JS fetch)
4. **Vérifier `frontend/vercel.json`** ✅
   - Déjà configuré avec `@vercel/static` et routes catch-all
5. **Mettre à jour `README.md`** ✅
   - Précisé Root Directory = `/frontend` pour Vercel
   - Précisé `node server.js` pour Render
   - Mis à jour la structure avec `js/` au lieu de `scripts/`
6. **Vérification finale** ✅
   - Aucun chemin absolu `/` trouvé dans `frontend/`
   - Structure correcte : HTML à racine, `css/`, `images/`, `js/`, `vercel.json`

---
**Statut : Toutes les corrections sont terminées.**

