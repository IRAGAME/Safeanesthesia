import cors from "cors";

export function createCorsMiddleware() {
  const allowedOrigin = "https://safe-anesthesia.vercel.app";

  return cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow same-origin / non-browser requests
      if (origin === allowedOrigin) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  });
}

