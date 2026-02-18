import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware to protect routes
export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('aktivitus-auth');
  const { pathname } = request.nextUrl;

  // Public routes (allow without auth)
  if (pathname === '/login') {
    // If already authenticated, redirect to dashboard
    if (authCookie?.value === 'authenticated') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes (require auth)
  if (pathname.startsWith('/dashboard')) {
    if (!authCookie || authCookie.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
