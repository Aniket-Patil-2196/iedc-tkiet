import crypto from "crypto";
import CommentModel from "@/models/Comment";

export function getClientIp(request: Request): string {
  // 1. Render Platform Trusted Client IP Header
  const renderClientIp =
    request.headers.get("x-render-client-ip")?.trim() ||
    request.headers.get("render-client-ip")?.trim();
  if (renderClientIp) return renderClientIp;

  // 2. Vercel Edge Trusted Client IP Header
  const vercelIp = request.headers.get("x-vercel-ip")?.trim();
  if (vercelIp) return vercelIp;

  // 3. Cloudflare Edge Connecting IP
  const cfConnectingIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp) return cfConnectingIp;

  // 4. Standard Proxy Overridden Real IP Header
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  // 5. Fallback only if no trusted reverse-proxy header is set
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  return "127.0.0.1";
}

export function hashClientIp(ip: string): { ipHash: string | null; error?: string } {
  const salt = process.env.COMMENT_IP_SALT;
  if (!salt) {
    if (process.env.NODE_ENV === "production") {
      return {
        ipHash: null,
        error: "COMMENT_IP_SALT is required in production environment.",
      };
    }
    // Fallback in non-production environments
    const fallbackSalt = "dev_default_salt_comment_protection";
    const ipHash = crypto.createHmac("sha256", fallbackSalt).update(ip).digest("hex");
    return { ipHash };
  }

  const ipHash = crypto.createHmac("sha256", salt).update(ip).digest("hex");
  return { ipHash };
}

export async function checkCommentRateLimits({
  ipHash,
  email,
  blogSlug,
}: {
  ipHash: string;
  email: string;
  blogSlug?: string;
}): Promise<{ allowed: boolean; message?: string }> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // 1. Check IP Hash limit: max 3 comments per 10 minutes
  const recentByIp = await CommentModel.countDocuments({
    ipHash,
    createdAt: { $gte: tenMinutesAgo },
  });

  if (recentByIp >= 3) {
    return {
      allowed: false,
      message:
        "You've posted several comments recently. Please wait a few minutes before trying again.",
    };
  }

  // 2. Check Email limit: max 5 comments per 24 hours
  const recentByEmail = await CommentModel.countDocuments({
    email: email.toLowerCase().trim(),
    createdAt: { $gte: twentyFourHoursAgo },
  });

  if (recentByEmail >= 5) {
    return {
      allowed: false,
      message:
        "Daily comment limit reached for this email address. Please try again tomorrow.",
    };
  }

  // 3. Per-blog limits (Anti-brigading / Spam wave protections)
  if (blogSlug) {
    // Max 20 new comments per blog per hour
    const recentByBlog = await CommentModel.countDocuments({
      blogSlug,
      createdAt: { $gte: oneHourAgo },
    });

    if (recentByBlog >= 20) {
      return {
        allowed: false,
        message:
          "This article has reached its hourly discussion limit. Please try again later.",
      };
    }

    // Max 100 pending comments per blog
    const pendingByBlog = await CommentModel.countDocuments({
      blogSlug,
      status: "pending",
    });

    if (pendingByBlog >= 100) {
      return {
        allowed: false,
        message:
          "This article currently has a backlog of remarks awaiting moderation. Please try again later.",
      };
    }
  }

  return { allowed: true };
}

export function validateCommentInput(data: {
  name?: string;
  email?: string;
  body?: string;
}): { valid: boolean; error?: string } {
  const name = data.name?.trim();
  const email = data.email?.trim().toLowerCase();
  const body = data.body?.trim();

  if (!name || name.length < 2 || name.length > 60) {
    return { valid: false, error: "Name must be between 2 and 60 characters." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email) || email.length > 100) {
    return { valid: false, error: "Please enter a valid email address." };
  }

  if (!body || body.length < 3 || body.length > 1000) {
    return { valid: false, error: "Comment must be between 3 and 1000 characters." };
  }

  // Anti-spam link limit: Max 2 links per comment
  const urlPattern = /(https?:\/\/|www\.)[^\s]+/gi;
  const linkMatches = body.match(urlPattern) || [];
  if (linkMatches.length > 2) {
    return {
      valid: false,
      error: "Remarks may not contain more than 2 external links.",
    };
  }

  return { valid: true };
}
