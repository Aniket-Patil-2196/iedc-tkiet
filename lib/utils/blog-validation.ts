import { IBlogImage, IBlogReference, IBlogSeo } from "@/types/content";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Strips dangerous HTML tags (like <script>, <iframe>, <object>, inline event handlers)
 * while preserving paragraph breaks and basic formatting (h2/h3, lists, links, emphasis, blockquotes).
 */
export function sanitizeBlogContent(input: string): string {
  if (!input) return "";

  // Strip script tags and their contents
  let clean = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  // Strip iframe tags and their contents
  clean = clean.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");
  // Strip object/embed
  clean = clean.replace(/<\/?(?:object|embed|form|input|button)[^>]*>/gi, "");
  // Strip dangerous event handler attributes
  clean = clean.replace(/on\w+\s*=\s*"[^"]*"/gi, "").replace(/on\w+\s*=\s*'[^']*'/gi, "");
  // Strip javascript: URLs in href/src
  clean = clean.replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1=$2#$2');

  return clean.trim();
}

/**
 * Strips all HTML tags to produce a clean plain-text excerpt with preserved paragraphs.
 * Also lightly strips common Markdown markers for excerpt/read-time use.
 */
export function stripHtmlToPlainText(html: string): string {
  if (!html) return "";

  return html
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/(?:h[1-6]|blockquote|li|ul|ol)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
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
 * URL-safe slug from a title or raw slug input.
 */
export function slugifyBlogSlug(raw: string): string {
  return String(raw || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Returns true when slug is non-empty and URL-safe.
 */
export function isValidBlogSlug(slug: string): boolean {
  return Boolean(slug) && SLUG_PATTERN.test(slug);
}

/**
 * Trim + dedupe tags (case-insensitive uniqueness, preserve first casing).
 */
export function normalizeBlogTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const item of raw) {
    const tag = String(item ?? "").trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }

  return tags;
}

/**
 * Optional category string → trimmed string or null.
 */
export function normalizeOptionalText(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;
  const value = String(raw).trim();
  return value.length > 0 ? value : null;
}

/**
 * SEO object with optional title/description (empty strings → omitted).
 */
export function normalizeBlogSeo(raw: unknown): IBlogSeo | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const src = raw as Record<string, unknown>;
  const title = typeof src.title === "string" ? src.title.trim() : "";
  const description =
    typeof src.description === "string" ? src.description.trim() : "";

  if (!title && !description) return undefined;

  const seo: IBlogSeo = {};
  if (title) seo.title = title;
  if (description) seo.description = description;
  return seo;
}

/**
 * Validates and sanitizes references (up to 8 valid http/https URLs), preserving/assigning order.
 */
export function validateReferences(raw: any[]): IBlogReference[] {
  if (!Array.isArray(raw)) return [];

  const valid: IBlogReference[] = [];
  for (let i = 0; i < raw.slice(0, 8).length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const label = String(item.label || "").trim();
    const url = String(item.url || "").trim();

    if (!label || !url) continue;

    try {
      const parsed = new URL(url);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        const order =
          typeof item.order === "number" && Number.isFinite(item.order)
            ? item.order
            : i;
        valid.push({ label, url, order });
      }
    } catch {
      // Ignore invalid URLs
    }
  }

  return valid.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Validates and sanitizes images (up to 4 images), preserving alt and order.
 */
export function validateImages(raw: any[]): IBlogImage[] {
  if (!Array.isArray(raw)) return [];

  const valid: IBlogImage[] = [];
  for (let i = 0; i < raw.slice(0, 4).length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const url = String(item.url || "").trim();
    const alt = String(item.alt || "").trim();
    const caption = item.caption ? String(item.caption).trim() : undefined;
    const width = Number(item.width) || undefined;
    const height = Number(item.height) || undefined;
    const order =
      typeof item.order === "number" && Number.isFinite(item.order)
        ? item.order
        : i;

    if (url) {
      valid.push({
        url,
        alt: alt || "Article figure",
        caption,
        order,
        width,
        height,
      });
    }
  }

  return valid.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Sort images by explicit order (fallback: array index). Safe for legacy docs without order.
 */
export function sortBlogImages(images: IBlogImage[] | undefined | null): IBlogImage[] {
  if (!images?.length) return [];
  return images
    .map((img, index) => ({ img, index, order: img.order ?? index }))
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map(({ img }) => img);
}

/**
 * Sort references by explicit order (fallback: array index).
 */
export function sortBlogReferences(
  references: IBlogReference[] | undefined | null
): IBlogReference[] {
  if (!references?.length) return [];
  return references
    .map((ref, index) => ({ ref, index, order: ref.order ?? index }))
    .sort((a, b) => a.order - b.order || a.index - b.index)
    .map(({ ref }) => ref);
}
