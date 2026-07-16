import { NextResponse, type NextRequest } from 'next/server';
import { decrypt, SESSION_COOKIE } from '@/lib/session';

const PUBLIC_ROUTES = ['/login'];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.includes(path);

  // Optimistic check only — reads the cookie, never the database.
  // Pages and Server Actions re-verify via verifySession() in the DAL.
  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session?.user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (session?.user && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
