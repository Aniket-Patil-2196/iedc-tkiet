import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSession } from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow login endpoint
  if (pathname === "/api/admin/auth/login") {
    return NextResponse.next();
  }

  // Check authentication for admin dashboard and admin APIs
  const isAdminDashboard = pathname.startsWith("/admin/dashboard");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (isAdminDashboard || isAdminApi) {
    const session = await verifyAdminSession(request);

    if (!session) {
      if (isAdminApi) {
        return NextResponse.json(
          { success: false, error: "Unauthorized access. Session invalid or expired." },
          { status: 401 }
        );
      }

      // Redirect unauthenticated web requests to /admin login
      const loginUrl = new URL("/admin", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/dashboard/:path*",
    "/api/admin/:path*",
  ],
};
