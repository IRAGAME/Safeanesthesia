# 🚀 Déployer sur Vercel

## Architecture

```
GitHub Pages (Frontend)  ←→  Vercel (Backend API)
- index.html                - server.js
- pages/*.html              - API routes
- style.css                 - Database
- scripts/
```

## Étapes de Déploiement

### 1️⃣ Préparer GitHub

```bash
git add .
git commit -m "Configuration Vercel"
git push origin main
```

### 2️⃣ Créer Compte Vercel

1. Allez sur https://vercel.com
2. Cliquez "Sign Up" → Connectez-vous avec GitHub
3. Importez ce repo

### 3️⃣ Configurer Vercel

**Après import du repo, Vercel affiche:**

- **Root Directory:** ✅ (racine du projet)
- **Framework Preset:** Node.js
- **Build Command:** `npm install`
- **Environment Variables:** Ajouter

### 4️⃣ Ajouter Variables d'Environnement

Dans **Settings → Environment Variables**, ajoutez:

```
ADMIN_PASSWORD = VotreMotDePasse
JWT_SECRET = VotreSecretAleatoire
SMTP_USER = votre_email@gmail.com
SMTP_PASS = app_password
ADMIN_EMAIL = admin@safeanesthesia.com
NODE_ENV = production
```

### 5️⃣ Configurer GitHub Pages (Frontend)

1. Allez dans **Settings → Pages**
2. **Source:** Main branch
3. **Folder:** / (root)
4. **Save**

Votre site sera à: `https://yourusername.github.io/Safeanesthesia`

### 6️⃣ Adapter les URLs Frontend

Si votre GitHub Pages ≠ votre Vercel, mettez à jour:

**public/index.html (script d'accès formations)**
```javascript
// ✅ Utilise déjà window.location.origin (bon!)
const API_BASE = window.location.origin;
```

Vérifiez tous les scripts utilisent `window.location.origin` ou `${API_BASE}`.

### 7️⃣ Tester

**Local:**
```bash
npm install
node server.js
# http://localhost:3000
```

**Production:**
```
Frontend: https://yourusername.github.io/Safeanesthesia
Backend:  https://your-vercel-app.vercel.app
```

### ⚠️ Problème CORS?

Si vous avez des erreurs CORS, ajoutez dans `server.js`:

```javascript
const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://yourusername.github.io'
  ]
}));
```

## Vérification

✅ Frontend accéder au backend API
✅ Login fonctionne
✅ Admin affiche formations
✅ Images chargent
✅ Contact email marche

---

**Questions?** Lisez [README.md](README.md) ou [ADMIN_ACCESS.md](ADMIN_ACCESS.md)
