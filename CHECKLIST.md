# ✅ PRE-DEPLOYMENT CHECKLIST

**Safe Anesthesia - 16 Mai 2026**

---

## 🔐 SÉCURITÉ - À CONFIGURER D'ABORD

### Variables d'Environnement Backend
- [ ] `JWT_SECRET` = 32 bytes aléatoire (généré)
- [ ] `ADMIN_PASSWORD` = Mot de passe fort (12+ caractères)
- [ ] `SMTP_USER` = Email Gmail valide
- [ ] `SMTP_PASS` = App Password Gmail (pas mot de passe Gmail)
- [ ] `ADMIN_EMAIL` = Email destinataire (notifications)

### Génération Clés
```bash
# Générer JWT_SECRET (copier le résultat)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Résultat: a7f3e8d2c91b4f5a6e9c2b8d7f4a1e3c (exemple)
```

### Gmail Configuration
- [ ] 2FA activé sur le compte Gmail
- [ ] App Password généré (Mail > Windows)
- [ ] Password copié (ex: `jkqr nnwq pkmc zyxt`)

---

## 🖥️ LOCAL TESTING

### Backend (Node.js)
```bash
cd backend
npm install
npm start
# Vérifier: "🚀 SafeAnesthesia Backend Server"
```

**Tests à faire:**
- [ ] `curl http://localhost:3000/api/health` → 200 OK
- [ ] `curl http://localhost:3000/api/formations` → JSON array
- [ ] Essayer log via http://localhost:3000/api/auth/login (POST)

### Frontend (Static Serve)
```bash
cd frontend
python3 -m http.server 8000
# Puis: http://localhost:8000
```

**Tests à faire:**
- [ ] Page charge sans erreurs
- [ ] Images s'affichent
- [ ] Panel admin accessible
- [ ] Console (F12) sans erreurs CORS (en local c'est OK)

---

## 🚀 VERCEL DEPLOYMENT

### Prérequis
- [ ] Compte Vercel créé
- [ ] Repo GitHub connecté à Vercel
- [ ] Pas de build command nécessaire

### Configuration Vercel
```
Name:               safe-anesthesia (ou similaire)
Framework:          Other (Static Site)
Root Directory:     frontend
Build Command:      (laisser vide)
Output Directory:   (laisser vide)
Install Command:    (laisser vide)
```

**Vérifier après Deploy:**
- [ ] Frontend URL = `https://safe-anesthesia.vercel.app`
- [ ] `vercel.json` a été appliqué
- [ ] Images se chargent
- [ ] Formations s'affichent
- [ ] Pas d'erreurs 404

**Si erreurs:**
→ Vérifier "Deployments" onglet, voir les logs

---

## 🔌 RENDER DEPLOYMENT

### Prérequis
- [ ] Compte Render créé
- [ ] Repo GitHub connecté à Render
- [ ] Variables d'env préparées (voir 🔐 section)

### Configuration Render
```
Name:               safeanesthesia-backend
Environment:        Node
Region:             (choisir le + proche)
Branch:             main
Build Command:      npm install
Start Command:      node server.js
Root Directory:     backend
```

### Environment Variables (À ajouter dans Render Dashboard)
```
JWT_SECRET=                (valeur générée)
ADMIN_PASSWORD=            (votre mot de passe)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=                 (votre email gmail)
SMTP_PASS=                 (app password)
SMTP_FROM=noreply@safeanesthesia.com
ADMIN_EMAIL=               (email destinataire)
NODE_ENV=production
PORT=3000
```

**Vérifier après Deploy:**
- [ ] Backend URL = `https://safeanesthesia.onrender.com`
- [ ] Render logs show "✅ SafeAnesthesia Backend Server"
- [ ] Pas d'erreurs dans "Logs"

**Si erreurs:**
→ Vérifier Render Logs, chercher "ERROR" ou "❌"

---

## 🧪 TESTS POST-DÉPLOIEMENT

### Test 1: Health Check
```bash
curl https://safeanesthesia.onrender.com/api/health
# Réponse attendue: {"status":"ok",...}
```

### Test 2: Formations List (depuis Frontend)
Naviguer vers `https://safe-anesthesia.vercel.app`
- [ ] Les formations s'affichent
- [ ] Les images se chargent
- [ ] Pas d'erreurs dans Console (F12)

### Test 3: Contact Form
1. Aller sur `/contact.html`
2. Remplir le formulaire
3. Soumettre
- [ ] Message "✅ Reçu" apparaît
- [ ] Email reçu dans `ADMIN_EMAIL`

### Test 4: Login Admin
1. Aller sur `/login.html`
2. Entrer `ADMIN_PASSWORD`
3. Soumettre
- [ ] Token reçu (affichage "✅ Connecté")
- [ ] Redirection vers panel admin

### Test 5: Upload Formation (Admin)
1. Être logué en admin
2. Ajouter une formation avec image
3. Soumettre
- [ ] Formation créée
- [ ] Image stockée dans backend
- [ ] Image visible en refresh

---

## 🔗 URLS FINALES

### Frontend
```
https://safe-anesthesia.vercel.app          → Home
https://safe-anesthesia.vercel.app/login.html
https://safe-anesthesia.vercel.app/formations.html
https://safe-anesthesia.vercel.app/admin.html
https://safe-anesthesia.vercel.app/contact.html
```

### Backend API
```
https://safeanesthesia.onrender.com/api/health
https://safeanesthesia.onrender.com/api/formations
https://safeanesthesia.onrender.com/api/auth/login
```

---

## ⚠️ TROUBLESHOOTING RAPIDE

### Frontend charge pas
→ Vérifier Vercel "Deployment" logs
→ S'assurer "Root Directory" = `/frontend`

### Formations ne s'affichent pas
→ Vérifier que Backend est online (`/api/health` répond)
→ Vérifier CORS dans console (F12)
→ Vérifier `API_BASE` dans js/*.js files

### Login échoue
→ Vérifier `ADMIN_PASSWORD` dans Render env vars
→ Vérifier pas d'espaces avant/après

### Emails ne reçoivent pas
→ Vérifier `SMTP_PASS` est l'App Password, pas password Gmail
→ Vérifier 2FA est activé sur Gmail
→ Vérifier `ADMIN_EMAIL` est correct
→ Vérifier logs Render pour erreurs SMTP

### CORS Errors
→ Vérifier Frontend URL dans `allowedOrigins` (backend)
→ En production, `*.vercel.app` devrait être autorisé
→ Vérifier Origin header dans requête (F12 Network)

---

## 📞 SUPPORT RAPIDE

**Backend Problem?**
→ Render Dashboard → Logs

**Frontend Problem?**
→ Vercel Dashboard → Deployments → Logs

**API not responding?**
```bash
curl -i https://safeanesthesia.onrender.com/api/health
```

**CORS Issue?**
```bash
F12 → Network → Voir "Access-Control-Allow-Origin" header
```

---

## ✨ SUCCESS INDICATORS

Vous êtes prêt si:

- ✅ `https://safe-anesthesia.vercel.app` charge sans erreurs
- ✅ `https://safeanesthesia.onrender.com/api/health` répond 200
- ✅ Les formations s'affichent depuis le frontend
- ✅ Login admin fonctionne
- ✅ Upload image fonctionne
- ✅ Contact form envoie des emails
- ✅ Pas d'erreurs 5xx dans logs

**Bravo! 🎉 Votre site est en production!**

---

**Dernière mise à jour:** 16 Mai 2026
