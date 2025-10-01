const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

// Lee usuarios y contraseñas desde variables o usa las que nos pediste
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'JP3Admin2025!';
const NORMAL_USER = process.env.NORMAL_USER || 'usuario';
const NORMAL_PASS = process.env.NORMAL_PASS || 'JP3User2025!';

(async () => {
  try {
    console.log('Actualizando contraseñas...');

    const adminHash = await bcrypt.hash(ADMIN_PASS, 12);
    const userHash = await bcrypt.hash(NORMAL_PASS, 12);

    // Asegurar existencia de tabla users
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin','user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Crear si no existe, o actualizar si existe
    await pool.execute(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES (?, ?, ?, 'admin')
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      [ADMIN_USER, 'admin@example.com', adminHash]
    );

    await pool.execute(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES (?, ?, ?, 'user')
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      [NORMAL_USER, 'usuario@example.com', userHash]
    );

    console.log('Listo: contraseñas actualizadas.');
    process.exit(0);
  } catch (err) {
    console.error('Error actualizando contraseñas:', err);
    process.exit(1);
  }
})();
