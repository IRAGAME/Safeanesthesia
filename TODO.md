# 🚀 Plan de Publication GitHub — SafeAnesthesia

## Étape 1 — package.json
- [ ] Ajouter scripts `start` et `dev`
- [ ] Retirer dépendances inutilisées (`mongoose`, `sql.js`)

## Étape 2 — server.js
- [ ] Conditionner `app.listen()` pour ne pas bloquer Vercel serverless

## Étape 3 — api/handler.js
- [ ] Créer le handler Vercel avec `serverless-http`

## Étape 4 — .gitignore
- [ ] Ajouter patterns standards Node.js

## Étape 5 — README.md
- [ ] Corriger références cassées
- [ ] Mettre à jour instructions de démarrage

## Étape 6 — Tests & Push
- [ ] `npm install` pour mettre à jour package-lock.json
- [ ] Test local `node server.js`
- [ ] `git add`, `commit`, `push`

