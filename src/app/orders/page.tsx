import { redirect } from 'next/navigation';

// An invoice is the order: it already carries the customer, the fruit line
// items, and the paid/unpaid status. Orders lived here as a separate mock list
// that nothing wrote to, so the route now points at the real thing.
export default function OrdersPage() {
  redirect('/invoices');
}
