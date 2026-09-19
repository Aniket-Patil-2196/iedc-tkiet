"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface JourneyRocketProps {
  angle?: number;
  isMoving?: boolean;
  velocity?: number; // 0 to 1
  className?: string;
  label?: string;
}

export function JourneyRocket({
  angle = 0,
  isMoving = false,
  velocity = 0,
  className = "",
  label = "IEDC // EXPLORER",
}: JourneyRocketProps) {
  // Dynamic exhaust length based on motion
  const plumeLength = isMoving ? 36 + Math.min(velocity * 40, 30) : 16;
  const plumeOpacity = isMoving ? 0.95 : 0.45;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center select-none pointer-events-none",
        className
      )}
      style={{
        transform: "rotate(" + angle + "deg)",
      }}
    >
      {/* Dynamic Thruster Exhaust Plume */}
      <div
        className="absolute -left-7 top-1/2 -translate-y-1/2 flex items-center transition-all duration-200"
        style={{ opacity: plumeOpacity }}
      >
        {/* Inner core plasma torch */}
        <div
          className="bg-gradient-to-l from-white via-brand-cyan to-transparent rounded-full blur-[1.5px]"
          style={{
            width: plumeLength + "px",
            height: isMoving ? "6px" : "3.5px",
          }}
        />

        {/* Outer electric-blue flame aura */}
        <div
          className="absolute right-0 bg-gradient-to-l from-brand-cyan via-brand-blue to-transparent rounded-full blur-[8px]"
          style={{
            width: plumeLength * 1.5 + "px",
            height: isMoving ? "14px" : "8px",
            opacity: isMoving ? 0.85 : 0.4,
          }}
        />

        {/* Particle spark wake when accelerating */}
        {isMoving && (
          <div className="absolute -left-4 flex gap-1 items-center">
            <span className="w-1 h-1 rounded-full bg-white animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan opacity-75" />
          </div>
        )}
      </div>

      {/* Sleek High-Tech Spacecraft Fuselage */}
      <svg
        width="56"
        height="36"
        viewBox="0 0 56 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow-[0_0_14px_rgba(56,189,248,0.45)]"
      >
        <defs>
          {/* Carbon metallic hull */}
          <linearGradient id="rocket-hull" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#0B0F17" />
            <stop offset="35%" stopColor="#1E293B" />
            <stop offset="70%" stopColor="#334155" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Electric Cyan Trim */}
          <linearGradient id="rocket-trim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Canopy Visor */}
          <linearGradient id="rocket-canopy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
        </defs>

        {/* Port Upper Delta Wing Fin */}
        <path
          d="M12 11 L5 2 L19 9 Z"
          fill="#1E293B"
          stroke="#38BDF8"
          strokeWidth="0.8"
        />

        {/* Starboard Lower Delta Wing Fin */}
        <path
          d="M12 25 L5 34 L19 27 Z"
          fill="#1E293B"
          stroke="#38BDF8"
          strokeWidth="0.8"
        />

        {/* Main Aerodynamic Body */}
        <path
          d="M8 12 C18 12 32 13 48 18 C32 23 18 24 8 24 L10 18 Z"
          fill="url(#rocket-hull)"
          stroke="#475569"
          strokeWidth="1.2"
        />

        {/* Longitudinal Telemetry Accent */}
        <path
          d="M14 18 L42 18"
          stroke="url(#rocket-trim)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Glass Canopy / Sensor Array */}
        <polygon
          points="28,15 38,16.5 38,19.5 28,21"
          fill="url(#rocket-canopy)"
          stroke="#E2E8F0"
          strokeWidth="0.5"
        />

        {/* Thruster Nozzle Cowling */}
        <rect
          x="6"
          y="14"
          width="4"
          height="8"
          rx="1"
          fill="#050811"
          stroke="#38BDF8"
          strokeWidth="1"
        />

        {/* Forward Navigation Beacon Dot */}
        <circle
          cx="49"
          cy="18"
          r="1.4"
          fill="#FFFFFF"
          className={isMoving ? "animate-ping" : "animate-pulse"}
        />
      </svg>

      {/* Floating HUD Tag (Counter-rotated to remain horizontal) */}
      <div
        className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
        style={{ transform: "rotate(" + -angle + "deg)" }}
      >
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/90 border border-brand-cyan/40 backdrop-blur-md shadow-[0_0_12px_rgba(56,189,248,0.3)]">
          <span
            className={cn(
              "w-1.5 h-1.5 rounded-full bg-brand-cyan",
              isMoving ? "animate-ping" : "animate-pulse"
            )}
          />
          <span className="font-mono text-[9px] uppercase tracking-wider text-brand-cyan font-bold">
            {isMoving ? "PROPULSION ACTIVE" : label}
          </span>
        </div>
      </div>
    </div>
  );
}
