const { pool } = require('../config/db');

// Operaciones CRUD para docentes
const DocenteModel = {
  // Obtener todos los docentes con paginación
  getAll: async (options = {}) => {
    try {
      const { page = 1, limit = 25, search = '' } = options;
      const offset = (page - 1) * limit;
      
      console.log(`Docentes Model - Página: ${page}, Límite: ${limit}, Búsqueda: "${search}"`);
      
      // Construir la condición WHERE si hay búsqueda
      let whereClause = '';
      let searchParams = [];
      
      if (search) {
        whereClause = `WHERE nombre LIKE ? OR apellido LIKE ? OR dni LIKE ? OR email LIKE ?`;
        searchParams = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
      }
      
      // Consulta principal con paginación
      const query = `SELECT * FROM docentes ${whereClause} ORDER BY apellido, nombre LIMIT ? OFFSET ?`;
      const queryParams = [...searchParams, limit, offset];
      const [rows] = await pool.query(query, queryParams);
      
      // Contar total para calcular páginas
      const countQuery = `SELECT COUNT(*) as total FROM docentes ${whereClause}`;
      const [countResult] = await pool.query(countQuery, searchParams);
      const total = countResult[0].total;
      
      console.log(`✓ Docentes: ${rows.length} registros de ${total} totales (página ${page}/${Math.ceil(total / limit)})`);
      
      return {
        data: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error en getAll de Docentes:', error);
      throw error;
    }
  },

  // Obtener un docente por su ID
  getById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM docentes WHERE id = ?', [id]);
    return rows[0];
  },
  // Crear un nuevo docente
  create: async (docente) => {
    try {
      const { nombre, apellido, dni, email, telefono } = docente;
      const fecha_creacion = new Date();
      
      const [result] = await pool.query(
        'INSERT INTO docentes (nombre, apellido, dni, email, telefono, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, apellido, dni, email || null, telefono || null, fecha_creacion]
      );
      
      return { id: result.insertId, ...docente, fecha_creacion };
    } catch (error) {
      console.error('Error al crear docente:', error);
      throw error;
    }
  },

  // Actualizar un docente
  update: async (id, docente) => {
    try {
      const { nombre, apellido, dni, email, telefono } = docente;
      
      await pool.query(
        'UPDATE docentes SET nombre = ?, apellido = ?, dni = ?, email = ?, telefono = ? WHERE id = ?',
        [nombre, apellido, dni, email || null, telefono || null, id]
      );
      
      return { id, ...docente };
    } catch (error) {
      console.error('Error al actualizar docente:', error);
      throw error;
    }
  },

  // Eliminar un docente
  delete: async (id) => {
    await pool.query('DELETE FROM docentes WHERE id = ?', [id]);
    return id;
  }
};

module.exports = DocenteModel;
