"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface JourneyPlanetNodeProps {
  planetType: "embryo" | "oceanic" | "nexus" | "gas_giant" | "radiant";
  phaseLabel?: string;
  year: string;
  title: string;
  tagline?: string;
  description: string;
  metric?: string;
  isActive: boolean;
  isPassed: boolean;
  onClick: () => void;
  size?: number;
  placement?: "above" | "below" | "side" | "inline";
}

export function JourneyPlanetNode({
  planetType,
  year,
  title,
  description,
  metric,
  isActive,
  isPassed: _isPassed,
  onClick,
  size = 110,
  placement = "below",
}: JourneyPlanetNodeProps) {
  // Mobile / Inline mode: renders only the celestial body
  if (placement === "inline") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={"Inspect milestone: " + year + " " + title}
        className="group relative flex items-center justify-center focus:outline-none cursor-pointer flex-shrink-0"
        style={{ width: size, height: size }}
      >
        {renderStylizedPlanet(planetType, size, isActive)}
      </button>
    );
  }

  // Desktop modes: Celestial body is anchored PRECISELY at (0, 0)
  return (
    <div
      className={cn(
        "relative select-none transition-all duration-700",
        isActive ? "z-30 opacity-100" : "z-20 opacity-80 hover:opacity-100"
      )}
    >
      {/* 1. Dimensional Celestial Body Anchored at Exact (0, 0) */}
      <button
        type="button"
        onClick={onClick}
        aria-label={"Inspect milestone: " + year + " " + title}
        className={cn(
          "absolute -translate-x-1/2 -translate-y-1/2 group flex items-center justify-center focus:outline-none cursor-pointer transition-transform duration-500",
          isActive ? "scale-105" : "hover:scale-105"
        )}
        style={{ width: size, height: size }}
      >
        {/* Active Atmospheric Corona Glow */}
        {isActive && (
          <div
            className="absolute inset-0 rounded-full blur-2xl animate-pulse pointer-events-none transition-all duration-700"
            style={{
              background:
                planetType === "embryo"
                  ? "radial-gradient(circle, rgba(245,158,11,0.5) 0%, rgba(239,68,68,0.25) 50%, transparent 80%)"
                  : planetType === "oceanic"
                  ? "radial-gradient(circle, rgba(56,189,248,0.55) 0%, rgba(37,99,235,0.25) 50%, transparent 80%)"
                  : planetType === "nexus"
                  ? "radial-gradient(circle, rgba(45,212,191,0.55) 0%, rgba(14,165,233,0.25) 50%, transparent 80%)"
                  : planetType === "gas_giant"
                  ? "radial-gradient(circle, rgba(168,85,247,0.5) 0%, rgba(99,102,241,0.22) 50%, transparent 80%)"
                  : "radial-gradient(circle, rgba(56,189,248,0.7) 0%, rgba(96,165,250,0.3) 50%, transparent 80%)",
              transform: "scale(2.1)",
            }}
          />
        )}

        {/* Outer Orbital Targeting Reticle for Active Milestone */}
        {isActive && (
          <div
            className="absolute -inset-4 rounded-full border border-dashed border-brand-cyan/60 animate-spin-slow pointer-events-none"
            style={{ animationDuration: "24s" }}
          />
        )}

        {/* Stylized Multi-Layered Celestial Body */}
        {renderStylizedPlanet(planetType, size, isActive)}
      </button>

      {/* 2. Smart Editorial Content Positioning */}

      {/* PLACEMENT: ABOVE (Lower Planets: content floats above the sphere) */}
      {placement === "above" && (
        <div
          onClick={onClick}
          className="absolute -translate-x-1/2 left-0 flex flex-col items-center text-center max-w-[280px] w-[280px] cursor-pointer pointer-events-auto"
          style={{
            bottom: size / 2 + 16 + "px",
          }}
        >
          <div className="space-y-1.5 px-2">
            <div className="flex items-center justify-center gap-2">
              <span className="font-display text-2xl font-bold text-typo-white tracking-tight">
                {year}
              </span>
              {metric && (
                <span className="px-2 py-0.5 rounded-full bg-brand-blue/20 border border-brand-cyan/40 text-[10px] font-mono font-bold text-brand-cyan">
                  {metric}
                </span>
              )}
            </div>

            <h4
              className={cn(
                "font-display text-sm sm:text-base font-bold tracking-tight leading-snug transition-colors duration-300",
                isActive ? "text-brand-cyan" : "text-slate-100 hover:text-brand-cyan"
              )}
            >
              {title}
            </h4>

            <p className="text-xs font-sans text-slate-400 leading-relaxed line-clamp-3">
              {description}
            </p>
          </div>

          {/* Subtle Celestial Connector Line pointing down to planet */}
          <div className="flex flex-col items-center mt-3 pointer-events-none">
            <div className="w-px h-6 bg-gradient-to-b from-brand-cyan/60 via-brand-cyan/30 to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan shadow-[0_0_8px_#38BDF8]" />
          </div>
        </div>
      )}

      {/* PLACEMENT: BELOW (Upper Planets: content floats below the sphere) */}
      {placement === "below" && (
        <div
          onClick={onClick}
          className="absolute -translate-x-1/2 left-0 flex flex-col items-center text-center max-w-[280px] w-[280px] cursor-pointer pointer-events-auto"
          style={{
            top: size / 2 + 16 + "px",
          }}
        >
          {/* Subtle Celestial Connector Line pointing down from planet */}
          <div className="flex flex-col items-center mb-3 pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan shadow-[0_0_8px_#38BDF8]" />
            <div className="w-px h-6 bg-gradient-to-t from-brand-cyan/60 via-brand-cyan/30 to-transparent" />
          </div>

          <div className="space-y-1.5 px-2">
            <div className="flex items-center justify-center gap-2">
              <span className="font-display text-2xl font-bold text-typo-white tracking-tight">
                {year}
              </span>
              {metric && (
                <span className="px-2 py-0.5 rounded-full bg-brand-blue/20 border border-brand-cyan/40 text-[10px] font-mono font-bold text-brand-cyan">
                  {metric}
                </span>
              )}
            </div>

            <h4
              className={cn(
                "font-display text-sm sm:text-base font-bold tracking-tight leading-snug transition-colors duration-300",
                isActive ? "text-brand-cyan" : "text-slate-100 hover:text-brand-cyan"
              )}
            >
              {title}
            </h4>

            <p className="text-xs font-sans text-slate-400 leading-relaxed line-clamp-3">
              {description}
            </p>
          </div>
        </div>
      )}

      {/* PLACEMENT: SIDE (Alternative side placement) */}
      {placement === "side" && (
        <div
          onClick={onClick}
          className="absolute top-1/2 -translate-y-1/2 flex items-center gap-3 text-left max-w-[260px] w-[260px] cursor-pointer pointer-events-auto"
          style={{
            left: size / 2 + 16 + "px",
          }}
        >
          {/* Subtle Horizontal Connector Line */}
          <div className="flex items-center pointer-events-none flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan shadow-[0_0_8px_#38BDF8]" />
            <div className="w-6 h-px bg-gradient-to-r from-brand-cyan/60 to-transparent" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-bold text-typo-white tracking-tight">
                {year}
              </span>
              {metric && (
                <span className="px-1.5 py-0.5 rounded-full bg-brand-blue/20 border border-brand-cyan/40 text-[9px] font-mono font-bold text-brand-cyan">
                  {metric}
                </span>
              )}
            </div>
            <h4
              className={cn(
                "font-display text-sm font-bold tracking-tight leading-snug transition-colors duration-300",
                isActive ? "text-brand-cyan" : "text-slate-100 hover:text-brand-cyan"
              )}
            >
              {title}
            </h4>
            <p className="text-xs font-sans text-slate-400 leading-relaxed line-clamp-2">
              {description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Premium stylized celestial bodies featuring multi-stop directional illumination,
 * organic surface variations, translucent atmospheric shells, and true 3D spatial rings.
 */
function renderStylizedPlanet(
  planetType: "embryo" | "oceanic" | "nexus" | "gas_giant" | "radiant",
  size: number,
  _isActive: boolean
) {
  // Unique ID prefix for gradients
  const id = `planet-${planetType}`;

  return (
    <svg
      width={size * 1.6}
      height={size * 1.6}
      viewBox="-80 -80 160 160"
      className="overflow-visible select-none"
    >
      <defs>
        {/* Soft Outer Atmospheric Glow */}
        <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Planet-Specific Multi-Layer Gradients */}

        {/* 1. EMBRYO: Molten Magma & Volcanic Basalt */}
        <radialGradient id={`${id}-magma`} cx="36%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="25%" stopColor="#F97316" />
          <stop offset="60%" stopColor="#B91C1C" />
          <stop offset="85%" stopColor="#450A0A" />
          <stop offset="100%" stopColor="#1C0A0A" />
        </radialGradient>
        <radialGradient id={`${id}-magma-rim`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.4" />
          <stop offset="70%" stopColor="#EA580C" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#7F1D1D" stopOpacity="0.7" />
        </radialGradient>

        {/* 2. OCEANIC: Deep Cyan Oceans & Continental Shelves */}
        <radialGradient id={`${id}-ocean`} cx="32%" cy="28%" r="68%">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="20%" stopColor="#38BDF8" />
          <stop offset="55%" stopColor="#0284C7" />
          <stop offset="80%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>
        <linearGradient id={`${id}-clouds`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#E0F2FE" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
        </linearGradient>

        {/* 3. NEXUS: Emerald Cyber World with Network Coordinates */}
        <radialGradient id={`${id}-nexus`} cx="35%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="25%" stopColor="#10B981" />
          <stop offset="60%" stopColor="#047857" />
          <stop offset="85%" stopColor="#064E3B" />
          <stop offset="100%" stopColor="#022C22" />
        </radialGradient>

        {/* 4. GAS GIANT: Stratified Jovian Bands & Violet Atmosphere */}
        <radialGradient id={`${id}-gas`} cx="35%" cy="30%" r="68%">
          <stop offset="0%" stopColor="#E9D5FF" />
          <stop offset="25%" stopColor="#A855F7" />
          <stop offset="60%" stopColor="#6B21A8" />
          <stop offset="85%" stopColor="#3B0764" />
          <stop offset="100%" stopColor="#0F051D" />
        </radialGradient>
        <linearGradient id={`${id}-rings`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D8B4FE" stopOpacity="0.8" />
          <stop offset="45%" stopColor="#A855F7" stopOpacity="0.5" />
          <stop offset="70%" stopColor="#7E22CE" stopOpacity="0.1" />
          <stop offset="85%" stopColor="#C084FC" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#E9D5FF" stopOpacity="0.9" />
        </linearGradient>

        {/* 5. RADIANT: Crystalline Fusion Core with Electric Halo */}
        <radialGradient id={`${id}-radiant`} cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="20%" stopColor="#BAE6FD" />
          <stop offset="50%" stopColor="#0EA5E9" />
          <stop offset="80%" stopColor="#0369A1" />
          <stop offset="100%" stopColor="#082F49" />
        </radialGradient>

        {/* Spherical Shadow Terminator (Applies realistic 3D sphere depth) */}
        <radialGradient id="sphere-shadow" cx="28%" cy="25%" r="72%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="40%" stopColor="#000000" stopOpacity="0" />
          <stop offset="75%" stopColor="#000000" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.95" />
        </radialGradient>
      </defs>

      {/* ============================================================ */}
      {/* 1. EMBRYO / THE FIRST SPARK (2020)                          */}
      {/* ============================================================ */}
      {planetType === "embryo" && (
        <g>
          {/* Atmospheric Haze */}
          <circle cx="0" cy="0" r="46" fill="rgba(245,158,11,0.18)" filter={`url(#${id}-glow)`} />

          {/* Main Spherical Core */}
          <circle cx="0" cy="0" r="42" fill={`url(#${id}-magma)`} />

          {/* Surface Tectonic Crust Swirls */}
          <path
            d="M -30 -12 Q -10 -25 15 -18 Q 30 -12 38 0 Q 30 14 10 18 Q -15 22 -32 8 Z"
            fill="#2D0D0D"
            opacity="0.65"
          />
          <path
            d="M -22 10 Q 0 4 18 16 Q 28 24 22 32 Q 5 36 -14 30 Z"
            fill="#1E0707"
            opacity="0.7"
          />
          {/* Glowing Magma Fissures */}
          <path
            d="M -28 -10 Q -8 -20 16 -16 Q 28 -8 34 2"
            fill="none"
            stroke="#FDE047"
            strokeWidth="1.2"
            opacity="0.8"
          />
          <path
            d="M -18 12 Q 2 6 16 18"
            fill="none"
            stroke="#F97316"
            strokeWidth="1"
            opacity="0.7"
          />

          {/* Spherical Shadow Overlay */}
          <circle cx="0" cy="0" r="42" fill="url(#sphere-shadow)" />

          {/* Soft Atmospheric Rim Shell */}
          <circle cx="0" cy="0" r="42" fill="none" stroke="#FDE68A" strokeWidth="1" opacity="0.6" />
        </g>
      )}

      {/* ============================================================ */}
      {/* 2. OCEANIC / BUILDING THE ECOSYSTEM (2021)                   */}
      {/* ============================================================ */}
      {planetType === "oceanic" && (
        <g>
          {/* Atmospheric Rayleigh Scattering Shell */}
          <circle cx="0" cy="0" r="46" fill="rgba(56,189,248,0.2)" filter={`url(#${id}-glow)`} />

          {/* Deep Sapphire Ocean Sphere */}
          <circle cx="0" cy="0" r="42" fill={`url(#${id}-ocean)`} />

          {/* Continental Landmass Shelves */}
          <path
            d="M -32 -8 Q -18 -26 6 -20 Q 24 -14 34 2 Q 22 18 6 14 Q -16 10 -30 2 Z"
            fill="#065F46"
            opacity="0.55"
          />
          <path
            d="M -18 14 Q 0 8 16 20 Q 24 28 14 34 Q -4 34 -18 24 Z"
            fill="#047857"
            opacity="0.5"
          />

          {/* Swirling Cyclonic Cloud Belts */}
          <path
            d="M -36 4 Q -12 -12 18 -6 Q 36 0 38 12 Q 20 6 -8 8 Z"
            fill={`url(#${id}-clouds)`}
          />
          <path
            d="M -24 -20 Q 0 -16 22 -24 Q 10 -30 -12 -28 Z"
            fill={`url(#${id}-clouds)`}
          />

          {/* Night-Side Technological City Nodes */}
          <circle cx="16" cy="22" r="1" fill="#FDE047" opacity="0.9" />
          <circle cx="22" cy="18" r="0.8" fill="#FDE047" opacity="0.85" />
          <circle cx="28" cy="24" r="1.2" fill="#FDE047" opacity="0.95" />

          {/* Spherical Shadow Overlay */}
          <circle cx="0" cy="0" r="42" fill="url(#sphere-shadow)" />

          {/* Luminous Atmospheric Edge */}
          <circle cx="0" cy="0" r="42" fill="none" stroke="#7DD3FC" strokeWidth="1" opacity="0.75" />
        </g>
      )}

      {/* ============================================================ */}
      {/* 3. NEXUS / EXPANDING HORIZONS (2022)                         */}
      {/* ============================================================ */}
      {planetType === "nexus" && (
        <g>
          {/* Emerald Atmospheric Halo */}
          <circle cx="0" cy="0" r="46" fill="rgba(45,212,191,0.22)" filter={`url(#${id}-glow)`} />

          {/* Main Sphere Body */}
          <circle cx="0" cy="0" r="42" fill={`url(#${id}-nexus)`} />

          {/* Coordinate Data Grid Corridors */}
          <g opacity="0.5">
            <ellipse cx="0" cy="0" rx="38" ry="18" fill="none" stroke="#A7F3D0" strokeWidth="0.8" strokeDasharray="3 3" />
            <ellipse cx="0" cy="0" rx="18" ry="38" fill="none" stroke="#A7F3D0" strokeWidth="0.8" strokeDasharray="3 3" />
            <circle cx="0" cy="0" r="28" fill="none" stroke="#6EE7B7" strokeWidth="0.6" strokeDasharray="2 4" />
          </g>

          {/* Quantum Matrix Telemetry Hubs */}
          <circle cx="-16" cy="-14" r="2" fill="#ECFDF5" />
          <circle cx="14" cy="-8" r="1.8" fill="#ECFDF5" />
          <circle cx="6" cy="18" r="2.2" fill="#ECFDF5" />
          <line x1="-16" y1="-14" x2="14" y2="-8" stroke="#A7F3D0" strokeWidth="0.7" opacity="0.7" />
          <line x1="14" y1="-8" x2="6" y2="18" stroke="#A7F3D0" strokeWidth="0.7" opacity="0.7" />

          {/* Spherical Shadow Overlay */}
          <circle cx="0" cy="0" r="42" fill="url(#sphere-shadow)" />

          {/* Specular Edge Ring */}
          <circle cx="0" cy="0" r="42" fill="none" stroke="#6EE7B7" strokeWidth="1" opacity="0.8" />
        </g>
      )}

      {/* ============================================================ */}
      {/* 4. GAS GIANT / FROM IDEAS TO IMPACT (2023) - 3D SPATIAL RINGS */}
      {/* ============================================================ */}
      {planetType === "gas_giant" && (
        <g>
          {/* LAYER 1: Back Half of Orbital Ring System (Behind the planet) */}
          <g transform="rotate(-22)">
            <ellipse
              cx="0"
              cy="0"
              rx="68"
              ry="20"
              fill="none"
              stroke={`url(#${id}-rings)`}
              strokeWidth="10"
              opacity="0.8"
            />
            {/* Cassini Division Gap */}
            <ellipse
              cx="0"
              cy="0"
              rx="68"
              ry="20"
              fill="none"
              stroke="#080A0F"
              strokeWidth="1.5"
              opacity="0.9"
            />
          </g>

          {/* Atmospheric Outer Glow */}
          <circle cx="0" cy="0" r="44" fill="rgba(168,85,247,0.22)" filter={`url(#${id}-glow)`} />

          {/* LAYER 2: Jovian Gas Giant Spherical Body */}
          <circle cx="0" cy="0" r="38" fill={`url(#${id}-gas)`} />

          {/* Stratified Atmospheric Jet-Stream Bands */}
          <clipPath id={`${id}-body-clip`}>
            <circle cx="0" cy="0" r="38" />
          </clipPath>

          <g clipPath={`url(#${id}-body-clip)`}>
            <rect x="-40" y="-24" width="80" height="6" fill="#7C3AED" opacity="0.4" />
            <rect x="-40" y="-12" width="80" height="9" fill="#581C87" opacity="0.6" />
            <rect x="-40" y="4" width="80" height="7" fill="#4C1D95" opacity="0.5" />
            <rect x="-40" y="16" width="80" height="8" fill="#3B0764" opacity="0.7" />

            {/* Great Storm Vortex */}
            <ellipse cx="-12" cy="8" rx="8" ry="4" fill="#C084FC" opacity="0.6" />
          </g>

          {/* Planet Body Casts Deep Shadow Across Rear Ring */}
          <circle cx="0" cy="0" r="38" fill="url(#sphere-shadow)" />

          {/* LAYER 3: Front Half of Orbital Ring System (In Front of the planet) */}
          <g transform="rotate(-22)">
            {/* Clip so only the lower/front half of the ring renders over the sphere */}
            <clipPath id={`${id}-front-ring-clip`}>
              <rect x="-80" y="0" width="160" height="80" />
            </clipPath>
            <ellipse
              cx="0"
              cy="0"
              rx="68"
              ry="20"
              fill="none"
              stroke={`url(#${id}-rings)`}
              strokeWidth="10"
              clipPath={`url(#${id}-front-ring-clip)`}
              opacity="0.85"
            />
            {/* Cassini Gap on Front Ring */}
            <ellipse
              cx="0"
              cy="0"
              rx="68"
              ry="20"
              fill="none"
              stroke="#080A0F"
              strokeWidth="1.5"
              clipPath={`url(#${id}-front-ring-clip)`}
              opacity="0.9"
            />
          </g>

          {/* Atmospheric Edge Rim */}
          <circle cx="0" cy="0" r="38" fill="none" stroke="#D8B4FE" strokeWidth="1" opacity="0.7" />
        </g>
      )}

      {/* ============================================================ */}
      {/* 5. RADIANT / A BRIGHTER TOMORROW (2024 & BEYOND)            */}
      {/* ============================================================ */}
      {planetType === "radiant" && (
        <g>
          {/* Luminous Starburst Corona */}
          <circle cx="0" cy="0" r="48" fill="rgba(56,189,248,0.28)" filter={`url(#${id}-glow)`} />

          {/* Dual Tilted Crystalline Halos */}
          <ellipse
            cx="0"
            cy="0"
            rx="66"
            ry="18"
            transform="rotate(20)"
            fill="none"
            stroke="#7DD3FC"
            strokeWidth="1.2"
            opacity="0.75"
          />
          <ellipse
            cx="0"
            cy="0"
            rx="64"
            ry="16"
            transform="rotate(-30)"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="0.8"
            strokeDasharray="4 4"
            opacity="0.6"
          />

          {/* Radiant Fusion Core Sphere */}
          <circle cx="0" cy="0" r="42" fill={`url(#${id}-radiant)`} />

          {/* Starburst Specular Flare Points */}
          <circle cx="-12" cy="-14" r="5" fill="#FFFFFF" opacity="0.8" filter={`url(#${id}-glow)`} />
          <circle cx="-12" cy="-14" r="2" fill="#FFFFFF" />

          {/* Spherical Shadow Overlay */}
          <circle cx="0" cy="0" r="42" fill="url(#sphere-shadow)" opacity="0.8" />

          {/* Pure Brilliant Rim Line */}
          <circle cx="0" cy="0" r="42" fill="none" stroke="#E0F2FE" strokeWidth="1.2" opacity="0.9" />
        </g>
      )}
    </svg>
  );
}
