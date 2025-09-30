const { pool } = require('../config/db');

// Operaciones CRUD para escuelas
const EscuelaModel = {
  // Obtener todas las escuelas
  getAll: async () => {
    const [rows] = await pool.query('SELECT * FROM escuelas ORDER BY nombre');
    return rows;
  },

  // Obtener una escuela por su ID
  getById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM escuelas WHERE id = ?', [id]);
    return rows[0];
  },
  // Crear una nueva escuela
  create: async (escuela) => {
    try {
      const { nombre, direccion, telefono, email } = escuela;
      const fecha_creacion = new Date();
      
      const [result] = await pool.query(
        'INSERT INTO escuelas (nombre, direccion, telefono, email, fecha_creacion) VALUES (?, ?, ?, ?, ?)',
        [nombre, direccion || null, telefono || null, email || null, fecha_creacion]
      );
      
      return { id: result.insertId, ...escuela, fecha_creacion };
    } catch (error) {
      console.error('Error al crear escuela:', error);
      throw error;
    }
  },

  // Actualizar una escuela
  update: async (id, escuela) => {
    try {
      const { nombre, direccion, telefono, email } = escuela;
      
      await pool.query(
        'UPDATE escuelas SET nombre = ?, direccion = ?, telefono = ?, email = ? WHERE id = ?',
        [nombre, direccion || null, telefono || null, email || null, id]
      );
      
      return { id, ...escuela };
    } catch (error) {
      console.error('Error al actualizar escuela:', error);
      throw error;
    }
  },

  // Eliminar una escuela
  delete: async (id) => {
    await pool.query('DELETE FROM escuelas WHERE id = ?', [id]);
    return id;
  }
};

module.exports = EscuelaModel;
