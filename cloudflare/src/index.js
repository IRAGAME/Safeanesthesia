// Cloudflare Worker — SafeAnesthesia API
// Environnements requis (Cloudflare Dashboard > Workers > Variables) :
//   SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET, ADMIN_PASSWORD
//   RESEND_API_KEY (optionnel, pour l'envoi d'email)
//   CONTACT_EMAIL (destination du formulaire de contact)

const ALLOWED_ORIGINS = [
  "https://safe-anesthesia.vercel.app",
  "https://safeanesthesia.onrender.com",
  "http://localhost:3000",
];

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

// requestRef is set at the top of each fetch() call so json() can access it
let requestRef = null;

function getCorsHeaders() {
  const origin = requestRef ? requestRef.headers.get("Origin") : null;
  const cors = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    cors["Access-Control-Allow-Origin"] = origin;
  } else {
    cors["Access-Control-Allow-Origin"] = "null";
  }
  return cors;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...SECURITY_HEADERS, ...getCorsHeaders() },
  });
}

function corsPreflight() {
  return new Response(null, { status: 204, headers: { ...SECURITY_HEADERS, ...getCorsHeaders() } });
}

// ─── JWT ─────────────────────────────────────────────────────────────────
function base64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

async function signJwt(payload, secret, expiresInSec = 86400) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSec };
  const enc = new TextEncoder();
  const data = enc.encode(
    base64url(enc.encode(JSON.stringify(header))) +
      "." +
      base64url(enc.encode(JSON.stringify(fullPayload)))
  );
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return (
    base64url(enc.encode(JSON.stringify(header))) +
    "." +
    base64url(enc.encode(JSON.stringify(fullPayload))) +
    "." +
    base64url(sig)
  );
}

async function verifyJwt(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const enc = new TextEncoder();
  const data = enc.encode(parts[0] + "." + parts[1]);
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const valid = await crypto.subtle.verify("HMAC", key, base64urlDecode(parts[2]), data);
  if (!valid) return null;
  const payload = JSON.parse(
    new TextDecoder().decode(base64urlDecode(parts[1]))
  );
  if (payload.exp && Date.now() / 1000 > payload.exp) return null;
  return payload;
}

function getToken(request) {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

async function authGuard(request, env) {
  const token = getToken(request);
  if (!token) return json({ message: "Token manquant" }, 401);
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload) return json({ message: "Token invalide ou expiré" }, 403);
  return payload;
}

// ─── SUPABASE (via REST) ──────────────────────────────────────────────────
function supabase(env) {
  const headers = {
    "Content-Type": "application/json",
    apikey: env.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
    Prefer: "return=representation",
  };
  return {
    async query(method, path, body) {
      const url = `${env.SUPABASE_URL}${path}`;
      const opts = { method, headers };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(url, opts);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error?.message || "Supabase error");
      return data;
    },
    getFormations() {
      return this.query("GET", "/rest/v1/formations?select=*&order=id.desc");
    },
    getFormation(id) {
      const safeId = encodeURIComponent(String(id));
      return this.query("GET", `/rest/v1/formations?select=*&id=eq.${safeId}&limit=1`).then(
        (d) => d[0] || null
      );
    },
    createFormation({ titre, contenu, image }) {
      return this.query("POST", "/rest/v1/formations", { titre, contenu, image });
    },
    updateFormation(id, { titre, contenu, image }) {
      const safeId = encodeURIComponent(String(id));
      const updates = { titre, contenu, updatedAt: new Date().toISOString() };
      if (image !== undefined) updates.image = image;
      return this.query("PATCH", `/rest/v1/formations?id=eq.${safeId}`, updates);
    },
    deleteFormation(id) {
      const safeId = encodeURIComponent(String(id));
      return this.query("DELETE", `/rest/v1/formations?id=eq.${safeId}`);
    },
    getPublicUrl(path) {
      return `${env.SUPABASE_URL}/storage/v1/object/public/${path}`;
    },
    async uploadImage(fileName, buffer, contentType) {
      const url = `${env.SUPABASE_URL}/storage/v1/object/formations/${fileName}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
          "Content-Type": contentType,
          "x-upsert": "false",
        },
        body: buffer,
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Upload failed: ${err}`);
      }
      return this.getPublicUrl(`formations/${fileName}`);
    },
    async deleteImage(imageUrl) {
      if (!imageUrl) return;
      const fileName = imageUrl.split("/").pop();
      const url = `${env.SUPABASE_URL}/storage/v1/object/formations/${fileName}`;
      await fetch(url, {
        method: "DELETE",
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        },
      });
    },
  };
}

// ─── EMAIL ─────────────────────────────────────────────────────────────────
async function sendEmail(env, { name, email, message }) {
  if (!env.RESEND_API_KEY) return;
  const safe = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = `
    <h2>Nouveau message de contact</h2>
    <p><strong>Nom:</strong> ${safe(name)}</p>
    <p><strong>Email:</strong> ${safe(email)}</p>
    <p><strong>Message:</strong></p>
    <p>${safe(message).replace(/\n/g, "<br>")}</p>
  `;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "contact@votre-domaine.com",
      to: env.CONTACT_EMAIL || env.ADMIN_EMAIL,
      reply_to: email,
      subject: `[Contact] ${name}`,
      html,
    }),
  });
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_IMAGE_EXT = /\.(jpe?g|png|webp)$/i;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function validateImageFile(file) {
  if (!file) return null;
  if (file.buffer.byteLength > MAX_FILE_SIZE) {
    return "L'image ne doit pas dépasser 5 Mo.";
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Seules les images (jpg, png, webp) sont autorisées.";
  }
  if (!ALLOWED_IMAGE_EXT.test(file.name)) {
    return "Extension de fichier non autorisée.";
  }
  return null;
}

// ─── FORM DATA PARSER (multipart, fichiers) ───────────────────────────────
async function parseFormData(request) {
  const formData = await request.formData();
  const fields = {};
  let file = null;
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      file = {
        name: value.name,
        type: value.type,
        buffer: await value.arrayBuffer(),
        stream: value.stream(),
      };
    } else {
      fields[key] = value;
    }
  }
  return { fields, file };
}

// ─── RATE LIMITER (simple in-memory) ──────────────────────────────────────
const rateMap = new Map();
function rateLimit(key, max = 5, windowMs = 60000) {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now - entry.start > windowMs) {
    rateMap.set(key, { start: now, count: 1 });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// ─── ROUTER ────────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    requestRef = request;
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS preflight
    if (method === "OPTIONS") return corsPreflight();

    try {
      // ── Health ───────────────────────────────────────
      if (method === "GET" && path === "/api/health") {
        return json({ status: "ok" });
      }

      // ── Formations (public) ──────────────────────────
      if (method === "GET" && path === "/api/formations") {
        const db = supabase(env);
        const formations = await db.getFormations();
        return json(formations);
      }

      if (method === "GET" && path.startsWith("/api/formations/")) {
        const id = path.split("/").pop();
        if (!/^\d+$/.test(id)) return json({ error: "ID invalide" }, 400);
        const db = supabase(env);
        const formation = await db.getFormation(id);
        if (!formation) return json({ error: "Formation introuvable" }, 404);
        return json(formation);
      }

      // ── Admin : Créer une formation ──────────────────
      if (method === "POST" && path === "/api/admin/formations") {
        const auth = await authGuard(request, env);
        if (auth.status) return auth;

        const { fields, file } = await parseFormData(request);
        if (!fields.titre || !fields.titre.trim())
          return json({ error: "Titre requis" }, 400);
        if (fields.titre.trim().length > 200)
          return json({ error: "Le titre ne doit pas dépasser 200 caractères" }, 400);
        if (!fields.contenu || !fields.contenu.trim())
          return json({ error: "Contenu requis" }, 400);
        if (fields.contenu.trim().length > 10000)
          return json({ error: "Le contenu ne doit pas dépasser 10000 caractères" }, 400);

        const fileError = validateImageFile(file);
        if (fileError) return json({ error: fileError }, 400);

        const db = supabase(env);
        let imageUrl = null;
        if (file) {
          const ext = file.name.split(".").pop();
          const fileName = `${Date.now()}.${ext}`;
          imageUrl = await db.uploadImage(fileName, file.buffer, file.type);
        }

        const formation = await db.createFormation({
          titre: fields.titre.trim(),
          contenu: fields.contenu.trim(),
          image: imageUrl,
        });

        return json({ ok: true, formation }, 201);
      }

      // ── Admin : Modifier une formation ──────────────
      if (method === "PUT" && path.startsWith("/api/admin/formations/")) {
        const auth = await authGuard(request, env);
        if (auth.status) return auth;

        const id = path.split("/").pop();
        if (!/^\d+$/.test(id)) return json({ error: "ID invalide" }, 400);
        const { fields, file } = await parseFormData(request);
        if (!fields.titre || !fields.titre.trim())
          return json({ error: "Titre requis" }, 400);
        if (fields.titre.trim().length > 200)
          return json({ error: "Le titre ne doit pas dépasser 200 caractères" }, 400);
        if (!fields.contenu || !fields.contenu.trim())
          return json({ error: "Contenu requis" }, 400);
        if (fields.contenu.trim().length > 10000)
          return json({ error: "Le contenu ne doit pas dépasser 10000 caractères" }, 400);

        const fileError = validateImageFile(file);
        if (fileError) return json({ error: fileError }, 400);

        const db = supabase(env);
        const existing = await db.getFormation(id);
        if (!existing) return json({ error: "Formation introuvable" }, 404);

        let imageUrl = existing.image;
        if (file) {
          if (existing.image) await db.deleteImage(existing.image);
          const ext = file.name.split(".").pop();
          const fileName = `${Date.now()}.${ext}`;
          imageUrl = await db.uploadImage(fileName, file.buffer, file.type);
        }

        await db.updateFormation(id, {
          titre: fields.titre.trim(),
          contenu: fields.contenu.trim(),
          image: imageUrl,
        });

        return json({ ok: true, message: "Formation mise à jour" });
      }

      // ── Admin : Supprimer une formation ──────────────
      if (method === "DELETE" && path.startsWith("/api/admin/formations/")) {
        const auth = await authGuard(request, env);
        if (auth.status) return auth;

        const id = path.split("/").pop();
        if (!/^\d+$/.test(id)) return json({ error: "ID invalide" }, 400);
        const db = supabase(env);
        const existing = await db.getFormation(id);
        if (!existing) return json({ error: "Formation introuvable" }, 404);

        if (existing.image) await db.deleteImage(existing.image);
        await db.deleteFormation(id);

        return json({ ok: true, message: "Formation supprimée", id: parseInt(id) });
      }

      // ── Auth : Login ────────────────────────────────
      if (method === "POST" && path === "/api/auth/login") {
        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        if (!rateLimit(`login:${ip}`, 5, 15 * 60 * 1000)) {
          return json({ error: "Trop de tentatives, réessayez dans 15 minutes." }, 429);
        }
        const { password } = await request.json();
        if (!password || password !== env.ADMIN_PASSWORD) {
          return json({ message: "Mot de passe incorrect" }, 401);
        }
        const token = await signJwt({ user: "admin" }, env.JWT_SECRET, 86400);
        return json({ token });
      }

      // ── Auth : Verify ────────────────────────────────
      if (method === "GET" && path === "/api/auth/verify") {
        const auth = await authGuard(request, env);
        if (auth.status) return auth;
        return json({ valid: true, user: auth });
      }

      // ── Auth : Logout ────────────────────────────────
      if (method === "POST" && path === "/api/auth/logout") {
        const auth = await authGuard(request, env);
        if (auth.status) return auth;
        return json({ message: "Déconnecté avec succès" });
      }

      // ── Contact ──────────────────────────────────────
      if (method === "POST" && path === "/send") {
        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        if (!rateLimit(`contact:${ip}`, 5, 60000)) {
          return json({ error: "Trop de tentatives, réessayez dans 1 minute." }, 429);
        }
        const { name, email, message } = await request.json();
        if (!name || !email || !message) {
          return json({ error: "Tous les champs sont requis" }, 400);
        }
        if (name.trim().length > 100)
          return json({ error: "Le nom ne doit pas dépasser 100 caractères" }, 400);
        if (email.trim().length > 200)
          return json({ error: "L'email ne doit pas dépasser 200 caractères" }, 400);
        if (message.trim().length > 5000)
          return json({ error: "Le message ne doit pas dépasser 5000 caractères" }, 400);
        try {
          await sendEmail(env, { name, email, message });
        } catch (e) {
          console.warn("Email non envoyé:", e.message);
        }
        return json({ ok: true, message: "Message reçu! Nous vous répondrons bientôt." });
      }

      // ── 404 ──────────────────────────────────────────
      return json({ error: "Route non trouvée" }, 404);
    } catch (err) {
      console.error("Erreur:", err.message);
      return json({ error: err.message || "Erreur serveur interne" }, 500);
    }
  },
};
