const mysql = require('mysql2/promise');
require('dotenv').config();

// Función para parsear DATABASE_URL de Railway
function parseDbUrl(databaseUrl) {
  if (!databaseUrl) return null;
  
  try {
    const url = new URL(databaseUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1) // remover el '/' inicial
    };
  } catch (error) {
    console.error('❌ Error parseando DATABASE_URL:', error);
    return null;
  }
}

// Configuración de conexión (Railway o local)
let dbConfig;

if (process.env.DATABASE_URL) {
  // Configuración para Railway
  console.log('🚀 Usando configuración de Railway (DATABASE_URL)');
  dbConfig = parseDbUrl(process.env.DATABASE_URL);
  if (!dbConfig) {
    throw new Error('DATABASE_URL inválida');
  }
} else {
  // Configuración local
  console.log('🔧 Usando configuración local');
  dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jp3_db'
  };
}

console.log('🔧 Configuración de base de datos:');
console.log('  - Host:', dbConfig.host);
console.log('  - Puerto:', dbConfig.port);
console.log('  - Base de datos:', dbConfig.database);
console.log('  - Usuario:', dbConfig.user);

// Crear pool de conexiones
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // mysql2 options: use connectTimeout (ms) instead of unsupported ones
  connectTimeout: 60000,
  multipleStatements: false
});

// Función para probar la conexión
async function testConnection() {
  try {
    console.log('🔍 Probando conexión a la base de datos...');
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos establecida con éxito');
    
    // Probar una consulta simple
    const [rows] = await connection.execute('SELECT 1 as test, NOW() as timestamp');
    console.log('✅ Consulta de prueba exitosa:', rows[0]);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    console.error('📋 Detalles del error:');
    console.error(`  - Código: ${error.code}`);
    console.error(`  - Mensaje: ${error.message}`);
    
    // Sugerencias basadas en el tipo de error
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Sugerencia: Verifica que MySQL esté corriendo localmente');
      console.error('💡 O usa: mysql -u root -p para conectar');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Sugerencia: Verifica las credenciales de la base de datos');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Sugerencia: La base de datos no existe o no está accesible');
    }
    
    return false;
  }
}

// Función para obtener información de la base de datos
async function getDatabaseInfo() {
  try {
    const connection = await pool.getConnection();
    
    // Obtener lista de tablas
    const [tables] = await connection.execute('SHOW TABLES');
    
    // Obtener información de cada tabla
    const tableInfo = {};
    for (const table of tables) {
      const tableName = table[`Tables_in_${process.env.DB_NAME || 'jp3_db'}`];
      const [counts] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      tableInfo[tableName] = counts[0].count;
    }
    
    connection.release();
    
    return {
      database: process.env.DB_NAME || 'jp3_db',
      tables: tableInfo,
      totalTables: tables.length
    };
  } catch (error) {
    console.error('❌ Error al obtener información de la base de datos:', error);
    return null;
  }
}

// Función para cerrar el pool de conexiones
async function closePool() {
  try {
    await pool.end();
    console.log('✅ Pool de conexiones cerrado');
  } catch (error) {
    console.error('❌ Error al cerrar pool de conexiones:', error);
  }
}

module.exports = {
  pool,
  testConnection,
  getDatabaseInfo,
  closePool
};
