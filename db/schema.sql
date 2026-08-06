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

  -- 'store' is a shop on the delivery round; 'solo' is a person sold to on
  -- their own. Both are customers and both are invoiced by the same screen —
  -- this only decides which list they appear in.
  kind       TEXT NOT NULL DEFAULT 'store' CHECK (kind IN ('store', 'solo')),
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

-- A record of every invoice email the workspace has tried to send.
--
-- invoice_id and customer_id are plain TEXT, deliberately not foreign keys.
-- This is a log of what actually happened: an invoice can be emailed before it
-- is ever saved, and deleting an invoice later must not erase the evidence that
-- it was sent. A foreign key would block the first case and rewrite the second.
CREATE TABLE IF NOT EXISTS sent_emails (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invoice_id     TEXT,
  customer_id    TEXT,
  invoice_number TEXT NOT NULL,
  customer_name  TEXT NOT NULL,
  recipient      TEXT NOT NULL,
  message        TEXT,
  total_due      NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- The invoice exactly as it went out. Editing the invoice afterwards must not
  -- change what this record says was emailed, and re-sending has to reproduce
  -- the same content the customer originally received.
  invoice        JSONB NOT NULL,

  -- Failed attempts are kept, not discarded: "did that actually send?" is only
  -- answerable if the failures are recorded alongside the successes.
  status         TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error          TEXT,

  -- Resend's id for the message, for cross-referencing in their dashboard.
  provider_id    TEXT,
  sent_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- What a load cost to get here: the money that has to be paid back out, as
-- opposed to the money invoiced in.
--
-- Which stores a cost belongs to lives in cost_stores, not here — one load is
-- routinely split across several of them.
CREATE TABLE IF NOT EXISTS costs (
  id       TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  date     DATE NOT NULL,

  -- The amounts written on the paper this page replaces, in that order.
  -- all_amount is a figure of its own, not the sum of the four below it: it is
  -- whatever the load came to overall, and the rest break out where the money
  -- went. Nothing here is computed from anything else.
  --
  -- Every one of them may be negative. Money comes back as well as goes out —
  -- a refunded airline fee or a credit from the broker is entered as a minus,
  -- and a CHECK forbidding that would make those loads unrecordable.
  --
  -- NUMERIC, never float — see the note on invoices.
  all_amount   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  cargo_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  goods_cost   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  airline_fee  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  broker_fee   NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- What is left after the four are applied to the all amount, and what has to
  -- be paid back out. The page fills both in as the others are typed — 2800
  -- with -904, -770, -140 and -80 against it gives 906 and 1894 — but they are
  -- stored as plain numbers, not generated, because either can be typed over
  -- when the paperwork says something the arithmetic doesn't.
  final_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  have_to_pay  NUMERIC(12, 2) NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The stores a cost is split across. A row here means "this cost belongs to
-- that store"; the primary key stops the same store being attached twice.
--
-- CASCADE from costs so deleting a cost takes its store links with it, but
-- RESTRICT from customers for the same reason invoices use it: a store with
-- costs recorded against it must not be deletable out from under them.
CREATE TABLE IF NOT EXISTS cost_stores (
  cost_id  TEXT NOT NULL REFERENCES costs(id) ON DELETE CASCADE,
  store_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  PRIMARY KEY (cost_id, store_id)
);

-- costs was built the same day and changed shape a few times as what the page
-- had to do got clearer: a `total` that summed the wrong things, a single
-- store_id from when a cost could only belong to one place, and a free-text
-- note where the final amount now goes. These carry an existing table forward;
-- on a fresh database they are all no-ops. Safe to re-run, like everything
-- else here. Order matters — final_amount is generated from all_amount.
ALTER TABLE costs ADD COLUMN IF NOT EXISTS all_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE costs DROP COLUMN IF EXISTS total;
ALTER TABLE costs DROP COLUMN IF EXISTS store_id;
ALTER TABLE costs DROP COLUMN IF EXISTS notes;
ALTER TABLE costs ADD COLUMN IF NOT EXISTS final_amount NUMERIC(12, 2) NOT NULL
  GENERATED ALWAYS AS (all_amount + cargo_amount + goods_cost + airline_fee + broker_fee) STORED;
ALTER TABLE costs ADD COLUMN IF NOT EXISTS have_to_pay NUMERIC(12, 2) NOT NULL
  GENERATED ALWAYS AS (-(cargo_amount + goods_cost + airline_fee + broker_fee)) STORED;

-- Both started out generated, and became typeable once it turned out either
-- can need correcting by hand. DROP EXPRESSION converts a generated column to
-- an ordinary one KEEPING the values it already worked out, so costs entered
-- before this keep their figures. IF EXISTS makes a re-run a no-op — without
-- it, the second run would fail on a column that is already plain.
ALTER TABLE costs ALTER COLUMN final_amount DROP EXPRESSION IF EXISTS;
ALTER TABLE costs ALTER COLUMN have_to_pay  DROP EXPRESSION IF EXISTS;
ALTER TABLE costs ALTER COLUMN final_amount SET DEFAULT 0;
ALTER TABLE costs ALTER COLUMN have_to_pay  SET DEFAULT 0;

-- Everyone already on the books was a store before solo customers existed, and
-- the default says so. A no-op once the column is there.
ALTER TABLE customers ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'store'
  CHECK (kind IN ('store', 'solo'));

CREATE INDEX IF NOT EXISTS costs_date_idx ON costs (date DESC);
CREATE INDEX IF NOT EXISTS cost_stores_store_id_idx ON cost_stores (store_id);

CREATE INDEX IF NOT EXISTS sent_emails_sent_at_idx ON sent_emails (sent_at DESC);
CREATE INDEX IF NOT EXISTS sent_emails_customer_id_idx ON sent_emails (customer_id);

CREATE INDEX IF NOT EXISTS invoices_customer_id_idx ON invoices (customer_id);
CREATE INDEX IF NOT EXISTS invoices_date_idx ON invoices (date DESC);
CREATE INDEX IF NOT EXISTS invoice_items_invoice_id_idx ON invoice_items (invoice_id, position);

ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_emails   ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_stores   ENABLE ROW LEVEL SECURITY;

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

-- Saves a cost and the stores it is split across as one unit.
--
-- Same reasoning as save_invoice: writing the cost and then its store links
-- over two round trips means a failure between them leaves a cost belonging to
-- nowhere, which no screen would ever show. One function, one transaction.
CREATE OR REPLACE FUNCTION save_cost(payload jsonb)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_id TEXT := COALESCE(NULLIF(payload->>'id', ''), gen_random_uuid()::text);
  store_count INT := jsonb_array_length(COALESCE(payload->'store_ids', '[]'::jsonb));
BEGIN
  -- The app checks this too, but the database is the last place that can stop
  -- an unreachable row being written.
  IF store_count = 0 THEN
    RAISE EXCEPTION 'A cost must belong to at least one store.';
  END IF;

  INSERT INTO costs (
    id, date, all_amount, cargo_amount, goods_cost, airline_fee, broker_fee,
    final_amount, have_to_pay
  )
  VALUES (
    new_id,
    (payload->>'date')::date,
    COALESCE((payload->>'all_amount')::numeric, 0),
    COALESCE((payload->>'cargo_amount')::numeric, 0),
    COALESCE((payload->>'goods_cost')::numeric, 0),
    COALESCE((payload->>'airline_fee')::numeric, 0),
    COALESCE((payload->>'broker_fee')::numeric, 0),
    COALESCE((payload->>'final_amount')::numeric, 0),
    COALESCE((payload->>'have_to_pay')::numeric, 0)
  );

  INSERT INTO cost_stores (cost_id, store_id)
  SELECT new_id, store_id
  FROM jsonb_array_elements_text(payload->'store_ids') AS s(store_id)
  ON CONFLICT DO NOTHING;

  RETURN new_id;
END;
$$;

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
