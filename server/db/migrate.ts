import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create migrations tracking table
db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    filename  TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const migrationsDir = path.join(__dirname, 'migrations');
const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

const applied = new Set(
  db.prepare('SELECT filename FROM schema_migrations').all()
    .map((row: any) => row.filename)
);

for (const file of files) {
  if (applied.has(file)) continue;

  console.log(`Applying migration: ${file}`);
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

  // Split on semicolons and run each statement to handle ALTER TABLE errors gracefully
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of statements) {
    try {
      db.exec(stmt);
    } catch (err: any) {
      // Skip "duplicate column" errors from ALTER TABLE re-runs
      if (err.message?.includes('duplicate column')) {
        continue;
      }
      throw err;
    }
  }

  db.prepare('INSERT INTO schema_migrations (filename) VALUES (?)').run(file);
  console.log(`  Applied: ${file}`);
}

console.log('Database migrations complete.');
