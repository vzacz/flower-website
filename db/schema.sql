-- LA FRUTA — database schema
--
-- Apply with: node scripts/apply-schema.mjs
-- Safe to re-run: every statement is idempotent.
--
-- Access model: RLS is enabled with NO policies, so the anon/publishable key
-- (which ships to the browser) can read nothing. All access goes through the
-- service role key from Server Actions, which re-check the session first.
--
-- Ids are TEXT rather than UUID so that invoices created in the browser before
-- this migration keep working — their ids are millisecond timestamps and their
-- customerId values are the seed strings '1'..'7'.

CREATE TABLE IF NOT EXISTS customers (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name       TEXT NOT NULL,
  city       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  address    TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_number TEXT NOT NULL UNIQUE,

  -- RESTRICT, not CASCADE: a customer with billing history must not be
  -- deletable out from under their invoices.
  customer_id    TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,

  -- Denormalised on purpose. An invoice is a historical record: if a customer
  -- later moves or is renamed, invoices already issued must still show the
  -- address they were billed at.
  customer_name    TEXT NOT NULL,
  customer_address TEXT NOT NULL DEFAULT '',
  customer_city    TEXT NOT NULL DEFAULT '',

  date       DATE NOT NULL,
  notes      TEXT NOT NULL DEFAULT '',

  -- NUMERIC, never float: binary floats cannot represent 0.10 exactly and the
  -- error compounds across line items.
  subtotal   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_due  NUMERIC(12, 2) NOT NULL DEFAULT 0,

  status     TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id    TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  fruit         TEXT NOT NULL,
  description   TEXT,
  quantity      NUMERIC(12, 2) NOT NULL,
  price_per_box NUMERIC(12, 2) NOT NULL,
  amount        NUMERIC(12, 2) NOT NULL,

  -- Rows have no inherent order; the UI list does. Without this, line items
  -- come back shuffled.
  position      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS invoices_customer_id_idx ON invoices (customer_id);
CREATE INDEX IF NOT EXISTS invoices_date_idx ON invoices (date DESC);
CREATE INDEX IF NOT EXISTS invoice_items_invoice_id_idx ON invoice_items (invoice_id, position);

ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Saves an invoice and its line items as one unit.
--
-- Without this, saving means "delete the items, then insert the new ones" over
-- two round trips: a failure between them leaves a real invoice with no lines.
-- A plpgsql function runs in a single transaction, so the invoice either saves
-- completely or not at all.
--
-- Money is recomputed here rather than trusted from the payload — the database
-- is the last place that can be authoritative about what a customer owes.
CREATE OR REPLACE FUNCTION save_invoice(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  inv_id TEXT := payload->>'id';
  result  jsonb;
BEGIN
  INSERT INTO invoices (
    id, invoice_number, customer_id, customer_name, customer_address,
    customer_city, date, notes, discount, status, created_at, updated_at
  )
  VALUES (
    inv_id,
    payload->>'invoice_number',
    payload->>'customer_id',
    payload->>'customer_name',
    COALESCE(payload->>'customer_address', ''),
    COALESCE(payload->>'customer_city', ''),
    (payload->>'date')::date,
    COALESCE(payload->>'notes', ''),
    COALESCE((payload->>'discount')::numeric, 0),
    COALESCE(payload->>'status', 'unpaid'),
    COALESCE((payload->>'created_at')::timestamptz, now()),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    invoice_number   = EXCLUDED.invoice_number,
    customer_id      = EXCLUDED.customer_id,
    customer_name    = EXCLUDED.customer_name,
    customer_address = EXCLUDED.customer_address,
    customer_city    = EXCLUDED.customer_city,
    date             = EXCLUDED.date,
    notes            = EXCLUDED.notes,
    discount         = EXCLUDED.discount,
    status           = EXCLUDED.status,
    updated_at       = now();

  DELETE FROM invoice_items WHERE invoice_id = inv_id;

  INSERT INTO invoice_items (
    invoice_id, fruit, description, quantity, price_per_box, amount, position
  )
  SELECT
    inv_id,
    item->>'fruit',
    NULLIF(item->>'description', ''),
    (item->>'quantity')::numeric,
    (item->>'price_per_box')::numeric,
    -- Recomputed, not taken from the payload.
    ROUND((item->>'quantity')::numeric * (item->>'price_per_box')::numeric, 2),
    (ord - 1)::int
  FROM jsonb_array_elements(COALESCE(payload->'items', '[]'::jsonb))
       WITH ORDINALITY AS t(item, ord);

  UPDATE invoices SET
    subtotal  = COALESCE((SELECT SUM(amount) FROM invoice_items WHERE invoice_id = inv_id), 0),
    total_due = GREATEST(
      0,
      COALESCE((SELECT SUM(amount) FROM invoice_items WHERE invoice_id = inv_id), 0) - discount
    )
  WHERE id = inv_id;

  SELECT to_jsonb(i) INTO result FROM invoices i WHERE i.id = inv_id;
  RETURN result;
END;
$$;

-- Invoice numbers stay "highest existing + 1", computed in the app.
--
-- A sequence would be race-proof, but nextval() consumes a number even if the
-- invoice is never saved — so merely opening a customer page and walking away
-- would leave a permanent gap in the books. Previewing max+1 keeps numbering
-- gapless, and the UNIQUE constraint on invoice_number is the backstop if two
-- tabs ever race to the same one.
DROP FUNCTION IF EXISTS next_invoice_number();
DROP SEQUENCE IF EXISTS invoice_number_seq;

-- The customers the app shipped with. Ids are pinned to '1'..'7' because
-- invoices already written in the browser reference them by those strings.
INSERT INTO customers (id, name, city, address) VALUES
  ('1', 'El Chaparral',                'San Jose',            '123 Main Street'),
  ('2', 'Mi Ranchito Sunnyvale',       'Sunnyvale',           '456 Sunnyvale Ave'),
  ('3', 'Mi Ranchito Market San Jose', 'San Jose',            '789 Market Blvd'),
  ('4', 'Olala Campbell',              'Campbell',            '101 Orchard Lane'),
  ('5', 'Ayyar South San Francisco',   'South San Francisco', '202 Bay Street'),
  ('6', 'Mina''s Cafe Foster City',    'Foster City',         '303 Cafe Plaza'),
  ('7', 'La Prada San Jose',           'San Jose',            '404 Garden Road')
ON CONFLICT (id) DO NOTHING;
