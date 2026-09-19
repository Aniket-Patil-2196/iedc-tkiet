import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { constructMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { getPublishedBlogBySlug, getPublishedBlogs } from "@/lib/db/queries";
import { formatEventDate } from "@/lib/utils/event-status";
import { Calendar, Clock, ArrowLeft, ArrowRight, BookOpen, ShieldCheck } from "lucide-react";

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
    title: article.title,
    description: article.excerpt,
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

  // Split content by double newlines for safe paragraph rendering without dangerouslySetInnerHTML
  const paragraphs = article.content.split("\n\n").filter(Boolean);


  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden bg-foundation-darkest">
      <Section spacing="md" className="border-b border-foundation-slate/50">
        <Container size="md">
          {/* Back to Blog */}
          <div className="mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-xs uppercase font-sans tracking-widest text-typo-gray hover:text-brand-cyan transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Innovation Journal</span>
            </Link>
          </div>

          {/* Meta Information Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-typo-gray mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue/20 text-brand-cyan border border-brand-cyan/30 uppercase tracking-wider font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {article.author}
            </span>

            <div className="flex items-center gap-1.5 text-typo-white font-medium">
              <Calendar className="w-3.5 h-3.5 text-brand-cyan" />
              <span>{formatEventDate(article.publicationDate || article.publishedAt)}</span>
            </div>

            <span>•</span>

            <div className="flex items-center gap-1.5 text-typo-white font-medium">
              <Clock className="w-3.5 h-3.5 text-brand-cyan" />
              <span>{article.readTimeMinutes} min read</span>
            </div>
          </div>

          {/* Large Editorial Title */}
          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-typo-white leading-[1.08] text-balance mb-6">
            {article.title}
          </h1>

          {/* Lead Excerpt */}
          <p className="font-sans text-lg sm:text-xl text-typo-gray leading-relaxed font-normal">
            {article.excerpt}
          </p>
        </Container>
      </Section>

      {/* Main Reading Section */}
      <Section spacing="lg" className="bg-foundation-darkest">
        <Container size="md">
          {/* Cover Container */}
          <div className="relative w-full h-[240px] sm:h-[340px] rounded-2xl bg-gradient-to-br from-foundation-slate/70 via-foundation-dark to-[#0F172A] border border-foundation-slate flex items-center justify-center p-8 overflow-hidden mb-12">
            <div className="absolute inset-0 bg-[radial-gradient(#151B26_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />
            <div className="relative z-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-foundation-dark border border-brand-blue/40 flex items-center justify-center mx-auto shadow-lg">
                <BookOpen className="w-6 h-6 text-brand-cyan" />
              </div>
              <span className="text-xs font-sans uppercase tracking-widest text-brand-cyan font-bold block pt-1">
                Editorial Publication
              </span>
              <p className="text-xs font-sans text-typo-gray">
                Innovation & Entrepreneurship Development Cell • TKIET
              </p>
            </div>
          </div>

          {/* Editorial Article Body with comfortable line-length and readable spacing */}
          <div className="max-w-prose mx-auto space-y-6 text-typo-white/90 font-sans text-base sm:text-lg leading-[1.8] tracking-normal">
            {paragraphs.map((para, index) => (
              <p key={index} className="text-balance">
                {para}
              </p>
            ))}
          </div>

          {/* Article Footer & Adjacent Navigation */}
          <div className="max-w-prose mx-auto pt-16 mt-16 border-t border-foundation-slate/60 space-y-8">
            <div className="flex items-center justify-between text-xs font-sans text-typo-gray">
              <span>Published by {article.author}</span>
              <span>TKIET Warananagar</span>
            </div>

            {/* Previous & Next Navigation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {prevArticle ? (
                <Link
                  href={`/blog/${prevArticle.slug}`}
                  className="p-5 rounded-xl bg-foundation-dark border border-foundation-slate/80 hover:border-brand-blue/50 transition-all group flex flex-col justify-between"
                >
                  <span className="text-[10px] font-sans uppercase tracking-widest text-brand-cyan flex items-center gap-1 mb-2">
                    <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                    Previous Article
                  </span>
                  <span className="font-display font-bold text-sm text-typo-white line-clamp-2 group-hover:text-brand-cyan transition-colors">
                    {prevArticle.title}
                  </span>
                </Link>
              ) : (
                <div />
              )}

              {nextArticle && (
                <Link
                  href={`/blog/${nextArticle.slug}`}
                  className="p-5 rounded-xl bg-foundation-dark border border-foundation-slate/80 hover:border-brand-blue/50 transition-all group flex flex-col justify-between text-right"
                >
                  <span className="text-[10px] font-sans uppercase tracking-widest text-brand-cyan flex items-center justify-end gap-1 mb-2">
                    Next Article
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="font-display font-bold text-sm text-typo-white line-clamp-2 group-hover:text-brand-cyan transition-colors">
                    {nextArticle.title}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
