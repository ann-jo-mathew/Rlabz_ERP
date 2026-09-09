/**
 * Centralized API & Storage Configuration for RLABZ ERP
 * Automatically adapts between local development and production deployment.
 */

// Determine if we are running in local dev mode (e.g. Vite on localhost / 127.0.0.1 with port)
const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Port 5173 / custom Vite dev port
const isDevPort = typeof window !== 'undefined' && 
  window.location.port !== '' && 
  window.location.port !== '80' && 
  window.location.port !== '443';

/**
 * Base API URL:
 * 1. If VITE_API_URL environment variable is provided, use it.
 * 2. If running locally with Vite dev server on a dev port, direct to http://127.0.0.1:8000/api
 * 3. In production (AWS EC2, Nginx, or single-host), use relative '/api'
 */
export const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : (isLocal && isDevPort)
    ? 'http://127.0.0.1:8000/api'
    : '/api';

/**
 * Base Storage URL (for uploaded files, certificates, avatars, PDFs):
 */
export const STORAGE_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/storage`
  : (isLocal && isDevPort)
    ? 'http://127.0.0.1:8000/storage'
    : '/storage';

export default {
  API_BASE,
  STORAGE_BASE
};
