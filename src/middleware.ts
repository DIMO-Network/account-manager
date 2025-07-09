import type { NextFetchEvent, NextRequest } from 'next/server';
import { detectBot } from '@arcjet/next';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import arcjet from '@/libs/Arcjet';
import { routing } from './libs/i18nRouting';

const handleI18nRouting = createMiddleware(routing);

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/:locale/dashboard(.*)',
  '/subscriptions(.*)',
  '/:locale/subscriptions(.*)',
  '/vehicles(.*)',
  '/:locale/vehicles(.*)',
]);

const isAuthPage = createRouteMatcher([
  '/sign-in(.*)',
  '/:locale/sign-in(.*)',
]);

const isProtectedApiRoute = createRouteMatcher([
  '/api/stripe/customer',
  '/api/payment-methods',
  '/api/subscriptions',
  '/api/subscriptions/(.*)',
  '/api/subscription-schedules',
  '/api/subscription-schedules/(.*)',
]);

const isApiRoute = createRouteMatcher(['/api/(.*)']);

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
  event: NextFetchEvent,
) {
  // Verify the request with Arcjet
  if (process.env.ARCJET_KEY) {
    const decision = await aj.protect(request);

    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Handle API routes FIRST - don't apply i18n to them
  if (isApiRoute(request)) {
    // Only apply Clerk protection to specific API routes
    if (isProtectedApiRoute(request)) {
      return clerkMiddleware(async (auth) => {
        await auth.protect();
        return NextResponse.next();
      })(request, event);
    }

    // For unprotected API routes, just continue without i18n
    return NextResponse.next();
  }

  // Clerk keyless mode doesn't work with i18n, this is why we need to run the middleware conditionally
  if (
    isAuthPage(request)
    || isProtectedRoute(request)
  ) {
    return clerkMiddleware(async (auth, req) => {
      // Protect dashboard routes
      if (isProtectedRoute(req)) {
        const locale = req.nextUrl.pathname.match(/(\/.*)\/dashboard/)?.at(1) ?? '';
        const signInUrl = new URL(`${locale}/sign-in`, req.url);

        await auth.protect({
          unauthenticatedUrl: signInUrl.toString(),
        });
      }

      return handleI18nRouting(request);
    })(request, event);
  }

  // Apply i18n routing to non-API routes
  return handleI18nRouting(request);
}

export const config = {
  // Match all pathnames except for
  matcher: '/((?!_next|_vercel|monitoring|.*\\..*).*)',
};
