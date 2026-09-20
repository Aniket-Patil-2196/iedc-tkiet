import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { constructMetadata } from "@/lib/seo/metadata";
import { getPublishedBlogBySlug, getPublishedBlogs } from "@/lib/db/queries";
import { formatEventDate } from "@/lib/utils/event-status";
import { PostageStamp } from "@/components/blog/PostageStamp";
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

  return constructMetadata({
    title: `${article.title} — The Innovation Journal`,
    description: article.excerpt,
    path: `/blog/${article.slug}`,
  });
}

function extractManuscriptDropCap(text: string): { dropCap: string; remainder: string } {
  if (!text) return { dropCap: "", remainder: "" };
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      const it = segmenter.segment(text)[Symbol.iterator]();
      const first = it.next().value;
      if (first) {
        return { dropCap: first.segment, remainder: text.slice(first.segment.length) };
      }
    } catch {
      // fallback
    }
  }
  const first = Array.from(text)[0] || "";
  return { dropCap: first, remainder: text.slice(first.length) };
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

  // Split content by double newlines for paragraph rendering
  const paragraphs = article.content.split("\n\n").filter(Boolean);
  const firstParagraph = paragraphs[0] || "";
  const remainingParagraphs = paragraphs.slice(1);
  const { dropCap, remainder: firstParaRemainder } = extractManuscriptDropCap(firstParagraph);

  return (
    <div className="flex flex-col flex-1 w-full min-h-screen bg-foundation-darkest py-6 sm:py-10 px-4 sm:px-6">
      {/* Top Breadcrumb: Clear Back to Journal link returning to book opened at post (?post=[slug]) */}
      <div className="max-w-4xl mx-auto w-full mb-6 flex items-center justify-between">
        <Link
          href={`/blog?post=${article.slug}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-brand-cyan/40 hover:border-brand-cyan text-xs font-mono uppercase tracking-wider text-brand-cyan hover:text-white transition-all shadow-md group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Journal (Spread View)</span>
        </Link>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
          <BookOpen className="w-3.5 h-3.5 text-brand-cyan" />
          <span>The Innovation Journal · Issue {currentIndex + 1}</span>
        </div>
      </div>

      {/* Main Single Manuscript Page Container with Paper Texture & Book Aesthetic */}
      <article className="relative max-w-4xl mx-auto w-full rounded-2xl border border-slate-700/80 bg-gradient-to-br from-[#080E20] via-[#0D1935] to-[#091124] shadow-[0_25px_60px_rgba(0,0,0,0.85)] p-6 sm:p-12 md:p-16 overflow-hidden">
        {/* Decorative Paper Vignette & Spine Layer */}
        <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-brand-cyan/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

        {/* Filigree Corner Accents */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-brand-cyan/40 rounded-tl" />
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-brand-cyan/40 rounded-tr" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-brand-cyan/40 rounded-bl" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-brand-cyan/40 rounded-br" />

        {/* 1. Manuscript Header / Running Head */}
        <header className="space-y-4 pb-8 border-b border-slate-700/60 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] sm:text-xs font-mono text-brand-cyan uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
              IEDC TKIET ARCHIVAL MANUSCRIPT
            </span>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-brand-cyan" />
                {formatEventDate(article.publicationDate || article.publishedAt)}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-brand-cyan" />
                {article.readTimeMinutes} min read
              </span>
            </div>
          </div>

          {/* Large Editorial Headline */}
          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.15]">
            {article.title}
          </h1>

          {/* Byline / Author */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-brand-cyan/90">
            <User className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Authored by {article.author || "IEDC TKIET"}</span>
          </div>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="font-sans text-sm sm:text-base text-slate-300 italic border-l-2 border-brand-cyan/50 pl-4 py-1 leading-relaxed">
              {article.excerpt}
            </p>
          )}
        </header>

        {/* 2. Vintage Stamp Figures & Primary Visual Stack */}
        <section className="py-8 relative z-10">
          <PostageStamp blog={article} isManuscriptFullPage={true} />
        </section>

        {/* 3. Manuscript Body Text with Literary Serif & Kalam Drop Cap */}
        <section className="space-y-6 pt-4 pb-12 relative z-10">
          {firstParagraph && (
            <p className="font-book-body text-base sm:text-lg md:text-[19px] text-slate-200/90 leading-[1.8] text-justify">
              {dropCap && (
                <span className="float-left text-5xl sm:text-6xl font-book-handwriting font-bold text-brand-cyan mr-3.5 sm:mr-4 leading-[0.75] select-none">
                  {dropCap}
                </span>
              )}
              {firstParaRemainder}
            </p>
          )}

          {remainingParagraphs.map((para, idx) => (
            <p
              key={idx}
              className="font-book-body text-base sm:text-lg md:text-[19px] text-slate-200/90 leading-[1.8] text-justify"
            >
              {para}
            </p>
          ))}
        </section>

        {/* 4. Archival End Seal & Navigation */}
        <footer className="pt-8 border-t border-slate-700/60 relative z-10 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
              <span>Verified Archival Entry · IEDC TKIET Warananagar</span>
            </div>
            <Link
              href={`/blog?post=${article.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-cyan text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-md transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read in 3D Book Mode</span>
            </Link>
          </div>

          {/* Adjacent Articles Navigation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            {prevArticle ? (
              <Link
                href={`/blog/${prevArticle.slug}`}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-brand-cyan/50 transition-all group flex flex-col justify-between"
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-brand-cyan flex items-center gap-1 mb-1.5">
                  <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                  Previous Post
                </span>
                <span className="font-display font-bold text-sm text-white line-clamp-1 group-hover:text-brand-cyan transition-colors">
                  {prevArticle.title}
                </span>
              </Link>
            ) : (
              <div />
            )}

            {nextArticle && (
              <Link
                href={`/blog/${nextArticle.slug}`}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-brand-cyan/50 transition-all group flex flex-col justify-between text-right"
              >
                <span className="text-[10px] font-mono uppercase tracking-widest text-brand-cyan flex items-center justify-end gap-1 mb-1.5">
                  Next Post
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="font-display font-bold text-sm text-white line-clamp-1 group-hover:text-brand-cyan transition-colors">
                  {nextArticle.title}
                </span>
              </Link>
            )}
          </div>
        </footer>
      </article>
    </div>
  );
}
