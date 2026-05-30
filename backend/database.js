import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'formations.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SQL = await initSqlJs();

let db;
if (fs.existsSync(DB_PATH)) {
  const buffer = fs.readFileSync(DB_PATH);
  db = new SQL.Database(buffer);
} else {
  db = new SQL.Database();
}

function save() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

db.run(`
  CREATE TABLE IF NOT EXISTS formations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT NOT NULL,
    contenu TEXT NOT NULL,
    image TEXT,
    vues INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    commentaires INTEGER DEFAULT 0,
    createdAt TEXT,
    updatedAt TEXT
  )
`);
save();

const JSON_PATH = path.join(DATA_DIR, 'formations.json');
const count = db.exec('SELECT COUNT(*) AS c FROM formations');
const rowCount = count[0].values[0][0];

if (rowCount === 0 && fs.existsSync(JSON_PATH)) {
  try {
    const jsonData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    if (jsonData.formations && jsonData.formations.length > 0) {
      for (const f of jsonData.formations) {
        db.run(
          `INSERT INTO formations (id, titre, contenu, image, vues, likes, commentaires, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            f.id,
            f.titre,
            f.contenu,
            f.image || null,
            f.vues || 0,
            f.likes || 0,
            f.commentaires || 0,
            f.createdAt || new Date().toISOString(),
            f.updatedAt || null
          ]
        );
      }
      const maxId = Math.max(...jsonData.formations.map(f => f.id));
      db.run('UPDATE sqlite_sequence SET seq = ? WHERE name = ?', [maxId, 'formations']);
      save();
      console.log(`✅ Migrated ${jsonData.formations.length} formations from JSON to SQLite`);
    }
  } catch (e) {
    console.warn('⚠️ Could not migrate JSON data:', e.message);
  }
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  return stmt;
}

const database = {
  db,

  all(sql, params = []) {
    const stmt = query(sql, params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },

  get(sql, params = []) {
    const stmt = query(sql, params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },

  run(sql, params = []) {
    db.run(sql, params);
    save();
  },

  insert(sql, params = []) {
    db.run(sql, params);
    const result = db.exec('SELECT last_insert_rowid() AS id');
    save();
    return Number(result[0].values[0][0]);
  },

  save
};

export default database;
