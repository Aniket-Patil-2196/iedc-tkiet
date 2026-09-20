"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Sparkles, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventPosterProps {
  src?: string | null;
  alt: string;
  className?: string;
  posterWidth?: number | null;
  posterHeight?: number | null;
  maxHeight?: number | string;
  aspectRatio?: "portrait" | "landscape" | "auto";
  priority?: boolean;
  interactive?: boolean;
}

const MIN_RATIO = 3 / 4; // 0.75 (portrait clamp)
const MAX_RATIO = 16 / 9; // 1.7778 (landscape clamp)

export function EventPoster({
  src,
  alt,
  className,
  posterWidth,
  posterHeight,
  maxHeight,
  aspectRatio = "auto",
  priority = false,
  interactive = true,
}: EventPosterProps) {
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [measuredRatio, setMeasuredRatio] = useState<number | null>(null);

  const hasValidSrc = Boolean(src && src.trim().length > 0 && !hasError);

  // Compute real aspect ratio from pre-stored dimensions or onLoad measurement
  const rawRatio = useMemo(() => {
    if (aspectRatio === "portrait") return 4 / 5;
    if (aspectRatio === "landscape") return 16 / 9;
    if (posterWidth && posterHeight && posterWidth > 0 && posterHeight > 0) {
      return posterWidth / posterHeight;
    }
    return measuredRatio;
  }, [aspectRatio, posterWidth, posterHeight, measuredRatio]);

  // Default clean portrait (4:5) while measuring
  const effectiveRatio = rawRatio ?? (4 / 5);

  // Check if real ratio falls outside the 3:4 ... 16:9 clamp
  const isOutsideRange = effectiveRatio < MIN_RATIO || effectiveRatio > MAX_RATIO;
  const clampedRatio = Math.max(MIN_RATIO, Math.min(MAX_RATIO, effectiveRatio));

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (typeof window !== "undefined" && !window.matchMedia("(hover: hover)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => {
    if (!interactive) return;
    if (typeof window !== "undefined" && !window.matchMedia("(hover: hover)").matches) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setIsHovered(false);
      setMousePos({ x: 0.5, y: 0.5 });
    }
  };

  // 3D tilt calculations scoped to desktop hover
  const rotateX = isHovered ? (mousePos.y - 0.5) * -8 : 0;
  const rotateY = isHovered ? (mousePos.x - 0.5) * 8 : 0;

  const parsedMaxHeight =
    typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight;

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        aspectRatio: `${clampedRatio}`,
        maxHeight: parsedMaxHeight,
        transform: interactive
          ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${
              isHovered ? "translateY(-4px)" : "translateY(0)"
            }`
          : undefined,
        transition: isHovered
          ? "transform 0.15s ease-out, box-shadow 0.3s ease"
          : "transform 0.4s ease-out, box-shadow 0.4s ease",
      }}
      className={cn(
        "relative w-full rounded-2xl overflow-hidden bg-foundation-slate/40 border border-foundation-slate/80 group select-none flex items-center justify-center",
        isHovered &&
          "shadow-[0_0_30px_rgba(56,189,248,0.2),0_12px_32px_rgba(8,10,15,0.7)] border-brand-cyan/40",
        className
      )}
    >
      {hasValidSrc ? (
        <>
          {/* Blurred backdrop ONLY rendered when aspect ratio falls outside the 3:4 ... 16:9 clamp */}
          {isOutsideRange && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <Image
                src={src!}
                alt=""
                aria-hidden="true"
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover blur-2xl scale-125 opacity-35 brightness-75"
              />
              <div className="absolute inset-0 bg-foundation-darkest/50 backdrop-blur-md" />
            </div>
          )}

          {/* Primary Foreground Image */}
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={src!}
              alt={alt}
              fill
              unoptimized
              priority={priority}
              onError={() => setHasError(true)}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  const ratio = img.naturalWidth / img.naturalHeight;
                  if (Math.abs(ratio - (rawRatio ?? 0)) > 0.02) {
                    setMeasuredRatio(ratio);
                  }
                }
              }}
              sizes="(max-width: 768px) 100vw, 50vw"
              className={cn(
                "transition-transform duration-500",
                isOutsideRange ? "object-contain p-2" : "object-cover",
                isHovered && "scale-[1.02]"
              )}
            />
          </div>

          {/* Dynamic Light Sheen on Hover */}
          {interactive && (
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                opacity: isHovered ? 0.25 : 0,
                background: `radial-gradient(circle at ${mousePos.x * 100}% ${
                  mousePos.y * 100
                }%, rgba(56, 189, 248, 0.45) 0%, transparent 60%)`,
              }}
            />
          )}
        </>
      ) : (
        /* Fallback Placeholder */
        <div className="relative w-full h-full min-h-[220px] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-foundation-slate/50 to-foundation-darkest overflow-hidden">
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(56, 189, 248, 0.4) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10 w-12 h-12 rounded-xl bg-foundation-dark border border-brand-cyan/30 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.15)] mb-3">
            <Sparkles className="w-6 h-6 text-brand-cyan" />
          </div>

          <div className="relative z-10 text-center space-y-1 max-w-[200px]">
            <span className="text-[10px] uppercase font-mono tracking-widest text-brand-cyan block">
              IEDC TKIET
            </span>
            <p className="font-display font-semibold text-xs text-typo-white line-clamp-2">
              {alt || "Event Poster"}
            </p>
            <span className="text-[10px] text-typo-gray flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3 text-typo-gray" />
              <span>Campus Event</span>
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-brand-cyan/40 to-transparent" />
        </div>
      )}
    </div>
  );
}
