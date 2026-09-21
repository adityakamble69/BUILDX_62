import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Public routes — no auth required (guest can browse).
const isPublicRoute = createRouteMatcher([
  '/',
  '/map(.*)',
  '/reports(.*)',
  '/city-health(.*)',
  '/about(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

// Citizen-only routes — any signed-in user (citizen, worker, admin) may access.
const isCitizenRoute = createRouteMatcher([
  '/report/new(.*)',
  '/my-reports(.*)',
  '/notifications(.*)',
]);

// Worker-only routes.
const isWorkerRoute = createRouteMatcher(['/worker(.*)']);

// Admin-only routes.
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  // Public: always allowed.
  if (isPublicRoute(req)) return NextResponse.next();

  // Everything else requires a signed-in session.
  if (!userId) {
    if (isCitizenRoute(req) || isWorkerRoute(req) || isAdminRoute(req)) {
      return redirectToSignIn({ returnBackUrl: req.url });
    }
    return NextResponse.next();
  }

  const role = sessionClaims?.metadata?.role;

  if (isAdminRoute(req) && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }
  if (isWorkerRoute(req) && role !== 'worker') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next internals and static files, run on everything else including API routes.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};