import type { NextFetchEvent, NextRequest } from 'next/server';
import { detectBot } from '@arcjet/next';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import arcjet from '@/libs/Arcjet';
import { AppConfig } from '@/utils/AppConfig';
import { routing } from './libs/i18nRouting';

const handleI18nRouting = createMiddleware(routing);

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/:locale/dashboard(.*)',
  '/subscriptions(.*)',
  '/:locale/subscriptions(.*)',
  '/vehicles(.*)',
  '/:locale/vehicles(.*)',
  '/payment-methods(.*)',
  '/:locale/payment-methods(.*)',
  '/user-profile(.*)',
  '/:locale/user-profile(.*)',
]);

const isProductionRestrictedRoute = createRouteMatcher([
  '/vehicles(.*)',
  '/:locale/vehicles(.*)',
  '/user-profile(.*)',
  '/:locale/user-profile(.*)',
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
  // If production mode and redirect from restricted routes
  if (process.env.NEXT_PUBLIC_APP_VERSION === 'production' && isProductionRestrictedRoute(request)) {
    const locale = request.nextUrl.pathname.match(/(\/.*)\/(vehicles|user-profile)/)?.at(1) ?? `/${AppConfig.defaultLocale}`;
    const dashboardUrl = new URL(`${locale}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Verify the request with Arcjet
  if (process.env.ARCJET_KEY) {
    const decision = await aj.protect(request);

    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Handle API routes - apply Clerk protection
  if (isApiRoute(request)) {
    if (isProtectedApiRoute(request)) {
      return clerkMiddleware(async (auth) => {
        await auth.protect();
        return NextResponse.next();
      })(request, event);
    }
    return NextResponse.next();
  }

  // Handle protected routes with Clerk authentication
  if (isProtectedRoute(request)) {
    return clerkMiddleware(async (auth, req) => {
      const locale = req.nextUrl.pathname.match(/(\/.*)\/dashboard/)?.at(1) ?? `/${AppConfig.defaultLocale}`;
      const signInUrl = new URL(`${locale}/sign-in`, req.url);

      await auth.protect({
        unauthenticatedUrl: signInUrl.toString(),
      });

      return handleI18nRouting(request);
    })(request, event);
  }

  // Handle auth pages
  if (isAuthPage(request)) {
    return clerkMiddleware(async (_auth) => {
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
