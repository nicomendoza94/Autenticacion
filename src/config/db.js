// Importamos Pool de la librería pg
// pg es el driver oficial de PostgreSQL para Node.js
const { Pool } = require('pg');

// Cargamos las variables del archivo .env
// Sin esto, process.env.DB_PASSWORD sería undefined
require('dotenv').config();

// Creamos el pool de conexiones usando las variables de entorno
const pool = new Pool({
  host: process.env.DB_HOST,         // localhost
  port: process.env.DB_PORT,         // 5432
  database: process.env.DB_NAME,     // passport_inc
  user: process.env.DB_USER,         // postgres
  password: process.env.DB_PASSWORD  // tu contraseña
});

// Esto es una prueba de conexión que corre al iniciar el servidor
// Si falla, muestra el error y cierra el proceso
// Si funciona, muestra el check verde y libera la conexión de vuelta al pool
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error conectando a PostgreSQL:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a PostgreSQL');
  release();
});

// Exportamos el pool para que otros archivos puedan usarlo
module.exports = pool;