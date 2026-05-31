import express from "express";
import dotenv from "dotenv";
import { createCorsMiddleware } from "./cors.js";
import { imageStorage } from "./storage.js";

import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import multer from "multer";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import db from "./database.js";

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
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.disable("x-powered-by");

// CORS
app.use(createCorsMiddleware());


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

// ================= DATABASE (SQLite) =================
// La base de données est initialisée dans database.js
// Les formations sont stockées dans data/formations.db

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
    const uploadDir = imageStorage.getUploadDir();
    if (!uploadDir) {
      return cb(new Error("Le stockage distant ne supporte pas l'upload direct"));
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
    const formations = db.all('SELECT * FROM formations ORDER BY createdAt DESC');
    res.json(formations);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Récupérer une formation par ID
app.get("/api/formations/:id", (req, res) => {
  try {
    const formation = db.get('SELECT * FROM formations WHERE id = ?', [req.params.id]);
    
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

    if (!titre || !titre.trim()) {
      return res.status(400).json({ error: "Titre requis" });
    }
    if (!contenu || !contenu.trim()) {
      return res.status(400).json({ error: "Contenu requis" });
    }

    const imagePath = req.file ? imageStorage.getPublicUrl(req.file.filename) : null;

    const newId = db.insert(
      `INSERT INTO formations (titre, contenu, image, vues, likes, commentaires, createdAt)
       VALUES (?, ?, ?, 0, 0, 0, ?)`,
      [titre.trim(), contenu.trim(), imagePath, new Date().toISOString()]
    );

    const newFormation = db.get('SELECT * FROM formations WHERE id = ?', [newId]);

    res.status(201).json({ ok: true, formation: newFormation });
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

    if (!titre || !titre.trim()) {
      return res.status(400).json({ error: "Titre requis" });
    }
    if (!contenu || !contenu.trim()) {
      return res.status(400).json({ error: "Contenu requis" });
    }

    const existing = db.get('SELECT * FROM formations WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: "Formation introuvable" });
    }

    let imagePath = existing.image;
    if (req.file) {
      if (existing.image) {
        imageStorage.deleteImage(existing.image);
      }
      imagePath = imageStorage.getPublicUrl(req.file.filename);
    }

    db.run(
      `UPDATE formations SET titre = ?, contenu = ?, image = ?, updatedAt = ?
       WHERE id = ?`,
      [titre.trim(), contenu.trim(), imagePath, new Date().toISOString(), id]
    );

    const updated = db.get('SELECT * FROM formations WHERE id = ?', [id]);
    res.json({ ok: true, formation: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
});

// ================= FORMATIONS - DELETE (ADMIN) =================

app.delete("/api/admin/formations/:id", authAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const formation = db.get('SELECT * FROM formations WHERE id = ?', [id]);
    if (!formation) {
      return res.status(404).json({ error: "Formation introuvable" });
    }

    if (formation.image) {
      imageStorage.deleteImage(formation.image);
    }

    db.run('DELETE FROM formations WHERE id = ?', [id]);
    res.json({ ok: true, message: "Formation supprimée", id });
  } catch (error) {
    console.error("❌ Erreur DELETE /api/admin/formations/:id:", error.message);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

// ================= AUTHENTIFICATION =================

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
    console.log(`💾 SQLite: data/formations.db`);
    console.log(`🔐 JWT: ${process.env.JWT_SECRET ? '✅' : '⚠️  Par défaut'}`);
    console.log(`📧 Email: ${process.env.SMTP_USER ? '✅' : '⚠️  Désactivé'}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  });
}

export default app;
