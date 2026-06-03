const API_BASE = "https://safeanesthesia-api.iragimargos.workers.dev";

function imageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return API_BASE + path;
}
