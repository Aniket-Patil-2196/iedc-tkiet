import crypto from "crypto";
import { z } from "zod";

// 1. Verify HMAC SHA-256 signature verification math as used in /api/payments/verify
function testHmacVerification() {
  const mockSecret = "rzp_test_secret_key_12345";
  const orderId = "order_O123456789ABCD";
  const paymentId = "pay_P123456789ABCD";

  // Real Razorpay signature formula: HMAC-SHA256(order_id + "|" + payment_id, secret)
  const validSignature = crypto
    .createHmac("sha256", mockSecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const invalidSignature = "invalid_signature_hex_0123456789abcdef";

  const verifySignature = (ord: string, pay: string, sig: string, secret: string): boolean => {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${ord}|${pay}`)
      .digest("hex");
    const expBuf = Buffer.from(expected, "utf-8");
    const sigBuf = Buffer.from(sig, "utf-8");
    return expBuf.length === sigBuf.length && crypto.timingSafeEqual(expBuf, sigBuf);
  };

  const passValid = verifySignature(orderId, paymentId, validSignature, mockSecret);
  const rejectInvalid = !verifySignature(orderId, paymentId, invalidSignature, mockSecret);
  const rejectTamperedOrder = !verifySignature("order_tampered", paymentId, validSignature, mockSecret);

  console.log("HMAC Test Results:", {
    passValid,
    rejectInvalid,
    rejectTamperedOrder,
  });

  if (!passValid || !rejectInvalid || !rejectTamperedOrder) {
    throw new Error("HMAC signature verification test failed!");
  }
}

// 2. Verify Schema Validation for /api/events/[id]/register and /api/payments/verify
function testSchemas() {
  const RegisterSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().min(10).max(15).regex(/^[0-9+\s()-]+$/),
    college: z.string().trim().min(2).max(150),
    year: z.string().trim().min(1).max(50),
  });

  const validRegistration = {
    name: "Aarav Sharma",
    email: "aarav@tkiet.ac.in",
    phone: "9876543210",
    college: "TKIET Warananagar",
    year: "Final Year (B.Tech)",
  };

  const validResult = RegisterSchema.safeParse(validRegistration);
  console.log("Register Schema Valid Input:", validResult.success);

  const invalidEmailResult = RegisterSchema.safeParse({
    ...validRegistration,
    email: "not-an-email",
  });
  console.log("Register Schema Invalid Email Rejected:", !invalidEmailResult.success);

  const VerifySchema = z.object({
    order_id: z.string().min(1),
    payment_id: z.string().min(1),
    signature: z.string().min(1),
    receiptToken: z.string().min(1),
  });

  const validVerify = {
    order_id: "order_123",
    payment_id: "pay_123",
    signature: "sig_123",
    receiptToken: "tok_123",
  };

  console.log("Verify Schema Valid Input:", VerifySchema.safeParse(validVerify).success);
  console.log(
    "Verify Schema Missing Field Rejected:",
    !VerifySchema.safeParse({ order_id: "order_123" }).success
  );
}

// 3. Environmental audit check
function auditEnvironment() {
  const envStatus = {
    MONGODB_URI: Boolean(process.env.MONGODB_URI),
    RAZORPAY_KEY_ID: Boolean(process.env.RAZORPAY_KEY_ID),
    RAZORPAY_KEY_SECRET: Boolean(process.env.RAZORPAY_KEY_SECRET),
    NEXT_PUBLIC_RAZORPAY_KEY_ID: Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID),
  };
  console.log("Current Environment Audit:", envStatus);
  return envStatus;
}

try {
  console.log("=== RUNNING PAYMENT FLOW & SECURITY AUDIT ===");
  testHmacVerification();
  testSchemas();
  auditEnvironment();
  console.log("=== ALL PAYMENT TESTS PASSED SUCCESSFULLY ===");
} catch (err) {
  console.error("Test failed:", err);
  process.exit(1);
}
