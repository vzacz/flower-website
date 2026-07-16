import { redirect } from 'next/navigation';

// Hidden until routes are backed by real data. The previous page invented its
// own stops, distances, and ETAs, none of which came from saved invoices.
export default function DeliveryRoutesPage() {
  redirect('/invoices');
}
