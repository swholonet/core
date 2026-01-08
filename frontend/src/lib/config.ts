// API Configuration
// In production, Caddy reverse-proxies /api/* to the backend
// In development, Vite proxy handles it (see vite.config.ts)
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';