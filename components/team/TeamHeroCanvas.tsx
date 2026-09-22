"use client";

import React, { useEffect, useRef } from "react";

interface NightStar {
  x: number;
  y: number;
  baseRadius: number;
  minAlpha: number;
  peakAlpha: number;
  rgb: string;
  group: "stable" | "twinkle" | "accent";
  cycleDuration: number;
  delay: number;
  phase: number;
  harmonicSpeed: number;
}

interface ConstellationStar {
  name: string;
  nx: number;
  ny: number;
  radius: number;
  rgb: string;
  isAnchor?: boolean;
}

interface ConstellationEdge {
  from: string;
  to: string;
  dashed?: boolean;
}

interface RealConstellation {
  name: string;
  stars: ConstellationStar[];
  edges: ConstellationEdge[];
}

/**
 * 1. HERO SECTION CONSTELLATIONS:
 *    - Ursa Major (Big Dipper) + Polaris pointer (Upper Right)
 *    - Cassiopeia (Upper Left)
 *    - Lyra with Vega (Upper Mid-Left)
 *    - Orion (The Hunter with Belt & Rigel/Betelgeuse) (Lower Left)
 *    - Cygnus (The Northern Cross) (Lower Right)
 */
const HERO_CONSTELLATIONS: RealConstellation[] = [
  {
    name: "URSA MAJOR",
    stars: [
      { name: "Dubhe", nx: 0.78, ny: 0.18, radius: 2.7, rgb: "245, 247, 250", isAnchor: true },
      { name: "Merak", nx: 0.76, ny: 0.32, radius: 2.4, rgb: "56, 189, 248", isAnchor: true },
      { name: "Phecda", nx: 0.68, ny: 0.30, radius: 2.2, rgb: "96, 165, 250" },
      { name: "Megrez", nx: 0.70, ny: 0.17, radius: 2.0, rgb: "245, 247, 250" },
      { name: "Alioth", nx: 0.63, ny: 0.14, radius: 2.5, rgb: "56, 189, 248", isAnchor: true },
      { name: "Mizar", nx: 0.57, ny: 0.10, radius: 2.3, rgb: "245, 247, 250" },
      { name: "Alkaid", nx: 0.51, ny: 0.13, radius: 2.4, rgb: "56, 189, 248", isAnchor: true },
      { name: "Polaris", nx: 0.82, ny: 0.05, radius: 3.0, rgb: "245, 247, 250", isAnchor: true },
    ],
    edges: [
      { from: "Dubhe", to: "Merak" },
      { from: "Merak", to: "Phecda" },
      { from: "Phecda", to: "Megrez" },
      { from: "Megrez", to: "Dubhe" },
      { from: "Megrez", to: "Alioth" },
      { from: "Alioth", to: "Mizar" },
      { from: "Mizar", to: "Alkaid" },
      { from: "Dubhe", to: "Polaris", dashed: true },
    ],
  },
  {
    name: "CASSIOPEIA",
    stars: [
      { name: "Segin", nx: 0.08, ny: 0.15, radius: 2.2, rgb: "96, 165, 250" },
      { name: "Ruchbah", nx: 0.12, ny: 0.23, radius: 2.3, rgb: "56, 189, 248" },
      { name: "Navi", nx: 0.17, ny: 0.17, radius: 2.8, rgb: "245, 247, 250", isAnchor: true },
      { name: "Schedar", nx: 0.21, ny: 0.24, radius: 2.6, rgb: "56, 189, 248", isAnchor: true },
      { name: "Caph", nx: 0.25, ny: 0.18, radius: 2.4, rgb: "245, 247, 250" },
    ],
    edges: [
      { from: "Segin", to: "Ruchbah" },
      { from: "Ruchbah", to: "Navi" },
      { from: "Navi", to: "Schedar" },
      { from: "Schedar", to: "Caph" },
    ],
  },
  {
    name: "LYRA",
    stars: [
      { name: "Vega", nx: 0.36, ny: 0.11, radius: 3.2, rgb: "245, 247, 250", isAnchor: true },
      { name: "Epsilon", nx: 0.38, ny: 0.07, radius: 1.8, rgb: "96, 165, 250" },
      { name: "Zeta", nx: 0.40, ny: 0.12, radius: 1.9, rgb: "56, 189, 248" },
      { name: "Sheliak", nx: 0.42, ny: 0.17, radius: 2.2, rgb: "245, 247, 250" },
      { name: "Sulafat", nx: 0.39, ny: 0.19, radius: 2.1, rgb: "96, 165, 250" },
    ],
    edges: [
      { from: "Vega", to: "Epsilon" },
      { from: "Epsilon", to: "Zeta" },
      { from: "Zeta", to: "Sheliak" },
      { from: "Sheliak", to: "Sulafat" },
      { from: "Sulafat", to: "Zeta" },
      { from: "Vega", to: "Zeta" },
    ],
  },
  {
    name: "ORION",
    stars: [
      { name: "Betelgeuse", nx: 0.09, ny: 0.58, radius: 3.0, rgb: "245, 247, 250", isAnchor: true },
      { name: "Bellatrix", nx: 0.18, ny: 0.55, radius: 2.6, rgb: "56, 189, 248", isAnchor: true },
      { name: "Mintaka", nx: 0.16, ny: 0.67, radius: 2.3, rgb: "245, 247, 250" },
      { name: "Alnilam", nx: 0.14, ny: 0.69, radius: 2.4, rgb: "56, 189, 248", isAnchor: true },
      { name: "Alnitak", nx: 0.12, ny: 0.71, radius: 2.3, rgb: "96, 165, 250" },
      { name: "Saiph", nx: 0.10, ny: 0.83, radius: 2.5, rgb: "245, 247, 250" },
      { name: "Rigel", nx: 0.19, ny: 0.81, radius: 3.1, rgb: "56, 189, 248", isAnchor: true },
    ],
    edges: [
      { from: "Betelgeuse", to: "Bellatrix" },
      { from: "Betelgeuse", to: "Alnitak" },
      { from: "Bellatrix", to: "Mintaka" },
      { from: "Mintaka", to: "Alnilam" },
      { from: "Alnilam", to: "Alnitak" },
      { from: "Alnitak", to: "Saiph" },
      { from: "Mintaka", to: "Rigel" },
      { from: "Saiph", to: "Rigel" },
    ],
  },
  {
    name: "CYGNUS",
    stars: [
      { name: "Deneb", nx: 0.84, ny: 0.56, radius: 3.0, rgb: "245, 247, 250", isAnchor: true },
      { name: "Sadr", nx: 0.86, ny: 0.68, radius: 2.6, rgb: "56, 189, 248", isAnchor: true },
      { name: "Albireo", nx: 0.88, ny: 0.84, radius: 2.3, rgb: "96, 165, 250" },
      { name: "DeltaCyg", nx: 0.77, ny: 0.65, radius: 2.2, rgb: "245, 247, 250" },
      { name: "Gienah", nx: 0.94, ny: 0.72, radius: 2.4, rgb: "56, 189, 248" },
    ],
    edges: [
      { from: "Deneb", to: "Sadr" },
      { from: "Sadr", to: "Albireo" },
      { from: "DeltaCyg", to: "Sadr" },
      { from: "Sadr", to: "Gienah" },
    ],
  },
];

/**
 * 2. STUDENT INITIATIVE TEAM CONSTELLATIONS:
 *    - Pegasus (Great Square)
 *    - Taurus & Pleiades Cluster
 *    - Aquila with Altair
 */
const STUDENT_CONSTELLATIONS: RealConstellation[] = [
  {
    name: "PEGASUS",
    stars: [
      { name: "Scheat", nx: 0.10, ny: 0.20, radius: 2.6, rgb: "245, 247, 250", isAnchor: true },
      { name: "Markab", nx: 0.11, ny: 0.44, radius: 2.5, rgb: "56, 189, 248" },
      { name: "Algenib", nx: 0.22, ny: 0.48, radius: 2.3, rgb: "96, 165, 250" },
      { name: "Alpheratz", nx: 0.21, ny: 0.22, radius: 2.7, rgb: "245, 247, 250", isAnchor: true },
    ],
    edges: [
      { from: "Scheat", to: "Markab" },
      { from: "Markab", to: "Algenib" },
      { from: "Algenib", to: "Alpheratz" },
      { from: "Alpheratz", to: "Scheat" },
    ],
  },
  {
    name: "AQUILA",
    stars: [
      { name: "Altair", nx: 0.50, ny: 0.15, radius: 3.0, rgb: "245, 247, 250", isAnchor: true },
      { name: "Tarazed", nx: 0.48, ny: 0.10, radius: 2.1, rgb: "56, 189, 248" },
      { name: "Alshain", nx: 0.52, ny: 0.20, radius: 2.0, rgb: "96, 165, 250" },
    ],
    edges: [
      { from: "Tarazed", to: "Altair" },
      { from: "Altair", to: "Alshain" },
    ],
  },
  {
    name: "TAURUS",
    stars: [
      { name: "Aldebaran", nx: 0.88, ny: 0.26, radius: 3.1, rgb: "245, 247, 250", isAnchor: true },
      { name: "Ain", nx: 0.85, ny: 0.20, radius: 2.2, rgb: "56, 189, 248" },
      { name: "Hyadum", nx: 0.81, ny: 0.22, radius: 2.0, rgb: "96, 165, 250" },
      { name: "Elnath", nx: 0.82, ny: 0.08, radius: 2.5, rgb: "245, 247, 250" },
      { name: "Tianguan", nx: 0.94, ny: 0.16, radius: 2.2, rgb: "56, 189, 248" },
      { name: "Pleiades1", nx: 0.74, ny: 0.14, radius: 2.2, rgb: "245, 247, 250", isAnchor: true },
      { name: "Pleiades2", nx: 0.75, ny: 0.16, radius: 1.8, rgb: "56, 189, 248" },
    ],
    edges: [
      { from: "Aldebaran", to: "Ain" },
      { from: "Ain", to: "Hyadum" },
      { from: "Ain", to: "Elnath" },
      { from: "Aldebaran", to: "Tianguan" },
      { from: "Pleiades1", to: "Pleiades2", dashed: true },
    ],
  },
];

/**
 * 3. FACULTY MENTORS & ADVISORY CONSTELLATIONS:
 *    - Leo (The Lion with Regulus)
 *    - Canis Major (with Sirius — brightest star)
 *    - Corona Borealis (Northern Crown)
 */
const FACULTY_CONSTELLATIONS: RealConstellation[] = [
  {
    name: "LEO",
    stars: [
      { name: "Regulus", nx: 0.12, ny: 0.42, radius: 3.0, rgb: "245, 247, 250", isAnchor: true },
      { name: "Algieba", nx: 0.14, ny: 0.26, radius: 2.4, rgb: "56, 189, 248" },
      { name: "Adhafera", nx: 0.18, ny: 0.18, radius: 2.1, rgb: "96, 165, 250" },
      { name: "RasElased", nx: 0.15, ny: 0.14, radius: 2.2, rgb: "245, 247, 250" },
      { name: "Zosma", nx: 0.24, ny: 0.22, radius: 2.3, rgb: "56, 189, 248" },
      { name: "Denebola", nx: 0.28, ny: 0.32, radius: 2.6, rgb: "245, 247, 250", isAnchor: true },
      { name: "Chertan", nx: 0.21, ny: 0.36, radius: 2.1, rgb: "96, 165, 250" },
    ],
    edges: [
      { from: "Regulus", to: "Algieba" },
      { from: "Algieba", to: "Adhafera" },
      { from: "Adhafera", to: "RasElased" },
      { from: "Algieba", to: "Zosma" },
      { from: "Zosma", to: "Denebola" },
      { from: "Denebola", to: "Chertan" },
      { from: "Chertan", to: "Regulus" },
    ],
  },
  {
    name: "CORONA BOREALIS",
    stars: [
      { name: "Alphecca", nx: 0.50, ny: 0.14, radius: 2.8, rgb: "245, 247, 250", isAnchor: true },
      { name: "Nusakan", nx: 0.46, ny: 0.17, radius: 2.0, rgb: "56, 189, 248" },
      { name: "ThetaCor", nx: 0.43, ny: 0.22, radius: 1.8, rgb: "96, 165, 250" },
      { name: "GammaCor", nx: 0.54, ny: 0.16, radius: 2.0, rgb: "56, 189, 248" },
      { name: "DeltaCor", nx: 0.57, ny: 0.21, radius: 1.8, rgb: "96, 165, 250" },
    ],
    edges: [
      { from: "ThetaCor", to: "Nusakan" },
      { from: "Nusakan", to: "Alphecca" },
      { from: "Alphecca", to: "GammaCor" },
      { from: "GammaCor", to: "DeltaCor" },
    ],
  },
  {
    name: "CANIS MAJOR",
    stars: [
      { name: "Sirius", nx: 0.85, ny: 0.24, radius: 3.4, rgb: "245, 247, 250", isAnchor: true },
      { name: "Murzim", nx: 0.79, ny: 0.26, radius: 2.3, rgb: "56, 189, 248" },
      { name: "Muliphein", nx: 0.88, ny: 0.18, radius: 1.9, rgb: "96, 165, 250" },
      { name: "Wezen", nx: 0.86, ny: 0.42, radius: 2.5, rgb: "56, 189, 248" },
      { name: "Adhara", nx: 0.82, ny: 0.46, radius: 2.6, rgb: "245, 247, 250", isAnchor: true },
      { name: "Aludra", nx: 0.90, ny: 0.48, radius: 2.2, rgb: "96, 165, 250" },
    ],
    edges: [
      { from: "Sirius", to: "Murzim" },
      { from: "Sirius", to: "Muliphein" },
      { from: "Sirius", to: "Wezen" },
      { from: "Wezen", to: "Adhara" },
      { from: "Wezen", to: "Aludra" },
    ],
  },
];

/**
 * 4. COLLABORATIONS HERO CONSTELLATIONS:
 *    - Gemini (The Twins — Castor & Pollux symbolizing cosmic partnership & alliance)
 *    - Bootes (The Celestial Kite anchored by radiant Arcturus)
 */
const COLLABORATIONS_CONSTELLATIONS: RealConstellation[] = [
  {
    name: "GEMINI",
    stars: [
      { name: "Castor", nx: 0.14, ny: 0.20, radius: 2.8, rgb: "245, 247, 250", isAnchor: true },
      { name: "Pollux", nx: 0.19, ny: 0.24, radius: 3.1, rgb: "56, 189, 248", isAnchor: true },
      { name: "Wasat", nx: 0.16, ny: 0.36, radius: 2.2, rgb: "96, 165, 250" },
      { name: "Mebsuta", nx: 0.10, ny: 0.32, radius: 2.1, rgb: "245, 247, 250" },
      { name: "Tejat", nx: 0.08, ny: 0.44, radius: 2.0, rgb: "96, 165, 250" },
      { name: "Alhena", nx: 0.13, ny: 0.50, radius: 2.6, rgb: "56, 189, 248", isAnchor: true },
    ],
    edges: [
      { from: "Castor", to: "Pollux" },
      { from: "Castor", to: "Mebsuta" },
      { from: "Mebsuta", to: "Tejat" },
      { from: "Tejat", to: "Alhena" },
      { from: "Pollux", to: "Wasat" },
      { from: "Wasat", to: "Alhena" },
    ],
  },
  {
    name: "BOOTES",
    stars: [
      { name: "Arcturus", nx: 0.84, ny: 0.44, radius: 3.4, rgb: "245, 247, 250", isAnchor: true },
      { name: "Muphrid", nx: 0.76, ny: 0.46, radius: 2.2, rgb: "96, 165, 250" },
      { name: "Izar", nx: 0.82, ny: 0.32, radius: 2.6, rgb: "56, 189, 248", isAnchor: true },
      { name: "Seginus", nx: 0.78, ny: 0.20, radius: 2.3, rgb: "245, 247, 250" },
      { name: "Nekkar", nx: 0.86, ny: 0.16, radius: 2.4, rgb: "56, 189, 248" },
      { name: "DeltaBoo", nx: 0.88, ny: 0.26, radius: 2.1, rgb: "96, 165, 250" },
    ],
    edges: [
      { from: "Arcturus", to: "Muphrid" },
      { from: "Arcturus", to: "Izar" },
      { from: "Izar", to: "Seginus" },
      { from: "Seginus", to: "Nekkar" },
      { from: "Nekkar", to: "DeltaBoo" },
      { from: "DeltaBoo", to: "Izar" },
    ],
  },
];

/**
 * Optical 4-point diamond sparkle drawing function.
 * Creates a soft radiant lens-flare bloom with graceful concave curved waist.
 * Replaces the rigid mechanical plus-sign.
 */
function drawDiamondSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rgb: string,
  alpha: number
) {
  const arm = radius * 3.2;
  const waist = arm * 0.14;

  ctx.save();

  // 1. Soft radial bloom aura
  const glowRadius = radius * 3.6;
  const bloomGrad = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
  bloomGrad.addColorStop(0, `rgba(${rgb}, ${alpha * 0.65})`);
  bloomGrad.addColorStop(0.35, `rgba(56, 189, 248, ${alpha * 0.25})`);
  bloomGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = bloomGrad;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();

  // 2. Tapered 4-point curved diamond flare path
  ctx.beginPath();
  ctx.moveTo(x, y - arm);
  ctx.quadraticCurveTo(x + waist, y - waist, x + arm, y);
  ctx.quadraticCurveTo(x + waist, y + waist, x, y + arm);
  ctx.quadraticCurveTo(x - waist, y + waist, x - arm, y);
  ctx.quadraticCurveTo(x - waist, y - waist, x, y - arm);
  ctx.closePath();

  const diamondGrad = ctx.createRadialGradient(x, y, 0, x, y, arm);
  diamondGrad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, alpha * 0.95)})`);
  diamondGrad.addColorStop(0.25, `rgba(${rgb}, ${alpha * 0.70})`);
  diamondGrad.addColorStop(0.7, `rgba(56, 189, 248, ${alpha * 0.25})`);
  diamondGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

  ctx.fillStyle = diamondGrad;
  ctx.fill();

  // 3. Radiant central core
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.85, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha * 0.95)})`;
  ctx.fill();

  ctx.restore();
}

export interface TeamHeroCanvasProps {
  section?: "hero" | "student" | "faculty" | "collaborations";
  variant?: "hero" | "wash";
  className?: string;
}

export function TeamHeroCanvas({
  section = "hero",
  variant = "hero",
  className,
}: TeamHeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let isVisible = true;
    let isTabActive = true;
    let width = 0;
    let height = 0;
    let stars: NightStar[] = [];

    const isWash = variant === "wash";
    const opacityMultiplier = isWash ? 0.52 : 1.0;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const initCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;

      if (width === 0 || height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Star density based on mode:
      // Hero: 540 (desktop), 330 (tablet), 200 (mobile)
      // Wash: 240 (desktop), 160 (tablet), 100 (mobile)
      const count = isWash
        ? (width >= 1024 ? 240 : width >= 768 ? 160 : 100)
        : (width >= 1024 ? 540 : width >= 768 ? 330 : 200);

      stars = [];

      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;

        const groupRand = Math.random();
        let group: "stable" | "twinkle" | "accent";
        let baseRadius: number;
        let minAlpha: number;
        let peakAlpha: number;

        if (groupRand < 0.47) {
          group = "stable";
          const sizeRand = Math.random();
          if (sizeRand < 0.75) {
            baseRadius = 0.75 + Math.random() * 0.40;
            minAlpha = (0.42 + Math.random() * 0.14) * opacityMultiplier;
          } else {
            baseRadius = 1.25 + Math.random() * 0.45;
            minAlpha = (0.54 + Math.random() * 0.12) * opacityMultiplier;
          }
          peakAlpha = minAlpha;
        } else if (groupRand < 0.92) {
          group = "twinkle";
          const sizeRand = Math.random();
          if (sizeRand < 0.65) {
            baseRadius = 0.85 + Math.random() * 0.40;
          } else {
            baseRadius = 1.35 + Math.random() * 0.65;
          }
          minAlpha = (0.26 + Math.random() * 0.10) * opacityMultiplier;
          peakAlpha = (0.78 + Math.random() * 0.10) * opacityMultiplier;
        } else {
          group = "accent";
          baseRadius = isWash ? (2.0 + Math.random() * 0.6) : (2.40 + Math.random() * 0.90);
          minAlpha = (0.46 + Math.random() * 0.10) * opacityMultiplier;
          peakAlpha = (0.94 + Math.random() * 0.06) * opacityMultiplier;
        }

        const colorRand = Math.random();
        let rgb: string;
        if (colorRand < 0.80) {
          rgb = "245, 247, 250";
        } else if (colorRand < 0.92) {
          rgb = "96, 165, 250";
        } else {
          rgb = "56, 189, 248";
        }

        const cycleDuration = 1.8 + Math.random() * 2.4;
        const delay = 0.1 + Math.random() * 7.5;
        const phase = Math.random() * Math.PI * 2;
        const harmonicSpeed = 0.45 + Math.random() * 0.45;

        stars.push({
          x,
          y,
          baseRadius,
          minAlpha,
          peakAlpha,
          rgb,
          group,
          cycleDuration,
          delay,
          phase,
          harmonicSpeed,
        });
      }
    };

    initCanvas();

    const resizeObserver = new ResizeObserver(() => {
      initCanvas();
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && isTabActive && !animId && !prefersReducedMotion) {
            animId = requestAnimationFrame(render);
          }
        });
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(canvas);

    const handleVisibilityChange = () => {
      isTabActive = !document.hidden;
      if (isVisible && isTabActive && !animId && !prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // ── Render Frame ────────────────────────────────────────────────────────
    const render = (timeMs: number) => {
      if (!isVisible || !isTabActive) {
        animId = 0;
        return;
      }
      if (width === 0 || height === 0) return;

      ctx.clearRect(0, 0, width, height);
      const timeSec = timeMs * 0.001;

      // Select constellation set for the current section
      const constellations =
        section === "student"
          ? STUDENT_CONSTELLATIONS
          : section === "faculty"
          ? FACULTY_CONSTELLATIONS
          : section === "collaborations"
          ? COLLABORATIONS_CONSTELLATIONS
          : HERO_CONSTELLATIONS;

      const isMobile = width < 640;
      // On mobile limit constellations to preserve breathing room
      const activeConstellations =
        isMobile && section === "hero"
          ? [HERO_CONSTELLATIONS[0], HERO_CONSTELLATIONS[1]]
          : isMobile && section === "collaborations"
          ? [COLLABORATIONS_CONSTELLATIONS[0]] // Gemini only on mobile
          : constellations;

      // 1. Draw Real Constellations Connecting Lines
      const lineAlphaBase = isWash ? 0.16 : 0.30;

      for (const constel of activeConstellations) {
        const starMap = new Map<string, { x: number; y: number }>();
        for (const s of constel.stars) {
          starMap.set(s.name, { x: s.nx * width, y: s.ny * height });
        }

        for (const edge of constel.edges) {
          const p1 = starMap.get(edge.from);
          const p2 = starMap.get(edge.to);
          if (!p1 || !p2) continue;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);

          if (edge.dashed) {
            ctx.setLineDash([3, 6]);
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlphaBase * 0.65})`;
            ctx.lineWidth = 0.8;
          } else {
            ctx.setLineDash([]);
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlphaBase})`;
            ctx.lineWidth = 0.9;
          }
          ctx.stroke();
          ctx.restore();
        }

        // Draw Constellation Star Nodes
        for (const star of constel.stars) {
          const pt = starMap.get(star.name);
          if (!pt) continue;

          let pulseFactor = 1.0;
          let nodeAlpha = (isWash ? 0.60 : 0.90);
          if (!prefersReducedMotion) {
            const wave = Math.sin(timeSec * 1.8 + pt.x * 0.01);
            pulseFactor = 1.0 + 0.25 * wave;
            nodeAlpha = (isWash ? 0.50 : 0.75) + 0.25 * wave * opacityMultiplier;
          }

          const currentRadius = star.radius * pulseFactor;

          if (star.isAnchor) {
            drawDiamondSparkle(ctx, pt.x, pt.y, currentRadius, star.rgb, nodeAlpha);
          } else {
            // Soft halo
            const haloRadius = currentRadius * 3.0;
            const haloGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, haloRadius);
            haloGrad.addColorStop(0, `rgba(${star.rgb}, ${nodeAlpha * 0.40})`);
            haloGrad.addColorStop(0.5, `rgba(56, 189, 248, ${nodeAlpha * 0.15})`);
            haloGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
            ctx.fillStyle = haloGrad;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, haloRadius, 0, Math.PI * 2);
            ctx.fill();

            // Star Core
            ctx.fillStyle = `rgba(${star.rgb}, ${nodeAlpha})`;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 2. Draw Dense Background Starfield
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        let alpha = star.minAlpha;
        let radius = star.baseRadius;

        if (star.group === "stable") {
          alpha = star.minAlpha;
          radius = star.baseRadius;
        } else if (!prefersReducedMotion) {
          const t = timeSec + star.delay;
          const mainWave = Math.sin(t * (2 * Math.PI / star.cycleDuration) + star.phase);
          const secondaryWave = Math.sin(t * star.harmonicSpeed + star.phase * 1.5) * 0.18;
          const combined = Math.max(-1, Math.min(1, mainWave + secondaryWave));
          const factor = (combined + 1) * 0.5;

          alpha = star.minAlpha + (star.peakAlpha - star.minAlpha) * factor;

          if (star.group === "accent") {
            radius = star.baseRadius * (1.0 + 0.28 * factor);
          } else {
            radius = star.baseRadius * (1.0 + 0.35 * factor);
          }
        } else {
          alpha = (star.minAlpha + star.peakAlpha) * 0.5;
          radius = star.baseRadius;
        }

        if (star.group === "accent") {
          drawDiamondSparkle(ctx, star.x, star.y, radius, star.rgb, alpha);
        } else if (star.baseRadius > 1.5) {
          const glowRadius = radius * 1.7;
          const grad = ctx.createRadialGradient(
            star.x,
            star.y,
            0,
            star.x,
            star.y,
            glowRadius
          );
          grad.addColorStop(0, `rgba(${star.rgb}, ${alpha})`);
          grad.addColorStop(0.45, `rgba(${star.rgb}, ${alpha * 0.45})`);
          grad.addColorStop(1, `rgba(${star.rgb}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = `rgba(${star.rgb}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(${star.rgb}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    if (prefersReducedMotion) {
      render(0);
    } else {
      animId = requestAnimationFrame(render);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [section, variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className || ""}`}
    />
  );
}
