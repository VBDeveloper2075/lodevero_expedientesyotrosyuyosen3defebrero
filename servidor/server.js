const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const { verifyToken } = require('./auth/middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración CORS flexible: acepta FRONTEND_URL o CORS_ORIGIN (lista separada por comas)
function buildAllowedOrigins() {
  const isProd = process.env.NODE_ENV === 'production';
  const envOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  if (!isProd) {
    // Siempre incluir orígenes locales en desarrollo
    envOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
  }

  // Quitar duplicados
  return [...new Set(envOrigins)];
}

const allowedOrigins = buildAllowedOrigins();

const corsOptions = {
  origin: (origin, callback) => {
    // Permitir herramientas sin origin (curl/postman) y orígenes válidos
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origen no permitido por CORS: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

console.log('🌐 CORS orígenes permitidos:', allowedOrigins.length ? allowedOrigins : '[todos]');

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rutas públicas de autenticación
app.use('/auth', require('./auth/routes'));

// Rutas protegidas (requieren autenticación)
app.use('/api/docentes', verifyToken, require('./routes/docentes'));
app.use('/api/escuelas', verifyToken, require('./routes/escuelas'));
app.use('/api/expedientes', verifyToken, require('./routes/expedientes'));
app.use('/api/disposiciones', verifyToken, require('./routes/disposiciones'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'API de JP3 funcionando correctamente 🚀',
    provider: process.env.CLOUD_PROVIDER || 'generic',
    version: process.env.API_VERSION || 'v1',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/auth',
      docentes: '/api/docentes',
      escuelas: '/api/escuelas',
      expedientes: '/api/expedientes',
      disposiciones: '/api/disposiciones'
    },
    authentication: 'JWT Bearer Token required for /api/* routes'
  });
});

// Ruta liviana de health-check (no toca la BD)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Exportar app para entornos serverless (Vercel) y escuchar solo en ejecución directa
async function startIfRunDirect() {
  // Probar conexión a la base de datos al iniciar
  const isConnected = await testConnection();

  // Seed controlado de usuarios iniciales SOLO si INIT_SEED_USERS === 'true'
  if (process.env.INIT_SEED_USERS === 'true' && isConnected) {
    try {
      const { seedInitialUsers } = require('./scripts/seedUsers');
      await seedInitialUsers();
      console.log('🎯 Seed de usuarios ejecutado (desactivar INIT_SEED_USERS después).');
    } catch (error) {
      console.error('⚠️ Error en seed de usuarios (continuando):', error.message);
    }
  }
}

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`Servidor iniciado en el puerto ${PORT}`);
    console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
    await startIfRunDirect();
  });
} else {
  // En entorno serverless (Vercel) evitamos chequear BD en cada cold start para reducir ruido.
  // Si quieres forzar el chequeo, define INIT_DB_CHECK=true en variables de entorno.
  if (process.env.INIT_DB_CHECK === 'true') {
    startIfRunDirect();
  } else {
    console.log('⏭️  Omitiendo test de BD en serverless (Vercel).');
  }
}

module.exports = app;

// Manejo graceful de cierre del servidor
process.on('SIGTERM', () => {
  console.log('🔄 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Cerrando servidor...');
  process.exit(0);
});
