"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { IBlog } from "@/types/content";
import { PostageStamp } from "./PostageStamp";
import { BlogCommentsSection } from "./BlogCommentsSection";
import { ImageLightbox } from "./ImageLightbox";
import { SITE_CONFIG } from "@/lib/constants/site";
import { cn } from "@/lib/utils";
import { stripHtmlToPlainText } from "@/lib/utils/blog-validation";
import { formatEventDate } from "@/lib/utils/event-status";

// ---------------------------------------------------------------------------
// Types / helpers (mirrors desktop logic exactly — no divergence)
// ---------------------------------------------------------------------------

interface MobileBookLayoutProps {
  blogs: IBlog[];
  initialPostSlug?: string;
}

function isDevPlaceholder(b: IBlog) {
  return b.id?.startsWith("blog-placeholder") || b.id?.startsWith("placeholder");
}

function getPubDate(blog: IBlog) {
  const raw = blog.publishedAt || blog.publicationDate || blog.createdAt;
  return formatEventDate(raw);
}

function extractDropCap(text: string): { dropCap: string; remainder: string } {
  if (!text) return { dropCap: "", remainder: "" };
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      const it = segmenter.segment(text)[Symbol.iterator]();
      const first = it.next().value;
      if (first) return { dropCap: first.segment, remainder: text.slice(first.segment.length) };
    } catch {
      // fallback
    }
  }
  const first = Array.from(text)[0] || "";
  return { dropCap: first, remainder: text.slice(first.length) };
}

// Mobile text capacity: fits comfortably inside standardized card height
const MOBILE_TEXT_CAPACITY = 360;

function computeTextFitting(rawContent: string): {
  displayText: string;
  isTruncated: boolean;
  dropCap: string;
  remainder: string;
} {
  const plain = stripHtmlToPlainText(rawContent);
  if (!plain) return { displayText: "", isTruncated: false, dropCap: "", remainder: "" };

  if (plain.length <= MOBILE_TEXT_CAPACITY * 1.05) {
    const { dropCap, remainder } = extractDropCap(plain);
    return { displayText: plain, isTruncated: false, dropCap, remainder };
  }

  const windowSlice = plain.slice(0, MOBILE_TEXT_CAPACITY);
  const sentenceEndRegex = /[.!?।]\s+|\n\n/g;
  let lastMatchIndex = -1;
  let match: RegExpExecArray | null;
  while ((match = sentenceEndRegex.exec(windowSlice)) !== null) {
    if (match.index >= MOBILE_TEXT_CAPACITY * 0.55) lastMatchIndex = match.index;
  }

  let truncated = "";
  if (lastMatchIndex !== -1) {
    truncated = windowSlice.slice(0, lastMatchIndex + 1).trim();
  } else {
    const lastSpace = windowSlice.lastIndexOf(" ");
    truncated =
      lastSpace > MOBILE_TEXT_CAPACITY * 0.7
        ? windowSlice.slice(0, lastSpace).trim() + "..."
        : windowSlice.trim() + "...";
  }

  const { dropCap, remainder } = extractDropCap(truncated);
  return { displayText: truncated, isTruncated: true, dropCap, remainder };
}

// ---------------------------------------------------------------------------
// Card IDs so we can scroll-into-view cleanly
// ---------------------------------------------------------------------------
const COVER_CARD_ID = "mobile-card-cover";
const PREFACE_CARD_ID = "mobile-card-preface";

function postCardId(idx: number) {
  return `mobile-card-post-${idx}`;
}

// ---------------------------------------------------------------------------
// Decorative spiral notebook wire loops along top edge of paper cards
// ---------------------------------------------------------------------------
function SpiralBinding() {
  return (
    <div
      aria-hidden="true"
      className="absolute -top-2.5 inset-x-0 flex justify-evenly items-center px-4 pointer-events-none z-30 select-none"
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          {/* Metallic wire coil loop */}
          <div className="w-2.5 h-4.5 rounded-full border border-slate-500/80 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 shadow-[0_1px_3px_rgba(0,0,0,0.35)]" />
          {/* Hole punch simulation */}
          <div className="w-1.5 h-1.5 -mt-1 rounded-full bg-[#3B2F1D]/45 shadow-inner" />
        </div>
      ))}
    </div>
  );
}

// Subtle ruled-paper background texture (faint horizontal lines at 28px intervals)
const ruledPaperStyle: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(170, 145, 110, 0.16) 27px, rgba(170, 145, 110, 0.16) 28px)",
  backgroundPosition: "0 8px",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MobileBookLayout({ blogs, initialPostSlug }: MobileBookLayoutProps) {
  const initialPostIndex = initialPostSlug
    ? blogs.findIndex((b) => b.slug === initialPostSlug)
    : -1;

  const [activeCardIndex, setActiveCardIndex] = useState(
    initialPostIndex !== -1 ? initialPostIndex + 3 /* cover + preface + contents */ : 0
  );
  const [currentPost, setCurrentPost] = useState<IBlog | null>(
    initialPostIndex !== -1 ? blogs[initialPostIndex] ?? null : null
  );
  const [lightboxImage, setLightboxImage] = useState<{
    src: string;
    alt: string;
    caption?: string;
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Total card count for progress indicator ──────────────────────────────
  // cover (0) + preface (1) + contents (2) + posts × N + back cover
  const totalCards = 1 + 1 + 1 + blogs.length + 1;

  // ── Smooth-scroll to card helper ─────────────────────────────────────────
  const scrollToCard = useCallback((cardId: string) => {
    const el = document.getElementById(cardId);
    el?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ── Open button handler: glides to preface ───────────────────────────────
  const handleOpen = useCallback(() => {
    scrollToCard(PREFACE_CARD_ID);
  }, [scrollToCard]);

  // ── Return to cover handler ──────────────────────────────────────────────
  const handleReturnToCover = useCallback(() => {
    scrollToCard(COVER_CARD_ID);
  }, [scrollToCard]);

  // ── Track which card is visible via IntersectionObserver ─────────────────
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const cards = scrollContainerRef.current.querySelectorAll<HTMLElement>(
      "[data-mobile-card-index]"
    );
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const idx = Number((entry.target as HTMLElement).dataset.mobileCardIndex);
            setActiveCardIndex(idx);

            // Determine currentPost from card index:
            // card 0 = cover, 1 = preface, 2 = contents, 3..3+N-1 = posts, last = back cover
            const postCardStart = 3;
            const postCardEnd = postCardStart + blogs.length;
            if (idx >= postCardStart && idx < postCardEnd) {
              const blogIdx = idx - postCardStart;
              setCurrentPost(blogs[blogIdx] ?? null);

              // Sync ?post= in URL
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                const slug = blogs[blogIdx]?.slug;
                if (slug && url.searchParams.get("post") !== slug) {
                  url.searchParams.set("post", slug);
                  window.history.replaceState(null, "", url.toString());
                }
              }
            } else {
              setCurrentPost(null);
              if (typeof window !== "undefined") {
                const url = new URL(window.location.href);
                if (url.searchParams.has("post")) {
                  url.searchParams.delete("post");
                  window.history.replaceState(null, "", url.toString());
                }
              }
            }
          }
        }
      },
      { threshold: 0.5 }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [blogs]);

  // ── Scroll to initial post if URL had ?post= ─────────────────────────────
  useEffect(() => {
    if (initialPostIndex === -1) return;
    const el = document.getElementById(postCardId(initialPostIndex));
    if (el) el.scrollIntoView({ behavior: "instant" });
  }, [initialPostIndex]);

  // ── Standardized card dimensions ─────────────────────────────────────────
  const cardOuterHeight = "calc(100svh - 72px - 52px)";
  const cardCoverClass =
    "relative w-full max-w-sm mx-4 h-[min(560px,88%)] rounded-2xl border overflow-hidden shadow-xl flex flex-col";
  const cardPaperClass =
    "relative w-full max-w-sm mx-4 h-[min(560px,88%)] rounded-2xl border border-[#D6C4A5] bg-[#F2E9D6] shadow-xl flex flex-col overflow-visible";

  return (
    <div className="w-full flex flex-col items-center">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="w-full px-4 pt-1 pb-2.5 border-b border-foundation-slate/50 select-none shrink-0 min-h-[72px] flex flex-col justify-center">
        <div className="flex flex-col items-start gap-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-foundation-slate/60 border border-brand-cyan/30 text-[10px] font-mono tracking-widest text-brand-cyan uppercase font-bold">
            <Sparkles className="w-3 h-3 text-brand-cyan" />
            IEDC TKIET
          </span>
          <h1 className="font-display font-bold text-typo-white tracking-tight text-[clamp(1.75rem,6vw,2.25rem)] leading-tight">
            The Innovation Blog
          </h1>
        </div>
      </header>

      {/* ── Scroll container with CSS scroll-snap (Issue 1) ───────────────── */}
      <div
        ref={scrollContainerRef}
        className="w-full overflow-y-scroll"
        style={{
          scrollSnapType: "y mandatory",
          height: cardOuterHeight,
          maxHeight: cardOuterHeight,
          touchAction: "pan-y",
          overscrollBehaviorY: "contain",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* ── CARD 0: Front Cover (Issue 5: Always scrollable in the stack) ── */}
        <div
          id={COVER_CARD_ID}
          data-mobile-card-index={0}
          className="w-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#060D1E] via-[#0A1633] to-[#040814]"
          style={{ height: cardOuterHeight, scrollSnapAlign: "start" }}
        >
          <div className={cn(cardCoverClass, "border-2 border-slate-700/80 bg-gradient-to-br from-[#060D1E] via-[#0A1633] to-[#040814]")}>
            {/* Spine crease shading on left edge */}
            <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black via-black/60 to-transparent pointer-events-none z-10" />

            {/* Silk bookmark ribbon */}
            <div
              className="absolute bottom-0 left-10 w-4 h-9 bg-gradient-to-b from-[#1E3A8A] via-[#1E40AF] to-[#172554] shadow-md z-20 pointer-events-none"
              style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 7px), 0 100%)" }}
            >
              <div className="absolute inset-y-0 left-0 w-px bg-amber-300/40" />
              <div className="absolute inset-y-0 right-0 w-px bg-amber-300/40" />
            </div>

            {/* Embossed inner frame */}
            <div className="relative w-full h-full border border-slate-700/70 rounded-xl p-5 flex flex-col justify-between">
              {/* Corner accents */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-brand-cyan/60 rounded-tl" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-brand-cyan/60 rounded-tr" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-brand-cyan/60 rounded-bl" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-brand-cyan/60 rounded-br" />

              {/* Top: logo + institution */}
              <div className="space-y-1.5 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-900/80 border border-brand-cyan/40 shadow-[0_0_15px_rgba(56,189,248,0.25)] p-1.5 mx-auto">
                  <Image
                    src="/images/iedc-logo.png"
                    alt="IEDC Logo"
                    width={36}
                    height={36}
                    className="object-contain"
                    priority
                  />
                </div>
                <span className="block text-[11px] font-mono tracking-[0.25em] text-slate-300 uppercase font-semibold">
                  {SITE_CONFIG.name}
                </span>
              </div>

              {/* Title area */}
              <div className="space-y-2 text-center my-auto py-2">
                <span className="block text-xs font-mono tracking-[0.3em] text-brand-cyan/90 uppercase">
                  THE
                </span>
                <h2 className="font-display font-bold uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-brand-cyan drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-tight text-[clamp(1.6rem,7vw,2.2rem)]">
                  INNOVATION
                </h2>
                <span className="block font-display text-lg font-semibold text-slate-200 tracking-wider">
                  BLOG
                </span>
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-brand-cyan to-transparent mx-auto" />
                <span className="block text-[11px] font-sans text-slate-400 font-medium">
                  Ideas · People · Impact
                </span>
              </div>

              {/* Open CTA & Swipe Hint (Issue 4 & Issue 5) */}
              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={handleOpen}
                  aria-label="Open The Innovation Blog"
                  className="inline-flex items-center justify-center gap-2 px-6 min-h-[44px] rounded-full bg-slate-900/90 border border-brand-cyan/40 text-xs font-mono tracking-wider uppercase text-brand-cyan hover:border-brand-cyan active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Open blog →</span>
                </button>

                <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-brand-cyan/70 tracking-wider">
                  <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
                  <span>Swipe up to explore</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CARD 1: Editorial Preface ──────────────────────────────────── */}
        <div
          id={PREFACE_CARD_ID}
          data-mobile-card-index={1}
          className="w-full flex-shrink-0 flex items-center justify-center book-paper-sheet"
          style={{ height: cardOuterHeight, scrollSnapAlign: "start" }}
        >
          <div className={cardPaperClass}>
            {/* Spiral binding along top edge */}
            <SpiralBinding />

            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-[#D8C7A7] text-[10px] font-mono text-[#4B5468] tracking-wider uppercase font-semibold shrink-0">
              <span>{SITE_CONFIG.name}</span>
              <span>PREFACE</span>
            </div>

            <div
              style={ruledPaperStyle}
              className="flex-1 overflow-y-auto p-4 space-y-3.5 overscroll-contain rounded-b-2xl"
            >
              <h2 className="font-display text-2xl font-bold text-[#0F1B44] tracking-tight">
                Editorial Preface
              </h2>

              <p className="font-sans text-sm text-[#1B2333] leading-relaxed">
                Welcome to{" "}
                <span className="text-[#1E40AF] font-semibold">The Innovation Blog</span>, the
                institutional publication of the {SITE_CONFIG.fullName} at {SITE_CONFIG.institution}.
              </p>
              <p className="font-sans text-sm text-[#1B2333] leading-relaxed">
                Here we document student ventures, patent drafts, interdisciplinary engineering
                research, and entrepreneurial breakthroughs emerging from campus incubators.
              </p>

              <div className="p-3 rounded-xl bg-[#FAF5EA] border border-[#DACBB5] space-y-1 shadow-sm">
                <span className="text-[10px] font-mono text-[#1E40AF] uppercase tracking-widest block font-bold">
                  CELL VISION
                </span>
                <span className="text-xs text-[#4B5468] leading-relaxed block font-medium">
                  {SITE_CONFIG.tagline}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center py-2.5 border-t border-[#D8C7A7] shrink-0">
              <span className="flex items-center gap-1 text-[10px] font-mono text-[#4B5468] uppercase tracking-wider">
                <ChevronDown className="w-3 h-3" />
                Scroll for articles
              </span>
            </div>
          </div>
        </div>

        {/* ── CARD 2: Table of Contents ──────────────────────────────────── */}
        <div
          data-mobile-card-index={2}
          className="w-full flex-shrink-0 flex items-center justify-center book-paper-sheet"
          style={{ height: cardOuterHeight, scrollSnapAlign: "start" }}
        >
          <div className={cardPaperClass}>
            {/* Spiral binding along top edge */}
            <SpiralBinding />

            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-[#D8C7A7] text-[10px] font-mono text-[#4B5468] tracking-wider uppercase font-semibold shrink-0">
              <span>TABLE OF CONTENTS</span>
              <span>{blogs.length} ARTICLES</span>
            </div>

            <div
              style={ruledPaperStyle}
              className="flex-1 overflow-y-auto p-4 space-y-2 overscroll-contain"
            >
              <h3 className="font-display text-xl font-bold text-[#0F1B44] tracking-tight">
                Published Articles
              </h3>

              {blogs.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <BookOpen className="w-8 h-8 text-[#1E40AF]/60 mx-auto" />
                  <p className="font-sans text-xs text-[#4B5468]">Stories are coming soon.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {blogs.map((b, idx) => {
                    const targetId = postCardId(idx);
                    return (
                      <button
                        key={b.id || b.slug}
                        type="button"
                        onClick={() => scrollToCard(targetId)}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-[#EAE0CA]/70 border border-transparent hover:border-[#DACBB5] transition-colors group flex items-start justify-between gap-2 min-h-[44px] cursor-pointer"
                      >
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-mono text-[#1E40AF] font-bold shrink-0">
                              {(idx + 1).toString().padStart(2, "0")}
                            </span>
                            <span className="font-display text-sm font-semibold text-[#0F1B44] group-hover:text-[#1E40AF] truncate transition-colors">
                              {b.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-[#4B5468] block pl-5 truncate">
                            {getPubDate(b)} · {b.readTimeMinutes || 3} min read
                          </span>
                        </div>
                        <span className="text-xs font-mono text-[#1E40AF] opacity-60 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5">
                          →
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center py-2.5 border-t border-[#D8C7A7] shrink-0">
              <span className="flex items-center gap-1 text-[10px] font-mono text-[#4B5468] uppercase tracking-wider">
                <ChevronDown className="w-3 h-3" />
                Scroll to read
              </span>
            </div>
          </div>
        </div>

        {/* ── CARDS 3..3+N-1: Individual Post Cards ──────────────────────── */}
        {blogs.map((blog, idx) => {
          const { dropCap, remainder, isTruncated } = computeTextFitting(
            blog.content || blog.excerpt || ""
          );
          const cardIndex = 3 + idx;

          return (
            <div
              key={blog.id || blog.slug}
              id={postCardId(idx)}
              data-mobile-card-index={cardIndex}
              className="w-full flex-shrink-0 flex items-center justify-center book-paper-sheet"
              style={{ height: cardOuterHeight, scrollSnapAlign: "start" }}
            >
              <div className={cardPaperClass}>
                {/* Spiral binding along top edge */}
                <SpiralBinding />

                {/* Running header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-[#D8C7A7] text-[10px] font-mono text-[#4B5468] tracking-wider uppercase font-semibold shrink-0">
                  <span className="text-[#1E40AF]">
                    ARTICLE {(idx + 1).toString().padStart(2, "0")}
                    {isDevPlaceholder(blog) && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300">
                        <AlertTriangle className="w-2.5 h-2.5" /> Dev
                      </span>
                    )}
                  </span>
                  <span>{getPubDate(blog)} · {blog.readTimeMinutes || 3} MIN</span>
                </div>

                {/* Scrollable card body with ruled paper background */}
                <div
                  style={ruledPaperStyle}
                  className="flex-1 overflow-y-auto px-4 pt-3 pb-16 space-y-3 overscroll-contain rounded-b-2xl"
                >
                  {/* Postage stamp figure */}
                  <PostageStamp blog={blog} onOpenLightbox={(img) => setLightboxImage(img)} />

                  {/* Title + author */}
                  <div className="space-y-0.5">
                    <h3 className="font-display text-base font-bold text-[#0F1B44] tracking-tight leading-snug">
                      {blog.title}
                    </h3>
                    <div className="text-[11px] font-mono text-[#1E40AF] font-semibold">
                      By {blog.author || SITE_CONFIG.name}
                    </div>
                  </div>

                  {/* Body text with drop cap */}
                  <div className="relative">
                    <p className="font-book-body text-[#1B2333] tracking-normal text-left text-[15px] leading-[1.65] [hyphens:manual] [overflow-wrap:anywhere]">
                      {dropCap && (
                        <span className="float-left text-4xl font-book-handwriting font-bold ink-drop-cap mr-2 leading-[0.8] select-none">
                          {dropCap}
                        </span>
                      )}
                      {remainder}
                    </p>

                    {isTruncated && (
                      <div
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#F2E9D6] via-[#F2E9D6]/80 to-transparent pointer-events-none"
                      />
                    )}
                  </div>

                  {/* Read full post link */}
                  <Link
                    href={`/blog/${blog.slug}`}
                    className="inline-flex items-center gap-1.5 text-[#1E40AF] hover:text-[#2563EB] hover:underline text-xs font-mono font-semibold group min-h-[36px]"
                  >
                    <span>Read full manuscript</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {/* Hanging swallowtail ribbon (Issue 4: comfortable touch target) */}
                {isTruncated && (
                  <div className="absolute bottom-0 right-5 z-30 group">
                    <Link
                      href={`/blog/${blog.slug}`}
                      className="relative flex items-center justify-center px-4 pt-2 pb-3.5 min-h-[44px] bg-gradient-to-b from-[#1E3A8A] via-[#1E40AF] to-[#172554] text-[#FBF6E9] font-book-handwriting font-bold text-xs tracking-wide shadow-[0_4px_14px_rgba(74,52,24,0.35)] transition-all group-hover:translate-y-1"
                      style={{
                        clipPath:
                          "polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 7px), 0 100%)",
                      }}
                      title="Continue reading this post"
                    >
                      <span>Continue reading ➔</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* ── LAST CARD: Back cover ──────────────────────────────────────── */}
        <div
          data-mobile-card-index={totalCards - 1}
          className="w-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#060D1E] via-[#0A1633] to-[#040814]"
          style={{ height: cardOuterHeight, scrollSnapAlign: "start" }}
        >
          <div className={cn(cardCoverClass, "border-2 border-slate-700/80 bg-gradient-to-br from-[#060D1E] via-[#0A1633] to-[#040814]")}>
            <div className="relative w-full h-full p-5 flex flex-col justify-between">
              {/* Spine crease on right */}
              <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black via-black/60 to-transparent pointer-events-none" />

              <div className="relative w-full h-full border border-slate-700/70 rounded-xl p-5 flex flex-col justify-between">
                <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-brand-cyan/60 rounded-tl" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-brand-cyan/60 rounded-tr" />
                <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-brand-cyan/60 rounded-bl" />
                <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-brand-cyan/60 rounded-br" />

                <div className="space-y-1.5 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-900/80 border border-brand-cyan/40 shadow-[0_0_15px_rgba(56,189,248,0.25)] p-1.5 mx-auto">
                    <Image
                      src="/images/iedc-logo.png"
                      alt="IEDC Logo"
                      width={36}
                      height={36}
                      className="object-contain"
                      loading="lazy"
                    />
                  </div>
                  <span className="block text-[11px] font-mono tracking-[0.25em] text-slate-300 uppercase font-semibold">
                    {SITE_CONFIG.fullName}
                  </span>
                </div>

                <div className="space-y-1.5 text-center my-auto py-2">
                  <span className="block text-[10px] font-mono tracking-[0.25em] text-brand-cyan/80 uppercase">
                    ARCHIVAL ACCESSION
                  </span>
                  <h3 className="font-display text-lg font-bold uppercase text-slate-200">
                    IEDC TKIET
                  </h3>
                  <p className="text-[11px] font-sans text-slate-400 max-w-[220px] mx-auto leading-relaxed">
                    Official publication for research dissemination, prototype records, and
                    student incubation archives.
                  </p>

                  {/* Barcode simulation */}
                  <div className="pt-1 flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1 justify-center py-1 opacity-60">
                      <div className="w-0.5 h-5 bg-slate-300" />
                      <div className="w-1.5 h-5 bg-slate-300" />
                      <div className="w-0.5 h-5 bg-slate-300" />
                      <div className="w-1 h-5 bg-slate-300" />
                      <div className="w-2 h-5 bg-slate-300" />
                      <div className="w-0.5 h-5 bg-slate-300" />
                      <div className="w-1 h-5 bg-slate-300" />
                      <div className="w-1.5 h-5 bg-slate-300" />
                      <div className="w-0.5 h-5 bg-slate-300" />
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 tracking-widest">
                      DOC-REF-2024-IEDC-TKIET
                    </span>
                  </div>
                </div>

                {/* Return button (Issue 4: >= 44px min-h) */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleReturnToCover}
                    aria-label="Return to Front Cover"
                    className="inline-flex items-center justify-center gap-2 px-6 min-h-[44px] rounded-full bg-slate-900/90 border border-brand-cyan/40 text-xs font-mono tracking-wider uppercase text-brand-cyan hover:border-brand-cyan active:scale-95 transition-all shadow-md cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Return to Cover</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Archival Folio / Progress Indicator (Issue 3 & Issue 4) ────────── */}
      <div className="w-full flex items-center justify-center py-2 select-none shrink-0 min-h-[52px]">
        <div className="inline-flex items-center gap-2 pl-4 pr-1 py-1 rounded-full bg-[#FAF5EA] border border-[#DACBB5] text-[#1B2333] shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
          <span className="font-mono text-[11px] font-bold tracking-widest text-[#1E40AF] uppercase">
            PAGE {activeCardIndex + 1} OF {totalCards}
          </span>
          {activeCardIndex > 0 && (
            <button
              type="button"
              onClick={handleReturnToCover}
              className="min-w-[44px] min-h-[44px] -my-1.5 flex items-center justify-center text-[#4B5468] hover:text-[#0F1B44] active:scale-95 transition-all cursor-pointer"
              aria-label="Return to cover"
              title="Return to cover"
            >
              <span className="text-xs font-mono font-bold bg-[#EAE0CA] text-[#4B5468] rounded-full w-5 h-5 flex items-center justify-center">
                ✕
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── Comments section (shared between mobile and desktop logic) ─────── */}
      <div className="w-full max-w-2xl mx-auto px-4 pt-6 pb-12">
        {currentPost ? (
          <BlogCommentsSection blogSlug={currentPost.slug} blogTitle={currentPost.title} />
        ) : (
          <div className="w-full py-8 px-6 rounded-2xl bg-foundation-dark/40 border border-slate-800/80 text-center select-none">
            <p className="text-xs font-mono text-typo-gray/70">
              Open a story to read and join the discussion
            </p>
          </div>
        )}
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────────────── */}
      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          caption={lightboxImage.caption}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}
