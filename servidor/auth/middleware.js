const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Middleware para verificar JWT token
const verifyToken = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido. Formato: Bearer <token>'
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Obtener información del usuario desde la base de datos
    const connection = await pool.getConnection();
    const [users] = await connection.execute(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );
    connection.release();

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Agregar información del usuario al request
    req.user = users[0];
    next();

  } catch (error) {
    console.error('Error en verificación de token:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar roles específicos
const checkRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (req.user.role !== requiredRole && requiredRole !== 'any') {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere rol: ${requiredRole}`
      });
    }

    next();
  };
};

// Middleware para verificar si es admin
const requireAdmin = (req, res, next) => {
  checkRole('admin')(req, res, next);
};

// Middleware que permite tanto admin como user
const requireAuth = (req, res, next) => {
  checkRole('any')(req, res, next);
};

module.exports = {
  verifyToken,
  checkRole,
  requireAdmin,
  requireAuth
};
