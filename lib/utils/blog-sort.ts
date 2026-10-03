import { IBlog } from "@/types/content";

/**
 * Extracts the canonical millisecond timestamp for chronological sorting.
 * Prioritizes the user-visible publicationDate, falling back to publishedAt and createdAt.
 */
export function parsePublicationTimestamp(raw?: string | Date | null): number {
  if (!raw) return 0;
  if (raw instanceof Date) {
    return isNaN(raw.getTime()) ? 0 : raw.getTime();
  }
  const str = String(raw).trim();
  if (!str) return 0;

  // 1. Direct standard Date parsing (handles ISO "2026-09-26", "26 Sept 2026", "October 1, 2026", etc.)
  const direct = new Date(str);
  if (!isNaN(direct.getTime())) {
    return direct.getTime();
  }

  // 2. Fallback for DD-MM-YYYY or DD/MM/YYYY
  const match = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d.getTime();
  }

  return 0;
}

/**
 * Gets the authoritative sort timestamp for a blog post.
 * Checks publicationDate FIRST (the editorial date visible on-screen),
 * then publishedAt, then createdAt.
 */
export function getBlogSortTimestamp(
  blog: {
    publicationDate?: string;
    publishedAt?: string | Date;
    createdAt?: string | Date;
  }
): number {
  const pubDateTs = parsePublicationTimestamp(blog.publicationDate);
  if (pubDateTs > 0) return pubDateTs;

  const publishedAtTs = parsePublicationTimestamp(blog.publishedAt);
  if (publishedAtTs > 0) return publishedAtTs;

  return parsePublicationTimestamp(blog.createdAt);
}

/**
 * Sorts blogs in strict chronological order: oldest published post FIRST (#1),
 * newest published post LAST.
 */
export function sortBlogsOldestFirst<T extends {
  publicationDate?: string;
  publishedAt?: string | Date;
  createdAt?: string | Date;
}>(blogs: T[]): T[] {
  return [...blogs].sort((a, b) => {
    const timeA = getBlogSortTimestamp(a);
    const timeB = getBlogSortTimestamp(b);
    return timeA - timeB;
  });
}
