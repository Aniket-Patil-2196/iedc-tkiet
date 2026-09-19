import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSession } from "@/lib/auth/session";

function getCorsHeaders(request: NextRequest): Record<string, string> | null {
  const allowedOriginEnv = process.env.ALLOWED_ORIGIN;
  const requestOrigin = request.headers.get("origin");

  let allowOriginValue = "";

  if (allowedOriginEnv) {
    if (allowedOriginEnv === "*") {
      allowOriginValue = requestOrigin || "*";
    } else {
      const allowedList = allowedOriginEnv.split(",").map((o) => o.trim().toLowerCase());
      if (requestOrigin && (allowedList.includes(requestOrigin.toLowerCase()) || allowedList.includes("*"))) {
        allowOriginValue = requestOrigin;
      }
    }
  } else if (requestOrigin) {
    // If ALLOWED_ORIGIN is not explicitly configured, reflect the origin
    allowOriginValue = requestOrigin;
  }

  if (!allowOriginValue) {
    return null;
  }

  return {
    "Access-Control-Allow-Origin": allowOriginValue,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma",
  };
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");
  const corsHeaders = isApi ? getCorsHeaders(request) : null;

  // Handle preflight CORS OPTIONS requests for any /api route
  if (isApi && request.method === "OPTIONS") {
    const preflightHeaders = new Headers(corsHeaders || {});
    preflightHeaders.set("Access-Control-Max-Age", "86400");
    return new NextResponse(null, { status: 204, headers: preflightHeaders });
  }

  // Allow login endpoint
  if (pathname === "/api/admin/auth/login") {
    const response = NextResponse.next();
    if (corsHeaders) {
      Object.entries(corsHeaders).forEach(([key, val]) => {
        response.headers.set(key, val);
      });
    }
    return response;
  }

  // Check authentication for admin dashboard and admin APIs
  const isAdminDashboard = pathname.startsWith("/admin/dashboard");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (isAdminDashboard || isAdminApi) {
    const session = await verifyAdminSession(request);

    if (!session) {
      if (isAdminApi) {
        const unauthResponse = NextResponse.json(
          { success: false, error: "Unauthorized access. Session invalid or expired." },
          { status: 401 }
        );
        if (corsHeaders) {
          Object.entries(corsHeaders).forEach(([key, val]) => {
            unauthResponse.headers.set(key, val);
          });
        }
        return unauthResponse;
      }

      // Redirect unauthenticated web requests to /admin login
      const loginUrl = new URL("/admin", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  if (corsHeaders) {
    Object.entries(corsHeaders).forEach(([key, val]) => {
      response.headers.set(key, val);
    });
  }
  return response;
}

export const config = {
  matcher: [
    "/admin/dashboard/:path*",
    "/api/:path*",
  ],
};
