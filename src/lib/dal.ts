import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

/**
 * Authoritative session check. The proxy only does an optimistic cookie read,
 * so every protected page, Server Action, and Route Handler must call this.
 */
export const verifySession = cache(async () => {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  return { isAuth: true as const, user: session.user };
});
