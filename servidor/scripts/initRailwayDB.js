const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function initializeRailwayDatabase() {
  console.log('🚀 Inicializando base de datos en Railway...');
  
  try {
    // Crear tabla users si no existe
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla users creada/verificada');

    // Verificar si ya existen usuarios
    const [existingUsers] = await pool.execute('SELECT COUNT(*) as count FROM users');
    
    if (existingUsers[0].count === 0) {
      console.log('📝 Creando usuarios iniciales...');
      
      // Crear usuario admin
      const adminPassword = await bcrypt.hash('sadAdmin2025!', 10);
      await pool.execute(`
        INSERT INTO users (username, email, password_hash, role) 
        VALUES (?, ?, ?, ?)
      `, ['admin', 'vbar@abc.gob.ar', adminPassword, 'admin']);
      
      // Crear usuario normal
      const userPassword = await bcrypt.hash('sadUser2025!', 10);
      await pool.execute(`
        INSERT INTO users (username, email, password_hash, role) 
        VALUES (?, ?, ?, ?)
      `, ['usuario', 'usuario@abc.gob.ar', userPassword, 'user']);
      
      console.log('✅ Usuarios iniciales creados');
      console.log('👤 Admin: admin / sadAdmin2025!');
      console.log('👤 Usuario: usuario / sadUser2025!');
    } else {
      console.log('✅ Usuarios ya existen, saltando creación');
    }
    
    console.log('🎯 Base de datos Railway inicializada correctamente');
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos Railway:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeRailwayDatabase()
    .then(() => {
      console.log('✅ Inicialización completada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en inicialización:', error);
      process.exit(1);
    });
}

module.exports = { initializeRailwayDatabase };
