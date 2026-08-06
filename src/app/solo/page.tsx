import { redirect } from 'next/navigation';

/**
 * "Solo customers" means "bill someone who isn't a store", so it opens a blank
 * invoice rather than a list to pick from — the customer is created from the
 * name typed on that invoice. Past solo customers live at /solo/list.
 */
export default function SoloPage() {
  redirect('/invoice/new');
}
