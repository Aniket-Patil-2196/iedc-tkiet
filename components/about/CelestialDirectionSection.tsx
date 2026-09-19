"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/animation/Reveal";
import { Compass, Sparkles, Crosshair } from "lucide-react";

interface CelestialDirectionSectionProps {
  vision: string;
  mission: string;
}

/**
 * Observatory Celestial Star Field Canvas:
 * - Technical astronomical coordinate grid and subtle constellation lines
 * - Gentle twinkling stars on #080A0F dark sky
 * - Very subtle parallax response to cursor (subtle coordinates, no giant black hole)
 * - Pauses via IntersectionObserver when off-screen; respects prefers-reduced-motion
 */
function ObservatoryFieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isVisibleRef = useRef<boolean>(true);
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });
  const lerpRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting && !prefersReducedMotion) {
          animId = requestAnimationFrame(render);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    // Generate fixed celestial stars
    const stars: {
      xRatio: number;
      yRatio: number;
      radius: number;
      baseAlpha: number;
      twinkleSpeed: number;
      phase: number;
      color: string;
    }[] = [];

    const starCount = 55;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        xRatio: Math.random(),
        yRatio: Math.random(),
        radius: Math.random() * 1.2 + 0.5,
        baseAlpha: Math.random() * 0.45 + 0.2,
        twinkleSpeed: Math.random() * 0.002 + 0.001,
        phase: Math.random() * Math.PI * 2,
        color: i % 4 === 0 ? "#38BDF8" : i % 7 === 0 ? "#60A5FA" : "#E2E8F0",
      });
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    canvas.addEventListener("pointerleave", handlePointerLeave);

    const render = (time: number) => {
      if (!isVisibleRef.current || width === 0 || height === 0) return;

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse parallax offset (-12px to +12px)
      if (pointerRef.current.active) {
        const targetX = ((pointerRef.current.x / width) - 0.5) * 22;
        const targetY = ((pointerRef.current.y / height) - 0.5) * 16;
        lerpRef.current.x += (targetX - lerpRef.current.x) * 0.06;
        lerpRef.current.y += (targetY - lerpRef.current.y) * 0.06;
      } else {
        lerpRef.current.x += (0 - lerpRef.current.x) * 0.03;
        lerpRef.current.y += (0 - lerpRef.current.y) * 0.03;
      }

      const pOffsetX = lerpRef.current.x;
      const pOffsetY = lerpRef.current.y;

      // 1. Draw subtle astronomical coordinate arcs
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = "rgba(30, 41, 59, 0.28)";

      // Arc 1 (Observatory horizon circle)
      ctx.beginPath();
      ctx.arc(width * 0.75 + pOffsetX * 0.4, height * 0.5 + pOffsetY * 0.4, Math.min(width, height) * 0.38, 0, Math.PI * 2);
      ctx.stroke();

      // Arc 2 (Declination dashed ring)
      ctx.beginPath();
      ctx.setLineDash([4, 8]);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
      ctx.arc(width * 0.75 + pOffsetX * 0.4, height * 0.5 + pOffsetY * 0.4, Math.min(width, height) * 0.24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Draw stars with gentle twinkle and subtle parallax
      for (const s of stars) {
        const sx = s.xRatio * width + pOffsetX * (s.radius * 0.8);
        const sy = s.yRatio * height + pOffsetY * (s.radius * 0.8);
        const twinkle = Math.sin(time * s.twinkleSpeed + s.phase) * 0.25;
        const alpha = Math.max(0.1, Math.min(1, s.baseAlpha + twinkle));

        ctx.beginPath();
        ctx.arc(sx, sy, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color === "#38BDF8"
          ? `rgba(56, 189, 248, ${alpha})`
          : s.color === "#60A5FA"
          ? `rgba(96, 165, 250, ${alpha})`
          : `rgba(226, 232, 240, ${alpha})`;
        ctx.fill();

        // Extra delicate radial sparkle on brighter stars
        if (s.baseAlpha > 0.5 && alpha > 0.6) {
          ctx.beginPath();
          ctx.arc(sx, sy, s.radius * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.2})`;
          ctx.fill();
        }
      }

      if (!prefersReducedMotion && isVisibleRef.current) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0"
    />
  );
}

/**
 * Interactive Observatory Telescope:
 * - Sophisticated scientific observatory instrument crafted in precision SVG
 * - Diagonally angled (26 degrees upward) pointing toward the target horizon star
 * - Smooth cursor tracking (rotation +/- 7 deg, tilt +/- 5 deg) with fluid inertia
 * - Optical lens with glass reflection and subtle glow that expands on hover
 * - Interactive target star in line-of-sight with radar reticle ring
 * - Click toggle switches between: "FUTURE" -> "VISION" -> "MISSION"
 * - Respects prefers-reduced-motion
 */
function InteractiveTelescope() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [angles, setAngles] = useState({ rot: 0, tilt: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [modeIndex, setModeIndex] = useState(0);

  const observationModes = [
    { title: "HORIZON // FUTURE", coord: "RA 19h 50m / DEC +08° 52′", targetLabel: "POLARIS • 2030" },
    { title: "SPECTRUM // VISION", coord: "RA 20h 14m / DEC +14° 19′", targetLabel: "INNOVATION • CORE" },
    { title: "VECTOR // MISSION", coord: "RA 21h 06m / DEC +21° 04′", targetLabel: "VENTURE • LAUNCH" },
  ];

  const currentMode = observationModes[modeIndex];

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Constrained rotation: +/- 7 deg, tilt: +/- 5 deg
    setAngles({
      rot: (x / (rect.width / 2)) * 7,
      tilt: -(y / (rect.height / 2)) * 5,
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setAngles({ rot: 0, tilt: 0 });
    setIsHovered(false);
  }, []);

  const cycleMode = useCallback(() => {
    setModeIndex((prev) => (prev + 1) % observationModes.length);
  }, [observationModes.length]);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={handlePointerLeave}
      onClick={cycleMode}
      className="relative w-full max-w-[420px] aspect-square flex flex-col items-center justify-center select-none cursor-pointer group"
      role="button"
      aria-label="Interactive Observatory Telescope: click to toggle observation vector"
      tabIndex={0}
    >
      {/* 1. Observation Status Readout Pill */}
      <div className="absolute top-2 right-4 sm:right-6 z-20 pointer-events-none transition-transform duration-300 group-hover:scale-105">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0D121F]/90 border border-slate-700/80 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-ping" />
          <span className="font-mono text-[10px] tracking-widest text-slate-300 font-semibold uppercase">
            {currentMode.title}
          </span>
        </div>
      </div>

      {/* 2. Target Star In View Direction (Upper-Right) */}
      <div
        style={{
          transform: `translate(${angles.rot * 1.5}px, ${angles.tilt * 1.5}px)`,
          transition: isHovered ? "transform 0.12s ease-out" : "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
        className="absolute top-10 right-12 sm:top-14 sm:right-16 pointer-events-none z-10 flex flex-col items-center"
      >
        {/* Reticle / Radar concentric rings */}
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border border-brand-cyan/40 border-dashed animate-[spin_40s_linear_infinite]" />
          <div className="absolute w-7 h-7 rounded-full border border-brand-blue/50" />
          
          {/* Target Star Center */}
          <div className="absolute w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_14px_#38BDF8] animate-pulse" />
          
          {/* Crosshair marks */}
          <span className="absolute -top-1 w-0.5 h-1.5 bg-brand-cyan/70" />
          <span className="absolute -bottom-1 w-0.5 h-1.5 bg-brand-cyan/70" />
          <span className="absolute -left-1 w-1.5 h-0.5 bg-brand-cyan/70" />
          <span className="absolute -right-1 w-1.5 h-0.5 bg-brand-cyan/70" />
        </div>
        <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-brand-cyan/80">
          {currentMode.targetLabel}
        </span>
      </div>

      {/* 3. Soft Ambient Radial Illumination behind telescope */}
      <div
        className={`absolute inset-10 rounded-full bg-gradient-to-tr from-brand-blue/15 via-brand-cyan/15 to-transparent blur-3xl pointer-events-none transition-all duration-500 ${
          isHovered ? "opacity-90 scale-110" : "opacity-45 scale-100"
        }`}
      />

      {/* 4. Precision SVG Observatory Telescope Instrument */}
      <div
        style={{
          transform: `perspective(1000px) rotate(${angles.rot * 0.7}deg) rotateX(${angles.tilt}deg)`,
          transition: isHovered
            ? "transform 0.12s ease-out"
            : "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
        className="relative w-72 h-72 sm:w-80 sm:h-80 transition-all duration-300 group-hover:scale-105"
      >
        <svg
          viewBox="0 0 320 320"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Dark metallic barrel gradients */}
            <linearGradient id="tube-body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="35%" stopColor="#0F172A" />
              <stop offset="70%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0B0F19" />
            </linearGradient>

            <linearGradient id="metal-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="50%" stopColor="#64748B" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            <linearGradient id="lens-glass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#2563EB" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.9" />
            </linearGradient>

            <radialGradient id="lens-glow-radial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#2563EB" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#080A0F" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* OBSERVATORY TRIPOD / MOUNTING PILLAR */}
          {/* Base Mount Plate */}
          <ellipse cx="140" cy="275" rx="34" ry="9" fill="#0B0F17" stroke="#1E293B" strokeWidth="1.5" />
          {/* Central Mounting Pillar */}
          <path d="M133 275 L135 185 L145 185 L147 275 Z" fill="#0F172A" stroke="#1E293B" strokeWidth="1.5" />
          {/* Tripod Legs (Industrial Stiffeners) */}
          <path d="M135 220 L80 295 M145 220 L200 295" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M137 255 L105 295 M143 255 L175 295" stroke="#334155" strokeWidth="1" strokeLinecap="round" />

          {/* EQUATORIAL FORK HEAD / ALT-AZIMUTH CRADLE */}
          {/* Azimuth Setting Circle */}
          <circle cx="140" cy="180" r="14" fill="#0F172A" stroke="#334155" strokeWidth="2" />
          <circle cx="140" cy="180" r="6" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.2" />
          {/* Declination Arm */}
          <path d="M140 180 L155 145" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
          <circle cx="155" cy="145" r="9" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
          
          {/* Counterweight Bar & Weight */}
          <path d="M155 145 L135 185" stroke="#334155" strokeWidth="3" />
          <rect x="128" y="175" width="14" height="10" rx="2" fill="#1E293B" stroke="#475569" strokeWidth="1" />

          {/* TELESCOPE TUBE ASSEMBLY (Rotated ~26 degrees pointing toward upper right) */}
          <g transform="rotate(-26, 155, 145)">
            {/* Eyepiece Holder & Diagonal Prism (Rear/Lower-Left) */}
            <rect x="80" y="140" width="22" height="10" rx="1.5" fill="#0F172A" stroke="#334155" strokeWidth="1.2" />
            <circle cx="76" cy="145" r="4.5" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.2" />
            {/* Rubber Eyeguard */}
            <path d="M72 142 C 70 145, 70 145, 72 148" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />

            {/* Rear Focuser Knobs */}
            <circle cx="98" cy="136" r="3.5" fill="#334155" stroke="#64748B" strokeWidth="1" />
            <circle cx="98" cy="154" r="3.5" fill="#334155" stroke="#64748B" strokeWidth="1" />

            {/* Main Optical Tube Body */}
            <path
              d="M100 137 L210 133 L210 157 L100 153 Z"
              fill="url(#tube-body-grad)"
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* Mechanical Reinforcing Rings */}
            <rect x="122" y="136" width="6" height="18" fill="url(#metal-ring-grad)" />
            <rect x="152" y="135" width="6" height="20" fill="url(#metal-ring-grad)" />
            <rect x="182" y="134" width="6" height="22" fill="url(#metal-ring-grad)" />

            {/* Cyan Accent Ring Line */}
            <line x1="155" y1="135" x2="155" y2="155" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.8" />

            {/* Guide Scope (Mini finder-scope on top of main tube) */}
            <path d="M125 127 L175 125 L175 131 L125 132 Z" fill="#0B0F19" stroke="#334155" strokeWidth="1" />
            <line x1="135" y1="132" x2="135" y2="136" stroke="#475569" strokeWidth="1.5" />
            <line x1="165" y1="131" x2="165" y2="135" stroke="#475569" strokeWidth="1.5" />
            <circle cx="176" cy="128" r="2.5" fill="#38BDF8" />

            {/* Dew Shield & Lens Cell (Forward/Upper-Right) */}
            <path
              d="M210 131 L234 130 L234 160 L210 159 Z"
              fill="#0F172A"
              stroke="#475569"
              strokeWidth="1.5"
            />

            {/* Front Objective Glass Lens Ring */}
            <ellipse cx="234" cy="145" rx="4" ry="15" fill="#0284C7" stroke="#38BDF8" strokeWidth="1.5" />

            {/* Internal Optical Glass Glow */}
            <ellipse
              cx="234"
              cy="145"
              rx="3"
              ry="13"
              fill="url(#lens-glass-grad)"
              className={`transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-75"}`}
            />

            {/* Lens Reflection Flare (Diagonal White Glint) */}
            <path d="M233 138 Q 235 145 233 152" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />

            {/* Subtle Light Beam exiting objective lens */}
            <path
              d="M236 140 L280 120 L280 170 L236 150 Z"
              fill="url(#lens-glow-radial)"
              className={`transition-opacity duration-500 pointer-events-none ${isHovered ? "opacity-75" : "opacity-40"}`}
            />
          </g>

          {/* Technical Instrument Coordinate Markings */}
          <text x="50" y="310" fill="#475569" fontSize="8" fontFamily="monospace" letterSpacing="0.2em">
            ELEV: 26.4° / AZ: 148.2°
          </text>
          <text x="210" y="310" fill="#38BDF8" fontSize="8" fontFamily="monospace" letterSpacing="0.2em" opacity="0.7">
            {currentMode.coord}
          </text>
        </svg>
      </div>

      {/* 5. Micro-Interaction Instruction */}
      <div className="mt-2 text-center">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-brand-cyan transition-colors duration-300">
          [Click telescope to switch focus]
        </span>
      </div>
    </div>
  );
}

export function CelestialDirectionSection({ vision, mission }: CelestialDirectionSectionProps) {
  return (
    <Section
      id="celestial-direction"
      spacing="none"
      className="border-b border-slate-800/80 bg-[#080A0F] relative overflow-hidden select-none min-h-[75vh] lg:min-h-[82vh] flex items-center"
      style={{
        paddingTop: "clamp(64px, 7vw, 100px)",
        paddingBottom: "clamp(70px, 8vw, 120px)",
      }}
    >
      {/* 1. Technical Astronomical Background Starfield & Coordinates */}
      <ObservatoryFieldCanvas />

      {/* 2. Soft Ambient Radial Illumination */}
      <div className="absolute right-1/4 top-1/2 -translate-y-1/2 w-[550px] h-[450px] bg-brand-blue/5 rounded-full blur-[140px] pointer-events-none" />

      {/* 3. Combined Vision + Mission Editorial Layout */}
      <Container size="lg" className="relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Vision + Mission Editorial Content (~58% Width) */}
          <div className="lg:col-span-7 space-y-10 sm:space-y-12">
            
            {/* Eyebrow */}
            <Reveal variant="fade-up">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-cyan/30 bg-brand-blue/10 text-xs font-bold text-brand-cyan tracking-[0.25em] uppercase shadow-[0_0_12px_rgba(56,189,248,0.1)]">
                <Compass className="w-3.5 h-3.5" />
                <span>IEDC / DIRECTION</span>
              </div>
            </Reveal>

            {/* BLOCK 1: OUR VISION */}
            <div className="space-y-3.5">
              <Reveal variant="fade-up" delayMs={100}>
                <div className="flex items-center gap-2 text-xs uppercase font-sans tracking-[0.22em] text-slate-400 font-semibold">
                  <Sparkles className="w-3 h-3 text-brand-cyan" />
                  <span>Our Vision</span>
                </div>
              </Reveal>

              <Reveal variant="fade-up" delayMs={150}>
                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.1] text-balance">
                  Looking{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-cyan to-brand-blue">
                    Further.
                  </span>
                </h2>
              </Reveal>

              <Reveal variant="fade-up" delayMs={200}>
                <p className="font-sans text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl">
                  {vision}
                </p>
              </Reveal>
            </div>

            {/* Substantial yet natural vertical connector (40-60px gap) */}
            <div className="w-16 h-px bg-gradient-to-r from-brand-cyan/40 to-transparent" />

            {/* BLOCK 2: OUR MISSION */}
            <div className="space-y-3.5">
              <Reveal variant="fade-up" delayMs={250}>
                <div className="flex items-center gap-2 text-xs uppercase font-sans tracking-[0.22em] text-slate-400 font-semibold">
                  <Crosshair className="w-3 h-3 text-brand-cyan" />
                  <span>Our Mission</span>
                </div>
              </Reveal>

              <Reveal variant="fade-up" delayMs={300}>
                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.1] text-balance">
                  Turning Ideas{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-cyan to-brand-blue">
                    Into Action.
                  </span>
                </h2>
              </Reveal>

              <Reveal variant="fade-up" delayMs={350}>
                <p className="font-sans text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl">
                  {mission}
                </p>
              </Reveal>
            </div>

          </div>

          {/* Right Column: Interactive Observatory Telescope Visual (~42% Width) */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <Reveal variant="fade-in" delayMs={200}>
              <InteractiveTelescope />
            </Reveal>
          </div>

        </div>
      </Container>
    </Section>
  );
}
