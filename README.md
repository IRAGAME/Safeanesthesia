# 🏥 Safe Anesthesia - Formation Médicale Sécurisée

Plateforme web de **formation médicale continue** pour SPOOA-PM Africa.

---

## 🚀 Déploiement

### Frontend (Vercel)

1. Connecter le repo à Vercel
2. **Root Directory** = `/frontend`
3. **Build Command** = *(laisser vide)*
4. **Output Directory** = `.`

Le frontend sera accessible sur `https://safe-anesthesia.vercel.app`.

### Backend (Render)

1. Connecter le repo à Render
2. **Root Directory** = `/backend`
3. **Start Command** = `node server.js`

Le backend sera accessible sur `https://safe-anesthesia.onrender.com`.

---

## 🏗️ Structure

```
safeanesthesia/
├── frontend/           # Site statique (Vercel)
│   ├── index.html
│   ├── about.html
│   ├── contact.html
│   ├── formations.html
│   ├── formation.html
│   ├── admin.html
│   ├── login.html
│   ├── vercel.json
│   ├── css/
│   │   └── style.css
│   ├── images/
│   │   ├── back1.png
│   │   ├── back3.jpg
│   │   ├── dg/
│   │   ├── partenaire/
│   │   └── spooa/
│   └── scripts/
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

