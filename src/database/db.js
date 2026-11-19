import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // El modo sesión del pooler (puerto 5432) admite pocas conexiones y la base es compartida
  max: 5,
});

// Sin este manejador, un corte en una conexión inactiva tumba todo el proceso
pool.on('error', (err) => {
  console.error('Error en una conexión inactiva de la base:', err.message);
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error adquiriendo el cliente', err.stack);
  }

  console.log('Conexión exitosa a Supabase PostgreSQL');
  release();
});

export { pool };