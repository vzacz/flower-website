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
