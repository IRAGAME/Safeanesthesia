const API_BASE = "https://safeanesthesia.onrender.com";

function imageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return API_BASE + path;
}
