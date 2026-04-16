// API Handler for Vercel
// This file acts as the entry point for Vercel serverless functions

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// ================= CORS Configuration =================
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

app.use(express.json());
app.use(bodyParser.json());

// Serve public folder
const publicPath = path.join(__dirname, '../public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// ------------------- Sécurité -------------------
app.use(helmet({ contentSecurityPolicy: false }));
app.disable("x-powered-by");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Trop de tentatives, réessayez dans 15 minutes." },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { ok: false, error: "Trop de tentatives, réessayez dans un instant." },
});

app.use(express.urlencoded({ extended: true }));

// ================= AUTHENTIFICATION MIDDLEWARE =================
function authAdmin(req, res, next) {
  const header = req.headers["authorization"];
  const token = header?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token invalide" });
  }
}

// ================= STATIC ROUTES =================
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, '../index.html');
  res.sendFile(indexPath);
});

app.get('/about', (_, res) => res.sendFile(path.join(__dirname, '../public/pages/about.html')));
app.get('/contact', (_, res) => res.sendFile(path.join(__dirname, '../public/pages/contact.html')));
app.get('/formations', (_, res) => res.sendFile(path.join(__dirname, '../public/pages/formations.html')));
app.get('/formation', (_, res) => res.sendFile(path.join(__dirname, '../public/pages/formation.html')));
app.get('/login', (_, res) => res.sendFile(path.join(__dirname, '../public/pages/login.html')));
app.get('/admin', (_, res) => res.sendFile(path.join(__dirname, '../public/pages/admin.html')));

// ================= EMAIL SETUP =================
let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || "votre_email@gmail.com",
    pass: process.env.SMTP_PASS || "votre_password"
  }
});

app.post("/send", contactLimiter, async (req, res) => {
  const { name, email, message } = req.body;
  
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Safe Anesthesia" <no-reply@safeanesthesia.com>',
      to: process.env.ADMIN_EMAIL || "admin@safeanesthesia.com",
      subject: `📩 Nouveau message de ${name}`,
      replyTo: email,
      html: `<h2>Safe Anesthesia</h2><p><strong>De :</strong> ${name} (${email})</p><p>${message}</p>`
    });
    res.send("✅ Message envoyé avec succès !");
  } catch (error) {
    console.error("❌ Erreur SMTP :", error);
    res.status(500).send("Erreur lors de l'envoi.");
  }
});

// ================= AUTH ROUTES =================
app.post("/api/auth/login", loginLimiter, (req, res) => {
  const { password } = req.body;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: "Mot de passe incorrect" });
  }

  try {
    const token = jwt.sign({ user: "admin", iat: Date.now() }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.get("/api/auth/verify", authAdmin, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ================= DATABASE INITIALIZATION =================
let db;
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'formations.sqlite');

async function initDB() {
  if (db) return db;
  
  try {
    const SQL = await initSqlJs();
    
    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
      db.run(`
        CREATE TABLE formations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          titre TEXT,
          contenu TEXT,
          image TEXT,
          vues INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          commentaires INTEGER DEFAULT 0
        )
      `);
      saveDB();
    }
    return db;
  } catch (error) {
    console.error("❌ Erreur DB:", error);
    throw error;
  }
}

const saveDB = () => {
  try {
    if (db) {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    }
  } catch (error) {
    console.error("❌ Erreur sauvegarde DB:", error);
  }
};

// ================= FORMATIONS ROUTES =================
app.get("/api/formations", async (req, res) => {
  try {
    if (!db) await initDB();
    const result = db.exec("SELECT * FROM formations");
    const rows = result.length ? result[0].values : [];
    res.json(rows.map(r => ({
      id: r[0],
      titre: r[1],
      contenu: r[2],
      image: r[3],
      vues: r[4] || 0,
      likes: r[5] || 0,
      commentaires: r[6] || 0
    })));
  } catch (error) {
    console.error("❌ Erreur formations:", error);
    res.status(500).json({ error: "Erreur lors de la récupération" });
  }
});

app.post("/api/admin/formations", authAdmin, async (req, res) => {
  try {
    if (!db) await initDB();
    const { titre, contenu } = req.body;
    if (!titre || !contenu) {
      return res.status(400).json({ error: "Titre et contenu requis" });
    }
    db.run("INSERT INTO formations (titre, contenu) VALUES (?, ?)", [titre, contenu]);
    saveDB();
    res.json({ ok: true, message: "✅ Formation ajoutée !" });
  } catch (error) {
    console.error("❌ Erreur ajout:", error);
    res.status(500).json({ error: "Erreur lors de l'ajout" });
  }
});

app.delete("/api/admin/formations/:id", authAdmin, async (req, res) => {
  try {
    if (!db) await initDB();
    const { id } = req.params;
    db.run("DELETE FROM formations WHERE id = ?", [id]);
    saveDB();
    res.json({ ok: true, message: "✅ Supprimée !" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

app.put("/api/admin/formations/:id", authAdmin, async (req, res) => {
  try {
    if (!db) await initDB();
    const { id } = req.params;
    const { titre, contenu } = req.body;
    if (!titre || !contenu) {
      return res.status(400).json({ error: "Titre et contenu requis" });
    }
    db.run("UPDATE formations SET titre = ?, contenu = ? WHERE id = ?", [titre, contenu, id]);
    saveDB();
    res.json({ ok: true, message: "✅ Mise à jour !" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
});

// Initialize DB on startup
initDB().catch(err => console.error("Erreur init DB:", err));

// Export for Vercel
export default app;
