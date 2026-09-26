"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
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
// Types / helpers
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

const MOBILE_TEXT_CAPACITY = 420;

function computeTextFitting(rawContent: string): {
  isTruncated: boolean;
  dropCap: string;
  remainder: string;
} {
  const plain = stripHtmlToPlainText(rawContent);
  if (!plain) return { isTruncated: false, dropCap: "", remainder: "" };

  if (plain.length <= MOBILE_TEXT_CAPACITY * 1.05) {
    const { dropCap, remainder } = extractDropCap(plain);
    return { isTruncated: false, dropCap, remainder };
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
  return { isTruncated: true, dropCap, remainder };
}

const COVER_PAGE = 0;
const PREFACE_PAGE = 1;
const TOC_PAGE = 2;
const POST_PAGE_START = 3;

const SWIPE_AXIS_PX = 10;
const SWIPE_PAGE_PX = 48;

// ---------------------------------------------------------------------------
// Decorative spiral notebook wire loops along top edge of paper pages
// ---------------------------------------------------------------------------
function SpiralBinding() {
  return (
    <div
      aria-hidden="true"
      className="absolute top-1 inset-x-0 flex justify-evenly items-center px-4 pointer-events-none z-30 select-none"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="w-2.5 h-4.5 rounded-full border border-slate-500/80 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 shadow-[0_1px_3px_rgba(0,0,0,0.35)]" />
          <div className="w-1.5 h-1.5 -mt-1 rounded-full bg-[#3B2F1D]/45 shadow-inner" />
        </div>
      ))}
    </div>
  );
}

const ruledPaperStyle: React.CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(to bottom, transparent, transparent 27px, rgba(170, 145, 110, 0.16) 27px, rgba(170, 145, 110, 0.16) 28px)",
  backgroundPosition: "0 8px",
};

// ---------------------------------------------------------------------------
// Component — horizontal full-bleed page-turn (mobile only)
// ---------------------------------------------------------------------------

export function MobileBookLayout({ blogs, initialPostSlug }: MobileBookLayoutProps) {
  const initialPostIndex = initialPostSlug
    ? blogs.findIndex((b) => b.slug === initialPostSlug)
    : -1;

  const totalPages = 1 + 1 + 1 + blogs.length + 1;

  const [activePage, setActivePage] = useState(
    initialPostIndex !== -1 ? initialPostIndex + POST_PAGE_START : 0
  );
  const [currentPost, setCurrentPost] = useState<IBlog | null>(
    initialPostIndex !== -1 ? blogs[initialPostIndex] ?? null : null
  );
  const [lightboxImage, setLightboxImage] = useState<{
    src: string;
    alt: string;
    caption?: string;
  } | null>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const activePageRef = useRef(activePage);
  const isProgrammaticScrollRef = useRef(false);
  const touchRef = useRef<{
    x: number;
    y: number;
    lock: "none" | "page" | "inner";
  }>({ x: 0, y: 0, lock: "none" });

  useEffect(() => {
    activePageRef.current = activePage;
  }, [activePage]);

  const syncMetaForPage = useCallback(
    (pageIndex: number) => {
      setActivePage(pageIndex);
      activePageRef.current = pageIndex;

      const postEnd = POST_PAGE_START + blogs.length;
      if (pageIndex >= POST_PAGE_START && pageIndex < postEnd) {
        const blogIdx = pageIndex - POST_PAGE_START;
        const blog = blogs[blogIdx] ?? null;
        setCurrentPost(blog);

        if (typeof window !== "undefined" && blog?.slug) {
          const url = new URL(window.location.href);
          if (url.searchParams.get("post") !== blog.slug) {
            url.searchParams.set("post", blog.slug);
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
    },
    [blogs]
  );

  /** Single page-change path used by swipe, buttons, Open, TOC, and Return. */
  const goToPage = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const clamped = Math.max(0, Math.min(totalPages - 1, index));
      const scroller = scrollerRef.current;
      if (!scroller) return;

      const width = scroller.clientWidth || window.innerWidth;
      isProgrammaticScrollRef.current = true;
      scroller.scrollTo({ left: clamped * width, behavior });
      syncMetaForPage(clamped);

      // Clear programmatic flag after snap settles
      window.setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, behavior === "smooth" ? 450 : 50);
    },
    [totalPages, syncMetaForPage]
  );

  const handleOpen = useCallback(() => goToPage(PREFACE_PAGE), [goToPage]);
  const handleReturnToCover = useCallback(() => goToPage(COVER_PAGE), [goToPage]);
  const handlePrev = useCallback(() => goToPage(activePageRef.current - 1), [goToPage]);
  const handleNext = useCallback(() => goToPage(activePageRef.current + 1), [goToPage]);

  // Sync active page from native horizontal snap scroll (e.g. trackpad / residual drag)
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let raf = 0;
    const onScroll = () => {
      if (isProgrammaticScrollRef.current) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const width = scroller.clientWidth || 1;
        const idx = Math.round(scroller.scrollLeft / width);
        const clamped = Math.max(0, Math.min(totalPages - 1, idx));
        if (clamped !== activePageRef.current) {
          syncMetaForPage(clamped);
        }
      });
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [totalPages, syncMetaForPage]);

  // Axis-lock touch: horizontal swipe from anywhere → page turn; vertical → inner scroll
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      touchRef.current = { x: t.clientX, y: t.clientY, lock: "none" };
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;

      const dx = t.clientX - touchRef.current.x;
      const dy = t.clientY - touchRef.current.y;

      if (touchRef.current.lock === "none") {
        if (Math.abs(dx) < SWIPE_AXIS_PX && Math.abs(dy) < SWIPE_AXIS_PX) return;

        if (Math.abs(dx) > Math.abs(dy)) {
          touchRef.current.lock = "page";
        } else {
          touchRef.current.lock = "inner";
        }
      }

      // Once locked to page-turn, block vertical scroll so the gesture stays horizontal
      if (touchRef.current.lock === "page" && e.cancelable) {
        e.preventDefault();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (!t) {
        touchRef.current.lock = "none";
        return;
      }

      const dx = t.clientX - touchRef.current.x;
      const dy = t.clientY - touchRef.current.y;
      const wasPage = touchRef.current.lock === "page";
      touchRef.current.lock = "none";

      if (!wasPage) return;
      if (Math.abs(dx) < SWIPE_PAGE_PX || Math.abs(dx) < Math.abs(dy)) return;

      // Swipe left → next page; swipe right → previous (book metaphor)
      if (dx < 0) {
        goToPage(activePageRef.current + 1);
      } else {
        goToPage(activePageRef.current - 1);
      }
    };

    scroller.addEventListener("touchstart", onTouchStart, { passive: true });
    scroller.addEventListener("touchmove", onTouchMove, { passive: false });
    scroller.addEventListener("touchend", onTouchEnd, { passive: true });
    scroller.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      scroller.removeEventListener("touchstart", onTouchStart);
      scroller.removeEventListener("touchmove", onTouchMove);
      scroller.removeEventListener("touchend", onTouchEnd);
      scroller.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [goToPage]);

  // Deep-link: jump to post page without animation after mount
  useEffect(() => {
    if (initialPostIndex === -1) return;
    const target = initialPostIndex + POST_PAGE_START;
    // Wait a frame so layout width is known
    requestAnimationFrame(() => goToPage(target, "instant"));
  }, [initialPostIndex, goToPage]);

  // Keep scroll position aligned on resize
  useEffect(() => {
    const onResize = () => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const width = scroller.clientWidth || 1;
      scroller.scrollLeft = activePageRef.current * width;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const canGoPrev = activePage > 0;
  const canGoNext = activePage < totalPages - 1;

  const pageShellClass =
    "relative h-full w-full min-w-full max-w-full flex-shrink-0 snap-start snap-always overflow-hidden flex flex-col";

  return (
    <div className="w-full flex flex-col items-center">
      {/*
        Viewport-locked shell: site nav (4rem) subtracted via .mobile-blog-book-shell.
        Title header + page scroller + prev/next controls share this height — controls
        never sit below the fold. Comments stay outside the shell.
      */}
      <div className="mobile-blog-book-shell w-full flex flex-col overflow-hidden -mt-1 -mb-4 sm:-mt-2 sm:-mb-6">
        {/* ── Compact book title header ──────────────────────────────────── */}
        <header className="w-full px-3 pt-1 pb-1.5 border-b border-foundation-slate/50 select-none shrink-0 flex flex-col justify-center gap-0.5">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-foundation-slate/60 border border-brand-cyan/30 text-[10px] font-mono tracking-widest text-brand-cyan uppercase font-bold w-fit">
            <Sparkles className="w-3 h-3 text-brand-cyan" />
            IEDC TKIET
          </span>
          <h1 className="font-display font-bold text-typo-white tracking-tight text-[clamp(1.35rem,5.5vw,1.85rem)] leading-tight">
            The Innovation Blog
          </h1>
        </header>

        {/* ── Horizontal page-turn scroller (fills remaining shell height) ─ */}
        <div
          ref={scrollerRef}
          className="w-full flex-1 min-h-0 flex overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-y",
          }}
          role="region"
          aria-label="Innovation Blog pages"
        >
        {/* ── PAGE 0: Front Cover ────────────────────────────────────────── */}
        <div
          data-mobile-page={COVER_PAGE}
          className={cn(
            pageShellClass,
            "bg-gradient-to-br from-[#060D1E] via-[#0A1633] to-[#040814] border-y border-slate-700/80"
          )}
        >
          <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black via-black/60 to-transparent pointer-events-none z-10" />
          <div
            className="absolute bottom-0 left-10 w-4 h-9 bg-gradient-to-b from-[#1E3A8A] via-[#1E40AF] to-[#172554] shadow-md z-20 pointer-events-none"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 7px), 0 100%)" }}
          >
            <div className="absolute inset-y-0 left-0 w-px bg-amber-300/40" />
            <div className="absolute inset-y-0 right-0 w-px bg-amber-300/40" />
          </div>

          <div className="relative w-full h-full border border-slate-700/70 m-2 rounded-xl p-3 sm:p-4 flex flex-col justify-between">
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-brand-cyan/60 rounded-tl" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-brand-cyan/60 rounded-tr" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-brand-cyan/60 rounded-bl" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-brand-cyan/60 rounded-br" />

            <div className="space-y-1 text-center">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-slate-900/80 border border-brand-cyan/40 shadow-[0_0_15px_rgba(56,189,248,0.25)] p-1.5 mx-auto">
                <Image
                  src="/images/iedc-logo.png"
                  alt="IEDC Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="block text-[11px] font-mono tracking-[0.25em] text-slate-300 uppercase font-semibold">
                {SITE_CONFIG.name}
              </span>
            </div>

            <div className="space-y-1.5 text-center my-auto py-1">
              <span className="block text-xs font-mono tracking-[0.3em] text-brand-cyan/90 uppercase">
                THE
              </span>
              <h2 className="font-display font-bold uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-brand-cyan drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-tight text-[clamp(1.45rem,6.5vw,2rem)]">
                INNOVATION
              </h2>
              <span className="block font-display text-base font-semibold text-slate-200 tracking-wider">
                BLOG
              </span>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-brand-cyan to-transparent mx-auto" />
              <span className="block text-[11px] font-sans text-slate-400 font-medium">
                Ideas · People · Impact
              </span>
            </div>

            <div className="text-center space-y-1.5">
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
                <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
                <span>Swipe left to turn pages</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── PAGE 1: Editorial Preface ──────────────────────────────────── */}
        <div
          data-mobile-page={PREFACE_PAGE}
          className={cn(pageShellClass, "book-paper-sheet border-y border-[#D6C4A5]")}
        >
          <SpiralBinding />
          <div className="flex items-center justify-between px-4 pt-6 pb-1.5 border-b border-[#D8C7A7] text-[10px] font-mono text-[#4B5468] tracking-wider uppercase font-semibold shrink-0">
            <span>{SITE_CONFIG.name}</span>
            <span>PREFACE</span>
          </div>

          <div
            style={ruledPaperStyle}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-3"
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

          <div className="flex items-center justify-center py-1.5 border-t border-[#D8C7A7] shrink-0">
            <span className="flex items-center gap-1 text-[10px] font-mono text-[#4B5468] uppercase tracking-wider">
              Swipe for contents
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* ── PAGE 2: Table of Contents ──────────────────────────────────── */}
        <div
          data-mobile-page={TOC_PAGE}
          className={cn(pageShellClass, "book-paper-sheet border-y border-[#D6C4A5]")}
        >
          <SpiralBinding />
          <div className="flex items-center justify-between px-4 pt-6 pb-1.5 border-b border-[#D8C7A7] text-[10px] font-mono text-[#4B5468] tracking-wider uppercase font-semibold shrink-0">
            <span>TABLE OF CONTENTS</span>
            <span>{blogs.length} ARTICLES</span>
          </div>

          <div
            style={ruledPaperStyle}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-2"
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
                {blogs.map((b, idx) => (
                  <button
                    key={b.id || b.slug}
                    type="button"
                    onClick={() => goToPage(POST_PAGE_START + idx)}
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
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center py-1.5 border-t border-[#D8C7A7] shrink-0">
            <span className="flex items-center gap-1 text-[10px] font-mono text-[#4B5468] uppercase tracking-wider">
              Swipe to read
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* ── PAGES 3..: Article pages ───────────────────────────────────── */}
        {blogs.map((blog, idx) => {
          const { dropCap, remainder, isTruncated } = computeTextFitting(
            blog.content || blog.excerpt || ""
          );
          const pageIndex = POST_PAGE_START + idx;

          return (
            <div
              key={blog.id || blog.slug}
              data-mobile-page={pageIndex}
              className={cn(pageShellClass, "book-paper-sheet border-y border-[#D6C4A5]")}
            >
              <SpiralBinding />
              <div className="flex items-center justify-between px-4 pt-6 pb-1.5 border-b border-[#D8C7A7] text-[10px] font-mono text-[#4B5468] tracking-wider uppercase font-semibold shrink-0">
                <span className="text-[#1E40AF]">
                  ARTICLE {(idx + 1).toString().padStart(2, "0")}
                  {isDevPlaceholder(blog) && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300">
                      <AlertTriangle className="w-2.5 h-2.5" /> Dev
                    </span>
                  )}
                </span>
                <span>
                  {getPubDate(blog)} · {blog.readTimeMinutes || 3} MIN
                </span>
              </div>

              <div
                style={ruledPaperStyle}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pt-2 pb-14 space-y-2.5 relative"
              >
                <PostageStamp blog={blog} onOpenLightbox={(img) => setLightboxImage(img)} />

                <div className="space-y-0.5">
                  <h3 className="font-book-title text-base font-bold text-[#0F1B44] tracking-tight leading-snug">
                    {blog.title}
                  </h3>
                  <div className="text-[11px] font-mono text-[#1E40AF] font-semibold">
                    By {blog.author || SITE_CONFIG.name}
                  </div>
                </div>

                <div className="relative">
                  <p className="font-book-body text-[#1B2333] tracking-normal text-left text-[15px] leading-[1.7] [hyphens:manual] [overflow-wrap:anywhere]">
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

                <Link
                  href={`/blog/${blog.slug}`}
                  className="inline-flex items-center gap-1.5 text-[#1E40AF] hover:text-[#2563EB] hover:underline text-xs font-mono font-semibold group min-h-[36px]"
                >
                  <span>Read full manuscript</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

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
          );
        })}

        {/* ── LAST PAGE: Back cover ──────────────────────────────────────── */}
        <div
          data-mobile-page={totalPages - 1}
          className={cn(
            pageShellClass,
            "bg-gradient-to-br from-[#060D1E] via-[#0A1633] to-[#040814] border-y border-slate-700/80"
          )}
        >
          <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black via-black/60 to-transparent pointer-events-none" />
          <div className="relative w-full h-full border border-slate-700/70 m-2 rounded-xl p-3 sm:p-4 flex flex-col justify-between">
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
                Official publication for research dissemination, prototype records, and student
                incubation archives.
              </p>
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
        {/* end horizontal scroller */}

        {/* ── Progress + prev/next — always inside the viewport shell ─────── */}
        <div className="w-full flex items-center justify-center py-1.5 select-none shrink-0 gap-2 px-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canGoPrev}
            aria-label="Previous page"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full bg-[#FAF5EA] border border-[#DACBB5] text-[#1E40AF] disabled:opacity-35 disabled:pointer-events-none active:scale-95 transition-all shadow-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 pl-3 pr-1 py-0.5 rounded-full bg-[#FAF5EA] border border-[#DACBB5] text-[#1B2333] shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
            <span className="font-mono text-[11px] font-bold tracking-widest text-[#1E40AF] uppercase">
              PAGE {activePage + 1} OF {totalPages}
            </span>
            {activePage > 0 && (
              <button
                type="button"
                onClick={handleReturnToCover}
                className="min-w-[44px] min-h-[44px] -my-1 flex items-center justify-center text-[#4B5468] hover:text-[#0F1B44] active:scale-95 transition-all cursor-pointer"
                aria-label="Return to cover"
                title="Return to cover"
              >
                <span className="text-xs font-mono font-bold bg-[#EAE0CA] text-[#4B5468] rounded-full w-5 h-5 flex items-center justify-center">
                  ✕
                </span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            disabled={!canGoNext}
            aria-label="Next page"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-full bg-[#FAF5EA] border border-[#DACBB5] text-[#1E40AF] disabled:opacity-35 disabled:pointer-events-none active:scale-95 transition-all shadow-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      {/* end viewport-locked shell */}

      {/* ── Comments (below the fold — intentional) ──────────────────────── */}
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
