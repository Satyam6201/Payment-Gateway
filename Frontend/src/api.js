const rawApiUrl = import.meta.env.VITE_API_URL || 'https://payment-gateway-7b2y.onrender.com'
export const API_URL = rawApiUrl.replace(/\/$/, '')
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'satyam@gmail.com'