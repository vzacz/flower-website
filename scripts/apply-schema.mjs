// Applies db/schema.sql to the database in POSTGRES_URL.
//
// Usage: node scripts/apply-schema.mjs
//
// Reads POSTGRES_URL from .env.local (written by `vercel env pull`). Every
// statement in schema.sql is idempotent, so re-running is safe.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

function readEnvLocal() {
  return readFile(new URL('../.env.local', import.meta.url), 'utf8');
}

function parseVar(contents, name) {
  // .env.local may be BOM-prefixed and values may be quoted.
  const line = contents
    .split(/\r?\n/)
    .find((l) => l.replace(/^﻿/, '').startsWith(`${name}=`));

  if (!line) return null;

  const value = line.replace(/^﻿/, '').slice(name.length + 1).trim();
  return value.replace(/^["']|["']$/g, '');
}

const env = await readEnvLocal();
const url = parseVar(env, 'POSTGRES_URL');

if (!url) {
  console.error('POSTGRES_URL not found in .env.local. Run: vercel env pull');
  process.exit(1);
}

const sql = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');

// Supabase signs its database certs with its own CA, so Node's built-in trust
// store rejects them. Supply the CA rather than turning verification off:
// db/supabase-ca.crt came from supabase-downloads.s3-ap-southeast-1.amazonaws.com
// over public HTTPS. Never use sslmode=no-verify or rejectUnauthorized: false
// here — that would send the database password to whoever answers.
//
// The CA has to go in the connection string, not a `ssl` option: POSTGRES_URL
// arrives with ?sslmode=require, and pg builds its TLS config from the string,
// silently ignoring an `ssl` object passed alongside it.
const caPath = fileURLToPath(new URL('../db/supabase-ca.crt', import.meta.url));

const dsn = new URL(url);
dsn.searchParams.set('sslmode', 'verify-full'); // verify-full also pins the hostname
dsn.searchParams.set('sslrootcert', caPath);

const client = new Client({ connectionString: dsn.toString() });

await client.connect();

try {
  await client.query('BEGIN');
  await client.query(sql);
  await client.query('COMMIT');
  console.log('Schema applied.');

  const { rows } = await client.query(`
    SELECT table_name, (SELECT count(*) FROM customers) AS customer_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('customers', 'invoices', 'invoice_items', 'sent_emails', 'costs', 'cost_stores')
    ORDER BY table_name
  `);

  for (const row of rows) console.log(`  ${row.table_name}`);
  console.log(`  seeded customers: ${rows[0]?.customer_count ?? 0}`);
} catch (error) {
  await client.query('ROLLBACK');
  console.error('Failed, rolled back:', error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
