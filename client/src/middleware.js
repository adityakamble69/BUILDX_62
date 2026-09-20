import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Pages that need any signed-in user.
const isCitizenRoute = createRouteMatcher([
  '/report/new(.*)',
  '/my-reports(.*)',
  '/notifications(.*)',
  '/auth-check(.*)',
]);

// Pages that additionally need the admin role.
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims, redirectToSignIn } = await auth();

  if (isAdminRoute(req)) {
    if (!userId) return redirectToSignIn({ returnBackUrl: req.url });
    // Role lives in the customized session token claim (architecture.md §8).
    // This is a UX guard only — the Express requireAdmin check is the real protection.
    if (sessionClaims?.metadata?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  if (isCitizenRoute(req) && !userId) {
    return redirectToSignIn({ returnBackUrl: req.url });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Everything except Next.js internals and static files…
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|txt|webmanifest)).*)',
    // …plus API routes, if any are ever added.
    '/(api|trpc)(.*)',
  ],
};
