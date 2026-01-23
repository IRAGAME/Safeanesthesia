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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(bodyParser.json());

// ------------------- Nodemailer -------------------
app.post("/send", async (req, res) => {
  const { name, email, message } = req.body;
  console.log("Données reçues :", name, email, message);

  let transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "f1bc2894373bd7",
      pass: "023970508c182d"
    }
  });

  let mailOptions = {
    from: `"Safe Anesthesia" <${email}>`,
    to: "iragimargos@gmail.com",
    subject: "Nouveau message depuis le site",
    text: `Nom: ${name}\nEmail: ${email}\nMessage:\n${message}`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.send("✅ Message envoyé avec succès !");
  } catch (error) {
    console.error("Erreur Nodemailer :", error);
    res.status(500).send("❌ Erreur lors de l'envoi du message.");
  }
});

// ------------------- Auth Middleware -------------------
function auth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ message: "Token manquant" });

  const token = header.split(" ")[1];
  try {
    jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token invalide" });
  }
}

// ------------------- Sécurité -------------------
app.use(helmet({ contentSecurityPolicy: false }));
app.disable("x-powered-by");

const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { ok: false, error: "Trop de tentatives, réessayez dans un instant." },
});

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// ------------------- Routes HTML -------------------
app.get("/", (_, res) => res.sendFile(path.join(__dirname, "public/index.html")));
app.get("/about", (_, res) => res.sendFile(path.join(__dirname, "public/about.html")));
app.get("/contact", (_, res) => res.sendFile(path.join(__dirname, "public/contact.html")));

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
})();

function saveDB() {
  const data = db.export();
  fs.writeFileSync("formations.sqlite", Buffer.from(data));
}

// ------------------- Routes Formations -------------------
// ➕ Ajouter une formation (sans image)
app.post("/formations", (req, res) => {
  const { titre, contenu, image } = req.body;
  db.run("INSERT INTO formations (titre, contenu, image) VALUES (?, ?, ?)", [titre, contenu, image]);
  saveDB();
  res.send("✅ Formation ajoutée !");
});

// ➕ Ajouter une formation avec image
app.post("/admin/formations", upload.single("image"), (req, res) => {
  const { titre, contenu } = req.body;
  const imagePath = req.file ? `/images/ImageFormation/${req.file.filename}` : null;

  db.run("INSERT INTO formations (titre, contenu, image) VALUES (?, ?, ?)", [titre, contenu, imagePath]);
  saveDB();
  res.send("✅ Formation ajoutée !");
});

// 📖 Afficher toutes les formations
app.get("/formations", (req, res) => {
  const result = db.exec("SELECT * FROM formations");
  const rows = result.length ? result[0].values : [];
  res.json(rows.map(r => ({
    id: r[0],
    titre: r[1],
    contenu: r[2],
    image: r[3]
  })));
});

// 📖 Afficher une formation par ID
app.get("/formations/:id", (req, res) => {
  const { id } = req.params;
  const result = db.exec("SELECT * FROM formations WHERE id = ?", [id]);
  if (!result.length) return res.status(404).json({ error: "Formation introuvable" });
  const r = result[0].values[0];
  res.json({ id: r[0], titre: r[1], contenu: r[2], image: r[3] });
});

// ✏️ Modifier une formation
app.put("/formations/:id", (req, res) => {
  const { id } = req.params;
  const { titre, contenu, image } = req.body;
  db.run("UPDATE formations SET titre = ?, contenu = ?, image = ? WHERE id = ?", [titre, contenu, image, id]);
  saveDB();
  res.send("✅ Formation mise à jour !");
});

// ❌ Supprimer une formation
app.delete("/formations/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM formations WHERE id = ?", [id]);
  saveDB();
  res.send("✅ Formation supprimée !");
});

// ------------------- Port -------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
