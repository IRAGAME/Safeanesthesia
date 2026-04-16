# 🚀 Déployer sur Vercel

## Architecture

```
GitHub Pages (Frontend)  ←→  Vercel (Backend API serverless)
- index.html                - api/handler.js (Express)
- pages/*.html              - /api/formations (routes)
- style.css                 - /api/auth (login)
- scripts/                  - Database Sqlite
```

## 🔧 Changements Récents

**Fix du problème sql.js + Vercel:**
- ✅ Créé `api/handler.js` compatible serverless
- ✅ Configuré `vercel.json` pour routes API
- ✅ Initilisation DB asynchrone côté API

## Étapes de Déploiement

### 1️⃣ Préparer GitHub

```bash
git add -A
git commit -m "Configuration Vercel complète"
git push origin main
```

### 2️⃣ Redéployer sur Vercel

**Vercel détecte les changements automatiquement!**

1. Allez sur votre dashboard Vercel
2. Cliquez sur votre projet "Safeanesthsia"
3. **Attendez le redéploiement** (5-10 min)
4. Vérifiez les **Deployments → Logs** pour les erreurs

### 3️⃣ Vérifier les Environment Variables

Allez dans **Settings → Environment Variables**, vérifiez que:

```
✅ ADMIN_PASSWORD = présent
✅ JWT_SECRET = présent
✅ SMTP_USER = (optionnel, pour email)
✅ SMTP_PASS = (optionnel, pour email)
✅ ADMIN_EMAIL = (optionnel)
```

### 4️⃣ Configurer GitHub Pages (Frontend)

1. Allez dans **Settings → Pages**
2. **Source:** Deploy from a branch
3. **Branch:** Main
4. **Folder:** /(root)
5. **Save**

## 🧪 Tester

### Local (Développement)
```bash
node server.js
# http://localhost:3000
```

### Production
```
🌐 Frontend:  https://yourusername.github.io/Safeanesthesia
🔐 Backend:   https://safeanesthesiasite.vercel.app
```

### Endpoints API
```
GET  /api/formations             # Lister formations
POST /api/admin/formations       # Ajouter (authentifié)
PUT  /api/admin/formations/:id   # Modifier (authentifié)
DELETE /api/admin/formations/:id # Supprimer (authentifié)
POST /api/auth/login             # Login
GET  /api/auth/verify            # Vérifier token
POST /send                        # Contact email
```

## ⚠️ Problèmes Courants

### "500 Error - sql.js WASM not found"
**Status:** ✅ FIXÉ (version serverless)
- Créé `api/handler.js` avec init DB asynchrone
- Si encore erreur: vérifier les Vercel Logs

### "CORS Error"
**Solution:**
```javascript
// Déjà configuré dans api/handler.js
// Ajouter votre domaine GitHub Pages si besoin:
allowedOrigins.push('https://yourusername.github.io');
```

### "Authorization denied"
```bash
# Vérifier JWT_SECRET en env vars Vercel
# Vérifier localStorage.token dans browser (F12 → Application)
```

## 📊 Monitoring

Voir les logs:
1. Vercel Dashboard → votre projet
2. **Deployments** → Dernier déploiement
3. **Logs** → Erreurs détaillées

## 🚀 Redéployer Rapidement

Si vous changez le code:
```bash
git add -A
git commit -m "vos changements"
git push origin main
# Vercel redéploie automatiquement!
```

---

**Questions?** Vérifiez:
- [README.md](README.md) — Quickstart
- [ADMIN_ACCESS.md](ADMIN_ACCESS.md) — Accès admin
- Vercel Logs → Dashboard

