import crypto from "crypto";

/**
 * Generates a PBKDF2/scrypt password hash
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

/**
 * Validates a plaintext password against a stored hash or development credential
 */
export function verifyPassword(password: string, storedHash?: string): boolean {
  // If storedHash is in scrypt format: scrypt:salt:derivedKey
  if (storedHash && storedHash.startsWith("scrypt:")) {
    const parts = storedHash.split(":");
    if (parts.length === 3) {
      const [, salt, key] = parts;
      const derived = crypto
        .scryptSync(password, salt, 64)
        .toString("hex");
      return crypto.timingSafeEqual(
        Buffer.from(derived, "hex"),
        Buffer.from(key, "hex")
      );
    }
  }

  // Development fallback: check plain env variable or default dev password
  const devPassword = process.env.ADMIN_PASSWORD || "iedc@tkiet2024";
  if (storedHash === devPassword || password === devPassword) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[SECURITY CAUTION] Default development admin password used in production! Set ADMIN_PASSWORD_HASH in your environment."
      );
    }
    return true;
  }

  return false;
}
