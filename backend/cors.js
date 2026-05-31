import cors from "cors";

export function createCorsMiddleware() {
  const allowedOrigins = [
    "https://safe-anesthesia.vercel.app",
    "https://safeanesthesia.onrender.com",
    /^https:\/\/.*--safe-anesthesia\.vercel\.app$/,
    /^https:\/\/.*\.vercel\.app$/,
  ];

  return cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = allowedOrigins.some((rule) => {
        if (rule instanceof RegExp) return rule.test(origin);
        return rule === origin;
      });
      if (allowed) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  });
}
