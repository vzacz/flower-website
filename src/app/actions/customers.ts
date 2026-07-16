'use server';

import 'server-only';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Customer } from '@/types';
import { verifySession } from '@/lib/dal';
import * as db from '@/lib/db';

export type CustomerFormState = { error?: string };

export async function listCustomers(): Promise<Customer[]> {
  await verifySession();
  return db.getCustomers();
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  await verifySession();
  return db.getCustomerById(id);
}

const CustomerInput = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  city: z.string().trim().min(1, 'Location is required.'),
  address: z.string().trim().optional(),
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
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  }

  try {
    await db.addCustomer(parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not add customer.' };
  }

  revalidatePath('/');
  revalidatePath('/dashboard');
  return {};
}

export async function deleteCustomer(id: string): Promise<CustomerFormState> {
  await verifySession();

  try {
    await db.deleteCustomer(id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not delete customer.' };
  }

  revalidatePath('/');
  revalidatePath('/dashboard');
  return {};
}
