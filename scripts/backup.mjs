// Saves a copy of everything in the database to a file on this computer.
//
// Usage: npm run backup
//
// Writes backups/la-fruta-backup-<date>.json — customers, invoices, line items,
// the sent-email log, and costs, exactly as they are right now. The file is JSON
// so it stays readable without this app, any particular database, or me.
//
// backups/ is gitignored on purpose: this file holds real customer names,
// addresses, and emails, and the repository is public.

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

// Every table, so a restore never has to guess what was missed.
// costs before cost_stores: a restore has to write the cost rows before the
// links that point at them.
const TABLES = ['customers', 'invoices', 'invoice_items', 'sent_emails', 'costs', 'cost_stores'];

function parseVar(contents, name) {
  const line = contents
    .split(/\r?\n/)
    .find((l) => l.replace(/^﻿/, '').startsWith(`${name}=`));

  if (!line) return null;
  return line.replace(/^﻿/, '').slice(name.length + 1).trim().replace(/^["']|["']$/g, '');
}

const env = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
const url = parseVar(env, 'POSTGRES_URL');

if (!url) {
  console.error('POSTGRES_URL not found in .env.local. Run: vercel env pull');
  process.exit(1);
}

// Same TLS setup as apply-schema.mjs: Supabase signs its certs with its own CA,
// so the CA goes in the connection string rather than disabling verification.
const dsn = new URL(url);
dsn.searchParams.set('sslmode', 'verify-full');
dsn.searchParams.set('sslrootcert', fileURLToPath(new URL('../db/supabase-ca.crt', import.meta.url)));

const client = new Client({ connectionString: dsn.toString() });
await client.connect();

try {
  const stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '');
  const backup = { takenAt: new Date().toISOString(), tables: {} };

  // One transaction, so the tables in the file all come from the same instant
  // rather than drifting apart mid-backup.
  await client.query('BEGIN');
  await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');

  for (const table of TABLES) {
    const { rows } = await client.query(`SELECT * FROM ${table}`);
    backup.tables[table] = rows;
  }

  await client.query('COMMIT');

  const dir = new URL('../backups/', import.meta.url);
  await mkdir(dir, { recursive: true });

  const file = new URL(`la-fruta-backup-${stamp}.json`, dir);
  await writeFile(file, JSON.stringify(backup, null, 2), 'utf8');

  // Read the file back rather than trusting the write: a backup nobody has
  // opened is only a guess that there is a backup.
  const written = JSON.parse(await readFile(file, 'utf8'));

  console.log(`Saved ${fileURLToPath(file)}\n`);
  for (const table of TABLES) {
    const saved = written.tables[table].length;
    const expected = backup.tables[table].length;
    const ok = saved === expected ? 'ok' : `MISMATCH (expected ${expected})`;
    console.log(`  ${table.padEnd(14)} ${String(saved).padStart(5)} rows  ${ok}`);
  }
  console.log('\nKeep a copy somewhere other than this computer.');
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  throw error;
} finally {
  await client.end();
}
