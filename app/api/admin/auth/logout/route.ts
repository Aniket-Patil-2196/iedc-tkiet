import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Admin session terminated.",
  });

  const isProduction = process.env.NODE_ENV === "production";
  const isCrossOrigin = Boolean(process.env.ALLOWED_ORIGIN);

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: isProduction || isCrossOrigin,
    sameSite: isProduction || isCrossOrigin ? "none" : "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
