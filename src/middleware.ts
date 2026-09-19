import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "development-secret-key"
);

const COOKIE_NAME = "auth-token";

// ── Routes that are always public ────────────────────────────────────
// Everything else under /dashboard and /api (except /api/auth) is protected
const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/register",
];

const PUBLIC_API_PREFIXES = [
  "/api/auth", // login, register, logout, me — always public
];

// ── Middleware ────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Always allow public pages ─────────────────────────────────
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // ── 2. Always allow public API routes ────────────────────────────
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // ── 3. Allow static files and Next.js internals ──────────────────
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ── 4. Verify session token ───────────────────────────────────────
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    // No token at all — redirect to login
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("from", pathname); // preserve intended destination
    return NextResponse.redirect(loginUrl);
  }

  // ── 5. Validate the JWT ───────────────────────────────────────────
  let payload: {
    userId: string;
    email: string;
    name: string;
    role: string;
  };

  try {
    const { payload: verified } = await jwtVerify(token, JWT_SECRET);
    payload = verified as typeof payload;
  } catch {
    // Token is invalid or expired — clear cookie and redirect to login
    const loginUrl = new URL("/auth/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  const role = payload.role;

  // ── 6. Role-based route protection ───────────────────────────────

  // Student trying to access industry dashboard
  if (pathname.startsWith("/dashboard/industry") && role !== "industry") {
    return NextResponse.redirect(new URL("/dashboard/student", request.url));
  }

  // Industry trying to access student dashboard
  if (pathname.startsWith("/dashboard/student") && role !== "student") {
    return NextResponse.redirect(new URL("/dashboard/industry", request.url));
  }

  // Admin dashboard — only admin role
  if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
    if (role === "student") {
      return NextResponse.redirect(new URL("/dashboard/student", request.url));
    }
    if (role === "industry") {
      return NextResponse.redirect(new URL("/dashboard/industry", request.url));
    }
  }

  // ── 7. API route protection ───────────────────────────────────────
  // All /api routes except /api/auth/* require a valid session
  // We already verified the token above — just let it through
  // Role-specific API protection is handled inside each route handler

  // ── 8. All checks passed — allow the request ──────────────────────
  return NextResponse.next();
}

// ── Matcher ───────────────────────────────────────────────────────────
// Tell Next.js which paths this middleware should run on
// Exclude static files and Next.js internals for performance
export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files (png, jpg, svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};