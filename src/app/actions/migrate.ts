'use server';

import 'server-only';
import { revalidatePath } from 'next/cache';
import { Customer, Invoice } from '@/types';
import { verifySession } from '@/lib/dal';
import * as db from '@/lib/db';

/**
 * One-time import of the data the app used to keep in localStorage.
 *
 * Only the browser that created those invoices can read them, so the page at
 * /migrate hands them here. Existing rows are left alone, which makes this safe
 * to run more than once — and safe to run from a second device that has its own
 * separate pile of browser invoices.
 */

export type MigrationResult = {
  customersAdded: number;
  customersSkipped: number;
  invoicesAdded: number;
  invoicesSkipped: number;
  errors: string[];
};

export async function importBrowserData(payload: {
  customers: Customer[];
  invoices: Invoice[];
}): Promise<MigrationResult> {
  await verifySession();

  const result: MigrationResult = {
    customersAdded: 0,
    customersSkipped: 0,
    invoicesAdded: 0,
    invoicesSkipped: 0,
    errors: [],
  };

  // Customers first: invoices reference them, and the FK would reject an
  // invoice whose customer isn't there yet.
  const existingCustomers = new Set((await db.getCustomers()).map((c) => c.id));

  for (const customer of payload.customers ?? []) {
    if (existingCustomers.has(customer.id)) {
      result.customersSkipped++;
      continue;
    }

    try {
      await db.importCustomer(customer);
      existingCustomers.add(customer.id);
      result.customersAdded++;
    } catch (error) {
      result.errors.push(
        `Customer "${customer.name}": ${error instanceof Error ? error.message : 'failed'}`
      );
    }
  }

  const existingInvoices = new Set((await db.getInvoices()).map((i) => i.id));

  for (const invoice of payload.invoices ?? []) {
    if (existingInvoices.has(invoice.id)) {
      result.invoicesSkipped++;
      continue;
    }

    // An invoice whose customer was deleted from the browser list would fail the
    // foreign key. It carries its own name/city snapshot, so recreate the
    // customer from that rather than drop a real invoice on the floor.
    if (!existingCustomers.has(invoice.customerId)) {
      try {
        await db.importCustomer({
          id: invoice.customerId,
          name: invoice.customerName || 'Unknown customer',
          city: invoice.customerCity || '',
          address: invoice.customerAddress || undefined,
        });
        existingCustomers.add(invoice.customerId);
        result.customersAdded++;
      } catch (error) {
        result.errors.push(
          `Invoice ${invoice.invoiceNumber}: could not recreate its customer — ${
            error instanceof Error ? error.message : 'failed'
          }`
        );
        continue;
      }
    }

    try {
      await db.saveInvoice(invoice);
      result.invoicesAdded++;
    } catch (error) {
      result.errors.push(
        `Invoice ${invoice.invoiceNumber}: ${error instanceof Error ? error.message : 'failed'}`
      );
    }
  }

  revalidatePath('/');
  revalidatePath('/dashboard');
  revalidatePath('/invoices');

  return result;
}
