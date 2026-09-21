import { constructMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/Container";
import { getPublishedBlogs } from "@/lib/db/queries";
import { InnovationJournalBook } from "@/components/blog/InnovationJournalBook";
import Link from "next/link";
import { formatEventDate } from "@/lib/utils/event-status";

export const dynamic = "force-dynamic";

export const metadata = constructMetadata({
  title: "The Innovation Journal — Blog",
  description:
    "An interactive innovation journal presenting editorial perspectives on engineering breakthroughs, student incubation, and entrepreneurial thinking from IEDC TKIET.",
  path: "/blog",
});

interface BlogPageProps {
  searchParams?: Promise<{ post?: string }> | { post?: string };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  // 1. Strict published filter: draft articles are never shown publicly
  const publishedBlogs = await getPublishedBlogs();

  // 2. Resolve query parameters (?post=<slug>)
  const resolvedParams = searchParams ? await searchParams : undefined;
  const requestedSlug = resolvedParams?.post;

  // Ignore unknown or draft slugs; only pass valid published slug
  const validInitialSlug =
    requestedSlug && publishedBlogs.some((b) => b.slug === requestedSlug)
      ? requestedSlug
      : undefined;

  return (
    <div className="flex flex-col flex-1 w-full bg-foundation-darkest min-h-[calc(100svh-var(--header-height,4rem))] px-3 sm:px-6 pt-1 sm:pt-2 pb-4 sm:pb-6 [@media(max-height:700px)]:pt-0.5 [@media(max-height:700px)]:pb-1">
      {/* Container sizing the first screen cleanly */}
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
        <InnovationJournalBook
          blogs={publishedBlogs}
          initialPostSlug={validInitialSlug}
        />
      </div>

      {/* Accessible & SEO Semantic Archive Layer */}
      {/* This ensures web crawlers, search indexing bots, and assistive readers can index all published articles */}
      <section aria-label="Published Articles Index" className="sr-only">
        <h2>IEDC TKIET Published Articles Archive</h2>
        {publishedBlogs.map((article) => (
          <article key={article.id || article.slug}>
            <h3>
              <Link href={`/blog/${article.slug}`}>{article.title}</Link>
            </h3>
            <p>{article.excerpt}</p>
            <time
              dateTime={new Date(
                article.publicationDate ||
                  article.publishedAt ||
                  article.createdAt ||
                  new Date().toISOString()
              ).toISOString()}
            >
              {formatEventDate(
                article.publicationDate ||
                  article.publishedAt ||
                  article.createdAt
              )}
            </time>
            <span>Author: {article.author}</span>
            <div>{article.content}</div>
          </article>
        ))}
      </section>
    </div>
  );
}
