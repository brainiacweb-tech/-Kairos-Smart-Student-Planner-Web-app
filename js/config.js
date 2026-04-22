/* ===========================
   API CONFIGURATION
   - Production (same host): /api
   - Local development:      http://localhost:5000/api
   =========================== */

const KAIROS_API_BASE = (() => {
  const host = window.location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  return isLocal ? 'http://localhost:5000/api' : '/api';
})();
