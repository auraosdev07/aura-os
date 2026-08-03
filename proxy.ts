/**
 * proxy.ts  (formerly middleware.ts — renamed for Next.js 16)
 *
 * Next.js Edge Proxy — runs before every matched request.
 *
 * Responsibilities:
 * 1. Refresh the Supabase session cookie on every request so it never
 *    silently expires mid-session.
 * 2. Redirect unauthenticated users away from /dashboard/* to /login.
 * 3. Redirect authenticated users away from /login to /dashboard.
 * 4. Redirect / to the appropriate destination based on session state.
 *
 * Architecture reference: ARCHITECTURE.md §7 Authentication Flow
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Propagate cookies into both the request and the response
          // so the session token is available downstream and sent to the browser.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          requestHeaders.set("cookie", request.cookies.toString());

          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Do not add any logic between createServerClient and getUser().
  // A mistake here could cause the session to not be refreshed correctly.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const adminRoutes = [
    "/dashboard",
    "/products",
    "/managers",
    "/employees",
    "/missions",
    "/agents",
    "/tasks",
    "/knowledge",
    "/artifacts",
    "/ai",
    "/profile",
    "/notifications",
  ];

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users trying to access protected routes.
  if (!user && (isAdminRoute || pathname.startsWith("/dashboard"))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from the login page.
  if (user && pathname === "/login") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  // Redirect root to dashboard (or login if unauthenticated).
  if (pathname === "/") {
    const target = request.nextUrl.clone();
    target.pathname = user ? "/dashboard" : "/login";
    return NextResponse.redirect(target);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
