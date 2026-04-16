import multer from "multer"; 
import path from "path";
import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import initSqlJs from "sql.js";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Charger les variables d'environnement dès le début
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static("public"));

// ------------------- Sécurité -------------------
app.use(helmet({ contentSecurityPolicy: false }));
app.disable("x-powered-by");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: { error: "Trop de tentatives, réessayez dans 15 minutes." },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { ok: false, error: "Trop de tentatives, réessayez dans un instant." },
});

app.use(express.urlencoded({ extended: true }));

// ================= AUTHENTIFICATION MIDDLEWARE =================

/**
 * Middleware pour vérifier le token JWT admin
 */
function authAdmin(req, res, next) {
  const header = req.headers["authorization"];
  
  if (!header) {
    return res.status(401).json({ message: "Token manquant" });
  }

  const token = header.split(" ")[1];
  
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token invalide ou expiré" });
  }
}

//Configurer le transporteur SMTP
let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER || "votre_email@gmail.com",
    pass: process.env.SMTP_PASS || "votre_password"
  }
});

// 📩 Route pour envoyer un email (contact public)
app.post("/send", contactLimiter, async (req, res) => {
  const { name, email, message, messageDeReponse } = req.body;

  // Notification interne (vers l'admin)
  let mailOptions = {
    from: process.env.SMTP_FROM || '"Safe Anesthesia" <no-reply@safeanesthesia.com>',
    to: process.env.ADMIN_EMAIL || "admin@safeanesthesia.com",
    subject: `📩 Nouveau message de ${name}`,
    replyTo: email,
    html: `
      <h2 style="color:#3498db;">Safe Anesthesia</h2>
      <p><strong>Nom :</strong> ${name}</p>
      <p><strong>Email :</strong> ${email}</p>
      <p><strong>Message :</strong></p>
      <blockquote style="border-left:4px solid #3498db; padding-left:10px;">${message}</blockquote>
    `
  };

  // Réponse vers l’utilisateur
  let replyOptions = {
    from: '"Safe Anesthesia" <support@safeanesthesia.com>',
    to: email,
    subject: "✅ Réponse de Safe Anesthesia",
    html: `
      <h2 style="color:#2c3e50;">Safe Anesthesia</h2>
      <p>Bonjour <strong>${name}</strong>,</p>
      <p>Merci de nous avoir contactés. Voici notre réponse :</p>
      <blockquote style="border-left:4px solid #2c3e50; padding-left:10px;">
        ${messageDeReponse || "Nous avons bien reçu votre demande et nous vous répondrons sous peu."}
      </blockquote>
      <p style="margin-top:20px;">Nous restons disponibles pour toute autre question.</p>
      <hr>
      <p style="font-size:12px; color:#888;">Safe Anesthesia © 2026 — support@safeanesthesia.com</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);   // vers toi
    await transporter.sendMail(replyOptions);  // vers l’utilisateur
    res.send("✅ Message et réponse envoyés avec succès !");
  } catch (error) {
    console.error("❌ Erreur SMTP :", error);
    res.status(500).send("Erreur lors de l'envoi des emails.");
  }
});




// ------------------- Login Route -------------------
app.post("/api/auth/login", loginLimiter, (req, res) => {
  const { password } = req.body;

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    console.warn("Tentative de connexion avec mot de passe incorrect");
    return res.status(401).json({ message: "Mot de passe incorrect" });
  }

  try {
    const token = jwt.sign({ user: "admin", iat: Date.now() }, process.env.JWT_SECRET);
    console.log("Admin connecté avec succès");
    res.json({ token });
  } catch (error) {
    console.error("Erreur lors de la génération du token:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.get("/api/auth/verify", authAdmin, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.post("/api/auth/logout", authAdmin, (req, res) => {
  console.log("Admin déconnecté");
  res.json({ message: "Déconnecté avec succès" });
});

// ------------------- Routes HTML -------------------
app.get("/", (_, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/about", (_, res) => res.sendFile(path.join(__dirname, "public/pages/about.html")));
app.get("/contact", (_, res) => res.sendFile(path.join(__dirname, "public/pages/contact.html")));
app.get("/formations", (_, res) => res.sendFile(path.join(__dirname, "public/pages/formations.html")));
app.get("/formation", (_, res) => res.sendFile(path.join(__dirname, "public/pages/formation.html")));

// Route LOGIN (page publique)
app.get("/login", (_, res) => res.sendFile(path.join(__dirname, "public/pages/login.html")));

// Route ADMIN (protégée côté serveur) - redirection automatique côté client
app.get("/admin", (_, res) => res.sendFile(path.join(__dirname, "public/pages/admin.html")));

// ------------------- Multer Config -------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "public/images/ImageFormation")),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Servir les images
app.use("/images/ImageFormation", express.static(path.join(__dirname, "public/images/ImageFormation")));

// ------------------- DB SQLite -------------------
let db;

// Fonction pour sauvegarder la DB en fichier
const saveDB = () => {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync("formations.sqlite", buffer);
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde BD:", error);
  }
};

(async () => {
  const SQL = await initSqlJs();
  if (fs.existsSync("formations.sqlite")) {
    const fileBuffer = fs.readFileSync("formations.sqlite");
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
    // Add columns if upgrading from old schema
    try {
      db.run("ALTER TABLE formations ADD COLUMN vues INTEGER DEFAULT 0");
    } catch (e) {}
    try {
      db.run("ALTER TABLE formations ADD COLUMN likes INTEGER DEFAULT 0");
    } catch (e) {}
    try {
      db.run("ALTER TABLE formations ADD COLUMN commentaires INTEGER DEFAULT 0");
    } catch (e) {}
    saveDB();
  }

  // ------------------- Routes Formations -------------------
//  Ajouter une formation (sans image)
app.post("/api/formations", (req, res) => {
  try {
    const { titre, contenu, image } = req.body;
    if (!titre || !contenu) {
      return res.status(400).json({ error: "Titre et contenu requis" });
    }
    db.run("INSERT INTO formations (titre, contenu, image) VALUES (?, ?, ?)", [titre, contenu, image || null]);
    saveDB();
    res.json({ ok: true, message: "✅ Formation ajoutée !" });
  } catch (error) {
    console.error("❌ Erreur ajout formation:", error);
    res.status(500).json({ error: "Erreur lors de l'ajout de la formation" });
  }
});

//  Ajouter une formation avec image
app.post("/api/admin/formations", authAdmin, upload.single("image"), (req, res) => {
  try {
    const { titre, contenu } = req.body;
    if (!titre || !contenu) {
      return res.status(400).json({ error: "Titre et contenu requis" });
    }
    const imagePath = req.file ? `/images/ImageFormation/${req.file.filename}` : null;
    db.run("INSERT INTO formations (titre, contenu, image) VALUES (?, ?, ?)", [titre, contenu, imagePath]);
    saveDB();
    res.json({ ok: true, message: "✅ Formation ajoutée !" });
  } catch (error) {
    console.error("❌ Erreur ajout formation:", error);
    res.status(500).json({ error: "Erreur lors de l'ajout de la formation" });
  }
});

//  Afficher toutes les formations
app.get("/api/formations", (req, res) => {
  try {
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
    console.error("❌ Erreur récupération formations:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des formations" });
  }
});

//  Afficher une formation par ID
app.get("/api/formations/:id", (req, res) => {
  try {
    const { id } = req.params;
    const result = db.exec("SELECT * FROM formations WHERE id = ?", [id]);
    if (!result.length || !result[0].values.length) {
      return res.status(404).json({ error: "Formation introuvable" });
    }
    const r = result[0].values[0];
    res.json({ id: r[0], titre: r[1], contenu: r[2], image: r[3], vues: r[4] || 0, likes: r[5] || 0, commentaires: r[6] || 0 });
  } catch (error) {
    console.error("❌ Erreur récupération formation:", error);
    res.status(500).json({ error: "Erreur lors de la récupération de la formation" });
  }
});

//  Modifier une formation
app.put("/api/admin/formations/:id", authAdmin, upload.single("image"), (req, res) => {
  try {
    const { id } = req.params;
    const { titre, contenu } = req.body;
    if (!titre || !contenu) {
      return res.status(400).json({ error: "Titre et contenu requis" });
    }
    const imagePath = req.file ? `/images/ImageFormation/${req.file.filename}` : null;

    // If image provided, update it, else keep old
    if (imagePath) {
      db.run("UPDATE formations SET titre = ?, contenu = ?, image = ? WHERE id = ?", [titre, contenu, imagePath, id]);
    } else {
      db.run("UPDATE formations SET titre = ?, contenu = ? WHERE id = ?", [titre, contenu, id]);
    }
    saveDB();
    res.json({ ok: true, message: "✅ Formation mise à jour !" });
  } catch (error) {
    console.error("❌ Erreur modification formation:", error);
    res.status(500).json({ error: "Erreur lors de la modification" });
  }
});

//  Supprimer une formation
app.delete("/api/admin/formations/:id", authAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.run("DELETE FROM formations WHERE id = ?", [id]);
    saveDB();
    res.json({ ok: true, message: "✅ Formation supprimée !" });
  } catch (error) {
    console.error("❌ Erreur suppression formation:", error);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

// ------------------- Port -------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
})();
