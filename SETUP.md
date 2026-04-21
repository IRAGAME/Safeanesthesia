# 🏥 SafeAnesthesia - Setup & Running Guide

## 📋 Prérequis
- Node.js v18+ installé
- npm ou yarn

## 🚀 Installation & Démarrage

### 1. Configuration des variables d'environnement
```bash
cp .env.example .env
```

Puis modifiez `.env` avec vos valeurs:
```env
PORT=3000
ADMIN_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 2. Installation des dépendances
```bash
npm install --legacy-peer-deps
```

### 3. Démarrage du serveur

**Mode développement:**
```bash
npm run dev
# ou
npm start
```

Le serveur démarre sur **http://localhost:3000**

## 📁 Structure Backend

### Routes API
- `GET /api/health` - Health check
- `GET /api/formations` - Lister toutes les formations
- `GET /api/formations/:id` - Récupérer une formation
- `POST /api/admin/formations` - Ajouter une formation (protégée)
- `PUT /api/admin/formations/:id` - Modifier une formation (protégée)
- `DELETE /api/admin/formations/:id` - Supprimer une formation (protégée)

### Routes Auth
- `POST /login` - Se connecter et obtenir un token JWT
- `POST /api/auth/login` - Alternative (compatibilité)
- `GET /api/auth/verify` - Vérifier le token (protégée)
- `POST /api/auth/logout` - Se déconnecter

### Routes Contact
- `POST /send` - Envoyer un message de contact

## 🔒 Authentification

1. Envoyer: `POST /login` avec `{"password": "votre_password"}`
2. Réponse: `{"token": "eyJhbGc..."}`
3. Utiliser le token dans les requêtes protégées:
   ```
   Authorization: Bearer eyJhbGc...
   ```

## 📊 Base de données

Les données sont stockées dans `data/formations.json` (créé automatiquement)

## 🔧 Variables d'environnement requises

| Variable | Description | Par défaut |
|----------|-------------|-----------|
| `PORT` | Port du serveur | 3000 |
| `NODE_ENV` | Environnement | development |
| `ADMIN_PASSWORD` | Mot de passe admin | ⚠️ Requis |
| `JWT_SECRET` | Clé JWT | fallback (non sécurisé) |
| `SMTP_HOST` | Serveur SMTP | smtp.gmail.com |
| `SMTP_PORT` | Port SMTP | 465 |
| `SMTP_USER` | Email SMTP | - |
| `SMTP_PASS` | Password SMTP | - |
| `CONTACT_EMAIL` | Email de destination | - |

## 🌐 Déploiement Vercel

- `api/handler.js` gère les requêtes Vercel serverless
- Configuration dans `vercel.json`
- Même code utilisé partout (dev-server.js + handler.js)

## ✅ Vérifier que ça marche

```bash
curl http://localhost:3000/api/health
```

Réponse esperée:
```json
{"status":"ok","timestamp":"2026-04-21T10:30:00.000Z"}
```

---
**🎯 Tout est prêt! Le serveur est lancé sur le port 3000**
