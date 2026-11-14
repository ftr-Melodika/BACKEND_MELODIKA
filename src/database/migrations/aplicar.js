// Archivo: src/database/migrations/aplicar.js
// Aplica un archivo .sql de esta carpeta en una transacción.
//   npm run migrar -- 001_practica_ritmo.sql
import pg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';

dotenv.config();

const archivo = process.argv[2];
if (!archivo) {
  console.error('Indicá el archivo: npm run migrar -- 001_practica_ritmo.sql');
  process.exit(1);
}

const sql = readFileSync(new URL(`./${archivo}`, import.meta.url), 'utf8');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query('BEGIN');
  await client.query(sql);
  await client.query('COMMIT');
  console.log(`Aplicada: ${archivo}`);
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error(`No se aplicó ${archivo}:`, error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
