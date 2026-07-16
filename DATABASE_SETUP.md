# Database

LA FRUTA stores customers and invoices in Postgres (Supabase), provisioned
through the Vercel Marketplace. Connection variables (`SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `POSTGRES_URL`, …) are set by that integration —
pull them locally with `vercel env pull`.

## Schema

[`db/schema.sql`](db/schema.sql) is the source of truth. Apply it with:

```bash
node scripts/apply-schema.mjs
```

Every statement is idempotent, so it is safe to re-run after an edit.

Verify the invoice logic against the real database with:

```bash
node scripts/verify-db.mjs
```

It checks the money arithmetic, line-item ordering, re-save behaviour, and the
foreign key that stops a customer with invoices being deleted. It cleans up
after itself.

## How access works

- `customers`, `invoices`, and `invoice_items` have **RLS enabled with no
  policies**. The anon/publishable key ships to the browser and can therefore
  read nothing.
- All access goes through the **service role key** in [`src/lib/db.ts`](src/lib/db.ts),
  which is `server-only`. Importing it from a Client Component fails the build.
- Client Components reach data through the Server Actions in
  [`src/app/actions/`](src/app/actions/). Each one calls `verifySession()` first —
  Server Actions are POST endpoints and are reachable without going through the
  UI.

## Notes on the design

- **Money is `NUMERIC(12,2)`, never a float.** Binary floats can't represent
  0.10 exactly and the error compounds across line items.
- **Invoices denormalise the customer's name, address, and city.** An invoice is
  a historical record: if a customer moves, invoices already issued must still
  show the address they were billed at.
- **`save_invoice(jsonb)` writes an invoice and its items in one transaction**,
  and recomputes `subtotal`/`total_due` from the items rather than trusting the
  client.
- **Ids are `TEXT`, not `UUID`.** Invoices created before the database existed
  used millisecond-timestamp ids and referenced seed customers as `'1'`..`'7'`;
  keeping TEXT let those import unchanged.
- **Invoice numbers are `max + 1`, computed in the app.** A sequence would be
  race-proof but consumes a number even when the invoice is never saved, leaving
  permanent gaps in the books. `UNIQUE` on `invoice_number` is the backstop.

## TLS

Supabase signs its database certificates with its own CA, so Node rejects them
by default. [`db/supabase-ca.crt`](db/supabase-ca.crt) is Supabase's public root
CA (from `supabase-downloads.s3-ap-southeast-1.amazonaws.com`), and the scripts
connect with `sslmode=verify-full` against it. Do not "fix" a certificate error
by disabling verification — that sends the database password to whoever answers.

## Migrating browser data

Invoices created before the database live in whichever browser made them. Visit
`/migrate` **in that browser** to copy them across. It skips anything already
imported and never clears localStorage.
