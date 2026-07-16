// Exercises the save_invoice function against the real database and checks the
// money and ordering it produces, then removes everything it created.
//
// Usage: node scripts/verify-db.mjs

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const env = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
const line = env.split(/\r?\n/).find((l) => l.replace(/^﻿/, '').startsWith('POSTGRES_URL='));
const url = line.replace(/^﻿/, '').slice('POSTGRES_URL='.length).trim().replace(/^["']|["']$/g, '');

const dsn = new URL(url);
dsn.searchParams.set('sslmode', 'verify-full');
dsn.searchParams.set('sslrootcert', fileURLToPath(new URL('../db/supabase-ca.crt', import.meta.url)));

const client = new Client({ connectionString: dsn.toString() });
await client.connect();

const failures = [];
const check = (label, actual, expected) => {
  const ok = String(actual) === String(expected);
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}: ${actual}${ok ? '' : ` (expected ${expected})`}`);
  if (!ok) failures.push(label);
};

const INVOICE_ID = '__verify_invoice__';
const CUSTOMER_ID = '__verify_customer__';

try {
  await client.query(
    `INSERT INTO customers (id, name, city, address) VALUES ($1, 'Verify Co', 'San Jose', '1 Test St')
     ON CONFLICT (id) DO NOTHING`,
    [CUSTOMER_ID]
  );

  // 3 boxes @ 12.50 = 37.50, plus 2 @ 0.10 = 0.20  ->  37.70, less 5 discount.
  // The 0.10 case is the one that a float would get wrong.
  await client.query('SELECT save_invoice($1::jsonb)', [
    JSON.stringify({
      id: INVOICE_ID,
      invoice_number: '__VERIFY-1__',
      customer_id: CUSTOMER_ID,
      customer_name: 'Verify Co',
      customer_address: '1 Test St',
      customer_city: 'San Jose',
      date: '2026-07-16',
      notes: 'verification',
      discount: 5,
      status: 'unpaid',
      items: [
        { fruit: 'Lulo Fruit', description: 'first', quantity: 3, price_per_box: 12.5 },
        { fruit: 'Tomate de arbol', description: 'second', quantity: 2, price_per_box: 0.1 },
      ],
    }),
  ]);

  console.log('save_invoice — new invoice:');
  const { rows: inv } = await client.query('SELECT * FROM invoices WHERE id = $1', [INVOICE_ID]);
  check('subtotal', inv[0].subtotal, '37.70');
  check('total_due (37.70 - 5)', inv[0].total_due, '32.70');

  const { rows: items } = await client.query(
    'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY position',
    [INVOICE_ID]
  );
  check('item count', items.length, 2);
  check('item order preserved', items.map((i) => i.fruit).join(','), 'Lulo Fruit,Tomate de arbol');
  check('line amount recomputed (3 x 12.50)', items[0].amount, '37.50');

  // Re-saving must replace the lines, not append to them.
  console.log('save_invoice — re-save replaces items:');
  await client.query('SELECT save_invoice($1::jsonb)', [
    JSON.stringify({
      id: INVOICE_ID,
      invoice_number: '__VERIFY-1__',
      customer_id: CUSTOMER_ID,
      customer_name: 'Verify Co',
      customer_address: '1 Test St',
      customer_city: 'San Jose',
      date: '2026-07-16',
      notes: 'verification',
      discount: 0,
      status: 'paid',
      items: [{ fruit: 'Lulo Fruit', quantity: 1, price_per_box: 10 }],
    }),
  ]);

  const { rows: items2 } = await client.query(
    'SELECT count(*)::int AS n FROM invoice_items WHERE invoice_id = $1',
    [INVOICE_ID]
  );
  check('items replaced, not appended', items2[0].n, 1);

  const { rows: inv2 } = await client.query('SELECT * FROM invoices WHERE id = $1', [INVOICE_ID]);
  check('subtotal after re-save', inv2[0].subtotal, '10.00');
  check('status updated', inv2[0].status, 'paid');

  // A discount larger than the subtotal must floor at zero, not go negative.
  await client.query('SELECT save_invoice($1::jsonb)', [
    JSON.stringify({
      id: INVOICE_ID,
      invoice_number: '__VERIFY-1__',
      customer_id: CUSTOMER_ID,
      customer_name: 'Verify Co',
      customer_address: '1 Test St',
      customer_city: 'San Jose',
      date: '2026-07-16',
      notes: '',
      discount: 999,
      status: 'unpaid',
      items: [{ fruit: 'Lulo Fruit', quantity: 1, price_per_box: 10 }],
    }),
  ]);
  const { rows: inv3 } = await client.query('SELECT total_due FROM invoices WHERE id = $1', [INVOICE_ID]);
  console.log('save_invoice — oversized discount:');
  check('total_due floors at 0', inv3[0].total_due, '0.00');

  // Deleting a customer who has invoices must be refused.
  console.log('foreign key guard:');
  try {
    await client.query('DELETE FROM customers WHERE id = $1', [CUSTOMER_ID]);
    check('delete customer with invoices refused', 'allowed', 'refused');
  } catch (error) {
    check('delete customer with invoices refused', error.code === '23503' ? 'refused' : error.code, 'refused');
  }

  // Deleting the invoice must take its line items with it.
  await client.query('DELETE FROM invoices WHERE id = $1', [INVOICE_ID]);
  const { rows: orphans } = await client.query(
    'SELECT count(*)::int AS n FROM invoice_items WHERE invoice_id = $1',
    [INVOICE_ID]
  );
  console.log('cascade:');
  check('line items removed with invoice', orphans[0].n, 0);
} finally {
  await client.query('DELETE FROM invoices WHERE id = $1', [INVOICE_ID]);
  await client.query('DELETE FROM customers WHERE id = $1', [CUSTOMER_ID]);
  await client.end();
}

console.log(failures.length ? `\n${failures.length} FAILED` : '\nAll checks passed.');
process.exitCode = failures.length ? 1 : 0;
