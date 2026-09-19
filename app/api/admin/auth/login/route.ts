import { NextResponse } from "next/server";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";

interface RateLimitRecord {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

// In-memory sliding window rate limiter for login protection
const loginAttempts = new Map<string, RateLimitRecord>();

function checkRateLimit(ip: string): { limited: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return { limited: false };

  if (record.blockedUntil && now < record.blockedUntil) {
    const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
    return { limited: true, retryAfterSeconds: retryAfter };
  }

  // If previous window has expired, reset
  if (now > record.resetTime) {
    loginAttempts.delete(ip);
    return { limited: false };
  }

  return { limited: false };
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, resetTime: now + 5 * 60 * 1000 };
  record.count += 1;
  // Lock out for 10 minutes after 5 failed attempts in 5 minutes
  if (record.count >= 5) {
    record.blockedUntil = now + 10 * 60 * 1000;
  }
  loginAttempts.set(ip, record);
}

function clearAttempts(ip: string) {
  loginAttempts.delete(ip);
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    // 1. Check rate limit
    const { limited, retryAfterSeconds } = checkRateLimit(ip);
    if (limited) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed login attempts. Account temporarily locked for security. Please try again in ${retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // 2. Validate field presence
    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL || "admin@tkiet.ac.in";
    const storedHash = process.env.ADMIN_PASSWORD_HASH;

    // 3. Constant-time / generic validation: do not disclose which field failed
    const isEmailValid = email.trim().toLowerCase() === adminEmail.toLowerCase();
    const isPasswordValid = verifyPassword(password, storedHash);

    if (!isEmailValid || !isPasswordValid) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { success: false, error: "Invalid administrator email or password." },
        { status: 401 }
      );
    }

    // 4. Reset rate limit on success
    clearAttempts(ip);

    // 5. Create session token (Edge-compatible Web Crypto HMAC)
    const token = await createSessionToken(adminEmail);

    const response = NextResponse.json({
      success: true,
      message: "Admin authentication successful.",
      email: adminEmail,
    });

    // 6. Set secure HTTP-only cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error("[ADMIN LOGIN ERROR]", error);
    return NextResponse.json(
      { success: false, error: "An unexpected authentication error occurred." },
      { status: 500 }
    );
  }
}
