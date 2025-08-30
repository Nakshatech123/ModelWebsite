// middleware.js
import { NextResponse } from 'next/server'

export function middleware(request) {
  // Get the token from the user's cookies
  const token = request.cookies.get('auth_token')?.value

  const { pathname } = request.nextUrl

  // If the user has a token and tries to access login/register, redirect to dashboard
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If the user has no token and tries to access a protected route, redirect to login
  if (!token && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Allow the request to proceed
  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
}