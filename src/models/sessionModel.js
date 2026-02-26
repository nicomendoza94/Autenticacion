const pool = require('../config/db');

const SessionModel = {
  logEvent: async ({ ip, email, evento, exitoso, razon = null }) => {
    await pool.query(
      'INSERT INTO security_logs (ip, email, evento, exitoso, razon) VALUES ($1, $2, $3, $4, $5)',
      [ip, email, evento, exitoso, razon]
    );
  },
  getAllLogs: async () => {
    const result = await pool.query(
      'SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 200'
    );
    return result.rows;
  },
  getLogsByEmail: async (email) => {
    const result = await pool.query(
      'SELECT * FROM security_logs WHERE email = $1 ORDER BY created_at DESC',
      [email]
    );
    return result.rows;
  },
};

module.exports = SessionModel;