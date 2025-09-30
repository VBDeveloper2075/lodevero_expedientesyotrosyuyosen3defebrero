// Configuración de la API
const API_URL = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_API_URL || 'https://jpverito-production.up.railway.app/api'  // URL REAL de Railway
  : 'http://localhost:5000/api';

export default API_URL;
