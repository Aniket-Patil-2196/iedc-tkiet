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
import { cn } from "@/lib/utils";

interface InnovationJournalBookProps {
  blogs: IBlog[];
  initialPostSlug?: string;
}

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

  const [headerHeight, setHeaderHeight] = useState(120);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [viewportHeight, setViewportHeight] = useState(900);
  const [isMobile, setIsMobile] = useState(false);
  const [coverTitleScale, setCoverTitleScale] = useState(1);

  const totalSpreads = useMemo(() => 1 + blogs.length, [blogs.length]);
  const totalMobilePages = useMemo(() => 2 + blogs.length * 2, [blogs.length]);

  // Dynamic Responsive Dimensions Calculation
  useEffect(() => {
    const handleResize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setViewportHeight(vh);
      setIsMobile(vw < 900);

      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.getBoundingClientRect().height);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const ro = new ResizeObserver(() => {
      handleResize();
    });
    if (headerRef.current) ro.observe(headerRef.current);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      ro.disconnect();
    };
  }, []);

  // Compute Book Dimensions according to math rules
  const { bookHeight, pageWidth } = useMemo(() => {
    if (isMobile) {
      // Mobile: size page by width, allow normal scrolling
      const pw = Math.min(containerWidth - 32, 420);
      const bh = Math.round(pw / 0.75);
      return { bookHeight: bh, pageWidth: pw };
    }

    // Desktop: fit within 100svh minus header-height, blog-head-h, and padding
    // Short viewport (< 700px) shrinks header first, book height clamped between 400px and 780px
    const headerH = headerHeight || 120;
    const siteHeaderH = 64; // ~4rem
    const pad = 36;
    const availableH = viewportHeight - siteHeaderH - headerH - pad;
    const clampedH = Math.max(400, Math.min(780, availableH));

    // Cap page width so open spread never exceeds container width:
    // page-w = min(book-height * 0.75, (container-width - space for arrows) / 2)
    const arrowSpace = 100;
    const maxPageW = Math.floor((containerWidth - arrowSpace) / 2);
    const idealPageW = Math.round(clampedH * 0.75);
    const pw = Math.max(260, Math.min(idealPageW, maxPageW));
    const finalH = Math.round(pw / 0.75);

    return { bookHeight: finalH, pageWidth: pw };
  }, [isMobile, containerWidth, viewportHeight, headerHeight]);

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
  const renderIntroPage = () => (
    <div className="w-full h-full p-6 sm:p-8 flex flex-col justify-between select-none">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 text-xs font-mono text-brand-cyan tracking-wider uppercase">
          <span>IEDC TKIET</span>
          <span>EST. 2014</span>
        </div>

        <h2
          ref={firstHeadingRef}
          tabIndex={-1}
          className="font-display text-2xl sm:text-3xl font-bold text-typo-white tracking-tight focus:outline-none"
        >
          Editorial Preface
        </h2>

        <p className="font-sans text-xs sm:text-sm text-typo-gray leading-relaxed">
          Welcome to <span className="text-brand-cyan font-medium">The Innovation Journal</span>,
          the institutional publication of the Innovation &amp; Entrepreneurship Development Cell at
          TKIET Warananagar.
        </p>

        <p className="font-sans text-xs sm:text-sm text-typo-gray leading-relaxed">
          Here we document student ventures, patent drafts, interdisciplinary engineering research,
          and entrepreneurial breakthroughs emerging from campus incubators.
        </p>

        <div className="pt-2">
          <div className="p-3.5 rounded-xl bg-foundation-dark/60 border border-slate-700/60 space-y-1">
            <span className="text-[10px] font-mono text-brand-cyan uppercase tracking-widest block font-bold">
              CELL MANDATE
            </span>
            <span className="text-xs text-typo-gray leading-relaxed block">
              Transforming academic engineering ideas into validated prototypes and regional startups.
            </span>
          </div>
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-slate-800/80 text-[11px] font-mono text-typo-gray/60">
        <span>WARANANAGAR, MH</span>
        <span>FOLIO I</span>
      </div>
    </div>
  );

  // Contents Page (Spread 0 Right)
  const renderContentsPage = () => (
    <div className="w-full h-full p-6 sm:p-8 flex flex-col justify-between select-none">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 text-xs font-mono text-brand-cyan tracking-wider uppercase">
          <span>TABLE OF CONTENTS</span>
          <span>{blogs.length} ARTICLES</span>
        </div>

        <h3 className="font-display text-xl sm:text-2xl font-bold text-typo-white tracking-tight">
          Published Articles
        </h3>

        {blogs.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-brand-cyan/60 mx-auto" />
            <p className="font-sans text-xs text-typo-gray">
              Stories are coming soon. New publications will be indexed here.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
            {blogs.map((b, idx) => (
              <button
                key={b.id || b.slug}
                type="button"
                onClick={() => handleJumpToArticle(idx)}
                className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800/40 border border-transparent hover:border-slate-700/60 transition-colors group flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-brand-cyan font-bold">
                      {(idx + 1).toString().padStart(2, "0")}
                    </span>
                    <span className="font-display text-xs sm:text-sm font-semibold text-typo-white group-hover:text-brand-cyan truncate transition-colors">
                      {b.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-typo-gray/70 block">
                    {getPubDate(b)} · {b.readTimeMinutes || 3} min read
                  </span>
                </div>
                <span className="text-xs font-mono text-brand-cyan opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  P. {(idx + 2).toString().padStart(2, "0")} →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-slate-800/80 text-[11px] font-mono text-typo-gray/60">
        <span>INDEX SECTION</span>
        <span>FOLIO II</span>
      </div>
    </div>
  );

  // Article Left Page (Images & Reference Visuals)
  const renderArticleLeftPage = (blog: IBlog, spreadIdx: number) => {
    const imageSrc =
      blog.coverImage?.trim() ||
      EDITORIAL_FALLBACK_IMAGES[(spreadIdx - 1) % EDITORIAL_FALLBACK_IMAGES.length];

    return (
      <div className="w-full h-full p-6 sm:p-8 flex flex-col justify-between select-none">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 text-xs font-mono text-brand-cyan tracking-wider uppercase">
            <span>FIGURE &amp; ARCHIVE</span>
            {isDevPlaceholder(blog) && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                <AlertTriangle className="w-3 h-3" />
                Dev Placeholder
              </span>
            )}
          </div>

          {/* Stamp / Image Frame */}
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-700/60 bg-foundation-dark group shadow-md">
            <Image
              src={imageSrc}
              alt={blog.title}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <button
              type="button"
              onClick={() => setLightboxImage({ src: imageSrc, alt: blog.title, caption: blog.title })}
              aria-label="View full image"
              className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-foundation-darkest/80 text-brand-cyan hover:text-typo-white backdrop-blur border border-brand-cyan/30 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Metadata / Details */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2 text-[11px] font-mono text-brand-cyan uppercase">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{getPubDate(blog)}</span>
              <span>·</span>
              <span>{blog.author || "IEDC TKIET"}</span>
            </div>
            <p className="text-xs font-sans text-typo-gray leading-relaxed line-clamp-3">
              {blog.excerpt}
            </p>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-slate-800/80 text-[11px] font-mono text-typo-gray/60">
          <span>PLATE {(spreadIdx * 2 - 1).toString().padStart(2, "0")}</span>
          <Link
            href={`/blog/${blog.slug}`}
            className="text-brand-cyan hover:underline inline-flex items-center gap-1"
          >
            <span>Full Article</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  };

  // Article Right Page (Text Content & Running Head)
  const renderArticleRightPage = (blog: IBlog, spreadIdx: number) => (
    <div className="w-full h-full p-6 sm:p-8 flex flex-col justify-between select-none">
      <div className="space-y-4">
        {/* Running Head */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 text-[11px] font-mono text-brand-cyan tracking-wider uppercase">
          <span>{getPubDate(blog)}</span>
          <span>{blog.readTimeMinutes || 4} MIN READ</span>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-lg sm:text-xl font-bold text-typo-white tracking-tight leading-snug">
            {blog.title}
          </h3>
          <p className="font-sans text-xs sm:text-sm text-typo-gray leading-relaxed line-clamp-[10]">
            {blog.content || blog.excerpt}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href={`/blog/${blog.slug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/30 text-xs font-sans font-semibold text-brand-cyan transition-colors"
          >
            <span>Continue reading manuscript</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="pt-4 flex items-center justify-between border-t border-slate-800/80 text-[11px] font-mono text-typo-gray/60">
        <span>THE INNOVATION JOURNAL</span>
        <span>PAGE {(spreadIdx * 2).toString().padStart(2, "0")}</span>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center">
      {/* 1. Compact Header Row (~120-140px, shrinks on short viewports <= 700px) */}
      <header
        ref={headerRef}
        id="blog-header-row"
        className="w-full max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 py-4 sm:py-6 border-b border-foundation-slate/50 mb-4 sm:mb-6 select-none"
      >
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-foundation-slate/60 border border-brand-cyan/30 text-[10px] sm:text-xs font-mono tracking-widest text-brand-cyan uppercase">
              <Sparkles className="w-3 h-3 text-brand-cyan" />
              BLOG
            </span>
            <h1 className="font-display font-bold text-typo-white whitespace-nowrap tracking-tight text-[clamp(1.75rem,3.8vw,3rem)] leading-none">
              The Innovation Journal
            </h1>
          </div>

          {/* Subtitle inline - hides on short viewports to save space */}
          <span className="hidden md:inline text-xs sm:text-sm font-sans text-brand-cyan/80 font-medium [@media(max-height:700px)]:hidden">
            Ideas · People · Impact
          </span>
        </div>

        {/* Short description on the right - hides on short viewports */}
        <p className="hidden lg:block max-w-xs text-xs font-sans text-typo-gray leading-relaxed text-right [@media(max-height:700px)]:hidden">
          Editorial perspectives on student incubation, deep tech breakthroughs, and startup ventures from IEDC TKIET.
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
              className="relative flex rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)]"
            >
              {/* Spine Shading & Shadow Layer */}
              <div
                aria-hidden="true"
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-10 pointer-events-none z-30"
                style={{
                  background:
                    "linear-gradient(to right, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.45) 100%)",
                  opacity: isOpen ? 0.85 : 0,
                }}
              />

              {/* LEFT PAGE OF SPREAD */}
              <div
                style={{ width: "var(--page-w)", height: "var(--book-h)" }}
                className={cn(
                  "relative rounded-l-2xl border-y border-l border-slate-700/70 bg-gradient-to-br from-[#091124] via-[#0D1935] to-[#080E20] overflow-hidden",
                  !isOpen && "invisible pointer-events-none"
                )}
              >
                {/* Subtle Paper Texture & Spine Shadow */}
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/60 to-transparent pointer-events-none" />
                {currentSpread === 0
                  ? renderIntroPage()
                  : blogs[currentSpread - 1] &&
                    renderArticleLeftPage(blogs[currentSpread - 1], currentSpread)}
              </div>

              {/* RIGHT PAGE OF SPREAD (or Closed Cover when closed) */}
              <div
                style={{ width: "var(--page-w)", height: "var(--book-h)" }}
                className={cn(
                  "relative rounded-r-2xl border-y border-r border-slate-700/70 bg-gradient-to-br from-[#080E20] via-[#0D1935] to-[#091124] overflow-hidden",
                  !isOpen && "invisible pointer-events-none"
                )}
              >
                {/* Subtle Paper Texture & Spine Shadow */}
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" />
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
                    className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-brand-cyan/20 to-transparent hover:from-brand-cyan/40 transition-all rounded-tl-2xl cursor-pointer group flex items-end justify-end p-2.5"
                  >
                    <ChevronRight className="w-4 h-4 text-brand-cyan/70 group-hover:text-brand-cyan group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>

              {/* 3D Dynamic Flipping Leaf during page turns */}
              {isTurning && (
                <div
                  ref={turnDirection === "next" ? rightFlipperRef : leftFlipperRef}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "var(--page-w)",
                    width: "var(--page-w)",
                    height: "var(--book-h)",
                    transformOrigin: turnDirection === "next" ? "left center" : "left center",
                    transformStyle: "preserve-3d",
                    zIndex: 40,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      boxShadow: `0 0 40px rgba(0,0,0,${shadowOpacity})`,
                    }}
                    className="rounded-r-2xl border border-slate-700 bg-gradient-to-br from-[#091124] via-[#0D1935] to-[#080E20] overflow-hidden"
                  >
                    {/* Shadow overlay during flip */}
                    <div
                      style={{ opacity: shadowOpacity }}
                      className="absolute inset-0 bg-black pointer-events-none transition-opacity"
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

                    {/* Small Silk Bookmark Ribbon peeking out at bottom */}
                    <div className="absolute -bottom-3 left-16 w-5 h-7 rounded-b bg-gradient-to-b from-brand-blue to-brand-cyan shadow-md pointer-events-none" />

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

                      {/* Top Emblem & Header */}
                      <div className="space-y-3 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-900/80 border border-brand-cyan/40 shadow-[0_0_15px_rgba(56,189,248,0.25)] text-brand-cyan mx-auto">
                          <Sparkles className="w-6 h-6 animate-pulse" />
                        </div>
                        <span className="block text-[11px] font-mono tracking-[0.25em] text-slate-300 uppercase font-semibold">
                          IEDC TKIET
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
                  className="absolute -left-12 p-3 rounded-full bg-foundation-dark/80 hover:bg-foundation-dark border border-slate-700 hover:border-brand-cyan text-brand-cyan shadow-lg transition-all active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => triggerSpreadTurn("next")}
                  disabled={currentSpread >= totalSpreads - 1}
                  aria-label="Next spread"
                  className={cn(
                    "absolute -right-12 p-3 rounded-full bg-foundation-dark/80 hover:bg-foundation-dark border border-slate-700 hover:border-brand-cyan text-brand-cyan shadow-lg transition-all active:scale-95",
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
            <div className="w-full h-full rounded-2xl border border-slate-700/80 bg-gradient-to-br from-[#080E20] via-[#0D1935] to-[#091124] overflow-hidden shadow-xl">
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
                    <span>IEDC TKIET</span>
                    <span>WARANANAGAR</span>
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
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-brand-cyan/40 text-xs font-mono text-brand-cyan">
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

        {/* 3. Controls & Pagination Footer Under Book */}
        <div className="flex items-center justify-between w-full max-w-xl mx-auto pt-4 sm:pt-6 px-4 select-none">
          {isOpen ? (
            <>
              <button
                type="button"
                onClick={handleCloseBook}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foundation-dark/80 hover:bg-foundation-dark border border-slate-700 hover:border-slate-500 text-xs font-mono text-typo-gray hover:text-typo-white transition-all"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close book</span>
              </button>

              <span className="text-xs font-mono text-brand-cyan">
                {isMobile
                  ? `Page ${mobilePage + 1} of ${totalMobilePages}`
                  : `Spread ${currentSpread + 1} of ${totalSpreads}`}
              </span>

              {isMobile ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleMobileTurn("prev")}
                    aria-label="Previous mobile page"
                    className="p-2 rounded-lg bg-foundation-dark border border-slate-700 text-brand-cyan hover:border-brand-cyan"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMobileTurn("next")}
                    disabled={mobilePage >= totalMobilePages - 1}
                    aria-label="Next mobile page"
                    className="p-2 rounded-lg bg-foundation-dark border border-slate-700 text-brand-cyan hover:border-brand-cyan disabled:opacity-40"
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
                    className="px-3 py-1.5 rounded-lg bg-foundation-dark border border-slate-700 text-xs font-mono text-brand-cyan hover:border-brand-cyan inline-flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerSpreadTurn("next")}
                    disabled={currentSpread >= totalSpreads - 1}
                    aria-label="Next spread"
                    className="px-3 py-1.5 rounded-lg bg-foundation-dark border border-slate-700 text-xs font-mono text-brand-cyan hover:border-brand-cyan inline-flex items-center gap-1 disabled:opacity-40"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="w-full text-center">
              <span className="text-xs font-mono text-typo-gray/70">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-brand-cyan border border-slate-700">Enter</kbd> or click cover to open journal
              </span>
            </div>
          )}
        </div>
      </div>

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
