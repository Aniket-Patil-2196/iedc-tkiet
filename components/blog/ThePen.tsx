"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ThePenProps {
  isOpen: boolean;
  containerWidth: number;
  pageWidth: number;
}

export function ThePen({
  isOpen,
  containerWidth,
  pageWidth,
}: ThePenProps) {
  // Retractable click pen state (toggle state, plunger bounce)
  const [isRetracted, setIsRetracted] = useState(false);
  const [isPlungerDown, setIsPlungerDown] = useState(false);
  const [isHoveredProximity, setIsHoveredProximity] = useState(false);
  const [offsets, setOffsets] = useState({ x: 0, y: 0, rot: 0 });

  const penRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number | null>(null);

  // Free margin calculation:
  // Closed book: single front cover centered (width = pageWidth)
  // Open book: two-page spread centered (width = pageWidth * 2)
  const bookWidth = isOpen ? pageWidth * 2 : pageWidth;
  const freeMargin = (containerWidth - bookWidth) / 2;

  // Visibility constraints (Step 4.9):
  // 1. Desktop & larger displays only (>= 1100px wide; hidden below that)
  // 2. Hide pen and note if less than 150px of margin is free
  const isVisible = containerWidth >= 1100 && freeMargin >= 150;

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
          const tilt = (dx > 0 ? 4 : -4) * factor;

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
  }, [isVisible]);

  // Retractable click action (Step 4.10 & 4.11: Does NOT open the book)
  const handleClickPen = useCallback(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setIsRetracted((prev) => !prev);
      return;
    }

    // Plunger sinks ~3px and springs back, nib slides out or back in ~14px over 250ms
    setIsPlungerDown(true);
    setTimeout(() => {
      setIsPlungerDown(false);
      setIsRetracted((prev) => !prev);
    }, 150);
  }, []);

  // Separate "Leave a remark" action (Step 4.11)
  const handleLeaveRemark = useCallback(() => {
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
  }, []);

  if (!isVisible) return null;

  // Margin placement with exact 24px gap from the book edge:
  // Container is centered. Book right edge is at 50% + bookWidth / 2.
  // We place the pen overlay at 50% + (bookWidth / 2) + 24px.
  const penLeftOffset = `calc(50% + ${Math.round(bookWidth / 2 + 24)}px)`;

  return (
    <div
      aria-hidden="false"
      style={{ left: penLeftOffset }}
      className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none select-none flex flex-col items-center"
    >
      {!isOpen ? (
        // CLOSED STATE: Handwritten note "Click the pen" + Retractable Click Fountain Pen
        <>
          <div
            className={cn(
              "flex flex-col items-center mb-3 transition-opacity duration-300 pointer-events-none",
              isHoveredProximity ? "opacity-100" : "opacity-85"
            )}
          >
            <span className="font-book-handwriting font-bold text-brand-cyan drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] tracking-wide text-[clamp(20px,1.6vw,26px)] leading-none">
              Click the pen
            </span>

            {/* Curved SVG Arrow pointing to top plunger */}
            <svg
              width="36"
              height="28"
              viewBox="0 0 36 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mt-1 text-brand-cyan/80 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
            >
              <path
                d="M6 4 C14 2, 26 8, 28 20"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="40"
                strokeDashoffset="0"
              />
              <path
                d="M23 16 L28 21 L32 15"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Retractable Click Pen Button (Hit area: pointer-events-auto) */}
          <button
            ref={penRef}
            type="button"
            onClick={handleClickPen}
            aria-label="Click the pen"
            title="Click the pen"
            style={{
              transform: `translate3d(${offsets.x}px, ${offsets.y}px, 0) rotate(${
                -20 + offsets.rot
              }deg)`,
              transition: "filter 0.2s ease, transform 0.12s ease-out",
            }}
            className={cn(
              "group relative p-2 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan cursor-pointer pointer-events-auto",
              isHoveredProximity && "brightness-110"
            )}
          >
            {/* SVG Retractable Fountain Pen (Length: clamp(220px, 18vw, 320px)) */}
            <svg
              viewBox="0 0 54 260"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                height: "clamp(220px, 18vw, 320px)",
                width: "auto",
              }}
              className={cn(
                "drop-shadow-[0_12px_22px_rgba(0,0,0,0.7)] transition-all duration-300",
                isHoveredProximity &&
                  "drop-shadow-[0_0_16px_rgba(56,189,248,0.55)]"
              )}
            >
              {/* Top Plunger / Click Mechanism (Sinks 3px when clicked) */}
              <g
                style={{
                  transform: isPlungerDown ? "translateY(3px)" : "translateY(0px)",
                  transition: "transform 0.12s ease-in-out",
                }}
              >
                <rect
                  x="22"
                  y="6"
                  width="10"
                  height="12"
                  rx="2"
                  fill="url(#penSilverGrad)"
                  stroke="#0F172A"
                  strokeWidth="0.8"
                />
                <line x1="24" y1="9" x2="30" y2="9" stroke="#64748B" strokeWidth="0.8" />
                <line x1="24" y1="12" x2="30" y2="12" stroke="#64748B" strokeWidth="0.8" />
              </g>

              {/* Cap Finial / Collar */}
              <rect
                x="20"
                y="16"
                width="14"
                height="8"
                rx="2"
                fill="#1E293B"
                stroke="#38BDF8"
                strokeWidth="0.8"
              />

              {/* Pen Barrel / Body (Deep navy lacquer) */}
              <rect
                x="17"
                y="24"
                width="20"
                height="136"
                rx="5"
                fill="url(#penNavyGrad)"
                stroke="#0F172A"
                strokeWidth="1"
              />

              {/* Trim Bands (Silver & Cyan Accent Rings) */}
              <rect x="16.5" y="60" width="21" height="4" rx="1" fill="#38BDF8" />
              <rect x="16.5" y="66" width="21" height="2" fill="#E2E8F0" />
              <rect x="16.5" y="148" width="21" height="3" rx="1" fill="#E2E8F0" />

              {/* Silver Clip */}
              <path
                d="M24 26 L24 88 C24 92, 30 92, 30 88 L30 26 Z"
                fill="url(#penSilverGrad)"
                stroke="#0F172A"
                strokeWidth="0.6"
              />
              <circle cx="27" cy="88" r="2.5" fill="#38BDF8" />

              {/* Section / Grip */}
              <path
                d="M18 160 L21 190 L33 190 L36 160 Z"
                fill="#0F172A"
                stroke="#38BDF8"
                strokeWidth="0.9"
              />

              {/* Retractable Nib Group: Slides out or back in ~14px over 250ms */}
              <g
                style={{
                  transform: isRetracted ? "translateY(-14px)" : "translateY(0px)",
                  opacity: isRetracted ? 0.35 : 1,
                  transition: "transform 250ms ease-in-out, opacity 250ms ease-in-out",
                }}
              >
                {/* Gold / Silver Nib */}
                <path
                  d="M21 190 L27 226 L33 190 Z"
                  fill="url(#penGoldGrad)"
                  stroke="#D4AF37"
                  strokeWidth="0.8"
                />

                {/* Nib Slit & Breather Hole */}
                <line
                  x1="27"
                  y1="196"
                  x2="27"
                  y2="226"
                  stroke="#0F172A"
                  strokeWidth="0.85"
                />
                <circle cx="27" cy="200" r="1.2" fill="#0F172A" />

                {/* Nib Tip Glow */}
                <circle
                  cx="27"
                  cy="226"
                  r="2"
                  className={cn(
                    "transition-all duration-300",
                    isHoveredProximity
                      ? "fill-brand-cyan filter drop-shadow(0 0 6px #38BDF8)"
                      : "fill-[#F8FAFC]"
                  )}
                />
              </g>

              {/* Gradients */}
              <defs>
                <linearGradient
                  id="penNavyGrad"
                  x1="17"
                  y1="24"
                  x2="37"
                  y2="160"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#0B132B" />
                  <stop offset="0.35" stopColor="#1C2541" />
                  <stop offset="0.7" stopColor="#1E3A8A" />
                  <stop offset="1" stopColor="#0A1128" />
                </linearGradient>

                <linearGradient
                  id="penSilverGrad"
                  x1="20"
                  y1="10"
                  x2="34"
                  y2="90"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#FFFFFF" />
                  <stop offset="0.5" stopColor="#94A3B8" />
                  <stop offset="1" stopColor="#CBD5E1" />
                </linearGradient>

                <linearGradient
                  id="penGoldGrad"
                  x1="21"
                  y1="190"
                  x2="33"
                  y2="226"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#FDE047" />
                  <stop offset="0.45" stopColor="#EAB308" />
                  <stop offset="1" stopColor="#B45309" />
                </linearGradient>
              </defs>
            </svg>
          </button>
        </>
      ) : (
        // OPEN STATE: Separate small handwritten button "Leave a remark" (Step 4.11)
        <div className="flex flex-col items-center pointer-events-auto">
          <button
            type="button"
            onClick={handleLeaveRemark}
            aria-label="Leave a remark"
            className="group flex flex-col items-center p-3 rounded-2xl bg-foundation-dark/60 hover:bg-foundation-dark/90 border border-slate-700/80 hover:border-brand-cyan/60 shadow-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
          >
            <span className="font-book-handwriting font-bold text-brand-cyan drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] tracking-wide text-[clamp(20px,1.6vw,26px)] leading-tight group-hover:scale-105 transition-transform">
              Leave a remark
            </span>

            {/* Curved SVG Arrow pointing downward to remarks */}
            <svg
              width="36"
              height="36"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mt-1.5 text-brand-cyan/80 group-hover:translate-y-1 transition-transform"
            >
              <path
                d="M18 4 C24 10, 24 20, 18 28"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M13 23 L18 29 L23 23"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
