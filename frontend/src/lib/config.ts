// API Configuration
// Support for runtime config injection via window.__VITE_API_URL__ (injected by docker-entrypoint.sh)
const runtimeApiUrl = (globalThis as any).__VITE_API_URL__;
export const API_BASE_URL = runtimeApiUrl || import.meta.env.VITE_API_URL || 'http://localhost:3000';