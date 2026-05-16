# 🚀 Guide Complet de Déploiement Professionnel

**Safe Anesthesia - Configuration Production**

---

## 📋 Prérequis

- [ ] Compte GitHub avec le repo SafeAnesthesia
- [ ] Compte Vercel (gratuit) pour le frontend
- [ ] Compte Render (gratuit) pour le backend
- [ ] Gmail avec 2FA activé (pour emails)

---

## 🌐 ÉTAPE 1: Déployer le Frontend sur Vercel

### 1.1 Connecter le repo à Vercel

1. Aller sur https://vercel.com
2. Cliquer **"Add New... > Project"**
3. Sélectionner le repository GitHub `Safeanesthesia`
4. Cliquer **"Import"**

### 1.2 Configurer le Frontend

Dans **Settings**, configurer:

```
Framework Preset:        Other
Root Directory:          frontend          ← IMPORTANT!
Build Command:           (laisser vide)
Output Directory:        (laisser vide)
Install Command:         (laisser vide)
```

### 1.3 Variables d'Environnement

Aucune variable d'env requise pour le frontend statique.

### 1.4 Déployer

Cliquer **"Deploy"**. L'URL sera quelque chose comme:
```
https://safe-anesthesia.vercel.app
```

✅ **Frontend déployé!**

---

## 🔌 ÉTAPE 2: Déployer le Backend sur Render

### 2.1 Connecter le repo à Render

1. Aller sur https://render.com
2. Cliquer **"New +" > "Web Service"**
3. Connecter GitHub (autoriser Render)
4. Sélectionner `Safeanesthesia`
5. Cliquer **"Connect"**

### 2.2 Configurer le Backend

Remplir les champs:

```
Name:                    safeanesthesia-backend
Environment:             Node
Region:                  (votre région au plus proche)
Branch:                  main
Build Command:           npm install
Start Command:           node server.js
Root Directory:          backend
```

### 2.3 Configurer les Variables d'Environnement

#### Génération des Clés de Sécurité

**Pour JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copier le résultat (ex: `a7f3e8d2c91b4f5a6e9c2b8d7f4a1e3c`)

**Pour ADMIN_PASSWORD:**
Choisir un mot de passe fort (min 12 caractères avec majuscules, minuscules, chiffres, symboles)

#### Dans Render Dashboard:

Cliquer **"Environment"** et ajouter:

```
JWT_SECRET           = [collez la clé générée]
ADMIN_PASSWORD       = [votre mot de passe fort]
SMTP_HOST            = smtp.gmail.com
SMTP_PORT            = 465
SMTP_USER            = votre_email@gmail.com
SMTP_PASS            = [App Password Gmail]
SMTP_FROM            = noreply@safeanesthesia.com
ADMIN_EMAIL          = admin@safeanesthesia.com
NODE_ENV             = production
PORT                 = 3000
```

### 2.4 Récupérer l'App Password Gmail

1. Google Account → Security
2. Enable 2-Factor Authentication (si pas fait)
3. Créer un "App Password" pour "Mail > Windows"
4. Copier le mot de passe (16 caractères)
5. Coller dans `SMTP_PASS`

### 2.5 Déployer

Cliquer **"Create Web Service"**. Render va builder et déployer.

L'URL sera quelque chose comme:
```
https://safeanesthesia.onrender.com
```

✅ **Backend déployé!**

---

## 🔗 ÉTAPE 3: Vérifier la Communication

### 3.1 Tester le Backend

```bash
curl https://safeanesthesia.onrender.com/api/health
# Réponse attendue:
# {"status":"ok","timestamp":"...","environment":"production"}
```

### 3.2 Tester le Frontend

```bash
curl https://safe-anesthesia.vercel.app/api/formations
# Devrait charger les formations depuis le backend
```

Ouvrir le frontend dans votre navigateur:
```
https://safe-anesthesia.vercel.app
```

Vérifier que:
- [ ] Les images se chargent
- [ ] Les formations s'affichent
- [ ] Le formulaire de contact fonctionne
- [ ] La page admin est accessible

### 3.3 Tester Login Admin

1. Aller sur https://safe-anesthesia.vercel.app/login.html
2. Entrer le ADMIN_PASSWORD configuré
3. Vérifier que le token JWT est reçu

---

## 🔐 ÉTAPE 4: Configuration de Sécurité Avancée

### 4.1 CORS et Domaines Autorisées

Le backend accepte automatiquement:
- `https://*.vercel.app` (tous les previews)
- `https://safe-anesthesia.vercel.app`
- Localhost (dev)

### 4.2 Rate Limiting

Déjà configuré:
- **Login:** 5 tentatives / 15 minutes
- **Contact:** 5 messages / minute

### 4.3 Headers de Sécurité

Helmet est activé:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

---

## 📧 ÉTAPE 5: Tester le Formulaire de Contact

### 5.1 Envoyer un Message de Test

1. Aller sur https://safe-anesthesia.vercel.app/contact.html
2. Remplir le formulaire
3. Soumettre

### 5.2 Vérifier la Réception

1. Vérifier la boîte mail d'administration (`ADMIN_EMAIL`)
2. L'email doit arriver dans les 30 secondes

**Si l'email ne reçoit pas:**
- Vérifier `SMTP_PASS` est correct
- Vérifier Gmail 2FA est activé
- Vérifier l'App Password est généré
- Vérifier les logs Render

---

## 🔍 ÉTAPE 6: Monitoring et Logs

### Vercel
- Dashboard: https://vercel.com/dashboard
- Cliquer sur le projet
- Onglet "Logs" pour erreurs frontend

### Render
- Dashboard: https://dashboard.render.com
- Cliquer sur "safeanesthesia-backend"
- Onglet "Logs" pour erreurs backend

### Logs Utiles

```bash
# Backend - Démarrage
🚀 SafeAnesthesia Backend Server
📍 URL: ...
✅ SMTP configuré et prêt

# Frontend
# Ouvrir DevTools (F12) → Console
# Vérifier les erreurs API
```

---

## 🧪 ÉTAPE 7: Tests Finaux Avant Production

### Checklist Frontend
- [ ] Page d'accueil charge (index.html)
- [ ] Images se chargent correctement
- [ ] Formations s'affichent (API call)
- [ ] Clic sur formation → détail s'ouvre
- [ ] Page About charge
- [ ] Page Login accessible
- [ ] Formulaire Contact valide les champs

### Checklist Backend
- [ ] `GET /api/health` → 200 OK
- [ ] `GET /api/formations` → JSON array
- [ ] `POST /api/auth/login` → JWT token
- [ ] `POST /send` → Email envoyé
- [ ] Rate limiting fonctionne (test 6 fois login)
- [ ] CORS pour *.vercel.app autorisé

### Checklist Sécurité
- [ ] JWT_SECRET n'est PAS "secret" ou "12345"
- [ ] ADMIN_PASSWORD est fort (min 12 caractères)
- [ ] SMTP_PASS est l'App Password (pas le mot de passe Gmail)
- [ ] NODE_ENV = "production"
- [ ] Pas de logs sensibles affichés

---

## 🆘 Troubleshooting

### Le frontend ne charge pas les formations
**Problème:** Erreur CORS
**Solution:** Vérifier que le backend est en ligne et CORS est configuré
```bash
curl https://safeanesthesia.onrender.com/api/formations
```

### Login échoue
**Problème:** ADMIN_PASSWORD incorrect
**Solution:** Vérifier le mot de passe dans Render Environment Variables

### Emails ne sont pas envoyés
**Problème:** SMTP config incorrecte
**Solution:**
1. Vérifier `SMTP_USER` = email Gmail
2. Vérifier `SMTP_PASS` = App Password (pas le mot de passe Gmail)
3. Vérifier 2FA est activé sur Gmail
4. Vérifier `ADMIN_EMAIL` est correct

### Images n'apparaissent pas
**Problème:** URL API_BASE incorrecte dans Frontend
**Solution:** Dans les fichiers JS, vérifier:
```javascript
const API_BASE = "https://safeanesthesia.onrender.com";
// Pas "http://" ou "localhost"
```

---

## 📞 Support

Pour des problèmes:

1. **Vérifier les logs** (Vercel & Render)
2. **Tester l'API avec curl:**
   ```bash
   curl https://safeanesthesia.onrender.com/api/health
   curl https://safe-anesthesia.vercel.app
   ```
3. **Vérifier .env variables en Render dashboard**
4. **Redéployer** si changements effectués

---

## 🎉 Succès!

Une fois tous les tests réussis, votre plateforme est **en production et prête à l'utilisation!**

```
Frontend:  https://safe-anesthesia.vercel.app
Backend:   https://safeanesthesia.onrender.com
```

**Bon déploiement! 🚀**
