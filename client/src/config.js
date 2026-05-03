// Use VITE_API_URL if defined (production via render), else default to local backend
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const NOTIFICATION_SERVER_URL = import.meta.env.VITE_NSE_PROXY_URL || 'http://localhost:3001';
