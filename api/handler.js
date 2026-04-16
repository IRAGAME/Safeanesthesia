import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

// ================= MIDDLEWARE =================
app.use(cors({
  origin: "*",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= AUTHENTIFICATION =================
function authAdmin(req, res, next) {
  const header = req.headers["authorization"];
  const token = header?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token invalide" });
  }
}

// ================= DATABASE STORAGE =================
const dbFile = "/tmp/formations.json";

function loadDB() {
  try {
    if (fs.existsSync(dbFile)) {
      return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    }
  } catch (e) {
    console.error("Erreur lecture DB:", e);
  }
  return { formations: [], nextId: 1 };
}

function saveDB(data) {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Erreur écriture DB:", e);
  }
}

// ================= API ROUTES =================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve HTML pages
const publicPath = path.join(__dirname, '../public');

app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicPath, 'pages/admin.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(publicPath, 'pages/login.html'));
});

// Get all formations
app.get('/api/formations', (req, res) => {
  try {
    const db = loadDB();
    res.json(db.formations || []);
  } catch (error) {
    console.error("Erreur get formations:", error);
    res.status(500).json({ error: "Erreur lecture" });
  }
});

// Get one formation
app.get('/api/formations/:id', (req, res) => {
  try {
    const db = loadDB();
    const formation = db.formations.find(f => f.id == req.params.id);
    if (!formation) {
      return res.status(404).json({ error: "Non trouvée" });
    }
    res.json(formation);
  } catch (error) {
    res.status(500).json({ error: "Erreur lecture" });
  }
});

// Add formation (admin)
app.post('/api/admin/formations', authAdmin, (req, res) => {
  try {
    const { titre, contenu, image } = req.body;
    if (!titre || !contenu) {
      return res.status(400).json({ error: "Titre et contenu requis" });
    }

    const db = loadDB();
    const newFormation = {
      id: db.nextId++,
      titre,
      contenu,
      image: image || null,
      vues: 0,
      likes: 0,
      commentaires: 0,
      createdAt: new Date().toISOString()
    };

    db.formations.push(newFormation);
    saveDB(db);

    res.status(201).json({ ok: true, formation: newFormation });
  } catch (error) {
    console.error("Erreur add formation:", error);
    res.status(500).json({ error: "Erreur ajout" });
  }
});

// Alternative endpoint (backward compatibility)
app.post('/admin/formations', authAdmin, (req, res) => {
  try {
    const { titre, contenu, image } = req.body;
    if (!titre || !contenu) {
      return res.status(400).json({ error: "Titre et contenu requis" });
    }

    const db = loadDB();
    const newFormation = {
      id: db.nextId++,
      titre,
      contenu,
      image: image || null,
      vues: 0,
      likes: 0,
      commentaires: 0,
      createdAt: new Date().toISOString()
    };

    db.formations.push(newFormation);
    saveDB(db);

    res.status(201).json({ ok: true, formation: newFormation });
  } catch (error) {
    console.error("Erreur add formation:", error);
    res.status(500).json({ error: "Erreur ajout" });
  }
});

// Update formation (admin)
app.put('/api/admin/formations/:id', authAdmin, (req, res) => {
  try {
    const { titre, contenu, image } = req.body;
    if (!titre || !contenu) {
      return res.status(400).json({ error: "Titre et contenu requis" });
    }

    const db = loadDB();
    const formation = db.formations.find(f => f.id == req.params.id);
    if (!formation) {
      return res.status(404).json({ error: "Non trouvée" });
    }

    formation.titre = titre;
    formation.contenu = contenu;
    if (image) formation.image = image;
    formation.updatedAt = new Date().toISOString();

    saveDB(db);
    res.json({ ok: true, formation });
  } catch (error) {
    console.error("Erreur update formation:", error);
    res.status(500).json({ error: "Erreur mise à jour" });
  }
});

// Update formation (admin) - alternative endpoint
app.put('/admin/formations/:id', authAdmin, (req, res) => {
  try {
    const { titre, contenu, image } = req.body;
    if (!titre || !contenu) {
      return res.status(400).json({ error: "Titre et contenu requis" });
    }

    const db = loadDB();
    const formation = db.formations.find(f => f.id == req.params.id);
    if (!formation) {
      return res.status(404).json({ error: "Non trouvée" });
    }

    formation.titre = titre;
    formation.contenu = contenu;
    if (image) formation.image = image;
    formation.updatedAt = new Date().toISOString();

    saveDB(db);
    res.json({ ok: true, formation });
  } catch (error) {
    console.error("Erreur update formation:", error);
    res.status(500).json({ error: "Erreur mise à jour" });
  }
});

// Delete formation (admin)
app.delete('/api/admin/formations/:id', authAdmin, (req, res) => {
  try {
    const db = loadDB();
    const index = db.formations.findIndex(f => f.id == req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Non trouvée" });
    }

    db.formations.splice(index, 1);
    saveDB(db);
    res.json({ ok: true });
  } catch (error) {
    console.error("Erreur delete formation:", error);
    res.status(500).json({ error: "Erreur suppression" });
  }
});

// Delete formation (admin) - alternative endpoint
app.delete('/admin/formations/:id', authAdmin, (req, res) => {
  try {
    const db = loadDB();
    const index = db.formations.findIndex(f => f.id == req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: "Non trouvée" });
    }

    db.formations.splice(index, 1);
    saveDB(db);
    res.json({ ok: true });
  } catch (error) {
    console.error("Erreur delete formation:", error);
    res.status(500).json({ error: "Erreur suppression" });
  }
});

// ================= AUTH ROUTES =================

// Login (POST endpoint)
app.post('/login', (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      { user: 'admin', iat: Date.now() },
      process.env.JWT_SECRET || 'fallback-secret'
    );
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Erreur login" });
  }
});

// Also keep /api/auth/login for compatibility
app.post('/api/auth/login', (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      { user: 'admin', iat: Date.now() },
      process.env.JWT_SECRET || 'fallback-secret'
    );
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Erreur login" });
  }
});

// Verify token
app.get('/api/auth/verify', authAdmin, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Logout
app.post('/api/auth/logout', authAdmin, (req, res) => {
  res.json({ message: "Déconnecté" });
});

// ================= CONTACT EMAIL =================

app.post('/send', (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).send("Champs manquants");
    }
    // En production, il faut configurer un service email
    res.send("✅ Message reçu! Nous vous répondrons bientôt.");
  } catch (error) {
    res.status(500).send("Erreur");
  }
});

// ================= ERROR HANDLING =================

app.use((err, req, res, next) => {
  console.error("Erreur:", err);
  res.status(500).json({ error: "Erreur serveur" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route non trouvée" });
});

// Initialize data file at startup
if (!fs.existsSync(dbFile)) {
  saveDB({ formations: [], nextId: 1 });
}

// Export for Vercel
export default serverless(app);
