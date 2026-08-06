// Customer types
export type CustomerKind = 'store' | 'solo';

export interface Customer {
  id: string;
  name: string;
  city: string;

  // Which list they belong to. Invoicing is identical either way.
  kind: CustomerKind;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Fruit/Product types
export interface Fruit {
  id: string;
  name: string;
  price?: number;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  unit?: string;
  created_at?: string;
  updated_at?: string;
}

// Invoice Item types
export interface InvoiceItem {
  id: string;
  fruit: string;
  description?: string;
  quantity: number;
  pricePerBox: number;
  amount: number;
}

// Sent email types
//
// One row per attempt to email an invoice, successful or not. `invoice` is the
// invoice as it was at the moment of sending — a snapshot, not a live lookup —
// so the log keeps telling the truth after the invoice is edited or deleted.
export interface SentEmail {
  id: string;
  invoiceId?: string;
  customerId?: string;
  invoiceNumber: string;

  // The business the invoice belongs to, read from the customer record at list
  // time — "Ayyar South San Francisco". The invoice's own name field is who the
  // invoice was made out to and is often a person, so it can't stand in for the
  // place. Falls back to `customerName` when the customer has been deleted.
  place: string;

  // Whoever the invoice was addressed to, exactly as typed at send time.
  customerName: string;
  recipient: string;
  message?: string;
  totalDue: number;
  invoice: Invoice;
  status: 'sent' | 'failed';
  error?: string;
  providerId?: string;
  sentAt: string;
}

// Cost types
//
// One row per load's costs — the money going out, not the money invoiced in.
// Every amount is entered by hand, `allAmount` included: it is what the load
// came to overall, not a total the app works out from the four beneath it.
export interface Cost {
  id: string;

  // A cost can cover several stores at once — one load split between them.
  storeIds: string[];

  // Read live from the store records, so renaming a store retitles its costs.
  // Same order as storeIds.
  storeNames: string[];

  date: string;
  allAmount: number;
  cargoAmount: number;
  goodsCost: number;
  airlineFee: number;
  brokerFee: number;

  // Both are filled in from the five above as the form is typed, and both can
  // be typed over — so they are what was entered, not what the app worked out.
  finalAmount: number;
  haveToPay: number;

  createdAt: string;
  updatedAt: string;
}

// Invoice types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerCity: string;
  date: string;
  notes: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  totalDue: number;
  status: 'unpaid' | 'paid';
  createdAt: string;
  updatedAt: string;
}
