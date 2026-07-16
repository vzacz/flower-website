'use server';

import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { redirect } from 'next/navigation';
import { createSession, deleteSession } from '@/lib/session';

export type LoginState = { error?: string };

function passwordMatches(candidate: string, expected: string): boolean {
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get('password');
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return { error: 'Server is missing ADMIN_PASSWORD. Contact your administrator.' };
  }

  if (typeof password !== 'string' || !passwordMatches(password, expected)) {
    return { error: 'Incorrect password.' };
  }

  await createSession('admin');
  redirect('/dashboard');
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect('/login');
}
