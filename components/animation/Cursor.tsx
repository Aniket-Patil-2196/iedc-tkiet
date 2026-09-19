"use client";

import React, { useEffect, useRef, useState } from "react";

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Strictly enable on desktop pointer devices with fine control
    if (typeof window === "undefined") return;
    const isTouch =
      window.matchMedia("(pointer: coarse)").matches ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;

    if (isTouch) return;

    setIsEnabled(true);

    let mouseX = -200;
    let mouseY = -200;
    let ringX = -200;
    let ringY = -200;
    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) setIsVisible(true);

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }

      // Check if hovering over interactive elements or elements with data-cursor
      const target = e.target as HTMLElement | null;
      if (
        target?.closest(
          "a, button, [role='button'], input, textarea, select, [data-cursor='pointer'], [data-cursor='hover']"
        )
      ) {
        setIsPointer(true);
      } else {
        setIsPointer(false);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Smooth trailing physics loop for the circular halo
    const render = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  if (!isEnabled) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[999] transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      {/* Precision inner center dot */}
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 -ml-1 -mt-1 w-2 h-2 rounded-full transition-transform duration-150 will-change-transform ${
          isPointer ? "bg-brand-cyan scale-125 shadow-[0_0_8px_#38BDF8]" : "bg-typo-white"
        }`}
      />

      {/* Signature Circular Halo (72px diameter, pure stroke & light glow, ZERO backdrop-blur) */}
      <div
        ref={ringRef}
        className={`fixed top-0 left-0 -ml-9 -mt-9 w-[72px] h-[72px] rounded-full border transition-all duration-300 ease-out will-change-transform ${
          isPointer
            ? "border-brand-cyan scale-[1.3] bg-brand-cyan/[0.06] shadow-[0_0_20px_rgba(56,189,248,0.2)]"
            : "border-brand-cyan/35 scale-100 bg-transparent"
        }`}
      />
    </div>
  );
}
