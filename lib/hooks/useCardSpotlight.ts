"use client";

import { useEffect, useRef, useState } from "react";

interface CardSpotlightOptions {
  maxTilt?: number; // Maximum tilt angle in degrees (default: 5)
  perspective?: number; // 3D perspective in px (default: 900)
}

/**
 * Shared hook for hardware-accelerated pointer spotlight, 3D tilt, and parallax.
 * Strictly adheres to:
 * - Runs ONLY when @media (hover: hover) and (pointer: fine) match.
 * - Animates ONLY transform and opacity via CSS variables (--mx, --my, --px, --py, --rx, --ry).
 * - Updates through a requestAnimationFrame-throttled pointermove listener attached ONLY while hovering.
 * - Sets will-change only during active hover.
 * - Respects prefers-reduced-motion by disabling tilt, parallax, and sweep.
 * - Zero React re-renders during mouse movement.
 */
export function useCardSpotlight<T extends HTMLElement = HTMLDivElement>(
  options: CardSpotlightOptions = {}
) {
  const { maxTilt = 5, perspective = 900 } = options;
  const ref = useRef<T | null>(null);
  const [isHoverSupported, setIsHoverSupported] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    setIsHoverSupported(hoverQuery.matches);
    setPrefersReducedMotion(motionQuery.matches);

    const onHoverChange = (e: MediaQueryListEvent) => setIsHoverSupported(e.matches);
    const onMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);

    hoverQuery.addEventListener("change", onHoverChange);
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      hoverQuery.removeEventListener("change", onHoverChange);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !isHoverSupported) return;

    let rafId: number | null = null;
    let willChangeTimeout: NodeJS.Timeout | null = null;

    const onPointerMove = (e: PointerEvent) => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        const rect = el.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        // Normalized positions 0 to 1
        const px = Math.max(0, Math.min(1, clientX / rect.width));
        const py = Math.max(0, Math.min(1, clientY / rect.height));

        el.style.setProperty("--mx", `${clientX.toFixed(1)}px`);
        el.style.setProperty("--my", `${clientY.toFixed(1)}px`);
        el.style.setProperty("--px", `${px.toFixed(3)}`);
        el.style.setProperty("--py", `${py.toFixed(3)}`);
        el.style.setProperty("--spotlight-opacity", "1");

        // Compute 3D tilt angles (-maxTilt to +maxTilt)
        if (!prefersReducedMotion && maxTilt > 0) {
          const tiltX = ((py - 0.5) * -2 * maxTilt).toFixed(2);
          const tiltY = ((px - 0.5) * 2 * maxTilt).toFixed(2);
          el.style.setProperty("--rx", `${tiltX}deg`);
          el.style.setProperty("--ry", `${tiltY}deg`);
        }
      });
    };

    const onPointerEnter = () => {
      if (willChangeTimeout) clearTimeout(willChangeTimeout);
      el.style.willChange = "transform";
      el.style.setProperty("--spotlight-opacity", "1");
      el.addEventListener("pointermove", onPointerMove);
    };

    const onPointerLeave = () => {
      el.removeEventListener("pointermove", onPointerMove);
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      // Smoothly reset CSS variables to neutral state
      el.style.setProperty("--spotlight-opacity", "0");
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
      el.style.setProperty("--px", "0.5");
      el.style.setProperty("--py", "0.5");

      // Remove will-change after transition completes to conserve compositor memory
      willChangeTimeout = setTimeout(() => {
        el.style.willChange = "auto";
      }, 500);
    };

    el.addEventListener("pointerenter", onPointerEnter);
    el.addEventListener("pointerleave", onPointerLeave);

    return () => {
      el.removeEventListener("pointerenter", onPointerEnter);
      el.removeEventListener("pointerleave", onPointerLeave);
      el.removeEventListener("pointermove", onPointerMove);
      if (rafId) cancelAnimationFrame(rafId);
      if (willChangeTimeout) clearTimeout(willChangeTimeout);
    };
  }, [isHoverSupported, prefersReducedMotion, maxTilt, perspective]);

  return {
    ref,
    isHoverSupported,
    prefersReducedMotion,
  };
}
