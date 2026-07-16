import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'la_fruta_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionPayload = {
  user: string;
  expiresAt: number;
};

function getEncodedKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not set. Generate one with: openssl rand -base64 32');
  }
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getEncodedKey());
}

export async function decrypt(session?: string): Promise<SessionPayload | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, getEncodedKey(), {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(user: string): Promise<void> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const session = await encrypt({ user, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(expiresAt),
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return decrypt(cookieStore.get(SESSION_COOKIE)?.value);
}

export { SESSION_COOKIE };
