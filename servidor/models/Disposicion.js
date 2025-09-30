const { pool } = require('../config/db');

// Operaciones CRUD para disposiciones
const DisposicionModel = {
  // Obtener todas las disposiciones con paginación
  getAll: async (options = {}) => {
    try {
      const { page = 1, limit = 25, search = '' } = options;
      const offset = (page - 1) * limit;
      
      console.log(`Disposiciones Model - Página: ${page}, Límite: ${limit}, Búsqueda: "${search}"`);
      
      // Construir la condición WHERE si hay búsqueda
      let whereClause = '';
      let searchParams = [];
      
      if (search) {
        whereClause = `WHERE d.numero LIKE ? OR d.dispo LIKE ? OR d.cargo LIKE ? OR d.motivo LIKE ? OR CONCAT(doc.apellido, ', ', doc.nombre) LIKE ? OR e.nombre LIKE ?`;
        searchParams = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
      }
      
      // Consulta principal con paginación y JOINs
      const query = `
        SELECT d.*, 
               CONCAT(doc.apellido, ', ', doc.nombre) as docente_nombre,
               e.nombre as escuela_nombre
        FROM disposiciones d
        LEFT JOIN docentes doc ON d.docente_id = doc.id
        LEFT JOIN escuelas e ON d.escuela_id = e.id
        ${whereClause}
        ORDER BY d.fecha_dispo DESC 
        LIMIT ? OFFSET ?
      `;
      const queryParams = [...searchParams, limit, offset];
      const [rows] = await pool.query(query, queryParams);
      
      // Contar total para calcular páginas
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM disposiciones d
        LEFT JOIN docentes doc ON d.docente_id = doc.id
        LEFT JOIN escuelas e ON d.escuela_id = e.id
        ${whereClause}
      `;
      const [countResult] = await pool.query(countQuery, searchParams);
      const total = countResult[0].total;
      
      console.log(`✓ Disposiciones: ${rows.length} registros de ${total} totales (página ${page}/${Math.ceil(total / limit)})`);
      
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
      console.error('Error en getAll de Disposiciones:', error);
      throw error;
    }
  },  // Obtener una disposición por su ID
  getById: async (id) => {
    try {
      const [rows] = await pool.query(`
        SELECT d.*, 
               CONCAT(doc.apellido, ', ', doc.nombre) as docente_nombre,
               e.nombre as escuela_nombre
        FROM disposiciones d
        LEFT JOIN docentes doc ON d.docente_id = doc.id
        LEFT JOIN escuelas e ON d.escuela_id = e.id
        WHERE d.id = ?
      `, [id]);
      return rows[0];
    } catch (error) {
      console.error(`Error en getById de DisposicionModel con ID ${id}:`, error);
      throw error;
    }
  },
  // Obtener disposiciones por docente
  getByDocente: async (docenteId) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM disposiciones WHERE docente_id = ? ORDER BY fecha_dispo DESC',
        [docenteId]
      );
      return rows;
    } catch (error) {
      console.error(`Error en getByDocente de DisposicionModel con docenteId ${docenteId}:`, error);
      throw error;
    }
  },
  
  // Crear una nueva disposición
  create: async (disposicion) => {
    const { numero, fecha, dispo, docentes = [], escuelas = [], cargo, motivo, enlace } = disposicion;
    const fecha_creacion = new Date();
    
    // Determinar docente_id del array de docentes o del campo existente
    // Prioridad: 1. docentes array, 2. docente_id existente
    let docente_id = null;
    
    if (Array.isArray(docentes) && docentes.length > 0) {
      docente_id = docentes[0];
    } else {
      docente_id = disposicion.docente_id || null;
    }
    
    // Determinar escuela_id del array de escuelas o del campo existente
    let escuela_id = null;
    
    if (Array.isArray(escuelas) && escuelas.length > 0) {
      escuela_id = escuelas[0];
    } else {
      escuela_id = disposicion.escuela_id || null;
    }
    
    console.log('Creando disposición con docente_id:', docente_id, 'y escuela_id:', escuela_id);
    
    const [result] = await pool.query(
      'INSERT INTO disposiciones (numero, fecha_dispo, dispo, docente_id, escuela_id, cargo, motivo, enlace, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [numero, fecha, dispo, docente_id, escuela_id, cargo, motivo, enlace, fecha_creacion]
    );
    return { id: result.insertId, ...disposicion, docente_id, escuela_id, fecha_creacion };
  },
    // Actualizar una disposición
  update: async (id, disposicion) => {
    const { numero, fecha, dispo, docentes = [], escuelas = [], cargo, motivo, enlace } = disposicion;
    
    // Determinar docente_id solamente del array de docentes
    let docente_id = null;
    
    if (Array.isArray(docentes) && docentes.length > 0) {
      docente_id = docentes[0];
    } else {
      docente_id = disposicion.docente_id || null;
    }
    
    // Determinar escuela_id del array de escuelas o del campo existente
    let escuela_id = null;
    
    if (Array.isArray(escuelas) && escuelas.length > 0) {
      escuela_id = escuelas[0];
    } else {
      escuela_id = disposicion.escuela_id || null;
    }
      
    console.log('Actualizando disposición con docente_id:', docente_id, 'y escuela_id:', escuela_id);
    
    await pool.query(
      'UPDATE disposiciones SET numero = ?, fecha_dispo = ?, dispo = ?, docente_id = ?, escuela_id = ?, cargo = ?, motivo = ?, enlace = ? WHERE id = ?',
      [numero, fecha, dispo, docente_id, escuela_id, cargo, motivo, enlace, id]
    );
    
    return { id, ...disposicion, docente_id, escuela_id };
  },

  // Eliminar una disposición
  delete: async (id) => {
    await pool.query('DELETE FROM disposiciones WHERE id = ?', [id]);
    return id;
  }
};

module.exports = DisposicionModel;
