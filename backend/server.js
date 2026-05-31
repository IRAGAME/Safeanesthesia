import express from "express";
import dotenv from "dotenv";
import { createCorsMiddleware } from "./cors.js";
import { imageStorage } from "./storage.js";
import { getFormations, getFormation, createFormation, updateFormation, deleteFormation } from "./supabase.js";

import jwt from "jsonwebtoken";
import multer from "multer";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "your_secret_key") {
  console.error("Erreur: JWT_SECRET n'est pas configuré ou est trop faible. Le serveur s'arrête.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.disable("x-powered-by");

app.use(createCorsMiddleware());

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const mimeType = allowedTypes.test(file.mimetype);
    const extName = allowedTypes.test('.' + file.originalname.split('.').pop().toLowerCase());
    if (mimeType && extName) return cb(null, true);
    cb(new Error("Seules les images (jpg, png, webp) sont autorisées"));
  }
});

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
    console.error("Erreur token:", error.message);
    return res.status(403).json({ message: "Token invalide ou expiré" });
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "ssl0.ovh.net",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || ""
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/formations", async (req, res) => {
  try {
    const formations = await getFormations();
    res.json(formations);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/api/formations/:id", async (req, res) => {
  try {
    const formation = await getFormation(req.params.id);
    if (!formation) {
      return res.status(404).json({ error: "Formation introuvable" });
    }
    res.json(formation);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/admin/formations", authAdmin, upload.single("image"), async (req, res) => {
  try {
    const { titre, contenu } = req.body;

    if (!titre || !titre.trim()) {
      return res.status(400).json({ error: "Titre requis" });
    }
    if (!contenu || !contenu.trim()) {
      return res.status(400).json({ error: "Contenu requis" });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = await imageStorage.upload(req.file);
    }

    const newFormation = await createFormation({
      titre: titre.trim(),
      contenu: contenu.trim(),
      image: imageUrl
    });

    res.status(201).json({ ok: true, formation: newFormation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Erreur lors de l'ajout de la formation" });
  }
});

app.put("/api/admin/formations/:id", authAdmin, upload.single("image"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { titre, contenu } = req.body;

    if (!titre || !titre.trim()) {
      return res.status(400).json({ error: "Titre requis" });
    }
    if (!contenu || !contenu.trim()) {
      return res.status(400).json({ error: "Contenu requis" });
    }

    const existing = await getFormation(id);
    if (!existing) {
      return res.status(404).json({ error: "Formation introuvable" });
    }

    let imageUrl = existing.image;
    if (req.file) {
      if (existing.image) {
        await imageStorage.delete(existing.image);
      }
      imageUrl = await imageStorage.upload(req.file);
    }

    const updated = await updateFormation(id, {
      titre: titre.trim(),
      contenu: contenu.trim(),
      image: imageUrl
    });

    res.json({ ok: true, formation: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Erreur lors de la mise à jour" });
  }
});

app.delete("/api/admin/formations/:id", authAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const formation = await getFormation(id);
    if (!formation) {
      return res.status(404).json({ error: "Formation introuvable" });
    }

    if (formation.image) {
      await imageStorage.delete(formation.image);
    }

    await deleteFormation(id);
    res.json({ ok: true, message: "Formation supprimée", id });
  } catch (error) {
    console.error("Erreur DELETE /api/admin/formations/:id:", error.message);
    res.status(500).json({ error: error.message || "Erreur lors de la suppression" });
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
    console.error("Erreur POST /api/auth/login:", error.message);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});

app.get("/api/auth/verify", authAdmin, (req, res) => {
  res.json({ valid: true, user: req.user });
});

app.post("/api/auth/logout", authAdmin, (req, res) => {
  res.json({ message: "Déconnecté avec succès" });
});

app.post("/send", contactLimiter, async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    const safeMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER || "contact@safeanesthesia.fr",
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
      console.warn("Email non envoyé:", emailError.message);
    }

    res.json({ ok: true, message: "Message reçu! Nous vous répondrons bientôt." });
  } catch (error) {
    console.error("Erreur POST /send:", error.message);
    res.status(500).json({ error: error.message || "Erreur lors de l'envoi" });
  }
});

app.use((err, req, res, next) => {
  console.error("Erreur serveur:", err.message);
  res.status(500).json({ error: err.message || "Erreur serveur interne" });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route non trouvée" });
});

if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\nSafeAnesthesia Server`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Database: Supabase`);
    console.log(`Storage: Supabase`);
    console.log(`JWT: ${process.env.JWT_SECRET ? 'Configure' : 'Par defaut'}`);
    console.log(`Email: ${process.env.SMTP_USER ? 'Configure' : 'Desactive'}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  });
}

export default app;
