// Server-only — NEVER imported from client. Holds admin password constant.
// To rotate: set ADMIN_PASSWORD env var; falls back to baked-in default below.
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "220028";

export const ADMIN_SESSION_CONFIG = {
  password: process.env.ADMIN_SESSION_SECRET ||
    "lumiere-admin-session-secret-please-rotate-min-32-chars-ok",
  name: "lumiere_admin",
  maxAge: 60 * 60 * 24 * 7, // 7 days
  cookie: {
    httpOnly: true,
    sameSite: "none" as const,
    secure: true,
    path: "/",
  },
};
