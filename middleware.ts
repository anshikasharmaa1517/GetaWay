import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "./lib/session";
import { checkRouteAccess, getDefaultRedirectPath } from "./lib/roles";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  try {
    // Get user session
    const session = await getServerSession();

    // Public routes that don't require authentication
    const publicRoutes = [
      "/",
      "/login",
      "/become-reviewer",
      "/become-reviewer-auth",
    ];

    // Temporarily allow review pages for testing
    const isReviewPage = pathname.match(/^\/creator\/review\/[^\/]+$/);

    // Check if it's a public reviewer profile (e.g., /r/username)
    const isPublicReviewerProfile = pathname.match(/^\/r\/[^\/]+$/);

    if (
      publicRoutes.includes(pathname) ||
      isPublicReviewerProfile ||
      isReviewPage
    ) {
      return NextResponse.next();
    }

    // Require authentication for protected routes
    if (!session || !session.isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check role-based access
    const accessCheck = checkRouteAccess(session.role, pathname);

    if (!accessCheck.allowed) {
      // Redirect to appropriate dashboard based on user role
      const redirectPath = getDefaultRedirectPath(session.role);
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    // Add user role to headers for use in components
    const response = NextResponse.next();
    response.headers.set("x-user-role", session.role);
    response.headers.set("x-user-id", session.user.id);

    return response;
  } catch (error) {
    console.error("Middleware error:", error);

    // On error, redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
