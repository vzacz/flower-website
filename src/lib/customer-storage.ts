import { Customer } from '@/types';

const CUSTOMERS_STORAGE_KEY = 'la_fruta_customers';

// Seeded on first load. The invoice page reads customers from here too, so a
// customer added on the homepage opens the same invoice layout as these do.
const SEED_CUSTOMERS: Customer[] = [
  { id: '1', name: 'El Chaparral', city: 'San Jose', address: '123 Main Street' },
  { id: '2', name: 'Mi Ranchito Sunnyvale', city: 'Sunnyvale', address: '456 Sunnyvale Ave' },
  { id: '3', name: 'Mi Ranchito Market San Jose', city: 'San Jose', address: '789 Market Blvd' },
  { id: '4', name: 'Olala Campbell', city: 'Campbell', address: '101 Orchard Lane' },
  { id: '5', name: 'Ayyar South San Francisco', city: 'South San Francisco', address: '202 Bay Street' },
  { id: '6', name: "Mina's Cafe Foster City", city: 'Foster City', address: '303 Cafe Plaza' },
  { id: '7', name: 'La Prada San Jose', city: 'San Jose', address: '404 Garden Road' },
];

export function getCustomers(): Customer[] {
  if (typeof window === 'undefined') return SEED_CUSTOMERS;

  const stored = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(SEED_CUSTOMERS));
    return SEED_CUSTOMERS;
  }

  try {
    return JSON.parse(stored) as Customer[];
  } catch {
    return SEED_CUSTOMERS;
  }
}

export function getCustomerById(id: string): Customer | undefined {
  return getCustomers().find((customer) => customer.id === id);
}

export function addCustomer(input: {
  name: string;
  city: string;
  address?: string;
  email?: string;
  phone?: string;
  notes?: string;
}): Customer {
  const customers = getCustomers();
  const now = new Date().toISOString();

  const customer: Customer = {
    ...input,
    id: `c${Date.now()}`,
    created_at: now,
    updated_at: now,
  };

  localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify([...customers, customer]));
  return customer;
}

export function deleteCustomer(id: string): void {
  const remaining = getCustomers().filter((customer) => customer.id !== id);
  localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(remaining));
}
