import { Invoice } from '@/types';

const INVOICES_STORAGE_KEY = 'la_fruta_invoices';

export function getInvoices(): Invoice[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(INVOICES_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getInvoiceById(id: string): Invoice | undefined {
  const invoices = getInvoices();
  return invoices.find(inv => inv.id === id);
}

export function getInvoicesByCustomerId(customerId: string): Invoice[] {
  const invoices = getInvoices();
  return invoices.filter(inv => inv.customerId === customerId);
}

function calculateTotals(invoice: Invoice): Invoice {
  const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  const totalDue = Math.max(0, subtotal - invoice.discount);

  return {
    ...invoice,
    subtotal,
    totalDue,
    updatedAt: new Date().toISOString(),
  };
}

export function saveInvoice(invoice: Invoice): Invoice {
  const invoices = getInvoices();
  const existingIndex = invoices.findIndex(inv => inv.id === invoice.id);
  const invoiceToSave = calculateTotals(invoice);

  if (existingIndex >= 0) {
    invoices[existingIndex] = invoiceToSave;
  } else {
    invoices.push(invoiceToSave);
  }

  localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
  return invoiceToSave;
}

export function deleteInvoice(invoiceId: string): void {
  const invoices = getInvoices().filter(inv => inv.id !== invoiceId);
  localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
}

export function generateInvoiceNumber(): string {
  const invoices = getInvoices();
  const lastNumber = invoices.reduce((max, current) => {
    const match = current.invoiceNumber.match(/(\d+)$/);
    const value = match ? parseInt(match[1], 10) : 0;
    return Math.max(max, value);
  }, 0);

  const newNumber = String(lastNumber + 1).padStart(5, '0');
  return `INV-${newNumber}`;
}

export function createNewInvoice(
  customerId: string,
  customerName: string,
  customerCity: string,
  customerAddress = '',
  notes = ''
): Invoice {
  return {
    id: Date.now().toString(),
    invoiceNumber: generateInvoiceNumber(),
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
    id: Date.now().toString(),
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
    items: invoice.items.filter(item => item.id !== itemId),
  });
}

export function updateInvoiceItem(
  invoice: Invoice,
  itemId: string,
  description: string | undefined,
  quantity: number,
  pricePerBox: number
): Invoice {
  const updatedItems = invoice.items.map(item =>
    item.id === itemId
      ? {
          ...item,
          description,
          quantity,
          pricePerBox,
          amount: quantity * pricePerBox,
        }
      : item
  );

  return calculateTotals({
    ...invoice,
    items: updatedItems,
  });
}

export function markInvoiceAsPaid(invoice: Invoice): Invoice {
  return {
    ...invoice,
    status: 'paid',
    updatedAt: new Date().toISOString(),
  };
}

export function markInvoiceAsUnpaid(invoice: Invoice): Invoice {
  return {
    ...invoice,
    status: 'unpaid',
    updatedAt: new Date().toISOString(),
  };
}
