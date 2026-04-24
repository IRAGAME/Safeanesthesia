import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import multer from "multer";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";

// Configuration
dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "your_secret_key") {
  console.error("❌ Erreur: JWT_SECRET n'est pas configuré ou est trop faible. Le serveur s'arrête.");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// ================= SÉCURITÉ =================
app.use(helmet({ contentSecurityPolicy: false }));
app.disable("x-powered-by");

// CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.GITHUB_PAGES_URL || "",
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ""
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Trop de tentatives, réessayez dans 15 minutes." }
});

const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Trop de tentatives, réessayez dans 1 minute." }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// ================= DATABASE (JSON) =================
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "formations.json");

// Créer le répertoire data s'il n'existe pas
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const dbUtils = {
  read: () => {
    try {
      if (!fs.existsSync(DB_FILE)) return { formations: [], nextId: 1 };
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      return { formations: [], nextId: 1 };
    }
  },
  write: (data) => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (e) {
      return false;
    }
  }
};

// ================= AUTHENTIFICATION =================
function authAdmin(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) {
    return res.status(401).json({ message: "Token manquant" });
  }

  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Format du token invalide" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ Erreur token:", error.message);
    return res.status(403).json({ message: "Token invalide ou expiré" });
  }
}

// ================= MULTER (Upload images) =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "public/images/ImageFormation");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite 5Mo
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const mimeType = allowedTypes.test(file.mimetype);
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (mimeType && extName) return cb(null, true);
    cb(new Error("Seules les images (jpg, png, webp) sont autorisées"));
  }
});

// ================= EMAIL =================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || ""
  }
});

// ================= HEALTH CHECK =================
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ================= FORMATIONS - GET =================

// Récupérer toutes les formations
app.get("/api/formations", (req, res) => {
  try {
    const db = dbUtils.read();
    res.json(db.formations || []);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Récupérer une formation par ID
app.get("/api/formations/:id", (req, res) => {
  try {
    const db = dbUtils.read();
    const formation = db.formations.find(f => f.id === parseInt(req.params.id));
    
    if (!formation) {
      return res.status(404).json({ error: "Formation introuvable" });
    }
    
    res.json(formation);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ================= FORMATIONS - CREATE (ADMIN) =================

app.post("/api/admin/formations", authAdmin, upload.single("image"), (req, res) => {
  try {
    const { titre, contenu } = req.body;

    // Validation
    if (!titre || !titre.trim()) {
      return res.status(400).json({ error: "Titre requis" });
    }
    if (!contenu || !contenu.trim()) {
      return res.status(400).json({ error: "Contenu requis" });
    }

    // Recharger la DB
    const db = dbUtils.read();

    // Créer la nouvelle formation
    const imagePath = req.file ? `/images/ImageFormation/${req.file.filename}` : null;
    const newFormation = {
      id: db.nextId++,
      titre: titre.trim(),
      contenu: contenu.trim(),
      image: imagePath,
      vues: 0,
      likes: 0,
      commentaires: 0,
      createdAt: new Date().toISOString()
    };

    // Ajouter à la DB
    db.formations.push(newFormation);
    
    if (dbUtils.write(db)) {
      res.status(201).json({ ok: true, formation: newFormation });
    } else {
      res.status(500).json({ error: "Erreur lors de la sauvegarde" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de l'ajout de la formation" });
  }
});

// ================= FORMATIONS - UPDATE (ADMIN) =================

app.put("/api/admin/formations/:id", authAdmin, upload.single("image"), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { titre, contenu } = req.body;

    // Validation
    if (!titre || !titre.trim()) {
      return res.status(400).json({ error: "Titre requis" });
    }
    if (!contenu || !contenu.trim()) {
      return res.status(400).json({ error: "Contenu requis" });
    }

    // Recharger la DB
    const db = dbUtils.read();

    // Trouver la formation
    const formation = db.formations.find(f => f.id === id);
    if (!formation) {
      return res.status(404).json({ error: "Formation introuvable" });
    }

    // Mettre à jour
    formation.titre = titre.trim();
    formation.contenu = contenu.trim();
    if (req.file) {
      // Supprimer l'ancienne image si elle existe
      if (formation.image) {
        const oldPath = path.join(__dirname, "public", formation.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      formation.image = `/images/ImageFormation/${req.file.filename}`;
    }
    formation.updatedAt = new Date().toISOString();

    if (dbUtils.write(db)) {
      res.json({ ok: true, formation });
    } else {
      res.status(500).json({ error: "Erreur lors de la sauvegarde" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
});

// ================= FORMATIONS - DELETE (ADMIN) =================

app.delete("/api/admin/formations/:id", authAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Recharger la DB
    const db = dbUtils.read();

    // Trouver l'index
    const index = db.formations.findIndex(f => f.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Formation introuvable" });
    }
    
    // Supprimer l'image du disque
    const formation = db.formations[index];
    if (formation.image) {
      const imagePath = path.join(__dirname, "public", formation.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    // Supprimer
    db.formations.splice(index, 1);

    if (dbUtils.write(db)) {
      res.json({ ok: true, message: "Formation supprimée", id });
    } else {
      res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  } catch (error) {
    console.error("❌ Erreur DELETE /api/admin/formations/:id:", error.message);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

// ================= AUTHENTIFICATION =================

app.post("/login", loginLimiter, (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      { user: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token });
  } catch (error) {
    console.error("❌ Erreur POST /login:", error.message);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});

app.post("/api/auth/login", loginLimiter, (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    const token = jwt.sign(
      { user: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token });
  } catch (error) {
    console.error("❌ Erreur POST /api/auth/login:", error.message);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});

app.get("/api/auth/verify", authAdmin, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.post("/api/auth/logout", authAdmin, (req, res) => {
  res.json({ message: "Déconnecté avec succès" });
});

// ================= CONTACT =================

app.post("/send", contactLimiter, async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    // Nettoyage basique pour éviter l'injection HTML
    const safeMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Envoyer email
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER || "noreply@safeanesthesia.com",
        to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
        replyTo: email,
        subject: `[Contact] ${name}`,
        html: `
          <h2>Nouveau message de contact</h2>
          <p><strong>Nom:</strong> ${name.replace(/</g, "&lt;")}</p>
          <p><strong>Email:</strong> ${email.replace(/</g, "&lt;")}</p>
          <p><strong>Message:</strong></p>
          <p>${safeMessage.replace(/\n/g, '<br>')}</p>
        `
      });
    } catch (emailError) {
      console.warn("⚠️  Email non envoyé:", emailError.message);
      // Continue quand même
    }

    res.json({ ok: true, message: "✅ Message reçu! Nous vous répondrons bientôt." });
  } catch (error) {
    console.error("❌ Erreur POST /send:", error.message);
    res.status(500).json({ error: "Erreur lors de l'envoi" });
  }
});

// ================= PAGES HTML =================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/login.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/admin.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/about.html"));
});

app.get("/contact", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/contact.html"));
});

app.get("/formations", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/formations.html"));
});

app.get("/formation", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/formation.html"));
});

// ================= ERROR HANDLING =================

app.use((err, req, res, next) => {
  console.error("❌ Erreur serveur:", err.message);
  res.status(500).json({ error: "Erreur serveur interne" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route non trouvée" });
});

// ================= SERVER STARTUP =================

if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 SafeAnesthesia Server`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📁 DB: ${DB_FILE}`);
    console.log(`🔐 JWT: ${process.env.JWT_SECRET ? '✅' : '⚠️  Par défaut'}`);
    console.log(`📧 Email: ${process.env.SMTP_USER ? '✅' : '⚠️  Désactivé'}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  });
}

export default app;
