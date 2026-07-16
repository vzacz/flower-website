import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Customer, Invoice, InvoiceItem } from '@/types';

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

// --- customers --------------------------------------------------------------

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await db().from('customers').select('*').order('name');
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
