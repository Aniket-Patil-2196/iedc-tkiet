import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const SESSION_COOKIE_NAME = "iedc_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

// Default dev secret if not provided in environment
const SECRET_KEY =
  process.env.SESSION_SECRET ||
  "iedc_tkiet_development_secret_key_change_in_production_987654321";

export interface AdminSessionPayload {
  email: string;
  exp: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Signs a session payload with HMAC-SHA256 using Web Crypto API (Edge & Node compatible)
 */
export async function signToken(payload: AdminSessionPayload): Promise<string> {
  const key = await getHmacKey(SECRET_KEY);
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(encoder.encode(payloadJson));
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadB64)
  );
  const signatureB64 = base64UrlEncode(new Uint8Array(signatureBuffer));
  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifies and decodes a session token using Web Crypto API (Edge & Node compatible)
 */
export async function verifyToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const [payloadB64, signatureB64] = token.split(".");
    if (!payloadB64 || !signatureB64) return null;

    const key = await getHmacKey(SECRET_KEY);
    const signatureBytes = base64UrlDecode(signatureB64);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as BufferSource,
      encoder.encode(payloadB64)
    );

    if (!isValid) return null;

    const payloadBytes = base64UrlDecode(payloadB64);
    const payload = JSON.parse(decoder.decode(payloadBytes)) as AdminSessionPayload;

    if (Date.now() >= payload.exp * 1000) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Verifies admin session from Next.js cookies() or a NextRequest
 */
export async function verifyAdminSession(
  req?: NextRequest
): Promise<AdminSessionPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    } catch {
      // If outside request context
      return null;
    }
  }

  if (!token) return null;
  return await verifyToken(token);
}

/**
 * Creates and signs a new admin session token
 */
export async function createSessionToken(email: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  return await signToken({ email, exp });
}
