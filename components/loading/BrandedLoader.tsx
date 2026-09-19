"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export function BrandedLoader() {
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<SVGGElement>(null);
  const letterIRef = useRef<SVGGElement>(null);
  const letterERef = useRef<SVGGElement>(null);
  const letterDRef = useRef<SVGGElement>(null);
  const letterCRef = useRef<SVGGElement>(null);
  const textGroupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Session check: Only show on initial session landing
    const hasViewed = sessionStorage.getItem("iedc_intro_viewed");
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (hasViewed || prefersReducedMotion) {
      setIsVisible(false);
      return;
    }

    // Safety fallback timer: guarantee unblocking within 2.2s max
    const safetyTimer = setTimeout(() => {
      finishLoading();
    }, 2200);

    const finishLoading = () => {
      sessionStorage.setItem("iedc_intro_viewed", "true");
      if (containerRef.current) {
        gsap.to(containerRef.current, {
          opacity: 0,
          scale: 1.02,
          duration: 0.45,
          ease: "power2.inOut",
          onComplete: () => {
            setIsVisible(false);
          },
        });
      } else {
        setIsVisible(false);
      }
    };

    // 2. GSAP timeline construction
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: finishLoading,
      });

      // Initial state setup
      gsap.set(ringsRef.current?.children || [], {
        strokeDasharray: 800,
        strokeDashoffset: 800,
        opacity: 0.1,
      });

      gsap.set([letterIRef.current, letterERef.current, letterDRef.current, letterCRef.current], {
        opacity: 0,
        y: 12,
      });

      gsap.set(textGroupRef.current, {
        opacity: 0,
        y: 8,
      });

      // Step 1: Subtle guide rings draw in (0.3s)
      tl.to(ringsRef.current?.children || [], {
        strokeDashoffset: 0,
        opacity: 0.6,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
      })
        // Step 2: "iEDC" geometric elements assemble with stagger (0.5s)
        .to(
          [letterIRef.current, letterERef.current, letterDRef.current, letterCRef.current],
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.07,
            ease: "back.out(1.2)",
          },
          "-=0.25"
        )
        // Step 3: Institutional text lockup softly reveals (0.35s)
        .to(
          textGroupRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.35,
            ease: "power2.out",
          },
          "-=0.15"
        )
        // Brief moment of clarity (0.3s pause before dissolve)
        .to({}, { duration: 0.3 });
    }, containerRef);

    return () => {
      clearTimeout(safetyTimer);
      ctx.revert();
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      role="status"
      aria-label="Initializing IEDC Platform"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-foundation-darkest overflow-hidden select-none"
    >
      {/* Background subtle radial ambient sheen */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-brand-blue/5 blur-[100px] pointer-events-none" />

      <div className="relative flex flex-col items-center justify-center">
        {/* SVG geometric construction */}
        <svg
          viewBox="0 0 400 400"
          className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="iedc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#93C5FD" />
            </linearGradient>
            <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Concentric Guide Rings */}
          <g ref={ringsRef}>
            <circle
              cx="200"
              cy="200"
              r="180"
              stroke="#151B26"
              strokeWidth="2"
              strokeDasharray="1130"
              strokeDashoffset="1130"
            />
            <circle
              cx="200"
              cy="200"
              r="165"
              stroke="#2563EB"
              strokeWidth="1.5"
              strokeOpacity="0.4"
              strokeDasharray="1036"
              strokeDashoffset="1036"
            />
            <circle
              cx="200"
              cy="200"
              r="150"
              stroke="#38BDF8"
              strokeWidth="1"
              strokeOpacity="0.2"
              strokeDasharray="942"
              strokeDashoffset="942"
            />
          </g>

          {/* Central Stylized "iEDC" Mark */}
          {/* 1. "i": Square dot + vertical block */}
          <g ref={letterIRef} fill="url(#iedc-grad)">
            <rect x="90" y="150" width="18" height="18" rx="2" />
            <rect x="90" y="180" width="18" height="70" rx="2" />
          </g>

          {/* 2. "E": Stylized geometric E with central bracket */}
          <g ref={letterERef} fill="url(#iedc-grad)">
            <path
              d="M125 150 H180 V174 H145 V188 H172 V212 H145 V226 H180 V250 H125 V150 Z"
              fillRule="evenodd"
            />
          </g>

          {/* 3. "D": Geometric curved rectangle */}
          <g ref={letterDRef} fill="url(#iedc-grad)">
            <path
              d="M195 150 H240 C258 150 268 160 268 178 V222 C268 240 258 250 240 250 H195 V150 Z M215 174 V226 H236 C245 226 248 222 248 214 V186 C248 178 245 174 236 174 H215 Z"
              fillRule="evenodd"
            />
          </g>

          {/* 4. "C": Open geometric bracket */}
          <g ref={letterCRef} fill="url(#iedc-grad)">
            <path
              d="M282 150 H335 V174 H302 V226 H335 V250 H282 V150 Z"
              fillRule="evenodd"
            />
          </g>
        </svg>

        {/* Institutional Identity Typography */}
        <div
          ref={textGroupRef}
          className="text-center mt-6 space-y-1.5 px-4"
        >
          <div className="font-display text-sm sm:text-base font-bold tracking-[0.2em] text-typo-white uppercase">
            IEDC TKIET
          </div>
          <div className="font-sans text-[11px] sm:text-xs text-typo-gray tracking-wider">
            Innovation & Entrepreneurship Development Cell
          </div>
        </div>
      </div>
    </div>
  );
}
