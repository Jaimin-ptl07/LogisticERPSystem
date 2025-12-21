import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/me",
  "/api/auth/refresh",
];
// Define protected route prefixes
const protectedRoutePrefixes = [
  "/super-admin",
  "/company-admin",
  "/branch-manager",
  "/finance-manager",
  "/logistics-manager",
  "/driver",
  "/drivermodule", // Temporary renamed protected driver route
  "/dashboard", // Legacy route
  "/deliveries",
  "/orders",
  "/trips",
  "/history",
  "/masters",
  "/audit-logs",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is public
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the path is protected (any role-based route or legacy route)
  const isProtectedRoute =
    protectedRoutePrefixes.some((route) => pathname.startsWith(route)) ||
    (pathname !== "/" &&
      pathname !== "/login" &&
      pathname !== "/register" &&
      !pathname.startsWith("/api/"));

  // Get token from cookies or authorization header
  const cookieToken = request.cookies.get('access_token')?.value;
  const token = cookieToken ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  // If accessing protected routes without token, redirect to login
  if (!isPublicRoute && isProtectedRoute && !token) {
    // For API routes (except auth endpoints), return 401 response
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // For page routes, redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing login page with token, redirect to default dashboard
  // This ensures authenticated users are redirected away from login
  if (pathname === "/login" && token) {
    // We can't determine the user's role from the token in middleware,
    // so we'll let the login page handle the redirect based on role
    // But we can redirect to a default route and let the protected layout handle role-based routing
    const defaultRoute = "/company-admin/masters"; // Fallback default
    return NextResponse.redirect(new URL(defaultRoute, request.url));
  }

  // Continue with the request
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Forward the token to the next handler if it exists
  if (token && !request.headers.get("authorization")) {
    response.headers.set("authorization", `Bearer ${token}`);
  }

  return response;
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
