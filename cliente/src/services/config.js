// Configuración de la API
// En producción, debes definir REACT_APP_API_URL en el entorno de Vercel (Frontend)
// En desarrollo, si no está definida, usamos http://localhost:5000/api
const rawUrl = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_API_URL
  : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');

// Sanitizar posibles espacios/saltos de línea y quitar barra final duplicada
const API_URL = (rawUrl || '')
  .trim()               // elimina espacios y saltos de línea accidentales
  .replace(/\s+/g, '') // elimina cualquier whitespace restante en medio
  .replace(/\/$/, ''); // quita barra final

if (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_API_URL) {
  // Aviso en build si faltan variables obligatorias
  // (No rompe la app, pero clarifica el error de configuración)
  // eslint-disable-next-line no-console
  console.warn('[Config] REACT_APP_API_URL no está definida en producción. Configúrala en Vercel.');
}

export default API_URL;
