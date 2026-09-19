"use client";

import React, { useRef, useState, useCallback } from "react";
import Image from "next/image";

interface IedcOrbitalNodeProps {
  className?: string;
}

/**
 * Interactive IEDC Orbital Visual:
 * - Central circular pedestal with official unmodified IEDC logo (/public/images/iedc-logo.png).
 * - Thin concentric orbital rings, dashed geometric guides, and 4 satellite nodes.
 * - Gentle 3D parallax tilt responding to pointer coordinates.
 * - Hover intensifies orbital node illumination; click triggers subtle ripple pulse.
 * - Preserves institutional prestige: logo remains upright and never spins continuously.
 */
export function IedcOrbitalNode({ className = "" }: IedcOrbitalNodeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<number[]>([]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Gentle 3D tilt
    setTilt({
      x: -(y / (rect.height / 2)) * 6.5,
      y: (x / (rect.width / 2)) * 6.5,
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  const handleClick = useCallback(() => {
    const id = Date.now();
    setRipples((prev) => [...prev, id]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r !== id));
    }, 1200);
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: isHovered
          ? "transform 0.1s ease-out"
          : "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}
      className={`relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 flex items-center justify-center select-none cursor-pointer group ${className}`}
      role="button"
      aria-label="IEDC Innovation Field Node"
      tabIndex={0}
    >
      {/* 1. Restrained radial glow behind logo */}
      <div
        className={`absolute inset-8 rounded-full bg-gradient-to-tr from-brand-blue/20 via-brand-cyan/15 to-transparent blur-3xl pointer-events-none transition-all duration-500 ${
          isHovered ? "opacity-100 scale-110" : "opacity-45 scale-100"
        }`}
      />

      {/* 2. Outer thin orbital ring */}
      <div
        className={`absolute inset-4 sm:inset-6 rounded-full border transition-colors duration-300 pointer-events-none ${
          isHovered ? "border-brand-cyan/40" : "border-slate-800/80"
        }`}
      />

      {/* 3. Middle orbital ring with dashed geometric guide */}
      <div className="absolute inset-12 sm:inset-14 rounded-full border border-brand-cyan/25 border-dashed animate-[spin_80s_linear_infinite] pointer-events-none" />

      {/* 4. Inner orbital ring */}
      <div
        className={`absolute inset-20 sm:inset-22 rounded-full border transition-colors duration-300 pointer-events-none ${
          isHovered ? "border-brand-blue/60" : "border-brand-blue/30"
        }`}
      />

      {/* 5. Orbital Satellite Nodes that brighten when cursor approaches */}
      {/* Node A (Outer ring, top-right) */}
      <div
        className={`absolute top-6 right-16 w-2.5 h-2.5 rounded-full bg-brand-cyan transition-all duration-300 pointer-events-none ${
          isHovered
            ? "shadow-[0_0_18px_#38BDF8] scale-125"
            : "shadow-[0_0_10px_#38BDF8] opacity-80"
        }`}
      />
      {/* Node B (Middle ring, bottom-left) */}
      <div
        className={`absolute bottom-14 left-12 w-2 h-2 rounded-full bg-blue-400 transition-all duration-300 pointer-events-none ${
          isHovered
            ? "shadow-[0_0_14px_#60A5FA] scale-125"
            : "shadow-[0_0_8px_#60A5FA] opacity-80"
        }`}
      />
      {/* Node C (Inner ring, top-left) */}
      <div
        className={`absolute top-22 left-18 w-1.5 h-1.5 rounded-full bg-white transition-all duration-300 pointer-events-none ${
          isHovered ? "shadow-[0_0_10px_#FFFFFF] opacity-100" : "opacity-60"
        }`}
      />
      {/* Node D (Outer ring, bottom-right) */}
      <div
        className={`absolute bottom-18 right-14 w-2 h-2 rounded-full bg-cyan-300 transition-all duration-300 pointer-events-none ${
          isHovered
            ? "shadow-[0_0_14px_#67E8F9] scale-125"
            : "shadow-[0_0_8px_#67E8F9] opacity-75"
        }`}
      />

      {/* 6. Click Ripple Pulse */}
      {ripples.map((id) => (
        <span
          key={id}
          className="absolute w-32 h-32 rounded-full border-2 border-brand-cyan/70 animate-ping pointer-events-none"
        />
      ))}

      {/* 7. Central Node: Dark circular pedestal hosting official un-distorted IEDC logo */}
      <div
        className={`relative z-10 w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-[#0F1626] via-[#0B101C] to-[#070B14] border flex items-center justify-center transition-all duration-300 ${
          isHovered
            ? "border-brand-cyan/70 shadow-[0_20px_50px_rgba(37,99,235,0.3),inset_0_0_25px_rgba(56,189,248,0.2)] scale-105"
            : "border-slate-800 shadow-[0_15px_40px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(56,189,248,0.08)]"
        }`}
      >
        {/* Fine inner halo */}
        <div className="absolute inset-2 rounded-full border border-brand-blue/20 pointer-events-none" />

        {/* Official IEDC Logo (Unmodified, undistorted, upright) */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 transition-transform duration-300">
          <Image
            src="/images/iedc-logo.png"
            alt="IEDC TKIET Official Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Technical Label */}
      <div className="absolute -bottom-3 inset-x-0 text-center font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-slate-400 group-hover:text-brand-cyan transition-colors duration-300 pointer-events-none">
        IEDC Ecosystem // TKIET
      </div>
    </div>
  );
}
