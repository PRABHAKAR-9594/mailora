import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { SessionData, sessionOptions } from "@/lib/session";

// Routes that require authentication
const protectedRoutes = ["/home", "/campaigns", "/profile", "/settings"];
// Routes only for guests (redirect to /home if logged in)
const guestRoutes = ["/login", "/register", "/verify-otp"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  const isLoggedIn = !!session.isLoggedIn && !!session.userId;

  // Redirect authenticated users away from guest routes
  if (isLoggedIn && guestRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Redirect unauthenticated users away from protected routes
  if (!isLoggedIn && protectedRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect root to /home or /login based on auth state
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isLoggedIn ? "/home" : "/login", request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|csv)$).*)",
  ],
};
