'use server';

import 'server-only';
import { revalidatePath } from 'next/cache';
import { SentEmail } from '@/types';
import { verifySession } from '@/lib/dal';
import * as db from '@/lib/db';

/**
 * The email log is read by a Client Component, so it reaches the database
 * through these. Each one re-checks the session: Server Actions are POST
 * endpoints and can be called without going through the UI.
 */

export async function listSentEmails(): Promise<SentEmail[]> {
  await verifySession();
  return db.getSentEmails();
}

export async function deleteSentEmail(id: string): Promise<void> {
  await verifySession();

  await db.deleteSentEmail(id);

  revalidatePath('/emails');
}
