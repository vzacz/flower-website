import { redirect } from 'next/navigation';

// Creating an order means creating an invoice, and an invoice needs a customer
// to belong to — so this lands on the customer picker.
export default function NewOrderPage() {
  redirect('/');
}
