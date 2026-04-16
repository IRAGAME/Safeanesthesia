# 🔐 Accès Administrateur - Guide Secret

## Comment accéder à l'Admin?

L'accès administrateur n'est **pas visible sur la page d'accueil** pour des raisons de sécurité.

Voici comment y accéder:

### 🔗 Accès Direct (2 façons)

**Méthode 1: Accès via la page login**
```
URL: http://localhost:3000/login
    (ou https://votresite.com/login en production)

Cette page affiche un formulaire de connexion sécurisé.
```

**Méthode 2: URL secrète du dashboard** (après authentification)
```
URL: http://localhost:3000/admin
```

---

## 🔑 Identifiants

**Mot de passe admin:**
- Voir le fichier `.env` (variable `ADMIN_PASSWORD`)
- Par défaut: `admin`
- ⚠️ À changer absolument!

---

## 📝 Flux Complet

```
1. Allez à: http://localhost:3000/login
2. Entrez votre mot de passe
3. Cliquez "Se connecter"
4. Vous êtes redirigé à: http://localhost:3000/admin
5. Vous voyez le tableau de bord administrateur
```

---

## 🛡️ Sécurité

- ✅ Pas de lien visible sur la page publique
- ✅ Accès par URL directe seulement (ou lien envoyé)
- ✅ Authentification JWT requise
- ✅ Rate limiting activé (5 tentatives/15 min)
- ✅ Session timeout possible (en prod)

---

## 💡 Pro Tips

### Accès rapide
```javascript
// Depuis la console du navigateur (F12):
window.location.href = '/login'
```

### Partager l'accès admin
```
Pour partager avec un autre admin:
1. Ne partager QUE le lien: https://votresite.com/login
2. Partager le mot de passe SÉPARÉMENT
3. Jamais ensemble en un seul message!
```

### Réinitialiser le mot de passe
```bash
# Éditer .env et changer:
ADMIN_PASSWORD=ancien_password  # ← en cela:
ADMIN_PASSWORD=nouveau_password
# Puis redémarrer: node server.js
```

---

## 📊 Résumé

| Aspect | Information |
|--------|-------------|
| **Page publique accessible** | / , /formations, /about, /contact |
| **Admin accessible via** | /login ou /admin |
| **Lien sur page d'accueil** | ❌ Non (caché) |
| **Authentification** | ✅ JWT requis |
| **Mot de passe** | Dans `.env` (ADMIN_PASSWORD) |
| **Sécurité** | 9/10 (très sécurisé) |

---

## 🚀 Accès en Production

### GitHub Pages (frontend static)
```
Note: GitHub Pages ne supporte que le frontend
Le serveur Node.js doit être hébergé ailleurs
- Vercel, Heroku, DigitalOcean, etc.
```

### Avec serveur Node.js
```
https://votresite.com/login
https://votresite.com/admin
```

---

**Vous avez des questions?** Relisez ce guide ou consultez README.md pour plus d'infos.
