// ================= IMPORTS =================
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

// ================= CONFIGURATION =================
dotenv.config();

// Vérifier les variables d'environnement critiques
const requiredEnvVars = ["JWT_SECRET", "ADMIN_PASSWORD"];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ Erreur critique: Variables manquantes: ${missingVars.join(", ")}`);
  console.error("   Veuillez configurer votre fichier .env");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// ================= SÉCURITÉ - Helmet Headers =================
// Configure les en-têtes HTTP de sécurité
app.use(helmet({
  contentSecurityPolicy: false, // Frontend statique gère cela
  frameguard: { action: "deny" },
  nosniff: true,
  xssFilter: true
}));
app.disable("x-powered-by"); // Masquer signature Express

// ================= CORS - Configuration Sécurisée =================
// Définir les origines autorisées en fonction de l'environnement
const getAllowedOrigins = () => {
  const origins = [];
  
  // Développement local
  if (process.env.NODE_ENV !== "production") {
    origins.push("http://localhost:3000", "http://localhost:5173");
  }
  
  // Production - Domaines Vercel
  origins.push(
    "https://safe-anesthesia.vercel.app",
    "https://safeanesthesia.vercel.app"
  );
  
  // URLs personnalisées (si configurées)
  if (process.env.VERCEL_URL) origins.push(`https://${process.env.VERCEL_URL}`);
  if (process.env.RENDER_URL) origins.push(process.env.RENDER_URL);
  
  return origins.filter(Boolean);
};

const allowedOrigins = getAllowedOrigins();

console.log(`\n📝 CORS Origins Autorisées:`, allowedOrigins, "\n");

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origine (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Vérifier si l'origine est dans la liste blanche
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    // Autoriser tous les *.vercel.app en production (previews)
    if (origin.endsWith(".vercel.app")) return callback(null, true);
    
    // Rejeter les autres origines en production
    if (process.env.NODE_ENV === "production") {
      return callback(new Error(`CORS: Origine "${origin}" non autorisée`));
    }
    
    // Autoriser tout en développement
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 3600 // Cache CORS pendant 1 heure
}));

// ================= RATE LIMITING - Protection DDoS =================
// Limiter les tentatives de login (5 par 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Trop de tentatives de connexion. Réessayez dans 15 minutes." },
  standardHeaders: false,
  legacyHeaders: false
});

// Limiter les requêtes de contact (5 par minute)
const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: "Trop de demandes. Réessayez dans 1 minute." },
  standardHeaders: false,
  legacyHeaders: false
});

// ================= MIDDLEWARE - Parsers =================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.static("public")); // Servir les fichiers statiques (images)

// ================= BASE DE DONNÉES - JSON File-Based =================
// Stockage simple mais efficace pour une petite app
// Pour un vrai projet, utiliser MongoDB ou PostgreSQL
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "formations.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/**
 * Utilitaires de base de données
 */
const dbUtils = {
  /**
   * Lit les formations depuis le fichier JSON
   * @returns {object} {formations: [], nextId: 1}
   */
  read: () => {
    try {
      if (!fs.existsSync(DB_FILE)) {
        return { formations: [], nextId: 1 };
      }
      return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    } catch (err) {
      console.error("⚠️  Erreur lecture DB:", err.message);
      return { formations: [], nextId: 1 };
    }
  },

  /**
   * Écrit les formations dans le fichier JSON
   * @param {object} data - {formations: [], nextId: 1}
   * @returns {boolean} true si succès
   */
  write: (data) => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
      return true;
    } catch (err) {
      console.error("❌ Erreur écriture DB:", err.message);
      return false;
    }
  }
};

// ================= AUTHENTIFICATION JWT =================
/**
 * Middleware pour vérifier le JWT du token admin
 * @middleware
 */
function authAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  
  if (!authHeader) {
    return res.status(401).json({ error: "Token manquant. Format: Bearer <token>" });
  }

  const token = authHeader.split(" ")[1]; // Format: "Bearer <token>"
  if (!token) {
    return res.status(401).json({ error: "Format du token invalide" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(403).json({ error: "Token expiré" });
    }
    return res.status(403).json({ error: "Token invalide" });
  }
}

// ================= UPLOAD FICHIERS - Multer Configuration =================
/**
 * Configuration du stockage des fichiers uploadés
 * Les images sont stockées dans public/images/ImageFormation/
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "public/images/ImageFormation");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique avec timestamp
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

/**
 * Filtre pour n'accepter que les images
 */
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = /jpeg|jpg|png|webp/;
    const isMimeValid = allowedMimes.test(file.mimetype);
    const isExtValid = allowedMimes.test(path.extname(file.originalname).toLowerCase());
    
    if (isMimeValid && isExtValid) {
      cb(null, true);
    } else {
      cb(new Error("Format d'image non accepté. Utilisez JPG, PNG ou WebP."));
    }
  }
});

// ================= EMAIL - Nodemailer Configuration =================
/**
 * Configuration du service d'envoi d'emails
 * Utilise SMTP (Gmail recommandé avec App Password)
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true, // true pour port 465, false pour 587
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || ""
  }
});

// Tester la connexion SMTP au démarrage
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter.verify((err, success) => {
    if (err) {
      console.warn("⚠️  SMTP non disponible:", err.message);
    } else {
      console.log("✅ SMTP configuré et prêt");
    }
  });
}

// ================= ROUTES PUBLIQUES =================

/**
 * Health Check - Pour monitoring et déploiement
 * GET /api/health
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ================= ROUTES FORMATIONS (CRUD) =================

/**
 * Liste toutes les formations
 * GET /api/formations
 * Réponse: [{id, titre, contenu, image, createdAt, ...}]
 */
app.get("/api/formations", (req, res) => {
  try {
    const db = dbUtils.read();
    res.json(db.formations || []);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la lecture des formations" });
  }
});

/**
 * Récupère une formation par ID
 * GET /api/formations/:id
 */
app.get("/api/formations/:id", (req, res) => {
  try {
    const db = dbUtils.read();
    const formation = db.formations.find(f => f.id === parseInt(req.params.id));
    
    if (!formation) {
      return res.status(404).json({ error: "Formation introuvable" });
    }
    
    res.json(formation);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la lecture de la formation" });
  }
});

/**
 * Crée une nouvelle formation (Admin)
 * POST /api/admin/formations
 * Body: {titre, contenu, image (file)}
 */
app.post("/api/admin/formations", authAdmin, upload.single("image"), (req, res) => {
  try {
    const { titre, contenu } = req.body;
    
    if (!titre?.trim() || !contenu?.trim()) {
      return res.status(400).json({ error: "Titre et contenu requis" });
    }

    const db = dbUtils.read();
    const imagePath = req.file ? `/images/ImageFormation/${req.file.filename}` : null;
    
    const newFormation = {
      id: db.nextId++,
      titre: titre.trim(),
      contenu: contenu.trim(),
      image: imagePath,
      createdAt: new Date().toISOString()
    };

    db.formations.push(newFormation);
    
    if (!dbUtils.write(db)) {
      return res.status(500).json({ error: "Erreur lors de la sauvegarde" });
    }
    
    res.status(201).json({ ok: true, formation: newFormation });
  } catch (err) {
    console.error("❌ Erreur POST /api/admin/formations:", err.message);
    res.status(500).json({ error: "Erreur lors de la création" });
  }
});

/**
 * Modifie une formation (Admin)
 * PUT /api/admin/formations/:id
 */
app.put("/api/admin/formations/:id", authAdmin, upload.single("image"), (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { titre, contenu } = req.body;
    
    if (!titre?.trim() || !contenu?.trim()) {
      return res.status(400).json({ error: "Titre et contenu requis" });
    }

    const db = dbUtils.read();
    const formation = db.formations.find(f => f.id === id);
    
    if (!formation) {
      return res.status(404).json({ error: "Formation introuvable" });
    }

    formation.titre = titre.trim();
    formation.contenu = contenu.trim();
    
    // Remplacer l'image si une nouvelle est fournie
    if (req.file) {
      if (formation.image) {
        const oldPath = path.join(__dirname, "public", formation.image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath); // Supprimer l'ancienne image
        }
      }
      formation.image = `/images/ImageFormation/${req.file.filename}`;
    }
    
    formation.updatedAt = new Date().toISOString();

    if (!dbUtils.write(db)) {
      return res.status(500).json({ error: "Erreur lors de la sauvegarde" });
    }
    
    res.json({ ok: true, formation });
  } catch (err) {
    console.error("❌ Erreur PUT /api/admin/formations/:id:", err.message);
    res.status(500).json({ error: "Erreur lors de la modification" });
  }
});

/**
 * Supprime une formation (Admin)
 * DELETE /api/admin/formations/:id
 */
app.delete("/api/admin/formations/:id", authAdmin, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const db = dbUtils.read();
    const index = db.formations.findIndex(f => f.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: "Formation introuvable" });
    }

    const formation = db.formations[index];
    
    // Supprimer l'image associée
    if (formation.image) {
      const imagePath = path.join(__dirname, "public", formation.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    db.formations.splice(index, 1);
    
    if (!dbUtils.write(db)) {
      return res.status(500).json({ error: "Erreur lors de la suppression" });
    }
    
    res.json({ ok: true, message: "Formation supprimée avec succès" });
  } catch (err) {
    console.error("❌ Erreur DELETE /api/admin/formations/:id:", err.message);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

// ================= ROUTES AUTHENTIFICATION =================

/**
 * Authentification admin - Génère un JWT token
 * POST /api/auth/login
 * Body: {password}
 * Réponse: {token}
 */
app.post("/api/auth/login", loginLimiter, (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Mot de passe requis" });
    }

    // Vérifier le mot de passe
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    // Générer le JWT token (valide 24h)
    const token = jwt.sign(
      { user: "admin", iat: Math.floor(Date.now() / 1000) },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token, expiresIn: "24h" });
  } catch (err) {
    console.error("❌ Erreur POST /api/auth/login:", err.message);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});

/**
 * Vérifier la validité d'un token
 * GET /api/auth/verify
 * Headers: Authorization: Bearer <token>
 */
app.get("/api/auth/verify", authAdmin, (req, res) => {
  res.json({
    valid: true,
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

/**
 * Logout (côté client - le JWT reste valide jusqu'à expiration)
 * POST /api/auth/logout
 */
app.post("/api/auth/logout", authAdmin, (req, res) => {
  res.json({ message: "Déconnecté avec succès" });
});

// ================= ROUTES CONTACT =================

/**
 * Envoyer un message de contact
 * POST /send
 * Body: {name, email, message}
 * Rate limit: 5 par minute
 */
app.post("/send", contactLimiter, async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation des champs
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Email invalide" });
    }

    // Nettoyer et sanitizer les données pour éviter l'injection HTML
    const cleanName = name.trim().replace(/[<>]/g, "");
    const cleanEmail = email.trim().toLowerCase();
    const cleanMessage = message.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Envoyer l'email si SMTP est configuré
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
          replyTo: cleanEmail,
          subject: `[Contact SafeAnesthesia] ${cleanName}`,
          html: `
            <h2>Nouveau message de contact</h2>
            <p><strong>De:</strong> ${cleanName} (${cleanEmail})</p>
            <hr>
            <p><strong>Message:</strong></p>
            <p>${cleanMessage.replace(/\n/g, "<br>")}</p>
            <hr>
            <p><small>Répondre directement à: ${cleanEmail}</small></p>
          `
        });
        console.log(`✅ Email de contact envoyé de ${cleanEmail}`);
      } catch (emailErr) {
        // Ne pas bloquer la réponse si l'email échoue
        console.warn("⚠️  Erreur envoi email:", emailErr.message);
      }
    }

    res.json({
      ok: true,
      message: "✅ Message reçu! Nous vous répondrons bientôt."
    });
  } catch (err) {
    console.error("❌ Erreur POST /send:", err.message);
    res.status(500).json({ error: "Erreur lors de l'envoi du message" });
  }
});

// ================= GESTION DES ERREURS =================

/**
 * Middleware pour capturer les erreurs Multer
 */
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Fichier trop volumineux (max 5MB)" });
    }
    return res.status(400).json({ error: `Erreur upload: ${err.message}` });
  }
  
  // Autres erreurs
  if (err) {
    console.error("❌ Erreur:", err.message);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
  
  next();
});

/**
 * Route 404 - Not Found
 */
app.use((req, res) => {
  res.status(404).json({
    error: "Route non trouvée",
    path: req.path,
    method: req.method
  });
});

// ================= DÉMARRAGE DU SERVEUR =================

// Ne lancer le serveur que en mode local (pas sur Vercel)
if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`🚀 SafeAnesthesia Backend Server`);
    console.log(`${"═".repeat(60)}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📁 DB:  ${DB_FILE}`);
    console.log(`🔐 JWT: ${process.env.JWT_SECRET ? "✅ Configuré" : "❌ Non configuré"}`);
    console.log(`📧 Email: ${process.env.SMTP_USER ? "✅ Activé" : "⚠️  Désactivé"}`);
    console.log(`🌐 Env: ${process.env.NODE_ENV}`);
    console.log(`${"═".repeat(60)}\n`);
  });
}

// Export pour Vercel serverless
export default app;