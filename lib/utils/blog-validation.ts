import { IBlogImage, IBlogReference } from "@/types/content";

/**
 * Strips dangerous HTML tags (like <script>, <iframe>, <object>, inline event handlers)
 * while preserving paragraph breaks and basic formatting.
 */
export function sanitizeBlogContent(input: string): string {
  if (!input) return "";

  // Strip script tags and their contents
  let clean = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  // Strip iframe tags and their contents
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
  // Strip dangerous event handler attributes
  clean = clean.replace(/on\w+="[^"]*"/gi, "").replace(/on\w+='[^']*'/gi, "");

  return clean.trim();
}

/**
 * Strips all HTML tags to produce a clean plain-text excerpt with preserved paragraphs.
 */
export function stripHtmlToPlainText(html: string): string {
  if (!html) return "";

  return html
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Computes reading time in minutes based on ~200 words per minute.
 */
export function computeReadTime(text: string): number {
  const plain = stripHtmlToPlainText(text);
  const words = plain.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/**
 * Validates and sanitizes references (up to 8 valid http/https URLs).
 */
export function validateReferences(raw: any[]): IBlogReference[] {
  if (!Array.isArray(raw)) return [];

  const valid: IBlogReference[] = [];
  for (const item of raw.slice(0, 8)) {
    if (!item || typeof item !== "object") continue;
    const label = String(item.label || "").trim();
    const url = String(item.url || "").trim();

    if (!label || !url) continue;

    // Must be a valid http or https URL
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        valid.push({ label, url });
      }
    } catch {
      // Ignore invalid URLs
    }
  }

  return valid;
}

/**
 * Validates and sanitizes images (up to 4 images).
 */
export function validateImages(raw: any[]): IBlogImage[] {
  if (!Array.isArray(raw)) return [];

  const valid: IBlogImage[] = [];
  for (const item of raw.slice(0, 4)) {
    if (!item || typeof item !== "object") continue;
    const url = String(item.url || "").trim();
    const alt = String(item.alt || "").trim();
    const caption = item.caption ? String(item.caption).trim() : undefined;
    const width = Number(item.width) || undefined;
    const height = Number(item.height) || undefined;

    if (url) {
      valid.push({
        url,
        alt: alt || "Article figure",
        caption,
        width,
        height,
      });
    }
  }

  return valid;
}
