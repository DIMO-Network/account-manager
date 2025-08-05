import type { NextFetchEvent, NextRequest } from 'next/server';
import { detectBot } from '@arcjet/next';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import arcjet from '@/libs/Arcjet';
import { isAuthenticated, redirectToSignIn } from '@/libs/MiddlewareAuth';
import { AppConfig } from '@/utils/AppConfig';
import { routing } from './libs/i18nRouting';

const handleI18nRouting = createMiddleware(routing);

// Route matchers
const isProtectedRoute = (pathname: string) => {
  const protectedPatterns = [
    /^\/dashboard/,
    /^\/[a-z]{2}\/dashboard/,
    /^\/subscriptions/,
    /^\/[a-z]{2}\/subscriptions/,
    /^\/payment-methods/,
    /^\/[a-z]{2}\/payment-methods/,
  ];
  return protectedPatterns.some(pattern => pattern.test(pathname));
};

const isAuthPage = (pathname: string) => {
  const authPatterns = [
    /^\/sign-in/,
    /^\/[a-z]{2}\/sign-in/,
  ];
  return authPatterns.some(pattern => pattern.test(pathname));
};

const isProtectedApiRoute = (pathname: string) => {
  const protectedApiPatterns = [
    /^\/api\/stripe\/customer/,
    /^\/api\/payment-methods/,
    /^\/api\/subscriptions/,
    /^\/api\/subscription-schedules/,
  ];
  return protectedApiPatterns.some(pattern => pattern.test(pathname));
};

const isApiRoute = (pathname: string) => {
  return pathname.startsWith('/api/');
};

// Improve security with Arcjet
const aj = arcjet.withRule(
  detectBot({
    mode: 'LIVE',
    allow: [
      'CATEGORY:SEARCH_ENGINE',
      'CATEGORY:PREVIEW',
      'CATEGORY:MONITOR',
    ],
  }),
);

export default async function middleware(
  request: NextRequest,
  _event: NextFetchEvent,
) {
  const pathname = request.nextUrl.pathname;

  // Verify the request with Arcjet
  if (process.env.ARCJET_KEY) {
    const decision = await aj.protect(request);

    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Handle API routes - apply custom authentication
  if (isApiRoute(pathname)) {
    if (isProtectedApiRoute(pathname)) {
      const authenticated = await isAuthenticated(request);
      if (!authenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    return NextResponse.next();
  }

  // Handle protected routes with custom authentication
  if (isProtectedRoute(pathname)) {
    const authenticated = await isAuthenticated(request);
    if (!authenticated) {
      const locale = pathname.match(/(\/.*)\/dashboard/)?.at(1) ?? `/${AppConfig.defaultLocale}`;
      return redirectToSignIn(request, locale.replace('/', ''));
    }
    return handleI18nRouting(request);
  }

  // Handle auth pages
  if (isAuthPage(pathname)) {
    return handleI18nRouting(request);
  }

  // Apply i18n routing to non-API routes
  return handleI18nRouting(request);
}

export const config = {
  // Match all pathnames except for
  matcher: '/((?!_next|_vercel|monitoring|.*\\..*).*)',
};
