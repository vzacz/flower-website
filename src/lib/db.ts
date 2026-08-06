import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Cost, Customer, CustomerKind, Invoice, InvoiceItem, SentEmail } from '@/types';

/**
 * Database access for the workspace.
 *
 * Every table has RLS enabled with no policies, so the anon key — which ships
 * to the browser — can read nothing. The service role key bypasses RLS, which
 * is why this file is server-only and why callers must pass verifySession()
 * first. Importing this into a Client Component is a build error, by design.
 */

// Untyped schema: no generated Database types exist for this project, so the
// client is left generic and each query maps its rows through the converters
// below. Without this the client infers `never` for every table.
let client: SupabaseClient | null = null;

function db(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.'
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}

// --- row shapes -------------------------------------------------------------
// Postgres is snake_case, the app's types are camelCase. Mapping happens here
// so the rest of the app never sees a database column name.

type CustomerRow = {
  id: string;
  name: string;
  city: string;
  kind: 'store' | 'solo';
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type InvoiceRow = {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_address: string;
  customer_city: string;
  date: string;
  notes: string;
  subtotal: number | string;
  discount: number | string;
  total_due: number | string;
  status: 'unpaid' | 'paid';
  created_at: string;
  updated_at: string;
  invoice_items?: InvoiceItemRow[];
};

type InvoiceItemRow = {
  id: string;
  fruit: string;
  description: string | null;
  quantity: number | string;
  price_per_box: number | string;
  amount: number | string;
  position: number;
};

// PostgREST can hand NUMERIC back as a string once values get large enough.
const num = (value: number | string): number => Number(value);

function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    kind: row.kind,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    notes: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toInvoiceItem(row: InvoiceItemRow): InvoiceItem {
  return {
    id: row.id,
    fruit: row.fruit,
    description: row.description ?? undefined,
    quantity: num(row.quantity),
    pricePerBox: num(row.price_per_box),
    amount: num(row.amount),
  };
}

function toInvoice(row: InvoiceRow): Invoice {
  const items = [...(row.invoice_items ?? [])]
    .sort((a, b) => a.position - b.position)
    .map(toInvoiceItem);

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerAddress: row.customer_address,
    customerCity: row.customer_city,
    date: row.date,
    notes: row.notes,
    items,
    subtotal: num(row.subtotal),
    discount: num(row.discount),
    totalDue: num(row.total_due),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const INVOICE_SELECT = '*, invoice_items(*)';

// --- backup -----------------------------------------------------------------

// Every table, so a restore never has to guess what was missed — the same set
// the `npm run backup` script dumps.
const BACKUP_TABLES = [
  'customers',
  'invoices',
  'invoice_items',
  'sent_emails',
  'costs',
  'cost_stores',
] as const;

export type DatabaseBackup = {
  takenAt: string;
  tables: Record<string, unknown[]>;
};

/**
 * Reads every table as raw rows for an off-site backup. Unlike the local
 * `scripts/backup.mjs`, this goes through PostgREST rather than a direct
 * Postgres connection, so the four reads aren't one transaction — for a
 * single-user business backing up nightly, the sub-second drift between tables
 * is not worth a stored procedure. Rows are returned exactly as stored so the
 * file stays restorable without this app.
 */
export async function dumpAllTables(): Promise<DatabaseBackup> {
  const tables: Record<string, unknown[]> = {};

  for (const table of BACKUP_TABLES) {
    const { data, error } = await db().from(table).select('*');
    if (error) throw new Error(`Could not read ${table} for backup: ${error.message}`);
    tables[table] = data ?? [];
  }

  return { takenAt: new Date().toISOString(), tables };
}

// --- customers --------------------------------------------------------------

/** Every customer, or just the stores or just the solo ones. */
export async function getCustomers(kind?: CustomerKind): Promise<Customer[]> {
  const query = db().from('customers').select('*').order('name');
  const { data, error } = await (kind ? query.eq('kind', kind) : query);

  if (error) throw new Error(`Could not load customers: ${error.message}`);
  return (data as unknown as CustomerRow[]).map(toCustomer);
}

export async function getCustomerById(id: string): Promise<Customer | undefined> {
  const { data, error } = await db().from('customers').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`Could not load customer: ${error.message}`);
  return data ? toCustomer(data as unknown as CustomerRow) : undefined;
}

export async function addCustomer(input: {
  name: string;
  city: string;
  kind?: CustomerKind;
  address?: string;
  email?: string;
  phone?: string;
  notes?: string;
}): Promise<Customer> {
  const { data, error } = await db()
    .from('customers')
    .insert({
      name: input.name,
      city: input.city,
      kind: input.kind ?? 'store',
      address: input.address ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      notes: input.notes ?? null,
    })
    .select('*')
    .single();

  if (error) throw new Error(`Could not add customer: ${error.message}`);
  return toCustomer(data as unknown as CustomerRow);
}

/**
 * Inserts a customer keeping the id it already had, so invoices that reference
 * it by that id still line up. Used only by the one-time browser import.
 */
export async function importCustomer(customer: {
  id: string;
  name: string;
  city: string;
  address?: string;
  email?: string;
  phone?: string;
  notes?: string;
}): Promise<void> {
  const { error } = await db()
    .from('customers')
    .insert({
      id: customer.id,
      name: customer.name,
      city: customer.city,
      address: customer.address ?? null,
      email: customer.email ?? null,
      phone: customer.phone ?? null,
      notes: customer.notes ?? null,
    });

  if (error) throw new Error(error.message);
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await db().from('customers').delete().eq('id', id);

  if (error) {
    // 23503 = foreign key violation: the customer still has invoices. The
    // schema blocks this on purpose so billing history can't be orphaned.
    if (error.code === '23503') {
      throw new Error(
        'This customer has invoices, so they cannot be deleted. Delete the invoices first if you really mean to remove them.'
      );
    }
    throw new Error(`Could not delete customer: ${error.message}`);
  }
}

// --- invoices ---------------------------------------------------------------

export async function getInvoices(): Promise<Invoice[]> {
  const { data, error } = await db()
    .from('invoices')
    .select(INVOICE_SELECT)
    .order('date', { ascending: false });

  if (error) throw new Error(`Could not load invoices: ${error.message}`);
  return (data as unknown as InvoiceRow[]).map(toInvoice);
}

export async function getInvoiceById(id: string): Promise<Invoice | undefined> {
  const { data, error } = await db()
    .from('invoices')
    .select(INVOICE_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Could not load invoice: ${error.message}`);
  return data ? toInvoice(data as unknown as InvoiceRow) : undefined;
}

export async function getInvoicesByCustomerId(customerId: string): Promise<Invoice[]> {
  const { data, error } = await db()
    .from('invoices')
    .select(INVOICE_SELECT)
    .eq('customer_id', customerId)
    .order('date', { ascending: false });

  if (error) throw new Error(`Could not load invoices: ${error.message}`);
  return (data as unknown as InvoiceRow[]).map(toInvoice);
}

/**
 * Previews the next invoice number without consuming it, so opening a customer
 * page and leaving doesn't punch a gap in the numbering. UNIQUE on
 * invoice_number is what actually prevents a duplicate landing.
 */
export async function generateInvoiceNumber(): Promise<string> {
  const { data, error } = await db()
    .from('invoices')
    .select('invoice_number')
    .order('invoice_number', { ascending: false })
    .limit(1);

  if (error) throw new Error(`Could not generate an invoice number: ${error.message}`);

  const latest = (data as unknown as { invoice_number: string }[])[0]?.invoice_number;
  const highest = latest ? Number(latest.match(/(\d+)$/)?.[1] ?? 0) : 0;

  return `INV-${String(highest + 1).padStart(5, '0')}`;
}

/**
 * Writes an invoice and its line items atomically, and returns it with the
 * money the database calculated — subtotal and totalDue are recomputed there
 * from the line items rather than trusted from the caller.
 */
export async function saveInvoice(invoice: Invoice): Promise<Invoice> {
  const { error } = await db().rpc('save_invoice', {
    payload: {
      id: invoice.id,
      invoice_number: invoice.invoiceNumber,
      customer_id: invoice.customerId,
      customer_name: invoice.customerName,
      customer_address: invoice.customerAddress,
      customer_city: invoice.customerCity,
      date: invoice.date,
      notes: invoice.notes,
      discount: invoice.discount,
      status: invoice.status,
      created_at: invoice.createdAt,
      items: invoice.items.map((item) => ({
        fruit: item.fruit,
        description: item.description ?? null,
        quantity: item.quantity,
        price_per_box: item.pricePerBox,
      })),
    },
  });

  if (error) throw new Error(`Could not save invoice: ${error.message}`);

  const saved = await getInvoiceById(invoice.id);
  if (!saved) throw new Error('Invoice saved but could not be read back.');
  return saved;
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
  const { error } = await db().from('invoices').delete().eq('id', invoiceId);
  if (error) throw new Error(`Could not delete invoice: ${error.message}`);
}

// --- sent emails ------------------------------------------------------------

type SentEmailRow = {
  id: string;
  invoice_id: string | null;
  customer_id: string | null;
  invoice_number: string;
  customer_name: string;
  recipient: string;
  message: string | null;
  total_due: number | string;
  invoice: unknown;
  status: 'sent' | 'failed';
  error: string | null;
  provider_id: string | null;
  sent_at: string;
};

/**
 * The stored snapshot is whatever the API route validated at send time, which
 * carries no database ids for its line items and may predate fields added
 * later. Filling the gaps here means the rest of the app — including the PDF
 * generator, which re-renders these on a re-send — can treat it as a normal
 * Invoice instead of a special case.
 */
function toEmailedInvoice(raw: unknown, row: SentEmailRow): Invoice {
  const snapshot = (raw ?? {}) as Partial<Invoice> & { items?: Partial<InvoiceItem>[] };

  return {
    id: snapshot.id ?? row.invoice_id ?? '',
    invoiceNumber: snapshot.invoiceNumber ?? row.invoice_number,
    customerId: snapshot.customerId ?? row.customer_id ?? '',
    customerName: snapshot.customerName ?? row.customer_name,
    customerAddress: snapshot.customerAddress ?? '',
    customerCity: snapshot.customerCity ?? '',
    date: snapshot.date ?? row.sent_at.slice(0, 10),
    notes: snapshot.notes ?? '',
    items: (snapshot.items ?? []).map((item, index) => ({
      id: item.id ?? `${row.id}-${index}`,
      fruit: item.fruit ?? '',
      description: item.description,
      quantity: Number(item.quantity ?? 0),
      pricePerBox: Number(item.pricePerBox ?? 0),
      amount: Number(item.amount ?? 0),
    })),
    subtotal: Number(snapshot.subtotal ?? 0),
    discount: Number(snapshot.discount ?? 0),
    totalDue: Number(snapshot.totalDue ?? row.total_due),
    status: snapshot.status ?? 'unpaid',
    createdAt: snapshot.createdAt ?? row.sent_at,
    updatedAt: snapshot.updatedAt ?? row.sent_at,
  };
}

function toSentEmail(row: SentEmailRow, places: Map<string, string>): SentEmail {
  return {
    id: row.id,
    invoiceId: row.invoice_id ?? undefined,
    customerId: row.customer_id ?? undefined,
    invoiceNumber: row.invoice_number,
    place: (row.customer_id ? places.get(row.customer_id) : undefined) ?? row.customer_name,
    customerName: row.customer_name,
    recipient: row.recipient,
    message: row.message ?? undefined,
    totalDue: num(row.total_due),
    invoice: toEmailedInvoice(row.invoice, row),
    status: row.status,
    error: row.error ?? undefined,
    providerId: row.provider_id ?? undefined,
    sentAt: row.sent_at,
  };
}

export async function getSentEmails(): Promise<SentEmail[]> {
  const { data, error } = await db()
    .from('sent_emails')
    .select('*')
    .order('sent_at', { ascending: false });

  if (error) throw new Error(`Could not load sent emails: ${error.message}`);

  const rows = data as unknown as SentEmailRow[];

  // Looked up rather than stored so renaming a customer retitles their past
  // emails too. customer_id is deliberately not a foreign key (see schema.sql),
  // so PostgREST cannot join these for us — hence the second query.
  const ids = [...new Set(rows.map((row) => row.customer_id).filter((id): id is string => !!id))];
  const places = new Map<string, string>();

  if (ids.length > 0) {
    const { data: customers, error: customerError } = await db()
      .from('customers')
      .select('id, name')
      .in('id', ids);

    // A missing name only costs the nicer title — each row falls back to the
    // name stored at send time, so the log still lists everything.
    if (customerError) {
      console.error('Could not load customer names for the email log:', customerError.message);
    } else {
      for (const customer of customers as { id: string; name: string }[]) {
        places.set(customer.id, customer.name);
      }
    }
  }

  return rows.map((row) => toSentEmail(row, places));
}

export async function recordSentEmail(input: {
  invoice: Invoice;
  recipient: string;
  message?: string;
  status: 'sent' | 'failed';
  error?: string;
  providerId?: string;
}): Promise<void> {
  const { error } = await db()
    .from('sent_emails')
    .insert({
      invoice_id: input.invoice.id || null,
      customer_id: input.invoice.customerId || null,
      invoice_number: input.invoice.invoiceNumber,
      customer_name: input.invoice.customerName,
      recipient: input.recipient,
      message: input.message ?? null,
      total_due: input.invoice.totalDue,
      invoice: input.invoice,
      status: input.status,
      error: input.error ?? null,
      provider_id: input.providerId ?? null,
    });

  if (error) throw new Error(`Could not record the sent email: ${error.message}`);
}

export async function deleteSentEmail(id: string): Promise<void> {
  const { error } = await db().from('sent_emails').delete().eq('id', id);
  if (error) throw new Error(`Could not delete the email record: ${error.message}`);
}

// --- costs ------------------------------------------------------------------

type CostRow = {
  id: string;
  date: string;
  all_amount: number | string;
  cargo_amount: number | string;
  goods_cost: number | string;
  airline_fee: number | string;
  broker_fee: number | string;
  final_amount: number | string;
  have_to_pay: number | string;
  created_at: string;
  updated_at: string;
  // One entry per store the cost is split across. The name comes through the
  // link rather than being copied, so a renamed store retitles its costs.
  cost_stores?: { store_id: string; customers?: { name: string } | null }[];
};

const COST_SELECT = '*, cost_stores(store_id, customers(name))';

function toCost(row: CostRow): Cost {
  // Sorted by name so a cost's stores read the same way every time, rather
  // than in whatever order the rows came back.
  const links = [...(row.cost_stores ?? [])].sort((a, b) =>
    (a.customers?.name ?? '').localeCompare(b.customers?.name ?? '')
  );

  return {
    id: row.id,
    storeIds: links.map((link) => link.store_id),
    // The store is a real foreign key, so the join always has a row to find —
    // the fallback only exists so a missing name can't blank out the record.
    storeNames: links.map((link) => link.customers?.name ?? 'Unknown store'),
    date: row.date,
    allAmount: num(row.all_amount),
    cargoAmount: num(row.cargo_amount),
    goodsCost: num(row.goods_cost),
    airlineFee: num(row.airline_fee),
    brokerFee: num(row.broker_fee),
    finalAmount: num(row.final_amount),
    haveToPay: num(row.have_to_pay),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getCosts(): Promise<Cost[]> {
  const { data, error } = await db()
    .from('costs')
    .select(COST_SELECT)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Could not load costs: ${error.message}`);
  return (data as unknown as CostRow[]).map(toCost);
}

export async function getCostById(id: string): Promise<Cost | undefined> {
  const { data, error } = await db().from('costs').select(COST_SELECT).eq('id', id).maybeSingle();

  if (error) throw new Error(`Could not load the cost: ${error.message}`);
  return data ? toCost(data as unknown as CostRow) : undefined;
}

/**
 * Writes a cost and its store links atomically — see save_cost in schema.sql
 * for why this goes through a database function rather than two inserts.
 */
export async function addCost(input: {
  storeIds: string[];
  date: string;
  allAmount: number;
  cargoAmount: number;
  goodsCost: number;
  airlineFee: number;
  brokerFee: number;
  finalAmount: number;
  haveToPay: number;
}): Promise<Cost> {
  const { data, error } = await db().rpc('save_cost', {
    payload: {
      store_ids: input.storeIds,
      date: input.date,
      all_amount: input.allAmount,
      cargo_amount: input.cargoAmount,
      goods_cost: input.goodsCost,
      airline_fee: input.airlineFee,
      broker_fee: input.brokerFee,
      final_amount: input.finalAmount,
      have_to_pay: input.haveToPay,
    },
  });

  if (error) {
    // 23503 = foreign key violation: a store id doesn't match a customer.
    if (error.code === '23503') {
      throw new Error('One of those stores is no longer in your list, so the cost was not saved.');
    }
    throw new Error(`Could not save the cost: ${error.message}`);
  }

  const saved = await getCostById(data as unknown as string);
  if (!saved) throw new Error('Cost saved but could not be read back.');
  return saved;
}

export async function deleteCost(id: string): Promise<void> {
  const { error } = await db().from('costs').delete().eq('id', id);
  if (error) throw new Error(`Could not delete the cost: ${error.message}`);
}
