import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORAGE_TYPE = process.env.STORAGE_TYPE || "local";
const EXTERNAL_BASE_URL = process.env.STORAGE_EXTERNAL_URL || "";

const LOCAL_UPLOAD_DIR = path.join(__dirname, "public/images/ImageFormation");

function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }
}

export const imageStorage = {
  getUploadDir() {
    if (STORAGE_TYPE === "external") {
      return null;
    }
    ensureLocalDir();
    return LOCAL_UPLOAD_DIR;
  },

  getPublicUrl(filename) {
    if (STORAGE_TYPE === "external" && EXTERNAL_BASE_URL) {
      return `${EXTERNAL_BASE_URL}/${filename}`;
    }
    return `/images/ImageFormation/${filename}`;
  },

  deleteImage(imagePath) {
    if (STORAGE_TYPE === "external") return true;
    const fullPath = path.join(__dirname, "public", imagePath);
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      return true;
    } catch {
      return false;
    }
  }
};
