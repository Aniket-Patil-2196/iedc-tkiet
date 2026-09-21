"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ThePenProps {
  isOpen: boolean;
  onOpenBook: () => void;
  containerWidth: number;
  pageWidth: number;
}

export function ThePen({
  isOpen,
  onOpenBook,
  containerWidth,
  pageWidth,
}: ThePenProps) {
  const [isTapping, setIsTapping] = useState(false);
  const [showInkDot, setShowInkDot] = useState(false);
  const [isHoveredProximity, setIsHoveredProximity] = useState(false);
  const [offsets, setOffsets] = useState({ x: 0, y: 0, rot: 0 });

  const penRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number | null>(null);

  // Free space calculation:
  // Desktop spread width is pageWidth * 2
  const spreadWidth = pageWidth * 2;
  const freeSpaceBesideSpread = (containerWidth - spreadWidth) / 2;

  // Visibility constraints:
  // 1. Desktop & larger tablets only (>= 1100px wide; hidden below that)
  // 2. When book is open: only show if at least 160px is free beside the spread
  const isVisible =
    containerWidth >= 1100 && (!isOpen || freeSpaceBesideSpread >= 160);

  // Proximity reaction: when cursor comes within ~80px (fine pointers only)
  useEffect(() => {
    if (!isVisible || typeof window === "undefined") return;

    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!isFinePointer || prefersReducedMotion) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        if (!penRef.current) return;
        const rect = penRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const dist = Math.hypot(dx, dy);

        if (dist < 80) {
          setIsHoveredProximity(true);
          // Drift max 10px toward cursor, lift a few pixels, slight tilt
          const factor = (80 - dist) / 80;
          const driftX = (dx / dist) * 10 * factor;
          const driftY = (dy / dist) * 8 * factor - 4 * factor; // lift
          const tilt = (dx > 0 ? 5 : -5) * factor;

          setOffsets({ x: driftX, y: driftY, rot: tilt });
        } else {
          setIsHoveredProximity(false);
          setOffsets({ x: 0, y: 0, rot: 0 });
        }
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isVisible, isOpen]);

  // Click handler:
  const handleClick = useCallback(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!isOpen) {
      // Pen swings to cover and taps it (~500ms), small ink dot appears, book opens
      if (prefersReducedMotion) {
        onOpenBook();
        return;
      }

      setIsTapping(true);
      setShowInkDot(true);

      setTimeout(() => {
        onOpenBook();
      }, 420);

      setTimeout(() => {
        setIsTapping(false);
        setShowInkDot(false);
      }, 700);
    } else {
      // When book is open: smooth-scroll to readers comments form and focus name field
      const commentsForm = document.getElementById("readers-remarks");
      if (commentsForm) {
        commentsForm.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => {
          const nameInput = document.getElementById(
            "comment-author-name"
          ) as HTMLInputElement | null;
          nameInput?.focus();
        }, 600);
      }
    }
  }, [isOpen, onOpenBook]);

  if (!isVisible) return null;

  return (
    <>
      {/* Temporary Ink Dot on Cover when pen taps it */}
      {showInkDot && (
        <div
          aria-hidden="true"
          className="fixed pointer-events-none z-50 w-3.5 h-3.5 rounded-full bg-[#1E3A8A] shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-ping"
          style={{
            top: "48%",
            left: `calc(50% + ${Math.round(pageWidth / 4)}px)`,
          }}
        />
      )}

      {/* The Pen Container */}
      <div
        className={cn(
          "absolute z-30 transition-all duration-700 ease-out select-none flex flex-col items-center pointer-events-auto",
          isOpen
            ? "top-1/2 -translate-y-1/2 right-4 lg:right-8"
            : "top-1/2 -translate-y-1/2 right-[8%] xl:right-[12%]"
        )}
      >
        {/* Handwritten Note in Kalam font with Curved SVG Arrow */}
        <div
          className={cn(
            "flex flex-col items-center mb-2 transition-opacity duration-300 pointer-events-none",
            isHoveredProximity ? "opacity-100" : "opacity-85"
          )}
        >
          <span className="font-book-handwriting font-bold text-sm lg:text-base text-brand-cyan drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] tracking-wide">
            {isOpen ? "Leave a remark" : "Click to open"}
          </span>

          {/* Curved SVG Arrow drawing itself toward target */}
          <svg
            width="32"
            height="24"
            viewBox="0 0 32 24"
            fill="none"
            className="text-brand-cyan/80 mt-0.5"
            aria-hidden="true"
          >
            {isOpen ? (
              // Arrow pointing down toward comments
              <path
                d="M16 2 C16 10, 16 16, 16 20 M11 16 L16 21 L21 16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              // Curved arrow pointing left toward closed cover
              <path
                d="M26 4 C20 4, 10 12, 6 18 M12 18 L5 19 L6 12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>

        {/* Fountain Pen Interactive Button */}
        <button
          ref={penRef}
          type="button"
          onClick={handleClick}
          aria-label={
            isOpen
              ? "Leave a remark in readers comments"
              : "Open The Innovation Journal with the fountain pen"
          }
          style={{
            transform: isTapping
              ? "translateX(-45px) translateY(10px) rotate(-35deg) scale(1.05)"
              : `translate3d(${offsets.x}px, ${offsets.y}px, 0) rotate(${
                  -22 + offsets.rot
                }deg)`,
            transition: isTapping
              ? "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
              : "filter 0.2s ease, transform 0.1s ease-out",
          }}
          className={cn(
            "group relative p-2 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan cursor-pointer",
            isHoveredProximity && "brightness-110"
          )}
        >
          {/* SVG Fountain Pen (Navy body, cyan/silver trim, soft shadow) */}
          <svg
            width="44"
            height="150"
            viewBox="0 0 44 150"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn(
              "drop-shadow-[0_10px_16px_rgba(0,0,0,0.6)] transition-all duration-300",
              isHoveredProximity &&
                "drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]"
            )}
          >
            {/* Pen Barrel / Body (Deep navy lacquer) */}
            <rect
              x="14"
              y="32"
              width="16"
              height="80"
              rx="4"
              fill="url(#penNavyGrad)"
              stroke="#1E293B"
              strokeWidth="0.8"
            />

            {/* Silver / Cyan Decorative Ring Band */}
            <rect x="13.5" y="55" width="17" height="3" rx="1" fill="#38BDF8" />
            <rect x="13.5" y="59" width="17" height="1.5" fill="#E2E8F0" />
            <rect x="13.5" y="104" width="17" height="2.5" rx="1" fill="#E2E8F0" />

            {/* Pen Cap Finial */}
            <path
              d="M16 32 C16 26, 28 26, 28 32 Z"
              fill="url(#penNavyGrad)"
              stroke="#38BDF8"
              strokeWidth="0.8"
            />

            {/* Silver Clip */}
            <path
              d="M20 34 L20 68 C20 71, 24 71, 24 68 L24 34 Z"
              fill="url(#silverClipGrad)"
              stroke="#0F172A"
              strokeWidth="0.5"
            />
            <circle cx="22" cy="68" r="2" fill="#38BDF8" />

            {/* Section / Grip */}
            <path
              d="M15 112 L17 126 L27 126 L29 112 Z"
              fill="#0F172A"
              stroke="#38BDF8"
              strokeWidth="0.8"
            />

            {/* Gold / Silver Nib */}
            <path
              d="M17 126 L22 144 L27 126 Z"
              fill="url(#goldNibGrad)"
              stroke="#D4AF37"
              strokeWidth="0.6"
            />

            {/* Nib Slit & Breather Hole */}
            <line
              x1="22"
              y1="130"
              x2="22"
              y2="144"
              stroke="#0F172A"
              strokeWidth="0.75"
            />
            <circle cx="22" cy="132" r="0.9" fill="#0F172A" />

            {/* Glowing Nib Tip */}
            <circle
              cx="22"
              cy="144"
              r="1.5"
              className={cn(
                "transition-all duration-300",
                isHoveredProximity
                  ? "fill-brand-cyan filter drop-shadow(0 0 5px #38BDF8)"
                  : "fill-[#E2E8F0]"
              )}
            />

            {/* Gradients */}
            <defs>
              <linearGradient
                id="penNavyGrad"
                x1="14"
                y1="32"
                x2="30"
                y2="112"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#0B132B" />
                <stop offset="0.4" stopColor="#1C2541" />
                <stop offset="0.7" stopColor="#1E3A8A" />
                <stop offset="1" stopColor="#0A1128" />
              </linearGradient>

              <linearGradient
                id="silverClipGrad"
                x1="20"
                y1="34"
                x2="24"
                y2="70"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#F8FAFC" />
                <stop offset="0.5" stopColor="#94A3B8" />
                <stop offset="1" stopColor="#CBD5E1" />
              </linearGradient>

              <linearGradient
                id="goldNibGrad"
                x1="17"
                y1="126"
                x2="27"
                y2="144"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FDE047" />
                <stop offset="0.5" stopColor="#EAB308" />
                <stop offset="1" stopColor="#CA8A04" />
              </linearGradient>
            </defs>
          </svg>
        </button>
      </div>
    </>
  );
}
