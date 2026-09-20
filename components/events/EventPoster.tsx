"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Sparkles, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventPosterProps {
  src?: string | null;
  alt: string;
  className?: string;
  aspectRatio?: "portrait" | "landscape" | "auto";
  priority?: boolean;
  interactive?: boolean;
}

export function EventPoster({
  src,
  alt,
  className,
  aspectRatio = "auto",
  priority = false,
  interactive = true,
}: EventPosterProps) {
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const hasValidSrc = Boolean(src && src.trim().length > 0 && !hasError);

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

  // Subtle 3D tilt calculations
  const rotateX = isHovered ? (mousePos.y - 0.5) * -8 : 0;
  const rotateY = isHovered ? (mousePos.x - 0.5) * 8 : 0;

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
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
        "relative rounded-2xl overflow-hidden bg-foundation-slate/40 border border-foundation-slate/80 group select-none",
        isHovered &&
          "shadow-[0_0_30px_rgba(56,189,248,0.2),0_12px_32px_rgba(8,10,15,0.7)] border-brand-cyan/40",
        className
      )}
    >
      {hasValidSrc ? (
        <>
          {/* Background Blurred Ambient Layer (for portrait posters) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <Image
              src={src!}
              alt=""
              aria-hidden="true"
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover blur-2xl scale-125 opacity-30 brightness-75"
            />
            <div className="absolute inset-0 bg-foundation-darkest/50 backdrop-blur-md" />
          </div>

          {/* Primary Foreground Image */}
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={src!}
              alt={alt}
              fill
              unoptimized
              priority={priority}
              onError={() => setHasError(true)}
              sizes="(max-width: 768px) 100vw, 50vw"
              className={cn(
                "transition-transform duration-500",
                aspectRatio === "portrait"
                  ? "object-contain p-2"
                  : aspectRatio === "landscape"
                  ? "object-cover"
                  : "object-cover sm:object-contain",
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
        /* Celestial Institutional Fallback Placeholder */
        <div className="relative w-full h-full min-h-[280px] sm:min-h-[340px] flex flex-col items-center justify-center p-8 bg-gradient-to-b from-foundation-slate/50 to-foundation-darkest overflow-hidden">
          {/* Constellation Grid Pattern */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(56, 189, 248, 0.4) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Center Celestial Icon */}
          <div className="relative z-10 w-16 h-16 rounded-2xl bg-foundation-dark border border-brand-cyan/30 flex items-center justify-center shadow-[0_0_25px_rgba(56,189,248,0.15)] mb-4">
            <Sparkles className="w-8 h-8 text-brand-cyan animate-pulse" />
          </div>

          {/* Text labels */}
          <div className="relative z-10 text-center space-y-1.5 max-w-[240px]">
            <span className="text-[10px] uppercase font-mono tracking-widest text-brand-cyan block">
              IEDC TKIET • OFFICIAL EVENT
            </span>
            <p className="font-display font-semibold text-sm text-typo-white line-clamp-2">
              {alt || "Event Poster"}
            </p>
            <span className="text-[11px] text-typo-gray flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3 text-typo-gray" />
              <span>Campus Showcase</span>
            </span>
          </div>

          {/* Edge Glow */}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-brand-cyan/40 to-transparent" />
        </div>
      )}
    </div>
  );
}
