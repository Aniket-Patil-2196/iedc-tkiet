"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Reveal } from "@/components/animation/Reveal";

// Dynamically import the WebGL Canvas with ssr: false
const InnovationFieldCanvas = dynamic(
  () => import("./InnovationFieldCanvas"),
  {
    ssr: false,
    loading: () => <HeroFallbackField />,
  }
);

/**
 * Graceful SVG/CSS WebGL fallback field.
 */
function HeroFallbackField() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden opacity-40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,#172554_0%,transparent_65%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#151B26_1px,transparent_1px),linear-gradient(to_bottom,#151B26_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_60%_45%,#000_70%,transparent_100%)]" />
    </div>
  );
}

export function Hero() {
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  const scrollToAbout = () => {
    const el = document.getElementById("about-intro");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full -mt-16 md:-mt-20 pt-16 md:pt-20 h-screen min-h-[600px] max-h-[1100px] flex flex-col justify-center overflow-hidden bg-foundation-darkest select-none">
      {/* 1. Interactive 3D Terrain Layer */}
      {hasWebGL ? <InnovationFieldCanvas /> : <HeroFallbackField />}

      {/* 2. Ambient Blueprint / Coordinate Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#151B26_1px,transparent_1px),linear-gradient(to_bottom,#151B26_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-20 pointer-events-none z-[1]" />

      {/* 3. Subtle Radial Depth Shading to preserve optimal contrast behind typography while keeping stars visible */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_20%_50%,rgba(8,10,15,0.40)_20%,rgba(8,10,15,0.15)_65%,transparent_100%)] pointer-events-none z-[2]" />
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-foundation-darkest via-foundation-darkest/60 to-transparent pointer-events-none z-[2]" />

      {/* Right vertical metadata marker (Desktop only) */}
      <div className="hidden xl:flex absolute right-8 top-1/2 -translate-y-1/2 z-10 [writing-mode:vertical-lr] items-center gap-3 text-[10px] font-sans uppercase tracking-[0.3em] text-typo-gray/40 pointer-events-none select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan/60" />
        <span>IDEAS / PEOPLE / IMPACT</span>
      </div>

      {/* 4. Core Hero Content: Massive Editorial Typography with responsive clamp */}
      <div className="relative z-10 w-full px-6 sm:px-10 md:px-14 lg:px-16 max-w-7xl mx-auto my-auto flex flex-col justify-center">
        <div className="flex flex-col space-y-1 sm:space-y-1.5 max-w-full">
          {/* Line 1: IDEATE. */}
          <Reveal variant="fade-up" delayMs={50}>
            <h1 className="font-display font-black tracking-[-0.03em] uppercase leading-[0.88] whitespace-nowrap text-[clamp(2.25rem,6.8vw,5.65rem)] 2xl:text-[6.25rem] text-transparent bg-clip-text bg-gradient-to-r from-[#FFFFFF] via-[#F8FAFC] to-[#CBD5E1] drop-shadow-[0_4px_25px_rgba(255,255,255,0.06)]">
              IDEATE.
            </h1>
          </Reveal>

          {/* Line 2: INNOVATE. */}
          <Reveal variant="fade-up" delayMs={150}>
            <h2 className="font-display font-black tracking-[-0.03em] uppercase leading-[0.88] whitespace-nowrap text-[clamp(2.25rem,6.8vw,5.65rem)] 2xl:text-[6.25rem] text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan via-[#2DD4BF] to-[#34D399] drop-shadow-[0_4px_30px_rgba(56,189,248,0.18)]">
              INNOVATE.
            </h2>
          </Reveal>

          {/* Line 3: IGNITE. */}
          <Reveal variant="fade-up" delayMs={250}>
            <h2 className="font-display font-black tracking-[-0.03em] uppercase leading-[0.88] whitespace-nowrap text-[clamp(2.25rem,6.8vw,5.65rem)] 2xl:text-[6.25rem] text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-brand-cyan to-sky-300 drop-shadow-[0_4px_30px_rgba(37,99,235,0.18)]">
              IGNITE.
            </h2>
          </Reveal>
        </div>
      </div>

      {/* 5. Bottom Framing Elements & Centered Scroll Indicator */}
      <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-10 lg:left-14 z-20 flex items-center gap-2 text-typo-gray/70 select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
        <span className="tracking-[0.18em] uppercase text-[10px] sm:text-[11px] font-medium text-typo-gray/80">
          TKIET WARANANAGAR
        </span>
      </div>

      {/* Bottom-center: Compact Scroll indicator positioned relative to hero */}
      <button
        onClick={scrollToAbout}
        data-cursor="pointer"
        aria-label="Scroll to introduction"
        className="absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 group cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none"
      >
        <div className="w-4 h-7 sm:w-4.5 sm:h-7.5 rounded-full border border-typo-white/25 bg-foundation-darkest/60 flex items-start justify-center p-1 group-hover:border-brand-cyan/60 transition-colors">
          <span className="w-1 h-1.5 rounded-full bg-brand-cyan animate-scroll-dot" />
        </div>
        <span className="text-[9px] uppercase font-sans tracking-[0.25em] text-typo-gray/50 group-hover:text-brand-cyan transition-colors">
          SCROLL
        </span>
      </button>

      {/* Bottom-right: Vision marker */}
      <div className="absolute bottom-6 sm:bottom-8 right-6 sm:right-10 lg:right-14 z-20 hidden md:flex items-center text-right select-none">
        <span className="tracking-[0.18em] uppercase text-[10px] sm:text-[11px] font-medium text-typo-gray/60">
          INNOVATION FOR A BETTER TOMORROW
        </span>
      </div>
    </section>
  );
}
