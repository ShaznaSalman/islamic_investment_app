import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const OWNER_ONLY = ['/investments/new', '/recipients', '/reports', '/calculator'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  const isAuthPage = pathname === '/login' || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password');
  const isDashboard = !pathname.startsWith('/api') && !pathname.startsWith('/_next') && pathname !== '/' && !isAuthPage;

  if (isDashboard && !token) {
    const login = new URL('/login', request.url);
    login.searchParams.set('from', pathname);
    return NextResponse.redirect(login);
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads).*)'],
};
