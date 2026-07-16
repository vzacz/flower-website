'use server';

import 'server-only';
import { revalidatePath } from 'next/cache';
import { Invoice } from '@/types';
import { verifySession } from '@/lib/dal';
import * as db from '@/lib/db';

/**
 * The invoice editor is a Client Component that holds a whole invoice in state,
 * so it reaches the database through these rather than by rendering on the
 * server. Each one re-checks the session: Server Actions are POST endpoints and
 * can be called without going through the UI.
 */

export async function listInvoices(): Promise<Invoice[]> {
  await verifySession();
  return db.getInvoices();
}

export async function getInvoice(id: string): Promise<Invoice | undefined> {
  await verifySession();
  return db.getInvoiceById(id);
}

export async function listInvoicesByCustomer(customerId: string): Promise<Invoice[]> {
  await verifySession();
  return db.getInvoicesByCustomerId(customerId);
}

export async function nextInvoiceNumber(): Promise<string> {
  await verifySession();
  return db.generateInvoiceNumber();
}

export async function saveInvoice(invoice: Invoice): Promise<Invoice> {
  await verifySession();

  const saved = await db.saveInvoice(invoice);

  revalidatePath('/dashboard');
  revalidatePath('/invoices');
  revalidatePath(`/invoice/${invoice.customerId}`);

  return saved;
}

export async function deleteInvoice(invoiceId: string): Promise<void> {
  await verifySession();

  await db.deleteInvoice(invoiceId);

  revalidatePath('/dashboard');
  revalidatePath('/invoices');
}
