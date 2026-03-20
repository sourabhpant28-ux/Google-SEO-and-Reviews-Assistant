// In development Vite proxies /api → localhost:3001
// In production VITE_API_URL is set to the Railway backend URL
export const API_BASE = import.meta.env.VITE_API_URL || '';
