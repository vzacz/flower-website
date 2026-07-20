// Customer types
export interface Customer {
  id: string;
  name: string;
  city: string;
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
