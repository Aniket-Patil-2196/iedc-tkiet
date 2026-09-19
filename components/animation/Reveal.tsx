"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "fade-up" | "fade-in" | "slide-left" | "slide-right";
  delayMs?: number;
  durationMs?: number;
  threshold?: number;
  as?: React.ElementType;
}

export function Reveal({
  children,
  className,
  variant = "fade-up",
  delayMs = 0,
  durationMs = 500,
  threshold = 0.15,
  as: Component = "div",
  ...props
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    // Respect reduced motion preference immediately
    if (typeof window !== "undefined") {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (prefersReduced) {
        setIsRevealed(true);
        return;
      }
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsRevealed(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const variantStyles = {
    "fade-up": isRevealed
      ? "opacity-100 translate-y-0"
      : "opacity-0 translate-y-6 pointer-events-none",
    "fade-in": isRevealed
      ? "opacity-100"
      : "opacity-0 pointer-events-none",
    "slide-left": isRevealed
      ? "opacity-100 translate-x-0"
      : "opacity-0 -translate-x-8 pointer-events-none",
    "slide-right": isRevealed
      ? "opacity-100 translate-x-0"
      : "opacity-0 translate-x-8 pointer-events-none",
  };

  return (
    <Component
      ref={ref}
      style={{
        transitionDuration: `${durationMs}ms`,
        transitionDelay: `${delayMs}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className={cn(
        "transition-all will-change-transform",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
