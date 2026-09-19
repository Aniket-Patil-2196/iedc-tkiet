"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ZoomIn,
  Sparkles,
  Share2,
  Check,
  RotateCcw,
  MousePointer2,
} from "lucide-react";
import { IBlog } from "@/types/content";
import { formatEventDate } from "@/lib/utils/event-status";
import { ImageLightbox } from "./ImageLightbox";

interface InnovationJournalBookProps {
  blogs: IBlog[];
}

// Fallback visual imagery for articles if coverImage is empty
const EDITORIAL_FALLBACK_IMAGES = [
  "/images/placeholders/gallery-1.svg",
  "/images/placeholders/gallery-2.svg",
  "/images/placeholders/gallery-3.svg",
  "/images/placeholders/gallery-4.svg",
  "/images/placeholders/gallery-5.svg",
  "/images/placeholders/gallery-6.svg",
];

export function InnovationJournalBook({ blogs }: InnovationJournalBookProps) {
  // Spreads setup:
  // Spread 0: Cover (Closed/Open intro)
  // Spread 1: Contents (Index of all articles)
  // Spread 2..N: Article spreads (1 spread per published article)
  const [currentSpread, setCurrentSpread] = useState(0);
  const [isTurning, setIsTurning] = useState(false);
  const [turnDirection, setTurnDirection] = useState<"next" | "prev" | null>(null);
  const [targetSpread, setTargetSpread] = useState<number | null>(null);
  const [turnAngle, setTurnAngle] = useState(0); // in degrees: 0 to -180 (next) or 0 to 180 (prev)
  const [shadowOpacity, setShadowOpacity] = useState(0);

  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string; caption?: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [mobilePage, setMobilePage] = useState(0);

  // References for dragging and 3D leaf
  const bookRef = useRef<HTMLDivElement>(null);
  const rightFlipperRef = useRef<HTMLDivElement>(null);
  const leftFlipperRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const currentDragAngle = useRef(0);

  // Spreads count:
  // Spread 0: Cover
  // Spread 1: Contents
  // Spreads 2..(1 + blogs.length): Article spreads
  const totalSpreads = useMemo(() => Math.max(2, 2 + blogs.length), [blogs.length]);
  const totalMobilePages = useMemo(() => Math.max(2, 2 + blogs.length * 2), [blogs.length]);

  // Initial Cover Opening Animation on mount
  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setCurrentSpread(1); // Open immediately at Contents
      setMobilePage(1);
      return;
    }

    // Smooth opening animation: show cover briefly (750ms), then smoothly turn to Contents
    const timer = setTimeout(() => {
      triggerTurn("next", 1);
    }, 850);

    return () => clearTimeout(timer);
  }, []);

  // Format numbers with leading zeros (e.g. 01, 02)
  const fmt = (num: number) => (num < 10 ? `0${num}` : `${num}`);

  // Trigger page turn with GSAP physics
  const triggerTurn = useCallback(
    (direction: "next" | "prev", destSpread?: number) => {
      if (isTurning) return;

      const nextIndex =
        destSpread !== undefined
          ? destSpread
          : direction === "next"
          ? currentSpread + 1
          : currentSpread - 1;

      if (nextIndex < 0 || nextIndex >= totalSpreads || nextIndex === currentSpread) return;

      setIsTurning(true);
      setTurnDirection(direction);
      setTargetSpread(nextIndex);

      const targetAngle = direction === "next" ? -180 : 180;
      const flipper = direction === "next" ? rightFlipperRef.current : leftFlipperRef.current;

      const animObj = { angle: 0 };

      gsap.to(animObj, {
        angle: targetAngle,
        duration: 0.68,
        ease: "power2.inOut",
        onUpdate: () => {
          const deg = animObj.angle;
          setTurnAngle(deg);
          // Shadow peaks at 90 degrees turn and dissipates at 0 and 180
          const progress = Math.abs(deg) / 180;
          const shadow = Math.sin(progress * Math.PI) * 0.45;
          setShadowOpacity(shadow);

          if (flipper) {
            flipper.style.transform = `rotateY(${deg}deg)`;
          }
        },
        onComplete: () => {
          setCurrentSpread(nextIndex);
          setMobilePage(nextIndex === 0 ? 0 : nextIndex === 1 ? 1 : 2 + (nextIndex - 2) * 2);
          setIsTurning(false);
          setTurnDirection(null);
          setTargetSpread(null);
          setTurnAngle(0);
          setShadowOpacity(0);
          if (flipper) {
            flipper.style.transform = "rotateY(0deg)";
          }
        },
      });
    },
    [currentSpread, isTurning, totalSpreads]
  );

  // Interactive Dragging on Desktop
  const handlePointerDown = (e: React.PointerEvent, side: "left" | "right") => {
    // Only allow drag if not already turning and valid boundary
    if (isTurning) return;
    if (side === "right" && currentSpread >= totalSpreads - 1) return;
    if (side === "left" && currentSpread <= 0) return;

    // Ignore interactive element clicks (links, buttons, lightbox triggers)
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) return;

    isDragging.current = true;
    dragStartX.current = e.clientX;
    const dir = side === "right" ? "next" : "prev";
    setTurnDirection(dir);
    setTargetSpread(dir === "next" ? currentSpread + 1 : currentSpread - 1);
    setIsTurning(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !turnDirection) return;

    const deltaX = e.clientX - dragStartX.current;
    const pageWidth = bookRef.current ? bookRef.current.clientWidth / 2 : 450;

    if (turnDirection === "next") {
      // Dragging left from right page: deltaX is negative
      const ratio = Math.max(-1, Math.min(0, deltaX / pageWidth));
      const deg = ratio * 180;
      currentDragAngle.current = deg;
      setTurnAngle(deg);
      const progress = Math.abs(deg) / 180;
      setShadowOpacity(Math.sin(progress * Math.PI) * 0.45);
      if (rightFlipperRef.current) {
        rightFlipperRef.current.style.transform = `rotateY(${deg}deg)`;
      }
    } else {
      // Dragging right from left page: deltaX is positive
      const ratio = Math.max(0, Math.min(1, deltaX / pageWidth));
      const deg = ratio * 180;
      currentDragAngle.current = deg;
      setTurnAngle(deg);
      const progress = Math.abs(deg) / 180;
      setShadowOpacity(Math.sin(progress * Math.PI) * 0.45);
      if (leftFlipperRef.current) {
        leftFlipperRef.current.style.transform = `rotateY(${deg}deg)`;
      }
    }
  };

  const handlePointerUp = () => {
    if (!isDragging.current || !turnDirection || targetSpread === null) return;
    isDragging.current = false;

    const deg = currentDragAngle.current;
    const absDeg = Math.abs(deg);
    const flipper = turnDirection === "next" ? rightFlipperRef.current : leftFlipperRef.current;
    const shouldComplete = absDeg > 45; // dragged past 45 degrees -> complete turn

    const targetAngle = shouldComplete ? (turnDirection === "next" ? -180 : 180) : 0;
    const animObj = { angle: deg };

    gsap.to(animObj, {
      angle: targetAngle,
      duration: 0.45,
      ease: "power2.out",
      onUpdate: () => {
        setTurnAngle(animObj.angle);
        const progress = Math.abs(animObj.angle) / 180;
        setShadowOpacity(Math.sin(progress * Math.PI) * 0.45);
        if (flipper) {
          flipper.style.transform = `rotateY(${animObj.angle}deg)`;
        }
      },
      onComplete: () => {
        if (shouldComplete) {
          setCurrentSpread(targetSpread);
          setMobilePage(targetSpread === 0 ? 0 : targetSpread === 1 ? 1 : 2 + (targetSpread - 2) * 2);
        }
        setIsTurning(false);
        setTurnDirection(null);
        setTargetSpread(null);
        setTurnAngle(0);
        setShadowOpacity(0);
        if (flipper) {
          flipper.style.transform = "rotateY(0deg)";
        }
      },
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        if (currentSpread < totalSpreads - 1) {
          triggerTurn("next");
        }
      } else if (e.key === "ArrowLeft") {
        if (currentSpread > 0) {
          triggerTurn("prev");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSpread, totalSpreads, triggerTurn]);

  // Mobile Swipe Handling
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (diff > 50) {
      // Swiped left -> Next
      if (window.innerWidth < 1024) {
        if (mobilePage < totalMobilePages - 1) {
          const nextMobile = mobilePage + 1;
          setMobilePage(nextMobile);
          const nextSp = nextMobile === 0 ? 0 : nextMobile === 1 ? 1 : 2 + Math.floor((nextMobile - 2) / 2);
          setCurrentSpread(nextSp);
        }
      } else {
        triggerTurn("next");
      }
    } else if (diff < -50) {
      // Swiped right -> Prev
      if (window.innerWidth < 1024) {
        if (mobilePage > 0) {
          const prevMobile = mobilePage - 1;
          setMobilePage(prevMobile);
          const prevSp = prevMobile === 0 ? 0 : prevMobile === 1 ? 1 : 2 + Math.floor((prevMobile - 2) / 2);
          setCurrentSpread(prevSp);
        }
      } else {
        triggerTurn("prev");
      }
    }
    touchStartX.current = null;
  };

  const copyArticleLink = (slug: string) => {
    const url = `${window.location.origin}/blog/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Content Renderer for a Given Spread and Side
  const renderSpreadSide = (spreadIndex: number, side: "left" | "right") => {
    // SPREAD 0: COVER SPREAD
    if (spreadIndex === 0) {
      if (side === "left") {
        // Left inside flap of hardcover
        return (
          <div className="w-full h-full p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-gradient-to-br from-[#121824] via-[#0E131E] to-[#0A0E16] text-typo-white border-r border-foundation-slate/60 select-none">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-brand-cyan font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Vol. I // Official Publication</span>
              </div>
              <div className="w-12 h-[2px] bg-brand-blue" />
              <h3 className="font-display text-2xl lg:text-3xl font-bold text-typo-white leading-tight">
                Bridging Engineering Theory with Real-World Venture Creation
              </h3>
              <p className="font-sans text-xs sm:text-sm text-typo-gray leading-relaxed pt-1">
                The Innovation and Entrepreneurship Development Cell (IEDC) at TKIET Warananagar serves as an institutional springboard. Within these pages are reflections, founder journeys, and blueprint strategies designed to inspire engineering scholars.
              </p>
            </div>

            <div className="pt-8 border-t border-foundation-slate/60 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-typo-gray">Published by</div>
                  <div className="font-semibold text-typo-white">IEDC TKIET</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-typo-gray">Campus</div>
                  <div className="font-semibold text-typo-white">Warananagar</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-typo-gray pt-2 font-mono">
                <span>EDITION // 2026</span>
                <span>ARCHIVE FOLIO 00</span>
              </div>
            </div>
          </div>
        );
      } else {
        // Right page: The Grand Hardcover Front
        return (
          <div className="w-full h-full p-8 sm:p-10 lg:p-12 flex flex-col justify-between items-center text-center bg-gradient-to-br from-[#0A1124] via-[#070D1B] to-[#040812] text-white relative overflow-hidden select-none">
            {/* Atmospheric subtle radial glow behind crest */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-brand-blue/15 blur-3xl pointer-events-none" />
            <div className="absolute inset-4 border border-brand-cyan/20 rounded-xl pointer-events-none" />
            <div className="absolute inset-6 border border-brand-blue/30 rounded-lg pointer-events-none" />

            {/* Crest */}
            <div className="relative z-10 pt-4 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#080D1A] border border-brand-cyan/40 p-2 mx-auto flex items-center justify-center shadow-lg shadow-brand-blue/20">
                <Image
                  src="/images/iedc-logo.png"
                  alt="IEDC Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div className="text-xs uppercase tracking-[0.25em] text-brand-cyan font-bold">
                TKIET Warananagar
              </div>
            </div>

            {/* Title inspired by reference */}
            <div className="relative z-10 my-auto py-4 space-y-3">
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-300 leading-tight">
                THE INNOVATION JOURNAL
              </h2>
              <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-brand-cyan to-transparent mx-auto" />
              <p className="font-sans text-xs uppercase tracking-[0.25em] text-slate-300">
                Ideas · People · Impact
              </p>
            </div>

            {/* CTA */}
            <div className="relative z-10 pb-2">
              <button
                type="button"
                onClick={() => triggerTurn("next", 1)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-semibold tracking-wider uppercase transition-all duration-200 shadow-lg shadow-brand-blue/30 hover:scale-105 active:scale-95"
              >
                <span>Open Publication</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="text-[10px] text-slate-400 mt-2 font-mono">
                Click to turn page →
              </div>
            </div>
          </div>
        );
      }
    }

    // SPREAD 1: CONTENTS (INDEX)
    if (spreadIndex === 1) {
      if (side === "left") {
        return (
          <div className="w-full h-full p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-[#FBFBFC] text-slate-900 border-r border-slate-200 relative select-none">
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs text-slate-500 uppercase tracking-widest font-bold">
                <span>Contents & Register</span>
                <span>Issue Vol. 01</span>
              </div>

              <div className="space-y-2">
                <div className="font-display text-4xl lg:text-5xl font-thin text-slate-300">01</div>
                <h2 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-900 leading-snug">
                  Table of Contents
                </h2>
                <div className="w-10 h-[2px] bg-brand-blue" />
                <p className="font-sans text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
                  A curated record of technology explorations, campus incubation chronicles, and student startup milestones published by the Innovation and Entrepreneurship Development Cell.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <span className="font-semibold text-slate-900 block">Interactive Reading:</span>
                <p>Click any entry on the facing page or drag the page edge to flip directly to that story.</p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>IEDC ARCHIVE // REGISTER</span>
              <span>PAGE 01</span>
            </div>
          </div>
        );
      } else {
        return (
          <div className="w-full h-full p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-[#FBFBFC] text-slate-900 relative select-none">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-widest font-bold text-slate-400 pb-2 border-b border-slate-200">
                <span>Published Stories</span>
                <span>{blogs.length} Entries</span>
              </div>

              {blogs.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-sm">
                  The next story is yet to be written.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {blogs.map((b, idx) => {
                    const targetSp = 2 + idx;
                    const pageNum = 2 + idx * 2;
                    return (
                      <button
                        key={b.id || b.slug}
                        type="button"
                        onClick={() => triggerTurn("next", targetSp)}
                        className="w-full text-left p-3 rounded-lg border border-slate-200/80 hover:border-brand-blue hover:bg-slate-50 transition-all group flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                            <span>#{fmt(idx + 1)}</span>
                            <span>•</span>
                            <span>{formatEventDate(b.publicationDate || b.publishedAt)}</span>
                          </div>
                          <h4 className="font-display text-sm font-bold text-slate-900 truncate group-hover:text-brand-blue transition-colors">
                            {b.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-400 group-hover:text-brand-blue">
                          <span>P.{fmt(pageNum)}</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>INNOVATION JOURNAL</span>
              <span>PAGE 02</span>
            </div>
          </div>
        );
      }
    }

    // SPREADS 2..N: ARTICLE SPREADS
    const articleIdx = spreadIndex - 2;
    const article = blogs[articleIdx];

    if (!article) {
      return (
        <div className="w-full h-full p-12 flex items-center justify-center bg-[#FBFBFC] text-slate-500 text-sm">
          End of journal archive.
        </div>
      );
    }

    const pageLeftNum = 2 + articleIdx * 2;
    const pageRightNum = pageLeftNum + 1;
    const articleCover =
      article.coverImage || EDITORIAL_FALLBACK_IMAGES[articleIdx % EDITORIAL_FALLBACK_IMAGES.length];

    if (side === "left") {
      // Left Page matching the reference image (From Idea to Impact style)
      return (
        <div className="w-full h-full p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-[#FBFBFC] text-slate-900 border-r border-slate-200 relative overflow-y-auto select-none">
          <div className="space-y-5">
            {/* Top Serial Number & Date in reference style */}
            <div className="space-y-1">
              <div className="font-display text-4xl lg:text-5xl font-thin text-slate-400">
                {fmt(articleIdx + 1)}
              </div>
              <div className="text-[11px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
                {formatEventDate(article.publicationDate || article.publishedAt)}
              </div>
            </div>

            {/* Editorial Headline */}
            <h2 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight">
              {article.title}
            </h2>

            <div className="w-10 h-[2px] bg-brand-blue" />

            {/* Lead Excerpt */}
            <p className="font-sans text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold">
              {article.excerpt}
            </p>

            {/* Article Prose Paragraphs */}
            <div className="font-sans text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3 pt-1">
              {article.content.split("\n\n").slice(0, 2).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {/* Read Web View & Share CTA */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href={`/blog/${article.slug}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                <span>Read Full Web View</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => copyArticleLink(article.slug)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
                title="Copy article link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Copied!" : "Share"}</span>
              </button>
            </div>
          </div>

          {/* Left Footer matching the reference image seal */}
          <div className="pt-5 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-brand-cyan flex items-center justify-center font-bold text-[10px]">
                IEDC
              </div>
              <div className="text-[10px] font-sans">
                <div className="font-bold text-slate-800 tracking-wider">IEDC TKIET</div>
                <div className="text-slate-400 uppercase tracking-widest text-[8px]">IDEAS · PEOPLE · IMPACT</div>
              </div>
            </div>

            <span className="font-mono text-xs font-bold text-slate-400">
              {fmt(pageLeftNum)}
            </span>
          </div>
        </div>
      );
    } else {
      // Right Page matching the reference image (Imagery, Pull quote, Headline)
      return (
        <div className="w-full h-full p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-[#FBFBFC] text-slate-900 relative select-none">
          <div className="space-y-5">
            {/* Top Eyebrow */}
            <div className="flex items-center justify-between text-[11px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
              <span>IDEAS FOR A BETTER TOMORROW</span>
              <span>{article.readTimeMinutes} MIN READ</span>
            </div>

            {/* Featured Image Card with Lightbox Trigger */}
            <div className="relative w-full h-56 lg:h-64 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-md group">
              <Image
                src={articleCover}
                alt={article.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
              
              {/* Overlay caption */}
              <div className="absolute bottom-3 left-3 right-12 text-white">
                <span className="text-[10px] uppercase font-bold tracking-widest text-brand-cyan block">
                  Archival Highlight
                </span>
                <p className="text-xs font-medium truncate">{article.title}</p>
              </div>

              {/* Zoom Button */}
              <button
                type="button"
                onClick={() =>
                  setLightboxImage({
                    src: articleCover,
                    alt: article.title,
                    caption: article.title,
                  })
                }
                className="absolute bottom-3 right-3 p-2 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-sm transition-all shadow-md"
                title="Click to view image"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Pull Quote Card matching reference sticker */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 shadow-sm relative">
              <p className="font-sans text-xs sm:text-sm text-slate-800 leading-relaxed font-medium italic">
                “A community that turns ideas into impact. Student-led projects are the core of our greener, smarter future.”
              </p>
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-2">
                — Takeaway // {article.author}
              </div>
            </div>
          </div>

          {/* Right Footer */}
          <div className="pt-5 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>IEDC INNOVATION JOURNAL</span>
            <span className="font-bold text-slate-400">{fmt(pageRightNum)}</span>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="w-full relative flex flex-col items-center select-none">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER MATCHING REFERENCE IMAGE */}
      {/* ========================================================================= */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 mb-8 sm:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-foundation-slate/60 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/15 border border-brand-cyan/40 text-brand-cyan text-xs font-bold tracking-widest uppercase mb-3 shadow-[0_0_15px_rgba(56,189,248,0.15)]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>BLOG</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-typo-white tracking-tight leading-none">
            The Innovation Journal
          </h1>
          <p className="font-sans text-sm sm:text-base text-brand-cyan/90 font-medium tracking-wide mt-2">
            Ideas · People · Impact
          </p>
        </div>

        {/* Right Editorial Quote Box matching reference */}
        <div className="max-w-md border-l-2 border-brand-blue/50 pl-4 py-1">
          <p className="font-sans text-xs sm:text-sm text-typo-gray leading-relaxed">
            Stories, insights, and experiences from the IEDC community. Explore the journeys and innovations that shape a better tomorrow.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN 3D OPEN-BOOK SPREAD & CONTROLS */}
      {/* ========================================================================= */}
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 relative flex items-center justify-center">
        
        {/* Floating PREV PAGE Button */}
        <div className="hidden md:flex flex-col items-center gap-1 absolute left-2 lg:left-4 z-40">
          <button
            type="button"
            onClick={() => triggerTurn("prev")}
            disabled={currentSpread === 0 || isTurning}
            aria-label="Previous Page"
            className="w-12 h-12 rounded-full bg-foundation-dark/90 border border-foundation-slate hover:border-brand-cyan/60 flex items-center justify-center text-typo-white hover:text-brand-cyan disabled:opacity-25 disabled:cursor-not-allowed transition-all shadow-xl hover:scale-105 active:scale-95 group"
          >
            <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <span className="text-[10px] font-mono tracking-widest uppercase text-typo-gray">
            PREV PAGE
          </span>
        </div>

        {/* Floating NEXT PAGE Button */}
        <div className="hidden md:flex flex-col items-center gap-1 absolute right-2 lg:right-4 z-40">
          <button
            type="button"
            onClick={() => triggerTurn("next")}
            disabled={currentSpread >= totalSpreads - 1 || isTurning}
            aria-label="Next Page"
            className="w-12 h-12 rounded-full bg-foundation-dark/90 border border-foundation-slate hover:border-brand-cyan/60 flex items-center justify-center text-typo-white hover:text-brand-cyan disabled:opacity-25 disabled:cursor-not-allowed transition-all shadow-xl hover:scale-105 active:scale-95 group"
          >
            <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-0.5" />
          </button>
          <span className="text-[10px] font-mono tracking-widest uppercase text-typo-gray">
            NEXT PAGE
          </span>
        </div>

        {/* Book Outer Casing (Hardcover bezel, thickness, page stack edges) */}
        <div
          ref={bookRef}
          className="w-full max-w-5xl relative mx-auto rounded-2xl p-2.5 sm:p-4 bg-gradient-to-b from-[#141B29] via-[#0D121D] to-[#080B12] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.95),0_0_50px_rgba(37,99,235,0.08)] border border-foundation-slate/90 select-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Stacked Paper Edges Illusion */}
          <div className="absolute -bottom-2 inset-x-8 h-2 bg-[#E2E8F0]/30 rounded-b-md blur-[0.5px]" />
          <div className="absolute -bottom-1 inset-x-6 h-2 bg-[#CBD5E1]/40 rounded-b-md" />

          {/* ===================================================================== */}
          {/* DESKTOP TWO-PAGE SPREAD WITH PHYSICAL 3D PAGE-TURNING (>= 1024px) */}
          {/* ===================================================================== */}
          <div className="hidden lg:grid grid-cols-2 min-h-[620px] max-h-[720px] rounded-xl overflow-hidden bg-[#FBFBFC] relative shadow-inner [perspective:2500px] [transform-style:preserve-3d]">
            
            {/* Center Spine Crease Shadow */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 pointer-events-none z-30 bg-gradient-to-r from-black/20 via-black/5 to-black/20" />
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-slate-300/80 pointer-events-none z-30" />

            {/* BASE LEFT LEAF */}
            <div
              onPointerDown={(e) => handlePointerDown(e, "left")}
              className="relative w-full h-full cursor-pointer"
            >
              {renderSpreadSide(
                isTurning && turnDirection === "prev" && targetSpread !== null
                  ? targetSpread
                  : currentSpread,
                "left"
              )}
            </div>

            {/* BASE RIGHT LEAF */}
            <div
              onPointerDown={(e) => handlePointerDown(e, "right")}
              className="relative w-full h-full cursor-pointer"
            >
              {renderSpreadSide(
                isTurning && turnDirection === "next" && targetSpread !== null
                  ? targetSpread
                  : currentSpread,
                "right"
              )}
            </div>

            {/* =================================================================== */}
            {/* DYNAMIC 3D TURNING LEAF (NEXT: FLIPS RIGHT TO LEFT) */}
            {/* =================================================================== */}
            {isTurning && turnDirection === "next" && targetSpread !== null && (
              <div
                ref={rightFlipperRef}
                className="absolute inset-y-0 right-0 w-1/2 origin-left z-40 [transform-style:preserve-3d] pointer-events-none"
                style={{
                  transform: `rotateY(${turnAngle}deg)`,
                }}
              >
                {/* Front Face: Current Spread's Right Page */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] overflow-hidden bg-[#FBFBFC] shadow-2xl">
                  {renderSpreadSide(currentSpread, "right")}
                  {/* Dynamic Shadow Overlay */}
                  <div
                    className="absolute inset-0 bg-gradient-to-l from-black/40 via-black/20 to-transparent pointer-events-none transition-opacity duration-75"
                    style={{ opacity: shadowOpacity }}
                  />
                </div>

                {/* Back Face: Target Spread's Left Page (facing up after 180deg flip) */}
                <div
                  className="absolute inset-0 w-full h-full [backface-visibility:hidden] overflow-hidden bg-[#FBFBFC] shadow-2xl"
                  style={{ transform: "rotateY(180deg)" }}
                >
                  {renderSpreadSide(targetSpread, "left")}
                  {/* Dynamic Softening Shadow */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent pointer-events-none transition-opacity duration-75"
                    style={{ opacity: shadowOpacity }}
                  />
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* DYNAMIC 3D TURNING LEAF (PREV: FLIPS LEFT TO RIGHT) */}
            {/* =================================================================== */}
            {isTurning && turnDirection === "prev" && targetSpread !== null && (
              <div
                ref={leftFlipperRef}
                className="absolute inset-y-0 left-0 w-1/2 origin-right z-40 [transform-style:preserve-3d] pointer-events-none"
                style={{
                  transform: `rotateY(${turnAngle}deg)`,
                }}
              >
                {/* Front Face: Current Spread's Left Page */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] overflow-hidden bg-[#FBFBFC] shadow-2xl">
                  {renderSpreadSide(currentSpread, "left")}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent pointer-events-none transition-opacity duration-75"
                    style={{ opacity: shadowOpacity }}
                  />
                </div>

                {/* Back Face: Target Spread's Right Page */}
                <div
                  className="absolute inset-0 w-full h-full [backface-visibility:hidden] overflow-hidden bg-[#FBFBFC] shadow-2xl"
                  style={{ transform: "rotateY(-180deg)" }}
                >
                  {renderSpreadSide(targetSpread, "right")}
                  <div
                    className="absolute inset-0 bg-gradient-to-l from-black/40 via-black/20 to-transparent pointer-events-none transition-opacity duration-75"
                    style={{ opacity: shadowOpacity }}
                  />
                </div>
              </div>
            )}

          </div>

          {/* ===================================================================== */}
          {/* MOBILE SINGLE-PAGE VIEW (< 1024px) */}
          {/* ===================================================================== */}
          <div className="lg:hidden min-h-[560px] rounded-xl overflow-hidden bg-[#FBFBFC] text-slate-900 shadow-inner">
            {mobilePage === 0 && renderSpreadSide(0, "right")}
            {mobilePage === 1 && renderSpreadSide(1, "right")}
            {mobilePage >= 2 && (() => {
              const artIdx = Math.floor((mobilePage - 2) / 2);
              const side = (mobilePage - 2) % 2 === 0 ? "left" : "right";
              return renderSpreadSide(2 + artIdx, side);
            })()}
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. PROGRESS BAR & DRAG/CLICK HINT MATCHING REFERENCE */}
      {/* ========================================================================= */}
      <div className="w-full max-w-5xl mx-auto mt-6 px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left: Empty spacing on desktop for centering */}
        <div className="hidden sm:block w-32" />

        {/* Center: Page Counter & Progress Bar */}
        <div className="flex flex-col items-center gap-2">
          <div className="font-mono text-xs text-typo-gray tracking-wider">
            <span className="text-typo-white font-bold">{fmt(currentSpread + 1)}</span>
            <span className="mx-1.5 text-foundation-slate">/</span>
            <span>{fmt(totalSpreads)}</span>
          </div>

          <div className="w-48 sm:w-64 h-1 rounded-full bg-foundation-slate overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-blue to-brand-cyan transition-all duration-300"
              style={{ width: `${((currentSpread + 1) / totalSpreads) * 100}%` }}
            />
          </div>
        </div>

        {/* Right: Drag / Click Hint */}
        <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider uppercase text-typo-gray">
          <span>DRAG OR CLICK TO TURN</span>
          <MousePointer2 className="w-3.5 h-3.5 text-brand-cyan animate-pulse" />
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM THUMBNAIL NAVIGATION STRIP MATCHING REFERENCE */}
      {/* ========================================================================= */}
      <div className="w-full max-w-6xl mx-auto mt-8 sm:mt-10 px-4">
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-4 pt-1 justify-start md:justify-center no-scrollbar">
          
          {/* Card 0: Cover */}
          <button
            type="button"
            onClick={() => triggerTurn(0 > currentSpread ? "next" : "prev", 0)}
            className={`shrink-0 flex flex-col items-center gap-2 group transition-all duration-200`}
          >
            <div
              className={`w-20 sm:w-24 h-14 sm:h-16 rounded-xl border p-1 bg-gradient-to-br from-[#0A1124] to-[#040812] flex flex-col items-center justify-center text-center shadow-lg transition-all ${
                currentSpread === 0
                  ? "border-brand-cyan ring-2 ring-brand-cyan/40 scale-105"
                  : "border-foundation-slate/80 hover:border-brand-cyan/50 hover:scale-102"
              }`}
            >
              <div className="text-[9px] uppercase tracking-wider font-bold text-brand-cyan truncate w-full px-1">
                IEDC
              </div>
              <div className="text-[8px] text-slate-300 leading-tight">Journal</div>
            </div>
            <span
              className={`text-[11px] font-mono tracking-wider ${
                currentSpread === 0 ? "text-brand-cyan font-bold" : "text-typo-gray group-hover:text-typo-white"
              }`}
            >
              Cover
            </span>
          </button>

          {/* Card 1: Contents */}
          <button
            type="button"
            onClick={() => triggerTurn(1 > currentSpread ? "next" : "prev", 1)}
            className={`shrink-0 flex flex-col items-center gap-2 group transition-all duration-200`}
          >
            <div
              className={`w-20 sm:w-24 h-14 sm:h-16 rounded-xl border p-1.5 bg-[#FBFBFC] flex flex-col justify-between shadow-lg transition-all ${
                currentSpread === 1
                  ? "border-brand-cyan ring-2 ring-brand-cyan/40 scale-105"
                  : "border-foundation-slate/80 hover:border-brand-cyan/50 hover:scale-102"
              }`}
            >
              <div className="text-[8px] font-bold uppercase text-slate-900 tracking-wider">CONTENTS</div>
              <div className="space-y-0.5">
                <div className="w-full h-1 bg-slate-200 rounded" />
                <div className="w-4/5 h-1 bg-slate-200 rounded" />
              </div>
              <div className="text-[7px] text-slate-400 font-mono">Index</div>
            </div>
            <span
              className={`text-[11px] font-mono tracking-wider ${
                currentSpread === 1 ? "text-brand-cyan font-bold" : "text-typo-gray group-hover:text-typo-white"
              }`}
            >
              Contents
            </span>
          </button>

          {/* Dynamic Article Cards */}
          {blogs.map((b, i) => {
            const spreadIdx = 2 + i;
            const isSelected = currentSpread === spreadIdx;
            return (
              <button
                key={b.id || b.slug}
                type="button"
                onClick={() => triggerTurn(spreadIdx > currentSpread ? "next" : "prev", spreadIdx)}
                className={`shrink-0 flex flex-col items-center gap-2 group transition-all duration-200`}
              >
                <div
                  className={`w-20 sm:w-24 h-14 sm:h-16 rounded-xl border p-1.5 bg-[#FBFBFC] flex flex-col justify-between shadow-lg transition-all ${
                    isSelected
                      ? "border-brand-cyan ring-2 ring-brand-cyan/40 scale-105"
                      : "border-foundation-slate/80 hover:border-brand-cyan/50 hover:scale-102"
                  }`}
                >
                  <div className="text-[8px] font-bold text-slate-900 truncate w-full">
                    {b.title}
                  </div>
                  <div className="w-full h-4 relative rounded overflow-hidden bg-slate-100">
                    <Image
                      src={
                        b.coverImage ||
                        EDITORIAL_FALLBACK_IMAGES[i % EDITORIAL_FALLBACK_IMAGES.length]
                      }
                      alt={b.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-[7px] text-slate-400 font-mono">P.{fmt(2 + i * 2)}</div>
                </div>
                <span
                  className={`text-[11px] font-mono tracking-wider ${
                    isSelected ? "text-brand-cyan font-bold" : "text-typo-gray group-hover:text-typo-white"
                  }`}
                >
                  {fmt(i + 1)}
                </span>
              </button>
            );
          })}

          {/* Extra Badge if articles */}
          <div className="shrink-0 flex flex-col items-center gap-2 text-typo-gray pl-1">
            <div className="w-20 sm:w-24 h-14 sm:h-16 rounded-xl border border-dashed border-foundation-slate flex items-center justify-center text-xs font-mono">
              {blogs.length}+ Stored
            </div>
            <span className="text-[11px] font-mono tracking-wider text-typo-gray">
              Archive
            </span>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. FOOTER ARCHIVAL BAR */}
      {/* ========================================================================= */}
      <div className="w-full max-w-7xl mx-auto mt-12 pt-6 border-t border-foundation-slate/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-typo-gray">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
          <span>IEDC TKIET // Innovation for a Better Tomorrow</span>
        </div>
        <div className="text-slate-500">
          Ideas · People · Impact
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. LIGHTBOX MODAL */}
      {/* ========================================================================= */}
      <ImageLightbox
        src={lightboxImage?.src || null}
        alt={lightboxImage?.alt || "Article Image"}
        caption={lightboxImage?.caption}
        onClose={() => setLightboxImage(null)}
      />

    </div>
  );
}
