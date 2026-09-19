"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { IJourneyMilestone } from "@/types/content";
import { CANONICAL_JOURNEY_MILESTONES } from "@/lib/data/journeyData";
import { JourneyStarfieldCanvas } from "./JourneyStarfieldCanvas";
import { JourneyPlanetNode } from "./JourneyPlanetNode";
import { JourneyRocket } from "./JourneyRocket";
import {
  ChevronLeft,
  ChevronRight,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface JourneySpaceSectionProps {
  milestones?: IJourneyMilestone[];
}

// Normalized coordinate parameters:
// Entire visual composition is elevated upward so content and planets
// sit comfortably in the upper-middle visual zone with generous bottom clearance.
const START_X = 380;
const STEP_X = 700;
const MID_Y = 215;
const AMPLITUDE_Y = 55;
const STAGE_HEIGHT = 460;

export function JourneySpaceSection({ milestones = [] }: JourneySpaceSectionProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const pathLengthRef = useRef<number>(0);
  const stRef = useRef<ScrollTrigger | null>(null);

  // Dynamic milestones with fallback safety
  const items = useMemo(() => {
    const raw =
      milestones && milestones.length > 0
        ? milestones.filter((m) => m.published !== false)
        : CANONICAL_JOURNEY_MILESTONES;

    const list = raw.length > 0 ? raw : CANONICAL_JOURNEY_MILESTONES;

    return list.map((m, idx) => {
      const canonical =
        CANONICAL_JOURNEY_MILESTONES[idx % CANONICAL_JOURNEY_MILESTONES.length];
      return {
        ...canonical,
        ...m,
        id: m.id || (m as { _id?: string })._id || "milestone-" + idx,
        phaseLabel:
          m.phaseLabel ||
          m.label ||
          canonical?.phaseLabel ||
          "0" + (idx + 1) + " // PHASE",
        planetType: (m.planetType ||
          canonical?.planetType ||
          "oceanic") as
          | "embryo"
          | "oceanic"
          | "nexus"
          | "gas_giant"
          | "radiant",
        tagline: m.tagline || canonical?.tagline || m.title,
        metric: m.metric || m.highlightMetric || canonical?.metric,
      };
    });
  }, [milestones]);

  const count = items.length;

  // Dynamically compute exact celestial anchors elevated into the safe upper-middle zone
  // (cp.x, cp.y) is the exact center of the celestial body and the trajectory anchor
  const checkpoints = useMemo(() => {
    return items.map((_, idx) => {
      const x = START_X + idx * STEP_X;
      // Alternate Y coordinates: lower-middle for even indices (270px), upper-middle for odd indices (160px)
      const y = MID_Y + (idx % 2 === 0 ? AMPLITUDE_Y : -AMPLITUDE_Y);
      const targetP = count > 1 ? idx / (count - 1) : 0;
      return { x, y, targetP };
    });
  }, [items, count]);

  // Total horizontal track width for desktop stage
  const spaceWidth = useMemo(() => {
    return START_X + Math.max(1, count - 1) * STEP_X + 440;
  }, [count]);

  // Dynamically build smooth continuous cubic Bezier spline
  // STARTS EXACTLY at Planet 0's anchor (cp0.x, cp0.y)
  // PASSES THROUGH every intermediate planet (cpi.x, cpi.y)
  // TERMINATES EXACTLY at Planet (N-1)'s anchor (cpLast.x, cpLast.y)
  const splineD = useMemo(() => {
    if (checkpoints.length === 0) {
      return "M 0 215 L 1000 215";
    }

    if (checkpoints.length === 1) {
      const p = checkpoints[0];
      return `M ${p.x - 200} ${p.y} L ${p.x + 200} ${p.y}`;
    }

    // Path begins exactly at planet 0 center
    let d = `M ${checkpoints[0].x} ${checkpoints[0].y}`;

    for (let i = 0; i < checkpoints.length - 1; i++) {
      const cur = checkpoints[i];
      const next = checkpoints[i + 1];
      const dx = next.x - cur.x;
      // Horizontal tangents guarantee level entry and departure at each planet anchor
      const cp1X = cur.x + dx * 0.45;
      const cp1Y = cur.y;
      const cp2X = next.x - dx * 0.45;
      const cp2Y = next.y;

      d += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${next.x} ${next.y}`;
    }

    return d;
  }, [checkpoints]);

  // Motion & physics refs
  const targetProgressRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  const directionRef = useRef<number>(1);
  const velocityRef = useRef<number>(0);
  const currentAngleRef = useRef<number>(0);

  // Reactive state for UI updates
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [velocity, setVelocity] = useState<number>(0);
  const [windowWidth, setWindowWidth] = useState<number>(1280);
  const [rocketPos, setRocketPos] = useState<{ x: number; y: number; angle: number }>({
    x: checkpoints[0]?.x || 380,
    y: checkpoints[0]?.y || 270,
    angle: 0,
  });

  // Keep track of viewport width for camera translation
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (stRef.current) {
        stRef.current.refresh();
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Current active milestone index (0 to N-1)
  const activeMilestoneIndex = useMemo(() => {
    if (count <= 1) return 0;
    const index = Math.round(scrollProgress * (count - 1));
    return Math.min(count - 1, Math.max(0, index));
  }, [scrollProgress, count]);

  // Measure SVG path length when spline updates
  useEffect(() => {
    if (pathRef.current) {
      pathLengthRef.current = pathRef.current.getTotalLength();
    }
  }, [splineD]);

  // GSAP ScrollTrigger Viewport Pinning & Dynamic Milestone Snapping
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const container = containerRef.current;
    const viewport = viewportRef.current;
    if (!container || !viewport) return;

    // Dynamically generate snap points for any number of milestones
    const snapPoints =
      count > 1 ? Array.from({ length: count }, (_, i) => i / (count - 1)) : [0];

    const scrollDistance = Math.max(1800, count * 520);

    const st = ScrollTrigger.create({
      trigger: container,
      pin: viewport,
      start: "top top",
      end: `+=${scrollDistance}`,
      scrub: 0.5,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      snap: {
        snapTo: snapPoints,
        duration: { min: 0.25, max: 0.55 },
        delay: 0.12,
        ease: "power2.out",
      },
      onUpdate: (self) => {
        targetProgressRef.current = self.progress;
        if (self.direction !== 0) {
          directionRef.current = self.direction;
        }
        velocityRef.current = Math.min(Math.abs(self.getVelocity()) / 900, 1.0);
      },
    });

    stRef.current = st;

    // High-performance continuous animation loop
    let animId: number;
    let lastProgress = 0;

    const loop = () => {
      animId = requestAnimationFrame(loop);

      // Smooth progress interpolation
      currentProgressRef.current +=
        (targetProgressRef.current - currentProgressRef.current) * 0.1;
      const curP = currentProgressRef.current;

      const delta = Math.abs(curP - lastProgress);
      lastProgress = curP;

      const moving = delta > 0.0003;
      setIsMoving(moving);
      setVelocity(velocityRef.current);
      setScrollProgress(curP);

      // Compute rocket position and tangent along the orbital path
      const path = pathRef.current;
      const totalLen = pathLengthRef.current;

      if (path && totalLen > 0) {
        const clampedP = Math.max(0, Math.min(1, curP));
        const currentLen = totalLen * clampedP;
        const pt = path.getPointAtLength(currentLen);
        const nextLen = Math.min(totalLen, currentLen + 2);
        const ptNext = path.getPointAtLength(nextLen);

        // Calculate path forward tangent angle
        const forwardAngle =
          Math.atan2(ptNext.y - pt.y, ptNext.x - pt.x) * (180 / Math.PI);

        // When moving backward, point along reverse path (forwardAngle + 180)
        const dir = directionRef.current;
        const targetAngle = dir === -1 ? forwardAngle + 180 : forwardAngle;

        // Smooth angular interpolation
        let diff = (targetAngle - currentAngleRef.current) % 360;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        currentAngleRef.current += diff * 0.12;

        let finalX = pt.x;
        let finalY = pt.y;

        // Turnaround offset when reversing
        if (dir === -1) {
          const normalX = -(ptNext.y - pt.y);
          const normalY = ptNext.x - pt.x;
          const norm = Math.hypot(normalX, normalY) || 1;
          finalX += (normalX / norm) * 14;
          finalY += (normalY / norm) * 14;
        }

        setRocketPos({
          x: finalX,
          y: finalY,
          angle: currentAngleRef.current,
        });
      }
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      st.kill();
      stRef.current = null;
    };
  }, [count, splineD]);

  // Programmatic smooth scroll to milestone checkpoint
  const scrollToMilestone = useCallback(
    (index: number) => {
      const st = stRef.current;
      if (!st) return;

      const targetFraction = count > 1 ? index / (count - 1) : 0;
      const targetScrollY = st.start + targetFraction * (st.end - st.start);

      window.scrollTo({
        top: targetScrollY,
        behavior: "smooth",
      });
    },
    [count]
  );

  const handlePrev = () => {
    if (activeMilestoneIndex > 0) {
      scrollToMilestone(activeMilestoneIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeMilestoneIndex < count - 1) {
      scrollToMilestone(activeMilestoneIndex + 1);
    }
  };

  // Horizontal camera tracking: center rocket smoothly in the viewport
  const stageTranslateX = useMemo(() => {
    const maxTranslate = Math.max(0, spaceWidth - windowWidth);
    // Smooth camera tracking centered around the rocket
    const desiredCam = rocketPos.x - windowWidth * 0.38;
    return -Math.max(0, Math.min(maxTranslate, desiredCam));
  }, [rocketPos.x, spaceWidth, windowWidth]);

  return (
    <section
      ref={containerRef}
      id="journey"
      aria-label="IEDC Journey Through Innovation"
      className="relative w-full"
    >
      {/* Viewport Pinned by GSAP ScrollTrigger with safe top & bottom bounds */}
      <div
        ref={viewportRef}
        className="w-full h-screen overflow-hidden bg-[#080A0F] select-none flex flex-col justify-between"
        style={{
          paddingTop: "clamp(76px, 10vh, 92px)",
          paddingBottom: "clamp(18px, 3vh, 28px)",
        }}
      >
        {/* 1. 2D Parallax Starfield Canvas */}
        <JourneyStarfieldCanvas scrollProgress={scrollProgress} />

        {/* 2. Pure Editorial Main Heading */}
        <div className="relative z-20 w-full px-6 lg:px-12 pointer-events-none flex-shrink-0">
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-typo-white tracking-tight">
            Our Journey Through Innovation.
          </h2>
        </div>

        {/* ============================================================ */}
        {/* 3. EXPANSIVE HORIZONTAL COSMIC STAGE (Desktop)              */}
        {/* Elevated upward into the upper-middle visual frame with       */}
        {/* generous breathing space above the bottom navigation controls */}
        {/* ============================================================ */}
        <div
          ref={stageRef}
          className="hidden md:flex relative w-full flex-1 items-center justify-center overflow-visible pointer-events-auto min-h-[380px] max-h-[500px]"
        >
          {/* Moving Cosmic World Track: Shifted down by 80px to achieve balanced vertical centering */}
          <div
            className="absolute left-0 will-change-transform"
            style={{
              top: "calc(50% - 15px)",
              transform: `translate3d(${stageTranslateX}px, -50%, 0)`,
              width: spaceWidth + "px",
              height: STAGE_HEIGHT + "px",
              transition: "transform 0.08s ease-out",
            }}
          >
            {/* SVG Orbital Flight Spline (1:1 Coordinate Mapping with DOM Anchors) */}
            <svg
              width={spaceWidth}
              height={STAGE_HEIGHT}
              viewBox={`0 0 ${spaceWidth} ${STAGE_HEIGHT}`}
              preserveAspectRatio="none"
              className="absolute top-0 left-0 pointer-events-none z-10 overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="spline-glow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#38BDF8" stopOpacity="1" />
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.9" />
                </linearGradient>

                <filter id="spline-filter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* 1. Subtle Solid Guide Wire (Ensures unbroken continuity between all worlds) */}
              <path
                ref={pathRef}
                d={splineD}
                stroke="#0284C7"
                strokeWidth="1.5"
                strokeOpacity="0.3"
                strokeLinecap="round"
              />

              {/* 2. Soft Atmospheric Glow Aura */}
              <path
                d={splineD}
                stroke="#38BDF8"
                strokeWidth="6"
                strokeOpacity="0.22"
                strokeLinecap="round"
                filter="url(#spline-filter)"
              />

              {/* 3. Dynamic Illuminated Dotted Trajectory */}
              <path
                d={splineD}
                stroke="url(#spline-glow-grad)"
                strokeWidth="2.5"
                strokeDasharray="4 8"
                strokeLinecap="round"
                className="opacity-90"
              />

              {/* 4. Physical Orbital Docking Terminals at every celestial checkpoint */}
              {checkpoints.map((cp, idx) => (
                <g key={idx}>
                  {/* Outer concentric transit anchor ring */}
                  <circle
                    cx={cp.x}
                    cy={cp.y}
                    r={idx === count - 1 ? "56" : "50"}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                    strokeOpacity="0.25"
                  />
                  {/* Docking terminal core */}
                  <circle
                    cx={cp.x}
                    cy={cp.y}
                    r="4"
                    fill="#38BDF8"
                    opacity="0.8"
                  />
                </g>
              ))}
            </svg>

            {/* Render Celestial Planet Anchors with Smart Content Placement */}
            {items.map((milestone, idx) => {
              const cp = checkpoints[idx];
              if (!cp) return null;

              // SMART CONTENT PLACEMENT:
              // If planet Y is lower-middle (y > MID_Y), content floats ABOVE.
              // If planet Y is upper-middle (y <= MID_Y), content floats BELOW.
              const placement = cp.y > MID_Y ? "above" : "below";
              const planetSize = idx === count - 1 ? 114 : 102;

              return (
                <div
                  key={milestone.id || idx}
                  className="absolute z-20"
                  style={{
                    left: cp.x + "px",
                    top: cp.y + "px",
                  }}
                >
                  <JourneyPlanetNode
                    planetType={milestone.planetType || "oceanic"}
                    phaseLabel={milestone.phaseLabel}
                    year={milestone.year}
                    title={milestone.title}
                    tagline={milestone.tagline || milestone.title}
                    description={milestone.description || milestone.summary}
                    metric={milestone.metric || milestone.highlightMetric}
                    isActive={activeMilestoneIndex === idx}
                    isPassed={idx < activeMilestoneIndex}
                    onClick={() => scrollToMilestone(idx)}
                    size={planetSize}
                    placement={placement}
                  />
                </div>
              );
            })}

            {/* Traveling Rocket Vehicle along Spline */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
              style={{
                left: rocketPos.x + "px",
                top: rocketPos.y + "px",
              }}
            >
              <JourneyRocket
                angle={rocketPos.angle}
                isMoving={isMoving}
                velocity={velocity}
                label={items[activeMilestoneIndex]?.phaseLabel}
              />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MOBILE MODE: RESPONSIVE VERTICAL COSMIC TIMELINE            */}
        {/* ============================================================ */}
        <div className="block md:hidden relative z-20 my-auto px-6 overflow-y-auto max-h-[55vh] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
            {items.map((milestone, idx) => {
              const isActive = activeMilestoneIndex === idx;

              return (
                <div
                  key={milestone.id || idx}
                  onClick={() => scrollToMilestone(idx)}
                  className={cn(
                    "relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer",
                    isActive
                      ? "bg-brand-blue/15 border-brand-cyan/70 shadow-[0_0_20px_rgba(56,189,248,0.25)]"
                      : "bg-slate-950/60 border-slate-800"
                  )}
                >
                  <div
                    className={cn(
                      "absolute -left-[31px] top-6 w-3.5 h-3.5 rounded-full border-2 transition-all",
                      isActive
                        ? "bg-brand-cyan border-white shadow-[0_0_10px_#38BDF8]"
                        : "bg-slate-900 border-slate-700"
                    )}
                  />

                  <div className="flex items-center gap-4">
                    <JourneyPlanetNode
                      planetType={milestone.planetType || "oceanic"}
                      year={milestone.year}
                      title={milestone.title}
                      description={milestone.description || milestone.summary}
                      metric={milestone.metric || milestone.highlightMetric}
                      isActive={isActive}
                      isPassed={idx < activeMilestoneIndex}
                      onClick={() => scrollToMilestone(idx)}
                      size={54}
                      placement="inline"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-display font-bold text-brand-cyan">
                          {milestone.year}
                        </span>
                        {milestone.metric && (
                          <span className="px-1.5 py-0.5 rounded-full bg-brand-blue/30 border border-brand-cyan/40 text-[9px] font-mono text-brand-cyan font-semibold">
                            {milestone.metric}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-typo-white truncate">
                        {milestone.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {milestone.description || milestone.summary}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Initial Scroll Cue (Fades once user scrolls) */}
        {scrollProgress < 0.04 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 pointer-events-none transition-opacity duration-500">
            <span className="font-mono text-[10px] tracking-[0.25em] text-brand-cyan uppercase font-bold animate-pulse">
              SCROLL TO EXPLORE
            </span>
            <div className="w-4 h-7 rounded-full border border-brand-cyan/40 flex justify-center pt-1 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
              <span className="w-1 h-1.5 rounded-full bg-brand-cyan animate-bounce" />
            </div>
          </div>
        )}

        {/* 5. Clean Milestone Navigation Bar (Zero Visible Scrollbar) */}
        <div className="relative z-30 w-full px-6 lg:px-12 flex items-center justify-between gap-4 flex-shrink-0">
          {/* Secondary Stepper Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={activeMilestoneIndex === 0}
              aria-label="Previous Milestone"
              className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all backdrop-blur-md cursor-pointer",
                activeMilestoneIndex === 0
                  ? "border-slate-800/60 text-slate-600 opacity-40 cursor-not-allowed"
                  : "border-slate-700 bg-slate-950/80 text-slate-300 hover:border-brand-cyan hover:text-white"
              )}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>PREV</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={activeMilestoneIndex === count - 1}
              aria-label="Next Milestone"
              className={cn(
                "px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-all backdrop-blur-md cursor-pointer",
                activeMilestoneIndex === count - 1
                  ? "border-slate-800/60 text-slate-600 opacity-40 cursor-not-allowed"
                  : "border-slate-700 bg-slate-950/80 text-slate-300 hover:border-brand-cyan hover:text-white"
              )}
            >
              <span>NEXT</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clean Milestone Indicator: [ 01  02  03  04  05 ] with zero scrollbar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 py-1.5 px-3 rounded-full bg-slate-950/80 border border-slate-800/80 backdrop-blur-md overflow-x-auto md:overflow-visible max-w-[65vw] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {items.map((_, idx) => {
              const isActive = activeMilestoneIndex === idx;
              const isPassed = idx < activeMilestoneIndex;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollToMilestone(idx)}
                  aria-label={"Scroll to milestone " + (idx + 1)}
                  className={cn(
                    "relative font-mono text-xs px-2.5 py-1 rounded-md transition-all duration-300 cursor-pointer flex-shrink-0",
                    isActive
                      ? "bg-brand-blue border border-brand-cyan text-white font-bold shadow-[0_0_12px_rgba(56,189,248,0.5)] scale-105"
                      : isPassed
                      ? "text-brand-cyan hover:text-white"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {"0" + (idx + 1)}
                  {isActive && (
                    <span className="absolute -inset-0.5 rounded-md border border-brand-cyan animate-ping opacity-40 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Institutional Integrity Notice */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-400 flex-shrink-0">
            <Radio className="w-3 h-3 text-brand-cyan animate-pulse" />
            <span>[Development Milestones]</span>
          </div>
        </div>
      </div>
    </section>
  );
}
