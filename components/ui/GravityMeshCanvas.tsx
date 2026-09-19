"use client";

import React, { useRef, useEffect } from "react";

interface GravityMeshCanvasProps {
  /** Optional custom cell spacing */
  gridStep?: number;
  /** Optional custom influence radius in pixels (default 160) */
  influenceRadius?: number;
  /** Optional displacement strength in pixels (default 13) */
  maxDisplacement?: number;
  /** Optional class name */
  className?: string;
}

/**
 * Technical Gravity Mesh Canvas:
 * - A flexible spatial coordinate grid on #080A0F.
 * - The mouse cursor acts as a small physical weight.
 * - Nearby grid lines curve smoothly toward the cursor and intersect locally.
 * - Crucially: DOES NOT create a deep funnel or black hole; the grid remains recognizable.
 * - Under subtle tension, lines transition from dark slate/blue-gray to #2563EB / #38BDF8.
 * - Intersecting vertices near the cursor highlight gently with micro-nodes.
 * - When idle, a gentle organic wave breathes through the surface.
 * - Pauses rendering via IntersectionObserver when scrolled off-screen.
 * - Respects prefers-reduced-motion.
 */
export function GravityMeshCanvas({
  gridStep = 44,
  influenceRadius = 165,
  maxDisplacement = 13,
  className = "",
}: GravityMeshCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isVisibleRef = useRef<boolean>(true);
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });
  const lerpPointerRef = useRef<{ x: number; y: number }>({
    x: -1000,
    y: -1000,
  });

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

    // Pause animation when offscreen
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
      if (!isVisibleRef.current) return;
      if (width === 0 || height === 0) return;

      ctx.clearRect(0, 0, width, height);

      // Smooth lerp to pointer position (500-800ms settling time)
      if (pointerRef.current.active) {
        lerpPointerRef.current.x +=
          (pointerRef.current.x - lerpPointerRef.current.x) * 0.11;
        lerpPointerRef.current.y +=
          (pointerRef.current.y - lerpPointerRef.current.y) * 0.11;
      } else {
        // Calm ambient drift in right portion when idle
        const idleX = width * 0.7 + Math.sin(time * 0.0006) * 35;
        const idleY = height * 0.5 + Math.cos(time * 0.0005) * 25;
        lerpPointerRef.current.x += (idleX - lerpPointerRef.current.x) * 0.025;
        lerpPointerRef.current.y += (idleY - lerpPointerRef.current.y) * 0.025;
      }

      const pX = lerpPointerRef.current.x;
      const pY = lerpPointerRef.current.y;

      const cols = Math.ceil(width / gridStep) + 1;
      const rows = Math.ceil(height / gridStep) + 1;

      // Compute deformed grid coordinates
      const grid: {
        x: number;
        y: number;
        tension: number;
      }[][] = [];

      for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let c = 0; c < cols; c++) {
          const baseX = c * gridStep;
          const baseY = r * gridStep;

          // Subtle organic ambient wave
          const ambientWave = prefersReducedMotion
            ? 0
            : Math.sin(baseX * 0.01 + time * 0.0007) *
              Math.cos(baseY * 0.01 + time * 0.0005) *
              2.2;

          const dx = pX - baseX;
          const dy = pY - baseY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (!prefersReducedMotion && dist < influenceRadius) {
            // Smooth bell falloff: cos^2( (dist / R) * (PI / 2) )
            const s = dist / influenceRadius;
            const factor = Math.pow(Math.cos(s * (Math.PI / 2)), 2);
            // Controlled displacement: deflects toward weight without collapsing into a hole
            const pull = factor * maxDisplacement;
            const angle = Math.atan2(dy, dx);

            grid[r][c] = {
              x: baseX + Math.cos(angle) * pull,
              y: baseY + Math.sin(angle) * pull + ambientWave,
              tension: factor,
            };
          } else {
            grid[r][c] = {
              x: baseX,
              y: baseY + ambientWave,
              tension: 0,
            };
          }
        }
      }

      // 1. Draw horizontal mesh lines
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const pt1 = grid[r][c];
          const pt2 = grid[r][c + 1];
          const avgTension = (pt1.tension + pt2.tension) * 0.5;

          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);

          if (avgTension > 0.06) {
            // Subtle cyan/blue tension highlight
            ctx.strokeStyle = `rgba(${30 + Math.round(avgTension * 26)}, ${
              41 + Math.round(avgTension * 148)
            }, ${59 + Math.round(avgTension * 189)}, ${0.45 + avgTension * 0.4})`;
            ctx.lineWidth = 0.95 + avgTension * 0.6;
          } else {
            ctx.strokeStyle = "rgba(30, 41, 59, 0.42)";
            ctx.lineWidth = 0.85;
          }
          ctx.stroke();
        }
      }

      // 2. Draw vertical mesh lines
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows - 1; r++) {
          const pt1 = grid[r][c];
          const pt2 = grid[r + 1][c];
          const avgTension = (pt1.tension + pt2.tension) * 0.5;

          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);

          if (avgTension > 0.06) {
            ctx.strokeStyle = `rgba(${30 + Math.round(avgTension * 26)}, ${
              41 + Math.round(avgTension * 148)
            }, ${59 + Math.round(avgTension * 189)}, ${0.45 + avgTension * 0.4})`;
            ctx.lineWidth = 0.95 + avgTension * 0.6;
          } else {
            ctx.strokeStyle = "rgba(30, 41, 59, 0.42)";
            ctx.lineWidth = 0.85;
          }
          ctx.stroke();
        }
      }

      // 3. Draw diagonal intersecting cross-ties (alternating cells for geodesic structure)
      for (let r = 0; r < rows - 1; r += 2) {
        for (let c = 0; c < cols - 1; c += 2) {
          const pt1 = grid[r][c];
          const pt2 = grid[r + 1][c + 1];
          const avgTension = (pt1.tension + pt2.tension) * 0.5;

          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.strokeStyle =
            avgTension > 0.1
              ? `rgba(56, 189, 248, ${0.12 + avgTension * 0.22})`
              : "rgba(30, 41, 59, 0.18)";
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }

      // 4. Subtle gravitational weight illumination & intersecting vertex points
      if (!prefersReducedMotion && (pointerRef.current.active || pX > 0)) {
        // Very soft restrained radial glow
        const glowGrad = ctx.createRadialGradient(pX, pY, 0, pX, pY, influenceRadius);
        glowGrad.addColorStop(0, "rgba(56, 189, 248, 0.09)");
        glowGrad.addColorStop(0.5, "rgba(37, 99, 235, 0.03)");
        glowGrad.addColorStop(1, "rgba(8, 10, 15, 0)");
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(pX, pY, influenceRadius, 0, Math.PI * 2);
        ctx.fill();

        // Delicate vertex intersection dots in active bending zone
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const pt = grid[r][c];
            if (pt.tension > 0.2) {
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 1.3, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(56, 189, 248, ${0.35 + pt.tension * 0.45})`;
              ctx.fill();
            }
          }
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
  }, [gridStep, influenceRadius, maxDisplacement]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none select-none z-0 ${className}`}
    />
  );
}
