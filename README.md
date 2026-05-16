# 🏥 Safe Anesthesia - Formation Médicale Sécurisée

Plateforme web moderne de **formation médicale continue** pour SPOOA-PM Africa.

---

## 🚀 Architecture Déploiement

### **Frontend (Vercel)** - Statique (HTML/CSS/JS)
- **Repository root:** `/frontend`
- **Build:** Aucune compilation (fichiers statiques)
- **Output:** `.` (root du dossier)
- **URL:** `https://safe-anesthesia.vercel.app`

### **Backend (Render)** - Node.js + Express
- **Repository root:** `/backend`
- **Start command:** `node server.js`
- **Port:** 3000
- **URL:** `https://safeanesthesia.onrender.com`

---

## 🛠️ Stack Technique

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| **Frontend** | HTML5, CSS3, Vanilla JS | Interface utilisateur statique |
| **Backend** | Node.js 18+, Express 5 | API REST + Authentification |
| **DB** | JSON (fichiers) | Stockage formations |
| **Auth** | JWT (24h) | Sécurité Admin |
| **Sécurité** | Helmet, CORS, Rate Limiting | Protection requêtes |
| **Email** | Nodemailer + SMTP | Contact form |

---

## 📋 Configuration Préalable

### 1. Variables d'Environnement Backend

Créer `/backend/.env`:
```env
# 🔐 SÉCURITÉ
JWT_SECRET=votre_clé_jwt_très_secrète_et_aléatoire
ADMIN_PASSWORD=votre_mot_de_passe_admin_fort

# 📧 EMAIL (pour formulaire de contact)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=votre_email@gmail.com
SMTP_PASS=votre_mot_de_passe_application  # App Password de Gmail
SMTP_FROM=noreply@safeanesthesia.com
ADMIN_EMAIL=admin@safeanesthesia.com

# 🖥️ SERVEUR
PORT=3000
NODE_ENV=production
```

**💡 Pour Gmail avec 2FA:**
1. Activer l'authentification à 2 facteurs
2. Générer un "App Password" spécifique
3. Utiliser ce password dans `SMTP_PASS` (pas votre password Gmail)

### 2. Vérifier la Configuration Frontend

Le fichier `frontend/vercel.json` doit être present et configurer les routes.

---

## 📡 API Routes

### **Routes Publiques**

```
GET /api/health                    # Health check
GET /api/formations                # Lister toutes les formations
GET /api/formations/:id            # Détail d'une formation
```

### **Routes Authentifiées (Admin)**

```
POST   /api/auth/login             # Connexion (retourne JWT token)
GET    /api/auth/verify            # Vérifier token valide
POST   /api/auth/logout            # Logout (info client)
POST   /api/admin/formations       # Créer formation (multipart)
PUT    /api/admin/formations/:id   # Modifier formation (multipart)
DELETE /api/admin/formations/:id   # Supprimer formation
```

### **Routes de Contact**

```
POST /send                         # Envoyer message de contact
```

---

## 🔐 Sécurité

### CORS (Cross-Origin Resource Sharing)
- ✅ Domaines Vercel autorisés: `*.vercel.app`
- ✅ Localhost en développement
- ✅ Credintials: Activé

### Rate Limiting
- **Login:** 5 tentatives par 15 minutes
- **Contact:** 5 messages par minute

### JWT Authentication
- **Expiration:** 24 heures
- **Algorithm:** HS256
- **Format:** `Authorization: Bearer <token>`

### File Upload
- **Max size:** 5MB
- **Formats autorisés:** JPG, PNG, WebP
- **Stockage:** `backend/public/images/ImageFormation/`

---

## 🌐 Communication Frontend/Backend

Tous les appels API du frontend pointent vers:
```javascript
const API_BASE = "https://safeanesthesia.onrender.com";
```

### Exemple Requête Authentifiée (Admin)

```javascript
// 1. Login
const res = await fetch("https://safeanesthesia.onrender.com/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password: "admin_password" })
});
const { token } = await res.json();

// 2. Utiliser le token
const res2 = await fetch("https://safeanesthesia.onrender.com/api/admin/formations", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "multipart/form-data"
  },
  body: formData  // {titre, contenu, image}
});
```

---

## 📦 Structure Dossiers

```
safeanesthesia/
├── frontend/                       # 🌐 Vercel (ROOT DIRECTORY)
│   ├── index.html                 # Page d'accueil
│   ├── formations.html            # Liste formations
│   ├── formation.html             # Détail formation
│   ├── admin.html                 # Panel admin
│   ├── login.html                 # Login
│   ├── contact.html               # Formulaire contact
│   ├── about.html                 # À propos
│   ├── vercel.json                # Config Vercel
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── admin.js
│   │   ├── formations.js
│   │   ├── formation.js
│   │   ├── index.js
│   │   └── script.js
│   └── images/
│       ├── spooa/
│       ├── partenaire/
│       └── dg/
│
├── backend/                        # 🔌 Render
│   ├── server.js                  # Express app (principal)
│   ├── package.json
│   ├── .env                       # Configuration (à créer)
│   ├── .env.example               # Template
│   ├── api/
│   │   └── handler.js             # Wrapper Vercel (optionnel)
│   ├── data/
│   │   └── formations.json        # Base de données
│   └── public/
│       └── images/
│           └── ImageFormation/    # Images uploadées
│
├── README.md                       # Ce fichier
├── SETUP.md                        # Guide installation local
└── TODO.md                         # Tâches suivi
```

---

## 🚀 Déploiement Production

### **Frontend sur Vercel**

1. Connecter le repo GitHub à Vercel
2. Variables:
   - **Framework:** Aucun (Static Site)
   - **Root Directory:** `frontend`
   - **Build Command:** (laisser vide)
   - **Output Directory:** `.`

3. Deploy

### **Backend sur Render**

1. Connecter le repo GitHub à Render
2. Créer un Web Service:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free ou Paid

3. Ajouter Environment Variables (depuis Render dashboard):
   - `JWT_SECRET`
   - `ADMIN_PASSWORD`
   - `SMTP_*` (si utilisation emails)
   - `NODE_ENV=production`
   - `PORT=3000`

4. Deploy

---

## ✅ Checklist Déploiement

- [ ] `.env` configuré en `/backend` (JWT_SECRET, ADMIN_PASSWORD, SMTP)
- [ ] `frontend/vercel.json` vérifié
- [ ] API_BASE dans les fichiers JS pointe vers Render
- [ ] CORS configuré dans backend (Vercel domains)
- [ ] Images optimisées (voir TODO.md)
- [ ] Tests locaux réussis
- [ ] Frontend déployé sur Vercel
- [ ] Backend déployé sur Render
- [ ] Communication frontend↔backend vérifiée

---

## 🧪 Tests

### Local

```bash
# Backend
cd backend
npm install
npm start  # Écoute sur http://localhost:3000

# Frontend
# Servir avec un serveur local (Python, Node, etc.)
python3 -m http.server 8000  # Dans le dossier frontend
# Puis: http://localhost:8000
```

### Production

- [ ] Vérifier `/api/health` → {status: "ok"}
- [ ] Charger `/api/formations` → Liste JSON
- [ ] Login admin → JWT token reçu
- [ ] Créer formation → Image uploadée
- [ ] Formulaire contact → Email reçu

---

## 📞 Support & Maintenance

- **Frontend bugs:** Vérifier Vercel logs
- **Backend errors:** Vérifier Render logs
- **CORS issues:** Vérifier `allowedOrigins` dans server.js
- **Database:** `backend/data/formations.json`

---

## 📄 Fichiers Importants

- [SETUP.md](SETUP.md) - Installation & développement local
- [TODO.md](TODO.md) - Optimisations et tâches suivi
- [backend/server.js](backend/server.js) - API principale
- [frontend/vercel.json](frontend/vercel.json) - Config Vercel
│   │   ├── partenaire/
│   │   └── spooa/
│   └── js/             # Scripts frontend
│       ├── admin.js
│       ├── formation.js
│       ├── formations.js
│       ├── index.js
│       └── script.js
│
└── backend/            # API Node.js + Express (Render)
      ├── server.js
      ├── package.json
      ├── .env.example
      ├── api/
      │   └── handler.js
      ├── data/
      │   └── formations.json
      └── public/
            └── images/
                  └── ImageFormation/   # Images uploadées
```

---

## ⚙️ Configuration Backend (.env)

```bash
cd backend
cp .env.example .env
```

Variables requises :

```env
# Authentification
ADMIN_PASSWORD=your_admin_password_here
JWT_SECRET=your_jwt_secret_key_here

# Email SMTP (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
CONTACT_EMAIL=admin@safeanesthesia.com

# Serveur
PORT=3000
NODE_ENV=production
```

**⚠️ NE JAMAIS COMMITER .env**

---

## 🔐 Accès Admin

**L'accès admin N'est PAS visible sur la page d'accueil !**

Pour y accéder :
1. Allez à : `https://safe-anesthesia.vercel.app/login.html`
2. Entrez le mot de passe (dans `.env` → `ADMIN_PASSWORD`)
3. Cliquez "Se connecter"
4. Accédez au dashboard `admin.html`

---

## 🛠️ Stack

**Backend :** Node.js + Express + JWT + JSON DB  
**Frontend :** HTML5 + CSS3 + Vanilla JS (statique)  
**Sécurité :** Helmet + Rate Limiting + Middleware Auth + CORS

---

## 📚 Routes API

### Publiques
```
GET  /api/health                # Health check
GET  /api/formations            # Liste formations
GET  /api/formations/:id        # Détail formation
POST /send                      # Contact email
```

### Auth
```
POST /login                     # Connexion (JWT)
POST /api/auth/login            # Connexion (JWT)
GET  /api/auth/verify           # Vérifier token
POST /api/auth/logout           # Déconnexion
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
cd backend
npm install
node server.js
```

**"Impossible de se connecter"**
- Vérifier que `.env` existe dans `/backend`
- Vérifier `ADMIN_PASSWORD` défini
- Vérifier la console serveur pour erreurs

**"CORS blocked"**
- Vérifier que `https://safe-anesthesia.vercel.app` est dans `allowedOrigins` de `backend/server.js`

---

**Version :** 2.0  
**Statut :** ✅ Production-Ready  
**Licence :** Propriétaire SPOOA-PM Africa

