const pool = require('../config/db');

const UserModel = {
  findByEmail: async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },
  findById: async (id) => {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  },
  create: async (email, passwordHash, rol = 'usuario') => {
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, rol) VALUES ($1, $2, $3) RETURNING *',
      [email, passwordHash, rol]
    );
    return result.rows[0];
  },
  findAll: async () => {
    const result = await pool.query(
      'SELECT id, email, rol, intentos_fallidos, bloqueado_hasta, created_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  },
  deleteById: async (id) => {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  },
  updateLoginFailed: async (id, intentosFallidos, bloqueadoHasta) => {
    await pool.query(
      'UPDATE users SET intentos_fallidos = $1, bloqueado_hasta = $2 WHERE id = $3',
      [intentosFallidos, bloqueadoHasta, id]
    );
  },
  resetLoginFailed: async (id) => {
    await pool.query(
      'UPDATE users SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1',
      [id]
    );
  },
};

module.exports = UserModel;