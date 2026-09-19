import { constructMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { getPublishedBlogs } from "@/lib/db/queries";
import { InnovationJournalBook } from "@/components/blog/InnovationJournalBook";
import Link from "next/link";
import { formatEventDate } from "@/lib/utils/event-status";

export const metadata = constructMetadata({
  title: "Innovation Journal — Blog",
  description:
    "An interactive innovation journal presenting editorial perspectives on engineering breakthroughs, student incubation, and entrepreneurial thinking from IEDC TKIET.",
  path: "/blog",
});

export default async function BlogPage() {
  // 1. Strict published filter: draft articles are never shown publicly
  const publishedBlogs = await getPublishedBlogs();

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden bg-foundation-darkest min-h-screen">
      {/* Interactive Innovation Journal Experience */}
      <Section spacing="lg" className="bg-foundation-darkest py-8 sm:py-12">
        <Container size="xl">
          <InnovationJournalBook blogs={publishedBlogs} />
        </Container>
      </Section>

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
            <time dateTime={new Date(article.publicationDate || article.publishedAt || article.createdAt || new Date().toISOString()).toISOString()}>
              {formatEventDate(article.publicationDate || article.publishedAt || article.createdAt)}
            </time>
            <span>Author: {article.author}</span>
            <div>{article.content}</div>
          </article>
        ))}
      </section>
    </div>
  );
}
