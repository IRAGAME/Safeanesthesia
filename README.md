# 🏥 Safe Anesthesia - Formation Médicale Sécurisée

plateforme web de **formation médicale continue** pour SPOOA-PM Africa.

## 🚀 Quickstart

```bash
# 1. Installer dépendances
npm install

# 2. Configurer variables (.env)
nano .env
# Changez: ADMIN_PASSWORD=admin → ADMIN_PASSWORD=VotrePass

# 3. Démarrer serveur
node server.js
# "Serveur lancé sur http://localhost:3000"

# 4. Accès
# 🌐 Public:   http://localhost:3000
# 🔐 Login:    http://localhost:3000/login
# 📊 Admin:    http://localhost:3000/admin (après login)
```

---

## 🔐 Accès Admin

**L'accès admin N'est PAS visible sur la page d'accueil!**

Pour y accéder:
1. Allez à: `http://localhost:3000/login`
2. Entrez le mot de passe (dans `.env` → `ADMIN_PASSWORD`)
3. Cliquez "Se connecter"
4. Accédez au dashboard `/admin`

📖 Détails → **[ADMIN_ACCESS.md](ADMIN_ACCESS.md)**

---

## 📁 Structure

```
safeanesthesia/
├── server.js           # Backend Express + API
├── .env                # Config (⚠️ jamais commiter)
├── package.json
├── formations.sqlite   # Database
└── public/
    ├── index.html
    ├── style.css
    ├── pages/
    │   ├── login.html       # 🔓 Connexion
    │   ├── admin.html       # 🔐 Dashboard
    │   └── ...
    └── scripts/
        └── ...
```

---

## ⚙️ Configuration (.env)

```env
# Authentification
ADMIN_PASSWORD=admin                    # À changer!
JWT_SECRET=your_secret_key              # À générer!

# Email SMTP (optionnel)
SMTP_USER=votre_email@gmail.com
SMTP_PASS=app_password
ADMIN_EMAIL=admin@safeanesthesia.com

# Serveur
PORT=3000
NODE_ENV=development
```

**⚠️ NE JAMAIS COMMITER .env**

---

## 🛠️ Stack

**Backend:** Node.js + Express + JWT + SQLite  
**Frontend:** HTML5 + CSS3 + Vanilla JS  
**Sécurité:** Helmet + Rate Limiting + Middleware Auth

---

## 📚 Routes API

### Publiques
```
GET  /                        # Accueil
GET  /api/formations          # Liste formations
POST /send                    # Contact email
```

### Login
```
POST /api/auth/login          # Connexion (JWT)
GET  /api/auth/verify         # Vérifier token
POST /api/auth/logout         # Déconnexion
```

### Admin (protégées - JWT requis)
```
POST   /api/admin/formations       # Ajouter
PUT    /api/admin/formations/:id   # Modifier
DELETE /api/admin/formations/:id   # Supprimer
```

---

## 🆘 Troubleshooting

**"Le serveur ne démarre pas"**
```bash
npm install              # Installer dépendances
node -c server.js       # Vérifier syntaxe
```

**"Impossible de se connecter"**
- Vérifier `.env` existe
- Vérifier `ADMIN_PASSWORD` défini
- Vérifier console serveur pour erreurs

**"Admin page vide"**
- F12 → Console (voir erreurs)
- Vérifier localStorage.adminToken
- Reconnecter-vous

---

## 🚀 Production

### GitHub Pages
GitHub Pages = statique uniquement  
Pour API Node.js: Vercel, Heroku, DigitalOcean, Railway...

### Avant déploiement
- [ ] Mot de passe changé
- [ ] JWT_SECRET générée
- [ ] SMTP configuré
- [ ] HTTPS activé
- [ ] .env sauvegardé
- [ ] Tests validés

---

## 📊 Sécurité

✅ JWT authentication  
✅ Rate limiting (5 tentatives/15 min)  
✅ Middleware protection  
✅ Helmet headers  
✅ Password in .env  
✅ Double validation (client + serveur)  

---

## 📞 Besoin d'aide?

1. Lire: [ADMIN_ACCESS.md](ADMIN_ACCESS.md)
2. Vérifier: Console (F12)
3. Vérifier: Logs serveur

---

**Version:** 1.0  
**Statut:** ✅ Production-Ready  
**Licence:** Propriétaire SPOOA-PM Africa
