import { Invoice } from '@/types';

/**
 * Pure invoice arithmetic — no storage, no network.
 *
 * The editor builds an invoice up in local state and only persists on save, so
 * these run in the browser. The database recomputes subtotal and totalDue on
 * write regardless; what's computed here is for display until then.
 */

export function calculateTotals(invoice: Invoice): Invoice {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  const totalDue = Math.max(0, subtotal - invoice.discount);

  return {
    ...invoice,
    subtotal,
    totalDue,
    updatedAt: new Date().toISOString(),
  };
}

export function createNewInvoice(
  invoiceNumber: string,
  customerId: string,
  customerName: string,
  customerCity: string,
  customerAddress = '',
  notes = ''
): Invoice {
  return {
    id: crypto.randomUUID(),
    invoiceNumber,
    customerId,
    customerName,
    customerAddress,
    customerCity,
    date: new Date().toISOString().split('T')[0],
    notes,
    items: [],
    subtotal: 0,
    discount: 0,
    totalDue: 0,
    status: 'unpaid',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function addInvoiceItem(
  invoice: Invoice,
  fruit: string,
  description: string | undefined,
  quantity: number,
  pricePerBox: number
): Invoice {
  const item = {
    id: crypto.randomUUID(),
    fruit,
    description,
    quantity,
    pricePerBox,
    amount: quantity * pricePerBox,
  };

  return calculateTotals({
    ...invoice,
    items: [...invoice.items, item],
  });
}

export function removeInvoiceItem(invoice: Invoice, itemId: string): Invoice {
  return calculateTotals({
    ...invoice,
    items: invoice.items.filter((item) => item.id !== itemId),
  });
}

export function updateInvoiceItem(
  invoice: Invoice,
  itemId: string,
  description: string | undefined,
  quantity: number,
  pricePerBox: number
): Invoice {
  const updatedItems = invoice.items.map((item) =>
    item.id === itemId
      ? { ...item, description, quantity, pricePerBox, amount: quantity * pricePerBox }
      : item
  );

  return calculateTotals({ ...invoice, items: updatedItems });
}

export function markInvoiceAsPaid(invoice: Invoice): Invoice {
  return { ...invoice, status: 'paid', updatedAt: new Date().toISOString() };
}

export function markInvoiceAsUnpaid(invoice: Invoice): Invoice {
  return { ...invoice, status: 'unpaid', updatedAt: new Date().toISOString() };
}
