//se importa el pool de conexiones que creamos en db.js
const pool = require('../config/db');

//es un objeto que agrupa todas las operaciones sobre la tabla users
const UserModel = {

  //busca un usuario por su email
  //se usa en el login para verificar si el usuario existe
  findByEmail: async (email) => {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]  //$1 es un placeholder que evita injeccion sql
    );
    return result.rows[0]; // rows[0] espera un solo usuario
  },

  //busca un usuario por su id
  //se usa en el middleware de auth para verificar la sesion activa
  findById: async (id) => {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  //se crea un usuario nuevo en la base de datos
  create: async (email, passwordHash, rol = 'usuario') => {
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, rol) VALUES ($1, $2, $3) RETURNING *',
      [email, passwordHash, rol]
    );
    return result.rows[0];
  },

  //obtiene todos los usuarios sin exponer el password_hash
  //solo puede usar el admin
  findAll: async () => {
    const result = await pool.query(
      'SELECT id, email, rol, intentos_fallidos, bloqueado_hasta, created_at FROM users ORDER BY created_at DESC'
    );
    return result.rows; // rows espera multiples usuarios
  },

  //elimina un usuario por su id
  //solo puede usar el admin
  deleteById: async (id) => {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  //actualiza el contador de intentos fallidos y el tiempo de bloqueo
  //se llama cada vez que alguien ingresa una contraseña incorrecta
  updateLoginFailed: async (id, intentosFallidos, bloqueadoHasta) => {
    await pool.query(
      'UPDATE users SET intentos_fallidos = $1, bloqueado_hasta = $2 WHERE id = $3',
      [intentosFallidos, bloqueadoHasta, id]
    );
  },

  //se resetea los intentos fallidos a 0 cuando el login es exitoso
  //y elimina el bloqueo si existia
  resetLoginFailed: async (id) => {
    await pool.query(
      'UPDATE users SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = $1',
      [id]
    );
  },

};

//se exporta el objeto para que otros archivos puedan usarlo
module.exports = UserModel;