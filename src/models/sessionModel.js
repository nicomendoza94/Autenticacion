//se importa el pool de conexiones que creamos en db.js
const pool = require('../config/db');

//es un objeto que agrupa todas las operaciones sobre la tabla security_logs
const SessionModel = {

  //registra un evento de seguridad en la bd
  //se llama cada vez que alguien hace login, registro, o logout
  logEvent: async ({ ip, email, evento, exitoso, razon = null }) => {
    await pool.query(
      'INSERT INTO security_logs (ip, email, evento, exitoso, razon) VALUES ($1, $2, $3, $4, $5)',
      [ip, email, evento, exitoso, razon]
    );
  },

  //obtiene todos los logs, solo puede usar el admin
  getAllLogs: async () => {
    const result = await pool.query(
      'SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 200'
    );
    return result.rows;
  },

  //obtiene los logs de un usuario especifico por su email
  getLogsByEmail: async (email) => {
    const result = await pool.query(
      'SELECT * FROM security_logs WHERE email = $1 ORDER BY created_at DESC',
      [email]
    );
    return result.rows;
  },

};

//se exporta el objeto para que otros archivos puedan usarlo
module.exports = SessionModel;