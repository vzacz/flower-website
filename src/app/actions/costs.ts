'use server';

import 'server-only';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Cost } from '@/types';
import { verifySession } from '@/lib/dal';
import * as db from '@/lib/db';

/**
 * The costs page is a Client Component, so it reaches the database through
 * these. Each one re-checks the session: Server Actions are POST endpoints and
 * can be called without going through the UI.
 */

export type CostFormState = { error?: string };

export async function listCosts(): Promise<Cost[]> {
  await verifySession();
  return db.getCosts();
}

// Empty money fields mean "nothing for this one", not a validation error — most
// loads won't have all four. Anything that isn't a number is still refused
// rather than quietly counted as zero.
//
// Negatives are allowed on purpose: money comes back as well as goes out, and
// a credit or refund is entered as a minus.
const money = z
  .string()
  .trim()
  .transform((value) => (value === '' ? 0 : Number(value)))
  .refine(Number.isFinite, 'Amounts have to be numbers.')
  .refine((value) => Math.abs(value) <= 99_999_999, 'That amount is too large.');

const CostInput = z.object({
  storeIds: z
    .array(z.string().trim().min(1))
    .min(1, 'Pick at least one store.')
    // The same store ticked twice would be one link either way — the primary
    // key on cost_stores collapses it — but sending it once keeps the payload
    // honest about what was chosen.
    .transform((ids) => [...new Set(ids)]),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date.'),
  allAmount: money,
  cargoAmount: money,
  goodsCost: money,
  airlineFee: money,
  brokerFee: money,
  finalAmount: money,
  haveToPay: money,
});

export async function createCost(formData: FormData): Promise<CostFormState> {
  await verifySession();

  const parsed = CostInput.safeParse({
    // getAll, not get: the store checkboxes all share one name.
    storeIds: formData.getAll('storeIds'),
    date: formData.get('date'),
    allAmount: formData.get('allAmount'),
    cargoAmount: formData.get('cargoAmount'),
    goodsCost: formData.get('goodsCost'),
    airlineFee: formData.get('airlineFee'),
    brokerFee: formData.get('brokerFee'),
    finalAmount: formData.get('finalAmount'),
    haveToPay: formData.get('haveToPay'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  }

  try {
    await db.addCost(parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not save the cost.' };
  }

  revalidatePath('/costs');
  return {};
}

export async function deleteCost(id: string): Promise<CostFormState> {
  await verifySession();

  try {
    await db.deleteCost(id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Could not delete the cost.' };
  }

  revalidatePath('/costs');
  return {};
}
