'use server';

import 'server-only';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Customer, CustomerKind } from '@/types';
import { verifySession } from '@/lib/dal';
import * as db from '@/lib/db';

// customerId comes back on a successful create so the caller can go straight
// to the new customer's invoice instead of hunting for them in a list.
export type CustomerFormState = { error?: string; customerId?: string };

/** Pass 'store' or 'solo' for one list, or nothing for everybody. */
export async function listCustomers(kind?: CustomerKind): Promise<Customer[]> {
  await verifySession();
  return db.getCustomers(kind);
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  await verifySession();
  return db.getCustomerById(id);
}

const CustomerInput = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  city: z.string().trim().min(1, 'Location is required.'),
  address: z.string().trim().optional(),
  // Anything that doesn't say otherwise is a store, which is what every
  // customer was before solo customers existed.
  kind: z.enum(['store', 'solo']).optional(),
});

export async function createCustomer(
  _prevState: CustomerFormState,
  formData: FormData
): Promise<CustomerFormState> {
  // Server Actions accept direct POSTs, so the session is re-checked here and
  // not left to the proxy.
  await verifySession();

  const parsed = CustomerInput.safeParse({
    name: formData.get('name'),
    city: formData.get('city'),
    address: formData.get('address'),
    kind: formData.get('kind') ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  }

  let created;
  try {
    created = await db.addCustomer(parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not add customer.' };
  }

  revalidatePath('/');
  revalidatePath('/solo');
  revalidatePath('/dashboard');
  return { customerId: created.id };
}

/**
 * Creates the customer behind a solo invoice, from what was typed on the
 * invoice itself.
 *
 * Separate from createCustomer because that one is the store form and insists
 * on a location — reasonable for a shop on the delivery round, wrong for a
 * person being billed once, where the name may be all there is.
 */
const SoloInput = z.object({
  name: z.string().trim().min(1, 'Enter the customer name before saving.'),
  city: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export async function createSoloCustomer(input: {
  name: string;
  city?: string;
  address?: string;
}): Promise<CustomerFormState> {
  await verifySession();

  const parsed = SoloInput.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the customer details.' };
  }

  try {
    const created = await db.addCustomer({
      name: parsed.data.name,
      city: parsed.data.city ?? '',
      address: parsed.data.address,
      kind: 'solo',
    });

    revalidatePath('/solo/list');
    revalidatePath('/dashboard');
    return { customerId: created.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not save this customer.' };
  }
}

export async function deleteCustomer(id: string): Promise<CustomerFormState> {
  await verifySession();

  try {
    await db.deleteCustomer(id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not delete customer.' };
  }

  revalidatePath('/');
  revalidatePath('/solo');
  revalidatePath('/dashboard');
  return {};
}
