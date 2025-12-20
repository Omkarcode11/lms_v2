import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ['/', '/auth/signin', '/auth/signup'];
  const isPublicRoute = publicRoutes.some((route) => pathname === route) || 
                       pathname.startsWith('/api/auth') ||
                       pathname.startsWith('/courses');

  // API routes protection
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Protected routes
  if (!isPublicRoute && !token) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Admin routes
  if (pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Instructor routes
  if (pathname.startsWith('/instructor') && token?.role !== 'INSTRUCTOR' && token?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/instructor/:path*',
    '/api/:path*',
  ],
};

