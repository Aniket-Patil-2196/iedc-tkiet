"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useLayoutEffect,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  X,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { IBlog } from "@/types/content";
import { formatEventDate } from "@/lib/utils/event-status";
import { ImageLightbox } from "./ImageLightbox";
import { PostageStamp } from "./PostageStamp";
import { BlogCommentsSection } from "./BlogCommentsSection";
import { ThePen, BookDisplayState } from "./ThePen";
import { stripHtmlToPlainText } from "@/lib/utils/blog-validation";
import { SITE_CONFIG } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

interface InnovationJournalBookProps {
  blogs: IBlog[];
  initialPostSlug?: string;
}

// Reference Canvas dimensions (Ratio 3:4)
const DESKTOP_REF_W = 450;
const DESKTOP_REF_H = 600;
const MOBILE_REF_W = 340;
const MOBILE_REF_H = 453;

export function InnovationJournalBook({
  blogs,
  initialPostSlug,
}: InnovationJournalBookProps) {
  // 1. Initial State Resolution
  const initialPostIndex = useMemo(() => {
    if (!initialPostSlug) return -1;
    return blogs.findIndex((b) => b.slug === initialPostSlug);
  }, [blogs, initialPostSlug]);

  // FIX 1.1: Single Source of Truth for display state and animation
  const [displayState, setDisplayState] = useState<BookDisplayState>(
    initialPostIndex !== -1 ? "open" : "closed-front"
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [lightboxImage, setLightboxImage] = useState<{
    src: string;
    alt: string;
    caption?: string;
  } | null>(null);

  // Live region announcement guard
  const isInitialMount = useRef(true);
  const [announcement, setAnnouncement] = useState("");

  // Refs for element measuring, animations, and accessibility focus
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const bookStageRef = useRef<HTMLDivElement>(null);
  const centerWrapperRef = useRef<HTMLDivElement>(null);
  const flipBookRef = useRef<HTMLDivElement>(null);
  const pageFlipRef = useRef<any>(null);
  const coverButtonRef = useRef<HTMLButtonElement>(null);
  const innerFrameRef = useRef<HTMLDivElement>(null);
  const innovationWordRef = useRef<HTMLHeadingElement>(null);
  const firstHeadingRef = useRef<HTMLHeadingElement>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [headerHeight, setHeaderHeight] = useState(82);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [viewportHeight, setViewportHeight] = useState(900);
  const [isMobile, setIsMobile] = useState(false);
  const [coverTitleScale, setCoverTitleScale] = useState(1);
  const [dimensions, setDimensions] = useState({ bookHeight: 620, pageWidth: 465 });
  const { bookHeight, pageWidth } = dimensions;

  // Active Reference Canvas for current mode (Ratio 3:4)
  const refW = isMobile ? MOBILE_REF_W : DESKTOP_REF_W;
  const refH = isMobile ? MOBILE_REF_H : DESKTOP_REF_H;
  const pageScale = pageWidth / refW;

  // Multi-page Table of Contents chunking (A3)
  const itemsPerContentsPage = isMobile ? 4 : 6;
  const contentsPagesCount = Math.max(1, Math.ceil(blogs.length / itemsPerContentsPage));

  // Introductory pages: Intro (1) + Contents (contentsPagesCount)
  const hasIntroTransition = (1 + contentsPagesCount) % 2 !== 0;
  const totalIntroPages = 1 + contentsPagesCount + (hasIntroTransition ? 1 : 0);

  // Pages before back cover: Front Cover (1) + totalIntroPages + 2 * blogs.length
  // Total page count must be strictly EVEN so the back cover stands alone on the left
  const totalPages = 1 + totalIntroPages + blogs.length * 2 + 1;

  // Sizing from height first by MEASURING DOM offsets
  const computeDimensions = useCallback(() => {
    if (typeof window === "undefined") return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setViewportHeight(vh);
    const mobile = vw < 900;
    setIsMobile(mobile);

    const containerW = containerRef.current ? containerRef.current.clientWidth : vw;
    setContainerWidth(containerW);

    let measuredHeaderBottom = 82;
    if (headerRef.current) {
      const hRect = headerRef.current.getBoundingClientRect();
      setHeaderHeight(hRect.height);
      measuredHeaderBottom = hRect.bottom + window.scrollY;
    }

    if (mobile) {
      const pw = Math.min(vw - 32, 420);
      const bh = Math.round(pw / 0.75);
      setDimensions({ bookHeight: bh, pageWidth: pw });
      return;
    }

    const headerClearance = 16;
    const controlsRowHeight = 48;
    const controlsGap = 16;
    const bottomPadding = 16;

    const bookTopOffset = measuredHeaderBottom + headerClearance;
    const availableHeight = vh - bookTopOffset - controlsRowHeight - controlsGap - bottomPadding;

    const targetHeight = Math.max(420, availableHeight);
    let idealPageWidth = Math.round(targetHeight * 0.75);
    let openSpreadWidth = idealPageWidth * 2;

    const maxAllowedSpreadWidth = containerW - 48;
    if (openSpreadWidth > maxAllowedSpreadWidth) {
      openSpreadWidth = maxAllowedSpreadWidth;
      idealPageWidth = Math.floor(openSpreadWidth / 2);
    }
    const finalBookHeight = Math.round(idealPageWidth / 0.75);

    setDimensions({ bookHeight: finalBookHeight, pageWidth: idealPageWidth });
  }, []);

  useEffect(() => {
    computeDimensions();
    window.addEventListener("resize", computeDimensions);
    window.addEventListener("orientationchange", computeDimensions);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", computeDimensions);
    }

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => computeDimensions());
    }

    const ro = new ResizeObserver(() => {
      computeDimensions();
    });
    if (headerRef.current) ro.observe(headerRef.current);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      window.removeEventListener("resize", computeDimensions);
      window.removeEventListener("orientationchange", computeDimensions);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", computeDimensions);
      }
      ro.disconnect();
    };
  }, [computeDimensions]);

  // Cover Typography Protection (8% margin rule on inner frame)
  useLayoutEffect(() => {
    if (!innerFrameRef.current || !innovationWordRef.current) return;
    const frameW = innerFrameRef.current.clientWidth;
    if (frameW <= 0) return;

    const maxAllowedWidth = frameW * 0.84;
    const currentWordWidth = innovationWordRef.current.scrollWidth;

    if (currentWordWidth > maxAllowedWidth) {
      const scaleRatio = maxAllowedWidth / currentWordWidth;
      setCoverTitleScale(Math.min(1, scaleRatio));
    } else {
      setCoverTitleScale(1);
    }
  }, [pageWidth, displayState]);

  // Sync URL ?post=<slug> with history.replaceState
  const syncUrlParam = useCallback((slug?: string) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (slug) {
      url.searchParams.set("post", slug);
    } else {
      url.searchParams.delete("post");
    }
    window.history.replaceState(null, "", url.toString());
  }, []);

  // Compute start page index for initial post
  const startPageIndex = useMemo(() => {
    if (initialPostIndex !== -1) {
      return 1 + totalIntroPages + initialPostIndex * 2;
    }
    return 0;
  }, [initialPostIndex, totalIntroPages]);

  // -------------------------------------------------------------
  // StPageFlip (B1 & Explicit Landscape vs Portrait)
  // -------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const initPageFlip = async () => {
      if (!flipBookRef.current || typeof window === "undefined") return;

      try {
        const { PageFlip } = await import("page-flip");
        if (!isMounted || !flipBookRef.current) return;

        if (pageFlipRef.current) {
          try {
            pageFlipRef.current.getUI()?.clear();
            pageFlipRef.current.destroy();
          } catch {
            // ignore
          }
          pageFlipRef.current = null;
        }

        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

        const isDesktop = window.matchMedia("(min-width: 900px)").matches;
        const usePortraitMode = !isDesktop;

        console.log(
          `[InnovationJournalBook] Initializing PageFlip: orientation=${
            isDesktop ? "landscape" : "portrait"
          }, width=${pageWidth}px, height=${bookHeight}px`
        );

        const pf = new PageFlip(flipBookRef.current, {
          width: pageWidth,
          height: bookHeight,
          size: "stretch",
          minWidth: 100,
          maxWidth: 1600,
          minHeight: 100,
          maxHeight: 1600,
          showCover: true,
          usePortrait: usePortraitMode,
          drawShadow: true,
          maxShadowOpacity: 0.45,
          flippingTime: prefersReducedMotion ? 0 : 850,
          showPageCorners: !prefersReducedMotion,
          clickEventForward: true,
          mobileScrollSupport: true,
          useMouseEvents: true,
          swipeDistance: 30,
          startPage: startPageIndex,
        });

        const pageElements = flipBookRef.current.querySelectorAll(".stf-page-item");
        pf.loadFromHTML(pageElements);

        // FIX 1.1: Sync state from page-flip flip and changeState events
        pf.on("flip", (e: any) => {
          if (!isMounted) return;
          const pageIdx = typeof e.data === "number" ? e.data : pf.getCurrentPageIndex();
          setCurrentPageIndex(pageIdx);

          if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
          animationTimerRef.current = setTimeout(() => {
            if (!isMounted) return;
            setIsAnimating(false);
            if (pageIdx === 0) {
              setDisplayState("closed-front");
            } else if (pageIdx === totalPages - 1) {
              setDisplayState("closed-back");
            } else {
              setDisplayState("open");
            }
          }, prefersReducedMotion ? 30 : 850);

          // Determine current post if on post spread
          const postSpreadStart = 1 + totalIntroPages;
          if (pageIdx >= postSpreadStart && pageIdx < totalPages - 1) {
            const blogIdx = Math.floor((pageIdx - postSpreadStart) / 2);
            const activeBlog = blogs[blogIdx];
            if (activeBlog) {
              syncUrlParam(activeBlog.slug);
              setAnnouncement(
                `Page ${pageIdx + 1} of ${totalPages}: ${activeBlog.title}`
              );
              return;
            }
          }

          syncUrlParam(undefined);
          if (pageIdx === 0) {
            setAnnouncement("Blog closed. Front cover.");
          } else if (pageIdx === 1) {
            setAnnouncement(`Page 2 of ${totalPages}: Editorial Preface`);
          } else if (pageIdx < postSpreadStart) {
            setAnnouncement(`Page ${pageIdx + 1} of ${totalPages}: Table of Contents`);
          } else if (pageIdx === totalPages - 1) {
            setAnnouncement(`Page ${pageIdx + 1} of ${totalPages}: Back cover`);
          }
        });

        pf.on("changeState", (e: any) => {
          if (!isMounted) return;
          const state = e.data;
          if (state === "user_fold" || state === "fold_corner" || state === "flipping") {
            setIsAnimating(true);
            setDisplayState("open");
          } else if (state === "read") {
            setIsAnimating(false);
            const p = pf.getCurrentPageIndex();
            if (p === 0) {
              setDisplayState("closed-front");
            } else if (p === totalPages - 1) {
              setDisplayState("closed-back");
            } else {
              setDisplayState("open");
            }
          }
        });

        pageFlipRef.current = pf;

        setCurrentPageIndex(startPageIndex);
        if (startPageIndex === 0) {
          setDisplayState("closed-front");
        } else if (startPageIndex >= totalPages - 1) {
          setDisplayState("closed-back");
        } else {
          setDisplayState("open");
        }
      } catch (err) {
        console.error("Error initializing StPageFlip:", err);
      }
    };

    initPageFlip();

    return () => {
      isMounted = false;
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
      if (pageFlipRef.current) {
        try {
          pageFlipRef.current.getUI()?.clear();
          pageFlipRef.current.destroy();
        } catch {
          // ignore
        }
        pageFlipRef.current = null;
      }
    };
  }, [
    isMobile,
    pageWidth,
    bookHeight,
    totalPages,
    totalIntroPages,
    startPageIndex,
    blogs,
    syncUrlParam,
  ]);

  // FIX 1.1: Trigger turn with immediate state update at start of turn
  const handleJumpToPage = useCallback((targetIdx: number) => {
    if (!pageFlipRef.current) return;

    // Immediately start animating and update display state for layout
    setIsAnimating(true);
    if (targetIdx > 0 && targetIdx < totalPages - 1) {
      setDisplayState("open");
    } else if (targetIdx === totalPages - 1) {
      // While animating to back cover, treat as open for layout until rest
      setDisplayState("open");
    }

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      pageFlipRef.current.turnToPage(targetIdx);
      setIsAnimating(false);
      if (targetIdx === 0) setDisplayState("closed-front");
      else if (targetIdx === totalPages - 1) setDisplayState("closed-back");
      else setDisplayState("open");
    } else {
      pageFlipRef.current.flip(targetIdx);
    }
  }, [totalPages]);

  const handleNextPage = useCallback(() => {
    if (!pageFlipRef.current || currentPageIndex >= totalPages - 1) return;
    setIsAnimating(true);
    setDisplayState("open");
    pageFlipRef.current.flipNext();
  }, [currentPageIndex, totalPages]);

  const handlePrevPage = useCallback(() => {
    if (!pageFlipRef.current || currentPageIndex <= 0) return;
    setIsAnimating(true);
    setDisplayState("open");
    pageFlipRef.current.flipPrev();
  }, [currentPageIndex]);

  // Keyboard Navigation: Arrows, Space/Enter, Escape (B2 & B4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxImage) return;

      if (e.key === "Escape") {
        if (displayState !== "closed-front") {
          handleJumpToPage(0);
        }
        return;
      }

      if (displayState === "closed-front") {
        if (e.key === "Enter" || e.key === " ") {
          if (document.activeElement === coverButtonRef.current) {
            e.preventDefault();
            handleJumpToPage(1);
          }
        }
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevPage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [displayState, lightboxImage, handleJumpToPage, handleNextPage, handlePrevPage]);

  // Safe publication date formatting
  const getPubDate = (blog: IBlog) => {
    const raw = blog.publishedAt || blog.publicationDate || blog.createdAt;
    return formatEventDate(raw);
  };

  // Check if blog is development placeholder
  const isDevPlaceholder = (b: IBlog) =>
    b.id?.startsWith("blog-placeholder") || b.id?.startsWith("placeholder");

  // Helper to extract first grapheme drop cap cleanly (supports English and Devanagari)
  const extractDropCap = (text: string): { dropCap: string; remainder: string } => {
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
  };

  // Dynamically computes text fitting in fixed reference canvas space
  const computeArticleTextFitting = (
    rawContent: string,
    isMobileMode: boolean
  ): {
    displayText: string;
    isTruncated: boolean;
    dropCap: string;
    remainder: string;
  } => {
    const plain = stripHtmlToPlainText(rawContent);
    if (!plain) {
      return { displayText: "", isTruncated: false, dropCap: "", remainder: "" };
    }

    const capacity = isMobileMode ? 320 : 520;

    if (plain.length <= capacity * 1.05) {
      const { dropCap, remainder } = extractDropCap(plain);
      return {
        displayText: plain,
        isTruncated: false,
        dropCap,
        remainder,
      };
    }

    const windowSlice = plain.slice(0, capacity);
    const sentenceEndRegex = /[.!?।]\s+|\n\n/g;
    let lastMatchIndex = -1;
    let match: RegExpExecArray | null;
    while ((match = sentenceEndRegex.exec(windowSlice)) !== null) {
      if (match.index >= capacity * 0.55) {
        lastMatchIndex = match.index;
      }
    }

    let truncated = "";
    if (lastMatchIndex !== -1) {
      truncated = windowSlice.slice(0, lastMatchIndex + 1).trim();
    } else {
      const lastSpace = windowSlice.lastIndexOf(" ");
      if (lastSpace > capacity * 0.7) {
        truncated = windowSlice.slice(0, lastSpace).trim() + "...";
      } else {
        truncated = windowSlice.trim() + "...";
      }
    }

    const { dropCap, remainder } = extractDropCap(truncated);
    return {
      displayText: truncated,
      isTruncated: true,
      dropCap,
      remainder,
    };
  };

  // Active blog for comments section
  const activeCommentBlog = useMemo(() => {
    const postSpreadStart = 1 + totalIntroPages;
    if (currentPageIndex >= postSpreadStart && currentPageIndex < totalPages - 1) {
      const blogIdx = Math.floor((currentPageIndex - postSpreadStart) / 2);
      return blogs[blogIdx] || blogs[0] || null;
    }
    return blogs[0] || null;
  }, [currentPageIndex, totalIntroPages, totalPages, blogs]);

  // Page label for controls row (Step 3.8 & Fix 1.3)
  const controlsPageLabel = useMemo(() => {
    if (displayState === "closed-front" || currentPageIndex === 0) {
      return "Cover";
    }
    if (displayState === "closed-back" || currentPageIndex >= totalPages - 1) {
      return `Back Cover`;
    }
    if (isMobile) {
      return `Page ${currentPageIndex + 1} of ${totalPages}`;
    }
    const leftPage = currentPageIndex % 2 === 1 ? currentPageIndex : currentPageIndex - 1;
    const rightPage = leftPage + 1;
    return `Pages ${leftPage + 1}-${rightPage + 1} of ${totalPages}`;
  }, [displayState, currentPageIndex, totalPages, isMobile]);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center">
      {/* 1. Header Row (FIX 2: The Innovation Blog + Chip: IEDC TKIET) */}
      <header
        ref={headerRef}
        id="blog-header-row"
        className="w-full max-w-6xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-2 md:gap-6 pt-1 pb-2.5 border-b border-foundation-slate/50 select-none min-h-[72px] md:min-h-[82px] [@media(max-height:700px)]:pb-1.5"
      >
        <div className="flex flex-col items-start gap-1 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-foundation-slate/60 border border-brand-cyan/30 text-[10px] sm:text-xs font-mono tracking-widest text-brand-cyan uppercase font-bold">
            <Sparkles className="w-3 h-3 text-brand-cyan" />
            IEDC TKIET
          </span>
          <h1 className="font-display font-bold text-typo-white tracking-tight text-[clamp(1.75rem,2.6vw,2.5rem)] leading-tight [text-wrap:balance]">
            The Innovation Blog
          </h1>
        </div>

        <p className="max-w-[380px] text-xs font-sans text-typo-gray leading-relaxed text-left md:self-end md:pb-0.5 [@media(max-height:700px)]:hidden">
          Editorial perspectives on student incubation, deep tech breakthroughs, and startup ventures from {SITE_CONFIG.name}.
        </p>
      </header>

      {/* Screen reader live region (B4) */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* 2. Main Book Stage (Step 1.1: Relative box, centered horizontally, spans full width) */}
      <div
        ref={bookStageRef}
        style={
          {
            "--book-h": `${bookHeight}px`,
            "--page-w": `${pageWidth}px`,
          } as React.CSSProperties
        }
        className="relative w-full flex flex-col items-center justify-center mt-4 select-none"
      >
        {/* FIX 1: The Pen as Absolute Overlay in Free Margins Outside the Book */}
        <ThePen
          displayState={displayState}
          isAnimating={isAnimating}
          containerWidth={containerWidth}
          pageWidth={pageWidth}
          bookStageRef={bookStageRef}
        />

        {/* Optical Centering Wrapper */}
        <div
          ref={centerWrapperRef}
          className="relative flex items-center justify-center select-none"
          style={{
            width: isMobile ? `${pageWidth}px` : `${pageWidth * 2}px`,
            height: `${bookHeight}px`,
            transform: isMobile
              ? "none"
              : currentPageIndex === 0
              ? `translateX(calc(-${pageWidth}px / 2)) rotateY(-3deg)`
              : currentPageIndex >= totalPages - 1
              ? `translateX(calc(${pageWidth}px / 2)) rotateY(3deg)`
              : "translateX(0px) rotateY(0deg)",
            transformStyle: "preserve-3d",
            transition: "transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          {/* StPageFlip Host Container */}
          <div
            ref={flipBookRef}
            style={{
              width: isMobile ? `${pageWidth}px` : `${pageWidth * 2}px`,
              height: `${bookHeight}px`,
            }}
            className="stf__parent relative overflow-visible cursor-grab active:cursor-grabbing"
          >
            {/* ------------------------------------------------------------- */}
            {/* PAGE 0: FRONT COVER (data-density="hard")                      */}
            {/* ------------------------------------------------------------- */}
            <div
              className="stf-page-item relative overflow-hidden rounded-r-2xl border-y-2 border-r-2 border-slate-700/80 bg-gradient-to-br from-[#060D1E] via-[#0A1633] to-[#040814] shadow-2xl select-none"
              data-density="hard"
              style={{ width: `${pageWidth}px`, height: `${bookHeight}px` }}
            >
              <button
                ref={coverButtonRef}
                type="button"
                onClick={() => handleJumpToPage(1)}
                aria-label="Open The Innovation Blog"
                className="group relative w-full h-full text-left p-6 sm:p-8 flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan cursor-pointer"
              >
                {/* Spine crease shading on left edge */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black via-black/60 to-transparent pointer-events-none" />

                {/* Page block layered edge on right and bottom */}
                <div className="absolute inset-y-0 right-0 w-2.5 bg-gradient-to-l from-[#CBD5E1]/20 via-[#94A3B8]/10 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-t from-[#CBD5E1]/20 via-[#94A3B8]/10 to-transparent pointer-events-none" />

                {/* Narrow silk bookmark ribbon with swallowtail cut (A4.2) */}
                <div
                  className="absolute -bottom-5 left-14 w-4 h-9 bg-gradient-to-b from-[#1E3A8A] via-[#1E40AF] to-[#172554] shadow-md pointer-events-none z-20"
                  style={{
                    clipPath:
                      "polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 7px), 0 100%)",
                  }}
                >
                  <div className="absolute inset-y-0 left-0 w-[1px] bg-amber-300/40" />
                  <div className="absolute inset-y-0 right-0 w-[1px] bg-amber-300/40" />
                </div>

                {/* Embossed Inner Cover Frame with 8% margin rule */}
                <div
                  ref={innerFrameRef}
                  style={{ containerType: "inline-size" }}
                  className="relative w-full h-full border border-slate-700/70 rounded-xl p-6 sm:p-8 flex flex-col justify-between"
                >
                  <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-brand-cyan/60 rounded-tl" />
                  <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-brand-cyan/60 rounded-tr" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-brand-cyan/60 rounded-bl" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-brand-cyan/60 rounded-br" />

                  {/* Top Emblem & Header with Official IEDC Logo (A4.3) */}
                  <div className="space-y-3 text-center">
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

                  {/* FIX 2: Title Area: THE INNOVATION BLOG */}
                  <div className="space-y-3 text-center my-auto py-4">
                    <span className="block text-xs font-mono tracking-[0.3em] text-brand-cyan/90 uppercase">
                      THE
                    </span>
                    <h2
                      ref={innovationWordRef}
                      style={{
                        fontSize: `calc(clamp(1.4rem, 7.6cqw, 2.5rem) * ${coverTitleScale})`,
                        letterSpacing: "-0.02em",
                        overflowWrap: "break-word",
                      }}
                      className="font-display font-bold uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-brand-cyan drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-tight"
                    >
                      INNOVATION
                    </h2>
                    <span className="block font-display text-lg sm:text-xl font-semibold text-slate-200 tracking-wider">
                      BLOG
                    </span>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-brand-cyan to-transparent mx-auto pt-1" />
                    <span className="block text-[11px] font-sans text-slate-400 font-medium pt-1">
                      Ideas · People · Impact
                    </span>
                  </div>

                  {/* Open Button Affordance */}
                  <div className="text-center pt-2">
                    <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900/90 border border-brand-cyan/40 text-xs font-mono tracking-wider uppercase text-brand-cyan group-hover:text-typo-white group-hover:border-brand-cyan shadow-md transition-all">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Open blog →</span>
                    </span>
                  </div>
                </div>
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PAGE 1: INTRO / EDITORIAL PREFACE (data-density="soft")       */}
            {/* ------------------------------------------------------------- */}
            <div
              className="stf-page-item relative overflow-hidden book-paper-sheet border-y border-l border-[#D6C4A5] select-none"
              data-density="soft"
              style={{ width: `${pageWidth}px`, height: `${bookHeight}px` }}
            >
              <div className="absolute inset-y-0 left-0 w-8 book-page-vignette-left pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-12 book-gutter-left pointer-events-none z-10" />

              <div
                style={{
                  width: `${refW}px`,
                  height: `${refH}px`,
                  transform: `scale(${pageScale})`,
                  transformOrigin: "top left",
                }}
                className="w-full h-full p-6 sm:p-7 flex flex-col justify-between select-none overflow-hidden min-w-0 [overflow-wrap:anywhere]"
              >
                <div className="space-y-3.5 sm:space-y-4">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#D8C7A7] text-xs font-mono text-[#4B5468] tracking-wider uppercase font-semibold">
                    <span>{SITE_CONFIG.name}</span>
                    <span>{SITE_CONFIG.institutionShort}</span>
                  </div>

                  <h2
                    ref={firstHeadingRef}
                    tabIndex={-1}
                    className="font-display text-2xl sm:text-3xl font-bold text-[#0F1B44] tracking-tight focus:outline-none"
                  >
                    Editorial Preface
                  </h2>

                  <p className="font-sans text-xs sm:text-sm text-[#1B2333] leading-relaxed">
                    Welcome to <span className="text-[#1E40AF] font-semibold">The Innovation Blog</span>,
                    the institutional publication of the {SITE_CONFIG.fullName} at {SITE_CONFIG.institution}.
                  </p>

                  <p className="font-sans text-xs sm:text-sm text-[#1B2333] leading-relaxed">
                    Here we document student ventures, patent drafts, interdisciplinary engineering research,
                    and entrepreneurial breakthroughs emerging from campus incubators.
                  </p>

                  <div className="pt-1">
                    <div className="p-3 rounded-xl bg-[#FAF5EA] border border-[#DACBB5] space-y-1 shadow-sm">
                      <span className="text-[10px] font-mono text-[#1E40AF] uppercase tracking-widest block font-bold">
                        CELL VISION
                      </span>
                      <span className="text-xs text-[#4B5468] leading-relaxed block font-medium">
                        {SITE_CONFIG.tagline}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-[#D8C7A7] text-[11px] font-mono text-[#4B5468]">
                  <span>{SITE_CONFIG.location}</span>
                  <span>PREFACE</span>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PAGES 2..: TABLE OF CONTENTS (Chunked, data-density="soft")    */}
            {/* ------------------------------------------------------------- */}
            {Array.from({ length: contentsPagesCount }).map((_, cIdx) => (
              <div
                key={`contents-page-${cIdx}`}
                className="stf-page-item relative overflow-hidden book-paper-sheet border-y border-r border-[#D6C4A5] select-none"
                data-density="soft"
                style={{ width: `${pageWidth}px`, height: `${bookHeight}px` }}
              >
                <div className="absolute inset-y-0 right-0 w-8 book-page-vignette-right pointer-events-none" />
                <div className="absolute inset-y-0 left-0 w-12 book-gutter-right pointer-events-none z-10" />

                <div
                  style={{
                    width: `${refW}px`,
                    height: `${refH}px`,
                    transform: `scale(${pageScale})`,
                    transformOrigin: "top left",
                  }}
                  className="w-full h-full p-6 sm:p-7 flex flex-col justify-between select-none overflow-hidden min-w-0 [overflow-wrap:anywhere]"
                >
                  <div className="space-y-3 flex-1 min-h-0 flex flex-col">
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#D8C7A7] text-xs font-mono text-[#4B5468] tracking-wider uppercase font-semibold">
                      <span>
                        TABLE OF CONTENTS {contentsPagesCount > 1 ? `(${cIdx + 1}/${contentsPagesCount})` : ""}
                      </span>
                      <span>{blogs.length} ARTICLES</span>
                    </div>

                    <h3 className="font-display text-xl sm:text-2xl font-bold text-[#0F1B44] tracking-tight">
                      Published Articles
                    </h3>

                    {blogs.length === 0 ? (
                      <div className="py-12 text-center space-y-2">
                        <BookOpen className="w-8 h-8 text-[#1E40AF]/60 mx-auto" />
                        <p className="font-sans text-xs text-[#4B5468]">
                          Stories are coming soon. New publications will be indexed here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 flex-1 min-h-0 overflow-hidden pt-1">
                        {blogs
                          .slice(
                            cIdx * itemsPerContentsPage,
                            (cIdx + 1) * itemsPerContentsPage
                          )
                          .map((b, relIdx) => {
                            const actualIdx = cIdx * itemsPerContentsPage + relIdx;
                            const targetPage = 1 + totalIntroPages + actualIdx * 2;
                            return (
                              <button
                                key={b.id || b.slug}
                                type="button"
                                onClick={() => handleJumpToPage(targetPage)}
                                className="w-full text-left p-2 rounded-lg hover:bg-[#EAE0CA]/70 border border-transparent hover:border-[#DACBB5] transition-colors group flex items-start justify-between gap-2 cursor-pointer"
                              >
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[10px] font-mono text-[#1E40AF] font-bold shrink-0">
                                      {(actualIdx + 1).toString().padStart(2, "0")}
                                    </span>
                                    <span className="font-display text-xs sm:text-sm font-semibold text-[#0F1B44] group-hover:text-[#1E40AF] truncate transition-colors">
                                      {b.title}
                                    </span>
                                  </div>
                                  <span className="text-[10px] sm:text-[11px] font-mono text-[#4B5468] block pl-5 truncate">
                                    {getPubDate(b)} · {b.readTimeMinutes || 3} min read
                                  </span>
                                </div>
                                <span className="text-xs font-mono text-[#1E40AF] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  P. {(targetPage + 1).toString().padStart(2, "0")} →
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t border-[#D8C7A7] text-[11px] font-mono text-[#4B5468]">
                    <span>{SITE_CONFIG.institutionShort} ARCHIVE</span>
                    <span>{cIdx === 0 ? "INDEX I" : "INDEX II"}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Optional Intro Transition Spread Balancer (if needed so posts start on left page) */}
            {hasIntroTransition && (
              <div
                className="stf-page-item relative overflow-hidden book-paper-sheet border-y border-r border-[#D6C4A5] select-none"
                data-density="soft"
                style={{ width: `${pageWidth}px`, height: `${bookHeight}px` }}
              >
                <div className="absolute inset-y-0 right-0 w-8 book-page-vignette-right pointer-events-none" />
                <div className="absolute inset-y-0 left-0 w-12 book-gutter-right pointer-events-none z-10" />

                <div
                  style={{
                    width: `${refW}px`,
                    height: `${refH}px`,
                    transform: `scale(${pageScale})`,
                    transformOrigin: "top left",
                  }}
                  className="w-full h-full p-6 sm:p-7 flex flex-col justify-between select-none overflow-hidden min-w-0 [overflow-wrap:anywhere]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#D8C7A7] text-xs font-mono text-[#4B5468] tracking-wider uppercase font-semibold">
                      <span>ARCHIVAL OVERVIEW</span>
                      <span>INNOVATION CELL</span>
                    </div>

                    <h3 className="font-display text-xl sm:text-2xl font-bold text-[#0F1B44] tracking-tight">
                      Incubation & Research
                    </h3>

                    <p className="font-sans text-xs sm:text-sm text-[#1B2333] leading-relaxed">
                      Every project chronicled in these spreads represents student-led discovery,
                      faculty mentorship, and prototype testing under institutional backing.
                    </p>

                    <div className="p-3.5 rounded-xl bg-[#FAF5EA] border border-[#DACBB5] space-y-2 shadow-sm">
                      <span className="text-[10px] font-mono text-[#1E40AF] uppercase tracking-widest block font-bold">
                        FOUNDATIONAL MANDATE
                      </span>
                      <p className="text-xs text-[#4B5468] leading-relaxed">
                        To foster innovation, seed entrepreneurial ideas, and empower students to build sustainable technological solutions.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t border-[#D8C7A7] text-[11px] font-mono text-[#4B5468]">
                    <span>{SITE_CONFIG.name}</span>
                    <span>PROLOGUE</span>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* POST SPREADS: Left Page (Plate) & Right Page (Manuscript)     */}
            {/* ------------------------------------------------------------- */}
            {blogs.map((blog, blogIdx) => {
              const { dropCap, remainder, isTruncated } = computeArticleTextFitting(
                blog.content || blog.excerpt,
                isMobile
              );
              const bodyFontSize = isMobile ? "16px" : "17.5px";
              const bodyLineHeight = isMobile ? "1.6" : "1.65";
              const leftPageNum = 1 + totalIntroPages + blogIdx * 2 + 1;
              const rightPageNum = leftPageNum + 1;

              return (
                <React.Fragment key={blog.id || blog.slug}>
                  {/* LEFT PAGE: Plate & PostageStamp */}
                  <div
                    className="stf-page-item relative overflow-hidden book-paper-sheet border-y border-l border-[#D6C4A5] select-none"
                    data-density="soft"
                    style={{ width: `${pageWidth}px`, height: `${bookHeight}px` }}
                  >
                    <div className="absolute inset-y-0 left-0 w-8 book-page-vignette-left pointer-events-none" />
                    <div className="absolute inset-y-0 right-0 w-12 book-gutter-left pointer-events-none z-10" />

                    <div
                      style={{
                        width: `${refW}px`,
                        height: `${refH}px`,
                        transform: `scale(${pageScale})`,
                        transformOrigin: "top left",
                      }}
                      className="w-full h-full p-6 sm:p-7 flex flex-col justify-between select-none overflow-hidden min-w-0 [overflow-wrap:anywhere]"
                    >
                      <div className="space-y-3 min-h-0 overflow-hidden">
                        <div className="flex items-center justify-between pb-2.5 border-b border-[#D8C7A7] text-[11px] font-mono text-[#4B5468] tracking-wider uppercase font-semibold">
                          <span className="text-[#1E40AF]">
                            PLATE {(blogIdx + 1).toString().padStart(2, "0")} · ARCHIVE
                          </span>
                          {isDevPlaceholder(blog) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-950 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300 font-semibold shadow-sm">
                              <AlertTriangle className="w-3 h-3 text-amber-800" />
                              Dev Placeholder
                            </span>
                          )}
                        </div>

                        <PostageStamp
                          blog={blog}
                          onOpenLightbox={(img) => setLightboxImage(img)}
                        />
                      </div>

                      <div className="pt-3 flex items-center justify-between border-t border-[#D8C7A7] text-[11px] font-mono text-[#4B5468] mt-auto">
                        <span>{SITE_CONFIG.institutionShort} ARCHIVE</span>
                        <Link
                          href={`/blog/${blog.slug}`}
                          className="text-[#1E40AF] hover:text-[#2563EB] hover:underline inline-flex items-center gap-1 group font-medium"
                        >
                          <span>Read full manuscript</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT PAGE: Manuscript Text & Clamped Content */}
                  <div
                    className="stf-page-item relative overflow-hidden book-paper-sheet border-y border-r border-[#D6C4A5] select-none"
                    data-density="soft"
                    style={{ width: `${pageWidth}px`, height: `${bookHeight}px` }}
                  >
                    <div className="absolute inset-y-0 right-0 w-8 book-page-vignette-right pointer-events-none" />
                    <div className="absolute inset-y-0 left-0 w-12 book-gutter-right pointer-events-none z-10" />

                    <div
                      style={{
                        width: `${refW}px`,
                        height: `${refH}px`,
                        transform: `scale(${pageScale})`,
                        transformOrigin: "top left",
                      }}
                      className="relative w-full h-full p-6 sm:p-7 flex flex-col justify-between select-none overflow-hidden min-w-0 [overflow-wrap:anywhere]"
                    >
                      <div className="space-y-2.5 relative flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div className="flex items-center justify-between pb-2 border-b border-[#D8C7A7] text-[11px] font-mono text-[#4B5468] tracking-wider uppercase font-semibold">
                          <span>{getPubDate(blog)}</span>
                          <span>{blog.readTimeMinutes || 4} MIN READ</span>
                        </div>

                        <div className="space-y-0.5">
                          <h3 className="font-display text-base sm:text-lg font-bold text-[#0F1B44] tracking-tight leading-snug truncate">
                            {blog.title}
                          </h3>
                          <div className="text-[11px] font-mono text-[#1E40AF] font-semibold">
                            By {blog.author || SITE_CONFIG.name}
                          </div>
                        </div>

                        <div className="relative flex-1 overflow-hidden pt-1">
                          <p
                            style={{ fontSize: bodyFontSize, lineHeight: bodyLineHeight }}
                            className="font-book-body text-[#1B2333] tracking-normal text-left [hyphens:manual] [overflow-wrap:anywhere]"
                          >
                            {dropCap && (
                              <span className="float-left text-4xl sm:text-5xl font-book-handwriting font-bold ink-drop-cap mr-2.5 leading-[0.8] select-none">
                                {dropCap}
                              </span>
                            )}
                            {remainder}
                          </p>

                          {isTruncated && (
                            <div
                              aria-hidden="true"
                              className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[var(--paper,#F2E9D6)] via-[var(--paper,#F2E9D6)]/80 to-transparent pointer-events-none"
                            />
                          )}
                        </div>
                      </div>

                      <div className="pt-3 flex items-center justify-between border-t border-[#D8C7A7] text-[11px] font-mono text-[#4B5468]">
                        <span>{SITE_CONFIG.name}</span>
                        <span>PAGE {rightPageNum.toString().padStart(2, "0")}</span>
                      </div>

                      {/* Hanging Bookmark Ribbon with swallowtail cut (A3 & A4) */}
                      {isTruncated && (
                        <div className="absolute -bottom-3 right-6 sm:right-8 z-30 group">
                          <Link
                            href={`/blog/${blog.slug}`}
                            className="relative flex items-center justify-center px-4 pt-1.5 pb-3 bg-gradient-to-b from-[#1E3A8A] via-[#1E40AF] to-[#172554] text-[#FBF6E9] font-book-handwriting font-bold text-xs sm:text-sm tracking-wide shadow-[0_4px_14px_rgba(74,52,24,0.35)] transition-all duration-300 group-hover:translate-y-1 hover:brightness-110"
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
                </React.Fragment>
              );
            })}

            {/* ------------------------------------------------------------- */}
            {/* LAST PAGE: BACK COVER (data-density="hard")                   */}
            {/* ------------------------------------------------------------- */}
            <div
              className="stf-page-item relative overflow-hidden rounded-l-2xl border-y-2 border-l-2 border-slate-700/80 bg-gradient-to-br from-[#060D1E] via-[#0A1633] to-[#040814] shadow-2xl select-none"
              data-density="hard"
              style={{ width: `${pageWidth}px`, height: `${bookHeight}px` }}
            >
              <div className="relative w-full h-full p-6 sm:p-8 flex flex-col justify-between">
                {/* Spine crease shading on right edge */}
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black via-black/60 to-transparent pointer-events-none" />

                {/* Embossed Inner Frame */}
                <div className="relative w-full h-full border border-slate-700/70 rounded-xl p-6 sm:p-8 flex flex-col justify-between">
                  <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-brand-cyan/60 rounded-tl" />
                  <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-brand-cyan/60 rounded-tr" />
                  <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-brand-cyan/60 rounded-bl" />
                  <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-brand-cyan/60 rounded-br" />

                  {/* Header / Seal */}
                  <div className="space-y-3 text-center">
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

                  {/* Official Archival Colophon & Accession block */}
                  <div className="space-y-3 text-center my-auto py-2">
                    <span className="block text-[10px] font-mono tracking-[0.25em] text-brand-cyan/80 uppercase">
                      ARCHIVAL ACCESSION
                    </span>
                    <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-slate-200">
                      IEDC TKIET
                    </h3>
                    <p className="text-[11px] font-sans text-slate-400 max-w-[260px] mx-auto leading-relaxed">
                      Official publication for research dissemination, prototype records, and student incubation archives.
                    </p>

                    {/* Barcode graphic simulation */}
                    <div className="pt-2 flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1 justify-center py-1 opacity-60">
                        <div className="w-0.5 h-6 bg-slate-300" />
                        <div className="w-1.5 h-6 bg-slate-300" />
                        <div className="w-0.5 h-6 bg-slate-300" />
                        <div className="w-1 h-6 bg-slate-300" />
                        <div className="w-2 h-6 bg-slate-300" />
                        <div className="w-0.5 h-6 bg-slate-300" />
                        <div className="w-1 h-6 bg-slate-300" />
                        <div className="w-1.5 h-6 bg-slate-300" />
                        <div className="w-0.5 h-6 bg-slate-300" />
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 tracking-widest">
                        DOC-REF-2024-IEDC-TKIET
                      </span>
                    </div>
                  </div>

                  {/* Return to Front Cover Action */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => handleJumpToPage(0)}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900/90 border border-brand-cyan/40 text-xs font-mono tracking-wider uppercase text-brand-cyan hover:text-typo-white hover:border-brand-cyan shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Return to Cover</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Controls Row (FIX 1.3: Conditioned by displayState) */}
        <div
          style={{
            width: isMobile ? `${pageWidth}px` : `${pageWidth * 2}px`,
            maxWidth: "100%",
          }}
          className="relative min-h-[48px] h-12 flex items-center justify-between px-2 select-none mt-3 sm:mt-4"
        >
          {displayState === "closed-front" ? (
            // CLOSED FRONT HINT (Fix 1.3: "Click the cover or press Enter to open the blog")
            <div className="w-full h-full flex items-center justify-center text-center">
              <span className="text-xs sm:text-sm font-mono text-typo-gray/90 flex items-center gap-1.5">
                <span>Click the cover or press</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-brand-cyan border border-slate-700 font-semibold shadow-sm">
                  Enter ↵
                </kbd>
                <span>to open the blog</span>
              </span>
            </div>
          ) : displayState === "closed-back" ? (
            // CLOSED BACK CONTROLS (Fix 1.3: Back to first page + Prev to reopen; Next disabled)
            <div className="w-full h-full flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevPage}
                aria-label="Previous page (reopen from back)"
                className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-foundation-dark/90 hover:bg-foundation-dark border border-slate-700/80 text-xs font-mono text-brand-cyan hover:border-brand-cyan inline-flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <button
                type="button"
                onClick={() => handleJumpToPage(0)}
                aria-label="Back to the first page"
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-brand-cyan/40 hover:border-brand-cyan text-xs font-mono text-brand-cyan hover:text-white inline-flex items-center justify-center gap-2 active:scale-95 cursor-pointer transition-all shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Back to the first page</span>
              </button>

              <button
                type="button"
                disabled={true}
                aria-disabled={true}
                aria-label="Next page (disabled on back cover)"
                className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-foundation-dark/40 border border-slate-800 text-xs font-mono text-slate-600 inline-flex items-center justify-center gap-1.5 opacity-30 cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            // OPEN SPREAD CONTROLS (Fix 1.3: Prev, Facing Spread label, Next, compact Close)
            <>
              <div className="flex items-center gap-3 sm:gap-4 mx-auto">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={currentPageIndex <= 0}
                  aria-label="Previous page"
                  className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-foundation-dark/90 hover:bg-foundation-dark border border-slate-700/80 text-xs font-mono text-brand-cyan hover:border-brand-cyan inline-flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                <span className="text-xs sm:text-sm font-mono text-brand-cyan font-semibold tracking-wide">
                  {controlsPageLabel}
                </span>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPageIndex >= totalPages - 1}
                  aria-label="Next page"
                  className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-foundation-dark/90 hover:bg-foundation-dark border border-slate-700/80 text-xs font-mono text-brand-cyan hover:border-brand-cyan inline-flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-all"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Compact Close button at right end aligned with book right edge */}
              <button
                type="button"
                onClick={() => handleJumpToPage(0)}
                aria-label="Close book"
                title="Close book (Esc)"
                className="absolute right-0 min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-foundation-dark/90 hover:bg-foundation-dark border border-slate-700/80 hover:border-slate-500 text-xs font-mono text-typo-gray hover:text-typo-white transition-all active:scale-95 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden md:inline">Close</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4. Readers' Remarks & Discussion Section */}
      {activeCommentBlog && (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-12">
          <BlogCommentsSection
            blogSlug={activeCommentBlog.slug}
            blogTitle={activeCommentBlog.title}
          />
        </div>
      )}

      {/* Lightbox Modal for Figures */}
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
