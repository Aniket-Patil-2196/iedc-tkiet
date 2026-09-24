import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { constructMetadata } from "@/lib/seo/metadata";
import { getPublishedBlogBySlug, getPublishedBlogs } from "@/lib/db/queries";
import { formatEventDate } from "@/lib/utils/event-status";
import { PostageStamp } from "@/components/blog/PostageStamp";
import { BlogCommentsSection } from "@/components/blog/BlogCommentsSection";
import { BlogManuscriptBody } from "@/components/blog/BlogManuscriptBody";
import { ArrowLeft, ArrowRight, BookOpen, Sparkles, Calendar, Clock, User } from "lucide-react";

export const dynamic = "force-dynamic";

interface BlogArticlePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const article = await getPublishedBlogBySlug(params.slug);

  if (!article) {
    return constructMetadata({
      title: "Article Not Found",
      path: `/blog/${params.slug}`,
      noIndex: true,
    });
  }

  const seoTitle = article.seo?.title?.trim() || article.title;
  const seoDescription =
    article.seo?.description?.trim() || article.excerpt;

  return constructMetadata({
    title: `${seoTitle} — The Innovation Blog`,
    description: seoDescription,
    path: `/blog/${article.slug}`,
  });
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  // Only published articles are accessible; drafts trigger notFound()
  const article = await getPublishedBlogBySlug(params.slug);
  if (!article) {
    notFound();
  }

  const publishedArticles = await getPublishedBlogs();
  const currentIndex = publishedArticles.findIndex(
    (b) => b.slug === params.slug
  );

  const prevArticle = currentIndex > 0 ? publishedArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex !== -1 && currentIndex < publishedArticles.length - 1
      ? publishedArticles[currentIndex + 1]
      : null;

  return (
    <div className="flex flex-col flex-1 w-full min-h-screen bg-foundation-darkest py-6 sm:py-10 px-4 sm:px-6">
      {/* Top Breadcrumb: Clear Back to Blog link returning to book opened at post (?post=[slug]) */}
      <div className="max-w-4xl mx-auto w-full mb-6 flex items-center justify-between">
        <Link
          href={`/blog?post=${article.slug}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-brand-cyan/40 hover:border-brand-cyan text-xs font-mono uppercase tracking-wider text-brand-cyan hover:text-white transition-all shadow-md group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to the Blog</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
          <BookOpen className="w-3.5 h-3.5 text-brand-cyan" />
          <span>The Innovation Blog · Edition {currentIndex + 1}</span>
        </div>
      </div>

      {/* Main Single Manuscript Page Container with Paper Texture & Book Aesthetic */}
      <article className="relative max-w-4xl mx-auto w-full rounded-2xl border border-amber-950/25 book-paper-sheet shadow-[0_25px_60px_rgba(0,0,0,0.85)] p-6 sm:p-12 md:p-16 overflow-hidden">
        {/* Decorative Paper Vignette & Left Spine Layer */}
        <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-[var(--paper-shade)]/30 to-transparent pointer-events-none" />

        {/* Filigree Corner Accents */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-amber-950/30 rounded-tl" />
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-amber-950/30 rounded-tr" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-amber-950/30 rounded-bl" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-amber-950/30 rounded-br" />

        {/* 1. Manuscript Header / Running Head */}
        <header className="space-y-4 pb-8 border-b border-amber-950/15 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] sm:text-xs font-mono text-[var(--ink-accent)] uppercase tracking-wider">
            <span className="flex items-center gap-1.5 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[var(--ink-accent)]" />
              IEDC TKIET ARCHIVAL MANUSCRIPT
            </span>
            <div className="flex items-center gap-3 text-[var(--ink-muted)]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[var(--ink-accent)]" />
                {formatEventDate(article.publicationDate || article.publishedAt)}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-[var(--ink-accent)]" />
                {article.readTimeMinutes} min read
              </span>
            </div>
          </div>

          {/* Large Editorial Headline */}
          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--ink-heading)] leading-[1.15]">
            {article.title}
          </h1>

          {/* Byline / Author */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-[var(--ink-muted)]">
            <User className="w-3.5 h-3.5 text-[var(--ink-accent)]" />
            <span>Authored by {article.author || "IEDC TKIET"}</span>
          </div>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="font-sans text-sm sm:text-base text-[var(--ink-muted)] italic border-l-2 border-[var(--ink-accent)]/40 pl-4 py-1 leading-relaxed">
              {article.excerpt}
            </p>
          )}
        </header>

        {/* 2. Vintage Stamp Figures & Primary Visual Stack */}
        <section className="py-8 relative z-10">
          <PostageStamp blog={article} isManuscriptFullPage={true} />
        </section>

        {/* 3. Manuscript Body Text with Literary Serif & Kalam Drop Cap */}
        <BlogManuscriptBody content={article.content} />

        {/* 4. Archival End Seal & Navigation */}
        <footer className="pt-8 border-t border-amber-950/15 relative z-10 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[var(--ink-muted)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--ink-accent)] animate-pulse" />
              <span>Verified Archival Entry · IEDC TKIET Warananagar</span>
            </div>
            <Link
              href={`/blog?post=${article.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--ink-heading)] text-[var(--paper)] font-bold text-xs uppercase tracking-wider hover:bg-slate-900 shadow-md transition-all border border-amber-950/20"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read in 3D Book Mode</span>
            </Link>
          </div>

          {/* Adjacent Articles Navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-amber-950/10">
            {prevArticle ? (
              <Link
                href={`/blog/${prevArticle.slug}`}
                className="p-4 rounded-xl bg-[#EDE2CB]/70 border border-amber-950/20 hover:border-[var(--ink-accent)]/50 transition-all group flex flex-col justify-between"
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--ink-accent)] flex items-center gap-1 mb-1.5 font-semibold">
                  <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                  Previous Post
                </span>
                <span className="font-display font-bold text-sm text-[var(--ink-heading)] line-clamp-1 group-hover:text-[var(--ink-accent)] transition-colors">
                  {prevArticle.title}
                </span>
              </Link>
            ) : (
              <div />
            )}

            {nextArticle && (
              <Link
                href={`/blog/${nextArticle.slug}`}
                className="p-4 rounded-xl bg-[#EDE2CB]/70 border border-amber-950/20 hover:border-[var(--ink-accent)]/50 transition-all group flex flex-col justify-between text-right"
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--ink-accent)] flex items-center justify-end gap-1 mb-1.5 font-semibold">
                  Next Post
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="font-display font-bold text-sm text-[var(--ink-heading)] line-clamp-1 group-hover:text-[var(--ink-accent)] transition-colors">
                  {nextArticle.title}
                </span>
              </Link>
            )}
          </div>
        </footer>
      </article>

      {/* Readers' Remarks & Moderated Comments Section */}
      <BlogCommentsSection blogSlug={article.slug} blogTitle={article.title} />
    </div>
  );
}
