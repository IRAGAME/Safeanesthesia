# Fix Images on Vercel - TODO

## Objectif
Corriger l'affichage des images sur Vercel en déplaçant les fichiers statiques dans `/frontend/public/images/`.

## Étapes

### Étape 1: Créer le dossier public/images et déplacer les images
- [x] Créer `/frontend/public/images/` ✅
- [x] Déplacer `/frontend/images/spooa/` → `/frontend/public/images/spooa/` ✅
- [x] Déplacer `/frontend/images/dg/` → `/frontend/public/images/dg/` ✅
- [x] Déplacer `/frontend/images/partenaire/` → `/frontend/public/images/partenaire/` ✅
- [x] Déplacer `/frontend/images/back1.png` → `/frontend/public/images/back1.png` ✅
- [x] Déplacer `/frontend/images/back3.jpg` → `/frontend/public/images/back3.jpg` ✅
- [x] Supprimer l'ancien dossier `/frontend/images/` ✅

### Étape 2: Mettre à jour vercel.json
- [x] Configurer `vercel.json` pour servir les fichiers statiques ✅

### Étape 2: Mettre à jour vercel.json
- [ ] Configurer `vercel.json` pour servir les fichiers statiques depuis `/public`

### Étape 3: Vérifier les chemins dans les fichiers HTML
- [ ] Vérifier `frontend/index.html` - chemins vers `images/spooa/`, `images/spooa/car*.jpg`
- [ ] Vérifier `frontend/formations.html` - chemins vers `images/spooa/logo.png`
- [ ] Vérifier `frontend/about.html` - chemins vers `images/spooa/logo.png`, `images/dg/*.jpg`, `images/partenaire/*.jpg`
- [ ] Vérifier `frontend/contact.html` - chemins vers `images/spooa/logo.png`
- [ ] Vérifier `frontend/formation.html` - chemin vers `images/spooa/logo.png`
- [ ] Vérifier `frontend/admin.html` - chemin vers `images/spooa/logo.png`

### Étape 4: Tester le déploiement
- [ ] Commit et push des changements
- [ ] Vérifier le déploiement sur Vercel

## Notes
- Les images des formations dynamiques sont servies via l'API Render (`https://safeanesthesia.onrender.com`) - elles fonctionnent déjà
- Les images statiques (logos, backgrounds, partenaires, directeurs) ne fonctionnaient pas car Vercel ne servait pas `/frontend/images/`
