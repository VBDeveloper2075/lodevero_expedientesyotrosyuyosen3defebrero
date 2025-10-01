const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const { verifyToken } = require('./auth/middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración CORS - Temporalmente permisivo para deploy inicial
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || true  // Permitir cualquier origen si no hay FRONTEND_URL
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

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
  // Vercel importará el handler
  startIfRunDirect();
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
