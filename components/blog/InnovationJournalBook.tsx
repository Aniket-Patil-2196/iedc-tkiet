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
import gsap from "gsap";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  X,
  Calendar,
  Sparkles,
  Tag,
  ArrowRight,
  Maximize2,
  AlertTriangle,
} from "lucide-react";
import { IBlog } from "@/types/content";
import { formatEventDate } from "@/lib/utils/event-status";
import { ImageLightbox } from "./ImageLightbox";
import { PostageStamp } from "./PostageStamp";
import { BlogCommentsSection } from "./BlogCommentsSection";
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

const EDITORIAL_FALLBACK_IMAGES = [
  "/images/placeholders/gallery-1.svg",
  "/images/placeholders/gallery-2.svg",
  "/images/placeholders/gallery-3.svg",
  "/images/placeholders/gallery-4.svg",
  "/images/placeholders/gallery-5.svg",
  "/images/placeholders/gallery-6.svg",
];

export function InnovationJournalBook({
  blogs,
  initialPostSlug,
}: InnovationJournalBookProps) {
  // 1. Initial State Resolution
  // If a valid initialPostSlug is provided, start directly in open state at that article spread
  const initialPostIndex = useMemo(() => {
    if (!initialPostSlug) return -1;
    return blogs.findIndex((b) => b.slug === initialPostSlug);
  }, [blogs, initialPostSlug]);

  const [isOpen, setIsOpen] = useState(initialPostIndex !== -1);
  // Spread 0: Intro (Left) & Contents (Right)
  // Spread 1..N: Blog articles (Spread i = blogs[i - 1])
  const [currentSpread, setCurrentSpread] = useState(
    initialPostIndex !== -1 ? initialPostIndex + 1 : 0
  );
  // Mobile page index: 0 = Cover, 1 = Intro, 2 = Contents, 3 = Post 1 Left, 4 = Post 1 Right, ...
  const [mobilePage, setMobilePage] = useState(
    initialPostIndex !== -1 ? 3 + initialPostIndex * 2 : 0
  );

  const [isTurning, setIsTurning] = useState(false);
  const [turnDirection, setTurnDirection] = useState<"next" | "prev" | null>(null);
  const [targetSpread, setTargetSpread] = useState<number | null>(null);
  const [turnAngle, setTurnAngle] = useState(0);
  const [shadowOpacity, setShadowOpacity] = useState(0);
  const [isOpeningAnimating, setIsOpeningAnimating] = useState(false);

  const [lightboxImage, setLightboxImage] = useState<{
    src: string;
    alt: string;
    caption?: string;
  } | null>(null);

  // Live region announcement guard (do not announce on initial load)
  const isInitialMount = useRef(true);
  const [announcement, setAnnouncement] = useState("");

  // Refs for element measuring, animations, and accessibility focus
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const bookStageRef = useRef<HTMLDivElement>(null);
  const coverButtonRef = useRef<HTMLButtonElement>(null);
  const spreadFrameRef = useRef<HTMLDivElement>(null);
  const coverFlipperRef = useRef<HTMLDivElement>(null);
  const rightFlipperRef = useRef<HTMLDivElement>(null);
  const leftFlipperRef = useRef<HTMLDivElement>(null);
  const innerFrameRef = useRef<HTMLDivElement>(null);
  const innovationWordRef = useRef<HTMLHeadingElement>(null);
  const firstHeadingRef = useRef<HTMLHeadingElement>(null);

  const [headerHeight, setHeaderHeight] = useState(96);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [viewportHeight, setViewportHeight] = useState(900);
  const [isMobile, setIsMobile] = useState(false);
  const [coverTitleScale, setCoverTitleScale] = useState(1);
  const [dimensions, setDimensions] = useState({ bookHeight: 560, pageWidth: 420 });
  const { bookHeight, pageWidth } = dimensions;

  // Active Reference Canvas for current mode (Ratio 3:4)
  const refW = isMobile ? MOBILE_REF_W : DESKTOP_REF_W;
  const refH = isMobile ? MOBILE_REF_H : DESKTOP_REF_H;
  const pageScale = pageWidth / refW;

  const totalSpreads = useMemo(() => 1 + blogs.length, [blogs.length]);
  const totalMobilePages = useMemo(() => 2 + blogs.length * 2, [blogs.length]);

  // Dynamic Responsive Dimensions Calculation based on real DOM measurements
  const computeDimensions = useCallback(() => {
    if (typeof window === "undefined") return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setViewportHeight(vh);
    const mobile = vw < 900;
    setIsMobile(mobile);

    const containerW = containerRef.current ? containerRef.current.clientWidth : vw - 32;
    setContainerWidth(containerW);

    if (headerRef.current) {
      setHeaderHeight(headerRef.current.getBoundingClientRect().height);
    }

    if (mobile) {
      // Mobile: size page by width (viewport width - 32px, ratio 3:4), allow normal scrolling
      const pw = Math.min(containerW - 32, 420);
      const bh = Math.round(pw / 0.75);
      setDimensions({ bookHeight: bh, pageWidth: pw });
      return;
    }

    // Desktop: Compute available height by MEASURING DOM offsets
    // available = window.innerHeight - (bookContainer top offset in the document) - controlsRowHeight - bottomPadding
    const controlsRowHeight = 48;
    const bottomPadding = 16;
    let bookTop = 130;
    if (bookStageRef.current) {
      const rect = bookStageRef.current.getBoundingClientRect();
      bookTop = rect.top + window.scrollY;
    } else if (headerRef.current) {
      const hRect = headerRef.current.getBoundingClientRect();
      bookTop = hRect.bottom + 12;
    }

    const available = vh - bookTop - controlsRowHeight - bottomPadding;
    // Clamp the book height to a minimum of about 420px; below that let the page scroll
    const clampedH = Math.max(420, Math.min(780, available));

    // Cap page width so open spread never exceeds container width:
    // page-w = min(book-height * 0.75, (container-width - space for arrows) / 2)
    const arrowSpace = 100;
    const maxPageW = Math.floor((containerW - arrowSpace) / 2);
    const idealPageW = Math.round(clampedH * 0.75);
    const pw = Math.max(260, Math.min(idealPageW, maxPageW));
    const finalH = Math.round(pw / 0.75);

    setDimensions({ bookHeight: finalH, pageWidth: pw });
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

    // Word must have at least 8% margin on left and 8% on right -> max allowed width is 84%
    const maxAllowedWidth = frameW * 0.84;
    const currentWordWidth = innovationWordRef.current.scrollWidth;

    if (currentWordWidth > maxAllowedWidth) {
      const scaleRatio = maxAllowedWidth / currentWordWidth;
      setCoverTitleScale(Math.min(1, scaleRatio));
    } else {
      setCoverTitleScale(1);
    }
  }, [pageWidth, isOpen]);

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

  // Update announcement for screen readers
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!isOpen) {
      setAnnouncement("Book closed. Front cover.");
      return;
    }

    if (isMobile) {
      setAnnouncement(`Page ${mobilePage + 1} of ${totalMobilePages}`);
    } else {
      setAnnouncement(`Spread ${currentSpread + 1} of ${totalSpreads}`);
    }
  }, [isOpen, currentSpread, mobilePage, isMobile, totalSpreads, totalMobilePages]);

  // OPEN BOOK ACTION
  const handleOpenBook = useCallback(() => {
    if (isOpen || isOpeningAnimating) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setIsOpen(true);
      setCurrentSpread(0);
      setMobilePage(1);
      syncUrlParam(undefined);
      setTimeout(() => firstHeadingRef.current?.focus(), 50);
      return;
    }

    setIsOpeningAnimating(true);
    const flipper = coverFlipperRef.current;
    const spreadFrame = spreadFrameRef.current;
    const animObj = { angle: 0, xProgress: 0 };

    gsap.to(animObj, {
      angle: -180,
      xProgress: 1,
      duration: 0.65,
      ease: "power2.inOut",
      onUpdate: () => {
        if (flipper) {
          flipper.style.transform = `rotateY(${animObj.angle}deg)`;
        }
        if (spreadFrame && !isMobile) {
          // Closed state is at -pageWidth/2 (-25% of spread); open state is at 0
          const currentX = (pageWidth / -2) * (1 - animObj.xProgress);
          spreadFrame.style.transform = `translateX(${currentX}px)`;
        }
      },
      onComplete: () => {
        setIsOpen(true);
        setCurrentSpread(0);
        setMobilePage(1);
        setIsOpeningAnimating(false);
        syncUrlParam(undefined);
        if (flipper) flipper.style.transform = "rotateY(0deg)";
        if (spreadFrame) spreadFrame.style.transform = "translateX(0px)";
        setTimeout(() => firstHeadingRef.current?.focus(), 80);
      },
    });
  }, [isOpen, isOpeningAnimating, isMobile, pageWidth, syncUrlParam]);

  // CLOSE BOOK ACTION
  const handleCloseBook = useCallback(() => {
    if (!isOpen || isOpeningAnimating || isTurning) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setIsOpen(false);
      setCurrentSpread(0);
      setMobilePage(0);
      syncUrlParam(undefined);
      setTimeout(() => coverButtonRef.current?.focus(), 50);
      return;
    }

    setIsOpeningAnimating(true);
    const flipper = coverFlipperRef.current;
    const spreadFrame = spreadFrameRef.current;
    const animObj = { angle: -180, xProgress: 1 };

    gsap.to(animObj, {
      angle: 0,
      xProgress: 0,
      duration: 0.6,
      ease: "power2.inOut",
      onUpdate: () => {
        if (flipper) {
          flipper.style.transform = `rotateY(${animObj.angle}deg)`;
        }
        if (spreadFrame && !isMobile) {
          const currentX = (pageWidth / -2) * (1 - animObj.xProgress);
          spreadFrame.style.transform = `translateX(${currentX}px)`;
        }
      },
      onComplete: () => {
        setIsOpen(false);
        setCurrentSpread(0);
        setMobilePage(0);
        setIsOpeningAnimating(false);
        syncUrlParam(undefined);
        if (flipper) flipper.style.transform = "rotateY(0deg)";
        if (spreadFrame && !isMobile) {
          spreadFrame.style.transform = `translateX(${pageWidth / -2}px)`;
        }
        setTimeout(() => coverButtonRef.current?.focus(), 80);
      },
    });
  }, [isOpen, isOpeningAnimating, isTurning, isMobile, pageWidth, syncUrlParam]);

  // SPREAD TURN ACTION (Desktop)
  const triggerSpreadTurn = useCallback(
    (direction: "next" | "prev", destSpread?: number) => {
      if (isTurning || isOpeningAnimating) return;

      const nextIndex =
        destSpread !== undefined
          ? destSpread
          : direction === "next"
          ? currentSpread + 1
          : currentSpread - 1;

      // Flipping back before spread 0 closes the book
      if (nextIndex < 0) {
        handleCloseBook();
        return;
      }
      if (nextIndex >= totalSpreads || nextIndex === currentSpread) return;

      setIsTurning(true);
      setTurnDirection(direction);
      setTargetSpread(nextIndex);

      const targetAngle = direction === "next" ? -180 : 180;
      const flipper = direction === "next" ? rightFlipperRef.current : leftFlipperRef.current;
      const animObj = { angle: 0 };

      gsap.to(animObj, {
        angle: targetAngle,
        duration: 0.58,
        ease: "power2.inOut",
        onUpdate: () => {
          setTurnAngle(animObj.angle);
          const progress = Math.abs(animObj.angle) / 180;
          setShadowOpacity(Math.sin(progress * Math.PI) * 0.45);
          if (flipper) {
            flipper.style.transform = `rotateY(${animObj.angle}deg)`;
          }
        },
        onComplete: () => {
          setCurrentSpread(nextIndex);
          setMobilePage(nextIndex === 0 ? 1 : 3 + (nextIndex - 1) * 2);
          setIsTurning(false);
          setTurnDirection(null);
          setTargetSpread(null);
          setTurnAngle(0);
          setShadowOpacity(0);
          if (flipper) flipper.style.transform = "rotateY(0deg)";

          // Sync URL with currently open blog post
          if (nextIndex > 0 && blogs[nextIndex - 1]) {
            syncUrlParam(blogs[nextIndex - 1].slug);
          } else {
            syncUrlParam(undefined);
          }
        },
      });
    },
    [isTurning, isOpeningAnimating, currentSpread, totalSpreads, blogs, handleCloseBook, syncUrlParam]
  );

  // MOBILE PAGE TURN ACTION
  const handleMobileTurn = useCallback(
    (direction: "next" | "prev") => {
      if (direction === "next") {
        if (!isOpen) {
          handleOpenBook();
        } else if (mobilePage < totalMobilePages - 1) {
          const nextPage = mobilePage + 1;
          setMobilePage(nextPage);
          const nextSpread = nextPage <= 2 ? 0 : 1 + Math.floor((nextPage - 3) / 2);
          setCurrentSpread(nextSpread);
          if (nextSpread > 0 && blogs[nextSpread - 1]) {
            syncUrlParam(blogs[nextSpread - 1].slug);
          } else {
            syncUrlParam(undefined);
          }
        }
      } else {
        if (mobilePage <= 1) {
          handleCloseBook();
        } else {
          const prevPage = mobilePage - 1;
          setMobilePage(prevPage);
          const prevSpread = prevPage <= 2 ? 0 : 1 + Math.floor((prevPage - 3) / 2);
          setCurrentSpread(prevSpread);
          if (prevSpread > 0 && blogs[prevSpread - 1]) {
            syncUrlParam(blogs[prevSpread - 1].slug);
          } else {
            syncUrlParam(undefined);
          }
        }
      }
    },
    [isOpen, mobilePage, totalMobilePages, blogs, handleOpenBook, handleCloseBook, syncUrlParam]
  );

  // Keyboard Navigation: Arrows, Space/Enter, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxImage) return;

      if (e.key === "Escape") {
        if (isOpen) handleCloseBook();
        return;
      }

      if (!isOpen) {
        if (e.key === "Enter" || e.key === " ") {
          if (document.activeElement === coverButtonRef.current) {
            e.preventDefault();
            handleOpenBook();
          }
        }
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (isMobile) handleMobileTurn("next");
        else triggerSpreadTurn("next");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (isMobile) handleMobileTurn("prev");
        else triggerSpreadTurn("prev");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isMobile, lightboxImage, handleOpenBook, handleCloseBook, triggerSpreadTurn, handleMobileTurn]);

  // Touch Swipe for Mobile (touch-action: pan-y preserves natural vertical scrolling)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;

    // Horizontal swipe threshold 45px, with horizontal dominance
    if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 0) {
        // Swiped left -> next
        if (isMobile) handleMobileTurn("next");
        else triggerSpreadTurn("next");
      } else {
        // Swiped right -> prev
        if (isMobile) handleMobileTurn("prev");
        else triggerSpreadTurn("prev");
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Helper: jump directly to article spread from Table of Contents
  const handleJumpToArticle = (blogIndex: number) => {
    const target = blogIndex + 1;
    if (isMobile) {
      setMobilePage(3 + blogIndex * 2);
      setCurrentSpread(target);
      syncUrlParam(blogs[blogIndex].slug);
    } else {
      triggerSpreadTurn("next", target);
    }
  };

  // Safe publication date formatting
  const getPubDate = (blog: IBlog) => {
    const raw = blog.publishedAt || blog.publicationDate || blog.createdAt;
    return formatEventDate(raw);
  };

  // Check if blog is development placeholder
  const isDevPlaceholder = (b: IBlog) =>
    b.id?.startsWith("blog-placeholder") || b.id?.startsWith("placeholder");

  // ==========================================
  // RENDER INDIVIDUAL PAGE CONTENT
  // ==========================================

  // Intro Page (Spread 0 Left)
  // Intro Page (Spread 0 Left) - Warm Parchment Paper Style inside Reference Canvas (A3)
  const renderIntroPage = () => (
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
          Welcome to <span className="text-[#1E40AF] font-semibold">The Innovation Journal</span>,
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
  );

  // Contents Page (Spread 0 Right) - Warm Parchment Paper Style with Multi-Page Chunking (A3)
  const ITEMS_PER_CONTENTS_PAGE = isMobile ? 4 : 6;
  const totalContentsPages = Math.max(1, Math.ceil(blogs.length / ITEMS_PER_CONTENTS_PAGE));

  const renderContentsPage = (pageIndex = 0) => (
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
          <span>TABLE OF CONTENTS {totalContentsPages > 1 ? `(${pageIndex + 1}/${totalContentsPages})` : ""}</span>
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
              .slice(pageIndex * ITEMS_PER_CONTENTS_PAGE, (pageIndex + 1) * ITEMS_PER_CONTENTS_PAGE)
              .map((b, relativeIdx) => {
                const idx = pageIndex * ITEMS_PER_CONTENTS_PAGE + relativeIdx;
                return (
                  <button
                    key={b.id || b.slug}
                    type="button"
                    onClick={() => handleJumpToArticle(idx)}
                    className="w-full text-left p-2 rounded-lg hover:bg-[#EAE0CA]/70 border border-transparent hover:border-[#DACBB5] transition-colors group flex items-start justify-between gap-2"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-mono text-[#1E40AF] font-bold shrink-0">
                          {(idx + 1).toString().padStart(2, "0")}
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
                      P. {(idx + 2).toString().padStart(2, "0")} →
                    </span>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      <div className="pt-3 flex items-center justify-between border-t border-[#D8C7A7] text-[11px] font-mono text-[#4B5468]">
        <span>{SITE_CONFIG.institutionShort} ARCHIVE</span>
        <span>{pageIndex === 0 ? "INDEX" : `INDEX II`}</span>
      </div>
    </div>
  );

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

  // Dynamically computes text fitting in fixed reference canvas space (A3)
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

    // Reference canvas capacity (invariant across browser window resizes)
    // Desktop (450x600): ~13 lines * ~40 chars = 520 chars
    // Mobile (340x453): ~10 lines * ~32 chars = 320 chars
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

    // Find sentence boundary within target capacity window
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

  // Article Left Page (Vintage Postage Stamps, Museum Sources block, Integrated metadata)
  const renderArticleLeftPage = (blog: IBlog, spreadIdx: number) => (
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
        {/* Integrated Header / Running Head */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#D8C7A7] text-[11px] font-mono text-[#4B5468] tracking-wider uppercase font-semibold">
          <span className="text-[#1E40AF]">PLATE {(spreadIdx * 2 - 1).toString().padStart(2, "0")} · ARCHIVE</span>
          {isDevPlaceholder(blog) && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-950 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300 font-semibold shadow-sm">
              <AlertTriangle className="w-3 h-3 text-amber-800" />
              Dev Placeholder
            </span>
          )}
        </div>

        {/* Vintage Postage Stamp & Museum Sources Block */}
        <PostageStamp
          blog={blog}
          onOpenLightbox={(img) => setLightboxImage(img)}
        />
      </div>

      {/* Plate Folio / Bottom Footer */}
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
  );

  // Article Right Page (Text Content, Drop Cap, Whole-Sentence Clamping, Hanging Bookmark Ribbon)
  const renderArticleRightPage = (blog: IBlog, spreadIdx: number) => {
    const { dropCap, remainder, isTruncated } = computeArticleTextFitting(
      blog.content || blog.excerpt,
      isMobile
    );

    const bodyFontSize = isMobile ? "16px" : "17.5px";
    const bodyLineHeight = isMobile ? "1.6" : "1.65";

    return (
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
          {/* Running Head */}
          <div className="flex items-center justify-between pb-2 border-b border-[#D8C7A7] text-[11px] font-mono text-[#4B5468] tracking-wider uppercase font-semibold">
            <span>{getPubDate(blog)}</span>
            <span>{blog.readTimeMinutes || 4} MIN READ</span>
          </div>

          {/* Title and Author Byline */}
          <div className="space-y-0.5">
            <h3 className="font-display text-base sm:text-lg font-bold text-[#0F1B44] tracking-tight leading-snug truncate">
              {blog.title}
            </h3>
            <div className="text-[11px] font-mono text-[#1E40AF] font-semibold">
              By {blog.author || SITE_CONFIG.name}
            </div>
          </div>

          {/* Body Text with Literary Serif & Handwriting Drop Cap */}
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

            {/* Bottom Scrim fade into paper when content is truncated */}
            {isTruncated && (
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[var(--paper,#F2E9D6)] via-[var(--paper,#F2E9D6)]/80 to-transparent pointer-events-none"
              />
            )}
          </div>
        </div>

        {/* Page Folio */}
        <div className="pt-3 flex items-center justify-between border-t border-[#D8C7A7] text-[11px] font-mono text-[#4B5468]">
          <span>{SITE_CONFIG.name}</span>
          <span>PAGE {(spreadIdx * 2).toString().padStart(2, "0")}</span>
        </div>

        {/* Hanging Bookmark Ribbon with swallowtail cut (Only shown if text continues / overflows) */}
        {isTruncated && (
          <div className="absolute -bottom-3 right-6 sm:right-8 z-30 group">
            <Link
              href={`/blog/${blog.slug}`}
              className="relative flex items-center justify-center px-4 pt-1.5 pb-3 bg-gradient-to-b from-[#1E3A8A] via-[#1E40AF] to-[#172554] text-[#FBF6E9] font-book-handwriting font-bold text-xs sm:text-sm tracking-wide shadow-[0_4px_14px_rgba(74,52,24,0.35)] transition-all duration-300 group-hover:translate-y-1 hover:brightness-110"
              style={{
                clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), 50% 100%, 0 calc(100% - 8px))",
              }}
              title="Continue reading this post"
            >
              <span>Continue reading ➔</span>
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center">
      {/* 1. Two-Column Header Row (A1) */}
      <header
        ref={headerRef}
        id="blog-header-row"
        className="w-full max-w-6xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-8 pt-1 sm:pt-2 pb-3 sm:pb-4 border-b border-foundation-slate/50 mb-3 sm:mb-4 select-none min-h-[85px] md:min-h-[96px] [@media(max-height:700px)]:mb-2 [@media(max-height:700px)]:pb-2"
      >
        {/* Left Column (Desktop) / Stacks on Mobile */}
        <div className="flex flex-col items-start gap-1.5 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-foundation-slate/60 border border-brand-cyan/30 text-[10px] sm:text-xs font-mono tracking-widest text-brand-cyan uppercase">
            <Sparkles className="w-3 h-3 text-brand-cyan" />
            BLOG
          </span>
          <h1 className="font-display font-bold text-typo-white tracking-tight text-[clamp(1.75rem,3vw,2.75rem)] leading-tight [text-wrap:balance]">
            The Innovation Journal
          </h1>
        </div>

        {/* Right Column (Desktop) / Stacks below on Mobile */}
        <p className="max-w-[380px] text-xs font-sans text-typo-gray leading-relaxed text-left md:self-end md:pb-1 [@media(max-height:700px)]:hidden">
          Editorial perspectives on student incubation, deep tech breakthroughs, and startup ventures from {SITE_CONFIG.name}.
        </p>
      </header>

      {/* Screen reader live region */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* 2. Main Book Stage (Fits first screen with 0 vertical scrolling on desktop) */}
      <div
        ref={bookStageRef}
        style={
          {
            "--book-h": `${bookHeight}px`,
            "--page-w": `${pageWidth}px`,
          } as React.CSSProperties
        }
        className={cn(
          "relative flex flex-col items-center justify-center w-full",
          isMobile ? "min-h-0" : "h-[var(--book-h)]"
        )}
      >
        {/* DESKTOP SPREAD VIEWPORT (>= 900px) */}
        {!isMobile ? (
          <div
            className="relative flex items-center justify-center select-none"
            style={{
              width: "calc(var(--page-w) * 2)",
              height: "var(--book-h)",
              perspective: "1600px",
            }}
          >
              {/* Spread Frame Wrapper */}
              <div
                ref={spreadFrameRef}
                style={{
                  width: "calc(var(--page-w) * 2)",
                  height: "var(--book-h)",
                  transform: isOpen ? "translateX(0px)" : `translateX(calc(var(--page-w) / -2))`,
                  transition: isOpeningAnimating ? "none" : "transform 0.5s ease-out",
                }}
                className="relative flex rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85),0_10px_35px_rgba(74,52,24,0.18)]"
              >
                {/* Spine Shading & Shadow Layer */}
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-10 pointer-events-none z-30 book-spine-crease"
                  style={{ opacity: isOpen ? 0.9 : 0 }}
                />

                {/* LEFT PAGE OF SPREAD (Warm Textured Cream Paper) */}
                <div
                  style={{ width: "var(--page-w)", height: "var(--book-h)" }}
                  className={cn(
                    "relative rounded-l-2xl border-y border-l border-[#D6C4A5] book-paper-sheet overflow-hidden",
                    !isOpen && "invisible pointer-events-none"
                  )}
                >
                  {/* Outer aged vignette on left edge */}
                  <div className="absolute inset-y-0 left-0 w-8 book-page-vignette-left pointer-events-none" />
                  {/* Gutter shading at spine on right edge with curved highlight strip */}
                  <div className="absolute inset-y-0 right-0 w-12 book-gutter-left pointer-events-none z-10" />
                  {/* Thin outer page-block edge lines */}
                  <div className="absolute inset-y-0 left-0 w-[1px] bg-[#C8B896] pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-[1px] bg-[#C8B896] pointer-events-none" />

                  {currentSpread === 0
                    ? renderIntroPage()
                    : blogs[currentSpread - 1] &&
                      renderArticleLeftPage(blogs[currentSpread - 1], currentSpread)}
                </div>

                {/* RIGHT PAGE OF SPREAD (Warm Textured Cream Paper) */}
                <div
                  style={{ width: "var(--page-w)", height: "var(--book-h)" }}
                  className={cn(
                    "relative rounded-r-2xl border-y border-r border-[#D6C4A5] book-paper-sheet overflow-hidden",
                    !isOpen && "invisible pointer-events-none"
                  )}
                >
                  {/* Outer aged vignette on right edge */}
                  <div className="absolute inset-y-0 right-0 w-8 book-page-vignette-right pointer-events-none" />
                  {/* Gutter shading at spine on left edge with curved highlight strip */}
                  <div className="absolute inset-y-0 left-0 w-12 book-gutter-right pointer-events-none z-10" />
                  {/* Thin outer page-block edge lines */}
                  <div className="absolute inset-y-0 right-0 w-[1px] bg-[#C8B896] pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-[1px] bg-[#C8B896] pointer-events-none" />

                  {currentSpread === 0
                    ? renderContentsPage()
                    : blogs[currentSpread - 1] &&
                      renderArticleRightPage(blogs[currentSpread - 1], currentSpread)}

                  {/* Interactive page corner click target for turning forward */}
                  {isOpen && currentSpread < totalSpreads - 1 && (
                    <button
                      type="button"
                      onClick={() => triggerSpreadTurn("next")}
                      aria-label="Turn forward"
                      className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-[#1E40AF]/10 to-transparent hover:from-[#1E40AF]/25 transition-all rounded-tl-2xl cursor-pointer group flex items-end justify-end p-2.5"
                    >
                      <ChevronRight className="w-4 h-4 text-[#1E40AF]/70 group-hover:text-[#1E40AF] group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>

                {/* 3D Dynamic Flipping Leaf during page turns (Both faces paper) */}
                {isTurning && (
                  <div
                    ref={turnDirection === "next" ? rightFlipperRef : leftFlipperRef}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "var(--page-w)",
                      width: "var(--page-w)",
                      height: "var(--book-h)",
                      transformOrigin: "left center",
                      transformStyle: "preserve-3d",
                      zIndex: 40,
                    }}
                  >
                    {/* Front face of flipping leaf (Paper) */}
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        backfaceVisibility: "hidden",
                        boxShadow: `0 0 35px rgba(74, 52, 24, ${shadowOpacity * 0.4})`,
                      }}
                      className="absolute inset-0 rounded-r-2xl border border-[#D6C4A5] book-paper-sheet overflow-hidden"
                    >
                      <div
                        style={{ opacity: shadowOpacity * 0.35 }}
                        className="absolute inset-0 bg-[#4A3418] pointer-events-none transition-opacity"
                      />
                    </div>

                    {/* Back face of flipping leaf (Slightly darker parchment) */}
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        transform: "rotateY(180deg)",
                        backfaceVisibility: "hidden",
                      }}
                      className="absolute inset-0 rounded-l-2xl border border-[#D6C4A5] bg-[var(--paper-back,#EDE2CB)] overflow-hidden"
                    >
                      <div
                        style={{ opacity: shadowOpacity * 0.35 }}
                        className="absolute inset-0 bg-[#4A3418] pointer-events-none transition-opacity"
                      />
                    </div>
                  </div>
                )}

              {/* 3D CLOSED FRONT COVER (Rendered when closed, swings open around left spine) */}
              {!isOpen && (
                <div
                  ref={coverFlipperRef}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "var(--page-w)",
                    width: "var(--page-w)",
                    height: "var(--book-h)",
                    transformOrigin: "left center",
                    transformStyle: "preserve-3d",
                    zIndex: 50,
                  }}
                  className="rounded-r-2xl cursor-pointer"
                >
                  <button
                    ref={coverButtonRef}
                    type="button"
                    onClick={handleOpenBook}
                    aria-label="Open The Innovation Journal"
                    className="group relative w-full h-full text-left rounded-r-2xl border-y-2 border-r-2 border-slate-700/80 bg-gradient-to-br from-[#060D1E] via-[#0A1633] to-[#040814] overflow-hidden p-6 sm:p-8 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(56,189,248,0.12)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
                  >
                    {/* Subtle 3D spine crease on left edge */}
                    <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black via-black/60 to-transparent pointer-events-none" />

                    {/* Visible page block layered edge on the right & bottom */}
                    <div className="absolute inset-y-0 right-0 w-2.5 bg-gradient-to-l from-[#CBD5E1]/20 via-[#94A3B8]/10 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-t from-[#CBD5E1]/20 via-[#94A3B8]/10 to-transparent pointer-events-none" />

                    {/* Proper Silk Bookmark Ribbon hanging from the page block with swallowtail cut (A4.2) */}
                    <div
                      className="absolute -bottom-5 left-14 w-4 h-9 bg-gradient-to-b from-[#1E3A8A] via-[#1E40AF] to-[#172554] shadow-md pointer-events-none z-20"
                      style={{
                        clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 7px), 0 100%)",
                      }}
                    >
                      <div className="absolute inset-y-0 left-0 w-[1px] bg-amber-300/40" />
                      <div className="absolute inset-y-0 right-0 w-[1px] bg-amber-300/40" />
                    </div>

                    {/* Embossed Inner Cover Frame (CSS Container with 8% margin rule) */}
                    <div
                      ref={innerFrameRef}
                      style={{ containerType: "inline-size" }}
                      className="relative w-full h-full border border-slate-700/70 rounded-xl p-6 sm:p-8 flex flex-col justify-between"
                    >
                      {/* Filigree Corner Accents in Cyan/Silver */}
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

                      {/* Foil Title Area (Protected Margin >= 8%) */}
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
                          JOURNAL
                        </span>
                        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-brand-cyan to-transparent mx-auto pt-1" />
                        <span className="block text-[11px] font-sans text-slate-400 font-medium pt-1">
                          Ideas · People · Impact
                        </span>
                      </div>

                      {/* Bottom Button Affordance */}
                      <div className="text-center pt-2">
                        <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900/90 border border-brand-cyan/40 text-xs font-mono tracking-wider uppercase text-brand-cyan group-hover:text-typo-white group-hover:border-brand-cyan shadow-md transition-all">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Open book →</span>
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Side Prev/Next Navigation Controls (Desktop) */}
            {isOpen && (
              <>
                <button
                  type="button"
                  onClick={() => triggerSpreadTurn("prev")}
                  aria-label="Previous spread"
                  className="absolute -left-12 p-3 rounded-full bg-foundation-dark/80 hover:bg-foundation-dark border border-slate-700 hover:border-brand-cyan text-brand-cyan shadow-lg transition-all active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => triggerSpreadTurn("next")}
                  disabled={currentSpread >= totalSpreads - 1}
                  aria-label="Next spread"
                  className={cn(
                    "absolute -right-12 p-3 rounded-full bg-foundation-dark/80 hover:bg-foundation-dark border border-slate-700 hover:border-brand-cyan text-brand-cyan shadow-lg transition-all active:scale-95 min-h-[44px] min-w-[44px] flex items-center justify-center",
                    currentSpread >= totalSpreads - 1 && "opacity-30 cursor-not-allowed"
                  )}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        ) : (
          /* MOBILE SINGLE-PAGE VIEWPORT (< 900px) */
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              width: "var(--page-w)",
              height: "var(--book-h)",
              touchAction: "pan-y",
            }}
            className="relative select-none flex items-center justify-center my-2"
          >
            {/* Mobile Single Page Box */}
            <div
              className={cn(
                "w-full h-full rounded-2xl overflow-hidden shadow-xl transition-all",
                !isOpen || mobilePage === 0
                  ? "border border-slate-700/80 bg-gradient-to-br from-[#080E20] via-[#0D1935] to-[#091124]"
                  : "border border-amber-950/25 bg-[var(--paper)]"
              )}
            >
              {!isOpen || mobilePage === 0 ? (
                /* Closed Cover on Mobile */
                <button
                  ref={coverButtonRef}
                  type="button"
                  onClick={handleOpenBook}
                  aria-label="Open The Innovation Journal"
                  className="w-full h-full p-6 flex flex-col justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
                >
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3 text-xs font-mono text-brand-cyan">
                    <div className="flex items-center gap-2">
                      <Image
                        src="/images/iedc-logo.png"
                        alt="IEDC Logo"
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                      <span>{SITE_CONFIG.name}</span>
                    </div>
                    <span>{SITE_CONFIG.institutionShort}</span>
                  </div>

                  <div className="space-y-2 text-center my-auto py-6">
                    <span className="block text-[11px] font-mono tracking-widest text-brand-cyan uppercase">
                      THE
                    </span>
                    <h2 className="font-display font-bold text-2xl sm:text-3xl text-typo-white tracking-tight uppercase">
                      INNOVATION
                    </h2>
                    <span className="block font-display text-lg font-semibold text-slate-200">
                      JOURNAL
                    </span>
                    <p className="text-xs text-typo-gray pt-2">
                      Ideas · People · Impact
                    </p>
                  </div>

                  <div className="text-center pt-2">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-brand-cyan/40 text-xs font-mono text-brand-cyan min-h-[44px]">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Tap to open book →</span>
                    </span>
                  </div>
                </button>
              ) : mobilePage === 1 ? (
                renderIntroPage()
              ) : mobilePage === 2 ? (
                renderContentsPage()
              ) : (
                /* Article Pages on Mobile */
                (() => {
                  const articleIdx = Math.floor((mobilePage - 3) / 2);
                  const isTextSide = (mobilePage - 3) % 2 === 1;
                  const blog = blogs[articleIdx];
                  if (!blog) return null;
                  return isTextSide
                    ? renderArticleRightPage(blog, articleIdx + 1)
                    : renderArticleLeftPage(blog, articleIdx + 1);
                })()
              )}
            </div>
          </div>
        )}

        {/* 3. Reserved 48px Controls Row Under Book in BOTH States (A2 & A5) */}
        <div className="w-full max-w-xl mx-auto min-h-[48px] h-12 flex items-center justify-between px-4 select-none">
          {isOpen ? (
            <>
              <button
                type="button"
                onClick={handleCloseBook}
                aria-label="Close book"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-foundation-dark/80 hover:bg-foundation-dark border border-slate-700 hover:border-slate-500 text-xs font-mono text-typo-gray hover:text-typo-white transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>

              <span className="text-xs font-mono text-brand-cyan font-semibold">
                {isMobile
                  ? `Page ${mobilePage + 1} of ${totalMobilePages}`
                  : `Spread ${currentSpread + 1} of ${totalSpreads}`}
              </span>

              {isMobile ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMobileTurn("prev")}
                    aria-label="Previous page"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg bg-foundation-dark border border-slate-700 text-brand-cyan hover:border-brand-cyan active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMobileTurn("next")}
                    disabled={mobilePage >= totalMobilePages - 1}
                    aria-label="Next page"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg bg-foundation-dark border border-slate-700 text-brand-cyan hover:border-brand-cyan disabled:opacity-40 active:scale-95"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => triggerSpreadTurn("prev")}
                    aria-label="Previous spread"
                    className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-lg bg-foundation-dark border border-slate-700 text-xs font-mono text-brand-cyan hover:border-brand-cyan inline-flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Prev</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerSpreadTurn("next")}
                    disabled={currentSpread >= totalSpreads - 1}
                    aria-label="Next spread"
                    className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-lg bg-foundation-dark border border-slate-700 text-xs font-mono text-brand-cyan hover:border-brand-cyan inline-flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center">
              <span className="text-xs font-mono text-typo-gray/80 flex items-center gap-1.5">
                <span>Click cover or press</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-brand-cyan border border-slate-700 font-semibold shadow-sm">
                  Enter ↵
                </kbd>
                <span>to open journal</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Readers' Remarks & Discussion Section (Scrollable below book) */}
      {(() => {
        let activeBlog: IBlog | null = null;
        if (isMobile) {
          if (mobilePage >= 3) {
            const idx = Math.floor((mobilePage - 3) / 2);
            activeBlog = blogs[idx] || blogs[0] || null;
          }
        } else {
          if (isOpen && currentSpread >= 2) {
            const idx = currentSpread - 2;
            activeBlog = blogs[idx] || blogs[0] || null;
          }
        }
        if (!activeBlog && blogs.length > 0) {
          activeBlog = blogs[0];
        }

        if (!activeBlog) return null;

        return (
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-12">
            <BlogCommentsSection
              blogSlug={activeBlog.slug}
              blogTitle={activeBlog.title}
            />
          </div>
        );
      })()}

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
