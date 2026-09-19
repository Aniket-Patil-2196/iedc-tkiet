import sharp from "sharp";
import { connectToDatabase } from "@/lib/mongodb/client";
import ImageModel from "@/models/Image";

/**
 * SSRF validation: checks if a hostname or IP is a local/private address.
 */
function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  // Localhost aliases & internal domains
  if (
    lower === "localhost" ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal") ||
    lower.endsWith(".onion") ||
    lower === "0.0.0.0" ||
    lower === "::1"
  ) {
    return true;
  }

  // IPv4 private ranges (10.0.0.0/8, 127.0.0.0/8, 169.254.0.0/16, 172.16.0.0/12, 192.168.0.0/16)
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = lower.match(ipv4Regex);
  if (match) {
    const [, a, b] = match.map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
  }

  // IPv6 loopback / unique local / link-local
  if (
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80")
  ) {
    return true;
  }

  return false;
}

export interface IngestResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Validates, downloads, processes with sharp, and saves an external image URL to MongoDB.
 * If the URL is already an internal path (/api/images/... or /images/...), it returns it as-is.
 */
export async function ingestImage(rawUrl: string): Promise<IngestResult> {
  const trimmed = rawUrl.trim();

  // Allow existing internal / local image paths
  if (trimmed.startsWith("/api/images/") || trimmed.startsWith("/images/")) {
    return { success: true, url: trimmed };
  }

  // Parse and validate URL structure
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return {
      success: false,
      error: "Invalid image URL. Please enter a complete web address starting with https://",
    };
  }

  // Only permit HTTP and HTTPS
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return {
      success: false,
      error: "Only HTTP and HTTPS URLs are supported.",
    };
  }

  // SSRF protection
  if (isPrivateHost(parsedUrl.hostname)) {
    return {
      success: false,
      error: "Access to private or local network addresses is prohibited.",
    };
  }

  // Fetch external asset with timeout and browser-like user agent
  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    clearTimeout(timeoutId);
  } catch (err: any) {
    if (err.name === "AbortError") {
      return {
        success: false,
        error: "Image request timed out after 8 seconds. Please check the URL or upload the image directly.",
      };
    }
    return {
      success: false,
      error: "Could not reach the image host. Please check the link or upload the image directly.",
    };
  }

  if (!response.ok) {
    return {
      success: false,
      error: `Failed to retrieve image (HTTP ${response.status}). The link may be private, expired, or blocked.`,
    };
  }

  // Validate Content-Type
  const contentType = (response.headers.get("content-type") || "").toLowerCase();

  // Check if it's an HTML page (like Pinterest pin page, Instagram post, etc.)
  if (
    contentType.includes("text/html") ||
    !contentType.startsWith("image/")
  ) {
    return {
      success: false,
      error:
        "This link is a web page, not an image. Right-click the image and choose 'Copy image address'.",
    };
  }

  // Size cap check: 5MB
  const contentLengthHeader = response.headers.get("content-length");
  if (contentLengthHeader && parseInt(contentLengthHeader, 10) > 5 * 1024 * 1024) {
    return {
      success: false,
      error: "Image file exceeds the 5MB size limit.",
    };
  }

  // Read buffer
  const arrayBuf = await response.arrayBuffer();
  if (arrayBuf.byteLength > 5 * 1024 * 1024) {
    return {
      success: false,
      error: "Image file exceeds the 5MB size limit.",
    };
  }

  const rawBuffer = Buffer.from(arrayBuf);

  // Connect to database
  const conn = await connectToDatabase();
  if (!conn) {
    return {
      success: false,
      error: "Database unavailable while storing image.",
    };
  }

  // Process image with Sharp
  try {
    const processedBuffer = await sharp(rawBuffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const imageDoc = await ImageModel.create({
      data: processedBuffer,
      contentType: "image/webp",
      size: processedBuffer.length,
    });

    return {
      success: true,
      url: `/api/images/${imageDoc._id}`,
    };
  } catch (sharpErr) {
    console.error("[SHARP INGEST ERROR]", sharpErr);
    return {
      success: false,
      error: "The fetched resource could not be decoded as a valid image.",
    };
  }
}
